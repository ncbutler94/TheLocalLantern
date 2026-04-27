import React, {useCallback, useEffect, useMemo, useRef, useState, useReducer} from 'react';
import { secureFetch } from '../../../utils/secureFetch';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Box,
    Button,
    Chip,
    Stack,
    Tooltip,
    Typography,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SuccessSnackbar from '../../../components/SuccessSnackbar';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LockIcon from '@mui/icons-material/Lock';
import ForumIcon from '@mui/icons-material/Forum';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import PushPinIcon from '@mui/icons-material/PushPin';
import GroupsIcon from '@mui/icons-material/Groups';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import GroupPostCard from '../groups/GroupPostCard';
import PostDetailModal from '../PostDetailModal';
import CommunityMap from '../CommunityMap';
import UserCardPopover from '../../../components/UserCardPopover';
import PulsingDots from '../../../components/PulsingDots';
import { useAuth } from '../../../components/AuthModalContext';

import TrendingSummaryPanel from './TrendingSummaryPanel';
import CommunityDiscoverTab from './CommunityDiscoverTab';
import CommunityNewsTab from '../CommunityNewsTab';

import GroupHeaderCard from '../groups/GroupHeaderCard';
import ShareDialog from '../../../components/ShareDialog';
import { ReportDialog } from '../../../components/ActionBar';
import defaultGroupImg from '../../../assets/default_groups.png';
import { useActiveAccount } from '../../../components/AccountContext';

// Keep these constants local to avoid prop/undef issues during refactors.
const DEFAULT_GROUP_AVATAR_SCALE = 1.18;

// Helper to optionally hide pinned styling without removing posts from the list.
// Kept outside the component so it can never become undefined due to refactors.
const sanitizePinnedForDisplay = (post, showPinnedPosts) => {
    if (!post || typeof post !== 'object') return post;
    if (showPinnedPosts) return post;
    // Keep the post visible in results, but remove pinned UI styling/badges.
    return { ...post, is_pinned: 0, isPinned: 0 };
};

// Safely render unknown values in JSX (prevents rendering refs/functions/objects).
const safeRenderText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value instanceof Error) return value.message || 'Error';
    // Common accidental render: ref objects like { current: ... }
    if (typeof value === 'object' && value && 'current' in value) return '';
    try {
        return String(value);
    } catch (e) {
        return '';
    }
};


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


/**
 * CommunityRightPanel
 * -------------------
 * JSX-only extraction of the right rail from CommunityPage.jsx.
 *
 * IMPORTANT: keep state/logic in CommunityPage — this component receives
 * everything it needs via props so behavior stays identical.
 *
 * FIX (2026-01-20):
 * - Category icons in the group header card were mismatching vs GroupsList/Filter.
 * - Root cause: this file contained a duplicated header card implementation with
 *   its own category->icon resolution logic (and it could prefer legacy main_category values).
 * - Solution: use the shared GroupHeaderCard component for the header in BOTH:
 *      a) Groups Overview tab
 *      b) Group Posts tab (pinned header)
 *   so the exact same icon logic is used everywhere.
 */
export default function CommunityRightPanel(props) {
    const {
        rightWidth,
        isGroupsView,
        activeTab,
        rightTabs,
        HEADER_H,
        navigate,
        onTabChange,
        handleViewGroupPage,
        handleViewGroupPostPage,
        handleOpenCreateGroupPost,

        // map tab
        pointsSource,
        mapRef,
        center,
        zoomLevel,
        onMarkerClick,
        hoveredId,
        openedPopupId,
        popupContentById,
        postsById,
        onPopupClose,
        isLoading,

        selectedPost,
        selectedGroup,
        groupPosts,
        groupPostsLoading,
        groupPostsError,
        selectedGroupPostDetail,
        setSelectedGroupPostId,
        setOpenedPopupId,
        setShowFullGroupDescription,
        showFullGroupDescription,
        defaultGroups,
        defaultGroupsSrc,
        groupIcon,
        groupIconSrc,
        user,
        handleGroupPostUserClick,

        // injected defaults for extracted right panel
        handleJoinSelectedGroup = () => {},
        trendingLantern = null,
        TRENDING_WINDOW = '48h',
        trendSummary = [],
        locationLabel = '',
        trendingLoading = false,
        // peopleYouMayKnow - no longer used in discover tab (now uses CommunityDiscoverTab)
        CATEGORY_META = {},
        handleTrendingSelect = () => {},
        activeTabRef = { current: '' },
        detailScrollRef = null,

        // hide pinned styling when filters are not default (but still allow pinned posts to appear)
        showPinnedPosts = true,
        // mobile: hide the tabs header when showing a dedicated view (e.g. Discover from its own drawer)
        hideTabs = false,

        // News tab — current filter selections from CommunityPage
        selectedCity = '',
        selectedCounty = '',
    } = props;

    const sanitizePinnedForDisplayLocal = (post) => sanitizePinnedForDisplay(post, showPinnedPosts);

    // Shared group header measurement — so panels know how much top offset to add
    const sharedGroupHeaderRef = useRef(null);
    const [sharedGroupHeaderH, setSharedGroupHeaderH] = useState(0);

    // Share group dialog state
    const [shareGroupOpen, setShareGroupOpen] = useState(false);

    // 3-dot menu state (matches PostList pattern)
    const [groupMenuEl, setGroupMenuEl] = useState(null);
    const groupMenuOpen = Boolean(groupMenuEl);
    const [groupCopyToast, setGroupCopyToast] = useState(false);
    const [groupReportOpen, setGroupReportOpen] = useState(false);

    const handleGroupMenuOpen = (e) => {
        e.stopPropagation();
        setGroupMenuEl(e.currentTarget);
    };
    const handleGroupMenuClose = (e) => {
        if (e) e.stopPropagation();
        setGroupMenuEl(null);
    };
    const handleGroupCopyLink = (e) => {
        if (e) e.stopPropagation();
        handleGroupMenuClose(e);
        const sg = selectedGroup || {};
        const slug = sg?.group_username || sg?.groupUsername || sg?.handle || sg?.username || sg?.slug || sg?.id || '';
        const groupUrl = `${window.location.origin}/groups/${slug}`;
        navigator.clipboard.writeText(groupUrl).then(() => {
            setGroupCopyToast(true);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = groupUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setGroupCopyToast(true);
        });
    };
    const handleGroupReportClick = (e) => {
        if (e) e.stopPropagation();
        handleGroupMenuClose(e);
        setGroupReportOpen(true);
    };
    const submitGroupReport = useCallback(async ({ reason, details }) => {
        const gid = selectedGroup?.id || selectedGroup?.group_id;
        if (!gid) return;
        const urls = [
            `/api/groups/${encodeURIComponent(gid)}/flag`,
            `/api/community/groups/${encodeURIComponent(gid)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) return;
            } catch {
                // try next
            }
        }
    }, [selectedGroup?.id, selectedGroup?.group_id]);

    // ── Moderation: filter hidden/blocked users from group posts (mirrors PostList) ──
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [hiddenUserIds, setHiddenUserIds] = useState(() => new Set());
    const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());

    useEffect(() => {
        const onHiddenUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            setHiddenUserIds((prev) => {
                const next = new Set(prev);
                if (e?.detail?.hidden) next.add(uid); else next.delete(uid);
                return next;
            });
        };
        const onBlockedUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                if (e?.detail?.blocked) next.add(uid); else next.delete(uid);
                return next;
            });
        };
        const onHiddenPost = (e) => {
            const pid = Number(e?.detail?.postId || 0);
            if (!pid) return;
            setHiddenPostIds((prev) => {
                const next = new Set(prev);
                if (e?.detail?.hidden) next.add(pid); else next.delete(pid);
                return next;
            });
        };
        window.addEventListener('ll:user:hidden-changed', onHiddenUser);
        window.addEventListener('ll:user:blocked-changed', onBlockedUser);
        window.addEventListener('ll:post:hidden-changed', onHiddenPost);
        return () => {
            window.removeEventListener('ll:user:hidden-changed', onHiddenUser);
            window.removeEventListener('ll:user:blocked-changed', onBlockedUser);
            window.removeEventListener('ll:post:hidden-changed', onHiddenPost);
        };
    }, []);

    const theme = useTheme();
    const cfVariants = theme.custom?.motion?.contentFade?.variants ?? {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
    };
    const cfFramer = theme.custom?.motion?.contentFade?.framer ?? { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] };
    const cfFramerExit = theme.custom?.motion?.contentFade?.framerExit ?? { duration: 0.14, ease: [0.4, 0.0, 1, 1] };

    const isNonPersonalAccount = useIsNonPersonalAccount();

    // Measure shared group header height so panels can offset their content.
    //
    // Hardened against rapid viewport-resize storms:
    //   1. The setter uses a functional no-op guard so equal heights don't
    //      trigger a re-render.
    //   2. The ResizeObserver callback is rAF-throttled so a burst of size
    //      changes coalesces to one measurement per frame.
    // Without these guards, rapid dev-tools resizing across breakpoints could
    // flood React's update queue (ResizeObserver fires many times per frame
    // while the observed element reflows) and trip "Maximum update depth
    // exceeded" alongside the matchMedia listeners firing from useMediaQuery.
    const showSharedGroupHeader = isGroupsView && activeTab === 'overview' && Boolean(selectedGroup?.id || selectedGroup?.group_id);
    useEffect(() => {
        const el = sharedGroupHeaderRef.current;
        if (!el) {
            setSharedGroupHeaderH((prev) => (prev === 0 ? prev : 0));
            return;
        }
        const applyHeight = () => {
            const h = el.offsetHeight || 0;
            setSharedGroupHeaderH((prev) => (prev === h ? prev : h));
        };
        let raf = null;
        const measure = () => {
            if (raf != null) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                applyHeight();
            });
        };
        applyHeight();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => {
            if (raf != null) cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [showSharedGroupHeader]);
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const { user: authUser } = useAuth();
    const viewerUser = authUser || user || null;

    // ── Moderation: fetch blocked/hidden state (account-aware) ──
    useEffect(() => {
        const viewerId = Number(user?.id || 0);
        if (!viewerId) return;
        let active = true;
        (async () => {
            try {
                const params = new URLSearchParams();
                const hdrs = { Accept: 'application/json' };
                if (isBusinessAccount && activeBusinessId) {
                    params.set('account_id', String(activeBusinessId));
                    params.set('account_type', 'business');
                    hdrs['x-account-type'] = 'business';
                    hdrs['x-business-id'] = String(activeBusinessId);
                } else if (isArtistAccount && activeArtistId) {
                    params.set('account_id', String(activeArtistId));
                    params.set('account_type', 'artist');
                    hdrs['x-account-type'] = 'artist';
                    hdrs['x-artist-id'] = String(activeArtistId);
                }
                const qs = params.toString();
                const res = await secureFetch(`/api/users/moderation-state${qs ? `?${qs}` : ''}`, {
                    credentials: 'include',
                    headers: hdrs,
                });
                if (!res.ok || !active) return;
                const data = await res.json();
                const toSet = (arr) => new Set(
                    (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
                );
                if (active) {
                    setBlockedUserIds(toSet(data?.blocked_user_ids));
                    setHiddenUserIds(toSet([
                        ...(Array.isArray(data?.hidden_user_ids) ? data.hidden_user_ids : []),
                        ...(Array.isArray(data?.hidden_post_user_ids) ? data.hidden_post_user_ids : []),
                    ]));
                    setHiddenPostIds(toSet(data?.hidden_post_ids));
                }
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
    }, [user?.id, isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId]);

    // Local UserCardPopover state for group post card clicks
    const [ucpAnchor, setUcpAnchor] = useState(null);
    const [ucpUser, setUcpUser] = useState(null);

    const handleLocalUserCardOpen = (e, author) => {
        setUcpAnchor(e.currentTarget || e);
        setUcpUser({
            id: author?.id ?? author?.user_id,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url || author?.profile_picture,
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
    };

    const ucpIsSelf = (() => {
        if (!viewerUser || !ucpUser) return false;
        const isAccountCard = Boolean(
            ucpUser.account_type === 'business' ||
            ucpUser.account_type === 'artist' ||
            ucpUser.business_id ||
            ucpUser.artist_id
        );
        if (isBusinessAccount && activeBusinessId) {
            if (!isAccountCard) return false;
            return (ucpUser.account_type === 'business' || Boolean(ucpUser.business_id)) &&
                Number(ucpUser.business_id) === Number(activeBusinessId);
        }
        if (isArtistAccount && activeArtistId) {
            if (!isAccountCard) return false;
            return (ucpUser.account_type === 'artist' || Boolean(ucpUser.artist_id)) &&
                Number(ucpUser.artist_id) === Number(activeArtistId);
        }
        if (isAccountCard) return false;
        return viewerUser.id != null && ucpUser.id != null && Number(viewerUser.id) === Number(ucpUser.id);
    })();

    const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
    const groupDetailAbortRef = useRef(null);

    // Group posts: keep edits in sync for preview + detail without refetch.
    const [postOverrides, setPostOverrides] = useState({});

    // On hard refresh, default the right panel to Discover (not Trending).
    // We only do this once on mount so users can still click back to Trending manually.
    const didInitDefaultTabRef = useRef(false);

    useEffect(() => {
        if (didInitDefaultTabRef.current) return;
        didInitDefaultTabRef.current = true;

        if (isGroupsView) return;
        if (typeof onTabChange !== 'function') return;

        if (String(activeTab) === 'trending') {
            onTabChange('discover');
        }
    }, [activeTab, isGroupsView, onTabChange]);
    const selectedGroupId = selectedGroup?.id ?? selectedGroup?.group_id ?? selectedGroup?.groupId ?? null;

    // Group Posts tab (in the Community right panel): fetch via the same endpoint as GroupPage
    // so pinned posts appear at the top (backend enforces pinned ordering).
    const [railGroupPostsRefreshSeq, bumpRailGroupPostsRefreshSeq] = useReducer((n) => n + 1, 0);

    const [railGroupPosts, setRailGroupPosts] = useState([]);
    const [railGroupPostsLoading, setRailGroupPostsLoading] = useState(false);
    const [railGroupPostsError, setRailGroupPostsError] = useState('');
    const railGroupPostsAbortRef = useRef(null);
    const railGroupPostsGroupRef = useRef(null);

    useEffect(() => {
        const handleGroupPostsChanged = (event) => {
            const changedGroupId = event?.detail?.groupId ?? null;
            if (changedGroupId == null || selectedGroupId == null) return;
            if (String(changedGroupId) !== String(selectedGroupId)) return;
            bumpRailGroupPostsRefreshSeq();
        };

        window.addEventListener('ll:group:postsChanged', handleGroupPostsChanged);
        return () => {
            window.removeEventListener('ll:group:postsChanged', handleGroupPostsChanged);
        };
    }, [selectedGroupId]);

    useEffect(() => {
        // Only take over fetching when we're in the Groups view AND on the Group Posts tab.
        if (!isGroupsView) return () => {};
        if (String(activeTab) !== 'posts') return () => {};

        const gid = Number(selectedGroupId);
        if (!Number.isFinite(gid) || gid <= 0) {
            setRailGroupPosts([]);
            setRailGroupPostsError('');
            setRailGroupPostsLoading(false);
            return () => {};
        }

        // Preserve the existing list during same-group refreshes so the rail does not flash.
        const prevGroupId = railGroupPostsGroupRef.current;
        const isGroupSwitch = String(prevGroupId ?? '') !== String(gid);
        railGroupPostsGroupRef.current = gid;

        if (isGroupSwitch) {
            setRailGroupPosts([]);
        }
        setRailGroupPostsError('');
        setRailGroupPostsLoading(true);

        if (railGroupPostsAbortRef.current) railGroupPostsAbortRef.current.abort();
        const controller = new AbortController();
        railGroupPostsAbortRef.current = controller;

        (async () => {
            try {
                const params = new URLSearchParams();
                params.set('limit', '50');
                params.set('offset', '0');
                params.set('sort', 'newest');

                // Pass active account IDs so the backend returns correct viewerLiked/viewerReposted
                if (isBusinessAccount && activeBusinessId) {
                    params.set('activeBusinessId', String(activeBusinessId));
                } else if (isArtistAccount && activeArtistId) {
                    params.set('activeArtistId', String(activeArtistId));
                }

                const res = await secureFetch(`/api/groups/${encodeURIComponent(String(gid))}/posts?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const msg = await res.text().catch(() => '');
                    setRailGroupPostsError(msg || 'Failed to load posts.');
                    setRailGroupPostsLoading(false);
                    return;
                }

                const data = await res.json().catch(() => null);
                const arr = Array.isArray(data) ? data : [];
                setRailGroupPosts(arr);
                setRailGroupPostsLoading(false);
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setRailGroupPostsError('Failed to load posts.');
                setRailGroupPostsLoading(false);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [activeTab, isGroupsView, selectedGroupId, railGroupPostsRefreshSeq, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const groupPostsForRender = (isGroupsView && String(activeTab) === 'posts') ? railGroupPosts : groupPosts;
    const groupPostsLoadingForRender = (isGroupsView && String(activeTab) === 'posts') ? railGroupPostsLoading : groupPostsLoading;
    const groupPostsErrorForRender = (isGroupsView && String(activeTab) === 'posts') ? railGroupPostsError : groupPostsError;

    // Clear stale post overrides whenever fresh group posts arrive from the server.
    // Without this, ActionBar like/repost broadcasts from previous posts persist
    // in postOverrides and overwrite correct counts on newly created or refetched posts.
    useEffect(() => {
        setPostOverrides({});
    }, [groupPostsForRender]);

    useEffect(() => {
        setSelectedGroupDetail(null);

        const gid = Number(selectedGroupId);
        if (!Number.isFinite(gid) || gid <= 0) return () => {};

        const currentPhotos =
            selectedGroup?.photos ??
            selectedGroup?.group_photos ??
            selectedGroup?.groupPhotos ??
            selectedGroup?.galleryPhotos ??
            selectedGroup?.gallery_photos ??
            null;

        // If photos already exist on the selectedGroup object, no need to fetch.
        if (Array.isArray(currentPhotos) && currentPhotos.length > 0) return () => {};

        if (groupDetailAbortRef.current) groupDetailAbortRef.current.abort();
        const controller = new AbortController();
        groupDetailAbortRef.current = controller;

        (async () => {
            try {
                const res = await secureFetch(`/api/groups/${gid}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                const group = data?.group && typeof data.group === 'object' ? data.group : null;
                const membership = data?.viewerMembership && typeof data.viewerMembership === 'object' ? data.viewerMembership : null;
                if (!group) return;

                const merged = {
                    ...(selectedGroup && typeof selectedGroup === 'object' ? selectedGroup : {}),
                    ...group,
                };

                if (membership) {
                    const role = String(membership.role || '').trim();
                    const status = String(membership.status || '').trim();
                    if (role) merged.viewer_role = merged.viewer_role ?? role;
                    if (status) merged.viewer_status = merged.viewer_status ?? status;
                    if (status) merged.is_member = merged.is_member ?? String(status).toLowerCase() === 'joined';
                }

                setSelectedGroupDetail(merged);
            } catch {
                // ignore
            }
        })();
        return () => {
            controller.abort();
        };
    }, [selectedGroupId, selectedGroup]);

    const selectedGroupResolved = selectedGroupDetail || selectedGroup;

    useEffect(() => {
        const unwrapUpdatedPostPayload = (detail) => {
            if (!detail || typeof detail !== 'object') return { post: null, patch: null, postId: null };

            // Common shapes across the app as it evolved.
            const candidates = [
                detail.updatedPost,
                detail.post,
                detail.post?.post,
                detail.post?.data,
                detail.data,
                detail.result,
                detail.payload,
            ].filter(Boolean);

            let postObj = null;
            for (let i = 0; i < candidates.length; i += 1) {
                const c = candidates[i];
                if (c && typeof c === 'object') {
                    // Some code paths wrap again as { post: {...} }
                    if (c.post && typeof c.post === 'object') {
                        postObj = c.post;
                        break;
                    }
                    postObj = c;
                    break;
                }
            }

            const postId =
                postObj?.id ??
                postObj?.post_id ??
                postObj?.postId ??
                detail.postId ??
                detail.id ??
                detail?.post?.id ??
                detail?.post_id ??
                null;

            // If the "post" object is missing but the event carries edited fields directly on detail,
            // treat detail itself as a patch.
            const patch = postObj && typeof postObj === 'object' ? postObj : detail;

            return { post: postObj, patch, postId };
        };

        const onUpdated = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const { patch, postId: pid } = unwrapUpdatedPostPayload(detail);
            if (pid == null) return;
            const idStr = String(pid);
            if (!idStr) return;

            // Persist edited badge helper (mirrors PostList behavior)
            try {
                window.localStorage.setItem(`ll.communityPost.edited.${Number(pid)}`, '1');
            } catch {
                // ignore
            }

            setPostOverrides((prev) => ({
                ...(prev || {}),
                [idStr]: {
                    ...(prev?.[idStr] || {}),
                    ...(patch && typeof patch === 'object' ? patch : {}),
                    // Force React keys to change even if updated_at isn't returned by the API.
                    __llv: Date.now(),
                    // Ensure id is present for downstream components.
                    id: Number.isFinite(Number(pid)) ? Number(pid) : pid,
                },
            }));
        };

        const onDeleted = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const pid = detail.postId ?? detail.id ?? null;
            if (pid == null) return;
            const idStr = String(pid);
            if (!idStr) return;
            setPostOverrides((prev) => {
                const next = { ...(prev || {}) };
                delete next[idStr];
                return next;
            });

            // Remove deleted post from the Groups -> Posts rail immediately
            setRailGroupPosts((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (!arr.length) return prev;
                return arr.filter((p) => String(p?.id ?? p?.post_id ?? '') !== idStr);
            });

            // If the deleted post is currently selected in the right rail, return to the list.
            if (typeof setSelectedGroupPostId === 'function') {
                setSelectedGroupPostId((prev) => {
                    if (prev == null) return prev;
                    return String(prev) === idStr ? null : prev;
                });
            }

            // Refetch to keep ordering/counts correct (ex: pinned moved, totals).
            bumpRailGroupPostsRefreshSeq();
        };

        const onCreated = () => {
            bumpRailGroupPostsRefreshSeq();
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:deleted', onDeleted);
        window.addEventListener('ll:communityPost:created', onCreated);

        // Listen for ActionBar like/repost broadcasts so group post cards
        // reflect updated counts without a full refetch.
        const onLike = (e) => {
            const d = e?.detail;
            if (!d || d.postId == null) return;
            const idStr = String(d.postId);
            setPostOverrides((prev) => ({
                ...(prev || {}),
                [idStr]: {
                    ...(prev?.[idStr] || {}),
                    likesCount: d.likes,
                    likes_count: d.likes,
                    like_count: d.likes,
                    likes: d.likes,
                    ...(d.liked != null ? {
                        viewerLiked: Boolean(d.liked),
                        viewer_liked: Boolean(d.liked),
                        is_liked: Boolean(d.liked),
                        liked: Boolean(d.liked),
                    } : {}),
                },
            }));
        };
        const onRepost = (e) => {
            const d = e?.detail;
            if (!d || d.postId == null) return;
            const idStr = String(d.postId);
            setPostOverrides((prev) => ({
                ...(prev || {}),
                [idStr]: {
                    ...(prev?.[idStr] || {}),
                    repostsCount: d.reposts,
                    reposts_count: d.reposts,
                    repost_count: d.reposts,
                    reposts: d.reposts,
                    ...(d.reposted != null ? {
                        viewerReposted: Boolean(d.reposted),
                        viewer_reposted: Boolean(d.reposted),
                        is_reposted: Boolean(d.reposted),
                        reposted: Boolean(d.reposted),
                    } : {}),
                },
            }));
        };

        window.addEventListener('ll:post:like-changed', onLike);
        window.addEventListener('ll:post:repost-changed', onRepost);
        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
            window.removeEventListener('ll:communityPost:created', onCreated);
            window.removeEventListener('ll:post:like-changed', onLike);
            window.removeEventListener('ll:post:repost-changed', onRepost);
        };
    }, [setSelectedGroupPostId]);

    const groupsPlaceholderImg = defaultGroupsSrc || defaultGroups || groupIconSrc || groupIcon || defaultGroupImg;

    // When tabs are hidden (mobile dedicated views), content starts at top=0
    const contentTop = hideTabs ? { xs: 0, md: HEADER_H.md } : { xs: HEADER_H.xs, md: HEADER_H.md };

    const mergedGroupPosts = useMemo(() => {
        const arr = Array.isArray(groupPostsForRender) ? groupPostsForRender : [];
        const ov = postOverrides && typeof postOverrides === 'object' ? postOverrides : {};
        if (!arr.length || !Object.keys(ov).length) return arr;

        return arr.map((p) => {
            const pid = p?.id ?? p?.post_id ?? null;
            const idStr = pid != null ? String(pid) : '';
            if (!idStr) return p;
            const patch = ov[idStr];
            return patch ? { ...p, ...patch } : p;
        });
    }, [groupPostsForRender, postOverrides]);

    // Apply moderation filtering — remove posts from blocked/hidden users
    const filteredGroupPosts = useMemo(() => {
        const hasHidden = hiddenPostIds.size > 0;
        const hasHiddenUsers = hiddenUserIds.size > 0;
        const hasBlocked = blockedUserIds.size > 0;
        if (!hasHidden && !hasHiddenUsers && !hasBlocked) return mergedGroupPosts;
        return mergedGroupPosts.filter((p) => {
            const pid = Number(p?.id ?? p?.post_id ?? 0);
            if (pid && hasHidden && hiddenPostIds.has(pid)) return false;
            const uid = Number(p?.user_id ?? p?.userId ?? p?.author_id ?? p?.owner_id ?? 0);
            if (uid && hasBlocked && blockedUserIds.has(uid)) return false;
            if (uid && hasHiddenUsers && hiddenUserIds.has(uid)) return false;
            return true;
        });
    }, [mergedGroupPosts, hiddenPostIds, hiddenUserIds, blockedUserIds]);

    const mergedSelectedGroupPostDetail = useMemo(() => {
        if (!selectedGroupPostDetail) return null;
        const pid = selectedGroupPostDetail?.id ?? selectedGroupPostDetail?.post_id ?? null;
        const idStr = pid != null ? String(pid) : '';
        if (!idStr) return selectedGroupPostDetail;
        const patch = postOverrides?.[idStr];
        return patch ? { ...selectedGroupPostDetail, ...patch } : selectedGroupPostDetail;
    }, [selectedGroupPostDetail, postOverrides]);

    return (
        <Box
            sx={{
                position: 'relative',
                height: '100%',
                p: 0,
                overflow: 'hidden',
                border: { xs: 'none', md: '1px solid' },
                borderColor: (t) => ({ xs: 'transparent', md: alpha(t.palette.primary.main, 0.12) }),
                borderRadius: { xs: 0, md: 3 },
                bgcolor: (t) => ({ xs: 'transparent', md: alpha(t.palette.background.paper, 0.92) }),
                backdropFilter: { xs: 'none', md: 'saturate(140%) blur(10px)' },
                backgroundImage: 'none',
                boxShadow: (t) => ({ xs: 'none', md: `0 14px 44px ${alpha(t.palette.text.primary, 0.08)}` }),
                transition: (theme) =>
                    theme.transitions.create(['width', 'flex-basis', 'margin', 'transform'], {
                        duration: 300,
                        easing: theme.transitions.easing.easeInOut,
                    }),
                width: rightWidth,
                flex: '0 0 auto',
            }}
        >
            {/* TABS header */}
            {!hideTabs && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: { xs: HEADER_H.xs, md: HEADER_H.md },
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        bgcolor: (t) => alpha(t.palette.background.paper, 0.96),
                        backgroundImage: 'none',
                        backdropFilter: 'saturate(140%) blur(8px)',
                        borderBottom: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                        zIndex: 10,
                        pointerEvents: 'auto',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'nowrap', width: '100%' }}>
                        {rightTabs.map((t) => {
                            const isActive = String(activeTab) === String(t.value);
                            const iconMap = {
                                discover: ExploreRoundedIcon,
                                trending: TrendingUpRoundedIcon,
                                posts: ArticleRoundedIcon,
                                map: MapRoundedIcon,
                                overview: GroupsIcon,
                            };
                            const IconComp = iconMap[t.value] || null;
                            return (
                                <Button
                                    key={t.value}
                                    type="button"
                                    disableElevation
                                    disableRipple
                                    variant="text"
                                    onClick={() => (typeof onTabChange === 'function' ? onTabChange(t.value) : undefined)}
                                    startIcon={IconComp ? <IconComp sx={{ fontSize: 17 }} /> : undefined}
                                    sx={(theme) => ({
                                        flex: 1,
                                        minHeight: 'unset',
                                        px: { xs: 0.75, md: 1.25 },
                                        py: { xs: 0.85, md: 1.1 },
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        fontWeight: isActive ? 950 : 700,
                                        fontSize: 13.5,
                                        letterSpacing: '-0.01em',
                                        justifyContent: 'center',
                                        '& .MuiButton-startIcon': { mr: 0.5 },
                                        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                                        backgroundColor: 'transparent',
                                        borderBottom: '2px solid',
                                        borderColor: isActive ? theme.palette.primary.main : 'transparent',
                                        transition: `color ${theme.custom.motion.base}ms ${theme.custom.motion.ease}, border-color ${theme.custom.motion.base}ms ${theme.custom.motion.ease}`,
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                                            borderColor: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2),
                                        },
                                    })}
                                >
                                    {t.label}
                                </Button>
                            );
                        })}
                    </Box>


                </Box>
            )}

            {/* ── Shared group header — sits above animated panels, never fades on tab switch ── */}
            {isGroupsView && activeTab === 'overview' && selectedGroupResolved && (
                <Box
                    ref={sharedGroupHeaderRef}
                    sx={{
                        position: 'absolute',
                        top: contentTop,
                        left: 0,
                        right: 0,
                        zIndex: 6,
                        px: { xs: 1, md: 1.5 },
                        pt: { xs: 1, md: 1.5 },
                        pb: { xs: 0.75, md: 1 },
                        bgcolor: (t) => alpha(t.palette.background.paper, 0.97),
                        backdropFilter: 'saturate(140%) blur(8px)',
                        borderBottom: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.08),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.25,
                    }}
                >
                    <GroupHeaderCard
                        group={selectedGroupResolved}
                        groupPosts={filteredGroupPosts}
                        defaultGroupsSrc={groupsPlaceholderImg}
                        avatarSize={76}
                        defaultAvatarScale={DEFAULT_GROUP_AVATAR_SCALE}
                        onJoin={handleJoinSelectedGroup}
                        isSticky
                        showJoinCta
                        isOnPersonalAccount={!isNonPersonalAccount}
                    />

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            endIcon={<OpenInNewIcon sx={{ fontSize: '18px !important' }} />}
                            onClick={() => {
                                const gid = selectedGroupResolved?.id ?? selectedGroupResolved?.group_id ?? selectedGroupResolved?.groupId;
                                if (!gid) return;
                                try {
                                    sessionStorage.setItem('ll:community:url', window.location.pathname + window.location.search);
                                } catch {}
                                navigate(`/groups/${gid}`);
                            }}
                            disableElevation
                            sx={(t) => ({
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                py: 1,
                                bgcolor: 'primary.dark',
                                color: '#fff',
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.dark, 0.88),
                                },
                            })}
                            aria-label="View Group Page"
                        >
                            View Group
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<ShareOutlinedIcon sx={{ fontSize: '18px !important' }} />}
                            onClick={() => setShareGroupOpen(true)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                py: 1,
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                },
                            }}
                            aria-label="Share Group"
                        >
                            Share
                        </Button>
                    </Stack>
                </Box>
            )}

            <AnimatePresence mode="wait" initial={false}>
                {/* Groups Overview */}
                {isGroupsView && activeTab === 'overview' && (
                    <Box
                        component={motion.div}
                        key="rp-overview"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: contentTop,
                            overflowY: 'auto',
                            px: { xs: 1, md: 1.5 },
                            pb: { xs: 1, md: 1.5 },
                            pt: selectedGroupResolved
                                ? `${sharedGroupHeaderH + 8}px`
                                : { xs: 1, md: 1.5 },
                        }}
                    >
                        {selectedGroupResolved ? (
                            (() => {
                                const visRaw = String(selectedGroupResolved?.visibility || '').toLowerCase();
                                const privateFlag = Boolean(selectedGroupResolved?.is_private ?? selectedGroupResolved?.isPrivate);
                                const isPrivate = visRaw === 'private' || visRaw === 'hidden' || privateFlag;

                                const viewerRoleRaw = String(selectedGroupResolved?.viewer_role ?? selectedGroupResolved?.viewerRole ?? '').trim();
                                const viewerRole = viewerRoleRaw.toLowerCase();
                                const isOwner = !isNonPersonalAccount && viewerRole === 'owner';
                                const isAdmin = !isNonPersonalAccount && viewerRole === 'admin';
                                const isMember = !isNonPersonalAccount && (Boolean(selectedGroupResolved?.is_member ?? selectedGroupResolved?.isMember) || isOwner || isAdmin);

                                const descRaw = selectedGroupResolved?.description ? String(selectedGroupResolved.description) : '';
                                const descTrim = descRaw.trim();
                                const DESC_LIMIT = 520;
                                const descLong = descTrim.length > DESC_LIMIT;
                                const descShown = showFullGroupDescription || !descLong
                                    ? descRaw
                                    : `${descTrim.slice(0, DESC_LIMIT).trimEnd()}…`;

                                const photosRaw =
                                    selectedGroupResolved?.photos ??
                                    selectedGroupResolved?.group_photos ??
                                    selectedGroupResolved?.groupPhotos ??
                                    selectedGroupResolved?.galleryPhotos ??
                                    selectedGroupResolved?.gallery_photos ??
                                    [];
                                const photosArr = Array.isArray(photosRaw) ? photosRaw : [];
                                const photoUrls = photosArr
                                    .map((p) => (typeof p === 'string' ? p : p?.url))
                                    .filter((u) => typeof u === 'string' && u.trim())
                                    .slice(0, 4);

                                if (isPrivate && !isMember) {
                                    return null;
                                }

                                return (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {/* About */}
                                        <Box
                                            sx={(t) => ({
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.12),
                                                borderRadius: 3,
                                                p: { xs: 1.25, md: 1.5 },
                                                bgcolor: alpha(t.palette.background.paper, 0.66),
                                            })}
                                        >
                                            <Typography sx={{ fontWeight: 950, mb: 0.75 }}>About</Typography>

                                            {showFullGroupDescription ? (
                                                <Box
                                                    sx={{
                                                        maxHeight: { xs: 320, md: 380 },
                                                        overflowY: 'auto',
                                                        pr: { xs: 1.1, md: 1.25 },
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 750,
                                                            lineHeight: 1.5,
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'anywhere',
                                                            maxWidth: '100%',
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        {descShown || 'No description yet.'}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography
                                                    sx={{
                                                        fontWeight: 750,
                                                        lineHeight: 1.5,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'anywhere',
                                                        maxWidth: '100%',
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    {descShown || 'No description yet.'}
                                                </Typography>
                                            )}

                                            {descLong ? (
                                                <Button
                                                    type="button"
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => setShowFullGroupDescription((v) => !v)}
                                                    sx={{ mt: 0.5, borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 1 }}
                                                >
                                                    {showFullGroupDescription ? 'Show less' : 'Show more'}
                                                </Button>
                                            ) : null}

                                        </Box>

                                        {/* Photos (optional) */}
                                        {photoUrls.length ? (
                                            <Box
                                                sx={(t) => ({
                                                    border: '1px solid',
                                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                                    borderRadius: 3,
                                                    p: { xs: 1.25, md: 1.5 },
                                                    bgcolor: alpha(t.palette.background.paper, 0.66),
                                                })}
                                            >
                                                <Typography sx={{ fontWeight: 950, mb: 0.9 }}>Photos</Typography>

                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: {
                                                            xs: 'repeat(2, minmax(0, 1fr))',
                                                            sm: 'repeat(4, minmax(0, 1fr))',
                                                        },
                                                        gap: 1,
                                                    }}
                                                >
                                                    {photoUrls.map((src) => (
                                                        <Box
                                                            key={src}
                                                            sx={(t) => ({
                                                                width: '100%',
                                                                aspectRatio: '1 / 1',
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                                border: '1px solid',
                                                                borderColor: alpha(t.palette.primary.main, 0.14),
                                                                bgcolor: alpha(t.palette.primary.main, 0.03),
                                                            })}
                                                        >
                                                            <Box
                                                                component="img"
                                                                alt="Group photo"
                                                                src={src}
                                                                loading="lazy"
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    display: 'block',
                                                                }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        ) : null}

                                        {/* Private notice */}
                                        {isPrivate && !isMember ? (
                                            <Box
                                                sx={(t) => ({
                                                    border: '1px solid',
                                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                                    borderRadius: 3,
                                                    p: 1.25,
                                                    bgcolor: alpha(t.palette.background.paper, 0.56),
                                                    display: 'flex',
                                                    gap: 1.25,
                                                    alignItems: 'flex-start',
                                                })}
                                            >
                                                <Box
                                                    sx={(t) => ({
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.primary.main, 0.16),
                                                        bgcolor: alpha(t.palette.primary.main, 0.06),
                                                        flexShrink: 0,
                                                    })}
                                                >
                                                    <LockIcon sx={{ fontSize: 26, color: 'primary.main' }} />
                                                </Box>

                                                <Box sx={{ flex: 1, minWidth: 0, pr: 0.25 }}>
                                                    <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>Private group</Typography>
                                                    <Typography color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
                                                        Posts are only visible to members. Request to join to see the feed.
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : null}
                                    </Box>
                                );
                            })()
                        ) : (
                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={{ width: '100%', maxWidth: 460, textAlign: 'center', p: 2 }}>
                                    <Box
                                        sx={(t) => ({
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: t.palette.primary.light,
                                            border: '2px solid',
                                            borderColor: alpha(t.palette.primary.main, 0.22),
                                            mx: 'auto',
                                            mb: 2,
                                            boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.18)}`,
                                        })}
                                    >
                                        <GroupsIcon sx={{ fontSize: 50, color: '#fff' }} />
                                    </Box>

                                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75 }}>Select a group</Typography>
                                    <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        Choose a group from the list to see its overview and posts.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Trending SUMMARY */}
                {!isGroupsView && activeTab === 'trending' && (
                    <Box
                        component={motion.div}
                        key="rp-trending"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: contentTop,
                            overflow: 'hidden',
                            p: 0,
                        }}
                    >
                        <TrendingSummaryPanel
                            trendingLantern={trendingLantern}
                            trendingWindow={TRENDING_WINDOW}
                            trendSummary={trendSummary}
                            locationLabel={locationLabel}
                            trendingLoading={trendingLoading}
                            categoryMeta={CATEGORY_META}
                            onSelect={handleTrendingSelect}
                            showTrending
                            showPeople={false}
                        />
                    </Box>
                )}

                {/* Discover */}
                {!isGroupsView && activeTab === 'discover' && (
                    <Box
                        component={motion.div}
                        key="rp-discover"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: contentTop,
                            overflow: 'hidden',
                            p: 0,
                        }}
                    >
                        <CommunityDiscoverTab />
                    </Box>
                )}

                {/* Map */}
                {!isGroupsView && activeTab === 'map' && (
                    <Box
                        component={motion.div}
                        key="rp-map"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: contentTop,
                        }}
                    >
                        <CommunityMap
                            data={pointsSource}
                            mapRef={mapRef}
                            center={center}
                            zoomLevel={zoomLevel}
                            onMarkerClick={onMarkerClick}
                            hoveredId={hoveredId}
                            openedPopupId={openedPopupId}
                            popupContentById={popupContentById}
                            postsById={postsById}
                            user={user}
                            onPopupClose={(closingId) => {
                                setOpenedPopupId((current) => {
                                    if (!activeTabRef || !activeTabRef.current || activeTabRef.current !== 'map') return current;
                                    if (current == null) return null;
                                    if (closingId == null) return current;
                                    return String(current) === String(closingId) ? null : current;
                                });
                            }}
                        />
                        {isLoading && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 2,
                                }}
                            >
                                <PulsingDots sx={{ py: 0 }} />
                            </Box>
                        )}
                    </Box>
                )}

                {/* News */}
                {!isGroupsView && activeTab === 'news' && (
                    <Box
                        component={motion.div}
                        key="rp-news"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            top: contentTop,
                            overflow: 'hidden',
                        }}
                    >
                        <CommunityNewsTab
                            selectedCity={selectedCity}
                            selectedCounty={selectedCounty}
                        />
                    </Box>
                )}

                {/* Posts (detail) */}
                {activeTab === 'posts' && (
                    <Box
                        component={motion.div}
                        key="rp-posts"
                        initial={cfVariants.initial}
                        animate={cfVariants.animate}
                        exit={cfVariants.exit}
                        transition={{ ...cfFramer, exit: cfFramerExit }}
                        ref={detailScrollRef}
                        data-post-detail-scroll
                        sx={{
                            position: 'absolute',
                            top: contentTop,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            overflowY: 'auto',
                            bgcolor: 'transparent',
                            p: 0,
                        }}
                    >
                        {isGroupsView ? (
                            selectedGroupResolved ? (
                                <>
                                    {/* ─── Full-panel group post detail overlay ─── */}
                                    {/* Positioned against the scroll container (not the content wrapper) so it only fills the visible viewport */}
                                    {mergedSelectedGroupPostDetail && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                zIndex: 20,
                                                bgcolor: 'background.paper',
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                '@keyframes groupSlideUp': {
                                                    '0%': { opacity: 0, transform: 'translateY(24px)' },
                                                    '100%': { opacity: 1, transform: 'translateY(0)' },
                                                },
                                                animation: 'groupSlideUp 220ms ease-out both',
                                            }}
                                        >
                                            {/* Sticky header bar */}
                                            <Box
                                                sx={(t) => ({
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 5,
                                                    bgcolor: 'background.paper',
                                                    borderBottom: '1px solid',
                                                    borderColor: alpha(t.palette.divider, 0.6),
                                                    px: 1.5,
                                                    py: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 1,
                                                })}
                                            >
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '14px !important' }} />}
                                                    onClick={() => setSelectedGroupPostId(null)}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                                                >
                                                    Back to posts
                                                </Button>

                                                <Chip
                                                    clickable
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const gid = selectedGroupResolved?.id ?? selectedGroupResolved?.group_id ?? selectedGroupResolved?.groupId;
                                                        if (!gid) return;
                                                        navigate(`/groups/${gid}`);
                                                    }}
                                                    icon={(() => {
                                                        const grpSrc =
                                                            selectedGroupResolved?.image_url ||
                                                            selectedGroupResolved?.imageUrl ||
                                                            selectedGroupResolved?.image ||
                                                            selectedGroupResolved?.photo_url ||
                                                            '';
                                                        return grpSrc ? (
                                                            <Avatar
                                                                src={grpSrc}
                                                                alt=""
                                                                sx={{ width: 22, height: 22, ml: 0 }}
                                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                                            />
                                                        ) : (
                                                            <Avatar
                                                                sx={(t) => ({ width: 22, height: 22, ml: 0, bgcolor: t.palette.primary.light })}
                                                            >
                                                                <GroupsIcon sx={{ fontSize: 14, color: '#fff' }} />
                                                            </Avatar>
                                                        );
                                                    })()}
                                                    label={`Posted in ${selectedGroupResolved?.name || selectedGroupResolved?.group_name || 'this group'}`}
                                                    sx={(t) => ({
                                                        fontWeight: 900,
                                                        borderRadius: 999,
                                                        cursor: 'pointer',
                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.primary.main, 0.16),
                                                        '& .MuiChip-icon': { ml: 0.5, mr: 0.25 },
                                                        '& .MuiChip-label': { py: 0.2, pl: 0.75, pr: 1.25 },
                                                        '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.12) },
                                                    })}
                                                />
                                            </Box>

                                            {/* Post detail content */}
                                            <Box sx={{ px: { xs: 1, sm: 1.5 }, py: 1.5 }}>
                                                <PostDetailModal
                                                    key={`grp-post-detail-${String(
                                                        mergedSelectedGroupPostDetail?.id ?? mergedSelectedGroupPostDetail?.post_id ?? ''
                                                    )}-${String(
                                                        mergedSelectedGroupPostDetail?.__llv ??
                                                        mergedSelectedGroupPostDetail?.updated_at ??
                                                        mergedSelectedGroupPostDetail?.edited_at ??
                                                        mergedSelectedGroupPostDetail?.updatedAt ??
                                                        mergedSelectedGroupPostDetail?.editedAt ??
                                                        ''
                                                    )}`}
                                                    user={user}
                                                    embedded
                                                    hideCategoryChip
                                                    topRightSlot={
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            endIcon={<OpenInNewIcon />}
                                                            onClick={() =>
                                                                handleViewGroupPostPage(
                                                                    mergedSelectedGroupPostDetail?.id ?? mergedSelectedGroupPostDetail?.post_id
                                                                )
                                                            }
                                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, whiteSpace: 'nowrap' }}
                                                        >
                                                            View post page
                                                        </Button>
                                                    }
                                                    post={{
                                                        ...sanitizePinnedForDisplayLocal(mergedSelectedGroupPostDetail),
                                                        id: mergedSelectedGroupPostDetail?.id ?? mergedSelectedGroupPostDetail?.post_id,
                                                        description:
                                                            mergedSelectedGroupPostDetail?.description ??
                                                            mergedSelectedGroupPostDetail?.content ??
                                                            mergedSelectedGroupPostDetail?.body ??
                                                            mergedSelectedGroupPostDetail?.post_body ??
                                                            '',
                                                        category: null,
                                                        category_id: null,
                                                    }}
                                                    groupMembershipGated={(() => {
                                                        const vrRaw = String(selectedGroupResolved?.viewer_role ?? selectedGroupResolved?.viewerRole ?? '').toLowerCase();
                                                        const memberFlag = Boolean(selectedGroupResolved?.is_member ?? selectedGroupResolved?.isMember);
                                                        const isMem = !isNonPersonalAccount && (memberFlag || vrRaw === 'owner' || vrRaw === 'admin');
                                                        return !isMem;
                                                    })()}
                                                    onJoinGroup={() => handleJoinSelectedGroup(selectedGroupResolved)}
                                                />
                                            </Box>
                                        </Box>
                                    )}

                                    <Box
                                        sx={{
                                            px: { xs: 1, md: 1.5 },
                                            pt: { xs: 1.25, md: 1.75 },
                                            pb: { xs: 1, md: 1.5 },
                                            display: mergedSelectedGroupPostDetail ? 'none' : 'flex',
                                            flexDirection: 'column',
                                            gap: 1.25,
                                            minHeight: '100%',
                                        }}
                                    >
                                        {(() => {
                                            const viewerRoleRaw = String(selectedGroupResolved?.viewer_role ?? selectedGroupResolved?.viewerRole ?? '').trim();
                                            const viewerRole = viewerRoleRaw.toLowerCase();
                                            const isOwner = !isNonPersonalAccount && viewerRole === 'owner';
                                            const isAdmin = !isNonPersonalAccount && viewerRole === 'admin';
                                            const isMember = !isNonPersonalAccount && (Boolean(selectedGroupResolved?.is_member ?? selectedGroupResolved?.isMember) || isOwner || isAdmin);
                                            const isPrivate =
                                                ['private', 'hidden'].includes(String(selectedGroupResolved?.visibility || '').toLowerCase()) ||
                                                Boolean(selectedGroupResolved?.is_private);
                                            const canSeeFeed = isMember || !isPrivate;
                                            const showPrivatePostsGate = !canSeeFeed && !selectedGroupPostDetail;

                                            return (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 1,
                                                        minHeight: showPrivatePostsGate ? '100%' : 'auto',
                                                    }}
                                                >
                                                    {!selectedGroupPostDetail && !showPrivatePostsGate && (
                                                        <Box
                                                            sx={(t) => ({
                                                                display: 'flex',
                                                                alignItems: 'baseline',
                                                                justifyContent: 'space-between',
                                                                gap: 1,
                                                                position: 'sticky',
                                                                top: 0,
                                                                zIndex: 10,
                                                                bgcolor: 'background.paper',
                                                                py: 0.75,
                                                                mx: -1,
                                                                px: 1,
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(t.palette.divider, 0.5),
                                                            })}
                                                        >
                                                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Posts</Typography>

                                                            {isMember ? (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={handleOpenCreateGroupPost}
                                                                    startIcon={<ForumIcon />}
                                                                    sx={(t) => ({
                                                                        borderRadius: 999,
                                                                        textTransform: 'none',
                                                                        fontWeight: 800,
                                                                        height: 40,
                                                                        px: 2.25,
                                                                        whiteSpace: 'nowrap',
                                                                        borderColor: t.palette.primary.main,
                                                                        color: t.palette.primary.main,
                                                                        borderWidth: 1.5,
                                                                        '&:hover': {
                                                                            borderWidth: 1.5,
                                                                            bgcolor: alpha(t.palette.primary.main, 0.04),
                                                                        },
                                                                    })}
                                                                >
                                                                    Create Post
                                                                </Button>
                                                            ) : isNonPersonalAccount ? (
                                                                <Tooltip title="Switch to your personal account to create a post" slotProps={{ tooltip: { sx: { fontSize: 13, fontWeight: 700, px: 1.5, py: 0.75, borderRadius: 2 } } }}>
                                                                <span>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        disabled
                                                                        startIcon={<ForumIcon />}
                                                                        sx={{
                                                                            borderRadius: 999,
                                                                            textTransform: 'none',
                                                                            fontWeight: 800,
                                                                            height: 40,
                                                                            px: 2.25,
                                                                            whiteSpace: 'nowrap',
                                                                            borderWidth: 1.5,
                                                                        }}
                                                                    >
                                                                        Create Post
                                                                    </Button>
                                                                </span>
                                                                </Tooltip>
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>
                                                                    Join the group to post.
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {showPrivatePostsGate ? (
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                minHeight: { xs: 320, md: 420 },
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                textAlign: 'center',
                                                                px: 2,
                                                            }}
                                                        >
                                                            <Box sx={{ maxWidth: 520 }}>
                                                                <Box
                                                                    sx={(t) => ({
                                                                        width: 88,
                                                                        height: 88,
                                                                        borderRadius: '20px',
                                                                        mx: 'auto',
                                                                        mb: 1.75,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                    })}
                                                                >
                                                                    <LockIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                                                </Box>

                                                                <Typography sx={{ fontWeight: 900, mb: 0.75, fontSize: 20 }}>This group is private</Typography>
                                                                <Typography color="text.secondary" sx={{ lineHeight: 1.5, maxWidth: 520, mx: 'auto' }}>
                                                                    You must request to join before you can view posts in this group. Use the button above to request access.
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ) : null}

                                                    {groupPostsLoadingForRender && !showPrivatePostsGate && (
                                                        Array.isArray(filteredGroupPosts) && filteredGroupPosts.length > 0 ? (
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.25 }}>
                                                                <PulsingDots size={8} sx={{ py: 0 }} />
                                                            </Box>
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    width: '100%',
                                                                    minHeight: 220,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <PulsingDots />
                                                            </Box>
                                                        )
                                                    )}

                                                    {!groupPostsLoadingForRender && !showPrivatePostsGate && groupPostsErrorForRender && (
                                                        <Typography color="error" sx={{ mt: 0.5 }}>
                                                            {safeRenderText(groupPostsErrorForRender)}
                                                        </Typography>
                                                    )}

                                                    {!showPrivatePostsGate &&
                                                        !groupPostsLoadingForRender &&
                                                        !groupPostsErrorForRender &&
                                                        Array.isArray(filteredGroupPosts) &&
                                                        filteredGroupPosts.length === 0 &&
                                                        (() => {
                                                            const vis = String(selectedGroupResolved?.visibility || '').toLowerCase();
                                                            const isPrivateLike =
                                                                ['private', 'hidden'].includes(vis) ||
                                                                Boolean(selectedGroupResolved?.is_private ?? selectedGroupResolved?.isPrivate);

                                                            if (isPrivateLike) {
                                                                if (isMember) {
                                                                    return (
                                                                        <Box
                                                                            sx={{
                                                                                py: 4,
                                                                                px: 2,
                                                                                textAlign: 'center',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'center',
                                                                                gap: 1,
                                                                            }}
                                                                        >
                                                                            <ForumRoundedIcon
                                                                                sx={(t) => ({
                                                                                    fontSize: 64,
                                                                                    color: alpha(t.palette.primary.main, 0.7),
                                                                                    mb: 0.5,
                                                                                })}
                                                                            />
                                                                            <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No Posts Yet</Typography>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, lineHeight: 1.5 }}>
                                                                                Be the first to share something with this group!
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                }

                                                                return (
                                                                    <Box
                                                                        sx={(t) => ({
                                                                            border: '1px dashed',
                                                                            borderColor: alpha(t.palette.primary.main, 0.18),
                                                                            borderRadius: 3,
                                                                            p: { xs: 2.25, md: 2.75 },
                                                                            textAlign: 'center',
                                                                            bgcolor: alpha(t.palette.background.paper, 0.45),
                                                                        })}
                                                                    >
                                                                        <Box
                                                                            sx={(t) => ({
                                                                                width: 96,
                                                                                height: 96,
                                                                                borderRadius: '20px',
                                                                                mx: 'auto',
                                                                                mb: 1.5,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                border: '1px solid',
                                                                                borderColor: alpha(t.palette.primary.main, 0.16),
                                                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                                boxShadow: (t) => t.custom.shadows.xs,
                                                                            })}
                                                                        >
                                                                            <LockIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                                                        </Box>

                                                                        <Typography sx={{ fontWeight: 900, mb: 0.75, fontSize: 18 }}>This group is private</Typography>
                                                                        <Typography color="text.secondary" sx={{ lineHeight: 1.5, maxWidth: 520, mx: 'auto' }}>
                                                                            You must request to join before you can view posts in this group.
                                                                        </Typography>
                                                                    </Box>
                                                                );
                                                            }

                                                            return (
                                                                <Box
                                                                    sx={{
                                                                        py: 4,
                                                                        px: 2,
                                                                        textAlign: 'center',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    <ForumRoundedIcon
                                                                        sx={(t) => ({
                                                                            fontSize: 64,
                                                                            color: alpha(t.palette.primary.main, 0.7),
                                                                            mb: 0.5,
                                                                        })}
                                                                    />
                                                                    <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No Posts Yet</Typography>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, lineHeight: 1.5 }}>
                                                                        Be the first to share something with this group!
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        })()}

                                                    {!showPrivatePostsGate && (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {(Array.isArray(filteredGroupPosts) ? filteredGroupPosts : []).map((p) => {
                                                                const pid = p?.id ?? p?.post_id ?? null;
                                                                if (!pid) return null;
                                                                const versionKey =
                                                                    p?.__llv ??
                                                                    p?.updated_at ??
                                                                    p?.edited_at ??
                                                                    p?.updatedAt ??
                                                                    p?.editedAt ??
                                                                    '';
                                                                const isPinnedPost = showPinnedPosts && Boolean(Number(p?.is_pinned ?? p?.isPinned ?? 0));
                                                                return (
                                                                    <Box key={`group-post-${pid}-${String(versionKey)}-${activeBusinessId || 0}-${activeArtistId || 0}`} sx={{ width: '100%' }}>
                                                                        {/* Pinned Post badge - gold styling */}
                                                                        {isPinnedPost && (
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 0.5,
                                                                                    mb: 0.75,
                                                                                    px: 1,
                                                                                    py: 0.4,
                                                                                    borderRadius: 1,
                                                                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                                                                    border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                                                                    userSelect: 'none',
                                                                                }}
                                                                            >
                                                                                <PushPinIcon
                                                                                    sx={{ fontSize: 14, color: 'warning.main', transform: 'rotate(45deg)' }}
                                                                                />
                                                                                <Typography
                                                                                    component="span"
                                                                                    sx={{
                                                                                        whiteSpace: 'nowrap',
                                                                                        fontWeight: 700,
                                                                                        color: 'warning.dark',
                                                                                        fontSize: '0.7rem',
                                                                                        lineHeight: 1,
                                                                                    }}
                                                                                >
                                                                                    Pinned Post
                                                                                </Typography>
                                                                            </Box>
                                                                        )}
                                                                        <GroupPostCard
                                                                            post={sanitizePinnedForDisplayLocal(p)}
                                                                            onClick={() => setSelectedGroupPostId(pid)}
                                                                            onUserClick={handleLocalUserCardOpen}
                                                                            viewer={user}
                                                                            groupId={selectedGroupResolved?.id ?? selectedGroupResolved?.group_id ?? selectedGroupResolved?.groupId ?? null}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center', p: 2 }}>
                                        <Box
                                            sx={(t) => ({
                                                width: 100,
                                                height: 100,
                                                borderRadius: '50%',
                                                mx: 'auto',
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: t.palette.primary.light,
                                                border: '2px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.22),
                                                boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.18)}`,
                                            })}
                                        >
                                            <GroupsIcon sx={{ fontSize: 50, color: '#fff' }} />
                                        </Box>

                                        <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75 }}>Select a group</Typography>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>Click a group on the left to see its posts here.</Typography>
                                    </Box>
                                </Box>
                            )
                        ) : selectedPost ? (
                            <PostDetailModal
                                user={user}
                                embedded
                                post={selectedPost}
                                topRightSlot={
                                    selectedPost?.id != null ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => {
                                                try {
                                                    sessionStorage.setItem('ll:community:url', window.location.pathname + window.location.search);
                                                    const listEl = document.querySelector('[data-community-scroll]');
                                                    const top = listEl?.scrollTop || 0;
                                                    sessionStorage.setItem('ll:community:scrollTop', String(top));
                                                    const rightEl = document.querySelector('[data-post-detail-scroll]');
                                                    if (rightEl) sessionStorage.setItem('ll:community:rightScrollTop', String(rightEl.scrollTop || 0));
                                                } catch {}
                                                navigate(`/posts/${selectedPost.id}`, { state: { post: selectedPost, from: 'community', fromCommunity: true } });
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 12,
                                                borderRadius: 999,
                                                whiteSpace: 'nowrap',
                                                px: 1.5,
                                                py: 0.25,
                                            }}
                                        >
                                            View full post page
                                        </Button>
                                    ) : null
                                }
                            />
                        ) : (
                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box
                                    sx={{
                                        width: '100%',
                                        maxWidth: 420,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1.1,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: (t) => alpha(t.palette.text.primary, 0.03),
                                            border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                            boxShadow: (t) => t.custom.shadows.xs,
                                        }}
                                    >
                                        <ForumIcon sx={{ fontSize: 42, color: 'primary.main', opacity: 0.9 }} />
                                    </Box>

                                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Select a post</Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                                        Choose a post from the list to see details, comments, and photos.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </AnimatePresence>

            <UserCardPopover
                anchorEl={ucpAnchor}
                onClose={() => setUcpAnchor(null)}
                user={ucpUser}
                isSelf={ucpIsSelf}
                onViewProfile={(u) => {
                    if (u?.account_type === 'business' || u?.business_id) {
                        const slug = u?.business_slug || u?.account_handle;
                        if (slug) return window.location.assign(`/business/${slug}`);
                    }
                    if (u?.account_type === 'artist' || u?.artist_id) {
                        const ah = u?.artist_handle || u?.account_handle;
                        if (ah) return window.location.assign(`/${ah}`);
                    }
                    const h = u?.handle || u?.id;
                    if (h) window.location.assign(`/${h}`);
                }}
            />

            {/* Share Group Dialog */}
            <ShareDialog
                contentType="group"
                open={shareGroupOpen}
                onClose={() => setShareGroupOpen(false)}
                group={selectedGroupResolved}
                viewer={user}
            />

            {/* Report Dialog — shared component matching PostList */}
            <ReportDialog open={groupReportOpen} onClose={() => setGroupReportOpen(false)} onSubmit={submitGroupReport} />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={groupCopyToast}
                message="Link copied to clipboard"
                onClose={() => setGroupCopyToast(false)}
                autoHideDuration={2000}
            />
        </Box>
    );
}
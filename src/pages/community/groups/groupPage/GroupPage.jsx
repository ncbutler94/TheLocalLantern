// src/pages/community/groups/groupPage/GroupPage.jsx
/**
 * GroupPage - Main group view page
 *
 * Features:
 * - Group header with membership actions
 * - Posts, About, Members tabs
 * - Admin console modal integration
 * - Join/Leave/Invite handling
 * - Pending requests count for admins
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    IconButton,
    Link,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import BlockIcon from "@mui/icons-material/Block";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

import { TAB } from "./groupPageUtils";
import { useAuth } from "../../../../components/AuthModalContext";
import { useActiveAccount } from "../../../../components/AccountContext";
import GroupHeader from "./GroupHeader";
import GroupPostsPanel from "./GroupPostsPanel";
import GroupMembersPanel from "./GroupMembersPanel";
import GroupAboutPanel from "./GroupAboutPanel";
import GroupRulesPanel from "./GroupRulesPanel";
import CreateGroupPostModal from "../CreateGroupPostModal";
import JoinQuestionsDialog from "../JoinQuestionsDialog";
import ShareDialog from "../../../../components/ShareDialog";
import SuccessSnackbar, { useSuccessSnackbar } from "../../../../components/SuccessSnackbar";
import useRateLimit from "../../../../utils/useRateLimit";
import RateLimitDialog from "../../../../components/RateLimitDialog";
import { secureFetch } from "../../../../utils/secureFetch";
import useChromeTop from "../../../../hooks/useChromeTop";

// Module-level cache — survives component remounts without serialization.
// Stores posts data + scroll position when navigating to a post page.
const _groupPageCache = { posts: null, countText: '', scrollTop: 0, groupId: null, lastPostId: null };

export default function GroupPage({ groupUsername, onClose } = {}) {
    const { groupId: routeGroupId } = useParams();
    const groupId = groupUsername || routeGroupId;
    const nav = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const viewerUser = auth?.user || null;

    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const isOnPersonalAccount = Boolean(viewerUser) && !isBusinessAccount && !isArtistAccount;


    /* ---------- post rate limiting ---------- */
    const { checkLimit: checkPostLimit, recordAction: recordPost } = useRateLimit('community-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'posts',
    });

    // ========================================================================
    // "Back to Groups" — detect if user arrived from the Community page
    // ========================================================================
    const fromNotifications = Boolean(location?.state?.fromNotifications);
    const cameFromCommunity = useMemo(() => {
        if (typeof onClose === 'function') return true;
        if (location?.state?.fromCommunity || location?.state?.from === 'community') return true;
        try {
            return Boolean(sessionStorage.getItem('ll:community:url'));
        } catch {
            return false;
        }
    }, [location?.state, onClose]);

    const handleBackToGroups = useCallback(() => {
        try {
            sessionStorage.setItem('ll:community:restore', '1');
        } catch { /* ignore */ }

        // Always navigate directly to the community URL instead of using nav(-1),
        // which can loop back to admin console or other intermediate pages.
        try {
            const url = sessionStorage.getItem('ll:community:url');
            if (url) {
                nav(url, { replace: true, state: { restoreCommunity: true } });
                return;
            }
        } catch { /* ignore */ }

        nav('/community', { replace: true, state: { restoreCommunity: true } });
    }, [nav]);

    // ========================================================================
    // Scroll preservation — element-based (scroll to the post that was clicked)
    // ========================================================================
    const shouldRestore = _groupPageCache.posts != null
        && _groupPageCache.posts.length > 0
        && String(_groupPageCache.groupId || '') === String(groupId || '');

    useEffect(() => {
        try { sessionStorage.removeItem('ll:group:restore'); } catch { /* ignore */ }
    }, []);

    // Scroll to the post element that was clicked, not to a pixel position
    useEffect(() => {
        if (!shouldRestore) return;
        const targetPostId = _groupPageCache.lastPostId;
        if (!targetPostId) return;

        const intervalId = setInterval(() => {
            const el = document.querySelector(`[data-group-post-id="${targetPostId}"]`);
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'auto' });
                clearInterval(intervalId);
            }
        }, 100);

        const safetyTimer = setTimeout(() => clearInterval(intervalId), 8000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(safetyTimer);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear the module cache after restore settles
    useEffect(() => {
        if (!shouldRestore) return;
        const timer = setTimeout(() => {
            _groupPageCache.posts = null;
            _groupPageCache.countText = '';
            _groupPageCache.scrollTop = 0;
            _groupPageCache.lastPostId = null;
        }, 6000);
        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ========================================================================
    // Page State
    // ========================================================================
    const [tab, setTab] = useState(TAB.ABOUT);
    const [pageEntered, setPageEntered] = useState(shouldRestore);

    useEffect(() => {
        if (pageEntered) return;
        const id = window.requestAnimationFrame(() => setPageEntered(true));
        return () => window.cancelAnimationFrame(id);
    }, [pageEntered]);

    const [tabPanelReserve, setTabPanelReserve] = useState(shouldRestore ? false : true);
    const postsLoadStartedRef = useRef(false);
    const membersLoadStartedRef = useRef(false);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const prevHtml = html.style.overflowY;
        const prevBody = body.style.overflowY;

        html.style.overflowY = "scroll";
        body.style.overflowY = "scroll";

        return () => {
            html.style.overflowY = prevHtml;
            body.style.overflowY = prevBody;
        };
    }, []);

    // ========================================================================
    // Toast/Snackbar
    // ========================================================================
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });

    const showToast = useCallback((message, severity = 'success') => {
        if (severity === 'success') {
            showSuccess(message);
        } else {
            setToast({ open: true, message, severity });
        }
    }, [showSuccess]);

    const handleCloseToast = useCallback(() => {
        setToast(prev => ({ ...prev, open: false }));
    }, []);

    // ========================================================================
    // Group Data
    // ========================================================================
    const [isJoining, setIsJoining] = useState(false);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [group, setGroup] = useState(null);
    // Raw membership from the API (always based on the personal user's auth token).
    // When the viewer is NOT on their personal account, we suppress it so the UI
    // doesn't show Owner/Admin/Member badges or the Manage button.
    const [viewerMembershipRaw, setViewerMembershipRaw] = useState(null);
    const viewerMembership = isOnPersonalAccount ? viewerMembershipRaw : null;

    const viewerRole = String(viewerMembership?.role || '').toLowerCase();
    const isOwner = viewerRole === 'owner';
    const isAdmin = viewerRole === 'admin' || isOwner;

    const viewerIsBanned = (() => {
        if (viewerMembership?.is_banned) return true;
        if (group?.is_banned) return true;
        const bannedUntil = viewerMembership?.banned_until || viewerMembership?.bannedUntil;
        if (bannedUntil && new Date(bannedUntil) > new Date()) return true;
        return false;
    })();

    const viewerIsTimedOut = (() => {
        if (viewerIsBanned) return false;
        if (viewerMembership?.is_timed_out) return true;
        if (group?.is_timed_out) return true;
        const timeoutUntil = viewerMembership?.timeout_until || viewerMembership?.timeoutUntil || group?.timeout_until;
        if (timeoutUntil && new Date(timeoutUntil) > new Date()) return true;
        return false;
    })();

    const viewerIsMember = (() => {
        if (!viewerMembership) return false;
        if (viewerIsBanned) return false;
        if (viewerMembership?.is_member || viewerMembership?.isMember) return true;

        const status = String(
            viewerMembership?.status ||
            viewerMembership?.membership_status ||
            viewerMembership?.membershipStatus ||
            viewerMembership?.role ||
            ""
        ).toLowerCase();

        return ["joined", "member", "owner", "admin", "moderator", "accepted", "approved"].includes(status);
    })();

    const viewerHasRequested = (() => {
        if (!viewerMembership) return false;
        if (viewerMembership?.has_requested || viewerMembership?.hasRequested) return true;

        const status = String(
            viewerMembership?.status ||
            viewerMembership?.membership_status ||
            viewerMembership?.membershipStatus ||
            ""
        ).toLowerCase();

        return ["pending", "requested", "request_sent"].includes(status);
    })();

    const isMuted = Boolean(viewerMembership?.is_muted || viewerMembership?.isMuted);

    // ========================================================================
    // Admin Console
    // ========================================================================
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    // ========================================================================
    // Create Post Modal State
    // ========================================================================
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [createPostGuardOpen, setCreatePostGuardOpen] = useState(false);
    const [createPostGuardMode, setCreatePostGuardMode] = useState("login");
    const [joiningFromGuard, setJoiningFromGuard] = useState(false);

    // Leave group confirmation dialog
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [leavingInProgress, setLeavingInProgress] = useState(false);

    // Share group dialog
    const [shareGroupOpen, setShareGroupOpen] = useState(false);

    // Rules dialog for join flow
    const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
    const [rulesHtml, setRulesHtml] = useState('');
    const [rulesJoining, setRulesJoining] = useState(false);

    // Join questions dialog
    const [joinQuestionsDialogOpen, setJoinQuestionsDialogOpen] = useState(false);
    const [joinQuestionsSubmitting, setJoinQuestionsSubmitting] = useState(false);

    useEffect(() => {
        if (createPostGuardOpen && createPostGuardMode === "join" && viewerIsMember) {
            setCreatePostGuardOpen(false);
        }
        if (createPostOpen && !viewerIsMember) {
            setCreatePostOpen(false);
        }
    }, [viewerIsMember, createPostGuardOpen, createPostGuardMode, createPostOpen]);

    // ========================================================================
    // Posts State
    // ========================================================================
    const [visiblePosts, setVisiblePosts] = useState(() => {
        if (shouldRestore) return _groupPageCache.posts;
        return [];
    });
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingPostsMore, setLoadingPostsMore] = useState(false);
    const [postsEndReached, setPostsEndReached] = useState(false);
    const [postsCountText, setPostsCountText] = useState(() => {
        if (shouldRestore) return _groupPageCache.countText || "";
        return "";
    });

    // Ref to track current posts count — avoids putting visiblePosts.length in fetchPosts deps
    const visiblePostsLenRef = useRef(visiblePosts.length);
    visiblePostsLenRef.current = visiblePosts.length;

    const [postSearchText, setPostSearchText] = useState("");
    const [postQuery, setPostQuery] = useState("");
    const [postSort, setPostSort] = useState("newest");
    const [postDateRange, setPostDateRange] = useState("all");

    // ── Moderation: filter hidden/blocked users from group posts ──
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [hiddenUserIds, setHiddenUserIds] = useState(() => new Set());
    const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());

    useEffect(() => {
        const viewerId = Number(viewerUser?.id || 0);
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
                    credentials: 'include', headers: hdrs,
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
    }, [viewerUser?.id, isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId]);

    useEffect(() => {
        const onHiddenUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            setHiddenUserIds((prev) => { const n = new Set(prev); if (e?.detail?.hidden) n.add(uid); else n.delete(uid); return n; });
        };
        const onBlockedUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            setBlockedUserIds((prev) => { const n = new Set(prev); if (e?.detail?.blocked) n.add(uid); else n.delete(uid); return n; });
        };
        const onHiddenPost = (e) => {
            const pid = Number(e?.detail?.postId || 0);
            if (!pid) return;
            setHiddenPostIds((prev) => { const n = new Set(prev); if (e?.detail?.hidden) n.add(pid); else n.delete(pid); return n; });
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

    const filteredVisiblePosts = useMemo(() => {
        const raw = Array.isArray(visiblePosts) ? visiblePosts : [];
        const hasH = hiddenPostIds.size > 0;
        const hasHU = hiddenUserIds.size > 0;
        const hasB = blockedUserIds.size > 0;
        if (!hasH && !hasHU && !hasB) return raw;
        return raw.filter((p) => {
            const pid = Number(p?.id ?? p?.post_id ?? 0);
            if (pid && hasH && hiddenPostIds.has(pid)) return false;
            const uid = Number(p?.user_id ?? p?.userId ?? p?.author_id ?? p?.owner_id ?? 0);
            if (uid && hasB && blockedUserIds.has(uid)) return false;
            if (uid && hasHU && hiddenUserIds.has(uid)) return false;
            return true;
        });
    }, [visiblePosts, hiddenPostIds, hiddenUserIds, blockedUserIds]);

    const filteredPostsCountText = useMemo(() => {
        const rawLen = Array.isArray(visiblePosts) ? visiblePosts.length : 0;
        const filtLen = filteredVisiblePosts.length;
        if (rawLen === filtLen) return postsCountText;
        // Adjust the "Displaying X of Y posts" text
        if (!filtLen) return '';
        return `${filtLen} post${filtLen === 1 ? '' : 's'}`;
    }, [postsCountText, visiblePosts, filteredVisiblePosts]);

    const filtersAreDefault =
        String(postQuery || "") === "" &&
        String(postSort || "newest") === "newest" &&
        String(postDateRange || "all") === "all";

    const hasRules = Boolean(
        String(group?.rulesHtml ?? group?.rules_html ?? "").trim() ||
        String(group?.rulesText ?? group?.rules_text ?? group?.rules ?? "").trim()
    );

    const postsTopRef = useRef(null);

    const scrollToPostsTop = useCallback(() => {
        const el = postsTopRef.current;
        const headerOffset = 96;
        if (el) {
            const rect = el.getBoundingClientRect();
            const absoluteTop = rect.top + window.pageYOffset;
            const targetTop = Math.max(absoluteTop - headerOffset, 0);
            window.scrollTo({ top: targetTop, behavior: "smooth" });
            return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // ========================================================================
    // Members State
    // ========================================================================
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingMembersMore, setLoadingMembersMore] = useState(false);
    const [membersEndReached, setMembersEndReached] = useState(false);
    const [membersCountText, setMembersCountText] = useState("");

    const [memberSearchText, setMemberSearchText] = useState("");
    const [memberQuery, setMemberQuery] = useState("");

    // ========================================================================
    // Overview State
    // ========================================================================
    const [overviewPinnedPosts, setOverviewPinnedPosts] = useState([]);
    const [loadingOverviewPinned, setLoadingOverviewPinned] = useState(false);

    // ========================================================================
    // API Helper
    // ========================================================================
    const apiFetch = useCallback(async (url, options = {}) => {
        const res = await secureFetch(url, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            const err = new Error(msg || `Request failed (${res.status})`);
            err.status = res.status;
            throw err;
        }

        const ct = String(res.headers.get("content-type") || "");
        if (ct.includes("application/json")) return res.json();
        return res.text();
    }, []);

    // ========================================================================
    // Navigation Helpers
    // ========================================================================
    const renderPrivateGate = useCallback((section) => {
        return (
            <Box
                sx={(t) => ({
                    p: 6,
                    textAlign: "center",
                    fontWeight: 800,
                    color: alpha(t.palette.text.primary, 0.5),
                    fontSize: 15,
                })}
            >
                This {section} section is private.
            </Box>
        );
    }, []);

    const openPostPage = useCallback(
        (postId) => {
            const pid = Number(postId);
            if (!Number.isFinite(pid) || pid <= 0) return;

            try {
                const url = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                sessionStorage.setItem("ll:group:url", url);
                sessionStorage.setItem("ll:group:restore", "1");

                // Save to module-level cache (instant, no size limits)
                _groupPageCache.posts = visiblePosts;
                _groupPageCache.countText = postsCountText;
                _groupPageCache.scrollTop = window.scrollY || window.pageYOffset || 0;
                _groupPageCache.groupId = groupId;
                _groupPageCache.lastPostId = pid;
            } catch {
                // ignore
            }

            const groupContext = {
                id: Number(group?.id || groupId) || Number(groupId) || null,
                name: String(group?.name || group?.group_name || ""),
                avatarUrl: String(group?.image_url || group?.photo_url || group?.group_photo_url || ""),
                visibility: String(group?.visibility || ""),
            };

            nav(`/posts/${pid}`, {
                state: {
                    fromGroup: true,
                    groupContext,
                },
            });
        },
        [nav, groupId, group, visiblePosts, postsCountText]
    );

    const goMemberProfile = useCallback(
        (user) => {
            const handle = user?.username || user?.handle;
            nav(handle ? `/profile/${handle}` : `/profile/${user?.id}`);
        },
        [nav]
    );

    // ========================================================================
    // Fetch Group Data
    // ========================================================================
    const fetchGroup = useCallback(async () => {
        if (!groupId) return;
        setLoadingGroup(true);
        try {
            const data = await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}`);
            const g = data?.group || null;
            const vm = data?.viewerMembership || null;

            setGroup(g);
            setViewerMembershipRaw(vm);
        } finally {
            setLoadingGroup(false);
        }
    }, [apiFetch, groupId]);

    const fetchPendingRequestsCount = useCallback(async () => {
        if (!groupId || !isAdmin) return;
        try {
            const data = await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}/admin/requests/count`);
            setPendingRequestsCount(data?.count || data?.total || 0);
        } catch {
            setPendingRequestsCount(0);
        }
    }, [apiFetch, groupId, isAdmin]);

    // ========================================================================
    // Join / Leave Handlers
    // ========================================================================
    const normalizeJoinStatus = (payload) => {
        const statusRaw = String(payload?.status || payload?.membership_status || payload?.membershipStatus || "").toLowerCase();
        const isMemberFlag = Boolean(payload?.is_member || payload?.isMember || payload?.member || payload?.joined);
        const isPendingFlag = Boolean(payload?.has_requested || payload?.hasRequested || payload?.pending);
        const isJoined = isMemberFlag || ["joined", "member", "active"].includes(statusRaw);
        const isPending = isPendingFlag || ["pending", "requested", "request_sent"].includes(statusRaw);
        return { isJoined, isPending };
    };

    // Internal: actually call the join API (used by both direct join and after rules acceptance)
    const finalizeJoin = useCallback(
        async (answers) => {
            if (!groupId) return;
            setIsJoining(true);
            try {
                const bodyPayload = {};
                if (Array.isArray(answers) && answers.length > 0) {
                    bodyPayload.answers = answers;
                }
                const data = await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}/join`, {
                    method: "POST",
                    body: JSON.stringify(bodyPayload),
                });

                const payload = data?.membership || data?.viewerMembership || data?.group || data || {};
                const { isJoined, isPending } = normalizeJoinStatus(payload);

                if (isJoined) {
                    setViewerMembershipRaw((prev) => ({
                        ...(prev || {}),
                        status: "joined",
                        is_member: 1,
                        isMember: true,
                        has_requested: false,
                        hasRequested: false,
                        role: prev?.role || "member",
                    }));
                    setGroup((prev) => {
                        if (!prev) return prev;
                        const c = Number(prev.member_count ?? prev.memberCount ?? 0);
                        return { ...prev, member_count: Number.isFinite(c) ? c + 1 : c, has_requested: false, hasRequested: false, is_member: true, isMember: true };
                    });
                    showToast("You've joined the group!", "success");
                    await fetchGroup();
                } else if (isPending) {
                    setViewerMembershipRaw((prev) => ({
                        ...(prev || {}),
                        status: "requested",
                        has_requested: 1,
                        hasRequested: true,
                        is_member: false,
                        isMember: false,
                    }));
                    setGroup((prev) => {
                        if (!prev) return prev;
                        return { ...prev, has_requested: true, hasRequested: true };
                    });
                    showToast("Join request sent!", "info");
                }
            } catch (e) {
                showToast(e?.message || "Failed to join group", "error");
            } finally {
                setIsJoining(false);
            }
        },
        [apiFetch, groupId, fetchGroup, showToast]
    );

    // Parse join questions from group data
    const joinQuestions = useMemo(() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    }, [group]);

    const hasJoinQuestions = joinQuestions.length > 0;

    // Public join handler: checks for rules first, then join questions, then joins
    const joinOrRequest = useCallback(
        async () => {
            if (!groupId) return;

            // Require login
            if (!viewerUser) {
                try {
                    if (auth && typeof auth.open === 'function') auth.open();
                    else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
                    else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
                    else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
                } catch { /* ignore */ }
                try {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                    window.dispatchEvent(new CustomEvent('open-login'));
                    window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                    window.dispatchEvent(new CustomEvent('open-login-popup'));
                } catch { /* ignore */ }
                return;
            }

            if (!isOnPersonalAccount) {
                showToast("Switch to your personal account to join groups", "warning");
                return;
            }

            // Check if the group has rules the user must accept first
            const rules = String(
                group?.rules_html || group?.rulesHtml || ""
            ).trim();

            if (rules) {
                setRulesHtml(rules);
                setRulesDialogOpen(true);
                return;
            }

            // Check if the group has join questions
            if (hasJoinQuestions) {
                setJoinQuestionsDialogOpen(true);
                return;
            }

            // No rules, no questions — join immediately
            await finalizeJoin();
        },
        [groupId, isOnPersonalAccount, showToast, group, finalizeJoin, hasJoinQuestions, viewerUser, auth]
    );

    // Accept rules and then join (or show questions dialog if questions exist)
    const handleAcceptRulesAndJoin = useCallback(
        async () => {
            setRulesJoining(true);
            try {
                // If there are join questions, close rules dialog and open questions dialog
                if (hasJoinQuestions) {
                    setRulesDialogOpen(false);
                    setRulesHtml('');
                    setJoinQuestionsDialogOpen(true);
                    return;
                }
                await finalizeJoin();
                setRulesDialogOpen(false);
                setRulesHtml('');
            } catch (e) {
                showToast(e?.message || "Failed to join group", "error");
            } finally {
                setRulesJoining(false);
            }
        },
        [finalizeJoin, showToast, hasJoinQuestions]
    );

    // Handle join questions dialog submission
    const handleJoinQuestionsSubmit = useCallback(
        async (answers) => {
            setJoinQuestionsSubmitting(true);
            try {
                await finalizeJoin(answers);
                setJoinQuestionsDialogOpen(false);
            } catch (e) {
                showToast(e?.message || "Failed to submit join request", "error");
            } finally {
                setJoinQuestionsSubmitting(false);
            }
        },
        [finalizeJoin, showToast]
    );

    const leaveGroup = useCallback(
        async () => {
            if (!groupId) return;

            setLeavingInProgress(true);

            const gidEnc = encodeURIComponent(String(groupId));
            const attempts = [
                { url: `/api/groups/${gidEnc}/leave`, method: "POST" },
                { url: `/api/groups/${gidEnc}/membership`, method: "DELETE" },
                { url: `/api/groups/${gidEnc}/join`, method: "DELETE" },
            ];

            const doAttempt = async ({ url, method }) => {
                const res = await secureFetch(url, {
                    method,
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
                if (res.ok) return true;
                if (res.status === 404) return false;
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `Failed to leave group (${res.status})`);
            };

            try {
                let ok = false;
                for (const a of attempts) {
                    ok = await doAttempt(a);
                    if (ok) break;
                }

                if (!ok) {
                    throw new Error("Could not leave group");
                }

                setGroup((prev) => {
                    if (!prev) return prev;
                    const mc = Number(prev?.member_count ?? prev?.memberCount);
                    if (!Number.isFinite(mc)) return prev;
                    return { ...prev, member_count: Math.max(0, mc - 1) };
                });
                setViewerMembershipRaw(null);
                showToast("You've left the group", "success");

                await fetchGroup();
            } catch (e) {
                showToast(e?.message || "Failed to leave group", "error");
            } finally {
                setLeavingInProgress(false);
                setLeaveDialogOpen(false);
                setIsJoining(false);
            }
        },
        [groupId, fetchGroup, showToast]
    );

    const handleLeaveClick = useCallback(() => {
        setLeaveDialogOpen(true);
    }, []);

    // ========================================================================
    // Invite Accept/Decline Handlers
    // ========================================================================
    const acceptInvite = useCallback(async () => {
        if (!groupId) return;
        setIsJoining(true);
        try {
            await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}/invites/accept`, {
                method: "POST",
            });

            setViewerMembershipRaw((prev) => ({
                ...(prev || {}),
                status: "joined",
                is_member: 1,
                isMember: true,
                has_invite: false,
                hasInvite: false,
                role: prev?.role || "member",
            }));

            setGroup((prev) => {
                if (!prev) return prev;
                const c = Number(prev.member_count ?? prev.memberCount ?? 0);
                return { ...prev, member_count: Number.isFinite(c) ? c + 1 : c };
            });

            showToast("Welcome to the group!", "success");
            await fetchGroup();
        } catch (e) {
            showToast(e?.message || "Failed to accept invite", "error");
        } finally {
            setIsJoining(false);
        }
    }, [apiFetch, groupId, fetchGroup, showToast]);

    const declineInvite = useCallback(async () => {
        if (!groupId) return;
        if (!window.confirm("Decline this invitation?")) return;

        setIsJoining(true);
        try {
            await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}/invites/decline`, {
                method: "POST",
            });

            setViewerMembershipRaw((prev) => ({
                ...(prev || {}),
                has_invite: false,
                hasInvite: false,
                is_invited: false,
                isInvited: false,
            }));

            showToast("Invitation declined", "info");
            await fetchGroup();
        } catch (e) {
            showToast(e?.message || "Failed to decline invite", "error");
        } finally {
            setIsJoining(false);
        }
    }, [apiFetch, groupId, fetchGroup, showToast]);

    // ========================================================================
    // Mute Toggle
    // ========================================================================
    const toggleMute = useCallback(async () => {
        if (!groupId || !viewerIsMember) return;
        try {
            await apiFetch(`/api/groups/${encodeURIComponent(String(groupId))}/mute`, {
                method: "POST",
                body: JSON.stringify({ muted: !isMuted }),
            });

            setViewerMembershipRaw((prev) => ({
                ...(prev || {}),
                is_muted: !isMuted,
                isMuted: !isMuted,
            }));

            showToast(isMuted ? "Notifications unmuted" : "Notifications muted", "success");
        } catch (e) {
            showToast(e?.message || "Failed to update notification settings", "error");
        }
    }, [apiFetch, groupId, viewerIsMember, isMuted, showToast]);

    // ========================================================================
    // Admin Console Handlers
    // ========================================================================
    const handleOpenAdminConsole = useCallback(() => {
        const adminSlug = group?.group_username || group?.groupUsername || groupId;
        nav(`/groups/${adminSlug}/admin`);
    }, [nav, groupId, group]);

    // ========================================================================
    // Fetch Posts
    // ========================================================================
    const fetchPosts = useCallback(
        async ({ append = false } = {}) => {
            if (!groupId) return;

            const limit = 50;
            const offset = append ? visiblePostsLenRef.current : 0;

            if (!append) {
                setLoadingPosts(true);
                setPostsEndReached(false);
            } else {
                setLoadingPostsMore(true);
            }

            try {
                const params = new URLSearchParams();
                params.set("limit", String(limit));
                params.set("offset", String(offset));
                params.set("sort", String(postSort || "newest"));
                if (postQuery) params.set("q", postQuery);
                if (postDateRange) params.set("dateRange", postDateRange);

                if (isBusinessAccount && activeBusinessId) {
                    params.set("activeBusinessId", String(activeBusinessId));
                } else if (isArtistAccount && activeArtistId) {
                    params.set("activeArtistId", String(activeArtistId));
                }

                const res = await secureFetch(
                    `/api/groups/${encodeURIComponent(String(groupId))}/posts?${params.toString()}`,
                    { credentials: "include" }
                );

                const total = Number(res.headers.get("X-Total-Count") || 0) || 0;

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    throw new Error(msg || `Failed to load posts (${res.status})`);
                }

                const rows = await res.json();
                const arr = Array.isArray(rows) ? rows : [];

                const shown = append ? offset + arr.length : arr.length;
                if (total > 0) {
                    setPostsCountText(`${shown} of ${total} post${total === 1 ? "" : "s"}`);
                } else {
                    setPostsCountText("");
                }

                if (!append) setVisiblePosts(arr);
                else setVisiblePosts((prev) => prev.concat(arr));

                const reached = arr.length < limit || (append ? offset + arr.length >= total : arr.length >= total);
                setPostsEndReached(reached);
            } finally {
                setLoadingPosts(false);
                setLoadingPostsMore(false);
            }
        },
        [groupId, postSort, postQuery, postDateRange, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]
    );

    const handlePostsMutate = useCallback(() => {
        fetchPosts({ append: false });
        scrollToPostsTop();
    }, [fetchPosts, scrollToPostsTop]);

    // ========================================================================
    // Create Post Handlers
    // ========================================================================
    const handleOpenCreatePost = useCallback(async () => {
        try {
            await apiFetch("/api/users/profile");
        } catch (e) {
            if (e?.status === 401 || e?.status === 403) {
                setCreatePostGuardMode("login");
                setCreatePostGuardOpen(true);
                return;
            }
            setCreatePostGuardMode("login");
            setCreatePostGuardOpen(true);
            return;
        }

        if (!viewerIsMember) {
            setCreatePostGuardMode("join");
            setCreatePostGuardOpen(true);
            return;
        }

        const limitResult = checkPostLimit();
        if (!limitResult.allowed) {
            setRateLimitInfo({ retryAfterSec: limitResult.retryAfterSec, reason: limitResult.reason, actionLabel: 'posts' });
            setRateLimitOpen(true);
            return;
        }

        setCreatePostOpen(true);
    }, [apiFetch, viewerIsMember, checkPostLimit]);

    const handleCloseCreatePost = useCallback(() => {
        setCreatePostOpen(false);
    }, []);

    const handleCloseCreatePostGuard = useCallback(() => {
        if (joiningFromGuard) return;
        setCreatePostGuardOpen(false);
    }, [joiningFromGuard]);

    const handleJoinFromCreatePostGuard = useCallback(async () => {
        if (!groupId) return;
        setCreatePostGuardOpen(false);
        await joinOrRequest();
    }, [groupId, joinOrRequest]);

    const handleCreatedPost = useCallback(() => {
        recordPost();
        setCreatePostOpen(false);
        setTab(TAB.POSTS);
        fetchPosts({ append: false }).catch(() => {});
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Post created!", "success");
    }, [fetchPosts, showToast]);

    const handleDeletedPost = useCallback(() => {
        fetchPosts({ append: false }).catch(() => {});
        showToast("Post deleted successfully");
    }, [fetchPosts, showToast]);

    const handleEditedPost = useCallback(() => {
        fetchPosts({ append: false }).catch(() => {});
        showToast("Post saved successfully!", "success");
    }, [fetchPosts, showToast]);

    // ========================================================================
    // Fetch Members
    // ========================================================================
    const fetchMembers = useCallback(
        async ({ append = false } = {}) => {
            if (!groupId) return;

            const limit = 200;
            const offset = append ? members.length : 0;

            if (!append) {
                setLoadingMembers(true);
                setMembersEndReached(false);
            } else {
                setLoadingMembersMore(true);
            }

            try {
                const params = new URLSearchParams();
                params.set("limit", String(limit));
                params.set("offset", String(offset));
                if (memberQuery) params.set("q", memberQuery);

                const res = await secureFetch(
                    `/api/groups/${encodeURIComponent(String(groupId))}/members?${params.toString()}`,
                    { credentials: "include" }
                );

                const total = Number(res.headers.get("X-Total-Count") || 0) || 0;
                setMembersCountText(total ? `${total} member${total === 1 ? "" : "s"}` : "");

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    throw new Error(msg || `Failed to load members (${res.status})`);
                }

                const data = await res.json();
                const arr = Array.isArray(data?.members) ? data.members : [];

                if (!append) setMembers(arr);
                else setMembers((prev) => prev.concat(arr));

                const reached = arr.length < limit || (append ? offset + arr.length >= total : arr.length >= total);
                setMembersEndReached(reached);
            } finally {
                setLoadingMembers(false);
                setLoadingMembersMore(false);
            }
        },
        [groupId, members.length, memberQuery]
    );

    const loadMoreMembers = useCallback(() => {
        if (tab !== TAB.MEMBERS) return;
        if (loadingMembersMore || membersEndReached || loadingMembers) return;
        fetchMembers({ append: true }).catch(() => {});
    }, [fetchMembers, loadingMembers, loadingMembersMore, membersEndReached, tab]);

    // ========================================================================
    // Effects
    // ========================================================================
    useEffect(() => {
        fetchGroup().catch(() => {
            setGroup(null);
            setViewerMembershipRaw(null);
        });
    }, [groupId, fetchGroup]);

    useEffect(() => {
        if (isAdmin && groupId) {
            fetchPendingRequestsCount();
        }
    }, [isAdmin, groupId, fetchPendingRequestsCount]);

    useEffect(() => {
        setTabPanelReserve(true);

        if (tab === TAB.POSTS) {
            // If restoring from cache, skip the re-fetch
            if (shouldRestore && visiblePosts.length > 0) {
                postsLoadStartedRef.current = true;
                setTabPanelReserve(false);
                return;
            }
            postsLoadStartedRef.current = true;
            fetchPosts({ append: false }).catch(() => {});
        }
        if (tab === TAB.MEMBERS) {
            membersLoadStartedRef.current = true;
            fetchMembers({ append: false }).catch(() => {});
        }

        if (tab === TAB.ABOUT) {
            postsLoadStartedRef.current = false;
            membersLoadStartedRef.current = false;
        }
    }, [tab, fetchPosts, fetchMembers]);

    useEffect(() => {
        if (tab === TAB.POSTS) {
            if (!postsLoadStartedRef.current) return;
            if (loadingPosts) return;
            setTabPanelReserve(false);
            return;
        }

        if (tab === TAB.MEMBERS) {
            if (!membersLoadStartedRef.current) return;
            if (loadingMembers) return;
            setTabPanelReserve(false);
            return;
        }

        if (!loadingGroup) setTabPanelReserve(false);
    }, [tab, loadingPosts, loadingMembers, loadingGroup]);

    // Skip first fire — the tab effect above handles initial fetch/skip
    const postQueryMountedRef = useRef(false);

    useEffect(() => {
        if (tab !== TAB.POSTS) return;
        if (!postQueryMountedRef.current) {
            postQueryMountedRef.current = true;
            return;
        }
        fetchPosts({ append: false }).catch(() => {});
    }, [tab, postQuery, postSort, postDateRange, fetchPosts]);

    useEffect(() => {
        if (tab !== TAB.MEMBERS) return;
        fetchMembers({ append: false }).catch(() => {});
    }, [tab, memberQuery, fetchMembers]);

    const prevGroupAcctRef = useRef({ activeBusinessId, activeArtistId });
    useEffect(() => {
        const prev = prevGroupAcctRef.current;
        prevGroupAcctRef.current = { activeBusinessId, activeArtistId };
        if (prev.activeBusinessId !== activeBusinessId || prev.activeArtistId !== activeArtistId) {
            fetchGroup().catch(() => {});
            if (tab === TAB.POSTS) {
                fetchPosts({ append: false }).catch(() => {});
            }
        }
    }, [activeBusinessId, activeArtistId, fetchGroup, fetchPosts, tab]);

    // ========================================================================
    // Render
    // ========================================================================
    const chromeTop = useChromeTop();

    return (
        <Container
            maxWidth="lg"
            disableGutters
            sx={{
                px: { xs: 0, sm: 2, md: 3 },
                py: { xs: 0, sm: 2.5 },
                minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: "calc(100vh - 190px)" },
                pt: { xs: `${chromeTop}px`, sm: 0 },
                pb: { xs: '56px', sm: 0 },
                display: "flex",
                bgcolor: { xs: 'background.paper', sm: 'transparent' },
            }}
        >
            <Fade in={pageEntered} timeout={350} appear>
                <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>

                    {/* Main Card — seamless on mobile, card on desktop */}
                    <Paper
                        elevation={0}
                        sx={(t) => ({
                            borderRadius: { xs: 0, sm: 4 },
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            mb: { xs: 0, sm: 3 },
                            overflow: "hidden",
                            border: { xs: "none", sm: "1px solid" },
                            borderColor: { xs: "transparent", sm: alpha(t.palette.divider, 0.06) },
                            bgcolor: { xs: 'transparent', sm: "background.paper" },
                            boxShadow: { xs: "none", sm: `0 1px 3px ${alpha(t.palette.common.black, 0.04)}, 0 12px 40px ${alpha(t.palette.common.black, 0.08)}` },
                        })}
                    >
                        {/* Back to Groups — inside card */}
                        {cameFromCommunity && !fromNotifications && (
                            <Box sx={{ px: { xs: 1, sm: 3 }, pt: { xs: 0.5, sm: 2 }, bgcolor: 'background.paper' }}>
                                <Button
                                    onClick={typeof onClose === 'function' ? onClose : handleBackToGroups}
                                    startIcon={<ArrowBackIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                                    sx={(t) => ({
                                        px: { xs: 1, sm: 1.75 },
                                        py: 0.35,
                                        minWidth: 0,
                                        fontWeight: 700,
                                        textTransform: "none",
                                        borderRadius: 999,
                                        fontSize: { xs: 12.5, sm: 13.5 },
                                        color: t.palette.primary.main,
                                        transition: "all 160ms ease",
                                        "&:hover": {
                                            bgcolor: alpha(t.palette.primary.main, 0.06),
                                        },
                                    })}
                                >
                                    Back to Groups
                                </Button>
                            </Box>
                        )}
                        {/* Header */}
                        <GroupHeader
                            group={group}
                            viewerMembership={viewerMembership}
                            viewerHasRequested={viewerHasRequested}
                            onJoin={viewerIsBanned || viewerIsTimedOut ? undefined : joinOrRequest}
                            onLeave={viewerIsBanned ? undefined : handleLeaveClick}
                            onRequestJoin={viewerIsBanned || viewerIsTimedOut ? undefined : joinOrRequest}
                            onAcceptInvite={viewerIsBanned ? undefined : acceptInvite}
                            onDeclineInvite={viewerIsBanned ? undefined : declineInvite}
                            onToggleMute={undefined}
                            onOpenAdminConsole={viewerIsBanned ? undefined : handleOpenAdminConsole}
                            onShareGroup={() => setShareGroupOpen(true)}
                            isJoining={isJoining}
                            isMuted={isMuted}
                            pendingRequestsCount={viewerIsBanned ? 0 : pendingRequestsCount}
                            isOnPersonalAccount={isOnPersonalAccount}
                            personalAccountCanManage={!viewerIsBanned && isAdmin}
                            embedded
                        />

                        {/* Banned Banner */}
                        {viewerIsBanned && (
                            <Box
                                sx={(t) => ({
                                    px: { xs: 1.5, sm: 4 },
                                    py: { xs: 2, sm: 4 },
                                    textAlign: "center",
                                    bgcolor: alpha(t.palette.error.main, 0.04),
                                    borderTop: "1px solid",
                                    borderColor: alpha(t.palette.error.main, 0.12),
                                })}
                            >
                                <BlockIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: "error.main", opacity: 0.7, mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75, color: "error.main" }}>
                                    You have been banned from this group
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.secondary", maxWidth: 420, mx: "auto", lineHeight: 1.5 }}>
                                    You can no longer view posts, comment, or interact with this group. If you believe this was a mistake, please contact the group admin.
                                </Typography>
                            </Box>
                        )}

                        {/* Timeout Banner */}
                        {viewerIsTimedOut && (() => {
                            const rawUntil = viewerMembership?.timeout_until || viewerMembership?.timeoutUntil || group?.timeout_until;
                            const untilDate = rawUntil ? new Date(rawUntil) : null;
                            const validUntil = untilDate && !Number.isNaN(untilDate.getTime()) ? untilDate : null;
                            const diffMs = validUntil ? Math.max(0, validUntil.getTime() - Date.now()) : 0;
                            const diffMins = Math.ceil(diffMs / 60000);
                            const timeLeftLabel = diffMins >= 1440
                                ? `${Math.round(diffMins / 1440)} day${Math.round(diffMins / 1440) !== 1 ? 's' : ''}`
                                : diffMins >= 60
                                    ? `${Math.round(diffMins / 60)} hour${Math.round(diffMins / 60) !== 1 ? 's' : ''}`
                                    : `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
                            return (
                                <Box
                                    sx={(t) => ({
                                        px: { xs: 2, sm: 4 },
                                        py: { xs: 2.5, sm: 4 },
                                        textAlign: "center",
                                        bgcolor: alpha(t.palette.warning.main, 0.06),
                                        borderTop: "1px solid",
                                        borderColor: alpha(t.palette.warning.main, 0.15),
                                    })}
                                >
                                    <HourglassEmptyIcon sx={{ fontSize: 48, color: "warning.main", opacity: 0.7, mb: 1.5 }} />
                                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75, color: "warning.dark" }}>
                                        You have been timed out
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.secondary", maxWidth: 420, mx: "auto", lineHeight: 1.5 }}>
                                        You cannot post or interact with this group while timed out.
                                        {validUntil && ` Expires in approximately ${timeLeftLabel}.`}
                                    </Typography>
                                </Box>
                            );
                        })()}

                        {/* Non-personal account notice */}
                        {viewerUser && !isOnPersonalAccount && !viewerIsBanned && !viewerIsTimedOut && (
                            <Box
                                sx={(t) => ({
                                    px: { xs: 2, sm: 4 },
                                    py: { xs: 1.5, sm: 2.5 },
                                    textAlign: "center",
                                    bgcolor: alpha(t.palette.info.main, 0.04),
                                    borderTop: "1px solid",
                                    borderColor: alpha(t.palette.info.main, 0.1),
                                })}
                            >
                                <SwapHorizRoundedIcon sx={{ fontSize: 36, color: "info.main", opacity: 0.7, mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 0.5, color: "info.dark" }}>
                                    Switch to your personal account
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "text.secondary", maxWidth: 400, mx: "auto", lineHeight: 1.5 }}>
                                    You're currently browsing as {isBusinessAccount ? "a business" : "an artist"}. Groups are designed for a personal experience. Switch to your personal account to join, post, and interact.
                                </Typography>
                            </Box>
                        )}

                        {/* Tab Bar */}
                        {!viewerIsBanned && !viewerIsTimedOut && (
                            <>
                                <Box
                                    sx={(t) => ({
                                        borderBottom: "1px solid",
                                        borderColor: alpha(t.palette.divider, 0.06),
                                        bgcolor: "background.paper",
                                        position: { xs: 'sticky', sm: 'static' },
                                        top: { xs: 0, sm: 'auto' },
                                        zIndex: { xs: 10, sm: 'auto' },
                                        boxShadow: { xs: `0 1px 4px ${alpha(t.palette.common.black, 0.06)}`, sm: 'none' },
                                    })}
                                >
                                    <Tabs
                                        value={tab}
                                        onChange={(_, v) => setTab(v)}
                                        variant="fullWidth"
                                        scrollButtons={false}
                                        sx={(t) => ({
                                            p: 0,
                                            borderRadius: 0,
                                            backgroundColor: "transparent",
                                            border: "none",
                                            boxShadow: "none",
                                            px: { xs: 0, sm: 2.5 },
                                            minHeight: { xs: 40, sm: 50 },
                                            "& .MuiTabs-indicator": {
                                                height: 2.5,
                                                borderRadius: "3px 3px 0 0",
                                                background: `linear-gradient(90deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.light, 0.8)} 100%)`,
                                            },
                                            "& .MuiTabs-scroller": { overflow: "hidden" },
                                            "& .MuiTab-root": {
                                                minHeight: { xs: 40, sm: 50 },
                                                textTransform: "none",
                                                fontWeight: 700,
                                                fontSize: { xs: 13, sm: 14.5 },
                                                color: alpha(t.palette.text.primary, 0.45),
                                                borderRadius: 0,
                                                letterSpacing: "-0.01em",
                                                transition: "color 180ms ease",
                                                px: { xs: 0.75, sm: 2.5 },
                                                minWidth: { xs: 0, sm: 90 },
                                                flex: { xs: 1, sm: 'unset' },
                                                "&:hover": {
                                                    color: alpha(t.palette.text.primary, 0.7),
                                                },
                                            },
                                            "& .Mui-selected": {
                                                color: `${t.palette.primary.main} !important`,
                                                fontWeight: 800,
                                            },
                                        })}
                                    >
                                        <Tab value={TAB.ABOUT} label="About" />
                                        <Tab value={TAB.POSTS} label="Posts" />
                                        <Tab value={TAB.MEMBERS} label="Members" />
                                        {hasRules && <Tab value={TAB.RULES} label="Rules" />}
                                    </Tabs>
                                </Box>

                                {/* Tab Content */}
                                <Box
                                    sx={{
                                        flexGrow: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        bgcolor: { xs: 'background.paper', sm: 'transparent' },
                                        minHeight: { xs: "calc(100vh - 320px)", sm: "calc(100vh - 380px)" },
                                        pb: { xs: 0, sm: 0 },
                                        ...(tabPanelReserve ? { opacity: 1 } : {}),
                                    }}
                                >
                                    {/* Posts — render inline on all screen sizes */}
                                    {tab === TAB.POSTS && (
                                        <>
                                            <Box ref={postsTopRef} />
                                            <GroupPostsPanel
                                                embedded
                                                group={group}
                                                viewerMembership={viewerMembership}
                                                loadingGroup={loadingGroup}
                                                renderPrivateGate={renderPrivateGate}
                                                loadingOverviewPinned={loadingOverviewPinned}
                                                overviewPinnedPosts={overviewPinnedPosts}
                                                showPinnedPosts={filtersAreDefault}
                                                openPostPage={openPostPage}
                                                canCreatePost={viewerIsMember}
                                                onOpenCreatePost={handleOpenCreatePost}
                                                onMutate={handlePostsMutate}
                                                onPostDeleted={handleDeletedPost}
                                                onPostEdited={handleEditedPost}
                                                isOnPersonalAccount={isOnPersonalAccount}
                                                postSearchText={postSearchText}
                                                setPostSearchText={setPostSearchText}
                                                postSort={postSort}
                                                setPostSort={setPostSort}
                                                postDateRange={postDateRange}
                                                setPostDateRange={setPostDateRange}
                                                onApplySearch={() => {
                                                    setPostQuery(postSearchText);
                                                    scrollToPostsTop();
                                                }}
                                                onClearSearch={() => {
                                                    setPostSearchText("");
                                                    setPostQuery("");
                                                    scrollToPostsTop();
                                                }}
                                                visiblePosts={filteredVisiblePosts}
                                                loadingPosts={loadingPosts}
                                                postsCountText={filteredPostsCountText}
                                                postsSentinelRef={null}
                                                loadingPostsMore={loadingPostsMore}
                                                postsEndReached={postsEndReached}
                                            />
                                        </>
                                    )}

                                    {tab === TAB.MEMBERS && (
                                        <GroupMembersPanel
                                            embedded
                                            group={group}
                                            viewerMembership={viewerMembership}
                                            loadingGroup={loadingGroup}
                                            renderPrivateGate={renderPrivateGate}
                                            members={members}
                                            loadingMembers={loadingMembers}
                                            membersCountText={membersCountText}
                                            memberSearchText={memberSearchText}
                                            setMemberSearchText={setMemberSearchText}
                                            onApplySearch={() => setMemberQuery(memberSearchText)}
                                            onClearSearch={() => {
                                                setMemberSearchText("");
                                                setMemberQuery("");
                                            }}
                                            goMemberProfile={goMemberProfile}
                                            onLoadMore={loadMoreMembers}
                                            loadingMembersMore={loadingMembersMore}
                                            membersEndReached={membersEndReached}
                                        />
                                    )}

                                    {tab === TAB.ABOUT && (
                                        <GroupAboutPanel
                                            embedded
                                            group={group}
                                            viewerMembership={viewerMembership}
                                            loadingGroup={loadingGroup}
                                        />
                                    )}

                                    {tab === TAB.RULES && hasRules && (
                                        <GroupRulesPanel group={group} />
                                    )}


                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>
            </Fade>

            {/* Leave Group Confirmation Dialog */}
            <Dialog
                open={leaveDialogOpen}
                onClose={() => {
                    if (!leavingInProgress) setLeaveDialogOpen(false);
                }}
                maxWidth="xs"
                fullWidth
                disableScrollLock
                PaperProps={{
                    sx: { borderRadius: 3.5, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden" },
                }}
            >
                {/* Colored top strip */}
                <Box
                    sx={(t) => ({
                        height: 6,
                        background: `linear-gradient(90deg, ${t.palette.error.main}, ${t.palette.warning.main})`,
                    })}
                />

                <DialogTitle sx={{ pr: 6, fontWeight: 800, pt: 2.5 }}>
                    Leave group?
                    <IconButton
                        onClick={() => {
                            if (!leavingInProgress) setLeaveDialogOpen(false);
                        }}
                        aria-label="Close"
                        sx={(t) => ({
                            position: "absolute",
                            top: 14,
                            right: 12,
                            width: 32,
                            height: 32,
                            border: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.15),
                        })}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <Box
                            sx={(t) => ({
                                width: 44,
                                height: 44,
                                borderRadius: 2.5,
                                bgcolor: alpha(t.palette.error.main, 0.08),
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                            })}
                        >
                            <ExitToAppIcon sx={(t) => ({ fontSize: 22, color: t.palette.error.main })} />
                        </Box>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Are you sure you want to leave{" "}
                                <Typography component="span" sx={{ fontWeight: 800 }}>
                                    {group?.name || "this group"}
                                </Typography>
                                ?
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.65 }}>
                                You will no longer be able to post or see member-only content. You can rejoin anytime.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
                    <Button
                        onClick={() => setLeaveDialogOpen(false)}
                        disabled={leavingInProgress}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, px: 2.5 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={leaveGroup}
                        disabled={leavingInProgress}
                        disableElevation
                        startIcon={leavingInProgress ? <CircularProgress size={16} color="inherit" /> : <ExitToAppIcon sx={{ fontSize: 17 }} />}
                        sx={(t) => ({
                            borderRadius: 999,
                            textTransform: "none",
                            fontWeight: 800,
                            px: 2.5,
                            boxShadow: `0 2px 8px ${alpha(t.palette.error.main, 0.3)}`,
                        })}
                    >
                        {leavingInProgress ? "Leaving..." : "Leave Group"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Post Guard Dialog */}
            <Dialog
                open={createPostGuardOpen}
                onClose={handleCloseCreatePostGuard}
                maxWidth="xs"
                fullWidth
                disableScrollLock
                PaperProps={{
                    sx: { borderRadius: 3.5, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" },
                }}
            >
                <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
                    {createPostGuardMode === "login" ? "Login required" : "Join required"}
                    <IconButton
                        onClick={handleCloseCreatePostGuard}
                        aria-label="Close"
                        sx={(t) => ({
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 32,
                            height: 32,
                            border: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.12),
                        })}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {createPostGuardMode === "login" ? (
                        <Typography variant="body1">
                            You must be logged in to create a post. Please{" "}
                            <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
                                login
                            </Link>
                            .
                        </Typography>
                    ) : (
                        <Typography variant="body1">
                            You must join this group in order to post.
                        </Typography>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={handleCloseCreatePostGuard}
                        disabled={joiningFromGuard}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                    >
                        Close
                    </Button>

                    {createPostGuardMode === "join" && (
                        <Button
                            variant="contained"
                            onClick={handleJoinFromCreatePostGuard}
                            disabled={joiningFromGuard}
                            disableElevation
                            startIcon={joiningFromGuard ? <CircularProgress size={18} /> : null}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                                background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.3)}`,
                            })}
                        >
                            Join Group
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Create Post Modal */}
            <CreateGroupPostModal
                open={createPostOpen}
                onClose={handleCloseCreatePost}
                group={group}
                onCreated={handleCreatedPost}
            />

            {/* Group Rules Dialog — shown when user tries to join a group with rules */}
            <Dialog
                open={rulesDialogOpen}
                onClose={(_e, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                }}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle sx={{ fontWeight: 950, display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                    <GavelOutlinedIcon sx={{ opacity: 0.9 }} />
                    Group Rules
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                        You must agree to the rules of {group?.name ? `"${group.name}"` : 'this group'} before joining.
                    </Typography>
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            maxHeight: 340,
                            overflowY: 'auto',
                            p: 1.5,
                            '& p': { mt: 0, mb: 1 },
                            '& ul': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                            '& ol': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                        }}
                    >
                        <Box
                            sx={{ fontSize: 14, color: 'text.primary' }}
                            dangerouslySetInnerHTML={{ __html: String(rulesHtml || '').trim() }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, pt: 1.25, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setRulesDialogOpen(false);
                            setRulesHtml('');
                        }}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 2 }}
                        disabled={rulesJoining || isJoining}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAcceptRulesAndJoin}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.5 }}
                        disabled={rulesJoining || isJoining}
                    >
                        {rulesJoining || isJoining ? 'Joining…' : 'Accept & Join'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Join Questions Dialog — shown when group has screening questions */}
            <JoinQuestionsDialog
                open={joinQuestionsDialogOpen}
                onClose={() => setJoinQuestionsDialogOpen(false)}
                onSubmit={handleJoinQuestionsSubmit}
                questions={joinQuestions}
                groupName={group?.name || 'this group'}
                submitting={joinQuestionsSubmitting}
            />

            {/* Share Group Dialog */}
            <ShareDialog
                contentType="group"
                open={shareGroupOpen}
                onClose={() => setShareGroupOpen(false)}
                group={group}
                viewer={viewerUser}
            />

            {/* Rate limit dialog */}
            <RateLimitDialog
                open={rateLimitOpen}
                onClose={() => setRateLimitOpen(false)}
                retryAfterSec={rateLimitInfo.retryAfterSec}
                reason={rateLimitInfo.reason}
                actionLabel={rateLimitInfo.actionLabel}
            />

            {/* Success Snackbar */}
            <SuccessSnackbar {...successSnackbarProps} />

            {/* Error / Info / Warning Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseToast}
                    severity={toast.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 3,
                        fontWeight: 700,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

// src/pages/music/components/ArtistEngagementTabs.jsx
//
// ArtistEngagementTabs — Complete mobile Activity shell for the artist detail panel.
// Matches the structure used by BusinessEngagementTabs and ArtistProfilePage:
//   • Pill tabs: Activity | Events | Jobs | Services
//   • Activity sub-tabs: Posts | Comments | Likes | Reposts
//   • Events sub-tabs: Events | Comments | Likes | Reposts
//   • Full post/job/service/event rendering with proper data fetching

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import ForumIcon from "@mui/icons-material/Forum";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import { useActiveAccount } from "../../../components/AccountContext";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import ActionBar from "../../../components/ActionBar";
import { fetchEvents, formatEventDateTimeCT, formatEventLocation, getEventCategoryLabel } from "../../events/api/eventsApi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    if (isNaN(then.getTime())) return "";
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    return then.toLocaleDateString();
}

function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getServiceCategoryName(slug) {
    const map = {
        cleaning_services: "Cleaning Services", lawn_care: "Lawn Care & Landscaping",
        home_services: "Home Services", automotive: "Automotive", beauty_wellness: "Beauty & Wellness",
        professional_services: "Professional Services", pet_services: "Pet Services",
        tutoring_education: "Tutoring & Education", tech_services: "Tech Services",
        event_services: "Event Services", creative_services: "Creative Services",
        health_wellness: "Health & Wellness", financial_services: "Financial Services",
        legal_services: "Legal Services", real_estate: "Real Estate", food_catering: "Food & Catering",
        music_entertainment: "Music & Entertainment", photography_video: "Photography & Video",
    };
    return map[slug] || String(slug || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArtistEngagementTabs({
                                                 artist, user, posts = [], postsLoading = false,
                                                 onPostClick, onCommentClick, onEventClick,
                                                 activityBarContent, mobileFullscreen = false,
                                             }) {
    const theme = useTheme();
    const { accountCacheKey } = useActiveAccount();

    // Top-level mode
    const [engagementMode, setEngagementMode] = useState("activity");
    // Activity sub-tab: 0=Posts, 1=Comments, 2=Likes, 3=Reposts
    const [subTab, setSubTab] = useState(0);
    // Events sub-tab: 0=Events, 1=Comments, 2=Likes, 3=Reposts
    const [eventSubTab, setEventSubTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchVisible, setSearchVisible] = useState(false);

    // Engagement data
    const [engComments, setEngComments] = useState([]);
    const [engLikes, setEngLikes] = useState([]);
    const [engReposts, setEngReposts] = useState([]);
    const [engLoading, setEngLoading] = useState(false);
    const engLoadedRef = useRef(null);

    // Events
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    // Event engagement
    const [eventEngagementEvents, setEventEngagementEvents] = useState([]);
    const [eventEngagementLoading, setEventEngagementLoading] = useState(false);
    const [eventEngagementComments, setEventEngagementComments] = useState([]);
    const [eventCommentsLoading, setEventCommentsLoading] = useState(false);

    // Jobs
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [hasJobs, setHasJobs] = useState(false);
    // Services
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [hasServices, setHasServices] = useState(false);

    const artistId = artist?.id;
    const ownerId = artist?.owner_user_id || artist?.ownerUserId;
    const artistName = String(artist?.name || "").trim() || "Artist";
    const artistHandle = artist?.handle || "";
    const artistAvatar = artist?.avatar_url || artist?.avatarUrl || artist?.profilePicture || "";

    // ── Fetch post engagement data ──
    useEffect(() => {
        if (!artistId || !ownerId) return;
        if (engLoadedRef.current === artistId) return;
        if (engagementMode !== "activity") return;
        let alive = true;
        (async () => {
            setEngLoading(true);
            try {
                const hdrs = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get(`/api/users/${ownerId}/engagement/posts`, {
                    params: { types: "likes,reposts,comments", limit: 500 },
                    withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const data = res?.data || {};
                const normalize = (arr) => (Array.isArray(arr) ? arr : []).filter(Boolean);
                setEngLikes(normalize(data?.likes).map((p) => ({ ...p, viewerLiked: true })));
                setEngReposts(normalize(data?.reposts).map((p) => ({ ...p, viewerReposted: true })));
                setEngComments(normalize(data?.comments));
                engLoadedRef.current = artistId;
            } catch { /* silent */ } finally { if (alive) setEngLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId, ownerId, engagementMode, accountCacheKey]);

    // ── Fetch events ──
    useEffect(() => {
        if (!artistId) { setEvents([]); return; }
        let alive = true;
        setEventsLoading(true);
        (async () => {
            try {
                const data = await fetchEvents({ artistAccountId: artistId, limit: 50, page: 1, includeTotal: 1, range: "all" });
                if (alive) setEvents(Array.isArray(data?.items) ? data.items : []);
            } catch { if (alive) setEvents([]); }
            finally { if (alive) setEventsLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId]);

    // ── Fetch event engagement likes/reposts ──
    useEffect(() => {
        if (!artistId || engagementMode !== "events" || (eventSubTab !== 2 && eventSubTab !== 3)) return;
        let alive = true;
        setEventEngagementLoading(true);
        (async () => {
            try {
                const engagementType = eventSubTab === 2 ? "like" : "repost";
                const data = await fetchEvents({ sort: "recent", range: "custom", limit: 50, includeStatewide: 1, engagementArtistId: artistId, engagementType });
                if (alive) setEventEngagementEvents(Array.isArray(data?.items) ? data.items : []);
            } catch { if (alive) setEventEngagementEvents([]); }
            finally { if (alive) setEventEngagementLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId, engagementMode, eventSubTab, accountCacheKey]);

    // ── Fetch event comments ──
    useEffect(() => {
        if (!artistId || engagementMode !== "events" || eventSubTab !== 1) return;
        let alive = true;
        setEventCommentsLoading(true);
        (async () => {
            try {
                const res = await axios.get(`/api/events/artist/${artistId}/event-comments`, { withCredentials: true });
                if (alive) setEventEngagementComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
            } catch { if (alive) setEventEngagementComments([]); }
            finally { if (alive) setEventCommentsLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId, engagementMode, eventSubTab]);

    // ── Fetch jobs ──
    useEffect(() => {
        if (!artistId) return;
        let alive = true;
        setJobsLoading(true);
        (async () => {
            try {
                const hdrs = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get("/api/jobs/feed", { params: { posterArtistId: artistId, limit: 200 }, withCredentials: true, headers: { ...hdrs } });
                if (alive) {
                    const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                    setJobs(items); setHasJobs(items.length > 0);
                }
            } catch { if (alive) { setJobs([]); setHasJobs(false); } }
            finally { if (alive) setJobsLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId]);

    // ── Fetch services ──
    useEffect(() => {
        if (!artistId) return;
        let alive = true;
        setServicesLoading(true);
        (async () => {
            try {
                const hdrs = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get("/api/services/feed", { params: { posterArtistId: artistId, limit: 200 }, withCredentials: true, headers: { ...hdrs } });
                if (alive) {
                    const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                    setServices(items); setHasServices(items.length > 0);
                }
            } catch { if (alive) { setServices([]); setHasServices(false); } }
            finally { if (alive) setServicesLoading(false); }
        })();
        return () => { alive = false; };
    }, [artistId]);

    // ── Filter helpers ──
    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;
        const q = searchQuery.toLowerCase();
        return posts.filter((p) => String(p.title || "").toLowerCase().includes(q) || stripHtml(p.body || p.content || "").toLowerCase().includes(q));
    }, [posts, searchQuery]);

    const filteredComments = useMemo(() => {
        if (!searchQuery.trim()) return engComments;
        const q = searchQuery.toLowerCase();
        return engComments.filter((c) => String(c.body || c.comment || "").toLowerCase().includes(q));
    }, [engComments, searchQuery]);

    const filteredLikes = useMemo(() => {
        if (!searchQuery.trim()) return engLikes;
        const q = searchQuery.toLowerCase();
        return engLikes.filter((p) => String(p.title || "").toLowerCase().includes(q) || stripHtml(p.body || p.content || "").toLowerCase().includes(q));
    }, [engLikes, searchQuery]);

    const filteredReposts = useMemo(() => {
        if (!searchQuery.trim()) return engReposts;
        const q = searchQuery.toLowerCase();
        return engReposts.filter((p) => String(p.title || "").toLowerCase().includes(q) || stripHtml(p.body || p.content || "").toLowerCase().includes(q));
    }, [engReposts, searchQuery]);

    // ── Render post card ──
    const renderPostCard = useCallback((post, idx) => {
        const isPinned = Boolean(post.isPinned || post.is_pinned);
        const body = stripHtml(post.body || post.content || "");
        const truncatedBody = body.length > 180 ? `${body.slice(0, 180).trimEnd()}…` : body;
        let photos = [];
        if (post.mediaUrl) { try { const p = JSON.parse(post.mediaUrl); photos = Array.isArray(p) ? p : [post.mediaUrl]; } catch { photos = [post.mediaUrl]; } }
        photos = photos.filter((u) => u && typeof u === "string");
        const mainPhoto = photos[0] || "";
        const showImage = Boolean(mainPhoto);
        const postName = post.artistName || post.pageName || post.authorName || artistName;
        const postAvatar = post.artistAvatarUrl || post.pageAvatar || post.avatar_url || artistAvatar;
        const postHandle = post.artistHandle || post.authorHandle || artistHandle;
        const timestamp = post.createdAt || post.created_at || post.publishedAt || "";

        return (
            <Box key={post.id || post.post_id || idx} sx={{ py: 1.5, px: 1.5, cursor: "pointer", transition: "background-color 0.15s", "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <Avatar src={postAvatar || undefined} sx={(t) => ({ width: 40, height: 40, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "2px solid", borderColor: alpha(t.palette.text.primary, 0.06), "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" } })} imgProps={{ referrerPolicy: "no-referrer" }}><MusicNoteRoundedIcon sx={{ fontSize: 20 }} /></Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center"><Typography sx={{ fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.3 }} noWrap>{postName}</Typography>{postHandle && <Typography noWrap sx={{ fontSize: "0.68rem", color: "text.secondary" }}>@{postHandle}</Typography>}</Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", lineHeight: 1.2, mt: 0.1, display: "block" }}>{formatRelativeTime(timestamp)}{(post.isEdited || post.is_edited) && <Typography component="span" sx={{ ml: 0.5, fontStyle: "italic", fontSize: "0.68rem", color: "text.secondary" }}>(Edited)</Typography>}</Typography>
                    </Box>
                    {isPinned && <Chip icon={<PushPinRoundedIcon sx={{ fontSize: 10, transform: "rotate(45deg)" }} />} label="Pinned" size="small" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 20, bgcolor: (t) => alpha(t.palette.warning.main, 0.10), border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`, color: "warning.dark", "& .MuiChip-icon": { color: "warning.dark" }, flexShrink: 0 }} />}
                </Stack>
                <Box onClick={() => onPostClick?.(post)} sx={{ display: "flex", gap: showImage ? 1.5 : 0, mb: 0.5 }}>
                    {showImage && (<Box sx={{ position: "relative", flexShrink: 0, width: { xs: 100, sm: 110 }, height: { xs: 100, sm: 110 } }}><Box component="img" src={mainPhoto} loading="lazy" alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", border: "1px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.08), display: "block" }} />{photos.length > 1 && <Box sx={{ position: "absolute", left: "50%", bottom: 5, transform: "translateX(-50%)", px: 0.8, py: 0.15, borderRadius: 999, bgcolor: (t) => alpha(t.palette.text.primary, 0.7), fontSize: "0.65rem", fontWeight: 700, color: "common.white", lineHeight: 1.2 }}>+{photos.length - 1} more</Box>}</Box>)}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {post.title && <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.3, wordBreak: "break-word", mb: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</Typography>}
                        {truncatedBody && <Typography color="text.secondary" sx={{ fontSize: "0.8rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: showImage ? 3 : 4, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{truncatedBody}</Typography>}
                    </Box>
                </Box>
                <Box sx={{ pt: 0.5 }}><ActionBar user={user} postId={post.post_id || post.id} post={{ ...post, artist_id: artist?.id }} initialLikes={post.likeCount || post.like_count || 0} initialComments={post.commentCount || post.comment_count || 0} initialReposts={post.repostCount || post.repost_count || 0} initialViewerLiked={Boolean(post.viewerLiked || post.viewer_liked)} initialViewerReposted={Boolean(post.viewerReposted || post.viewer_reposted)} onCommentClick={() => onPostClick?.(post)} onShareClick={() => {}} compact /></Box>
            </Box>
        );
    }, [artistName, artistAvatar, artistHandle, artist?.id, user, onPostClick]);

    // ── Render grouped comments (matching ProfileEngagementTabs / UserProfilePage style) ──
    const renderGroupedComments = useCallback((comments) => {
        // Group comments by post
        const groupMap = new Map();
        const groupOrder = [];
        const arr = Array.isArray(comments) ? comments : [];
        arr.forEach((c) => {
            const pid = Number(c?.postId || c?.post_id || 0);
            if (!Number.isFinite(pid) || pid <= 0) return;
            if (!groupMap.has(pid)) {
                const g = { post_id: pid, comments: [], postTitle: c.postTitle || c.post_title || "", postAuthor: c.postAuthorName || c.pageName || c.authorName || "", postAvatar: c.postAvatarUrl || c.pageAvatar || "", postHandle: c.postAuthorHandle || c.authorHandle || "", postType: c.postType || "artist" };
                groupMap.set(pid, g);
                groupOrder.push(g);
            }
            groupMap.get(pid).comments.push(c);
        });

        if (!groupOrder.length) return null;

        const truncate = (t, n) => {
            const s0 = String(t || "").trim();
            if (!s0) return "";
            return s0.length > n ? `${s0.slice(0, n)}…` : s0;
        };

        return (
            <Box sx={{ display: "grid", gap: { xs: 1.25, sm: 2 }, p: { xs: 1, sm: 2 } }}>
                {groupOrder.map((g) => {
                    const cmts = g.comments;
                    const total = cmts.length;
                    const latest = cmts[0] || null;
                    const postTitle = g.postTitle || "Post";
                    const postAuthorName = g.postAuthor || (g.postHandle ? `@${g.postHandle}` : "Someone");
                    const postAuthorAvatar = g.postAvatar;
                    const postHandleDisplay = g.postHandle ? `@${g.postHandle.replace(/^@/, "")}` : "";
                    const pType = String(g.postType || "").toLowerCase();

                    return (
                        <Box
                            key={`comment-group-${g.post_id}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                if (onCommentClick && latest?.postId) onCommentClick({ id: latest.postId, ...latest }, latest.id || latest.comment_id);
                                else if (onPostClick && latest?.postId) onPostClick({ id: latest.postId, ...latest });
                            }}
                            sx={(t) => ({
                                border: "1px solid",
                                borderColor: alpha(t.palette.text.primary, 0.10),
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                overflow: "hidden",
                                cursor: "pointer",
                                boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                "&:hover": { borderColor: t.palette.primary.main },
                            })}
                        >
                            {/* Post header with gradient */}
                            <Box
                                sx={(t) => ({
                                    px: { xs: 1.25, sm: 1.5 },
                                    py: { xs: 0.75, sm: 1 },
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: { xs: 0.75, sm: 1 },
                                    background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || "#A87822", 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                })}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.25 }, minWidth: 0, flex: 1, overflow: "hidden" }}>
                                    <Avatar
                                        src={postAuthorAvatar || undefined}
                                        alt={postAuthorName}
                                        sx={(t) => ({
                                            width: { xs: 32, sm: 38 },
                                            height: { xs: 32, sm: 38 },
                                            flexShrink: 0,
                                            ...(!postAuthorAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.10), color: t.palette.primary.main } : {}),
                                        })}
                                        imgProps={{ referrerPolicy: "no-referrer" }}
                                    >
                                        {!postAuthorAvatar && pType === "business" && <StorefrontOutlinedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                        {!postAuthorAvatar && pType === "artist" && <MusicNoteRoundedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                        {!postAuthorAvatar && pType !== "business" && pType !== "artist" && <PersonRoundedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: { xs: "0.85rem", sm: "1rem" }, lineHeight: 1.2 }} noWrap title={postTitle}>
                                            {postTitle}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.3, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                                            {postAuthorName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "flex", alignItems: "center", gap: 0.3, fontSize: { xs: "0.65rem", sm: "0.72rem" } }}>
                                            {postHandleDisplay}
                                            {latest?.created_at || latest?.createdAt ? `${postHandleDisplay ? " • " : ""}${formatRelativeTime(latest.created_at || latest.createdAt)}` : ""}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={(t) => ({
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.4,
                                    px: { xs: 0.75, sm: 1.1 },
                                    py: { xs: 0.3, sm: 0.4 },
                                    borderRadius: 999,
                                    flexShrink: 0,
                                    border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                    bgcolor: alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.12 : 0.06),
                                })}>
                                    <ChatBubbleOutlineIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: "primary.main" }} />
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: "0.68rem", sm: "0.75rem" }, color: "primary.main" }}>
                                        {total} {total === 1 ? "comment" : "comments"}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Comment bubbles */}
                            <Box sx={{ p: { xs: 1, sm: 1.5 }, display: "flex", flexDirection: "column", gap: 1 }}>
                                {cmts.map((c) => {
                                    const cText = String(c?.body || c?.comment || c?.content || "");
                                    const cTime = c?.created_at || c?.createdAt || c?.commentedAt || null;
                                    const commenterName = c.commenterName || artistName;
                                    const commenterAvatar = c.commenterAvatarUrl || artistAvatar;
                                    const commenterHandle = c.commenterHandle || artistHandle;
                                    const isReply = Boolean(c?.parent_id);

                                    return (
                                        <Box
                                            key={`comment-${c?.id || c?.comment_id || ""}`}
                                            sx={(t) => ({
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                borderRadius: 2,
                                                px: { xs: 1, sm: 1.25 },
                                                py: { xs: 0.75, sm: 1 },
                                                bgcolor: alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.06 : 0.02),
                                                "&:hover": { borderColor: alpha(t.palette.primary.main, 0.32) },
                                            })}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: { xs: 0.5, sm: 1 } }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
                                                    <Avatar
                                                        src={commenterAvatar || undefined}
                                                        alt={commenterName}
                                                        sx={(t) => ({
                                                            width: { xs: 28, sm: 34 },
                                                            height: { xs: 28, sm: 34 },
                                                            ...(!commenterAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.10), color: t.palette.primary.main } : {}),
                                                        })}
                                                        imgProps={{ referrerPolicy: "no-referrer" }}
                                                    >
                                                        <MusicNoteRoundedIcon sx={{ fontSize: 20 }} />
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1, fontSize: { xs: "0.8rem", sm: "0.875rem" } }} noWrap title={commenterName}>
                                                            {commenterName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {commenterHandle ? `@${commenterHandle.replace(/^@/, "")}` : ""}
                                                            {isReply ? " • Reply" : ""}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                                    {cTime ? formatRelativeTime(cTime) : ""}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" }, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                                {truncate(cText, 260)}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    }, [artistName, artistAvatar, artistHandle, onPostClick, onCommentClick]);

    // ── Render like/repost row ──
    const renderLikeRepostRow = useCallback((post, idx, type) => {
        const body = stripHtml(post.body || post.content || "");
        const truncBody = body.length > 160 ? `${body.slice(0, 160).trimEnd()}…` : body;
        const timestamp = post.createdAt || post.created_at || "";
        const postAuthor = post.artistName || post.pageName || post.authorName || post.author || "";
        const postAvatar = post.artistAvatarUrl || post.pageAvatar || post.avatar_url || "";
        const postHandle = post.authorHandle || post.artistHandle || "";
        let photos = [];
        if (post.mediaUrl) { try { const p = JSON.parse(post.mediaUrl); photos = Array.isArray(p) ? p : [post.mediaUrl]; } catch { photos = [post.mediaUrl]; } }
        photos = photos.filter((u) => u && typeof u === "string");
        const mainPhoto = photos[0] || "";

        return (
            <Box key={post.id || post.post_id || idx} onClick={() => onPostClick?.(post)} sx={{ py: 1.5, px: 1.5, cursor: "pointer", "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) } }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.75 }}>
                    {type === "like" ? <FavoriteIcon sx={{ fontSize: 14, color: "error.main" }} /> : <RepeatIcon sx={{ fontSize: 14, color: "success.main" }} />}
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: type === "like" ? "error.main" : "success.main" }}>{artistName} {type === "like" ? "liked" : "reposted"}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Avatar src={postAvatar || undefined} sx={(t) => ({ width: 36, height: 36, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })} imgProps={{ referrerPolicy: "no-referrer" }}><MusicNoteRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">{postAuthor && <Typography sx={{ fontWeight: 700, fontSize: "0.78rem" }} noWrap>{postAuthor}</Typography>}{postHandle && <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }} noWrap>@{postHandle}</Typography>}</Stack>
                        {post.title && <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mt: 0.15, lineHeight: 1.3 }}>{post.title}</Typography>}
                        {truncBody && <Typography color="text.secondary" sx={{ fontSize: "0.78rem", lineHeight: 1.45, mt: 0.25 }}>{truncBody}</Typography>}
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: "block", fontSize: "0.65rem" }}>{formatRelativeTime(timestamp)}</Typography>
                    </Box>
                    {mainPhoto && <Box component="img" src={mainPhoto} sx={{ width: 64, height: 64, borderRadius: 2, objectFit: "cover", flexShrink: 0, border: "1px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.08) }} />}
                </Stack>
            </Box>
        );
    }, [artistName, onPostClick]);

    // ── Render event row ──
    const renderEventRow = useCallback((evt, idx) => {
        const evtTitle = evt.title || evt.name || "Untitled Event";
        const evtDate = formatEventDateTimeCT ? formatEventDateTimeCT(evt) : "";
        const evtLocation = formatEventLocation ? formatEventLocation(evt) : "";
        const evtPhoto = evt?.mainPhotoUrl || evt?.coverPhoto || evt?.image_url || "";
        return (
            <Box key={evt.id || idx} onClick={() => onEventClick?.(evt)} sx={{ py: 1.5, px: 1.5, cursor: "pointer", transition: "background-color 0.15s", "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) } }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Box sx={(t) => ({ width: 72, height: 72, borderRadius: 2, flexShrink: 0, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", justifyContent: "center" })}>
                        {evtPhoto ? <Box component="img" src={evtPhoto} sx={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} /> : <CalendarTodayRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evtTitle}</Typography>
                        {evtDate && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25, fontWeight: 600 }}>{evtDate}</Typography>}
                        {evtLocation && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.15 }}>{evtLocation}</Typography>}
                    </Box>
                </Box>
            </Box>
        );
    }, [onEventClick]);

    // ── Render job row ──
    const renderJobRow = useCallback((job, idx) => {
        const title = job.title || "Untitled Job";
        const category = job.category || job.job_category || "";
        const catLabel = category ? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
        const location = [job.city, job.county].filter(Boolean).join(", ") || (job.isStatewide ? "Alabama (Statewide)" : "");
        const timestamp = job.created_at || job.date_created || job.posted_at || "";
        const desc = stripHtml(job.description || job.body || "");
        const truncDesc = desc.length > 120 ? `${desc.slice(0, 120).trimEnd()}…` : desc;
        const pay = job.pay_range || job.payRange || job.salary || "";

        return (
            <Box key={job.id || idx} sx={(t) => ({ py: 1.5, px: 1.5, cursor: "pointer", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.025) } })}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={(t) => ({ width: 52, height: 52, borderRadius: 2, flexShrink: 0, bgcolor: alpha(t.palette.primary.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", justifyContent: "center" })}>
                        <WorkOutlineRoundedIcon sx={{ fontSize: 24, color: "primary.main" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3 }} noWrap>{title}</Typography>
                        {catLabel && <Chip label={catLabel} size="small" sx={(t) => ({ mt: 0.35, height: 20, fontWeight: 700, fontSize: "0.62rem", bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.16) })} />}
                        {truncDesc && <Typography color="text.secondary" sx={{ fontSize: "0.75rem", lineHeight: 1.4, mt: 0.35 }}>{truncDesc}</Typography>}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.35 }}>
                            {location && <Stack direction="row" spacing={0.3} alignItems="center"><LocationOnRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} /><Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{location}</Typography></Stack>}
                            {pay && <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "primary.main" }}>{pay}</Typography>}
                            {timestamp && <Typography sx={{ fontSize: "0.65rem", color: "text.disabled" }}>{formatRelativeTime(timestamp)}</Typography>}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        );
    }, []);

    // ── Render service row ──
    const renderServiceRow = useCallback((svc, idx) => {
        const title = svc.title || svc.name || "Untitled Service";
        const catSlug = svc.categorySlug || svc.category_slug || "";
        const catName = catSlug ? getServiceCategoryName(catSlug) : (svc.categoryName || "");
        const location = [svc.city, svc.county].filter(Boolean).join(", ") || (svc.isStatewide || svc.is_statewide ? "Alabama (Statewide)" : "");
        const desc = stripHtml(svc.description || svc.body || "");
        const truncDesc = desc.length > 120 ? `${desc.slice(0, 120).trimEnd()}…` : desc;
        const rating = svc.averageRating || svc.average_rating || 0;
        const reviewCount = svc.reviewCount || svc.review_count || 0;
        const photo = svc.mainPhotoUrl || svc.photo_url || svc.coverPhoto || "";

        return (
            <Box key={svc.id || idx} sx={(t) => ({ py: 1.5, px: 1.5, cursor: "pointer", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.025) } })}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={(t) => ({ width: 52, height: 52, borderRadius: 2, flexShrink: 0, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", justifyContent: "center" })}>
                        {photo ? <Box component="img" src={photo} sx={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} /> : <BusinessCenterIcon sx={{ fontSize: 24, color: "primary.main" }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3 }} noWrap>{title}</Typography>
                        {catName && <Chip label={catName} size="small" sx={(t) => ({ mt: 0.35, height: 20, fontWeight: 700, fontSize: "0.62rem", bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.16) })} />}
                        {truncDesc && <Typography color="text.secondary" sx={{ fontSize: "0.75rem", lineHeight: 1.4, mt: 0.35 }}>{truncDesc}</Typography>}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.35 }}>
                            {location && <Stack direction="row" spacing={0.3} alignItems="center"><LocationOnRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} /><Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{location}</Typography></Stack>}
                            {rating > 0 && <Stack direction="row" spacing={0.2} alignItems="center"><StarRoundedIcon sx={{ fontSize: 13, color: "warning.main" }} /><Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.primary" }}>{Number(rating).toFixed(1)}</Typography>{reviewCount > 0 && <Typography sx={{ fontSize: "0.62rem", color: "text.secondary" }}>({reviewCount})</Typography>}</Stack>}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        );
    }, []);

    // ── Render event comment group ──
    const renderEventCommentGroup = useCallback((group, idx) => {
        const ev = group?.event || {};
        const comments = Array.isArray(group?.comments) ? group.comments : [];
        if (comments.length === 0) return null;
        const evPhoto = String(ev?.mainPhotoUrl || ev?.image_url || ev?.photoUrl || "").trim();
        const latest = comments[0] || null;
        return (
            <Box key={`ec-${ev.id || idx}`} sx={(t) => ({ border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.10), borderRadius: 2, bgcolor: "background.paper", overflow: "hidden", cursor: "pointer", "&:hover": { borderColor: t.palette.primary.main } })} onClick={() => onEventClick?.(ev)}>
                <Box sx={(t) => ({ px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, bgcolor: alpha(t.palette.primary.main, 0.04) })}>
                    {evPhoto ? <Avatar src={evPhoto} sx={{ width: 34, height: 34 }} /> : <Avatar sx={(t) => ({ width: 34, height: 34, bgcolor: alpha(t.palette.primary.main, 0.12) })}><EventRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /></Avatar>}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: "0.82rem" }} noWrap>{String(ev?.title || "Event").trim()}</Typography>
                        <Typography variant="caption" color="text.secondary">{(ev?.start_date || ev?.startDate) ? formatEventDateTimeCT(ev) : (latest?.created_at ? formatRelativeTime(latest.created_at) : "")}</Typography>
                    </Box>
                    <Chip label={`${comments.length} comment${comments.length !== 1 ? "s" : ""}`} size="small" sx={{ fontWeight: 700, fontSize: "0.62rem", height: 22, borderRadius: 999 }} />
                </Box>
                <Box sx={{ px: 1.5, py: 1 }}>
                    {comments.slice(0, 2).map((c) => {
                        const cText = String(c?.content || c?.body || "").trim();
                        const cName = c?.account_name || c?.user_name || c?.commenter_name || artistName;
                        return (
                            <Box key={c?.id || c?.comment_id} sx={(t) => ({ py: 0.75, borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`, "&:last-of-type": { borderBottom: "none" } })}>
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.15 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.72rem" }}>{cName}</Typography>
                                    <Typography sx={{ fontSize: "0.62rem", color: "text.disabled" }}>{c?.created_at ? formatRelativeTime(c.created_at) : ""}</Typography>
                                </Stack>
                                <Typography sx={{ fontSize: "0.78rem", color: "text.primary", lineHeight: 1.4 }}>{cText.length > 180 ? `${cText.slice(0, 180)}…` : cText}</Typography>
                            </Box>
                        );
                    })}
                    {comments.length > 2 && <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", cursor: "pointer", mt: 0.5, display: "block" }}>View all {comments.length} comments</Typography>}
                </Box>
            </Box>
        );
    }, [artistName, onEventClick]);

    // ── Computed values ──
    const currentItems = useMemo(() => {
        if (subTab === 0) return filteredPosts;
        if (subTab === 1) return filteredComments;
        if (subTab === 2) return filteredLikes;
        return filteredReposts;
    }, [subTab, filteredPosts, filteredComments, filteredLikes, filteredReposts]);

    const isLoading = engagementMode === "activity" ? (subTab === 0 ? postsLoading : engLoading)
        : engagementMode === "events" ? (eventSubTab === 0 ? eventsLoading : eventSubTab === 1 ? eventCommentsLoading : eventEngagementLoading)
            : engagementMode === "jobs" ? jobsLoading : servicesLoading;

    const pillTabs = useMemo(() => {
        const tabs = [
            { key: "activity", label: "Activity", icon: <ArticleRoundedIcon /> },
            { key: "events", label: "Events", icon: <EventRoundedIcon /> },
        ];
        if (hasJobs) tabs.push({ key: "jobs", label: "Jobs", icon: <WorkOutlineRoundedIcon /> });
        if (hasServices) tabs.push({ key: "services", label: "Services", icon: <BusinessCenterIcon /> });
        return tabs;
    }, [hasJobs, hasServices]);

    // ── Sub-tabs renderer (shared between activity and events) ──
    const renderSubTabs = (items, activeIdx, setActiveIdx, showSearch) => (
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                {items.map((sub) => {
                    const isActive = activeIdx === sub.idx;
                    return (
                        <Box key={sub.idx} onClick={() => setActiveIdx(sub.idx)} sx={(t) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.4, flex: 1, py: 1, cursor: "pointer", borderBottom: "2px solid", borderColor: isActive ? t.palette.secondary.main : "transparent", color: isActive ? "secondary.main" : "text.disabled", transition: "color 150ms ease, border-color 150ms ease", "&:hover": { color: isActive ? "secondary.main" : "text.secondary" } })}>
                            {React.cloneElement(sub.icon, { sx: { fontSize: 18 } })}
                            {sub.count > 0 && <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, lineHeight: 1 }}>{sub.count}</Typography>}
                        </Box>
                    );
                })}
                {showSearch && (
                    <Box onClick={() => setSearchVisible((v) => !v)} sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 1, py: 1, cursor: "pointer", color: searchVisible ? "primary.main" : "text.disabled", "&:hover": { color: "text.secondary" } }}>
                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                )}
            </Stack>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {activityBarContent}

            {/* ═══ Pill Tabs ═══ */}
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction="row" spacing={0} alignItems="stretch" justifyContent="center" sx={{ px: 0.5, py: 0.5 }}>
                    {pillTabs.map((tab) => {
                        const isActive = engagementMode === tab.key;
                        return (
                            <Box key={tab.key} onClick={() => { setEngagementMode(tab.key); setSearchQuery(""); setSearchVisible(false); }}
                                 sx={(t) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, py: 0.6, cursor: "pointer", mx: 0.25, borderRadius: 999, backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : "transparent", border: "1px solid", borderColor: isActive ? alpha(t.palette.primary.main, 0.2) : "transparent", color: isActive ? t.palette.primary.main : t.palette.text.secondary, transition: `all ${t.custom?.motion?.base || 200}ms ease`, "&:hover": { backgroundColor: isActive ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04), color: isActive ? t.palette.primary.main : t.palette.text.primary } })}>
                                {React.cloneElement(tab.icon, { sx: { fontSize: 18, opacity: isActive ? 1 : 0.72 } })}
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: isActive ? 900 : 700, lineHeight: 1, mt: 0.25, whiteSpace: "nowrap" }}>{tab.label}</Typography>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* ═══ Activity sub-tabs ═══ */}
            {engagementMode === "activity" && renderSubTabs(
                [{ count: filteredPosts.length, icon: <ForumIcon />, idx: 0 }, { count: filteredComments.length, icon: <ChatBubbleOutlineIcon />, idx: 1 }, { count: filteredLikes.length, icon: <FavoriteIcon />, idx: 2 }, { count: filteredReposts.length, icon: <RepeatIcon />, idx: 3 }],
                subTab, setSubTab, true
            )}

            {/* ═══ Events sub-tabs ═══ */}
            {engagementMode === "events" && renderSubTabs(
                [{ count: events.length, icon: <EventRoundedIcon />, idx: 0 }, { count: eventEngagementComments.length, icon: <ChatBubbleOutlineIcon />, idx: 1 }, { count: eventEngagementEvents.length || 0, icon: <FavoriteIcon />, idx: 2 }, { count: 0, icon: <RepeatIcon />, idx: 3 }],
                eventSubTab, setEventSubTab, false
            )}

            {/* Search bar */}
            <Collapse in={searchVisible && engagementMode === "activity"}>
                <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <TextField size="small" fullWidth placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                               InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>, endAdornment: searchQuery ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><CloseRoundedIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null }}
                               sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }} />
                </Box>
            </Collapse>

            {/* ═══ Scrollable content ═══ */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
                {/* ACTIVITY */}
                {engagementMode === "activity" && (
                    isLoading ? <LoadingSkeleton /> : currentItems.length > 0 ? (
                        subTab === 1 ? (
                            renderGroupedComments(currentItems)
                        ) : (
                            <Stack spacing={0} divider={<Divider />}>
                                {currentItems.map((item, idx) => subTab === 0 ? renderPostCard(item, idx) : subTab === 2 ? renderLikeRepostRow(item, idx, "like") : renderLikeRepostRow(item, idx, "repost"))}
                            </Stack>
                        )
                    ) : <EmptyState icon={<ArticleRoundedIcon />} message={subTab === 0 ? "No posts yet" : subTab === 1 ? "No comments yet" : subTab === 2 ? "No liked posts yet" : "No reposts yet"} />
                )}

                {/* EVENTS */}
                {engagementMode === "events" && (
                    isLoading ? <LoadingSkeleton /> :
                        eventSubTab === 0 ? (events.length > 0 ? <Stack spacing={0} divider={<Divider />}>{events.map((evt, idx) => renderEventRow(evt, idx))}</Stack> : <EmptyState icon={<EventRoundedIcon />} message="No events yet" />) :
                            eventSubTab === 1 ? (eventEngagementComments.length > 0 ? <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>{eventEngagementComments.map((group, idx) => renderEventCommentGroup(group, idx))}</Box> : <EmptyState icon={<ChatBubbleOutlineIcon />} message="No event comments yet" />) :
                                (eventEngagementEvents.length > 0 ? <Stack spacing={0} divider={<Divider />}>{eventEngagementEvents.map((evt, idx) => renderEventRow(evt, idx))}</Stack> : <EmptyState icon={eventSubTab === 2 ? <FavoriteIcon /> : <RepeatIcon />} message={eventSubTab === 2 ? "No liked events yet" : "No reposted events yet"} />)
                )}

                {/* JOBS */}
                {engagementMode === "jobs" && (
                    jobsLoading ? <LoadingSkeleton /> : jobs.length > 0 ? (
                        <Stack spacing={0} divider={<Divider />}>{jobs.map((job, idx) => renderJobRow(job, idx))}</Stack>
                    ) : <EmptyState icon={<WorkOutlineRoundedIcon />} message="No job listings yet" />
                )}

                {/* SERVICES */}
                {engagementMode === "services" && (
                    servicesLoading ? <LoadingSkeleton /> : services.length > 0 ? (
                        <Stack spacing={0} divider={<Divider />}>{services.map((svc, idx) => renderServiceRow(svc, idx))}</Stack>
                    ) : <EmptyState icon={<BusinessCenterIcon />} message="No services yet" />
                )}
            </Box>
        </Box>
    );
}

// ── Shared sub-components ──

function LoadingSkeleton() {
    return (
        <Stack spacing={0} divider={<Divider />}>
            {[0, 1, 2, 3].map((i) => (
                <Box key={i} sx={{ py: 1.5, px: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                        <Box sx={{ flex: 1 }}><Skeleton width="50%" height={14} animation="wave" /><Skeleton width="30%" height={12} animation="wave" sx={{ mt: 0.25 }} /></Box>
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Skeleton variant="rounded" width={100} height={100} sx={{ borderRadius: "10px", flexShrink: 0 }} animation="wave" />
                        <Box sx={{ flex: 1 }}><Skeleton width="80%" height={16} animation="wave" /><Skeleton width="100%" height={12} animation="wave" sx={{ mt: 0.5 }} /><Skeleton width="60%" height={12} animation="wave" sx={{ mt: 0.25 }} /></Box>
                    </Box>
                </Box>
            ))}
        </Stack>
    );
}

function EmptyState({ icon, message }) {
    return (
        <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
            {React.cloneElement(icon, { sx: { fontSize: 48, color: "text.disabled", mb: 1 } })}
            <Typography variant="body2" color="text.secondary">{message}</Typography>
        </Box>
    );
}

/**
 * src/pages/community/groups/admin/components/GroupAdminReportedPostsSection.jsx
 *
 * Displays reported posts and comments within a group for admin moderation.
 * Actions: Dismiss reports, Delete post/comment, Ban author from group.
 */

import React, { useCallback, useEffect, useState } from "react";
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
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ReportIcon from "@mui/icons-material/Report";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/Person";
import TimerIcon from "@mui/icons-material/Timer";

import {
    adminFetchReportedPosts,
    adminDismissPostReports,
    adminDismissCommentReports,
    adminDeleteGroupPost,
    adminDeleteGroupComment,
    adminModerateMember,
} from "../../../hooks/useGroupsData";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatAuthorName(item) {
    const first = item?.author_first_name || "";
    const last = item?.author_last_name || "";
    const full = `${first} ${last}`.trim();
    return full || item?.author_handle || "Unknown";
}

function formatReporterName(flag) {
    const first = flag?.reporter_first_name || "";
    const last = flag?.reporter_last_name || "";
    const full = `${first} ${last}`.trim();
    return full || flag?.reporter_handle || "Unknown";
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

const REASON_LABELS = {
    spam: "Spam",
    harassment: "Harassment",
    hate: "Hate speech",
    hate_speech: "Hate speech",
    violence: "Violence",
    inappropriate: "Inappropriate",
    impersonation: "Impersonation",
    misinformation: "Misinformation",
    nudity: "Nudity",
    self_harm: "Self-harm",
    other: "Other",
};

function reasonLabel(reason) {
    const key = String(reason || "").toLowerCase().trim();
    return REASON_LABELS[key] || reason || "Reported";
}

const REASON_COLORS = {
    spam: "default",
    harassment: "error",
    hate: "error",
    hate_speech: "error",
    violence: "error",
    inappropriate: "warning",
    impersonation: "warning",
    misinformation: "warning",
    nudity: "warning",
    self_harm: "error",
    other: "default",
};

function reasonColor(reason) {
    const key = String(reason || "").toLowerCase().trim();
    return REASON_COLORS[key] || "default";
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FlagsList({ flags }) {
    if (!flags || flags.length === 0) return null;

    return (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
            {flags.map((flag) => (
                <Stack
                    key={flag.flag_id}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{
                        py: 0.75,
                        px: 1.25,
                        borderRadius: 2,
                        bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
                        border: "1px solid",
                        borderColor: (t) => alpha(t.palette.warning.main, 0.15),
                    }}
                >
                    <Avatar
                        src={flag.reporter_avatar_url || undefined}
                        sx={{ width: 26, height: 26, mt: 0.25 }}
                    >
                        <PersonIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>
                                {formatReporterName(flag)}
                            </Typography>
                            {flag.reporter_handle && (
                                <Typography sx={{ fontSize: 11.5, opacity: 0.5, fontWeight: 700 }}>
                                    @{String(flag.reporter_handle).replace(/^@+/, "")}
                                </Typography>
                            )}
                            <Chip
                                label={reasonLabel(flag.reason)}
                                size="small"
                                color={reasonColor(flag.reason)}
                                sx={{ height: 20, fontSize: 10.5, fontWeight: 800 }}
                            />
                            <Typography sx={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>
                                {timeAgo(flag.created_at)}
                            </Typography>
                        </Stack>
                        {flag.details && (
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    opacity: 0.8,
                                    fontWeight: 600,
                                    mt: 0.25,
                                    lineHeight: 1.4,
                                    wordBreak: "break-word",
                                }}
                            >
                                {flag.details}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            ))}
        </Stack>
    );
}

function ReportedPostCard({ item, onDismiss, onDelete, onBan, onTimeout, busy }) {
    const [expanded, setExpanded] = useState(false);
    const post = item.post || {};
    const flags = item.flags || [];
    const flagCount = item.flagCount || flags.length;

    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.error.main, 0.18),
                bgcolor: alpha(t.palette.error.main, 0.02),
                overflow: "hidden",
                transition: "box-shadow 150ms ease",
                "&:hover": {
                    boxShadow: `0 4px 16px ${alpha(t.palette.error.main, 0.08)}`,
                },
            })}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {/* Header: author + flag badge */}
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar
                        src={post.author_avatar_url || undefined}
                        sx={{ width: 38, height: 38 }}
                    >
                        {(post.author_first_name || "?")[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography sx={{ fontWeight: 850, fontSize: 14 }} noWrap>
                                {formatAuthorName(post)}
                            </Typography>
                            {post.author_handle && (
                                <Typography sx={{ fontSize: 12, opacity: 0.55, fontWeight: 700 }} noWrap>
                                    @{post.author_handle}
                                </Typography>
                            )}
                        </Stack>
                        <Typography sx={{ fontSize: 11.5, opacity: 0.5, fontWeight: 700 }}>
                            {timeAgo(post.date_created)}
                        </Typography>
                    </Box>
                    <ReportIcon color="error" fontSize="small" />
                </Stack>

                {/* Post content preview */}
                <Box sx={{ mt: 1.25 }}>
                    {post.title && (
                        <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.25 }}>
                            {post.title}
                        </Typography>
                    )}
                    {post.description && (
                        <Typography
                            sx={{
                                fontSize: 13,
                                opacity: 0.8,
                                fontWeight: 600,
                                lineHeight: 1.45,
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: expanded ? 999 : 3,
                                overflow: "hidden",
                                wordBreak: "break-word",
                            }}
                        >
                            {post.description}
                        </Typography>
                    )}
                    {post.image_url && (
                        <Box
                            component="img"
                            src={post.image_url}
                            alt=""
                            sx={{
                                mt: 1,
                                borderRadius: 2,
                                maxWidth: "100%",
                                maxHeight: 180,
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    )}
                </Box>

                {/* Expand to see reports */}
                <Button
                    size="small"
                    onClick={() => setExpanded((v) => !v)}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{
                        mt: 1,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: 12,
                        color: "error.main",
                        px: 1,
                    }}
                >
                    {flagCount} report{flagCount !== 1 ? "s" : ""}
                </Button>

                <Collapse in={expanded}>
                    <FlagsList flags={flags} />
                </Collapse>

                {/* Actions */}
                <Divider sx={{ mt: 1.5, mb: 1 }} />
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ rowGap: 0.75 }}
                >
                    <Tooltip title="Dismiss all reports for this post (keep the post)">
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircleOutlineIcon />}
                                onClick={() => onDismiss(post.id)}
                                disabled={busy}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    fontSize: 12,
                                }}
                            >
                                Dismiss
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Delete this post permanently">
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => onDelete(post.id)}
                                disabled={busy}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    fontSize: 12,
                                }}
                            >
                                Delete Post
                            </Button>
                        </span>
                    </Tooltip>
                    {post.user_id && (
                        <Tooltip title="Ban the author from this group">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<BlockIcon />}
                                    onClick={() => onBan(post.user_id, formatAuthorName(post))}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Ban Author
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    {post.user_id && (
                        <Tooltip title="Timeout the author">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<TimerIcon />}
                                    onClick={() => onTimeout(post.user_id, formatAuthorName(post))}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Timeout
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
}

function ReportedCommentCard({ item, onDismiss, onDelete, onBan, onTimeout, busy }) {
    const [expanded, setExpanded] = useState(false);
    const comment = item.comment || {};
    const post = item.post || {};
    const flags = item.flags || [];
    const flagCount = item.flagCount || flags.length;

    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.warning.main, 0.2),
                bgcolor: alpha(t.palette.warning.main, 0.02),
                overflow: "hidden",
                transition: "box-shadow 150ms ease",
                "&:hover": {
                    boxShadow: `0 4px 16px ${alpha(t.palette.warning.main, 0.08)}`,
                },
            })}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {/* "On post: ..." context */}
                {post.title && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                        <ArticleOutlinedIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: 11.5, opacity: 0.55, fontWeight: 700 }} noWrap>
                            On post: {post.title}
                        </Typography>
                    </Stack>
                )}

                {/* Header: author + flag badge */}
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar
                        src={comment.author_avatar_url || undefined}
                        sx={{ width: 34, height: 34 }}
                    >
                        {(comment.author_first_name || "?")[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography sx={{ fontWeight: 850, fontSize: 13.5 }} noWrap>
                                {formatAuthorName(comment)}
                            </Typography>
                            {comment.author_handle && (
                                <Typography sx={{ fontSize: 11.5, opacity: 0.55, fontWeight: 700 }} noWrap>
                                    @{comment.author_handle}
                                </Typography>
                            )}
                        </Stack>
                        <Typography sx={{ fontSize: 11, opacity: 0.5, fontWeight: 700 }}>
                            {timeAgo(comment.created_at)}
                        </Typography>
                    </Box>
                    <ReportIcon color="warning" fontSize="small" />
                </Stack>

                {/* Comment content */}
                {comment.content && (
                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: 13,
                            opacity: 0.85,
                            fontWeight: 600,
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: expanded ? 999 : 3,
                            overflow: "hidden",
                            wordBreak: "break-word",
                            pl: 0.5,
                            borderLeft: "3px solid",
                            borderColor: (t) => alpha(t.palette.warning.main, 0.3),
                        }}
                    >
                        {comment.content}
                    </Typography>
                )}

                {/* Expand to see reports */}
                <Button
                    size="small"
                    onClick={() => setExpanded((v) => !v)}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{
                        mt: 1,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: 12,
                        color: "warning.main",
                        px: 1,
                    }}
                >
                    {flagCount} report{flagCount !== 1 ? "s" : ""}
                </Button>

                <Collapse in={expanded}>
                    <FlagsList flags={flags} />
                </Collapse>

                {/* Actions */}
                <Divider sx={{ mt: 1.5, mb: 1 }} />
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ rowGap: 0.75 }}
                >
                    <Tooltip title="Dismiss all reports for this comment (keep the comment)">
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircleOutlineIcon />}
                                onClick={() => onDismiss(comment.id)}
                                disabled={busy}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    fontSize: 12,
                                }}
                            >
                                Dismiss
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Delete this comment">
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => onDelete(comment.id)}
                                disabled={busy}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    fontSize: 12,
                                }}
                            >
                                Delete Comment
                            </Button>
                        </span>
                    </Tooltip>
                    {comment.user_id && (
                        <Tooltip title="Ban the author from this group">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<BlockIcon />}
                                    onClick={() => onBan(comment.user_id, formatAuthorName(comment))}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Ban Author
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    {comment.user_id && (
                        <Tooltip title="Timeout the author">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<TimerIcon />}
                                    onClick={() => onTimeout(comment.user_id, formatAuthorName(comment))}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Timeout
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
}

// ── Main Section Component ──────────────────────────────────────────────────

export default function GroupAdminReportedPostsSection({ groupId, group, viewerMembership, onToast, onRefreshGroup }) {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [reportedPosts, setReportedPosts] = useState([]);
    const [reportedComments, setReportedComments] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    // Ban confirmation dialog
    const [banDialog, setBanDialog] = useState({ open: false, userId: null, name: "" });

    // Timeout dialog
    const [timeoutDialog, setTimeoutDialog] = useState({ open: false, userId: null, name: "" });
    const [timeoutDuration, setTimeoutDuration] = useState(60);

    const toast = useCallback(
        (severity, message) => {
            if (typeof onToast === "function") onToast(severity, message);
        },
        [onToast]
    );

    const loadReports = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await adminFetchReportedPosts(groupId);
            setReportedPosts(Array.isArray(data?.reportedPosts) ? data.reportedPosts : []);
            setReportedComments(Array.isArray(data?.reportedComments) ? data.reportedComments : []);
        } catch (err) {
            toast("error", err?.message || "Failed to load reported content.");
        } finally {
            setLoading(false);
        }
    }, [groupId, toast]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // ── Post actions ────────────────────────────────────────────────────────

    // Dismiss confirmation dialog (shared by posts + comments)
    const [dismissDialog, setDismissDialog] = useState({ open: false, type: "", id: null });

    const handleDismissPost = useCallback(
        async (postId) => {
            if (!groupId || !postId) return;
            setDismissDialog({ open: true, type: "post", id: postId });
        },
        [groupId]
    );

    const handleDismissComment = useCallback(
        async (commentId) => {
            if (!groupId || !commentId) return;
            setDismissDialog({ open: true, type: "comment", id: commentId });
        },
        [groupId]
    );

    const handleConfirmDismiss = useCallback(async () => {
        const { type, id } = dismissDialog;
        if (!groupId || !id) return;
        setDismissDialog((prev) => ({ ...prev, open: false }));
        setBusy(true);
        try {
            if (type === "post") {
                await adminDismissPostReports(groupId, id);
                toast("success", "Reports dismissed.");
                setReportedPosts((prev) => prev.filter((r) => r.post?.id !== id));
            } else {
                await adminDismissCommentReports(groupId, id);
                toast("success", "Reports dismissed.");
                setReportedComments((prev) => prev.filter((r) => r.comment?.id !== id));
            }
        } catch (err) {
            toast("error", err?.message || "Failed to dismiss reports.");
        } finally {
            setBusy(false);
        }
    }, [dismissDialog, groupId, toast]);

    // Delete confirmation dialog (shared by posts + comments)
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: "", id: null, label: "" });

    const handleDeletePost = useCallback(
        async (postId) => {
            if (!groupId || !postId) return;
            setDeleteDialog({ open: true, type: "post", id: postId, label: "post" });
        },
        [groupId]
    );

    const handleDeleteComment = useCallback(
        async (commentId) => {
            if (!groupId || !commentId) return;
            setDeleteDialog({ open: true, type: "comment", id: commentId, label: "comment" });
        },
        [groupId]
    );

    const handleConfirmDelete = useCallback(async () => {
        const { type, id } = deleteDialog;
        if (!groupId || !id) return;
        setDeleteDialog((prev) => ({ ...prev, open: false }));
        setBusy(true);
        try {
            if (type === "post") {
                await adminDeleteGroupPost(groupId, id);
                toast("success", "Post deleted.");
                setReportedPosts((prev) => prev.filter((r) => r.post?.id !== id));
                if (typeof onRefreshGroup === "function") onRefreshGroup();
            } else {
                await adminDeleteGroupComment(groupId, id);
                toast("success", "Comment deleted.");
                setReportedComments((prev) => prev.filter((r) => r.comment?.id !== id));
            }
        } catch (err) {
            toast("error", err?.message || `Failed to delete ${type}.`);
        } finally {
            setBusy(false);
        }
    }, [deleteDialog, groupId, toast, onRefreshGroup]);

    // ── Ban author (shared by posts + comments) ─────────────────────────────

    const handleOpenBan = useCallback((userId, name) => {
        setBanDialog({ open: true, userId, name });
    }, []);

    const handleConfirmBan = useCallback(async () => {
        const { userId } = banDialog;
        if (!groupId || !userId) return;
        setBanDialog((prev) => ({ ...prev, open: false }));
        setBusy(true);
        try {
            await adminModerateMember(groupId, userId, "ban", { permanent: true, reason: "Banned via reported content moderation" });
            toast("success", "Author banned from group.");
            if (typeof onRefreshGroup === "function") onRefreshGroup();
        } catch (err) {
            toast("error", err?.message || "Failed to ban author.");
        } finally {
            setBusy(false);
        }
    }, [banDialog, groupId, toast, onRefreshGroup]);

    // ── Timeout author ──────────────────────────────────────────────────────

    const handleOpenTimeout = useCallback((userId, name) => {
        setTimeoutDuration(60);
        setTimeoutDialog({ open: true, userId, name });
    }, []);

    const handleConfirmTimeout = useCallback(async () => {
        const { userId } = timeoutDialog;
        if (!groupId || !userId) return;
        setTimeoutDialog((prev) => ({ ...prev, open: false }));
        setBusy(true);
        try {
            await adminModerateMember(groupId, userId, "timeout", { duration_minutes: timeoutDuration, reason: "Timed out via reported content moderation" });
            toast("success", "Author timed out.");
            if (typeof onRefreshGroup === "function") onRefreshGroup();
        } catch (err) {
            toast("error", err?.message || "Failed to timeout author.");
        } finally {
            setBusy(false);
        }
    }, [timeoutDialog, groupId, timeoutDuration, toast, onRefreshGroup]);

    // ── Derived ─────────────────────────────────────────────────────────────

    const totalCount = reportedPosts.length + reportedComments.length;
    const postCount = reportedPosts.length;
    const commentCount = reportedComments.length;

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                borderRadius: { xs: 4, md: 5 },
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
                boxShadow: t.shadows[1],
            })}
        >
            {/* Header */}
            <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.25 } }}>
                <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                            sx={(t) => ({
                                width: 38,
                                height: 38,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(t.palette.error.main, 0.1),
                                border: "1px solid",
                                borderColor: alpha(t.palette.error.main, 0.18),
                                flex: "0 0 auto",
                            })}
                        >
                            <ReportIcon fontSize="small" color="error" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 1100, fontSize: 16.25, lineHeight: 1.15 }} noWrap>
                                Reported content
                            </Typography>
                            <Typography sx={{ opacity: 0.74, fontWeight: 850, fontSize: 12.75 }}>
                                {loading
                                    ? "Loading..."
                                    : totalCount === 0
                                        ? "No reports to review"
                                        : `${totalCount} item${totalCount !== 1 ? "s" : ""} need${totalCount === 1 ? "s" : ""} review`}
                            </Typography>
                        </Box>
                    </Stack>

                    <Tooltip title="Refresh">
                        <span>
                            <IconButton
                                size="small"
                                onClick={loadReports}
                                disabled={loading}
                                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>
            </Box>

            <Divider />

            {loading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={28} />
                </Box>
            ) : totalCount === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 48, opacity: 0.18, mb: 1 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 15, opacity: 0.45 }}>
                        All clear — no reported content
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.35, mt: 0.5 }}>
                        Reports from group members will show up here.
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Tabs: Posts / Comments */}
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            px: 2,
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 900,
                                minHeight: 44,
                                fontSize: 13.5,
                            },
                        }}
                    >
                        <Tab
                            icon={<ArticleOutlinedIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Posts"
                            sx={{ gap: 0.75 }}
                        />
                        <Tab
                            icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Comments"
                            sx={{ gap: 0.75 }}
                        />
                    </Tabs>

                    <Divider />

                    {/* Tab panels */}
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                        {activeTab === 0 && (
                            postCount === 0 ? (
                                <Box sx={{ py: 4, textAlign: "center" }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.4 }}>
                                        No reported posts.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {reportedPosts.map((item) => (
                                        <ReportedPostCard
                                            key={item.post?.id}
                                            item={item}
                                            onDismiss={handleDismissPost}
                                            onDelete={handleDeletePost}
                                            onBan={handleOpenBan}
                                            onTimeout={handleOpenTimeout}
                                            busy={busy}
                                        />
                                    ))}
                                </Stack>
                            )
                        )}
                        {activeTab === 1 && (
                            commentCount === 0 ? (
                                <Box sx={{ py: 4, textAlign: "center" }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.4 }}>
                                        No reported comments.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {reportedComments.map((item) => (
                                        <ReportedCommentCard
                                            key={item.comment?.id}
                                            item={item}
                                            onDismiss={handleDismissComment}
                                            onDelete={handleDeleteComment}
                                            onBan={handleOpenBan}
                                            onTimeout={handleOpenTimeout}
                                            busy={busy}
                                        />
                                    ))}
                                </Stack>
                            )
                        )}
                    </Box>
                </>
            )}

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => !busy && setDeleteDialog({ open: false, type: "", id: null, label: "" })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
                    <DeleteIcon color="error" />
                    Delete {deleteDialog.label}
                    <IconButton
                        onClick={() => setDeleteDialog({ open: false, type: "", id: null, label: "" })}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        Are you sure you want to permanently delete this {deleteDialog.label}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, type: "", id: null, label: "" })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                    >
                        {busy ? "Deleting..." : `Delete ${deleteDialog.label}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dismiss confirmation dialog */}
            <Dialog
                open={dismissDialog.open}
                onClose={() => !busy && setDismissDialog({ open: false, type: "", id: null })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
                    <CheckCircleOutlineIcon color="success" />
                    Dismiss reports
                    <IconButton
                        onClick={() => setDismissDialog({ open: false, type: "", id: null })}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        Dismiss all reports for this {dismissDialog.type}? The {dismissDialog.type} will be kept and the reports will be cleared.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setDismissDialog({ open: false, type: "", id: null })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleConfirmDismiss}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                    >
                        {busy ? "Dismissing..." : "Dismiss reports"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Ban confirmation dialog */}
            <Dialog
                open={banDialog.open}
                onClose={() => !busy && setBanDialog({ open: false, userId: null, name: "" })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
                    <WarningAmberIcon color="error" />
                    Ban author
                    <IconButton
                        onClick={() => setBanDialog({ open: false, userId: null, name: "" })}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        Are you sure you want to permanently ban{" "}
                        <strong>{banDialog.name || "this user"}</strong> from the group?
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.7, fontWeight: 600 }}>
                        They will no longer be able to view or post in this group.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setBanDialog({ open: false, userId: null, name: "" })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmBan}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                    >
                        {busy ? "Banning..." : "Ban permanently"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Timeout confirmation dialog */}
            <Dialog
                open={timeoutDialog.open}
                onClose={() => !busy && setTimeoutDialog({ open: false, userId: null, name: "" })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
                    <TimerIcon color="warning" />
                    Timeout author
                    <IconButton
                        onClick={() => setTimeoutDialog({ open: false, userId: null, name: "" })}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>
                        Timeout <strong>{timeoutDialog.name || "this user"}</strong> — they won&apos;t be able to post or comment for the selected duration.
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Duration</InputLabel>
                        <Select
                            value={timeoutDuration}
                            onChange={(e) => setTimeoutDuration(e.target.value)}
                            label="Duration"
                        >
                            <MenuItem value={5}>5 minutes</MenuItem>
                            <MenuItem value={15}>15 minutes</MenuItem>
                            <MenuItem value={60}>1 hour</MenuItem>
                            <MenuItem value={360}>6 hours</MenuItem>
                            <MenuItem value={1440}>24 hours</MenuItem>
                            <MenuItem value={4320}>3 days</MenuItem>
                            <MenuItem value={10080}>1 week</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setTimeoutDialog({ open: false, userId: null, name: "" })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleConfirmTimeout}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                    >
                        {busy ? "Processing..." : "Confirm Timeout"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

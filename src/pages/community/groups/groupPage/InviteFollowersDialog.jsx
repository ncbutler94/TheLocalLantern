// src/pages/community/groups/groupPage/InviteFollowersDialog.jsx
import React, { useEffect, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    Checkbox,
    Chip,
    useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { alpha, useTheme } from "@mui/material/styles";
import defaultAvatarSquare from "../../../../assets/profile/default_avatar_square.png";

function safeName(u) {
    const first = String(u?.first_name || "").trim();
    const last = String(u?.last_name || "").trim();
    const full = `${first} ${last}`.trim();
    return full || String(u?.display_name || u?.name || "User");
}

function safeHandle(u) {
    const h = String(u?.handle || u?.username || "").trim().replace(/^@+/, "");
    return h ? `@${h}` : "";
}

function statusMeta(status) {
    const s = String(status || "").toLowerCase();
    if (s === "joined") return { label: "Member", Icon: CheckCircleIcon, color: "success" };
    if (s === "pending") return { label: "Requested", Icon: HourglassTopIcon, color: "warning" };
    if (s === "invited") return { label: "Invited", Icon: MailOutlineIcon, color: "info" };
    return null;
}

export default function InviteFollowersDialog({
                                                  open,
                                                  onClose,
                                                  groupId,
                                                  groupName,
                                                  onInvited,
                                              }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [rows, setRows] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");

    const [selected, setSelected] = useState(() => new Set());
    const [errorText, setErrorText] = useState("");

    const countSelected = selected.size;

    const filtered = (() => {
        if (!appliedQuery) return rows;
        const q = String(appliedQuery).toLowerCase();
        return rows.filter((u) => {
            const name = safeName(u).toLowerCase();
            const handle = String(u?.handle || u?.username || "").toLowerCase();
            return name.includes(q) || handle.includes(q);
        });
    })();

    const fetchRows = async (q) => {
        if (!groupId) return;
        setLoading(true);
        setErrorText("");
        try {
            const params = new URLSearchParams();
            if (q) params.set("q", q);

            const res = await fetch(
                `/api/groups/${encodeURIComponent(String(groupId))}/invite/followers?${params.toString()}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `Failed to load followers (${res.status})`);
            }
            const data = await res.json();
            const users = Array.isArray(data?.users) ? data.users : [];
            setRows(users);
        } catch (e) {
            setRows([]);
            setErrorText(String(e?.message || "Failed to load followers."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setSelected(new Set());
        setSearchText("");
        setAppliedQuery("");
        fetchRows("").catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, groupId]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const bulkSelectAll = () => {
        const next = new Set();
        for (const u of filtered) {
            const st = String(u?.member_status || "").toLowerCase();
            if (!st) next.add(Number(u?.id));
        }
        setSelected(next);
    };

    const clearSelection = () => setSelected(new Set());

    const sendInvites = async () => {
        if (!groupId || countSelected === 0) return;

        setSending(true);
        setErrorText("");
        try {
            const userIds = Array.from(selected).filter((x) => Number.isFinite(Number(x)));
            const res = await fetch(`/api/groups/${encodeURIComponent(String(groupId))}/invite`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds }),
            });
            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `Failed to send invites (${res.status})`);
            }
            const data = await res.json();
            const invited = Number(data?.invited) || 0;
            onInvited?.(invited);
            clearSelection();
            fetchRows(appliedQuery).catch(() => {});
        } catch (e) {
            setErrorText(String(e?.message || "Failed to send invites."));
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 4,
                    overflow: "hidden",
                    boxShadow: (t) => `0 26px 70px ${alpha(t.palette.common.black, 0.22)}`,
                },
            }}
        >
            <DialogTitle
                sx={(t) => ({
                    py: 1.5,
                    pr: 6,
                    bgcolor: alpha(t.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.10)}`,
                })}
            >
                <Typography sx={{ fontWeight: 1100, fontSize: 18, lineHeight: 1.2 }}>
                    Invite followers
                </Typography>
                <Typography sx={{ opacity: 0.75, fontWeight: 700, mt: 0.3, fontSize: 13 }}>
                    {groupName ? `Invite people to ${groupName}` : "Invite people to this group"}
                </Typography>

                {/* X in top right */}
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.04),
                        "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.08) },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={1.25}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                        <TextField
                            value={searchText}
                            onChange={(e) => setSearchText(String(e.target.value || ""))}
                            placeholder="Search followers…"
                            size="small"
                            fullWidth
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    setAppliedQuery(searchText.trim());
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "background.paper" },
                            }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearchText("");
                                    setAppliedQuery("");
                                }}
                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, height: 38 }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => setAppliedQuery(searchText.trim())}
                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, height: 38 }}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 900, opacity: 0.8 }}>
                            {loading ? "Loading…" : `${filtered.length} follower${filtered.length === 1 ? "" : "s"}`}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                variant="text"
                                onClick={bulkSelectAll}
                                disabled={filtered.length === 0 || loading}
                                sx={{ textTransform: "none", fontWeight: 900 }}
                            >
                                Select all
                            </Button>
                            <Button
                                variant="text"
                                onClick={clearSelection}
                                disabled={countSelected === 0}
                                sx={{ textTransform: "none", fontWeight: 900 }}
                            >
                                Clear
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={sending ? <CircularProgress size={16} /> : <PersonAddAlt1Icon />}
                                disabled={countSelected === 0 || sending}
                                onClick={sendInvites}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontWeight: 950,
                                    px: 2.25,
                                }}
                            >
                                {sending ? "Sending…" : `Invite${countSelected ? ` (${countSelected})` : ""}`}
                            </Button>
                        </Stack>
                    </Stack>

                    {errorText ? (
                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                borderRadius: 3,
                                borderColor: alpha(t.palette.error.main, 0.35),
                                bgcolor: alpha(t.palette.error.main, 0.04),
                                p: 1.25,
                            })}
                        >
                            <Typography sx={{ fontWeight: 900, color: "error.main" }}>{errorText}</Typography>
                        </Paper>
                    ) : null}

                    <Box
                        sx={{
                            maxHeight: fullScreen ? "calc(100vh - 240px)" : 420,
                            overflowY: "auto",
                            pr: 0.5,
                        }}
                    >
                        {loading ? (
                            <Stack spacing={1}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Paper key={i} variant="outlined" sx={{ borderRadius: 3, p: 1.2 }}>
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "action.hover" }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ height: 12, width: "55%", bgcolor: "action.hover", borderRadius: 999, mb: 0.7 }} />
                                                <Box sx={{ height: 10, width: "32%", bgcolor: "action.hover", borderRadius: 999 }} />
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : filtered.length ? (
                            <Stack spacing={1}>
                                {filtered.map((u) => {
                                    const id = Number(u?.id);
                                    const name = safeName(u);
                                    const handle = safeHandle(u);
                                    const avatar = String(u?.avatar_url || u?.profile_picture || "").trim();
                                    const status = statusMeta(u?.member_status);
                                    const disabled = Boolean(status);
                                    const checked = selected.has(id);

                                    return (
                                        <Paper
                                            key={String(id)}
                                            variant="outlined"
                                            sx={(t) => ({
                                                borderRadius: 3,
                                                p: 1.1,
                                                borderColor: checked
                                                    ? alpha(t.palette.secondary.main, 0.45)
                                                    : alpha(t.palette.primary.main, 0.12),
                                                bgcolor: checked ? alpha(t.palette.secondary.main, 0.06) : "background.paper",
                                                transition: "border-color .15s ease, box-shadow .15s ease, transform .15s ease",
                                                "&:hover": {
                                                    borderColor: alpha(t.palette.secondary.main, 0.34),
                                                    boxShadow: `0 12px 28px ${alpha(t.palette.common.black, 0.10)}`,
                                                    transform: "translateY(-1px)",
                                                },
                                            })}
                                            onClick={() => {
                                                if (!disabled && Number.isFinite(id)) toggle(id);
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <Avatar
                                                    src={avatar || defaultAvatarSquare}
                                                    variant="square"
                                                    imgProps={{
                                                        onError: (e) => {
                                                            e.currentTarget.src = defaultAvatarSquare;
                                                        },
                                                    }}
                                                    sx={{ width: 46, height: 46, borderRadius: 2 }}
                                                />

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography noWrap sx={{ fontWeight: 950 }}>
                                                        {name}
                                                    </Typography>
                                                    <Typography noWrap sx={{ opacity: 0.75, fontWeight: 750, fontSize: 13 }}>
                                                        {handle}
                                                    </Typography>
                                                </Box>

                                                {status ? (
                                                    <Chip
                                                        size="small"
                                                        icon={<status.Icon fontSize="small" />}
                                                        label={status.label}
                                                        color={status.color}
                                                        variant="outlined"
                                                        sx={{ fontWeight: 900 }}
                                                    />
                                                ) : null}

                                                <Checkbox
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={() => {
                                                        if (!disabled && Number.isFinite(id)) toggle(id);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Stack>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 4,
                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                    p: 3,
                                    textAlign: "center",
                                    bgcolor: alpha(t.palette.primary.main, 0.02),
                                })}
                            >
                                <Typography sx={{ fontWeight: 950, fontSize: 18, mb: 0.5 }}>
                                    No followers found
                                </Typography>
                                <Typography sx={{ opacity: 0.8, fontWeight: 650 }}>
                                    Try a different search.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

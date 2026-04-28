import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/groups/CreateGroupPostModal.jsx
import React, { useState, useRef, useCallback } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkProfanity } from '../../../utils/profanityCheck';

const MAX_TITLE = 50;
const MAX_DESC = 5000;
const MAX_OPTION_LEN = 200;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const MAX_PHOTOS = 8;

const api = process.env.REACT_APP_API_URL || "";

function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */
export default function CreateGroupPostModal({ open, onClose, group, onCreated }) {
    const groupId = Number(group?.id) || null;
    const groupName = String(group?.name || "").trim() || "this group";

    // Post type
    const [postType, setPostType] = useState("post");

    // Shared fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Photos (post mode) — ordered array of { id, url, file, existing? }
    const [photos, setPhotos] = useState([]);

    // Poll fields
    const [options, setOptions] = useState([
        { id: makeId(), label: "" },
        { id: makeId(), label: "" },
    ]);
    const [duration, setDuration] = useState("7d");
    const optionRefsMap = useRef({});

    // State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    // Per-field profanity errors: { title: "...", description: "...", "option-<id>": "..." }
    const [fieldErrors, setFieldErrors] = useState({});

    // Refs for scrolling to offending fields
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const isPoll = postType === "poll";
    const photoCount = photos.length;

    /* ── Reset ── */
    const handleClose = () => {
        if (submitting) return;
        setPostType("post");
        setTitle("");
        setDescription("");
        setPhotos([]);
        setOptions([
            { id: makeId(), label: "" },
            { id: makeId(), label: "" },
        ]);
        setDuration("7d");
        setError("");
        setFieldErrors({});
        setAttemptedSubmit(false);
        setSubmitting(false);
        onClose();
    };

    /* ── Poll option management ── */
    const updateOption = (id, label) => {
        setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
    };

    const addOption = () => {
        if (options.length >= MAX_OPTIONS) return;
        const newId = makeId();
        setOptions((prev) => [...prev, { id: newId, label: "" }]);
        requestAnimationFrame(() => {
            const el = optionRefsMap.current[newId];
            if (el) el.focus();
        });
    };

    const removeOption = (id) => {
        if (options.length <= MIN_OPTIONS) return;
        setOptions((prev) => prev.filter((o) => o.id !== id));
    };

    /* ── Validation ── */
    const trimmedTitle = String(title || "").trim();
    const filledOptions = isPoll
        ? options.filter((o) => String(o.label || "").trim())
        : [];
    const hasEnoughOptions = filledOptions.length >= MIN_OPTIONS;
    const hasDuplicates = isPoll
        ? new Set(filledOptions.map((o) => o.label.trim().toLowerCase())).size !==
        filledOptions.length
        : false;

    const canSubmit = isPoll
        ? Boolean(trimmedTitle) && hasEnoughOptions && !hasDuplicates && !submitting
        : Boolean(trimmedTitle) && !submitting;

    const getTooltip = () => {
        if (!trimmedTitle) return isPoll ? "Enter a poll question" : "Enter a title";
        if (isPoll && !hasEnoughOptions) return `Add at least ${MIN_OPTIONS} options`;
        if (isPoll && hasDuplicates) return "Remove duplicate options";
        return "";
    };

    /* ── Submit ── */
    const handleSubmit = useCallback(async () => {
        setAttemptedSubmit(true);
        setError("");
        setFieldErrors({});
        if (!canSubmit || !groupId) return;

        // Client-side profanity check — collect ALL field errors at once
        const strippedDesc = stripHtml(String(description || '')).trim();
        const newFieldErrors = {};

        const titleCheck = checkProfanity(trimmedTitle);
        if (!titleCheck.clean) {
            newFieldErrors.title = "Contains inappropriate language. Please revise.";
        }

        if (strippedDesc) {
            const descCheck = checkProfanity(strippedDesc);
            if (!descCheck.clean) {
                newFieldErrors.description = "Contains inappropriate language. Please revise.";
            }
        }

        // Check poll options if it's a poll
        if (isPoll && options.length > 0) {
            for (const opt of options) {
                const label = String(opt.label || '').trim();
                if (!label) continue;
                const optCheck = checkProfanity(label);
                if (!optCheck.clean) {
                    newFieldErrors[`option-${opt.id}`] = "Contains inappropriate language.";
                }
            }
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);

            // Scroll to the first offending field
            requestAnimationFrame(() => {
                const container = scrollContainerRef.current;
                if (!container) return;

                let targetEl = null;
                if (newFieldErrors.title && titleRef.current) {
                    targetEl = titleRef.current;
                } else if (newFieldErrors.description && descriptionRef.current) {
                    targetEl = descriptionRef.current;
                } else {
                    // Find first offending poll option
                    const firstOptKey = Object.keys(newFieldErrors).find(k => k.startsWith('option-'));
                    if (firstOptKey) {
                        const optId = firstOptKey.replace('option-', '');
                        const el = optionRefsMap.current[optId];
                        if (el) targetEl = el;
                    }
                }

                if (targetEl) {
                    const elRect = targetEl.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
                    container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
                }
            });
            return;
        }

        setSubmitting(true);
        try {
            if (isPoll) {
                const payload = {
                    title: trimmedTitle,
                    description: description.trim(),
                    category: "poll",
                    options: filledOptions.map((o) => o.label.trim()),
                };
                if (duration) {
                    const durationMs = {
                        "1h": 36e5,
                        "6h": 216e5,
                        "12h": 432e5,
                        "1d": 864e5,
                        "3d": 2592e5,
                        "7d": 6048e5,
                        "14d": 12096e5,
                        "30d": 2592e6,
                    }[duration];
                    if (durationMs) {
                        payload.pollExpiresAt = new Date(Date.now() + durationMs).toISOString();
                    }
                }

                const res = await secureFetch(
                    `${api}/api/groups/${encodeURIComponent(String(groupId))}/posts`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }
                );
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.message || `Error ${res.status}`);
                }
                const created = await res.json();
                if (typeof onCreated === "function") onCreated(created);
                try { window.dispatchEvent(new CustomEvent("ll:group:postCreated", { detail: { groupId, post: created } })); } catch { /* ignore */ }
                handleClose();
            } else {
                const fd = new FormData();
                fd.append("title", trimmedTitle);
                fd.append("description", description.trim());
                photos.forEach((p) => {
                    if (p?.file) fd.append("photos", p.file);
                });

                const res = await secureFetch(
                    `${api}/api/groups/${encodeURIComponent(String(groupId))}/posts`,
                    {
                        method: "POST",
                        credentials: "include",
                        body: fd,
                    }
                );
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.message || `Error ${res.status}`);
                }
                const created = await res.json();
                if (typeof onCreated === "function") onCreated(created);
                try { window.dispatchEvent(new CustomEvent("ll:group:postCreated", { detail: { groupId, post: created } })); } catch { /* ignore */ }
                handleClose();
            }
        } catch (err) {
            setError(err?.message || "Something went wrong.");
            // Scroll to bottom so the user sees the error (e.g. photo moderation)
            requestAnimationFrame(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            });
        } finally {
            setSubmitting(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSubmit, groupId, isPoll, trimmedTitle, description, photos, options, filledOptions, duration, onCreated]);

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => { if (reason === 'backdropClick') return; handleClose(); }}
            maxWidth="sm"
            fullWidth
            fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
            disableScrollLock
            transitionDuration={{ enter: 250, exit: 200 }}
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: 3 },
                    overflow: "hidden",
                    boxShadow: { xs: 'none', sm: "0 24px 64px rgba(0,0,0,0.18)" },
                    m: { xs: 0, sm: undefined },
                    display: 'flex',
                    flexDirection: 'column',
                    pt: { xs: 'env(safe-area-inset-top, 0px)', sm: 0 },
                },
            }}
        >
            {/* ── Header ── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                    {isPoll ? "Create a Poll" : "Create a Post"}
                </Typography>
                <IconButton
                    onClick={handleClose}
                    disabled={submitting}
                    size="small"
                    aria-label="Close"
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* ── Content ── */}
            <Box
                ref={scrollContainerRef}
                sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    flex: 1,
                    minHeight: 0,
                    maxHeight: { xs: 'none', sm: "70vh" },
                    overflowY: "auto",
                }}
            >
                {/* Group name */}
                <Typography sx={{ fontSize: 14, opacity: 0.85 }}>
                    Posting in <strong>{groupName}</strong>
                </Typography>

                {/* Post/Poll toggle */}
                <ToggleButtonGroup
                    value={postType}
                    exclusive
                    onChange={(_, v) => {
                        if (v) setPostType(v);
                    }}
                    size="small"
                    sx={(t) => ({
                        alignSelf: "flex-start",
                        gap: 0.75,
                        "& .MuiToggleButtonGroup-grouped": {
                            border: "none !important",
                            borderRadius: "999px !important",
                            margin: 0,
                        },
                        "& .MuiToggleButton-root": {
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            px: 2,
                            py: 0.5,
                            border: "1.5px solid",
                            borderColor: alpha(t.palette.divider, 0.2),
                            color: alpha(t.palette.text.primary, 0.55),
                            "&.Mui-selected": {
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                borderColor: alpha(t.palette.primary.main, 0.35),
                                "&:hover": {
                                    bgcolor: alpha(t.palette.primary.main, 0.12),
                                },
                            },
                        },
                    })}
                >
                    <ToggleButton value="post" disableRipple>
                        <ForumRoundedIcon sx={{ fontSize: 16, mr: 0.75 }} />
                        Post
                    </ToggleButton>
                    <ToggleButton value="poll" disableRipple>
                        <PollRoundedIcon sx={{ fontSize: 16, mr: 0.75 }} />
                        Poll
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* Title / Question */}
                <TextField
                    label={isPoll ? "Poll question" : "Title"}
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value.slice(0, MAX_TITLE));
                        if (fieldErrors.title) setFieldErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                    }}
                    disabled={submitting}
                    fullWidth
                    variant="outlined"
                    required
                    inputRef={titleRef}
                    error={Boolean(fieldErrors.title) || (attemptedSubmit && !trimmedTitle)}
                    helperText={fieldErrors.title || ""}
                    inputProps={{ maxLength: MAX_TITLE }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            fontWeight: 600,
                        },
                    }}
                />

                {/* Description */}
                <Box ref={descriptionRef}>
                    <RichTextEditor
                        label="Description"
                        value={description}
                        onChange={(html) => {
                            setDescription(html);
                            if (fieldErrors.description) setFieldErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                        }}
                        maxLength={MAX_DESC}
                        placeholder="Share the details..."
                        minRows={6}
                    />
                    {fieldErrors.description && (
                        <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: 0.5, ml: 1.75 }}>
                            {fieldErrors.description}
                        </Typography>
                    )}
                </Box>

                {/* ═══════ POST MODE: Photos ═══════ */}
                {!isPoll && (
                    <Box>
                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={setPhotos}
                            disabled={submitting}
                            maxPhotos={MAX_PHOTOS}
                            title="Photos"
                            helperText="Add photos to make your post stand out"
                            addButtonText="Add photos"
                        />
                    </Box>
                )}

                {/* ═══════ POLL MODE: Options + Duration ═══════ */}
                {isPoll && (
                    <>
                        <Box
                            sx={(t) => ({
                                p: 2,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.15),
                                bgcolor: alpha(t.palette.primary.main, 0.02),
                            })}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 1.25,
                                }}
                            >
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                    Poll Options
                                </Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: 12, opacity: 0.5 }}>
                                    {filledOptions.length} / {MAX_OPTIONS}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {options.map((opt, idx) => (
                                    <Box
                                        key={opt.id}
                                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                width: 26,
                                                height: 26,
                                                borderRadius: "8px",
                                                bgcolor: String(opt.label || "").trim()
                                                    ? alpha(t.palette.primary.main, 0.1)
                                                    : "rgba(0,0,0,0.04)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                border: "1px solid",
                                                borderColor: String(opt.label || "").trim()
                                                    ? alpha(t.palette.primary.main, 0.2)
                                                    : "rgba(0,0,0,0.08)",
                                            })}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 11,
                                                    fontWeight: 900,
                                                    color: String(opt.label || "").trim()
                                                        ? "primary.main"
                                                        : "text.disabled",
                                                }}
                                            >
                                                {idx + 1}
                                            </Typography>
                                        </Box>

                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={`Option ${idx + 1}`}
                                            value={opt.label}
                                            onChange={(e) => {
                                                updateOption(
                                                    opt.id,
                                                    e.target.value.slice(0, MAX_OPTION_LEN)
                                                );
                                                const key = `option-${opt.id}`;
                                                if (fieldErrors[key]) setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
                                            }}
                                            disabled={submitting}
                                            inputProps={{
                                                maxLength: MAX_OPTION_LEN,
                                                ref: (el) => {
                                                    if (el) optionRefsMap.current[opt.id] = el;
                                                },
                                            }}
                                            error={Boolean(fieldErrors[`option-${opt.id}`])}
                                            helperText={fieldErrors[`option-${opt.id}`] || ""}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "10px",
                                                },
                                            }}
                                        />

                                        {options.length > MIN_OPTIONS && (
                                            <IconButton
                                                size="small"
                                                onClick={() => removeOption(opt.id)}
                                                disabled={submitting}
                                                sx={{
                                                    flexShrink: 0,
                                                    color: "text.disabled",
                                                    "&:hover": { color: "error.main" },
                                                }}
                                                aria-label={`Remove option ${idx + 1}`}
                                            >
                                                <CloseRoundedIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {options.length < MAX_OPTIONS && (
                                <Button
                                    size="small"
                                    startIcon={<AddRoundedIcon />}
                                    onClick={addOption}
                                    disabled={submitting}
                                    sx={{
                                        mt: 1,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        borderRadius: "10px",
                                        color: "primary.main",
                                    }}
                                >
                                    Add option
                                </Button>
                            )}

                            {hasDuplicates && attemptedSubmit && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 0.5, display: "block", fontWeight: 700 }}
                                >
                                    Remove duplicate options before posting.
                                </Typography>
                            )}
                        </Box>

                        {/* Duration */}
                        <FormControl sx={{ width: { xs: "100%", sm: 220 } }}>
                            <InputLabel>Poll Duration</InputLabel>
                            <Select
                                value={duration}
                                label="Poll Duration"
                                size="small"
                                onChange={(e) => setDuration(e.target.value)}
                                disabled={submitting}
                                startAdornment={
                                    <TimerRoundedIcon
                                        sx={{ fontSize: 18, color: "text.secondary", mr: 0.5 }}
                                    />
                                }
                                sx={{ borderRadius: 2.5 }}
                            >
                                <MenuItem value="1h">1 hour</MenuItem>
                                <MenuItem value="6h">6 hours</MenuItem>
                                <MenuItem value="12h">12 hours</MenuItem>
                                <MenuItem value="1d">1 day</MenuItem>
                                <MenuItem value="3d">3 days</MenuItem>
                                <MenuItem value="7d">7 days</MenuItem>
                                <MenuItem value="14d">2 weeks</MenuItem>
                                <MenuItem value="30d">30 days</MenuItem>
                                <MenuItem value="">No limit</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                )}

                {/* Error */}
                {error && (
                    <Typography color="error" sx={{ fontSize: 13, fontWeight: 700 }}>
                        {error}
                    </Typography>
                )}
            </Box>

            {/* ── Footer ── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 1.5,
                    px: 3,
                    py: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    disabled={submitting}
                    sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                    }}
                >
                    Cancel
                </Button>

                <Tooltip title={getTooltip()} disableHoverListener={!getTooltip()}>
                    <span>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            disableElevation
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                                px: 2.5,
                                background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                            })}
                        >
                            {submitting ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : isPoll ? (
                                "Post Poll"
                            ) : (
                                "Post"
                            )}
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Dialog>
    );
}

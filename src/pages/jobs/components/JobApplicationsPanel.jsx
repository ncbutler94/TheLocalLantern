// src/pages/jobs/components/JobApplicationsPanel.jsx
//
// Displays applications for a job the current user owns.
// Shows applicant info, cover message, resume download, portfolio URL, and status controls.
//
import React, { useCallback, useEffect, useRef, useState } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha } from "@mui/material/styles";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FiberNewRoundedIcon from "@mui/icons-material/FiberNewRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PulsingDots from "../../../components/PulsingDots";

/* ── Status config ── */
const STATUS_CONFIG = {
    new: { label: "New", color: "info", icon: <FiberNewRoundedIcon sx={{ fontSize: 14 }} /> },
    reviewed: { label: "Reviewed", color: "warning", icon: <VisibilityRoundedIcon sx={{ fontSize: 14 }} /> },
    shortlisted: { label: "Shortlisted", color: "secondary", icon: <StarRoundedIcon sx={{ fontSize: 14 }} /> },
    accepted: { label: "Accepted", color: "success", icon: <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> },
    rejected: { label: "Rejected", color: "error", icon: <CancelRoundedIcon sx={{ fontSize: 14 }} /> },
};

const STATUS_ORDER = ["new", "reviewed", "shortlisted", "accepted", "rejected"];

/* ── Helpers ── */
const resolveApplicantAvatar = (app) => {
    const url = app?.applicant_avatar || app?.applicant_profile_picture || "";
    const trimmed = url.trim();
    if (!trimmed || trimmed.includes("default_avatar")) return "";
    return trimmed;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.valueOf())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

/**
 * JobApplicationsPanel
 *
 * Props:
 *  - jobId: number
 */
export default function JobApplicationsPanel({ jobId, highlightUserId }) {
    const [applications, setApplications] = useState([]);
    const [counts, setCounts] = useState({});
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("");

    // Highlight state: tracks which application user_id is currently glowing brass/gold
    const [highlightedUserId, setHighlightedUserId] = useState(null);
    const highlightTimerRef = useRef(null);
    const scrolledRef = useRef(false);

    // Fetch applications
    useEffect(() => {
        if (!jobId) return;
        const controller = new AbortController();

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (filterStatus) params.set("status", filterStatus);
                const res = await secureFetch(`/api/jobs/${jobId}/applications?${params.toString()}`, {
                    credentials: "include",
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error("Failed to load applications");
                const data = await res.json();
                setApplications(data.applications || []);
                setCounts(data.counts || {});
                setTotal(data.total || 0);
            } catch (err) {
                if (err.name !== "AbortError") setError(err);
            } finally {
                setIsLoading(false);
            }
        }

        load();
        return () => controller.abort();
    }, [jobId, filterStatus]);

    // Scroll to and highlight the target application after data loads
    useEffect(() => {
        if (!highlightUserId || isLoading || scrolledRef.current) return;
        const targetApp = applications.find(
            (a) => Number(a.user_id) === Number(highlightUserId)
        );
        if (!targetApp) return;

        scrolledRef.current = true;
        setHighlightedUserId(Number(highlightUserId));

        // Give DOM a tick to render, then scroll
        requestAnimationFrame(() => {
            const el = document.getElementById(`job-application-${targetApp.id}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });

        // Clear highlight after 3.5s
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
            setHighlightedUserId(null);
            highlightTimerRef.current = null;
        }, 3500);

        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, [highlightUserId, applications, isLoading]);

    if (!jobId) return null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Status filter chips */}
            {total > 0 && (
                <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 1.5, pb: 1.25, flexShrink: 0 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        <Chip
                            size="small"
                            label={`All (${total})`}
                            variant={filterStatus === "" ? "filled" : "outlined"}
                            onClick={() => setFilterStatus("")}
                            sx={{
                                fontWeight: 800, fontSize: 11, height: 26, borderRadius: 999,
                                ...(filterStatus === "" ? {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    "&:hover": { bgcolor: "primary.dark" },
                                } : {}),
                            }}
                        />
                        {STATUS_ORDER.map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const count = counts[s] || 0;
                            if (count === 0 && filterStatus !== s) return null;
                            return (
                                <Chip
                                    key={s}
                                    size="small"
                                    icon={cfg.icon}
                                    label={`${cfg.label} (${count})`}
                                    variant={filterStatus === s ? "filled" : "outlined"}
                                    color={cfg.color}
                                    onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                                    sx={{
                                        fontWeight: 800, fontSize: 11, height: 26, borderRadius: 999,
                                        "& .MuiChip-icon": { ml: 0.5 },
                                        "& .MuiChip-label": { px: 0.75 },
                                    }}
                                />
                            );
                        })}
                    </Box>
                </Box>
            )}

            {total > 0 && <Divider />}

            {/* Content */}
            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin" }}>
                {isLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
                        <PulsingDots />
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2.5, textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700 }}>
                            Failed to load applications.
                        </Typography>
                    </Box>
                ) : applications.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, px: 2, textAlign: "center" }}>
                        <Box
                            sx={(t) => ({
                                width: 56, height: 56, borderRadius: 2.5,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                mb: 1.5,
                            })}
                        >
                            <InboxRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 0.5 }}>
                            {filterStatus ? "No applications with this status" : "No applications yet"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13, maxWidth: 280 }}>
                            {filterStatus ? "Try a different filter." : "Applications will appear here when candidates apply."}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0} divider={<Divider sx={{ borderColor: (t) => alpha(t.palette.text.primary, 0.1) }} />}>
                        {applications.map((app, idx) => (
                            <React.Fragment key={app.id}>
                                <ApplicationCard
                                    application={app}
                                    isHighlighted={highlightedUserId != null && Number(app.user_id) === highlightedUserId}
                                    autoExpand={highlightUserId != null && Number(app.user_id) === Number(highlightUserId)}
                                    onStatusChange={(newStatus) => {
                                        setApplications((prev) =>
                                            prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
                                        );
                                        setCounts((prev) => {
                                            const updated = { ...prev };
                                            const oldStatus = app.status;
                                            if (updated[oldStatus]) updated[oldStatus] = Math.max(0, updated[oldStatus] - 1);
                                            updated[newStatus] = (updated[newStatus] || 0) + 1;
                                            if (filterStatus === oldStatus && (updated[oldStatus] || 0) === 0) {
                                                setFilterStatus("");
                                            }
                                            return updated;
                                        });
                                    }}
                                />
                                {idx === applications.length - 1 && (
                                    <Divider sx={{ borderColor: (t) => alpha(t.palette.text.primary, 0.1) }} />
                                )}
                            </React.Fragment>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}


/* ═══════════════════════════════════════════════════════════════════════
   APPLICATION CARD — individual applicant row
   ═══════════════════════════════════════════════════════════════════════ */
function ApplicationCard({ application, onStatusChange, isHighlighted = false, autoExpand = false }) {
    const [expanded, setExpanded] = useState(autoExpand);
    const [updating, setUpdating] = useState(false);

    const app = application;
    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
    const avatarSrc = resolveApplicantAvatar(app);
    const portfolioUrl = app.portfolio_url || app.portfolioUrl || "";

    const handleUpdateStatus = async (newStatus) => {
        if (updating) return;
        setUpdating(true);
        try {
            const res = await secureFetch(`/api/jobs/applications/${app.id}/status`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update");
            if (typeof onStatusChange === "function") onStatusChange(newStatus);
        } catch {
            // Could show toast
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Box
            id={`job-application-${app.id}`}
            sx={(t) => {
                const brass = t.custom?.brand?.brass || '#A87822';
                const motion = t.custom?.motion;
                return {
                    px: { xs: 1.5, sm: 2.5 }, py: 2,
                    borderRadius: 2,
                    border: '2px solid transparent',
                    transition: `background-color ${motion?.slow || 220}ms ${motion?.ease || 'ease'}, box-shadow ${motion?.slow || 220}ms ${motion?.ease || 'ease'}, border-color ${motion?.slow || 220}ms ${motion?.ease || 'ease'}`,
                    ...(isHighlighted ? {
                        backgroundColor: alpha(brass, 0.14),
                        borderColor: alpha(brass, 0.50),
                        boxShadow: `0 14px 34px ${alpha(brass, 0.18)}`,
                    } : {}),
                };
            }}
        >
            {/* Top row: avatar + name + status chip */}
            <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
                onClick={() => setExpanded((p) => !p)}
            >
                <Avatar
                    src={avatarSrc || undefined}
                    sx={(t) => ({
                        width: 40, height: 40, flexShrink: 0,
                        border: "2px solid",
                        borderColor: alpha(t.palette.text.primary, 0.06),
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        color: t.palette.primary.main,
                    })}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ""; }}
                >
                    <PersonRoundedIcon sx={{ fontSize: 24 }} />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }} noWrap>
                        {app.applicant_name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                        {app.applicant_handle && (
                            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, fontSize: 11, lineHeight: 1.3 }}>
                                @{app.applicant_handle}
                            </Typography>
                        )}
                        {app.applicant_handle && formatDate(app.created_at) && (
                            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, lineHeight: 1.3 }}>·</Typography>
                        )}
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, lineHeight: 1.3 }}>
                            {formatDate(app.created_at)}
                        </Typography>
                    </Box>
                </Box>

                <Chip
                    size="small"
                    icon={cfg.icon}
                    label={cfg.label}
                    color={cfg.color}
                    variant="outlined"
                    sx={{
                        fontWeight: 800, fontSize: 11, height: 24, borderRadius: 999, flexShrink: 0,
                        "& .MuiChip-icon": { ml: 0.5 },
                        "& .MuiChip-label": { px: 0.5 },
                    }}
                />

                <IconButton size="small" sx={{ flexShrink: 0, width: 28, height: 28 }}>
                    {expanded ? <ExpandLessRoundedIcon sx={{ fontSize: 18 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>

            {/* Expanded details */}
            <Collapse in={expanded} unmountOnExit>
                <Box sx={{ mt: 1.5, ml: { xs: 0, sm: 7 } }}>
                    {/* Contact info */}
                    <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EmailOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography variant="body2" sx={{ fontSize: 13, wordBreak: "break-all" }}>
                                <a href={`mailto:${app.applicant_email}`} style={{ color: "inherit", fontWeight: 700 }}>
                                    {app.applicant_email}
                                </a>
                            </Typography>
                        </Box>
                        {app.applicant_phone && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PhoneOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="body2" sx={{ fontSize: 13 }}>
                                    <a href={`tel:${app.applicant_phone}`} style={{ color: "inherit", fontWeight: 700 }}>
                                        {app.applicant_phone}
                                    </a>
                                </Typography>
                            </Box>
                        )}
                        {portfolioUrl && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LanguageRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="body2" sx={{ fontSize: 13, wordBreak: "break-all" }}>
                                    <a href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`}
                                       target="_blank" rel="noopener noreferrer"
                                       style={{ color: "inherit", fontWeight: 700 }}>
                                        {portfolioUrl}
                                    </a>
                                </Typography>
                            </Box>
                        )}
                    </Stack>

                    {/* Cover message */}
                    {app.message && (
                        <Box
                            sx={(t) => ({
                                p: 1.5, borderRadius: 2,
                                bgcolor: alpha(t.palette.action.hover, 0.04),
                                border: "1px solid", borderColor: alpha(t.palette.divider, 0.5),
                                mb: 1.5,
                            })}
                        >
                            <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Cover Message
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {app.message}
                            </Typography>
                        </Box>
                    )}

                    {/* Resume */}
                    {app.resume_url && (
                        <Box
                            component="a"
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={(t) => ({
                                display: "flex", alignItems: "center", gap: 1.25,
                                p: 1.25, borderRadius: 2,
                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2),
                                bgcolor: alpha(t.palette.primary.main, 0.03),
                                textDecoration: "none", color: "inherit", cursor: "pointer",
                                transition: "all 140ms ease",
                                mb: 1.5,
                                "&:hover": {
                                    bgcolor: alpha(t.palette.primary.main, 0.07),
                                    borderColor: alpha(t.palette.primary.main, 0.35),
                                },
                            })}
                        >
                            <DescriptionRoundedIcon sx={{ fontSize: 24, color: "primary.main" }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                    {app.resume_filename || "Resume"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
                                    Click to view / download
                                </Typography>
                            </Box>
                            <DownloadRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                        </Box>
                    )}

                    {/* Status actions */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {STATUS_ORDER.filter((s) => s !== app.status).map((s) => {
                            const c = STATUS_CONFIG[s];
                            return (
                                <Button
                                    key={s}
                                    size="small"
                                    variant="outlined"
                                    color={c.color}
                                    disabled={updating}
                                    onClick={() => handleUpdateStatus(s)}
                                    startIcon={updating ? <CircularProgress size={12} color="inherit" /> : c.icon}
                                    sx={{
                                        textTransform: "none", fontWeight: 800,
                                        fontSize: 11, borderRadius: 999, px: 1.5,
                                        minHeight: 28,
                                    }}
                                >
                                    {c.label}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

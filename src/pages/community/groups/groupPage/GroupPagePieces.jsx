// src/pages/community/groups/groupPage/GroupPagePieces.jsx
import React from "react";
import { alpha } from "@mui/material/styles";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import defaultAvatarSquare from "../../../../assets/default_groups.png";
import { safeHandle, safeName } from "./groupPageUtils";

/* ------------------------------------------------------------------ */
/*  StatPill — compact glass stat badge for header overlays            */
/* ------------------------------------------------------------------ */
function StatPill({ icon, label }) {
    return (
        <Box
            sx={(t) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                border: "1px solid",
                borderColor: alpha(t.palette.common.white, 0.18),
                bgcolor: alpha(t.palette.common.black, 0.22),
                color: "common.white",
                backdropFilter: "saturate(180%) blur(14px)",
                WebkitBackdropFilter: "saturate(180%) blur(14px)",
                transition: "transform 180ms ease, background 180ms ease",
                "&:hover": {
                    transform: "translateY(-1px)",
                    bgcolor: alpha(t.palette.common.black, 0.32),
                },
            })}
        >
            <Box sx={{ display: "grid", placeItems: "center", fontSize: 15 }}>{icon}</Box>
            <Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1, letterSpacing: "0.01em" }}>
                {label}
            </Typography>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  SectionCard — elegant container card with gradient header strip     */
/* ------------------------------------------------------------------ */
function SectionCard({ title, icon, action, children, subtle = false }) {
    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                borderRadius: 3.5,
                border: "1px solid",
                borderColor: alpha(t.palette.divider, 0.08),
                overflow: "hidden",
                bgcolor: subtle
                    ? alpha(t.palette.primary.main, 0.015)
                    : t.palette.background.paper,
                boxShadow: `0 1px 3px ${alpha(t.palette.common.black, 0.04)}, 0 8px 24px ${alpha(t.palette.common.black, 0.06)}`,
                transition: "box-shadow 200ms ease, transform 200ms ease",
                "&:hover": {
                    boxShadow: `0 2px 6px ${alpha(t.palette.common.black, 0.06)}, 0 12px 32px ${alpha(t.palette.common.black, 0.09)}`,
                },
            })}
        >
            {/* Header strip */}
            <Box
                sx={(t) => ({
                    px: 2.25,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    borderBottom: "1px solid",
                    borderColor: alpha(t.palette.divider, 0.06),
                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(t.palette.secondary.main, 0.02)} 100%)`,
                })}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {icon ? (
                        <Box
                            sx={(t) => ({
                                display: "grid",
                                placeItems: "center",
                                color: t.palette.primary.main,
                                opacity: 0.8,
                            })}
                        >
                            {icon}
                        </Box>
                    ) : null}
                    <Typography sx={{ fontWeight: 800, fontSize: 14.5, letterSpacing: "-0.01em" }}>
                        {title}
                    </Typography>
                </Box>
                {action || null}
            </Box>

            {/* Body */}
            <Box sx={{ p: 2 }}>{children}</Box>
        </Paper>
    );
}

/* ------------------------------------------------------------------ */
/*  MemberCard — rich member card with hover lift & smooth avatar       */
/* ------------------------------------------------------------------ */
function MemberCard({ user, onClick, onOpenMenu }) {
    const name = safeName(user);
    const username = safeHandle(user);
    const avatar =
        user?.avatar_url || user?.profile_picture || user?.profile_picture_url || user?.profilePicUrl || "";

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={(t) => ({
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 1.25,
                p: 1.25,
                borderRadius: 3,
                cursor: "pointer",
                border: "1px solid",
                borderColor: alpha(t.palette.divider, 0.08),
                bgcolor: t.palette.background.paper,
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    borderColor: alpha(t.palette.primary.main, 0.2),
                    transform: "translateY(-2px)",
                    boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.08)}, 0 1px 4px ${alpha(t.palette.common.black, 0.06)}`,
                },
                "&:active": {
                    transform: "translateY(0)",
                },
            })}
        >
            <Avatar
                src={avatar || defaultAvatarSquare}
                alt={name}
                variant="rounded"
                imgProps={{
                    onError: (e) => {
                        e.currentTarget.src = defaultAvatarSquare;
                    },
                }}
                sx={(t) => ({
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    border: "2px solid",
                    borderColor: alpha(t.palette.primary.main, 0.08),
                    boxShadow: `0 2px 8px ${alpha(t.palette.common.black, 0.06)}`,
                })}
            />

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="subtitle2"
                    noWrap
                    title={name}
                    sx={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}
                >
                    {name}
                </Typography>
                <Typography
                    variant="body2"
                    noWrap
                    sx={(t) => ({
                        color: alpha(t.palette.text.primary, 0.5),
                        fontWeight: 600,
                        fontSize: 12.5,
                    })}
                >
                    {username}
                </Typography>
            </Box>

            <Tooltip title="User options">
                <IconButton
                    aria-label="User options"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenMenu?.(e.currentTarget, user);
                    }}
                    sx={(t) => ({
                        width: 34,
                        height: 34,
                        border: "1px solid",
                        borderColor: alpha(t.palette.divider, 0.12),
                        bgcolor: alpha(t.palette.background.default, 0.6),
                        transition: "all 160ms ease",
                        "&:hover": {
                            bgcolor: alpha(t.palette.primary.main, 0.06),
                            borderColor: alpha(t.palette.primary.main, 0.2),
                        },
                    })}
                >
                    <Box sx={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {[0, 1, 2].map((i) => (
                            <Box
                                key={i}
                                component="span"
                                sx={{
                                    display: "inline-block",
                                    width: 3.5,
                                    height: 3.5,
                                    borderRadius: 99,
                                    bgcolor: "text.secondary",
                                    opacity: 0.55,
                                }}
                            />
                        ))}
                    </Box>
                </IconButton>
            </Tooltip>
        </Paper>
    );
}

/* ------------------------------------------------------------------ */
/*  CountFooter — glass-style footer with count badge                   */
/* ------------------------------------------------------------------ */
function CountFooter({ text, loadingMore }) {
    return (
        <Box
            sx={(t) => ({
                flexShrink: 0,
                borderTop: "1px solid",
                borderColor: alpha(t.palette.divider, 0.06),
                px: 2,
                py: 1.25,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: alpha(t.palette.background.paper, 0.85),
                backdropFilter: "saturate(140%) blur(12px)",
                WebkitBackdropFilter: "saturate(140%) blur(12px)",
                gap: 1,
            })}
        >
            {loadingMore ? <CircularProgress size={15} thickness={5} /> : null}
            <Box
                sx={(t) => ({
                    px: 2,
                    py: 0.6,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.secondary.main, 0.06)} 100%)`,
                    border: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                })}
            >
                <Typography
                    variant="caption"
                    sx={(t) => ({
                        fontWeight: 700,
                        fontSize: 11.5,
                        color: alpha(t.palette.text.primary, 0.6),
                        letterSpacing: "0.02em",
                    })}
                >
                    {text}
                </Typography>
            </Box>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  PostsFiltersBar — refined filter bar with pill inputs               */
/* ------------------------------------------------------------------ */
function PostsFiltersBar({
                             postSearchText,
                             setPostSearchText,
                             onApplySearch,
                             onClearSearch,
                             postSort,
                             setPostSort,
                             postDateRange,
                             setPostDateRange,
                         }) {
    const menuProps = {
        PaperProps: {
            sx: {
                bgcolor: "background.paper",
                backgroundImage: "none",
                borderRadius: 2.5,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                border: "1px solid rgba(0,0,0,0.04)",
                mt: 0.5,
            },
        },
        sx: { zIndex: 20000 },
    };

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.02)",
            transition: "all 180ms ease",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.035)" },
            "&.Mui-focused": {
                backgroundColor: "background.paper",
                boxShadow: "0 0 0 3px rgba(25,118,210,0.08)",
            },
        },
    };

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.35fr 0.85fr 0.85fr auto auto" },
                gap: 1.25,
                alignItems: "center",
            }}
        >
            <TextField
                value={postSearchText}
                onChange={(e) => setPostSearchText(e.target.value)}
                label="Search"
                placeholder="Search posts..."
                size="small"
                fullWidth
                sx={inputSx}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        onApplySearch();
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ opacity: 0.5 }} />
                        </InputAdornment>
                    ),
                }}
            />

            <FormControl size="small" fullWidth sx={inputSx}>
                <InputLabel id="group-posts-sort-label">Sort by</InputLabel>
                <Select
                    labelId="group-posts-sort-label"
                    label="Sort by"
                    value={postSort}
                    onChange={(e) => setPostSort(String(e.target.value || "newest"))}
                    MenuProps={menuProps}
                >
                    <MenuItem value="any">Any</MenuItem>
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="popular">Most Popular</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" fullWidth sx={inputSx}>
                <InputLabel id="group-posts-range-label">Date range</InputLabel>
                <Select
                    labelId="group-posts-range-label"
                    label="Date range"
                    value={postDateRange}
                    onChange={(e) => setPostDateRange(String(e.target.value || "all"))}
                    MenuProps={menuProps}
                >
                    <MenuItem value="all">All time</MenuItem>
                    <MenuItem value="24h">Past 24hr</MenuItem>
                    <MenuItem value="7d">Last week</MenuItem>
                    <MenuItem value="30d">Past month</MenuItem>
                </Select>
            </FormControl>

            <IconButton
                onClick={onApplySearch}
                sx={(t) => ({
                    width: 40,
                    height: 40,
                    bgcolor: t.palette.primary.main,
                    color: "common.white",
                    borderRadius: 999,
                    boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.3)}`,
                    transition: "all 180ms ease",
                    "&:hover": {
                        bgcolor: t.palette.primary.dark,
                        boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.4)}`,
                    },
                })}
                aria-label="Search"
            >
                <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>

            <Button
                variant="outlined"
                onClick={onClearSearch}
                sx={(t) => ({
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    px: 2.5,
                    height: 40,
                    whiteSpace: "nowrap",
                    borderColor: alpha(t.palette.divider, 0.15),
                    color: alpha(t.palette.text.primary, 0.6),
                    transition: "all 160ms ease",
                    "&:hover": {
                        borderColor: alpha(t.palette.primary.main, 0.3),
                        bgcolor: alpha(t.palette.primary.main, 0.03),
                        color: t.palette.primary.main,
                    },
                })}
            >
                Clear
            </Button>
        </Box>
    );
}

export { StatPill, SectionCard, MemberCard, CountFooter, PostsFiltersBar };

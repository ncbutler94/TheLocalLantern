import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import SearchInput from "../../../components/SearchInput";

/**
 * EventsHeader (matched to BusinessHubPage desktop header chrome)
 * ---------------------------------------------------------------
 * - "Events" tab pill on the left (segmented-control style, matching Business tabs)
 * - SearchInput fills remaining space (flex: 1 1 auto)
 * - Filter toggle icon + Clear icon + Create Event CTA on the right
 *
 * Notes:
 * - Search/Clear are handled by SearchInput (just like BusinessHubPage).
 */

export default function EventsHeader({
                                         canCreate = true,
                                         onCreateEvent,

                                         query,
                                         onQueryChange,
                                         onSearch,
                                         onClear,

                                         showFilters = true,
                                         onToggleFilters,
                                         onResetFilters,

                                     }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                flexShrink: 0,
                px: 1.5,
                pt: 0.45,
                pb: 0.45,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
                flexWrap: "wrap",
            }}
        >
            {/* Segmented control — Events tab pill (matches BusinessHubPage tab style) */}
            <Box role="tablist" aria-label="Events view" sx={{ flex: "0 0 auto", display: "flex" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                        role="tab"
                        aria-selected
                        variant="text"
                        disableElevation
                        startIcon={
                            <EventRoundedIcon
                                sx={(t) => ({
                                    fontSize: "22px !important",
                                    opacity: 1,
                                    color: t.palette.primary.main,
                                })}
                            />
                        }
                        sx={(t) => ({
                            borderRadius: 999,
                            textTransform: "none",
                            fontFamily: t.typography.fontFamily,
                            fontWeight: 950,
                            letterSpacing: "-0.01em",
                            fontSize: 13.5,
                            lineHeight: 1,
                            "& .MuiButton-startIcon": { marginRight: 0.9 },
                            height: 38,
                            px: 1.75,
                            color: t.palette.primary.main,
                            backgroundColor: alpha(t.palette.primary.main, 0.08),
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.2),
                            boxShadow: "none",
                            flexShrink: 0,
                            transition: `all ${t.custom?.motion?.base || 160}ms ${t.custom?.motion?.ease || "ease"}`,
                            "&:hover": {
                                backgroundColor: alpha(t.palette.primary.main, 0.1),
                                color: t.palette.primary.main,
                            },
                            "&:focus-visible": {
                                outline: "none",
                                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
                            },
                        })}
                    >
                        Events
                    </Button>
                </Box>
            </Box>

            {/* Search — fills remaining space (matches BusinessHubPage) */}
            <Box sx={{ flex: "1 1 auto", minWidth: 200 }}>
                <SearchInput
                    placeholder="Search events"
                    value={query || ""}
                    onChange={(e) => {
                        const next = e?.target?.value ?? "";
                        if (typeof onQueryChange === "function") onQueryChange(next);
                    }}
                    inputProps={{ maxLength: 100 }}
                    onSearch={() => (typeof onSearch === "function" ? onSearch() : undefined)}
                    onClear={() => (typeof onClear === "function" ? onClear() : undefined)}
                />
            </Box>

            {/* Create Event — icon-only at narrow desktop, full at wide */}
            <Tooltip title="Create Event">
                <IconButton
                    onClick={onCreateEvent}
                    size="small"
                    sx={(t) => ({
                        display: "inline-flex",
                        "@media (min-width: 1500px)": { display: "none" },
                        width: 38, height: 38, borderRadius: 999,
                        bgcolor: t.palette.primary.main,
                        color: t.palette.common.white,
                        boxShadow: "none",
                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                    })}
                    aria-label="Create Event"
                >
                    <EditRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Tooltip>
            <Button
                onClick={onCreateEvent}
                variant="contained"
                size="small"
                startIcon={<EditRoundedIcon />}
                sx={(t) => ({
                    display: "none",
                    "@media (min-width: 1500px)": { display: "inline-flex" },
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 900,
                    px: 2.5,
                    height: 38,
                    whiteSpace: "nowrap",
                    bgcolor: t.palette.primary.main,
                    color: t.palette.common.white,
                    boxShadow: "none",
                    "&:hover": {
                        bgcolor: alpha(t.palette.primary.main, 0.92),
                        boxShadow: "none",
                    },
                })}
            >
                Create Event
            </Button>
        </Box>
    );
}

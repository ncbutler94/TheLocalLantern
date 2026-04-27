import React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import SearchInput from "../../../components/SearchInput";

/**
 * MarketplaceHeader — pixel-matched to Jobs header chrome
 * Layout: [Marketplace pill] [Search …] [filter btns] [+ Sell Item]
 * My Listings / Saved / Following are now in the View filter dropdown.
 */

export default function MarketplaceHeader({
                                              canCreate = true,
                                              onCreateListing,

                                              query,
                                              onQueryChange,
                                              onSearch,
                                              onClear,

                                              showFilters = true,
                                              onToggleFilters,
                                              onResetFilters,
                                          }) {
    return (
        <Box
            sx={{
                px: 1, pt: 0.35, pb: 0.35,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
                "@media (min-width: 1024px)": {
                    px: 1.5, pt: 0.45, pb: 0.45,
                    flexWrap: "nowrap",
                },
            }}
        >
            {/* ── Title pill ── */}
            <Box
                sx={(t) => ({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.25, py: 0.6,
                    "@media (min-width: 1024px)": { px: 1.75, py: 0.7 },
                    borderRadius: 999,
                    userSelect: "none",
                    fontWeight: 950,
                    fontSize: 12.5,
                    "@media (min-width: 1024px) ": { fontSize: 13.5 },
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    color: t.palette.primary.main,
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    border: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.2),
                    flexShrink: 0,
                })}
            >
                <StorefrontRoundedIcon sx={{ fontSize: 17 }} />
                Marketplace
            </Box>

            {/* Search */}
            <Box
                sx={(t) => ({
                    flex: "1 1 auto",
                    minWidth: 200,
                    maxWidth: 980,
                    ml: 0.75,
                    mt: 0,
                    "@media (max-width: 1023px)": {
                        minWidth: "100%", maxWidth: "100%", ml: 0, mt: 0.5,
                    },
                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled)": {
                        color: t.palette.common.white,
                    },
                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled):hover": {
                        color: t.palette.common.white,
                    },
                })}
            >
                <SearchInput
                    placeholder="Search listings..."
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

            {/* Actions */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    flexShrink: 0,
                    width: "auto",
                    justifyContent: "flex-start",
                    mt: 0,
                    "@media (max-width: 1023px)": {
                        width: "100%", justifyContent: "flex-end", mt: 0.5,
                    },
                }}
            >
                {/* Toggle Filters */}
                <Tooltip title={showFilters ? "Hide filters" : "Show filters"} arrow>
                    <Button
                        onClick={() => (typeof onToggleFilters === "function" ? onToggleFilters() : undefined)}
                        size="small"
                        variant="outlined"
                        startIcon={<TuneIcon sx={{ fontSize: "18px !important" }} />}
                        sx={(t) => ({
                            height: { xs: 38, sm: 38 },
                            borderRadius: 999,
                            border: "1px solid",
                            borderColor: showFilters ? alpha(t.palette.primary.main, 0.35) : alpha(t.palette.text.primary, 0.12),
                            backgroundColor: showFilters ? alpha(t.palette.primary.main, 0.08) : alpha(t.palette.text.primary, 0.03),
                            color: showFilters ? t.palette.primary.main : t.palette.text.secondary,
                            textTransform: "none",
                            fontWeight: 800,
                            fontSize: 13,
                            px: 1.25,
                            minWidth: 0,
                            "&:hover": {
                                backgroundColor: showFilters ? alpha(t.palette.primary.main, 0.12) : alpha(t.palette.text.primary, 0.06),
                                borderColor: showFilters ? alpha(t.palette.primary.main, 0.45) : alpha(t.palette.text.primary, 0.18),
                            },
                        })}
                        aria-label={showFilters ? "Hide filters" : "Show filters"}
                    >
                        Filters
                    </Button>
                </Tooltip>

                {/* Clear filters */}
                <Tooltip title="Clear filters" arrow>
                    <IconButton
                        onClick={() => (typeof onResetFilters === "function" ? onResetFilters() : undefined)}
                        size="small"
                        sx={(t) => ({
                            width: 38,
                            height: 38,
                            borderRadius: 999,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            backgroundColor: alpha(t.palette.text.primary, 0.03),
                            "&:hover": {
                                backgroundColor: alpha(t.palette.primary.main, 0.06),
                                borderColor: alpha(t.palette.primary.main, 0.18),
                            },
                        })}
                        aria-label="Clear filters"
                    >
                        <RestartAltRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* Create Listing — icon-only at narrow desktop, full at wide */}
                <Tooltip title="Sell Item">
                    <IconButton
                        onClick={onCreateListing}
                        size="small"
                        sx={(t) => ({
                            display: "inline-flex",
                            "@media (min-width: 1500px)": { display: "none" },
                            width: 38, height: 38, borderRadius: 999,
                            boxShadow: `0 10px 18px ${alpha(t.palette.text.primary, 0.14)}`,
                            background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                            color: t.palette.common.white,
                            "&:hover": {
                                boxShadow: `0 12px 22px ${alpha(t.palette.text.primary, 0.18)}`,
                                background: `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
                            },
                        })}
                        aria-label="Sell Item"
                    >
                        <AddRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Tooltip>
                <Button
                    onClick={onCreateListing}
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    sx={(t) => ({
                        display: "none",
                        "@media (min-width: 1500px)": { display: "inline-flex" },
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 950,
                        px: 1.35,
                        height: 38,
                        minWidth: 132,
                        justifyContent: "center",
                        boxShadow: `0 10px 18px ${alpha(t.palette.text.primary, 0.14)}`,
                        background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                        "&:hover": {
                            boxShadow: `0 12px 22px ${alpha(t.palette.text.primary, 0.18)}`,
                            background: `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
                        },
                    })}
                >
                    Sell Item
                </Button>
            </Box>
        </Box>
    );
}

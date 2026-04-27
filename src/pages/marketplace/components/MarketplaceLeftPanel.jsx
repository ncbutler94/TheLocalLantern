// src/pages/marketplace/components/MarketplaceLeftPanel.jsx
//
// Mirrors CommunityLeftPanel structure:
// - Action bar slot (tabs/search/buttons)
// - Collapsible filters slot
// - Scroll list slot
// - Bottom status bar slot
//
// This component is intentionally "dumb" (presentational) to preserve MarketplacePage logic.

import React from "react";
import PropTypes from "prop-types";
import { Box, Divider, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function MarketplaceLeftPanel({
                                                 actionBar,
                                                 filters,
                                                 showFilters,
                                                 list,
                                                 footerText,
                                             }) {
    return (
        <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box
                sx={(t) => ({
                    p: { xs: 1, md: 1.25 },
                    borderBottom: "1px solid",
                    borderBottomColor: alpha(t.palette.primary.main, 0.08),
                })}
            >
                {actionBar}
            </Box>

            {showFilters ? (
                <Box sx={{ flexShrink: 0, p: { xs: 1, md: 1.25 } }}>{filters}</Box>
            ) : null}

            <Divider sx={{ borderColor: (t) => alpha(t.palette.primary.main, 0.10) }} />

            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{list}</Box>

            <Box
                sx={(t) => ({
                    flexShrink: 0,
                    px: { xs: 1.25, md: 1.5 },
                    py: 1,
                    borderTop: "1px solid",
                    borderTopColor: alpha(t.palette.primary.main, 0.12),
                    bgcolor: alpha(t.palette.background.paper, 0.62),
                    backgroundImage: "none",
                    backdropFilter: "saturate(140%) blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                })}
            >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800, fontSize: 13, width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22 }}>
                    {footerText}
                </Typography>
            </Box>
        </Box>
    );
}

MarketplaceLeftPanel.propTypes = {
    actionBar: PropTypes.node.isRequired,
    filters: PropTypes.node.isRequired,
    showFilters: PropTypes.bool.isRequired,
    list: PropTypes.node.isRequired,
    footerText: PropTypes.string.isRequired,
};

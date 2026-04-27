// src/pages/marketplace/components/MarketplaceListingSkeleton.jsx
// Skeleton matching actual ListingCard layout: accent bar, photo+text side-by-side,
// seller row, action bar with divider

import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

const prefersReducedMotion = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

export default function MarketplaceListingSkeleton({ shimmer = true }) {
    return (
        <Box
            sx={(t) => ({
                borderRadius: "16px",
                border: "1px solid",
                borderColor: alpha(t.palette.text.primary, 0.08),
                bgcolor: t.palette.background.paper,
                overflow: "hidden",
                boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.06)}`,
                position: "relative",
                isolation: "isolate",
                display: "flex",
                flexDirection: "column",
                ...(shimmer ? {
                    "@keyframes llMktShimmer": {
                        "0%": { transform: "translateX(-120%)" },
                        "100%": { transform: "translateX(120%)" },
                    },
                    "&::before": {
                        content: '""', position: "absolute", inset: 0,
                        background: (t) => `linear-gradient(90deg, ${alpha(t.palette.common.white, 0)} 0%, ${alpha(t.palette.common.white, 0.15)} 50%, ${alpha(t.palette.common.white, 0)} 100%)`,
                        transform: "translateX(-120%)",
                        animation: prefersReducedMotion() ? "none" : "llMktShimmer 1.2s ease-in-out infinite",
                        pointerEvents: "none", zIndex: 0,
                    },
                    "& > *": { position: "relative", zIndex: 1 },
                } : null),
            })}
        >
            {/* Accent bar */}
            <Box sx={(t) => ({ height: 3, bgcolor: alpha(t.palette.primary.main, 0.15) })} />

            {/* Content area */}
            <Box sx={{ p: 2, pt: 1.75, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top right chip placeholder */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
                    <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 999 }} />
                </Box>

                {/* Photo + info row */}
                <Box sx={{ display: "flex", gap: 1.75 }}>
                    {/* Photo placeholder */}
                    <Skeleton variant="rounded" sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 }, borderRadius: "12px", flexShrink: 0 }} />

                    {/* Text placeholders */}
                    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Skeleton height={16} width="85%" />
                        <Skeleton height={16} width="55%" />
                        <Skeleton height={14} width="35%" sx={{ mt: 0.25 }} />
                        <Skeleton variant="rounded" width={65} height={20} sx={{ borderRadius: 999, mt: 0.25 }} />
                    </Box>
                </Box>

                {/* Seller row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25 }}>
                    <Skeleton variant="circular" width={34} height={34} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Skeleton height={12} width="40%" />
                        <Skeleton height={10} width="25%" sx={{ mt: 0.25 }} />
                    </Box>
                    <Skeleton height={12} width={70} />
                </Box>
            </Box>

            {/* Action bar */}
            <Box sx={{ px: 1.75, pt: 0.75, pb: 1, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="rounded" width={44} height={26} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={44} height={26} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={30} height={26} sx={{ borderRadius: 999 }} />
                <Box sx={{ flex: 1 }} />
                <Skeleton height={10} width={30} />
            </Box>
        </Box>
    );
}

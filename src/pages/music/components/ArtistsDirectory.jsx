import React, { useEffect, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ArtistCard from "./ArtistCard";
import PulsingDots from "../../../components/PulsingDots";
import { ensureListStaggerKeyframes, getListStaggerSx } from "../../../themes/theme";

/**
 * ArtistsDirectory
 * - Renders a grid of ArtistCard items (restyled to match BusinessDirectoryCard)
 * - Supports hover state tracking for map sync / visual feedback
 * - Styled to match Community "Groups" list area (no extra header block)
 *
 * Intended location:
 *   src/pages/music/components/ArtistsDirectory.jsx
 */

export default function ArtistsDirectory({
                                             artists = [],
                                             loading = false,
                                             error = "",
                                             defaultAvatarSrc = "",
                                             onOpenArtist,
                                             selectedArtistId,
                                         }) {
    const hasArtists = Array.isArray(artists) && artists.length > 0;
    const [hoveredId, setHoveredId] = useState(null);

    const dirTheme = useTheme();
    const isMobile = useMediaQuery(dirTheme.breakpoints.down("md"));

    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ p: { xs: 0, md: 0 } }}>
                {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240, width: "100%", height: "100%" }}>
                        <PulsingDots />
                    </Box>
                ) : hasArtists ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            width: "100%",
                            overflowX: "hidden",
                        }}
                    >
                        {artists.map((a, idx) => {
                            const key = a.id || a.handle || a.name;

                            const isSelected =
                                (selectedArtistId &&
                                    a.id &&
                                    String(a.id) === String(selectedArtistId)) ||
                                (selectedArtistId &&
                                    a.handle &&
                                    String(a.handle) === String(selectedArtistId));

                            return (
                                <Box
                                    key={key}
                                    sx={(t) => ({
                                        flex: {
                                            xs: "0 0 100%",
                                            sm: "0 0 100%",
                                            md: "0 0 calc(50% - 16px)",
                                            lg: "0 0 calc(50% - 16px)",
                                            xl: "0 0 calc(50% - 16px)",
                                        },
                                        mx: { xs: 0, md: 1 },
                                        my: { xs: 0, md: 1 },
                                        minWidth: 0,
                                        maxWidth: "100%",
                                        ...getListStaggerSx(idx),
                                    })}
                                >
                                    <ArtistCard
                                        artist={a}
                                        defaultAvatarSrc={defaultAvatarSrc}
                                        onOpenArtist={onOpenArtist}
                                        selected={isSelected}
                                        hovered={String(hoveredId) === String(a.id)}
                                        onHover={setHoveredId}
                                        flat={isMobile}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <EmptyState />
                )}
            </Box>
        </Box>
    );
}

function EmptyState() {
    return (
        <Stack spacing={0.75} sx={{ py: 5 }} alignItems="center" textAlign="center">
            <Typography sx={{ fontWeight: 900 }}>No artists found</Typography>
            <Typography variant="body2" color="text.secondary">
                Try adjusting your filters.
            </Typography>
        </Stack>
    );
}
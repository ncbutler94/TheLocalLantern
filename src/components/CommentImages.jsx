// src/components/CommentImages.jsx
//
// Renders comment images/GIFs in a responsive grid (1–4 images).
// Falls back to single `image` field for backward compat with posts.js comments.

import React, { useState } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Dialog, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

/**
 * CommentImages
 *
 * Props:
 *  - images: string[] — array of image URLs
 *  - image: string|null — single image URL (backward compat)
 */
export default function CommentImages({ images, image }) {
    const [lightboxIdx, setLightboxIdx] = useState(-1);

    // Build final URL list: prefer `images` array, fall back to single `image`
    const urls = (() => {
        if (Array.isArray(images) && images.length > 0) return images.filter(Boolean);
        if (image) return [image];
        return [];
    })();

    if (urls.length === 0) return null;

    const count = urls.length;
    const isSingle = count === 1;
    const isGif = (url) => /\.gif(\?|$)/i.test(url) || /tenor\.com/i.test(url);

    return (
        <>
            <Box
                sx={{
                    mt: 0.75,
                    display: "grid",
                    gridTemplateColumns: isSingle ? "1fr" : "1fr 1fr",
                    gap: 0.5,
                    maxWidth: isSingle ? 280 : 320,
                }}
            >
                {urls.map((url, idx) => (
                    <Box
                        key={idx}
                        onClick={() => setLightboxIdx(idx)}
                        sx={(t) => ({
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            bgcolor: alpha(t.palette.text.primary, 0.03),
                            border: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            ...(isSingle
                                ? { maxWidth: 320, maxHeight: 360 }
                                : { aspectRatio: "4/3", maxHeight: 160 }),
                            "&:hover": { opacity: 0.88 },
                            transition: "opacity 120ms ease",
                        })}
                    >
                        <img
                            src={url}
                            alt={`comment image ${idx + 1}`}
                            loading="lazy"
                            style={{
                                width: "100%",
                                height: isSingle ? "auto" : "100%",
                                maxHeight: isSingle ? 360 : "100%",
                                objectFit: isSingle ? "contain" : "cover",
                                display: "block",
                            }}
                        />
                        {isGif(url) && (
                            <Box
                                sx={(t) => ({
                                    position: "absolute",
                                    bottom: 4,
                                    left: 4,
                                    bgcolor: alpha(t.palette.common.black, 0.6),
                                    color: "#fff",
                                    fontSize: 9,
                                    fontWeight: 800,
                                    px: 0.5,
                                    py: 0.15,
                                    borderRadius: 0.5,
                                    lineHeight: 1.2,
                                })}
                            >
                                GIF
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>

            {/* Lightbox */}
            <Dialog
                open={lightboxIdx >= 0}
                onClose={() => setLightboxIdx(-1)}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: "transparent",
                        boxShadow: "none",
                        border: "none",
                        overflow: "visible",
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                    },
                }}
            >
                {lightboxIdx >= 0 && urls[lightboxIdx] && (
                    <Box sx={{ position: "relative" }}>
                        <IconButton
                            onClick={() => setLightboxIdx(-1)}
                            sx={(t) => ({
                                position: "absolute",
                                top: -16,
                                right: -16,
                                bgcolor: alpha(t.palette.common.black, 0.6),
                                color: "#fff",
                                width: 32,
                                height: 32,
                                zIndex: 2,
                                "&:hover": { bgcolor: alpha(t.palette.common.black, 0.8) },
                            })}
                        >
                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <img
                            src={urls[lightboxIdx]}
                            alt="full size"
                            style={{
                                display: "block",
                                maxWidth: "85vw",
                                maxHeight: "85vh",
                                borderRadius: 12,
                                objectFit: "contain",
                            }}
                        />
                    </Box>
                )}
            </Dialog>
        </>
    );
}

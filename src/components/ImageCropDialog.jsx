// src/components/ImageCropDialog.jsx
//
// A lightweight, dependency-free image crop dialog.
// Shows a preview of how the image will appear when displayed with object-fit: cover
// at the given aspect ratio. The user can drag to pan and scroll/pinch to zoom,
// then confirm or skip. Returns a cropped Blob via onConfirm.
//
// Props:
//   open           – boolean
//   file           – File object (the original image the user picked)
//   aspectRatio    – number (width / height), e.g. 16/9 for events
//   aspectLabel    – string shown to user, e.g. "event banner" or "listing cover"
//   onConfirm      – (croppedBlob: Blob) => void
//   onSkip         – () => void   (use original without cropping)
//   onClose        – () => void   (cancel entirely)

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Stack,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import CropIcon from "@mui/icons-material/Crop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

// ── helpers ──────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Draw the cropped region to a canvas and return as a Blob.
 */
function cropToBlob(img, cropX, cropY, cropW, cropH, outputW, outputH) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outputW, outputH);
        canvas.toBlob(
            (blob) => resolve(blob),
            "image/jpeg",
            0.92
        );
    });
}


// ── component ────────────────────────────────────────────────────────────────

export default function ImageCropDialog({
                                            open,
                                            file,
                                            aspectRatio = 16 / 9,
                                            aspectLabel = "cover photo",
                                            onConfirm,
                                            onSkip,
                                            onClose,
                                        }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imgRef = useRef(null);

    const [imgSrc, setImgSrc] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [zoom, setZoom] = useState(1);       // 1 = minimum (fit)
    const [panX, setPanX] = useState(0);        // in image-space pixels
    const [panY, setPanY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);

    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    // Load image from File
    useEffect(() => {
        if (!open || !file) {
            setImgSrc(null);
            setImgLoaded(false);
            return;
        }
        const url = URL.createObjectURL(file);
        setImgSrc(url);
        setImgLoaded(false);
        setZoom(1);
        setPanX(0);
        setPanY(0);
        return () => URL.revokeObjectURL(url);
    }, [open, file]);

    // Load the actual Image element
    useEffect(() => {
        if (!imgSrc) return;
        let cancelled = false;
        loadImage(imgSrc).then((img) => {
            if (cancelled) return;
            imgRef.current = img;
            setImgLoaded(true);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [imgSrc]);

    // ── compute geometry ─────────────────────────────────────────────────────
    const getGeometry = useCallback(() => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container) return null;

        const cW = container.clientWidth;
        const cH = container.clientHeight;
        if (!cW || !cH) return null;

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const imgAR = imgW / imgH;

        // The visible "crop window" matches the container aspect ratio (== aspectRatio)
        // We need to figure out what part of the image is visible.

        // At zoom=1, the image is scaled so it *just covers* the crop window
        // (same as object-fit:cover).
        let baseScale;
        if (imgAR > aspectRatio) {
            // image is wider than the window — fit by height
            baseScale = cH / imgH;
        } else {
            // image is taller than the window — fit by width
            baseScale = cW / imgW;
        }

        const scale = baseScale * zoom;

        const scaledW = imgW * scale;
        const scaledH = imgH * scale;

        // Max pan: how far we can move the image (in image-space pixels)
        const maxPanX = Math.max(0, (scaledW - cW) / 2 / scale);
        const maxPanY = Math.max(0, (scaledH - cH) / 2 / scale);

        // The crop region in image-space (source coordinates for drawImage)
        const cropW = cW / scale;
        const cropH = cH / scale;
        const cropX = (imgW - cropW) / 2 - clamp(panX, -maxPanX, maxPanX);
        const cropY = (imgH - cropH) / 2 - clamp(panY, -maxPanY, maxPanY);

        return {
            cW, cH, imgW, imgH, scale, baseScale,
            scaledW, scaledH, maxPanX, maxPanY,
            cropX, cropY, cropW, cropH,
        };
    }, [zoom, panX, panY, aspectRatio]);

    // ── draw ─────────────────────────────────────────────────────────────────
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const geo = getGeometry();
        if (!geo) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = geo.cW * dpr;
        canvas.height = geo.cH * dpr;
        canvas.style.width = `${geo.cW}px`;
        canvas.style.height = `${geo.cH}px`;

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, geo.cW, geo.cH);

        // Draw the visible portion of the image
        ctx.drawImage(
            img,
            geo.cropX, geo.cropY, geo.cropW, geo.cropH,
            0, 0, geo.cW, geo.cH
        );
    }, [getGeometry]);

    useEffect(() => {
        if (imgLoaded) draw();
    }, [imgLoaded, draw, zoom, panX, panY]);

    // Redraw on resize
    useEffect(() => {
        if (!imgLoaded) return;
        const ro = new ResizeObserver(() => draw());
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [imgLoaded, draw]);

    // ── pan (mouse) ──────────────────────────────────────────────────────────
    const handleMouseDown = (e) => {
        e.preventDefault();
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY, panX, panY };
    };

    const handleMouseMove = useCallback((e) => {
        if (!dragging) return;
        const geo = getGeometry();
        if (!geo) return;

        const dx = (e.clientX - dragStart.current.x) / geo.scale;
        const dy = (e.clientY - dragStart.current.y) / geo.scale;

        setPanX(clamp(dragStart.current.panX + dx, -geo.maxPanX, geo.maxPanX));
        setPanY(clamp(dragStart.current.panY + dy, -geo.maxPanY, geo.maxPanY));
    }, [dragging, getGeometry]);

    const handleMouseUp = useCallback(() => {
        setDragging(false);
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [dragging, handleMouseMove, handleMouseUp]);

    // ── pan (touch) ──────────────────────────────────────────────────────────
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            dragStart.current = { x: t.clientX, y: t.clientY, panX, panY };
            setDragging(true);
        }
    };

    const handleTouchMove = useCallback((e) => {
        if (!dragging || e.touches.length !== 1) return;
        e.preventDefault();
        const geo = getGeometry();
        if (!geo) return;

        const t = e.touches[0];
        const dx = (t.clientX - dragStart.current.x) / geo.scale;
        const dy = (t.clientY - dragStart.current.y) / geo.scale;

        setPanX(clamp(dragStart.current.panX + dx, -geo.maxPanX, geo.maxPanX));
        setPanY(clamp(dragStart.current.panY + dy, -geo.maxPanY, geo.maxPanY));
    }, [dragging, getGeometry]);

    const handleTouchEnd = useCallback(() => {
        setDragging(false);
    }, []);

    // ── zoom (wheel) ─────────────────────────────────────────────────────────
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.08 : -0.08), 1, 3));
    }, []);

    // Clamp pan when zoom changes
    useEffect(() => {
        const geo = getGeometry();
        if (!geo) return;
        setPanX((px) => clamp(px, -geo.maxPanX, geo.maxPanX));
        setPanY((py) => clamp(py, -geo.maxPanY, geo.maxPanY));
    }, [zoom, getGeometry]);

    // ── confirm crop ─────────────────────────────────────────────────────────
    const handleConfirm = async () => {
        const img = imgRef.current;
        const geo = getGeometry();
        if (!img || !geo) return;

        setProcessing(true);
        try {
            // Output resolution: use the crop region at full image resolution
            const outW = Math.round(geo.cropW);
            const outH = Math.round(geo.cropH);
            const blob = await cropToBlob(
                img, geo.cropX, geo.cropY, geo.cropW, geo.cropH,
                Math.min(outW, 2400), Math.min(outH, 2400)
            );
            onConfirm?.(blob);
        } catch {
            // If crop fails, skip
            onSkip?.();
        } finally {
            setProcessing(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            sx={{ zIndex: (t) => t.zIndex.modal + 60 }}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    overflow: "hidden",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pr: 6,
                    fontWeight: 800,
                    fontSize: 17,
                }}
            >
                <CropIcon sx={{ fontSize: 20, color: "primary.main" }} />
                Adjust {aspectLabel}
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    size="small"
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
                {/* Instructional text */}
                <Box sx={{ px: 2.5, pt: 1, pb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.4 }}>
                        This preview shows how your photo will appear. Drag to reposition
                        {!isMobile && " and scroll to zoom"}.
                    </Typography>
                </Box>

                {/* Canvas container */}
                <Box
                    ref={containerRef}
                    sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: `${aspectRatio}`,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.04),
                        overflow: "hidden",
                        cursor: dragging ? "grabbing" : "grab",
                        touchAction: "none",
                        mx: "auto",
                    }}
                >
                    {imgLoaded ? (
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onWheel={handleWheel}
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                                Loading image…
                            </Typography>
                        </Box>
                    )}

                    {/* Subtle corner marks to indicate crop area */}
                    {imgLoaded && (
                        <>
                            {[
                                { top: 0, left: 0 },
                                { top: 0, right: 0 },
                                { bottom: 0, left: 0 },
                                { bottom: 0, right: 0 },
                            ].map((pos, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        position: "absolute",
                                        ...pos,
                                        width: 20,
                                        height: 20,
                                        pointerEvents: "none",
                                        borderTop: pos.top === 0 ? "2.5px solid" : "none",
                                        borderBottom: pos.bottom === 0 ? "2.5px solid" : "none",
                                        borderLeft: pos.left === 0 ? "2.5px solid" : "none",
                                        borderRight: pos.right === 0 ? "2.5px solid" : "none",
                                        borderColor: "common.white",
                                        opacity: 0.7,
                                        zIndex: 2,
                                    }}
                                />
                            ))}
                        </>
                    )}
                </Box>

                {/* Zoom slider */}
                {imgLoaded && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ px: 3, py: 1.5 }}
                    >
                        <ZoomOutIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Slider
                            value={zoom}
                            onChange={(_, v) => setZoom(v)}
                            min={1}
                            max={3}
                            step={0.01}
                            size="small"
                            sx={{ flex: 1 }}
                        />
                        <ZoomInIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </Stack>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    px: 2.5,
                    py: 1.5,
                    justifyContent: "space-between",
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Button
                    onClick={onSkip}
                    disabled={processing}
                    sx={{ fontWeight: 700, fontSize: 13 }}
                >
                    Skip cropping
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={!imgLoaded || processing}
                    sx={{ fontWeight: 800, fontSize: 13, px: 3 }}
                >
                    {processing ? "Cropping…" : "Apply crop"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// src/components/HighlightPhotoCropDialog.jsx
//
// Shared crop dialog for highlight-section photos.
// Used by BusinessAdminPage, CreateServicePage, and ServiceAdminConsole.
//
// Usage:
//   import HighlightPhotoCropDialog from '…/HighlightPhotoCropDialog';
//
//   <HighlightPhotoCropDialog
//       open={hlCropOpen}
//       imageSrc={hlCropSrc}
//       onClose={() => { setHlCropOpen(false); setHlCropSrc(null); }}
//       onCropComplete={(croppedBlob) => { /* handle blob */ }}
//   />

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Typography,
} from "@mui/material";
import CropIcon from "@mui/icons-material/Crop";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

// ─── Crop helpers (self-contained) ───────────────────────

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", reject);
        img.crossOrigin = "anonymous";
        img.src = url;
    });
}

async function cropToBlob(imageSrc, pixelCrop, outputWidth, outputHeight) {
    const image = await loadImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight,
    );
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
            "image/jpeg",
            0.92,
        );
    });
}

// ─── Constants ───────────────────────────────────────────

const HIGHLIGHT_ASPECT = 16 / 9;
const HIGHLIGHT_OUTPUT_W = 960;
const HIGHLIGHT_OUTPUT_H = 540;

// ─── Component ───────────────────────────────────────────

export default function HighlightPhotoCropDialog({
                                                     open,
                                                     imageSrc,
                                                     onClose,
                                                     onCropComplete,
                                                     aspect = HIGHLIGHT_ASPECT,
                                                     outputWidth = HIGHLIGHT_OUTPUT_W,
                                                     outputHeight = HIGHLIGHT_OUTPUT_H,
                                                     title = "Crop Highlight Photo",
                                                 }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleCropChange = useCallback((c) => setCrop(c), []);
    const handleZoomChange = useCallback((z) => setZoom(z), []);
    const handleCropCompleteInternal = useCallback((_area, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleClose = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
    };

    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return;
        setProcessing(true);
        try {
            const croppedBlob = await cropToBlob(
                imageSrc,
                croppedAreaPixels,
                outputWidth,
                outputHeight,
            );
            onCropComplete(croppedBlob);
            handleClose();
        } catch {
            // silent
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CropIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: { xs: 260, sm: 360 },
                        bgcolor: "grey.900",
                    }}
                >
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            showGrid
                            onCropChange={handleCropChange}
                            onZoomChange={handleZoomChange}
                            onCropComplete={handleCropCompleteInternal}
                        />
                    )}
                </Box>
                <Box sx={{ px: 3, py: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <ZoomInIcon sx={{ color: "text.secondary" }} />
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(_e, z) => setZoom(z)}
                            sx={{ color: "primary.main" }}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleClose}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={processing}
                    sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: "primary.dark",
                        "&:hover": { bgcolor: "primary.main" },
                    }}
                >
                    {processing ? "Processing…" : "Apply Crop"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

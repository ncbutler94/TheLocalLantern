// src/components/CommentImageAttachments.jsx
//
// Toolbar + preview strip for attaching up to 4 images (or GIFs) to a comment.
//
// Images are NOT uploaded on selection — they are kept as local File objects
// and shown via blob URLs. Upload to GCS happens only at comment submit time
// (handled by the parent using the exported `uploadFileToGCS` helper).
//
// Tenor GIFs are already URLs, so they go straight into `urls`.
//
// Usage:
//   <CommentImageAttachments
//       files={commentFiles}         // File[] — local image files (not yet uploaded)
//       urls={commentUrls}           // string[] (Tenor GIF URLs only, pre-submit)
//       onFilesChange={setFiles}     // called with updated File[]
//       onUrlsChange={setUrls}       // called with updated string[] (GIF URLs)
//       maxImages={4}
//       disabled={posting}
//   />

import React, { useRef, useState, useMemo, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TenorGifPicker from "./TenorGifPicker";
import { secureFetch } from "../utils/secureFetch";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/**
 * Upload a single file to GCS via the signed-URL flow.
 * Returns the public URL on success, or null on failure.
 *
 * Exported so the parent component can call it at submit time.
 */
export async function uploadFileToGCS(file) {
    try {
        // 1) Get a signed upload URL from the backend
        const signedRes = await secureFetch("/api/uploads/signed-url", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                folder: "comment_photos",
                fileName: file.name || `image_${Date.now()}`,
                contentType: file.type || "image/jpeg",
            }),
        });
        if (!signedRes.ok) return null;
        const { uploadUrl, publicUrl } = await signedRes.json();
        if (!uploadUrl || !publicUrl) return null;

        // 2) PUT the file directly to GCS
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
        });
        if (!uploadRes.ok) return null;

        return publicUrl;
    } catch {
        return null;
    }
}

/**
 * Upload an array of File objects to GCS in parallel.
 * Returns an array of public URLs (nulls filtered out).
 */
export async function uploadFilesToGCS(files) {
    const results = await Promise.all(files.map((f) => uploadFileToGCS(f)));
    return results.filter(Boolean);
}

export default function CommentImageAttachments({
                                                    files = [],
                                                    urls = [],
                                                    onFilesChange,
                                                    onUrlsChange,
                                                    maxImages = 4,
                                                    disabled = false,
                                                }) {
    const fileInputRef = useRef(null);
    const [moderationError, setModerationError] = useState('');
    const [scanning, setScanning] = useState(0); // count of in-flight moderation scans
    const totalCount = files.length + urls.length;
    const canAdd = totalCount < maxImages;

    // Create blob preview URLs for local File objects, and revoke old ones on change
    const blobUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

    useEffect(() => {
        return () => {
            // Revoke all blob URLs on unmount or when files change
            blobUrls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [blobUrls]);

    /**
     * Scan a single image file for NSFW content via the backend.
     * Returns { safe: true } or { safe: false, message: '...' }.
     */
    const scanFile = async (file) => {
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await secureFetch('/api/community/moderate-image', {
                method: 'POST',
                credentials: 'include',
                body: fd,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                if (data && data.safe === false) return { safe: false, message: data.message || 'This image was flagged as inappropriate and cannot be uploaded.' };
                return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
            }
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image was flagged as inappropriate and cannot be uploaded.' };
            return { safe: true };
        } catch {
            return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
        }
    };

    const handleFileSelect = async (e) => {
        const selected = Array.from(e.target.files || []);
        if (!selected.length) return;

        // Reset so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (moderationError) setModerationError('');

        // Block GIF files — users should use the GIF button instead
        const hasGif = selected.some((f) => f.type === 'image/gif' || f.name?.toLowerCase().endsWith('.gif'));
        if (hasGif) {
            setModerationError('GIF files cannot be uploaded here. Please use the GIF button instead.');
            return;
        }

        const valid = selected
            .filter((f) => f.size <= MAX_FILE_SIZE)
            .slice(0, maxImages - totalCount);
        if (valid.length === 0) return;

        // Scan each file for NSFW content before accepting
        setScanning(valid.length);
        const safe = [];
        for (const file of valid) {
            const result = await scanFile(file);
            if (!result.safe) {
                setModerationError(result.message);
                break;
            }
            safe.push(file);
        }
        setScanning(0);

        if (safe.length === 0) return;

        // Add the safe files to the parent's file state (NO upload yet)
        if (onFilesChange) {
            onFilesChange([...files, ...safe]);
        }
    };

    const removeFile = (idx) => {
        if (moderationError) setModerationError('');
        if (onFilesChange) onFilesChange(files.filter((_, i) => i !== idx));
    };

    const removeUrl = (idx) => {
        if (moderationError) setModerationError('');
        if (onUrlsChange) onUrlsChange(urls.filter((_, i) => i !== idx));
    };

    const handleGifSelect = (gifUrl) => {
        if (!gifUrl || !canAdd) return;
        if (onUrlsChange) onUrlsChange([...urls, gifUrl]);
    };

    const hasAttachments = files.length > 0 || urls.length > 0 || scanning > 0;

    return (
        <Box>
            {/* Toolbar buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                {/* Photo upload button */}
                <Tooltip title={canAdd ? "Add image" : `Max ${maxImages} images`} arrow>
                    <span>
                        <IconButton
                            size="small"
                            disabled={disabled || !canAdd || scanning > 0}
                            onClick={() => fileInputRef.current?.click()}
                            sx={(t) => ({
                                width: 34,
                                height: 34,
                                borderRadius: 1.5,
                                color: t.palette.text.secondary,
                                "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) },
                            })}
                        >
                            {scanning > 0 ? (
                                <CircularProgress size={18} sx={{ color: "text.secondary" }} />
                            ) : (
                                <AddPhotoAlternateRoundedIcon sx={{ fontSize: 20 }} />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>

                {/* GIF picker */}
                <TenorGifPicker onSelect={handleGifSelect} disabled={disabled || !canAdd} />

                {(totalCount > 0 || scanning > 0) && (
                    <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontSize: 11, fontWeight: 600 }}>
                        {scanning > 0 ? `Checking ${scanning}…` : `${totalCount}/${maxImages}`}
                    </Typography>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                />
            </Box>

            {/* Moderation error message */}
            {moderationError && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 0.5,
                        color: 'error.main',
                        fontWeight: 600,
                        fontSize: 12,
                        lineHeight: 1.4,
                    }}
                >
                    {moderationError}
                </Typography>
            )}

            {/* Preview strip */}
            {hasAttachments && (
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        mt: 0.75,
                    }}
                >
                    {/* Local file previews (blob URLs) */}
                    {blobUrls.map((blobUrl, idx) => {
                        const isGif = files[idx]?.type === 'image/gif';
                        return (
                            <PreviewThumb
                                key={`file-${idx}`}
                                src={blobUrl}
                                onRemove={() => removeFile(idx)}
                                disabled={disabled}
                                isGif={isGif}
                            />
                        );
                    })}

                    {/* URL previews (Tenor GIFs) */}
                    {urls.map((url, idx) => {
                        const isGif = /\.gif(\?|$)/i.test(url) || /tenor\.com/i.test(url);
                        return (
                            <PreviewThumb
                                key={`url-${idx}`}
                                src={url}
                                onRemove={() => removeUrl(idx)}
                                disabled={disabled}
                                isGif={isGif}
                            />
                        );
                    })}

                    {/* Scanning placeholders */}
                    {Array.from({ length: scanning }).map((_, idx) => (
                        <Box
                            key={`scanning-${idx}`}
                            sx={(t) => ({
                                width: 72,
                                height: 72,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: alpha(t.palette.text.primary, 0.08),
                                bgcolor: alpha(t.palette.text.primary, 0.03),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            })}
                        >
                            <CircularProgress size={18} sx={{ color: "text.disabled" }} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

function PreviewThumb({ src, onRemove, disabled, isGif }) {
    return (
        <Box
            sx={(t) => ({
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid",
                borderColor: alpha(t.palette.text.primary, 0.08),
                bgcolor: alpha(t.palette.text.primary, 0.03),
                flexShrink: 0,
            })}
        >
            <img
                src={src}
                alt="attachment"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />

            {isGif && (
                <Box
                    sx={(t) => ({
                        position: "absolute",
                        bottom: 3,
                        left: 3,
                        bgcolor: alpha(t.palette.common.black, 0.6),
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 800,
                        px: 0.5,
                        py: 0.1,
                        borderRadius: 0.5,
                        lineHeight: 1.2,
                    })}
                >
                    GIF
                </Box>
            )}

            {!disabled && (
                <IconButton
                    size="small"
                    onClick={onRemove}
                    sx={(t) => ({
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        bgcolor: alpha(t.palette.common.black, 0.55),
                        color: "#fff",
                        "&:hover": { bgcolor: alpha(t.palette.common.black, 0.75) },
                    })}
                >
                    <CloseRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
            )}
        </Box>
    );
}

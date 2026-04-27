// src/pages/music/admin/tabs/PhotosTab.jsx
/**
 * PhotosTab — Gallery Only
 * Uses the shared PhotosUploadSection component (same as business admin).
 * Profile photo and cover photo are handled by ArtistAdminConsole directly.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, Box, Typography } from "@mui/material";
import PhotosUploadSection from "../../../../components/PhotosUploadSection";
import { addArtistPhotos, deleteArtistPhoto } from "../../api/artists";
import { validateImageFile } from '../../../../utils/validateImage';

// ── GCS upload helper (mirrors ArtistAdminConsole pattern) ──
async function uploadFileToGCS(file, folder) {
    const res = await fetch("/api/uploads/signed-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            folder,
            fileName: `${Date.now()}_${file.name || "photo.jpg"}`,
            contentType: file.type || "image/jpeg",
            kind: "artist_photo",
        }),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let friendlyMsg = "Failed to get upload URL";
        try {
            const errData = JSON.parse(errText);
            if (errData?.error === "invalid_content_type") {
                friendlyMsg = "This file type isn\u2019t supported. Please upload a JPG, PNG, or WebP image.";
            } else if (errData?.error === "file_too_large") {
                friendlyMsg = "This file is too large. Please choose a smaller image (max 10 MB).";
            } else if (errData?.error) {
                friendlyMsg = errData.message || `Upload failed: ${errData.error.replace(/_/g, " ")}`;
            }
        } catch {
            if (errText) friendlyMsg = errText;
        }
        throw new Error(friendlyMsg);
    }
    const data = await res.json();
    const uploadUrl =
        data.signedUrl || data.signed_url || data.uploadUrl || data.upload_url || data.url || "";
    const publicUrl = data.publicUrl || data.public_url || uploadUrl.split("?")[0];
    if (!uploadUrl) throw new Error("Missing upload URL");
    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    });
    if (!putRes.ok) throw new Error("Upload failed");
    return publicUrl;
}

async function moderateImageFile(file) {
    try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/music/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return { safe: false, message: data?.message || 'This image doesn’t meet our community guidelines.' };
        }
        return await res.json().catch(() => ({ safe: true }));
    } catch {
        return { safe: true };
    }
}

async function moderateAndUpload(file, folder) {
    const modResult = await moderateImageFile(file);
    if (!modResult.safe) {
        const err = new Error(modResult.message || 'This image was flagged for inappropriate content.');
        err.isModeration = true;
        throw err;
    }
    return uploadFileToGCS(file, folder);
}

export default function PhotosTab({ artist, onRefresh, onSaveToast, registerSaveHandler, onFieldChange, registerDataCollector, onPhotoError }) {
    // Gallery state: array of { id, url, file?, objectPath? }
    const [gallery, setGallery] = useState([]);
    const [originalGallery, setOriginalGallery] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Keep a ref to current gallery so the data collector always reads the latest
    const currentGalleryRef = useRef([]);
    currentGalleryRef.current = gallery;

    // Register data collector so parent can read current photos on save
    useEffect(() => {
        if (typeof registerDataCollector !== "function") return undefined;
        const cleanup1 = registerDataCollector("photos", () => {
            const urls = currentGalleryRef.current.map((p) => p.url || "").filter(Boolean);
            return { photos: urls };
        });
        // Also register full gallery with file objects so parent can upload blobs to GCS
        const cleanup2 = registerDataCollector("photos_full", () => {
            return { gallery: currentGalleryRef.current };
        });
        return () => { if (cleanup1) cleanup1(); if (cleanup2) cleanup2(); };
    }, [registerDataCollector]);

    // Sync from artist prop
    useEffect(() => {
        if (!artist) return;
        const photos = Array.isArray(artist.photos) ? artist.photos : [];
        const mapped = photos.map((p) => {
            if (typeof p === "string") return { id: p, url: p };
            return {
                id: p.id || p.url,
                url: p.url || "",
                objectPath: p.objectPath || p.object_path || "",
            };
        }).filter((p) => p.url);
        setGallery(mapped);
        setOriginalGallery(mapped);
        setError("");
        setSuccess("");
    }, [artist]);

    // Notify live preview of photo changes (deduped)
    const prevPhotosRef = useRef("");

    useEffect(() => {
        if (typeof onFieldChange !== "function") return;
        const urls = gallery.map((p) => p.url || "").filter(Boolean);
        const key = urls.join(",");
        if (key === prevPhotosRef.current) return;
        prevPhotosRef.current = key;
        onFieldChange({ photos: urls });
    });

    // Determine if there are changes
    const hasChanges = JSON.stringify(gallery.map((p) => p.url)) !== JSON.stringify(originalGallery.map((p) => p.url));

    // Save handler
    const handleSave = useCallback(async () => {
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            if (!artist?.id) {
                setError("Artist not found.");
                return false;
            }

            // Determine removals: items in originalGallery not in gallery
            const currentIds = new Set(gallery.map((p) => p.id));
            const removals = originalGallery.filter((p) => !currentIds.has(p.id));

            // Determine additions: items in gallery that have a `file` property (newly uploaded)
            const additions = gallery.filter((p) => p.file);

            // Validate all new image files before uploading
            for (const item of additions) {
                if (item.file) {
                    if (item.file.type === 'image/gif') {
                        setError('GIFs aren\u2019t supported. Please upload JPG, PNG, or WebP images.');
                        return false;
                    }
                    const imgError = validateImageFile(item.file);
                    if (imgError) {
                        setError(imgError);
                        return false;
                    }
                }
            }

            // Process removals — only call API for items with a numeric DB id
            for (const photo of removals) {
                const numericId = typeof photo.id === "number" ? photo.id : Number(photo.id);
                if (numericId && Number.isFinite(numericId) && numericId > 0) {
                    try {
                        await deleteArtistPhoto({ artistId: artist.id, photoId: numericId });
                    } catch { /* continue */ }
                }
            }

            // Process additions — upload blob files to GCS first, then register via API
            //
            // Uploads run in parallel (Promise.all) rather than one-at-a-time.
            // A gallery with 4 new photos used to be 4 sequential
            // (moderate + signed-URL + PUT) rounds — typically 6–10 seconds.
            // Now it's one concurrent wave, usually under 2 seconds. Moderation
            // errors short-circuit the entire save (same contract as before).
            if (additions.length > 0) {
                let moderationError = null;

                const results = await Promise.all(
                    additions.map(async (item) => {
                        if (item.file && item.url && item.url.startsWith("blob:")) {
                            try {
                                const gcsUrl = await moderateAndUpload(item.file, "artists/gallery");
                                // Update the local gallery item so the UI reflects the real URL
                                item.url = gcsUrl;
                                item.file = undefined;
                                return {
                                    url: gcsUrl,
                                    objectPath: item.objectPath || "",
                                    kind: "gallery",
                                };
                            } catch (uploadErr) {
                                if (uploadErr?.isModeration && !moderationError) {
                                    moderationError = uploadErr;
                                }
                                // Non-moderation upload failures are silently skipped
                                return null;
                            }
                        } else if (item.url && !item.url.startsWith("blob:")) {
                            // Already a GCS URL (e.g. pasted URL)
                            return {
                                url: item.url,
                                objectPath: item.objectPath || "",
                                kind: "gallery",
                            };
                        }
                        return null;
                    })
                );

                if (moderationError) {
                    if (typeof onPhotoError === 'function') onPhotoError(moderationError.message);
                    else setError(moderationError.message);
                    return false;
                }

                const uploaded = results.filter(Boolean);

                if (uploaded.length > 0) {
                    await addArtistPhotos({ artistId: artist.id, photos: uploaded });
                }
            }

            // Rebuild gallery with updated URLs (blob → GCS)
            const updatedGallery = gallery.map((p) => ({
                ...p,
                file: undefined,
            }));
            setGallery(updatedGallery);
            setOriginalGallery(updatedGallery);

            setSuccess("Photos updated!");
            if (typeof onRefresh === "function") await onRefresh();
            if (typeof onSaveToast === "function") onSaveToast("Photos updated!");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not save photos.";
            setError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [artist, gallery, originalGallery, onRefresh, onSaveToast]);

    // Register with global save
    useEffect(() => {
        if (typeof registerSaveHandler !== "function") return undefined;
        return registerSaveHandler({ key: "photos", save: handleSave, hasChanges, saving });
    }, [registerSaveHandler, handleSave, hasChanges, saving]);

    return (
        <Box>
            {error ? (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>
            ) : null}
            {success ? (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>
            ) : null}

            <Box
                sx={{
                    // Improve mobile photo grid: constrain carousel and ensure
                    // thumbnails don't overflow or look oversized on small screens.
                    "& .photos-upload-grid, & .MuiImageList-root": {
                        gap: { xs: "6px !important", sm: "8px !important" },
                    },
                    // Make photo cards smaller on mobile so they don't dominate
                    "& .photo-card, & .MuiImageListItem-root": {
                        borderRadius: { xs: "8px", sm: "10px" },
                        overflow: "hidden",
                    },
                    // Fix swiper/carousel overflow on mobile
                    "& .swiper, & .swiper-wrapper": {
                        maxWidth: "100%",
                        overflow: "hidden",
                    },
                    // Constrain photo thumbnails on mobile
                    "& img": {
                        objectFit: "cover",
                    },
                }}
            >
                <PhotosUploadSection
                    photos={gallery}
                    setPhotos={setGallery}
                    maxPhotos={10}
                    uploadFolder="artists/gallery"
                />
            </Box>
        </Box>
    );
}

// src/pages/music/admin/tabs/AboutTab.jsx
/**
 * AboutTab — Highlight Sections
 *
 * Adds rich "About" content beyond the basic bio. Highlight sections
 * follow the same pattern as ServiceAdminConsole highlight sections.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { secureFetch } from "../../../../utils/secureFetch";

import {
    Alert,
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { themedInputSx, themedMultilineInputSx } from "../../../../components/themedInputSx";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MicExternalOnRoundedIcon from "@mui/icons-material/MicExternalOnRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

import { updateArtist } from "../../api/artists";
import { checkFieldsProfanity } from '../../../../utils/profanityCheck';
import { validateImageFile } from '../../../../utils/validateImage';
import HighlightPhotoCropDialog from '../../../../components/HighlightPhotoCropDialog';

// ── Constants ────────────────────────────────────────────
const HL_SEC_TITLE_MAX = 100;
const HL_SEC_BODY_MAX = 2000;
const MAX_HIGHLIGHT_SECTIONS = 5;

// ── Highlight Section Icon Options (music-oriented) ──────
const HL_ICONS = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    MusicNote: MusicNoteRoundedIcon,
    Album: AlbumRoundedIcon,
    Groups: GroupsRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
    Mic: MicExternalOnRoundedIcon,
    Campaign: CampaignRoundedIcon,
};

const HL_ICON_KEYS = Object.keys(HL_ICONS);
const HL_ICON_LABELS = {
    Star: "Star",
    Favorite: "Favorite",
    MusicNote: "Music",
    Album: "Album",
    Groups: "Band / Group",
    Trophy: "Achievement",
    CheckCircle: "Check",
    Mic: "Microphone",
    Campaign: "Announcement",
};

export function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

const EMPTY_HIGHLIGHT_SECTION = {
    icon: "Star",
    title: "",
    body: "",
    photoUrl: "",
    _photoFile: null,
    _photoPreview: "",
};

const OPAQUE_TEXTFIELD_SX = {
    "& .MuiOutlinedInput-root": (t) => {
        const isDark = t.palette.mode === "dark";
        const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
        return {
            backgroundColor: isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92),
            backdropFilter: "saturate(140%) blur(10px)",
            "& .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(t.palette.text.primary, isDark ? 0.18 : 0.14),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(t.palette.text.primary, isDark ? 0.28 : 0.22),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(t.palette.primary.main, 0.50),
                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
            },
            "& input, & textarea": {
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: t.palette.text.primary,
            },
            "& input::placeholder, & textarea::placeholder": {
                color: alpha(t.palette.text.secondary, isDark ? 0.85 : 1),
                opacity: 1,
            },
        };
    },
    "& .MuiInputLabel-root": (t) => ({
        backgroundColor: t.palette.mode === "dark" ? "transparent" : alpha(t.palette.common.white, 0.92),
        paddingLeft: "6px",
        paddingRight: "6px",
        borderRadius: 6,
    }),
};

function clamp(val, max) {
    const s = String(val || "");
    return s.length > max ? s.slice(0, max) : s;
}

// ── GCS upload helper ──
async function uploadFileToGCS(file, folder) {
    const res = await secureFetch("/api/uploads/signed-url", {
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
    if (!res.ok) throw new Error("Failed to get upload URL");
    const data = await res.json();
    const uploadUrl =
        data.signedUrl || data.signed_url || data.uploadUrl || data.upload_url || data.url || "";
    if (!uploadUrl) throw new Error("Missing upload URL");
    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    });
    if (!putRes.ok) throw new Error("Upload failed");

    // Return the bucket-relative object path, extracted from the signed
    // upload URL's pathname. This is the ground-truth location the PUT
    // actually wrote to. We prefer the URL over any `objectPath` field
    // the endpoint may return because some deployments mutate the filename
    // between generating the signed URL and assembling the response, which
    // causes the returned objectPath to point at a path that doesn't
    // actually exist in the bucket. With a private bucket, the backend
    // hydrates the stored path into a short-lived signed read URL
    // per utils/gcsUrls.js.
    try {
        const u = new URL(uploadUrl);
        if (u.hostname === "storage.googleapis.com") {
            const parts = u.pathname.replace(/^\/+/, "").split("/");
            if (parts.length >= 2) return decodeURIComponent(parts.slice(1).join("/"));
        } else if (u.hostname.endsWith(".storage.googleapis.com")) {
            return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
        }
    } catch { /* not a URL — fall through */ }

    // Fallbacks
    const objectPath = (data.objectPath || data.object_path || "").trim();
    if (objectPath) return objectPath;
    return uploadUrl.split("?")[0];
}

// ── Image moderation helper ──
async function moderateImageFile(file) {
    try {
        const form = new FormData();
        form.append('file', file);
        const res = await secureFetch('/api/music/moderate-image', {
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

// ════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════

export default function AboutTab({
                                     artist,
                                     onRefresh,
                                     onSaveToast,
                                     registerSaveHandler,
                                     onFieldChange,
                                     registerDataCollector,
                                     profanityFieldErrors,
                                     setProfanityFieldErrors,
                                     onPhotoError,
                                 }) {
    // ── Highlight sections ──
    const [highlightSections, setHighlightSections] = useState([]);
    const hlPhotoInputRefs = useRef({});
    const [hlCropOpen, setHlCropOpen] = useState(false);
    const [hlCropSrc, setHlCropSrc] = useState(null);
    const [hlCropIdx, setHlCropIdx] = useState(-1);

    // ── Original values for dirty checking ──
    const [originalHighlights, setOriginalHighlights] = useState([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Refs for data collectors
    const currentDataRef = useRef({});
    currentDataRef.current = { highlightSections };

    // ── Register data collector ──
    useEffect(() => {
        if (typeof registerDataCollector !== "function") return undefined;
        return registerDataCollector("about", () => ({
            highlightSections: currentDataRef.current.highlightSections,
        }));
    }, [registerDataCollector]);

    // ── Sync from artist prop ──
    useEffect(() => {
        if (!artist) return;

        // Parse highlight sections from settings_json or highlightSections
        const settings = artist.settings || {};
        const hlSections = Array.isArray(settings.highlightSections)
            ? settings.highlightSections
            : (Array.isArray(artist.highlightSections) ? artist.highlightSections : []);

        const mapped = hlSections.map((s) => ({
            icon: s.icon || "Star",
            title: s.title || "",
            body: s.body || "",
            photoUrl: s.photoUrl || "",
            _photoFile: null,
            _photoPreview: "",
        }));
        setHighlightSections(mapped);
        setOriginalHighlights(mapped);
        setError("");
        setSuccess("");
    }, [artist]);

    // ── Dirty check ──
    const hasChanges =
        JSON.stringify(
            highlightSections.map((s) => ({ icon: s.icon, title: s.title, body: s.body, photoUrl: s.photoUrl }))
        ) !==
        JSON.stringify(
            originalHighlights.map((s) => ({ icon: s.icon, title: s.title, body: s.body, photoUrl: s.photoUrl }))
        );

    // ── Report changes to live preview (deduped) ──
    const prevKeyRef = useRef("");
    useEffect(() => {
        if (typeof onFieldChange !== "function") return;
        const key = `${JSON.stringify(highlightSections.map((s) => ({
            icon: s.icon, title: s.title, body: s.body,
            photoUrl: s._photoPreview || s.photoUrl,
        })))}`;
        if (key === prevKeyRef.current) return;
        prevKeyRef.current = key;
        onFieldChange({
            highlightSections: highlightSections.map((s) => ({
                icon: s.icon,
                title: s.title,
                body: s.body,
                photoUrl: s._photoPreview || s.photoUrl,
            })),
        });
    });

    // ── Highlight section helpers ──
    const handleAddHighlightSection = () => {
        if (highlightSections.length >= MAX_HIGHLIGHT_SECTIONS) return;
        setHighlightSections((prev) => [...prev, { ...EMPTY_HIGHLIGHT_SECTION }]);
    };

    const handleRemoveHighlightSection = (idx) => {
        setHighlightSections((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleUpdateHighlightSection = (idx, field, value) => {
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], [field]: value };
            return arr;
        });
    };

    const handleHighlightSectionPhoto = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === 'image/gif') {
            const msg = 'GIFs aren\u2019t supported. Please upload a JPG, PNG, or WebP image.';
            if (typeof onPhotoError === 'function') onPhotoError(msg);
            else setError(msg);
            e.target.value = "";
            return;
        }
        const imgError = validateImageFile(file);
        if (imgError) {
            if (typeof onPhotoError === 'function') onPhotoError(imgError);
            else setError(imgError);
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setHlCropSrc(reader.result);
            setHlCropIdx(idx);
            setHlCropOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleHlCropComplete = async (croppedBlob) => {
        const idx = hlCropIdx;
        if (idx < 0) return;
        const croppedFile = new File([croppedBlob], `highlight_${Date.now()}.jpg`, { type: "image/jpeg" });
        // Run NSFW moderation on the cropped image
        const modResult = await moderateImageFile(croppedFile);
        if (!modResult.safe) {
            if (typeof onPhotoError === 'function') onPhotoError(modResult.message);
            else setError(modResult.message);
            return;
        }
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = {
                ...arr[idx],
                _photoFile: croppedFile,
                _photoPreview: URL.createObjectURL(croppedBlob),
            };
            return arr;
        });
    };

    const handleRemoveHighlightSectionPhoto = (idx) => {
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = {
                ...arr[idx],
                _photoFile: null,
                _photoPreview: "",
                photoUrl: "",
            };
            return arr;
        });
    };

    // ── Save handler ──
    const handleSave = useCallback(async () => {
        setError("");
        setSuccess("");

        // Client-side profanity check
        const pFields = {};
        highlightSections.forEach((s, i) => {
            if (s.title?.trim()) pFields[`highlight section ${i + 1} title`] = s.title.trim();
            if (s.body?.trim()) pFields[`highlight section ${i + 1} content`] = s.body.trim();
        });
        const profanityResult = checkFieldsProfanity(pFields);
        if (!profanityResult.clean) {
            const failedField = profanityResult.field || 'content';
            if (typeof setProfanityFieldErrors === 'function') {
                setProfanityFieldErrors({ [failedField]: `Your ${failedField} contains inappropriate language. Please revise.` });
            } else {
                setError(`Your ${failedField} contains inappropriate language. Please revise and try again.`);
            }
            return false;
        }
        if (typeof setProfanityFieldErrors === 'function') setProfanityFieldErrors({});

        setSaving(true);

        try {
            if (!artist?.id) {
                setError("Artist not found.");
                return false;
            }

            // Upload highlight section photos.
            //
            // Two optimizations over the previous loop:
            //  1. Uploads run in parallel via Promise.all (was sequential).
            //  2. We use uploadFileToGCS directly instead of moderateAndUpload.
            //     The blobs here came from handleHlCropComplete, which already
            //     ran the moderation scan when the user confirmed the crop.
            //     Scanning again at save time was duplicating the work.
            //
            // Result: 4 highlight photos that used to take ~8–12 seconds
            // (4x scan + 4x signed-URL + 4x PUT, all sequential) now take
            // ~1–2 seconds (parallel signed-URL + PUT, no redundant scan).
            const uploadedPhotoUrls = await Promise.all(
                highlightSections.map(async (sec) => {
                    if (!sec._photoFile) return sec.photoUrl || "";
                    try {
                        return await uploadFileToGCS(sec._photoFile, "artists/highlights");
                    } catch {
                        // Upload failed — fall back to whatever URL was already on the section
                        return sec.photoUrl || "";
                    }
                })
            );

            const hlSectionsPayload = [];
            highlightSections.forEach((sec, i) => {
                const photoUrl = uploadedPhotoUrls[i] || "";
                const trimmedTitle = (sec.title || "").trim().slice(0, HL_SEC_TITLE_MAX);
                const trimmedBody = (sec.body || "").trim().slice(0, HL_SEC_BODY_MAX);
                if (trimmedTitle || trimmedBody || photoUrl) {
                    hlSectionsPayload.push({
                        icon: sec.icon || "Star",
                        title: trimmedTitle,
                        body: trimmedBody,
                        photoUrl,
                    });
                }
            });

            // Build the settings_json update with highlight sections
            const existingSettings = artist.settings || {};
            const updatedSettings = {
                ...existingSettings,
                highlightSections: hlSectionsPayload,
            };

            await updateArtist({
                artistId: artist.id,
                payload: {
                    settings_json: updatedSettings,
                },
            });

            setSuccess("About section updated!");

            // Update highlight originals (with uploaded URLs)
            const updatedHL = highlightSections.map((s, i) => ({
                ...s,
                photoUrl: hlSectionsPayload[i]?.photoUrl || s.photoUrl || "",
                _photoFile: null,
                _photoPreview: "",
            }));
            setHighlightSections(updatedHL);
            setOriginalHighlights(updatedHL);

            if (typeof onRefresh === "function") await onRefresh();
            if (typeof onSaveToast === "function") onSaveToast("About section updated!");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not save about section.";
            setError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [artist, highlightSections, onRefresh, onSaveToast]);

    // ── Register with global save ──
    useEffect(() => {
        if (typeof registerSaveHandler !== "function") return undefined;
        return registerSaveHandler({ key: "about", save: handleSave, hasChanges, saving });
    }, [registerSaveHandler, handleSave, hasChanges, saving]);

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                    {success}
                </Alert>
            )}

            {/* ═══ HIGHLIGHT SECTIONS ═══ */}
            <Box sx={{ mt: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", mb: 0.5 }}>
                    Highlight Sections
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
                    Add sections to showcase what makes you unique — your story, influences, achievements, or anything fans should know. Up to {MAX_HIGHLIGHT_SECTIONS} sections with icons, text, and optional images.
                </Typography>

                <Stack spacing={2}>
                    {highlightSections.map((sec, idx) => (
                        <Paper
                            key={idx}
                            variant="outlined"
                            sx={(t) => ({
                                p: 2,
                                borderRadius: 2.5,
                                position: "relative",
                                borderColor: alpha(t.palette.primary.main, 0.15),
                                bgcolor: alpha(t.palette.primary.main, 0.015),
                            })}
                        >
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveHighlightSection(idx)}
                                sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    width: 24,
                                    height: 24,
                                    bgcolor: "error.main",
                                    color: "white",
                                    "&:hover": { bgcolor: "error.dark" },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>

                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                {/* Icon picker + title */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pr: 4 }}>
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                        <InputLabel>Icon</InputLabel>
                                        <Select
                                            label="Icon"
                                            value={sec.icon || "Star"}
                                            onChange={(e) => handleUpdateHighlightSection(idx, "icon", e.target.value)}
                                            sx={{ backgroundColor: "background.paper" }}
                                            renderValue={(val) => (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <HlIconRender name={val} sx={{ fontSize: 18, color: "primary.main" }} />
                                                </Box>
                                            )}
                                        >
                                            {HL_ICON_KEYS.map((key) => (
                                                <MenuItem key={key} value={key}>
                                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                                        <HlIconRender name={key} sx={{ fontSize: 20, color: "primary.main" }} />
                                                    </ListItemIcon>
                                                    <ListItemText primary={HL_ICON_LABELS[key] || key} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Section Title"
                                        size="small"
                                        fullWidth
                                        value={sec.title || ""}
                                        onChange={(e) => handleUpdateHighlightSection(idx, "title", clamp(e.target.value, HL_SEC_TITLE_MAX))}
                                        placeholder="e.g. Our Story, Influences, Achievements"
                                        inputProps={{ maxLength: HL_SEC_TITLE_MAX }}
                                        sx={OPAQUE_TEXTFIELD_SX}
                                    />
                                </Stack>

                                {/* Body */}
                                <TextField
                                    label="Section Content"
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    value={sec.body || ""}
                                    onChange={(e) => handleUpdateHighlightSection(idx, "body", clamp(e.target.value, HL_SEC_BODY_MAX))}
                                    placeholder="Describe this highlight…"
                                    inputProps={{ maxLength: HL_SEC_BODY_MAX }}
                                    helperText={`${String(sec.body || "").length}/${HL_SEC_BODY_MAX}`}
                                    sx={{ ...OPAQUE_TEXTFIELD_SX, "& textarea": { overflowY: "auto" } }}
                                />

                                {/* Photo upload */}
                                <Box>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>
                                        Section Image
                                    </Typography>
                                    {(sec._photoPreview || sec.photoUrl) ? (
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Box
                                                component="img"
                                                src={sec._photoPreview || sec.photoUrl}
                                                alt=""
                                                sx={{ width: 100, height: 75, objectFit: "cover", borderRadius: 2 }}
                                            />
                                            <Stack spacing={0.5}>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        const ref = hlPhotoInputRefs.current[idx];
                                                        if (ref) ref.click();
                                                    }}
                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 11 }}
                                                >
                                                    Replace
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveHighlightSectionPhoto(idx)}
                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 11 }}
                                                >
                                                    Remove
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                const ref = hlPhotoInputRefs.current[idx];
                                                if (ref) ref.click();
                                            }}
                                            startIcon={<ImageOutlinedIcon />}
                                            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}
                                        >
                                            Add image
                                        </Button>
                                    )}
                                    <input
                                        ref={(el) => { hlPhotoInputRefs.current[idx] = el; }}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ display: "none" }}
                                        onChange={(e) => handleHighlightSectionPhoto(idx, e)}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    ))}

                    {highlightSections.length < MAX_HIGHLIGHT_SECTIONS && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleAddHighlightSection}
                            startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            sx={{
                                alignSelf: "flex-start",
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 13,
                                borderRadius: 999,
                            }}
                        >
                            Add Highlight Section
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Highlight Photo Crop Dialog */}
            <HighlightPhotoCropDialog
                open={hlCropOpen}
                imageSrc={hlCropSrc}
                onClose={() => { setHlCropOpen(false); setHlCropSrc(null); setHlCropIdx(-1); }}
                onCropComplete={handleHlCropComplete}
            />
        </Box>
    );
}

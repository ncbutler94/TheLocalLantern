import { secureFetch } from '../../../../utils/secureFetch';
/**
 * src/pages/community/groups/admin/GroupAdminTab.jsx
 *
 * Fixes:
 * - Photo upload now works (same signed-url flow as CreateGroupModal).
 * - Save button shows again (SectionWrapper now passes `action` correctly).
 * - Username: checks against /api/groups/check-username so it can't match a user handle or another group username.
 *   Also enforces regex: ^[a-z0-9_]{3,30}$ (same server rule).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Badge,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    ListSubheader,
    MenuItem,
    Select,
    Slider,
    Tooltip,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ContentFadeIn from "../../../../components/ContentFadeIn";
import SettingsIcon from "@mui/icons-material/Settings";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Cropper from "react-easy-crop";

import GroupsIcon from "@mui/icons-material/Groups";
import PlaceIcon from "@mui/icons-material/Place";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ChurchIcon from "@mui/icons-material/Church";
import PaletteIcon from "@mui/icons-material/Palette";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ForestIcon from "@mui/icons-material/Forest";
import PetsIcon from "@mui/icons-material/Pets";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SpaIcon from "@mui/icons-material/Spa";

import defaultGroupIcon from "../../../../assets/default_groups.png";

import GroupAdminReportedPostsSection from "./components/GroupAdminReportedPostsSection";

import {
    adminActOnJoinRequest,
    adminDeleteGroup,
    adminListAdmins,
    adminListJoinRequests,
    adminUpdateGroupSettings,
    adminFetchUsernameChanges,
    adminFetchReportedPosts,
    adminModerateMember,
} from "../../hooks/useGroupsData";

// ── Category options (synced with CreateGroupModal) ──
const GROUP_CATEGORY_OPTIONS = [
    { header: 'Local & Place-Based', items: ['Local Areas & Neighborhoods', 'City and Town Groups', 'County and Region Groups', 'New to the Area', 'Homeowners Associations'] },
    { header: 'Families & Life Stages', items: ['Parents & Families', 'Moms and Dads Groups', 'Homeschooling Families', 'Parenting Teens', 'New Parents', 'Seniors & Retirees', 'Caregivers'] },
    { header: 'Faith & Spiritual', items: ['Faith Communities', 'Church Small Groups', "Men's Groups", "Women's Groups", 'Young Adults Faith', 'Prayer and Devotional Groups'] },
    { header: 'Arts & Culture', items: ['Music & Performing Arts', 'Visual Arts', 'Photography', 'Crafts & Handmade', 'Makers and DIY', 'Writers & Poets', 'Book Clubs', 'Theater & Drama', 'Dance Groups'] },
    { header: 'Sports & Recreation', items: ['Sports Teams & Leagues', 'Pickleball', 'Basketball', 'Soccer', 'Baseball and Softball', 'Golf', 'Running and Walking Clubs', 'Cycling', 'Martial Arts', 'Yoga and Pilates', 'Fitness Accountability Groups'] },
    { header: 'Outdoors & Nature', items: ['Hiking & Trails', 'Camping', 'Fishing', 'Hunting', 'Kayaking and Canoeing', 'Gardening', 'Birdwatching and Wildlife', 'Conservation and Outdoor Stewardship'] },
    { header: 'Pets & Animals', items: ['Dog Owners', 'Cat Owners', 'Animal Rescue Supporters', 'Pet Training and Behavior', 'Farm Animals and Homesteading Animals'] },
    { header: 'Food & Home', items: ['Cooking & Recipes', 'BBQ & Grilling', 'Baking', 'Meal Prep', 'Home & Garden', 'Home Improvement', 'Interior Decor and DIY Home'] },
    { header: 'Learning & Skills', items: ['Language Learning', 'Tutoring and Study Groups', 'STEM and Tech Learners', 'Coding & Web Dev', 'Personal Finance & Budgeting', 'Career Growth & Networking', 'Public Speaking'] },
    { header: 'Schools & Alumni', items: ['School Parent Groups', 'High School Alumni', 'College Alumni', 'Band and Sports Boosters', 'Student Organizations'] },
    { header: 'Business & Professional', items: ['Small Business Owners & Entrepreneurs', 'Creators & Content Makers', 'Marketing and Social Media for Business', 'Trades and Contractors Network', 'Real Estate Professionals', 'Healthcare Professionals', 'Educators Network'] },
    { header: 'Cars & Machines', items: ['Car Enthusiasts', 'Truck and Offroad', 'Motorcycles', 'Classic Cars', 'DIY Auto Repair', 'RC Cars and Drones'] },
    { header: 'Gaming & Geek Culture', items: ['Video Games', 'Tabletop Games and Board Games', 'Trading Card Games', 'Anime and Pop Culture'] },
    { header: 'History & Civic Identity', items: ['Local History & Heritage', 'Genealogy and Family Roots', 'Historic Preservation', 'Museums and Archives'] },
    { header: 'Wellness & Support', items: ['Sobriety and Recovery Support', 'Mental Wellness and Mindfulness', "Men's Support Circles", "Women's Support Circles", 'Grief Support', 'Chronic Illness Community'] },
    { header: 'Clubs & Organizations', items: ['Civic Clubs', 'Fraternal and Service Organizations', 'Volunteer Teams', 'Community Project Groups'] },
    { header: 'Other', items: ['Other'] },
];

const GROUP_MAIN_ICON = {
    'Local & Place-Based': PlaceIcon,
    'Families & Life Stages': FamilyRestroomIcon,
    'Faith & Spiritual': ChurchIcon,
    'Arts & Culture': PaletteIcon,
    'Sports & Recreation': SportsSoccerIcon,
    'Outdoors & Nature': ForestIcon,
    'Pets & Animals': PetsIcon,
    'Food & Home': RestaurantIcon,
    'Learning & Skills': SchoolIcon,
    'Schools & Alumni': SchoolIcon,
    'Business & Professional': WorkIcon,
    'Cars & Machines': DirectionsCarIcon,
    'Gaming & Geek Culture': SportsEsportsIcon,
    'History & Civic Identity': AccountBalanceIcon,
    'Wellness & Support': SpaIcon,
    'Clubs & Organizations': GroupsIcon,
    Other: GroupsIcon,
};

function normalizeLower(v) {
    return String(v || "").trim().toLowerCase();
}

const MENU_KEY_JOIN_REQUESTS = "joinRequests";



function isOwnerRole(viewerMembership) {
    const role = normalizeLower(viewerMembership?.role);
    // Defensive: some API responses include boolean flags.
    if (viewerMembership?.is_owner === true) return true;
    return role === "owner";
}

function normalizeGroupUsername(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^@+/, "")
        .replace(/\s+/g, "");
}

const GROUP_USERNAME_MAX = 30;
const GROUP_USERNAME_CHANGE_LIMIT = 3;

// Upload helpers (copied from CreateGroupModal / older GroupAdminTab)
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1600;

const ALLOWED_UPLOAD_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isAllowedUploadFile(file) {
    if (!file) return false;
    const type = String(file.type || "").toLowerCase();
    if (!type) return false;
    if (!type.startsWith("image/")) return false;
    return ALLOWED_UPLOAD_MIMES.has(type);
}

async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ folder, fileName, contentType }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL.");
    return res.json();
}

async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const putRes = await secureFetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
    });
    if (!putRes.ok) throw new Error("Image upload failed.");
}

function normalizeFileName(name) {
    return (
        String(name || "group_image")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_\-.]/g, "")
            .slice(0, 80) || "group_image"
    );
}

function fileToObjectUrl(file) {
    try {
        return URL.createObjectURL(file);
    } catch {
        return "";
    }
}

function revokeObjectUrl(url) {
    try {
        if (url) URL.revokeObjectURL(url);
    } catch {
        // ignore
    }
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
function normalizeGroupPhotos(group) {
    const g = group && typeof group === "object" ? group : {};
    const raw =
        (Array.isArray(g.groupPhotos) && g.groupPhotos) ||
        (Array.isArray(g.group_photos) && g.group_photos) ||
        (Array.isArray(g.photos) && g.photos) ||
        (Array.isArray(g.group_photos_list) && g.group_photos_list) ||
        [];
    return raw
        .map((p) => ({
            id: p?.id ?? p?.photo_id ?? p?.photoId ?? null,
            url: String(p?.url || p?.photo_url || p?.photoUrl || "").trim(),
            objectPath: String(p?.object_path || p?.objectPath || "").trim(),
            position: Number.isFinite(Number(p?.position)) ? Number(p.position) : 0,
        }))
        .filter((p) => p.url)
        .sort((a, b) => {
            const ap = Number(a.position) || 0;
            const bp = Number(b.position) || 0;
            if (ap !== bp) return ap - bp;
            const aid = Number(a.id) || 0;
            const bid = Number(b.id) || 0;
            return aid - bid;
        });
}

function buildInitialPhotoSlots(group, maxSlots) {
    const photos = normalizeGroupPhotos(group).slice(0, maxSlots);
    const slots = Array.from({ length: maxSlots }, () => null);
    photos.forEach((p, i) => {
        slots[i] = { kind: "existing", id: p.id, url: p.url, objectPath: p.objectPath };
    });
    return slots;
}

function PhotoSlotCard({ slot, index, disabled, helperText, onPick, onRemove }) {
    const hasImage = Boolean(slot?.url);
    const label = "Photo";

    return (
        <Box
            role="button"
            tabIndex={0}
            onClick={disabled ? undefined : () => onPick(index)}
            onKeyDown={
                disabled
                    ? undefined
                    : (e) => {
                        if (e.key === "Enter" || e.key === " ") onPick(index);
                    }
            }
            sx={(t) => ({
                position: "relative",
                width: "100%",
                borderRadius: 5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
                cursor: disabled ? "default" : "pointer",
                transition: "transform 120ms ease, box-shadow 120ms ease",
                boxShadow: t.shadows[1],
                "&:hover": disabled
                    ? undefined
                    : {
                        transform: "translateY(-1px)",
                        boxShadow: t.shadows[3],
                    },
            })}
        >
            <Box
                sx={{
                    aspectRatio: "1 / 1",
                    width: "100%",
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {hasImage ? (
                    <Box
                        component="img"
                        src={slot.url}
                        alt={label}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <Stack spacing={0.65} alignItems="center" justifyContent="center" sx={{ p: 2 }}>
                        <PhotoCameraIcon sx={{ opacity: 0.55 }} />
                        <Typography sx={{ fontWeight: 950, fontSize: 13.25, opacity: 0.9 }}>{label}</Typography>
                        <Typography sx={{ fontWeight: 850, fontSize: 12.25, opacity: 0.65 }}>Click to browse</Typography>
                    </Stack>
                )}

                {hasImage ? (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background:
                                "linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.08) 34%, rgba(0,0,0,0.18) 100%)",
                            opacity: 0,
                            transition: "opacity 140ms ease",
                            ".ll-slot:hover &": { opacity: 1 },
                        }}
                    />
                ) : null}
            </Box>

            <Box
                className="ll-slot"
                sx={{
                    position: "absolute",
                    inset: 0,
                }}
            />

            {slot ? (
                <Tooltip title="Remove">
                    <span>
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove(index);
                            }}
                            disabled={disabled}
                            sx={(t) => ({
                                position: "absolute",
                                top: 10,
                                right: 10,
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: t.shadows[2],
                                "&:hover": { bgcolor: "action.hover" },
                            })}
                            size="small"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            ) : null}

            {helperText ? (
                <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                    <Typography sx={{ fontWeight: 850, fontSize: 11.75, opacity: 0.7 }}>{helperText}</Typography>
                </Box>
            ) : null}
        </Box>
    );
}

// eslint-disable-next-line no-unused-vars
function GroupAdminPhotosSectionInline({ groupId, group, onRefreshGroup, onRefreshPosts, onToast }) {
    const MAX_SLOTS = 4;

    const [slots, setSlots] = useState(() => buildInitialPhotoSlots(group, MAX_SLOTS));
    const [removedIds, setRemovedIds] = useState(() => new Set());
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const addInputRef = useRef(null);
    const pickInputRef = useRef(null);
    const [pickIndex, setPickIndex] = useState(null);

    const usedCount = useMemo(() => slots.filter(Boolean).length, [slots]);
    const hasOpenSlot = usedCount < MAX_SLOTS;

    useEffect(() => {
        if (dirty) return;
        setSlots(buildInitialPhotoSlots(group, MAX_SLOTS));
        setRemovedIds(new Set());
    }, [dirty, group]);

    // Cleanup object URLs when slots change / unmount
    useEffect(() => {
        const previews = slots
            .map((s) => (s && s.kind === "new" ? s.url : null))
            .filter(Boolean);

        return () => {
            previews.forEach((u) => {
                try {
                    URL.revokeObjectURL(u);
                } catch {
                    // ignore
                }
            });
        };
    }, [slots]);

    const triggerToast = useCallback(
        (severity, message) => {
            if (typeof onToast === "function") onToast(severity, message);
        },
        [onToast]
    );

    const applyFilesToSlots = useCallback(
        (files, preferredIndex) => {
            const list = Array.from(files || []).filter(Boolean);
            if (list.length === 0) return;

            setSlots((prev) => {
                const next = [...prev];
                const firstIndex = Number.isFinite(Number(preferredIndex)) ? Number(preferredIndex) : null;

                const placeAt = (idx, file) => {
                    const prevSlot = next[idx];
                    if (prevSlot && prevSlot.kind === "new") {
                        try {
                            URL.revokeObjectURL(prevSlot.url);
                        } catch {
                            // ignore
                        }
                    }
                    next[idx] = { kind: "new", file, url: URL.createObjectURL(file) };
                };

                if (firstIndex != null) {
                    placeAt(firstIndex, list[0]);
                    return next;
                }

                let fileIdx = 0;
                for (let i = 0; i < next.length && fileIdx < list.length; i += 1) {
                    if (!next[i]) {
                        placeAt(i, list[fileIdx]);
                        fileIdx += 1;
                    }
                }
                return next;
            });

            setDirty(true);
        },
        []
    );

    const openAddPicker = useCallback(() => {
        if (!addInputRef.current) return;
        addInputRef.current.value = "";
        addInputRef.current.click();
    }, []);

    const onAddFiles = useCallback(
        (e) => {
            const files = e.target.files;
            applyFilesToSlots(files, null);
        },
        [applyFilesToSlots]
    );

    const openSlotPicker = useCallback((idx) => {
        if (!pickInputRef.current) return;
        setPickIndex(idx);
        pickInputRef.current.value = "";
        pickInputRef.current.click();
    }, []);

    const onPickFile = useCallback(
        (e) => {
            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            if (!file) return;
            const idx = Number.isFinite(Number(pickIndex)) ? Number(pickIndex) : null;
            if (idx == null) return;
            applyFilesToSlots([file], idx);
        },
        [applyFilesToSlots, pickIndex]
    );

    const onRemoveSlot = useCallback((idx) => {
        setSlots((prev) => {
            const next = [...prev];
            const slot = next[idx];

            if (slot && slot.kind === "new") {
                try {
                    URL.revokeObjectURL(slot.url);
                } catch {
                    // ignore
                }
            }

            next[idx] = null;
            return next;
        });

        setRemovedIds((prev) => {
            const next = new Set(prev);
            const slot = slots[idx];
            if (slot && slot.kind === "existing" && slot.id != null) next.add(slot.id);
            return next;
        });

        setDirty(true);
    }, [slots]);

    const saveChanges = useCallback(async () => {
        if (!groupId) return;
        setBusy(true);

        try {
            const folder = `groups/group-photos/group-${String(groupId)}`;
            const nextSlots = [...slots];

            // Upload any new files and replace their slots with existing-style entries
            for (let i = 0; i < nextSlots.length; i += 1) {
                const slot = nextSlots[i];
                if (!slot || slot.kind !== "new") continue;

                const rawFile = slot.file;
                if (!rawFile) continue;

                if (rawFile.size > IMAGE_MAX_BYTES) {
                    throw new Error("One of the images is larger than 8MB. Please pick a smaller image.");
                }

                const resized = await resizeImage(rawFile);
                const contentType = resized.type || "image/jpeg";
                const safeName = normalizeFileName(resized.name);

                // eslint-disable-next-line no-await-in-loop
                const signed = await getSignedUploadUrl({ folder, fileName: safeName, contentType });

                // eslint-disable-next-line no-await-in-loop
                await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file: resized, contentType });

                // Replace with existing-style record (id unknown until backend saves)
                nextSlots[i] = {
                    kind: "existing",
                    id: null,
                    url: String(signed.publicUrl || ""),
                    objectPath: String(signed.objectPath || ""),
                };
            }

            const payload = {
                photos: nextSlots
                    .map((slot, idx) =>
                        slot
                            ? {
                                url: String(slot.url || ""),
                                objectPath: String(slot.objectPath || ""),
                                position: idx,
                            }
                            : null
                    )
                    .filter(Boolean),
                deletePhotoIds: Array.from(removedIds || []),
            };

            const res = await secureFetch(`/api/groups/${encodeURIComponent(String(groupId))}/photos`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || "Failed to save group photos.");
            }

            setDirty(false);
            setRemovedIds(new Set());
            setSlots(nextSlots);

            triggerToast("success", "Group photos saved.");

            if (typeof onRefreshGroup === "function") onRefreshGroup();
            if (typeof onRefreshPosts === "function") onRefreshPosts();
        } catch (err) {
            const msg = String(err?.message || "").trim();
            triggerToast("error", msg || "Failed to save group photos.");
        } finally {
            setBusy(false);
        }
    }, [groupId, onRefreshGroup, onRefreshPosts, removedIds, slots, triggerToast]);

    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                borderRadius: { xs: 4, md: 5 },
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
                boxShadow: t.shadows[1],
            })}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.25 } }}>
                <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                            sx={(t) => ({
                                width: 38,
                                height: 38,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.18),
                                flex: "0 0 auto",
                            })}
                        >
                            <PhotoCameraIcon fontSize="small" />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 1100, fontSize: 16.25, lineHeight: 1.15 }} noWrap>
                                Group photos
                            </Typography>
                            <Typography sx={{ opacity: 0.74, fontWeight: 850, fontSize: 12.75 }}>
                                Add up to 4 photos. Click any square to add/replace. Changes won’t upload until you press Save.
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ flex: "0 0 auto" }}>
                        <Button
                            onClick={openAddPicker}
                            variant="outlined"
                            startIcon={<AddPhotoAlternateIcon />}
                            disabled={busy || !hasOpenSlot}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                        >
                            Add photos
                        </Button>

                        <Button
                            onClick={saveChanges}
                            variant="contained"
                            disabled={busy || !dirty}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                        >
                            Save
                        </Button>
                    </Stack>
                </Stack>

                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                        gap: { xs: 1.25, sm: 1.5 },
                        maxWidth: 860,
                    }}
                >
                    {slots.map((slot, idx) => (
                        <PhotoSlotCard
                            key={String(idx)}
                            slot={slot}
                            index={idx}
                            disabled={busy}
                            helperText=""
                            onPick={openSlotPicker}
                            onRemove={onRemoveSlot}
                        />
                    ))}
                </Box>

                <input
                    ref={addInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onAddFiles}
                    style={{ display: "none" }}
                />
                <input
                    ref={pickInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    style={{ display: "none" }}
                />
            </Box>
        </Paper>
    );
}


function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read image."));
        };
        img.src = url;
    });
}

async function resizeImage(file) {
    if (!String(file?.type || "").startsWith("image/")) return file;

    const img = await loadImage(file);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return file;

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, outW, outH);

    const preferJpeg = !String(file.type || "").includes("png");
    const outType = preferJpeg ? "image/jpeg" : "image/png";
    const quality = 0.86;

    const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), outType, quality);
    });
    if (!blob) return file;

    const outNameBase = normalizeFileName(file.name).replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
    const outName = preferJpeg ? `${outNameBase}.jpg` : `${outNameBase}.png`;
    return new File([blob], outName, { type: outType });
}

export default function GroupAdminTab({
                                          groupId,
                                          group,
                                          viewerMembership,
                                          onRefreshGroup,
                                          onRefreshPosts,
                                      }) {
    const isOwner = isOwnerRole(viewerMembership) || (
        viewerMembership?.user_id != null &&
        (String(group?.created_by_user_id ?? group?.createdByUserId ?? '') === String(viewerMembership.user_id))
    );

    const navigate = useNavigate();
    const [activeKey, setActiveKey] = useState(GROUP_ADMIN_MENU_KEYS.SETTINGS);
    const [busy, setBusy] = useState(false);

    const [toast, setToast] = useState(null);
    const closeToast = useCallback(() => setToast(null), []);
    const showToast = useCallback((severity, message) => setToast({ severity, message }), []);

    const fileInputRef = useRef(null);
    const coverFileInputRef = useRef(null);

    const [settings, setSettings] = useState(() => ({
        name: group?.name || "",
        visibility: group?.visibility || "public",
        is_statewide: Boolean(group?.is_statewide ?? group?.isStatewide ?? false),
        group_username: group?.group_username || group?.groupUsername || "",
        city: group?.city || "",
        county: group?.county || "",
        description: group?.description || "",
        category: group?.category || "",
        image_url: group?.image_url || group?.imageUrl || "",
        image_object_path: group?.image_object_path || group?.imageObjectPath || "",

        cover_photo_url: group?.cover_photo_url || group?.coverPhotoUrl || "",
        cover_photo_object_path: group?.cover_photo_object_path || group?.coverPhotoObjectPath || "",
        cover_photo_original_url: group?.cover_photo_original_url || group?.coverPhotoOriginalUrl || "",
        cover_photo_original_object_path: group?.cover_photo_original_object_path || group?.coverPhotoOriginalObjectPath || "",
    }));

    const [isUploadingProfile, setIsUploadingProfile] = useState(false);
    const [isDragOverProfile, setIsDragOverProfile] = useState(false);

    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isDragOverCover, setIsDragOverCover] = useState(false);

    // Profile picture crop UI (react-easy-crop)
    const [profileCropOpen, setProfileCropOpen] = useState(false);
    const [profileCropSrc, setProfileCropSrc] = useState("");
    const [profileCropFile, setProfileCropFile] = useState(null);
    const [profileCrop, setProfileCrop] = useState({ x: 0, y: 0 });
    const [profileCropZoom, setProfileCropZoom] = useState(1);
    const [profileCroppedArea, setProfileCroppedArea] = useState(null);

    // Cover photo crop UI (react-easy-crop)
    const [coverCropOpen, setCoverCropOpen] = useState(false);
    const [coverCropSrc, setCoverCropSrc] = useState("");
    const [coverCropFile, setCoverCropFile] = useState(null);
    const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
    const [coverCropZoom, setCoverCropZoom] = useState(1);
    const [coverCroppedArea, setCoverCroppedArea] = useState(null);

    const COVER_ASPECT = 3.5; // 3.5:1 matching CreateGroupModal


    const [admins, setAdmins] = useState([]);
    const [requests, setRequests] = useState([]);
    const [reportedCount, setReportedCount] = useState(0);

    const pendingRequestsCount = Array.isArray(requests) ? requests.length : 0;

    const isPrivateGroup = useMemo(() => normalizeLower(group?.visibility) === "private", [group?.visibility]);

    const hasJoinQuestions = useMemo(() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return false;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) && parsed.length > 0;
        } catch { return false; }
    }, [group]);

    const showJoinRequests = isPrivateGroup || hasJoinQuestions;

    const menuItems = useMemo(() => {
        const base = Array.isArray(GROUP_ADMIN_MENU) ? GROUP_ADMIN_MENU : [];
        if (!showJoinRequests) {
            return base.filter((m) => m?.key !== MENU_KEY_JOIN_REQUESTS);
        }

        const alreadyHas = base.some((m) => m?.key === MENU_KEY_JOIN_REQUESTS);
        if (alreadyHas) return base;

        const joinItem = {
            key: MENU_KEY_JOIN_REQUESTS,
            label: "Join Requests",
            icon: PersonAddAlt1Icon,
            badgeKey: "pendingRequests",
        };

        const moderationIdx = base.findIndex((m) => m?.key === GROUP_ADMIN_MENU_KEYS.MODERATION);
        if (moderationIdx >= 0) {
            const next = [...base];
            next.splice(moderationIdx + 1, 0, joinItem);
            return next;
        }

        return [...base, joinItem];
    }, [showJoinRequests]);

    useEffect(() => {
        const keys = new Set((menuItems || []).map((m) => m?.key).filter(Boolean));
        if (!keys.has(activeKey)) {
            setActiveKey(GROUP_ADMIN_MENU_KEYS.SETTINGS);
        }
    }, [activeKey, menuItems]);


    const [usernameChangeCount, setUsernameChangeCount] = useState(0);
    const originalUsername = useMemo(() => normalizeGroupUsername(group?.group_username || group?.groupUsername || ""), [group]);
    const normalizedDraftUsername = useMemo(() => normalizeGroupUsername(settings?.group_username), [settings?.group_username]);

    const [usernameCheck, setUsernameCheck] = useState({ checking: false, available: true, message: "" });
    const usernameCheckTimer = useRef(null);

    useEffect(() => {
        setSettings({
            name: group?.name || "",
            visibility: group?.visibility || "public",
            is_statewide: Boolean(group?.is_statewide ?? group?.isStatewide ?? false),
            group_username: group?.group_username || group?.groupUsername || "",
            city: group?.city || "",
            county: group?.county || "",
            description: group?.description || "",
            category: group?.category || "",
            image_url: group?.image_url || group?.imageUrl || "",
            image_object_path: group?.image_object_path || group?.imageObjectPath || "",

            cover_photo_url: group?.cover_photo_url || group?.coverPhotoUrl || "",
            cover_photo_object_path: group?.cover_photo_object_path || group?.coverPhotoObjectPath || "",
            cover_photo_original_url: group?.cover_photo_original_url || group?.coverPhotoOriginalUrl || "",
            cover_photo_original_object_path: group?.cover_photo_original_object_path || group?.coverPhotoOriginalObjectPath || "",
        });
    }, [group]);

    const loadAdmins = useCallback(async () => {
        if (!groupId) return;
        try {
            const data = await adminListAdmins(groupId);
            setAdmins(Array.isArray(data) ? data : data?.admins || []);
        } catch (e) {
            showToast("error", e?.message || "Failed to load admins.");
        }
    }, [groupId, showToast]);

    const loadRequests = useCallback(async () => {
        if (!groupId) return;
        try {
            const data = await adminListJoinRequests(groupId);
            setRequests(Array.isArray(data) ? data : data?.requests || []);
        } catch (e) {
            showToast("error", e?.message || "Failed to load join requests.");
        }
    }, [groupId, showToast]);

    const loadReportedCount = useCallback(async () => {
        if (!groupId) return;
        try {
            const data = await adminFetchReportedPosts(groupId);
            const posts = Array.isArray(data?.reportedPosts) ? data.reportedPosts.length : 0;
            const comments = Array.isArray(data?.reportedComments) ? data.reportedComments.length : 0;
            setReportedCount(posts + comments);
        } catch {
            // non-critical — badge just won't show
        }
    }, [groupId]);

    useEffect(() => {
        void loadAdmins();
        void loadRequests();
        void loadReportedCount();
    }, [loadAdmins, loadRequests, loadReportedCount]);

    // Fetch username change count from server
    useEffect(() => {
        if (!groupId) return;
        let mounted = true;
        (async () => {
            try {
                const data = await adminFetchUsernameChanges(groupId);
                if (mounted) setUsernameChangeCount(Number(data?.count) || 0);
            } catch {
                // ignore - will default to 0
            }
        })();
        return () => { mounted = false; };
    }, [groupId]);

    // Username availability check (unique across users + groups)
    useEffect(() => {
        if (!isOwner) return;

        if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);

        const raw = normalizedDraftUsername;

        // unchanged: treat as available
        if (raw && raw === originalUsername) {
            setUsernameCheck({ checking: false, available: true, message: "" });
            return;
        }

        if (!raw) {
            setUsernameCheck({ checking: false, available: false, message: "Username is required (3–30 characters)." });
            return;
        }

        if (!/^[a-z0-9_]{3,30}$/.test(raw)) {
            setUsernameCheck({ checking: false, available: false, message: "Use 3–30 characters: lowercase letters, numbers, underscores." });
            return;
        }

        setUsernameCheck({ checking: true, available: false, message: "" });

        usernameCheckTimer.current = setTimeout(async () => {
            try {
                const qs = new URLSearchParams({ username: raw }).toString();
                const res = await secureFetch(`/api/groups/check-username?${qs}`, { credentials: "include" });
                const json = await res.json().catch(() => null);

                const available = Boolean(json?.available);
                const message = String(json?.message || "").trim();

                setUsernameCheck({
                    checking: false,
                    available,
                    message: message || (available ? "Username is available." : "That username is not available."),
                });
            } catch {
                setUsernameCheck({ checking: false, available: true, message: "Unable to check availability right now." });
            }
        }, 350);

        return () => {
            if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
        };
    }, [isOwner, normalizedDraftUsername, originalUsername]);

    const usernameHelperText = useMemo(() => {
        if (!isOwner) return "Only the owner can change the username";
        const next = normalizedDraftUsername;
        if (!next) return "";
        if (next.length > GROUP_USERNAME_MAX) return `Max ${GROUP_USERNAME_MAX} characters.`;
        if (usernameChangeCount >= GROUP_USERNAME_CHANGE_LIMIT) {
            return `Monthly change limit reached (${GROUP_USERNAME_CHANGE_LIMIT}).`;
        }
        return usernameChangeCount > 0
            ? `Changes this month: ${usernameChangeCount}/${GROUP_USERNAME_CHANGE_LIMIT}`
            : "";
    }, [isOwner, normalizedDraftUsername, usernameChangeCount]);

    const closeProfileCrop = useCallback(() => {
        setProfileCropOpen(false);
        setProfileCropZoom(1);
        setProfileCrop({ x: 0, y: 0 });
        setProfileCroppedArea(null);
        setProfileCropFile(null);
        setProfileCropSrc((prev) => {
            revokeObjectUrl(prev);
            return "";
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);


    const closeCoverCrop = useCallback(() => {
        setCoverCropOpen(false);
        setCoverCropZoom(1);
        setCoverCrop({ x: 0, y: 0 });
        setCoverCroppedArea(null);
        setCoverCropFile(null);
        setCoverCropSrc((prev) => {
            revokeObjectUrl(prev);
            return "";
        });
        if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }, []);


    const openProfileCrop = useCallback(
        async (file) => {
            if (!file) return;

            if (!isAllowedUploadFile(file)) {
                showToast("error", "Please choose a JPG, PNG, or WebP image.");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            if (file.size > IMAGE_MAX_BYTES) {
                showToast("error", "Image is too large. Please use an image under 8MB.");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            const url = fileToObjectUrl(file);
            if (!url) {
                showToast("error", "Unable to read that image.");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setProfileCropSrc((prev) => {
                revokeObjectUrl(prev);
                return url;
            });
            setProfileCropFile(file);
            setProfileCropZoom(1);
            setProfileCrop({ x: 0, y: 0 });
            setProfileCroppedArea(null);
            setProfileCropOpen(true);
        },
        [showToast]
    );


    const openCoverCrop = useCallback(
        async (file) => {
            if (!file) return;

            if (!isAllowedUploadFile(file)) {
                showToast("error", "Please choose a JPG, PNG, or WebP image.");
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                return;
            }

            if (file.size > IMAGE_MAX_BYTES) {
                showToast("error", "Image is too large. Please use an image under 8MB.");
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                return;
            }

            const url = fileToObjectUrl(file);
            if (!url) {
                showToast("error", "Unable to read that image.");
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                return;
            }

            setCoverCropSrc((prev) => {
                revokeObjectUrl(prev);
                return url;
            });
            setCoverCropFile(file);
            setCoverCropZoom(1);
            setCoverCrop({ x: 0, y: 0 });
            setCoverCroppedArea(null);
            setCoverCropOpen(true);
        },
        [showToast]
    );


    const uploadProfileImageFile = useCallback(
        async (file) => {
            if (!file) return;

            // Note: basic validations are done before cropping; keep a guard here anyway.
            if (file.size > IMAGE_MAX_BYTES) {
                showToast("error", "Image is too large. Please use an image under 8MB.");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setIsUploadingProfile(true);

            try {
                const resized = await resizeImage(file);
                const contentType = resized.type || "image/jpeg";
                const safeName = normalizeFileName(resized.name);

                const signed = await getSignedUploadUrl({ folder: "groups", fileName: safeName, contentType });

                await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file: resized, contentType });

                setSettings((s) => ({
                    ...s,
                    image_url: String(signed.publicUrl || ""),
                    image_object_path: String(signed.objectPath || ""),
                }));
            } catch (err) {
                showToast("error", err?.message || "Image upload failed.");
                setSettings((s) => ({ ...s, image_url: "", image_object_path: "" }));
                if (fileInputRef.current) fileInputRef.current.value = "";
            } finally {
                setIsUploadingProfile(false);
            }
        },
        [showToast]
    );
    const uploadCoverImageFile = useCallback(
        async (file) => {
            if (!file) return;

            if (file.size > IMAGE_MAX_BYTES) {
                showToast("error", "Image is too large. Please use an image under 8MB.");
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                return;
            }

            setIsUploadingCover(true);

            try {
                // IMPORTANT: For cover photos we upload the already-cropped banner at high quality.
                const contentType = file.type || "image/jpeg";
                const safeName = normalizeFileName(file.name || "group_cover_banner.jpg");

                const signed = await getSignedUploadUrl({ folder: "groups", fileName: safeName, contentType });

                await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file, contentType });

                setSettings((s) => ({
                    ...s,
                    cover_photo_url: String(signed.publicUrl || ""),
                    cover_photo_object_path: String(signed.objectPath || ""),
                }));
            } catch (err) {
                showToast("error", err?.message || "Cover photo upload failed.");
                setSettings((s) => ({ ...s, cover_photo_url: "", cover_photo_object_path: "" }));
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
            } finally {
                setIsUploadingCover(false);
            }
        },
        [showToast]
    );

    const uploadCoverOriginalImageFile = useCallback(
        async (file) => {
            if (!file) return;

            if (file.size > IMAGE_MAX_BYTES) {
                showToast("error", "Image is too large. Please use an image under 8MB.");
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                return;
            }

            setIsUploadingCover(true);

            try {
                // Save the full original so clicking the cover shows the entire photo (uncropped).
                const contentType = file.type || "image/jpeg";
                const base = normalizeFileName(file.name || "group_cover.jpg").replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, "") || "group_cover";
                const safeName = `${base}_original.${contentType.includes("png") ? "png" : "jpg"}`;

                const signed = await getSignedUploadUrl({ folder: "groups", fileName: safeName, contentType });

                await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file, contentType });

                setSettings((s) => ({
                    ...s,
                    cover_photo_original_url: String(signed.publicUrl || ""),
                    cover_photo_original_object_path: String(signed.objectPath || ""),
                }));
            } catch (err) {
                showToast("error", err?.message || "Cover photo upload failed.");
                setSettings((s) => ({ ...s, cover_photo_original_url: "", cover_photo_original_object_path: "" }));
                if (coverFileInputRef.current) coverFileInputRef.current.value = "";
            } finally {
                setIsUploadingCover(false);
            }
        },
        [showToast]
    );



    // Helper: create cropped image from react-easy-crop's croppedAreaPixels
    const createCroppedBlob = useCallback(async (imageSrc, croppedAreaPixels, outputWidth, outputHeight) => {
        const imgEl = await loadImageElement(imageSrc);
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to crop image.");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, outputWidth, outputHeight);
        ctx.drawImage(
            imgEl,
            croppedAreaPixels.x, croppedAreaPixels.y,
            croppedAreaPixels.width, croppedAreaPixels.height,
            0, 0, outputWidth, outputHeight
        );
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) throw new Error("Unable to crop image.");
        return blob;
    }, []);

    const confirmCropAndUpload = useCallback(async () => {
        if (!profileCropFile || !profileCropSrc || !profileCroppedArea) return;

        setIsUploadingProfile(true);
        try {
            const blob = await createCroppedBlob(profileCropSrc, profileCroppedArea, 400, 400);
            const safeName = normalizeFileName(profileCropFile.name || "group_profile.jpg").replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, "") || "group_profile";
            const nextFile = new File([blob], `${safeName}.jpg`, { type: "image/jpeg" });
            await uploadProfileImageFile(nextFile);
            closeProfileCrop();
        } catch (err) {
            showToast("error", err?.message || "Unable to crop that image.");
        } finally {
            setIsUploadingProfile(false);
        }
    }, [closeProfileCrop, createCroppedBlob, profileCropFile, profileCropSrc, profileCroppedArea, showToast, uploadProfileImageFile]);

    const confirmCoverCropAndUpload = useCallback(async () => {
        if (!coverCropFile || !coverCropSrc || !coverCroppedArea) return;

        setIsUploadingCover(true);
        try {
            // Upload original first
            await uploadCoverOriginalImageFile(coverCropFile);

            // Then cropped banner (1400x400 matching CreateGroupModal)
            const blob = await createCroppedBlob(coverCropSrc, coverCroppedArea, 1400, 400);
            const safeNameBase = normalizeFileName(coverCropFile.name || "group_cover.jpg").replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, "") || "group_cover";
            const nextFile = new File([blob], `${safeNameBase}.jpg`, { type: "image/jpeg" });
            await uploadCoverImageFile(nextFile);
            closeCoverCrop();
        } catch (err) {
            showToast("error", err?.message || "Unable to crop that image.");
        } finally {
            setIsUploadingCover(false);
        }
    }, [closeCoverCrop, createCroppedBlob, coverCropFile, coverCropSrc, coverCroppedArea, showToast, uploadCoverImageFile, uploadCoverOriginalImageFile]);


    const handleProfileFileChange = useCallback(
        async (e) => {
            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            await openProfileCrop(file);
        },
        [openProfileCrop]
    );



    const handleCoverFileChange = useCallback(
        async (e) => {
            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            await openCoverCrop(file);
        },
        [openCoverCrop]
    );

    const onCoverDrop = useCallback(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverCover(false);
            if (isUploadingCover || busy) return;
            const file = e.dataTransfer?.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
            await openCoverCrop(file);
        },
        [busy, isUploadingCover, openCoverCrop]
    );

    const onCoverDragOver = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isUploadingCover || busy) return;
            setIsDragOverCover(true);
        },
        [busy, isUploadingCover]
    );

    const onCoverDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverCover(false);
    }, []);

    const onClearCoverPhoto = useCallback(() => {
        if (isUploadingCover || busy) return;
        setSettings((s) => ({
            ...s,
            cover_photo_url: "",
            cover_photo_object_path: "",
            cover_photo_original_url: "",
            cover_photo_original_object_path: "",
        }));
        if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }, [busy, isUploadingCover]);


    const onProfileDrop = useCallback(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverProfile(false);
            if (isUploadingProfile || busy) return;
            const file = e.dataTransfer?.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
            await openProfileCrop(file);
        },
        [busy, isUploadingProfile, openProfileCrop]
    );

    const onProfileDragOver = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isUploadingProfile || busy) return;
            setIsDragOverProfile(true);
        },
        [busy, isUploadingProfile]
    );

    const onProfileDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverProfile(false);
    }, []);

    const onClearProfileImage = useCallback(() => {
        if (isUploadingProfile || busy) return;
        setSettings((s) => ({
            ...s,
            image_url: "",
            image_object_path: "",
            image_original_url: "",
            image_original_object_path: "",
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [busy, isUploadingProfile]);

    const onSaveSettings = useCallback(async () => {
        if (!groupId || busy) return;

        const nextUsername = normalizedDraftUsername;

        if (isOwner && nextUsername && usernameChangeCount >= GROUP_USERNAME_CHANGE_LIMIT) {
            showToast("error", `You can only change the username ${GROUP_USERNAME_CHANGE_LIMIT} times per month.`);
            return;
        }

        // block save if the username changed and is not available
        if (isOwner && nextUsername && nextUsername !== originalUsername) {
            if (usernameCheck?.checking) {
                showToast("error", "Please wait for the username availability check to finish.");
                return;
            }
            if (!usernameCheck?.available) {
                showToast("error", usernameCheck?.message || "That username is not available.");
                return;
            }
        }

        setBusy(true);
        try {
            const payload = {
                name: settings?.name || "",
                visibility: settings?.visibility || "public",
                group_username: nextUsername || null,
                is_statewide: Boolean(settings?.is_statewide),
                city: settings?.is_statewide ? null : (settings?.city || null),
                county: settings?.is_statewide ? null : (settings?.county || null),
                description: settings?.description || null,
                category: settings?.category || null,

                // Profile image (cropped + original)
                image_url: settings?.image_url || null,
                image_object_path: settings?.image_object_path || null,
                image_original_url: settings?.image_original_url || null,
                image_original_object_path: settings?.image_original_object_path || null,

                // Cover photo (cropped + original)
                cover_photo_url: settings?.cover_photo_url || null,
                cover_photo_object_path: settings?.cover_photo_object_path || null,
                cover_photo_original_url: settings?.cover_photo_original_url || null,
                cover_photo_original_object_path: settings?.cover_photo_original_object_path || null,
            };

            await adminUpdateGroupSettings(groupId, payload);

            // Refresh the username change count from server if username was changed
            if (isOwner && nextUsername && nextUsername !== originalUsername) {
                try {
                    const data = await adminFetchUsernameChanges(groupId);
                    setUsernameChangeCount(Number(data?.count) || 0);
                } catch {
                    // ignore
                }
            }

            showToast("success", "Settings saved.");
            await onRefreshGroup?.();
        } catch (e) {
            showToast("error", e?.message || "Failed to save settings.");
        } finally {
            setBusy(false);
        }
    }, [
        busy,
        groupId,
        isOwner,
        normalizedDraftUsername,
        originalUsername,
        onRefreshGroup,
        settings,
        showToast,
        usernameChangeCount,
        usernameCheck,
    ]);

    const extractJoinRequestUserId = useCallback((r) => {
        const raw =
            r?.user_id ??
            r?.userId ??
            r?.id ??
            r?.request_user_id ??
            r?.requestUserId ??
            r?.member_user_id ??
            r?.memberUserId ??
            null;

        const idStr = raw != null ? String(raw).trim() : "";
        const asNum = Number(idStr);
        return Number.isFinite(asNum) && asNum > 0 ? asNum : null;
    }, []);

    const onApproveRequest = useCallback(
        async (r) => {
            if (!groupId) return;

            const userId = extractJoinRequestUserId(r);
            if (!userId) {
                showToast("error", "Unable to approve: missing user id.");
                return;
            }

            setBusy(true);
            try {
                await adminActOnJoinRequest(groupId, userId, "approve");
                showToast("success", "Request approved.");

                // Refresh pending requests + group snapshot (member counts, etc.)
                await loadRequests();
                await onRefreshGroup?.();
            } catch (e) {
                showToast("error", e?.message || "Failed to approve request.");
            } finally {
                setBusy(false);
            }
        },
        [extractJoinRequestUserId, groupId, loadRequests, onRefreshGroup, showToast]
    );

    const onDenyRequest = useCallback(
        async (r) => {
            if (!groupId) return;

            const userId = extractJoinRequestUserId(r);
            if (!userId) {
                showToast("error", "Unable to reject: missing user id.");
                return;
            }

            setBusy(true);
            try {
                await adminActOnJoinRequest(groupId, userId, "deny");
                showToast("success", "Request rejected.");
                await loadRequests();
            } catch (e) {
                showToast("error", e?.message || "Failed to reject request.");
            } finally {
                setBusy(false);
            }
        },
        [extractJoinRequestUserId, groupId, loadRequests, showToast]
    );

    const onBanUser = useCallback(
        async (userId, name) => {
            if (!groupId || !userId) return;
            setBusy(true);
            try {
                await adminModerateMember(groupId, userId, "ban", { permanent: true, reason: "Banned via join request review" });
                // Also deny the join request so it's removed from the list
                try { await adminActOnJoinRequest(groupId, userId, "deny"); } catch { /* may already be handled by ban */ }
                showToast("success", `${name || "User"} banned from group.`);
                await loadRequests();
                await onRefreshGroup?.();
            } catch (e) {
                showToast("error", e?.message || "Failed to ban user.");
            } finally {
                setBusy(false);
            }
        },
        [groupId, loadRequests, onRefreshGroup, showToast]
    );

    const onTimeoutUser = useCallback(
        async (userId, name, durationMinutes) => {
            if (!groupId || !userId) return;
            setBusy(true);
            try {
                await adminModerateMember(groupId, userId, "timeout", { duration_minutes: durationMinutes, reason: "Timed out via join request review" });
                // Also deny the join request so it's removed from the list
                try { await adminActOnJoinRequest(groupId, userId, "deny"); } catch { /* may already be handled by timeout */ }
                showToast("success", `${name || "User"} timed out.`);
                await loadRequests();
                await onRefreshGroup?.();
            } catch (e) {
                showToast("error", e?.message || "Failed to timeout user.");
            } finally {
                setBusy(false);
            }
        },
        [groupId, loadRequests, onRefreshGroup, showToast]
    );

    const onDeleteGroup = useCallback(async () => {
        if (!groupId) return;
        setBusy(true);
        try {
            await adminDeleteGroup(groupId);
            showToast("success", "Group deleted.");
        } catch (e) {
            showToast("error", e?.message || "Failed to delete group.");
        } finally {
            setBusy(false);
        }
    }, [groupId, showToast]);

    const activeIndex = useMemo(() => {
        const idx = (menuItems || []).findIndex((m) => m.key === activeKey);
        return idx >= 0 ? idx : 0;
    }, [activeKey, menuItems]);

    const renderActive = () => {
        switch (activeKey) {
            case GROUP_ADMIN_MENU_KEYS.SETTINGS:
                return (
                    <GroupAdminSettingsSection
                        title="Group settings"
                        icon={<SettingsIcon fontSize="small"/>}
                        busy={busy}
                        settingsTab={0}
                        settings={settings}
                        setSettings={setSettings}
                        defaultGroupIcon={defaultGroupIcon}
                        fileInputRef={fileInputRef}
                        isOwner={isOwner}
                        usernameHelperText={usernameHelperText}
                        usernameMax={GROUP_USERNAME_MAX}
                        usernameCheck={usernameCheck}
                        categoryOptions={GROUP_CATEGORY_OPTIONS}
                        categoryIcons={GROUP_MAIN_ICON}
                        onProfileFileChange={handleProfileFileChange}
                        onProfileDrop={onProfileDrop}
                        onProfileDragOver={onProfileDragOver}
                        onProfileDragLeave={onProfileDragLeave}
                        isDragOverProfile={isDragOverProfile}
                        isDragOverCover={isDragOverCover}
                        onClearProfileImage={onClearProfileImage}
                        coverFileInputRef={coverFileInputRef}
                        onCoverFileChange={handleCoverFileChange}
                        onCoverDrop={onCoverDrop}
                        onCoverDragOver={onCoverDragOver}
                        onCoverDragLeave={onCoverDragLeave}
                        onClearCoverPhoto={onClearCoverPhoto}
                        actionEl={
                            <Button
                                onClick={onSaveSettings}
                                variant="contained"
                                disabled={busy || isUploadingProfile || isUploadingCover}
                                sx={{borderRadius: 999, textTransform: "none", fontWeight: 950}}
                            >
                                Save
                            </Button>
                        }
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.PHOTOS:
                return (
                    <GroupAdminPhotosSection
                        groupId={groupId}
                        onSaved={() => {
                            if (typeof onRefreshGroup === "function") onRefreshGroup();
                            if (typeof onRefreshPosts === "function") onRefreshPosts();
                        }}
                        onToast={showToast}
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.RULES:
                return (
                    <GroupAdminRulesSection
                        groupId={groupId}
                        rulesHtml={group?.rules_html || group?.rulesHtml || ""}
                        onToast={showToast}
                        onRefreshGroup={onRefreshGroup}
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.INVITE:
                return (
                    <GroupAdminInviteSection
                        groupId={groupId}
                        group={group}
                        onToast={showToast}
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.MODERATION:
                return (
                    <GroupAdminModerationSection
                        groupId={groupId}
                        group={group}
                        viewerMembership={viewerMembership}
                        onToast={showToast}
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.REPORTED_POSTS:
                return (
                    <GroupAdminReportedPostsSection
                        groupId={groupId}
                        group={group}
                        viewerMembership={viewerMembership}
                        onToast={showToast}
                        onRefreshGroup={async () => {
                            await onRefreshGroup?.();
                            await loadReportedCount();
                        }}
                    />
                );

            case MENU_KEY_JOIN_REQUESTS:
                return (
                    <GroupAdminJoinRequestsSection
                        groupId={groupId}
                        group={group}
                        requests={requests}
                        busy={busy}
                        onApproveRequest={onApproveRequest}
                        onDenyRequest={onDenyRequest}
                        onBanUser={onBanUser}
                        onTimeoutUser={onTimeoutUser}
                        onToast={showToast}
                    />
                );

            case GROUP_ADMIN_MENU_KEYS.ADMINS:
                return (
                    <GroupAdminAdminsSection
                        groupId={groupId}
                        group={group}
                        admins={admins}
                        isOwner={isOwner}
                        viewerUser={{id: viewerMembership?.user_id ?? viewerMembership?.userId ?? viewerMembership?.id ?? null}}
                        onAdminsUpdated={loadAdmins}
                        onOwnerTransferred={async () => {
                            await loadAdmins();
                            await onRefreshGroup?.();
                        }}
                        triggerToast={showToast}
                    />
                );
            case GROUP_ADMIN_MENU_KEYS.DELETE_GROUP:
                return <GroupAdminDeleteGroupSection group={group} canDelete={isOwner}
                                                     onDeleteGroup={onDeleteGroup}/>;

            default:
                return null;
        }
    };

    return (
        <Box
            sx={{
                px: {xs: 0.25, sm: 0.75, md: 2},
                py: {xs: 0.25, sm: 0.5, md: 1.5},
                maxWidth: 1200,
                mx: "auto",
                width: "100%",
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {xs: "1fr", md: "280px 1fr"},
                    gap: {xs: 1.25, md: 3},
                    alignItems: "start",
                }}
            >
                <Dialog
                    open={profileCropOpen}
                    onClose={closeProfileCrop}
                    fullWidth
                    maxWidth="sm"
                    fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
                    PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, m: { xs: 0, sm: undefined } } }}
                >
                    <DialogTitle sx={{ fontWeight: 950, textAlign: "center", pr: 6 }}>
                        Crop profile picture
                        <IconButton aria-label="Close" onClick={closeProfileCrop} sx={{ position: "absolute", right: 8, top: 8 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers sx={{ p: 0 }}>
                        <Box sx={{ position: "relative", width: "100%", height: 340, bgcolor: "action.hover" }}>
                            {profileCropSrc ? (
                                <Cropper
                                    image={profileCropSrc}
                                    crop={profileCrop}
                                    zoom={profileCropZoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setProfileCrop}
                                    onZoomChange={setProfileCropZoom}
                                    onCropComplete={(_, croppedPixels) => setProfileCroppedArea(croppedPixels)}
                                />
                            ) : null}
                        </Box>
                        <Box sx={{ px: 3, py: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Zoom</Typography>
                            <Slider
                                value={profileCropZoom}
                                min={1}
                                max={3}
                                step={0.01}
                                onChange={(_, v) => setProfileCropZoom(Array.isArray(v) ? v[0] : v)}
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ px: 2, py: 1.5 }}>
                        <Button onClick={closeProfileCrop} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={confirmCropAndUpload}
                            disabled={isUploadingProfile || !profileCroppedArea}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                        >
                            Crop &amp; save
                        </Button>
                    </DialogActions>
                </Dialog>


                <Dialog open={coverCropOpen} onClose={closeCoverCrop} fullWidth maxWidth="md"
                        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
                        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, maxWidth: { xs: 'none', sm: 980 }, width: "100%", m: { xs: 0, sm: undefined } } }}>
                    <DialogTitle sx={{ fontWeight: 950, textAlign: "center", pr: 6 }}>
                        Crop cover photo
                        <IconButton aria-label="Close" onClick={closeCoverCrop} sx={{ position: "absolute", right: 8, top: 8 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers sx={{ p: 0 }}>
                        <Box sx={{ position: "relative", width: "100%", height: 320, bgcolor: "action.hover" }}>
                            {coverCropSrc ? (
                                <Cropper
                                    image={coverCropSrc}
                                    crop={coverCrop}
                                    zoom={coverCropZoom}
                                    aspect={COVER_ASPECT}
                                    showGrid
                                    onCropChange={setCoverCrop}
                                    onZoomChange={setCoverCropZoom}
                                    onCropComplete={(_, croppedPixels) => setCoverCroppedArea(croppedPixels)}
                                />
                            ) : null}
                        </Box>
                        <Box sx={{ px: 3, py: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Zoom</Typography>
                            <Slider
                                value={coverCropZoom}
                                min={1}
                                max={3}
                                step={0.01}
                                onChange={(_, v) => setCoverCropZoom(Array.isArray(v) ? v[0] : v)}
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ px: 2, py: 1.5 }}>
                        <Button onClick={closeCoverCrop} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={confirmCoverCropAndUpload}
                            disabled={isUploadingCover || !coverCroppedArea}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950 }}
                        >
                            Crop &amp; save
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={Boolean(toast)}
                    autoHideDuration={3500}
                    onClose={closeToast}
                    anchorOrigin={{vertical: "top", horizontal: "center"}}
                >
                    {toast ? (
                        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{fontWeight: 900}}>
                            {toast.message}
                        </Alert>
                    ) : (
                        <span/>
                    )}
                </Snackbar>

                {/* Mobile menu */}
                <Paper
                    elevation={0}
                    sx={(t) => ({
                        display: {xs: "block", md: "none"},
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        overflow: "hidden",
                        boxShadow: t.shadows[1],
                        position: "sticky",
                        top: 0,
                        zIndex: 5,
                        backdropFilter: "blur(10px)",
                    })}
                >
                    <Tabs
                        value={activeIndex}
                        onChange={(_, v) => setActiveKey(menuItems[v]?.key || GROUP_ADMIN_MENU_KEYS.SETTINGS)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 950,
                                minHeight: 48,
                            },
                        }}
                    >
                        {menuItems.map((m) => {
                            let badgeContent = 0;
                            if (m.badgeKey === "pendingRequests" && pendingRequestsCount > 0) badgeContent = pendingRequestsCount;
                            if (m.badgeKey === "reportedCount" && reportedCount > 0) badgeContent = reportedCount;

                            const label = badgeContent > 0 ? (
                                <Badge
                                    badgeContent={badgeContent}
                                    color="primary"
                                    sx={{"& .MuiBadge-badge": {fontWeight: 900}}}
                                >
                                    <Box component="span" sx={{pr: 0.5}}>
                                        {m.label}
                                    </Box>
                                </Badge>
                            ) : (
                                m.label
                            );

                            return <Tab key={m.key} label={label}/>;
                        })}
                    </Tabs>

                    {/* Mobile: View Group Page link */}
                    <Box sx={{ px: 1.5, py: 0.75, borderTop: "1px solid", borderColor: "divider" }}>
                        <Button
                            onClick={() => {
                                const gUsername = group?.group_username || group?.groupUsername || group?.slug || groupId;
                                navigate(`/groups/${gUsername}`);
                            }}
                            size="small"
                            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 900,
                                fontSize: 12.5,
                                color: t.palette.primary.main,
                            })}
                        >
                            View Group Page
                        </Button>
                    </Box>
                </Paper>

                {/* Desktop sidebar */}
                <Paper
                    elevation={0}
                    sx={(t) => ({
                        display: {xs: "none", md: "block"},
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        boxShadow: t.shadows[1],
                        overflow: "hidden",
                        position: "sticky",
                        top: 88,
                        alignSelf: "start",
                    })}
                >
                    {/* Sidebar header — group identity */}
                    <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                component="img"
                                src={settings?.image_url || group?.image_url || group?.imageUrl || defaultGroupIcon}
                                alt={settings?.name || group?.name || "Group"}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2.5,
                                    objectFit: "cover",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    flexShrink: 0,
                                }}
                            />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography sx={{ fontWeight: 1050, fontSize: 15.5, lineHeight: 1.2 }} noWrap>
                                    {settings?.name || group?.name || "Group"}
                                </Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: 12.5, opacity: 0.55 }}>
                                    Admin Console
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            {isOwner && (
                                <Box
                                    sx={(t) => ({
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.4,
                                        px: 0.85,
                                        py: 0.15,
                                        borderRadius: 999,
                                        bgcolor: alpha(t.palette.error.main, 0.1),
                                        color: t.palette.error.main,
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 950, fontSize: 11 }}>Owner</Typography>
                                </Box>
                            )}
                            <Typography sx={{ fontWeight: 850, fontSize: 12, opacity: 0.5 }}>
                                {group?.member_count ?? group?.memberCount ?? group?.members_count ?? ""}{" "}
                                {(group?.member_count ?? group?.memberCount ?? group?.members_count) === 1 ? "member" : "members"}
                            </Typography>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Menu items */}
                    <List disablePadding sx={{ p: 1 }}>
                        {menuItems.map((m) => {
                            const Icon = m.icon;
                            const selected = m.key === activeKey;
                            const isDanger = Boolean(m.danger);

                            const badgeContent =
                                m.badgeKey === "pendingRequests" && pendingRequestsCount > 0 ? pendingRequestsCount
                                    : m.badgeKey === "reportedCount" && reportedCount > 0 ? reportedCount
                                        : 0;

                            return (
                                <ListItemButton
                                    key={m.key}
                                    selected={selected}
                                    onClick={() => setActiveKey(m.key)}
                                    sx={(t) => ({
                                        borderRadius: 3,
                                        mb: 0.35,
                                        px: 1.5,
                                        py: 0.85,
                                        transition: "background-color 120ms ease",
                                        "&:hover": {
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                        },
                                        "&.Mui-selected": {
                                            bgcolor: alpha(t.palette.primary.main, 0.12),
                                            "&:hover": {bgcolor: alpha(t.palette.primary.main, 0.15)},
                                        },
                                        ...(isDanger
                                            ? {
                                                color: t.palette.error.main,
                                                "& .MuiListItemIcon-root": {color: t.palette.error.main},
                                                "&:hover": {bgcolor: alpha(t.palette.error.main, 0.08)},
                                                "&.Mui-selected": {
                                                    bgcolor: alpha(t.palette.error.main, 0.10),
                                                    "&:hover": {bgcolor: alpha(t.palette.error.main, 0.14)},
                                                },
                                            }
                                            : {}),
                                    })}
                                >
                                    <ListItemIcon sx={{minWidth: 36}}>
                                        <Badge badgeContent={badgeContent} color="primary"
                                               sx={{"& .MuiBadge-badge": {fontWeight: 900}}}>
                                            <Icon fontSize="small"/>
                                        </Badge>
                                    </ListItemIcon>
                                    <ListItemText primary={m.label} primaryTypographyProps={{fontWeight: 950, fontSize: 14}}/>
                                </ListItemButton>
                            );
                        })}
                    </List>

                    <Divider />

                    {/* View Group Page — separated from menu items */}
                    <Box sx={{ p: 1 }}>
                        <ListItemButton
                            onClick={() => {
                                const gUsername = group?.group_username || group?.groupUsername || group?.slug || groupId;
                                navigate(`/groups/${gUsername}`);
                            }}
                            sx={(t) => ({
                                borderRadius: 3,
                                px: 1.5,
                                py: 0.85,
                                "&:hover": {
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                },
                            })}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <OpenInNewIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="View Group Page" primaryTypographyProps={{ fontWeight: 950, fontSize: 14 }} />
                        </ListItemButton>
                    </Box>
                </Paper>

                {/* Content */}
                <Box sx={{ minWidth: 0 }}>
                    <ContentFadeIn triggerKey={activeKey}>
                        {renderActive()}
                    </ContentFadeIn>
                </Box>
            </Box>
        </Box>
    );
}


// src/pages/music/components/CreateArtistPostDialog.jsx
//
// Reusable dialog for creating artist posts.
// Extracted from ArtistProfilePage so it can be used on the Music hub page too.
// Adds optional city/county location fields + lat/lng coordinate resolution
// so posts appear on the map.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Popper,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";

import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";

import CityCountySelect from "../../../components/CityCountySelect";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkProfanity } from '../../../utils/profanityCheck';
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";

import cityGeoJson from "../../../data/alabamaCities.json";
import countyGeoJson from "../../../data/alabamaCounties.json";

/* ── Coordinate resolution (self-contained — no external deps) ── */
const stripCountySuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

function getCoordsFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    const rings = type === "MultiPolygon"
        ? (coordinates || []).flat()
        : type === "Polygon" ? (coordinates || []) : [];

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const ring of rings) {
        if (!Array.isArray(ring)) continue;
        for (const pt of ring) {
            if (!Array.isArray(pt) || pt.length < 2) continue;
            const [lng, lat] = pt;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
    }
    if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
        return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    }
    return null;
}

function resolveLocationCoords(city, county) {
    const cityFeatures = cityGeoJson?.features || [];
    const countyFeatures = countyGeoJson?.features || [];

    if (city) {
        const norm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) =>
            String(f?.properties?.NAME || f?.properties?.name || "").trim().toLowerCase() === norm
        );
        if (hit) { const c = getCoordsFromFeature(hit); if (c) return c; }
    }

    if (county) {
        const norm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) =>
            stripCountySuffix(f?.properties?.NAME || f?.properties?.name || "").toLowerCase() === norm
        );
        if (hit) { const c = getCoordsFromFeature(hit); if (c) return c; }
    }

    return null;
}

/* ── Constants ── */
const POST_BODY_CHAR_LIMIT = 5000;
const MAX_POST_PHOTOS = 4;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/* ── @Mention helpers (same as ArtistProfilePage) ── */
const MENTION_RE_MATCH = /(?:^|\s)@([a-zA-Z0-9_]{1,30})$/;

function getMentionMatch(text, cursorIndex) {
    if (!text || cursorIndex <= 0) return null;
    const before = text.slice(0, cursorIndex);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const query = m[1];
    const start = before.lastIndexOf("@" + query);
    return { query, start, end: cursorIndex };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const cs = window.getComputedStyle(textareaEl);
    [
        "font", "fontSize", "fontFamily", "fontWeight", "fontStyle",
        "letterSpacing", "wordSpacing", "lineHeight", "textTransform",
        "padding", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom",
        "border", "borderWidth", "boxSizing", "width", "whiteSpace", "overflowWrap", "wordWrap",
    ].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "-9999px";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";

    const textBefore = textareaEl.value.slice(0, caretIndex);
    mirror.textContent = textBefore;
    const span = document.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const taRect = textareaEl.getBoundingClientRect();
    const offsetX = spanRect.left - mirror.getBoundingClientRect().left;
    const offsetY = spanRect.top - mirror.getBoundingClientRect().top;
    document.body.removeChild(mirror);

    const x = taRect.left + offsetX;
    const y = taRect.top + offsetY - textareaEl.scrollTop + 20;

    return { getBoundingClientRect: () => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0 }) };
}

function MentionAccountBadge({ item }) {
    if (!item) return null;
    const isVerified = item.is_verified === true || item.is_verified === 1;
    const type = String(item.account_type || "").toLowerCase();
    return (
        <>
            {isVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: "primary.main", ml: 0.25 }} />}
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
        </>
    );
}

function renderMentionPopper({ open, anchorEl, results, loading, activeIdx, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1500 }}
                modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
            <ClickAwayListener onClickAway={onClose}>
                <Paper elevation={6} sx={{ width: 280, maxHeight: 220, overflow: "auto", borderRadius: 2 }}>
                    {loading && <Box sx={{ p: 1.5, textAlign: "center" }}><CircularProgress size={18} /></Box>}
                    {!loading && !results.length && <Typography variant="body2" sx={{ p: 1.5, color: "text.secondary" }}>No users found</Typography>}
                    {!loading && results.length > 0 && (
                        <List dense disablePadding>
                            {results.map((u, i) => (
                                <ListItemButton key={u.id || i} selected={i === activeIdx}
                                                onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
                                                sx={{ py: 0.5, px: 1.25 }}>
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar src={u.avatar_url || u.profile_picture || undefined}
                                                sx={{ width: 28, height: 28, fontSize: 13 }}>
                                            {(u.name || u.username || "?")[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                                {u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}
                                            </Typography>
                                            <MentionAccountBadge item={u} />
                                        </Box>}
                                        secondary={<Typography variant="caption" color="text.secondary" noWrap>@{u.handle || u.username}</Typography>}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Paper>
            </ClickAwayListener>
        </Popper>
    );
}

function useMentionField(text, setText, inputRef) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const caretRef = useRef(0);
    const startRef = useRef(0);
    const endRef = useRef(0);
    const abortRef = useRef(null);

    const close = () => { setOpen(false); setResults([]); setQuery(""); setActiveIdx(0); };

    const insert = (user) => {
        const handle = user.handle || user.username || "";
        const before = text.slice(0, startRef.current);
        const after = text.slice(endRef.current);
        const next = before + "@" + handle + " " + after;
        setText(next);
        close();
        setTimeout(() => { const el = inputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!open || !query) { setResults([]); return; }
        const ctrl = new AbortController();
        abortRef.current?.abort();
        abortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await axios.get("/api/community/users/search", { params: { q: query, limit: 8 }, signal: ctrl.signal });
                if (!ctrl.signal.aborted) { setResults(Array.isArray(res.data) ? res.data : []); setActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setResults([]); }
            finally { if (!ctrl.signal.aborted) setLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [open, query]);

    const onChange = (e) => {
        const val = e.target.value;
        setText(val);
        const cursor = e.target.selectionStart || 0;
        caretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            startRef.current = match.start;
            endRef.current = match.end;
            setQuery(match.query);
            setAnchorEl(getMentionAnchorVirtualEl(e.target, cursor));
            if (!open) setOpen(true);
        } else { close(); }
    };

    const onKeyDown = (e) => {
        if (open && results.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + results.length) % results.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insert(results[activeIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); close(); return; }
        }
    };

    const popper = renderMentionPopper({
        open: open && Boolean(anchorEl),
        anchorEl,
        results,
        loading,
        activeIdx,
        onSelect: insert,
        onClose: close,
    });

    return { onChange, onKeyDown, popper };
}

/* ── Photo upload helper ──
   Uploads all photos to GCS in parallel. For a typical 1–4 photo post this
   collapses what used to be 1–4 sequential signed-URL + PUT pairs (often
   several seconds end-to-end) into a single concurrent wave.

   Order is preserved via Array#map. If any individual upload fails (bad
   signed-URL response, network error, non-OK PUT), that photo is skipped —
   same contract as the original sequential loop. */
async function uploadPhotosToGCS(photoItems) {
    const results = await Promise.all(
        (photoItems || []).map(async (item) => {
            if (!item?.file) return null;
            try {
                const signedRes = await secureFetch("/api/uploads/signed-url", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                    body: JSON.stringify({
                        folder: "artist-posts",
                        fileName: item.file.name || `photo-${Date.now()}.jpg`,
                        contentType: item.file.type || "image/jpeg",
                    }),
                });
                if (!signedRes.ok) return null;
                const { uploadUrl, publicUrl } = await signedRes.json();
                const putRes = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": item.file.type || "image/jpeg" },
                    body: item.file,
                });
                return putRes.ok ? publicUrl : null;
            } catch {
                return null;
            }
        })
    );
    return results.filter(Boolean);
}

/* ── API helper ── */
async function createArtistPost(artistId, data) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAccountHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create post");
    }
    return res.json();
}

/* ══════════════════════════════════════════════════════════════════
   CreateArtistPostDialog
   ══════════════════════════════════════════════════════════════════ */
export default function CreateArtistPostDialog({ open, onClose, artistId, artistName, onPostCreated }) {
    const _capTheme = useTheme();
    const _capMobile = useMediaQuery(_capTheme.breakpoints.down('sm'));

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [photos, setPhotos] = useState([]);
    const [city, setCity] = useState("");
    const [county, setCounty] = useState("");
    const [geocoding, setGeocoding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const contentRef = useRef(null);
    const bodyInputRef = useRef(null);
    const fetchedProfileRef = useRef(false);

    const mentionBody = useMentionField(body, setBody, bodyInputRef);

    // Auto-fill location from user profile on first open
    useEffect(() => {
        if (!open || fetchedProfileRef.current) return;
        fetchedProfileRef.current = true;
        const ac = new AbortController();

        secureFetch("/users/profile", { credentials: "include", signal: ac.signal })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const u = data?.user || data || null;
                if (!u) return;
                const profileCity = String(u.city || u.home_city || "").trim();
                const profileCounty = String(u.county || u.home_county || "").trim();
                if (profileCity) setCity((prev) => prev || profileCity);
                if (profileCounty) setCounty((prev) => prev || profileCounty);
            })
            .catch(() => { /* ignore */ });

        return () => ac.abort();
    }, [open]);

    const handleClose = () => {
        setTitle("");
        setBody("");
        setPhotos([]);
        setCity("");
        setCounty("");
        setError(null);
        setFieldErrors({});
        fetchedProfileRef.current = false;
        onClose();
    };

    /**
     * Resolve lat/lng from city/county using local GeoJSON.
     * Returns { lat, lng }
     */
    const resolveCoordinates = async () => {
        const trimCity = String(city || "").trim();
        const trimCounty = String(county || "").trim();
        const isAllCity = !trimCity || trimCity.toLowerCase() === "all cities";
        const isAllCounty = !trimCounty || trimCounty.toLowerCase() === "all counties";

        if (isAllCounty) return { lat: null, lng: null };

        // Resolve from local GeoJSON data
        const coords = resolveLocationCoords(isAllCity ? "" : trimCity, trimCounty);
        if (coords && coords.length >= 2) {
            return { lat: coords[0], lng: coords[1] };
        }
        return { lat: null, lng: null };
    };

    const handleSubmit = async () => {
        // Client-side profanity check — all text fields
        const strippedBody = stripHtml(String(body || '')).trim();
        const fieldsToCheck = { title, body: strippedBody };
        const fieldOrder = ['title', 'body'];

        const newFieldErrors = {};
        for (const [fieldName, value] of Object.entries(fieldsToCheck)) {
            if (!value) continue;
            const result = checkProfanity(value);
            if (!result.clean) {
                newFieldErrors[fieldName] = 'Contains inappropriate language. Please revise.';
            }
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setError(null);
            const firstBad = fieldOrder.find(f => newFieldErrors[f]);
            if (firstBad) {
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${firstBad}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
            return;
        }

        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        try {
            // Resolve coordinates
            setGeocoding(true);
            const result = await resolveCoordinates();
            setGeocoding(false);

            const { lat, lng } = result;

            // Upload photos to GCS first
            let mediaUrl = null;
            if (photos.length > 0) {
                setUploadingPhotos(true);
                try {
                    const urls = await uploadPhotosToGCS(photos);
                    if (urls.length > 0) {
                        mediaUrl = JSON.stringify(urls);
                    }
                } finally {
                    setUploadingPhotos(false);
                }
            }

            const cityVal = String(city || "").trim();
            const countyVal = String(county || "").trim();
            const isAllCity = !cityVal || cityVal.toLowerCase() === "all cities";
            const isAllCounty = !countyVal || countyVal.toLowerCase() === "all counties";

            await createArtistPost(artistId, {
                type: "update",
                title: title.trim(),
                body: body.trim(),
                media_url: mediaUrl,
                city: isAllCity ? null : cityVal,
                county: isAllCounty ? null : countyVal,
                latitude: lat,
                longitude: lng,
            });
            handleClose();
            onPostCreated?.();
        } catch (err) {
            if (err?.field) {
                setFieldErrors(prev => ({ ...prev, [err.field]: err.message || 'Contains inappropriate content. Please revise.' }));
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${err.field}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                setError(err?.message || "Failed to create post. Please try again.");
            }
        } finally {
            setGeocoding(false);
            setSubmitting(false);
            setUploadingPhotos(false);
        }
    };

    return (
        <Dialog open={open} onClose={(_, reason) => { if (reason === 'backdropClick') return; handleClose(); }} maxWidth="sm" fullWidth fullScreen={_capMobile} sx={{ zIndex: (t) => t.zIndex.modal + 50 }} PaperProps={{ sx: { maxHeight: _capMobile ? '100%' : "90vh", borderRadius: _capMobile ? 0 : undefined, ...(_capMobile && { pt: 'env(safe-area-inset-top, 0px)' }) } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Typography variant="h6" component="span" fontWeight={800}>New Post</Typography>
                <IconButton onClick={handleClose} size="small"><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent ref={contentRef} sx={{ overflowY: "auto", overflowX: "hidden" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Share an update with your followers as {artistName}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.title; return n; }); }}
                    sx={{ mb: 2 }}
                    data-field="title"
                    error={Boolean(fieldErrors.title)}
                    inputProps={{ maxLength: 180 }}
                    helperText={fieldErrors.title || `${title.length}/180`}
                    required
                />

                <Box data-field="body" sx={{
                    '& .ProseMirror, & .tiptap, & [contenteditable="true"]': {
                        height: 280,
                        overflowY: 'auto',
                    },
                }}>
                    <RichTextEditor
                        label="Description"
                        value={body}
                        onChange={(html) => { setBody(html); setFieldErrors(prev => { const n = {...prev}; delete n.body; return n; }); }}
                        error={Boolean(fieldErrors.body)}
                        helperText={fieldErrors.body || undefined}
                        maxLength={POST_BODY_CHAR_LIMIT}
                        placeholder="Tell your followers what's happening..."
                        minRows={10}
                    />
                </Box>

                {/* Location */}
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>Location</Typography>
                    <CityCountySelect
                        city={city}
                        setCity={setCity}
                        county={county}
                        setCounty={setCounty}
                        countyRequired={false}
                        countyError=""
                        cityError=""
                        emptyCountyLabel="All Counties"
                        emptyCityLabel="All Cities"
                        allCountyValue="All Counties"
                        allCityValue="All Cities"
                    />
                </Box>

                <PhotosUploadSection
                    photos={photos}
                    setPhotos={setPhotos}
                    disabled={submitting}
                    maxPhotos={MAX_POST_PHOTOS}
                    title="Photos"
                    helperText="Add photos to make your post stand out"
                    addButtonText="Add photos"
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || submitting || geocoding}
                    startIcon={submitting || geocoding ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {geocoding
                        ? "Locating..."
                        : uploadingPhotos
                            ? "Uploading photos..."
                            : submitting
                                ? "Publishing..."
                                : "Publish Post"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

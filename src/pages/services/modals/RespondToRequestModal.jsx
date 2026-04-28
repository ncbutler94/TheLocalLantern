// src/pages/services/modals/RespondToRequestModal.jsx
//
// Allows a service provider to respond to a community service request.
// Includes: message, optional quote (type + min/max), estimated timeline,
// and optional link to one of their existing service listings.

import React, { useEffect, useRef, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { createRequestResponse, fetchMyServices } from "../api/servicesApi";
import RichTextEditor from "../../../components/RichTextEditor";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkFieldsProfanity } from "../../../utils/profanityCheck";
import { secureFetch } from "../../../utils/secureFetch";

// ─── Constants ────────────────────────────────────────────

const MESSAGE_MAX = 2000;

const QUOTE_TYPE_OPTIONS = [
    { value: "", label: "No Quote" },
    { value: "free_estimate", label: "Free Estimate / Consultation" },
    { value: "hourly", label: "Hourly Rate" },
    { value: "flat", label: "Flat Rate" },
    { value: "flexible", label: "Flexible / Negotiable" },
];

const TIMELINE_OPTIONS = [
    { value: "", label: "Not specified" },
    { value: "Same day", label: "Same day" },
    { value: "1-2 days", label: "1–2 days" },
    { value: "3-5 days", label: "3–5 days" },
    { value: "1-2 weeks", label: "1–2 weeks" },
    { value: "2-4 weeks", label: "2–4 weeks" },
    { value: "custom", label: "Custom (type below)" },
];

const OPAQUE_FIELD_SX = {
    "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
};

const MAX_RESPONSE_PHOTOS = 4;

// Ensure Select dropdown menus render above the fullscreen Dialog (zIndex 10100)
const DROPDOWN_MENU_PROPS = {
    sx: { zIndex: 10200 },
};

// Format a raw phone string like "2566896557" → "(256) 689-6557"
function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// ─── Component ───────────────────────────────────────────

export default function RespondToRequestModal({
                                                  open = false,
                                                  onClose,
                                                  request,
                                                  onSuccess,
                                              }) {
    const auth = useAuth();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
    const requireAuth = auth?.requireAuth;
    const isAuthed = Boolean(auth?.user);

    const {
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
        activeAccount,
    } = useActiveAccount();

    // Form state
    const [message, setMessage] = useState("");
    const [messageModError, setMessageModError] = useState("");
    const messageRef = useRef(null);
    const [quoteType, setQuoteType] = useState("");
    const [quoteMin, setQuoteMin] = useState("");
    const [quoteMax, setQuoteMax] = useState("");
    const [timelineSelect, setTimelineSelect] = useState("");
    const [timelineCustom, setTimelineCustom] = useState("");
    const [linkedListingId, setLinkedListingId] = useState("");
    const [contactPref, setContactPref] = useState("message");
    const [contactVal, setContactVal] = useState("");
    const [photos, setPhotos] = useState([]);

    // My listings for linking
    const [myListings, setMyListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(false);

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showValidation, setShowValidation] = useState(false);

    // Load user's service listings — filtered to the active account only.
    // The /my endpoint returns listings across ALL accounts (personal + business + artist),
    // so we filter client-side to only show listings owned by the currently active account.
    useEffect(() => {
        if (!open || !isAuthed) return;
        let cancelled = false;
        setLoadingListings(true);
        fetchMyServices({ status: "active" })
            .then((result) => {
                if (cancelled) return;
                const all = Array.isArray(result?.items) ? result.items : [];
                // Filter to listings that match the active account
                const filtered = all.filter((listing) => {
                    const pType = listing.providerType || listing.provider_type || "user";
                    const pId = String(listing.providerId || listing.provider_id || "");

                    if (isBusinessAccount && activeBusinessId) {
                        return pType === "business" && pId === String(activeBusinessId);
                    }
                    if (isArtistAccount && activeArtistId) {
                        return pType === "music" && pId === String(activeArtistId);
                    }
                    // Personal account — only show user-type listings
                    return pType === "user" || pType === "personal" || pType === "";
                });
                setMyListings(filtered);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingListings(false); });
        return () => { cancelled = true; };
    }, [open, isAuthed, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setMessage("");
            setMessageModError("");
            setQuoteType("");
            setQuoteMin("");
            setQuoteMax("");
            setTimelineSelect("");
            setTimelineCustom("");
            setLinkedListingId("");
            setContactPref("message");
            setContactVal("");
            setPhotos([]);
            setSubmitError("");
            setShowValidation(false);
        }
    }, [open]);

    const messageValid = stripHtml(message).trim().length >= 10;
    const contactValid = contactPref === "message" || contactVal.trim().length > 0;
    const estimatedTimeline = timelineSelect === "custom" ? timelineCustom.trim() : timelineSelect;

    const handleClose = (_, reason) => {
        if (reason === "backdropClick") return;
        if (isSubmitting) return;
        if (typeof onClose === "function") onClose();
    };

    const handleSubmit = async () => {
        if (!isAuthed) return requireAuth();
        setShowValidation(true);
        setSubmitError("");
        setMessageModError("");
        if (!messageValid || !contactValid) {
            if (!messageValid && messageRef.current) {
                messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Client-side profanity check (matches announcement form approach)
        const strippedMsg = stripHtml(String(message || '')).trim();
        const profanityResult = checkFieldsProfanity({ message: strippedMsg });
        if (!profanityResult.clean) {
            setMessageModError('Your message contains inappropriate language. Please revise and try again.');
            if (messageRef.current) {
                messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);
        try {
            // Photos are handed to createRequestResponse as-is and uploaded
            // server-side. Moderation happens there. We used to run an
            // NSFW scan client-side in a sequential for loop here, which
            // doubled the network work and made the submit feel laggy.
            const newFiles = photos.filter((p) => p && p.file).map((p) => p.file);
            // ── Resolve responder identity from the active account ──
            // When operating as a business or artist, use that account's
            // name / avatar / handle so the notification shows the business
            // or artist profile — not the personal profile behind it.
            let responderName;
            let responderAvatar;
            let responderHandle;
            let responderType = "personal";
            let responderProfileId = null;

            if (isBusinessAccount && activeAccount) {
                responderName = activeAccount.name || "";
                responderAvatar =
                    activeAccount.avatar_url ||
                    activeAccount.logo_url ||
                    null;
                responderHandle = activeAccount.slug || activeAccount.handle || null;
                responderType = "business";
                responderProfileId = activeBusinessId || activeAccount.businessId || activeAccount.id || null;
            } else if (isArtistAccount && activeAccount) {
                responderName = activeAccount.name || "";
                responderAvatar = activeAccount.avatar_url || null;
                responderHandle = activeAccount.slug || activeAccount.handle || null;
                responderType = "artist";
                responderProfileId = activeArtistId || activeAccount.artistId || activeAccount.id || null;
            } else {
                const userName = [auth?.user?.first_name, auth?.user?.last_name].filter(Boolean).join(" ");
                responderName = userName;
                responderAvatar = auth?.user?.avatar_url || auth?.user?.profile_picture || null;
                responderHandle = auth?.user?.handle || null;
            }

            const payload = {
                message: message.trim(),
                quoteType: quoteType || null,
                quoteMin: quoteMin ? Number(quoteMin) : null,
                quoteMax: quoteMax ? Number(quoteMax) : null,
                estimatedTimeline: estimatedTimeline || null,
                listingId: linkedListingId || null,
                responderName,
                responderAvatar,
                responderHandle,
                responderType,
                responderProfileId,
                responderContactPref: contactPref || "message",
                responderContactVal: contactPref !== "message" ? contactVal.trim() : null,
            };
            await createRequestResponse(request.id, payload, newFiles);
            if (typeof onSuccess === "function") onSuccess();
            onClose();
        } catch (err) {
            setSubmitError(err.message || "Failed to submit response.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={Boolean(open)}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            disablePortal={false}
            sx={{ zIndex: 10100 }}
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 3,
                    overflow: "hidden",
                    height: fullScreen ? "100%" : undefined,
                    maxHeight: fullScreen ? "100%" : "90vh",
                    width: fullScreen ? "100%" : { sm: "680px" },
                    display: "flex",
                    flexDirection: "column",
                    ...(fullScreen && { pt: 'env(safe-area-inset-top, 0px)' }),
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, flexShrink: 0,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid", borderColor: "divider",
                    position: "relative",
                }}
            >
                <IconButton
                    onClick={handleClose}
                    disabled={isSubmitting}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                >
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 4 }}>
                    <SendRoundedIcon sx={{ fontSize: 24, color: "primary.main" }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 17, lineHeight: 1.2 }}>
                            Respond to Request
                        </Typography>
                        {request && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mt: 0.25 }}>
                                &ldquo;{request.title}&rdquo;
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2, bgcolor: "background.paper", overflowY: "auto", flex: 1 }}>
                {!isAuthed && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        Please sign in to respond to this request.
                    </Alert>
                )}

                {submitError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{submitError}</Alert>
                )}

                <Stack spacing={2.5}>
                    {/* Message */}
                    <Box ref={messageRef}>
                        <RichTextEditor
                            label="Your Message"
                            placeholder="Introduce yourself, describe your experience with this type of work, and why you'd be a good fit..."
                            value={message}
                            onChange={(html) => { setMessage(html); if (messageModError) setMessageModError(""); }}
                            maxLength={MESSAGE_MAX}
                            minRows={4}
                            required
                            error={(showValidation && !messageValid) || Boolean(messageModError)}
                            helperText={messageModError || (showValidation && !messageValid ? "Please write at least 10 characters." : "")}
                        />
                    </Box>

                    {/* Contact Preference (required) — placed right after message */}
                    <Box sx={(t) => ({
                        p: 2, borderRadius: 2,
                        border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                        bgcolor: alpha(t.palette.background.default, 0.5),
                    })}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <SendRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                                Contact Preference <Typography component="span" sx={{ color: "error.main" }}>*</Typography>
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                            How should the requester reach you if they accept your response?
                        </Typography>

                        <FormControl fullWidth size="small" sx={OPAQUE_FIELD_SX}>
                            <InputLabel>Preferred Contact Method</InputLabel>
                            <Select
                                value={contactPref}
                                label="Preferred Contact Method"
                                onChange={(e) => setContactPref(e.target.value)}
                                MenuProps={DROPDOWN_MENU_PROPS}
                            >
                                <MenuItem value="message">In-app Message</MenuItem>
                                <MenuItem value="call">Phone Call</MenuItem>
                                <MenuItem value="email">Email</MenuItem>
                            </Select>
                        </FormControl>

                        {contactPref !== "message" && (
                            <TextField
                                label={contactPref === "call" ? "Phone Number" : "Email Address"}
                                placeholder={contactPref === "call" ? "(205) 555-1234" : "you@example.com"}
                                value={contactPref === "call" ? formatPhoneNumber(contactVal) : contactVal}
                                onChange={(e) => {
                                    if (contactPref === "call") {
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setContactVal(digits);
                                    } else {
                                        setContactVal(e.target.value);
                                    }
                                }}
                                fullWidth
                                required
                                size="small"
                                error={showValidation && !contactValid}
                                helperText={showValidation && !contactValid ? (contactPref === "call" ? "Phone number is required." : "Email address is required.") : ""}
                                inputProps={{ maxLength: 200 }}
                                sx={{ mt: 1.5, ...OPAQUE_FIELD_SX }}
                            />
                        )}
                    </Box>

                    {/* Quote */}
                    <Box sx={(t) => ({
                        p: 2, borderRadius: 2,
                        border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                        bgcolor: alpha(t.palette.background.default, 0.5),
                    })}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <AttachMoneyRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Quote (Optional)</Typography>
                        </Box>

                        <FormControl fullWidth size="small" sx={{ mb: 1.5, ...OPAQUE_FIELD_SX }}>
                            <InputLabel>Quote Type</InputLabel>
                            <Select
                                value={quoteType}
                                label="Quote Type"
                                onChange={(e) => setQuoteType(e.target.value)}
                                MenuProps={DROPDOWN_MENU_PROPS}
                            >
                                {QUOTE_TYPE_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {quoteType && quoteType !== "free_estimate" && (
                            <Stack direction="row" spacing={1.5}>
                                <TextField
                                    label="Min"
                                    placeholder="0"
                                    value={quoteMin}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setQuoteMin(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...OPAQUE_FIELD_SX }}
                                />
                                <TextField
                                    label="Max"
                                    placeholder="0"
                                    value={quoteMax}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setQuoteMax(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...OPAQUE_FIELD_SX }}
                                />
                            </Stack>
                        )}
                        {quoteType === "free_estimate" && (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                You'll provide a detailed estimate after discussing the project.
                            </Typography>
                        )}
                    </Box>

                    {/* Timeline */}
                    <FormControl fullWidth size="small" sx={OPAQUE_FIELD_SX}>
                        <InputLabel>Estimated Timeline</InputLabel>
                        <Select
                            value={timelineSelect}
                            label="Estimated Timeline"
                            onChange={(e) => setTimelineSelect(e.target.value)}
                            MenuProps={DROPDOWN_MENU_PROPS}
                        >
                            {TIMELINE_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {timelineSelect === "custom" && (
                        <TextField
                            label="Custom Timeline"
                            placeholder='e.g. "Can start next Monday, finish by Friday"'
                            value={timelineCustom}
                            onChange={(e) => setTimelineCustom(e.target.value)}
                            inputProps={{ maxLength: 200 }}
                            size="small"
                            fullWidth
                            sx={OPAQUE_FIELD_SX}
                        />
                    )}

                    {/* Link a listing */}
                    {myListings.length > 0 && (
                        <Box sx={(t) => ({
                            p: 2, borderRadius: 2,
                            border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                            bgcolor: alpha(t.palette.background.default, 0.5),
                        })}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                <LinkRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Link Your Service (Optional)</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                                Attach one of your service listings so the requester can see your profile, reviews, and pricing.
                            </Typography>
                            <FormControl fullWidth size="small" sx={OPAQUE_FIELD_SX}>
                                <InputLabel>Select Listing</InputLabel>
                                <Select
                                    value={linkedListingId}
                                    label="Select Listing"
                                    onChange={(e) => setLinkedListingId(e.target.value)}
                                    MenuProps={DROPDOWN_MENU_PROPS}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {myListings.map((l) => (
                                        <MenuItem key={l.id} value={l.id}>{l.title}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Photos */}
                    <Box sx={(t) => ({
                        p: 2, borderRadius: 2,
                        border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                        bgcolor: alpha(t.palette.background.default, 0.5),
                    })}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <PhotoLibraryOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Photos (Optional)</Typography>
                        </Box>
                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={setPhotos}
                            disabled={isSubmitting}
                            maxPhotos={MAX_RESPONSE_PHOTOS}
                            title=""
                            helperText="Add photos of your past work, certifications, or anything relevant."
                            addButtonText="Add photos"
                        />
                    </Box>

                    {/* Privacy note */}
                    <Alert severity="info" icon={false} sx={{ borderRadius: 2, py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Your contact information stays private until the requester accepts your response.
                        </Typography>
                    </Alert>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 }, py: 1.5, flexShrink: 0,
                    bgcolor: "background.paper",
                    borderTop: "1px solid", borderColor: "divider",
                    justifyContent: "space-between",
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, color: "text.secondary" }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isAuthed || isSubmitting}
                    endIcon={<SendRoundedIcon />}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3 }}
                >
                    {isSubmitting ? "Sending…" : "Send Response"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

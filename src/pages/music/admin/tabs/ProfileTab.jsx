// src/pages/music/admin/tabs/ProfileTab.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { secureFetch } from "../../../../utils/secureFetch";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { themedInputSx, themedMultilineInputSx } from "../../../../components/themedInputSx";

import CityCountySelect from "../../../../components/CityCountySelect";
import { checkHandleAvailable, updateArtist } from "../../api/artists";

import { alpha } from "@mui/material/styles";
import { checkFieldsProfanity } from '../../../../utils/profanityCheck';
const NAME_MAX = 120;
const REQUESTED_NAME_MAX = 255;
const HANDLE_MAX = 64;
const BIO_MAX = 3000;
const MAX_HANDLE_CHANGES_PER_MONTH = 3;


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

function clampString(value, max) {
    const s = String(value || "");
    if (!Number.isFinite(max) || max <= 0) return s;
    return s.length > max ? s.slice(0, max) : s;
}

function normalizeHandle(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^@+/, "")
        .replace(/[^a-z0-9_]/g, "");
}

function getHandleChangesThisMonth(artist) {
    try {
        const raw = artist?.handleChangesJson || artist?.handle_changes_json;
        const changes = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
        if (!Array.isArray(changes)) return 0;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return changes.filter((ts) => new Date(ts) >= monthStart).length;
    } catch {
        return 0;
    }
}

export default function ProfileTab({
                                       artist,
                                       onRefresh,
                                       onSaveToast,
                                       registerSaveHandler,
                                       onDirtyChange,
                                       onFieldChange,
                                       profanityFieldErrors,
                                       setProfanityFieldErrors,
                                       setupMode,
                                   }) {
    const [name, setName] = useState("");
    const [handle, setHandle] = useState("");
    const [bio, setBio] = useState("");
    const [city, setCity] = useState("");
    const [county, setCounty] = useState("");

    const [originalHandle, setOriginalHandle] = useState("");
    const [originalCity, setOriginalCity] = useState("");
    const [originalCounty, setOriginalCounty] = useState("");
    const [handleCheck, setHandleCheck] = useState({
        checking: false,
        available: true,
        message: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [requestedName, setRequestedName] = useState("");
    const [requestReason, setRequestReason] = useState("");
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [requestSuccess, setRequestSuccess] = useState("");

    useEffect(() => {
        if (!artist) return;

        const artistName = artist.name || "";
        const nextHandle = artist.handle || "";

        setName(artistName);
        setRequestedName(artistName);
        setHandle(nextHandle);
        setOriginalHandle(nextHandle);
        setBio(artist.bio || "");
        setCity(artist.city || "");
        setCounty(artist.county || "");
        setOriginalCity(artist.city || "");
        setOriginalCounty(artist.county || "");
        setError("");
        setSuccess("");
        setRequestError("");
        setRequestSuccess("");
        setRequestReason("");
        setHasChanges(false);
        setHandleCheck({ checking: false, available: true, message: "" });
    }, [artist]);

    useEffect(() => {
        if (!artist) return;

        const changed =
            handle !== (artist.handle || "") ||
            bio !== (artist.bio || "") ||
            city !== (artist.city || "") ||
            county !== (artist.county || "") ||
            (setupMode && name !== (artist.name || ""));

        setHasChanges(changed);
    }, [artist, handle, bio, city, county, name, setupMode]);

    useEffect(() => {
        if (typeof onDirtyChange === "function") {
            onDirtyChange("profile", hasChanges);
        }
    }, [hasChanges, onDirtyChange]);

    // Report field changes to parent for live preview (deduped)
    const prevProfileRef = useRef("");

    useEffect(() => {
        if (typeof onFieldChange !== "function") return;
        const key = `${name}|${handle}|${bio}|${city}|${county}`;
        if (key === prevProfileRef.current) return;
        prevProfileRef.current = key;
        onFieldChange({ name, handle, bio, city, county });
    });

    const checkHandle = useCallback(
        async (value) => {
            const normalized = normalizeHandle(value);

            if (normalized === normalizeHandle(originalHandle)) {
                setHandleCheck({ checking: false, available: true, message: "" });
                return true;
            }

            if (!normalized) {
                setHandleCheck({ checking: false, available: false, message: "Handle is required." });
                return false;
            }

            if (normalized.length < 3 || normalized.length > HANDLE_MAX) {
                setHandleCheck({
                    checking: false,
                    available: false,
                    message: `Handle must be 3-${HANDLE_MAX} characters.`,
                });
                return false;
            }

            if (!/^[a-z0-9_]+$/.test(normalized)) {
                setHandleCheck({
                    checking: false,
                    available: false,
                    message: "Only lowercase letters, numbers, and underscores.",
                });
                return false;
            }

            const changesThisMonth = getHandleChangesThisMonth(artist);
            if (changesThisMonth >= MAX_HANDLE_CHANGES_PER_MONTH) {
                setHandleCheck({
                    checking: false,
                    available: false,
                    message: `You can only change your handle ${MAX_HANDLE_CHANGES_PER_MONTH} times per month.`,
                });
                return false;
            }

            setHandleCheck((previous) => ({ ...previous, checking: true }));

            try {
                const result = await checkHandleAvailable(normalized, artist?.id);
                const isAvailable = Boolean(result?.available);
                setHandleCheck({
                    checking: false,
                    available: isAvailable,
                    message: isAvailable ? "Handle is available." : "That handle is already taken.",
                });
                return isAvailable;
            } catch {
                setHandleCheck({
                    checking: false,
                    available: false,
                    message: "Unable to check handle right now.",
                });
                return false;
            }
        },
        [artist, originalHandle],
    );

    const validateForm = useCallback(() => {
        const currentName = String(name || "").trim();
        if (!currentName) {
            setError("Artist name is required.");
            return false;
        }
        if (currentName.length > NAME_MAX) {
            setError(`Artist name must be ${NAME_MAX} characters or less.`);
            return false;
        }

        const normalizedHandle = normalizeHandle(handle);
        if (!normalizedHandle) {
            setError("Handle is required.");
            return false;
        }
        if (!/^[a-z0-9_]{3,64}$/.test(normalizedHandle)) {
            setError("Handle must be 3–64 characters using lowercase letters, numbers, or underscores.");
            return false;
        }

        if (!county) {
            setError("County is required.");
            return false;
        }

        return true;
    }, [name, handle, county]);

    const handleSave = useCallback(async () => {
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return false;
        }

        // Client-side profanity check
        const profanityResult = checkFieldsProfanity({
            name: String(name || '').trim(),
            bio: String(bio || '').trim(),
        });
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

        const normalizedHandleValue = normalizeHandle(handle);
        if (normalizedHandleValue !== normalizeHandle(originalHandle)) {
            const available = await checkHandle(normalizedHandleValue);
            if (!available) {
                setError("Please choose a different handle.");
                return false;
            }
        }

        setSaving(true);

        try {
            const payload = {
                handle: normalizedHandleValue,
                bio: String(bio || "").trim() || null,
                city: String(city || "").trim() || null,
                county: String(county || "").trim(),
            };

            // If location changed, clear stale coordinates so they get re-geocoded
            const locationChanged =
                city !== originalCity || county !== originalCounty;
            if (locationChanged) {
                payload.latitude = null;
                payload.longitude = null;
            }

            if (normalizedHandleValue !== normalizeHandle(originalHandle)) {
                try {
                    const raw = artist?.handleChangesJson || artist?.handle_changes_json;
                    const existing = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
                    const changes = Array.isArray(existing) ? existing : [];
                    changes.push(new Date().toISOString());
                    payload.handle_changes_json = JSON.stringify(changes);
                } catch {
                    payload.handle_changes_json = JSON.stringify([new Date().toISOString()]);
                }
            }

            await updateArtist({ artistId: artist.id, payload });

            setOriginalHandle(normalizedHandleValue);
            setOriginalCity(String(city || "").trim());
            setOriginalCounty(String(county || "").trim());
            setSuccess("Profile updated successfully!");
            setHasChanges(false);

            if (typeof onRefresh === "function") {
                await onRefresh();
            }
            if (typeof onSaveToast === "function") {
                onSaveToast("Profile updated successfully!");
            }

            return true;
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : "Could not save changes.";
            setError(message);
            return false;
        } finally {
            setSaving(false);
        }
    }, [artist, bio, checkHandle, county, handle, name, onRefresh, onSaveToast, originalHandle, originalCity, originalCounty, city, validateForm]);

    useEffect(() => {
        if (typeof registerSaveHandler !== "function") return undefined;

        return registerSaveHandler({
            key: "profile",
            save: handleSave,
            hasChanges,
            saving,
        });
    }, [registerSaveHandler, handleSave, hasChanges, saving]);

    const handleChanged = useMemo(
        () => normalizeHandle(handle) !== normalizeHandle(originalHandle),
        [handle, originalHandle],
    );
    const normalizedHandle = useMemo(() => normalizeHandle(handle), [handle]);
    const handleError = handleChanged && !handleCheck.available && !handleCheck.checking;

    const openNameDialog = useCallback(() => {
        setRequestedName(String(name || ""));
        setRequestReason("");
        setRequestError("");
        setRequestSuccess("");
        setNameDialogOpen(true);
    }, [name]);

    const handleSubmitNameRequest = useCallback(async () => {
        const nextName = String(requestedName || "").trim();

        setRequestError("");
        setRequestSuccess("");

        if (!artist?.id) {
            setRequestError("Artist could not be identified.");
            return;
        }
        if (!nextName) {
            setRequestError("Please enter the name you want to request.");
            return;
        }
        if (nextName.length > REQUESTED_NAME_MAX) {
            setRequestError(`Requested name must be ${REQUESTED_NAME_MAX} characters or less.`);
            return;
        }
        if (nextName === String(name || "").trim()) {
            setRequestError("Please enter a different name than your current one.");
            return;
        }

        setRequestSubmitting(true);

        try {
            const response = await secureFetch(`/api/music/artists/${artist.id}/request-name-change`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requested_name: nextName,
                    reason: String(requestReason || "").trim() || null,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || "Could not submit name change request.");
            }

            const successMessage = data?.message || "Name change request submitted successfully.";
            setNameDialogOpen(false);
            if (typeof onSaveToast === "function") {
                onSaveToast(successMessage);
            }
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : "Could not submit name change request.";
            setRequestError(message);
        } finally {
            setRequestSubmitting(false);
        }
    }, [artist?.id, name, onSaveToast, requestReason, requestedName]);

    return (
        <Box>
            {error ? (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            ) : null}

            {success ? (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                    {success}
                </Alert>
            ) : null}

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    p: { xs: 2, md: 3 },
                }}
            >
                {setupMode ? (
                    /* Setup mode: editable name field, no approval needed */
                    <TextField
                        label="Artist / Band Name"
                        value={name}
                        onChange={(event) => setName(clampString(event.target.value, NAME_MAX))}
                        fullWidth
                        required
                        inputProps={{ maxLength: NAME_MAX }}
                        helperText={`${String(name || "").length} / ${NAME_MAX}`}
                        sx={OPAQUE_TEXTFIELD_SX}
                    />
                ) : (
                    /* Edit mode: disabled name + Request Name Change button */
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.25}
                        alignItems={{ xs: "stretch", sm: "flex-start" }}
                    >
                        <TextField
                            label="Artist / Band Name"
                            value={name}
                            fullWidth
                            disabled
                            helperText="Artist names are reviewed manually to help prevent fraudulent or misleading account changes."
                            sx={(t) => ({
                                ...OPAQUE_TEXTFIELD_SX,
                                flex: 1,
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: t.palette.text.primary,
                                },
                            })}
                        />

                        <Button
                            type="button"
                            variant="outlined"
                            size="small"
                            startIcon={<DriveFileRenameOutlineRoundedIcon />}
                            onClick={openNameDialog}
                            sx={{
                                minWidth: { xs: "100%", sm: 170 },
                                height: 40,
                                alignSelf: { xs: "stretch", sm: "flex-start" },
                                mt: { xs: 0, sm: 1.1 },
                                borderRadius: 2,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                px: 1.5,
                                flexShrink: 0,
                            }}
                        >
                            Request Name Change
                        </Button>
                    </Stack>
                )}

                <TextField
                    label="Handle"
                    value={handle}
                    onChange={(event) => setHandle(normalizeHandle(event.target.value).slice(0, HANDLE_MAX))}
                    onBlur={() => {
                        if (handleChanged) {
                            checkHandle(handle);
                        }
                    }}
                    required
                    fullWidth
                    inputProps={{ maxLength: HANDLE_MAX }}
                    error={handleError}
                    helperText={
                        handleCheck.checking
                            ? "Checking availability..."
                            : handleChanged
                                ? handleCheck.message
                                : `Your unique URL: www.thelocallantern.com/${normalizedHandle || "handle"}`
                    }
                    InputProps={{
                        startAdornment: <InputAdornment position="start">@</InputAdornment>,
                        endAdornment: handleChanged ? (
                            <InputAdornment position="end">
                                {handleCheck.checking ? (
                                    <CircularProgress size={16} />
                                ) : handleCheck.available ? (
                                    <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
                                ) : (
                                    <ErrorOutlineIcon sx={{ fontSize: 18, color: "error.main" }} />
                                )}
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={OPAQUE_TEXTFIELD_SX}
                />

                <TextField
                    label="Bio"
                    value={bio}
                    onChange={(event) => { setBio(clampString(event.target.value, BIO_MAX)); if (profanityFieldErrors?.bio && typeof setProfanityFieldErrors === 'function') setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next.bio; return next; }); }}
                    fullWidth
                    multiline
                    minRows={6}
                    maxRows={12}
                    inputProps={{ maxLength: BIO_MAX }}
                    error={Boolean(profanityFieldErrors?.bio)}
                    helperText={profanityFieldErrors?.bio || `${String(bio || "").length.toLocaleString()} / ${BIO_MAX.toLocaleString()}`}
                    placeholder="Tell your story..."
                    data-profanity-field="bio"
                    sx={{
                        ...OPAQUE_TEXTFIELD_SX,
                        "& textarea": { overflowY: "auto" },
                    }}
                />

                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5, color: "text.secondary" }}>
                        Location
                    </Typography>
                    <CityCountySelect
                        city={city}
                        setCity={setCity}
                        county={county}
                        setCounty={setCounty}
                        includeAllOptions={false}
                        countyRequired
                        cityRequired={false}
                    />
                </Box>
            </Box>

            <Dialog open={nameDialogOpen} onClose={() => setNameDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Request Artist Name Change</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                            To help protect artists and reduce fraudulent or scam account changes, artist name updates are reviewed manually before they go live.
                        </Typography>

                        <TextField
                            label="Current Name"
                            value={name}
                            fullWidth
                            disabled
                            sx={OPAQUE_TEXTFIELD_SX}
                        />

                        <TextField
                            label="Requested Name"
                            value={requestedName}
                            onChange={(event) => setRequestedName(clampString(event.target.value, REQUESTED_NAME_MAX))}
                            fullWidth
                            autoFocus
                            inputProps={{ maxLength: REQUESTED_NAME_MAX }}
                            helperText={`${String(requestedName || "").length} / ${REQUESTED_NAME_MAX}`}
                            sx={OPAQUE_TEXTFIELD_SX}
                        />

                        <TextField
                            label="Reason (optional)"
                            value={requestReason}
                            onChange={(event) => setRequestReason(clampString(event.target.value, 1000))}
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={6}
                            inputProps={{ maxLength: 1000 }}
                            helperText="Add any context that will help with review."
                            sx={OPAQUE_TEXTFIELD_SX}
                        />

                        {requestError ? <Alert severity="error">{requestError}</Alert> : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setNameDialogOpen(false)} disabled={requestSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitNameRequest}
                        disabled={requestSubmitting}
                        startIcon={requestSubmitting ? <CircularProgress size={16} color="inherit" /> : <DriveFileRenameOutlineRoundedIcon />}
                    >
                        {requestSubmitting ? "Submitting..." : "Send Request"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

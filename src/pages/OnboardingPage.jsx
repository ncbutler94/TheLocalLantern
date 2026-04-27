// frontend/src/pages/OnboardingPage.jsx
//
// Shown to brand-new social (Google/Facebook) signups before they reach
// the main app. Three steps, with smooth cross-fade transitions:
//
//   Step 1 — Confirm the name pre-filled from the social provider
//            (editable, so if Google returned "ACME Plumbing" the user
//             can fix it or proceed as-is if that IS their name)
//   Step 2 — Choose account type: personal / business / artist (music or visual)
//   Step 3 — Brief confirmation with a CTA, then redirect to the right
//            next page (/community, /business/admin/setup,
//            /artists/setup?type=music, /artists/setup?type=artist,
//            /services/create)
//
// Backend contract:
//   GET  /auth/onboarding-status          → { needs_onboarding, first_name, last_name, email }
//   POST /auth/complete-onboarding        → { ok, redirect, account_type }
//
// If a user with needs_onboarding=false lands here (deep link, back button,
// etc), we just bounce them to /community.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Fade,
    Slide,
    ToggleButton,
    ToggleButtonGroup,
    Alert,
    IconButton,
    Checkbox,
    FormControlLabel,
    Link as MuiLink,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import HandymanIcon from '@mui/icons-material/Handyman';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../components/AuthModalContext';
import DateOfBirthPicker from '../components/DateOfBirthPicker';

// Re-uses the same /auth prefix the rest of the app uses
const API_BASE = process.env.REACT_APP_API_URL || '';

// Simple name check mirroring the backend's isValidName so the user gets
// immediate feedback. The backend is the source of truth.
const NAME_MAX = 50;
const NAME_REGEX = /^[\p{L}\p{M}\s'.\-]{1,50}$/u;

function isNameValid(s) {
    const cleaned = String(s || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return false;
    if (cleaned.length > NAME_MAX) return false;
    return NAME_REGEX.test(cleaned);
}

const STEPS = {
    CONFIRM: 'confirm',
    ACCOUNT_TYPE: 'type',
    DONE: 'done',
};

// ── Transition tuning ──────────────────────────────────────────────
// Soft "ease-out-expo-ish" curve — reads as natural deceleration without
// the bounce of a spring.
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Split exit/enter so the outgoing step leaves quickly, then the incoming
// step enters. Sequential (not cross-fade) avoids the "empty container
// hangs around at old step's height for the full fade" feeling — the
// container collapses during the brief gap and re-expands to the new
// step's content size as it enters, which reads as smoother than a
// 320ms overlap.
const EXIT_MS = 140;
const ENTER_MS = 200;
const FADE_MS = ENTER_MS; // backwards-compat for staggered child `riseIn` delays
const SLIDE_PX = 24; // horizontal offset for directional step changes

// Staggered "rise into place" for content inside each step. Used to give
// the incoming step a bit of life instead of all fields appearing at once.
const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translate3d(0, 8px, 0);
    }
    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
`;

// Builds the sx for a child that should fade+rise in, with an optional
// delay so children can stagger (header → form → button).
const riseIn = (delayMs = 0) => ({
    opacity: 0,
    animation: `${fadeInUp} ${FADE_MS}ms ${EASE_OUT} ${delayMs}ms forwards`,
});

// Two directional slide-ins for step transitions. Module-scoped so the
// keyframe names are stable and deduplicated by the emotion cache.
const slideInFromRight = keyframes`
    from { transform: translate3d(${SLIDE_PX}px, 0, 0); }
    to   { transform: translate3d(0, 0, 0); }
`;
const slideInFromLeft = keyframes`
    from { transform: translate3d(-${SLIDE_PX}px, 0, 0); }
    to   { transform: translate3d(0, 0, 0); }
`;

// Used for the success checkmark on the DONE step — scales in from 0.6x
// with a gentle overshoot for a satisfying "ta-da" moment without being gaudy.
const popIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.6);
    }
    60% {
        opacity: 1;
        transform: scale(1.08);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { user, refresh } = useAuth() || {};

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [step, setStep] = useState(STEPS.CONFIRM);
    // `visibleStep` lags `step` by the exit duration. The rendered
    // <SlideFade>s check against this, so only one step is ever mounted at
    // a time. When `step` changes: (1) we set a pending ref and fade the
    // current visible step out, (2) after EXIT_MS we swap `visibleStep` to
    // the target — which mounts and fades in the new step. This keeps the
    // container tightly sized to whichever step is currently rendered,
    // instead of it sitting at max(old, new) height for the whole fade.
    const [visibleStep, setVisibleStep] = useState(STEPS.CONFIRM);
    const [slideDir, setSlideDir] = useState('left');
    // True when we skipped the "Confirm details" step because the user
    // already has name + DOB on file (email-registered users). Used to
    // hide the Back button on Account Type and render StepDots honestly.
    const [confirmSkipped, setConfirmSkipped] = useState(false);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');                       // YYYY-MM-DD
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [accountType, setAccountType] = useState(null);  // 'personal' | 'business' | 'artist' | 'service'
    // When accountType === 'artist', this narrows down which artist flavor:
    //   'music'  → /artists/setup?type=music   (musicians)
    //   'artist' → /artists/setup?type=artist  (visual artists)
    // Mirrors Header.jsx handleCreateArtistProfile('music' | 'artist'). Both
    // values post account_type:'artist' to the onboarding endpoint — the
    // backend doesn't need to know the sub-flavor; we override the redirect
    // client-side to land on the right /artists/setup?type=... URL.
    const [artistProfileType, setArtistProfileType] = useState(null); // 'music' | 'artist' | null
    // Captured from /auth/onboarding-status at mount. We can't rely on
    // AuthContext.user here — refresh() treats NEEDS_ONBOARDING as
    // unauthenticated and sets user=null, so we need our own copy of the
    // identifiers for the post-submit redirect.
    const [myId, setMyId] = useState(null);
    const [myHandle, setMyHandle] = useState(null);
    const [redirectPath, setRedirectPath] = useState('/community');
    // Optional navigation state to pass along with the redirect (e.g., to
    // auto-open the Edit Profile dialog for new personal accounts).
    const [redirectState, setRedirectState] = useState(null);

    // Ref to avoid setting state on unmounted component during transitions
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // ── Fetch status on mount ─────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/onboarding-status`, {
                    credentials: 'include',
                });

                if (cancelled) return;

                if (res.status === 401) {
                    // Not signed in — send them to login
                    navigate('/login', { replace: true });
                    return;
                }

                if (!res.ok) {
                    setError('Could not load your info. Please refresh and try again.');
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                // If they don't actually need onboarding, bounce them home.
                // This protects against deep-linking to /onboarding.
                if (!data.needs_onboarding) {
                    navigate('/community', { replace: true });
                    return;
                }

                setEmail(data.email || '');
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                if (data.id) setMyId(data.id);
                if (data.handle) setMyHandle(data.handle);

                // If the user already has a DOB on file (email-registered users
                // provide this during signup), skip the "Confirm details" step
                // and jump straight to Account Type. They already validated 18+
                // at registration and the backend re-checks server-side using
                // the existing DOB, so we auto-set ageConfirmed too.
                if (data.has_birthday) {
                    setAgeConfirmed(true);
                    setConfirmSkipped(true);
                    // Jump both step and visibleStep together — the user
                    // never saw CONFIRM, so we don't want the sequencer to
                    // fade it out as if they had.
                    setStep(STEPS.ACCOUNT_TYPE);
                    setVisibleStep(STEPS.ACCOUNT_TYPE);
                }

                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                setError('Network error. Please refresh and try again.');
                setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [navigate]);

    // ── Step transitions with slide direction ─────────────────────────
    const goToStep = (nextStep, direction = 'left') => {
        if (nextStep === step) return;
        setSlideDir(direction);
        setStep(nextStep);
    };

    // Sequence the visible swap: when `step` changes, first fade out the
    // current visibleStep (by flipping it to a sentinel that no SlideFade
    // matches), then after EXIT_MS swap visibleStep to the new target so
    // the incoming step mounts and fades in on its own.
    useEffect(() => {
        if (visibleStep === step) return;
        // Phase 1: hide current step (no SlideFade's `in` will be true)
        setVisibleStep(null);
        const t = setTimeout(() => {
            // Phase 2: mount the new step
            setVisibleStep(step);
        }, EXIT_MS);
        return () => clearTimeout(t);
    }, [step, visibleStep]);

    // Computes age from DOB string; returns null if incomplete
    const computedAge = useMemo(() => {
        if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
        const d = new Date(`${dob}T00:00:00`);
        if (Number.isNaN(d.valueOf())) return null;
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const mDiff = now.getMonth() - d.getMonth();
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) age--;
        return age;
    }, [dob]);

    // ── Step 1 → Step 2 ────────────────────────────────────────────────
    const handleConfirmInfo = (e) => {
        e?.preventDefault?.();
        setError('');

        if (!isNameValid(firstName)) {
            setError('Please enter a valid first name.');
            return;
        }
        if (!isNameValid(lastName)) {
            setError('Please enter a valid last name.');
            return;
        }
        if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
            setError('Please select your date of birth.');
            return;
        }
        if (computedAge === null || computedAge < 18) {
            setError('You must be at least 18 years old to use The Local Lantern.');
            return;
        }
        if (!ageConfirmed) {
            setError('Please confirm you are 18 years or older to continue.');
            return;
        }

        goToStep(STEPS.ACCOUNT_TYPE, 'left');
    };

    // ── Step 2 → submit → Step 3 ──────────────────────────────────────
    const handleSubmitOnboarding = async () => {
        if (!accountType) {
            setError('Please choose an option to continue.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/auth/complete-onboarding`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    dob,
                    age_confirmed: ageConfirmed,
                    account_type: accountType,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.message || 'Could not save. Please try again.');
                setSubmitting(false);
                return;
            }

            // For "Just for me" (personal) accounts, skip the default redirect
            // and send the user to their own profile page with the edit dialog
            // auto-opening, so they can immediately fill in bio/location/etc.
            //
            // Tricky bit: AuthContext.user is null here because refresh() treats
            // the NEEDS_ONBOARDING 401 as unauthenticated. So we:
            //   1. refresh() first — now that needs_onboarding=false in the DB,
            //      /users/profile will return 200 and populate AuthContext.user
            //   2. read the refreshed user from the refresh() return, falling
            //      back to the id/handle we captured from /auth/onboarding-status
            //      at mount, and finally to AuthContext.user (in case someone
            //      got here with an already-populated context).
            //
            // Profile URLs live at /:handleOrId (see App.js route), NOT
            // /profile/:handleOrId — prefix would 404.
            let finalRedirectPath = data.redirect || '/community';
            let finalRedirectState = null;

            // Refresh the AuthContext user object so needs_onboarding:false propagates.
            // Do this BEFORE computing the redirect so the header/UI flips to
            // "logged in" immediately. We don't need refresh()'s return — our
            // captured myId/myHandle are the reliable source for the redirect.
            try {
                if (refresh) await refresh({ force: true });
            } catch { /* non-critical */ }

            if (accountType === 'personal') {
                const handleOrId =
                    user?.handle || user?.username ||
                    myHandle || myId || user?.id;
                if (handleOrId) {
                    finalRedirectPath = `/${encodeURIComponent(handleOrId)}`;
                    finalRedirectState = { openEditProfile: true };
                }
            } else if (accountType === 'artist') {
                // Route to /artists/setup?type=... regardless of whatever the
                // backend returned in data.redirect. This mirrors Header.jsx's
                // handleCreateArtistProfile so the two entry points land on
                // the same setup page. 'music' and 'artist' are the only valid
                // values; default to 'music' if somehow unset.
                const normalizedType = artistProfileType === 'artist' ? 'artist' : 'music';
                finalRedirectPath = `/artists/setup?type=${normalizedType}`;
            }
            setRedirectPath(finalRedirectPath);
            setRedirectState(finalRedirectState);

            if (!mountedRef.current) return;
            setSubmitting(false);
            goToStep(STEPS.DONE, 'left');

            // Auto-redirect after a short celebratory pause
            setTimeout(() => {
                if (!mountedRef.current) return;
                navigate(finalRedirectPath, { replace: true, state: finalRedirectState });
            }, 1400);
        } catch (err) {
            if (!mountedRef.current) return;
            setError('Network error. Please try again.');
            setSubmitting(false);
        }
    };

    // ── Loading gate ─────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={(t) => ({
                // Full-screen takeover on mobile — covers the header.
                // Uses `fixed` positioning so it overlays whatever was behind it.
                position: { xs: 'fixed', md: 'static' },
                inset: { xs: 0, md: 'auto' },
                zIndex: { xs: t.zIndex?.modal || 1300, md: 'auto' },
                minHeight: { xs: '100vh', md: 'calc(100vh - 120px)' },
                // iOS Safari viewport fix (100vh includes the URL bar on some versions)
                height: { xs: '100dvh', md: 'auto' },
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                bgcolor: t.palette.background.default,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                pt: { xs: 0, md: 3.5 },
                pb: { xs: 0, md: 3.5 },
            })}
        >
            {/* Mobile-only close button — "back to home" */}
            <Box sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1.5,
                py: 1,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                bgcolor: (t) => t.palette.background.default,
                borderBottom: (t) => `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
            }}>
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'text.secondary', pl: 1 }}
                >
                    Account setup
                </Typography>
                <IconButton
                    onClick={() => navigate('/', { replace: true })}
                    aria-label="Back to home"
                    size="medium"
                    sx={{ color: 'text.secondary' }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <Container
                maxWidth="sm"
                disableGutters
                sx={{
                    px: { xs: 0, md: 2 },
                    display: 'flex',
                    flexDirection: 'column',
                    flex: { xs: 1, md: 'initial' },
                    width: '100%',
                }}
            >
                <Paper
                    elevation={0}
                    sx={(t) => {
                        const isDark = t.palette.mode === 'dark';
                        return {
                            width: '100%',
                            mx: 'auto',
                            // On mobile: stretch to fill remaining viewport height so the
                            // page is a true full-screen takeover. On desktop: hug content.
                            flex: { xs: 1, md: 'initial' },
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: { xs: 0, md: `${t.shape.borderRadius}px` },
                            border: { xs: 'none', md: '1px solid' },
                            borderColor: { xs: 'transparent', md: alpha(t.palette.text.primary, isDark ? 0.10 : 0.07) },
                            bgcolor: t.palette.background.paper,
                            mt: { xs: 0, md: 2 },
                            boxShadow: { xs: 'none', md: t.custom?.shadows?.md || `0 16px 46px ${alpha(t.palette.common.black, 0.10)}` },
                            position: 'relative',
                            // Subtle entrance so the card lands softly instead of popping in.
                            ...riseIn(0),
                        };
                    }}
                >
                    <Box sx={{ p: { xs: 2.25, sm: 3, md: 4 }, position: 'relative' }}>
                        {/* Progress dots */}
                        <StepDots step={step} skipConfirm={confirmSkipped} />

                        {/* Error banner (shown across all steps) */}
                        {error && (
                            <Fade in>
                                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                            </Fade>
                        )}

                        {/*
                          Steps are layered in the same grid cell so that fading between
                          them doesn't cause the next step to briefly render *below* the
                          current one (which made the Continue button jump down and then
                          snap back up after the fade finished). With gridArea: '1 / 1'
                          on each panel they occupy the same space and cross-fade in place.
                        */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                '& > *': { gridArea: '1 / 1' },
                            }}
                        >
                            {/* ── STEP 1: CONFIRM INFO ───────────────────────── */}
                            <SlideFade in={visibleStep === STEPS.CONFIRM} direction={slideDir}>
                                <Box>
                                    <Box sx={riseIn(0)}>
                                        <StepHeader
                                            title="Welcome! Let's confirm your info"
                                            subtitle="We pulled this from your sign-in. Edit anything that isn't right."
                                        />
                                    </Box>

                                    <Box
                                        component="form"
                                        onSubmit={handleConfirmInfo}
                                        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, ...riseIn(80) }}
                                    >
                                        <TextField
                                            label="Email"
                                            value={email}
                                            fullWidth
                                            disabled
                                            helperText="Linked to your sign-in account"
                                        />
                                        <TextField
                                            label="First name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            fullWidth
                                            required
                                            inputProps={{ maxLength: NAME_MAX }}
                                            autoFocus
                                        />
                                        <TextField
                                            label="Last name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            fullWidth
                                            required
                                            inputProps={{ maxLength: NAME_MAX }}
                                        />

                                        <DateOfBirthPicker
                                            value={dob}
                                            onChange={setDob}
                                            helperText="You must be 18 or older to use The Local Lantern."
                                        />

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={ageConfirmed}
                                                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                                                    sx={(t) => ({
                                                        color: alpha(t.palette.text.primary, 0.4),
                                                        '&.Mui-checked': {
                                                            color: t.custom?.brand?.brass || t.palette.primary.main,
                                                        },
                                                    })}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                                    I confirm I am 18 years of age or older.
                                                </Typography>
                                            }
                                            sx={{ mt: -0.5, ml: -0.5, alignItems: 'flex-start' }}
                                        />

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            sx={{ mt: 1 }}
                                            fullWidth
                                        >
                                            Continue
                                        </Button>
                                    </Box>
                                </Box>
                            </SlideFade>

                            {/* ── STEP 2: ACCOUNT TYPE ───────────────────────── */}
                            <SlideFade in={visibleStep === STEPS.ACCOUNT_TYPE} direction={slideDir}>
                                <Box>
                                    <Box sx={riseIn(0)}>
                                        <StepHeader
                                            title={`Nice to meet you, ${firstName.trim() || 'there'}!`}
                                            subtitle="Are you here to register a business or music page? You can always add one later."
                                        />
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.25, ...riseIn(80) }}>
                                        <ChoiceTile
                                            selected={accountType === 'personal'}
                                            onClick={() => { setAccountType('personal'); setArtistProfileType(null); }}
                                            icon={<PersonOutlineIcon />}
                                            title="Just for me"
                                            description="A personal account — post, comment, follow neighbors."
                                        />
                                        <ChoiceTile
                                            selected={accountType === 'business'}
                                            onClick={() => { setAccountType('business'); setArtistProfileType(null); }}
                                            icon={<StorefrontIcon />}
                                            title="Register a business"
                                            description="Set up a business page"
                                        />
                                        <ChoiceTile
                                            selected={accountType === 'service'}
                                            onClick={() => { setAccountType('service'); setArtistProfileType(null); }}
                                            icon={<HandymanIcon />}
                                            title="Offer a service"
                                            description="List your services — plumbing, tutoring, lawn care, etc."
                                        />
                                        <ChoiceTile
                                            selected={accountType === 'artist' && artistProfileType === 'music'}
                                            onClick={() => { setAccountType('artist'); setArtistProfileType('music'); }}
                                            icon={<MusicNoteIcon />}
                                            title="I'm a music artist"
                                            description="Create an artist profile for your music."
                                        />
                                        <ChoiceTile
                                            selected={accountType === 'artist' && artistProfileType === 'artist'}
                                            onClick={() => { setAccountType('artist'); setArtistProfileType('artist'); }}
                                            icon={<PaletteRoundedIcon />}
                                            title="I'm a visual artist"
                                            description="Set up a profile for your visual art."
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 3, ...riseIn(160) }}>
                                        {!confirmSkipped && (
                                            <Button
                                                variant="text"
                                                size="large"
                                                onClick={() => goToStep(STEPS.CONFIRM, 'right')}
                                                disabled={submitting}
                                            >
                                                Back
                                            </Button>
                                        )}
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={handleSubmitOnboarding}
                                            disabled={!accountType || submitting}
                                            sx={{ flex: 1 }}
                                        >
                                            {submitting ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : 'Continue'}
                                        </Button>
                                    </Box>
                                </Box>
                            </SlideFade>

                            {/* ── STEP 3: DONE ───────────────────────────────── */}
                            <SlideFade in={visibleStep === STEPS.DONE} direction={slideDir}>
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckCircleIcon
                                        sx={{
                                            fontSize: 64,
                                            color: 'success.main',
                                            mb: 2,
                                            opacity: 0,
                                            animation: `${popIn} 520ms ${EASE_OUT} forwards`,
                                        }}
                                    />
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, ...riseIn(180) }}>
                                        {accountType === 'business' && "Let's set up your business"}
                                        {accountType === 'artist' && artistProfileType === 'music' && "Let's set up your music profile"}
                                        {accountType === 'artist' && artistProfileType === 'artist' && "Let's set up your artist profile"}
                                        {accountType === 'service' && "Let's list your service"}
                                        {accountType === 'personal' && "You're all set!"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, ...riseIn(260) }}>
                                        {accountType === 'business' && 'Taking you to the business setup page…'}
                                        {accountType === 'artist' && artistProfileType === 'music' && 'Taking you to the music setup page…'}
                                        {accountType === 'artist' && artistProfileType === 'artist' && 'Taking you to the artist setup page…'}
                                        {accountType === 'service' && 'Taking you to the service listing page…'}
                                        {accountType === 'personal' && 'Taking you to your profile to set it up…'}
                                    </Typography>
                                    <Box sx={riseIn(340)}>
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate(redirectPath, { replace: true, state: redirectState })}
                                        >
                                            Continue now
                                        </Button>
                                    </Box>
                                </Box>
                            </SlideFade>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

// ── Subcomponents ────────────────────────────────────────────────────

/**
 * SlideFade — combines MUI's Fade with a small horizontal translate so
 * step changes feel directional: "forward" slides the incoming content
 * from the right, "back" slides it from the left.
 *
 * Exit and enter use different durations: exits are snappier (EXIT_MS)
 * so the old content clears the stage quickly, and the incoming step's
 * entrance is given the full ENTER_MS to feel unhurried. The parent's
 * sequencer ensures only one step is mounted at a time, so there's no
 * cross-fade overlap — just a clean out-then-in.
 */
function SlideFade({ in: inProp, direction = 'left', children }) {
    // "left" direction = forward step → incoming slides in from the right.
    // "right" direction = back step → incoming slides in from the left.
    const slideKeyframes = direction === 'left' ? slideInFromRight : slideInFromLeft;

    return (
        <Fade in={inProp} timeout={{ enter: ENTER_MS, exit: EXIT_MS }} unmountOnExit>
            <Box
                sx={{
                    animation: `${slideKeyframes} ${ENTER_MS}ms ${EASE_OUT}`,
                    // willChange hints the browser to promote to its own layer
                    // for a smoother animation on lower-end devices.
                    willChange: 'transform, opacity',
                }}
            >
                {children}
            </Box>
        </Fade>
    );
}

function StepDots({ step, skipConfirm = false }) {
    // When the Confirm step is skipped, don't render a dot for it — the
    // user never sees that screen, so showing it as a past step is misleading.
    const order = skipConfirm
        ? [STEPS.ACCOUNT_TYPE, STEPS.DONE]
        : [STEPS.CONFIRM, STEPS.ACCOUNT_TYPE, STEPS.DONE];
    const idx = order.indexOf(step);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 3 }}>
            {order.map((s, i) => (
                <Box
                    key={s}
                    sx={(t) => ({
                        width: i === idx ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: i <= idx
                            ? (t.custom?.brand?.brass || t.palette.primary.main)
                            : alpha(t.palette.text.primary, 0.15),
                        transition: `all ${FADE_MS}ms ${EASE_OUT}`,
                    })}
                />
            ))}
        </Box>
    );
}

function StepHeader({ title, subtitle }) {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography
                variant="h5"
                sx={(t) => ({
                    fontWeight: t.typography.h5.fontWeight,
                    letterSpacing: t.typography.h5.letterSpacing,
                    mb: 0.75,
                })}
            >
                {title}
            </Typography>
            {subtitle && (
                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}

function ChoiceTile({ selected, onClick, icon, title, description }) {
    return (
        <Box
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
            sx={(t) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: { xs: 2, sm: 2.25 },
                borderRadius: 2,
                border: '2px solid',
                borderColor: selected
                    ? (t.custom?.brand?.brass || t.palette.primary.main)
                    : alpha(t.palette.text.primary, 0.12),
                bgcolor: selected
                    ? alpha(t.custom?.brand?.brass || t.palette.primary.main, 0.06)
                    : 'transparent',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                '&:hover': {
                    borderColor: selected
                        ? (t.custom?.brand?.brass || t.palette.primary.main)
                        : alpha(t.palette.text.primary, 0.28),
                    bgcolor: selected
                        ? alpha(t.custom?.brand?.brass || t.palette.primary.main, 0.08)
                        : alpha(t.palette.text.primary, 0.02),
                },
                '&:focus-visible': {
                    outline: `2px solid ${t.custom?.brand?.brass || t.palette.primary.main}`,
                    outlineOffset: 2,
                },
            })}
        >
            <Box sx={(t) => ({
                width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: selected
                    ? (t.custom?.brand?.brass || t.palette.primary.main)
                    : alpha(t.palette.text.primary, 0.08),
                color: selected ? '#fff' : t.palette.text.primary,
                transition: 'all 180ms ease',
                flexShrink: 0,
            })}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: 15, sm: 16 }, mb: 0.25 }}>
                    {title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                    {description}
                </Typography>
            </Box>
        </Box>
    );
}

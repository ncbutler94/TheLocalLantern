// src/pages/home/HomePage.jsx
//
// Logged-out landing page for The Local Lantern.
// Router: <Route index element={user ? <Navigate to="/community" replace /> : <HomePage />} />
//
// Required Google Font in public/index.html:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { alpha, useTheme, lighten } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Autocomplete,
    Box, Button, Checkbox, CircularProgress, Divider,
    FormControlLabel, InputAdornment, Link, Stack, TextField, Typography,
} from '@mui/material';
import {
    CheckCircleOutline as AvailableIcon,
    ErrorOutline as TakenIcon,
} from '@mui/icons-material';
import axios from '../../api/axiosInstance';
import { useAuth } from '../../components/AuthModalContext';
import logo from '../../assets/LocalLanternHomePageLogo.png';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SocialLoginButtons from '../../components/SocialLoginButtons';
import CityCountySelect from '../../components/CityCountySelect';
import { secureFetch } from '../../utils/secureFetch';
import { setMobileToken } from '../../api/mobileToken';
import { checkReservedUsername } from '../../utils/reservedUsernames';
import { checkFieldsProfanity } from '../../utils/profanityCheck';

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

// ── Registration constants ──
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const HANDLE_MIN = 3;
const HANDLE_MAX = 30;
const HANDLE_CHECK_DEBOUNCE_MS = 400;
const handleCleanRegex = /[^a-z0-9_]/g;
const handleValidRegex = /^[a-z0-9_]{3,30}$/;
const passwordRegex = /^.{8,128}$/;

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'IN', name: 'India' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'GR', name: 'Greece' },
    { code: 'TR', name: 'Turkey' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'EG', name: 'Egypt' },
    { code: 'KE', name: 'Kenya' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Peru' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'ID', name: 'Indonesia' },
];

const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' },
];

const pad2 = (n) => String(n).padStart(2, '0');
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const makeAutoToken = () => Math.random().toString(36).slice(2);

const antiFillAttrs = {
    autoComplete: 'new-password',
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-form-type': 'other',
    'data-google-autofill': 'off',
};

const makeInitialForm = () => ({
    email: '',
    dob: '',
    first_name: '',
    last_name: '',
    country: 'US',
    state: '',
    county: '',
    city: '',
    handle: '',
    password: '',
});

const makeInitialErrors = () => ({
    general: '',
    country: '',
    state: '',
    city: '',
    county: '',
    dob: '',
    password: '',
    handle: '',
});


export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refresh } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));      // 0–599
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600–899
    const isMobileOrTablet = isMobile || isTablet;

    // ── If already logged in, go straight to /community ──
    useEffect(() => {
        if (user) {
            navigate('/community', { replace: true });
        }
    }, [user, navigate]);

    // ── Theme-derived colour tokens ──
    const EASE     = theme.custom?.motion?.ease || 'cubic-bezier(.2,.8,.2,1)';
    const BRASS    = theme.custom?.brand?.brass || theme.palette.secondary.main;
    const BRASS_LIGHT = lighten(BRASS, 0.22);
    const isDark   = theme.palette.mode === 'dark';

    // Landing-page surface tones — derived from the active theme's palette
    // so the login page blends into whatever theme the user will land on.
    //   Light mode: uses the theme's navy primary darkened for a rich but
    //               not-too-deep backdrop that transitions smoothly into
    //               the #E4E8EF feed background.
    //   Dark mode:  uses the theme's background directly for full consistency.
    const CHARCOAL_DEEP = isDark
        ? theme.palette.background.default
        : '#1A344D';   // true homepage background
    const CHARCOAL      = isDark
        ? theme.palette.background.paper
        : '#1A344D';   // main landing background
    const CHARCOAL_MID  = isDark
        ? (theme.custom?.brand?.frost || '#223C57')
        : '#223C57';   // auth card bg — slightly lighter for depth

    /* Dark-sidebar TextField overrides */
    const DARK_INPUT_SX = {
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            backgroundColor: alpha(BRASS, 0.05),
            borderRadius: '12px',
            '& fieldset': { borderColor: alpha(BRASS, 0.25) },
            '&:hover fieldset': { borderColor: alpha(BRASS, 0.38) },
            '&.Mui-focused fieldset': { borderColor: `${BRASS} !important` },
            '& input': { color: '#fff', fontSize: 16 },
            '& input::placeholder': { color: alpha('#fff', 0.40), opacity: 1 },
            '& input:-webkit-autofill': {
                WebkitTextFillColor: '#fff',
                WebkitBoxShadow: `0 0 0 100px ${CHARCOAL_DEEP} inset`,
                caretColor: '#fff',
            },
        },
        '& .MuiInputLabel-root': {
            color: alpha('#fff', 0.55),
            fontSize: 13.5,
            '&.MuiInputLabel-shrink': { backgroundColor: 'transparent', color: BRASS_LIGHT },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: BRASS_LIGHT },
    };

    /* Dark Autocomplete overrides for registration form */
    const DARK_AUTOCOMPLETE_SX = {
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            backgroundColor: alpha(BRASS, 0.05),
            borderRadius: '12px',
            '& fieldset': { borderColor: alpha(BRASS, 0.25) },
            '&:hover fieldset': { borderColor: alpha(BRASS, 0.38) },
            '&.Mui-focused fieldset': { borderColor: `${BRASS} !important` },
            '& input': { color: '#fff', fontSize: 16 },
            '& input:-webkit-autofill': {
                WebkitTextFillColor: '#fff',
                WebkitBoxShadow: `0 0 0 100px ${CHARCOAL_DEEP} inset`,
                caretColor: '#fff',
            },
        },
        '& .MuiInputLabel-root': {
            color: alpha('#fff', 0.55),
            fontSize: 13.5,
            '&.MuiInputLabel-shrink': { backgroundColor: 'transparent', color: BRASS_LIGHT },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: BRASS_LIGHT },
        '& .MuiAutocomplete-popupIndicator': { color: alpha(BRASS, 0.5) },
        '& .MuiAutocomplete-clearIndicator': { color: alpha(BRASS, 0.5) },
        '& .MuiFormHelperText-root': { color: alpha('#fff', 0.45) },
        '& .MuiFormHelperText-root.Mui-error': { color: '#ef5350' },
    };

    /* ─── Shared button styles ─── */
    const PRIMARY_BTN = {
        py: 1.4,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 14.5,
        textTransform: 'none',
        bgcolor: BRASS,
        color: '#fff',
        boxShadow: `0 4px 20px ${alpha(BRASS, 0.30)}, 0 1px 4px ${alpha('#000', 0.12)}, 0 0 12px ${alpha(BRASS, 0.10)}`,
        transition: `all 0.25s ${EASE}`,
        '&:hover': {
            bgcolor: BRASS_LIGHT,
            transform: 'translateY(-1px)',
            boxShadow: `0 6px 28px ${alpha(BRASS, 0.40)}, 0 2px 8px ${alpha('#000', 0.18)}, 0 0 18px ${alpha(BRASS, 0.14)}`,
        },
        '&.Mui-disabled': { bgcolor: alpha(BRASS, 0.35), color: alpha('#fff', 0.5) },
    };

    const OUTLINE_BTN = {
        py: 1.4,
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 14,
        textTransform: 'none',
        color: '#fff',
        borderColor: alpha(BRASS, 0.25),
        backdropFilter: 'blur(8px)',
        transition: `all 0.25s ${EASE}`,
        '&:hover': {
            borderColor: alpha(BRASS, 0.50),
            bgcolor: alpha(BRASS, 0.06),
        },
    };

    /* ─── Glassmorphism card ─── */
    const GLASS_CARD = {
        background: `linear-gradient(135deg, ${alpha(CHARCOAL_MID, 0.95)} 0%, ${alpha(CHARCOAL, 0.90)} 100%)`,
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        borderRadius: '24px',
        border: `1px solid ${alpha(BRASS, 0.12)}`,
        boxShadow: `0 8px 40px ${alpha('#000', 0.3)}, 0 1px 0 ${alpha(BRASS, 0.04)} inset`,
    };

    const [view, setView] = useState('login');

    const [loginVal, setLoginVal] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginBusy, setLoginBusy] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);

    const [forgotId, setForgotId] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotBusy, setForgotBusy] = useState(false);
    const [forgotAck, setForgotAck] = useState('');

    // ── Registration state ──
    const [autoToken, setAutoToken] = useState(() => makeAutoToken());
    const abortRef = useRef(null);
    const [regForm, setRegForm] = useState(() => makeInitialForm());
    const [regSubmitting, setRegSubmitting] = useState(false);
    const [regErrors, setRegErrors] = useState(() => makeInitialErrors());
    const [handleChecking, setHandleChecking] = useState(false);
    const [handleAvailable, setHandleAvailable] = useState(null);
    const handleCheckTimerRef = useRef(null);

    // ── Email verification state ──
    const [verifyStep, setVerifyStep] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [verifySubmitting, setVerifySubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Terms agreement
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Scroll ref for registration card
    const regCardRef = useRef(null);

    // Date bounds for DOB
    const today = new Date();
    const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDobDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const MAX_DOB = toISODate(maxDobDate);
    const MIN_DOB = toISODate(minDobDate);

    const makeEditableOnFocus = (e) => {
        if (e && e.target && e.target.hasAttribute('readonly')) {
            e.target.removeAttribute('readonly');
            // On mobile, removing readonly on focus doesn't always re-trigger
            // the keyboard. Re-focus the element after a microtask so the
            // browser sees a writable field and opens the soft keyboard.
            const el = e.target;
            requestAnimationFrame(() => {
                if (document.activeElement !== el) {
                    el.focus();
                }
            });
        }
    };

    // On touch devices, remove readOnly BEFORE focus fires so the browser
    // sees a writable input and opens the keyboard on the first tap.
    const makeEditableOnTouchStart = (e) => {
        const input = e?.currentTarget?.querySelector?.('input') || e?.target;
        if (input && input.hasAttribute('readonly')) {
            input.removeAttribute('readonly');
        }
    };

    // Reset registration form state
    const resetRegForm = () => {
        try { if (abortRef.current) abortRef.current.abort(); } catch { /* ignore */ }
        abortRef.current = null;
        if (handleCheckTimerRef.current) {
            clearTimeout(handleCheckTimerRef.current);
            handleCheckTimerRef.current = null;
        }
        setRegSubmitting(false);
        setRegErrors(makeInitialErrors());
        setRegForm(makeInitialForm());
        setHandleChecking(false);
        setHandleAvailable(null);
        setVerifyStep(false);
        setVerifyEmail('');
        setVerifyCode('');
        setVerifyError('');
        setVerifySubmitting(false);
        setResendCooldown(0);
        setAgreeToTerms(false);
        setAutoToken(makeAutoToken());
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try { if (abortRef.current) abortRef.current.abort(); } catch { /* ignore */ }
            if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        };
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ── Handle availability check ──
    const checkHandleAvailability = (value) => {
        if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        if (!value || value.length < HANDLE_MIN) {
            setHandleAvailable(null);
            setHandleChecking(false);
            return;
        }
        if (!handleValidRegex.test(value)) {
            setHandleAvailable(null);
            setHandleChecking(false);
            return;
        }
        setHandleChecking(true);
        setHandleAvailable(null);
        handleCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await secureFetch(
                    `${API_BASE}/auth/check-handle?handle=${encodeURIComponent(value)}`,
                    { credentials: 'include' }
                );
                const data = await res.json();
                setRegForm((current) => {
                    if (current.handle === value) {
                        setHandleAvailable(Boolean(data.available));
                        if (!data.available && data.message) {
                            setRegErrors((prev) => ({ ...prev, handle: data.message }));
                        } else if (data.available) {
                            setRegErrors((prev) => ({ ...prev, handle: '' }));
                        }
                    }
                    return current;
                });
            } catch {
                setHandleAvailable(null);
            } finally {
                setHandleChecking(false);
            }
        }, HANDLE_CHECK_DEBOUNCE_MS);
    };

    const handleHandleChange = (rawValue) => {
        const cleaned = rawValue.toLowerCase().replace(handleCleanRegex, '').slice(0, HANDLE_MAX);
        setRegForm((s) => ({ ...s, handle: cleaned }));
        setHandleAvailable(null);
        if (cleaned && cleaned.length < HANDLE_MIN) {
            setRegErrors((prev) => ({ ...prev, handle: `Must be at least ${HANDLE_MIN} characters.` }));
            setHandleChecking(false);
            if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        } else if (cleaned && !handleValidRegex.test(cleaned)) {
            setRegErrors((prev) => ({ ...prev, handle: 'Lowercase letters, numbers, and underscores only.' }));
            setHandleChecking(false);
        } else {
            const reservedResult = checkReservedUsername(cleaned);
            if (reservedResult.reserved) {
                setRegErrors((prev) => ({ ...prev, handle: reservedResult.message }));
                setHandleAvailable(false);
                setHandleChecking(false);
                if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
                return;
            }
            if (cleaned) {
                const profResult = checkFieldsProfanity({ username: cleaned });
                if (!profResult.clean) {
                    setRegErrors((prev) => ({ ...prev, handle: 'Username contains inappropriate language. Please revise.' }));
                    setHandleAvailable(false);
                    setHandleChecking(false);
                    if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
                    return;
                }
            }
            setRegErrors((prev) => ({ ...prev, handle: '' }));
            checkHandleAvailability(cleaned);
        }
    };

    const getHandleHelperProps = () => {
        if (handleChecking) return { text: 'Checking availability...', color: alpha('#fff', 0.5) };
        if (regErrors.handle) return { text: regErrors.handle, color: '#ef5350' };
        if (handleAvailable === true && regForm.handle.length >= HANDLE_MIN) return { text: 'Username is available!', color: '#66bb6a' };
        if (handleAvailable === false) return { text: 'Username is taken.', color: '#ef5350' };
        return { text: 'Lowercase letters, numbers, and underscores only.', color: alpha('#fff', 0.45) };
    };
    const handleHelper = getHandleHelperProps();

    const regUpdate = (k) => (e) => {
        if (k === 'handle') { handleHandleChange(e.target.value || ''); return; }
        if (k === 'country') {
            const val = e.target.value;
            setRegForm((s) => ({ ...s, country: val, state: val === 'US' ? s.state : '', city: '', county: '' }));
            if (val) setRegErrors((er) => ({ ...er, country: '' }));
            setRegErrors((er) => ({ ...er, state: '', city: '', county: '' }));
            return;
        }
        if (k === 'state') {
            const val = e.target.value;
            setRegForm((s) => ({ ...s, state: val, city: val === 'AL' ? s.city : '', county: val === 'AL' ? s.county : '' }));
            if (val) setRegErrors((er) => ({ ...er, state: '' }));
            setRegErrors((er) => ({ ...er, city: '', county: '' }));
            return;
        }
        const val = e.target.value;
        setRegForm((s) => ({ ...s, [k]: val }));
        if (k === 'city' && val) setRegErrors((er) => ({ ...er, city: '' }));
        if (k === 'county' && val) setRegErrors((er) => ({ ...er, county: '' }));
        if (k === 'dob' && val) setRegErrors((er) => ({ ...er, dob: '' }));
        if (k === 'password') setRegErrors((er) => ({ ...er, password: '' }));
    };

    const getAge = (dobString) => {
        const dob = new Date(`${dobString}T00:00:00`);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        return age;
    };

    const submitRegistration = async (e) => {
        e.preventDefault();
        setRegErrors(makeInitialErrors());

        const first = regForm.first_name.trim();
        const last = regForm.last_name.trim();
        const email = regForm.email.trim();

        if (!first || !last) { setRegErrors((s) => ({ ...s, general: 'Please enter your first and last name.' })); return; }
        if (first.length > 50 || last.length > 50) { setRegErrors((s) => ({ ...s, general: 'Names must be 50 characters or fewer.' })); return; }
        if (!email || !/\S+@\S+\.\S+/.test(email)) { setRegErrors((s) => ({ ...s, general: 'Please enter a valid email.' })); return; }
        if (email.length > 254) { setRegErrors((s) => ({ ...s, general: 'Email is too long (max 254 characters).' })); return; }
        if (!regForm.dob) { setRegErrors((s) => ({ ...s, dob: 'Date of birth is required.' })); return; }
        const dobDate = new Date(`${regForm.dob}T00:00:00`);
        if (Number.isNaN(dobDate.getTime())) { setRegErrors((s) => ({ ...s, dob: 'Please enter a valid date of birth.' })); return; }
        if (dobDate > today) { setRegErrors((s) => ({ ...s, dob: 'Date of birth cannot be in the future.' })); return; }
        if (getAge(regForm.dob) < 18) { setRegErrors((s) => ({ ...s, dob: 'You must be at least 18 years old to sign up.' })); return; }
        if (!regForm.country) { setRegErrors((s) => ({ ...s, country: 'Country is required.' })); return; }
        if (regForm.country === 'US' && !regForm.state) { setRegErrors((s) => ({ ...s, state: 'State is required.' })); return; }
        if (regForm.country === 'US' && regForm.state === 'AL') {
            if (!regForm.county) { setRegErrors((s) => ({ ...s, county: 'County is required.' })); return; }
            if (!regForm.city) { setRegErrors((s) => ({ ...s, city: 'City is required.' })); return; }
        }
        if (!regForm.handle || !handleValidRegex.test(regForm.handle)) {
            setRegErrors((s) => ({ ...s, handle: 'Username must be 3–30 chars: lowercase letters, numbers, underscores.' }));
            return;
        }
        const reservedCheck = checkReservedUsername(regForm.handle);
        if (reservedCheck.reserved) { setRegErrors((s) => ({ ...s, handle: reservedCheck.message })); setHandleAvailable(false); return; }
        const profCheck = checkFieldsProfanity({ username: regForm.handle });
        if (!profCheck.clean) { setRegErrors((s) => ({ ...s, handle: 'Username contains inappropriate language. Please revise.' })); setHandleAvailable(false); return; }
        if (handleChecking) { setRegErrors((s) => ({ ...s, handle: 'Please wait — checking username availability.' })); return; }
        if (handleAvailable === false) { setRegErrors((s) => ({ ...s, handle: 'That username is taken. Please choose a different one.' })); return; }
        if (handleAvailable !== true) { setRegErrors((s) => ({ ...s, handle: 'Please wait for username availability to be confirmed.' })); return; }
        if (!passwordRegex.test(regForm.password)) { setRegErrors((s) => ({ ...s, password: 'Password must be 8–128 characters.' })); return; }
        if (!agreeToTerms) { setRegErrors((s) => ({ ...s, general: 'You must agree to the Terms and Conditions, Privacy Policy, and Community Guidelines.' })); return; }

        try {
            setRegSubmitting(true);
            try { if (abortRef.current) abortRef.current.abort(); } catch { /* ignore */ }
            const controller = new AbortController();
            abortRef.current = controller;

            const res = await secureFetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    email,
                    first_name: first,
                    last_name: last,
                    country: regForm.country,
                    state: regForm.country === 'US' ? regForm.state : null,
                    home_county: regForm.country === 'US' && regForm.state === 'AL' ? regForm.county : null,
                    home_city: regForm.country === 'US' && regForm.state === 'AL' ? regForm.city : null,
                    handle: regForm.handle.trim(),
                    password: regForm.password,
                    dob: regForm.dob,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 429) {
                    const retryAfter = Number(res.headers?.get?.('retry-after')) || null;
                    setRegErrors((s) => ({
                        ...s,
                        general: retryAfter
                            ? `Too many attempts — please try again in ${Math.ceil(retryAfter)} seconds.`
                            : 'Too many attempts — please wait a moment before trying again.',
                    }));
                    window.dispatchEvent(new CustomEvent('api:rate-limited', {
                        detail: { retryAfterSec: retryAfter },
                    }));
                } else {
                    setRegErrors((s) => ({ ...s, general: data?.message || 'Registration failed. Please try again.' }));
                }
                try { if (abortRef.current) abortRef.current.abort(); } catch { /* ignore */ }
                abortRef.current = null;
                setRegSubmitting(false);
                return;
            }

            // Registration succeeded — email verification is disabled,
            // so the backend already issued a JWT + cookie and set
            // needs_onboarding=1. Refresh auth and send them straight to
            // /onboarding (same destination as the old post-verify success path).
            //
            // Native: capture the JWT from the response body before refresh()
            // so the next request goes out with a valid Bearer token.
            try {
                const data = await res.json().catch(() => ({}));
                if (data?.token) setMobileToken(data.token);
            } catch {
                // ignore — best-effort token capture
            }

            try { if (typeof refresh === 'function') await refresh({ silent: true }); } catch { /* ignore */ }
            triggerTransition('/onboarding');
        } catch (err) {
            if (err?.name === 'AbortError') return;
            setRegErrors((s) => ({ ...s, general: 'Network error. Please try again.' }));
        } finally {
            abortRef.current = null;
            setRegSubmitting(false);
        }
    };

    const submitVerifyCode = async (e) => {
        e.preventDefault();
        setVerifyError('');
        const code = verifyCode.trim();
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
            setVerifyError('Please enter the 6-digit code from your email.');
            return;
        }
        setVerifySubmitting(true);
        try {
            const res = await secureFetch(`${API_BASE}/auth/verify-email-code`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: verifyEmail, code }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setVerifyError(data?.message || 'Invalid or expired code. Please try again.');
                setVerifySubmitting(false);
                return;
            }

            // Native: capture the JWT from verify-email-code's body before
            // anything else fires, in case the auto-login below isn't taken.
            try {
                const data = await res.json().catch(() => ({}));
                if (data?.token) setMobileToken(data.token);
            } catch {
                // ignore — best-effort token capture
            }

            // If we came here from the login flow, the user has no active session
            // yet — verifying just flipped is_verified on the backend. Log them in
            // now with the password they already typed so they land authenticated.
            if (view === 'verify' && password) {
                try {
                    const loginRes = await axios.post(
                        `${process.env.REACT_APP_API_URL}/auth/login`,
                        { login: verifyEmail, password },
                        { withCredentials: true }
                    );
                    if (loginRes.data?.token) setMobileToken(loginRes.data.token);
                } catch {
                    // If auto-login fails, fall through — refresh() below will
                    // determine session state and the user can retry manually.
                }
            }

            try { if (typeof refresh === 'function') await refresh({ silent: true }); } catch { /* ignore */ }
            // First-time email verification — send them to /onboarding so
            // they can pick an account type. The backend sets needs_onboarding=1
            // at verify time, and OnboardingPage will skip the "Confirm details"
            // step since they already provided name + DOB at registration.
            triggerTransition('/onboarding');
        } catch {
            setVerifyError('Network error. Please try again.');
        } finally {
            setVerifySubmitting(false);
        }
    };

    const resendVerifyCode = async () => {
        if (resendCooldown > 0) return;
        setVerifyError('');
        setResendCooldown(60);
        try {
            const res = await secureFetch(`${API_BASE}/auth/resend-verification-code`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: verifyEmail }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setVerifyError(data?.message || 'Could not resend code. Please try again.');
            }
        } catch {
            setVerifyError('Network error. Please try again.');
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginBusy(true);
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/login`,
                { login: loginVal.trim(), password },
                { withCredentials: true }
            );
            // On native, capture the JWT from the body — see Login.jsx for context.
            if (res.data?.token) setMobileToken(res.data.token);
            setFailedAttempts(0);
            setIsRateLimited(false);
            await refresh({ silent: true });
            // Navigate directly — no fade transition that could get stuck
            navigate('/', { replace: true });
        } catch (err) {
            const status = err?.response?.status;
            const serverMsg = err?.response?.data?.message || '';
            const serverCode = err?.response?.data?.code || '';

            if (status === 403 && serverCode === 'EMAIL_NOT_VERIFIED') {
                // Account exists but email was never verified. Switch to the
                // verify pane, auto-send a fresh code, and let the user enter it.
                const unverifiedEmail = err?.response?.data?.email || loginVal.trim();
                setVerifyEmail(unverifiedEmail);
                setVerifyCode('');
                setVerifyError('');
                setResendCooldown(0);
                setLoginError('');
                setView('verify');
                // Auto-send a new code so the user doesn't have to tap "Resend"
                try {
                    await secureFetch(`${API_BASE}/auth/resend-verification-code`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: unverifiedEmail }),
                    });
                    setResendCooldown(60);
                } catch {
                    // If auto-send fails, they can still tap "Resend code" manually.
                }
            } else if (status === 429) {
                setIsRateLimited(true);
                const retryAfter = Number(err?.response?.headers?.['retry-after']) || null;
                setLoginError(
                    retryAfter
                        ? `Too many attempts — please try again in ${Math.ceil(retryAfter)} seconds.`
                        : 'Too many attempts — please wait a moment before trying again.'
                );
                // Also fire the global rate-limit toast so it's visible
                window.dispatchEvent(new CustomEvent('api:rate-limited', {
                    detail: { retryAfterSec: retryAfter },
                }));
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setLoginError('Multiple failed attempts. Please use "Forgot password?" to reset your password.');
                } else if (newAttempts >= 3) {
                    setLoginError('Incorrect email/username or password. Try resetting your password.');
                } else {
                    setLoginError(serverMsg || 'Incorrect email/username or password.');
                }
            }
        } finally {
            setLoginBusy(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        const id = forgotId.trim();
        if (!id) {
            setForgotError('Please enter your email or username.');
            return;
        }
        setForgotError('');
        setForgotBusy(true);
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
                { login: id },
                { withCredentials: true }
            );
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
            setForgotAck(
                isEmail
                    ? `If that email is linked to an account, a reset link has been sent to ${id}.`
                    : 'If that username exists, a reset link has been sent to the email on file.'
            );
            setView('forgotSent');
        } catch (err) {
            if (err?.response?.status === 429) {
                const retryAfter = Number(err?.response?.headers?.['retry-after']) || null;
                setForgotError(
                    retryAfter
                        ? `Too many attempts — please try again in ${Math.ceil(retryAfter)} seconds.`
                        : 'Too many attempts — please wait a moment before trying again.'
                );
                window.dispatchEvent(new CustomEvent('api:rate-limited', {
                    detail: { retryAfterSec: retryAfter },
                }));
            } else {
                setForgotError(err?.response?.data?.message || 'Unable to send reset email.');
            }
        } finally {
            setForgotBusy(false);
        }
    };

    const showLogin = () => {
        setView('login');
        setLoginError('');
        resetRegForm();
    };
    const showForgot = () => {
        setForgotId(loginVal);
        setForgotError('');
        setForgotAck('');
        setView('forgot');
    };
    const showRegister = () => {
        resetRegForm();
        setView('register');
        // Scroll the registration card into view on mobile after the collapse animation
        setTimeout(() => {
            if (regCardRef.current) {
                regCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 350);
    };

    // --- Fade-out transition state ---
    const [transitioning, setTransitioning] = useState(false);
    const [pageFadingOut, setPageFadingOut] = useState(false);
    const pendingNavRef = useRef(null);
    const pendingSocialClickRef = useRef(null);
    const [contentVisible, setContentVisible] = useState(!isMobileOrTablet);

    // Mobile/Tablet: two-beat entrance
    // Beat 1: brand identity (logo + headline) — quick but visible
    // Beat 2: action area (auth card + explore + footer) — follows right after
    const [fadeStage, setFadeStage] = useState(0);
    useEffect(() => {
        if (!isMobileOrTablet) return;
        const timers = [
            setTimeout(() => setFadeStage(1), 200),   // brand identity
            setTimeout(() => setFadeStage(2), 500),   // action area
        ];
        return () => timers.forEach(clearTimeout);
    }, [isMobileOrTablet]);

    const performNavigation = useCallback(() => {
        setPageFadingOut(true);

        // Inject a full-screen overlay that will persist across navigation
        // and fade out on the community page for a smooth entrance
        const overlay = document.createElement('div');
        overlay.id = 'lantern-transition-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background-color: #1A344D;
            opacity: 1;
            transition: opacity 0.65s cubic-bezier(.2,.8,.2,1);
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            const deferredEl = pendingSocialClickRef.current;
            if (deferredEl) {
                pendingSocialClickRef.current = null;
                deferredEl.click();
                // Fade out overlay after social redirect initiates
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        overlay.style.opacity = '0';
                        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                        // Safety cleanup
                        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 1200);
                    });
                });
                return;
            }
            const dest = pendingNavRef.current || '/community';
            navigate(dest, { replace: true });
            // After React re-renders the community page, fade out the overlay
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    overlay.style.opacity = '0';
                    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                    // Safety cleanup in case transitionend doesn't fire
                    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 1200);
                });
            });
        }, 550);
    }, [navigate]);

    const triggerTransition = useCallback((destination) => {
        if (transitioning) return;
        pendingNavRef.current = destination;
        setTransitioning(true);
        // Fade out page content, then navigate
        setTimeout(() => {
            performNavigation();
        }, 700);
    }, [transitioning, performNavigation]);

    // ── Auto-navigate when arriving from Register after verification ──
    useEffect(() => {
        if (location.state?.playIntroVideo) {
            // Clear the state so refreshing doesn't re-trigger
            window.history.replaceState({}, '');
            // Small delay to let the page mount
            const timer = setTimeout(() => {
                triggerTransition('/community');
            }, 400);
            return () => clearTimeout(timer);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Shared: Logo + Title ─── */
    const logoBrand = (logoSize = 56, titleSize = 22, lanternSize = 28, gap = 1.25) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap, justifyContent: 'center' }}>
            <Box
                component="img"
                src={logo}
                alt="The Local Lantern"
                sx={{
                    height: logoSize,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 4px 16px ${alpha('#000', 0.35)})`,
                    flexShrink: 0,
                }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontSize: titleSize,
                        lineHeight: 1.05,
                        letterSpacing: -0.5,
                        color: '#fff',
                        textShadow: `0 2px 10px ${alpha('#000', 0.4)}`,
                    }}
                >
                    The Local
                </Typography>
                <Typography
                    sx={{
                        fontFamily: SERIF,
                        fontStyle: 'italic',
                        fontWeight: 700,
                        fontSize: lanternSize,
                        lineHeight: 1,
                        letterSpacing: -0.3,
                        color: BRASS_LIGHT,
                        textShadow: `0 3px 12px ${alpha('#000', 0.3)}`,
                    }}
                >
                    Lantern
                </Typography>
            </Box>
        </Box>
    );

    /* ─── Registration Form (inline, dark-themed) ─── */
    const registerForm = (mobile = false) => {
        if (verifyStep) {
            // ── Email Verification Step ──
            return (
                <Box>
                    <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: mobile ? 18 : 19, color: '#fff', mb: 0.5 }}>
                            Verify your email
                        </Typography>
                        <Typography sx={{ color: alpha('#fff', 0.6), fontSize: 13, lineHeight: 1.6 }}>
                            We sent a 6-digit code to <strong style={{ color: BRASS_LIGHT }}>{verifyEmail}</strong>. Enter it below to activate your account.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={submitVerifyCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {verifyError && (
                            <Typography sx={{ color: '#ef5350', fontSize: 12.5, textAlign: 'center', bgcolor: alpha('#ef5350', 0.08), borderRadius: 2, py: 0.75, px: 1.5 }}>
                                {verifyError}
                            </Typography>
                        )}

                        <TextField
                            label="Verification Code"
                            value={verifyCode}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setVerifyCode(v);
                                if (verifyError) setVerifyError('');
                            }}
                            fullWidth
                            required
                            autoFocus
                            placeholder="000000"
                            inputProps={{
                                maxLength: 6,
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                style: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 },
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={DARK_INPUT_SX}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={verifySubmitting || verifyCode.length !== 6}
                            sx={PRIMARY_BTN}
                        >
                            {verifySubmitting ? 'Verifying…' : 'Verify & Continue'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                            <Typography sx={{ color: alpha('#fff', 0.5), fontSize: 12.5, mb: 0.5 }}>
                                Didn't receive the code?
                            </Typography>
                            <Link
                                component="button"
                                type="button"
                                onClick={resendVerifyCode}
                                disabled={resendCooldown > 0}
                                sx={{
                                    color: resendCooldown > 0 ? alpha('#fff', 0.3) : BRASS,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                                    '&:hover': { color: resendCooldown > 0 ? undefined : BRASS_LIGHT },
                                }}
                            >
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                            </Link>
                        </Box>
                    </Box>
                </Box>
            );
        }

        // ── Registration Form ──
        return (
            <Box ref={regCardRef}>
                <Box sx={{ mb: 2, textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: mobile ? 18 : 19, color: '#fff', mb: 0.75 }}>
                        Join The Local Lantern
                    </Typography>
                    {/* Description text moved to left column on desktop; keep it inline on mobile */}
                    {mobile && (
                        <Typography sx={{ color: alpha('#fff', 0.6), fontSize: 13, lineHeight: 1.6, textAlign: 'left' }}>
                            The Local Lantern is built for <strong style={{ color: BRASS_LIGHT }}>Alabama communities</strong>, but everyone is welcome! Whether you live here, are visiting, have roots here, or just want to stay connected with friends and family in the state. Join to discover local events, businesses, jobs, music, services, and marketplace listings happening in our state.
                        </Typography>
                    )}
                </Box>

                {/* Social signup */}
                <Box
                    onClickCapture={(e) => {
                        if (transitioning) return;
                        const target = e.target.closest('a, button');
                        if (!target) return;
                        e.preventDefault();
                        e.stopPropagation();
                        pendingSocialClickRef.current = target;
                        setTransitioning(true);
                        setTimeout(() => {
                            performNavigation();
                        }, mobile ? 400 : 700);
                    }}
                >
                    <SocialLoginButtons label="Continue" dark dividerText="" />
                </Box>

                <Divider sx={{ my: 1.25, borderColor: alpha(BRASS, 0.18) }}>
                    <Typography sx={{ color: alpha('#fff', 0.40), fontSize: 12, px: 1.5, letterSpacing: 0.3 }}>or sign up with email</Typography>
                </Divider>

                {regErrors.general && (
                    <Typography sx={{ color: '#ef5350', fontSize: 12.5, textAlign: 'center', bgcolor: alpha('#ef5350', 0.08), borderRadius: 2, py: 0.75, px: 1.5, mb: 1.5 }}>
                        {regErrors.general}
                    </Typography>
                )}

                <Box component="form" onSubmit={submitRegistration} noValidate autoComplete="off" data-form-type="other" data-lpignore="true">
                    {/* Honeypots */}
                    <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true"
                           style={{ position: 'absolute', opacity: 0, height: 0, width: 0, border: 0, padding: 0 }} />
                    <input type="password" name="password" autoComplete="current-password" tabIndex={-1} aria-hidden="true"
                           style={{ position: 'absolute', opacity: 0, height: 0, width: 0, border: 0, padding: 0 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                        {/* Name row */}
                        <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: '1fr 1fr' }}>
                            <TextField
                                label="First name"
                                id={`first-name-${autoToken}`}
                                name={`first-name-${autoToken}`}
                                value={regForm.first_name}
                                onChange={regUpdate('first_name')}
                                onFocus={makeEditableOnFocus}
                                onTouchStart={makeEditableOnTouchStart}
                                fullWidth required size="small"
                                autoComplete="new-password"
                                inputProps={{ ...antiFillAttrs, maxLength: 50, readOnly: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={DARK_INPUT_SX}
                            />
                            <TextField
                                label="Last name"
                                id={`last-name-${autoToken}`}
                                name={`last-name-${autoToken}`}
                                value={regForm.last_name}
                                onChange={regUpdate('last_name')}
                                onFocus={makeEditableOnFocus}
                                onTouchStart={makeEditableOnTouchStart}
                                fullWidth required size="small"
                                autoComplete="new-password"
                                inputProps={{ ...antiFillAttrs, maxLength: 50, readOnly: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={DARK_INPUT_SX}
                            />
                        </Box>

                        {/* Email */}
                        <TextField
                            label="Email"
                            id={`email-${autoToken}`}
                            name={`email-${autoToken}`}
                            type="email"
                            value={regForm.email}
                            onChange={regUpdate('email')}
                            onFocus={makeEditableOnFocus}
                            onTouchStart={makeEditableOnTouchStart}
                            fullWidth required size="small"
                            autoComplete="new-password"
                            inputProps={{ ...antiFillAttrs, maxLength: 254, readOnly: true, inputMode: 'email' }}
                            InputLabelProps={{ shrink: true }}
                            sx={DARK_INPUT_SX}
                        />

                        {/* DOB */}
                        <TextField
                            label="Date of Birth"
                            id={`dob-${autoToken}`}
                            name={`dob-${autoToken}`}
                            type="date"
                            value={regForm.dob}
                            onChange={regUpdate('dob')}
                            onFocus={makeEditableOnFocus}
                            onTouchStart={makeEditableOnTouchStart}
                            fullWidth required size="small"
                            autoComplete="new-password"
                            error={Boolean(regErrors.dob)}
                            helperText={regErrors.dob || 'Must be 18 or older.'}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ ...antiFillAttrs, min: MIN_DOB, max: MAX_DOB, readOnly: true }}
                            sx={{
                                ...DARK_INPUT_SX,
                                '& .MuiFormHelperText-root': { color: alpha('#fff', 0.45) },
                                '& .MuiFormHelperText-root.Mui-error': { color: '#ef5350' },
                            }}
                        />

                        {/* Location: Country + State */}
                        <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: regForm.country === 'US' ? '1fr 1fr' : '1fr' }}>
                            <Autocomplete
                                options={COUNTRIES}
                                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                                value={COUNTRIES.find((c) => c.code === regForm.country) || null}
                                onChange={(_, val) => {
                                    const code = val?.code || '';
                                    setRegForm((s) => ({ ...s, country: code, state: code === 'US' ? s.state : '', city: '', county: '' }));
                                    if (code) setRegErrors((er) => ({ ...er, country: '' }));
                                    setRegErrors((er) => ({ ...er, state: '', city: '', county: '' }));
                                }}
                                isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                                disableClearable openOnFocus autoHighlight fullWidth
                                size="small"
                                sx={DARK_AUTOCOMPLETE_SX}
                                componentsProps={{ paper: { sx: { maxHeight: 200 } } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Country"
                                        required
                                        error={Boolean(regErrors.country)}
                                        helperText={regErrors.country || ''}
                                        autoComplete="new-password"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ ...params.inputProps, ...antiFillAttrs, autoComplete: 'new-password' }}
                                    />
                                )}
                            />

                            {regForm.country === 'US' && (
                                <Autocomplete
                                    options={US_STATES}
                                    getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                                    value={US_STATES.find((s) => s.code === regForm.state) || null}
                                    onChange={(_, val) => {
                                        const code = val?.code || '';
                                        setRegForm((s) => ({ ...s, state: code, city: code === 'AL' ? s.city : '', county: code === 'AL' ? s.county : '' }));
                                        if (code) setRegErrors((er) => ({ ...er, state: '' }));
                                        setRegErrors((er) => ({ ...er, city: '', county: '' }));
                                    }}
                                    isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                                    openOnFocus autoHighlight fullWidth
                                    size="small"
                                    sx={DARK_AUTOCOMPLETE_SX}
                                    componentsProps={{ paper: { sx: { maxHeight: 200 } } }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="State"
                                            required
                                            error={Boolean(regErrors.state)}
                                            helperText={regErrors.state || ''}
                                            autoComplete="new-password"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ ...params.inputProps, ...antiFillAttrs, autoComplete: 'new-password' }}
                                        />
                                    )}
                                />
                            )}
                        </Box>

                        {/* City/County for Alabama */}
                        {regForm.country === 'US' && regForm.state === 'AL' && (
                            <CityCountySelect
                                city={regForm.city}
                                setCity={(v) => { setRegForm((s) => ({ ...s, city: v })); if (v) setRegErrors((er) => ({ ...er, city: '' })); }}
                                county={regForm.county}
                                setCounty={(v) => { setRegForm((s) => ({ ...s, county: v })); if (v) setRegErrors((er) => ({ ...er, county: '' })); }}
                                cityError={regErrors.city}
                                countyError={regErrors.county}
                                cityRequired
                                countyRequired
                                includeAllOptions={false}
                                disableClearable
                                emptyCountyLabel="Select a county"
                                emptyCityLabel="Select a city"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        backgroundColor: alpha(BRASS, 0.04),
                                        borderRadius: '12px',
                                        '& fieldset': { borderColor: alpha(BRASS, 0.15) },
                                        '&:hover fieldset': { borderColor: alpha(BRASS, 0.30) },
                                        '&.Mui-focused fieldset': { borderColor: `${BRASS} !important` },
                                        '& input': { color: '#fff', fontSize: 16 },
                                    },
                                    '& .MuiInputLabel-root': { color: alpha('#fff', 0.55), '&.MuiInputLabel-shrink': { color: BRASS_LIGHT, backgroundColor: 'transparent' } },
                                    '& .MuiInputLabel-root.Mui-focused': { color: BRASS_LIGHT },
                                    '& .MuiAutocomplete-popupIndicator': { color: alpha(BRASS, 0.5) },
                                    '& .MuiFormHelperText-root': { color: alpha('#fff', 0.45) },
                                    '& .MuiFormHelperText-root.Mui-error': { color: '#ef5350' },
                                }}
                            />
                        )}

                        {/* Username */}
                        <Box>
                            <TextField
                                label="Username"
                                id={`username-${autoToken}`}
                                name={`username-${autoToken}`}
                                value={regForm.handle}
                                onChange={regUpdate('handle')}
                                onFocus={makeEditableOnFocus}
                                onTouchStart={makeEditableOnTouchStart}
                                fullWidth required size="small"
                                autoComplete="new-password"
                                error={Boolean(regErrors.handle) || handleAvailable === false}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ ...antiFillAttrs, maxLength: HANDLE_MAX, readOnly: true }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: alpha('#fff', 0.4) } }}>@</InputAdornment>,
                                    endAdornment: (
                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                            {handleChecking && <CircularProgress size={18} sx={{ color: alpha('#fff', 0.5) }} />}
                                            {!handleChecking && handleAvailable === true && regForm.handle.length >= HANDLE_MIN && (
                                                <AvailableIcon sx={{ color: '#66bb6a', fontSize: 20 }} />
                                            )}
                                            {!handleChecking && handleAvailable === false && (
                                                <TakenIcon sx={{ color: '#ef5350', fontSize: 20 }} />
                                            )}
                                        </Box>
                                    ),
                                }}
                                sx={DARK_INPUT_SX}
                            />
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5, mx: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: handleHelper.color }}>
                                    {handleHelper.text}
                                </Typography>
                                <Typography variant="caption" sx={{ color: alpha('#fff', 0.35) }}>
                                    {regForm.handle.length}/{HANDLE_MAX}
                                </Typography>
                            </Stack>
                        </Box>

                        {/* Password */}
                        <TextField
                            label="Password"
                            id={`password-${autoToken}`}
                            name={`password-${autoToken}`}
                            type="password"
                            value={regForm.password}
                            onChange={regUpdate('password')}
                            onFocus={makeEditableOnFocus}
                            onTouchStart={makeEditableOnTouchStart}
                            fullWidth required size="small"
                            autoComplete="new-password"
                            error={Boolean(regErrors.password)}
                            helperText={regErrors.password || 'At least 8 characters. Longer is stronger — try a passphrase!'}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ ...antiFillAttrs, maxLength: 128, readOnly: true }}
                            sx={{
                                ...DARK_INPUT_SX,
                                '& .MuiFormHelperText-root': { color: alpha('#fff', 0.45) },
                                '& .MuiFormHelperText-root.Mui-error': { color: '#ef5350' },
                            }}
                        />

                        {/* Password strength bar */}
                        <Box sx={{ mt: -1 }}>
                            {(() => {
                                const pwd = regForm.password || '';
                                const len = pwd.length;
                                let pct = 0;
                                let label = 'Too short';
                                const hasLower = /[a-z]/.test(pwd);
                                const hasUpper = /[A-Z]/.test(pwd);
                                const hasDigit = /\d/.test(pwd);
                                const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
                                const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
                                if (len >= 8 && len < 12) { pct = 30; label = variety >= 3 ? 'Fair' : 'Weak'; }
                                else if (len >= 12 && len < 16) { pct = 55; label = variety >= 2 ? 'Good' : 'Fair'; }
                                else if (len >= 16 && len < 20) { pct = 80; label = variety >= 2 ? 'Strong' : 'Good'; }
                                else if (len >= 20) { pct = 100; label = 'Strong'; }
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <Typography sx={{ color: alpha('#fff', 0.5), fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                                            Strength:
                                        </Typography>
                                        <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: 12, whiteSpace: 'nowrap' }}>
                                            {label}
                                        </Typography>
                                        <Box sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: alpha(BRASS, 0.15), overflow: 'hidden' }}>
                                            <Box sx={{
                                                height: '100%', width: `${pct}%`, bgcolor: BRASS, borderRadius: 999,
                                                transition: `width 0.2s ${EASE}`,
                                            }} />
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </Box>

                        {/* Terms agreement */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={agreeToTerms}
                                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                                    sx={{
                                        color: alpha('#fff', 0.4),
                                        '&.Mui-checked': { color: BRASS },
                                        p: 0.5,
                                    }}
                                />
                            }
                            label={
                                <Typography sx={{ color: alpha('#fff', 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
                                    I agree to the{' '}
                                    <Link component={RouterLink} to="/terms" target="_blank" sx={{ color: BRASS, fontWeight: 700, '&:hover': { color: BRASS_LIGHT } }}>
                                        Terms and Conditions
                                    </Link>
                                    ,{' '}
                                    <Link component={RouterLink} to="/privacy" target="_blank" sx={{ color: BRASS, fontWeight: 700, '&:hover': { color: BRASS_LIGHT } }}>
                                        Privacy Policy
                                    </Link>
                                    , and{' '}
                                    <Link component={RouterLink} to="/guidelines" target="_blank" sx={{ color: BRASS, fontWeight: 700, '&:hover': { color: BRASS_LIGHT } }}>
                                        Community Guidelines
                                    </Link>
                                </Typography>
                            }
                            sx={{ alignItems: 'flex-start', mx: 0, mt: 0.5 }}
                        />

                        {/* Submit */}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={regSubmitting}
                            sx={{ ...PRIMARY_BTN, mt: 0.5 }}
                        >
                            {regSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Account'}
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: alpha(BRASS, 0.15), my: 1.25 }} />

                <Typography sx={{ color: alpha('#fff', 0.50), fontSize: 13, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Already have an account?{' '}
                    <Link component="button" type="button" onClick={showLogin}
                          sx={{ color: BRASS, fontWeight: 800, cursor: 'pointer', '&:hover': { color: BRASS_LIGHT } }}>
                        Sign in
                    </Link>
                </Typography>
            </Box>
        );
    };

    /* ─── Verify-Email Form (shown when an unverified user tries to log in) ─── */
    const verifyForm = (mobile = false) => (
        <Box>
            <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: mobile ? 18 : 19, color: '#fff', mb: 0.5 }}>
                    Verify your email
                </Typography>
                <Typography sx={{ color: alpha('#fff', 0.6), fontSize: 13, lineHeight: 1.6 }}>
                    Your account isn't verified yet. We sent a 6-digit code to{' '}
                    <strong style={{ color: BRASS_LIGHT }}>{verifyEmail}</strong>. Enter it below to activate your account and finish signing in.
                </Typography>
            </Box>

            <Box component="form" onSubmit={submitVerifyCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {verifyError && (
                    <Typography sx={{ color: '#ef5350', fontSize: 12.5, textAlign: 'center', bgcolor: alpha('#ef5350', 0.08), borderRadius: 2, py: 0.75, px: 1.5 }}>
                        {verifyError}
                    </Typography>
                )}

                <TextField
                    label="Verification Code"
                    value={verifyCode}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerifyCode(v);
                        if (verifyError) setVerifyError('');
                    }}
                    fullWidth
                    required
                    autoFocus
                    placeholder="000000"
                    inputProps={{
                        maxLength: 6,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        style: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 },
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={DARK_INPUT_SX}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={verifySubmitting || verifyCode.length !== 6}
                    sx={PRIMARY_BTN}
                >
                    {verifySubmitting ? 'Verifying…' : 'Verify & Sign in'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                    <Typography sx={{ color: alpha('#fff', 0.5), fontSize: 12.5, mb: 0.5 }}>
                        Didn't receive the code?
                    </Typography>
                    <Link
                        component="button"
                        type="button"
                        onClick={resendVerifyCode}
                        disabled={resendCooldown > 0}
                        sx={{
                            color: resendCooldown > 0 ? alpha('#fff', 0.3) : BRASS,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: resendCooldown > 0 ? 'default' : 'pointer',
                            '&:hover': { color: resendCooldown > 0 ? undefined : BRASS_LIGHT },
                        }}
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </Link>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 0.25 }}>
                    <Link
                        component="button"
                        type="button"
                        onClick={() => {
                            setVerifyCode('');
                            setVerifyError('');
                            setView('login');
                        }}
                        sx={{
                            color: alpha('#fff', 0.55),
                            fontWeight: 700,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            '&:hover': { color: '#fff' },
                        }}
                    >
                        Back to sign in
                    </Link>
                </Box>
            </Box>
        </Box>
    );

    /* ─── Smooth crossfade transition helpers ─── */
    const [animatingOut, setAnimatingOut] = useState(false);
    const [displayedView, setDisplayedView] = useState(view);
    const containerRef = useRef(null);

    // Crossfade: when `view` changes, fade out current, wait, then swap & fade in
    useEffect(() => {
        if (view === displayedView) return;
        setAnimatingOut(true);
        const timer = setTimeout(() => {
            setDisplayedView(view);
            setAnimatingOut(false);
        }, 280); // matches fade-out duration
        return () => clearTimeout(timer);
    }, [view, displayedView]);

    // Shared pane style for crossfade + slide
    const paneStyle = (paneView) => ({
        opacity: (displayedView === paneView && !animatingOut) ? 1 : 0,
        transform: (displayedView === paneView && !animatingOut) ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.32s ${EASE}, transform 0.36s ${EASE}`,
        pointerEvents: displayedView === paneView ? 'auto' : 'none',
        position: displayedView === paneView ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        visibility: displayedView === paneView ? 'visible' : 'hidden',
        zIndex: displayedView === paneView ? 1 : 0,
    });

    /* ─── Auth Forms ─── */
    const authForms = (mobile = false) => (
        <Box sx={{ position: 'relative', overflow: 'hidden' }} ref={containerRef}>
            {/* Forgot password view */}
            <Box sx={paneStyle('forgot')}>
                <Box component="form" onSubmit={handleForgot} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                    <Box sx={{ mb: 0.25 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: mobile ? 18 : 19, color: '#fff', mb: 0.25 }}>
                            Reset your password
                        </Typography>
                        <Typography sx={{ color: alpha('#fff', 0.6), fontSize: mobile ? 12.5 : 13 }}>
                            Enter your email or username and we'll send a reset link.
                        </Typography>
                    </Box>

                    {forgotError && (
                        <Typography sx={{ color: 'error.main', fontSize: 12, textAlign: 'center', bgcolor: alpha('#ef5350', 0.08), borderRadius: 2, py: 0.75, px: 1.5 }}>
                            {forgotError}
                        </Typography>
                    )}

                    <TextField label="Email or username" value={forgotId} onChange={(e) => setForgotId(e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} sx={DARK_INPUT_SX} />

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button type="submit" variant="contained" fullWidth disabled={forgotBusy} sx={PRIMARY_BTN}>
                            {forgotBusy ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Send link'}
                        </Button>
                        <Button type="button" variant="outlined" fullWidth onClick={showLogin} sx={OUTLINE_BTN}>
                            Cancel
                        </Button>
                    </Box>

                    {!mobile && (
                        <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 11.5, mt: 0.5 }}>
                            We'll send a reset link if your account exists. For security, we don't confirm whether an account is registered.
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={paneStyle('forgotSent')}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: mobile ? 18 : 19, color: '#fff' }}>Check your email</Typography>
                    <Typography sx={{ color: alpha('#fff', 0.6), fontSize: 13, lineHeight: 1.6 }}>{forgotAck}</Typography>
                    <Button variant="contained" fullWidth onClick={showLogin} sx={PRIMARY_BTN}>
                        Back to sign in
                    </Button>
                </Box>
            </Box>

            {/* ── REGISTER VIEW: Full inline registration form ── */}
            <Box sx={paneStyle('register')}>
                {registerForm(mobile)}
            </Box>

            {/* ── VERIFY VIEW: Shown when an unverified user tries to log in ── */}
            <Box sx={paneStyle('verify')}>
                {verifyForm(mobile)}
            </Box>

            {/* Main login view */}
            <Box sx={paneStyle('login')}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {mobile ? (
                        <>
                            <SocialLoginButtons label="Continue" dark dividerText="" />

                            <Divider sx={{ my: 0.25, borderColor: alpha(BRASS, 0.18) }}>
                                <Typography sx={{ color: alpha('#fff', 0.40), fontSize: 12, px: 1.5, letterSpacing: 0.5, textTransform: 'lowercase' }}>or</Typography>
                            </Divider>

                            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                {loginError && (
                                    <Typography sx={{ color: 'error.main', fontSize: 12, textAlign: 'center', bgcolor: alpha('#ef5350', 0.08), borderRadius: 2, py: 0.75, px: 1.5 }}>
                                        {loginError}
                                    </Typography>
                                )}
                                <TextField label="Email or username" value={loginVal} onChange={(e) => setLoginVal(e.target.value)} required fullWidth size="small" autoComplete="username" InputLabelProps={{ shrink: true }} sx={DARK_INPUT_SX} />
                                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth size="small" autoComplete="current-password" InputLabelProps={{ shrink: true }} sx={DARK_INPUT_SX} />
                                <Box sx={{ textAlign: 'right', mt: -0.25 }}>
                                    <Link component="button" type="button" variant="body2" onClick={showForgot}
                                          sx={{ color: BRASS_LIGHT, fontSize: 13, cursor: 'pointer', fontWeight: 700, py: 0.25, '&:hover': { color: lighten(BRASS_LIGHT, 0.15) } }}>
                                        Forgot password?
                                    </Link>
                                </Box>
                                <Button type="submit" variant="contained" fullWidth disabled={loginBusy} sx={PRIMARY_BTN}>
                                    {loginBusy ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign in'}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#fff', mb: 0.15 }}>
                                Welcome
                            </Typography>
                            <Typography sx={{ fontSize: 13.5, color: alpha('#fff', 0.5), mt: -0.25, mb: 0.5, fontWeight: 500 }}>
                                Sign in to your community
                            </Typography>
                            <SocialLoginButtons label="Sign in" dark dividerText="" />
                            <Divider sx={{ my: 0.25, borderColor: alpha(BRASS, 0.18) }}>
                                <Typography sx={{ color: alpha('#fff', 0.40), fontSize: 12, px: 1.5, letterSpacing: 0.5, textTransform: 'lowercase' }}>or</Typography>
                            </Divider>
                            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {loginError && (
                                    <Typography sx={{ color: 'error.main', fontSize: 12.5, textAlign: 'center', bgcolor: (t) => alpha(t.palette.error.main, 0.05), borderRadius: 2, py: 0.75, px: 1.5 }}>
                                        {loginError}
                                    </Typography>
                                )}
                                <TextField label="Email or username" value={loginVal} onChange={(e) => setLoginVal(e.target.value)} required fullWidth size="small" autoComplete="username" InputLabelProps={{ shrink: true }} sx={DARK_INPUT_SX} />
                                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth size="small" autoComplete="current-password" InputLabelProps={{ shrink: true }} sx={DARK_INPUT_SX} />
                                <Box sx={{ textAlign: 'right', mt: -0.25 }}>
                                    <Link component="button" type="button" variant="body2" onClick={showForgot}
                                          sx={{ color: BRASS_LIGHT, fontSize: 13, cursor: 'pointer', fontWeight: 700, '&:hover': { color: lighten(BRASS_LIGHT, 0.15) } }}>
                                        Forgot password?
                                    </Link>
                                </Box>
                                <Button type="submit" variant="contained" fullWidth disabled={loginBusy} sx={PRIMARY_BTN}>
                                    {loginBusy ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign in'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    <Divider sx={{ borderColor: alpha(BRASS, 0.15), my: 0.25 }} />

                    <Typography sx={{ color: alpha('#fff', 0.50), fontSize: 13.5, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        Don't have an account?{' '}
                        <Link component="button" type="button" onClick={showRegister}
                              sx={{ color: BRASS, fontWeight: 800, cursor: 'pointer', '&:hover': { color: BRASS_LIGHT } }}>
                            Sign up
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );


    // Staggered fade-in style for mobile/tablet elements
    const stagger = (stage) => ({
        opacity: (fadeStage >= stage && !transitioning) ? 1 : 0,
        transform: (fadeStage >= stage && !transitioning) ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.45s ${EASE}, transform 0.45s ${EASE}`,
    });


    // ════════════════════════════════════════════════════════
    // ═══ MOBILE + TABLET LAYOUT ═══
    // ════════════════════════════════════════════════════════
    if (isMobileOrTablet) {
        return (
            <Box
                sx={{
                    minHeight: '100dvh',
                    backgroundColor: CHARCOAL,
                    position: 'relative',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                }}
            >

                {/* ── Content ── */}
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        // Anchor content to the top with the footer pushed to the
                        // bottom by a single flex spacer. We tried justifyContent:
                        // 'center' before, but on iOS the dynamic toolbar / home
                        // indicator + 100dvh interaction would push the footer
                        // (Privacy / Terms) below the visible area on phone-sized
                        // viewports.
                        justifyContent: 'flex-start',
                        textAlign: 'center',
                        px: isTablet ? 5 : 3,
                        pt: isTablet ? 'calc(env(safe-area-inset-top, 0px) + 48px)' : 'calc(env(safe-area-inset-top, 0px) + 12px)',
                        pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                        minHeight: '100dvh',
                        pointerEvents: transitioning ? 'none' : 'auto',
                        opacity: pageFadingOut ? 0 : 1,
                        transition: `opacity 0.55s ${EASE}`,
                    }}
                >
                    {/* Logo + headline (beat 1 — brand identity) */}
                    <Box sx={{ mb: isTablet ? 2.5 : 0.5, ...stagger(1) }}>
                        {logoBrand(isTablet ? 120 : 88, isTablet ? 34 : 26, isTablet ? 44 : 32, 1.75)}
                    </Box>

                    <Box
                        sx={{
                            mb: isTablet ? 3.5 : 0.75,
                            maxWidth: isTablet ? 480 : 340,
                            ...stagger(1),
                        }}
                    >
                        <Typography
                            component="h1"
                            sx={{
                                fontWeight: 800,
                                fontSize: isTablet ? 34 : 24,
                                lineHeight: 1.15,
                                letterSpacing: -0.6,
                                color: '#fff',
                                mb: isTablet ? 1.5 : 0.5,
                            }}
                        >
                            Stay connected to your{' '}
                            <Box
                                component="span"
                                sx={{
                                    color: BRASS_LIGHT,
                                    fontFamily: SERIF,
                                    fontStyle: 'italic',
                                }}
                            >
                                Alabama
                            </Box>{' '}
                            community
                        </Typography>

                        <Typography
                            sx={{
                                color: alpha('#fff', 0.58),
                                fontSize: isTablet ? 15 : 14,
                                lineHeight: 1.6,
                                maxWidth: isTablet ? 420 : 320,
                                mx: 'auto',
                            }}
                        >
                            Find what's happening nearby and discover more of what your community has to offer.
                        </Typography>
                    </Box>

                    {/* Auth Card (beat 2 — action area) */}
                    <Box
                        sx={{
                            ...GLASS_CARD,
                            p: isTablet ? 3.5 : 1.75,
                            width: '100%',
                            maxWidth: isTablet ? 420 : 380,
                            textAlign: 'left',
                            ...stagger(2),
                        }}
                    >
                        {authForms(!isTablet)}
                    </Box>

                    {/* Explore CTA (beat 2) */}
                    <Button
                        onClick={() => triggerTransition('/community')}
                        endIcon={<ArrowForwardRoundedIcon />}
                        sx={{
                            mt: isTablet ? 2 : 0.5,
                            py: 0.75,
                            px: 3,
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 14,
                            textTransform: 'none',
                            color: alpha('#fff', 0.65),
                            ...stagger(2),
                            '&:hover': {
                                color: '#fff',
                                bgcolor: alpha(BRASS, 0.08),
                            },
                        }}
                    >
                        Explore without signing in
                    </Button>

                    {/* Footer — sits close below the Explore CTA on mobile so
                        it stays visible without scrolling. (Previously a
                        flexGrow spacer pushed it to the bottom, which kicked
                        it off-screen on shorter phones.) */}
                    <Box sx={{ textAlign: 'center', mt: isTablet ? 4 : 1.5, ...stagger(2) }}>
                        <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 10, letterSpacing: 0.3 }}>
                            © 2026 The Local Lantern
                        </Typography>
                        <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 10, mt: 0.5, letterSpacing: 0.3 }}>
                            <Link component={RouterLink} to="/terms" sx={{ color: alpha('#fff', 0.45), fontSize: 10, '&:hover': { color: alpha('#fff', 0.7) } }}>Terms</Link>
                            {' · '}
                            <Link component={RouterLink} to="/privacy" sx={{ color: alpha('#fff', 0.45), fontSize: 10, '&:hover': { color: alpha('#fff', 0.7) } }}>Privacy</Link>
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ════════════════════════════════════════════════════════
    // ═══ DESKTOP LAYOUT ═══
    // ════════════════════════════════════════════════════════
    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: CHARCOAL,
            }}
        >

            {/* Subtle brass glow — fades with content */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '15%', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%', height: '70%',
                    zIndex: 0, pointerEvents: 'none',
                    background: `radial-gradient(ellipse at center, ${alpha(BRASS, 0.08)} 0%, transparent 70%)`,
                    filter: 'blur(100px)',
                    opacity: pageFadingOut ? 0 : 1,
                    transition: `opacity 0.55s ${EASE}`,
                }}
            />

            {/* ═══ TWO-COLUMN CONTENT ═══ */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 5,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { md: 6, lg: 10, xl: 14 },
                    py: 6,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { md: 6, lg: 10, xl: 14 },
                        width: '100%',
                        maxWidth: 1100,
                        opacity: (contentVisible && !transitioning) ? 1 : 0,
                        transform: (contentVisible && !transitioning) ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.65s ${EASE}, transform 0.65s ${EASE}`,
                        pointerEvents: transitioning ? 'none' : 'auto',
                    }}
                >
                    {/* ── LEFT COLUMN: Logo + headline / register info ── */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            minWidth: 0,
                        }}
                    >
                        {/* Logo — always visible, fixed size */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 2, lg: 2.5 }, mb: 2.5 }}>
                            <Box
                                component="img"
                                src={logo}
                                alt="The Local Lantern"
                                sx={{
                                    height: { md: 180, lg: 220, xl: 250 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 6px 24px ${alpha('#000', 0.4)})`,
                                    flexShrink: 0,
                                }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: { md: '4px', lg: '6px', xl: '8px' } }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { md: 42, lg: 52 },
                                        lineHeight: 1.05,
                                        letterSpacing: -0.5,
                                        color: '#fff',
                                        textShadow: `0 2px 10px ${alpha('#000', 0.4)}`,
                                    }}
                                >
                                    The Local
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: SERIF,
                                        fontStyle: 'italic',
                                        fontWeight: 700,
                                        fontSize: { md: 56, lg: 68 },
                                        lineHeight: 1,
                                        letterSpacing: -0.3,
                                        color: BRASS_LIGHT,
                                        textShadow: `0 3px 12px ${alpha('#000', 0.3)}`,
                                    }}
                                >
                                    Lantern
                                </Typography>
                            </Box>
                        </Box>

                        {/* Description area — crossfade in-place, no layout shift */}
                        <Box sx={{ position: 'relative', minHeight: 140, width: '100%' }}>
                            {/* "Stay connected" headline — login/forgot views */}
                            <Box
                                sx={{
                                    position: view === 'register' ? 'absolute' : 'relative',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    opacity: view === 'register' ? 0 : 1,
                                    transform: view === 'register' ? 'translateY(-8px)' : 'translateY(0)',
                                    transition: `opacity 0.4s ${EASE}, transform 0.4s ${EASE}`,
                                    pointerEvents: view === 'register' ? 'none' : 'auto',
                                }}
                            >
                                <Typography
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { md: 34, lg: 42 },
                                        lineHeight: 1.08,
                                        letterSpacing: -1,
                                        color: '#fff',
                                        mb: 1.5,
                                        textShadow: `0 4px 20px ${alpha('#000', 0.35)}`,
                                    }}
                                >
                                    Stay connected to{' '}
                                    <Box component="br" />
                                    your{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            color: BRASS_LIGHT,
                                            fontFamily: SERIF,
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        Alabama
                                    </Box>{' '}
                                    community
                                </Typography>

                                <Typography
                                    sx={{
                                        color: alpha('#fff', 0.72),
                                        fontSize: { md: 15, lg: 16 },
                                        lineHeight: 1.55,
                                        maxWidth: 420,
                                        textShadow: `0 2px 8px ${alpha('#000', 0.2)}`,
                                    }}
                                >
                                    Find what's happening nearby and discover more of what your Alabama community has to offer.
                                </Typography>
                            </Box>

                            {/* Register description — fades in on register */}
                            <Box
                                sx={{
                                    position: view === 'register' ? 'relative' : 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    opacity: view === 'register' ? 1 : 0,
                                    transform: view === 'register' ? 'translateY(0)' : 'translateY(8px)',
                                    transition: `opacity 0.4s ${EASE} 0.1s, transform 0.4s ${EASE} 0.1s`,
                                    pointerEvents: view === 'register' ? 'auto' : 'none',
                                }}
                            >
                                <Typography
                                    component="h2"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { md: 28, lg: 34 },
                                        lineHeight: 1.12,
                                        letterSpacing: -0.5,
                                        color: '#fff',
                                        mb: 2,
                                        textShadow: `0 4px 20px ${alpha('#000', 0.35)}`,
                                    }}
                                >
                                    Join your{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            color: BRASS_LIGHT,
                                            fontFamily: SERIF,
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        Alabama
                                    </Box>{' '}
                                    community
                                </Typography>

                                <Typography
                                    sx={{
                                        color: alpha('#fff', 0.72),
                                        fontSize: { md: 14.5, lg: 15.5 },
                                        lineHeight: 1.65,
                                        maxWidth: 420,
                                        textShadow: `0 2px 8px ${alpha('#000', 0.2)}`,
                                    }}
                                >
                                    The Local Lantern is built for <strong style={{ color: BRASS_LIGHT }}>Alabama communities</strong>, but everyone is welcome! Whether you live here, are visiting, have roots here, or just want to stay connected with friends and family in the state.
                                </Typography>

                                <Typography
                                    sx={{
                                        color: alpha('#fff', 0.55),
                                        fontSize: { md: 13.5, lg: 14 },
                                        lineHeight: 1.6,
                                        maxWidth: 420,
                                        mt: 1.5,
                                        textShadow: `0 2px 8px ${alpha('#000', 0.15)}`,
                                    }}
                                >
                                    Join to discover local events, businesses, jobs, music, services, and marketplace listings happening in our state.
                                </Typography>
                            </Box>
                        </Box>

                        <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 11, mt: 4, letterSpacing: 0.3 }}>
                            © 2026 The Local Lantern · Piedmont, Alabama
                        </Typography>
                        <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 11, mt: 0.5, letterSpacing: 0.3 }}>
                            <Link component={RouterLink} to="/terms" sx={{ color: alpha('#fff', 0.45), fontSize: 11, '&:hover': { color: alpha('#fff', 0.7) } }}>Terms</Link>
                            {' · '}
                            <Link component={RouterLink} to="/privacy" sx={{ color: alpha('#fff', 0.45), fontSize: 11, '&:hover': { color: alpha('#fff', 0.7) } }}>Privacy</Link>
                            {' · '}
                            <Link component={RouterLink} to="/guidelines" sx={{ color: alpha('#fff', 0.45), fontSize: 11, '&:hover': { color: alpha('#fff', 0.7) } }}>Community Guidelines</Link>
                        </Typography>
                    </Box>

                    {/* ── RIGHT COLUMN: Auth card ── */}
                    <Box
                        sx={{
                            width: { md: 400, lg: 440 },
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            // Allow scrolling for tall registration form
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            // Hide scrollbar but keep scrolling
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(BRASS, 0.18), borderRadius: 999 },
                            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${alpha(BRASS, 0.18)} transparent`,
                        }}
                    >
                        <Box
                            sx={{
                                background: `linear-gradient(145deg, ${alpha(CHARCOAL_MID, 0.97)} 0%, ${alpha(CHARCOAL, 0.95)} 50%, ${alpha(CHARCOAL_MID, 0.97)} 100%)`,
                                backdropFilter: 'blur(24px) saturate(1.4)',
                                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                                borderRadius: '24px',
                                border: `1px solid ${alpha(BRASS, 0.12)}`,
                                boxShadow: `0 16px 56px ${alpha('#000', 0.5)}, 0 1px 0 ${alpha(BRASS, 0.04)} inset`,
                                p: 3.5,
                                width: '100%',
                                textAlign: 'left',
                            }}
                        >
                            {authForms(false)}
                        </Box>

                        {/* Explore CTA */}
                        <Button
                            onClick={() => triggerTransition('/community')}
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={{
                                mt: 3,
                                py: 1.25,
                                px: 3,
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: 14,
                                textTransform: 'none',
                                color: alpha('#fff', 0.55),
                                transition: `all 0.3s ${EASE}`,
                                '&:hover': {
                                    color: '#fff',
                                    bgcolor: alpha(BRASS, 0.08),
                                },
                            }}
                        >
                            Explore without signing in
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

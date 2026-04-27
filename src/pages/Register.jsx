// src/pages/Register.jsx
import { useEffect, useRef, useState } from 'react';
import {
    Autocomplete,
    Box,
    Checkbox,
    CircularProgress,
    Container,
    FormControlLabel,
    Link,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    CheckCircleOutline as AvailableIcon,
    ErrorOutline as TakenIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../components/AuthModalContext';
import CityCountySelect from '../components/CityCountySelect';
import SocialLoginButtons from '../components/SocialLoginButtons';
import DateOfBirthPicker from '../components/DateOfBirthPicker';
import { secureFetch } from '../utils/secureFetch';
import { setMobileToken } from '../api/mobileToken';
import { checkReservedUsername } from '../utils/reservedUsernames';
import { checkFieldsProfanity } from '../utils/profanityCheck';
import useChromeTop from '../hooks/useChromeTop';

// ============================================================================
// Constants (outside component — never recreated on render)
// ============================================================================
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const HANDLE_MIN = 3;
const HANDLE_MAX = 30;
const HANDLE_CHECK_DEBOUNCE_MS = 400;

// Handle: lowercase letters, numbers, underscores only (matches group username rules)
const handleCleanRegex = /[^a-z0-9_]/g;
const handleValidRegex = /^[a-z0-9_]{3,30}$/;

// Password: 8–128 chars
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
const RETURN_TO_KEY = 'll:returnTo';

// Anti-autofill attributes (static object — never recreated on render)
// Chrome ignores autoComplete="off" — "new-password" is the most reliable
// way to suppress address / profile autofill on non-password fields.
const antiFillAttrs = {
    autoComplete: 'new-password',
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-form-type': 'other',
    'data-google-autofill': 'off',
};

const getSafeRedirectPath = (search) => {
    try {
        const sp = new URLSearchParams(search || '');
        const raw = sp.get('redirect');
        if (!raw) return null;
        const decoded = decodeURIComponent(raw);
        if (decoded.startsWith('/register')) return '/';
        if (decoded.startsWith('/')) return decoded;
        return null;
    } catch {
        return null;
    }
};

const readReturnTo = () => {
    try {
        const raw = sessionStorage.getItem(RETURN_TO_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        const path = typeof parsed.path === 'string' && parsed.path.startsWith('/') ? parsed.path : null;
        let p = path;
        if (p && (p === '/register' || p.startsWith('/register?') || p.startsWith('/register#'))) p = '/';

        const scrollY = Number.isFinite(Number(parsed.scrollY)) ? Math.max(0, Number(parsed.scrollY)) : 0;
        return { path: p, scrollY };
    } catch {
        return null;
    }
};

const clearReturnTo = () => {
    try {
        sessionStorage.removeItem(RETURN_TO_KEY);
    } catch {
        // ignore
    }
};

const restoreScroll = (y) => {
    const target = Math.max(0, Number(y) || 0);
    let tries = 0;
    const tick = () => {
        tries += 1;
        try {
            window.scrollTo(0, target);
        } catch {
            // ignore
        }
        if (tries < 10) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
};

const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const makeAutoToken = () => Math.random().toString(36).slice(2);

const makeInitialForm = () => ({
    email: '',
    dob: '', // YYYY-MM-DD
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

// ============================================================================
// Component
// ============================================================================
export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, refresh } = useAuth();
    const chromeTop = useChromeTop();

    // Random suffix used to discourage browser autofill heuristics
    const [autoToken, setAutoToken] = useState(() => makeAutoToken());

    // Allow navigation away even if a request is in-flight
    const abortRef = useRef(null);

    const [form, setForm] = useState(() => makeInitialForm());
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState(() => makeInitialErrors());

    // ── Handle availability state (mirrors CreateGroupModal pattern) ──────
    const [handleChecking, setHandleChecking] = useState(false);
    const [handleAvailable, setHandleAvailable] = useState(null);
    const handleCheckTimerRef = useRef(null);

    // ── Email verification state ──────────────────────────────────────────
    const [verifyStep, setVerifyStep] = useState(false);       // true = show code input
    const [verifyEmail, setVerifyEmail] = useState('');         // email we're verifying
    const [verifyCode, setVerifyCode] = useState('');           // code the user types
    const [verifyError, setVerifyError] = useState('');
    const [verifySubmitting, setVerifySubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);   // seconds remaining
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const resetFormState = () => {
        // Kill any in-flight request so we never get "stuck" after an error.
        try {
            if (abortRef.current) abortRef.current.abort();
        } catch {
            // ignore
        }
        abortRef.current = null;

        // Clear handle check timer
        if (handleCheckTimerRef.current) {
            clearTimeout(handleCheckTimerRef.current);
            handleCheckTimerRef.current = null;
        }

        setSubmitting(false);
        setErrors(makeInitialErrors());
        setForm(makeInitialForm());
        setHandleChecking(false);
        setHandleAvailable(null);

        // Reset verification state
        setVerifyStep(false);
        setVerifyEmail('');
        setVerifyCode('');
        setVerifyError('');
        setVerifySubmitting(false);
        setResendCooldown(0);
        setAgreeToTerms(false);

        // Fresh IDs/names each time the user views this page to reduce cached/autofill behavior.
        setAutoToken(makeAutoToken());

        // Also clear any focus (some browsers keep autofill overlays alive until blur)
        try {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        // Abort in-flight request on unmount/navigation so the page never gets stuck
        return () => {
            try {
                if (abortRef.current) abortRef.current.abort();
            } catch {
                // ignore
            }
            if (handleCheckTimerRef.current) {
                clearTimeout(handleCheckTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Any time the user VIEWs the register page (including coming back), start with a clean slate.
        if (location.pathname === '/register') {
            resetFormState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key, location.pathname]);

    // Date bounds for DOB
    const today = new Date();
    const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDobDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const MAX_DOB = toISODate(maxDobDate); // must be <= this (18+)
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

    // ── Handle availability check (debounced, mirrors CreateGroupModal) ───

    const checkHandleAvailability = (value) => {
        if (handleCheckTimerRef.current) {
            clearTimeout(handleCheckTimerRef.current);
        }

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

                // Only update if the handle hasn't changed since we started the check
                setForm((current) => {
                    if (current.handle === value) {
                        setHandleAvailable(Boolean(data.available));
                        if (!data.available && data.message) {
                            setErrors((prev) => ({ ...prev, handle: data.message }));
                        } else if (data.available) {
                            setErrors((prev) => ({ ...prev, handle: '' }));
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
        const cleaned = rawValue
            .toLowerCase()
            .replace(handleCleanRegex, '')
            .slice(0, HANDLE_MAX);

        setForm((s) => ({ ...s, handle: cleaned }));
        setHandleAvailable(null);

        if (cleaned && cleaned.length < HANDLE_MIN) {
            setErrors((prev) => ({ ...prev, handle: `Must be at least ${HANDLE_MIN} characters.` }));
            setHandleChecking(false);
            if (handleCheckTimerRef.current) {
                clearTimeout(handleCheckTimerRef.current);
            }
        } else if (cleaned && !handleValidRegex.test(cleaned)) {
            setErrors((prev) => ({ ...prev, handle: 'Lowercase letters, numbers, and underscores only.' }));
            setHandleChecking(false);
        } else {
            // Reserved username check (route conflicts + personally reserved)
            const reservedResult = checkReservedUsername(cleaned);
            if (reservedResult.reserved) {
                setErrors((prev) => ({ ...prev, handle: reservedResult.message }));
                setHandleAvailable(false);
                setHandleChecking(false);
                if (handleCheckTimerRef.current) {
                    clearTimeout(handleCheckTimerRef.current);
                }
                return;
            }
            // Client-side profanity check
            if (cleaned) {
                const profResult = checkFieldsProfanity({ username: cleaned });
                if (!profResult.clean) {
                    setErrors((prev) => ({ ...prev, handle: 'Username contains inappropriate language. Please revise.' }));
                    setHandleAvailable(false);
                    setHandleChecking(false);
                    if (handleCheckTimerRef.current) {
                        clearTimeout(handleCheckTimerRef.current);
                    }
                    return;
                }
            }
            setErrors((prev) => ({ ...prev, handle: '' }));
            checkHandleAvailability(cleaned);
        }
    };

    // ── Handle helper text + color (mirrors CreateGroupModal pattern) ─────

    const getHandleHelperProps = () => {
        if (handleChecking) {
            return { text: 'Checking availability...', color: 'text.secondary' };
        }
        if (errors.handle) {
            return { text: errors.handle, color: 'error.main' };
        }
        if (handleAvailable === true && form.handle.length >= HANDLE_MIN) {
            return { text: 'Username is available!', color: 'success.main' };
        }
        if (handleAvailable === false) {
            return { text: 'Username is taken.', color: 'error.main' };
        }
        return { text: 'Lowercase letters, numbers, and underscores only.', color: 'text.secondary' };
    };

    const handleHelper = getHandleHelperProps();

    const update = (k) => (eOrValue) => {
        // Accept either a synthetic event (e.target.value) OR a raw string value.
        // This lets DateOfBirthPicker pass an ISO date directly without building
        // a fake event object.
        const readValue = (arg) => {
            if (arg == null) return '';
            if (typeof arg === 'string') return arg;
            if (typeof arg === 'object' && arg.target) return arg.target.value;
            return '';
        };

        // Handle field is managed by handleHandleChange
        if (k === 'handle') {
            handleHandleChange(readValue(eOrValue) || '');
            return;
        }

        // Country/state logic:
        // - State only applies to United States
        // - City/County only apply to United States → Alabama
        if (k === 'country') {
            const val = readValue(eOrValue);
            setForm((s) => ({
                ...s,
                country: val,
                state: val === 'US' ? s.state : '',
                city: '',
                county: '',
            }));
            if (val) setErrors((er) => ({ ...er, country: '' }));
            setErrors((er) => ({ ...er, state: '', city: '', county: '' }));
            return;
        }

        if (k === 'state') {
            const val = readValue(eOrValue);
            setForm((s) => ({
                ...s,
                state: val,
                city: val === 'AL' ? s.city : '',
                county: val === 'AL' ? s.county : '',
            }));
            if (val) setErrors((er) => ({ ...er, state: '' }));
            setErrors((er) => ({ ...er, city: '', county: '' }));
            return;
        }

        const val = readValue(eOrValue);
        setForm((s) => ({ ...s, [k]: val }));
        if (k === 'city' && val) setErrors((er) => ({ ...er, city: '' }));
        if (k === 'county' && val) setErrors((er) => ({ ...er, county: '' }));
        if (k === 'dob' && val) setErrors((er) => ({ ...er, dob: '' }));
        if (k === 'password') setErrors((er) => ({ ...er, password: '' }));
    };

    const getAge = (dobString) => {
        const dob = new Date(`${dobString}T00:00:00`);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        return age;
    };

    const submit = async (e) => {
        e.preventDefault();
        setErrors(makeInitialErrors());

        const first = form.first_name.trim();
        const last = form.last_name.trim();
        const email = form.email.trim();

        // Basic validation
        if (!first || !last) {
            setErrors((s) => ({ ...s, general: 'Please enter your first and last name.' }));
            return;
        }
        if (first.length > 50 || last.length > 50) {
            setErrors((s) => ({ ...s, general: 'Names must be 50 characters or fewer.' }));
            return;
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setErrors((s) => ({ ...s, general: 'Please enter a valid email.' }));
            return;
        }
        if (email.length > 254) {
            setErrors((s) => ({ ...s, general: 'Email is too long (max 254 characters).' }));
            return;
        }

        // DOB validation (required & 18+)
        if (!form.dob) {
            setErrors((s) => ({ ...s, dob: 'Date of birth is required.' }));
            return;
        }
        const dobDate = new Date(`${form.dob}T00:00:00`);
        if (Number.isNaN(dobDate.getTime())) {
            setErrors((s) => ({ ...s, dob: 'Please enter a valid date of birth.' }));
            return;
        }
        if (dobDate > today) {
            setErrors((s) => ({ ...s, dob: 'Date of birth cannot be in the future.' }));
            return;
        }
        if (getAge(form.dob) < 18) {
            setErrors((s) => ({ ...s, dob: 'You must be at least 18 years old to sign up.' }));
            return;
        }

        // Location
        if (!form.country) {
            setErrors((s) => ({ ...s, country: 'Country is required.' }));
            return;
        }

        if (form.country === 'US' && !form.state) {
            setErrors((s) => ({ ...s, state: 'State is required.' }));
            return;
        }

        if (form.country === 'US' && form.state === 'AL') {
            if (!form.county) {
                setErrors((s) => ({ ...s, county: 'County is required.' }));
                return;
            }
            if (!form.city) {
                setErrors((s) => ({ ...s, city: 'City is required.' }));
                return;
            }
        }

        // Handle validation — must pass regex AND availability check
        if (!form.handle || !handleValidRegex.test(form.handle)) {
            setErrors((s) => ({
                ...s,
                handle: 'Username must be 3–30 chars: lowercase letters, numbers, underscores.',
            }));
            return;
        }

        // Reserved username check (safety net at submit)
        const reservedCheck = checkReservedUsername(form.handle);
        if (reservedCheck.reserved) {
            setErrors((s) => ({ ...s, handle: reservedCheck.message }));
            setHandleAvailable(false);
            return;
        }

        // Profanity check on username (safety net at submit)
        const profCheck = checkFieldsProfanity({ username: form.handle });
        if (!profCheck.clean) {
            setErrors((s) => ({ ...s, handle: 'Username contains inappropriate language. Please revise.' }));
            setHandleAvailable(false);
            return;
        }

        if (handleChecking) {
            setErrors((s) => ({
                ...s,
                handle: 'Please wait — checking username availability.',
            }));
            return;
        }

        if (handleAvailable === false) {
            setErrors((s) => ({
                ...s,
                handle: 'That username is taken. Please choose a different one.',
            }));
            return;
        }

        if (handleAvailable !== true) {
            setErrors((s) => ({
                ...s,
                handle: 'Please wait for username availability to be confirmed.',
            }));
            return;
        }

        // Password strength
        if (!passwordRegex.test(form.password)) {
            setErrors((s) => ({
                ...s,
                password: 'Password must be 8–128 characters.',
            }));
            return;
        }

        if (!agreeToTerms) {
            setErrors((s) => ({
                ...s,
                general: 'You must agree to the Terms and Conditions, Privacy Policy, and Community Guidelines.',
            }));
            return;
        }

        try {
            setSubmitting(true);

            // Abort any previous in-flight request (safety)
            try {
                if (abortRef.current) abortRef.current.abort();
            } catch {
                // ignore
            }
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
                    country: form.country,
                    state: form.country === 'US' ? form.state : null,
                    home_county: form.country === 'US' && form.state === 'AL' ? form.county : null,
                    home_city: form.country === 'US' && form.state === 'AL' ? form.city : null,
                    handle: form.handle.trim(),
                    password: form.password,
                    dob: form.dob,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors((s) => ({
                    ...s,
                    general: data?.message || 'Registration failed. Please try again.',
                }));

                // Ensure we never get "stuck" after an error and navigation stays responsive.
                try {
                    if (abortRef.current) abortRef.current.abort();
                } catch {
                    // ignore
                }
                abortRef.current = null;
                setSubmitting(false);

                return;
            }

            // Registration succeeded — email verification is disabled,
            // so the backend already issued a JWT + cookie. Refresh auth and
            // send them straight to /onboarding (same destination as the old
            // post-verify success path).
            //
            // On native, the backend also returns the JWT in the response body
            // (because the cookie can't survive cross-origin). Capture it here
            // before refresh() runs, otherwise refresh has no token to send.
            try {
                const data = await res.json().catch(() => ({}));
                if (data?.token) setMobileToken(data.token);
            } catch {
                // ignore — body parsing is best-effort for the token capture
            }

            try {
                if (typeof refresh === 'function') await refresh({ silent: true });
            } catch {
                // ignore
            }

            clearReturnTo();
            navigate('/onboarding', { replace: true, state: { playIntroVideo: true } });

        } catch (err) {
            // If the request was aborted due to navigation, do nothing.
            if (err?.name === 'AbortError') return;
            setErrors((s) => ({ ...s, general: 'Network error. Please try again.' }));
        } finally {
            abortRef.current = null;
            setSubmitting(false);
        }
    };

    // ── Resend cooldown timer ──────────────────────────────────────────────
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ── Submit verification code ──────────────────────────────────────────
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

            // Email verified — refresh auth and send them to /onboarding so
            // they can pick an account type. The backend sets needs_onboarding=1
            // at verify time, and OnboardingPage will skip the "Confirm details"
            // step because name + DOB were already collected above.
            //
            // Native: capture the JWT from the response body before refresh()
            // so the next request goes out with a valid Bearer token.
            try {
                const data = await res.json().catch(() => ({}));
                if (data?.token) setMobileToken(data.token);
            } catch {
                // ignore — best-effort token capture
            }

            try {
                if (typeof refresh === 'function') await refresh({ silent: true });
            } catch {
                // ignore
            }

            clearReturnTo();
            navigate('/onboarding', { replace: true, state: { playIntroVideo: true } });
        } catch {
            setVerifyError('Network error. Please try again.');
        } finally {
            setVerifySubmitting(false);
        }
    };

    // ── Resend verification code ──────────────────────────────────────────
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

    // If already logged in, show message + logout link; keep form disabled.
    const formDisabled = Boolean(user);

    return (
        <Box
            sx={(t) => ({
                minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: 'calc(100vh - 120px)' },
                bgcolor: { xs: t.palette.background.default, md: t.palette.background.paper },
                display: 'flex',
                alignItems: 'stretch',
                pt: { xs: `${chromeTop}px`, md: 3.5 },
                pb: { xs: 0, md: 3.5 },
            })}
        >
            <Container maxWidth="sm" sx={{ px: { xs: 0, md: 2 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Paper
                    elevation={0}
                    sx={(t) => {
                        const isDark = t.palette.mode === 'dark';
                        return {
                            width: '100%',
                            mx: 'auto',
                            overflow: 'hidden',
                            flex: 1,
                            borderRadius: { xs: 0, md: `${t.shape.borderRadius}px` },
                            border: { xs: 'none', md: '1px solid' },
                            borderColor: { xs: 'transparent', md: alpha(t.palette.text.primary, isDark ? 0.10 : 0.07) },
                            bgcolor: t.palette.background.paper,
                            mt: { xs: 0, md: 2 },
                            backdropFilter: { xs: 'none', md: 'saturate(140%) blur(10px)' },
                            backgroundImage: 'none',
                            boxShadow: { xs: 'none', md: t.custom?.shadows?.md || `0 16px 46px ${alpha(t.palette.common.black, 0.10)}` },
                        };
                    }}
                >
                    <Box sx={{ p: { xs: 2.25, sm: 3, md: 4 } }}>
                        {/* ── EMAIL VERIFICATION STEP ────────────────────────── */}
                        {verifyStep ? (
                            <Box>
                                <Box sx={{ mb: 3, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={(t) => ({ fontWeight: t.typography.h5.fontWeight, letterSpacing: t.typography.h5.letterSpacing, mb: 0.75 })}>
                                        Verify your email
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}
                                    >
                                        We sent a 6-digit verification code to <strong>{verifyEmail}</strong>. Enter it below to activate your account.
                                    </Typography>
                                </Box>

                                <Box
                                    component="form"
                                    onSubmit={submitVerifyCode}
                                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                                >
                                    {verifyError && (
                                        <Box
                                            sx={{
                                                bgcolor: (t) => alpha(t.palette.error.main, 0.08),
                                                borderRadius: 2,
                                                py: 1.25,
                                                px: 2,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <Typography sx={{ color: 'error.main', fontSize: 13, lineHeight: 1.5 }}>
                                                {verifyError}
                                            </Typography>
                                        </Box>
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
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={verifySubmitting || verifyCode.length !== 6}
                                        sx={(t) => {
                                            const m = t.custom?.motion || {};
                                            const sh = t.custom?.shadows || {};
                                            return {
                                                py: 1.35,
                                                fontWeight: 800,
                                                borderRadius: 999,
                                                backgroundColor: t.palette.secondary.main,
                                                color: t.palette.secondary.contrastText,
                                                boxShadow: sh.xs || t.shadows[2],
                                                transition: `background-color ${m.base || 160}ms ${m.ease || 'ease'}, box-shadow ${m.base || 160}ms ${m.ease || 'ease'}`,
                                                '&:hover': {
                                                    backgroundColor: t.palette.secondary.dark,
                                                    boxShadow: sh.sm || t.shadows[4],
                                                },
                                                '&.Mui-disabled': {
                                                    backgroundColor: alpha(t.palette.secondary.main, 0.35),
                                                    color: alpha('#fff', 0.5),
                                                    boxShadow: 'none',
                                                },
                                            };
                                        }}
                                    >
                                        {verifySubmitting ? 'Verifying…' : 'Verify & Continue'}
                                    </Button>

                                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                            Didn't receive the code?
                                        </Typography>
                                        <Button
                                            variant="text"
                                            onClick={resendVerifyCode}
                                            disabled={resendCooldown > 0}
                                            sx={{
                                                borderRadius: 999,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                            }}
                                        >
                                            {resendCooldown > 0
                                                ? `Resend code in ${resendCooldown}s`
                                                : 'Resend code'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            /* ── REGISTRATION FORM (existing) ──────────────────── */
                            <Box>
                                <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={(t) => ({ fontWeight: t.typography.h5.fontWeight, letterSpacing: t.typography.h5.letterSpacing, mb: 0.75 })}>
                                        Create your account
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.secondary',
                                            maxWidth: 520,
                                            mx: 'auto',
                                        }}
                                    >
                                        Join The Local Lantern and connect with your community!
                                    </Typography>
                                </Box>

                                <SocialLoginButtons label="Sign up" dividerText="or sign up with email" />

                                {user && (
                                    <Box
                                        role="note"
                                        sx={{
                                            border: '1px solid',
                                            borderColor: (t) => alpha(t.palette.info.main, 0.35),
                                            bgcolor: (t) => alpha(t.palette.info.main, 0.08),
                                            color: 'text.primary',
                                            p: 1.25,
                                            borderRadius: 2,
                                            mb: 2,
                                            fontSize: 14,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ mb: 0.75 }}>
                                            You're already signed in.
                                        </Typography>
                                        <Button size="small" onClick={logout} variant="outlined" sx={{ borderRadius: 999, fontWeight: 900 }}>
                                            Log out to create a different account
                                        </Button>
                                    </Box>
                                )}

                                {errors.general ? (
                                    <Box
                                        role="alert"
                                        sx={{
                                            border: '1px solid',
                                            borderColor: (t) => alpha(t.palette.error.main, 0.35),
                                            bgcolor: (t) => alpha(t.palette.error.main, 0.08),
                                            color: 'text.primary',
                                            p: 1.25,
                                            borderRadius: 2,
                                            mb: 2,
                                            fontSize: 14,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {errors.general}
                                    </Box>
                                ) : null}

                                <Box component="form" onSubmit={submit} noValidate autoComplete="off" data-form-type="other" data-lpignore="true" sx={formDisabled ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
                                    {/* Honeypots to absorb Chrome autofill */}
                                    <input
                                        type="text"
                                        name="username"
                                        autoComplete="username"
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            height: 0,
                                            width: 0,
                                            border: 0,
                                            padding: 0,
                                        }}
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        autoComplete="current-password"
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            height: 0,
                                            width: 0,
                                            border: 0,
                                            padding: 0,
                                        }}
                                    />

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gap: 2,
                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                            gridTemplateAreas: {
                                                xs: `
                                            "first"
                                            "last"
                                            "email"
                                            "dob"
                                            "location"
                                            "username"
                                            "password"
                                            "passwordStrength"
                                        `,
                                                md: `
                                            "first last"
                                            "email dob"
                                            "location location"
                                            "username username"
                                            "password password"
                                            "passwordStrength passwordStrength"
                                        `,
                                            },
                                        }}
                                    >
                                        <TextField
                                            sx={{ gridArea: 'first' }}
                                            label="First name"
                                            id={`first-name-${autoToken}`}
                                            name={`first-name-${autoToken}`}
                                            value={form.first_name}
                                            onChange={update('first_name')}
                                            onFocus={makeEditableOnFocus}
                                            onTouchStart={makeEditableOnTouchStart}
                                            fullWidth
                                            required
                                            autoComplete="new-password"
                                            inputProps={{ ...antiFillAttrs, maxLength: 50, style: { fontSize: 16 } }}
                                        />
                                        <TextField
                                            sx={{ gridArea: 'last' }}
                                            label="Last name"
                                            id={`last-name-${autoToken}`}
                                            name={`last-name-${autoToken}`}
                                            value={form.last_name}
                                            onChange={update('last_name')}
                                            onFocus={makeEditableOnFocus}
                                            onTouchStart={makeEditableOnTouchStart}
                                            fullWidth
                                            required
                                            autoComplete="new-password"
                                            inputProps={{ ...antiFillAttrs, maxLength: 50, style: { fontSize: 16 } }}
                                        />

                                        <TextField
                                            sx={{ gridArea: 'email' }}
                                            label="Email"
                                            id={`email-${autoToken}`}
                                            name={`email-${autoToken}`}
                                            type="email"
                                            value={form.email}
                                            onChange={update('email')}
                                            onFocus={makeEditableOnFocus}
                                            onTouchStart={makeEditableOnTouchStart}
                                            fullWidth
                                            required
                                            autoComplete="new-password"
                                            inputProps={{
                                                ...antiFillAttrs,
                                                maxLength: 254,

                                                inputMode: 'email',
                                                style: { fontSize: 16 },
                                            }}
                                        />

                                        <Box sx={{ gridArea: 'dob' }}>
                                            <DateOfBirthPicker
                                                value={form.dob}
                                                onChange={update('dob')}
                                                error={Boolean(errors.dob)}
                                                helperText={errors.dob || 'Must be 18 or older.'}
                                            />
                                        </Box>

                                        <Box sx={{ gridArea: 'location' }}>
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gap: 2,
                                                    gridTemplateColumns: {
                                                        xs: '1fr',
                                                        md: form.country === 'US' ? '1fr 1fr' : '1fr',
                                                    },
                                                }}
                                            >
                                                <Autocomplete
                                                    options={COUNTRIES}
                                                    getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                                                    value={COUNTRIES.find((c) => c.code === form.country) || null}
                                                    onChange={(_, val) => {
                                                        const code = val?.code || '';
                                                        setForm((s) => ({
                                                            ...s,
                                                            country: code,
                                                            state: code === 'US' ? s.state : '',
                                                            city: '',
                                                            county: '',
                                                        }));
                                                        if (code) setErrors((er) => ({ ...er, country: '' }));
                                                        setErrors((er) => ({ ...er, state: '', city: '', county: '' }));
                                                    }}
                                                    isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                                                    disableClearable
                                                    openOnFocus
                                                    autoHighlight
                                                    fullWidth
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Country"
                                                            required
                                                            error={Boolean(errors.country)}
                                                            helperText={errors.country || ''}
                                                            autoComplete="new-password"
                                                            inputProps={{
                                                                ...params.inputProps,
                                                                ...antiFillAttrs,
                                                                autoComplete: 'new-password',
                                                                'aria-label': 'Country',
                                                            }}
                                                        />
                                                    )}
                                                />

                                                {form.country === 'US' ? (
                                                    <Autocomplete
                                                        options={US_STATES}
                                                        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                                                        value={US_STATES.find((s) => s.code === form.state) || null}
                                                        onChange={(_, val) => {
                                                            const code = val?.code || '';
                                                            setForm((s) => ({
                                                                ...s,
                                                                state: code,
                                                                city: code === 'AL' ? s.city : '',
                                                                county: code === 'AL' ? s.county : '',
                                                            }));
                                                            if (code) setErrors((er) => ({ ...er, state: '' }));
                                                            setErrors((er) => ({ ...er, city: '', county: '' }));
                                                        }}
                                                        isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                                                        openOnFocus
                                                        autoHighlight
                                                        fullWidth
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="State"
                                                                required
                                                                error={Boolean(errors.state)}
                                                                helperText={errors.state || ''}
                                                                autoComplete="new-password"
                                                                inputProps={{
                                                                    ...params.inputProps,
                                                                    ...antiFillAttrs,
                                                                    autoComplete: 'new-password',
                                                                    'aria-label': 'State',
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                ) : null}
                                            </Box>

                                            {form.country === 'US' && form.state === 'AL' ? (
                                                <CityCountySelect
                                                    city={form.city}
                                                    setCity={(v) => {
                                                        setForm((s) => ({ ...s, city: v }));
                                                        if (v) setErrors((er) => ({ ...er, city: '' }));
                                                    }}
                                                    county={form.county}
                                                    setCounty={(v) => {
                                                        setForm((s) => ({ ...s, county: v }));
                                                        if (v) setErrors((er) => ({ ...er, county: '' }));
                                                    }}
                                                    cityError={errors.city}
                                                    countyError={errors.county}
                                                    cityRequired
                                                    countyRequired
                                                    includeAllOptions={false}
                                                    disableClearable
                                                    emptyCountyLabel="Select a county"
                                                    emptyCityLabel="Select a city"
                                                    sx={{ mt: 2 }}
                                                    countySx={{
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '1rem',
                                                            fontWeight: 400,
                                                            letterSpacing: 'normal',
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '1rem',
                                                            fontWeight: 400,
                                                        },
                                                        '& .MuiOutlinedInput-root': {
                                                            minHeight: 56,
                                                        },
                                                    }}
                                                    citySx={{
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '1rem',
                                                            fontWeight: 400,
                                                            letterSpacing: 'normal',
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '1rem',
                                                            fontWeight: 400,
                                                        },
                                                        '& .MuiOutlinedInput-root': {
                                                            minHeight: 56,
                                                        },
                                                    }}
                                                />
                                            ) : null}
                                        </Box>

                                        {/* ── Username field with live availability check ──────── */}
                                        <Box sx={{ gridArea: 'username' }}>
                                            <TextField
                                                label="Username"
                                                id={`username-${autoToken}`}
                                                name={`username-${autoToken}`}
                                                value={form.handle}
                                                onChange={update('handle')}
                                                onFocus={makeEditableOnFocus}
                                                onTouchStart={makeEditableOnTouchStart}
                                                fullWidth
                                                required
                                                autoComplete="new-password"
                                                error={Boolean(errors.handle) || handleAvailable === false}
                                                inputProps={{
                                                    ...antiFillAttrs,
                                                    maxLength: HANDLE_MAX,

                                                    'aria-label': 'Username',
                                                    style: { fontSize: 16 },
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">@</InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                                            {handleChecking && (
                                                                <CircularProgress size={18} />
                                                            )}
                                                            {!handleChecking && handleAvailable === true && form.handle.length >= HANDLE_MIN && (
                                                                <AvailableIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                                            )}
                                                            {!handleChecking && handleAvailable === false && (
                                                                <TakenIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                                            )}
                                                        </Box>
                                                    ),
                                                }}
                                            />
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{ mt: 0.5, mx: 0.5 }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 700, color: handleHelper.color }}
                                                >
                                                    {handleHelper.text}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {form.handle.length}/{HANDLE_MAX}
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <TextField
                                            sx={{ gridArea: 'password' }}
                                            label="Password"
                                            id={`password-${autoToken}`}
                                            name={`password-${autoToken}`}
                                            type="password"
                                            value={form.password}
                                            onChange={update('password')}
                                            onFocus={makeEditableOnFocus}
                                            onTouchStart={makeEditableOnTouchStart}
                                            fullWidth
                                            required
                                            autoComplete="new-password"
                                            error={Boolean(errors.password)}
                                            helperText={errors.password || 'At least 8 characters. Longer is stronger. try a passphrase!'}
                                            inputProps={{
                                                ...antiFillAttrs,
                                                maxLength: 128,

                                                'aria-label': 'Password',
                                                style: { fontSize: 16 },
                                            }}
                                        />

                                        <Box sx={{ gridArea: 'passwordStrength', mt: -1 }}>
                                            {(() => {
                                                const pwd = form.password || '';
                                                const len = pwd.length;

                                                let pct = 0;
                                                let label = 'Too short';

                                                const hasLower = /[a-z]/.test(pwd);
                                                const hasUpper = /[A-Z]/.test(pwd);
                                                const hasDigit = /\d/.test(pwd);
                                                const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

                                                const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

                                                if (len >= 8 && len < 12) {
                                                    pct = 30;
                                                    label = variety >= 3 ? 'Fair' : 'Weak';
                                                } else if (len >= 12 && len < 16) {
                                                    pct = 55;
                                                    label = variety >= 2 ? 'Good' : 'Fair';
                                                } else if (len >= 16 && len < 20) {
                                                    pct = 80;
                                                    label = variety >= 2 ? 'Strong' : 'Good';
                                                } else if (len >= 20) {
                                                    pct = 100;
                                                    label = 'Strong';
                                                }

                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                                            Password Strength:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', whiteSpace: 'nowrap' }}>
                                                            {label}
                                                        </Typography>
                                                        <Box
                                                            aria-hidden="true"
                                                            sx={{
                                                                flex: 1,
                                                                height: 8,
                                                                borderRadius: 999,
                                                                bgcolor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    height: '100%',
                                                                    width: `${pct}%`,
                                                                    bgcolor: (t) => t.palette.primary.main,
                                                                    borderRadius: 999,
                                                                    transition: (t) => `width ${t.custom?.motion?.base || 160}ms ${t.custom?.motion?.ease || 'ease'}`,
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                );
                                            })()}
                                        </Box>
                                    </Box>

                                    {/* Terms agreement */}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={agreeToTerms}
                                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                                sx={{ p: 0.5 }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.4 }}>
                                                I agree to the{' '}
                                                <Link component={RouterLink} to="/terms" target="_blank" sx={{ fontWeight: 700 }}>
                                                    Terms and Conditions
                                                </Link>
                                                ,{' '}
                                                <Link component={RouterLink} to="/privacy" target="_blank" sx={{ fontWeight: 700 }}>
                                                    Privacy Policy
                                                </Link>
                                                , and{' '}
                                                <Link component={RouterLink} to="/guidelines" target="_blank" sx={{ fontWeight: 700 }}>
                                                    Community Guidelines
                                                </Link>
                                            </Typography>
                                        }
                                        sx={{ alignItems: 'flex-start', mx: 0, mt: 1 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={submitting || formDisabled}
                                        sx={(t) => {
                                            const m = t.custom?.motion || {};
                                            const sh = t.custom?.shadows || {};
                                            return {
                                                mt: 3,
                                                py: 1.35,
                                                fontWeight: 800,
                                                borderRadius: 999,
                                                backgroundColor: t.palette.secondary.main,
                                                color: t.palette.secondary.contrastText,
                                                boxShadow: sh.xs || t.shadows[2],
                                                transition: `background-color ${m.base || 160}ms ${m.ease || 'ease'}, box-shadow ${m.base || 160}ms ${m.ease || 'ease'}`,
                                                '&:hover': {
                                                    backgroundColor: t.palette.secondary.dark,
                                                    boxShadow: sh.sm || t.shadows[4],
                                                },
                                                '&.Mui-disabled': {
                                                    backgroundColor: alpha(t.palette.secondary.main, 0.35),
                                                    color: alpha('#fff', 0.5),
                                                    boxShadow: 'none',
                                                },
                                            };
                                        }}
                                    >
                                        {submitting ? 'Creating account…' : 'Create Account'}
                                    </Button>

                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                        <Button
                                            variant="text"
                                            onClick={() => navigate('/login?redirect=%2F')}
                                            sx={{
                                                borderRadius: 999,
                                                fontWeight: 900,
                                                color: 'text.secondary',
                                                '&:hover': { color: 'primary.main' },
                                            }}
                                        >
                                            Already have an account? Sign in
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

// src/pages/account/AccountSettingsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import ShieldIcon from '@mui/icons-material/Shield';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
// Palette variants for visual artists. The settings page differentiates
// music artists from visual artists (sub-types of the `artist` account
// type) by picking the right icon per profile_type — MusicNote for
// musicians, Palette for visual artists — in every avatar fallback, tab
// icon, and section header.
import PaletteIcon from '@mui/icons-material/Palette';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '../../components/AuthModalContext';
import { useActiveAccount } from '../../components/AccountContext';
import { secureFetch } from '../../utils/secureFetch';
import useChromeTop from '../../hooks/useChromeTop';

/* ─── Constants (OUTSIDE component — stable across renders) ──────────────── */

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

const PASSWORD_REGEX = /^.{12,128}$/;

const DELETE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

const MESSAGE_PRIVACY_OPTIONS = [
    { value: 'everyone', label: 'Everyone', description: 'Anyone on the platform can send you a message.' },
    { value: 'followers', label: 'Followers', description: 'Only people who follow you can send you messages.' },
    { value: 'nobody', label: 'Nobody', description: 'No one can send you messages.' },
];

const BUSINESS_HOURS_VISIBILITY_OPTIONS = [
    { value: 'visible', label: 'Show on profile' },
    { value: 'hidden', label: 'Hide from profile' },
];

const OUTER_SX = {
    width: '100%',
    px: { xs: 0, sm: 3 },
    pt: { xs: 0, md: 1.5 },
    pb: { xs: 2, md: 8 },
};

const PROFILE_BASE_URL = API_BASE ? `${API_BASE}/users/profile` : '/users/profile';
const CHANGE_PASSWORD_URL = API_BASE ? `${API_BASE}/auth/change-password` : '/auth/change-password';
const SET_PASSWORD_URL = API_BASE ? `${API_BASE}/auth/set-password` : '/auth/set-password';
const CHANGE_EMAIL_URL = API_BASE ? `${API_BASE}/auth/change-email` : '/auth/change-email';
const ACCOUNT_SETTINGS_URL = API_BASE ? `${API_BASE}/users/account-settings` : '/users/account-settings';

/**
 * Tab layout definitions — OUTSIDE component so the arrays are referentially
 * stable and never recreated on render.
 *
 * Personal:  Account (0), Email & Security (1)
 * Business:  Account (0)
 * Artist:    Account (0)
 */
const PERSONAL_TABS = [
    { key: 'account', label: 'Account', icon: SettingsIcon },
    { key: 'email', label: 'Email & Security', icon: ShieldIcon },
];

const ONE_TAB_LAYOUT = [
    { key: 'account', label: 'Account', icon: SettingsIcon },
];

/* ─── Pure helpers (OUTSIDE component) ──────────────────────────────────── */

function safeStr(v) {
    return v == null ? '' : String(v);
}

/** Build profile URL from primitive inputs — deterministic, no IIFE needed. */
function buildProfileUrl(isBizOrArtist, accountId, accountType) {
    if (isBizOrArtist && accountId && accountId !== 'personal') {
        return `${PROFILE_BASE_URL}?account_id=${accountId}&account_type=${accountType}`;
    }
    return PROFILE_BASE_URL;
}

/** Resolve account ID to a stable primitive (number or 'personal'). */
function resolveAccountId(account, isBusiness, isArtist) {
    if (!account) return 'personal';
    const candidates = [
        account.id,
        isArtist && account.artist_id,
        isArtist && account.artistId,
        isArtist && account.profile_id,
        isArtist && account.profileId,
        isBusiness && account.business_id,
        isBusiness && account.businessId,
    ];
    for (const c of candidates) {
        const n = Number(c);
        if (n > 0 && Number.isFinite(n)) return n;
    }
    return 'personal';
}

/* ─── Sub-components (OUTSIDE main component) ───────────────────────────── */

function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return <Box sx={{ height: '100%' }}>{children}</Box>;
}

function SectionHeader({ icon, title, action }) {
    const Icon = icon;
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
        >
            <Icon fontSize="small" />
            <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
            {action && (
                <Box sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
                    {action}
                </Box>
            )}
        </Box>
    );
}

function DeleteAccountDialog({ open, onClose, onConfirm, deleting, accountType, profileType }) {
    // Sub-type for artist accounts: 'music' (default) or 'artist' (visual).
    // Used to pick the right noun in titles, helper text, and the delete
    // list so visual artists don't see "music, tracks, and albums" as
    // things they're about to lose.
    const isVisualArtist = accountType === 'artist' && String(profileType || '').toLowerCase() === 'artist';
    const [typed, setTyped] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);

    const isMatch = typed.trim() === DELETE_CONFIRMATION_PHRASE;
    const requiresPassword = accountType === 'personal' || (!accountType);

    const handleClose = () => {
        setTyped('');
        setPasswordConfirm('');
        setShowPw(false);
        onClose();
    };

    const handleConfirm = () => {
        if (!isMatch) return;
        if (requiresPassword && !passwordConfirm) return;
        onConfirm(requiresPassword ? passwordConfirm : null);
    };

    const accountLabel =
        accountType === 'business'
            ? 'business account'
            : accountType === 'artist'
                ? (isVisualArtist ? 'artist profile' : 'music profile')
                : 'account';

    return (
        <Dialog
            open={open}
            onClose={deleting ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 900,
                    color: 'error.main',
                    pr: 6,
                }}
            >
                <WarningAmberIcon />
                Delete {accountType === 'business' ? 'Business Account' : accountType === 'artist' ? (isVisualArtist ? 'Artist Profile' : 'Music Profile') : 'Account'}
            </DialogTitle>

            <IconButton
                onClick={handleClose}
                disabled={deleting}
                sx={{ position: 'absolute', top: 8, right: 8 }}
                aria-label="Close"
            >
                <CloseIcon />
            </IconButton>

            <DialogContent>
                <Stack spacing={2.5}>
                    <Alert severity="error" variant="filled" sx={{ borderRadius: 2, fontWeight: 700 }}>
                        This action is permanent and cannot be undone.
                    </Alert>

                    <Typography sx={{ fontWeight: 600, lineHeight: 1.6 }}>
                        Deleting your {accountLabel} will permanently remove:
                    </Typography>

                    <Box
                        component="ul"
                        sx={{
                            m: 0,
                            pl: 2.5,
                            '& li': { mb: 0.5, fontWeight: 500, color: 'text.secondary', fontSize: 14 },
                        }}
                    >
                        {accountType === 'business' ? (
                            <>
                                <li>Your business page and all business information</li>
                                <li>All business posts, photos, and content</li>
                                <li>All events created by this business</li>
                                <li>All job listings posted by this business</li>
                                <li>All service listings tied to this business</li>
                                <li>All reviews and ratings received</li>
                                <li>All team member roles and invitations</li>
                            </>
                        ) : accountType === 'artist' ? (
                            isVisualArtist ? (
                                <>
                                    <li>Your artist profile and all artist information</li>
                                    <li>Your entire portfolio, including all uploaded artwork</li>
                                    <li>All artist posts and content</li>
                                    <li>All events tied to your artist profile</li>
                                    <li>All followers of your artist page</li>
                                    <li>All reviews and ratings received</li>
                                </>
                            ) : (
                                <>
                                    <li>Your music profile and all artist information</li>
                                    <li>All music, tracks, and albums you have uploaded</li>
                                    <li>All artist posts and content</li>
                                    <li>All events tied to your music profile</li>
                                    <li>All followers of your music page</li>
                                    <li>All reviews and ratings received</li>
                                </>
                            )
                        ) : (
                            <>
                                <li>Your profile, avatar, and personal information</li>
                                <li>All community posts, comments, and photos</li>
                                <li>All events you have created</li>
                                <li>All marketplace listings</li>
                                <li>All messages and conversations</li>
                                <li>All groups you have created</li>
                                <li>All service listings</li>
                                <li>All follows, likes, and interactions</li>
                                <li>Any connected business or artist accounts</li>
                            </>
                        )}
                    </Box>

                    <Divider />

                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        Type <strong>{DELETE_CONFIRMATION_PHRASE}</strong> below to confirm:
                    </Typography>

                    <TextField
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={DELETE_CONFIRMATION_PHRASE}
                        fullWidth
                        autoComplete="off"
                        error={typed.length > 0 && !isMatch}
                        helperText={
                            typed.length > 0 && !isMatch
                                ? 'Does not match. Please type exactly as shown above.'
                                : ' '
                        }
                    />

                    {requiresPassword && (
                        <TextField
                            label="Confirm with your password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            type={showPw ? 'text' : 'password'}
                            fullWidth
                            autoComplete="current-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowPw((v) => !v)}
                                            aria-label={showPw ? 'Hide password' : 'Show password'}
                                        >
                                            {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={handleClose}
                    disabled={deleting}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleConfirm}
                    disabled={!isMatch || (requiresPassword && !passwordConfirm) || deleting}
                    startIcon={
                        deleting
                            ? <CircularProgress size={16} sx={{ color: 'common.white' }} />
                            : <DeleteForeverIcon />
                    }
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 900,
                        px: 3,
                    }}
                >
                    {deleting ? 'Deleting…' : 'Permanently Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AccountSettingsPage({ user: userProp }) {
    const navigate = useNavigate();

    const { user: authUser, status, openLogin, refresh } = useAuth();
    const accountContext = useActiveAccount();
    const chromeTop = useChromeTop();

    // ── Active account resolution ──────────────────────────────────────────
    const [localStorageAccount, setLocalStorageAccount] = useState(() => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const handleAccountChanged = (e) => {
            const nextAccount = e?.detail?.account || null;
            if (nextAccount && typeof nextAccount === 'object') {
                setLocalStorageAccount(nextAccount);
            } else {
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    setLocalStorageAccount(raw ? JSON.parse(raw) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        const handleStorage = (e) => {
            if (e.key === 'll:activeAccount') {
                try {
                    setLocalStorageAccount(e.newValue ? JSON.parse(e.newValue) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        window.addEventListener('ll:account:changed', handleAccountChanged);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ll:account:changed', handleAccountChanged);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const activeAccount = localStorageAccount || accountContext.activeAccount;
    const isBusinessAccount = activeAccount?.type === 'business';
    const isArtistAccount = activeAccount?.type === 'artist';
    // Sub-type detection. 'music' = musician (default), 'artist' = visual
    // artist. Read both snake_case and camelCase to accept whichever the
    // caller populated. Only meaningful when isArtistAccount is true.
    const artistProfileType = (() => {
        if (!isArtistAccount) return null;
        const raw = String(activeAccount?.profile_type || activeAccount?.profileType || '').toLowerCase();
        return raw === 'artist' ? 'artist' : 'music';
    })();
    const isVisualArtist = isArtistAccount && artistProfileType === 'artist';

    // Stable primitives — never objects — safe for dependency arrays
    const activeAccountId = resolveAccountId(activeAccount, isBusinessAccount, isArtistAccount);
    const activeAccountType = activeAccount?.type || 'personal';

    const effectiveUser = authUser || userProp || null;
    const effectiveUserId = effectiveUser?.id ?? null;

    // Stable string — pure function of primitives
    const isBizOrArtist = isBusinessAccount || isArtistAccount;
    const profileUrl = buildProfileUrl(isBizOrArtist, activeAccountId, activeAccountType);

    // ── Tab management ─────────────────────────────────────────────────────
    // FIX: Use a stable tab definition array instead of conditional JSX children
    // inside <Tabs>.  The old approach rendered {false} children which caused
    // MUI to assign duplicate internal keys.
    const hasTwoTabLayout = isBizOrArtist;
    const tabDefs = hasTwoTabLayout ? ONE_TAB_LAYOUT : PERSONAL_TABS;
    const maxTabIndex = tabDefs.length - 1;

    const [tab, setTab] = useState(0);

    // FIX: SINGLE consolidated tab effect replaces the previous two separate
    // effects that could chain-react (Effect A clamps → re-render → Effect B
    // sets notifications index → re-render → Effect A checks again → …).
    // Now both checks happen in one synchronous pass with a single setState.
    useEffect(() => {
        setTab((prev) => {
            // Clamp the current tab if the layout shrank
            if (prev > maxTabIndex) return 0;
            return prev;
        });
    }, [maxTabIndex]);

    // ── Form state ─────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [banner, setBanner] = useState({ open: false, severity: 'success', message: '' });

    const [pwShowCur, setPwShowCur] = useState(false);
    const [pwShowNew, setPwShowNew] = useState(false);
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

    const [emailForm, setEmailForm] = useState({ nextEmail: '', password: '' });
    const [emailShowPw, setEmailShowPw] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Clear banner on tab change (functional updater avoids unnecessary state updates)
    useEffect(() => {
        setBanner((b) => (b.open ? { ...b, open: false } : b));
    }, [tab]);

    // Auto-hide banners
    useEffect(() => {
        if (!banner.open) return undefined;
        const ms = banner.severity === 'error' ? 7000 : 3500;
        const id = window.setTimeout(() => {
            setBanner((b) => ({ ...b, open: false }));
        }, ms);
        return () => window.clearTimeout(id);
    }, [banner.open, banner.severity]);

    const currentEmail = safeStr(profile?.email || '');

    // ── Load profile ───────────────────────────────────────────────────────
    // All deps are primitives — no object identity issues.
    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            if (!effectiveUserId) {
                setLoading(false);
                setProfile(null);
                return;
            }

            setLoading(true);
            try {
                const r = await secureFetch(profileUrl, { credentials: 'include' });
                const data = await r.json().catch(() => ({}));
                if (cancelled) return;

                if (!r.ok) {
                    setBanner({
                        open: true,
                        severity: r.status === 401 || r.status === 403 ? 'info' : 'error',
                        message:
                            r.status === 401 || r.status === 403
                                ? 'Your session may have expired. Please log in again.'
                                : (data?.message || 'Failed to load your account settings.'),
                    });
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                const u = data?.user || data?.profile || data?.effectiveUser || data || null;

                if (u) {
                    try {
                        const pj = u.privacy_json
                            ? (typeof u.privacy_json === 'string' ? JSON.parse(u.privacy_json) : u.privacy_json)
                            : {};
                        u.message_privacy = pj?.message_privacy || 'everyone';
                        // Personal account service settings (allow_reviews / allow_messages for services)
                        const ss = pj?.service_settings || {};
                        u.service_allow_reviews = ss.allow_reviews != null ? Boolean(ss.allow_reviews) : true;
                        u.service_allow_messages = ss.allow_messages != null ? Boolean(ss.allow_messages) : true;
                        // Online status visibility
                        u.show_online_status = pj?.show_online_status != null ? Boolean(pj.show_online_status) : true;
                    } catch {
                        u.message_privacy = 'everyone';
                        u.service_allow_reviews = true;
                        u.service_allow_messages = true;
                        u.show_online_status = true;
                    }

                    if (isBusinessAccount) {
                        const bs = data?.settings || data?.businessSettings || u?.settings || u?.businessSettings || {};
                        const boolField = (v) => {
                            if (v == null) return true;
                            if (typeof v === 'boolean') return v;
                            return Number(v) !== 0;
                        };
                        u.allow_messages = boolField(bs.allow_messages ?? bs.allowMessages ?? u.allow_messages);
                        u.allow_reviews = boolField(bs.allow_reviews ?? bs.allowReviews ?? u.allow_reviews);
                        u.hours_visibility = safeStr((bs.hours_visibility ?? bs.hoursVisibility ?? u.hours_visibility) || 'visible');
                    }

                    if (isArtistAccount) {
                        let as2 = {};
                        const settingsFromResponse = data?.settings || u?.settings || {};
                        const rawSj = u.settings_json || u.settingsJson;
                        if (Object.keys(settingsFromResponse).length > 0) {
                            as2 = settingsFromResponse;
                        } else if (rawSj) {
                            try { as2 = typeof rawSj === 'string' ? JSON.parse(rawSj) : rawSj; } catch { as2 = {}; }
                        }
                        const val = as2.allow_messages ?? as2.allowMessages;
                        u.allow_messages = (val === false || val === 0 || val === '0' || val === 'false') ? false : true;
                        const rvVal = as2.allow_reviews ?? as2.allowReviews;
                        u.allow_reviews = (rvVal === false || rvVal === 0 || rvVal === '0' || rvVal === 'false') ? false : true;
                    }
                }

                setProfile(u);
            } catch {
                if (!cancelled) {
                    setBanner({ open: true, severity: 'error', message: 'Failed to load your account settings.' });
                    setProfile(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProfile();

        return () => { cancelled = true; };
    }, [effectiveUserId, profileUrl, activeAccountId, isBusinessAccount, isArtistAccount]);

    // ── Field helpers ──────────────────────────────────────────────────────

    const setField = (key, value) => {
        setProfile((p) => ({ ...(p || {}), [key]: value }));
    };

    const handleTabChange = (_e, v) => setTab(v);

    // ── Save settings ──────────────────────────────────────────────────────

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const payload = {};

            if (isBusinessAccount) {
                payload.account_id = Number(activeAccountId) || 0;
                payload.account_type = 'business';
                payload.hours_visibility = safeStr(profile.hours_visibility || 'visible');
                payload.allow_reviews = profile.allow_reviews !== false ? 1 : 0;
                payload.allow_messages = profile.allow_messages !== false ? 1 : 0;
            } else if (isArtistAccount) {
                payload.account_id = Number(activeAccountId) || 0;
                payload.account_type = 'artist';
                payload.allow_messages = profile.allow_messages === false ? false : true;
                payload.allow_reviews = profile.allow_reviews === false ? false : true;
            } else {
                payload.is_private = profile.is_private ? 1 : 0;
                payload.message_privacy = safeStr(profile.message_privacy || 'everyone');
                payload.service_allow_reviews = profile.service_allow_reviews === false ? false : true;
                payload.service_allow_messages = profile.service_allow_messages === false ? false : true;
                payload.show_online_status = profile.show_online_status !== false;
            }

            const r = await secureFetch(ACCOUNT_SETTINGS_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                setBanner({ open: true, severity: 'error', message: data?.message || 'Could not save changes.' });
                setSaving(false);
                return;
            }

            const settings = data?.settings;
            if (settings && typeof settings === 'object') {
                setProfile((prev) => ({ ...(prev || {}), ...settings }));
            }

            if (typeof refresh === 'function') await refresh({ silent: true });
            setBanner({ open: true, severity: 'success', message: 'Changes saved.' });
        } catch {
            setBanner({ open: true, severity: 'error', message: 'Could not save changes.' });
        } finally {
            setSaving(false);
        }
    };

    // ── Derived: does this user have a password / OAuth provider? ─────────
    // The backend returns has_password (false if needs_password=true or password_hash is null)
    // and auth_provider ('google', 'facebook', or null).
    const authProvider = profile?.auth_provider || null;
    const isSocialOnly = Boolean(authProvider && profile?.has_password === false);

    // ── Change password ────────────────────────────────────────────────────

    const handleChangePassword = async () => {
        if (!isSocialOnly && !pw.current) {
            setBanner({ open: true, severity: 'error', message: 'Enter your current password.' });
            return;
        }
        if (!pw.next) {
            setBanner({ open: true, severity: 'error', message: 'Enter a new password.' });
            return;
        }
        if (pw.next !== pw.confirm) {
            setBanner({ open: true, severity: 'error', message: 'New passwords do not match.' });
            return;
        }
        if (!PASSWORD_REGEX.test(pw.next)) {
            setBanner({ open: true, severity: 'error', message: 'Password must be 12–128 characters.' });
            return;
        }

        setSaving(true);
        try {
            const url = isSocialOnly ? SET_PASSWORD_URL : CHANGE_PASSWORD_URL;
            const body = isSocialOnly
                ? { new_password: pw.next }
                : { current_password: pw.current, new_password: pw.next };

            const r = await secureFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                const msg =
                    (Array.isArray(data?.errors) ? data.errors.map((e) => e.msg).join(' • ') : null) ||
                    data?.message ||
                    'Could not save password.';
                setBanner({ open: true, severity: 'error', message: msg });
                setSaving(false);
                return;
            }

            setPw({ current: '', next: '', confirm: '' });
            // Update local profile to reflect they now have a password
            setProfile((p) => ({ ...(p || {}), has_password: true }));
            setBanner({ open: true, severity: 'success', message: isSocialOnly ? 'Password created! You can now sign in with email and password.' : (data?.message || 'Password updated.') });
        } catch {
            setBanner({ open: true, severity: 'error', message: 'Could not save password.' });
        } finally {
            setSaving(false);
        }
    };

    // ── Change email ───────────────────────────────────────────────────────

    const handleChangeEmail = async () => {
        const nextEmail = safeStr(emailForm.nextEmail).trim();
        if (!nextEmail || !nextEmail.includes('@')) {
            setBanner({ open: true, severity: 'error', message: 'Enter a valid email address.' });
            return;
        }
        if (!isSocialOnly && !emailForm.password) {
            setBanner({ open: true, severity: 'error', message: 'Enter your password to confirm.' });
            return;
        }

        setSaving(true);
        try {
            const r = await secureFetch(CHANGE_EMAIL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    new_email: nextEmail,
                    ...(isSocialOnly ? {} : { current_password: emailForm.password }),
                }),
            });
            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                const msg =
                    (Array.isArray(data?.errors) ? data.errors.map((e) => e.msg).join(' • ') : null) ||
                    data?.message ||
                    'Could not change email.';
                setBanner({ open: true, severity: 'error', message: msg });
                setSaving(false);
                return;
            }

            setEmailForm({ nextEmail: '', password: '' });
            setBanner({ open: true, severity: 'success', message: data?.message || 'Email updated.' });

            if (typeof refresh === 'function') await refresh({ silent: true });

            try {
                const pr = await secureFetch(profileUrl, { credentials: 'include' });
                const pd = await pr.json().catch(() => ({}));
                if (pr.ok) {
                    const u = pd?.user || pd?.profile || pd?.effectiveUser || pd || null;
                    if (u) setProfile(u);
                }
            } catch {
                // ignore
            }
        } catch {
            setBanner({ open: true, severity: 'error', message: 'Could not change email.' });
        } finally {
            setSaving(false);
        }
    };

    // ── Delete account ─────────────────────────────────────────────────────

    const handleDeleteAccount = async (password) => {
        setDeleting(true);
        try {
            const ACCT_API = API_BASE ? `${API_BASE}/api/account` : '/api/account';
            let url;
            let method = 'DELETE';
            let body = null;

            if (activeAccountType === 'artist' && activeAccountId && activeAccountId !== 'personal') {
                // Delete artist account via cascade endpoint
                url = `${ACCT_API}/delete-artist/${activeAccountId}`;
            } else if (activeAccountType === 'business' && activeAccountId && activeAccountId !== 'personal') {
                // Delete business account via cascade endpoint
                url = `${ACCT_API}/delete-business/${activeAccountId}`;
            } else {
                // Delete personal account (cascades everything)
                url = `${ACCT_API}/delete`;
                if (password) {
                    body = JSON.stringify({ current_password: password });
                }
            }

            const fetchOpts = {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) fetchOpts.body = body;

            const r = await secureFetch(url, fetchOpts);
            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                setBanner({
                    open: true,
                    severity: 'error',
                    message: data?.message || 'Could not delete account. Please try again.',
                });
                setDeleting(false);
                return;
            }

            setDeleteDialogOpen(false);

            if (activeAccountType === 'personal') {
                // ── Personal account deleted → full sign-out ──
                try { localStorage.removeItem('ll:activeAccount'); } catch { /* ignore */ }
                try { localStorage.removeItem('ll:me:cache'); } catch { /* ignore */ }

                // Call logout endpoint to clear server session/cookies
                try {
                    const logoutUrl = API_BASE ? `${API_BASE}/auth/logout` : '/auth/logout';
                    await secureFetch(logoutUrl, { method: 'POST', credentials: 'include' });
                } catch { /* ignore */ }

                // Hard navigate + reload to clear all in-memory state
                window.location.assign('/');
            } else {
                // ── Business or artist deleted → swap to personal account ──
                try {
                    localStorage.setItem('ll:activeAccount', JSON.stringify({
                        id: 'personal',
                        type: 'personal',
                    }));
                } catch { /* ignore */ }

                // Notify header to refresh account lists
                try {
                    window.dispatchEvent(new CustomEvent('ll:account:changed', { detail: { account: { id: 'personal', type: 'personal' } } }));
                } catch { /* ignore */ }

                // Tell header to re-fetch business/artist account lists
                try {
                    window.dispatchEvent(new CustomEvent('ll:business:accounts-updated'));
                    window.dispatchEvent(new CustomEvent('ll:artist:accounts-updated'));
                } catch { /* ignore */ }

                // Navigate home and reload so everything reflects the personal account
                window.location.assign('/');
            }
        } catch {
            setBanner({ open: true, severity: 'error', message: 'Could not delete account. Please try again.' });
            setDeleting(false);
        }
    };

    // ── Loading / auth early returns (all hooks declared above) ────────────

    if (!effectiveUser && status === 'loading') {
        return (
            <Box sx={{ ...OUTER_SX, pt: { xs: `${chromeTop}px`, md: 1.5 } }}>
                <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ fontWeight: 800 }}>Loading…</Typography>
                    </Paper>
                </Box>
            </Box>
        );
    }

    if (!effectiveUser) {
        return (
            <Box sx={{ ...OUTER_SX, pt: { xs: `${chromeTop}px`, md: 1.5 } }}>
                <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                        <Alert
                            severity="info"
                            sx={{ borderRadius: 2 }}
                            action={
                                <Button
                                    onClick={openLogin}
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Log in
                                </Button>
                            }
                        >
                            Please log in to view your account settings.
                        </Alert>
                    </Paper>
                </Box>
            </Box>
        );
    }

    if (loading || !profile) {
        return (
            <Box sx={{ ...OUTER_SX, pt: { xs: `${chromeTop}px`, md: 1.5 }, pb: { xs: 8, sm: 10 } }}>
                <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ fontWeight: 800 }}>Loading account settings…</Typography>
                    </Paper>
                </Box>
            </Box>
        );
    }

    // ── Display helpers (computed after early returns — safe, all hooks above) ──

    const accountDisplayName = isBusinessAccount
        ? (activeAccount?.name || 'Business Account')
        : isArtistAccount
            ? (activeAccount?.name || profile?.artist_name || (isVisualArtist ? 'Artist Account' : 'Music Account'))
            : (effectiveUser?.first_name && effectiveUser?.last_name
                ? `${effectiveUser.first_name} ${effectiveUser.last_name}`.trim()
                : effectiveUser?.first_name || effectiveUser?.username || 'Personal Account');

    const accountAvatarSrc = isBusinessAccount
        ? (activeAccount?.avatar_url || activeAccount?.logo_url || null)
        : isArtistAccount
            ? (activeAccount?.avatar_url || null)
            : (effectiveUser?.avatar_url || effectiveUser?.profile_picture || null);

    // Match UserCardPopover / Header: filter out default placeholder URLs
    const hasValidAvatar = (() => {
        if (!accountAvatarSrc) return false;
        if (accountAvatarSrc.includes('default_avatar') || accountAvatarSrc.includes('default_business') || accountAvatarSrc.includes('default_logo')) return false;
        return true;
    })();

    const accountTypeLabel = isBusinessAccount
        ? 'Business Account'
        : isArtistAccount
            ? (isVisualArtist ? 'Artist Account' : 'Music Account')
            : 'Personal Account';

    const AccountTypeIcon = isBusinessAccount
        ? StorefrontIcon
        : isArtistAccount
            ? (isVisualArtist ? PaletteIcon : MusicNoteIcon)
            : PersonIcon;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <Box sx={{ ...OUTER_SX, pt: { xs: `${chromeTop}px`, md: 1.5 }, position: 'relative', zIndex: 0 }}>
            <Box sx={{ maxWidth: 1100, mx: 'auto', height: { xs: 'auto', md: '100%' } }}>
                <Paper
                    sx={(t) => ({
                        borderRadius: { xs: 0, sm: 4 },
                        border: { xs: 'none', sm: '1px solid' },
                        borderColor: { xs: 'transparent', sm: 'divider' },
                        overflow: 'hidden',
                        boxShadow: { xs: 'none', sm: t.custom.shadows.md },
                        bgcolor: 'background.paper',
                        position: 'relative',
                        zIndex: 0,
                        height: { xs: 'auto', md: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                    })}
                >
                    {/* Banner */}
                    <Collapse in={banner.open} timeout={180} unmountOnExit>
                        <Alert
                            severity={banner.severity}
                            sx={{ borderRadius: 0, alignItems: 'center', width: '100%' }}
                            action={
                                <IconButton
                                    size="small"
                                    onClick={() => setBanner((b) => ({ ...b, open: false }))}
                                    aria-label="Close"
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            }
                        >
                            {banner.message}
                        </Alert>
                    </Collapse>

                    {/* Header */}
                    <Box
                        sx={{
                            px: { xs: 2, sm: 3 },
                            pt: { xs: 2, sm: 2.5 },
                            pb: { xs: 1.5, sm: 2 },
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                            bgcolor: 'background.paper',
                            position: 'relative',
                            zIndex: 0,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                            <Avatar
                                src={hasValidAvatar ? accountAvatarSrc : undefined}
                                alt={accountDisplayName}
                                sx={(t) => ({
                                    width: 56,
                                    height: 56,
                                    border: '2px solid',
                                    borderColor: isBusinessAccount
                                        ? 'primary.main'
                                        : isArtistAccount
                                            ? 'secondary.main'
                                            : 'divider',
                                    boxShadow: t.custom.shadows.sm,
                                    ...(!hasValidAvatar && {
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                    }),
                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                })}
                                imgProps={{ referrerPolicy: 'no-referrer' }}
                            >
                                {isBusinessAccount ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                                    : isArtistAccount ? (isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 26 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />)
                                        : <PersonRoundedIcon sx={{ fontSize: 28 }} />}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontSize: { xs: 20, sm: 24 },
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.2,
                                    }}
                                    noWrap
                                >
                                    {accountDisplayName}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1,
                                        py: 0.25,
                                        mt: 0.5,
                                        borderRadius: 999,
                                        bgcolor: isBusinessAccount
                                            ? 'primary.50'
                                            : isArtistAccount
                                                ? 'secondary.50'
                                                : 'grey.100',
                                        color: isBusinessAccount
                                            ? 'primary.main'
                                            : isArtistAccount
                                                ? 'secondary.main'
                                                : 'text.secondary',
                                        fontWeight: 700,
                                        fontSize: 12,
                                    }}
                                >
                                    <AccountTypeIcon sx={{ fontSize: 14 }} />
                                    {accountTypeLabel}
                                </Box>
                            </Box>
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            <SettingsIcon sx={{ fontSize: 16 }} />
                            Account Settings
                        </Typography>
                    </Box>

                    {/* Tabs — rendered from stable array, no conditional {false} children */}
                    <Box sx={{ px: { xs: 1.25, sm: 2 }, pb: 1.25, bgcolor: 'background.paper' }}>
                        <Tabs
                            value={tab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 46,
                                '& .MuiTab-root': {
                                    minHeight: 46,
                                    textTransform: 'none',
                                    fontWeight: 900,
                                    borderRadius: 999,
                                    mx: 0.25,
                                },
                                '& .MuiTabs-indicator': { display: 'none' },
                                '& .MuiTab-root.Mui-selected': { backgroundColor: 'action.hover' },
                            }}
                        >
                            {tabDefs.map((td) => {
                                const TabIcon = td.icon;
                                return (
                                    <Tab
                                        key={td.key}
                                        icon={<TabIcon fontSize="small" />}
                                        iconPosition="start"
                                        label={td.label}
                                    />
                                );
                            })}
                        </Tabs>
                    </Box>

                    <Divider />

                    {/* Content */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'visible',
                            px: { xs: 2, sm: 3 },
                            py: { xs: 2, sm: 2.5 },
                            bgcolor: 'background.paper',
                            position: 'relative',
                            zIndex: 0,
                        }}
                    >
                        {/* ═══ ACCOUNT TAB (always index 0) ═══ */}
                        <TabPanel value={tab} index={0}>
                            <Stack spacing={2}>
                                <SectionHeader
                                    icon={isBusinessAccount ? StorefrontIcon : isArtistAccount ? (isVisualArtist ? PaletteIcon : MusicNoteIcon) : PersonIcon}
                                    title={isBusinessAccount ? 'Business Settings' : isArtistAccount ? (isVisualArtist ? 'Artist Settings' : 'Music Settings') : 'Account Settings'}
                                    action={
                                        <Button
                                            variant="contained"
                                            startIcon={
                                                saving ? <CircularProgress size={16} sx={{ color: 'common.white' }} /> : <SaveIcon />
                                            }
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 900,
                                                width: { xs: '100%', sm: 'auto' },
                                                boxShadow: t.custom.shadows.sm,
                                                transition: t.custom.motion.allSlow,
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: t.custom.shadows.md,
                                                },
                                            })}
                                        >
                                            Save Changes
                                        </Button>
                                    }
                                />

                                <Divider />

                                {/* ── BUSINESS ACCOUNT SETTINGS ── */}
                                {isBusinessAccount && (
                                    <>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                                            To edit your business name, description, website, phone, or location, visit your business profile page.
                                        </Typography>

                                        <Divider />

                                        <SectionHeader icon={AccessTimeIcon} title="Business Hours" />

                                        <FormControl size="small" sx={{ maxWidth: { xs: '100%', sm: 320 } }}>
                                            <InputLabel id="hours-visibility-label">Hours visibility</InputLabel>
                                            <Select
                                                labelId="hours-visibility-label"
                                                value={safeStr(profile.hours_visibility || 'visible')}
                                                label="Hours visibility"
                                                onChange={(e) => setField('hours_visibility', e.target.value)}
                                            >
                                                {BUSINESS_HOURS_VISIBILITY_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Divider />

                                        <SectionHeader icon={StorefrontOutlinedIcon} title="Services Settings" />

                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, mt: -0.5 }}>
                                            These settings apply to your business page and all service listings posted by this business.
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.allow_reviews !== false}
                                                    onChange={(e) => setField('allow_reviews', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow reviews</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Let customers leave reviews on your business page and service listings.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.allow_messages !== false}
                                                    onChange={(e) => setField('allow_messages', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow messages</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Allow customers to send direct messages to your business and service listings.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />
                                    </>
                                )}

                                {/* ── ARTIST ACCOUNT SETTINGS ── */}
                                {isArtistAccount && (
                                    <>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                                            {isVisualArtist
                                                ? 'To edit your artist name, bio, art categories, website, or location, visit your artist profile page.'
                                                : 'To edit your artist name, bio, genre, website, or location, visit your music profile page.'}
                                        </Typography>

                                        <Divider />

                                        <SectionHeader icon={StorefrontOutlinedIcon} title="Services Settings" />

                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, mt: -0.5 }}>
                                            {isVisualArtist
                                                ? 'These settings apply to your artist profile and all service listings posted by this artist account.'
                                                : 'These settings apply to your music profile and all service listings posted by this music account.'}
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.allow_reviews !== false}
                                                    onChange={(e) => setField('allow_reviews', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow reviews</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Let people leave reviews on your service listings.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.allow_messages !== false}
                                                    onChange={(e) => setField('allow_messages', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow messages</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        {isVisualArtist
                                                            ? 'Allow patrons and others to send direct messages to your artist profile and service listings.'
                                                            : 'Allow fans and others to send direct messages to your music profile and service listings.'}
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />
                                    </>
                                )}

                                {/* ── PERSONAL ACCOUNT SETTINGS ── */}
                                {!isBusinessAccount && !isArtistAccount && (
                                    <>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                                            To edit your name, username, or location, visit your profile page.
                                        </Typography>

                                        <Divider />

                                        <SectionHeader icon={ShieldIcon} title="Privacy" />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={Boolean(profile.is_private)}
                                                    onChange={(e) => setField('is_private', e.target.checked ? 1 : 0)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Private account</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Followers-only profile visibility.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.show_online_status !== false}
                                                    onChange={(e) => setField('show_online_status', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Show online status</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Let others see when you're active. Turn off to appear offline.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />

                                        <Divider />

                                        <SectionHeader icon={MailOutlineIcon} title="Messaging" />

                                        <FormControl size="small" sx={{ maxWidth: { xs: '100%', sm: 320 } }}>
                                            <InputLabel id="message-privacy-label">Who can message you</InputLabel>
                                            <Select
                                                labelId="message-privacy-label"
                                                value={safeStr(profile.message_privacy || 'everyone')}
                                                label="Who can message you"
                                                onChange={(e) => setField('message_privacy', e.target.value)}
                                            >
                                                {MESSAGE_PRIVACY_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: -1 }}>
                                            {MESSAGE_PRIVACY_OPTIONS.find((o) => o.value === (profile.message_privacy || 'everyone'))?.description || ''}
                                        </Typography>

                                        <Divider />

                                        <SectionHeader icon={StorefrontOutlinedIcon} title="Services Settings" />

                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, mt: -0.5 }}>
                                            These settings apply to any service listings you have posted from your personal account.
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.service_allow_reviews !== false}
                                                    onChange={(e) => setField('service_allow_reviews', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow service reviews</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Let people leave reviews on your service listings.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.service_allow_messages !== false}
                                                    onChange={(e) => setField('service_allow_messages', e.target.checked)}
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Allow service messages</Typography>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                                        Allow people to send you messages from your service listings.
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />
                                    </>
                                )}

                                {/* ═══ DANGER ZONE ═══ */}
                                <Box sx={{ mt: 4 }} />
                                <Divider />

                                <Box
                                    sx={(t) => ({
                                        mt: 1,
                                        p: { xs: 2, sm: 2.5 },
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: t.palette.error.light,
                                        bgcolor: `${t.palette.error.main}06`,
                                    })}
                                >
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <DeleteForeverIcon sx={{ color: 'error.main', fontSize: 22 }} />
                                            <Typography sx={{ fontWeight: 900, color: 'error.main' }}>
                                                Danger Zone
                                            </Typography>
                                        </Stack>

                                        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 500 }}>
                                            {isBusinessAccount
                                                ? 'Permanently delete this business account and all its content, including posts, events, job listings, service listings, reviews, and team roles. This cannot be undone.'
                                                : isArtistAccount
                                                    ? (isVisualArtist
                                                        ? 'Permanently delete this artist profile and all its content, including your portfolio, posts, events, and reviews. This cannot be undone.'
                                                        : 'Permanently delete this music profile and all its content, including music, posts, events, and reviews. This cannot be undone.')
                                                    : 'Permanently delete your account and all content you have created across the entire platform. This includes posts, comments, events, listings, messages, groups, and any connected business or artist accounts. This cannot be undone.'}
                                        </Typography>

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteForeverIcon />}
                                            onClick={() => setDeleteDialogOpen(true)}
                                            sx={{
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 900,
                                                alignSelf: 'flex-start',
                                                px: 3,
                                            }}
                                        >
                                            {isBusinessAccount
                                                ? 'Delete Business Account'
                                                : isArtistAccount
                                                    ? (isVisualArtist ? 'Delete Artist Profile' : 'Delete Music Profile')
                                                    : 'Delete My Account'}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Stack>
                        </TabPanel>

                        {/* ═══ EMAIL & SECURITY TAB — personal only (index 1) ═══ */}
                        {!isBusinessAccount && !isArtistAccount && (
                            <TabPanel value={tab} index={1}>
                                <Stack spacing={3.5}>

                                    {/* ── OAuth provider badge ── */}
                                    {authProvider && (
                                        <Box
                                            sx={(t) => ({
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: alpha(t.palette.info.main, 0.06),
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.info.main, 0.15),
                                            })}
                                        >
                                            <Box
                                                sx={(t) => ({
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: alpha(t.palette.info.main, 0.1),
                                                })}
                                            >
                                                {authProvider === 'google' ? (
                                                    <GoogleIcon sx={{ fontSize: 20, color: 'info.main' }} />
                                                ) : authProvider === 'facebook' ? (
                                                    <FacebookIcon sx={{ fontSize: 20, color: '#1877F2' }} />
                                                ) : (
                                                    <LinkRoundedIcon sx={{ fontSize: 20, color: 'info.main' }} />
                                                )}
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.3 }}>
                                                    Signed in with {authProvider === 'google' ? 'Google' : authProvider === 'facebook' ? 'Facebook' : authProvider}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
                                                    {isSocialOnly
                                                        ? 'You can set a password below to also sign in with email and password.'
                                                        : 'You also have a password set for email sign-in.'}
                                                </Typography>
                                            </Box>
                                            <CheckCircleRoundedIcon sx={{ fontSize: 20, color: 'success.main', flexShrink: 0 }} />
                                        </Box>
                                    )}

                                    {/* ── Email section ── */}
                                    <Box
                                        sx={(t) => ({
                                            p: { xs: 2, sm: 2.5 },
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: alpha(t.palette.background.default, 0.5),
                                        })}
                                    >
                                        <Stack spacing={2}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <EmailIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                                    <Typography sx={{ fontWeight: 900, fontSize: 15 }}>Email Address</Typography>
                                                </Stack>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={handleChangeEmail}
                                                    disabled={saving}
                                                    sx={{
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        fontSize: '0.8rem',
                                                        px: 2.5,
                                                        boxShadow: 'none',
                                                        '&:hover': { boxShadow: 'none' },
                                                    }}
                                                >
                                                    Update Email
                                                </Button>
                                            </Stack>

                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                                <TextField
                                                    label="Current email"
                                                    value={currentEmail}
                                                    disabled
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        readOnly: true,
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <TextField
                                                    label="New email"
                                                    value={emailForm.nextEmail}
                                                    onChange={(e) => setEmailForm((p) => ({ ...p, nextEmail: e.target.value }))}
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Enter new email address"
                                                />
                                            </Box>

                                            {!isSocialOnly && (
                                                <TextField
                                                    label="Confirm with password"
                                                    value={emailForm.password}
                                                    onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
                                                    type={emailShowPw ? 'text' : 'password'}
                                                    fullWidth
                                                    size="small"
                                                    sx={{ maxWidth: { xs: '100%', sm: 380 } }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => setEmailShowPw((v) => !v)} aria-label={emailShowPw ? 'Hide password' : 'Show password'}>
                                                                    {emailShowPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* ── Password section ── */}
                                    <Box
                                        sx={(t) => ({
                                            p: { xs: 2, sm: 2.5 },
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: alpha(t.palette.background.default, 0.5),
                                        })}
                                    >
                                        <Stack spacing={2}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <LockIcon sx={{ fontSize: 20, color: isSocialOnly ? 'warning.main' : 'primary.main' }} />
                                                    <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                                                        {isSocialOnly ? 'Set a Password' : 'Change Password'}
                                                    </Typography>
                                                </Stack>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={handleChangePassword}
                                                    disabled={saving}
                                                    sx={{
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        fontSize: '0.8rem',
                                                        px: 2.5,
                                                        boxShadow: 'none',
                                                        '&:hover': { boxShadow: 'none' },
                                                    }}
                                                >
                                                    {isSocialOnly ? 'Set Password' : 'Update Password'}
                                                </Button>
                                            </Stack>

                                            {isSocialOnly && (
                                                <Box
                                                    sx={(t) => ({
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 1,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(t.palette.warning.main, 0.06),
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.warning.main, 0.15),
                                                    })}
                                                >
                                                    <InfoOutlinedIcon sx={{ fontSize: 18, color: 'warning.main', mt: 0.15 }} />
                                                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600, lineHeight: 1.5 }}>
                                                        You signed up with {authProvider === 'google' ? 'Google' : authProvider === 'facebook' ? 'Facebook' : authProvider} and don't have a password yet.
                                                        Setting one lets you sign in with your email and password as well.
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: {
                                                        xs: '1fr',
                                                        md: isSocialOnly ? '1fr 1fr' : '1fr 1fr 1fr',
                                                    },
                                                    gap: 2,
                                                }}
                                            >
                                                {!isSocialOnly && (
                                                    <TextField
                                                        label="Current password"
                                                        value={pw.current}
                                                        onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                                                        type={pwShowCur ? 'text' : 'password'}
                                                        fullWidth
                                                        size="small"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton size="small" onClick={() => setPwShowCur((v) => !v)} aria-label={pwShowCur ? 'Hide password' : 'Show password'}>
                                                                        {pwShowCur ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                )}

                                                <TextField
                                                    label={isSocialOnly ? 'Create password' : 'New password'}
                                                    value={pw.next}
                                                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                                                    type={pwShowNew ? 'text' : 'password'}
                                                    fullWidth
                                                    size="small"
                                                    inputProps={{ maxLength: 128 }}
                                                    helperText="12–128 characters. A passphrase works great."
                                                />

                                                <TextField
                                                    label={isSocialOnly ? 'Confirm new password' : 'Confirm password'}
                                                    value={pw.confirm}
                                                    onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                                                    type={pwShowNew ? 'text' : 'password'}
                                                    fullWidth
                                                    size="small"
                                                    inputProps={{ maxLength: 128 }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => setPwShowNew((v) => !v)} aria-label={pwShowNew ? 'Hide password' : 'Show password'}>
                                                                    {pwShowNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Box>
                                        </Stack>
                                    </Box>

                                </Stack>
                            </TabPanel>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Delete Account Dialog */}
            <DeleteAccountDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteAccount}
                deleting={deleting}
                accountType={activeAccountType}
                profileType={artistProfileType}
            />
        </Box>
    );
}

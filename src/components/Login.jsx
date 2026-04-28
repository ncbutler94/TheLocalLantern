// src/components/Login.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { setMobileToken } from '../api/mobileToken';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Link,
    Collapse,
    IconButton,
    Dialog,
    Slide,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from './AuthModalContext';
import useChromeTop from '../hooks/useChromeTop';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RETURN_TO_KEY = 'll:returnTo';
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

// Slide-up transition for mobile fullscreen dialog
const SlideUpTransition = React.forwardRef(function SlideUpTransition(p, ref) {
    return <Slide direction="up" ref={ref} {...p} />;
});

export default function LoginForm(props) {
    const {
        onLogin,        title = 'Log in to continue',
        onTitleChange = null,
        compact = false,
    } = props;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const chromeTop = useChromeTop();

    // Support multiple close prop names, since this form is often rendered inside different modals.
    const closeModal =
        props.onClose ||
        props.onRequestClose ||
        props.handleClose ||
        props.closeModal ||
        props.close ||
        null;

    const setOpen =
        props.setOpen ||
        props.setLoginOpen ||
        props.setIsOpen ||
        props.setModalOpen ||
        null;

    const doClose = () => {
        if (typeof closeModal === 'function') return closeModal();
        if (typeof setOpen === 'function') return setOpen(false);
        return undefined;
    };

    // view: 'login' | 'forgot' | 'forgotSent'
    const [view, setView] = useState('login');

    // login state
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginSubmitting, setLoginSubmitting] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);

    // forgot state
    const [identifier, setIdentifier] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSubmitting, setForgotSubmitting] = useState(false);
    const [forgotAck, setForgotAck] = useState('');

    // email verification state (shown when unverified user tries to log in)
    const [verifyStep, setVerifyStep] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [verifySubmitting, setVerifySubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const isLoginPage = location.pathname === '/login';

    // ── Redirect away from /login if already authenticated ──
    const { isAuthenticated, status } = useAuth();
    useEffect(() => {
        if (isLoginPage && isAuthenticated && status === 'authenticated') {
            navigate('/', { replace: true });
        }
    }, [isLoginPage, isAuthenticated, status, navigate]);

    const getSafeRedirectPath = () => {
        try {
            const sp = new URLSearchParams(location.search || '');
            const raw = sp.get('redirect');
            if (!raw) return null;
            const decoded = decodeURIComponent(raw);
            // Prevent open-redirects: only allow internal paths
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

            let path = typeof parsed.path === 'string' && parsed.path.startsWith('/') ? parsed.path : null;
            if (path && (path === '/login' || path.startsWith('/login?') || path.startsWith('/login#'))) path = '/';
            const scrollY = Number.isFinite(Number(parsed.scrollY)) ? Math.max(0, Number(parsed.scrollY)) : 0;

            return { path, scrollY };
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

        // Give the next route a moment to mount.
        let tries = 0;
        const tick = () => {
            tries += 1;
            try {
                window.scrollTo(0, target);
            } catch {
                // ignore
            }
            if (tries < 10) {
                window.requestAnimationFrame(tick);
            }
        };
        window.requestAnimationFrame(tick);
    };

    // If the user navigates away (e.g., to /register) while this modal is open,
    // proactively close the modal so it doesn't remain on top of the new page.
    useEffect(() => {
        if (location.pathname === '/register') {
            doClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const isForgotFlow = view === 'forgot' || view === 'forgotSent';
    const isVerifyFlow = verifyStep;

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
            const verifyRes = await axios.post(
                `${API_BASE}/auth/verify-email-code`,
                { email: verifyEmail, code },
                { withCredentials: true }
            );

            // verify-email-code itself auto-logs the user in. On native, capture
            // the returned token. (On web it's not in the body and setMobileToken
            // is a no-op anyway.)
            if (verifyRes.data?.token) setMobileToken(verifyRes.data.token);

            // Verified — now log them in automatically
            try {
                const res = await axios.post(
                    `${API_BASE}/auth/login`,
                    { login: verifyEmail, password },
                    { withCredentials: true }
                );
                if (res.data?.token) setMobileToken(res.data.token);
                if (onLogin) onLogin(res.data.user);
            } catch {
                // If auto-login fails, just redirect to login view
            }

            setVerifyStep(false);
            setVerifyCode('');

            // First-time email verification — send them to /onboarding so
            // they can pick an account type. Clear any stored returnTo because
            // onboarding will route them to the right landing page based on
            // the account type they choose. This applies whether Login is
            // rendered as the /login page or inside a modal.
            clearReturnTo();
            navigate('/onboarding', { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Invalid or expired code. Please try again.';
            setVerifyError(msg);
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
            await axios.post(
                `${API_BASE}/auth/resend-verification-code`,
                { email: verifyEmail },
                { withCredentials: true }
            );
        } catch {
            setVerifyError('Could not resend code. Please try again.');
        }
    };

    const cancelVerify = () => {
        setVerifyStep(false);
        setVerifyCode('');
        setVerifyError('');
    };
    const headerText = view === 'login' ? title : 'Forgot Password';

    useEffect(() => {
        if (typeof onTitleChange === 'function') {
            onTitleChange(headerText);
        }
    }, [headerText, onTitleChange]);

    const startForgot = () => {
        setLoginError('');
        setForgotError('');
        setForgotAck('');

        const prefill = String(login || '').trim();
        setIdentifier(prefill);
        setView('forgot');
    };

    const cancelForgot = () => {
        setForgotError('');
        setForgotAck('');
        setForgotSubmitting(false);
        setView('login');
    };

    const submitLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginSubmitting(true);

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/login`,
                { login: login.trim(), password, rememberMe: true },
                { withCredentials: true }
            );

            // On native (Capacitor), the backend returns the JWT in the body
            // because the auth cookie can't survive the cross-origin WebView.
            // Store it so axiosInstance can attach it as a Bearer header on
            // subsequent requests. No-op on web (token is undefined and
            // setMobileToken short-circuits anyway).
            if (res.data?.token) setMobileToken(res.data.token);

            if (onLogin) onLogin(res.data.user);

            if (isLoginPage) {
                const qpRedirect = getSafeRedirectPath();
                const stored = readReturnTo();

                let targetPath = qpRedirect || stored?.path || '/';
                if (String(targetPath || '') === '/register' || String(targetPath || '').startsWith('/register?') || String(targetPath || '').startsWith('/register#')) {
                    targetPath = '/';
                }
                if (String(targetPath || '') === '/login' || String(targetPath || '').startsWith('/login?') || String(targetPath || '').startsWith('/login#')) {
                    targetPath = '/';
                }
                const targetScroll = stored?.scrollY ?? 0;

                clearReturnTo();
                navigate(targetPath, { replace: true });

                if (targetScroll > 0) {
                    // restore scroll after navigation
                    setTimeout(() => restoreScroll(targetScroll), 0);
                }
            }
        } catch (err) {
            const status = err?.response?.status;
            const serverMsg = err?.response?.data?.message || '';
            const serverCode = err?.response?.data?.code || '';

            if (status === 403 && serverCode === 'EMAIL_NOT_VERIFIED') {
                // Account exists but email not verified — show verification UI
                const unverifiedEmail = err?.response?.data?.email || login.trim();
                setVerifyEmail(unverifiedEmail);
                setVerifyStep(true);
                setResendCooldown(0);
                setLoginError('');
                // Auto-send a new code
                try {
                    await axios.post(
                        `${API_BASE}/auth/resend-verification-code`,
                        { email: unverifiedEmail },
                        { withCredentials: true }
                    );
                    setResendCooldown(60);
                } catch {
                    // ignore — they can manually resend
                }
            } else if (status === 429) {
                // Rate limited
                setIsRateLimited(true);
                setLoginError('Too many login attempts. Please try again in a few minutes, or reset your password below.');
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setLoginError('Multiple failed attempts. Please use "Forgot password?" below to reset your password.');
                } else if (newAttempts >= 3) {
                    setLoginError('Incorrect email/username or password. If you\'ve forgotten your password, try resetting it below.');
                } else {
                    setLoginError(serverMsg || 'Incorrect email/username or password. Please try again.');
                }
            }
        } finally {
            setLoginSubmitting(false);
        }
    };

    const submitForgot = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotAck('');

        const cleaned = String(identifier || '').trim();
        if (!cleaned) {
            setForgotError('Please enter your email address or username.');
            return;
        }

        setForgotSubmitting(true);
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
                { login: cleaned },
                { withCredentials: true }
            );

            const isEmail = emailRegex.test(cleaned.toLowerCase());
            const ack = isEmail
                ? `If the email is associated with a The Local Lantern account, a password reset link will be sent to ${cleaned}.`
                : `If that username exists with a The Local Lantern account, an email will be sent to the email address on file.`;

            setForgotAck(ack);
            setView('forgotSent');
        } catch (err) {
            setForgotError(err?.response?.data?.message || 'Unable to send reset email. Please try again.');
        } finally {
            setForgotSubmitting(false);
        }
    };

    const formBaseSx = {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
    };

    // Shared primary-action button style — solid secondary colour, theme shadows & motion
    const primaryBtnSx = (t) => {
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
    };


    // ── Determine if this is rendered as a popup (compact) on mobile ──
    const isMobilePopup = isMobile && compact;

    // ── Shared form inner content ──
    const formInner = (
        <Box sx={{ px: { xs: 1.75, sm: 3, md: 4 }, py: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                <Typography
                    variant="h5"
                    sx={(t) => ({ fontWeight: t.typography.h5.fontWeight, letterSpacing: t.typography.h5.letterSpacing, mb: 0.75 })}
                >
                    {isVerifyFlow ? 'Verify Your Email' : headerText === 'Forgot Password' ? 'Forgot Password' : 'Log In'}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        maxWidth: 520,
                        mx: 'auto',
                        lineHeight: 1.6,
                    }}
                >
                    {isVerifyFlow
                        ? <>We sent a 6-digit code to <strong>{verifyEmail}</strong>. Enter it below to activate your account.</>
                        : headerText === 'Forgot Password'
                            ? "Enter your email or username and we\u2019ll send a reset link if it matches an account."
                            : title && title !== 'Log in to continue'
                                ? title
                                : 'Welcome! Log in to continue.'}
                </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
                {/* LOGIN PANE */}
                <Collapse in={!isForgotFlow && !isVerifyFlow} timeout={{ enter: 220, exit: 140 }} unmountOnExit>
                    <Box component="form" onSubmit={submitLogin} sx={formBaseSx}>
                        <SocialLoginButtons label="Continue" dividerText="or continue with email" />

                        {loginError && (
                            <Box sx={{ bgcolor: (t) => alpha(t.palette.error.main, 0.08), borderRadius: 2, py: 1.25, px: 2, textAlign: 'center' }}>
                                <Typography sx={{ color: 'error.main', fontSize: 13, lineHeight: 1.5 }}>{loginError}</Typography>
                                {(failedAttempts >= 3 || isRateLimited) && (
                                    <Link component="button" type="button" onClick={startForgot} sx={{ mt: 0.75, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>
                                        Reset your password
                                    </Link>
                                )}
                            </Box>
                        )}

                        <TextField variant="outlined" label="Email or username" value={login} onChange={(e) => setLogin(e.target.value)} required fullWidth autoComplete="username" inputProps={{ maxLength: 254, style: { fontSize: 16 } }} InputLabelProps={{ shrink: true }} />
                        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password" inputProps={{ maxLength: 128, style: { fontSize: 16 } }} InputLabelProps={{ shrink: true }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: -0.5 }}>
                            <Link component="button" type="button" variant="body2" onClick={startForgot} sx={(t) => ({ cursor: 'pointer', fontWeight: 600, color: t.custom?.primaryText || t.palette.primary.main })}>
                                Forgot password?
                            </Link>
                        </Box>

                        <Button type="submit" variant="contained" size="large" fullWidth disabled={loginSubmitting}
                                sx={(t) => ({ ...primaryBtnSx(t), mt: 0.5 })}
                        >
                            {loginSubmitting ? 'Logging in\u2026' : 'Login'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2">
                                New here?{' '}
                                <Link component={RouterLink} to="/register" underline="hover" onClick={() => { doClose(); }}>Create an account</Link>
                            </Typography>
                        </Box>
                    </Box>
                </Collapse>

                {/* FORGOT PANE */}
                <Collapse in={isForgotFlow && !isVerifyFlow} timeout={{ enter: 220, exit: 140 }} unmountOnExit>
                    <Box component="form" onSubmit={submitForgot} sx={formBaseSx}>
                        {forgotError && (<Typography color="error" align="center">{forgotError}</Typography>)}

                        {view === 'forgotSent' ? (
                            <>
                                <Typography align="center" sx={{ lineHeight: 1.5 }}>{forgotAck}</Typography>
                                <Button type="button" variant="contained" fullWidth onClick={cancelForgot}
                                        sx={(t) => primaryBtnSx(t)}
                                >Back to login</Button>
                            </>
                        ) : (
                            <>
                                <TextField variant="outlined" label="Enter your email address or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required fullWidth autoComplete="username" inputProps={{ maxLength: 254, style: { fontSize: 16 } }} InputLabelProps={{ shrink: true }} />
                                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Button type="submit" variant="contained" size="large" fullWidth disabled={forgotSubmitting}
                                            sx={(t) => primaryBtnSx(t)}
                                    >{forgotSubmitting ? 'Sending\u2026' : 'Continue'}</Button>
                                    <Button type="button" variant="outlined" fullWidth onClick={cancelForgot} disabled={forgotSubmitting} sx={{ borderRadius: 999, fontWeight: 800 }}>Cancel</Button>
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    {"We\u2019ll send a reset link if your account exists. For your security, we don\u2019t confirm whether an account is registered."}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Collapse>

                {/* VERIFY EMAIL PANE */}
                <Collapse in={isVerifyFlow} timeout={{ enter: 220, exit: 140 }} unmountOnExit>
                    <Box component="form" onSubmit={submitVerifyCode} sx={formBaseSx}>
                        {verifyError && (
                            <Box sx={{ bgcolor: (t) => alpha(t.palette.error.main, 0.08), borderRadius: 2, py: 1.25, px: 2, textAlign: 'center' }}>
                                <Typography sx={{ color: 'error.main', fontSize: 13, lineHeight: 1.5 }}>{verifyError}</Typography>
                            </Box>
                        )}
                        <TextField label="Verification Code" value={verifyCode}
                                   onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setVerifyCode(v); if (verifyError) setVerifyError(''); }}
                                   fullWidth required autoFocus placeholder="000000"
                                   inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 } }}
                                   InputLabelProps={{ shrink: true }}
                        />
                        <Button type="submit" variant="contained" size="large" fullWidth disabled={verifySubmitting || verifyCode.length !== 6}
                                sx={(t) => primaryBtnSx(t)}
                        >{verifySubmitting ? 'Verifying\u2026' : 'Verify & Log In'}</Button>
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>{"Didn\u2019t receive the code?"}</Typography>
                            <Button variant="text" onClick={resendVerifyCode} disabled={resendCooldown > 0} sx={{ borderRadius: 999, fontWeight: 700, textTransform: 'none' }}>
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                            </Button>
                        </Box>
                        <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                            <Button variant="text" onClick={cancelVerify} sx={{ borderRadius: 999, fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}>Back to login</Button>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        </Box>
    );

    // ── Mobile fullscreen slide-up ──
    if (isMobilePopup) {
        return (
            <Dialog
                open
                fullScreen
                onClose={doClose}
                TransitionComponent={SlideUpTransition}
                disableScrollLock
                PaperProps={{
                    sx: (t) => ({
                        bgcolor: t.palette.background.default,
                        backgroundImage: 'none',
                        // Fullscreen dialogs are position:fixed at top:0, which
                        // bypasses the body's env(safe-area-inset-top) padding.
                        // Add it back on the Paper so the back bar / title row
                        // sit below the iOS notch / status bar.
                        pt: 'env(safe-area-inset-top, 0px)',
                    }),
                }}
            >
                {/* Top bar with back button */}
                <Box
                    sx={(t) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1,
                        py: 0.75,
                        pt: 0.75,
                        borderBottom: '1px solid',
                        borderColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.10 : 0.07),
                        bgcolor: t.palette.background.paper,
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                    })}
                >
                    <IconButton onClick={doClose} aria-label="Back" size="small" sx={(t) => ({ color: t.palette.text.primary })}>
                        <ArrowBackRoundedIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>
                        {isVerifyFlow ? 'Verify Your Email' : headerText === 'Forgot Password' ? 'Forgot Password' : 'Log In'}
                    </Typography>
                </Box>

                {/* Scrollable form content */}
                <Box sx={(t) => ({ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', bgcolor: t.palette.background.paper })}>
                    <Container maxWidth="sm" disableGutters sx={{ minHeight: '100%' }}>
                        {formInner}
                    </Container>
                </Box>
            </Dialog>
        );
    }

    // ── Desktop / non-compact layout (original) ──
    return (
        <Box
            sx={(t) => ({
                minHeight: compact ? 'auto' : { xs: `calc(100dvh - 56px - ${chromeTop}px)`, sm: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' },
                bgcolor: { xs: t.palette.background.paper, sm: 'transparent' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: compact ? 'flex-start' : { xs: 'flex-start', sm: 'center' },
                pt: compact ? 0 : { xs: `${chromeTop}px`, sm: 0, md: 0 },
                pb: compact ? 0 : { xs: 0, sm: 2.5, md: 3.5 },
                flex: 1,
            })}
        >
            <Container
                maxWidth="sm"
                disableGutters
                sx={{
                    px: { xs: 0, sm: 2 },
                    display: 'flex',
                    flexDirection: 'column',
                    flex: { xs: 1, sm: 'initial' },
                }}
            >
                <Paper
                    elevation={compact ? 0 : undefined}
                    sx={(t) => ({
                        width: '100%',
                        mx: 'auto',
                        overflow: 'hidden',
                        flex: { xs: 1, sm: 'initial' },
                        borderRadius: compact ? 0 : { xs: 0, sm: t.custom?.postCard?.borderRadius || `${t.shape.borderRadius}px` },
                        border: compact ? 'none' : { xs: 'none', sm: '1px solid' },
                        borderColor: compact ? 'transparent' : alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.10 : 0.07),
                        bgcolor: t.palette.background.paper,
                        mt: compact ? 0 : { xs: 0, sm: 0 },
                        backdropFilter: compact ? 'none' : { xs: 'none', sm: 'saturate(140%) blur(10px)' },
                        backgroundImage: 'none',
                        boxShadow: compact ? 'none' : { xs: 'none', sm: t.custom?.shadows?.lg || t.custom?.shadows?.md || t.shadows[6] },
                    })}
                >
                    {formInner}
                </Paper>
            </Container>
        </Box>
    );
}

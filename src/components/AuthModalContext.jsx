// src/components/AuthModalContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { Capacitor } from '@capacitor/core';
import {
    Dialog,
    DialogContent,
    IconButton,
    Slide,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LoginForm from './Login';

// Auth UI strategy:
//  - Header "Log in" button / direct navigation → full /login page
//  - Protected-action triggers (create event, create artist, etc.) → inline popup modal

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
const AUTH_STORAGE_KEY = 'auth:event';
const AUTH_TAB_ID = `auth-tab-${Math.random().toString(36).slice(2)}`;
const MIN_REFRESH_COOLDOWN_MS = 4000;
const MIN_PROMPT_COOLDOWN_MS = 10000;

// Track consecutive 401s to avoid logging out on transient errors
const MAX_CONSECUTIVE_401S = 3;

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    status: 'loading',
    loginOpen: false,

    openLogin: () => {},
    openLoginPopup: () => {},
    closeLogin: () => {},

    openAuth: () => {},
    closeAuth: () => {},
    open: () => {},
    close: () => {},

    logout: async () => {},
    refresh: async () => false,
    requireAuth: async () => false,
});

export function AuthModalProvider({ children }) {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading');

    const applyAuthState = useCallback((nextUser, nextStatus) => {
        setUser((prevUser) => {
            const prevKey = prevUser?.id ?? prevUser?._id ?? prevUser?.user_id ?? null;
            const nextKey = nextUser?.id ?? nextUser?._id ?? nextUser?.user_id ?? null;

            if (prevKey === nextKey) {
                const prevJson = prevUser ? JSON.stringify(prevUser) : null;
                const nextJson = nextUser ? JSON.stringify(nextUser) : null;
                if (prevJson === nextJson) return prevUser;
            }

            return nextUser;
        });
        setStatus((prevStatus) => (prevStatus === nextStatus ? prevStatus : nextStatus));
    }, []);

    // Ref mirrors status so refresh can read it without depending on it
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    // loginOpen drives the popup dialog for protected-action auth prompts.
    // The full /login page route is used for intentional header-based login.
    const [loginOpen, setLoginOpen] = useState(false);
    const [popupTitle, setPopupTitle] = useState('Log in to continue');

    const loginOpenRef = useRef(false);
    const lastPromptAtRef = useRef(0);
    const lastRefreshAtRef = useRef(0);
    const loginWaitersRef = useRef([]);

    // Track consecutive 401 errors to distinguish transient issues from real session expiry
    const consecutive401sRef = useRef(0);
    // Track if we're currently refreshing to avoid race conditions
    const isRefreshingRef = useRef(false);

    const navigate = useNavigate();

    useEffect(() => {
        axios.defaults.withCredentials = true;
    }, []);

    const openLogin = useCallback(() => {
        const now = Date.now();
        if (now - lastPromptAtRef.current < MIN_PROMPT_COOLDOWN_MS && loginOpenRef.current) return;
        lastPromptAtRef.current = now;

        // Instead of opening a popup, redirect to /login.
        setLoginOpen(false);
        loginOpenRef.current = false;

        // Preserve current path so /login can navigate back after success.
        const from = window.location.pathname + window.location.search + window.location.hash;

        try {
            sessionStorage.setItem(
                'll:returnTo',
                JSON.stringify({ path: from, scrollY: typeof window !== 'undefined' ? window.scrollY : 0, ts: Date.now() })
            );
        } catch {
            // ignore
        }

        navigate(`/login?redirect=${encodeURIComponent(from)}`);
    }, [navigate]);

    // Opens the inline popup modal (for protected-action triggers)
    const openLoginPopup = useCallback((customTitle) => {
        const now = Date.now();
        if (now - lastPromptAtRef.current < MIN_PROMPT_COOLDOWN_MS && loginOpenRef.current) return;
        lastPromptAtRef.current = now;

        if (customTitle) setPopupTitle(customTitle);
        setLoginOpen(true);
        loginOpenRef.current = true;
    }, []);

    const closeLogin = useCallback(() => {
        setLoginOpen(false);
        loginOpenRef.current = false;
        setPopupTitle('Log in to continue');

        if (loginWaitersRef.current.length) {
            loginWaitersRef.current.forEach((r) => r(false));
            loginWaitersRef.current = [];
        }
    }, []);

    const refresh = useCallback(
        async ({ silent = false, force = false } = {}) => {
            // If already refreshing, wait for the existing refresh to complete
            if (isRefreshingRef.current && !force) {
                // Return current status without starting another refresh
                return statusRef.current === 'authenticated';
            }

            const since = Date.now() - lastRefreshAtRef.current;
            if (!force && since < MIN_REFRESH_COOLDOWN_MS && statusRef.current !== 'loading') {
                return statusRef.current === 'authenticated';
            }

            isRefreshingRef.current = true;
            lastRefreshAtRef.current = Date.now();

            try {
                const res = await axios.get(`${API_BASE}/users/profile`, {
                    headers: { 'x-auth-check': '1' },
                });
                const nextUser = res?.data?.user || null;

                // Success! Reset consecutive 401 counter
                consecutive401sRef.current = 0;

                applyAuthState(nextUser, 'authenticated');

                if (loginOpenRef.current) {
                    setLoginOpen(false);
                    loginOpenRef.current = false;
                }

                if (loginWaitersRef.current.length) {
                    loginWaitersRef.current.forEach((r) => r(true));
                    loginWaitersRef.current = [];
                }

                return true;
            } catch (err) {
                const statusCode = err?.response?.status;
                const errCode = err?.response?.data?.code;

                // Special case: the user is authenticated (their cookie is
                // valid and points at a real account) but they haven't
                // finished social-login onboarding yet. The server returns
                // 401 + code: 'NEEDS_ONBOARDING' so we don't leak the
                // half-finished account into normal app state. Route the
                // browser to /onboarding so they can't bail to another page
                // via the back button and stay silently half-signed-in.
                if (statusCode === 401 && errCode === 'NEEDS_ONBOARDING') {
                    applyAuthState(null, 'unauthenticated');
                    consecutive401sRef.current = 0;
                    if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
                        // Use window.location rather than react-router navigate
                        // so it works even from effects that fire before
                        // RouterProvider is ready on first paint.
                        window.location.replace('/onboarding');
                    }
                    return false;
                }

                // Only set unauthenticated if we get a clear 401
                if (statusCode === 401) {
                    consecutive401sRef.current += 1;

                    // If we're still in 'loading' state, immediately set to unauthenticated
                    // so the app can render. Otherwise, wait for multiple consecutive 401s.
                    if (statusRef.current === 'loading') {
                        applyAuthState(null, 'unauthenticated');
                        consecutive401sRef.current = 0;
                    } else if (consecutive401sRef.current >= MAX_CONSECUTIVE_401S) {
                        // Only fully log out if we've seen multiple consecutive 401s
                        // This prevents transient network issues from logging users out
                        applyAuthState(null, 'unauthenticated');
                        consecutive401sRef.current = 0; // Reset after logging out
                    }
                } else if (statusCode >= 500 || !statusCode) {
                    if (statusRef.current === 'loading') {
                        applyAuthState(null, 'unauthenticated');
                    }
                    console.warn('[AuthModalContext] refresh failed with non-401 error:', statusCode || 'network error');
                } else {
                    if (statusRef.current === 'loading') {
                        applyAuthState(null, 'unauthenticated');
                    }
                    console.warn('[AuthModalContext] refresh failed with status:', statusCode);
                }

                if (!silent && !loginOpenRef.current) {
                    // remain silent by default
                }
                return false;
            } finally {
                isRefreshingRef.current = false;
            }
        },
        [applyAuthState] // stable — reads status via statusRef
    );

    useEffect(() => {
        const respId = axios.interceptors.response.use(
            (r) => {
                // Successful response - reset the 401 counter
                consecutive401sRef.current = 0;
                return r;
            },
            async (error) => {
                const statusCode = error?.response?.status;
                const url = String(error?.config?.url || '');
                const method = String(error?.config?.method || 'get').toLowerCase();

                const isAuthEndpoint =
                    url.includes('/auth/login') ||
                    url.includes('/auth/logout') ||
                    url.includes('/auth/google') ||
                    url.includes('/auth/facebook') ||
                    url.includes('/users/profile'); // Don't re-trigger on profile check

                const promptHeader = error?.config?.headers?.['x-auth-prompt'];
                const promptMeta = error?.config?.meta?.promptOn401;

                if (statusCode === 401 && !isAuthEndpoint) {
                    consecutive401sRef.current += 1;

                    // Only set unauthenticated after multiple consecutive 401s
                    // This prevents a single flaky request from logging out the user
                    if (consecutive401sRef.current >= MAX_CONSECUTIVE_401S) {
                        applyAuthState(null, 'unauthenticated');

                        const shouldPrompt =
                            method !== 'get' ||
                            promptHeader === '1' ||
                            promptHeader === 1 ||
                            promptMeta === true;

                        if (shouldPrompt) openLogin();
                    } else {
                        // First or second 401 - try refreshing auth state first
                        // before assuming we're logged out
                        if (!isRefreshingRef.current) {
                            refresh({ silent: true, force: true }).catch(() => {
                                // Refresh failed too - the interceptor will handle subsequent 401s
                            });
                        }
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(respId);
        };
    }, [openLogin, refresh]);

    useEffect(() => {
        const onFocus = () => {
            // Only refresh if we think we're authenticated or loading
            // Don't spam refresh calls if we're already unauthenticated
            if (statusRef.current !== 'unauthenticated') {
                refresh({ silent: true });
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            if (statusRef.current !== 'unauthenticated') {
                refresh({ silent: true });
            }
        };

        const onStorage = (e) => {
            if (e.key === AUTH_STORAGE_KEY && e.newValue) {
                try {
                    const payload = JSON.parse(e.newValue);
                    if (!payload || payload.source === AUTH_TAB_ID) return;
                    if (payload?.type === 'login' || payload?.type === 'logout') {
                        refresh({ silent: true, force: true });
                    }
                } catch {}
            }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('storage', onStorage);
        };
    }, [refresh]);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.pathname === '/social-login-success') {
            const token = url.searchParams.get('token');
            const redirectTo = url.searchParams.get('redirect') || '/';

            if (token) {
                // ─── Native mobile (Capacitor) ──────────────────────────
                // We CAN'T use window.location.href to navigate to
                // api.thelocallantern.com here — Capacitor's webview
                // treats that as an external URL and hands it off to
                // Chrome, which kicks the user out of the app entirely.
                //
                // Instead, use fetch with credentials:'include'. The
                // exchange-token endpoint's Set-Cookie header is
                // honored on the /localhost origin because Android's
                // WebView accepts cross-origin Set-Cookie the same way
                // email/password login already works for this app.
                // After the cookie is set, refresh auth state and
                // navigate internally via react-router.
                if (Capacitor.isNativePlatform()) {
                    const exchangeUrl = `${API_BASE}/auth/exchange-token`
                        + `?token=${encodeURIComponent(token)}`
                        + `&redirect=${encodeURIComponent(redirectTo)}`;

                    fetch(exchangeUrl, {
                        method: 'GET',
                        credentials: 'include',
                        redirect: 'manual', // don't try to follow server's 302
                    })
                        .catch(() => { /* redirect:manual throws on 3xx in some browsers; ignore */ })
                        .finally(() => {
                            // Cookie should now be set — refresh auth and go.
                            refresh({ silent: true, force: true }).finally(() => {
                                navigate(redirectTo, { replace: true });
                            });
                        });
                    return;
                }

                // ─── Web ───────────────────────────────────────────────
                // Navigate the browser to the backend exchange-token
                // endpoint. This is a full GET navigation (not fetch), so:
                //   1. No CSRF token needed
                //   2. The Set-Cookie header is accepted by mobile Safari
                //      because it's a first-party navigation, not a
                //      third-party redirect bounce
                // The endpoint validates the JWT, sets the httpOnly cookie,
                // and redirects back to FRONTEND_URL + redirectTo.
                const exchangeUrl = `${API_BASE}/auth/exchange-token`
                    + `?token=${encodeURIComponent(token)}`
                    + `&redirect=${encodeURIComponent(redirectTo)}`;
                window.location.href = exchangeUrl;
                return; // stop — browser is navigating away
            }

            // No token in URL — just try refreshing auth and redirect
            refresh({ silent: true, force: true }).finally(() => {
                navigate(redirectTo, { replace: true });
            });
        }
    }, [refresh, navigate]);

    useEffect(() => {
        refresh({ silent: true });
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await axios.post(`${API_BASE}/auth/logout`);
        } catch {
            /* ignore */
        }
        applyAuthState(null, 'unauthenticated');
        consecutive401sRef.current = 0; // Reset on explicit logout
        try {
            localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({ type: 'logout', at: Date.now(), source: AUTH_TAB_ID })
            );
        } catch {}
    }, [applyAuthState]);

    const requireAuth = useCallback(async () => {
        if (statusRef.current === 'authenticated' && user) return true;

        // Try a force refresh first before prompting for login
        const isAuthed = await refresh({ silent: true, force: true });
        if (isAuthed) return true;

        // Show inline popup instead of redirecting to /login
        openLoginPopup();
        return new Promise((resolve) => {
            loginWaitersRef.current.push(resolve);
        });
    }, [openLoginPopup, refresh, user]);

    // Handle successful login from popup
    const handlePopupLogin = useCallback((loggedInUser) => {
        applyAuthState(loggedInUser, 'authenticated');
        consecutive401sRef.current = 0;
        setLoginOpen(false);
        loginOpenRef.current = false;
        setPopupTitle('Log in to continue');

        if (loginWaitersRef.current.length) {
            loginWaitersRef.current.forEach((r) => r(true));
            loginWaitersRef.current = [];
        }

        try {
            localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({ type: 'login', at: Date.now(), source: AUTH_TAB_ID })
            );
        } catch {
            // ignore
        }
    }, [applyAuthState]);

    const value = {
        user,
        isAuthenticated: status === 'authenticated' && !!user,
        status,
        loginOpen,

        openLogin,
        openLoginPopup,
        closeLogin,

        openAuth: openLoginPopup,
        closeAuth: closeLogin,
        open: openLoginPopup,
        close: closeLogin,

        logout,
        refresh,
        requireAuth,

        // Exposed for LoginPopupDialog (rendered inside ThemeBridge)
        popupTitle,
        setPopupTitle,
        handlePopupLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/* ─── Slide transition for the popup ─── */
const SlideUp = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/* ─── Popup dialog that wraps LoginForm ─── */
export function LoginPopupDialog({ open, onClose, onLogin, title, onTitleChange }) {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionComponent={SlideUp}
            fullScreen={isSmall}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                elevation: 12,
                sx: {
                    borderRadius: isSmall ? 0 : 3,
                    overflow: 'hidden',
                    position: 'relative',
                },
            }}
        >
            {/* Close button */}
            <IconButton
                onClick={onClose}
                aria-label="Close login"
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                }}
            >
                <CloseRoundedIcon fontSize="small" />
            </IconButton>

            <DialogContent sx={{ p: 0, overflow: 'auto' }}>
                <LoginForm
                    compact
                    title={title}
                    onTitleChange={onTitleChange}
                    onLogin={onLogin}
                    onClose={onClose}
                />
            </DialogContent>
        </Dialog>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function useAuthModal() {
    const ctx = useAuth();
    return {
        user: ctx.user,
        status: ctx.status,
        loginOpen: ctx.loginOpen,

        open: ctx.openLoginPopup,
        close: ctx.closeLogin,
        openAuth: ctx.openLoginPopup,
        closeAuth: ctx.closeLogin,
        openLoginPopup: ctx.openLoginPopup,

        logout: ctx.logout,
        refresh: ctx.refresh,
        requireAuth: ctx.requireAuth,
    };
}

export function AuthGate({ children, fallback = null }) {
    const { isAuthenticated, status, openLogin } = useAuth();
    useEffect(() => {
        if (status === 'unauthenticated') openLogin();
    }, [status, openLogin]);
    if (status === 'loading') return fallback;
    if (!isAuthenticated) return fallback;
    return <>{children}</>;
}

// src/App.js


import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
    useParams,
} from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import './App.css';
import { AuthModalProvider, useAuth } from './components/AuthModalContext';
import { LoginPopupDialog } from './components/AuthModalContext';
import { AccountProvider, useActiveAccount } from './components/AccountContext';
import ThemeContextProvider from './themes/ThemeContext';

import Layout from './pages/Layout';
// Footer removed — privacy/legal links moved to sidebar
import HomePage from './pages/home/Home';
import Login from './components/Login';
import SocialHome from './pages/social/SocialHome';
import UserProfilePage from './pages/profile/userProfile/UserProfilePage';
import GroupPage from './pages/community/groups/groupPage/GroupPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import Register from './pages/Register';
import OnboardingPage from './pages/OnboardingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFound from './pages/NotFound';
import NetworkErrorState, { isNetworkError } from './components/NetworkErrorState';
import { secureFetch } from './utils/secureFetch';
import CreateFromAnywhere from './components/CreateFromAnywhere';
import AppSplash from './components/AppSplash';
import { resolveProfile } from './utils/resolveProfile';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
// ── Suppress known MUI warnings that are non-breaking ──
// MUI's Menu component logs a warning when it encounters `false`, `null`,
// or Fragment children produced by conditional rendering. We've fixed all
// known instances, but this guard prevents any future regressions from
// flooding the console.
if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = window.__LL_ORIGINAL_CONSOLE_ERROR__ || console.error;
    if (!window.__LL_ORIGINAL_CONSOLE_ERROR__) {
        window.__LL_ORIGINAL_CONSOLE_ERROR__ = originalConsoleError;
    }

    if (!window.__LL_MUI_WARNING_FILTER_INSTALLED__) {
        window.__LL_MUI_WARNING_FILTER_INSTALLED__ = true;
        console.error = (...args) => {
            if (
                typeof args[0] === 'string' &&
                (
                    args[0].includes("The Menu component doesn't accept a Fragment as a child") ||
                    args[0].includes('is potentially unsafe when doing server-side rendering') ||
                    args[0].includes(':first-child') ||
                    args[0].includes(':nth-child') ||
                    args[0].includes('cannot be a child of')
                )
            ) {
                return; // silently swallow known non-breaking warnings
            }
            originalConsoleError.apply(console, args);
        };
    }
}

const PostPage = lazy(() => import('./pages/community/PostPage'));
// Slice 3: full-page route for news articles (/news/article/:id)
const NewsPage = lazy(() => import('./pages/community/NewsPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventPostPage = lazy(() => import('./pages/events/EventPostPage'));
const MusicPage = lazy(() => import('./pages/music/pages/MusicPage'));
const ArtistProfilePage = lazy(() => import('./pages/music/pages/ArtistProfilePage'));
const ArtistPostPage = lazy(() => import('./pages/music/pages/ArtistPostPage'));
const ArtistAdminConsole = lazy(() => import('./pages/music/admin/ArtistAdminConsole'));
const ServicesPage = lazy(() => import('./pages/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/services/ServiceDetailPage'));
const ServiceRequestDetailPage = lazy(() => import('./pages/services/ServiceRequestDetailPage'));
const ServiceAdminConsole = lazy(() => import('./pages/services/pages/ServiceAdminConsole'));
const CreateServicePage = lazy(() => import('./pages/services/pages/CreateServicePage'));
const MarketplacePage = lazy(() => import('./pages/marketplace/MarketplacePage'));
const ListingDetailPage = lazy(() => import('./pages/marketplace/pages/ListingDetail'));

const JobsPage = lazy(() => import('./pages/jobs/JobsPage'));
const JobDetail = lazy(() => import('./pages/jobs/JobDetail'));
const AccountSettingsPage = lazy(() => import('./pages/account/AccountSettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/account/NotificationSettings'));
const BusinessHubPage = lazy(() => import('./pages/business/pages/BusinessHubPage'));
const BusinessSetupPage = lazy(() => import('./pages/business/pages/BusinessSetupPage'));
const BusinessPublicPage = lazy(() => import('./pages/business/pages/BusinessPublicPage'));
const BusinessPostPage = lazy(() => import('./pages/business/pages/BusinessPostPage'));
const BusinessJoinPage = lazy(() => import('./pages/business/pages/BusinessJoinPage'));
const BusinessAdminPage = lazy(() => import('./pages/business/pages/BusinessAdminPage'));
const PageTeamPage = lazy(() => import('./pages/business/pages/PageTeamPage'));
const PageInviteAcceptPage = lazy(() => import('./pages/business/pages/PageInviteAcceptPage'));
const PageDashboardPage = lazy(() => import('./pages/business/pages/PageDashboardPage'));
const MyPagesPage = lazy(() => import('./pages/business/pages/MyPagesPage'));
const AdminConsolePage = lazy(() => import('./pages/admin/AdminConsolePage'));
const GroupAdminPage = lazy(() => import('./pages/community/groups/admin/GroupAdminPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/legal/TermsAndConditions'));
const CommunityGuidelines = lazy(() => import('./pages/legal/CommunityGuidelines'));
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));

/**
 * CommunityRedirect: used by the index route when logged in.
 * Sets the forceRefresh flag so CommunityPage always opens on the
 * Community Feed tab (not Groups) after login / home-page redirect.
 */
function CommunityRedirect() {
    try {
        sessionStorage.setItem('ll:community:forceRefresh', '1');
    } catch {
        // ignore
    }
    return <Navigate to="/community" replace />;
}

/** Redirect old /u/:handleOrId links to /:handleOrId */
function LegacyUserRedirect() {
    const { handleOrId } = useParams();
    return <Navigate to={`/${handleOrId}`} replace />;
}

/** Redirect old /music/artists/:artistId/admin → /artists/:artistId/admin */
function LegacyMusicAdminRedirect() {
    const { artistId } = useParams();
    return <Navigate to={`/artists/${artistId}/admin`} replace />;
}

/**
 * PostPageKeyed: wraps PostPage with a key={postId} so React fully
 * remounts the component when navigating between different posts
 * (e.g. clicking multiple notification items in the Header).
 */
function PostPageKeyed({ user }) {
    const { postId } = useParams();
    return (
        <Suspense fallback={null}>
            <PostPage key={postId} user={user} />
        </Suspense>
    );
}

/**
 * BusinessOrArtistPostRoute: handles /:slug/posts/:postId
 * Uses the unified resolve endpoint to determine entity type, then renders.
 */
function BusinessOrArtistPostRoute({ user }) {
    const { slug, postId } = useParams();
    const [state, setState] = useState('loading');
    const [entityType, setEntityType] = useState(null);
    const [networkFailed, setNetworkFailed] = useState(false);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const result = await resolveProfile(slug);
                if (!active) return;

                if (result?.type === 'business' || result?.type === 'artist') {
                    setEntityType(result.type);
                    setState('ok');
                } else {
                    setState('notfound');
                }
            } catch (err) {
                if (!active) return;
                if (isNetworkError(err)) setNetworkFailed(true);
                setState('notfound');
            }
        })();

        return () => { active = false; };
    }, [slug, postId]);

    if (state === 'loading') return null;

    if (state === 'ok') {
        if (entityType === 'business') {
            return (
                <Suspense fallback={null}>
                    <BusinessPostPage key={postId} user={user} />
                </Suspense>
            );
        }
        if (entityType === 'artist') {
            return (
                <Suspense fallback={null}>
                    <ArtistPostPage key={postId} />
                </Suspense>
            );
        }
    }

    if (networkFailed) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }

    return <NotFound />;
}

/**
 * ProfileOrBusinessOrArtistRoute: handles /:slug for users, businesses, artists, AND groups.
 * Checks in order: artist -> business -> user -> group -> 404
 * Renders the appropriate page.
 */
function ProfileOrBusinessOrArtistRoute({ me }) {
    const { handleOrId } = useParams();
    const [state, setState] = useState('loading');
    const [entityType, setEntityType] = useState(null);
    const [artistData, setArtistData] = useState(null);
    const [networkFailed, setNetworkFailed] = useState(false);

    // ── Instant restore: if returning from an event/post sub-page, skip the
    //    loading→null phase that resets scroll to 0.  Check sessionStorage
    //    synchronously in useState so the very first render produces a real
    //    component instead of null. ──
    const [restoredEntity] = useState(() => {
        if (!handleOrId) return null;
        try {
            if (sessionStorage.getItem(`ll:artistProfile:${handleOrId}:restore`) === '1') {
                return 'artist';
            }
        } catch { /* ignore */ }
        return null;
    });

    // Also restore cached artist data so ArtistProfilePage renders immediately
    // (loading=false) with no placeholder/skeleton DOM swap.
    const [restoredArtistData] = useState(() => {
        if (!handleOrId) return null;
        try {
            const raw = sessionStorage.getItem(`ll:artistProfile:${handleOrId}:cachedData`);
            if (raw) return JSON.parse(raw);
        } catch { /* ignore */ }
        return null;
    });

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const result = await resolveProfile(handleOrId);
                if (!active) return;

                if (result?.type) {
                    setEntityType(result.type);
                    if (result.type === 'artist') {
                        // Fetch full artist data so ArtistProfilePage can render immediately
                        try {
                            const base = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
                            const artistRes = await secureFetch(
                                `${base}/api/music/artists/${encodeURIComponent(handleOrId)}`,
                                { credentials: 'include' }
                            );
                            if (artistRes.ok) {
                                const data = await artistRes.json();
                                setArtistData(data);
                            }
                        } catch { /* ignore — page will fetch its own data */ }
                    }
                    setState('ok');
                } else {
                    setState('notfound');
                }
            } catch (err) {
                if (!active) return;
                if (isNetworkError(err)) setNetworkFailed(true);
                setState('notfound');
            }
        })();

        return () => { active = false; };
    }, [handleOrId]);

    // ── Instant render for restored artist ──
    if (restoredEntity === 'artist' && state === 'loading') {
        return (
            <Suspense fallback={null}>
                <ArtistProfilePage cachedData={restoredArtistData} />
            </Suspense>
        );
    }

    if (state === 'loading') return null;

    if (state === 'ok') {
        if (entityType === 'user') return <UserProfilePage me={me} />;
        if (entityType === 'business') {
            return (
                <Suspense fallback={null}>
                    <BusinessPublicPage user={me} />
                </Suspense>
            );
        }
        if (entityType === 'artist') {
            return (
                <Suspense fallback={null}>
                    <ArtistProfilePage cachedData={artistData} />
                </Suspense>
            );
        }
        if (entityType === 'group') {
            // Render GroupPage directly at /:groupUsername — no redirect needed.
            return <GroupPage groupUsername={handleOrId} />;
        }
    }

    if (networkFailed) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }

    return <NotFound />;
}

/** Simple admin gate for routes that should only be visible to admins */
function AdminGate({ me, children }) {
    const u = me || null;
    // SECURITY: Only check the canonical is_local_lantern_admin field.
    // Loose checks like is_admin, role === 'admin', or account_type === 'admin'
    // could accidentally grant access to non-admin users or be spoofed.
    const isAdmin = Boolean(
        Number(u?.is_local_lantern_admin) === 1 ||
        u?.is_local_lantern_admin === true
    );
    if (!isAdmin) return <NotFound />;
    return <>{children}</>;
}

/** Resolves /:slug/admin — checks if slug is a business or group, renders the right admin page */
function SlugAdminRoute() {
    const { slug } = useParams();
    const [resolved, setResolved] = useState(null); // 'business' | 'group' | 'notfound'

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const result = await resolveProfile(slug);
                if (!active) return;

                if (result?.type === 'business' || result?.type === 'group') {
                    setResolved(result.type);
                } else {
                    setResolved('notfound');
                }
            } catch {
                if (active) setResolved('notfound');
            }
        })();

        return () => { active = false; };
    }, [slug]);

    if (resolved === null) return null;
    if (resolved === 'business') return <BusinessAdminPage />;
    if (resolved === 'group') return <GroupAdminPage groupUsername={slug} />;
    return <NotFound />;
}

/**
 * PageFadeWrapper
 * ---------------
 * Wraps the routed page content and applies a smooth opacity fade whenever
 * the top-level route segment changes (tab navigation) OR the user re-clicks
 * the same tab (detected via location.state._ts).  Also listens for
 * `ll:page:fadeOut` custom events dispatched by the Header so the fade-out
 * starts immediately on click, before the route actually changes.
 *
 * Duration matches the community/business tab-fade (160ms default).
 */
const PAGE_FADE_MS = 160;

function PageFadeWrapper({ children }) {
    const location = useLocation();
    const [opacity, setOpacity] = useState(1);
    const prevKeyRef = useRef('');
    const fadeTimerRef = useRef(null);
    const safetyTimerRef = useRef(null);

    // Build a composite key: segment + timestamp so same-tab re-clicks are detected
    const segment = (location.pathname.split('/')[1] || '').toLowerCase();
    const navTs = location.state?._ts || '';
    const navKey = `${segment}::${navTs}`;

    // When the navigation key changes, fade in the new content
    useEffect(() => {
        const prev = prevKeyRef.current;
        prevKeyRef.current = navKey;

        // Skip initial mount
        if (!prev) return;

        if (prev !== navKey) {
            // New page mounted (or same page re-navigated) — fade in
            setOpacity(0);
            const raf = requestAnimationFrame(() => setOpacity(1));
            return () => cancelAnimationFrame(raf);
        }
    }, [navKey]);

    // Safety net: whenever location changes (pathname or search), ensure opacity
    // is restored to 1 after the transition duration.  This catches edge cases
    // where the fadeOut event fired but navKey didn't change (same-segment
    // navigation, missing _ts, profile→business on the same /:slug route, etc.).
    useEffect(() => {
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = setTimeout(() => {
            setOpacity((cur) => (cur === 0 ? 1 : cur));
        }, PAGE_FADE_MS + 50);
        return () => { if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current); };
    }, [location.pathname, location.search]);

    // Listen for the Header's pre-navigation fade-out event
    useEffect(() => {
        const onFadeOut = () => {
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
            setOpacity(0);
        };
        window.addEventListener('ll:page:fadeOut', onFadeOut);
        return () => {
            window.removeEventListener('ll:page:fadeOut', onFadeOut);
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        };
    }, []);

    return (
        <Box
            sx={{
                opacity,
                transition: `opacity ${PAGE_FADE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                minHeight: '100%',
            }}
        >
            {children}
        </Box>
    );
}

/**
 * useScrollUnlock — clears stale overflow:hidden on every route change.
 * MUI modals/drawers sometimes fail to clean up when a user navigates
 * away mid-transition, leaving the page frozen. This hook ensures a
 * clean slate on every navigation.
 */
function useScrollUnlock() {
    const location = useLocation();

    useEffect(() => {
        // Small delay so MUI transition cleanup callbacks run first
        const timer = setTimeout(() => {
            // Only clear if no modal is currently open
            const hasOpenModal = document.querySelector(
                '.MuiModal-root, .MuiDrawer-root, .MuiDialog-root, [role="dialog"]'
            );
            if (hasOpenModal) return;

            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = '';
            }
            if (document.documentElement.style.overflow === 'hidden') {
                document.documentElement.style.overflow = '';
            }
            if (document.body.style.paddingRight) {
                document.body.style.paddingRight = '';
            }
            // Clear stale aria-hidden on app root
            const root = document.getElementById('root');
            if (root?.getAttribute('aria-hidden') === 'true') {
                root.removeAttribute('aria-hidden');
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [location.pathname, location.key]);
}

/** Child shell that CONSUMES the auth context (must be under provider) */
function AppShell() {
    useScrollUnlock();
    const { user, status, refresh, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const location = useLocation();
    const appTheme = useTheme();
    const isMobile = useMediaQuery(appTheme.breakpoints.down('md'));

    const handleLogin = async () => {
        await refresh({ silent: true });
    };
    const handleLogout = () => {
        logout();
    };

    const isLoggedIn = Boolean(user?.id);

    // Keep header's selected tab in sync with the URL for top-level tabs.
    useEffect(() => {
        const first = (location.pathname.split('/')[1] || '').toLowerCase();
        const tabMap = {
            // Homepage doesn't highlight any tab
            '': '',
            community: 'Community',
            events: 'Events',
            jobs: 'Jobs',
            business: 'Businesses',
            music: 'Music',
            services: 'Services',
            marketplace: 'Marketplace',
            deals: 'Deals',
            'real-estate': 'Real Estate',
        };
        if (Object.prototype.hasOwnProperty.call(tabMap, first)) {
            setActiveTab(tabMap[first]);
        }
    }, [location.pathname, isLoggedIn]);

    // Avoid flashing UI until the first auth check completes
    // But force render after 2 seconds so site isn't stuck on blank page
    const [forceRender, setForceRender] = useState(false);
    useEffect(() => {
        if (status === 'loading' && !forceRender) {
            const timer = setTimeout(() => setForceRender(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [status, forceRender]);

    if (status === 'loading' && !forceRender) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        border: '3px solid',
                        borderColor: 'grey.300',
                        borderTopColor: 'primary.main',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                        },
                    }}
                />
            </Box>
        );
    }

    return (
        <Routes>
            {/* ─── Homepage — no header/Layout ─── */}
            {!isLoggedIn && (
                <Route index element={<HomePage />} />
            )}

            {/* ─── All routes inside Layout (with Header) ─── */}
            <Route
                path="/*"
                element={
                    <Layout
                        user={user}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    >
                        <CreateFromAnywhere />
                        <PageFadeWrapper>
                            <Routes>
                                {/* Home — logged in goes to community */}
                                <Route
                                    index
                                    element={
                                        isLoggedIn
                                            ? <CommunityRedirect />
                                            : <Navigate to="/" replace />
                                    }
                                />

                                {/* Auth */}
                                <Route
                                    path="login"
                                    element={<Login onLogin={handleLogin} showTitle title="Log In" />}
                                />
                                <Route path="register" element={<Register />} />
                                <Route path="onboarding" element={<OnboardingPage />} />
                                <Route path="reset-password" element={<ResetPasswordPage />} />
                                {/* OAuth relay — AuthModalContext handles the token exchange + redirect */}
                                <Route path="social-login-success" element={<Box sx={{ minHeight: '60vh' }} />} />
                                <Route path="privacy" element={<PrivacyPolicy />} />
                                <Route path="terms" element={<TermsAndConditions />} />
                                <Route path="guidelines" element={<CommunityGuidelines />} />
                                <Route path="legal" element={<LegalPage />} />

                                {/* Social (site section; not OAuth) — logged-in only */}
                                <Route
                                    path="social"
                                    element={
                                        isLoggedIn
                                            ? <SocialHome user={user} />
                                            : <Navigate to="/login?redirect=%2Fsocial" replace />
                                    }
                                />

                                {/* Messages */}
                                <Route path="messages" element={<MessagesPage user={user} />} />

                                {/* Notifications */}
                                <Route path="notifications" element={<NotificationsPage />} />

                                {/* Community post */}
                                <Route path="posts/:postId" element={<PostPageKeyed user={user} />} />

                                {/* News article (Slice 3) */}
                                <Route path="news/article/:id" element={<NewsPage />} />

                                {/* Community page */}
                                <Route path="community" element={<CommunityPage user={user} />} />

                                {/* Events page */}
                                <Route path="events" element={<EventsPage user={user} />} />
                                <Route path="events/:eventId" element={<EventPostPage user={user} />} />

                                {/* Group page (dedicated) */}
                                <Route path="groups/:groupId" element={<GroupPage />} />
                                <Route path="groups/:groupId/admin" element={<GroupAdminPage />} />

                                {/* Business Hub & Setup */}
                                <Route path="business" element={<BusinessHubPage user={user} />} />
                                <Route path="business/setup" element={<BusinessSetupPage />} />
                                <Route path="business/admin/setup" element={<BusinessAdminPage />} />
                                <Route path="business/join/:token" element={<BusinessJoinPage />} />

                                {/* Jobs */}
                                <Route path="jobs/:jobId" element={<JobDetail user={user} />} />
                                <Route path="jobs" element={<JobsPage user={user} />} />

                                {/* Artists (musicians + visual artists) - main page only, profiles handled by /:handle */}
                                <Route path="artists/setup" element={<ArtistAdminConsole user={user} />} />
                                <Route path="artists" element={<MusicPage user={user} />} />
                                <Route path="artists/:artistId/admin" element={<ArtistAdminConsole user={user} />} />

                                {/* Legacy /music redirects → /artists (preserves old links & bookmarks) */}
                                <Route path="music/artist/setup" element={<Navigate to="/artists/setup" replace />} />
                                <Route path="music" element={<Navigate to="/artists" replace />} />
                                <Route path="music/artists/:artistId/admin" element={<LegacyMusicAdminRedirect />} />

                                {/* Services */}
                                <Route path="services" element={<ServicesPage user={user} />} />
                                <Route path="services/create" element={<CreateServicePage />} />
                                <Route path="services/edit/:serviceId" element={<CreateServicePage />} />
                                <Route path="services/requests/:requestId" element={<ServiceRequestDetailPage user={user} />} />
                                <Route path="services/:serviceId/console" element={<ServiceAdminConsole user={user} />} />
                                <Route path="services/:serviceId" element={<ServiceDetailPage user={user} />} />

                                {/* Marketplace */}
                                <Route path="marketplace" element={<MarketplacePage user={user} />} />
                                <Route path="marketplace/:listingId" element={<ListingDetailPage user={user} />} />

                                {/* Other tabs */}
                                <Route path="deals" element={<Navigate to="/community" replace />} />
                                <Route path="real-estate" element={<Navigate to="/community" replace />} />

                                {/* Account */}
                                <Route path="account/notifications" element={<NotificationSettingsPage />} />
                                <Route path="account" element={<AccountSettingsPage user={user} />} />
                                <Route path="account/*" element={<AccountSettingsPage user={user} />} />

                                {/* Admin Console */}
                                <Route
                                    path="admin"
                                    element={
                                        <AdminGate me={user}>
                                            <AdminConsolePage user={user} />
                                        </AdminGate>
                                    }
                                />

                                {/* Pages (Business Dashboard) */}
                                <Route path="pages" element={<MyPagesPage />} />
                                <Route path="pages/:pageId" element={<PageDashboardPage />} />
                                <Route path="pages/:pageId/team" element={<PageTeamPage />} />
                                <Route path="pages/invite" element={<PageInviteAcceptPage />} />

                                {/* Legacy user profile redirect */}
                                <Route path="u/:handleOrId" element={<LegacyUserRedirect />} />

                                {/*
                              Smart Admin Route — resolves slug to business or group,
                              then renders the correct admin console.
                              Handles URLs like /joes-pizza/admin OR /my-group-123/admin
                            */}
                                <Route path=":slug/admin" element={<SlugAdminRoute />} />

                                {/*
                              Business or Artist Post Page - smart route that checks both
                              Handles URLs like /joes-pizza/posts/123 or /cool-band/posts/456
                            */}
                                <Route path=":slug/posts/:postId" element={<BusinessOrArtistPostRoute user={user} />} />

                                {/*
                              Combined User Profile / Business Public Page / Artist Profile route.
                              This handles /:slug and checks for users first, then businesses, then artists.
                              All entities are accessible at /their-handle directly (e.g., /joes-pizza, /cool-band)
                            */}
                                <Route path=":handleOrId" element={<ProfileOrBusinessOrArtistRoute me={user} />} />

                                {/* Catch-all */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </PageFadeWrapper>
                        {/* Footer removed — privacy/legal links now live in sidebar menus */}
                    </Layout>
                }
            />
        </Routes>
    );
}

/**
 * AuthLoginPopup — renders the login popup dialog INSIDE ThemeBridge
 * so it inherits the Lantern theme instead of MUI's default purple.
 */
function AuthLoginPopup() {
    const { loginOpen, closeLogin, popupTitle, setPopupTitle, handlePopupLogin } = useAuth();
    return (
        <LoginPopupDialog
            open={loginOpen}
            onClose={closeLogin}
            onLogin={handlePopupLogin}
            title={popupTitle}
            onTitleChange={setPopupTitle}
        />
    );
}

/**
 * ThemeBridge — reads the user from AuthContext and activeAccount from
 * AccountContext, then passes both to ThemeContextProvider so theme
 * switching and per-account DB persistence work correctly.
 * Must be rendered inside both AuthModalProvider and AccountProvider.
 */
function ThemeBridge({ children }) {
    const { user } = useAuth();
    const activeAccount = useActiveAccount();
    return (
        <ThemeContextProvider user={user} activeAccount={activeAccount}>
            {children}
            <AuthLoginPopup />
        </ThemeContextProvider>
    );
}

export default function App() {
    // Hide the native Capacitor splash screen as soon as React has
    // mounted and painted. The native splash uses the same #0F2D52
    // background as <AppSplash />, so the handoff is seamless: the
    // native splash fades out while the React Ken Burns splash is
    // already rendered underneath at the same color.
    //
    // We wait one frame (requestAnimationFrame) before hiding so React
    // has guaranteed-painted at least once — without this you can get
    // a brief flash on slower devices.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const raf = requestAnimationFrame(() => {
            SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {
                // Plugin may not be installed in some build flavors;
                // failing silently is fine — the splash will auto-hide
                // after launchShowDuration anyway.
            });
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <Router>
            {/* AppSplash lives inside Router so it can read the current
                pathname via useLocation() and only render on the home page.
                It also self-gates to mobile viewports only. */}
            <AppSplash />
            <AuthModalProvider>
                <AccountProvider>
                    <ThemeBridge>
                        <Suspense fallback={null}>
                            <AppShell />
                        </Suspense>
                    </ThemeBridge>
                </AccountProvider>
            </AuthModalProvider>
        </Router>
    );
}

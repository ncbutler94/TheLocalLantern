// src/components/CreateFromAnywhere.jsx
// ---------------------------------------------------------------------------
// Global listener for "ll:header:create" events dispatched by the Header's
// create (+) menu.  Renders NewPostDialogs (community posts),
// CreateGroupModal, CreateBusinessPostDialog, and CreateEditEventModal
// wherever the user happens to be in the app.
//
// Page-level deference:
//   /community  → CommunityPage handles communityPost + group
//   /business   → BusinessHubPage handles businessPost
//   /events     → EventsPage handles event
// This component skips actions that the current page already owns.
//
// Rate limiting (defense-in-depth — Header already checks before dispatch):
//   community-post  → burstMax 3 / 60 s, 15 / hr
//   community-post  → also used for business posts (shared bucket)
//   community-group → burstMax 2 / 60 s,  5 / hr
//   event-create    → burstMax 3 / 120 s, 10 / hr
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

import NewPostDialogs from '../pages/community/NewCommunityPosts/NewPostDialogs';
import SmartPostDialog from '../pages/community/NewCommunityPosts/SmartPostDialog';
import usePostHandlers from '../pages/community/NewCommunityPosts/usePostHandlers';
import useMediaQuery from '@mui/material/useMediaQuery';
import CreateGroupModal from '../pages/community/groups/CreateGroupModal';
import CreateBusinessPostDialog from '../pages/business/components/CreateBusinessPostDialog';
import CreateArtistPostDialog from '../pages/music/components/CreateArtistPostDialog';
import CreateEditEventModal from '../pages/events/modals/CreateEditEventModal';
import CreateJobModal from '../pages/jobs/modals/CreateJobModal';
import CreateServiceRequestModal from '../pages/services/modals/CreateServiceRequestModal';
import CreateListingModal from '../pages/marketplace/modals/CreateListingModal';
import RateLimitDialog from './RateLimitDialog';
import SuccessSnackbar, { useSuccessSnackbar } from './SuccessSnackbar';
import useRateLimit from '../utils/useRateLimit';
import { useActiveAccount } from './AccountContext';
import { useAuth } from './AuthModalContext';
import { secureFetch } from '../utils/secureFetch';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateFromAnywhere() {
    const location = useLocation();
    const navigate = useNavigate();

    // ── Auth context (user object for event modal) ───────────────────────
    const { user: authUser, openLogin } = useAuth();

    // ── Resolve user (authUser may not have full profile — fetch if needed)
    const [resolvedUser, setResolvedUser] = useState(authUser || null);
    const userFetched = useRef(false);

    useEffect(() => {
        if (authUser) { setResolvedUser(authUser); return; }
        if (userFetched.current) return;
        userFetched.current = true;
        let alive = true;
        secureFetch('/users/profile', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!alive) return;
                const u = data?.user || data;
                if (u && (u.id || u.user_id)) setResolvedUser(u);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, [authUser]);

    // ── Active account context (needed for business/artist post dialog props) ─
    const {
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
        activeAccount,
    } = useActiveAccount();

    // ── Page-level deference ──────────────────────────────────────────────
    const isOnCommunityPage = /^\/community(\/|$)/.test(location.pathname);
    const isOnBusinessPage = /^\/business(\/|$)/.test(location.pathname);
    const isOnEventsPage = /^\/events(\/|$)/.test(location.pathname);
    const isOnMusicPage = /^\/music(\/|$)/.test(location.pathname);
    const isOnJobsPage = /^\/jobs(\/|$)/.test(location.pathname);
    const isOnServicesPage = /^\/services(\/|$)/.test(location.pathname);

    // ── Rate limiters (mirrors Header + page configs) ────────────────────
    const { checkLimit: checkCommunityPostLimit, recordAction: recordCommunityPost } =
        useRateLimit('community-post', {
            burstMax: 3,
            burstWindowMs: 60_000,
            maxPerHour: 15,
        });

    const { checkLimit: checkBusinessPostLimit, recordAction: recordBusinessPost } =
        useRateLimit('community-post', {
            burstMax: 3,
            burstWindowMs: 60_000,
            maxPerHour: 15,
        });

    const { checkLimit: checkGroupLimit, recordAction: recordGroupAction } =
        useRateLimit('community-group', {
            burstMax: 2,
            burstWindowMs: 60_000,
            maxPerHour: 5,
        });

    const { checkLimit: checkEventLimit, recordAction: recordEventCreate } =
        useRateLimit('event-create', {
            burstMax: 3,
            burstWindowMs: 120_000,
            maxPerHour: 10,
        });

    const { checkLimit: checkJobLimit, recordAction: recordJobCreate } =
        useRateLimit('job-create', {
            burstMax: 3,
            burstWindowMs: 120_000,
            maxPerHour: 10,
        });

    const { checkLimit: checkServiceRequestLimit } =
        useRateLimit('service-request', {
            burstMax: 3,
            burstWindowMs: 120_000,
            maxPerHour: 10,
        });

    // ── Community new-post dialog state (step 1 → step 2) ────────────────
    const [stepOneOpen, setStepOneOpen] = useState(false);
    const [stepTwoOpen, setStepTwoOpen] = useState(false);
    const [stepOneData, setStepOneData] = useState(null);

    // ── Smart dialog (mobile: picker-first single dialog) ─────────────────
    const [smartOpen, setSmartOpen] = useState(false);
    const postHandlers = usePostHandlers();
    const isMobile = useMediaQuery('(max-width:1439px)');

    // ── Business post dialog state ───────────────────────────────────────
    const [businessPostOpen, setBusinessPostOpen] = useState(false);

    // ── Artist post dialog state ─────────────────────────────────────────
    const [artistPostOpen, setArtistPostOpen] = useState(false);

    // ── Create-group dialog state ────────────────────────────────────────
    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    // ── Event create dialog state ────────────────────────────────────────
    const [eventCreateOpen, setEventCreateOpen] = useState(false);

    // ── Job create dialog state ──────────────────────────────────────────
    const [jobCreateOpen, setJobCreateOpen] = useState(false);

    // ── Service request dialog state ─────────────────────────────────────
    const [serviceRequestOpen, setServiceRequestOpen] = useState(false);

    // ── Marketplace listing dialog state ──────────────────────────────────
    const [listingCreateOpen, setListingCreateOpen] = useState(false);

    // ── Yard sale dialog state ────────────────────────────────────────────
    const [yardSaleCreateOpen, setYardSaleCreateOpen] = useState(false);

    // ── Rate-limit dialog ────────────────────────────────────────────────
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'posts',
    });

    // ── Switch-account dialog ────────────────────────────────────────────
    const [switchAccountDialog, setSwitchAccountDialog] = useState({
        open: false,
        message: '',
    });

    // ── Success snackbar ─────────────────────────────────────────────────
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // ── Server-side categories for CategoryPopup (lazy-loaded) ───────────
    const [categories, setCategories] = useState([]);
    const categoriesFetched = useRef(false);

    const ensureCategories = useCallback(() => {
        if (categoriesFetched.current) return;
        categoriesFetched.current = true;
        fetch('/api/community/categories')
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(() => {});
    }, []);

    // ── Handlers: Community Post ─────────────────────────────────────────

    const openStepOne = useCallback(() => {
        const result = checkCommunityPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'posts',
            });
            setRateLimitOpen(true);
            return;
        }
        ensureCategories();
        setStepOneOpen(true);
    }, [checkCommunityPostLimit, ensureCategories]);

    const handleCategoryChosen = useCallback((data) => {
        setStepOneData(data);
        setStepOneOpen(false);
        setStepTwoOpen(true);
    }, []);

    const handlePostRefresh = useCallback(() => {
        recordCommunityPost();
        setStepOneOpen(false);
        setStepTwoOpen(false);
        setStepOneData(null);
        showSuccess('Your post was published!');
        navigate('/community', { state: { llCommunityReset: Date.now() } });
    }, [recordCommunityPost, navigate]);

    // ── Handlers: Business Post ──────────────────────────────────────────

    const openBusinessPost = useCallback(() => {
        const result = checkBusinessPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'posts',
            });
            setRateLimitOpen(true);
            return;
        }
        setBusinessPostOpen(true);
    }, [checkBusinessPostLimit]);

    const handleBusinessPostCreated = useCallback(() => {
        recordBusinessPost();
        setBusinessPostOpen(false);
        showSuccess('Your business post was published!');
        navigate('/business');
    }, [recordBusinessPost, navigate]);

    // ── Handlers: Artist Post ────────────────────────────────────────────

    const openArtistPost = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        // Artist posts share the community-post rate limit bucket
        const result = checkCommunityPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'posts',
            });
            setRateLimitOpen(true);
            return;
        }
        setArtistPostOpen(true);
    }, [resolvedUser, openLogin, checkCommunityPostLimit]);

    const handleArtistPostCreated = useCallback(() => {
        recordCommunityPost(); // shared bucket
        setArtistPostOpen(false);
        showSuccess('Your music post was published!');
        navigate('/music');
    }, [recordCommunityPost, navigate]);

    // ── Handlers: Group ──────────────────────────────────────────────────

    const handleOpenCreateGroup = useCallback(() => {
        const result = checkGroupLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'groups',
            });
            setRateLimitOpen(true);
            return;
        }
        setCreateGroupOpen(true);
    }, [checkGroupLimit]);

    const handleGroupCreated = useCallback(
        (created) => {
            recordGroupAction();
            setCreateGroupOpen(false);
            showSuccess('Your group was created!');
            if (created?.slug || created?.group_username) {
                const target = created.group_username || created.slug;
                navigate(`/community/groups/${target}`);
            } else {
                navigate('/community', { state: { llCommunityReset: Date.now() } });
            }
        },
        [recordGroupAction, navigate],
    );

    // ── Handlers: Event ──────────────────────────────────────────────────

    const openEventCreate = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        const result = checkEventLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'event creation',
            });
            setRateLimitOpen(true);
            return;
        }
        setEventCreateOpen(true);
    }, [resolvedUser, openLogin, checkEventLimit]);

    const handleEventSaved = useCallback(() => {
        recordEventCreate();
        setEventCreateOpen(false);
        showSuccess('Event created successfully!');
        // Navigate to events so they can see it
        navigate('/events');
    }, [recordEventCreate, navigate]);

    const handleEventClose = useCallback(() => {
        setEventCreateOpen(false);
    }, []);

    // ── Handlers: Job ────────────────────────────────────────────────────

    const openJobCreate = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        const result = checkJobLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'job postings',
            });
            setRateLimitOpen(true);
            return;
        }
        setJobCreateOpen(true);
    }, [resolvedUser, openLogin, checkJobLimit]);

    const handleJobCreated = useCallback(() => {
        recordJobCreate();
        setJobCreateOpen(false);
        showSuccess('Job posted successfully!');
        navigate('/jobs');
    }, [recordJobCreate, navigate]);

    const handleJobClose = useCallback(() => {
        setJobCreateOpen(false);
    }, []);

    // ── Handlers: Service Request ────────────────────────────────────────

    const openServiceRequest = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        const result = checkServiceRequestLimit();
        if (!result.allowed) {
            setRateLimitInfo({
                retryAfterSec: result.retryAfterSec,
                reason: result.reason,
                actionLabel: 'service requests',
            });
            setRateLimitOpen(true);
            return;
        }
        setServiceRequestOpen(true);
    }, [resolvedUser, openLogin, checkServiceRequestLimit]);

    const handleServiceRequestSuccess = useCallback(() => {
        setServiceRequestOpen(false);
        showSuccess('Service request posted successfully!');
        navigate('/services');
    }, [navigate]);

    // ── Handlers: Service (navigate to create page) ──────────────────────

    const openServiceCreate = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        navigate('/services/create');
    }, [resolvedUser, openLogin, navigate]);

    // ── Handlers: Marketplace Listing ────────────────────────────────

    const openListingCreate = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        setListingCreateOpen(true);
    }, [resolvedUser, openLogin]);

    const handleListingCreated = useCallback(() => {
        setListingCreateOpen(false);
        showSuccess('Listing created!');
        navigate('/marketplace');
    }, [navigate]);

    // ── Handlers: Yard Sale ──────────────────────────────────────────

    const openYardSaleCreate = useCallback(() => {
        if (!resolvedUser) {
            openLogin();
            return;
        }
        setYardSaleCreateOpen(true);
    }, [resolvedUser, openLogin]);

    const handleYardSaleCreated = useCallback(() => {
        setYardSaleCreateOpen(false);
        showSuccess('Yard sale posted!');
        navigate('/marketplace');
    }, [navigate]);

    // ── Stable refs for the event listener ────────────────────────────────
    const openStepOneRef = useRef(openStepOne);
    openStepOneRef.current = openStepOne;
    const openBusinessPostRef = useRef(openBusinessPost);
    openBusinessPostRef.current = openBusinessPost;
    const openArtistPostRef = useRef(openArtistPost);
    openArtistPostRef.current = openArtistPost;
    const handleOpenCreateGroupRef = useRef(handleOpenCreateGroup);
    handleOpenCreateGroupRef.current = handleOpenCreateGroup;
    const openEventCreateRef = useRef(openEventCreate);
    openEventCreateRef.current = openEventCreate;
    const openJobCreateRef = useRef(openJobCreate);
    openJobCreateRef.current = openJobCreate;
    const openServiceRequestRef = useRef(openServiceRequest);
    openServiceRequestRef.current = openServiceRequest;
    const openServiceCreateRef = useRef(openServiceCreate);
    openServiceCreateRef.current = openServiceCreate;
    const isOnCommunityPageRef = useRef(isOnCommunityPage);
    isOnCommunityPageRef.current = isOnCommunityPage;
    const isOnBusinessPageRef = useRef(isOnBusinessPage);
    isOnBusinessPageRef.current = isOnBusinessPage;
    const isOnEventsPageRef = useRef(isOnEventsPage);
    isOnEventsPageRef.current = isOnEventsPage;
    const isOnMusicPageRef = useRef(isOnMusicPage);
    isOnMusicPageRef.current = isOnMusicPage;
    const isOnJobsPageRef = useRef(isOnJobsPage);
    isOnJobsPageRef.current = isOnJobsPage;
    const isOnServicesPageRef = useRef(isOnServicesPage);
    isOnServicesPageRef.current = isOnServicesPage;
    // NEW: track mobile state for the event listener closure
    const isMobileRef = useRef(isMobile);
    isMobileRef.current = isMobile;
    const openListingCreateRef = useRef(openListingCreate);
    openListingCreateRef.current = openListingCreate;
    const openYardSaleCreateRef = useRef(openYardSaleCreate);
    openYardSaleCreateRef.current = openYardSaleCreate;

    // ── Global event listener ────────────────────────────────────────────
    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};

            // ── Page-level deference ──
            if (isOnCommunityPageRef.current && (action === 'communityPost' || action === 'group')) return;
            if (isOnBusinessPageRef.current && action === 'businessPost') return;
            if (isOnEventsPageRef.current && action === 'event') return;
            if (isOnMusicPageRef.current && action === 'artistPost') return;
            if (isOnJobsPageRef.current && action === 'job') return;
            if (isOnServicesPageRef.current && (action === 'service' || action === 'serviceRequest')) return;

            // Only handle known actions
            if (action !== 'communityPost' && action !== 'group' && action !== 'businessPost' && action !== 'event' && action !== 'artistPost' && action !== 'job' && action !== 'service' && action !== 'serviceRequest' && action !== 'listing' && action !== 'yardSale') return;

            // ── Blocked: wrong account type ──
            if (blocked === 'account') {
                setSwitchAccountDialog({
                    open: true,
                    message:
                        action === 'group'
                            ? 'Groups are designed for a personal experience. Switch to your personal account to create a group.'
                            : action === 'businessPost'
                                ? 'Switch to your business account to create a business post.'
                                : action === 'artistPost'
                                    ? 'Switch to your music account to create a music post.'
                                    : (action === 'listing' || action === 'yardSale')
                                        ? 'Marketplace listings can only be created from a personal account. Please switch to your personal profile.'
                                        : 'Community posts are for personal accounts. Switch to your personal profile to create a post.',
                });
                return;
            }

            // ── Blocked: rate limit ──
            if (blocked === 'rateLimit') {
                setRateLimitInfo({
                    retryAfterSec: retryAfterSec || 10,
                    reason: reason || 'cooldown',
                    actionLabel: action === 'group' ? 'groups' : action === 'event' ? 'event creation' : action === 'job' ? 'job postings' : action === 'serviceRequest' ? 'service requests' : action === 'service' ? 'services' : (action === 'listing' || action === 'yardSale') ? 'listings' : 'posts',
                });
                setRateLimitOpen(true);
                return;
            }

            // ── Allowed — open the appropriate dialog ──
            if (action === 'communityPost') {
                // Mobile: open the smart dialog (single-dialog, picker-first).
                // Desktop: open the legacy 2-dialog flow.
                if (isMobileRef.current) {
                    setSmartOpen(true);
                } else {
                    openStepOneRef.current();
                }
            } else if (action === 'businessPost') {
                openBusinessPostRef.current();
            } else if (action === 'artistPost') {
                openArtistPostRef.current();
            } else if (action === 'group') {
                handleOpenCreateGroupRef.current();
            } else if (action === 'event') {
                openEventCreateRef.current();
            } else if (action === 'job') {
                openJobCreateRef.current();
            } else if (action === 'service') {
                openServiceCreateRef.current();
            } else if (action === 'serviceRequest') {
                openServiceRequestRef.current();
            } else if (action === 'listing') {
                openListingCreateRef.current();
            } else if (action === 'yardSale') {
                openYardSaleCreateRef.current();
            }
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => {
            window.removeEventListener('ll:header:create', handleHeaderCreate);
        };
    }, []);

    // ── Determine what to render ─────────────────────────────────────────
    const showCommunityDialogs = !isOnCommunityPage;
    const showBusinessDialog = !isOnBusinessPage && isBusinessAccount && activeBusinessId;
    const showArtistDialog = !isOnMusicPage && isArtistAccount && activeArtistId;
    const showGroupDialog = !isOnCommunityPage;
    const showEventDialog = !isOnEventsPage;
    const showJobDialog = !isOnJobsPage;
    const showServiceRequestDialog = !isOnServicesPage;
    const showListingDialog = true;
    const showYardSaleDialog = true;

    return (
        <>
            {/* ═══════════ New Community Post dialogs (Step 1 + Step 2) ═══════════ */}
            {showCommunityDialogs && (
                <NewPostDialogs
                    stepOneOpen={stepOneOpen}
                    stepTwoOpen={stepTwoOpen}
                    stepOneData={stepOneData}
                    onClose1={() => setStepOneOpen(false)}
                    onClose2={() => {
                        setStepTwoOpen(false);
                        setStepOneData(null);
                    }}
                    onCategoryChosen={handleCategoryChosen}
                    onRefresh={handlePostRefresh}
                    subtypes={categories.length ? categories : undefined}
                />
            )}

            {/* ═══════════ Smart Post Dialog (mobile, picker-first) ═══════════
                Used on mobile instead of the legacy 2-dialog flow above. */}
            {showCommunityDialogs && (
                <SmartPostDialog
                    open={smartOpen}
                    initialCategory=""
                    initialTitle=""
                    initialDescription=""
                    onClose={() => setSmartOpen(false)}
                    onRefresh={() => {
                        setSmartOpen(false);
                        handlePostRefresh();
                    }}
                    postHandlers={postHandlers}
                />
            )}

            {/* ═══════════ Create Business Post dialog ═══════════ */}
            {showBusinessDialog && (
                <CreateBusinessPostDialog
                    open={businessPostOpen}
                    onClose={() => setBusinessPostOpen(false)}
                    businessId={activeBusinessId}
                    businessName={activeAccount?.name || activeAccount?.businessName || 'your business'}
                    businessCity={activeAccount?.city || ''}
                    businessCounty={activeAccount?.county || ''}
                    onPostCreated={handleBusinessPostCreated}
                />
            )}

            {/* ═══════════ Create Artist Post dialog ═══════════ */}
            {showArtistDialog && (
                <CreateArtistPostDialog
                    open={artistPostOpen}
                    onClose={() => setArtistPostOpen(false)}
                    artistId={activeArtistId}
                    artistName={activeAccount?.name || 'your music page'}
                    onPostCreated={handleArtistPostCreated}
                />
            )}

            {/* ═══════════ Create Group modal ═══════════ */}
            {showGroupDialog && (
                <CreateGroupModal
                    open={createGroupOpen}
                    onClose={() => setCreateGroupOpen(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}

            {/* ═══════════ Create Event modal ═══════════ */}
            {showEventDialog && (
                <CreateEditEventModal
                    open={eventCreateOpen}
                    onClose={handleEventClose}
                    user={resolvedUser}
                    onSaved={handleEventSaved}
                />
            )}

            {/* ═══════════ Create Job modal ═══════════ */}
            {showJobDialog && (
                <CreateJobModal
                    open={jobCreateOpen}
                    onClose={handleJobClose}
                    onCreated={handleJobCreated}
                />
            )}

            {/* ═══════════ Create Service Request modal ═══════════ */}
            {showServiceRequestDialog && (
                <CreateServiceRequestModal
                    open={serviceRequestOpen}
                    onClose={() => setServiceRequestOpen(false)}
                    onSuccess={handleServiceRequestSuccess}
                />
            )}

            {/* ═══════════ Create Marketplace Listing modal ═══════════ */}
            {showListingDialog && (
                <CreateListingModal
                    open={listingCreateOpen}
                    onClose={() => setListingCreateOpen(false)}
                    onCreated={handleListingCreated}
                    user={resolvedUser}
                />
            )}

            {/* ═══════════ Create Yard Sale modal ═══════════ */}
            {showYardSaleDialog && (
                <CreateListingModal
                    open={yardSaleCreateOpen}
                    onClose={() => setYardSaleCreateOpen(false)}
                    onCreated={handleYardSaleCreated}
                    user={resolvedUser}
                    forceYardSale
                />
            )}

            {/* ═══════════ Switch Account dialog ═══════════ */}
            <Dialog
                open={switchAccountDialog.open}
                onClose={() => setSwitchAccountDialog({ open: false, message: '' })}
                maxWidth="xs"
                fullWidth
                disableScrollLock
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        fontWeight: 900,
                        fontSize: 17,
                        pr: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizRoundedIcon sx={{ color: 'primary.main' }} />
                        Switch Account
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setSwitchAccountDialog({ open: false, message: '' })}
                        aria-label="Close"
                        sx={{ width: 32, height: 32 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {switchAccountDialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => setSwitchAccountDialog({ open: false, message: '' })}
                        disableElevation
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                        }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════ Rate Limit dialog ═══════════ */}
            <RateLimitDialog
                open={rateLimitOpen}
                onClose={() => setRateLimitOpen(false)}
                retryAfterSec={rateLimitInfo.retryAfterSec}
                reason={rateLimitInfo.reason}
                actionLabel={rateLimitInfo.actionLabel}
            />

            {/* ═══════════ Success snackbar ═══════════ */}
            <SuccessSnackbar {...successSnackbarProps} />
        </>
    );
}

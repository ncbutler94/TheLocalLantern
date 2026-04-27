// src/pages/jobs/JobsPage.jsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { secureFetch } from "../../utils/secureFetch";
import { alpha, useTheme } from "@mui/material/styles";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fade,
    FormControlLabel,
    IconButton,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import CloseIcon from "@mui/icons-material/Close";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import SearchInput from "../../components/SearchInput";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";

import JobsList from "./components/JobsList";
import JobsFilterBar from "./components/JobsFilterBar";
import JobsRightPanel from "./components/JobsRightPanel";
import { DiscoverContent } from "./components/JobsRightPanel";
import JobsMapView from "./components/JobsMapView";
import JobDetailPanel from "./components/JobDetailPanel";
import SwipeableRightDrawer from "../../components/SwipeableRightDrawer";
import SwipeableBottomDrawer from "../../components/SwipeableBottomDrawer";
import CreateJobModal from "./modals/CreateJobModal";
import useJobsFeed from "./hooks/useJobsFeed";
import { deleteJob, renewJob, saveJob, fetchJobLocationCounts, fetchJobLimits } from "./api/jobs";
import ShareDialog from "../../components/ShareDialog";
import UserCardPopover from "../../components/UserCardPopover";
import ApplyToJobDialog from "./components/ApplyToJobDialog";
import { useActiveAccount } from "../../components/AccountContext";
import { useAuth } from "../../components/AuthModalContext";
import { isNetworkError } from "../../components/NetworkErrorState";
import { getAccountHeaders } from "../../utils/getAccountHeadersStatic";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import useRateLimit from "../../utils/useRateLimit";
// Continuous subheader scroll-hide (Facebook-style tracking)
import useSubheaderScrollHide from "../../utils/useSubheaderScrollHide";
import RateLimitDialog from "../../components/RateLimitDialog";
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    getCountyCenter,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../utils/geoRadius";

const BOTTOM_GUTTER_PX = 0;
const APP_BACKGROUND = "background.default";
const RIGHT_WIDTH = { xs: "40%", lg: "35%" };
const TAB_FADE_MS = 160;

const MAX_LISTING_DAYS = 90;
const EXTEND_OPTIONS = [7, 14, 30, 60, 90];

/** Returns the number of whole days remaining until expiresAt, floored to 0 for expired. */
const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return 0;
    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.valueOf())) return 0;
    const diffMs = exp.getTime() - Date.now();
    return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : 0;
};

/** Returns a readable date string for a date X days from now. */
const futureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

function normalizeUserCardData(userData) {
    if (!userData) return null;

    const isBusiness = Boolean(
        userData.account_type === "business" ||
        userData.business_id ||
        userData.businessId
    );
    const isArtist = Boolean(
        userData.account_type === "artist" ||
        userData.artist_id ||
        userData.artistId
    );

    const normalized = {
        ...userData,
        id: userData.id ?? userData.user_id ?? userData.userId ?? null,
        user_id: userData.user_id ?? userData.userId ?? userData.id ?? null,
        handle: userData.handle ?? userData.username ?? null,
        profilePath: userData.profilePath ?? userData.profile_path ?? null,
    };

    if (isBusiness) {
        normalized.account_type = "business";
        normalized.business_id = userData.business_id ?? userData.businessId ?? null;
        normalized.business_slug = userData.business_slug ?? userData.businessSlug ?? normalized.handle ?? null;
        normalized.business_name = userData.business_name ?? userData.businessName ?? userData.account_name ?? normalized.first_name ?? null;
        normalized.business_avatar_url = userData.business_avatar_url ?? userData.businessAvatarUrl ?? userData.account_avatar_url ?? normalized.avatar_url ?? null;

        if (normalized.business_slug) {
            normalized.handle = normalized.business_slug;
        }

        if (!normalized.profilePath && normalized.business_slug) {
            normalized.profilePath = `/${normalized.business_slug}`;
        }

        normalized.id = null;
    } else if (isArtist) {
        normalized.account_type = "artist";
        normalized.artist_id = userData.artist_id ?? userData.artistId ?? null;
        normalized.artist_handle = userData.artist_handle ?? userData.artistHandle ?? normalized.handle ?? null;
        normalized.artist_name = userData.artist_name ?? userData.artistName ?? userData.account_name ?? normalized.first_name ?? null;
        normalized.artist_avatar_url = userData.artist_avatar_url ?? userData.artistAvatarUrl ?? userData.account_avatar_url ?? normalized.avatar_url ?? null;

        if (normalized.artist_handle) {
            normalized.handle = normalized.artist_handle;
        }

        if (!normalized.profilePath && normalized.artist_handle) {
            normalized.profilePath = `/${normalized.artist_handle}`;
        }

        normalized.id = null;
    }

    return normalized;
}

/**
 * JobsPage
 * - Community-style fixed layout
 * - Clicking a job opens its detail in the right panel (like Community posts)
 * - My Jobs tab shows status badges + three-dot menu
 */
export default function JobsPage({ user }) {
    const location = useLocation();
    const isMdUp = useMediaQuery("(min-width:1440px)");
    // Phone-only breakpoint (matches Community/Business/Events/Music pattern). Below this,
    // the compact phone header (pill tabs + tiny icon cluster) is used as-is.
    const isPhoneJobs = useMediaQuery("(max-width:899px)");
    // Tablet/laptop range (900–1439): header controls are promoted to full labeled buttons
    // (search bar, Filters, Map, Create Job) instead of hiding in tiny icon cluster.
    const isTabletJobs = !isMdUp && !isPhoneJobs;
    // Narrow end of tablet (900–1099): Filters / Map / Create Job collapse to icons
    // to keep the toolbar on one row.
    const isNarrowTabletJobs = useMediaQuery("(min-width:900px) and (max-width:1099px)");
    const [chromeTop, setChromeTop] = useState(0);
    const jobsScrollRef = useRef(null);
    const restoredRef = useRef(false);

    // Detect back-nav from job detail page so we can skip entrance animations
    const isBackNavRef = useRef(location?.state?.from === "job-detail");

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailFromMap, setDetailFromMap] = useState(false);
    const [pageVisible, setPageVisible] = useState(() => Boolean(isBackNavRef.current));
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [applyTarget, setApplyTarget] = useState(null);

    // Mobile filter drawer (matches CommunityPanel pattern)
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);

    // ── Close mobile detail drawer on browser back button ──
    useEffect(() => {
        if (!detailOpen) return;
        window.history.pushState({ jobDetail: true }, '');
        const handlePopState = () => { setDetailOpen(false); setSelectedJob(null); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [detailOpen]);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ jobMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    // Mobile: inline overview view (matches CommunityPanel discover pattern)
    // 'list' = normal jobs list, 'overview' = inline DiscoverContent
    const [mobileOverviewView, setMobileOverviewView] = useState('list');

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // to expand the container when the global nav hid on scroll. With the
    // continuous scroll-hide system (Header.jsx + `--ll-nav-offset`), the
    // global bars slide via transform and the container stays at its normal
    // size — no mid-scroll layout shift needed.

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY the
    // subheader and reclaim its vertical space via negative margin-bottom.
    // That produced jerky content shifts. The subheader is now
    // `position: sticky` under the global header and fades via
    // `opacity: calc(1 - var(--ll-nav-offset))`. Same CSS var as Header.jsx.
    const mobileHeaderRef = useRef(null);
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-jobs-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container reserves space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Mobile/tablet only.
    useLayoutEffect(() => {
        if (isMdUp) {
            document.documentElement.style.removeProperty('--ll-subheader-height');
            return;
        }
        const el = mobileHeaderRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const apply = () => {
            const h = el.getBoundingClientRect().height;
            if (h > 0) {
                document.documentElement.style.setProperty('--ll-subheader-height', `${Math.ceil(h)}px`);
            }
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--ll-subheader-height');
        };
    }, [isMdUp]);

    const { activeAccount, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const auth = useAuth();
    const loggedInUser = auth?.user || user;

    /* ---------- job creation rate limiting ---------- */
    const { checkLimit: checkJobLimit, recordAction: recordJobCreate } = useRateLimit('job-create', {
        burstMax: 3,
        burstWindowMs: 120_000,   // 3 jobs per 2 minutes
        maxPerHour: 10,           // 10 jobs per hour
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'job postings',
    });
    const [limitDialog, setLimitDialog] = useState({ open: false, title: "", message: "" });

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Safety net: clear back-nav flag after a generous timeout in case
    // the restore effect never fires (no saved state, list too short, etc.)
    useEffect(() => {
        if (!isBackNavRef.current) return;
        const timer = setTimeout(() => { isBackNavRef.current = false; }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Lock window scrolling
    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const STYLE_ID = "ll-jobs-noshift-style";
        const BODY_CLASS = "ll-jobs-fixed-layout";

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = STYLE_ID;
            styleEl.type = "text/css";
            styleEl.appendChild(
                document.createTextNode(`
                    body.${BODY_CLASS} { padding-right: var(--ll-jobs-scrollbar-comp, 0px) !important; overflow: hidden !important; }
                    html.${BODY_CLASS} { padding-right: var(--ll-jobs-scrollbar-comp, 0px) !important; overflow: hidden !important; }
                `)
            );
            document.head.appendChild(styleEl);
        }

        body.classList.add(BODY_CLASS);
        html.classList.add(BODY_CLASS);

        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlPaddingRight = html.style.paddingRight;
        const prevBodyPaddingRight = body.style.paddingRight;
        const prevCssVarBody = body.style.getPropertyValue("--ll-jobs-scrollbar-comp");
        const prevCssVarHtml = html.style.getPropertyValue("--ll-jobs-scrollbar-comp");
        const scrollbarWidth = window.innerWidth - html.clientWidth;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px";
        html.style.setProperty("--ll-jobs-scrollbar-comp", comp);
        body.style.setProperty("--ll-jobs-scrollbar-comp", comp);
        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

        const measure = () => {
            const header =
                document.querySelector("header.MuiAppBar-root") ||
                document.querySelector("header") ||
                document.querySelector(".site-header") ||
                document.getElementById("header") ||
                null;
            setChromeTop(header ? header.getBoundingClientRect().bottom : 0);
        };

        measure();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(measure); });
        window.addEventListener("resize", measure);

        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            window.removeEventListener("resize", measure);
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;
            if (prevCssVarHtml) html.style.setProperty("--ll-jobs-scrollbar-comp", prevCssVarHtml);
            else html.style.removeProperty("--ll-jobs-scrollbar-comp");
            if (prevCssVarBody) body.style.setProperty("--ll-jobs-scrollbar-comp", prevCssVarBody);
            else body.style.removeProperty("--ll-jobs-scrollbar-comp");
            html.classList.remove(BODY_CLASS);
            body.classList.remove(BODY_CLASS);
        };
    }, []);

    // ── Read cached filter state once (synchronous, for useState initializers) ──
    // Always restore from sessionStorage so filters persist across all navigation
    // (tab switches, other pages, etc.). sessionStorage clears on session end.
    const cachedFiltersRef = useRef(null);
    if (cachedFiltersRef.current === null) {
        let _cf = false;
        try {
            const raw = sessionStorage.getItem("ll:jobs:cachedFilters");
            if (raw) {
                const parsed = JSON.parse(raw);
                _cf = {
                    search: parsed.search ?? "",
                    sort: parsed.sort ?? "newest",
                    filters: parsed.filters ?? null,
                    leftMode: parsed.leftMode ?? "all",
                    myJobsStatus: parsed.myJobsStatus ?? "active",
                };
            }
        } catch { /* ignore */ }
        cachedFiltersRef.current = _cf || false;
    }
    const _rf = cachedFiltersRef.current;

    // Feed state
    const [search, setSearch] = useState(() => _rf ? _rf.search : "");
    const [searchDraft, setSearchDraft] = useState(() => _rf ? _rf.search : "");
    const [sort, setSort] = useState(() => _rf ? _rf.sort : "newest");
    const [filters, setFilters] = useState(() => _rf && _rf.filters ? _rf.filters : {
        jobTypes: [],
        workModes: [],
        category: "All",
        city: "",
        county: "",
        radius: STATEWIDE,
        statewideOnly: false,
        salaryRange: "",
    });

    // ── Radius expansion ──
    const expandedCounties = useMemo(
        () => countiesWithinRadius(filters.county, filters.radius),
        [filters.county, filters.radius]
    );

    // ── Map center/zoom — driven by county + radius ──
    const AL_CENTER = useMemo(() => [32.69, -86.79], []);
    const AL_ZOOM = 7;
    const [mapCenter, setMapCenter] = useState(AL_CENTER);
    const [mapZoom, setMapZoom] = useState(AL_ZOOM);

    useEffect(() => {
        if (filters.county) {
            const center = getCountyCenter(filters.county);
            if (center) {
                setMapCenter(center);
                const r = String(filters.radius);
                let zoom = 10;
                if (r === STATEWIDE)    zoom = AL_ZOOM;
                else if (r === '100')   zoom = 7.5;
                else if (r === '50')    zoom = 8;
                else if (r === '25')    zoom = 9;
                setMapZoom(zoom);
            }
        } else {
            setMapCenter(AL_CENTER);
            setMapZoom(AL_ZOOM);
        }
    }, [filters.county, filters.radius, AL_CENTER]);

    // When location filters change, clear overview-driven selections (category, jobTypes)
    const prevJobLocationRef = useRef({
        city: _rf && _rf.filters ? _rf.filters.city || "" : "",
        county: _rf && _rf.filters ? _rf.filters.county || "" : "",
        statewideOnly: _rf && _rf.filters ? _rf.filters.statewideOnly || false : false,
    });
    useEffect(() => {
        const prev = prevJobLocationRef.current;
        const curr = { city: filters.city, county: filters.county, statewideOnly: filters.statewideOnly };
        if (prev.city !== curr.city || prev.county !== curr.county || prev.statewideOnly !== curr.statewideOnly) {
            setFilters((f) => ({ ...f, category: "All", jobTypes: [] }));
        }
        prevJobLocationRef.current = curr;
    }, [filters.city, filters.county, filters.statewideOnly]);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate the county filter with the viewer's
    // home_county from their profile. Product decision (2026-04): fresh
    // loads should start statewide, and narrower defaults should be
    // opt-in via the "Apply automatically when I open this tab" checkbox
    // on a saved filter (see SavedFiltersMenu + JobsFilterBar's auto-apply
    // effect).
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!loggedInUser) return;
        appliedHomeDefaultRef.current = true;
    }, [loggedInUser]);

    const [leftMode, setLeftMode] = useState(() => _rf ? _rf.leftMode : "all");
    const [myJobsStatus, setMyJobsStatus] = useState(() => _rf ? _rf.myJobsStatus : "active");

    // Tab-switch content fade (matches CommunityPanel / BusinessHubPage behavior)
    const jobsTheme = useTheme();
    const tabFadeMs = jobsTheme.custom?.motion?.contentFade?.durationMs ?? TAB_FADE_MS;
    const fadeTimerRef = useRef(null);
    const [contentVisible, setContentVisible] = useState(true);

    useEffect(() => {
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        };
    }, []);

    // Renew dialog
    const [renewTarget, setRenewTarget] = useState(null);
    const [renewDays, setRenewDays] = useState(30);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewError, setRenewError] = useState(null);
    const [extendRemaining, setExtendRemaining] = useState(0);
    const [showFilters, setShowFilters] = useState(() => isMdUp);

    // Merge expandedCounties into the filters object for the feed hook
    const feedFilters = useMemo(() => ({
        ...filters,
        counties: expandedCounties,
    }), [filters, expandedCounties]);

    const {
        items, isLoading, isEmpty, error, refresh, loadMore, hasMore,
        categories, categoriesLoading, categoriesError,
        myJobs, myJobsLoading, myJobsError,
        allJobs,
        hasMyListings,
        savedJobs, savedJobsLoading,
        appliedJobs, appliedJobsLoading,
    } = useJobsFeed({ search, sort: sort === "any" ? "random" : sort, filters: feedFilters, mode: leftMode, myJobsStatus });

    // ── Persist filter state to sessionStorage so back-nav restores filters ──
    useEffect(() => {
        try {
            sessionStorage.setItem("ll:jobs:cachedFilters", JSON.stringify({
                search,
                sort,
                filters,
                leftMode,
                myJobsStatus,
            }));
        } catch { /* ignore — quota exceeded etc. */ }
    }, [search, sort, filters, leftMode, myJobsStatus]);

    // ── Mobile pull-to-refresh ──────────────────────────────────────────
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartRef = useRef(null);
    const pullScrollElRef = useRef(null);
    const PULL_THRESHOLD = 70;

    const handlePullTouchStart = useCallback((e) => {
        if (isMdUp || pullRefreshing) return;
        const el = e.currentTarget;
        if (el.scrollTop > 5) { pullStartRef.current = null; return; }
        pullStartRef.current = e.touches[0].clientY;
        pullScrollElRef.current = el;
    }, [isMdUp, pullRefreshing]);

    const handlePullTouchMove = useCallback((e) => {
        if (isMdUp || pullRefreshing || pullStartRef.current == null) return;
        const el = pullScrollElRef.current;
        if (el && el.scrollTop > 5) { pullStartRef.current = null; setPullDistance(0); return; }
        const dy = e.touches[0].clientY - pullStartRef.current;
        if (dy > 0) setPullDistance(Math.min(dy * 0.45, 120));
        else setPullDistance(0);
    }, [isMdUp, pullRefreshing]);

    const handlePullTouchEnd = useCallback(() => {
        if (isMdUp || pullRefreshing) return;
        if (pullDistance >= PULL_THRESHOLD) {
            setPullRefreshing(true);
            setPullDistance(0);
            if (typeof refresh === 'function') refresh();
            setTimeout(() => setPullRefreshing(false), 1200);
        } else {
            setPullDistance(0);
        }
        pullStartRef.current = null;
    }, [isMdUp, pullRefreshing, pullDistance, refresh]);

    // ── Location counts for county/city badge display ──
    const [jobLocationCounts, setJobLocationCounts] = useState(null);

    // Primitive deps extracted from filters to avoid infinite loops
    const lcCategory = String(filters.category || "");
    const lcJobTypes = Array.isArray(filters.jobTypes) ? filters.jobTypes.join(",") : "";
    const lcWorkModes = Array.isArray(filters.workModes) ? filters.workModes.join(",") : "";
    const lcCounty = String(filters.county || "");
    const lcCity = String(filters.city || "");
    const lcStatewide = Boolean(filters.statewideOnly);
    const lcSalaryRange = String(filters.salaryRange || "");

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const data = await fetchJobLocationCounts({
                    search,
                    sort: sort === "any" ? "random" : sort,
                    filters: {
                        category: lcCategory,
                        jobTypes: lcJobTypes ? lcJobTypes.split(",") : [],
                        workModes: lcWorkModes ? lcWorkModes.split(",") : [],
                        county: lcCounty,
                        city: lcCity,
                        statewideOnly: lcStatewide,
                        salaryRange: lcSalaryRange,
                    },
                });
                if (!cancelled) setJobLocationCounts(data);
            } catch {
                if (!cancelled) setJobLocationCounts({ counties: {}, cities: {} });
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [search, sort, lcCategory, lcJobTypes, lcWorkModes, lcCounty, lcCity, lcStatewide, lcSalaryRange]);

    const [createOpen, setCreateOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null); // null = create mode, job object = edit mode
    const [rightTab, setRightTab] = useState("discover");

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // ── Selected job (drives right panel detail) ──
    const [selectedJob, setSelectedJob] = useState(null);

    // ── Delete confirmation from card menu ──
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const handleClickJob = (job) => {
        if (!job || job.id === undefined || job.id === null) return;
        setSelectedJob(job);
        setRightTab("detail");
        if (!isMdUp) {
            setDetailFromMap(false);
            setDetailOpen(true);
        }
    };

    // ── Restore selected job + scroll when returning from job detail page ──
    useEffect(() => {
        if (restoredRef.current) return;
        if (location?.state?.from !== "job-detail") return;
        if (isLoading || items.length === 0) return;

        restoredRef.current = true;

        try {
            const savedId = sessionStorage.getItem("ll:jobs:selectedJobId");
            if (savedId) {
                const match = items.find((j) => String(j.id) === savedId);
                if (match) {
                    setSelectedJob(match);
                    setRightTab("detail");
                }
                sessionStorage.removeItem("ll:jobs:selectedJobId");
            }

            const savedScroll = sessionStorage.getItem("ll:jobs:scrollTop");
            if (savedScroll) {
                requestAnimationFrame(() => {
                    const el = jobsScrollRef.current;
                    if (el) el.scrollTop = Number(savedScroll) || 0;
                    // Clear back-nav flag after scroll is restored so future
                    // interactions get their normal animations back.
                    isBackNavRef.current = false;
                });
                sessionStorage.removeItem("ll:jobs:scrollTop");
            } else {
                isBackNavRef.current = false;
            }
        } catch {
            isBackNavRef.current = false;
        }
    }, [location?.state?.from, isLoading, items]);

    const handleCloseDetail = () => {
        setSelectedJob(null);
        setDetailOpen(false);
        setDetailFromMap(false);
        // Map stays open underneath when detailFromMap was true — no need to reopen
    };

    const handleOpenCreate = async () => {
        if (!loggedInUser) {
            auth?.openLoginPopup?.();
            return;
        }
        const result = checkJobLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'job postings' });
            setRateLimitOpen(true);
            return;
        }
        // Check backend job posting limit
        try {
            const limits = await fetchJobLimits();
            if (limits && !limits.canCreate) {
                setLimitDialog({
                    open: true,
                    title: "Job Posting Limit Reached",
                    message: `You've reached the maximum of ${limits.maxAllowed} active job postings for this account. Please delete or let an existing posting expire before creating a new one.`,
                });
                return;
            }
        } catch { /* if check fails, let the backend enforce */ }
        setEditingJob(null);
        setCreateOpen(true);
    };

    const handleEditJob = (job) => {
        setEditingJob(job);
        setCreateOpen(true);
    };

    // ── Listen for create actions from the global Header create (+) menu ──
    const handleOpenCreateRef = useRef(handleOpenCreate);
    handleOpenCreateRef.current = handleOpenCreate;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};
            if (action !== 'job') return;

            if (blocked === 'rateLimit') {
                setRateLimitInfo({ retryAfterSec: retryAfterSec || 10, reason: reason || 'cooldown', actionLabel: 'job postings' });
                setRateLimitOpen(true);
                return;
            }

            handleOpenCreateRef.current();
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => window.removeEventListener('ll:header:create', handleHeaderCreate);
    }, []);

    // ── Scroll list back to top when any filter changes ──
    const scrollJobsToTop = () => {
        requestAnimationFrame(() => {
            const el = jobsScrollRef.current;
            if (el) el.scrollTop = 0;
        });
    };

    const clearAllFilters = () => {
        setSearch("");
        setSearchDraft("");
        setSort("newest");
        setFilters({
            jobTypes: [], workModes: [], category: "All",
            city: "", county: "", radius: STATEWIDE, statewideOnly: false, salaryRange: "",
        });
        setLeftMode("all");
        prevJobLocationRef.current = { city: "", county: "", statewideOnly: false };
        Promise.resolve().then(() => {
            if (typeof refresh === "function") refresh();
        });
        scrollJobsToTop();
    };

    // Saved filters restore: update BOTH the input (searchDraft) and the
    // committed term (search) so the input reflects the restored term
    // AND the fetch re-runs with it. Called by JobsFilterBar's apply.
    const handleSavedSearchChange = useCallback((val) => {
        const next = String(val || "");
        setSearch(next);
        setSearchDraft(next);
    }, []);

    const handleViewChange = (v) => {
        setLeftMode(v);
        setSelectedJob(null);
        scrollJobsToTop();
    };

    // Called from detail panel or card menu after delete
    const handleJobDeleted = (jobId) => {
        if (selectedJob && String(selectedJob.id) === String(jobId)) {
            setSelectedJob(null);
        }
        refresh();
        showSuccess("Job deleted successfully");
    };

    // Card menu delete handler — opens confirmation dialog
    const handleCardDelete = (job) => {
        setDeleteTarget(job);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteJob(deleteTarget.id);
            setDeleteTarget(null);
            handleJobDeleted(deleteTarget.id);
        } catch (err) {
            setDeleteError(err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenUserCard = (el, userData) => {
        if (!el) return;
        setUserAnchor(el);
        setUserForCard(normalizeUserCardData(userData));
    };

    const handleCloseUserCard = () => {
        setUserAnchor(null);
        setUserForCard(null);
    };

    const isSelfForCard = useMemo(() => {
        if (!loggedInUser || !userForCard) return false;
        const cardBizId = userForCard.business_id;
        const cardArtId = userForCard.artist_id;
        const cardIsAccount = Boolean(
            userForCard.account_type === 'business' ||
            userForCard.account_type === 'artist' ||
            cardBizId || cardArtId
        );
        if (cardBizId && isBusinessAccount && activeBusinessId) {
            return String(activeBusinessId) === String(cardBizId);
        }
        if (cardArtId && isArtistAccount && activeArtistId) {
            return String(activeArtistId) === String(cardArtId);
        }
        if (cardIsAccount) return false;
        if (isBusinessAccount || isArtistAccount) return false;
        const cardHandle = (userForCard.handle || '').toLowerCase();
        const viewerHandle = (loggedInUser.handle || '').toLowerCase();
        if (cardHandle && viewerHandle && cardHandle !== viewerHandle) return false;
        return loggedInUser.id != null && userForCard.id != null &&
            String(loggedInUser.id) === String(userForCard.id);
    }, [loggedInUser, userForCard, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    // ── Listen for hide/block events from UserCardPopover and refresh feed ──
    useEffect(() => {
        const handleHiddenChanged = (e) => {
            const { userId, hidden } = e?.detail || {};
            if (!userId || !hidden) return;
            if (selectedJob) {
                const posterId = Number(
                    selectedJob?.posterUserId || selectedJob?.createdByUserId || selectedJob?.created_by_user_id || 0
                );
                if (posterId === Number(userId)) {
                    setSelectedJob(null);
                    setDetailOpen(false);
                }
            }
            refresh();
        };
        const handleBlockedChanged = (e) => {
            const { userId, blocked } = e?.detail || {};
            if (!userId || !blocked) return;
            if (selectedJob) {
                const posterId = Number(
                    selectedJob?.posterUserId || selectedJob?.createdByUserId || selectedJob?.created_by_user_id || 0
                );
                if (posterId === Number(userId)) {
                    setSelectedJob(null);
                    setDetailOpen(false);
                }
            }
            refresh();
        };
        window.addEventListener("ll:user:hidden-changed", handleHiddenChanged);
        window.addEventListener("ll:user:blocked-changed", handleBlockedChanged);
        return () => {
            window.removeEventListener("ll:user:hidden-changed", handleHiddenChanged);
            window.removeEventListener("ll:user:blocked-changed", handleBlockedChanged);
        };
    }, [selectedJob, refresh]);

    const handleViewUserProfile = (u) => {
        const path = u?.profilePath
            || (u?.handle ? `/${u.handle}` : null)
            || (u?.id ? `/${u.id}` : null);
        handleCloseUserCard();
        if (path) window.location.assign(path);
    };

    const handleReport = (job) => {
        setReportTarget(job);
        setReportReason("");
        setReportDetails("");
        setReportSubmitted(false);
        setReportOpen(true);
    };

    const handleShare = (job) => {
        setShareTarget(job);
    };

    const handleApply = (job) => {
        if (!loggedInUser) {
            auth?.openLoginPopup?.();
            return;
        }
        setApplyTarget(job);
    };

    const handleSaveJob = async (job, nextSaved) => {
        if (!loggedInUser) {
            auth?.openLoginPopup?.();
            return;
        }
        if (!job?.id) return;
        try {
            await saveJob(job.id);
        } catch {
            // Revert will happen naturally on next refresh
        }
    };

    const handleJobApplied = (jobId) => {
        if (!jobId) return;
        const markApplied = (prev) => prev.map((j) => (j.id === jobId ? { ...j, viewerApplied: true } : j));
        // Update whichever list is currently displayed
        // The hook exposes setters indirectly via refresh, but we can update selectedJob directly
        if (selectedJob && String(selectedJob.id) === String(jobId)) {
            setSelectedJob((prev) => prev ? { ...prev, viewerApplied: true } : prev);
        }
        // Trigger a feed refresh so cards pick up the new state
        refresh();
    };

    const submitReport = async ({ reason, details }) => {
        if (!reportTarget?.id) return;
        try {
            await secureFetch(`/api/jobs/${encodeURIComponent(reportTarget.id)}/flag`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                body: JSON.stringify({ reason, details }),
            });
        } catch { /* ignore */ }
    };

    const isMyMode = leftMode === "mine";

    // Location click → switch to map tab and focus the pin
    const [focusJobId, setFocusJobId] = useState(null);
    const [focusStatewide, setFocusStatewide] = useState(false);

    const handleLocationClick = useCallback((job) => {
        if (!job?.id) return;

        // Statewide jobs have no coordinates — zoom to full state view
        const lat = Number(job.latitude);
        const lng = Number(job.longitude);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        if (!isMdUp) {
            // Mobile — open the map drawer, then focus after animation
            if (!hasCoords) {
                setFocusStatewide(true);
                setFocusJobId(null);
            } else {
                setFocusStatewide(false);
            }
            if (mobileMapOpen) {
                // Drawer already open — fly immediately
                if (hasCoords) setFocusJobId(job.id);
            } else {
                setMobileMapOpen(true);
                setTimeout(() => {
                    if (hasCoords) setFocusJobId(job.id);
                }, 380);
            }
        } else {
            // Desktop — switch to map tab in right panel
            setRightTab("map");
            if (!hasCoords) {
                setFocusStatewide(true);
                setFocusJobId(null);
            } else {
                setFocusStatewide(false);
                setFocusJobId(job.id);
            }
        }
    }, [isMdUp, mobileMapOpen]);

    const handleFocusJobHandled = () => {
        setFocusJobId(null);
        setFocusStatewide(false);
    };

    const handleRenew = (job) => {
        const rawExpiry = job?.expiresAt || job?.expires_at || "";
        const remaining = getRemainingDays(rawExpiry);
        const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
        const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
        const defaultPick = available.length > 0
            ? (available.includes(30) ? 30 : available[available.length - 1])
            : EXTEND_OPTIONS[0];

        setExtendRemaining(remaining);
        setRenewTarget(job);
        setRenewDays(defaultPick);
        setRenewError(null);
    };

    const handleConfirmRenew = async () => {
        if (!renewTarget) return;
        setIsRenewing(true);
        setRenewError(null);
        try {
            const totalDays = extendRemaining + renewDays;
            await renewJob(renewTarget.id, totalDays);
            setRenewTarget(null);
            refresh();
        } catch (err) {
            setRenewError(err);
        } finally {
            setIsRenewing(false);
        }
    };

    // Quick-select category from Discover panel
    const handleSelectCategory = (slug) => {
        setFilters((prev) => ({ ...prev, category: slug || "All" }));
        scrollJobsToTop();
    };

    // Quick-select job type from Discover panel
    const handleSelectJobType = (code) => {
        setFilters((prev) => ({ ...prev, jobTypes: code ? [code] : [] }));
        scrollJobsToTop();
    };

    const isSavedMode = leftMode === "saved";
    const isAppliedMode = leftMode === "applied";
    const displayItems = isMyMode ? myJobs : isSavedMode ? savedJobs : isAppliedMode ? appliedJobs : items;
    const displayLoading = isMyMode ? myJobsLoading : isSavedMode ? savedJobsLoading : isAppliedMode ? appliedJobsLoading : isLoading;
    const displayEmpty = isMyMode ? (!myJobsLoading && myJobs.length === 0) : isSavedMode ? (!savedJobsLoading && savedJobs.length === 0) : isAppliedMode ? (!appliedJobsLoading && appliedJobs.length === 0) : isEmpty;
    const displayTotal = isMyMode ? myJobs.length : isSavedMode ? savedJobs.length : isAppliedMode ? appliedJobs.length : items.length;

    // Active filter chips for mobile — removable inline chips (matches CommunityPanel)
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(search || "").trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + "\u2026" : appliedTerm;
            chips.push({
                key: "search",
                label: `"${truncated}"`,
                onRemove: () => {
                    setSearchDraft("");
                    setSearch("");
                },
            });
        }
        if (filters.category && filters.category !== "All") chips.push({ key: "category", label: filters.category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setFilters((f) => ({ ...f, category: "All" })) });
        if (filters.jobTypes?.length > 0) chips.push({ key: "jobType", label: filters.jobTypes[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setFilters((f) => ({ ...f, jobTypes: [] })) });
        if (filters.workModes?.length > 0) chips.push({ key: "workMode", label: filters.workModes[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setFilters((f) => ({ ...f, workModes: [] })) });
        if (filters.city) chips.push({ key: "city", label: filters.city, onRemove: () => setFilters((f) => ({ ...f, city: "" })) });
        if (filters.county) chips.push({ key: "county", label: `${filters.county} County`, onRemove: () => setFilters((f) => ({ ...f, county: "", city: "", radius: STATEWIDE })) });
        if (filters.county && !isCountyOnly(filters.radius)) chips.push({ key: "radius", label: radiusLabel(filters.radius), onRemove: () => setFilters((f) => ({ ...f, radius: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED })) });
        if (filters.salaryRange) chips.push({ key: "salary", label: filters.salaryRange, onRemove: () => setFilters((f) => ({ ...f, salaryRange: "" })) });
        if (sort && sort !== "newest") chips.push({ key: "sort", label: `Sort: ${sort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setSort("newest") });
        return chips;
    }, [filters, sort, search]);

    const statusText = (() => {
        if (displayLoading && displayItems.length === 0) return "Loading\u2026";
        const shown = displayItems.length;
        const total = displayTotal;
        if (shown === 0 && total > 0) return "Loading\u2026";

        // Build location label for empty states
        const locCity = filters.city || '';
        const locCounty = filters.county || '';
        const locLabel = locCity && locCounty ? `${locCity}, ${locCounty} County`
            : locCity || (locCounty ? `${locCounty} County` : '');

        if (isMyMode) {
            if (shown === 0) return locLabel ? `No jobs posted in ${locLabel}` : "No jobs match your filters";
            return "Displaying " + shown.toLocaleString() + " out of " + total.toLocaleString() + " job" + (total !== 1 ? "s" : "") + " you\u2019ve posted";
        }
        if (isSavedMode && shown === 0) return "No saved jobs yet";
        if (isAppliedMode && shown === 0) return "No applications yet";
        if (shown === 0) return locLabel ? `No jobs found in ${locLabel}` : "No jobs match your filters";
        return "Displaying " + shown.toLocaleString() + " out of " + total.toLocaleString() + " job" + (total !== 1 ? "s" : "");
    })();

    return (
        <Box
            sx={{
                position: "fixed",
                // Track global nav offset so the container expands to fill the
                // viewport as the app bar + bottom nav slide away. Mirrors
                // CommunityPage so the floating subheader (Jobs pill + search)
                // fades in lockstep with the AppBar via `--ll-nav-offset`.
                top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
                left: 0,
                right: 0,
                bottom: `${BOTTOM_GUTTER_PX}px`,
                "@media (max-width: 899px)": {
                    bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
                },
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                p: 0,
                pt: 0,
                boxSizing: "border-box",
                bgcolor: "background.paper",
                "@media (min-width: 1024px)": {
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: APP_BACKGROUND,
                },
                "@media (min-width: 1440px)": {
                    flexDirection: "row",
                    gap: 1.25,
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: APP_BACKGROUND,
                },
                opacity: pageVisible ? 1 : 0,
                transform: "none",
                transition: (t) => [
                    `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    `transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                ].join(", "),
            }}
        >
            {/* Left: Jobs feed */}
            <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1, height: "100%", overflow: "hidden", p: 0 }}>
                <Box
                    sx={(t) => ({
                        height: "100%", overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        borderRadius: 0, border: "none",
                        borderColor: "transparent",
                        bgcolor: t.palette.background.paper,
                        "@media (min-width: 1024px)": {
                            borderRadius: 3, border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                        },
                        "@media (min-width: 1440px)": {
                            borderRadius: 3, border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                        },
                        color: t.palette.text.primary,
                        fontFamily: t.typography.fontFamily,
                        backdropFilter: "none",
                        backgroundImage: "none", boxShadow: "none",
                    })}
                >
                    {/* Header */}
                    <Box
                        ref={mobileHeaderRef}
                        sx={{
                            flexShrink: 0,
                            px: 1, pt: 0.35, pb: 0.35,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            justifyContent: "flex-start",
                            flexWrap: "wrap",
                            gap: 0.5,
                            // Tablet/laptop (900–1439) + desktop (≥1440): flow as a row with wrap
                            // so tabs + search + chrome buttons + Create sit inline instead of stacked.
                            "@media (min-width: 900px)": {
                                px: 1.25, pt: 0.5, pb: 0.5,
                                rowGap: 0.5,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 1,
                            },
                            "@media (min-width: 1440px)": {
                                px: 1.5, pt: 0.45, pb: 0.45,
                            },
                            // Mobile (<1440px): fixed in viewport directly below the
                            // global header. Doesn't take layout space — the scroll
                            // container reserves space via padding-top. Fades via
                            // `--ll-nav-offset` in sync with the rest of the chrome.
                            ...(!isMdUp ? {
                                position: "fixed",
                                top: "var(--ll-nav-height, 52px)",
                                left: 0,
                                right: 0,
                                zIndex: (t) => t.zIndex.appBar,
                                opacity: "calc(1 - var(--ll-nav-offset, 0))",
                                pointerEvents: "var(--ll-nav-pointer-events, auto)",
                                transition: "none",
                                willChange: "opacity",
                                backdropFilter: "saturate(140%) blur(10px)",
                                WebkitBackdropFilter: "saturate(140%) blur(10px)",
                                backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                            } : {}),
                        }}
                    >
                        {/* Tab-style pills — mobile: text-only pills + utility icons; desktop: icon+label tabs */}
                        <Box role="tablist" aria-label="Jobs view" sx={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0.5, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, maxWidth: "100%", width: "100%", "@media (min-width: 900px)": { overflowX: "visible", width: "auto" }, "@media (min-width: 1440px)": { gap: 0.75 } }}>
                            {/* Overview tab — mobile only, toggles inline overview */}
                            {!isMdUp && (
                                <Button
                                    role="tab"
                                    aria-selected={mobileOverviewView === 'overview'}
                                    onClick={() => setMobileOverviewView((v) => v === 'overview' ? 'list' : 'overview')}
                                    variant="text"
                                    disableElevation
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: mobileOverviewView === 'overview' ? 800 : 600,
                                        letterSpacing: "0.01em",
                                        fontSize: 11.5,
                                        lineHeight: 1,
                                        height: 28,
                                        minHeight: 28,
                                        px: 1.25,
                                        // Tablet/laptop: match other pages at 38px, text-only pill.
                                        "@media (min-width: 900px)": {
                                            fontSize: 13.5,
                                            height: 38,
                                            minHeight: 38,
                                            px: 1.75,
                                            letterSpacing: "-0.01em",
                                            fontWeight: mobileOverviewView === 'overview' ? 950 : 700,
                                        },
                                        py: 0,
                                        flexDirection: "row",
                                        gap: 0,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                        color: mobileOverviewView === 'overview' ? t.palette.primary.main : t.palette.text.secondary,
                                        backgroundColor: mobileOverviewView === 'overview' ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                        border: "1px solid",
                                        borderColor: mobileOverviewView === 'overview' ? alpha(t.palette.primary.main, 0.18) : "transparent",
                                        boxShadow: "none",
                                        transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                        "& .MuiButton-startIcon": { display: "none" },
                                        "&:hover": {
                                            backgroundColor: mobileOverviewView === 'overview'
                                                ? alpha(t.palette.primary.main, 0.1)
                                                : alpha(t.palette.text.primary, 0.04),
                                            color: mobileOverviewView === 'overview' ? t.palette.primary.main : t.palette.text.primary,
                                        },
                                    })}
                                >
                                    Overview
                                </Button>
                            )}

                            <Button
                                role="tab"
                                aria-selected={!isMyMode && !(!isMdUp && mobileOverviewView === 'overview')}
                                onClick={() => {
                                    if (!isMdUp && mobileOverviewView === 'overview') { setMobileOverviewView('list'); if (!isMyMode) return; }
                                    if (isMyMode) {
                                        setContentVisible(false);
                                        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
                                        fadeTimerRef.current = setTimeout(() => {
                                            fadeTimerRef.current = null;
                                            setLeftMode("all");
                                            setSelectedJob(null);
                                            requestAnimationFrame(() => setContentVisible(true));
                                        }, tabFadeMs);
                                    }
                                }}
                                variant="text"
                                disableElevation
                                startIcon={<WorkRoundedIcon sx={(t) => {
                                    const isActive = !isMyMode && !(!isMdUp && mobileOverviewView === 'overview');
                                    return { fontSize: 18, '@media (min-width: 1440px)': { fontSize: 22 }, color: isActive ? "primary.main" : "text.secondary", opacity: isActive ? 1 : 0.72 };
                                }} />}
                                sx={(t) => {
                                    const isActive = !isMyMode && !(!isMdUp && mobileOverviewView === 'overview');
                                    return {
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: isActive ? (isMdUp ? 950 : 800) : (isMdUp ? 700 : 600),
                                        letterSpacing: isMdUp ? "-0.01em" : "0.01em",
                                        fontSize: 11.5,
                                        lineHeight: 1,
                                        height: 28,
                                        minHeight: 28,
                                        px: 1.25,
                                        // Tablet/laptop (900–1439) + desktop (≥1440): match other pages at 38px pill.
                                        '@media (min-width: 900px)': {
                                            fontSize: 13.5,
                                            height: 38,
                                            minHeight: 38,
                                            px: 1.75,
                                            letterSpacing: "-0.01em",
                                            fontWeight: isActive ? 950 : 700,
                                        },
                                        py: 0,
                                        flexDirection: "row",
                                        gap: 0,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                        color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                        backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                        border: "1px solid",
                                        borderColor: isActive ? alpha(t.palette.primary.main, isMdUp ? 0.2 : 0.18) : "transparent",
                                        boxShadow: "none",
                                        transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                        // Tab icons only appear at true desktop (≥1440). Tablet is text-only,
                                        // matching Community/Business/Events/Music pattern.
                                        "& .MuiButton-startIcon": { display: "none", marginRight: 0, marginLeft: 0, "@media (min-width: 1440px)": { display: "flex", marginRight: 0.9 } },
                                        "&:hover": {
                                            backgroundColor: isActive
                                                ? alpha(t.palette.primary.main, 0.1)
                                                : alpha(t.palette.text.primary, 0.04),
                                            color: isActive ? t.palette.primary.main : t.palette.text.primary,
                                        },
                                    };}}
                            >
                                Jobs
                            </Button>

                            {hasMyListings && (
                                <Button
                                    role="tab"
                                    aria-selected={isMyMode && !(!isMdUp && mobileOverviewView === 'overview')}
                                    onClick={() => {
                                        if (!isMdUp && mobileOverviewView === 'overview') { setMobileOverviewView('list'); if (isMyMode) return; }
                                        if (!isMyMode) {
                                            setContentVisible(false);
                                            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
                                            fadeTimerRef.current = setTimeout(() => {
                                                fadeTimerRef.current = null;
                                                setLeftMode("mine");
                                                setMyJobsStatus("active");
                                                setSelectedJob(null);
                                                requestAnimationFrame(() => setContentVisible(true));
                                            }, tabFadeMs);
                                        }
                                    }}
                                    variant="text"
                                    disableElevation
                                    startIcon={<AssignmentIndRoundedIcon sx={(t) => {
                                        const isActive = isMyMode && !(!isMdUp && mobileOverviewView === 'overview');
                                        return { fontSize: 18, '@media (min-width: 1440px)': { fontSize: 22 }, color: isActive ? "primary.main" : "text.secondary", opacity: isActive ? 1 : 0.72 };
                                    }} />}
                                    sx={(t) => {
                                        const isActive = isMyMode && !(!isMdUp && mobileOverviewView === 'overview');
                                        return {
                                            borderRadius: 999,
                                            textTransform: "none",
                                            fontWeight: isActive ? (isMdUp ? 950 : 800) : (isMdUp ? 700 : 600),
                                            letterSpacing: isMdUp ? "-0.01em" : "0.01em",
                                            fontSize: 11.5,
                                            lineHeight: 1,
                                            height: 28,
                                            minHeight: 28,
                                            px: 1.25,
                                            // Tablet/laptop (900–1439) + desktop (≥1440): match other pages at 38px pill.
                                            '@media (min-width: 900px)': {
                                                fontSize: 13.5,
                                                height: 38,
                                                minHeight: 38,
                                                px: 1.75,
                                                letterSpacing: "-0.01em",
                                                fontWeight: isActive ? 950 : 700,
                                            },
                                            py: 0,
                                            flexDirection: "row",
                                            gap: 0,
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                            color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                            border: "1px solid",
                                            borderColor: isActive ? alpha(t.palette.primary.main, isMdUp ? 0.2 : 0.18) : "transparent",
                                            boxShadow: "none",
                                            transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                            // Tab icons only appear at true desktop (≥1440). Tablet is text-only.
                                            "& .MuiButton-startIcon": { display: "none", marginRight: 0, marginLeft: 0, "@media (min-width: 1440px)": { display: "flex", marginRight: 0.9 } },
                                            "&:hover": {
                                                backgroundColor: isActive
                                                    ? alpha(t.palette.primary.main, 0.1)
                                                    : alpha(t.palette.text.primary, 0.04),
                                                color: isActive ? t.palette.primary.main : t.palette.text.primary,
                                            },
                                        };}}
                                >
                                    My Listings
                                </Button>
                            )}

                            {/* Phone: Map + Search icons pushed right.
                                Tablet/laptop promotes these to labeled buttons below. */}
                            {isPhoneJobs && mobileOverviewView !== 'overview' && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}>
                                    <IconButton
                                        onClick={() => { if (mobileOverviewView === 'overview') setMobileOverviewView('list'); setMobileMapOpen(true); }}
                                        size="small"
                                        sx={(t) => ({
                                            width: 32,
                                            height: 32,
                                            color: t.palette.text.secondary,
                                            transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                            "&:hover": { color: "primary.main" },
                                        })}
                                        aria-label="Map"
                                    >
                                        <MapRoundedIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setMobileFilterDrawerOpen(true)}
                                        size="small"
                                        sx={(t) => ({
                                            width: 32,
                                            height: 32,
                                            color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.secondary,
                                            transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                            "&:hover": { color: "primary.main" },
                                        })}
                                        aria-label="Search & Filter"
                                    >
                                        <SearchRoundedIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* Search row — tablet/laptop + desktop (phone uses filter drawer).
                            Hidden at any width when Overview is active. */}
                        {mobileOverviewView !== 'overview' && (
                            <Box
                                sx={(t) => ({
                                    flex: "1 1 auto",
                                    minWidth: 200,
                                    ml: 0.75,
                                    mt: 0,
                                    mb: 0,
                                    order: 0,
                                    display: "none", "@media (min-width: 900px)": { display: "flex" },
                                    alignItems: "center",
                                    gap: 0.5,
                                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled)": { color: t.palette.common.white },
                                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled):hover": { color: t.palette.common.white },
                                })}
                            >
                                {/* Search input takes up remaining space */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <SearchInput
                                        placeholder="Search jobs..."
                                        value={searchDraft}
                                        onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                                        inputProps={{
                                            maxLength: 120, autoComplete: "new-password",
                                            name: "ll-jobs-search", autoCorrect: "off",
                                            autoCapitalize: "none", spellCheck: "false", inputMode: "search",
                                        }}
                                        onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollJobsToTop(); }}
                                        onClear={() => { setSearchDraft(""); setSearch(""); scrollJobsToTop(); }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Tablet/laptop (900–1439): labeled Filters + Map buttons.
                            At narrow tablet (900–1099) they collapse to icon-only.
                            Hidden at any width in Overview mode. */}
                        {isTabletJobs && mobileOverviewView !== 'overview' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                {/* Filters */}
                                <Tooltip title={isNarrowTabletJobs ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                    {isNarrowTabletJobs ? (
                                        <IconButton
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                position: 'relative',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label={`Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length} active)` : ''}`}
                                        >
                                            <FilterListRoundedIcon sx={{ fontSize: 18 }} />
                                            {activeFilterChips.length > 0 && (
                                                <Box sx={(t) => ({
                                                    position: 'absolute',
                                                    top: -2, right: -2,
                                                    minWidth: 16, height: 16,
                                                    px: 0.5,
                                                    borderRadius: 999,
                                                    bgcolor: t.palette.primary.main,
                                                    color: t.palette.primary.contrastText,
                                                    fontSize: 10,
                                                    fontWeight: 900,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    lineHeight: 1,
                                                })}>
                                                    {activeFilterChips.length}
                                                </Box>
                                            )}
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<FilterListRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Filters"
                                        >
                                            Filters{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}
                                        </Button>
                                    )}
                                </Tooltip>

                                {/* Map */}
                                <Tooltip title={isNarrowTabletJobs ? 'Map' : ''}>
                                    {isNarrowTabletJobs ? (
                                        <IconButton
                                            onClick={() => setMobileMapOpen(true)}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            <MapRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileMapOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<MapRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            Map
                                        </Button>
                                    )}
                                </Tooltip>
                            </Box>
                        )}

                        {/* Tablet/laptop + desktop: Create Job button.
                            Icon-only at narrow tablet (900–1099) and narrow desktop (1440–1499);
                            full label at wider tablet (1100–1439) and wide desktop (≥1500).
                            Hidden at any width in Overview mode. */}
                        {mobileOverviewView !== 'overview' && (
                            <Box
                                sx={{
                                    display: "none", "@media (min-width: 900px)": { display: "flex" },
                                    alignItems: "center",
                                    gap: 1.25,
                                    flexShrink: 0,
                                    ml: "auto",
                                }}
                            >
                                {/* Create Job — icon-only at narrow widths, full at wide */}
                                <Tooltip title="Create Job">
                                    <IconButton
                                        onClick={handleOpenCreate} size="small"
                                        sx={(t) => ({
                                            display: "none",
                                            // Narrow tablet 900–1099: icon-only.
                                            "@media (min-width: 900px) and (max-width: 1099px)": { display: "inline-flex" },
                                            // Narrow desktop 1440–1499: icon-only (original behavior).
                                            "@media (min-width: 1440px) and (max-width: 1499px)": { display: "inline-flex" },
                                            width: 38, height: 38, borderRadius: 999,
                                            color: t.palette.common.white, backgroundColor: t.palette.primary.main, boxShadow: "none",
                                            "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                                        })}
                                        aria-label="Create Job"
                                    >
                                        <AddIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                <Button
                                    variant="contained" startIcon={<AddIcon />}
                                    onClick={handleOpenCreate} size="small"
                                    sx={(t) => ({
                                        display: "none",
                                        // Wider tablet 1100–1439: full label.
                                        "@media (min-width: 1100px) and (max-width: 1439px)": { display: "inline-flex" },
                                        // Wide desktop (≥1500): full label (original behavior).
                                        "@media (min-width: 1500px)": { display: "inline-flex" },
                                        borderRadius: 999, textTransform: "none", fontWeight: 950, px: 1.35, height: 38,
                                        minWidth: 140, justifyContent: "center", whiteSpace: "nowrap",
                                        borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18),
                                        color: t.palette.common.white, backgroundColor: t.palette.primary.main, boxShadow: "none",
                                        "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                                    })}
                                >
                                    Create Job
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Active filter chips — mobile only */}
                    {!isMdUp && activeFilterChips.length > 0 && mobileOverviewView !== 'overview' && (
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.5,
                            pt: 0.5,
                            pb: 0.5,
                            flexWrap: "wrap",
                        }}>
                            {activeFilterChips.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    size="small"
                                    onDelete={chip.onRemove}
                                    sx={(t) => ({
                                        height: 26,
                                        maxWidth: 160,
                                        borderRadius: 999,
                                        fontWeight: 700,
                                        fontSize: 11,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.2),
                                        "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        },
                                        "& .MuiChip-deleteIcon": {
                                            color: alpha(t.palette.primary.main, 0.5),
                                            fontSize: 16,
                                            "&:hover": { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Content (filters + list + footer): fades when switching tabs */}

                    {/* ── Mobile: inline Overview view (matches CommunityPanel discover pattern) ── */}
                    {!isMdUp && mobileOverviewView === 'overview' && (
                        <>
                            <Divider sx={{ borderColor: 'divider' }} />
                            <Box sx={{
                                flex: 1,
                                minHeight: 0,
                                overflow: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                position: 'relative',
                                zIndex: 1,
                                bgcolor: 'background.paper',
                                // Reserve space for the floating section header (Overview/Jobs tabs)
                                // so the first piece of content starts below it on initial paint.
                                '@media (max-width: 1439px)': {
                                    paddingTop: 'var(--ll-subheader-height, 52px)',
                                },
                                '@media (max-width: 899px)': {
                                    paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                },
                            }}>
                                <DiscoverContent
                                    jobs={allJobs}
                                    categories={categories}
                                    onSelectCategory={(slug) => {
                                        handleSelectCategory(slug);
                                        setMobileOverviewView('list');
                                    }}
                                    activeCategory={filters.category !== "All" ? filters.category : ""}
                                    locationCity={filters.city || ""}
                                    locationCounty={filters.county || ""}
                                    locationStatewide={Boolean(filters.statewideOnly)}
                                />
                            </Box>
                        </>
                    )}

                    {/* Normal content — hidden when mobile overview view is active */}
                    {(!(!isMdUp && mobileOverviewView === 'overview')) && (
                        <Fade in={contentVisible} timeout={tabFadeMs} appear={false}>
                            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                                {/* Alerts — network errors are shown inline by JobsList */}
                                {((error && !isNetworkError(error)) || (myJobsError && !isNetworkError(myJobsError))) && (
                                    <Box sx={{ flexShrink: 0, p: 1, '@media (min-width: 1440px)': { p: 1.5 } }}>
                                        <Stack spacing={1}>
                                            {error && !isNetworkError(error) ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error.message || "Something went wrong loading jobs."}</Alert> : null}
                                            {myJobsError && !isNetworkError(myJobsError) ? <Alert severity="error" sx={{ borderRadius: 2 }}>{myJobsError.message || "Could not load your jobs."}</Alert> : null}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Filters — desktop only (mobile uses full-screen filter drawer).
                                    Container is always visible on desktop; the internal "Filters"
                                    button inside JobsFilterBar controls field-grid expansion. */}
                                {isMdUp ? (
                                    <Box sx={{ flexShrink: 0, p: 1, '@media (min-width: 1440px)': { p: 1.5 }, position: "relative", zIndex: 2 }}>
                                        <JobsFilterBar
                                            filters={filters} onChangeFilters={(v) => { setFilters(v); scrollJobsToTop(); }} compactChrome
                                            categories={categories} categoriesLoading={categoriesLoading} categoriesError={categoriesError}
                                            view={isMyMode ? "all" : leftMode}
                                            onViewChange={handleViewChange}
                                            sort={sort}
                                            onSortChange={(v) => { setSort(v); scrollJobsToTop(); }}
                                            isMyMode={isMyMode}
                                            myJobsStatus={myJobsStatus}
                                            onMyJobsStatusChange={(v) => { setMyJobsStatus(v); scrollJobsToTop(); }}
                                            locationCounts={jobLocationCounts}
                                            viewer={loggedInUser}
                                            search={search}
                                            onSearchChange={handleSavedSearchChange}
                                            onClearAll={clearAllFilters}
                                        />
                                    </Box>
                                ) : null}

                                <Divider sx={{ borderColor: (t) => alpha(t.palette.primary.main, 0.10) }} />

                                {/* List */}
                                <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                                    <Box ref={jobsScrollRef} data-jobs-scroll onTouchStart={!isMdUp ? handlePullTouchStart : undefined} onTouchMove={!isMdUp ? handlePullTouchMove : undefined} onTouchEnd={!isMdUp ? handlePullTouchEnd : undefined} sx={{
                                        height: "100%",
                                        overflowY: "scroll",
                                        scrollbarGutter: "stable",
                                        px: 0.75,
                                        '@media (min-width: 1440px)': { px: 1.25 },
                                        py: 1,
                                        // Mobile/tablet: reserve space under the floating chrome
                                        // (header + subheader at top, bottom nav at bottom on phone).
                                        "@media (max-width: 1439px)": {
                                            paddingTop: "var(--ll-subheader-height, 52px)",
                                        },
                                        "@media (max-width: 899px)": {
                                            paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                        },
                                        WebkitOverflowScrolling: "touch",
                                        overscrollBehavior: "contain"
                                    }}>
                                        {/* Pull-to-refresh indicator (mobile only) */}
                                        {!isMdUp && (pullDistance > 0 || pullRefreshing) && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: pullRefreshing ? 56 : Math.max(pullDistance, 0), overflow: 'hidden', transition: pullRefreshing ? 'height 0.2s ease' : 'none' }}>
                                                <CircularProgress size={24} thickness={4} sx={{ opacity: pullRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }} />
                                            </Box>
                                        )}
                                        <JobsList
                                            items={displayItems}
                                            isLoading={displayLoading}
                                            isEmpty={displayEmpty}
                                            error={error}
                                            onClickJob={handleClickJob}
                                            hasMore={!isMyMode && hasMore}
                                            onLoadMore={loadMore}
                                            selectedJobId={selectedJob?.id}
                                            showStatus={isMyMode}
                                            onEditJob={handleEditJob}
                                            onDeleteJob={handleCardDelete}
                                            onOpenUserCard={handleOpenUserCard}
                                            onReport={handleReport}
                                            onRenew={handleRenew}
                                            onShare={handleShare}
                                            onApply={handleApply}
                                            onSave={handleSaveJob}
                                            onLocationClick={handleLocationClick}
                                            user={loggedInUser}
                                            activeAccount={activeAccount}
                                            totalCount={displayTotal}
                                            onCreateJob={handleOpenCreate}
                                            isMyMode={isMyMode}
                                            onRefresh={refresh}
                                            filters={filters}
                                            search={search}
                                            viewMode={isMyMode ? "mine" : leftMode}
                                            skipStagger={Boolean(isBackNavRef.current)}
                                            emptyTitle={
                                                filters.city && filters.county ? `No jobs found in ${filters.city}, ${filters.county} County`
                                                    : filters.city ? `No jobs found in ${filters.city}`
                                                        : filters.county ? `No jobs found in ${filters.county} County`
                                                            : undefined
                                            }
                                            emptyMessage={
                                                (filters.city || filters.county)
                                                    ? 'Try browsing all counties or adjusting your other filters.'
                                                    : undefined
                                            }
                                        />
                                    </Box>
                                </Box>

                                {/* Footer */}
                                <Box
                                    sx={(t) => ({
                                        flexShrink: 0, borderTop: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        px: 1.25, py: 1,
                                        display: "none", "@media (min-width: 1440px)": { display: "flex", px: 1.5 }, alignItems: "center", justifyContent: "center",
                                        bgcolor: t.palette.background.paper,
                                        backgroundImage: "none", backdropFilter: "none",
                                        pb: 1,
                                    })}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 13, fontWeight: 800, color: "text.secondary",
                                            width: "100%", textAlign: "center", whiteSpace: "nowrap",
                                            overflow: "hidden", textOverflow: "ellipsis", minHeight: 22,
                                        }}
                                    >
                                        {statusText}
                                    </Typography>
                                </Box>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Box>

            {/* ═══ Mobile full-screen filter drawer (matches CommunityPanel) ═══ */}
            {!isMdUp && (
                <SwipeableBottomDrawer
                    open={mobileFilterDrawerOpen}
                    onClose={() => setMobileFilterDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            height: '100%',
                            borderRadius: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: {} } }}
                >
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                    </Box>

                    {/* Search input */}
                    <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                        <SearchInput
                            placeholder="Search jobs..."
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                            inputProps={{ maxLength: 120, autoFocus: true }}
                            onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollJobsToTop(); setMobileFilterDrawerOpen(false); }}
                            onClear={() => { setSearchDraft(""); setSearch(""); scrollJobsToTop(); }}
                        />
                    </Box>

                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: "auto", px: 2, pt: 1, pb: 2 }}>
                        <JobsFilterBar
                            filters={filters} onChangeFilters={(v) => { setFilters(v); scrollJobsToTop(); }} compactChrome
                            categories={categories} categoriesLoading={categoriesLoading} categoriesError={categoriesError}
                            view={isMyMode ? "all" : leftMode}
                            onViewChange={handleViewChange}
                            sort={sort}
                            onSortChange={(v) => { setSort(v); scrollJobsToTop(); }}
                            isMyMode={isMyMode}
                            myJobsStatus={myJobsStatus}
                            onMyJobsStatusChange={(v) => { setMyJobsStatus(v); scrollJobsToTop(); }}
                            locationCounts={jobLocationCounts}
                            viewer={loggedInUser}
                            search={search}
                            onSearchChange={handleSavedSearchChange}
                            onClearAll={clearAllFilters}
                        />
                    </Box>

                    {/* Sticky bottom actions */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <Button
                            onClick={() => {
                                clearAllFilters();
                            }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setSearch(String(searchDraft || "").trim());
                                scrollJobsToTop();
                                setMobileFilterDrawerOpen(false);
                            }}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 900,
                                px: 3,
                                height: 42,
                                bgcolor: t.palette.primary.main,
                                color: t.palette.common.white,
                                boxShadow: "none",
                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                            })}
                        >
                            Show Results
                        </Button>
                    </Box>
                </SwipeableBottomDrawer>
            )}

            {/* Right: Detail panel or tabs (desktop only) */}
            {isMdUp && (
                <Box sx={{ width: RIGHT_WIDTH, flex: "0 0 auto", height: "100%" }}>
                    <JobsRightPanel
                        activeTab={rightTab}
                        onTabChange={setRightTab}
                        selectedJob={selectedJob}
                        selectedJobId={selectedJob?.id}
                        user={user}
                        onCloseDetail={handleCloseDetail}
                        onJobDeleted={handleJobDeleted}
                        onJobEdit={handleEditJob}
                        onOpenUserCard={handleOpenUserCard}
                        onReport={handleReport}
                        onShare={handleShare}
                        onApply={handleApply}
                        onRenew={handleRenew}
                        onSuccess={showSuccess}
                        loggedInUser={loggedInUser}
                        activeAccount={activeAccount}
                        jobs={allJobs}
                        mapJobs={displayItems}
                        onSelectJob={(job) => {
                            if (!job || job.id === undefined || job.id === null) return;
                            setSelectedJob(job);
                            setRightTab("detail");
                            if (!isMdUp) {
                                setDetailFromMap(true);
                                setDetailOpen(true);
                            }
                        }}
                        focusJobId={focusJobId}
                        focusStatewide={focusStatewide}
                        onFocusJobHandled={handleFocusJobHandled}
                        categories={categories}
                        onSelectCategory={handleSelectCategory}
                        onSelectJobType={handleSelectJobType}
                        activeCategory={filters.category !== "All" ? filters.category : ""}
                        activeJobType={filters.jobTypes}
                        locationCity={filters.city || ""}
                        locationCounty={filters.county || ""}
                        locationStatewide={Boolean(filters.statewideOnly)}
                        mapCenter={mapCenter}
                        mapZoom={mapZoom}
                    />
                </Box>
            )}

            {/* Mobile detail drawer — slides in from right (matches Community/Business pattern) */}
            <SwipeableRightDrawer
                open={!isMdUp && detailOpen && Boolean(selectedJob)}
                onClose={handleCloseDetail}
                SlideProps={{ direction: 'left' }}
                PaperProps={{
                    sx: {
                        width: '100%',
                        maxWidth: '100vw',
                        height: '100dvh',
                        '@supports not (height: 1dvh)': { height: '100vh' },
                        borderRadius: 0,
                        overflow: 'hidden',
                        bgcolor: 'background.default',
                        zIndex: (t) => t.zIndex.drawer + 3,
                    },
                }}
            >
                {/* Back bar */}
                <Box sx={(t) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 0.5,
                    py: 0.25,
                    minHeight: 46,
                    borderBottom: '1px solid',
                    borderColor: alpha(t.palette.divider, 0.1),
                    bgcolor: t.palette.background.paper,
                    flexShrink: 0,
                })}>
                    <IconButton
                        size="small"
                        onClick={handleCloseDetail}
                        aria-label="Back"
                        sx={{ width: 36, height: 36 }}
                    >
                        <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                        {detailFromMap ? 'Back to Map' : 'Job Details'}
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <JobDetailPanel
                        jobId={selectedJob?.id}
                        job={selectedJob}
                        user={user}
                        onCloseDetail={handleCloseDetail}
                        onJobDeleted={handleJobDeleted}
                        onEdit={handleEditJob}
                        onOpenUserCard={handleOpenUserCard}
                        onReport={handleReport}
                        onShare={handleShare}
                        onApply={handleApply}
                        onRenew={handleRenew}
                        onSuccess={showSuccess}
                        loggedInUser={loggedInUser}
                        activeAccount={activeAccount}
                    />
                </Box>
            </SwipeableRightDrawer>

            {/* ── Mobile map — truly fullscreen with back bar (matches Community/Events/Business) ── */}
            {!isMdUp && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            height: "100dvh",
                            "@supports not (height: 1dvh)": { height: "100vh" },
                            borderRadius: 0, overflow: "hidden", bottom: 0,
                            zIndex: (t) => t.zIndex.drawer + 2,
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                >
                    <Box sx={(t) => ({
                        display: "flex", alignItems: "center", gap: 1, px: 0.5, py: 0.25, minHeight: 46,
                        borderBottom: activeFilterChips.length > 0 ? "none" : "1px solid",
                        borderColor: alpha(t.palette.divider, 0.1), bgcolor: t.palette.background.paper, flexShrink: 0,
                    })}>
                        <IconButton onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }} size="small" aria-label="Back" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>Jobs Map</Typography>
                        <IconButton onClick={() => setMobileMapFilterOpen(true)} size="small" aria-label="Search & Filter"
                                    sx={(t) => ({ width: 36, height: 36, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: "primary.main", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.16) } })}>
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {activeFilterChips.length > 0 && (
                        <Box sx={(t) => ({
                            display: "flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5,
                            flexWrap: "nowrap", overflowX: "auto", flexShrink: 0,
                            bgcolor: t.palette.background.paper, borderBottom: "1px solid", borderColor: alpha(t.palette.divider, 0.1),
                            "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
                        })}>
                            {activeFilterChips.map((chip) => (
                                <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                      sx={(t) => ({ height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, flexShrink: 0,
                                          bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main,
                                          border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2),
                                          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                                          "& .MuiChip-deleteIcon": { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, "&:hover": { color: t.palette.primary.main } },
                                      })} />
                            ))}
                        </Box>
                    )}

                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <JobsMapView
                            jobs={displayItems}
                            onSelectJob={(job) => {
                                setSelectedJob(job);
                                setRightTab("detail");
                                setDetailFromMap(true);
                                setDetailOpen(true);
                            }}
                            selectedJobId={selectedJob?.id}
                            focusJobId={focusJobId}
                            focusStatewide={focusStatewide}
                            onFocusJobHandled={handleFocusJobHandled}
                            onEdit={handleEditJob}
                            onDelete={handleCardDelete}
                            onReport={handleReport}
                            user={loggedInUser}
                            activeAccount={activeAccount}
                            center={mapCenter}
                            zoomLevel={mapZoom}
                        />
                    </Box>

                    <Drawer anchor="bottom" open={mobileMapFilterOpen} onClose={() => setMobileMapFilterOpen(false)}
                            transitionDuration={{ enter: 280, exit: 220 }} ModalProps={{ keepMounted: false }}
                            PaperProps={{ sx: (t) => ({ maxHeight: "85dvh", "@supports not (max-height: 1dvh)": { maxHeight: "85vh" },
                                    borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: t.palette.background.paper,
                                    overflow: "hidden", display: "flex", flexDirection: "column" }) }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                            <TuneIcon sx={{ fontSize: 22, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                            <IconButton onClick={() => setMobileMapFilterOpen(false)} size="small" sx={{ width: 34, height: 34, borderRadius: 999 }}>
                                <CloseIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>
                        <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <SearchInput placeholder="Search jobs..." value={searchDraft}
                                         onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                                         inputProps={{ maxLength: 120, autoFocus: true }}
                                         onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollJobsToTop(); setMobileMapFilterOpen(false); }}
                                         onClear={() => { setSearchDraft(""); setSearch(""); scrollJobsToTop(); }} />
                        </Box>
                        <Box sx={{ flex: 1, overflow: "auto", px: 2, pt: 1, pb: 2 }}>
                            <JobsFilterBar filters={filters} onChangeFilters={(v) => { setFilters(v); scrollJobsToTop(); }} compactChrome
                                           categories={categories} categoriesLoading={categoriesLoading} categoriesError={categoriesError}
                                           view={isMyMode ? "all" : leftMode} onViewChange={handleViewChange}
                                           sort={sort} onSortChange={(v) => { setSort(v); scrollJobsToTop(); }}
                                           isMyMode={isMyMode} myJobsStatus={myJobsStatus}
                                           onMyJobsStatusChange={(v) => { setMyJobsStatus(v); scrollJobsToTop(); }}
                                           locationCounts={jobLocationCounts}
                                           viewer={loggedInUser}
                                           search={search}
                                           onSearchChange={handleSavedSearchChange}
                                           onClearAll={clearAllFilters} />
                        </Box>
                        <Box sx={(t) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                            <Button onClick={clearAllFilters} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}>Reset</Button>
                            <Button variant="contained" onClick={() => { setSearch(String(searchDraft || "").trim()); scrollJobsToTop(); setMobileMapFilterOpen(false); }}
                                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, height: 42, bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: "none", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                                Show Results
                            </Button>
                        </Box>
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            {/* Create modal */}
            <CreateJobModal
                open={createOpen}
                onClose={() => { setCreateOpen(false); setEditingJob(null); }}
                onCreated={() => {
                    const wasEditing = Boolean(editingJob);
                    if (!wasEditing) recordJobCreate();
                    setSort("newest");
                    if (leftMode !== "all") setLeftMode("all");
                    setEditingJob(null);
                    refresh();
                    showSuccess(wasEditing ? "Job updated successfully" : "Job posted successfully");
                }}
                editingJob={editingJob}
            />

            {/* Delete confirmation dialog (from card menu) */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Job</Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={() => setDeleteTarget(null)}
                        disabled={isDeleting}
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
                        </Typography>
                        {deleteError ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {deleteError.message || "Failed to delete job."}
                            </Alert>
                        ) : null}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={handleCloseUserCard}
                user={userForCard}
                viewer={loggedInUser}
                isSelf={isSelfForCard}

                onViewProfile={handleViewUserProfile}
            />

            <Dialog
                open={reportOpen}
                onClose={() => { setReportOpen(false); setReportTarget(null); }}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
            >
                {reportSubmitted ? (
                    <>
                        <DialogContent sx={{ textAlign: "center", py: 5, px: 3 }}>
                            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                Thank you for your report
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}>
                                We take reports seriously and will review this job. If it violates our community guidelines, we'll take appropriate action.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                onClick={() => { setReportOpen(false); setReportTarget(null); setTimeout(() => { setReportSubmitted(false); setReportReason(""); setReportDetails(""); }, 250); }}
                                fullWidth variant="contained" disableElevation
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, py: 1 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FlagOutlinedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                Report job
                            </Box>
                            <IconButton size="small" onClick={() => { setReportOpen(false); setReportTarget(null); }} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this job? Your report is anonymous.
                            </Typography>
                            <RadioGroup value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                                {[
                                    { value: "spam", label: "Spam or misleading" },
                                    { value: "inappropriate", label: "Inappropriate content" },
                                    { value: "scam", label: "Scam or fraud" },
                                    { value: "other", label: "Other" },
                                ].map((opt) => (
                                    <FormControlLabel
                                        key={opt.value} value={opt.value}
                                        control={<Radio size="small" />}
                                        label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                        sx={{ mx: 0, py: 0.25, px: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
                                    />
                                ))}
                            </RadioGroup>
                            <TextField
                                multiline minRows={3} maxRows={6} fullWidth
                                placeholder="Add any additional details that might help us review this report…"
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                                {reportDetails.length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button onClick={() => { setReportOpen(false); setReportTarget(null); }} sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    setReportSubmitting(true);
                                    await submitReport({ reason: reportReason, details: reportDetails });
                                    setReportSubmitting(false);
                                    setReportSubmitted(true);
                                }}
                                variant="contained" disableElevation
                                disabled={!reportReason || reportSubmitting}
                                startIcon={reportSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <ShareDialog
                contentType="job"
                open={Boolean(shareTarget)}
                onClose={() => setShareTarget(null)}
                job={shareTarget}
                viewer={loggedInUser}
            />

            {/* Apply dialog */}
            <ApplyToJobDialog
                open={Boolean(applyTarget)}
                onClose={() => setApplyTarget(null)}
                job={applyTarget}
                user={loggedInUser}
                onApplied={handleJobApplied}
            />

            {/* Renew dialog */}
            <Dialog open={Boolean(renewTarget)} onClose={() => setRenewTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                        {extendRemaining > 0 ? "Extend Job Listing" : "Renew Job Listing"}
                    </Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={() => setRenewTarget(null)}
                        disabled={isRenewing}
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {extendRemaining > 0
                                ? <>How many days would you like to add to &quot;{renewTarget?.title}&quot;?</>
                                : <>How long would you like to renew &quot;{renewTarget?.title}&quot;?</>}
                        </Typography>

                        {/* Current status chip */}
                        <Box
                            sx={(t) => ({
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: extendRemaining > 0
                                    ? alpha(t.palette.success.main, 0.06)
                                    : alpha(t.palette.error.main, 0.06),
                                border: "1px solid",
                                borderColor: extendRemaining > 0
                                    ? alpha(t.palette.success.main, 0.15)
                                    : alpha(t.palette.error.main, 0.15),
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            })}
                        >
                            <AccessTimeRoundedIcon
                                sx={{
                                    fontSize: 16,
                                    color: extendRemaining > 0 ? "success.main" : "error.main",
                                }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                {extendRemaining > 0
                                    ? `${extendRemaining} day${extendRemaining === 1 ? "" : "s"} remaining`
                                    : "Listing expired"}
                            </Typography>
                        </Box>

                        {(() => {
                            const maxExtend = Math.max(0, MAX_LISTING_DAYS - extendRemaining);
                            const availableOptions = EXTEND_OPTIONS.filter((d) => d <= maxExtend);

                            if (maxExtend <= 0) {
                                return (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        This listing already has {extendRemaining} days remaining
                                        (maximum {MAX_LISTING_DAYS}). No extension needed.
                                    </Alert>
                                );
                            }

                            return (
                                <>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Extend by"
                                        value={availableOptions.includes(renewDays) ? renewDays : (availableOptions[availableOptions.length - 1] || renewDays)}
                                        onChange={(e) => setRenewDays(Number(e.target.value))}
                                    >
                                        {availableOptions.map((d) => (
                                            <MenuItem key={d} value={d}>
                                                {d} day{d === 1 ? "" : "s"}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* New expiry preview */}
                                    <Box
                                        sx={(t) => ({
                                            p: 1.25,
                                            borderRadius: 2,
                                            bgcolor: alpha(t.palette.primary.main, 0.04),
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.primary.main, 0.12),
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        })}
                                    >
                                        <AutorenewRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                            New expiry: {futureDate(extendRemaining + renewDays)} ({extendRemaining + renewDays} day{(extendRemaining + renewDays) === 1 ? "" : "s"} total)
                                        </Typography>
                                    </Box>
                                </>
                            );
                        })()}

                        {renewError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{renewError.message || "Failed to renew."}</Alert> : null}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setRenewTarget(null)} disabled={isRenewing}>Cancel</Button>
                            <Button
                                variant="contained"
                                onClick={handleConfirmRenew}
                                disabled={isRenewing || (MAX_LISTING_DAYS - extendRemaining) <= 0}
                                startIcon={<AutorenewRoundedIcon />}
                                sx={(t) => ({ fontWeight: 900, color: t.palette.common.white })}
                            >
                                {isRenewing
                                    ? "Extending..."
                                    : extendRemaining > 0
                                        ? "Extend"
                                        : "Renew"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Rate limit dialog */}
            <RateLimitDialog
                open={rateLimitOpen}
                onClose={() => setRateLimitOpen(false)}
                retryAfterSec={rateLimitInfo.retryAfterSec}
                reason={rateLimitInfo.reason}
                actionLabel={rateLimitInfo.actionLabel}
            />

            {/* Job posting limit dialog */}
            <Dialog
                open={limitDialog.open}
                onClose={() => setLimitDialog({ open: false, title: "", message: "" })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    {limitDialog.title}
                    <IconButton
                        onClick={() => setLimitDialog({ open: false, title: "", message: "" })}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {limitDialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setLimitDialog({ open: false, title: "", message: "" })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, boxShadow: "none" }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            <SuccessSnackbar {...successSnackbarProps} />
        </Box>
    );
}
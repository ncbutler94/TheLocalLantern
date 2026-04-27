// src/pages/business/components/BusinessDirectoryCard.jsx
//
// BusinessDirectoryCard
// ---------------------
// Professional directory-style business card for BusinessHubPage.
// Shows comprehensive business info at a glance with beautiful styling.
// Now uses MuiCard variant="post" from theme for consistent card styling.
// Features category icons, entity type badges, contact info, and social links.
//
// Exports:
// - BusinessDirectoryCard
// - BusinessDirectoryCardSkeleton

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Radio,
    RadioGroup,
    Rating,
    Skeleton,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SvgIcon from '@mui/material/SvgIcon';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ShareDialog from '../../../components/ShareDialog';
import { ReportDialog } from '../../../components/ActionBar';
import SuccessSnackbar from '../../../components/SuccessSnackbar';
import SmartMenu from '../../../components/SmartMenu';
import DataSourceAttribution from '../../../components/DataSourceAttribution';

// Category Icons (matching BusinessFilterBar)
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import YardIcon from '@mui/icons-material/Yard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SchoolIcon from '@mui/icons-material/School';
import PetsIcon from '@mui/icons-material/Pets';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import BuildIcon from '@mui/icons-material/Build';
import CategoryIcon from '@mui/icons-material/Category';

// Entity Type Icons
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';

import { useActiveAccount } from '../../../components/AccountContext';
import { useAuth } from '../../../components/AuthModalContext';
import { secureFetch } from '../../../utils/secureFetch';


// Category icon mapping (matching BusinessFilterBar)
const BUSINESS_CATEGORY_ICON = {
    food_drink: RestaurantIcon,
    shopping_retail: StorefrontIcon,
    automotive: DirectionsCarIcon,
    home_services: HomeRepairServiceIcon,
    home_garden: YardIcon,
    health_wellness: MedicalServicesIcon,
    beauty_personal_care: ContentCutIcon,
    fitness_recreation: FitnessCenterIcon,
    professional_services: BusinessCenterIcon,
    education_childcare: SchoolIcon,
    pets_animals: PetsIcon,
    travel_lodging: TravelExploreIcon,
    arts_entertainment: TheaterComedyIcon,
    community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildIcon,
    other: CategoryIcon,
};

// Category display labels (matching BusinessPublicPage)
const CATEGORY_LABELS = {
    food_drink: 'Food & Drink',
    shopping_retail: 'Shopping & Retail',
    automotive: 'Automotive',
    home_services: 'Home Services',
    home_garden: 'Home & Garden',
    health_wellness: 'Health & Wellness',
    beauty_personal_care: 'Beauty & Personal Care',
    fitness_recreation: 'Fitness & Recreation',
    professional_services: 'Professional Services',
    education_childcare: 'Education & Childcare',
    pets_animals: 'Pets & Animals',
    travel_lodging: 'Travel & Lodging',
    arts_entertainment: 'Arts & Entertainment',
    community_nonprofit: 'Community & Nonprofit',
    technology_repair: 'Technology & Repair',
    other: 'Other',
};

// Entity type configuration (labels and icons only - styling handled by theme)
const ENTITY_TYPE_CONFIG = {
    business: {
        label: 'Business',
        icon: StorefrontRoundedIcon,
    },
    organization: {
        label: 'Organization',
        icon: GroupsRoundedIcon,
    },
    nonprofit: {
        label: 'Nonprofit',
        icon: VolunteerActivismIcon,
    },
    government: {
        label: 'Government',
        icon: AccountBalanceRoundedIcon,
    },
};

// Category colors - simplified to use theme (primary green for category, neutral for entity)
// Colors are now handled by MUI Chip's color prop leveraging theme.js

const BUSINESS_FOLLOW_EVENT = 'll:business:follow-changed';

// Fixed card height so every BusinessDirectoryCard, ArtistCard, and ServiceCard are the same size
const CARD_FIXED_HEIGHT = 248;

function getBusinessFollowStateCache() {
    if (typeof window === 'undefined') return {};
    if (!window.__llBusinessFollowStateCache) window.__llBusinessFollowStateCache = {};
    return window.__llBusinessFollowStateCache;
}

function readBusinessFollowState(businessId, accountKey) {
    if (!businessId) return null;
    const cache = getBusinessFollowStateCache();
    return cache[`${String(businessId)}:${accountKey || 'personal'}`] || null;
}

function writeBusinessFollowState(businessId, isFollowing, accountKey) {
    if (!businessId) return;
    const cache = getBusinessFollowStateCache();
    cache[`${String(businessId)}:${accountKey || 'personal'}`] = {
        isFollowing: Boolean(isFollowing),
        t: Date.now(),
    };
}

const stripHtml = (html) => {
    const s = String(html ?? '').trim();
    if (!s) return '';
    // Strip HTML tags and decode common entities for plain-text card preview
    return s
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/?(p|div|li|h[1-6]|blockquote)[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

const clampText = (value, max = 280) => {
    const s = stripHtml(value);
    if (!s) return '';
    if (s.length <= max) return s;
    return `${s.slice(0, max).trimEnd()}…`;
};

// Lantern gold for hover states (matching EventCard)

function pickBusinessLogo(business) {
    if (!business || typeof business !== 'object') return '';
    const candidates = [
        business.logo_url,
        business.logoUrl,
        business.avatar_url,
        business.avatarUrl,
        business.image_url,
        business.imageUrl,
        business.photo_url,
        business.photoUrl,
    ];
    for (const c of candidates) {
        const s = String(c || '').trim();
        if (s && s !== 'null' && s !== 'undefined') return s;
    }
    return '';
}

function formatWebsiteUrl(url) {
    const s = String(url || '').trim();
    if (!s) return '';
    return s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function getCategoryIcon(categoryKey) {
    const key = String(categoryKey || '').toLowerCase().replace(/[^a-z_]/g, '');
    return BUSINESS_CATEGORY_ICON[key] || CategoryIcon;
}

function getCategoryLabel(categoryKey) {
    const key = String(categoryKey || '').toLowerCase().replace(/[^a-z_]/g, '');
    return CATEGORY_LABELS[key] || '';
}

function getEntityTypeConfig(entityType) {
    const key = String(entityType || 'business').toLowerCase().replace(/[^a-z]/g, '');
    return ENTITY_TYPE_CONFIG[key] || ENTITY_TYPE_CONFIG.business;
}

// Build social URL (same logic as BusinessPublicPage)
function buildSocialUrl(url, platform) {
    if (!url) return '';
    const s = String(url).trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;

    switch (platform) {
        case 'facebook':
            return `https://facebook.com/${s.replace(/^@/, '')}`;
        case 'instagram':
            return `https://instagram.com/${s.replace(/^@/, '')}`;
        case 'twitter':
            return `https://x.com/${s.replace(/^@/, '')}`;
        case 'linkedin':
            return `https://linkedin.com/in/${s.replace(/^@/, '')}`;
        case 'etsy':
            return `https://etsy.com/shop/${s.replace(/^@/, '')}`;
        default:
            return s;
    }
}

// ─── Hours helpers (shared with BusinessDetailPanel pattern) ─────────────────

const CARD_DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const CARD_DAY_DISP = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

function parseCardHours(hoursData) {
    if (!hoursData) return null;
    const parsed = typeof hoursData === 'string'
        ? (() => { try { return JSON.parse(hoursData); } catch { return null; } })()
        : hoursData;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
}

function formatTo12Hr(timeStr) {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
}

/**
 * Compute the live Open/Closed status for a business.
 * Returns { statusLabel, statusColor, detailLabel } or null if no hours data.
 */
function getHoursStatus(hoursRaw) {
    const parsed = parseCardHours(hoursRaw);
    if (!parsed) return null;

    const hasAny = CARD_DAY_ORDER.some((d) => {
        const e = parsed[d];
        if (!e) return false;
        if (e.closed) return true;
        return String(e.open || '').trim().length > 0 && String(e.close || '').trim().length > 0;
    });
    if (!hasAny) return null;

    const now = new Date();
    const todayIdx = now.getDay();
    const todayKey = CARD_DAY_ORDER[todayIdx];
    const todayData = parsed[todayKey];

    let statusLabel = 'Closed';
    let statusColor = 'error.main';
    let detailLabel = '';

    if (todayData) {
        if (todayData.allDay) {
            statusLabel = 'Open';
            statusColor = 'success.main';
            detailLabel = '24 hours today';
        } else if (!todayData.closed && todayData.open && todayData.close) {
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const [oh, om] = (todayData.open || '0:0').split(':').map(Number);
            const [ch, cm] = (todayData.close || '0:0').split(':').map(Number);
            const openMins = oh * 60 + (om || 0);
            const closeMins = ch * 60 + (cm || 0);
            if (closeMins > openMins) {
                if (nowMins >= openMins && nowMins < closeMins) {
                    statusLabel = 'Open'; statusColor = 'success.main';
                    detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                } else {
                    statusLabel = 'Closed'; statusColor = 'error.main';
                    detailLabel = nowMins < openMins ? `Opens ${formatTo12Hr(todayData.open)}` : '';
                }
            } else {
                if (nowMins >= openMins || nowMins < closeMins) {
                    statusLabel = 'Open'; statusColor = 'success.main';
                    detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                } else {
                    statusLabel = 'Closed'; statusColor = 'error.main';
                    detailLabel = `Opens ${formatTo12Hr(todayData.open)}`;
                }
            }
        } else {
            statusLabel = 'Closed'; statusColor = 'error.main';
            for (let i = 1; i <= 7; i++) {
                const nextIdx = (todayIdx + i) % 7;
                const nextKey = CARD_DAY_ORDER[nextIdx];
                const nextData = parsed[nextKey];
                if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                    detailLabel = `Opens ${CARD_DAY_DISP[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                    break;
                }
            }
        }
    } else {
        for (let i = 1; i <= 7; i++) {
            const nextIdx = (todayIdx + i) % 7;
            const nextKey = CARD_DAY_ORDER[nextIdx];
            const nextData = parsed[nextKey];
            if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                detailLabel = `Opens ${CARD_DAY_DISP[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                break;
            }
        }
    }

    return { statusLabel, statusColor, detailLabel };
}

async function fetchBusinessFollowState({ businessId, accountKey, getAccountParams, getAccountHeaders }) {
    if (!businessId) return false;
    const qs = new URLSearchParams({
        target_id: String(businessId),
        target_type: 'business',
    });
    const headers = typeof getAccountHeaders === 'function' ? (getAccountHeaders() || {}) : {};
    const res = await secureFetch(`/api/follows/status?${qs.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'application/json', ...headers },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    const next = Boolean(data?.following);
    writeBusinessFollowState(businessId, next, accountKey);
    return next;
}

async function toggleBusinessFollowState({ businessId, isFollowing, getAccountPayload, getAccountHeaders }) {
    const payload = {
        target_id: Number(businessId),
        target_type: 'business',
        action: isFollowing ? 'unfollow' : 'follow',
    };
    try {
        const acctPayload = typeof getAccountPayload === 'function' ? getAccountPayload() : {};
        // Merge account context but preserve our target fields
        const { target_id: _tid, target_type: _tt, action: _a, ...safeAcct } = acctPayload || {};
        Object.assign(payload, safeAcct);
    } catch {
        // ignore
    }
    const headers = typeof getAccountHeaders === 'function' ? (getAccountHeaders() || {}) : {};
    const res = await secureFetch('/api/follows/toggle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Follow toggle failed');
    const data = await res.json().catch(() => null);
    return Boolean(data?.following ?? data?.isFollowing ?? !isFollowing);
}


// Report dialog now uses shared ReportDialog from ActionBar

export function BusinessDirectoryCardSkeleton() {
    return (
        <Card
            sx={(t) => ({
                position: 'relative',
                isolation: 'isolate',
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(t.palette.text.primary, 0.10),
                backgroundColor: t.palette.background.paper,
                overflow: 'hidden',
                boxShadow: t.custom.shadows.sm,
            })}
        >
            {/* Main content area */}
            <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: 1.5 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Skeleton variant="circular" sx={{ width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                        <Skeleton height={20} width="55%" sx={{ mb: 0.35 }} />
                        {/* Star rating placeholder */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.35 }}>
                            <Skeleton variant="rounded" width={72} height={14} />
                            <Skeleton width={24} height={12} />
                        </Box>
                        <Skeleton height={13} width="40%" sx={{ mb: 0.5 }} />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Skeleton variant="rounded" width={90} height={22} sx={{ borderRadius: 999 }} />
                            <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius: 999 }} />
                        </Box>
                    </Box>
                </Box>

                {/* Description - fixed height */}
                <Box sx={{ mt: 1, minHeight: 24 }}>
                    <Skeleton height={14} width="90%" />
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ px: { xs: 1.25, sm: 2 }, pb: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="rounded" width={95} height={24} sx={{ borderRadius: 999 }} />
                </Box>
                <Skeleton width={90} height={13} />
            </Box>
        </Card>
    );
}

export function BusinessDirectoryCard({ business, selected, hovered, onSelect, onHover, onLocationClick, isFollowing, user, flat = false }) {
    const [avatarError, setAvatarError] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const {
        isBusinessAccount: isBA,
        activeBusinessId: aBizId,
        isArtistAccount: isAA,
        activeArtistId: aArtId,
        getAccountPayload,
        getAccountParams,
        getAccountHeaders,
        accountCacheKey = 'personal',
    } = useActiveAccount();

    // ── Stable refs for account helper functions to prevent infinite re-render loops ──
    // These functions are recreated every render by the context provider, so using
    // them directly in useEffect / useCallback dependency arrays causes setState
    // inside useEffect → re-render → new function ref → effect fires again → loop.
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;
    const getAccountParamsRef = useRef(getAccountParams);
    getAccountParamsRef.current = getAccountParams;
    const getAccountHeadersRef = useRef(getAccountHeaders);
    getAccountHeadersRef.current = getAccountHeaders;
    const auth = useAuth();
    const authRef = useRef(auth);
    authRef.current = auth;
    const viewer = user || auth?.user || null;
    const [bizMenuEl, setBizMenuEl] = useState(null);
    const [bizReportOpen, setBizReportOpen] = useState(false);
    const [bizReportSubmitted, setBizReportSubmitted] = useState(false);
    const [bizReportSubmitting, setBizReportSubmitting] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [localFollowing, setLocalFollowing] = useState(Boolean(isFollowing));
    const [followBusy, setFollowBusy] = useState(false);
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');

    // Hide follow button when actively switched to this business account
    const bizOwnerUserId = Number(business?.owner_user_id || business?.user_id || 0);
    const isOwnBusiness = Boolean(
        (isBA && aBizId && business?.id && String(aBizId) === String(business.id)) ||
        (viewer?.id && bizOwnerUserId > 0 && Number(viewer.id) === bizOwnerUserId)
    );

    useEffect(() => {
        const businessId = Number(business?.id || 0);
        if (!businessId) {
            setLocalFollowing(false);
            return;
        }
        const cached = readBusinessFollowState(businessId, accountCacheKey);
        if (cached && typeof cached.isFollowing === 'boolean') {
            setLocalFollowing(Boolean(cached.isFollowing));
            return;
        }
        setLocalFollowing(Boolean(isFollowing));
    }, [business?.id, isFollowing, accountCacheKey]);

    useEffect(() => {
        let cancelled = false;
        const businessId = Number(business?.id || 0);
        if (!businessId || !viewer?.id || isOwnBusiness) {
            setLocalFollowing(false);
            return undefined;
        }

        fetchBusinessFollowState({ businessId, accountKey: accountCacheKey, getAccountParams: getAccountParamsRef.current, getAccountHeaders: getAccountHeadersRef.current })
            .then((next) => {
                if (!cancelled) setLocalFollowing(Boolean(next));
            })
            .catch(() => {
                if (!cancelled) setLocalFollowing(Boolean(readBusinessFollowState(businessId, accountCacheKey)?.isFollowing || false));
            });

        return () => {
            cancelled = true;
        };
    }, [business?.id, viewer?.id, isOwnBusiness, accountCacheKey]);

    useEffect(() => {
        const businessId = Number(business?.id || 0);
        if (!businessId) return undefined;

        const handler = (e) => {
            const detail = e?.detail || {};
            if (Number(detail.businessId) !== businessId) return;
            if (detail.accountCacheKey && detail.accountCacheKey !== accountCacheKey) return;
            setLocalFollowing(Boolean(detail.isFollowing));
            writeBusinessFollowState(businessId, Boolean(detail.isFollowing), accountCacheKey);
        };

        window.addEventListener(BUSINESS_FOLLOW_EVENT, handler);
        return () => window.removeEventListener(BUSINESS_FOLLOW_EVENT, handler);
    }, [business?.id, accountCacheKey]);

    const handleFollowToggle = useCallback(async (event) => {
        event.stopPropagation();
        event.preventDefault();

        const businessId = Number(business?.id || 0);
        if (!businessId || followBusy || isOwnBusiness) return;

        if (!viewer?.id) {
            if (typeof authRef.current?.requireAuth === 'function') {
                try {
                    await authRef.current.requireAuth();
                } catch {
                    // ignore
                }
            }
            return;
        }

        const previous = Boolean(localFollowing);
        setFollowBusy(true);
        setLocalFollowing(!previous);
        writeBusinessFollowState(businessId, !previous, accountCacheKey);

        try {
            const next = await toggleBusinessFollowState({
                businessId,
                isFollowing: previous,
                getAccountPayload: getAccountPayloadRef.current,
                getAccountHeaders: getAccountHeadersRef.current,
            });
            setLocalFollowing(next);
            writeBusinessFollowState(businessId, next, accountCacheKey);
            window.dispatchEvent(new CustomEvent(BUSINESS_FOLLOW_EVENT, {
                detail: { businessId, isFollowing: next, accountCacheKey, source: 'directoryCard' },
            }));
        } catch {
            setLocalFollowing(previous);
            writeBusinessFollowState(businessId, previous, accountCacheKey);
        } finally {
            setFollowBusy(false);
        }
    }, [business?.id, followBusy, isOwnBusiness, viewer?.id, localFollowing, accountCacheKey]);

    const name = String(business?.name || 'Business').trim() || 'Business';
    const slug = String(business?.slug || business?.handle || '').trim();
    // Detect auto-generated profiles from Google Places (no owner on the platform yet)
    const isUnclaimed = Boolean(business?.is_unclaimed);
    const categoryKey = String(business?.category_key || business?.categoryKey || '').trim();
    // Derive label from category_key only (matches BusinessPublicPage / BusinessDetailPanel).
    // We intentionally do NOT fall back to the free-text `category` column — that field can
    // drift out of sync with `category_key` (e.g. manual DB inserts) and produce wrong chips.
    const category = getCategoryLabel(categoryKey);
    const entityType = String(business?.entity_type || business?.entityType || 'business').trim();

    const city = String(business?.city || '').trim();
    const countyRaw = String(business?.county || '').trim();
    const county = countyRaw
        ? (countyRaw.toLowerCase().includes('county') ? countyRaw : `${countyRaw} County`)
        : '';
    const location = [city, county].filter(Boolean).join(', ') || 'Alabama';
    const isStatewide = Boolean(business?.is_statewide || business?.isStatewide);

    const description = clampText(business?.description || business?.about || business?.summary || '', 320);
    const logo = pickBusinessLogo(business);
    const hasValidLogo = logo && !avatarError;

    // Contact info (may or may not be present)
    const phone = String(business?.phone || business?.phone_number || '').trim();
    const website = String(business?.website_url || business?.websiteUrl || business?.website || '').trim();
    const email = String(business?.email_public || business?.emailPublic || business?.email || '').trim();

    // Social links
    const facebookUrl = String(business?.facebook_url || business?.facebookUrl || '').trim();
    const instagramUrl = String(business?.instagram_url || business?.instagramUrl || '').trim();
    const twitterUrl = String(business?.twitter_url || business?.twitterUrl || '').trim();
    const linkedinUrl = String(business?.linkedin_url || business?.linkedinUrl || '').trim();
    const etsyUrl = String(business?.etsy_url || business?.etsyUrl || '').trim();
    const hasSocials = facebookUrl || instagramUrl || twitterUrl || website;

    // Rating (for future use - UI ready)
    const baseRating = Number(business?.rating || business?.avg_rating || 0);
    const baseReviewCount = Number(business?.review_count || business?.reviewCount || 0);

    // Local overrides from review-changed events
    const [localRating, setLocalRating] = useState(null);
    const [localReviewCount, setLocalReviewCount] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !business?.id || String(d.businessId) !== String(business.id)) return;
            setLocalRating(Number(d.averageRating || 0));
            setLocalReviewCount(Number(d.reviewCount || 0));
        };
        window.addEventListener('ll:business:review-changed', handler);
        return () => window.removeEventListener('ll:business:review-changed', handler);
    }, [business?.id]);

    const rating = localRating != null ? localRating : baseRating;
    const reviewCount = localReviewCount != null ? localReviewCount : baseReviewCount;

    // Hours status (Open / Closed with detail)
    const hoursRaw = business?.hours || business?.hours_json || null;
    const hoursStatus = getHoursStatus(hoursRaw);

    // ── Business settings (from business_settings table, included in API response) ──
    const bizSettings = business?.settings || business?.businessSettings || business;
    const businessAllowReviews = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.allow_reviews ?? bizSettings.allowReviews;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();
    const businessHoursVisible = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.hours_visibility ?? bizSettings.hoursVisibility;
        if (v == null) return true;
        return String(v).toLowerCase() !== 'hidden';
    })();

    // Address + map pin (show street address in footer if business has coordinates)
    const address = String(business?.address || '').trim();
    const hasMapPin = Boolean(
        business?.latitude && business?.longitude &&
        Number.isFinite(Number(business.latitude)) && Number.isFinite(Number(business.longitude))
    );
    const hasStreetAddress = Boolean(address && hasMapPin);

    // Get category icon
    const CategoryIconComp = getCategoryIcon(categoryKey);
    const entityConfig = getEntityTypeConfig(entityType);
    const EntityIconComp = entityConfig.icon;
    const bizMenuOpen = Boolean(bizMenuEl);
    const businessIsVerified = Boolean(
        business?.is_verified === true || business?.is_verified === 1 || business?.is_verified === "1" ||
        business?.isVerified === true || business?.isVerified === 1 || business?.isVerified === "1"
    );

    const handleBizMenuOpen = (event) => {
        event.stopPropagation();
        event.preventDefault();
        setBizMenuEl(event.currentTarget);
    };

    const handleBizMenuClose = () => setBizMenuEl(null);

    const handleBizCopyLink = () => {
        handleBizMenuClose();
        const path = slug ? `/${slug}` : `/business/${encodeURIComponent(String(business?.id || ''))}`;
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url)
            .then(() => setCopyLinkToast(true))
            .catch(() => setCopyLinkToast(true));
    };

    const handleBizReportClick = () => {
        handleBizMenuClose();
        setBizReportSubmitted(false);
        setBizReportOpen(true);
    };

    const submitBizReport = async ({ reason, details }) => {
        const bizId = business?.id;
        if (!bizId || bizReportSubmitting) return;

        setBizReportSubmitting(true);
        const urls = [
            `/api/business/${encodeURIComponent(bizId)}/report`,
            `/api/business/${encodeURIComponent(bizId)}/flag`,
        ];

        let submitted = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    submitted = true;
                    break;
                }
            } catch (error) {
                // try fallback endpoint
            }
        }

        if (submitted) {
            setBizReportSubmitted(true);
        }
        setBizReportSubmitting(false);
    };

    const handleHideBusiness = useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        handleBizMenuClose();
        setHideBusy(true);
        const displayName = String(business?.name || 'Business').trim() || 'Business';
        try {
            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'hide' };
            if (isBA && aBizId) payload.actor_business_id = Number(aBizId);
            if (isAA && aArtId) payload.actor_artist_id = Number(aArtId);
            const urls = [`${apiBase}/api/users/hide`, '/api/users/hide'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'directoryCard' } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        setHideBlockToast(`Posts from ${displayName} hidden`);
                        return;
                    }
                } catch { /* try next */ }
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, handleBizMenuClose, isBA, aBizId, isAA, aArtId]);

    const handleBlockBusiness = useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        handleBizMenuClose();
        setBlockBusy(true);
        const displayName = String(business?.name || 'Business').trim() || 'Business';
        try {
            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'block' };
            if (isBA && aBizId) payload.actor_business_id = Number(aBizId);
            if (isAA && aArtId) payload.actor_artist_id = Number(aArtId);
            const urls = [`${apiBase}/api/users/block`, '/api/users/block'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'directoryCard' } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        setHideBlockToast(`${displayName} blocked`);
                        return;
                    }
                } catch { /* try next */ }
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, handleBizMenuClose, isBA, aBizId, isAA, aArtId]);

    return (
        <Card
            data-hovered={hovered ? "true" : undefined}
            data-selected={selected ? "true" : undefined}
            onMouseEnter={() => onHover?.(business?.id ?? null)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => { if (bizReportOpen || copyLinkToast || shareDialogOpen) return; onSelect?.(business); }}
            elevation={0}
            sx={(t) => ({
                position: 'relative',
                isolation: flat ? 'auto' : 'isolate',
                borderRadius: flat ? '0 !important' : '16px',
                border: flat ? '0 !important' : '1px solid',
                display: 'flex',
                flexDirection: 'column',
                height: flat ? 'auto' : CARD_FIXED_HEIGHT,
                borderColor: flat
                    ? 'transparent'
                    : selected
                        ? t.palette.secondary.main
                        : alpha(t.palette.text.primary, 0.08),
                backgroundColor: t.palette.background.paper,
                ...(flat ? { backgroundImage: 'none !important', boxShadow: 'none !important',
                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                } : {}),
                overflow: flat ? 'visible' : 'hidden',
                boxShadow: flat
                    ? 'none'
                    : selected
                        ? '0 8px 32px rgba(0,0,0,0.12)'
                        : hovered
                            ? '0 6px 20px rgba(0,0,0,0.08)'
                            : '0 2px 8px rgba(0,0,0,0.04)',
                transition: flat ? 'none' : 'all 180ms ease',
                transform: 'translateY(0)',
                cursor: 'pointer',
            })}
        >
            <Box
                sx={{
                    p: flat ? 0 : { xs: 1.5, sm: 2 },
                    px: flat ? 2 : undefined,
                    pt: flat ? 1.5 : undefined,
                    pb: flat ? 0.5 : 1.5,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    overflow: flat ? 'visible' : 'hidden',
                }}
            >
                {/* Header: Logo + Name + 3-dot menu in flow (matching ServiceCard pattern) */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Header: Logo + Name + Category/Entity */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'flex-start',
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            minWidth: 0,
                            flex: 1,
                        }}
                    >
                        {/* Business Logo - matches BusinessPostCard styling */}
                        <Avatar
                            src={hasValidLogo ? logo : undefined}
                            onError={() => setAvatarError(true)}
                            alt={name}
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                color: 'primary.main',
                                flexShrink: 0,
                                border: '2px solid',
                                borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                            }}
                            imgProps={{ referrerPolicy: 'no-referrer' }}
                        >
                            <StorefrontOutlinedIcon sx={{ fontSize: 32 }} />
                        </Avatar>

                        {/* Name, Location, Category + Entity Type */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Name + Verified */}
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: '1.05rem',
                                        lineHeight: 1.25,
                                        color: 'text.primary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {name}
                                </Typography>
                                {businessIsVerified ? (
                                    <Tooltip title="Verified Business" arrow>
                                        <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
                                    </Tooltip>
                                ) : null}
                            </Stack>

                            {/* Username / handle — OR "Unclaimed Listing" label for auto-generated profiles */}
                            {isUnclaimed ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.15 }}>
                                    <Typography
                                        sx={(t) => ({
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            lineHeight: 1.2,
                                            color: 'text.secondary',
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.4,
                                        })}
                                        noWrap
                                    >
                                        <Box
                                            component="span"
                                            sx={(t) => ({
                                                display: 'inline-block',
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                bgcolor: alpha(t.palette.text.secondary, 0.5),
                                            })}
                                        />
                                        Unclaimed Listing
                                    </Typography>
                                    <DataSourceAttribution
                                        dataSource={business?.data_source}
                                        variant="card"
                                    />
                                </Box>
                            ) : slug && (
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.78rem',
                                        lineHeight: 1.2,
                                        color: 'text.secondary',
                                        mt: 0.15,
                                    }}
                                    noWrap
                                >
                                    @{slug}
                                </Typography>
                            )}

                            {/* Category + Entity type chips — under handle */}
                            {(category || (entityType && entityType !== 'business')) && (
                                <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ mt: 0.35, flexWrap: 'wrap', gap: 0.5 }}
                                >
                                    {category && (
                                        <Chip
                                            icon={<CategoryIconComp sx={{ fontSize: '13px !important' }} />}
                                            size="small"
                                            label={category}
                                            sx={(t) => ({
                                                height: 22,
                                                borderRadius: 999,
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                color: t.custom?.primaryText || t.palette.primary.main,
                                                fontWeight: 800,
                                                fontSize: 10.5,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.25),
                                                '& .MuiChip-icon': {
                                                    color: t.custom?.primaryText || t.palette.primary.main,
                                                    ml: 0.5,
                                                },
                                                '& .MuiChip-label': {
                                                    px: 0.75,
                                                    lineHeight: 1,
                                                },
                                            })}
                                        />
                                    )}
                                    {entityType && entityType !== 'business' && (
                                        <Chip
                                            icon={<EntityIconComp sx={{ fontSize: '12px !important' }} />}
                                            size="small"
                                            label={entityConfig.label}
                                            sx={(t) => ({
                                                height: 22,
                                                borderRadius: 999,
                                                bgcolor: alpha(t.palette.text.primary, 0.04),
                                                color: t.palette.text.secondary,
                                                fontWeight: 600,
                                                fontSize: 10.5,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                '& .MuiChip-icon': {
                                                    color: t.palette.text.secondary,
                                                    ml: 0.5,
                                                    mr: -0.25,
                                                },
                                                '& .MuiChip-label': {
                                                    px: 0.75,
                                                },
                                            })}
                                        />
                                    )}
                                </Stack>
                            )}

                            {/* Star Rating - only show when reviews are enabled and there are reviews */}
                            {businessAllowReviews && reviewCount > 0 && (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                    <Rating
                                        value={rating}
                                        precision={0.5}
                                        readOnly
                                        size="small"
                                        sx={{ "& .MuiRating-icon": { fontSize: 14 } }}
                                    />
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        {rating > 0 ? rating.toFixed(1) : ''} ({reviewCount})
                                    </Typography>
                                </Stack>
                            )}


                        </Box>
                    </Box>

                    {/* Right: Follow + 3-dot menu — in flow, aligned with header */}
                    <Box sx={{ flexShrink: 0, mt: -0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {!isOwnBusiness && !isUnclaimed && (
                            <Tooltip title={localFollowing ? 'Unfollow' : 'Follow'} arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleFollowToggle(e); }}
                                    sx={(t) => ({
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                        borderRadius: 999,
                                        opacity: followBusy ? 0.6 : 1,
                                        color: localFollowing ? 'primary.main' : 'text.secondary',
                                        '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                    })}
                                >
                                    {localFollowing
                                        ? <HowToRegRoundedIcon sx={{ fontSize: 18 }} />
                                        : <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="More" arrow>
                            <IconButton
                                size="small"
                                onClick={handleBizMenuOpen}
                                sx={(t) => ({
                                    flexShrink: 0,
                                    width: 32,
                                    height: 32,
                                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                    borderRadius: 999,
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.06) },
                                })}
                            >
                                <MoreVertIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <SmartMenu
                            anchorEl={bizMenuEl}
                            open={bizMenuOpen}
                            onClose={handleBizMenuClose}
                            disableScrollLock
                            onClick={(e) => e.stopPropagation()}
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                            PaperProps={{
                                sx: {
                                    mt: 0.5,
                                    borderRadius: 2.5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`,
                                    minWidth: 200,
                                    py: 0.5,
                                },
                            }}
                        >
                            <MenuItem onClick={handleBizCopyLink} sx={{ py: 1 }}>
                                <ListItemIcon>
                                    <ContentCopyIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>
                            {!isOwnBusiness && (
                                <MenuItem onClick={handleBizReportClick} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <FlagOutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Report business" />
                                </MenuItem>
                            )}
                            {!isOwnBusiness && viewer?.id && (
                                <MenuItem onClick={handleHideBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <VisibilityOffRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Hide posts" />
                                </MenuItem>
                            )}
                            {!isOwnBusiness && viewer?.id && (
                                <MenuItem onClick={handleBlockBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon sx={{ color: 'error.main' }}>
                                        <BlockRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Block business" />
                                </MenuItem>
                            )}
                        </SmartMenu>
                    </Box>
                </Box>

                {/* Description (condensed) - 3 lines max for consistent card sizes */}
                <Box sx={{ mt: 1.75, minHeight: 0, flex: 1, overflow: 'hidden' }}>
                    {description ? (
                        <Typography
                            component="p"
                            sx={{
                                fontSize: '0.82rem',
                                lineHeight: 1.45,
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {description}
                        </Typography>
                    ) : null}
                </Box>

                {/* Hours status (Open / Closed) — hidden when business has disabled hours visibility */}
                {businessHoursVisible && hoursStatus && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75, flexShrink: 0 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: hoursStatus.statusColor }}>{hoursStatus.statusLabel}</Typography>
                        {hoursStatus.detailLabel && (
                            <>
                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>&middot;</Typography>
                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>{hoursStatus.detailLabel}</Typography>
                            </>
                        )}
                    </Stack>
                )}

                {/* Location - right-aligned, above the action bar (matching EventCard pattern) */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', mt: 'auto', pt: 0.5, minHeight: 38, flexShrink: 0 }}>
                    <Box
                        onClick={hasMapPin && onLocationClick ? (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onLocationClick(business);
                        } : undefined}
                        role={hasMapPin && onLocationClick ? 'button' : undefined}
                        tabIndex={hasMapPin && onLocationClick ? 0 : undefined}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.25,
                            maxWidth: '70%',
                            borderRadius: 1,
                            px: 0.5,
                            mx: -0.5,
                            transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            cursor: hasMapPin && onLocationClick ? 'pointer' : 'default',
                            '&:hover .loc-icon, &:hover .loc-text': { color: (t) => t.palette.secondary.main },
                        }}
                    >
                        {/* Street address line (only if business has address + map pin) */}
                        {hasStreetAddress && !isStatewide && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOnIcon className="loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                                <Typography
                                    className="loc-text"
                                    noWrap
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        color: 'primary.main',
                                        textAlign: 'right',
                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    }}
                                >
                                    {address}
                                </Typography>
                            </Stack>
                        )}
                        {/* City, County line */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            {(!hasStreetAddress || isStatewide) && (
                                isStatewide ? (
                                    <PublicRoundedIcon className="loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                                ) : (
                                    <LocationOnIcon className="loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                                )
                            )}
                            <Typography
                                className="loc-text"
                                noWrap
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    color: 'primary.main',
                                    whiteSpace: 'nowrap',
                                    transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                }}
                            >
                                {isStatewide ? 'Statewide · Alabama' : location}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Footer: Share | Social Links */}
            <Box
                sx={{
                    px: flat ? 2 : { xs: 1.25, sm: 1.5 },
                    py: 0.75,
                    borderTop: flat ? 'none' : '1px solid',
                    borderColor: flat ? 'transparent' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.5,
                    minHeight: 44,
                }}
            >
                {/* Left: Share */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Tooltip title="Share" arrow>
                        <Box
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShareDialogOpen(true); }}
                            role="button"
                            tabIndex={0}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 999,
                                cursor: 'pointer',
                                transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                '&:active': { transform: 'scale(0.97)' },
                            }}
                        >
                            <ShareRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                        </Box>
                    </Tooltip>
                </Stack>

                {/* Right: Social icons */}
                {hasSocials && (
                    <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {website && (
                            <Tooltip title={`Visit ${formatWebsiteUrl(website)}`} arrow>
                                <IconButton
                                    component="a"
                                    href={website.startsWith('http') ? website : `https://${website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: (t) => t.palette.mode === 'dark' ? t.palette.text.primary : t.palette.text.secondary,
                                        '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                                    }}
                                >
                                    <LanguageRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {facebookUrl && (
                            <Tooltip title="Facebook" arrow>
                                <IconButton
                                    component="a"
                                    href={buildSocialUrl(facebookUrl, 'facebook')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: (t) => t.custom.social.facebook,
                                        '&:hover': { bgcolor: (t) => alpha(t.custom.social.facebook, 0.10) },
                                    }}
                                >
                                    <FacebookIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {instagramUrl && (
                            <Tooltip title="Instagram" arrow>
                                <IconButton
                                    component="a"
                                    href={buildSocialUrl(instagramUrl, 'instagram')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: (t) => t.custom.social.instagram,
                                        '&:hover': { bgcolor: (t) => alpha(t.custom.social.instagram, 0.10) },
                                    }}
                                >
                                    <InstagramIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {twitterUrl && (
                            <Tooltip title="X (Twitter)" arrow>
                                <IconButton
                                    component="a"
                                    href={buildSocialUrl(twitterUrl, 'twitter')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: 'text.primary',
                                        '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                                    }}
                                >
                                    <XIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {linkedinUrl && (
                            <Tooltip title="LinkedIn" arrow>
                                <IconButton
                                    component="a"
                                    href={buildSocialUrl(linkedinUrl, 'linkedin')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: (t) => t.palette.mode === 'dark' ? '#5A9BD5' : '#0A66C2',
                                        '&:hover': { bgcolor: (t) => alpha(t.palette.mode === 'dark' ? '#5A9BD5' : '#0A66C2', 0.10) },
                                    }}
                                >
                                    <LinkedInIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {etsyUrl && (
                            <Tooltip title="Etsy Shop" arrow>
                                <IconButton
                                    component="a"
                                    href={buildSocialUrl(etsyUrl, 'etsy')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{
                                        width: { xs: 36, sm: 28 },
                                        height: { xs: 36, sm: 28 },
                                        color: '#F1641E',
                                        '&:hover': { bgcolor: (t) => alpha('#F1641E', 0.10) },
                                    }}
                                >
                                    <StorefrontRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                )}
            </Box>

            <ReportDialog
                open={bizReportOpen}
                onClose={() => setBizReportOpen(false)}
                onSubmit={submitBizReport}
                title="Report Business"
            />

            <Dialog
                open={copyLinkToast}
                onClose={() => setCopyLinkToast(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pr: 6 }}>
                    Link copied
                    <IconButton
                        aria-label="Close"
                        onClick={() => setCopyLinkToast(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        The business link has been copied to your clipboard.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="contained" onClick={() => setCopyLinkToast(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            <ShareDialog
                contentType="business"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                business={business}
                viewer={viewer}
            />

            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
            />
        </Card>
    );
}

BusinessDirectoryCard.propTypes = {
    business: PropTypes.any.isRequired,
    selected: PropTypes.bool,
    hovered: PropTypes.bool,
    onSelect: PropTypes.func,
    onHover: PropTypes.func,
    onLocationClick: PropTypes.func,
    isFollowing: PropTypes.bool,
    user: PropTypes.object,
};

BusinessDirectoryCardSkeleton.propTypes = {};
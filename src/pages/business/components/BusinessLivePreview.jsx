// src/pages/business/components/BusinessLivePreview.jsx
//
// Reusable live-preview component for the Business Detail / Discover-style layout.
// Used by BusinessSetupPage (creation) and BusinessAdminPage (editing).
// Mirrors the exact visual styling from BusinessDetailPanel's Discover redesign.

import React, { Fragment, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    Divider,
    IconButton,
    Rating,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SvgIcon from '@mui/material/SvgIcon';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ForestRoundedIcon from '@mui/icons-material/ForestRounded';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import HomeRepairServiceRoundedIcon from '@mui/icons-material/HomeRepairServiceRounded';
import YardRoundedIcon from '@mui/icons-material/YardRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';

import { CATEGORY_CONFIG, DEFAULT_CATEGORY_CONFIG } from '../config/categoryConfig';

const CATEGORY_ICON_MAP = {
    food_drink: RestaurantRoundedIcon, shopping_retail: StorefrontRoundedIcon,
    automotive: DirectionsCarRoundedIcon, home_services: HomeRepairServiceRoundedIcon,
    home_garden: YardRoundedIcon, health_wellness: MedicalServicesRoundedIcon,
    beauty_personal_care: ContentCutRoundedIcon, fitness_recreation: FitnessCenterRoundedIcon,
    professional_services: BusinessCenterRoundedIcon, education_childcare: SchoolRoundedIcon,
    pets_animals: PetsRoundedIcon, travel_lodging: TravelExploreRoundedIcon,
    arts_entertainment: TheaterComedyRoundedIcon, community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildRoundedIcon, other: CategoryRoundedIcon,
};
const ENTITY_ICON_MAP = {
    business: StorefrontRoundedIcon,
    nonprofit: VolunteerActivismIcon,
    organization: AccountBalanceRoundedIcon,
};

const BUILDER_ICON_MAP = {
    menu: RestaurantMenuRoundedIcon,
    service_menu: LocalOfferRoundedIcon,
    provider: GroupsRoundedIcon,
    class: EventRoundedIcon,
    accommodation: HotelRoundedIcon,
};

function SectionHeading({ icon: Icon, children }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
            {Icon && <Icon sx={{ fontSize: 18, color: 'primary.main' }} />}
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{children}</Typography>
        </Stack>
    );
}

const HL_ICONS = {
    Star: StarRoundedIcon, Favorite: FavoriteRoundedIcon, Forest: ForestRoundedIcon,
    Volunteer: VolunteerActivismIcon, Groups: GroupsRoundedIcon, CheckCircle: CheckCircleRoundedIcon,
    Trophy: EmojiEventsRoundedIcon, Shield: GppGoodRoundedIcon, Build: BuildRoundedIcon,
};
function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ─── Constants ────────────────────────────────────────
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DESC_COLLAPSE = 200;

function formatPhone(p) {
    const d = String(p || '').replace(/\D/g, '');
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return p;
}

/** Convert "HH:mm" 24-hour string to "h:mm AM/PM" */
function formatTo12Hr(timeStr) {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    return `${h}:${m} ${period}`;
}

function formatWebsite(url) {
    return String(url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

// ─── Component ────────────────────────────────────────
export default function BusinessLivePreview({
                                                name = '',
                                                slug = '',
                                                subtitle = '',
                                                description = '',
                                                avatarUrl = '',
                                                coverUrl = '',
                                                categoryLabel = '',
                                                entityTypeLabel = '',
                                                entityType = 'business',
                                                isStatewide = false,
                                                address = '',
                                                city = '',
                                                county = '',
                                                phone = '',
                                                email = '',
                                                websiteUrl = '',
                                                facebookUrl = '',
                                                instagramUrl = '',
                                                twitterUrl = '',
                                                linkedinUrl = '',
                                                etsyUrl = '',
                                                isVerified = false,
                                                servicesOffered = [],
                                                ownerInfo = null,
                                                highlightSections = [],
                                                hours = {},
                                                reviewCount = 0,
                                                avgRating = 0,
                                                categoryKey = '',
                                                categoryData = {},
                                                gallery = [],
                                                circularAvatar = false,
                                            }) {
    const [previewTab, setPreviewTab] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);
    const [hoursExpanded, setHoursExpanded] = useState(false);
    const [builderExpanded, setBuilderExpanded] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState('');

    const descText = String(description || '').trim();
    const descIsLong = descText.length > DESC_COLLAPSE;
    const hasOwner = ownerInfo && (ownerInfo.name || ownerInfo.avatar_url);
    const additionalOwners = Array.isArray(ownerInfo?.additional_owners)
        ? ownerInfo.additional_owners.filter((ao) => ao && (ao.name || ao.avatar_url))
        : [];
    // A highlight is worth rendering if it has any of: title, body, or photo.
    // Photo-only highlights were previously dropped here and stayed invisible
    // even though the downstream render supports them.
    const validHighlights = Array.isArray(highlightSections) ? highlightSections.filter((s) => s && (s.title || s.body || s.photo_url)) : [];
    const validServices = Array.isArray(servicesOffered) ? servicesOffered.filter(Boolean) : [];
    const locationStr = isStatewide
        ? 'Statewide \u00B7 Alabama'
        : [address, city, county].filter(Boolean).join(', ');

    const hasHours = hours && DAY_NAMES.some((d) => {
        const dh = hours[d];
        return dh && (dh.closed || dh.allDay || dh.open || dh.close);
    });

    const catCfg = CATEGORY_CONFIG[categoryKey] || DEFAULT_CATEGORY_CONFIG;
    const CatIcon = CATEGORY_ICON_MAP[categoryKey] || CategoryRoundedIcon;
    const hasSocial = facebookUrl || instagramUrl || twitterUrl || linkedinUrl || etsyUrl;

    return (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {/* ═══ COVER PHOTO ═══ */}
            {coverUrl && (
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 120, sm: 150 }, overflow: 'hidden' }}>
                    <Box component="img" src={coverUrl} alt="Cover" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                </Box>
            )}

            {/* ═══ HEADER: matches BusinessDetailPanel layout ═══ */}
            <Box sx={{ px: 2, pt: coverUrl ? 1.5 : 2, pb: 0.5 }}>
                {/* Row 1: Avatar + Name + Follow button */}
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Avatar
                        src={avatarUrl || undefined}
                        alt={name}
                        variant={circularAvatar ? 'circular' : 'rounded'}
                        sx={{
                            width: 64, height: 64, flexShrink: 0,
                            border: '2px solid', borderColor: (t) => alpha(t.palette.divider, 0.3),
                            borderRadius: circularAvatar ? '50%' : 2.5,
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                            color: 'primary.main',
                        }}
                    >
                        <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: '1.05rem', lineHeight: 1.2, color: 'text.primary', wordBreak: 'break-word' }}>
                            {name || 'Your Business Name'}
                        </Typography>
                        {slug && (
                            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600, mt: 0.15 }}>
                                @{slug}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 700, mt: 0.15, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                {subtitle}
                            </Typography>
                        )}
                        {/* Category & Entity Type chips */}
                        {(categoryLabel || entityTypeLabel) && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.4, flexWrap: 'wrap', rowGap: 0.4 }}>
                                {categoryLabel && (() => {
                                    const CatIconLocal = CATEGORY_ICON_MAP[categoryKey] || CategoryRoundedIcon;
                                    return (
                                        <Chip
                                            icon={<CatIconLocal sx={{ fontSize: '13px !important' }} />}
                                            label={categoryLabel}
                                            size="small"
                                            sx={(t) => ({ fontSize: 10.5, fontWeight: 700, height: 22, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.dark', '& .MuiChip-icon': { color: 'primary.main' } })}
                                        />
                                    );
                                })()}
                                {entityTypeLabel && entityType !== 'business' && (() => {
                                    const EntIcon = ENTITY_ICON_MAP[entityType] || StorefrontRoundedIcon;
                                    return (
                                        <Chip
                                            icon={<EntIcon sx={{ fontSize: '13px !important' }} />}
                                            label={entityTypeLabel}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: 10.5, fontWeight: 700, height: 22, borderRadius: 999, '& .MuiChip-icon': { color: 'text.secondary' } }}
                                        />
                                    );
                                })()}
                            </Stack>
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                            <Rating value={avgRating} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'warning.main' }, '& .MuiRating-iconEmpty': { color: 'action.disabled' } }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>({reviewCount})</Typography>
                        </Stack>
                    </Box>

                    {/* Follow button only (top right) */}
                    <Button
                        size="small" variant="contained"
                        startIcon={<PersonAddRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900, fontSize: '0.7rem', px: 1.25, py: 0.4, minHeight: 0, minWidth: 0, whiteSpace: 'nowrap', pointerEvents: 'none', flexShrink: 0, mt: 0.5 }}
                    >
                        Follow
                    </Button>
                </Stack>

                {/* Contact info: phone, email, address */}
                {(phone || email || locationStr) && (
                    <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                        {phone && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <PhoneRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>{formatPhone(phone)}</Typography>
                            </Stack>
                        )}
                        {email && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <EmailRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', wordBreak: 'break-all' }}>{email}</Typography>
                            </Stack>
                        )}
                        {locationStr && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                {isStatewide ? <PublicRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} /> : <LocationOnIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{locationStr}</Typography>
                            </Stack>
                        )}
                    </Stack>
                )}

                {/* Hours row */}
                {hasHours && (
                    <Box sx={{ mt: 0.5 }}>
                        {(() => {
                            const now = new Date();
                            const todayIdx = now.getDay();
                            const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const DAY_DISPLAY = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
                            const todayKey = DAY_ORDER[todayIdx];
                            const todayData = hours[todayKey];

                            let statusLabel = 'Closed';
                            let statusColor = 'error.main';
                            let detailLabel = '';

                            if (todayData) {
                                if (todayData.allDay) {
                                    statusLabel = 'Open';
                                    statusColor = 'success.main';
                                    detailLabel = '24 hours';
                                } else if (!todayData.closed && todayData.open && todayData.close) {
                                    const nowMins = now.getHours() * 60 + now.getMinutes();
                                    const [oh, om] = (todayData.open || '0:0').split(':').map(Number);
                                    const [ch, cm] = (todayData.close || '0:0').split(':').map(Number);
                                    const openMins = oh * 60 + (om || 0);
                                    const closeMins = ch * 60 + (cm || 0);

                                    if (closeMins > openMins) {
                                        if (nowMins >= openMins && nowMins < closeMins) {
                                            statusLabel = 'Open';
                                            statusColor = 'success.main';
                                            detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                                        } else {
                                            statusLabel = 'Closed';
                                            statusColor = 'error.main';
                                            detailLabel = nowMins < openMins ? `Opens ${formatTo12Hr(todayData.open)}` : '';
                                        }
                                    } else {
                                        if (nowMins >= openMins || nowMins < closeMins) {
                                            statusLabel = 'Open';
                                            statusColor = 'success.main';
                                            detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                                        } else {
                                            statusLabel = 'Closed';
                                            statusColor = 'error.main';
                                            detailLabel = `Opens ${formatTo12Hr(todayData.open)}`;
                                        }
                                    }
                                } else {
                                    statusLabel = 'Closed';
                                    statusColor = 'error.main';
                                    for (let i = 1; i <= 7; i++) {
                                        const nextIdx = (todayIdx + i) % 7;
                                        const nextKey = DAY_ORDER[nextIdx];
                                        const nextData = hours[nextKey];
                                        if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                                            detailLabel = `Opens ${DAY_DISPLAY[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                                            break;
                                        }
                                    }
                                }
                            } else {
                                for (let i = 1; i <= 7; i++) {
                                    const nextIdx = (todayIdx + i) % 7;
                                    const nextKey = DAY_ORDER[nextIdx];
                                    const nextData = hours[nextKey];
                                    if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                                        detailLabel = `Opens ${DAY_DISPLAY[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                                        break;
                                    }
                                }
                            }

                            return (
                                <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    onClick={() => setHoursExpanded((v) => !v)}
                                    sx={{ cursor: 'pointer', py: 0.25, userSelect: 'none', '&:hover': { opacity: 0.8 } }}
                                >
                                    <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: statusColor }}>{statusLabel}</Typography>
                                    {detailLabel && (
                                        <>
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>&middot;</Typography>
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>{detailLabel}</Typography>
                                        </>
                                    )}
                                    <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', transition: 'transform 0.2s', transform: hoursExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </Stack>
                            );
                        })()}
                    </Box>
                )}

                {/* Social + Website icons row (below hours) */}
                {(hasSocial || websiteUrl) && (
                    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.35 }}>
                        {websiteUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LanguageRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            </Box>
                        )}
                        {facebookUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FacebookIcon sx={{ fontSize: 14, color: '#1877F2' }} />
                            </Box>
                        )}
                        {instagramUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <InstagramIcon sx={{ fontSize: 14, color: '#C13584' }} />
                            </Box>
                        )}
                        {twitterUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <XIcon sx={{ fontSize: 12, color: 'text.primary' }} />
                            </Box>
                        )}
                        {linkedinUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LinkedInIcon sx={{ fontSize: 14, color: '#0A66C2' }} />
                            </Box>
                        )}
                        {etsyUrl && (
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <StorefrontRoundedIcon sx={{ fontSize: 14, color: '#F1641E' }} />
                            </Box>
                        )}
                    </Stack>
                )}

                {/* Expandable full hours table (below the row) */}
                {hasHours && (
                    <Collapse in={hoursExpanded}>
                        {(() => {
                            const now = new Date();
                            const todayIdx = now.getDay();
                            const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const DAY_DISPLAY = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
                            const todayKey = DAY_ORDER[todayIdx];
                            return (
                                <Box sx={(t) => ({ mt: 0.75, bgcolor: alpha(t.palette.primary.main, 0.03), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.1), borderRadius: 2, px: 1.5, py: 0.75 })}>
                                    <Stack spacing={0}>
                                        {DAY_ORDER.map((day) => {
                                            const dh = hours[day];
                                            const isToday = day === todayKey;
                                            let label = '\u2013';
                                            if (dh) {
                                                if (dh.closed) label = '\u2013';
                                                else if (dh.allDay) label = 'Open 24 hours';
                                                else if (dh.open && dh.close) label = `${formatTo12Hr(dh.open)} \u2013 ${formatTo12Hr(dh.close)}`;
                                            }
                                            const isOpen = dh && (dh.allDay || (!dh.closed && dh.open && dh.close));
                                            return (
                                                <Stack key={day} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>
                                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                                        <Typography sx={{ fontSize: 12, fontWeight: isToday ? 900 : 600, color: isToday ? 'text.primary' : 'text.secondary', minWidth: 28 }}>{DAY_DISPLAY[day]}</Typography>
                                                        {isToday && <Chip label="Today" size="small" sx={{ fontSize: 9, fontWeight: 800, height: 18, bgcolor: 'success.main', color: '#fff', borderRadius: 999 }} />}
                                                    </Stack>
                                                    <Typography sx={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday && isOpen ? 'success.main' : 'text.secondary' }}>{label}</Typography>
                                                </Stack>
                                            );
                                        })}
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                        <AccessTimeRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                                        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 500 }}>Hours may vary on holidays</Typography>
                                    </Stack>
                                </Box>
                            );
                        })()}
                    </Collapse>
                )}
            </Box>

            {/* ═══ ACTION BUTTONS (Message / View Profile / Share) ═══ */}
            <Box sx={{ px: 2, pt: 1, pb: 0.75 }}>
                <Stack direction="row" spacing={0.75}>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<MailOutlineRoundedIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, py: 0.75, pointerEvents: 'none' }}
                    >
                        Message
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, py: 0.75, pointerEvents: 'none' }}
                    >
                        View Profile
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ShareRoundedIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, py: 0.75, pointerEvents: 'none' }}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>

            {/* ═══ TABS ═══ */}
            <Box sx={{ px: 2, pt: 1.25 }}>
                <Divider />
                <Tabs
                    value={previewTab} onChange={(_e, v) => setPreviewTab(v)} variant="fullWidth"
                    sx={{
                        minHeight: 36,
                        '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 800, fontSize: 12, px: 1, gap: 0.25 },
                        '& .Mui-selected': { fontWeight: 950 },
                        '& .MuiTabs-indicator': { height: 2.5, borderRadius: 0 },
                    }}
                >
                    <Tab icon={<InfoRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="About" />
                    <Tab icon={<ArticleRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Posts" />
                    <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Photos" />
                    <Tab icon={<ReviewsRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Reviews" />
                </Tabs>
                <Divider />
            </Box>

            {/* ═══ TAB 0: ABOUT ═══ */}
            {previewTab === 0 && (
                <Box sx={{ px: 2, pt: 2, pb: 2 }}>

                    {/* ── Description ── */}
                    {descText ? (
                        <Box>
                            <SectionHeading>About {name || ''}</SectionHeading>
                            <Box>
                                {descText && (
                                    <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: 'text.secondary', fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {descIsLong && !descExpanded ? `${descText.slice(0, DESC_COLLAPSE)}...` : descText}
                                    </Typography>
                                )}
                                {descIsLong && (
                                    <Typography component="span" onClick={() => setDescExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 0.25, display: 'inline-block' }}>
                                        {descExpanded ? 'Show less' : 'Read more'}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <Typography sx={{ fontSize: 12.5, color: 'text.disabled', fontStyle: 'italic' }}>No description yet. Add one in the form.</Typography>
                        </Box>
                    )}

                    {/* ── Meet the Owner(s) ── */}
                    {hasOwner && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <SectionHeading icon={PersonIcon}>{ownerInfo.section_title || (additionalOwners.length > 0 ? 'Meet the Owners' : 'Meet the Owner')}</SectionHeading>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar src={ownerInfo.avatar_url || undefined} alt={ownerInfo.name || 'Owner'} sx={{ width: 90, height: 90, borderRadius: 2.5, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}` }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                    <PersonIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13.5, lineHeight: 1.2 }}>{ownerInfo.name}</Typography>
                                    {ownerInfo.title && <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ownerInfo.title}</Typography>}
                                </Box>
                            </Stack>
                            {ownerInfo.about && <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: 'text.secondary', mt: 1, fontWeight: 500 }}>{ownerInfo.about}</Typography>}
                            {additionalOwners.map((ao, aoIdx) => (
                                <Fragment key={aoIdx}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                                        <Avatar src={ao.avatar_url || undefined} alt={ao.name || 'Team'} sx={{ width: 48, height: 48, borderRadius: 2, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.10) }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                            <PersonIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>{ao.name}</Typography>
                                            {ao.title && <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ao.title}</Typography>}
                                        </Box>
                                    </Stack>
                                    {ao.about && <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: 'text.secondary', mt: 0.75, fontWeight: 500 }}>{ao.about}</Typography>}
                                </Fragment>
                            ))}
                        </>
                    )}

                    {/* ── Highlight Sections ── */}
                    {validHighlights.length > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            {validHighlights.map((sec, idx) => (
                                <Box key={idx} sx={{ mb: 1.5 }}>
                                    <Box sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.15)}`, bgcolor: alpha(t.palette.primary.main, 0.03) })}>
                                        {sec.title && (
                                            <Box sx={(t) => ({ px: 1.5, py: 0.65, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.12)}`, display: 'flex', alignItems: 'center', gap: 0.75 })}>
                                                <HlIconRender name={sec.icon} sx={{ fontSize: 15, color: 'primary.main' }} />
                                                <Typography sx={{ fontWeight: 900, fontSize: 11, color: 'primary.dark', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sec.title}</Typography>
                                            </Box>
                                        )}
                                        {(sec.photo_url || sec.body) && (
                                            <Box>
                                                {sec.photo_url && <Box component="img" src={sec.photo_url} alt={sec.title || 'Highlight'} onClick={() => setLightboxSrc(sec.photo_url)} sx={{ width: '100%', height: 405, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                {sec.body && <Box sx={{ px: 1.5, py: 1.25 }}><Typography sx={{ fontSize: 12, lineHeight: 1.55, color: 'text.secondary', fontWeight: 500 }}>{sec.body}</Typography></Box>}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </>
                    )}

                    {/* ── Combined Services & Pricing Section ── */}
                    {(() => {
                        const cd = categoryData || {};
                        const hasPrice = cd.price_range;
                        const extraFields = (catCfg.extraFields || []).filter((f) => {
                            const val = cd[f.key];
                            if (Array.isArray(val)) return val.length > 0;
                            return Boolean(val);
                        });
                        const hasCategoryDetails = hasPrice || extraFields.length > 0;

                        const builderCfg = catCfg.builder;
                        const isServiceMenu = builderCfg && builderCfg.type === 'service_menu';
                        const svcMenuItems = isServiceMenu ? (Array.isArray(cd[builderCfg.dataKey]) ? cd[builderCfg.dataKey] : []).filter((it) => it && it.name) : [];

                        const hasAnything = validServices.length > 0 || hasCategoryDetails || svcMenuItems.length > 0;
                        if (!hasAnything) return null;

                        const labelSx = { fontSize: 10.5, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.4 };
                        const PREVIEW_LIMIT = 3;
                        const visible = builderExpanded ? svcMenuItems : svcMenuItems.slice(0, PREVIEW_LIMIT);
                        const hasMore = svcMenuItems.length > PREVIEW_LIMIT;
                        const hasPricingData = hasPrice || svcMenuItems.some((it) => it.price);
                        const servicesHeading = hasPricingData ? (catCfg.servicesLabel || 'Services & Pricing') : 'Services';

                        return (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <SectionHeading icon={CatIcon}>{servicesHeading}</SectionHeading>

                                {/* Service chips */}
                                {validServices.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: hasCategoryDetails || svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                        {validServices.map((svc) => <Chip key={svc} label={svc} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 700, height: 24, borderRadius: 999 }} />)}
                                    </Box>
                                )}

                                {/* Category details (price, extra fields, toggles, booking) */}
                                {hasCategoryDetails && (
                                    <Stack spacing={1.5} sx={{ mb: svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                        {hasPrice && (
                                            <Box>
                                                <Typography sx={labelSx}>Price Range</Typography>
                                                <Chip
                                                    label={`${cd.price_range} · ${cd.price_range === '$' ? 'Budget-friendly' : cd.price_range === '$$' ? 'Moderate' : cd.price_range === '$$$' ? 'Upscale' : 'Premium'}`}
                                                    size="small"
                                                    sx={(t) => ({ fontWeight: 700, fontSize: 11, height: 26, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.dark', borderRadius: 999 })}
                                                />
                                            </Box>
                                        )}
                                        {extraFields.map((f) => {
                                            const val = cd[f.key];
                                            if (f.type === 'toggle') return null;
                                            if (f.type === 'multiselect' && Array.isArray(val)) {
                                                return (
                                                    <Box key={f.key}>
                                                        <Typography sx={labelSx}>{f.label}</Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {val.map((v) => <Chip key={v} label={v} size="small" variant="outlined" sx={{ fontSize: 10, fontWeight: 600, height: 22, borderRadius: 999 }} />)}
                                                        </Box>
                                                    </Box>
                                                );
                                            }
                                            if (f.type === 'select' || f.type === 'text') {
                                                return (
                                                    <Box key={f.key}>
                                                        <Typography sx={labelSx}>{f.label}</Typography>
                                                        <Typography sx={{ fontSize: 12, color: 'text.primary', fontWeight: 700 }}>{val}</Typography>
                                                    </Box>
                                                );
                                            }
                                            return null;
                                        })}
                                        {(() => {
                                            const toggles = extraFields.filter((f) => f.type === 'toggle' && cd[f.key]);
                                            if (toggles.length === 0) return null;
                                            return (
                                                <Stack spacing={0}>
                                                    {toggles.map((f) => (
                                                        <Stack key={f.key} direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.35 }}>
                                                            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{f.label}</Typography>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            );
                                        })()}
                                    </Stack>
                                )}

                                {/* Inline service_menu builder items */}
                                {svcMenuItems.length > 0 && (
                                    <>
                                        <Stack spacing={1.25}>
                                            {visible.map((item, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={(t) => ({
                                                        borderRadius: 2.5,
                                                        overflow: 'hidden',
                                                        border: `1px solid ${alpha(t.palette.primary.main, 0.15)}`,
                                                        bgcolor: alpha(t.palette.primary.main, 0.03),
                                                    })}
                                                >
                                                    {item.photo_url && (
                                                        <Box
                                                            component="img"
                                                            src={item.photo_url}
                                                            alt={item.name}
                                                            onClick={() => setLightboxSrc(item.photo_url)}
                                                            sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                                                        />
                                                    )}
                                                    <Box sx={{ p: 1.25 }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                                            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: 'text.primary' }}>{item.name}</Typography>
                                                            {item.price && <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'primary.main', flexShrink: 0, ml: 1 }}>${item.price}</Typography>}
                                                        </Stack>
                                                        {item.description && <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500, lineHeight: 1.4, mt: 0.25 }}>{item.description}</Typography>}
                                                        {item.duration && <Typography sx={{ fontSize: 10.5, color: 'text.disabled', fontWeight: 600, mt: 0.25 }}>{item.duration}</Typography>}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                        {hasMore && (
                                            <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                                {builderExpanded ? 'Show less' : `View all services (${svcMenuItems.length - PREVIEW_LIMIT} more)`}
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </>
                        );
                    })()}

                    {/* ── Category Builder Data Preview (non-service_menu types only) ── */}
                    {(() => {
                        const cd = categoryData || {};
                        const builderCfg = catCfg.builder;
                        if (!builderCfg) return null;
                        if (builderCfg.type === 'service_menu') return null;
                        const dataKey = builderCfg.dataKey;
                        const items = Array.isArray(cd[dataKey]) ? cd[dataKey] : [];
                        if (items.length === 0) return null;
                        const title = builderCfg.builderTitle || 'Details';
                        const PREVIEW_LIMIT = builderCfg.type === 'accommodation' || builderCfg.type === 'menu' ? 2 : 3;
                        const BuilderIcon = BUILDER_ICON_MAP[builderCfg.type] || CategoryRoundedIcon;

                        // ── MENU (food_drink) ──
                        if (builderCfg.type === 'menu') {
                            const sections = items.filter((s) => s && (s.title || (s.items && s.items.length > 0)));
                            if (sections.length === 0) return null;
                            const visible = builderExpanded ? sections : sections.slice(0, PREVIEW_LIMIT);
                            const hasMore = sections.length > PREVIEW_LIMIT;
                            return (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <SectionHeading icon={BuilderIcon}>{title}</SectionHeading>
                                    <Stack spacing={1.5}>
                                        {visible.map((section, sIdx) => (
                                            <Box key={sIdx} sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}>
                                                {section.title && (
                                                    <Box sx={(t) => ({ px: 1.5, py: 0.6, bgcolor: alpha(t.palette.primary.main, 0.06), borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}>
                                                        <Typography sx={{ fontWeight: 900, fontSize: 11, color: 'primary.dark', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{section.title}</Typography>
                                                    </Box>
                                                )}
                                                <Stack spacing={0} sx={{ px: 0 }}>
                                                    {(section.items || []).filter((it) => it.name).map((item, iIdx) => (
                                                        <Box
                                                            key={iIdx}
                                                            sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
                                                        >
                                                            {item.photo_url && (
                                                                <Box
                                                                    component="img"
                                                                    src={item.photo_url}
                                                                    alt={item.name}
                                                                    onClick={() => setLightboxSrc(item.photo_url)}
                                                                    sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                                                                />
                                                            )}
                                                            <Box sx={{ px: 1.5, py: 1 }}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                                                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'text.primary' }}>{item.name}</Typography>
                                                                    {item.price && <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.main', flexShrink: 0, ml: 1 }}>${item.price}</Typography>}
                                                                </Stack>
                                                                {item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.15, lineHeight: 1.4 }}>{item.description}</Typography>}
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                    {hasMore && (
                                        <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                            {builderExpanded ? 'Show less' : `View full menu (${sections.length - PREVIEW_LIMIT} more)`}
                                        </Typography>
                                    )}
                                </>
                            );
                        }

                        // ── PROVIDERS (health, professional, education) ──
                        if (builderCfg.type === 'provider') {
                            const valid = items.filter((it) => it && it.name);
                            if (valid.length === 0) return null;
                            const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                            const hasMore = valid.length > PREVIEW_LIMIT;
                            return (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <SectionHeading icon={BuilderIcon}>{title}</SectionHeading>
                                    <Stack spacing={1}>
                                        {visible.map((item, idx) => (
                                            <Stack
                                                key={idx}
                                                spacing={0}
                                                sx={(t) => ({ borderRadius: 2, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.03), border: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}
                                            >
                                                <Avatar
                                                    variant="square"
                                                    src={item.photo_url || undefined}
                                                    alt={item.name}
                                                    onClick={item.photo_url ? () => setLightboxSrc(item.photo_url) : undefined}
                                                    sx={{ width: '100%', height: 140, borderRadius: 0, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), cursor: item.photo_url ? 'pointer' : 'default', '&:hover': item.photo_url ? { opacity: 0.85 } : {}, '& img': { objectFit: 'cover' } }}
                                                >
                                                    {item.name?.[0]?.toUpperCase() || 'P'}
                                                </Avatar>
                                                <Box sx={{ p: 1.25 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="baseline">
                                                        <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{item.name}</Typography>
                                                        {item.title && <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 600 }}>{item.title}</Typography>}
                                                    </Stack>
                                                    {item.specialty && (
                                                        <Chip label={item.specialty} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, borderRadius: 999, mt: 0.25 }} />
                                                    )}
                                                    {item.bio && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.5, lineHeight: 1.45 }}>{item.bio}</Typography>}
                                                </Box>
                                            </Stack>
                                        ))}
                                    </Stack>
                                    {hasMore && (
                                        <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                            {builderExpanded ? 'Show less' : `View all team (${valid.length - PREVIEW_LIMIT} more)`}
                                        </Typography>
                                    )}
                                </>
                            );
                        }

                        // ── CLASSES / PROGRAMS (fitness, arts, education) ──
                        if (builderCfg.type === 'class') {
                            const valid = items.filter((it) => it && it.name);
                            if (valid.length === 0) return null;
                            const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                            const hasMore = valid.length > PREVIEW_LIMIT;
                            return (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <SectionHeading icon={BuilderIcon}>{title}</SectionHeading>
                                    <Stack spacing={1}>
                                        {visible.map((item, idx) => (
                                            <Stack
                                                key={idx}
                                                spacing={0}
                                                sx={(t) => ({ borderRadius: 2, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.03), border: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}
                                            >
                                                {item.photo_url && (
                                                    <Box
                                                        component="img"
                                                        src={item.photo_url}
                                                        alt={item.name}
                                                        onClick={() => setLightboxSrc(item.photo_url)}
                                                        sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                                                    />
                                                )}
                                                <Box sx={{ p: 1.25 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'text.primary' }}>{item.name}</Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                                                        {item.instructor && (
                                                            <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 600 }}>
                                                                with {item.instructor}
                                                            </Typography>
                                                        )}
                                                        {item.schedule && (
                                                            <Chip label={item.schedule} size="small" sx={{ fontSize: 9.5, fontWeight: 700, height: 18, borderRadius: 999 }} />
                                                        )}
                                                    </Stack>
                                                    {item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.35, lineHeight: 1.4 }}>{item.description}</Typography>}
                                                </Box>
                                            </Stack>
                                        ))}
                                    </Stack>
                                    {hasMore && (
                                        <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                            {builderExpanded ? 'Show less' : `View all (${valid.length - PREVIEW_LIMIT} more)`}
                                        </Typography>
                                    )}
                                </>
                            );
                        }

                        // ── ACCOMMODATIONS (travel_lodging) ──
                        if (builderCfg.type === 'accommodation') {
                            const valid = items.filter((it) => it && it.name);
                            if (valid.length === 0) return null;
                            const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                            const hasMore = valid.length > PREVIEW_LIMIT;
                            return (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <SectionHeading icon={BuilderIcon}>{title}</SectionHeading>
                                    <Stack spacing={1.5}>
                                        {visible.map((item, idx) => (
                                            <Box
                                                key={idx}
                                                sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}
                                            >
                                                {item.photo_url && (
                                                    <Box
                                                        component="img"
                                                        src={item.photo_url}
                                                        alt={item.name}
                                                        onClick={() => setLightboxSrc(item.photo_url)}
                                                        sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                                                    />
                                                )}
                                                <Box sx={{ px: 1.5, py: 1 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: 'text.primary' }}>{item.name}</Typography>
                                                        {item.price_per_night && (
                                                            <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.main', flexShrink: 0 }}>
                                                                ${item.price_per_night}<Typography component="span" sx={{ fontSize: 10, fontWeight: 500, color: 'text.secondary' }}>/night</Typography>
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                    {item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.25, lineHeight: 1.4 }}>{item.description}</Typography>}
                                                    {(item.amenities || []).length > 0 && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.75 }}>
                                                            {item.amenities.map((a) => (
                                                                <Chip key={a} label={a} size="small" variant="outlined" sx={{ fontSize: 9.5, fontWeight: 600, height: 20, borderRadius: 999 }} />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                    {hasMore && (
                                        <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                            {builderExpanded ? 'Show less' : `View all rooms (${valid.length - PREVIEW_LIMIT} more)`}
                                        </Typography>
                                    )}
                                </>
                            );
                        }

                        return null;
                    })()}

                    {/* ── Hours (moved to header) ── */}

                </Box>
            )}

            {/* ═══ TAB 1: POSTS ═══ */}
            {previewTab === 1 && (
                <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <ArticleRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Posts</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Your published posts will appear here.</Typography>
                    </Box>
                </Box>
            )}

            {/* ═══ TAB 2: PHOTOS ═══ */}
            {previewTab === 2 && (
                <Box sx={{ px: 2, py: 2 }}>
                    {(Array.isArray(gallery) ? gallery : []).length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                            {(Array.isArray(gallery) ? gallery : []).map((item, idx) => {
                                const src = item?.url || (item?.file ? URL.createObjectURL(item.file) : '');
                                if (!src) return null;
                                return (
                                    <Box
                                        key={item?.id || idx}
                                        component="img"
                                        src={src}
                                        alt={`Photo ${idx + 1}`}
                                        onClick={() => setLightboxSrc(src)}
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            objectFit: 'cover',
                                            borderRadius: 1.5,
                                            cursor: 'pointer',
                                            transition: 'opacity 0.15s',
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <PhotoLibraryRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Photos</Typography>
                            <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Any photos you add will appear here.</Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* ═══ TAB 3: REVIEWS ═══ */}
            {previewTab === 3 && (
                <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <ReviewsRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Reviews</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Reviews will appear here once your business is live.</Typography>
                    </Box>
                </Box>
            )}

            {/* ═══ PHOTO LIGHTBOX ═══ */}
            <Dialog open={Boolean(lightboxSrc)} onClose={() => setLightboxSrc('')} maxWidth="md" PaperProps={{ sx: { bgcolor: 'black', borderRadius: 2, overflow: 'hidden', position: 'relative' } }}>
                <IconButton onClick={() => setLightboxSrc('')} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 1 }}>
                    <CloseRoundedIcon />
                </IconButton>
                {lightboxSrc && <Box component="img" src={lightboxSrc} alt="" sx={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', mx: 'auto' }} />}
            </Dialog>
        </Box>
    );
}
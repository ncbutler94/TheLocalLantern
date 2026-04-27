// src/pages/business/pages/BusinessAdminPage.jsx
/**
 * Business Admin Page
 * -------------------
 * Full page for managing a business page.
 * Accessible to business owners and admins.
 *
 * Tabs:
 *  - Dashboard: Quick stats and team overview
 *  - Information: Edit business profile details
 *  - Photos: Manage gallery and images
 *  - Team: Manage members, send invites
 *  - Settings: Privacy, danger zone (owner only)
 */

import React, { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    Slider,
    Skeleton,
    Snackbar,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    ButtonBase,
} from '@mui/material';
import { alpha, ThemeProvider, createTheme } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
    Close as CloseIcon,
    Crop as CropIcon,
    ContentCopy as CopyIcon,
    Dashboard as DashboardIcon,
    Delete as DeleteIcon,
    DeleteOutline as DeleteOutlineIcon,
    Email as EmailIcon,
    ChatBubbleOutline as ChatIcon,
    ExitToApp as LeaveIcon,
    Group as TeamIcon,
    Link as LinkIcon,
    MoreVert as MoreIcon,
    PersonAdd as InviteIcon,
    PersonRemove as RemoveIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    Shield as ShieldIcon,
    Star as OwnerIcon,
    SwapHoriz as TransferIcon,
    Warning as WarningIcon,
    Check as CheckIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    People as PeopleIcon,
    Favorite as FollowersIcon,
    Info as InfoIcon,
    PhotoLibrary as PhotoIcon,
    Add as AddIcon,
    CloudUpload as UploadIcon,
    ZoomIn as ZoomInIcon,
    Phone as PhoneIcon,
    Language as WebsiteIcon,
    LocationOn as LocationIcon,
    Facebook as FacebookIcon,
    Instagram as InstagramIcon,
    AccessTime as TimeIcon,
    Category as CategoryIcon,
    Business as BusinessIcon,
    Restaurant as RestaurantIcon,
    Storefront as StorefrontIcon,
    DirectionsCar as DirectionsCarIcon,
    HomeRepairService as HomeRepairServiceIcon,
    Yard as YardIcon,
    MedicalServices as MedicalServicesIcon,
    ContentCut as ContentCutIcon,
    FitnessCenter as FitnessCenterIcon,
    BusinessCenter as BusinessCenterIcon,
    AccountBalance as AccountBalanceIcon,
    School as SchoolIcon,
    Pets as PetsIcon,
    TravelExplore as TravelExploreIcon,
    TheaterComedy as TheaterComedyIcon,
    VolunteerActivism as VolunteerActivismIcon,
    Build as BuildIcon,
    MyLocation as MyLocationIcon,
    Place as PlaceIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Image as ImageIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    StarRounded as StarRoundedIcon,
    FavoriteRounded as FavoriteRoundedIcon,
    ForestRounded as ForestRoundedIcon,
    GroupsRounded as GroupsRoundedIcon,
    CheckCircleRounded as CheckCircleRoundedIcon,
    EmojiEventsRounded as EmojiEventsRoundedIcon,
    GppGoodRounded as GppGoodRoundedIcon,
    BuildRounded as BuildRoundedIcon,
} from '@mui/icons-material';
import XIcon from '@mui/icons-material/X';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CampaignIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

import Cropper from 'react-easy-crop';
import PulsingDots from '../../../components/PulsingDots';
import HighlightPhotoCropDialog from '../../../components/HighlightPhotoCropDialog';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import PhotosUploadSection from '../../../components/PhotosUploadSection';
import CityCountySelect from '../../../components/CityCountySelect';
import BusinessLivePreview from '../components/BusinessLivePreview';

// Import local coordinate data for city/county fallback
import cityData from '../../../data/alabamaCities.json';
import countyData from '../../../data/alabamaCounties.json';

import {
    fetchBusinessPublicBySlug,
    fetchBusinessTeam,
    inviteTeamMember,
    generateInviteLink,
    removeTeamMember,
    changeTeamMemberRole,
    cancelTeamInvite,
    leaveBusinessTeam,
    fetchBusinessSettings,
    updateBusinessSettings,
    updateBusinessProfile,
    deleteBusinessFiles,
    requestPublishedBusinessNameChange,
    transferBusinessOwnership,
    deactivateBusiness,
    reactivateBusiness,
    deleteBusinessPermanently,
    searchUsersForInvite,
    fetchUserSocialForInvite,
    createBusinessDraft,
    fetchInviteDetails,
    saveBusinessDraft,
    completeBusinessSetup,
    deleteBusinessDraft,
    checkBusinessSlug,
    fetchBusinessHandleStats,
} from '../api/businessApi';

import { CATEGORY_CONFIG, DEFAULT_CATEGORY_CONFIG } from '../config/categoryConfig';
import { MenuBuilder, ServiceMenuBuilder, ProviderBuilder, ClassBuilder, AccommodationBuilder } from '../components/CategoryBuilders';

import defaultAvatar from '../../../assets/profile/default_avatar.png';
import UserCardPopover from '../../../components/UserCardPopover';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';
import { useActiveAccount } from '../../../components/AccountContext';
import { checkGeocodeRateLimit, recordGeocodeResult } from '../../../utils/geocodeRateLimit';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { checkReservedUsername } from '../../../utils/reservedUsernames';
import { validateImageFile } from '../../../utils/validateImage';
import { secureFetch } from '../../../utils/secureFetch';
import useChromeTop from '../../../hooks/useChromeTop';

// ============================================================================
// Admin desktop breakpoint
// ----------------------------------------------------------------------------
// The Business Hub page treats anything under 1440px as "mobile" (see
// BusinessHubPage.jsx: `useMediaQuery('(max-width:1439px)')`). We mirror that
// here so the admin console form switches layouts at the same point.
//
// Implementation: we locally remap the MUI `md` breakpoint to 1440 (and shift
// adjacent keys proportionally so MUI's ordering invariant — xs < sm < md < lg
// < xl — still holds). Every existing `{ xs, md }` sx prop on this page keeps
// working without modification; only the effective threshold changes.
//
// The live preview is gated separately to `xl` (see renderInformation) so it
// only appears on genuine-desktop widths (>=1536px).
// ============================================================================
const ADMIN_DESKTOP_MIN = 1440;

function buildAdminTheme(baseTheme) {
    // The documented MUI pattern: pass breakpoints.values as part of a
    // SINGLE options object. MUI then runs its breakpoints pipeline fresh,
    // generating `up`/`down`/`between`/`only` methods closed over the new
    // values. If we instead passed breakpoints as a second-arg override,
    // MUI would merge the values in AFTER the methods were already baked —
    // leaving the `sx={{ md: ... }}` shorthand resolving at the old
    // thresholds (that bug cost us a round-trip).
    //
    // We also carry over the non-breakpoint fields from baseTheme so our
    // admin page still gets the app-wide palette, typography, components,
    // and the project's `custom` namespace.
    return createTheme({
        palette: baseTheme.palette,
        typography: baseTheme.typography,
        shape: baseTheme.shape,
        shadows: baseTheme.shadows,
        transitions: baseTheme.transitions,
        zIndex: baseTheme.zIndex,
        components: baseTheme.components,
        spacing: baseTheme.spacing,
        direction: baseTheme.direction,
        // `custom` is app-specific (see places like t.custom.social.facebook
        // and t.custom.brand.frost used throughout these files). Preserve it.
        custom: baseTheme.custom,
        breakpoints: {
            values: {
                ...baseTheme.breakpoints.values,
                md: ADMIN_DESKTOP_MIN,
                lg: Math.max(baseTheme.breakpoints.values.lg, ADMIN_DESKTOP_MIN + 1),
                xl: Math.max(baseTheme.breakpoints.values.xl, ADMIN_DESKTOP_MIN + 96),
            },
        },
    });
}

// ============================================================================
// API Helpers for Cloud Upload
// ============================================================================
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

async function uploadFileToGCS(file, folder = 'business') {
    const signedUrlRes = await secureFetch(apiUrl('/api/uploads/signed-url'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            folder,
            fileName: file.name || `image_${Date.now()}.jpg`,
            contentType: file.type || 'image/jpeg'
        })
    });

    if (!signedUrlRes.ok) {
        const errText = await signedUrlRes.text().catch(() => '');
        // Parse server error JSON and produce user-friendly messages
        let friendlyMsg = 'Failed to get upload URL';
        try {
            const errData = JSON.parse(errText);
            if (errData?.error === 'invalid_content_type') {
                friendlyMsg = 'This file type isn\u2019t supported. Please upload a JPG, PNG, or WebP image.';
            } else if (errData?.error === 'file_too_large') {
                friendlyMsg = 'This file is too large. Please choose a smaller image (max 10 MB).';
            } else if (errData?.error) {
                friendlyMsg = errData.message || `Upload failed: ${errData.error.replace(/_/g, ' ')}`;
            }
        } catch {
            // errText wasn't JSON — use it directly if non-empty
            if (errText) friendlyMsg = errText;
        }
        throw new Error(friendlyMsg);
    }

    const { uploadUrl, publicUrl, readUrl } = await signedUrlRes.json();

    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file
    });

    if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
    }

    // Prefer the signed READ URL so the <img> can render immediately from a
    // private bucket. The backend's toObjectPath() strips query params on save,
    // so persisting a signed URL is safe — it's re-signed on subsequent reads
    // via hydrateImageUrl().
    return readUrl || publicUrl;
}

/**
 * Run server-side NSFW moderation on an image file before uploading to GCS.
 * Returns { safe: true } or { safe: false, message: '...' }.
 */
async function moderateImageFile(file) {
    try {
        const form = new FormData();
        form.append('file', file);
        const res = await secureFetch(apiUrl('/api/business/moderate-image'), {
            method: 'POST',
            credentials: 'include',
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return { safe: false, message: data?.message || 'This image doesn’t meet our community guidelines.' };
        }
        const data = await res.json().catch(() => ({ safe: true }));
        return data;
    } catch {
        // Fail open — if the moderation endpoint is unreachable, allow the upload
        return { safe: true };
    }
}

/**
 * Moderate an image file, then upload to GCS if it passes.
 * Returns the public URL on success, or throws with the moderation message on failure.
 */
async function moderateAndUpload(file, folder = 'business') {
    const modResult = await moderateImageFile(file);
    if (!modResult.safe) {
        const err = new Error(modResult.message || 'This image doesn’t meet our community guidelines.');
        err.isModeration = true;
        throw err;
    }
    return uploadFileToGCS(file, folder);
}

// ============================================================================
// Local Coordinate Helpers (from GeoJSON data)
// ============================================================================
const stripCountySuffix = (s) => String(s || '').replace(/ County$/i, '').trim();

/**
 * Extract coordinates from GeoJSON feature.
 * GeoJSON coordinates are [lng, lat], we return { lat, lng } for consistency.
 */
function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    // Point: coordinates = [lng, lat]
    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        return null;
    }

    // Polygon: calculate centroid from bounding box
    if (type === 'Polygon' && Array.isArray(coordinates)) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        for (const ring of coordinates) {
            if (!Array.isArray(ring)) continue;
            for (const pt of ring) {
                if (!Array.isArray(pt) || pt.length < 2) continue;
                const [lng, lat] = pt;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
            }
        }

        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
        }
        return null;
    }

    // MultiPolygon: calculate centroid from bounding box
    if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        for (const poly of coordinates) {
            if (!Array.isArray(poly)) continue;
            for (const ring of poly) {
                if (!Array.isArray(ring)) continue;
                for (const pt of ring) {
                    if (!Array.isArray(pt) || pt.length < 2) continue;
                    const [lng, lat] = pt;
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                }
            }
        }

        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
        }
        return null;
    }

    return null;
}

/** Returns { lat, lng } for a city or county from local GeoJSON, or null if unknown. */
function getCoordsFromLocalData(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (city) {
        const cityNorm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const name = String(f?.properties?.NAME || f?.properties?.name || f?.name || '').trim().toLowerCase();
            return name === cityNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    if (county) {
        const countyNorm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const name = stripCountySuffix(f?.properties?.NAME || f?.properties?.name || f?.name || '').toLowerCase();
            return name === countyNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    return null;
}

// ============================================================================
// Constants
// ============================================================================
const TABS = {
    DASHBOARD: 0,
    INFORMATION: 1,
    TEAM: 2,
    PRO: 3,
    SETTINGS: 4,
};

const ROLE_LABELS = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
};

const ROLE_COLORS = {
    owner: 'warning',
    admin: 'primary',
    member: 'default',
};

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

const CATEGORY_OPTIONS = [
    { value: 'food_drink', label: 'Food & Drink' },
    { value: 'shopping_retail', label: 'Shopping & Retail' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'home_services', label: 'Home Services' },
    { value: 'home_garden', label: 'Home & Garden' },
    { value: 'health_wellness', label: 'Health & Wellness' },
    { value: 'beauty_personal_care', label: 'Beauty & Personal Care' },
    { value: 'fitness_recreation', label: 'Fitness & Recreation' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'education_childcare', label: 'Education & Childcare' },
    { value: 'pets_animals', label: 'Pets & Animals' },
    { value: 'travel_lodging', label: 'Travel & Lodging' },
    { value: 'arts_entertainment', label: 'Arts & Entertainment' },
    { value: 'community_nonprofit', label: 'Community & Nonprofit' },
    { value: 'technology_repair', label: 'Technology & Repair' },
    { value: 'other', label: 'Other' },
];

const ENTITY_TYPE_OPTIONS = [
    { value: 'business', label: 'Business', icon: StorefrontIcon },
    { value: 'nonprofit', label: 'Nonprofit', icon: VolunteerActivismIcon },
    { value: 'organization', label: 'Organization', icon: AccountBalanceIcon },
];

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

const MAX_ADMINS = 5;
const AVATAR_ASPECT = 1;
const COVER_ASPECT = 3;

// ─── Highlight Section Icon Options ─────────────────────
const HL_ICONS = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Forest: ForestRoundedIcon,
    Volunteer: VolunteerActivismIcon,
    Groups: GroupsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    Shield: GppGoodRoundedIcon,
    Build: BuildRoundedIcon,
};
const HL_ICON_KEYS = Object.keys(HL_ICONS);
const HL_ICON_LABELS = {
    Star: 'Star', Favorite: 'Favorite', Forest: 'Forest', Volunteer: 'Volunteer',
    Groups: 'Groups', CheckCircle: 'Check Circle', Trophy: 'Trophy', Shield: 'Shield', Build: 'Build',
};
function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ============================================================================
// Helper Functions
// ============================================================================
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.crossOrigin = 'anonymous';
        image.src = url;
    });

const createCroppedImage = async (imageSrc, pixelCrop, outputWidth, outputHeight) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 0.92);
    });
};

// ============================================================================
// Helper Components
// ============================================================================

function ImageCropDialog({ open, onClose, imageSrc, aspect, title, onCropComplete, outputSize, cropShape = 'rect' }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((c) => setCrop(c), []);
    const onZoomChange = useCallback((z) => setZoom(z), []);

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPx) => {
        setCroppedAreaPixels(croppedAreaPx);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return;
        setProcessing(true);
        try {
            const croppedBlob = await createCroppedImage(
                imageSrc,
                croppedAreaPixels,
                outputSize.width,
                outputSize.height
            );
            onCropComplete(croppedBlob);
            onClose();
        } catch {
            // Keep silent
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CropIcon sx={{ color: 'primary.dark' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
                </Box>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 400 }, bgcolor: 'grey.900' }}>
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            cropShape={cropShape}
                            showGrid={cropShape !== 'round'}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                        />
                    )}
                </Box>
                <Box sx={{ px: 3, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ZoomInIcon sx={{ color: 'text.secondary' }} />
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e, z) => setZoom(z)}
                            sx={{ color: 'primary.dark' }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={processing}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
                >
                    {processing ? 'Processing...' : 'Apply Crop'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return <Box>{children}</Box>;
}

function RoleChip({ role, size = 'small' }) {
    const r = String(role || '').toLowerCase();
    return (
        <Chip
            label={ROLE_LABELS[r] || 'Member'}
            color={ROLE_COLORS[r] || 'default'}
            size={size}
            icon={r === 'owner' ? <OwnerIcon sx={{ fontSize: 14 }} /> : undefined}
            sx={{ fontWeight: 700, fontSize: 11 }}
        />
    );
}

function SectionHeader({ icon, title, action }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
                <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
            </Stack>
            {action}
        </Stack>
    );
}

// ============================================================================
// InviteTeamModal Component
// ============================================================================
function InviteTeamModal({ open, onClose, businessId, businessName, onInviteSent, existingMemberIds = [], currentUserId, currentAdminCount = 0, isOwner = false }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followersLoading, setFollowersLoading] = useState(false);
    const [invitingUserId, setInvitingUserId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const canInviteAsAdmin = currentAdminCount < MAX_ADMINS;

    useEffect(() => {
        if (!open || !currentUserId) return;
        async function loadFollowers() {
            setFollowersLoading(true);
            try {
                const data = await fetchUserSocialForInvite(currentUserId);
                setFollowers(data.followers || []);
            } catch {
                // keep silent
            } finally {
                setFollowersLoading(false);
            }
        }
        loadFollowers();
    }, [open, currentUserId]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await searchUsersForInvite({ q: searchQuery.trim(), limit: 20 });
            setSearchResults(data.users || []);
        } catch (err) {
            setError(err.message || 'Search failed.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(handleSearch, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleInviteUser = async (user) => {
        if (!canInviteAsAdmin) {
            setError(`You can only have up to ${MAX_ADMINS} admins. Remove an admin first.`);
            return;
        }
        setInvitingUserId(user.id);
        setError('');
        setSuccess('');
        try {
            await inviteTeamMember(businessId, user.id, 'admin');
            setSuccess(`Invite sent to ${user.first_name || user.handle || 'user'}!`);
            onInviteSent?.();
            setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
            setFollowers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err) {
            setError(err.message || 'Failed to send invite.');
        } finally {
            setInvitingUserId(null);
        }
    };

    const handleGenerateLink = async () => {
        if (!canInviteAsAdmin) {
            setError(`You can only have up to ${MAX_ADMINS} admins. Remove an admin first.`);
            return;
        }
        setLinkLoading(true);
        setError('');
        try {
            const data = await generateInviteLink(businessId);
            setInviteLink(data.invite_url);
            onInviteSent?.();
        } catch (err) {
            setError(err.message || 'Failed to generate link.');
        } finally {
            setLinkLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            setError('Failed to copy link.');
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setError('');
        setSuccess('');
        setInviteLink('');
        setActiveTab(0);
        onClose();
    };

    const filteredSearchResults = useMemo(() => {
        return searchResults.filter((u) => !existingMemberIds.includes(u.id));
    }, [searchResults, existingMemberIds]);

    const filteredFollowers = useMemo(() => {
        return followers.filter((u) => !existingMemberIds.includes(u.id));
    }, [followers, existingMemberIds]);

    const renderUserList = (users, isLoading) => {
        if (isLoading) {
            return (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                </Box>
            );
        }
        if (users.length === 0) {
            return (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        {activeTab === 0 ? 'Search for people to invite' : 'No followers to invite'}
                    </Typography>
                </Box>
            );
        }
        return (
            <List disablePadding>
                {users.map((user) => (
                    <ListItem
                        key={user.id}
                        secondaryAction={
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleInviteUser(user)}
                                disabled={invitingUserId === user.id || !canInviteAsAdmin}
                                sx={{ textTransform: 'none', fontWeight: 700, minWidth: 80 }}
                            >
                                {invitingUserId === user.id ? <CircularProgress size={16} /> : 'Invite'}
                            </Button>
                        }
                        sx={{ px: 0 }}
                    >
                        <ListItemAvatar>
                            <Avatar src={user.avatar_url || defaultAvatar}>
                                {user.first_name?.[0] || user.handle?.[0] || '?'}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography fontWeight={700}>{user.first_name} {user.last_name}</Typography>}
                            secondary={user.handle ? `@${user.handle}` : null}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <InviteIcon sx={{ color: 'primary.dark' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Invite Team Members</Typography>
                </Stack>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {!canInviteAsAdmin && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You've reached the maximum of {MAX_ADMINS} admins. Remove an admin before inviting more.
                    </Alert>
                )}
                {isOwner && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <LinkIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Invite Link</Typography>
                        </Stack>
                        {!inviteLink ? (
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={handleGenerateLink}
                                disabled={linkLoading || !canInviteAsAdmin}
                                startIcon={linkLoading ? <CircularProgress size={16} /> : <AddIcon />}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                Generate Invite Link
                            </Button>
                        ) : (
                            <Stack direction="row" spacing={1}>
                                <TextField fullWidth size="small" value={inviteLink} InputProps={{ readOnly: true }} />
                                <Button
                                    variant="contained"
                                    onClick={handleCopyLink}
                                    startIcon={linkCopied ? <CheckIcon /> : <CopyIcon />}
                                    color={linkCopied ? 'success' : 'primary'}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, minWidth: 100 }}
                                >
                                    {linkCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </Stack>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {inviteLink
                                ? 'This link is single-use and expires in 7 days.'
                                : 'Generate a link to invite someone as an admin.'}
                        </Typography>
                    </Paper>
                )}
                {isOwner && (
                    <Divider sx={{ my: 2 }}>
                        <Typography variant="caption" color="text.secondary">OR INVITE DIRECTLY</Typography>
                    </Divider>
                )}
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                    <Tab icon={<PeopleIcon />} iconPosition="start" label="All People" sx={{ textTransform: 'none', fontWeight: 700 }} />
                    <Tab icon={<FollowersIcon />} iconPosition="start" label="My Followers" sx={{ textTransform: 'none', fontWeight: 700 }} />
                </Tabs>
                {activeTab === 0 && (
                    <Box>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by name..."
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                            }}
                            sx={{ mb: 2 }}
                        />
                        {renderUserList(filteredSearchResults, loading)}
                    </Box>
                )}
                {activeTab === 1 && <Box>{renderUserList(filteredFollowers, followersLoading)}</Box>}
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// BusinessHoursEditor Component
// ============================================================================

/** Convert "HH:mm" (24h) to { hour: '1'-'12', minute: '00'-'55', period: 'AM'|'PM' } */
function parse24To12(timeStr) {
    if (!timeStr) return { hour: '', minute: '', period: '' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    return { hour: String(h), minute: m, period };
}

/** Convert { hour, minute, period } back to "HH:mm" (24h) for storage */
function format12To24(hour, minute, period) {
    if (!hour || !minute || !period) return '';
    let h = parseInt(hour, 10);
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h !== 12) h = h + 12;
    return `${String(h).padStart(2, '0')}:${minute}`;
}

/** Generate minute options in 5-minute increments */
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const HOUR_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function TimeSelect12Hr({ value, onChange }) {
    const parsed = parse24To12(value);

    const handlePartChange = (part, newVal) => {
        const current = parse24To12(value);
        const updated = { ...current, [part]: newVal };
        // Auto-fill defaults for the other fields when user picks the first value
        if (!updated.hour && (part === 'minute' || part === 'period')) updated.hour = '9';
        if (!updated.minute && (part === 'hour' || part === 'period')) updated.minute = '00';
        if (!updated.period && (part === 'hour' || part === 'minute')) updated.period = 'AM';
        const result = format12To24(updated.hour, updated.minute, updated.period);
        if (result) onChange(result);
    };

    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <FormControl size="small" sx={{ minWidth: 58 }}>
                <Select
                    value={parsed.hour}
                    displayEmpty
                    onChange={(e) => handlePartChange('hour', e.target.value)}
                    sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.6, px: 1 } }}
                    renderValue={(v) => v || <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>--</Typography>}
                >
                    {HOUR_OPTIONS.map((h) => (
                        <MenuItem key={h} value={h} sx={{ fontSize: 13 }}>{h}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>:</Typography>
            <FormControl size="small" sx={{ minWidth: 56 }}>
                <Select
                    value={parsed.minute}
                    displayEmpty
                    onChange={(e) => handlePartChange('minute', e.target.value)}
                    sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.6, px: 1 } }}
                    renderValue={(v) => v || <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>--</Typography>}
                >
                    {MINUTE_OPTIONS.map((m) => (
                        <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 58 }}>
                <Select
                    value={parsed.period}
                    displayEmpty
                    onChange={(e) => handlePartChange('period', e.target.value)}
                    sx={{ fontSize: 13, fontWeight: 600, '& .MuiSelect-select': { py: 0.6, px: 1 } }}
                    renderValue={(v) => v || <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>--</Typography>}
                >
                    <MenuItem value="AM" sx={{ fontSize: 13 }}>AM</MenuItem>
                    <MenuItem value="PM" sx={{ fontSize: 13 }}>PM</MenuItem>
                </Select>
            </FormControl>
        </Stack>
    );
}

function BusinessHoursEditor({ hours, onChange }) {
    const handleDayChange = (day, updates) => {
        const newHours = { ...hours };
        if (!newHours[day]) {
            newHours[day] = {};
        }
        if (updates.closed) {
            newHours[day] = { closed: true };
        } else if (updates.allDay) {
            newHours[day] = { allDay: true };
        } else {
            const merged = { ...newHours[day], ...updates };
            delete merged.closed;
            delete merged.allDay;
            newHours[day] = merged;
        }
        onChange(newHours);
    };

    return (
        <Stack spacing={1.5}>
            {DAY_NAMES.map((day) => {
                const dayHours = hours?.[day] || {};
                const isClosed = dayHours.closed;
                const isAllDay = dayHours.allDay;

                return (
                    <Paper key={day} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                        <Stack spacing={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography sx={{ minWidth: { xs: 0, sm: 80 }, fontWeight: 600, fontSize: 14, flex: { xs: 1, sm: 'none' } }}>
                                    {DAY_LABELS[day]}
                                </Typography>
                                <Button
                                    size="small"
                                    variant={isClosed ? 'contained' : 'outlined'}
                                    color={isClosed ? 'error' : 'inherit'}
                                    onClick={() => {
                                        if (isClosed) {
                                            handleDayChange(day, { closed: false, allDay: false });
                                        } else {
                                            handleDayChange(day, { closed: true });
                                        }
                                    }}
                                    sx={{ minWidth: 70, textTransform: 'none', fontSize: 12 }}
                                >
                                    Closed
                                </Button>
                                <Button
                                    size="small"
                                    variant={isAllDay ? 'contained' : 'outlined'}
                                    color={isAllDay ? 'success' : 'inherit'}
                                    onClick={() => {
                                        if (isAllDay) {
                                            handleDayChange(day, { closed: false, allDay: false });
                                        } else {
                                            handleDayChange(day, { allDay: true });
                                        }
                                    }}
                                    sx={{ minWidth: 70, textTransform: 'none', fontSize: 12 }}
                                >
                                    24 Hours
                                </Button>
                            </Stack>
                            {!isClosed && !isAllDay && (
                                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ pl: { xs: 0, sm: '88px' } }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 600, minWidth: 36 }}>Open</Typography>
                                        <TimeSelect12Hr
                                            value={dayHours.open || ''}
                                            onChange={(val) => handleDayChange(day, { open: val })}
                                        />
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 600, minWidth: 36 }}>Close</Typography>
                                        <TimeSelect12Hr
                                            value={dayHours.close || ''}
                                            onChange={(val) => handleDayChange(day, { close: val })}
                                        />
                                    </Stack>
                                </Stack>
                            )}
                        </Stack>
                    </Paper>
                );
            })}
        </Stack>
    );
}

// ============================================================================
// Collapsible Form Section (for Information tab)
// ============================================================================
function FormSection({ title, icon: IconComp, defaultOpen = false, forceOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    const prevForceRef = useRef(false);
    useEffect(() => {
        if (forceOpen && !prevForceRef.current) setOpen(true);
        prevForceRef.current = forceOpen;
    }, [forceOpen]);
    return (
        <Box sx={{ mb: 1 }}>
            <Box
                data-form-section-toggle=""
                data-form-section-open={open ? 'true' : 'false'}
                onClick={() => setOpen((v) => !v)}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', py: 1, px: 0.5, userSelect: 'none', '&:hover': { opacity: 0.8 } }}
            >
                {open ? <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                {IconComp && <IconComp sx={{ fontSize: 16, color: 'primary.main' }} />}
                <Typography sx={{ fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                    {title}
                </Typography>
            </Box>
            <Collapse in={open} unmountOnExit={false}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.25, md: 1.75 }, pt: 0.5 }}>
                    {children}
                </Box>
            </Collapse>
        </Box>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BusinessAdminPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const baseTheme = useTheme();
    // Local theme with `md` remapped to 1440 (the Business Hub page's mobile
    // threshold). Every `{ xs, md }` sx prop on this page now flips at 1440.
    const theme = useMemo(() => buildAdminTheme(baseTheme), [baseTheme]);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { isBusinessAccount, activeBusinessId } = useActiveAccount();
    const [searchParams] = useSearchParams();
    const chromeTop = useChromeTop();

    // Track scroll direction so mobile bottom bar slides to bottom: 0 when nav hides
    const [bottomNavHidden, setBottomNavHidden] = useState(false);
    useEffect(() => {
        if (!isMobile) return;
        let lastY = window.scrollY;
        const THRESHOLD = 10;
        const onScroll = () => {
            const y = window.scrollY;
            if (Math.abs(y - lastY) < THRESHOLD) return;
            setBottomNavHidden(y > lastY && y > 50);
            lastY = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isMobile]);
    const location = useLocation();

    // Redirect to home if user switches accounts while on admin console
    useEffect(() => {
        const handler = () => {
            window.location.assign("/");
        };
        window.addEventListener("ll:account:changed", handler);
        return () => window.removeEventListener("ll:account:changed", handler);
    }, []);

    // ── Setup mode state ──
    // Setup mode is activated via:
    //   /business/admin/setup (new business — creates draft first)
    //   /business/admin/setup?token=xxx (resume existing draft)
    const isSetupRoute = location.pathname.includes('/admin/setup');
    const urlToken = searchParams.get('token') || '';
    const [setupMode, setSetupMode] = useState(isSetupRoute);
    const [setupToken, setSetupToken] = useState(urlToken);
    const [setupLoading, setSetupLoading] = useState(isSetupRoute);
    const [setupNameInput, setSetupNameInput] = useState('');
    const [setupNameDialogOpen, setSetupNameDialogOpen] = useState(false);
    const [setupNameSubmitting, setSetupNameSubmitting] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [submittingForReview, setSubmittingForReview] = useState(false);
    const [setupSubmitted, setSetupSubmitted] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [deletingDraft, setDeletingDraft] = useState(false);
    const [setupTransitioning, setSetupTransitioning] = useState(false);

    // ── Rate limiting: draft creation & submit-for-review ──
    const { checkLimit: checkDraftCreateLimit, recordAction: recordDraftCreate } = useRateLimit('business-draft-create', {
        burstMax: 3,
        burstWindowMs: 60_000,      // max 3 drafts per minute
        maxPerHour: 10,
    });
    const { checkLimit: checkSubmitLimit, recordAction: recordSubmitAction } = useRateLimit('business-submit-review', {
        burstMax: 2,
        burstWindowMs: 30_000,      // max 2 submissions per 30 s
        maxPerHour: 8,
    });
    const [draftLimitReached, setDraftLimitReached] = useState(false);
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({ retryAfterSec: 0, reason: '', actionLabel: '' });

    // Handle/slug availability checking (debounced, like CreateGroupModal)
    const [handleError, setHandleError] = useState('');
    const [handleChecking, setHandleChecking] = useState(false);
    const [handleAvailable, setHandleAvailable] = useState(null);
    const handleCheckTimerRef = useRef(null);

    // Handle change rate-limiting state (mirrors ProfileHeader moderation)
    const [handleStats, setHandleStats] = useState(null); // { remaining, nextAllowed }
    const [handleStatsLoading, setHandleStatsLoading] = useState(false);

    const [business, setBusiness] = useState(null);
    const [businessLoading, setBusinessLoading] = useState(true);
    const [viewerRole, setViewerRole] = useState(null);
    const [activeTab, setActiveTab] = useState(TABS.INFORMATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rawLoadError, setRawLoadError] = useState(null);
    const [success, setSuccess] = useState('');

    const [teamData, setTeamData] = useState(null);
    const [teamLoading, setTeamLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSavingSettings] = useState(false);
    const [infoForm, setInfoForm] = useState({});
    const [infoSaving, setInfoSaving] = useState(false);
    const [infoChanged, setInfoChanged] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [profanityFieldErrors, setProfanityFieldErrors] = useState({}); // { fieldKey: 'message' }
    const [pendingCategoryChange, setPendingCategoryChange] = useState(null); // { newCategory: string } or null

    const [gallery, setGallery] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [coverRemoved, setCoverRemoved] = useState(false);
    const [pendingFileDeletes, setPendingFileDeletes] = useState([]); // URLs to delete from GCS on save
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [cropType, setCropType] = useState(null);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const contentRef = useRef(null);

    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [copiedInviteId, setCopiedInviteId] = useState(null);
    const [userCardAnchor, setUserCardAnchor] = useState(null);
    const [userCardMember, setUserCardMember] = useState(null);

    const [showDangerZone, setShowDangerZone] = useState(true);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [dangerLoading, setDangerLoading] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState('');

    const [nameChangeDialogOpen, setNameChangeDialogOpen] = useState(false);
    const [requestedName, setRequestedName] = useState('');
    const [nameChangeReason, setNameChangeReason] = useState('');
    const [nameChangeSubmitting, setNameChangeSubmitting] = useState(false);
    const [nameChangeSuccess, setNameChangeSuccess] = useState(false);

    // Spotlight / Discover fields editing state
    const [serviceInput, setServiceInput] = useState('');
    const [uploadingOwnerPhoto, setUploadingOwnerPhoto] = useState(false);
    const [uploadingAdditionalOwnerPhoto, setUploadingAdditionalOwnerPhoto] = useState(-1);
    const [uploadingHighlightPhoto, setUploadingHighlightPhoto] = useState(-1);
    const [hlCropOpen, setHlCropOpen] = useState(false);
    const [hlCropSrc, setHlCropSrc] = useState(null);
    const [hlCropIdx, setHlCropIdx] = useState(-1);
    const ownerPhotoInputRef = useRef(null);
    const additionalOwnerPhotoInputRefs = useRef({});
    const highlightPhotoInputRefs = useRef({});

    // Geocoding / Map state
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState('');
    const [pendingCoordinates, setPendingCoordinates] = useState(null); // { lat, lng, formatted_address }
    const [confirmedCoordinates, setConfirmedCoordinates] = useState(null); // Saved coordinates
    const [addressError, setAddressError] = useState('');
    const addressFieldRef = useRef(null);

    const businessId = business?.id;
    const businessName = business?.name || 'Business';
    const isOwner = viewerRole === 'owner';
    const isAdmin = viewerRole === 'admin' || isOwner;
    const hasConsoleAccess = Boolean(
        isBusinessAccount &&
        activeBusinessId != null &&
        businessId != null &&
        String(activeBusinessId) === String(businessId)
    );

    // Handle change rate-limiting (mirrors ProfileHeader's usernameBlocked logic)
    const handleNextAllowed = handleStats?.nextAllowed ? new Date(handleStats.nextAllowed) : null;
    const daysUntilNextHandleChange =
        handleNextAllowed && handleNextAllowed.getTime() > Date.now()
            ? Math.max(1, Math.ceil((handleNextAllowed.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
            : 0;
    const handleBlocked = Boolean(!setupMode && handleStats && handleStats.remaining <= 0 && daysUntilNextHandleChange > 0);

    const displayAvatarSrc = avatarRemoved ? '' : (avatarPreview || business?.avatar_url || '');
    const hasCustomAvatar = Boolean(!avatarRemoved && (avatarPreview || business?.avatar_url));
    const displayCoverSrc = coverRemoved ? '' : (coverPreview || business?.cover_url || '');

    // Detect if gallery photos have changed from the saved business data
    const hasGalleryChanges = useMemo(() => {
        if (gallery.some((item) => item.file)) return true;
        const raw = business?.gallery || (typeof business?.gallery_json === 'string' ? (() => { try { return JSON.parse(business.gallery_json); } catch { return []; } })() : business?.gallery_json) || [];
        const oldUrls = (Array.isArray(raw) ? raw : []).map((item) => (item && typeof item === 'object' ? item.url : item)).filter(Boolean).sort();
        const newUrls = gallery.map((item) => item.url).filter((u) => u && !u.startsWith('blob:')).sort();
        if (oldUrls.length !== newUrls.length) return true;
        return oldUrls.some((url, i) => url !== newUrls[i]);
    }, [gallery, business]);

    const currentUserId = useMemo(() => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            const account = raw ? JSON.parse(raw) : null;
            return account?.user_id || account?.id || null;
        } catch {
            return null;
        }
    }, []);

    const currentAdminCount = useMemo(() => {
        if (!teamData?.members) return 0;
        return teamData.members.filter((m) => m.role === 'admin' || m.role === 'owner').length;
    }, [teamData]);

    const existingMemberIds = useMemo(() => {
        if (!teamData) return [];
        const memberIds = (teamData.members || []).map((m) => m.user_id);
        const inviteIds = (teamData.pending_invites || []).map((i) => i.invitee_id).filter(Boolean);
        return [...memberIds, ...inviteIds];
    }, [teamData]);

    // NOTE: activeTab is always initialized to TABS.INFORMATION which is valid,
    // so no corrective effect is needed. The old effect that called
    // setActiveTab(TABS.INFORMATION) whenever activeTab wasn't in a valid set
    // was removed because it could cause "Maximum update depth exceeded" in
    // edge cases where a re-render changed the valid set.

    // Cleanup handle check timer on unmount
    useEffect(() => {
        return () => {
            if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        };
    }, []);

    // Fetch handle change stats for rate-limiting (non-setup mode only, mirrors ProfileHeader)
    useEffect(() => {
        if (setupMode || !businessId) return;
        let cancelled = false;
        setHandleStatsLoading(true);
        (async () => {
            try {
                const stats = await fetchBusinessHandleStats(businessId);
                if (!cancelled) setHandleStats(stats);
            } catch {
                // Non-critical — if stats can't be loaded, allow editing (server enforces limits)
                if (!cancelled) setHandleStats(null);
            } finally {
                if (!cancelled) setHandleStatsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [setupMode, businessId]);

    const checkHandleAvailability = (value) => {
        if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        if (!value || value.length < 3) {
            setHandleAvailable(null);
            setHandleChecking(false);
            return;
        }
        if (!/^[a-z0-9_]{3,30}$/.test(value)) {
            setHandleAvailable(null);
            setHandleChecking(false);
            return;
        }
        setHandleChecking(true);
        setHandleAvailable(null);

        handleCheckTimerRef.current = setTimeout(async () => {
            try {
                const data = await checkBusinessSlug(value, businessId || null);
                // Only update if the value hasn't changed since we started
                setInfoForm((current) => {
                    if (current.slug === value) {
                        setHandleAvailable(Boolean(data.available));
                        if (!data.available && data.message) {
                            setHandleError(data.message);
                        } else if (data.available) {
                            setHandleError('');
                        }
                    }
                    return current;
                });
            } catch {
                setHandleAvailable(null);
            } finally {
                setHandleChecking(false);
            }
        }, 400);
    };

    const handleSlugChange = (value) => {
        const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '').replace(/__+/g, '_').slice(0, 30);
        handleInfoChange('slug', cleaned);
        setHandleAvailable(null);

        if (cleaned && cleaned.length < 3) {
            setHandleError('Must be at least 3 characters.');
            setHandleChecking(false);
            if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
        } else if (cleaned && !/^[a-z0-9_]{3,30}$/.test(cleaned)) {
            setHandleError('Use lowercase letters, numbers, and underscores (3-30 chars).');
            setHandleChecking(false);
        } else {
            // Reserved username check (route conflicts + personally reserved)
            const reservedResult = checkReservedUsername(cleaned);
            if (reservedResult.reserved) {
                setHandleError(reservedResult.message);
                setHandleAvailable(false);
                setHandleChecking(false);
                if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
                return;
            }
            // Client-side profanity check on handle
            if (cleaned) {
                const profResult = checkFieldsProfanity({ username: cleaned });
                if (!profResult.clean) {
                    setHandleError('Username contains inappropriate language. Please revise.');
                    setHandleAvailable(false);
                    setHandleChecking(false);
                    if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);
                    return;
                }
            }
            setHandleError('');
            checkHandleAvailability(cleaned);
        }
    };

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // ── Setup mode initialization ──
    // If we're on the setup route, either resume a draft (token) or create a new one
    useEffect(() => {
        if (!isSetupRoute) return;
        let cancelled = false;

        async function initSetup() {
            setSetupLoading(true);
            setError('');

            // Case 1: We have a token — fetch existing draft
            if (urlToken) {
                // Close name dialog if it was open from a previous no-token state
                setSetupNameDialogOpen(false);
                try {
                    const data = await fetchInviteDetails(urlToken);
                    if (cancelled) return;
                    const biz = data?.business || null;
                    if (!biz) {
                        setError('Business not found for this setup link.');
                        setSetupLoading(false);
                        return;
                    }
                    setBusiness(biz);
                    setSetupToken(urlToken);
                    setSetupMode(true);
                    setViewerRole('owner');
                    setBusinessLoading(false);
                } catch (err) {
                    if (cancelled) return;
                    if (err.redirect_to) {
                        navigate(err.redirect_to, { replace: true });
                        return;
                    }
                    setError(err.message || 'Failed to load setup data.');
                } finally {
                    if (!cancelled) setSetupLoading(false);
                }
                return;
            }

            // Case 2: No token — show name dialog to create new draft
            if (!cancelled) {
                setSetupNameDialogOpen(true);
                setSetupLoading(false);
                setBusinessLoading(false);
            }
        }

        initSetup();
        return () => { cancelled = true; };
    }, [isSetupRoute, urlToken, navigate]);

    // Handle creating a new draft from the name dialog
    const handleSetupCreateDraft = async () => {
        const name = setupNameInput.trim();
        if (!name) return;

        // Rate-limit check
        const rl = checkDraftCreateLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'business drafts' });
            setRateLimitOpen(true);
            return;
        }

        setSetupNameSubmitting(true);
        setError('');
        try {
            const data = await createBusinessDraft(name);

            // Backend may return a draft-limit error (max 5 drafts)
            if (data?.draftLimitReached) {
                setDraftLimitReached(true);
                setError(data.message || 'You can only have up to 5 business page drafts at a time. Please delete an existing draft before creating a new one.');
                setSetupNameSubmitting(false);
                return;
            }

            recordDraftCreate();

            if (data?.token) {
                setSetupToken(data.token);
                setSetupMode(true);
                // Fetch the full business data using the new token
                const details = await fetchInviteDetails(data.token);
                setBusiness(details?.business || null);
                setViewerRole('owner');
                // Trigger fade-out animation on the name dialog
                setSetupTransitioning(true);
                // Short delay for the fade-out, then reveal the form
                setTimeout(() => {
                    setSetupNameDialogOpen(false);
                    setSetupTransitioning(false);
                }, 350);
                // Update URL to include token so refreshing works
                navigate(`/business/admin/setup?token=${encodeURIComponent(data.token)}`, { replace: true });
                // Refresh the Header's account section so the new draft business appears
                try { window.dispatchEvent(new CustomEvent('ll:business:accounts-updated')); } catch { /* ignore */ }
            }
        } catch (err) {
            // Catch draft-limit 429 from backend
            if (err?.status === 429 || err?.response?.status === 429 || String(err.message).toLowerCase().includes('draft limit')) {
                setDraftLimitReached(true);
                setError(err.message || 'You can only have up to 5 business page drafts at a time. Please delete an existing draft before creating a new one.');
            } else {
                setError(err.message || 'Failed to create business draft.');
            }
        } finally {
            setSetupNameSubmitting(false);
        }
    };

    // Save draft handler (setup mode)
    const handleSaveDraft = async () => {
        if (!setupToken) return;

        // Check if anything actually changed
        const hasPhotoChanges = Boolean(avatarFile || coverFile || avatarRemoved || coverRemoved || hasGalleryChanges);
        if (!infoChanged && !hasPhotoChanges) {
            showSaveSuccess('No changes to save.');
            return;
        }

        // Client-side profanity check — all text fields
        const _pf1 = {
            name: String(infoForm.name || '').trim(),
            slug: String(infoForm.slug || '').trim(),
            description: String(infoForm.description || '').trim(),
        };
        const _oi1 = infoForm.owner_info_json || {};
        if (_oi1.section_title?.trim()) _pf1['owner section title'] = _oi1.section_title.trim();
        if (_oi1.name?.trim()) _pf1['owner name'] = _oi1.name.trim();
        if (_oi1.title?.trim()) _pf1['owner title'] = _oi1.title.trim();
        if (_oi1.about?.trim()) _pf1['owner bio'] = _oi1.about.trim();
        (Array.isArray(_oi1.additional_owners) ? _oi1.additional_owners : []).forEach((ao, i) => {
            if (ao?.name?.trim()) _pf1[`additional owner name`] = ao.name.trim();
            if (ao?.title?.trim()) _pf1[`additional owner title`] = ao.title.trim();
            if (ao?.about?.trim()) _pf1[`additional owner bio`] = ao.about.trim();
        });
        (Array.isArray(infoForm.highlight_sections_json) ? infoForm.highlight_sections_json : []).forEach((sec, i) => {
            if (sec?.title?.trim()) _pf1[`highlight section ${i + 1} title`] = sec.title.trim();
            const hlBody = (sec?.description || sec?.body || '').trim();
            if (hlBody) _pf1[`highlight section ${i + 1} description`] = hlBody;
        });
        const profanityResult = checkFieldsProfanity(_pf1);
        if (!profanityResult.clean) {
            const failedField = profanityResult.field || 'content';
            setProfanityFieldErrors({ [failedField]: `Your ${failedField} contains inappropriate language. Please revise.` });
            setShowValidation(true);
            const allToggles = contentRef.current?.querySelectorAll('[data-form-section-toggle]');
            if (allToggles) {
                allToggles.forEach((toggle) => {
                    const isOpen = toggle.getAttribute('data-form-section-open') === 'true';
                    if (!isOpen) toggle.click();
                });
            }
            setTimeout(() => {
                const errEl = contentRef.current?.querySelector(`[data-profanity-field="${failedField}"], .Mui-error, [data-validation-error="true"]`);
                if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
        }
        setProfanityFieldErrors({});

        // Reserved username check (safety net at save)
        const slugForReservedCheck = String(infoForm.slug || '').trim();
        if (slugForReservedCheck) {
            const reservedCheck = checkReservedUsername(slugForReservedCheck);
            if (reservedCheck.reserved) {
                setHandleError(reservedCheck.message);
                setHandleAvailable(false);
                setProfanityFieldErrors({ slug: reservedCheck.message });
                setShowValidation(true);
                return;
            }
        }

        // Require name and username before saving
        const nameTrimmed = String(infoForm.name || '').trim();
        const slugTrimmed = String(infoForm.slug || '').trim();
        if (!nameTrimmed || !slugTrimmed) {
            setShowValidation(true);
            setError(!nameTrimmed && !slugTrimmed ? 'Business name and username are required.' : !nameTrimmed ? 'Business name is required.' : 'Username is required.');
            // Open Basic Information section and scroll to error
            const allToggles = contentRef.current?.querySelectorAll('[data-form-section-toggle]');
            if (allToggles) {
                allToggles.forEach((toggle) => {
                    const isOpen = toggle.getAttribute('data-form-section-open') === 'true';
                    if (!isOpen) toggle.click();
                });
            }
            setTimeout(() => {
                const errEl = contentRef.current?.querySelector('.Mui-error, [data-validation-error="true"]');
                if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
        }

        setDraftSaving(true);
        setError('');
        try {
            const { name, hours, slug: _draftSlug, ...profileData } = infoForm;
            // In setup mode, we can save the name directly
            // Do NOT send slug during draft save — handle is only locked on submit
            const payload = { ...profileData, name };
            payload.hours_json = hours || {};
            payload.gallery_json = [];

            // Remove the raw 'hours' and 'slug' keys
            delete payload.hours;
            delete payload.slug;

            // Upload photos if changed
            if (avatarFile) {
                payload.avatar_url = await uploadFileToGCS(avatarFile, 'business/avatars');
            } else if (avatarRemoved) {
                payload.avatar_url = '';
            }
            if (coverFile) {
                payload.cover_url = await uploadFileToGCS(coverFile, 'business/covers');
            } else if (coverRemoved) {
                payload.cover_url = '';
            }
            // Gallery uploads run in parallel (was sequential). A 12-photo
            // gallery used to be 12 back-to-back moderate+upload rounds
            // (often 15+ seconds); now it's one concurrent wave.
            // moderateAndUpload stays — PhotosUploadSection doesn't pre-scan,
            // so this is the sole moderation pass for gallery photos.
            const galleryResults = await Promise.all(
                gallery.map(async (item) => {
                    if (item.file) {
                        try {
                            return await moderateAndUpload(item.file, 'business/gallery');
                        } catch {
                            return null;
                        }
                    }
                    if (item.url && !item.url.startsWith('blob:')) {
                        return item.url;
                    }
                    return null;
                })
            );
            for (const url of galleryResults) {
                if (url) payload.gallery_json.push(url);
            }

            const result = await saveBusinessDraft(setupToken, payload);
            if (result?.business) {
                setBusiness(result.business);
            }

            // If business is pending_approval, re-submit so the admin console
            // sees the updated data with a refreshed submitted_for_approval_at timestamp
            if (business?.status === 'pending_approval') {
                try {
                    await completeBusinessSetup(setupToken, payload);
                } catch {
                    // Non-critical — the data is already saved via save-draft
                }
            }

            // Flush pending GCS file deletions (best-effort, after successful save)
            if (businessId) await flushPendingFileDeletes();

            setAvatarFile(null);
            setCoverFile(null);
            setAvatarPreview(null);
            setCoverPreview(null);
            setAvatarRemoved(false);
            setCoverRemoved(false);
            showSaveSuccess(business?.status === 'pending_approval' ? 'Changes saved. The updated version will be reviewed.' : 'Draft saved successfully.');
            setInfoChanged(false);
            // Refresh the Header's account section so the new/updated business appears
            try { window.dispatchEvent(new CustomEvent('ll:business:accounts-updated')); } catch { /* ignore */ }
        } catch (err) {
            if (err.redirect_to) {
                navigate(err.redirect_to, { replace: true });
                return;
            }
            if (err.isModeration) {
                showPhotoError(err.message);
            } else if (err.data?.moderationReason && err.data?.field) {
                setProfanityFieldErrors({ [err.data.field]: err.message || 'This field contains inappropriate content.' });
                setShowValidation(true);
                setTimeout(() => {
                    const errEl = contentRef.current?.querySelector(`[data-profanity-field="${err.data.field}"], .Mui-error`);
                    if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
            } else {
                setError(err.message || 'Failed to save draft.');
            }
        } finally {
            setDraftSaving(false);
        }
    };

    // Submit for review handler (setup mode)
    const handleSubmitForReview = async () => {
        if (!setupToken) return;

        // Rate-limit check for submissions
        const rl = checkSubmitLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'submissions' });
            setRateLimitOpen(true);
            return;
        }

        // Validate required fields
        const descTrimmed = String(infoForm.description || '').trim();
        const catKey = infoForm.category_key || '';
        const nameTrimmed = String(infoForm.name || '').trim();
        const slugTrimmed = String(infoForm.slug || '').trim();
        const emailVal = String(infoForm.email_public || '').trim();
        const emailInvalid = emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        const hasValidationErrors = !nameTrimmed || !slugTrimmed || !descTrimmed || !catKey || emailInvalid;

        if (hasValidationErrors) {
            setShowValidation(true);
            const allToggles = contentRef.current?.querySelectorAll('[data-form-section-toggle]');
            if (allToggles) {
                allToggles.forEach((toggle) => {
                    const isOpen = toggle.getAttribute('data-form-section-open') === 'true';
                    if (!isOpen) toggle.click();
                });
            }
            setTimeout(() => {
                const errEl = contentRef.current?.querySelector('.Mui-error, [data-validation-error="true"]');
                if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
        }

        // Check handle is available before submitting
        if (handleAvailable === false) {
            setError('The handle you chose is already taken. Please pick a different one.');
            return;
        }

        // If we haven't checked yet or it's still checking, do a final check now
        if (slugTrimmed.length >= 3 && handleAvailable !== true) {
            setError('');
            try {
                const checkResult = await checkBusinessSlug(slugTrimmed, businessId || null);
                if (!checkResult.available) {
                    setHandleAvailable(false);
                    setHandleError(checkResult.message || 'This handle is already taken.');
                    setError('The handle you chose is already taken. Please pick a different one.');
                    return;
                }
                setHandleAvailable(true);
                setHandleError('');
            } catch {
                setError('Could not verify handle availability. Please try again.');
                return;
            }
        }

        setShowValidation(false);
        setSubmittingForReview(true);
        setError('');
        try {
            const { name, hours, ...profileData } = infoForm;
            // Include slug in submit payload to lock it down
            const payload = { ...profileData, name, slug: slugTrimmed };
            payload.hours_json = hours || {};
            payload.gallery_json = [];

            // Remove the raw 'hours' key so backend doesn't choke on it
            delete payload.hours;

            if (avatarFile) {
                payload.avatar_url = await uploadFileToGCS(avatarFile, 'business/avatars');
            } else if (avatarRemoved) {
                payload.avatar_url = '';
            }
            if (coverFile) {
                payload.cover_url = await uploadFileToGCS(coverFile, 'business/covers');
            } else if (coverRemoved) {
                payload.cover_url = '';
            }
            // Gallery uploads run in parallel — see loop above for full rationale.
            const galleryResults2 = await Promise.all(
                gallery.map(async (item) => {
                    if (item.file) {
                        try {
                            return await moderateAndUpload(item.file, 'business/gallery');
                        } catch {
                            return null;
                        }
                    }
                    if (item.url && !item.url.startsWith('blob:')) {
                        return item.url;
                    }
                    return null;
                })
            );
            for (const url of galleryResults2) {
                if (url) payload.gallery_json.push(url);
            }

            // Geocode address if provided
            const trimmedAddress = String(payload.address || '').trim();
            if (trimmedAddress) {
                const geoRateCheck = checkGeocodeRateLimit();
                if (geoRateCheck.allowed) {
                    const cityStr = String(payload.city || '').trim();
                    const fullAddress = cityStr
                        ? `${trimmedAddress}, ${cityStr}, AL`
                        : `${trimmedAddress}, Alabama`;
                    try {
                        const geoRes = await secureFetch(apiUrl('/api/geocode'), {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: fullAddress }),
                        });
                        const geoData = await geoRes.json();
                        if (geoRes.ok && geoData?.lat && geoData?.lng) {
                            const locType = String(geoData.location_type || '').toUpperCase();
                            if (locType !== 'APPROXIMATE' && locType !== 'GEOMETRIC_CENTER') {
                                recordGeocodeResult(true);
                                payload.latitude = geoData.lat;
                                payload.longitude = geoData.lng;
                            } else {
                                recordGeocodeResult(false);
                            }
                        } else {
                            recordGeocodeResult(false);
                        }
                    } catch {
                        recordGeocodeResult(false);
                        // Continue without geocoding
                    }
                }
                // If rate-limited, skip geocoding silently — use existing coords
            }

            // Step 1: Save all fields as draft first (save-draft handles extra JSON fields
            // like services_offered_json, owner_info_json, etc. that complete doesn't)
            await saveBusinessDraft(setupToken, payload);

            // Step 2: Now submit for review (sets status to pending_approval)
            await completeBusinessSetup(setupToken, payload);
            setSetupSubmitted(true);
            recordSubmitAction();

            // Flush pending GCS file deletions (best-effort)
            if (businessId) await flushPendingFileDeletes();

            showSaveSuccess('Your business has been submitted for review!');
            // Refresh the Header's account section so the pending business appears
            try { window.dispatchEvent(new CustomEvent('ll:business:accounts-updated')); } catch { /* ignore */ }
        } catch (err) {
            if (err.redirect_to) {
                navigate(err.redirect_to, { replace: true });
                return;
            }
            if (err.isModeration) {
                showPhotoError(err.message);
            } else if (err.data?.moderationReason && err.data?.field) {
                setProfanityFieldErrors({ [err.data.field]: err.message || 'This field contains inappropriate content.' });
                setShowValidation(true);
                setTimeout(() => {
                    const errEl = contentRef.current?.querySelector(`[data-profanity-field="${err.data.field}"], .Mui-error`);
                    if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
            } else if (err?.status === 429 && (err?.data?.pendingLimitReached || String(err.message).toLowerCase().includes('waiting for review'))) {
                // Handle pending review limit (max 5 out for review)
                setError(err.message || 'You already have 5 business pages waiting for review. Please wait for some to be reviewed before submitting more.');
                contentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
            } else {
                setError(err.message || 'Failed to submit for review.');
                contentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setSubmittingForReview(false);
        }
    };

    // Delete draft handler (setup mode)
    const handleDeleteDraft = async () => {
        if (!setupToken) return;
        setDeletingDraft(true);
        try {
            await deleteBusinessDraft(setupToken);
            navigate('/business', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to delete draft.');
        } finally {
            setDeletingDraft(false);
            setDeleteConfirmDialogOpen(false);
        }
    };

    // Load business data and require the matching active business account
    useEffect(() => {
        // In setup mode, business data is loaded via the setup initialization effect
        if (isSetupRoute || setupMode) return;

        let cancelled = false;
        async function loadBusiness() {
            if (!slug) {
                setError('Missing business identifier.');
                setBusinessLoading(false);
                return;
            }

            setBusinessLoading(true);
            setError('');

            try {
                const res = await fetchBusinessPublicBySlug(slug);
                if (cancelled) return;

                const biz = res?.business || res || null;
                setBusiness(biz);

                if (!biz?.id) {
                    navigate(`/${slug}`, { replace: true });
                    return;
                }

                const isActiveBusinessMatch =
                    Boolean(isBusinessAccount) &&
                    activeBusinessId != null &&
                    String(activeBusinessId) === String(biz.id);

                if (!isActiveBusinessMatch) {
                    setViewerRole(null);
                    setError('Switch to this business account to edit this business profile.');
                    return;
                }

                try {
                    const teamRes = await secureFetch(`/api/business/${biz.id}/team`, {
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    });

                    if (!teamRes.ok) {
                        setViewerRole(null);
                        setError('You do not have permission to access this page.');
                        return;
                    }

                    const data = await teamRes.json();
                    setViewerRole(data?.viewer_role || null);
                } catch {
                    if (!cancelled) {
                        setViewerRole(null);
                        setError('You do not have permission to access this page.');
                    }
                }
            } catch (err) {
                if (cancelled) return;
                setRawLoadError(err);
                setError(err?.message || 'Failed to load business.');
            } finally {
                if (!cancelled) setBusinessLoading(false);
            }
        }

        loadBusiness();
        return () => { cancelled = true; };
    }, [slug, navigate, isBusinessAccount, activeBusinessId, isSetupRoute, setupMode]);

    // Initialize info form when business changes
    useEffect(() => {
        if (business) {
            const hours = business.hours || (typeof business.hours_json === 'string' ? JSON.parse(business.hours_json) : business.hours_json) || {};
            const galleryRaw = business.gallery || (typeof business.gallery_json === 'string' ? JSON.parse(business.gallery_json) : business.gallery_json) || [];
            const normalizedGallery = (Array.isArray(galleryRaw) ? galleryRaw : []).map((item, idx) => {
                if (item && typeof item === 'object' && item.url) {
                    return { id: item.id || `existing-${idx}-${Date.now()}`, url: item.url };
                }
                if (typeof item === 'string' && item.trim()) {
                    return { id: `existing-${idx}-${Date.now()}`, url: item.trim() };
                }
                return null;
            }).filter(Boolean);

            setInfoForm({
                name: business.name || '',
                slug: business.slug || '',
                description: business.description || '',
                phone: business.phone || '',
                email_public: business.email_public || '',
                website_url: business.website_url || '',
                address: business.address || '',
                city: business.city || '',
                county: business.county || '',
                latitude: business.latitude || null,
                longitude: business.longitude || null,
                category_key: business.category_key || '',
                entity_type: business.entity_type || 'business',
                facebook_url: business.facebook_url || '',
                instagram_url: business.instagram_url || '',
                twitter_url: business.twitter_url || '',
                linkedin_url: business.linkedin_url || '',
                etsy_url: business.etsy_url || '',
                hours: hours,
                subtitle: business.subtitle || '',
                badge_text: business.badge_text || '',
                services_offered_json: (() => {
                    const raw = business.services_offered_json;
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
                    return [];
                })(),
                owner_info_json: (() => {
                    const raw = business.owner_info_json;
                    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') { try { return JSON.parse(raw) || {}; } catch { return {}; } }
                    return {};
                })(),
                highlight_sections_json: (() => {
                    const raw = business.highlight_sections_json;
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
                    return [];
                })(),
                category_data_json: (() => {
                    const raw = business.category_data_json;
                    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') { try { return JSON.parse(raw) || {}; } catch { return {}; } }
                    return {};
                })(),
            });
            // Initialize confirmed coordinates if business already has them
            if (business.latitude && business.longitude) {
                setConfirmedCoordinates({
                    lat: business.latitude,
                    lng: business.longitude,
                    formatted_address: business.address || '',
                });
            }
            setGallery(normalizedGallery);
            setInfoChanged(false);
        }
    }, [business]);

    // Auto-resolve lat/lng from local GeoJSON whenever city or county changes in the info form.
    // This ensures coordinates are always populated when a location is selected,
    // even without the user clicking "Get Map" (same pattern as events).
    useEffect(() => {
        const trimCity = String(infoForm.city || '').trim();
        const trimCounty = String(infoForm.county || '').trim();
        const hasCity = trimCity && trimCity !== 'All Cities';
        const hasCounty = trimCounty && trimCounty !== 'All Counties';

        if (!hasCity && !hasCounty) {
            // No location selected — clear auto-resolved coordinates
            if (!confirmedCoordinates) {
                setInfoForm((prev) => ({ ...prev, latitude: null, longitude: null }));
            }
            return;
        }

        // Only auto-resolve if the user has NOT manually confirmed a precise map pin
        // (i.e. don't overwrite a Google geocoded address-level pin)
        if (confirmedCoordinates) return;

        const coords = getCoordsFromLocalData(trimCity, trimCounty);
        if (coords) {
            setInfoForm((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
        } else {
            setInfoForm((prev) => ({ ...prev, latitude: null, longitude: null }));
        }
    }, [infoForm.city, infoForm.county]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadTeam = useCallback(async () => {
        if (!businessId) return;
        setTeamLoading(true);
        try {
            const data = await fetchBusinessTeam(businessId);
            setTeamData(data);
        } catch (err) {
            setError(err.message || 'Failed to load team.');
        } finally {
            setTeamLoading(false);
            setLoading(false);
        }
    }, [businessId]);

    const loadSettings = useCallback(async () => {
        if (!businessId) return;
        setSettingsLoading(true);
        try {
            const data = await fetchBusinessSettings(businessId);
            setSettings(data.settings);
        } catch {
            // keep silent
        } finally {
            setSettingsLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        if (businessId) {
            loadTeam();
            loadSettings();
        }
    }, [businessId, loadTeam, loadSettings]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [success]);

    const handleInfoChange = (field, value) => {
        setInfoForm((prev) => ({ ...prev, [field]: value }));
        setInfoChanged(true);
        if (field === 'address') {
            setAddressError('');
            // Address changed — clear any confirmed/pending pin so user must re-verify
            setConfirmedCoordinates(null);
            setPendingCoordinates(null);
            setGeocodeError('');
        }
    };

    const handleCategoryChange = (newCategory) => {
        const currentCategory = infoForm.category_key || '';
        if (newCategory === currentCategory) return;

        // Check if there's any category-related data that would be lost
        const catData = infoForm.category_data_json || {};
        const hasCatData = Object.keys(catData).some((k) => {
            const val = catData[k];
            if (Array.isArray(val)) return val.length > 0;
            return Boolean(val);
        });
        const hasServiceTags = Array.isArray(infoForm.services_offered_json) && infoForm.services_offered_json.length > 0;

        if (hasCatData || hasServiceTags) {
            setPendingCategoryChange({ newCategory });
        } else {
            // No data to lose — just switch
            setInfoForm((prev) => ({ ...prev, category_key: newCategory, category_data_json: {}, services_offered_json: [] }));
            setInfoChanged(true);
        }
    };

    const confirmCategoryChange = () => {
        if (!pendingCategoryChange) return;
        // Full reset: wipe ALL category_data_json and service tags
        setInfoForm((prev) => ({
            ...prev,
            category_key: pendingCategoryChange.newCategory,
            category_data_json: {},
            services_offered_json: [],
        }));
        setInfoChanged(true);
        setPendingCategoryChange(null);
    };

    const handleSaveInfo = async () => {
        // Check if anything actually changed
        const hasPhotoChanges = Boolean(avatarFile || coverFile || avatarRemoved || coverRemoved || hasGalleryChanges);
        if (!infoChanged && !hasPhotoChanges) {
            showSaveSuccess('No changes to save.');
            return;
        }

        // Client-side profanity check — all text fields
        const _pf2 = {
            name: String(infoForm.name || '').trim(),
            slug: String(infoForm.slug || '').trim(),
            description: String(infoForm.description || '').trim(),
        };
        const _oi2 = infoForm.owner_info_json || {};
        if (_oi2.section_title?.trim()) _pf2['owner section title'] = _oi2.section_title.trim();
        if (_oi2.name?.trim()) _pf2['owner name'] = _oi2.name.trim();
        if (_oi2.title?.trim()) _pf2['owner title'] = _oi2.title.trim();
        if (_oi2.about?.trim()) _pf2['owner bio'] = _oi2.about.trim();
        (Array.isArray(_oi2.additional_owners) ? _oi2.additional_owners : []).forEach((ao, i) => {
            if (ao?.name?.trim()) _pf2[`additional owner name`] = ao.name.trim();
            if (ao?.title?.trim()) _pf2[`additional owner title`] = ao.title.trim();
            if (ao?.about?.trim()) _pf2[`additional owner bio`] = ao.about.trim();
        });
        (Array.isArray(infoForm.highlight_sections_json) ? infoForm.highlight_sections_json : []).forEach((sec, i) => {
            if (sec?.title?.trim()) _pf2[`highlight section ${i + 1} title`] = sec.title.trim();
            const hlBody = (sec?.description || sec?.body || '').trim();
            if (hlBody) _pf2[`highlight section ${i + 1} description`] = hlBody;
        });
        const profanityResult = checkFieldsProfanity(_pf2);
        if (!profanityResult.clean) {
            const failedField = profanityResult.field || 'content';
            setProfanityFieldErrors({ [failedField]: `Your ${failedField} contains inappropriate language. Please revise.` });
            setShowValidation(true);
            // Force-open all collapsed FormSections so the flagged field is visible
            const allToggles = contentRef.current?.querySelectorAll('[data-form-section-toggle]');
            if (allToggles) {
                allToggles.forEach((toggle) => {
                    const isOpen = toggle.getAttribute('data-form-section-open') === 'true';
                    if (!isOpen) toggle.click();
                });
            }
            setTimeout(() => {
                const errEl = contentRef.current?.querySelector(`[data-profanity-field="${failedField}"], .Mui-error, [data-validation-error="true"]`);
                if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
        }
        // Clear any previous profanity errors if check passes
        setProfanityFieldErrors({});

        // Reserved username check (safety net at save)
        const slugForReservedCheck2 = String(infoForm.slug || '').trim();
        if (slugForReservedCheck2) {
            const reservedCheck2 = checkReservedUsername(slugForReservedCheck2);
            if (reservedCheck2.reserved) {
                setHandleError(reservedCheck2.message);
                setHandleAvailable(false);
                setProfanityFieldErrors({ slug: reservedCheck2.message });
                setShowValidation(true);
                return;
            }
        }

        // Validate required fields first
        const descTrimmed = String(infoForm.description || '').trim();
        const catKey = infoForm.category_key || '';
        const emailVal = String(infoForm.email_public || '').trim();
        const emailInvalid = emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        const cityMissing = !String(infoForm.city || '').trim();
        const countyMissing = !String(infoForm.county || '').trim();
        const hasValidationErrors = !descTrimmed || !catKey || emailInvalid || cityMissing || countyMissing;

        if (hasValidationErrors) {
            setShowValidation(true);
            // Force-open ALL collapsed FormSections so errors are visible
            const allToggles = contentRef.current?.querySelectorAll('[data-form-section-toggle]');
            if (allToggles) {
                allToggles.forEach((toggle) => {
                    const isOpen = toggle.getAttribute('data-form-section-open') === 'true';
                    if (!isOpen) toggle.click();
                });
            }
            // Wait for sections to open, then scroll to first error
            setTimeout(() => {
                const errEl = contentRef.current?.querySelector('.Mui-error, [data-validation-error="true"]');
                if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
        }

        setShowValidation(false);
        setInfoSaving(true);
        setError('');
        setAddressError('');

        try {
            const { name, ...profileData } = infoForm;

            // If an address was entered, geocode-validate it before saving
            const trimmedAddress = String(profileData.address || '').trim();
            if (trimmedAddress) {
                // If already confirmed, use confirmed coords
                if (confirmedCoordinates) {
                    profileData.latitude = confirmedCoordinates.lat;
                    profileData.longitude = confirmedCoordinates.lng;
                } else {
                    // Not yet validated — validate now on save
                    const geoRateCheck = checkGeocodeRateLimit();
                    if (!geoRateCheck.allowed) {
                        setAddressError(geoRateCheck.message);
                        setInfoSaving(false);
                        addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }

                    const cityStr = String(profileData.city || '').trim();
                    const fullAddress = cityStr
                        ? `${trimmedAddress}, ${cityStr}, AL`
                        : `${trimmedAddress}, Alabama`;

                    try {
                        const geoRes = await secureFetch(apiUrl('/api/geocode'), {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: fullAddress }),
                        });
                        const geoData = await geoRes.json();

                        if (!geoRes.ok || !geoData?.lat || !geoData?.lng) {
                            recordGeocodeResult(false);
                            setAddressError('This address could not be found. Please check it and try again.');
                            setInfoSaving(false);
                            addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        const locType = String(geoData.location_type || '').toUpperCase();
                        if (locType === 'APPROXIMATE' || locType === 'GEOMETRIC_CENTER') {
                            recordGeocodeResult(false);
                            setAddressError('This address could not be verified. Please enter a valid street address.');
                            setInfoSaving(false);
                            addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        const isStateFallback =
                            Math.abs(geoData.lat - 32.318) < 0.1 &&
                            Math.abs(geoData.lng - (-86.902)) < 0.1;
                        if (isStateFallback) {
                            recordGeocodeResult(false);
                            setAddressError('This address could not be found. Please check it and try again.');
                            setInfoSaving(false);
                            addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        // Address verified — use geocoded coordinates and confirm the pin
                        recordGeocodeResult(true);
                        profileData.latitude = geoData.lat;
                        profileData.longitude = geoData.lng;
                        setConfirmedCoordinates({
                            lat: geoData.lat,
                            lng: geoData.lng,
                            formatted_address: geoData.formatted_address || geoData.formatted || fullAddress,
                            precision: (geoData.location_type === 'ROOFTOP' || geoData.location_type === 'RANGE_INTERPOLATED') ? 'address' : 'city',
                        });
                    } catch {
                        recordGeocodeResult(false);
                        setAddressError('Failed to verify address. Please try again.');
                        setInfoSaving(false);
                        addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                }
            } else {
                // No address — use auto-resolved coords
                if (profileData.latitude != null && profileData.longitude != null) {
                    // Auto-resolved coordinates already in profileData
                } else {
                    profileData.latitude = null;
                    profileData.longitude = null;
                }
            }

            // ── Upload photos if any changed, merge into profileData ──
            if (avatarFile) {
                profileData.avatar_url = await uploadFileToGCS(avatarFile, 'business/avatars');
            } else if (avatarRemoved) {
                profileData.avatar_url = '';
            }
            if (coverFile) {
                profileData.cover_url = await uploadFileToGCS(coverFile, 'business/covers');
            } else if (coverRemoved) {
                profileData.cover_url = '';
            }

            // Track gallery photos that were removed (old URLs no longer in the list)
            const oldGallery = (() => {
                const raw = business?.gallery_json || business?.gallery;
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
                return [];
            })();

            // Gallery uploads run in parallel — see save-draft loop above
            // for the full rationale on why this is safe and why moderateAndUpload
            // stays (PhotosUploadSection doesn't pre-scan).
            const galleryUrls = (await Promise.all(
                gallery.map(async (item) => {
                    if (item.file) {
                        try {
                            return await moderateAndUpload(item.file, 'business/gallery');
                        } catch {
                            return null;
                        }
                    }
                    if (item.url && !item.url.startsWith('blob:')) {
                        return item.url;
                    }
                    return null;
                })
            )).filter(Boolean);
            profileData.gallery_json = galleryUrls;

            // Queue removed gallery photos for GCS deletion
            const removedGalleryUrls = oldGallery.filter((url) => url && typeof url === 'string' && !galleryUrls.includes(url));
            if (removedGalleryUrls.length > 0) {
                setPendingFileDeletes((prev) => [...prev, ...removedGalleryUrls]);
            }

            await updateBusinessProfile(businessId, profileData);

            // Flush pending GCS file deletions (best-effort, after successful save)
            await flushPendingFileDeletes();

            // Re-fetch business data so the page reflects saved changes
            // (especially important for avatar/cover removal)
            const savedSlug = String(profileData.slug || slug || '').trim();
            try {
                const freshRes = await fetchBusinessPublicBySlug(savedSlug);
                const freshBiz = freshRes?.business || freshRes || null;
                if (freshBiz) setBusiness(freshBiz);
            } catch { /* ignore — toast still shows success */ }

            // If slug changed, navigate to the new URL so the page stays in sync
            if (profileData.slug && profileData.slug !== slug) {
                navigate(`/${profileData.slug}/admin`, { replace: true });
            }

            // Update the header's cached account avatar so it reflects
            // avatar changes without needing a page reload
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (raw) {
                    const acct = JSON.parse(raw);
                    const newAvatarUrl = profileData.avatar_url !== undefined
                        ? (profileData.avatar_url || null)
                        : acct.avatar_url;
                    const updated = { ...acct, avatar_url: newAvatarUrl };
                    localStorage.setItem('ll:activeAccount', JSON.stringify(updated));
                    window.dispatchEvent(new CustomEvent('me:updated', { detail: updated }));
                }
            } catch { /* ignore */ }

            setAvatarFile(null);
            setCoverFile(null);
            setAvatarPreview(null);
            setCoverPreview(null);
            setAvatarRemoved(false);
            setCoverRemoved(false);
            showSaveSuccess('Business information saved successfully.');
            setInfoChanged(false);
        } catch (err) {
            if (err.isModeration) {
                // Photo moderation failure — show in snackbar, not top banner
                showPhotoError(err.message);
            } else if (err.data?.moderationReason && err.data?.field) {
                // Server-side text moderation — show inline on the offending field
                setProfanityFieldErrors({ [err.data.field]: err.message || 'This field contains inappropriate content.' });
                setShowValidation(true);
                setTimeout(() => {
                    const errEl = contentRef.current?.querySelector(`[data-profanity-field="${err.data.field}"], .Mui-error`);
                    if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
            } else {
                setError(err.message || 'Failed to save business information.');
                contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setInfoSaving(false);
        }
    };

    // Geocoding function - calls backend to get coordinates from Google API
    const handleGetMapPin = async () => {
        const address = infoForm.address?.trim();
        const city = infoForm.city?.trim();
        const county = infoForm.county?.trim();

        if (!address) {
            setGeocodeError('Please enter a street address first.');
            return;
        }
        if (!city && !county) {
            setGeocodeError('Please select a city and county first.');
            return;
        }

        // Persistent rate limit check (survives page refresh / navigation)
        const rateCheck = checkGeocodeRateLimit();
        if (!rateCheck.allowed) {
            setGeocodeError(rateCheck.message);
            return;
        }

        setGeocoding(true);
        setGeocodeError('');
        setAddressError('');
        setPendingCoordinates(null);

        // Helper to check if result is state-level fallback
        const isStateLevelResult = (lat, lng) =>
            Math.abs(lat - 32.318) < 0.1 && Math.abs(lng - (-86.902)) < 0.1;

        try {
            const fullAddress = city
                ? `${address}, ${city}, AL`
                : `${address}, Alabama`;

            const res = await secureFetch(apiUrl('/api/geocode'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: fullAddress }),
            });

            const data = await res.json();

            if (res.ok && data.lat && data.lng && !isStateLevelResult(data.lat, data.lng)) {
                const locType = String(data.location_type || '').toUpperCase();
                if (locType === 'APPROXIMATE' || locType === 'GEOMETRIC_CENTER') {
                    recordGeocodeResult(false);
                    setAddressError('This address could not be verified. Please enter a valid street address.');
                    setGeocoding(false);
                    addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                recordGeocodeResult(true);
                const isPrecise = data.location_type === 'ROOFTOP' || data.location_type === 'RANGE_INTERPOLATED';

                setPendingCoordinates({
                    lat: data.lat,
                    lng: data.lng,
                    formatted_address: data.formatted_address || data.formatted || fullAddress,
                    precision: isPrecise ? 'address' : 'city',
                });
                setGeocoding(false);
                return;
            }

            recordGeocodeResult(false);
            setAddressError('This address could not be found. Please check it and try again.');
            setGeocoding(false);
            addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
            recordGeocodeResult(false);
            setGeocodeError('Failed to verify address. Please try again.');
            setGeocoding(false);
        }
    };

    const handleConfirmMapPin = () => {
        if (pendingCoordinates) {
            setConfirmedCoordinates(pendingCoordinates);
            handleInfoChange('latitude', pendingCoordinates.lat);
            handleInfoChange('longitude', pendingCoordinates.lng);
            setPendingCoordinates(null);
            setSuccess('Map pin confirmed! Don\'t forget to save your changes.');
        }
    };

    const handleCancelMapPin = () => {
        setPendingCoordinates(null);
        setGeocodeError('');
    };

    const handleRemoveMapPin = () => {
        setConfirmedCoordinates(null);
        setPendingCoordinates(null);
        // Re-resolve auto coordinates from local GeoJSON since the manual pin was removed
        const trimCity = String(infoForm.city || '').trim();
        const trimCounty = String(infoForm.county || '').trim();
        const hasCity = trimCity && trimCity !== 'All Cities';
        const hasCounty = trimCounty && trimCounty !== 'All Counties';
        if (hasCity || hasCounty) {
            const coords = getCoordsFromLocalData(hasCity ? trimCity : '', hasCounty ? trimCounty : '');
            if (coords) {
                handleInfoChange('latitude', coords.lat);
                handleInfoChange('longitude', coords.lng);
                return;
            }
        }
        handleInfoChange('latitude', null);
        handleInfoChange('longitude', null);
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === 'image/gif') { showPhotoError('GIFs aren\u2019t supported for profile photos. Please upload a JPG, PNG, or WebP image.'); e.target.value = ''; return; }
        const imgError = validateImageFile(file);
        if (imgError) { setError(imgError); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropType('avatar');
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCoverSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === 'image/gif') { showPhotoError('GIFs aren\u2019t supported for cover photos. Please upload a JPG, PNG, or WebP image.'); e.target.value = ''; return; }
        const imgError = validateImageFile(file);
        if (imgError) { setError(imgError); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropType('cover');
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropComplete = async (croppedBlob) => {
        // Run NSFW moderation on the cropped image immediately
        const modResult = await moderateImageFile(croppedBlob);
        if (!modResult.safe) {
            showPhotoError(modResult.message || 'This image doesn’t meet our community guidelines.');
            setCropDialogOpen(false);
            setCropImageSrc(null);
            setCropType(null);
            return;
        }

        if (cropType === 'avatar') {
            // If replacing an existing avatar, queue the old one for deletion
            if (business?.avatar_url && !avatarRemoved) {
                setPendingFileDeletes((prev) => [...prev, business.avatar_url]);
            }
            setAvatarFile(croppedBlob);
            setAvatarPreview(URL.createObjectURL(croppedBlob));
            setAvatarRemoved(false);
            setInfoChanged(true);
        } else if (cropType === 'cover') {
            // If replacing an existing cover, queue the old one for deletion
            if (business?.cover_url && !coverRemoved) {
                setPendingFileDeletes((prev) => [...prev, business.cover_url]);
            }
            setCoverFile(croppedBlob);
            setCoverPreview(URL.createObjectURL(croppedBlob));
            setCoverRemoved(false);
            setInfoChanged(true);
        }
    };

    const handleRemoveAvatar = () => {
        if (business?.avatar_url) {
            setPendingFileDeletes((prev) => [...prev, business.avatar_url]);
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarRemoved(true);
        setInfoChanged(true);
    };

    const handleRemoveCover = () => {
        if (business?.cover_url) {
            setPendingFileDeletes((prev) => [...prev, business.cover_url]);
        }
        setCoverFile(null);
        setCoverPreview(null);
        setCoverRemoved(true);
        setInfoChanged(true);
    };

    /** Flush any queued GCS file deletions. Best-effort — don't block save on failure. */
    const flushPendingFileDeletes = async () => {
        if (pendingFileDeletes.length === 0 || !businessId) return;
        const urlsToDelete = [...pendingFileDeletes];
        setPendingFileDeletes([]);
        try {
            await deleteBusinessFiles(businessId, urlsToDelete);
        } catch (err) {
            console.warn('Failed to delete some files from storage:', err.message);
        }
    };

    const handleMemberMenuOpen = (e, member) => {
        setMemberMenuAnchor(e.currentTarget);
        setSelectedMember(member);
    };

    const handleMemberMenuClose = () => {
        setMemberMenuAnchor(null);
        setSelectedMember(null);
    };

    const handleChangeRole = async (newRole) => {
        if (!selectedMember) return;
        try {
            await changeTeamMemberRole(businessId, selectedMember.user_id, newRole);
            setSuccess(`Role changed to ${ROLE_LABELS[newRole]}.`);
            loadTeam();
        } catch (err) {
            setError(err.message || 'Failed to change role.');
        }
        handleMemberMenuClose();
    };

    const handleRemoveMember = async () => {
        if (!selectedMember) return;
        try {
            await removeTeamMember(businessId, selectedMember.user_id);
            setSuccess('Team member removed.');
            loadTeam();
        } catch (err) {
            setError(err.message || 'Failed to remove member.');
        }
        handleMemberMenuClose();
    };

    const handleCancelInvite = async (inviteId) => {
        try {
            await cancelTeamInvite(businessId, inviteId);
            setSuccess('Invite cancelled.');
            loadTeam();
        } catch (err) {
            setError(err.message || 'Failed to cancel invite.');
        }
    };

    const handleCopyInviteLink = async (inviteUrl, inviteId) => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopiedInviteId(inviteId);
            setTimeout(() => setCopiedInviteId(null), 2000);
        } catch {
            setError('Failed to copy link.');
        }
    };

    const handleLeaveTeam = async () => {
        try {
            await leaveBusinessTeam(businessId);
            navigate('/pages');
        } catch (err) {
            setError(err.message || 'Failed to leave team.');
        }
    };

    const handleSettingChange = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setSavingSettings(true);
        try {
            await updateBusinessSettings(businessId, newSettings);
        } catch (err) {
            setError(err.message || 'Failed to save setting.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDeactivate = async () => {
        setDangerLoading(true);
        try {
            await deactivateBusiness(businessId);
            setSuccess('Business deactivated.');
            const res = await fetchBusinessPublicBySlug(slug);
            setBusiness(res?.business || res || null);
        } catch (err) {
            setError(err.message || 'Failed to deactivate.');
        } finally {
            setDangerLoading(false);
        }
    };

    const handleReactivate = async () => {
        setDangerLoading(true);
        try {
            await reactivateBusiness(businessId);
            setSuccess('Business reactivated.');
            const res = await fetchBusinessPublicBySlug(slug);
            setBusiness(res?.business || res || null);
        } catch (err) {
            setError(err.message || 'Failed to reactivate.');
        } finally {
            setDangerLoading(false);
        }
    };

    const handleDeletePermanently = async () => {
        if (deleteConfirmName !== businessName) {
            setError('Please type the exact business name to confirm.');
            return;
        }
        setDangerLoading(true);
        try {
            await deleteBusinessPermanently(businessId);
            navigate('/pages');
        } catch (err) {
            setError(err.message || 'Failed to delete business.');
        } finally {
            setDangerLoading(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!transferTargetId) return;
        setDangerLoading(true);
        try {
            await transferBusinessOwnership(businessId, transferTargetId);
            setSuccess('Ownership transferred successfully.');
            setTransferDialogOpen(false);
            setTransferTargetId('');
            loadTeam();
            const teamRes = await secureFetch(`/api/business/${businessId}/team`, {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            if (teamRes.ok) {
                const data = await teamRes.json();
                setViewerRole(data.viewer_role);
            }
        } catch (err) {
            setError(err.message || 'Failed to transfer ownership.');
        } finally {
            setDangerLoading(false);
        }
    };

    const handleOpenNameChangeDialog = () => {
        setRequestedName('');
        setNameChangeReason('');
        setNameChangeSuccess(false);
        setNameChangeDialogOpen(true);
    };

    const handleCloseNameChangeDialog = () => {
        setNameChangeDialogOpen(false);
        setRequestedName('');
        setNameChangeReason('');
        setNameChangeSuccess(false);
    };

    const handleNameChangeSubmit = async () => {
        if (!requestedName.trim()) return;
        setNameChangeSubmitting(true);
        try {
            await requestPublishedBusinessNameChange(businessId, requestedName.trim(), nameChangeReason.trim());
            setNameChangeSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to submit name change request.');
        } finally {
            setNameChangeSubmitting(false);
        }
    };

    const handleUserCardOpen = (e, member) => {
        setUserCardAnchor(e.currentTarget);
        setUserCardMember(member);
    };

    const handleUserCardClose = () => {
        setUserCardAnchor(null);
        setUserCardMember(null);
    };

    // Save toast
    const { showSuccess: showSaveSuccess, snackbarProps: saveSnackbarProps } = useSuccessSnackbar();

    // Photo moderation error snackbar (separate from save success toast)
    const [photoModerationError, setPhotoModerationError] = useState('');
    const showPhotoError = useCallback((msg) => setPhotoModerationError(msg), []);
    const clearPhotoError = useCallback(() => setPhotoModerationError(''), []);

    // Pro billing toggle
    const [billingInterval, setBillingInterval] = useState('yearly');

    const handleBack = () => {
        if (setupMode) {
            navigate('/business');
        } else {
            navigate(`/${slug}`);
        }
    };

    // ============================================================================
    // Render: Pro Tab
    // ============================================================================
    const BUSINESS_PRICING = {
        pro: { monthly: 19, yearly: 189, yearlySavings: 17 },
        pro_plus: { monthly: 39, yearly: 389, yearlySavings: 17 },
    };

    const renderPro = () => {
        const tier = business?.premium_tier || business?.premiumTier || 'free';
        const isPro = tier === 'pro' || tier === 'pro_plus';
        const isProPlus = tier === 'pro_plus';
        const isYearly = billingInterval === 'yearly';
        const proPrice = isYearly ? BUSINESS_PRICING.pro.yearly : BUSINESS_PRICING.pro.monthly;
        const proPlusPrice = isYearly ? BUSINESS_PRICING.pro_plus.yearly : BUSINESS_PRICING.pro_plus.monthly;
        const proLabel = isYearly ? '/yr' : '/mo';

        const features = [
            {
                name: 'Team Members',
                free: 'Owner only',
                pro: 'Up to 5 members',
                pro_plus: 'Up to 15 members',
                icon: <TeamIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Photo Gallery',
                free: 'Up to 5 photos',
                pro: 'Up to 25 photos',
                pro_plus: 'Unlimited photos',
                icon: <PhotoIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Analytics & Insights',
                free: 'Basic view count',
                pro: 'Detailed visitor analytics',
                pro_plus: 'Full analytics + demographics',
                icon: <BarChartIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Priority Placement',
                free: 'Standard listing',
                pro: 'Boosted in search results',
                pro_plus: 'Top placement',
                icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Promotions & Posts',
                free: '2 posts / month',
                pro: 'Up to 20 posts / month',
                pro_plus: 'Unlimited posts',
                icon: <CampaignIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Verified Badge',
                free: 'Not available',
                pro: 'Apply for verification',
                pro_plus: 'Priority verification',
                icon: <VerifiedIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Customer Messages',
                free: '15 messages / month',
                pro: 'Up to 200 / month',
                pro_plus: 'Unlimited messages',
                icon: <ChatIcon sx={{ fontSize: 20 }} />,
            },
            {
                name: 'Support',
                free: 'Help Center',
                pro: 'Email support',
                pro_plus: 'Priority support + onboarding',
                icon: <SupportAgentIcon sx={{ fontSize: 20 }} />,
            },
        ];

        return (
            <Box sx={{ maxWidth: 900 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 0.5 }}>
                        Business Pro
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                        Upgrade your business listing to reach more customers and unlock powerful tools.
                    </Typography>
                </Box>

                {/* Current plan badge */}
                {isPro && (
                    <Alert
                        severity="success"
                        icon={<WorkspacePremiumIcon />}
                        sx={{ mb: 3, fontWeight: 700, borderRadius: 2 }}
                    >
                        You&apos;re currently on the <strong>{isProPlus ? 'Pro+' : 'Pro'}</strong> plan.
                    </Alert>
                )}

                {/* Billing toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            bgcolor: 'background.paper',
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 0.5,
                        }}
                    >
                        <ButtonBase
                            onClick={() => setBillingInterval('monthly')}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: 13,
                                bgcolor: !isYearly ? 'primary.main' : 'transparent',
                                color: !isYearly ? 'common.white' : 'text.secondary',
                                transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: !isYearly ? 'primary.main' : 'action.hover' },
                            }}
                        >
                            Monthly
                        </ButtonBase>
                        <ButtonBase
                            onClick={() => setBillingInterval('yearly')}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: 13,
                                bgcolor: isYearly ? 'primary.main' : 'transparent',
                                color: isYearly ? 'common.white' : 'text.secondary',
                                transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: isYearly ? 'primary.main' : 'action.hover' },
                            }}
                        >
                            Yearly
                            <Chip
                                label={`Save ${BUSINESS_PRICING.pro.yearlySavings}%`}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ ml: 1, height: 22, fontSize: 11, fontWeight: 800, pointerEvents: 'none', borderWidth: 1.5 }}
                            />
                        </ButtonBase>
                    </Box>
                </Box>

                {/* Plan cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 2.5,
                        mb: 4,
                    }}
                >
                    {/* Free */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, sm: 3 },
                            borderRadius: 3,
                            borderColor: tier === 'free' ? 'primary.main' : 'divider',
                            borderWidth: tier === 'free' ? 2 : 1,
                            position: 'relative',
                        }}
                    >
                        {tier === 'free' && (
                            <Chip label="Current" size="small" color="primary" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, fontSize: 11 }} />
                        )}
                        <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Free</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: 32, mb: 0.5 }}>
                            $0
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2.5 }}>Forever free</Typography>
                        <Stack spacing={1.5}>
                            {features.map((f) => (
                                <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{f.name}</Typography>
                                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{f.free}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Pro */}
                    <Paper
                        elevation={tier === 'pro' ? 4 : 2}
                        variant={tier === 'pro' ? 'elevation' : 'outlined'}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: tier === 'pro' ? 'primary.main' : 'primary.main',
                            position: 'relative',
                        }}
                    >
                        {tier === 'pro' && (
                            <Chip label="Current" size="small" color="primary" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, fontSize: 11 }} />
                        )}
                        <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Pro</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 32 }}>${proPrice}</Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>{proLabel}</Typography>
                        </Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2.5 }}>
                            {isYearly
                                ? `$${(BUSINESS_PRICING.pro.yearly / 12).toFixed(2)}/mo — save $${(BUSINESS_PRICING.pro.monthly * 12 - BUSINESS_PRICING.pro.yearly)}/yr`
                                : `$${BUSINESS_PRICING.pro.yearly}/yr if billed annually`}
                        </Typography>
                        <Stack spacing={1.5}>
                            {features.map((f) => (
                                <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{f.name}</Typography>
                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>{f.pro}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                        {tier === 'free' && (
                            <Button variant="contained" fullWidth sx={{ mt: 3, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                                Upgrade to Pro
                            </Button>
                        )}
                        {tier === 'pro' && (
                            <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 3, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                                Cancel Subscription
                            </Button>
                        )}
                    </Paper>

                    {/* Pro+ */}
                    <Paper
                        elevation={isProPlus ? 4 : 0}
                        variant={isProPlus ? 'elevation' : 'outlined'}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            borderRadius: 3,
                            borderColor: isProPlus ? 'warning.main' : 'divider',
                            borderWidth: isProPlus ? 2 : 1,
                            position: 'relative',
                        }}
                    >
                        {isProPlus && (
                            <Chip label="Current" size="small" color="warning" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, fontSize: 11 }} />
                        )}
                        <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 0.5 }}>Pro+</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 32 }}>${proPlusPrice}</Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>{proLabel}</Typography>
                        </Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2.5 }}>
                            {isYearly
                                ? `$${(BUSINESS_PRICING.pro_plus.yearly / 12).toFixed(2)}/mo — save $${(BUSINESS_PRICING.pro_plus.monthly * 12 - BUSINESS_PRICING.pro_plus.yearly)}/yr`
                                : `$${BUSINESS_PRICING.pro_plus.yearly}/yr if billed annually`}
                        </Typography>
                        <Stack spacing={1.5}>
                            {features.map((f) => (
                                <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{f.name}</Typography>
                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>{f.pro_plus}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                        {(tier === 'free' || tier === 'pro') && (
                            <Button variant="contained" color="warning" fullWidth sx={{ mt: 3, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                                {tier === 'pro' ? 'Upgrade to Pro+' : 'Upgrade to Pro+'}
                            </Button>
                        )}
                        {isProPlus && (
                            <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 3, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                                Cancel Subscription
                            </Button>
                        )}
                    </Paper>
                </Box>

                {/* Feature comparison */}
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Feature Comparison</Typography>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { px: 2, py: 1.5, fontSize: 13, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' }, '& th': { fontWeight: 800, bgcolor: 'grey.50' } }}>
                            <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Free</th>
                                <th>Pro</th>
                                <th>Pro+</th>
                            </tr>
                            </thead>
                            <tbody>
                            {features.map((f) => (
                                <tr key={f.name}>
                                    <td style={{ fontWeight: 700 }}>{f.name}</td>
                                    <td>{f.free}</td>
                                    <td style={{ fontWeight: 600 }}>{f.pro}</td>
                                    <td style={{ fontWeight: 700 }}>{f.pro_plus}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    };

    // ============================================================================
    // Render Functions
    // ============================================================================

    // ── Spotlight Photo Upload Handlers ──
    const handleOwnerPhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (file.type === 'image/gif') { showPhotoError('GIFs aren\u2019t supported for profile photos. Please upload a JPG, PNG, or WebP image.'); return; }
        const imgError = validateImageFile(file);
        if (imgError) { showPhotoError(imgError); return; }
        setUploadingOwnerPhoto(true);
        try {
            const prev = infoForm.owner_info_json || {};
            // Queue old photo for deletion if replacing
            if (prev.avatar_url) setPendingFileDeletes((p) => [...p, prev.avatar_url]);
            const url = await moderateAndUpload(file, 'business/owners');
            handleInfoChange('owner_info_json', { ...prev, avatar_url: url });
        }
        catch (err) {
            if (err.isModeration) showPhotoError(err.message);
            else showPhotoError(err.message || 'Failed to upload owner photo.');
        }
        finally { setUploadingOwnerPhoto(false); }
    };
    const handleAdditionalOwnerPhotoUpload = async (e, idx) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (file.type === 'image/gif') { showPhotoError('GIFs aren\u2019t supported for profile photos. Please upload a JPG, PNG, or WebP image.'); return; }
        const imgError = validateImageFile(file);
        if (imgError) { showPhotoError(imgError); return; }
        setUploadingAdditionalOwnerPhoto(idx);
        try {
            const prev = infoForm.owner_info_json || {};
            const owners = Array.isArray(prev.additional_owners) ? [...prev.additional_owners] : [];
            // Queue old photo for deletion if replacing
            if (owners[idx]?.avatar_url) setPendingFileDeletes((p) => [...p, owners[idx].avatar_url]);
            const url = await moderateAndUpload(file, 'business/owners');
            if (owners[idx]) { owners[idx] = { ...owners[idx], avatar_url: url }; handleInfoChange('owner_info_json', { ...prev, additional_owners: owners }); }
        } catch (err) {
            if (err.isModeration) showPhotoError(err.message);
            else showPhotoError(err.message || 'Failed to upload photo.');
        }
        finally { setUploadingAdditionalOwnerPhoto(-1); }
    };
    const handleHighlightPhotoUpload = (e, idx) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (file.type === 'image/gif') { showPhotoError('GIFs aren\u2019t supported. Please upload a JPG, PNG, or WebP image.'); return; }
        const imgError = validateImageFile(file);
        if (imgError) { showPhotoError(imgError); return; }
        const reader = new FileReader();
        reader.onload = () => {
            setHlCropSrc(reader.result);
            setHlCropIdx(idx);
            setHlCropOpen(true);
        };
        reader.readAsDataURL(file);
    };
    const handleHlCropComplete = async (croppedBlob) => {
        const idx = hlCropIdx;
        if (idx < 0) return;
        setUploadingHighlightPhoto(idx);
        try {
            const croppedFile = new File([croppedBlob], `highlight_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const sections = Array.isArray(infoForm.highlight_sections_json) ? [...infoForm.highlight_sections_json] : [];
            // Queue old photo for deletion if replacing
            if (sections[idx]?.photo_url) setPendingFileDeletes((p) => [...p, sections[idx].photo_url]);
            const url = await moderateAndUpload(croppedFile, 'business/highlights');
            if (sections[idx]) { sections[idx] = { ...sections[idx], photo_url: url }; handleInfoChange('highlight_sections_json', sections); }
        } catch (err) {
            if (err.isModeration) showPhotoError(err.message);
            else showPhotoError(err.message || 'Failed to upload highlight photo.');
        }
        finally { setUploadingHighlightPhoto(-1); }
    };
    const updateOwnerField = (field, value) => { const prev = infoForm.owner_info_json || {}; handleInfoChange('owner_info_json', { ...prev, [field]: value }); };
    const updateAdditionalOwner = (idx, field, value) => {
        const prev = infoForm.owner_info_json || {};
        const owners = Array.isArray(prev.additional_owners) ? [...prev.additional_owners] : [];
        if (owners[idx]) { owners[idx] = { ...owners[idx], [field]: value }; handleInfoChange('owner_info_json', { ...prev, additional_owners: owners }); }
    };
    const addAdditionalOwner = () => {
        const prev = infoForm.owner_info_json || {};
        const owners = Array.isArray(prev.additional_owners) ? [...prev.additional_owners] : [];
        owners.push({ name: '', title: '', about: '', avatar_url: '' });
        handleInfoChange('owner_info_json', { ...prev, additional_owners: owners });
    };
    const removeAdditionalOwner = (idx) => {
        const prev = infoForm.owner_info_json || {};
        const owners = Array.isArray(prev.additional_owners) ? [...prev.additional_owners] : [];
        // Queue avatar photo for GCS deletion if it exists
        if (owners[idx]?.avatar_url) {
            setPendingFileDeletes((p) => [...p, owners[idx].avatar_url]);
        }
        owners.splice(idx, 1);
        handleInfoChange('owner_info_json', { ...prev, additional_owners: owners });
    };
    const updateHighlightField = (idx, field, value) => {
        const sections = Array.isArray(infoForm.highlight_sections_json) ? [...infoForm.highlight_sections_json] : [];
        if (sections[idx]) { sections[idx] = { ...sections[idx], [field]: value }; handleInfoChange('highlight_sections_json', sections); }
    };
    const addHighlightSection = () => {
        const sections = Array.isArray(infoForm.highlight_sections_json) ? [...infoForm.highlight_sections_json] : [];
        sections.push({ icon: 'Star', title: '', body: '', photo_url: '' });
        handleInfoChange('highlight_sections_json', sections);
    };
    const removeHighlightSection = (idx) => {
        const sections = Array.isArray(infoForm.highlight_sections_json) ? [...infoForm.highlight_sections_json] : [];
        // Queue highlight photo for GCS deletion if it exists
        if (sections[idx]?.photo_url) {
            setPendingFileDeletes((p) => [...p, sections[idx].photo_url]);
        }
        sections.splice(idx, 1);
        handleInfoChange('highlight_sections_json', sections);
    };
    const addServiceTag = () => {
        const trimmed = serviceInput.trim();
        if (!trimmed) return;
        const current = Array.isArray(infoForm.services_offered_json) ? infoForm.services_offered_json : [];
        if (current.includes(trimmed)) { setServiceInput(''); return; }
        handleInfoChange('services_offered_json', [...current, trimmed]);
        setServiceInput('');
    };
    const removeServiceTag = (tag) => {
        const current = Array.isArray(infoForm.services_offered_json) ? infoForm.services_offered_json : [];
        handleInfoChange('services_offered_json', current.filter((t) => t !== tag));
    };

    const renderDashboard = () => (
        <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <SectionHeader icon={<DashboardIcon />} title="Quick Stats" />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Paper sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, bgcolor: 'primary.50', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} color="primary.main">{teamData?.members?.length || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Team Members</Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} color="success.main">{business?.follower_count || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Followers</Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, bgcolor: 'warning.50', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} color="warning.main">{business?.post_count || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Posts</Typography>
                    </Paper>
                </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <SectionHeader
                    icon={<TeamIcon />}
                    title="Team Overview"
                    action={isAdmin && (
                        <Button variant="contained" size="small" startIcon={<InviteIcon />} onClick={() => setInviteModalOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Invite
                        </Button>
                    )}
                />
                {teamLoading ? (
                    <Box sx={{ py: 2 }}>
                        {[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={60} sx={{ mb: 1 }} />)}
                    </Box>
                ) : (
                    <List disablePadding>
                        {(teamData?.members || []).slice(0, 5).map((member) => (
                            <ListItem key={member.user_id} sx={{ px: 0 }}>
                                <ListItemAvatar>
                                    <Avatar src={member.user?.avatar_url || member.avatar_url || defaultAvatar} onClick={(e) => handleUserCardOpen(e, member)} sx={{ cursor: 'pointer' }}>
                                        {member.user?.first_name?.[0] || member.first_name?.[0] || '?'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography fontWeight={700}>{member.user?.first_name || member.first_name} {member.user?.last_name || member.last_name}</Typography>}
                                    secondary={member.user?.handle || member.handle ? `@${member.user?.handle || member.handle}` : null}
                                />
                                <RoleChip role={member.role} />
                            </ListItem>
                        ))}
                    </List>
                )}
                {(teamData?.members?.length || 0) > 5 && (
                    <Button fullWidth onClick={() => setActiveTab(TABS.TEAM)} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
                        View All {teamData.members.length} Members
                    </Button>
                )}
            </Paper>
        </Stack>
    );

    // Validation flags for forceOpen
    const basicsHasErrors = showValidation && (!String(infoForm.description || '').trim() || !infoForm.category_key);

    const renderInformation = () => (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 2 }, alignItems: { md: 'flex-start' }, mt: 0 }}>
            {/* ══ LEFT: FORM ══ */}
            <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 0%' }, minWidth: 0, maxWidth: { md: '62%' }, width: { xs: '100%' } }}>
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        px: { xs: 2, md: 2.5 },
                        py: 1.25,
                        bgcolor: 'background.paper',
                        borderRadius: '10px 10px 0 0',
                        boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.06)}`,
                        display: { xs: 'none', md: 'flex' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <ButtonBase
                            onClick={handleBack}
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                border: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </ButtonBase>
                        <BusinessIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: 16, md: 18 } }}>
                            {setupMode ? 'Setup Business' : 'Edit Profile'}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        {setupMode ? (
                            <>
                                <Button
                                    onClick={() => setDeleteConfirmDialogOpen(true)}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: 'error.main',
                                    }}
                                    disabled={draftSaving || submittingForReview || setupSubmitted}
                                >
                                    Delete Draft
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleSaveDraft}
                                    disabled={draftSaving || submittingForReview || setupSubmitted}
                                    startIcon={draftSaving ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 2.5 }}
                                >
                                    {draftSaving ? 'Saving...' : 'Save Draft'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmitForReview}
                                    disabled={submittingForReview || draftSaving || setupSubmitted}
                                    startIcon={submittingForReview ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 3 }}
                                >
                                    {setupSubmitted ? 'Submitted!' : submittingForReview ? 'Submitting...' : 'Submit for Review'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleBack}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: 'text.secondary',
                                    }}
                                    disabled={infoSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSaveInfo}
                                    disabled={infoSaving}
                                    startIcon={infoSaving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 3 }}
                                >
                                    {infoSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>

                <Box
                    sx={{
                        p: { xs: 2, md: 3 },
                        pt: { xs: 1, md: 3 },
                        bgcolor: 'background.paper',
                        borderRadius: { xs: 0, md: '0 0 10px 10px' },
                    }}
                >
                    {/* ── 1. PROFILE & COVER PHOTO (moved to top) ── */}
                    <FormSection title="Profile & Cover Photo" icon={PhotoIcon} defaultOpen>
                        <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Cover Photo</Typography>
                            <Box sx={{ position: 'relative', width: '100%', paddingTop: `${100 / COVER_ASPECT}%`, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
                                {displayCoverSrc && <Box component="img" src={displayCoverSrc} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap', p: 1 }}>
                                    <Button variant="contained" startIcon={<UploadIcon />} onClick={() => coverInputRef.current?.click()} sx={{ textTransform: 'none', fontWeight: 600, fontSize: { xs: 11, md: 12 }, bgcolor: (t) => alpha(t.palette.common.black, 0.60), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.80) }, minWidth: 0, px: { xs: 1.5, md: 2 } }}>
                                        {displayCoverSrc ? 'Change Cover' : 'Upload Cover'}
                                    </Button>
                                    {displayCoverSrc && (
                                        <Button variant="contained" startIcon={<DeleteIcon />} onClick={handleRemoveCover} sx={{ textTransform: 'none', fontWeight: 600, fontSize: { xs: 11, md: 12 }, bgcolor: (t) => alpha(t.palette.error.main, 0.85), '&:hover': { bgcolor: 'error.dark' }, minWidth: 0, px: { xs: 1.5, md: 2 } }}>
                                            Remove
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                            <input type="file" ref={coverInputRef} onChange={handleCoverSelect} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Profile Photo</Typography>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap', gap: { xs: 1.5, md: 2 } }}>
                                <Avatar src={displayAvatarSrc || undefined} sx={{ width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main', border: '2px solid', borderColor: hasCustomAvatar ? 'divider' : 'primary.light' }} imgProps={{ style: { objectFit: 'cover' } }}>
                                    <StorefrontIcon sx={{ fontSize: { xs: 28, md: 36 } }} />
                                </Avatar>
                                <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => avatarInputRef.current?.click()} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12 }}>
                                    Change Photo
                                </Button>
                                {hasCustomAvatar ? (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteOutlineIcon />}
                                        onClick={handleRemoveAvatar}
                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12 }}
                                    >
                                        Remove
                                    </Button>
                                ) : null}
                                <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />
                            </Stack>
                        </Box>
                    </FormSection>

                    {/* ── 2. BASIC INFORMATION ── */}
                    <FormSection title="Basic Information" forceOpen={basicsHasErrors} defaultOpen>
                        <Box>
                            {setupMode ? (
                                <>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Business Name</Typography>
                                    <TextField
                                        fullWidth
                                        value={infoForm.name || ''}
                                        onChange={(e) => { handleInfoChange('name', e.target.value); if (profanityFieldErrors.name) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }}
                                        size="small"
                                        required
                                        error={(showValidation && !String(infoForm.name || '').trim()) || Boolean(profanityFieldErrors.name)}
                                        helperText={profanityFieldErrors.name || (showValidation && !String(infoForm.name || '').trim() ? 'Business name is required.' : '')}
                                        inputProps={{ autoComplete: 'new-password' }}
                                        data-profanity-field="name"
                                    />
                                </>
                            ) : (
                                <>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>Business Name</Typography>
                                        <Chip label="Requires Approval" size="small" color="warning" />
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                                        <TextField fullWidth value={infoForm.name || ''} disabled size="small" />
                                        <Button variant="outlined" size="small" onClick={handleOpenNameChangeDialog} sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }}>Request Name Change</Button>
                                    </Stack>
                                </>
                            )}
                        </Box>
                        {setupMode && (
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Handle</Typography>
                                <TextField
                                    fullWidth
                                    value={infoForm.slug || ''}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    size="small"
                                    required
                                    error={Boolean(handleError) || (showValidation && !String(infoForm.slug || '').trim())}
                                    helperText={
                                        handleError
                                            ? handleError
                                            : showValidation && !String(infoForm.slug || '').trim()
                                                ? 'Handle is required.'
                                                : handleAvailable === true && (infoForm.slug || '').length >= 3
                                                    ? 'This handle is available!'
                                                    : `locallantern.com/${infoForm.slug || 'your_business'}`
                                    }
                                    FormHelperTextProps={{
                                        sx: {
                                            color: handleError ? 'error.main'
                                                : handleAvailable === true && (infoForm.slug || '').length >= 3 ? 'success.main'
                                                    : undefined,
                                            fontWeight: (handleAvailable === true || handleError) ? 700 : undefined,
                                        },
                                    }}
                                    inputProps={{ autoComplete: 'new-password', maxLength: 30 }}
                                    placeholder="your_business_name"
                                    data-profanity-field="slug"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 600 }}>@</Typography></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {handleChecking && <CircularProgress size={16} />}
                                                {!handleChecking && handleAvailable === true && (infoForm.slug || '').length >= 3 && (
                                                    <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                )}
                                                {!handleChecking && handleAvailable === false && (
                                                    <WarningIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                                )}
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                        )}
                        {!setupMode && (
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Handle</Typography>
                                <TextField
                                    fullWidth
                                    value={infoForm.slug || ''}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    size="small"
                                    disabled={handleBlocked}
                                    error={Boolean(handleError)}
                                    helperText={
                                        handleError
                                            ? handleError
                                            : handleBlocked
                                                ? `You can change your handle again in ${daysUntilNextHandleChange} day${daysUntilNextHandleChange === 1 ? '' : 's'}.`
                                                : handleAvailable === true && (infoForm.slug || '').length >= 3
                                                    ? 'This handle is available!'
                                                    : '3–30 chars: lowercase letters, numbers, and underscores only.'
                                    }
                                    FormHelperTextProps={{
                                        sx: {
                                            color: handleError ? 'error.main'
                                                : handleAvailable === true && (infoForm.slug || '').length >= 3 ? 'success.main'
                                                    : undefined,
                                            fontWeight: (handleAvailable === true || handleError || handleBlocked) ? 700 : undefined,
                                        },
                                    }}
                                    inputProps={{ autoComplete: 'new-password', maxLength: 30 }}
                                    placeholder="your_business_name"
                                    data-profanity-field="slug"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 600 }}>@</Typography></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {handleChecking && <CircularProgress size={16} />}
                                                {!handleChecking && handleAvailable === true && (infoForm.slug || '').length >= 3 && (
                                                    <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                )}
                                                {!handleChecking && handleAvailable === false && (
                                                    <WarningIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                                )}
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <FormControl fullWidth size="small" required error={showValidation && !infoForm.category_key} data-validation-error={showValidation && !infoForm.category_key ? 'true' : undefined}>
                                <InputLabel>Category</InputLabel>
                                <Select value={infoForm.category_key || ''} label="Category" onChange={(e) => handleCategoryChange(e.target.value)}
                                        renderValue={(selected) => { if (!selected) return ''; const cat = CATEGORY_OPTIONS.find((c) => c.value === selected); const IconComp = BUSINESS_CATEGORY_ICON[selected] || CategoryIcon; return (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconComp fontSize="small" sx={{ color: 'primary.main' }} /><span>{cat?.label || selected}</span></Box>); }}>
                                    {CATEGORY_OPTIONS.map((cat) => { const IconComp = BUSINESS_CATEGORY_ICON[cat.value] || CategoryIcon; return (<MenuItem key={cat.value} value={cat.value}><ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}><IconComp fontSize="small" /></ListItemIcon><ListItemText primary={cat.label} /></MenuItem>); })}
                                </Select>
                                {showValidation && !infoForm.category_key && <Typography sx={{ color: 'error.main', fontSize: 12, mt: 0.5, ml: 1.75 }}>Category is required.</Typography>}
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    value={infoForm.entity_type || 'business'}
                                    label="Entity Type"
                                    onChange={(e) => handleInfoChange('entity_type', e.target.value)}
                                    renderValue={(selected) => {
                                        const opt = ENTITY_TYPE_OPTIONS.find((o) => o.value === selected);
                                        if (!opt) return selected;
                                        const IconComp = opt.icon;
                                        return (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconComp fontSize="small" sx={{ color: 'primary.main' }} /><span>{opt.label}</span></Box>);
                                    }}
                                >
                                    {ENTITY_TYPE_OPTIONS.map((opt) => {
                                        const IconComp = opt.icon;
                                        return (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}><IconComp fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={opt.label} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Stack>
                        <TextField label="Description" value={infoForm.description || ''} onChange={(e) => { handleInfoChange('description', e.target.value.slice(0, 700)); if (profanityFieldErrors.description) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next.description; return next; }); }} multiline minRows={4} maxRows={10} fullWidth required error={(showValidation && !String(infoForm.description || '').trim()) || Boolean(profanityFieldErrors.description)} inputProps={{ autoComplete: 'new-password', maxLength: 700 }} helperText={profanityFieldErrors.description || (showValidation && !String(infoForm.description || '').trim() ? 'Description is required.' : `${(infoForm.description || '').length}/700`)} data-profanity-field="description" />
                    </FormSection>

                    {/* ── 3. CONTACT INFORMATION ── */}
                    <FormSection title="Contact Information" defaultOpen>
                        <TextField label="Phone" value={infoForm.phone || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); let formatted = digits; if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`; else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`; else if (digits.length > 0) formatted = `(${digits}`; handleInfoChange('phone', formatted); }} fullWidth size="small" inputProps={{ autoComplete: 'new-password', maxLength: 14 }} helperText={`${(infoForm.phone || '').replace(/\D/g, '').length}/10 digits`} placeholder="(256) 689-6557" InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} />
                        <TextField label="Public Email" value={infoForm.email_public || ''} onChange={(e) => handleInfoChange('email_public', e.target.value.slice(0, 255))} fullWidth size="small" inputProps={{ autoComplete: 'new-password', maxLength: 255 }} error={Boolean(infoForm.email_public) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email_public)} helperText={Boolean(infoForm.email_public) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email_public) ? 'Please enter a valid email address' : `${(infoForm.email_public || '').length}/255`} placeholder="contact@business.com" InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }} data-validation-error={Boolean(infoForm.email_public) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email_public) ? 'true' : undefined} />
                        <TextField label="Website" value={infoForm.website_url || ''} onChange={(e) => handleInfoChange('website_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="https://yourwebsite.com" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.website_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start"><WebsiteIcon fontSize="small" /></InputAdornment> }} />
                    </FormSection>

                    {/* ── 4. LOCATION ── */}
                    <FormSection title="Location" defaultOpen>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <TextField ref={addressFieldRef} label="Address" value={infoForm.address || ''} onChange={(e) => handleInfoChange('address', e.target.value.slice(0, 255))} fullWidth size="small" error={Boolean(addressError)} helperText={addressError || `${(infoForm.address || '').length}/255`} inputProps={{ autoComplete: 'new-password', maxLength: 255 }} InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon fontSize="small" sx={{ color: addressError ? 'error.main' : 'primary.main' }} /></InputAdornment> }} placeholder="123 Main Street" />
                            {infoForm.address?.trim() && infoForm.city?.trim() && infoForm.county?.trim() && !confirmedCoordinates && !pendingCoordinates && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={geocoding ? <CircularProgress size={14} /> : <PlaceIcon />}
                                    onClick={handleGetMapPin}
                                    disabled={geocoding || (!infoForm.city?.trim() && !infoForm.county?.trim())}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', minWidth: 'auto', mt: '1px', height: 40, flexShrink: 0 }}
                                >
                                    {geocoding ? 'Verifying...' : 'Validate Address'}
                                </Button>
                            )}
                        </Stack>

                        {/* Geocode errors */}
                        {geocodeError && (
                            <Alert severity="error" onClose={() => setGeocodeError('')}>{geocodeError}</Alert>
                        )}

                        <CityCountySelect
                            city={infoForm.city || ''}
                            setCity={(val) => handleInfoChange('city', val)}
                            county={infoForm.county || ''}
                            setCounty={(val) => handleInfoChange('county', val)}
                            includeAllOptions={false}
                            disableClearable
                            countyRequired
                            cityRequired
                            emptyCountyLabel="Select county"
                            emptyCityLabel="Select city"
                        />
                        {showValidation && (!String(infoForm.city || '').trim() || !String(infoForm.county || '').trim()) && (
                            <Typography data-validation-error="true" sx={{ color: 'error.main', fontSize: 12, fontWeight: 700, mt: -0.5 }}>
                                {!String(infoForm.county || '').trim() && !String(infoForm.city || '').trim()
                                    ? 'County and City are required.'
                                    : !String(infoForm.county || '').trim()
                                        ? 'County is required.'
                                        : 'City is required.'}
                            </Typography>
                        )}

                        {/* ── Map preview ── */}
                        {(() => {
                            const hasCity = infoForm.city?.trim() && infoForm.city.trim() !== 'All Cities';
                            const hasCounty = infoForm.county?.trim() && infoForm.county.trim() !== 'All Counties';
                            if (!hasCity && !hasCounty) return null;

                            // If there's a confirmed address pin, show that (place mode with pin)
                            if (confirmedCoordinates && !pendingCoordinates) {
                                return (
                                    <Box>
                                        <Box sx={{ width: '100%', height: { xs: 150, sm: 200 }, borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'success.main', mb: 1, position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'default' } }}>
                                            <iframe title="Business Location" width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&q=${confirmedCoordinates.lat},${confirmedCoordinates.lng}&zoom=15`} />
                                        </Box>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                <Typography variant="caption" color="success.main" fontWeight={600}>Address confirmed</Typography>
                                            </Stack>
                                            <Button size="small" color="error" onClick={handleRemoveMapPin} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11 }}>Remove</Button>
                                        </Stack>
                                    </Box>
                                );
                            }

                            // If there's a pending address pin awaiting confirmation
                            if (pendingCoordinates) {
                                return (
                                    <Box>
                                        <Box sx={{ width: '100%', height: { xs: 150, sm: 200 }, borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'warning.main', mb: 1, position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'default' } }}>
                                            <iframe title="Confirm Business Location" width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&q=${pendingCoordinates.lat},${pendingCoordinates.lng}&zoom=15`} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 12 }}><strong>Found:</strong> {pendingCoordinates.formatted_address}</Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1, fontSize: 12 }}>Is this correct?</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="contained" color="success" size="small" startIcon={<CheckIcon />} onClick={handleConfirmMapPin} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12 }}>Yes, Confirm</Button>
                                            <Button variant="outlined" size="small" onClick={handleCancelMapPin} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12 }}>Try Again</Button>
                                        </Stack>
                                    </Box>
                                );
                            }

                            // Otherwise show the area preview (view mode, no pin)
                            const areaCoords = getCoordsFromLocalData(hasCity ? infoForm.city.trim() : '', hasCounty ? infoForm.county.trim() : '');
                            if (!areaCoords) return null;
                            const areaLabel = [hasCity ? infoForm.city.trim() : '', hasCounty ? infoForm.county.trim() + ' County' : '', 'Alabama'].filter(Boolean).join(', ');
                            const mapSrc = `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&center=${areaCoords.lat},${areaCoords.lng}&zoom=${hasCity ? 12 : 10}`;
                            return (
                                <Box sx={(t) => ({ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                    <Box sx={{ width: '100%', height: { xs: 150, sm: 200 }, position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'default' } }}>
                                        <iframe title="Area preview" width="100%" height="100%" style={{ border: 0, pointerEvents: 'none', display: 'block' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapSrc} />
                                    </Box>
                                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.default' }}>
                                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', fontStyle: 'italic' }}>
                                            Approximate area for {areaLabel}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })()}
                    </FormSection>

                    {/* ── 3. MEET THE OWNER(S) ── */}
                    <FormSection title="Meet the Owner(s)">
                        <TextField label="Section Title" size="small" fullWidth inputProps={{ autoComplete: 'new-password', maxLength: 60 }} value={infoForm.owner_info_json?.section_title || ''} onChange={(e) => { updateOwnerField('section_title', e.target.value.slice(0, 60)); if (profanityFieldErrors['owner section title']) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next['owner section title']; return next; }); }} placeholder="e.g. Meet the Team, Our Leadership" helperText={profanityFieldErrors['owner section title'] || `${(infoForm.owner_info_json?.section_title || '').length}/60 · Leave blank for default`} error={Boolean(profanityFieldErrors['owner section title'])} data-profanity-field="owner section title" />
                        <Typography variant="body2" fontWeight={800}>Primary Owner</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
                                <Avatar variant="rounded" src={infoForm.owner_info_json?.avatar_url || undefined} sx={{ width: 90, height: 90, borderRadius: 2.5, mx: 'auto', border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12) }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                    <PersonIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                </Avatar>
                                <Button size="small" startIcon={uploadingOwnerPhoto ? <CircularProgress size={12} /> : <UploadIcon />}
                                        onClick={() => {
                                            if (!ownerPhotoInputRef.current) {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/jpeg,image/png,image/webp';
                                                input.style.display = 'none';
                                                input.onchange = (ev) => handleOwnerPhotoUpload(ev);
                                                document.body.appendChild(input);
                                                ownerPhotoInputRef.current = input;
                                            }
                                            ownerPhotoInputRef.current?.click();
                                        }}
                                        disabled={uploadingOwnerPhoto} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11, mt: 0.5 }}>Photo</Button>
                                {infoForm.owner_info_json?.avatar_url && (
                                    <Button size="small" color="error" onClick={() => { setPendingFileDeletes((p) => [...p, infoForm.owner_info_json.avatar_url]); updateOwnerField('avatar_url', ''); }} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 10 }}>Remove</Button>
                                )}
                            </Box>
                            <Stack spacing={1.5} sx={{ flex: 1 }}>
                                <TextField label="Name" size="small" fullWidth inputProps={{ autoComplete: 'new-password' }} value={infoForm.owner_info_json?.name || ''} onChange={(e) => { updateOwnerField('name', e.target.value); if (profanityFieldErrors['owner name']) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next['owner name']; return next; }); }} error={Boolean(profanityFieldErrors['owner name'])} helperText={profanityFieldErrors['owner name'] || ''} data-profanity-field="owner name" />
                                <TextField label="Title" size="small" fullWidth inputProps={{ autoComplete: 'new-password' }} value={infoForm.owner_info_json?.title || ''} onChange={(e) => { updateOwnerField('title', e.target.value); if (profanityFieldErrors['owner title']) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next['owner title']; return next; }); }} placeholder="e.g. Founder & CEO" error={Boolean(profanityFieldErrors['owner title'])} helperText={profanityFieldErrors['owner title'] || ''} data-profanity-field="owner title" />
                                <TextField label="Bio" size="small" fullWidth multiline rows={2} inputProps={{ autoComplete: 'new-password', maxLength: 300 }} value={infoForm.owner_info_json?.about || ''} onChange={(e) => { updateOwnerField('about', e.target.value.slice(0, 300)); if (profanityFieldErrors['owner bio']) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next['owner bio']; return next; }); }} helperText={profanityFieldErrors['owner bio'] || `${(infoForm.owner_info_json?.about || '').length}/300`} error={Boolean(profanityFieldErrors['owner bio'])} data-profanity-field="owner bio" />
                            </Stack>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" fontWeight={800}>Additional Owners / Team</Typography>
                        {(Array.isArray(infoForm.owner_info_json?.additional_owners) ? infoForm.owner_info_json.additional_owners : []).map((ao, idx) => (
                            <Fragment key={idx}>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="text.secondary">Owner #{idx + 2}</Typography>
                                        <IconButton size="small" color="error" onClick={() => removeAdditionalOwner(idx)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                        <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
                                            <Avatar variant="rounded" src={ao.avatar_url || undefined} sx={{ width: 90, height: 90, borderRadius: 2.5, mx: 'auto', border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12) }} imgProps={{ referrerPolicy: 'no-referrer' }}><PersonIcon sx={{ fontSize: 36, color: 'text.disabled' }} /></Avatar>
                                            <Button size="small" startIcon={uploadingAdditionalOwnerPhoto === idx ? <CircularProgress size={10} /> : <UploadIcon />}
                                                    onClick={() => { if (!additionalOwnerPhotoInputRefs.current[idx]) { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.style.display = 'none'; input.onchange = (ev) => handleAdditionalOwnerPhotoUpload(ev, idx); document.body.appendChild(input); additionalOwnerPhotoInputRefs.current[idx] = input; } additionalOwnerPhotoInputRefs.current[idx]?.click(); }}
                                                    disabled={uploadingAdditionalOwnerPhoto === idx} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 10, mt: 0.5 }}>Photo</Button>
                                            {ao.avatar_url && (
                                                <Button size="small" color="error" onClick={() => { setPendingFileDeletes((p) => [...p, ao.avatar_url]); updateAdditionalOwner(idx, 'avatar_url', ''); }} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 10 }}>Remove</Button>
                                            )}
                                        </Box>
                                        <Stack spacing={1.5} sx={{ flex: 1 }}>
                                            <TextField label="Name" size="small" fullWidth inputProps={{ autoComplete: 'new-password' }} value={ao.name || ''} onChange={(e) => { updateAdditionalOwner(idx, 'name', e.target.value); const fk = `additional owner ${idx + 2} name`; if (profanityFieldErrors[fk]) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next[fk]; return next; }); }} error={Boolean(profanityFieldErrors[`additional owner ${idx + 2} name`])} helperText={profanityFieldErrors[`additional owner ${idx + 2} name`] || ''} data-profanity-field={`additional owner ${idx + 2} name`} />
                                            <TextField label="Title" size="small" fullWidth inputProps={{ autoComplete: 'new-password' }} value={ao.title || ''} onChange={(e) => { updateAdditionalOwner(idx, 'title', e.target.value); const fk = `additional owner ${idx + 2} title`; if (profanityFieldErrors[fk]) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next[fk]; return next; }); }} error={Boolean(profanityFieldErrors[`additional owner ${idx + 2} title`])} helperText={profanityFieldErrors[`additional owner ${idx + 2} title`] || ''} data-profanity-field={`additional owner ${idx + 2} title`} />
                                            <TextField label="Bio" size="small" fullWidth multiline rows={2} inputProps={{ autoComplete: 'new-password', maxLength: 300 }} value={ao.about || ''} onChange={(e) => { updateAdditionalOwner(idx, 'about', e.target.value.slice(0, 300)); const fk = `additional owner ${idx + 2} bio`; if (profanityFieldErrors[fk]) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next[fk]; return next; }); }} helperText={profanityFieldErrors[`additional owner ${idx + 2} bio`] || `${(ao.about || '').length}/300`} error={Boolean(profanityFieldErrors[`additional owner ${idx + 2} bio`])} data-profanity-field={`additional owner ${idx + 2} bio`} />
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Fragment>
                        ))}
                        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addAdditionalOwner} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Another Owner</Button>
                    </FormSection>

                    {/* ── 4. HIGHLIGHT SECTIONS ── */}
                    <FormSection title="Highlight Sections">
                        <Typography variant="body2" color="text.secondary">Featured cards showcasing specialties, awards, or unique aspects of your business.</Typography>
                        {(Array.isArray(infoForm.highlight_sections_json) ? infoForm.highlight_sections_json : []).map((sec, idx) => (
                            <Paper key={idx} variant="outlined" sx={{ p: { xs: 2, md: 1.5 }, borderRadius: 2, bgcolor: 'grey.50' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" fontWeight={800} color="primary.main">Card #{idx + 1}</Typography>
                                    <IconButton size="small" color="error" onClick={() => removeHighlightSection(idx)}><DeleteIcon fontSize="small" /></IconButton>
                                </Stack>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                        <FormControl size="small" sx={{ minWidth: 90 }}>
                                            <InputLabel>Icon</InputLabel>
                                            <Select label="Icon" value={sec.icon || 'Star'} onChange={(e) => updateHighlightField(idx, 'icon', e.target.value)}
                                                    renderValue={(val) => (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <HlIconRender name={val} sx={{ fontSize: 18, color: 'primary.main' }} />
                                                        </Box>
                                                    )}>
                                                {HL_ICON_KEYS.map((key) => (
                                                    <MenuItem key={key} value={key}>
                                                        <ListItemIcon sx={{ minWidth: 28 }}><HlIconRender name={key} sx={{ fontSize: 20, color: 'primary.main' }} /></ListItemIcon>
                                                        <ListItemText primary={HL_ICON_LABELS[key] || key} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField label="Title" size="small" fullWidth inputProps={{ autoComplete: 'new-password', maxLength: 80 }} value={sec.title || ''} onChange={(e) => { updateHighlightField(idx, 'title', e.target.value.slice(0, 80)); const fk = `highlight section ${idx + 1} title`; if (profanityFieldErrors[fk]) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next[fk]; return next; }); }} helperText={profanityFieldErrors[`highlight section ${idx + 1} title`] || `${(sec.title || '').length}/80`} error={Boolean(profanityFieldErrors[`highlight section ${idx + 1} title`])} data-profanity-field={`highlight section ${idx + 1} title`} />
                                    </Stack>
                                    <TextField label="Body" size="small" fullWidth multiline rows={3} inputProps={{ autoComplete: 'new-password', maxLength: 300 }} value={sec.body || ''} onChange={(e) => { updateHighlightField(idx, 'body', e.target.value.slice(0, 300)); const fk = `highlight section ${idx + 1} description`; if (profanityFieldErrors[fk]) setProfanityFieldErrors((prev) => { const next = { ...prev }; delete next[fk]; return next; }); }} helperText={profanityFieldErrors[`highlight section ${idx + 1} description`] || `${(sec.body || '').length}/300`} error={Boolean(profanityFieldErrors[`highlight section ${idx + 1} description`])} data-profanity-field={`highlight section ${idx + 1} description`} />
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        {sec.photo_url ? (
                                            <Box component="img" src={sec.photo_url} alt={sec.title || 'Highlight'} sx={{ width: 72, height: 72, borderRadius: 1.5, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />
                                        ) : (
                                            <Box sx={{ width: 72, height: 72, borderRadius: 1.5, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider' }}><ImageIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></Box>
                                        )}
                                        <Stack spacing={0.5}>
                                            <Button variant="outlined" size="small" startIcon={uploadingHighlightPhoto === idx ? <CircularProgress size={12} /> : <UploadIcon />}
                                                    onClick={() => { if (!highlightPhotoInputRefs.current[idx]) { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.style.display = 'none'; input.onchange = (ev) => handleHighlightPhotoUpload(ev, idx); document.body.appendChild(input); highlightPhotoInputRefs.current[idx] = input; } highlightPhotoInputRefs.current[idx]?.click(); }}
                                                    disabled={uploadingHighlightPhoto === idx} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11 }}>{uploadingHighlightPhoto === idx ? 'Uploading...' : 'Upload Photo'}</Button>
                                            {sec.photo_url && <Button variant="text" size="small" color="error" onClick={() => { if (sec.photo_url) setPendingFileDeletes((p) => [...p, sec.photo_url]); updateHighlightField(idx, 'photo_url', ''); }} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11 }}>Remove</Button>}
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))}
                        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addHighlightSection} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Highlight Card</Button>
                    </FormSection>

                    {/* ── 5. SERVICES / OFFERINGS + SERVICE MENU BUILDER ── */}
                    {(() => {
                        const catCfg = CATEGORY_CONFIG[infoForm.category_key] || DEFAULT_CATEGORY_CONFIG;
                        const currentTags = Array.isArray(infoForm.services_offered_json) ? infoForm.services_offered_json : [];
                        const availableSuggestions = catCfg.suggestedTags.filter((t) => !currentTags.includes(t));
                        const builderCfg = catCfg.builder;
                        const isServiceMenu = builderCfg && builderCfg.type === 'service_menu';
                        const CatIcon = BUSINESS_CATEGORY_ICON[infoForm.category_key] || CategoryIcon;
                        const catData = infoForm.category_data_json || {};
                        const svcMenuItems = isServiceMenu ? (Array.isArray(catData[builderCfg.dataKey]) ? catData[builderCfg.dataKey] : []) : [];
                        const handleSvcBuilderChange = (items) => {
                            handleInfoChange('category_data_json', { ...catData, [builderCfg.dataKey]: items });
                        };
                        const handleSvcBuilderUpload = async (file, folder) => {
                            return await moderateAndUpload(file, folder);
                        };
                        return (
                            <FormSection title={catCfg.servicesLabel}>
                                <Stack direction="row" spacing={1}>
                                    <TextField size="small" inputProps={{ autoComplete: 'new-password' }} value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addServiceTag(); } }} placeholder={catCfg.servicesPlaceholder} fullWidth />
                                    <Button variant="contained" size="small" onClick={addServiceTag} disabled={!serviceInput.trim()} sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>Add</Button>
                                </Stack>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                    {currentTags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" onDelete={() => removeServiceTag(tag)} sx={{ fontWeight: 600, fontSize: 11 }} />
                                    ))}
                                </Box>
                                {availableSuggestions.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Quick add:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {availableSuggestions.slice(0, 12).map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        const updated = [...currentTags, tag];
                                                        handleInfoChange('services_offered_json', updated);
                                                    }}
                                                    sx={{ fontSize: 10, fontWeight: 600, cursor: 'pointer', borderStyle: 'dashed', '&:hover': { bgcolor: 'primary.main', color: '#fff', borderColor: 'primary.main' } }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                {currentTags.length === 0 && availableSuggestions.length === 0 && <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No services added yet.</Typography>}
                                {isServiceMenu && (
                                    <>
                                        <Divider sx={{ my: 1.5 }} />
                                        <ServiceMenuBuilder
                                            items={svcMenuItems}
                                            onChange={handleSvcBuilderChange}
                                            onUploadPhoto={handleSvcBuilderUpload}
                                            durationEnabled={builderCfg.durationEnabled !== false}
                                            icon={<CatIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                                        />
                                    </>
                                )}
                            </FormSection>
                        );
                    })()}

                    {/* ── 5b. CATEGORY-SPECIFIC DETAILS ── */}
                    {(() => {
                        const catCfg = CATEGORY_CONFIG[infoForm.category_key] || DEFAULT_CATEGORY_CONFIG;
                        const catData = infoForm.category_data_json || {};
                        const hasCategoryFields = catCfg.priceRange || catCfg.extraFields.length > 0;
                        if (!hasCategoryFields) return null;

                        const updateCatField = (key, value) => {
                            const updated = { ...catData, [key]: value };
                            handleInfoChange('category_data_json', updated);
                        };

                        return (
                            <FormSection title={catCfg.sectionTitle}>
                                {catCfg.priceRange && (
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>Price Range</Typography>
                                        <Stack direction="row" spacing={0.75}>
                                            {['$', '$$', '$$$', '$$$$'].map((level) => (
                                                <Chip
                                                    key={level}
                                                    label={level}
                                                    size="small"
                                                    variant={catData.price_range === level ? 'filled' : 'outlined'}
                                                    color={catData.price_range === level ? 'primary' : 'default'}
                                                    onClick={() => updateCatField('price_range', catData.price_range === level ? '' : level)}
                                                    sx={{ fontWeight: 700, fontSize: 12, cursor: 'pointer', minWidth: 44 }}
                                                />
                                            ))}
                                        </Stack>
                                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                                            {catData.price_range === '$' && 'Budget-friendly'}
                                            {catData.price_range === '$$' && 'Moderate'}
                                            {catData.price_range === '$$$' && 'Upscale'}
                                            {catData.price_range === '$$$$' && 'Fine dining / Premium'}
                                            {!catData.price_range && 'Select a price range'}
                                        </Typography>
                                    </Box>
                                )}
                                {catCfg.extraFields.map((field) => {
                                    if (field.type === 'text') {
                                        return (
                                            <TextField
                                                key={field.key}
                                                label={field.label}
                                                value={catData[field.key] || ''}
                                                onChange={(e) => updateCatField(field.key, e.target.value.slice(0, 500))}
                                                fullWidth
                                                size="small"
                                                placeholder={field.placeholder || ''}
                                                inputProps={{ autoComplete: 'new-password', maxLength: 500 }}
                                            />
                                        );
                                    }
                                    if (field.type === 'select') {
                                        return (
                                            <FormControl key={field.key} fullWidth size="small">
                                                <InputLabel>{field.label}</InputLabel>
                                                <Select
                                                    value={catData[field.key] || ''}
                                                    label={field.label}
                                                    onChange={(e) => updateCatField(field.key, e.target.value)}
                                                >
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {field.options.map((opt) => (
                                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        );
                                    }
                                    if (field.type === 'multiselect') {
                                        const selected = Array.isArray(catData[field.key]) ? catData[field.key] : [];
                                        return (
                                            <Box key={field.key}>
                                                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>{field.label}</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {field.options.map((opt) => (
                                                        <Chip
                                                            key={opt}
                                                            label={opt}
                                                            size="small"
                                                            variant={selected.includes(opt) ? 'filled' : 'outlined'}
                                                            color={selected.includes(opt) ? 'primary' : 'default'}
                                                            onClick={() => {
                                                                const updated = selected.includes(opt)
                                                                    ? selected.filter((s) => s !== opt)
                                                                    : [...selected, opt];
                                                                updateCatField(field.key, updated);
                                                            }}
                                                            sx={{ fontWeight: 600, fontSize: 11, cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    }
                                    if (field.type === 'toggle') {
                                        return (
                                            <Stack key={field.key} direction="row" alignItems="center" spacing={0.5}>
                                                <Switch
                                                    checked={Boolean(catData[field.key])}
                                                    onChange={(e) => updateCatField(field.key, e.target.checked)}
                                                    size="small"
                                                />
                                                <Typography variant="body2" fontWeight={700}>{field.label}</Typography>
                                            </Stack>
                                        );
                                    }
                                    return null;
                                })}
                            </FormSection>
                        );
                    })()}

                    {/* ── 5c. CATEGORY BUILDER (Menu / Providers / Classes / Accommodations — NOT service_menu) ── */}
                    {(() => {
                        const catCfg = CATEGORY_CONFIG[infoForm.category_key] || DEFAULT_CATEGORY_CONFIG;
                        const builderCfg = catCfg.builder;
                        if (!builderCfg) return null;
                        if (builderCfg.type === 'service_menu') return null;

                        const catData = infoForm.category_data_json || {};
                        const dataKey = builderCfg.dataKey;
                        const currentItems = Array.isArray(catData[dataKey]) ? catData[dataKey] : [];

                        const handleBuilderChange = (items) => {
                            handleInfoChange('category_data_json', { ...catData, [dataKey]: items });
                        };

                        const handleBuilderUpload = async (file, folder) => {
                            return await moderateAndUpload(file, folder);
                        };

                        if (builderCfg.type === 'menu') {
                            return (
                                <FormSection title={builderCfg.builderTitle || 'Menu'}>
                                    <MenuBuilder
                                        sections={currentItems}
                                        onChange={handleBuilderChange}
                                        onUploadPhoto={handleBuilderUpload}
                                    />
                                </FormSection>
                            );
                        }
                        if (builderCfg.type === 'provider') {
                            return (
                                <FormSection title={builderCfg.builderTitle || 'Our Team'}>
                                    <ProviderBuilder
                                        items={currentItems}
                                        onChange={handleBuilderChange}
                                        onUploadPhoto={handleBuilderUpload}
                                        roleLabel={builderCfg.roleLabel || 'Specialty'}
                                    />
                                </FormSection>
                            );
                        }
                        if (builderCfg.type === 'class') {
                            return (
                                <FormSection title={builderCfg.builderTitle || 'Classes & Programs'}>
                                    <ClassBuilder
                                        items={currentItems}
                                        onChange={handleBuilderChange}
                                        onUploadPhoto={handleBuilderUpload}
                                        itemLabel={builderCfg.itemLabel || 'Class'}
                                    />
                                </FormSection>
                            );
                        }
                        if (builderCfg.type === 'accommodation') {
                            return (
                                <FormSection title={builderCfg.builderTitle || 'Accommodations'}>
                                    <AccommodationBuilder
                                        items={currentItems}
                                        onChange={handleBuilderChange}
                                        onUploadPhoto={handleBuilderUpload}
                                    />
                                </FormSection>
                            );
                        }
                        return null;
                    })()}

                    {/* ── BUSINESS HOURS ── */}
                    <FormSection title="Business Hours">
                        <BusinessHoursEditor hours={infoForm.hours || {}} onChange={(newHours) => handleInfoChange('hours', newHours)} />
                    </FormSection>

                    {/* ── 5. PHOTOS (Gallery only) ── */}
                    <FormSection title="Photo Gallery">
                        <PhotosUploadSection photos={gallery} setPhotos={setGallery} maxPhotos={12} uploadFolder="business/gallery" />
                    </FormSection>

                    {/* ── 9. SOCIAL LINKS ── */}
                    <FormSection title="Social Links">
                        <TextField label="Instagram" value={infoForm.instagram_url || ''} onChange={(e) => handleInfoChange('instagram_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="yourbusiness" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.instagram_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><InstagramIcon sx={{ color: (t) => t.custom.social.instagram, mr: 0.75, fontSize: 20 }} /><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>instagram.com/</Typography></InputAdornment> }} />
                        <TextField label="X (Twitter)" value={infoForm.twitter_url || ''} onChange={(e) => handleInfoChange('twitter_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="yourbusiness" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.twitter_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><XIcon sx={{ color: 'text.primary', mr: 0.75, fontSize: 18 }} /><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>x.com/</Typography></InputAdornment> }} />
                        <TextField label="Facebook" value={infoForm.facebook_url || ''} onChange={(e) => handleInfoChange('facebook_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="yourbusiness" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.facebook_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><FacebookIcon sx={{ color: (t) => t.custom.social.facebook, mr: 0.75, fontSize: 20 }} /><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>facebook.com/</Typography></InputAdornment> }} />
                        <TextField label="LinkedIn" value={infoForm.linkedin_url || ''} onChange={(e) => handleInfoChange('linkedin_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="yourcompany" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.linkedin_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><LinkedInIcon sx={{ color: '#0A66C2', mr: 0.75, fontSize: 20 }} /><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>linkedin.com/in/</Typography></InputAdornment> }} />
                        <TextField label="Etsy Shop" value={infoForm.etsy_url || ''} onChange={(e) => handleInfoChange('etsy_url', e.target.value.slice(0, 500))} fullWidth size="small" placeholder="yourshop" inputProps={{ autoComplete: 'new-password', maxLength: 500 }} helperText={`${(infoForm.etsy_url || '').length}/500`} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><StorefrontIcon sx={{ color: '#F1641E', mr: 0.75, fontSize: 20 }} /><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>etsy.com/shop/</Typography></InputAdornment> }} />
                    </FormSection>

                    <Box sx={{ height: 60 }} />
                </Box>
            </Box>

            {/* ══ RIGHT: LIVE PREVIEW — only shown at >=1440px (admin theme remaps md to 1440) ══ */}
            <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '38%' }, maxHeight: { md: 'calc(100vh - 80px)' }, display: { xs: 'none', md: 'flex' }, flexDirection: { md: 'column' }, position: { md: 'sticky' }, top: { md: 16 }, alignSelf: { md: 'flex-start' } }}>
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: { md: '100%' } }}>
                    <Box sx={{ p: { xs: 2, md: 2.5 }, pb: { xs: 1.5, md: 2 }, flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                        <Box sx={{ flexShrink: 0, pb: 1.25, pt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <VisibilityIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 12, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Preview</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>This is how your profile will appear on the business detail page.</Typography>
                        </Box>
                        <Box sx={{ minHeight: 0 }}>
                            <BusinessLivePreview
                                name={infoForm.name || businessName}
                                slug={slug}
                                subtitle={infoForm.subtitle || ''}
                                description={infoForm.description || ''}
                                avatarUrl={displayAvatarSrc}
                                coverUrl={displayCoverSrc}
                                categoryLabel={(CATEGORY_OPTIONS.find((c) => c.value === infoForm.category_key) || {}).label || ''}
                                entityTypeLabel={(ENTITY_TYPE_OPTIONS.find((o) => o.value === infoForm.entity_type) || {}).label || ''}
                                entityType={infoForm.entity_type || 'business'}
                                isStatewide={Boolean(business?.is_statewide)}
                                address={infoForm.address || ''}
                                city={infoForm.city || ''}
                                county={infoForm.county || ''}
                                phone={infoForm.phone || ''}
                                email={infoForm.email_public || ''}
                                websiteUrl={infoForm.website_url || ''}
                                facebookUrl={infoForm.facebook_url || ''}
                                instagramUrl={infoForm.instagram_url || ''}
                                twitterUrl={infoForm.twitter_url || ''}
                                linkedinUrl={infoForm.linkedin_url || ''}
                                etsyUrl={infoForm.etsy_url || ''}
                                isVerified={Boolean(business?.is_verified)}
                                servicesOffered={Array.isArray(infoForm.services_offered_json) ? infoForm.services_offered_json : []}
                                ownerInfo={infoForm.owner_info_json || null}
                                highlightSections={Array.isArray(infoForm.highlight_sections_json) ? infoForm.highlight_sections_json : []}
                                hours={infoForm.hours || {}}
                                reviewCount={business?.review_count || 0}
                                avgRating={business?.avg_rating || 0}
                                categoryKey={infoForm.category_key || ''}
                                categoryData={infoForm.category_data_json || {}}
                                gallery={gallery}
                                circularAvatar
                            />

                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    const renderTeam = () => (
        <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <SectionHeader
                    icon={<TeamIcon />}
                    title="Team Members"
                    action={isAdmin && (
                        <Button variant="contained" size="small" startIcon={<InviteIcon />} onClick={() => setInviteModalOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>Invite</Button>
                    )}
                />
                {teamLoading ? (
                    <Box sx={{ py: 2 }}>{[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={60} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List disablePadding>
                        {(teamData?.members || []).map((member) => (
                            <ListItem key={member.user_id} sx={{ px: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <ListItemAvatar>
                                    <Avatar src={member.user?.avatar_url || member.avatar_url || defaultAvatar} onClick={(e) => handleUserCardOpen(e, member)} sx={{ cursor: 'pointer' }}>{member.user?.first_name?.[0] || member.first_name?.[0] || '?'}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={<Typography fontWeight={700}>{member.user?.first_name || member.first_name} {member.user?.last_name || member.last_name}</Typography>} secondary={(member.user?.handle || member.handle) ? `@${member.user?.handle || member.handle}` : null} />
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <RoleChip role={member.role} />
                                    {isOwner && member.role !== 'owner' && (
                                        <IconButton size="small" onClick={(e) => handleMemberMenuOpen(e, member)}><MoreIcon /></IconButton>
                                    )}
                                </Stack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
            {(teamData?.pending_invites?.length > 0) && (
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                    <SectionHeader icon={<InviteIcon />} title="Pending Invites" />
                    <List disablePadding>
                        {teamData.pending_invites.map((invite) => (
                            <ListItem key={invite.id} sx={{ px: 0 }}>
                                <ListItemAvatar>
                                    <Avatar src={invite.invitee_avatar_url || defaultAvatar}>{invite.invitee_first_name?.[0] || <EmailIcon />}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={invite.invitee_first_name ? `${invite.invitee_first_name} ${invite.invitee_last_name || ''}` : 'Invite Link'} secondary={invite.invite_url ? 'Shareable link' : invite.invitee_email} />
                                <Stack direction="row" spacing={1}>
                                    {invite.invite_url && (
                                        <Button size="small" variant="outlined" startIcon={copiedInviteId === invite.id ? <CheckIcon /> : <CopyIcon />} onClick={() => handleCopyInviteLink(invite.invite_url, invite.id)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                            {copiedInviteId === invite.id ? 'Copied!' : 'Copy'}
                                        </Button>
                                    )}
                                    <Button size="small" color="error" onClick={() => handleCancelInvite(invite.id)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                                </Stack>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
            {!isOwner && (
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, borderColor: 'warning.main' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography fontWeight={700}>Leave Team</Typography>
                            <Typography variant="body2" color="text.secondary">You will lose access to manage this business page.</Typography>
                        </Box>
                        <Button variant="outlined" color="warning" startIcon={<LeaveIcon />} onClick={handleLeaveTeam} sx={{ textTransform: 'none', fontWeight: 600 }}>Leave</Button>
                    </Stack>
                </Paper>
            )}
        </Stack>
    );

    const renderSettings = () => (
        <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <SectionHeader icon={<SettingsIcon />} title="Privacy Settings" />
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box><Typography fontWeight={700}>Show Phone Number</Typography><Typography variant="body2" color="text.secondary">Display phone number on your public page</Typography></Box>
                        <Switch checked={settings?.show_phone !== false} onChange={(e) => handleSettingChange('show_phone', e.target.checked)} disabled={settingsSaving} />
                    </Stack>
                    <Divider />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box><Typography fontWeight={700}>Show Email</Typography><Typography variant="body2" color="text.secondary">Display email address on your public page</Typography></Box>
                        <Switch checked={settings?.show_email !== false} onChange={(e) => handleSettingChange('show_email', e.target.checked)} disabled={settingsSaving} />
                    </Stack>
                    <Divider />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box><Typography fontWeight={700}>Allow Reviews</Typography><Typography variant="body2" color="text.secondary">Let customers leave reviews on your page</Typography></Box>
                        <Switch checked={settings?.allow_reviews !== false} onChange={(e) => handleSettingChange('allow_reviews', e.target.checked)} disabled={settingsSaving} />
                    </Stack>
                    <Divider />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box><Typography fontWeight={700}>Allow Messages</Typography><Typography variant="body2" color="text.secondary">Let customers send you direct messages through Local Lantern</Typography></Box>
                        <Switch checked={settings?.allow_messages !== false} onChange={(e) => handleSettingChange('allow_messages', e.target.checked)} disabled={settingsSaving} />
                    </Stack>
                </Stack>
            </Paper>
            {isOwner && (
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, borderColor: 'error.main' }}>
                    <SectionHeader icon={<WarningIcon color="error" />} title="Danger Zone" />
                    <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box><Typography fontWeight={700}>Transfer Ownership</Typography><Typography variant="body2" color="text.secondary">Transfer this business to another team member</Typography></Box>
                            <Button variant="outlined" color="warning" startIcon={<TransferIcon />} onClick={() => setTransferDialogOpen(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>Transfer</Button>
                        </Stack>
                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box><Typography fontWeight={700}>{business?.is_active === false ? 'Reactivate Business' : 'Deactivate Business'}</Typography><Typography variant="body2" color="text.secondary">{business?.is_active === false ? 'Make your business page visible again' : 'Hide your business page from public view'}</Typography></Box>
                            <Button variant="outlined" color={business?.is_active === false ? 'success' : 'warning'} onClick={business?.is_active === false ? handleReactivate : handleDeactivate} disabled={dangerLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>{business?.is_active === false ? 'Reactivate' : 'Deactivate'}</Button>
                        </Stack>
                        <Divider />
                        <Box>
                            <Typography fontWeight={700} color="error.main">Delete Business Permanently</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>This action cannot be undone. Type <strong>{businessName}</strong> to confirm.</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField size="small" placeholder={businessName} inputProps={{ autoComplete: "new-password" }} value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} sx={{ flex: 1 }} />
                                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeletePermanently} disabled={deleteConfirmName !== businessName || dangerLoading} sx={{ textTransform: 'none', fontWeight: 700 }}>Delete Forever</Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            )}
        </Stack>
    );

    void renderDashboard;
    void renderTeam;
    void renderPro;
    void renderSettings;

    // ============================================================================
    // Main Render
    // ============================================================================

    if (businessLoading || setupLoading) {
        return (
            <Box sx={{ height: { xs: 'calc(100vh - 80px)', sm: 'calc(100vh - 90px)' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Setup mode: show name input dialog when creating a new draft
    if (setupMode && setupNameDialogOpen && !business) {
        return (
            <Box sx={{
                minHeight: { xs: '100vh', sm: 'calc(100vh - 90px)' },
                height: { sm: 'calc(100vh - 90px)' },
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'center',
                overflow: { sm: 'hidden' },
                p: { xs: 0, sm: 2 },
            }}>
                <Paper
                    sx={{
                        p: { xs: 3, sm: 4 },
                        pt: { xs: 8, sm: 4 },
                        maxWidth: { xs: '100%', sm: 480 },
                        width: '100%',
                        minHeight: { xs: '100vh', sm: 'auto' },
                        mx: { xs: 0, sm: 2 },
                        borderRadius: { xs: 0, sm: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: { xs: 'flex-start', sm: 'center' },
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                        opacity: setupTransitioning ? 0 : 1,
                        transform: setupTransitioning ? 'translateY(-24px)' : 'translateY(0)',
                    }}
                >
                    <Stack spacing={2.5} alignItems="center">
                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: (t) => alpha(t.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <StorefrontIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, textAlign: 'center' }}>
                            Create Your Business Page
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
                            Enter your business name to get started.
                        </Typography>
                        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
                        <TextField
                            fullWidth
                            label="Business Name"
                            value={setupNameInput}
                            onChange={(e) => setSetupNameInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSetupCreateDraft(); }}
                            autoFocus
                            inputProps={{ autoComplete: 'new-password', maxLength: 100 }}
                            placeholder="e.g. Joe's BBQ, Alabama Auto Repair"
                        />
                        <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/business')}
                                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                                disabled={setupNameSubmitting || setupTransitioning}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSetupCreateDraft}
                                disabled={!setupNameInput.trim() || setupNameSubmitting || setupTransitioning}
                                startIcon={setupNameSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                                sx={{ flex: 1, textTransform: 'none', fontWeight: 900, borderRadius: 999 }}
                            >
                                {setupNameSubmitting ? 'Creating...' : 'Get Started'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    // Setup mode: show success screen after submission
    if (setupMode && setupSubmitted) {
        return (
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'center',
                px: 3,
                pt: { xs: 10, sm: 0 },
                pb: { xs: 6, sm: 0 },
            }}>
                <Box sx={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
                    <Stack spacing={2.5} alignItems="center">
                        <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: (t) => alpha(t.palette.success.main, 0.10), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, sm: 24 } }}>
                            Submitted for Review!
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
                            Your business profile has been submitted and will be reviewed within 24-48 hours. You&apos;ll receive a notification once it&apos;s approved.
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.5 }}>
                            In the meantime, you can continue editing your draft by returning to this page.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => { window.location.href = '/business'; }}
                            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 15, mt: 1 }}
                        >
                            Back to Businesses
                        </Button>
                    </Stack>
                </Box>
            </Box>
        );
    }

    if (error && !business) {
        if (isNetworkError(rawLoadError)) {
            return (
                <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                    <NetworkErrorState onRetry={() => window.location.reload()} />
                </Box>
            );
        }
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
            </Container>
        );
    }

    // In setup mode, skip the console access check (user is creating a new business)
    if (!setupMode && (!hasConsoleAccess || !viewerRole)) {
        const bizName = business?.name || 'this business';
        return (
            <Box
                sx={{
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    p: 2,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 460,
                        width: '100%',
                        textAlign: 'center',
                        p: { xs: 4, sm: 5 },
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                        }}
                    >
                        <LockOutlinedIcon sx={{ fontSize: 30, color: 'warning.dark' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                        Admin Access Required
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, lineHeight: 1.6 }}>
                        You need to be logged into the <strong>{bizName}</strong> account to manage this profile.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                        Switch to the correct account using the menu in the top-right corner, then try again.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                            onClick={() => navigate(`/${slug}`)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 999,
                                px: 2.5,
                            }}
                        >
                            View Profile
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
                            onClick={() => navigate('/')}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 999,
                                px: 2.5,
                            }}
                        >
                            Go to Home
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* ── DESKTOP: Sidebar layout ── */}
                {!isMobile ? (
                    <Box ref={contentRef}>
                        <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, px: { xs: 1.5, md: 2.5 } }}>
                            {setupMode && business?.status === 'draft' && (
                                <Alert severity="info" sx={{ mb: 2, fontWeight: 600, borderRadius: 2 }} icon={<StorefrontIcon />}>
                                    You&apos;re setting up a new business page. Fill in your details, save drafts anytime, and submit for review when ready.
                                </Alert>
                            )}
                            {business?.status === 'pending_approval' && (
                                <Alert severity="warning" sx={{ mb: 2, fontWeight: 600, borderRadius: 2 }}>
                                    This business is awaiting verification. You can still make edits — any saved changes will be reflected in the review.
                                </Alert>
                            )}
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                            {loading ? (
                                <PulsingDots />
                            ) : (
                                renderInformation()
                            )}
                        </Box>
                    </Box>
                ) : (
                    /* ── MOBILE: Full-screen edit profile page ── */
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100vh',
                        pt: `${chromeTop}px`,
                        ...(setupMode && {
                            position: 'fixed',
                            top: `${chromeTop}px`,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1300,
                            minHeight: 'unset',
                            height: `calc(100% - ${chromeTop}px)`,
                            bgcolor: 'background.paper',
                        }),
                    }}>
                        {/* ── Mobile top header ── */}
                        <Box
                            sx={{
                                bgcolor: 'background.paper',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1100,
                            }}
                        >
                            <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <ButtonBase
                                        onClick={handleBack}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <ArrowBackIcon sx={{ fontSize: 16 }} />
                                    </ButtonBase>
                                    <BusinessIcon sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {setupMode ? 'Setup Business' : 'Edit Profile'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>

                        {/* ── Mobile scrollable content area ── */}
                        <Box
                            ref={contentRef}
                            sx={{
                                flex: 1,
                                px: 0,
                                pt: 0,
                                pb: setupMode ? '100px' : `${MOBILE_BOTTOM_NAV_HEIGHT + 100}px`,
                                bgcolor: 'background.paper',
                                overflowY: 'auto',
                                // Reduce input/select font sizes on mobile to match rest of site
                                '& .MuiInputBase-input': { fontSize: 14 },
                                '& .MuiInputLabel-root': { fontSize: 14 },
                                '& .MuiSelect-select': { fontSize: 14 },
                                '& .MuiFormHelperText-root': { fontSize: 11.5 },
                                // Force builder card item rows (image + fields) to stack vertically
                                // on mobile. Targets the direct row inside each builder Paper card.
                                '& .builder-item-row': {
                                    flexDirection: 'column !important',
                                    alignItems: 'stretch !important',
                                    gap: '12px !important',
                                },
                            }}
                        >
                            {setupMode && business?.status === 'draft' && (
                                <Alert severity="info" sx={{ mb: 2, mx: 2, fontWeight: 600, borderRadius: 2, fontSize: 13 }} icon={<StorefrontIcon />}>
                                    Fill in your details, save drafts anytime, and submit for review when ready.
                                </Alert>
                            )}
                            {business?.status === 'pending_approval' && (
                                <Alert severity="warning" sx={{ mb: 2, mx: 2, fontWeight: 600, borderRadius: 2, fontSize: 13 }}>
                                    Awaiting verification. You can still make edits.
                                </Alert>
                            )}
                            {error && <Alert severity="error" sx={{ mb: 2, mx: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mb: 2, mx: 2 }}>{success}</Alert>}
                            {loading ? (
                                <PulsingDots />
                            ) : (
                                renderInformation()
                            )}
                        </Box>

                        {/* ── Mobile bottom action bar ── */}
                        <Box
                            sx={{
                                position: setupMode ? 'sticky' : 'fixed',
                                bottom: setupMode ? 0 : (bottomNavHidden ? 0 : MOBILE_BOTTOM_NAV_HEIGHT),
                                left: 0,
                                right: 0,
                                zIndex: 1100,
                                bgcolor: 'background.paper',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                px: 2,
                                py: 1.5,
                                boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
                                transition: setupMode ? 'none' : 'bottom 0.3s ease',
                                flexShrink: 0,
                            }}
                        >
                            {setupMode ? (
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={handleSaveDraft}
                                            disabled={draftSaving || submittingForReview || setupSubmitted}
                                            startIcon={draftSaving ? <CircularProgress size={16} color="inherit" /> : null}
                                            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14 }}
                                        >
                                            {draftSaving ? 'Saving...' : 'Save Draft'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            onClick={handleSubmitForReview}
                                            disabled={submittingForReview || draftSaving || setupSubmitted}
                                            startIcon={submittingForReview ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14 }}
                                        >
                                            {setupSubmitted ? 'Submitted!' : submittingForReview ? 'Submitting...' : 'Submit for Review'}
                                        </Button>
                                    </Stack>
                                    <Button
                                        size="small"
                                        onClick={() => setDeleteConfirmDialogOpen(true)}
                                        disabled={draftSaving || submittingForReview || setupSubmitted}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, color: 'error.main', fontSize: 12, alignSelf: 'center' }}
                                    >
                                        Delete Draft
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        fullWidth
                                        onClick={handleBack}
                                        disabled={infoSaving}
                                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, color: 'text.secondary', py: 1.25, fontSize: 14, border: '1px solid', borderColor: 'divider' }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleSaveInfo}
                                        disabled={infoSaving}
                                        startIcon={infoSaving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                        sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14 }}
                                    >
                                        {infoSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Global save toast */}
                <SuccessSnackbar {...saveSnackbarProps} />

                {/* Photo moderation error snackbar */}
                <Snackbar
                    open={Boolean(photoModerationError)}
                    autoHideDuration={8000}
                    onClose={clearPhotoError}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={clearPhotoError} severity="error" variant="filled" sx={{ width: '100%', fontWeight: 600 }}>
                        {photoModerationError}
                    </Alert>
                </Snackbar>

                {/* Member Menu */}
                <Menu anchorEl={memberMenuAnchor} open={Boolean(memberMenuAnchor)} onClose={handleMemberMenuClose}>
                    {selectedMember?.role === 'admin' && <MenuItem onClick={() => handleChangeRole('member')}><ListItemIcon><RemoveIcon fontSize="small" /></ListItemIcon><ListItemText>Demote to Member</ListItemText></MenuItem>}
                    {selectedMember?.role === 'member' && <MenuItem onClick={() => handleChangeRole('admin')}><ListItemIcon><ShieldIcon fontSize="small" /></ListItemIcon><ListItemText>Promote to Admin</ListItemText></MenuItem>}
                    <MenuItem onClick={handleRemoveMember}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText sx={{ color: 'error.main' }}>Remove from Team</ListItemText></MenuItem>
                </Menu>

                {/* Invite Modal */}
                <InviteTeamModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} businessId={businessId} businessName={businessName} onInviteSent={loadTeam} existingMemberIds={existingMemberIds} currentUserId={currentUserId} currentAdminCount={currentAdminCount} isOwner={isOwner} />

                {/* Transfer Ownership Dialog */}
                <Dialog open={transferDialogOpen} onClose={() => !dangerLoading && setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={800}>Transfer Ownership</Typography>
                        <IconButton onClick={() => setTransferDialogOpen(false)} disabled={dangerLoading} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select a team member to transfer ownership to. You will become an admin.</Typography>
                        <FormControl fullWidth>
                            <InputLabel>New Owner</InputLabel>
                            <Select value={transferTargetId} label="New Owner" onChange={(e) => setTransferTargetId(e.target.value)}>
                                {(teamData?.members || []).filter((m) => m.role !== 'owner').map((m) => <MenuItem key={m.user_id} value={m.user_id}>{m.user?.first_name || m.first_name} {m.user?.last_name || m.last_name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setTransferDialogOpen(false)} disabled={dangerLoading}>Cancel</Button>
                        <Button variant="contained" color="warning" onClick={handleTransferOwnership} disabled={!transferTargetId || dangerLoading}>{dangerLoading ? 'Transferring...' : 'Transfer Ownership'}</Button>
                    </DialogActions>
                </Dialog>

                {/* Name Change Request Dialog */}
                <Dialog open={nameChangeDialogOpen} onClose={() => !nameChangeSubmitting && handleCloseNameChangeDialog()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Request Name Change</Typography>
                        <IconButton onClick={handleCloseNameChangeDialog} disabled={nameChangeSubmitting} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {nameChangeSuccess ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Request Submitted!</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Your name change request has been submitted. An admin will review it shortly.</Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Your current business name is <strong>{businessName}</strong>. If you need a different name, submit a request and an admin will review it. We do this to ensure every business stays secure from imposters and remains verified!</Typography>
                                <TextField label="Requested Name" inputProps={{ autoComplete: 'new-password' }} value={requestedName} onChange={(e) => setRequestedName(e.target.value)} fullWidth sx={{ mb: 2 }} autoFocus />
                                <TextField label="Reason (optional)" inputProps={{ autoComplete: 'new-password' }} value={nameChangeReason} onChange={(e) => setNameChangeReason(e.target.value)} fullWidth multiline rows={2} placeholder="Why do you need this name change?" />
                            </>
                        )}
                    </DialogContent>
                    <Stack direction="row" spacing={1} sx={{ p: 2, pt: 0 }}>
                        {nameChangeSuccess ? (
                            <Button variant="contained" onClick={handleCloseNameChangeDialog} fullWidth sx={{ textTransform: 'none', fontWeight: 700 }}>Close</Button>
                        ) : (
                            <>
                                <Button onClick={handleCloseNameChangeDialog} disabled={nameChangeSubmitting} sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                                <Button variant="contained" onClick={handleNameChangeSubmit} disabled={!requestedName.trim() || nameChangeSubmitting} sx={{ flex: 1, textTransform: 'none', fontWeight: 700 }}>{nameChangeSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
                            </>
                        )}
                    </Stack>
                </Dialog>

                {/* Image Crop Dialog */}
                <ImageCropDialog
                    open={cropDialogOpen}
                    onClose={() => { setCropDialogOpen(false); setCropImageSrc(null); setCropType(null); }}
                    imageSrc={cropImageSrc}
                    aspect={cropType === 'avatar' ? AVATAR_ASPECT : COVER_ASPECT}
                    title={cropType === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Photo'}
                    onCropComplete={handleCropComplete}
                    outputSize={cropType === 'avatar' ? { width: 400, height: 400 } : { width: 1200, height: 400 }}
                    cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                />

                {/* Highlight Photo Crop Dialog */}
                <HighlightPhotoCropDialog
                    open={hlCropOpen}
                    imageSrc={hlCropSrc}
                    onClose={() => { setHlCropOpen(false); setHlCropSrc(null); setHlCropIdx(-1); }}
                    onCropComplete={handleHlCropComplete}
                />

                {/* User Card Popover */}
                <UserCardPopover anchorEl={userCardAnchor} onClose={handleUserCardClose} userId={userCardMember?.user_id} />

                {/* Category Change Confirmation Dialog */}
                <Dialog open={Boolean(pendingCategoryChange)} onClose={() => setPendingCategoryChange(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 0.5 }}>
                        <WarningIcon sx={{ color: 'warning.main', fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Change Category?</Typography>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size="small" onClick={() => setPendingCategoryChange(null)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                            Switching categories will <strong>remove all category-specific data</strong> including your service/offering tags, price range, {(() => {
                            const currentCfg = CATEGORY_CONFIG[infoForm.category_key];
                            const builderTitle = currentCfg?.builder?.builderTitle;
                            return builderTitle ? `${builderTitle.toLowerCase()} items, ` : '';
                        })()}and any other details you&apos;ve filled in for this category.
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 1.5, lineHeight: 1.55 }}>
                            Your business name, description, contact info, hours, photos, highlights, and owner info will <strong>not</strong> be affected.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setPendingCategoryChange(null)} variant="outlined" sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Keep Current</Button>
                        <Button onClick={confirmCategoryChange} variant="contained" color="warning" sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Switch Category</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Draft Confirmation Dialog (setup mode) */}
                {setupMode && (
                    <Dialog open={deleteConfirmDialogOpen} onClose={() => !deletingDraft && setDeleteConfirmDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 0.5 }}>
                            <WarningIcon sx={{ color: 'error.main', fontSize: 24 }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Delete Draft?</Typography>
                            <Box sx={{ flex: 1 }} />
                            <IconButton size="small" onClick={() => setDeleteConfirmDialogOpen(false)} disabled={deletingDraft}><CloseIcon /></IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                                This will permanently delete your business draft including all the information you&apos;ve entered. This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button onClick={() => setDeleteConfirmDialogOpen(false)} variant="outlined" disabled={deletingDraft} sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Keep Draft</Button>
                            <Button onClick={handleDeleteDraft} variant="contained" color="error" disabled={deletingDraft} sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                {deletingDraft ? 'Deleting...' : 'Delete Draft'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}

                {/* Rate Limit Dialog */}
                <RateLimitDialog
                    open={rateLimitOpen}
                    onClose={() => setRateLimitOpen(false)}
                    retryAfterSec={rateLimitInfo.retryAfterSec}
                    reason={rateLimitInfo.reason}
                    actionLabel={rateLimitInfo.actionLabel}
                />
            </Box>
        </ThemeProvider>
    );
}

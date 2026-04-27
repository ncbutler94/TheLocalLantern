// src/pages/business/BusinessSetupPage.jsx
/**
 * Business Setup Page - Updated Version
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, TextField, Select, MenuItem,
    FormControl, InputLabel, IconButton, Avatar, CircularProgress,
    Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControlLabel, InputAdornment, Stack, Collapse,
    ListItemIcon, ListItemText, Slider
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';
import CloseIcon from '@mui/icons-material/Close';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import LinkIcon from '@mui/icons-material/Link';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import CropIcon from '@mui/icons-material/Crop';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PublishIcon from '@mui/icons-material/Publish';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

// Category Icons
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

// Social Media Icons
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LanguageIcon from '@mui/icons-material/Language';

import Cropper from 'react-easy-crop';
import CityCountySelect from '../../../components/CityCountySelect';
import BusinessLivePreview from '../components/BusinessLivePreview';
import defaultBusinessAvatar from '../../../assets/profile/business_default_avatar.png';

// Local GeoJSON data for resolving city/county → lat/lng (same data the events & community forms use)
import cityData from '../../../data/alabamaCities.json';
import countyData from '../../../data/alabamaCounties.json';
import { secureFetch } from '../../../utils/secureFetch';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

/* ── Coordinate helpers (resolves city/county → lat/lng from local GeoJSON) ── */
const stripCountySuffix = (s) => String(s || '').replace(/ County$/i, '').trim();

function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    const calcCentroid = (rings) => {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const ring of rings) {
            if (!Array.isArray(ring)) continue;
            for (const pt of ring) {
                if (!Array.isArray(pt) || pt.length < 2) continue;
                const [pLng, pLat] = pt;
                if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;
                if (pLat < minLat) minLat = pLat;
                if (pLat > maxLat) maxLat = pLat;
                if (pLng < minLng) minLng = pLng;
                if (pLng > maxLng) maxLng = pLng;
            }
        }
        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
        return null;
    };

    if (type === 'Polygon' && Array.isArray(coordinates)) return calcCentroid(coordinates);
    if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
        const flat = coordinates.flatMap((poly) => (Array.isArray(poly) ? poly : []));
        return calcCentroid(flat);
    }
    return null;
}

function resolveLocationCoords(city, county) {
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

const safeJson = async (res) => {
    try { return await res.json(); } catch { return null; }
};

// Character limits
const LIMITS = {
    username: 40,
    description: 2000,
    websiteUrl: 255,
    phone: 20,
    email: 100,
    address: 255,
    facebookUrl: 255,
    instagramUrl: 255,
    twitterUrl: 255
};

// Crop aspect ratios
const AVATAR_ASPECT = 1;
const COVER_ASPECT = 3.5;

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

const ENTITY_TYPES = [
    { value: 'business', label: 'Business' },
    { value: 'nonprofit', label: 'Nonprofit' },
    { value: 'organization', label: 'Organization' }
];

const DEFAULT_HOURS = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = { open: '', close: '', allDay: false, closed: false };
    return acc;
}, {});

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
    other: CategoryIcon
};

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
        throw new Error(errText || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = await signedUrlRes.json();

    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file
    });

    if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
    }

    return publicUrl;
}

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

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
};

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.crossOrigin = 'anonymous';
        image.src = url;
    });

// Username validation and formatting
function sanitizeUsername(input) {
    return String(input || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        .slice(0, 40);
}

function validateUsername(value) {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 40) return 'Username must be 40 characters or less';
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 1) {
        return 'Username must start and end with a letter or number';
    }
    if (/--/.test(value)) return 'Username cannot have consecutive hyphens';
    return '';
}

function CharCounter({ value, max }) {
    const len = (value || '').length;
    const isOver = len > max;
    return (
        <Typography
            variant="caption"
            sx={{
                color: isOver ? 'error.main' : 'text.secondary',
                fontWeight: isOver ? 700 : 400
            }}
        >
            {len}/{max}
        </Typography>
    );
}

// Text input that blocks Chrome autofill
function NoAutofillTextField({ inputProps = {}, InputProps = {}, ...props }) {
    const randomName = useRef(`field_${Math.random().toString(36).slice(2, 11)}`);
    return (
        <TextField
            {...props}
            name={randomName.current}
            InputProps={InputProps}
            inputProps={{
                ...inputProps,
                autoComplete: 'one-time-code',
                'data-lpignore': 'true',
                'data-form-type': 'other',
                'data-1p-ignore': 'true',
            }}
        />
    );
}

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
        } catch (err) {
            console.error('Crop error:', err);
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
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 400 }, bgcolor: 'text.primary' }}>
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

// ─── Collapsible Form Section ─────────────
function FormSection({ title, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Box sx={{ mb: 1 }}>
            <Box
                onClick={() => setOpen((v) => !v)}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', py: 1, px: 0.5, userSelect: 'none', '&:hover': { opacity: 0.8 } }}
            >
                {open ? <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                <Typography sx={{ fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                    {title}
                </Typography>
            </Box>
            <Collapse in={open} unmountOnExit={false}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 0.5 }}>
                    {children}
                </Box>
            </Collapse>
        </Box>
    );
}

export default function BusinessSetupPage() {
    const navigate = useNavigate();
    const setupTheme = useTheme();
    const setupMobile = useMediaQuery(setupTheme.breakpoints.down('sm'));
    const [searchParams, setSearchParams] = useSearchParams();
    const [token, setToken] = useState(() => searchParams.get('token') || '');
    const pageTopRef = useRef(null);

    const categoryRef = useRef(null);
    const countyRef = useRef(null);
    const cityRef = useRef(null);
    const addressRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [invite, setInvite] = useState(null);
    const [application, setApplication] = useState(null);
    const [business, setBusiness] = useState(null);
    const [categories, setCategories] = useState([]);
    const [businessStatus, setBusinessStatus] = useState('draft'); // 'draft' | 'pending_approval' | 'published'

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [usernameChangesRemaining, setUsernameChangesRemaining] = useState(2);
    const [originalUsername, setOriginalUsername] = useState('');
    const [entityType, setEntityType] = useState('business');
    const [categoryKey, setCategoryKey] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [emailPublic, setEmailPublic] = useState('');
    const [city, setCity] = useState('');
    const [county, setCounty] = useState('');
    const [address, setAddress] = useState('');
    const [hours, setHours] = useState(DEFAULT_HOURS);

    // Map pin / geocoding state
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState('');
    const [mapPinConfirmed, setMapPinConfirmed] = useState(false);
    const [addressError, setAddressError] = useState('');

    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');

    const [avatarUrl, setAvatarUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [galleryPhotos, setGalleryPhotos] = useState([null, null, null, null, null]);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState([false, false, false, false, false]);

    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [cropType, setCropType] = useState(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    const [nameChangeDialogOpen, setNameChangeDialogOpen] = useState(false);
    const [requestedName, setRequestedName] = useState('');
    const [nameChangeReason, setNameChangeReason] = useState('');
    const [nameChangeSubmitting, setNameChangeSubmitting] = useState(false);
    const [nameChangeSuccess, setNameChangeSuccess] = useState(false);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const galleryInputRefs = useRef([]);

    const isLocationSelected = county && city && county !== 'All Counties' && city !== 'All Cities';

    // Clear address when county/city are removed
    useEffect(() => {
        if (!isLocationSelected) {
            setAddress('');
        }
    }, [isLocationSelected]);

    // Auto-resolve lat/lng from local GeoJSON whenever city or county changes
    // This ensures coordinates are always populated when a location is selected,
    // even without the user clicking "Get Map" (same pattern as events).
    useEffect(() => {
        const trimCity = String(city || '').trim();
        const trimCounty = String(county || '').trim();
        const hasCity = trimCity && trimCity !== 'All Cities';
        const hasCounty = trimCounty && trimCounty !== 'All Counties';

        if (!hasCity && !hasCounty) {
            // No location selected — clear coordinates
            setLatitude(null);
            setLongitude(null);
            setMapPinConfirmed(false);
            return;
        }

        // Only auto-resolve if the user has NOT manually confirmed a precise map pin
        // (i.e. don't overwrite a Google geocoded address-level pin)
        if (mapPinConfirmed) return;

        const coords = resolveLocationCoords(hasCity ? trimCity : '', hasCounty ? trimCounty : '');
        if (coords) {
            setLatitude(coords[0]);
            setLongitude(coords[1]);
        } else {
            setLatitude(null);
            setLongitude(null);
        }
    }, [city, county]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // If no token, auto-create a draft business and get a token
        if (!token) {
            const createDraft = async () => {
                try {
                    const res = await secureFetch(apiUrl('/api/business/create-draft'), {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ business_name: 'My Business' }),
                    });
                    const data = await safeJson(res);
                    if (!res.ok) {
                        // 404 = backend route not deployed yet
                        if (res.status === 404) {
                            setError('Business setup endpoint not found. Please ensure the backend is updated and restarted.');
                        } else if (res.status === 401) {
                            setError('Please log in to create a business page.');
                        } else {
                            setError(data?.message || `Failed to create business page (${res.status}).`);
                        }
                        setLoading(false);
                        return;
                    }
                    const newToken = data?.token || '';
                    if (!newToken) {
                        setError('Failed to initialize business setup. Please try again.');
                        setLoading(false);
                        return;
                    }
                    // Update URL with the new token (so refresh works)
                    setSearchParams({ token: newToken }, { replace: true });
                    setToken(newToken);
                } catch (err) {
                    setError(err?.message || 'Failed to create business page.');
                    setLoading(false);
                }
            };
            createDraft();
            return;
        }

        const loadInvite = async () => {
            try {
                const res = await secureFetch(apiUrl(`/api/business/invite/details?token=${encodeURIComponent(token)}`), {
                    method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }
                });
                const data = await safeJson(res);
                if (!res.ok) {
                    // Check if this is a redirect response (business already published)
                    if (data?.redirect_to) {
                        setSuccessMsg('This business has already been published. Redirecting...');
                        setTimeout(() => { navigate(data.redirect_to); }, 1500);
                        return;
                    }
                    setError(data?.message || `Failed to load invite (${res.status}).`);
                    setLoading(false);
                    return;
                }
                setInvite(data.invite);
                setApplication(data.application);
                setBusiness(data.business);
                if (data.business) {
                    setBusinessStatus(data.business.status || 'draft');
                    setName(data.business.name || '');
                    const slug = data.business.slug || '';
                    setUsername(slug);
                    setOriginalUsername(slug);
                    // Calculate remaining username changes this month
                    const changesRemaining = data.business.slug_changes_remaining ?? 2;
                    setUsernameChangesRemaining(changesRemaining);
                    setEntityType(data.business.entity_type || 'business');
                    setCategoryKey(data.business.category_key || '');
                    setDescription(data.business.description || '');
                    setWebsiteUrl(data.business.website_url || '');
                    setPhone(data.business.phone || '');
                    setEmailPublic(data.business.email_public || '');
                    setCity(data.business.city || '');
                    setCounty(data.business.county || '');
                    setAddress(data.business.address || '');
                    // Load map pin coordinates if they exist
                    if (data.business.latitude && data.business.longitude) {
                        setLatitude(data.business.latitude);
                        setLongitude(data.business.longitude);
                        // Only mark as "confirmed" if there's a street address — meaning the coords
                        // came from a real geocode, not just city-level auto-resolve
                        if (data.business.address && String(data.business.address).trim()) {
                            setMapPinConfirmed(true);
                        }
                    }
                    setAvatarUrl(data.business.avatar_url || '');
                    setCoverUrl(data.business.cover_url || '');
                    setFacebookUrl(data.business.facebook_url || '');
                    setInstagramUrl(data.business.instagram_url || '');
                    setTwitterUrl(data.business.twitter_url || '');
                    if (data.business.hours_json) {
                        try {
                            const parsedHours = typeof data.business.hours_json === 'string'
                                ? JSON.parse(data.business.hours_json)
                                : data.business.hours_json;
                            setHours({ ...DEFAULT_HOURS, ...parsedHours });
                        } catch { /* ignore */ }
                    }
                    if (data.business.gallery_json) {
                        try {
                            const parsedGallery = typeof data.business.gallery_json === 'string'
                                ? JSON.parse(data.business.gallery_json)
                                : data.business.gallery_json;
                            if (Array.isArray(parsedGallery)) {
                                const filled = parsedGallery.map((url) => (url ? { url, preview: url } : null));
                                while (filled.length < 5) filled.push(null);
                                setGalleryPhotos(filled.slice(0, 5));
                            }
                        } catch { /* ignore */ }
                    }
                }
                setLoading(false);
            } catch (err) {
                setError(err?.message || 'Failed to load invite.');
                setLoading(false);
            }
        };
        loadInvite();
    }, [token, navigate, setSearchParams]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await secureFetch(apiUrl('/api/business/categories'), {
                    method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }
                });
                const data = await safeJson(res);
                if (res.ok && data?.categories) setCategories(data.categories);
            } catch { /* ignore */ }
        };
        loadCategories();
    }, []);

    const scrollToTop = () => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToRef = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Geocoding function to Get Map coordinates
    const handleGetMapPin = async () => {
        if (!address?.trim() && !city) {
            setGeocodeError('Please enter an address or select a city.');
            return;
        }

        setGeocoding(true);
        setGeocodeError('');

        try {
            const fullAddress = city
                ? `${address || ''}, ${city}, AL`.replace(/^, /, '')
                : `${address}, Alabama`;

            const res = await secureFetch(apiUrl('/api/geocode'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: fullAddress }),
            });

            const data = await safeJson(res);

            if (res.ok && data?.lat && data?.lng) {
                // Check for state-level fallback (Alabama center)
                const isStateLevelFallback =
                    Math.abs(data.lat - 32.318) < 0.1 &&
                    Math.abs(data.lng - (-86.902)) < 0.1;

                if (isStateLevelFallback) {
                    setGeocodeError('Could not find exact location. Please check your address.');
                } else {
                    setLatitude(data.lat);
                    setLongitude(data.lng);
                    setMapPinConfirmed(false); // Reset to pending confirmation
                }
            } else {
                setGeocodeError(data?.message || 'Could not find coordinates for this address.');
            }
        } catch (err) {
            setGeocodeError('Failed to get location. Please try again.');
        }

        setGeocoding(false);
    };

    const handleConfirmMapPin = () => {
        setMapPinConfirmed(true);
    };

    const handleRemoveMapPin = () => {
        setLatitude(null);
        setLongitude(null);
        setMapPinConfirmed(false);
    };

    const expiresAt = invite?.expires_at ? new Date(invite.expires_at) : null;
    const expiresFormatted = expiresAt ? expiresAt.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : null;

    const handleAvatarClick = () => avatarInputRef.current?.click();
    const handleCoverClick = () => coverInputRef.current?.click();
    const handleGalleryClick = (index) => galleryInputRefs.current[index]?.click();

    const handleAvatarFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropType('avatar');
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCoverFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
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
        if (cropType === 'avatar') {
            const previewUrl = URL.createObjectURL(croppedBlob);
            setAvatarUrl(previewUrl);
            setUploadingAvatar(true);
            try {
                const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const gcsUrl = await uploadFileToGCS(file, 'business/avatars');
                setAvatarUrl(gcsUrl);
            } catch (err) {
                setError('Failed to upload profile photo: ' + (err?.message || 'Unknown error'));
            } finally {
                setUploadingAvatar(false);
            }
        } else if (cropType === 'cover') {
            const previewUrl = URL.createObjectURL(croppedBlob);
            setCoverUrl(previewUrl);
            setUploadingCover(true);
            try {
                const file = new File([croppedBlob], `cover_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const gcsUrl = await uploadFileToGCS(file, 'business/covers');
                setCoverUrl(gcsUrl);
            } catch (err) {
                setError('Failed to upload cover photo: ' + (err?.message || 'Unknown error'));
            } finally {
                setUploadingCover(false);
            }
        }
        setCropImageSrc(null);
        setCropType(null);
    };

    const handleGalleryChange = async (index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setGalleryPhotos((prev) => { const n = [...prev]; n[index] = { file, preview: previewUrl }; return n; });
        setUploadingGallery((prev) => { const n = [...prev]; n[index] = true; return n; });
        try {
            const gcsUrl = await uploadFileToGCS(file, 'business/gallery');
            setGalleryPhotos((prev) => { const n = [...prev]; n[index] = { url: gcsUrl, preview: gcsUrl }; return n; });
        } catch (err) {
            setError('Failed to upload gallery photo: ' + (err?.message || 'Unknown error'));
            setGalleryPhotos((prev) => { const n = [...prev]; n[index] = null; return n; });
        } finally {
            setUploadingGallery((prev) => { const n = [...prev]; n[index] = false; return n; });
        }
    };

    const handleRemoveGalleryPhoto = (index) => {
        setGalleryPhotos((prev) => { const n = [...prev]; n[index] = null; return n; });
    };

    const handleHoursChange = (dayKey, field, value) => {
        setHours((prev) => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
    };

    const handleAllDayToggle = (dayKey, checked) => {
        setHours((prev) => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], allDay: checked, closed: checked ? false : prev[dayKey].closed, open: '', close: '' }
        }));
    };

    const handleClosedToggle = (dayKey, checked) => {
        setHours((prev) => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], closed: checked, allDay: checked ? false : prev[dayKey].allDay, open: '', close: '' }
        }));
    };

    const handleNameChangeSubmit = async () => {
        if (!requestedName.trim()) return;
        setNameChangeSubmitting(true);
        try {
            const res = await secureFetch(apiUrl('/api/business/invite/request-name-change'), {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, requested_name: requestedName.trim(), reason: nameChangeReason.trim() })
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || 'Failed to submit name change request.');
            setNameChangeSuccess(true);
        } catch (err) { setError(err?.message || 'Failed to submit name change request.'); }
        finally { setNameChangeSubmitting(false); }
    };

    const handleCloseNameChangeDialog = () => {
        setNameChangeDialogOpen(false);
        setTimeout(() => { setNameChangeSuccess(false); setRequestedName(''); setNameChangeReason(''); }, 300);
    };

    const handleSaveDraft = async () => {
        setSaving(true); setError(''); setSuccessMsg(''); setAddressError('');

        // Validate username before saving
        const usernameValidationError = validateUsername(username);
        if (usernameValidationError) {
            setUsernameError(usernameValidationError);
            setError(usernameValidationError);
            setSaving(false);
            scrollToTop();
            return;
        }

        // Validate address if entered but no confirmed map pin
        const trimmedAddress = String(address || '').trim();
        let finalLat = latitude;
        let finalLng = longitude;

        if (trimmedAddress && !mapPinConfirmed) {
            const fullAddress = city
                ? `${trimmedAddress}, ${city}, AL`
                : `${trimmedAddress}, Alabama`;

            try {
                const geoRes = await secureFetch(apiUrl('/api/geocode'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: fullAddress }),
                });
                const geoData = await safeJson(geoRes);

                const isStateFallback = geoData?.lat && geoData?.lng &&
                    Math.abs(geoData.lat - 32.318) < 0.1 &&
                    Math.abs(geoData.lng - (-86.902)) < 0.1;

                if (!geoRes.ok || !geoData?.lat || !geoData?.lng || isStateFallback) {
                    setAddressError('This address could not be found. Please check it and try again.');
                    setSaving(false);
                    scrollToRef(addressRef);
                    return;
                }

                // Valid address — use geocoded coordinates
                finalLat = geoData.lat;
                finalLng = geoData.lng;
                setLatitude(geoData.lat);
                setLongitude(geoData.lng);
            } catch {
                setAddressError('Could not verify this address. Please try again.');
                setSaving(false);
                scrollToRef(addressRef);
                return;
            }
        }

        try {
            const galleryUrls = galleryPhotos.filter((p) => p && p.url).map((p) => p.url);
            const payload = {
                token, name,
                slug: username,
                entity_type: entityType, category_key: categoryKey,
                description: description.slice(0, LIMITS.description),
                website_url: websiteUrl.slice(0, LIMITS.websiteUrl),
                phone: phone.slice(0, LIMITS.phone),
                email_public: emailPublic.slice(0, LIMITS.email),
                city, county,
                address: address.slice(0, LIMITS.address),
                latitude: finalLat != null ? finalLat : null,
                longitude: finalLng != null ? finalLng : null,
                hours_json: JSON.stringify(hours),
                avatar_url: avatarUrl || null,
                cover_url: coverUrl || null,
                gallery_json: JSON.stringify(galleryUrls),
                facebook_url: facebookUrl.slice(0, LIMITS.facebookUrl) || null,
                instagram_url: instagramUrl.slice(0, LIMITS.instagramUrl) || null,
                twitter_url: twitterUrl.slice(0, LIMITS.twitterUrl) || null,
                status: 'draft'
            };
            const res = await secureFetch(apiUrl('/api/business/invite/save-draft'), {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || 'Failed to save draft.');

            // Update original username and remaining changes from response
            if (data?.business?.slug) {
                setOriginalUsername(data.business.slug);
            }
            if (typeof data?.business?.slug_changes_remaining === 'number') {
                setUsernameChangesRemaining(data.business.slug_changes_remaining);
            }

            setSuccessMsg('Draft saved successfully!');
            scrollToTop();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) { setError(err?.message || 'Failed to save draft.'); scrollToTop(); }
        finally { setSaving(false); }
    };

    const validateForPublish = () => {
        // Validate name
        if (!name || !name.trim()) {
            setError('Please enter a business name before submitting.');
            scrollToTop();
            return false;
        }
        // Validate username
        const usernameValidationError = validateUsername(username);
        if (usernameValidationError) {
            setUsernameError(usernameValidationError);
            setError(usernameValidationError);
            scrollToTop();
            return false;
        }
        if (!categoryKey) {
            scrollToRef(categoryRef);
            setError('Please select a category before publishing.');
            return false;
        }
        if (!county || county === 'All Counties') {
            scrollToRef(countyRef);
            setError('Please select a county before publishing.');
            return false;
        }
        if (!city || city === 'All Cities') {
            scrollToRef(cityRef);
            setError('Please select a city before publishing.');
            return false;
        }
        return true;
    };

    const handlePublishClick = () => {
        setError('');
        if (!validateForPublish()) return;
        setPublishDialogOpen(true);
    };

    const handlePublishConfirm = async () => {
        setPublishDialogOpen(false);
        setPublishing(true); setError(''); setSuccessMsg(''); setAddressError('');

        // Validate address if entered but no confirmed map pin
        const trimmedAddress = String(address || '').trim();
        let finalLat = latitude;
        let finalLng = longitude;

        if (trimmedAddress && !mapPinConfirmed) {
            const fullAddress = city
                ? `${trimmedAddress}, ${city}, AL`
                : `${trimmedAddress}, Alabama`;

            try {
                const geoRes = await secureFetch(apiUrl('/api/geocode'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: fullAddress }),
                });
                const geoData = await safeJson(geoRes);

                const isStateFallback = geoData?.lat && geoData?.lng &&
                    Math.abs(geoData.lat - 32.318) < 0.1 &&
                    Math.abs(geoData.lng - (-86.902)) < 0.1;

                if (!geoRes.ok || !geoData?.lat || !geoData?.lng || isStateFallback) {
                    setAddressError('This address could not be found. Please check it and try again.');
                    setPublishing(false);
                    scrollToRef(addressRef);
                    return;
                }

                finalLat = geoData.lat;
                finalLng = geoData.lng;
                setLatitude(geoData.lat);
                setLongitude(geoData.lng);
            } catch {
                setAddressError('Could not verify this address. Please try again.');
                setPublishing(false);
                scrollToRef(addressRef);
                return;
            }
        }

        try {
            const galleryUrls = galleryPhotos.filter((p) => p && p.url).map((p) => p.url);
            const payload = {
                token, name,
                slug: username,
                entity_type: entityType, category_key: categoryKey,
                description: description.slice(0, LIMITS.description),
                website_url: websiteUrl.slice(0, LIMITS.websiteUrl),
                phone: phone.slice(0, LIMITS.phone),
                email_public: emailPublic.slice(0, LIMITS.email),
                city, county,
                address: address.slice(0, LIMITS.address),
                latitude: finalLat != null ? finalLat : null,
                longitude: finalLng != null ? finalLng : null,
                hours_json: JSON.stringify(hours),
                avatar_url: avatarUrl || null,
                cover_url: coverUrl || null,
                gallery_json: JSON.stringify(galleryUrls),
                facebook_url: facebookUrl.slice(0, LIMITS.facebookUrl) || null,
                instagram_url: instagramUrl.slice(0, LIMITS.instagramUrl) || null,
                twitter_url: twitterUrl.slice(0, LIMITS.twitterUrl) || null
            };
            const res = await secureFetch(apiUrl('/api/business/invite/complete'), {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || 'Failed to submit profile for review.');
            setBusinessStatus('pending_approval');
            setSuccessMsg('Your profile has been submitted for review! It will be reviewed within 24-48 hours. You can still view your profile, but it won\'t be visible to the public until approved.');
            scrollToTop();
        } catch (err) { setError(err?.message || 'Failed to submit profile for review.'); scrollToTop(); }
        finally { setPublishing(false); }
    };

    const handleDeleteProfile = async () => {
        setDeleteDialogOpen(false);
        setDeleting(true); setError('');
        try {
            const res = await secureFetch(apiUrl('/api/business/invite/delete'), {
                method: 'DELETE', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || 'Failed to delete profile.');
            setSuccessMsg('Profile deleted successfully. Redirecting...');
            scrollToTop();
            setTimeout(() => { navigate('/'); }, 1500);
        } catch (err) { setError(err?.message || 'Failed to delete profile.'); scrollToTop(); }
        finally { setDeleting(false); }
    };

    const handleExit = () => navigate('/');

    if (loading) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>);
    }

    if (error && !invite) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, px: 2 }}>
                <Alert severity="error">{error}</Alert>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>Go Home</Button>
            </Box>
        );
    }

    const galleryCount = galleryPhotos.filter((p) => p !== null).length;
    const displayAvatarUrl = avatarUrl || defaultBusinessAvatar;

    return (
        <Box ref={pageTopRef} sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 24}px`, sm: 6 } }}>
            {/* Header bar */}
            <Box sx={{ background: (t) => `linear-gradient(135deg, ${alpha(t.palette.background.paper, 0.95)} 0%, ${alpha(t.palette.background.default, 0.95)} 100%)`, borderBottom: '1px solid', borderColor: 'divider', py: 1.25, px: { xs: 2, sm: 3 }, position: 'sticky', top: 0, zIndex: 100 }}>
                <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 200 }}>
                        <BusinessOutlinedIcon sx={{ color: 'primary.dark', fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>Set up your business profile</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {businessStatus === 'pending_approval'
                                    ? 'Your profile is being reviewed. You\'ll be notified once it\'s approved.'
                                    : 'Save a draft first — submit for review when everything looks right.'}{expiresFormatted && ` Link expires: ${expiresFormatted}`}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {businessStatus === 'pending_approval' && (
                            <Alert severity="info" sx={{ py: 0, px: 1.5, borderRadius: 99, fontWeight: 800, fontSize: 12.5, '& .MuiAlert-icon': { fontSize: 18 } }}>
                                Pending Admin Review
                            </Alert>
                        )}
                        <Button
                            variant="outlined"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={saving || publishing || deleting || businessStatus === 'pending_approval'}
                            startIcon={<DeleteOutlineIcon />}
                            sx={{ borderRadius: 99, fontWeight: 700, textTransform: 'none', borderColor: 'error.dark', color: 'error.dark', '&:hover': { borderColor: 'error.dark', bgcolor: (t) => alpha(t.palette.error.dark, 0.04) } }}
                        >
                            Delete
                        </Button>
                        <Button variant="outlined" onClick={handleSaveDraft} disabled={saving || publishing || deleting || businessStatus === 'pending_approval'} sx={{ borderRadius: 99, fontWeight: 700, textTransform: 'none', borderColor: 'primary.dark', color: 'primary.dark', '&:hover': { borderColor: 'primary.dark', bgcolor: (t) => alpha(t.palette.primary.dark, 0.04) } }}>
                            {saving ? 'Saving...' : 'Save draft'}
                        </Button>
                        <Button variant="contained" onClick={handlePublishClick} disabled={saving || publishing || deleting || businessStatus !== 'draft'} sx={{ borderRadius: 99, fontWeight: 700, textTransform: 'none', bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}>
                            {publishing ? 'Submitting...' : businessStatus === 'pending_approval' ? 'Awaiting Review' : 'Submit for Review'}
                        </Button>
                        <Button variant="outlined" onClick={handleExit} sx={{ borderRadius: 99, fontWeight: 700, textTransform: 'none', borderColor: 'divider', color: 'text.secondary' }}>Exit</Button>
                    </Box>
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3 }, mt: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
            </Box>

            {/* ── Main Content: Form + Preview ── */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: { xs: 1.5, md: 2.5 }, maxWidth: 1400, mx: 'auto' }}>

                {/* ══ LEFT: FORM ══ */}
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: '55%' }, bgcolor: 'background.paper', borderRadius: 2.5, p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>

                    <FormSection title="Cover & Profile Photos" defaultOpen>
                        {/* Cover photo */}
                        <Box
                            onClick={handleCoverClick}
                            sx={{
                                height: { xs: 140, sm: 200 },
                                bgcolor: coverUrl ? 'transparent' : 'grey.400',
                                backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                borderRadius: 2,
                                border: coverUrl ? 'none' : '2px dashed',
                                borderColor: (t) => alpha(t.palette.common.white, 0.50),
                                '&:hover': { opacity: 0.9 }
                            }}
                        >
                            {!coverUrl && (
                                <Box sx={{ textAlign: 'center', color: 'common.white' }}>
                                    <ImageOutlinedIcon sx={{ fontSize: 36, mb: 0.5, opacity: 0.9 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Click to add cover photo</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>1400 × 400 px</Typography>
                                </Box>
                            )}
                            {uploadingCover && <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.50), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: 'common.white' }} /></Box>}
                            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFileSelect} />
                        </Box>

                        {/* Avatar + Name row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box
                                onClick={handleAvatarClick}
                                sx={{
                                    width: 80, height: 80, borderRadius: '50%', bgcolor: 'grey.300',
                                    border: '3px solid #fff', boxShadow: 1,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', flexShrink: 0, position: 'relative',
                                    '&:hover': { transform: 'scale(1.02)' }
                                }}
                            >
                                <Avatar src={displayAvatarUrl} sx={{ width: '100%', height: '100%' }} imgProps={{ style: { objectFit: 'cover' } }} />
                                {!avatarUrl && (
                                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.30), borderRadius: '50%' }}>
                                        <AddPhotoAlternateOutlinedIcon sx={{ color: 'common.white', fontSize: 24 }} />
                                    </Box>
                                )}
                                {uploadingAvatar && <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.50), display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}><CircularProgress size={28} sx={{ color: 'common.white' }} /></Box>}
                                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {businessStatus === 'draft' ? (
                                    <NoAutofillTextField
                                        label="Business Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value.slice(0, 100))}
                                        fullWidth
                                        size="small"
                                        placeholder="Enter your business name"
                                        sx={{ '& .MuiInputBase-input': { fontWeight: 800, fontSize: 16 } }}
                                    />
                                ) : (
                                    <>
                                        <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{name || 'Your Business Name'}</Typography>
                                        {businessStatus === 'pending_approval' ? (
                                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700 }}>Name locked — pending admin approval</Typography>
                                        ) : (
                                            <Button size="small" onClick={() => setNameChangeDialogOpen(true)} sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.dark', p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>Request name change</Button>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Box>
                    </FormSection>

                    <FormSection title="Basics" defaultOpen>
                        <NoAutofillTextField
                            label="Username"
                            value={username}
                            onChange={(e) => { const sanitized = sanitizeUsername(e.target.value); setUsername(sanitized); setUsernameError(validateUsername(sanitized)); }}
                            fullWidth size="small"
                            error={Boolean(usernameError)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '1rem' }}>@</Typography></InputAdornment> }}
                            helperText={<Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}><Box component="span" sx={{ color: usernameError ? 'error.main' : undefined }}>{usernameError || `URL: www.LocalLantern.com/${username || 'username'}`}</Box></Box>}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <FormControl sx={{ flex: 1 }} size="small" required ref={categoryRef}>
                                <InputLabel>Category</InputLabel>
                                <Select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} label="Category"
                                        renderValue={(selected) => { if (!selected) return 'Select a category'; const cat = categories.find((c) => c.key === selected); const IconComp = BUSINESS_CATEGORY_ICON[selected] || CategoryIcon; return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconComp sx={{ fontSize: 20, color: 'primary.main' }} /><span>{cat?.label || selected}</span></Box>; }}>
                                    <MenuItem value=""><em>Select a category</em></MenuItem>
                                    {categories.map((cat) => { const IconComp = BUSINESS_CATEGORY_ICON[cat.key] || CategoryIcon; return <MenuItem key={cat.key} value={cat.key}><ListItemIcon sx={{ minWidth: 36 }}><IconComp sx={{ fontSize: 20, color: 'primary.main' }} /></ListItemIcon><ListItemText primary={cat.label} /></MenuItem>; })}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>Entity type</InputLabel>
                                <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} label="Entity type">
                                    {ENTITY_TYPES.map((et) => <MenuItem key={et.value} value={et.value}>{et.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Stack>
                        <NoAutofillTextField label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value.slice(0, LIMITS.websiteUrl))} size="small" fullWidth
                                             InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }}
                                             helperText={<CharCounter value={websiteUrl} max={LIMITS.websiteUrl} />} />
                    </FormSection>

                    <FormSection title="Location" defaultOpen>
                        <Box ref={countyRef}>
                            <Box ref={cityRef}>
                                <CityCountySelect city={city} setCity={setCity} county={county} setCounty={setCounty} includeAllOptions={false} cityRequired countyRequired emptyCityLabel="Select city" emptyCountyLabel="Select county" />
                            </Box>
                        </Box>
                        <NoAutofillTextField
                            inputRef={addressRef} label="Street Address" value={address}
                            onChange={(e) => { setAddress(e.target.value.slice(0, LIMITS.address)); if (addressError) setAddressError(''); }}
                            fullWidth size="small" disabled={!isLocationSelected}
                            placeholder={isLocationSelected ? "Enter your street address" : "Select county and city first"}
                            error={Boolean(addressError)}
                            helperText={addressError || (isLocationSelected ? <CharCounter value={address} max={LIMITS.address} /> : "Please select a county and city to enter an address")} />

                        {isLocationSelected && (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <MapOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Map Pin (optional)</Typography>
                                </Box>
                                {geocodeError && <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }} onClose={() => setGeocodeError('')}>{geocodeError}</Alert>}
                                {!latitude && !longitude && (
                                    <Button variant="outlined" size="small" onClick={handleGetMapPin} disabled={geocoding || (!address?.trim() && !city)}
                                            startIcon={geocoding ? <CircularProgress size={16} /> : <LocationOnOutlinedIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}>{geocoding ? 'Finding location...' : 'Get Map'}</Button>
                                )}
                                {latitude && longitude && !mapPinConfirmed && (
                                    <Box sx={{ border: '2px solid', borderColor: 'warning.main', borderRadius: 2, overflow: 'hidden' }}>
                                        <Box sx={{ position: 'relative', height: 140 }}>
                                            <Box component="iframe"
                                                 src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&q=${latitude},${longitude}&zoom=16`}
                                                 sx={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }} loading="lazy" title="Map preview" />
                                        </Box>
                                        <Box sx={{ p: 1, bgcolor: 'warning.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>Is this pin correct?</Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" size="small" color="error" onClick={handleRemoveMapPin} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11 }}>No, remove</Button>
                                                <Button variant="contained" size="small" onClick={handleConfirmMapPin} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 11 }}>Yes, confirm</Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                )}
                                {mapPinConfirmed && latitude && longitude && (
                                    <Box sx={{ border: '2px solid', borderColor: 'success.main', borderRadius: 2, overflow: 'hidden' }}>
                                        <Box sx={{ position: 'relative', height: 140 }}>
                                            <Box component="iframe"
                                                 src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&q=${latitude},${longitude}&zoom=16`}
                                                 sx={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }} loading="lazy" title="Map preview" />
                                            <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'success.main', color: '#fff', px: 1, py: 0.25, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                                                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Confirmed</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ p: 1, bgcolor: 'grey.50', display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button variant="outlined" size="small" color="error" onClick={handleRemoveMapPin} sx={{ textTransform: 'none', fontWeight: 600 }}>Remove Pin</Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </FormSection>

                    <FormSection title="About">
                        <NoAutofillTextField label="About / description" value={description}
                                             onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.description))}
                                             multiline rows={6} fullWidth
                                             placeholder="Tell visitors about your business, what you offer, and what makes you special..."
                                             helperText={<CharCounter value={description} max={LIMITS.description} />} />
                    </FormSection>

                    <FormSection title="Photos">
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>Click to add gallery photos ({galleryCount} / 5)</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1.5 }}>
                            {galleryPhotos.map((photo, idx) => (
                                <Box key={idx} onClick={() => !photo && !uploadingGallery[idx] && handleGalleryClick(idx)} sx={{ aspectRatio: '1', borderRadius: 2, border: '2px dashed', borderColor: photo ? 'transparent' : 'divider', bgcolor: photo ? 'transparent' : 'grey.50', cursor: photo || uploadingGallery[idx] ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', '&:hover': { borderColor: photo ? 'transparent' : 'primary.main' } }}>
                                    {photo ? (<><Box component="img" src={photo.preview || photo.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveGalleryPhoto(idx); }} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.60), color: 'common.white', '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.80) } }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton></>) : uploadingGallery[idx] ? <CircularProgress size={24} /> : (<Box sx={{ textAlign: 'center', color: 'text.secondary' }}><AddPhotoAlternateOutlinedIcon sx={{ fontSize: 20 }} /></Box>)}
                                    <input ref={(el) => (galleryInputRefs.current[idx] = el)} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleGalleryChange(idx, e)} />
                                </Box>
                            ))}
                        </Box>
                    </FormSection>

                    <FormSection title="Business Hours">
                        <Stack spacing={1.5}>
                            {DAYS_OF_WEEK.map((day) => {
                                const dayHours = hours[day.key] || { open: '', close: '', allDay: false, closed: false };
                                const showTimeInputs = !dayHours.allDay && !dayHours.closed;
                                return (
                                    <Box key={day.key} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                        <Typography sx={{ width: { xs: '100%', sm: 80 }, fontWeight: 600, color: 'text.primary', flexShrink: 0, fontSize: 13 }}>{day.label}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
                                            <FormControlLabel control={<Switch checked={dayHours.allDay} onChange={(e) => handleAllDayToggle(day.key, e.target.checked)} size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600, pl: 0.5, fontSize: 12 }}>24hr</Typography>} sx={{ mr: 0, ml: 0 }} />
                                            <FormControlLabel control={<Switch checked={dayHours.closed} onChange={(e) => handleClosedToggle(day.key, e.target.checked)} size="small" sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'error.dark' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'error.dark' } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600, pl: 0.5, fontSize: 12 }}>Closed</Typography>} sx={{ mr: 0, ml: 0 }} />
                                        </Box>
                                        {showTimeInputs && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><TextField label="Open" type="time" value={dayHours.open} onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)} size="small" sx={{ width: 120 }} InputLabelProps={{ shrink: true }} /><Typography sx={{ color: 'text.secondary', fontSize: 12 }}>to</Typography><TextField label="Close" type="time" value={dayHours.close} onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)} size="small" sx={{ width: 120 }} InputLabelProps={{ shrink: true }} /></Box>}
                                        {dayHours.allDay && <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 600, fontSize: 12 }}>Open 24 hours</Typography>}
                                        {dayHours.closed && <Typography variant="body2" sx={{ color: 'error.dark', fontWeight: 600, fontSize: 12 }}>Closed</Typography>}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </FormSection>

                    <FormSection title="Contact Information">
                        <NoAutofillTextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, LIMITS.phone))} fullWidth size="small"
                                             InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }}
                                             helperText={<CharCounter value={phone} max={LIMITS.phone} />} />
                        <NoAutofillTextField label="Public Email" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value.slice(0, LIMITS.email))} fullWidth size="small"
                                             InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }}
                                             helperText={<CharCounter value={emailPublic} max={LIMITS.email} />} />
                    </FormSection>

                    <FormSection title="Social Links">
                        <NoAutofillTextField label="Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value.slice(0, LIMITS.instagramUrl))} fullWidth size="small" placeholder="https://instagram.com/..."
                                             InputProps={{ startAdornment: <InputAdornment position="start"><InstagramIcon sx={{ fontSize: 20, color: (t) => t.custom.social.instagram }} /></InputAdornment> }}
                                             helperText={<CharCounter value={instagramUrl} max={LIMITS.instagramUrl} />} />
                        <NoAutofillTextField label="X (Twitter)" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value.slice(0, LIMITS.twitterUrl))} fullWidth size="small" placeholder="https://x.com/..."
                                             InputProps={{ startAdornment: <InputAdornment position="start"><XIcon sx={{ fontSize: 20, color: 'text.primary' }} /></InputAdornment> }}
                                             helperText={<CharCounter value={twitterUrl} max={LIMITS.twitterUrl} />} />
                        <NoAutofillTextField label="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value.slice(0, LIMITS.facebookUrl))} fullWidth size="small" placeholder="https://facebook.com/..."
                                             InputProps={{ startAdornment: <InputAdornment position="start"><FacebookIcon sx={{ fontSize: 20, color: (t) => t.custom.social.facebook }} /></InputAdornment> }}
                                             helperText={<CharCounter value={facebookUrl} max={LIMITS.facebookUrl} />} />
                    </FormSection>

                    <Box sx={{ height: 80 }} />
                </Box>

                {/* ══ RIGHT: LIVE PREVIEW ══ */}
                <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '45%' }, position: { md: 'sticky' }, top: { md: 80 }, alignSelf: { md: 'flex-start' }, maxHeight: { md: 'calc(100vh - 100px)' }, overflowY: { md: 'auto' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
                        <VisibilityRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Preview</Typography>
                    </Box>
                    <Box sx={(t) => ({ border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.15), borderRadius: 2.5, overflow: 'hidden', boxShadow: `0 8px 30px ${alpha(t.palette.common.black, 0.08)}` })}>
                        <BusinessLivePreview
                            name={name}
                            description={description}
                            avatarUrl={displayAvatarUrl}
                            coverUrl={coverUrl}
                            categoryLabel={(categories.find((c) => c.key === categoryKey) || {}).label || ''}
                            entityTypeLabel={(ENTITY_TYPES.find((o) => o.value === entityType) || {}).label || ''}
                            address={address}
                            city={city}
                            county={county}
                            phone={phone}
                            email={emailPublic}
                            websiteUrl={websiteUrl}
                            facebookUrl={facebookUrl}
                            instagramUrl={instagramUrl}
                            twitterUrl={twitterUrl}
                            hours={hours}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Image Crop Dialog */}
            <ImageCropDialog
                open={cropDialogOpen}
                onClose={() => { setCropDialogOpen(false); setCropImageSrc(null); setCropType(null); }}
                imageSrc={cropImageSrc}
                aspect={cropType === 'avatar' ? AVATAR_ASPECT : COVER_ASPECT}
                title={cropType === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Photo'}
                onCropComplete={handleCropComplete}
                outputSize={cropType === 'avatar' ? { width: 400, height: 400 } : { width: 1400, height: 400 }}
                cropShape={cropType === 'avatar' ? 'round' : 'rect'}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: 'error.dark' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Delete Profile?</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Are you sure you want to delete this business profile? This action cannot be undone. All data including photos, hours, and contact information will be permanently removed.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleDeleteProfile}
                        disabled={deleting}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'error.dark', '&:hover': { bgcolor: 'error.main' } }}
                    >
                        {deleting ? 'Deleting...' : 'Delete Profile'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Publish Confirmation Dialog */}
            <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublishIcon sx={{ color: 'primary.dark' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Submit for Review?</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                        Your business profile will be submitted for admin review. This typically takes 24-48 hours.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Once approved, your business will be visible to the public on Local Lantern. Your business name and username will be locked after approval — changes will require admin permission.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPublishDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handlePublishConfirm}
                        disabled={publishing}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
                    >
                        {publishing ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Name Change Dialog */}
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
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Your current business name is <strong>{name}</strong>. If you need a different name, submit a request and an admin will review it.</Typography>
                            <NoAutofillTextField label="Requested Name" value={requestedName} onChange={(e) => setRequestedName(e.target.value)} fullWidth sx={{ mb: 2 }} autoFocus />
                            <NoAutofillTextField label="Reason (optional)" value={nameChangeReason} onChange={(e) => setNameChangeReason(e.target.value)} fullWidth multiline rows={2} placeholder="Why do you need this name change?" />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    {nameChangeSuccess ? (
                        <Button variant="contained" onClick={handleCloseNameChangeDialog} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}>Close</Button>
                    ) : (
                        <>
                            <Button onClick={handleCloseNameChangeDialog} disabled={nameChangeSubmitting} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                            <Button variant="contained" onClick={handleNameChangeSubmit} disabled={!requestedName.trim() || nameChangeSubmitting} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}>{nameChangeSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

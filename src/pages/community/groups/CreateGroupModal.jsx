import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/groups/CreateGroupModal.jsx
/**
 * Create Group Modal — multi-step dialog for creating a new community group.
 *
 * Steps:
 *   1. Basics   (name, username, category, visibility)
 *   2. Location  (county, city)
 *   3. Details   (profile picture, cover photo w/ crop, description)
 *   4. Rules     (optional rule set)
 *
 * - Username is validated live against GET /api/groups/check-username
 * - Cover photo has a crop dialog sized to the GroupHeader banner ratio
 * - All text inputs have visible character limits
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { alpha } from '@mui/material/styles';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    ListSubheader,
    MenuItem,
    Select,
    Slider,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Add as AddIcon,
    CheckCircleOutline as AvailableIcon,
    ErrorOutline as TakenIcon,
    CropOriginal as CropIcon,
    Delete as DeleteIcon,
    ZoomIn as ZoomInIcon,
    AddPhotoAlternate as AddPhotoIcon,
    HelpOutline as QuestionIcon,
} from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import GroupsIcon from '@mui/icons-material/Groups';
import ImageIcon from '@mui/icons-material/Image';
import PlaceIcon from '@mui/icons-material/Place';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ChurchIcon from '@mui/icons-material/Church';
import PaletteIcon from '@mui/icons-material/Palette';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ForestIcon from '@mui/icons-material/Forest';
import PetsIcon from '@mui/icons-material/Pets';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpaIcon from '@mui/icons-material/Spa';

import CityCountySelect from '../../../components/CityCountySelect';
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { checkReservedUsername } from '../../../utils/reservedUsernames';

// ============================================================================
// Constants
// ============================================================================
const NAME_MAX = 50;
const USERNAME_MAX = 30;
const USERNAME_MIN = 3;
const DESCRIPTION_MAX = 5000;
const RULE_TITLE_MAX = 100;
const RULE_DESC_MAX = 500;
const MAX_RULES = 20;
const USERNAME_CHECK_DEBOUNCE_MS = 400;

const STEP_LABELS = ['Basics', 'Location', 'Details', 'Rules'];

const CONTENT_MIN_HEIGHT = 420;

const ALL_COUNTIES_VALUE = 'All Counties';
const ALL_CITIES_VALUE = 'All Cities';

/** Cover photo crop aspect ratio — matches GroupHeader banner (3.5:1 like business pages) */
const COVER_ASPECT = 3.5;

const GROUP_CATEGORY_OPTIONS = [
    { header: 'Local & Place-Based', items: ['Local Areas & Neighborhoods', 'City and Town Groups', 'County and Region Groups', 'New to the Area', 'Homeowners Associations'] },
    { header: 'Families & Life Stages', items: ['Parents & Families', 'Moms and Dads Groups', 'Homeschooling Families', 'Parenting Teens', 'New Parents', 'Seniors & Retirees', 'Caregivers'] },
    { header: 'Faith & Spiritual', items: ['Faith Communities', 'Church Small Groups', "Men's Groups", "Women's Groups", 'Young Adults Faith', 'Prayer and Devotional Groups'] },
    { header: 'Arts & Culture', items: ['Music & Performing Arts', 'Visual Arts', 'Photography', 'Crafts & Handmade', 'Makers and DIY', 'Writers & Poets', 'Book Clubs', 'Theater & Drama', 'Dance Groups'] },
    { header: 'Sports & Recreation', items: ['Sports Teams & Leagues', 'Pickleball', 'Basketball', 'Soccer', 'Baseball and Softball', 'Golf', 'Running and Walking Clubs', 'Cycling', 'Martial Arts', 'Yoga and Pilates', 'Fitness Accountability Groups'] },
    { header: 'Outdoors & Nature', items: ['Hiking & Trails', 'Camping', 'Fishing', 'Hunting', 'Kayaking and Canoeing', 'Gardening', 'Birdwatching and Wildlife', 'Conservation and Outdoor Stewardship'] },
    { header: 'Pets & Animals', items: ['Dog Owners', 'Cat Owners', 'Animal Rescue Supporters', 'Pet Training and Behavior', 'Farm Animals and Homesteading Animals'] },
    { header: 'Food & Home', items: ['Cooking & Recipes', 'BBQ & Grilling', 'Baking', 'Meal Prep', 'Home & Garden', 'Home Improvement', 'Interior Decor and DIY Home'] },
    { header: 'Learning & Skills', items: ['Language Learning', 'Tutoring and Study Groups', 'STEM and Tech Learners', 'Coding & Web Dev', 'Personal Finance & Budgeting', 'Career Growth & Networking', 'Public Speaking'] },
    { header: 'Schools & Alumni', items: ['School Parent Groups', 'High School Alumni', 'College Alumni', 'Band and Sports Boosters', 'Student Organizations'] },
    { header: 'Business & Professional', items: ['Small Business Owners & Entrepreneurs', 'Creators & Content Makers', 'Marketing and Social Media for Business', 'Trades and Contractors Network', 'Real Estate Professionals', 'Healthcare Professionals', 'Educators Network'] },
    { header: 'Cars & Machines', items: ['Car Enthusiasts', 'Truck and Offroad', 'Motorcycles', 'Classic Cars', 'DIY Auto Repair', 'RC Cars and Drones'] },
    { header: 'Gaming & Geek Culture', items: ['Video Games', 'Tabletop Games and Board Games', 'Trading Card Games', 'Anime and Pop Culture'] },
    { header: 'History & Civic Identity', items: ['Local History & Heritage', 'Genealogy and Family Roots', 'Historic Preservation', 'Museums and Archives'] },
    { header: 'Wellness & Support', items: ['Sobriety and Recovery Support', 'Mental Wellness and Mindfulness', "Men's Support Circles", "Women's Support Circles", 'Grief Support', 'Chronic Illness Community'] },
    { header: 'Clubs & Organizations', items: ['Civic Clubs', 'Fraternal and Service Organizations', 'Volunteer Teams', 'Community Project Groups'] },
    { header: 'Other', items: ['Other'] },
];

const GROUP_MAIN_ICON = {
    'Local & Place-Based': PlaceIcon,
    'Families & Life Stages': FamilyRestroomIcon,
    'Faith & Spiritual': ChurchIcon,
    'Arts & Culture': PaletteIcon,
    'Sports & Recreation': SportsSoccerIcon,
    'Outdoors & Nature': ForestIcon,
    'Pets & Animals': PetsIcon,
    'Food & Home': RestaurantIcon,
    'Learning & Skills': SchoolIcon,
    'Schools & Alumni': SchoolIcon,
    'Business & Professional': WorkIcon,
    'Cars & Machines': DirectionsCarIcon,
    'Gaming & Geek Culture': SportsEsportsIcon,
    'History & Civic Identity': AccountBalanceIcon,
    'Wellness & Support': SpaIcon,
    'Clubs & Organizations': GroupsIcon,
    Other: GroupsIcon,
};

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', description: 'Anyone can see and join', Icon: PublicIcon },
    { value: 'private', label: 'Private', description: 'Approval required to join', Icon: LockIcon },
];

// ============================================================================
// API Helpers
// ============================================================================
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

/**
 * Scan a single image File object for NSFW content via the backend.
 * Returns { safe: true } or { safe: false, message: '...' }.
 */
async function scanImageFile(file) {
    try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await secureFetch(apiUrl('/api/community/moderate-image'), {
            method: 'POST',
            credentials: 'include',
            body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn\'t meet our community guidelines.' };
            return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
        }
        if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn\'t meet our community guidelines.' };
        return { safe: true };
    } catch {
        return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
    }
}

async function uploadFileToGCS(file, folder = 'groups') {
    const signedUrlRes = await secureFetch(apiUrl('/api/uploads/signed-url'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            folder,
            fileName: file.name || `image_${Date.now()}.jpg`,
            contentType: file.type || 'image/jpeg',
        }),
    });
    if (!signedUrlRes.ok) {
        const errText = await signedUrlRes.text().catch(() => '');
        throw new Error(errText || 'Failed to get upload URL');
    }
    const { uploadUrl, publicUrl } = await signedUrlRes.json();
    const uploadRes = await secureFetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
    });
    if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
    return publicUrl;
}

// ============================================================================
// Build the category <Select> items with subheaders
// ============================================================================
function buildCategoryMenuItems() {
    const items = [];
    GROUP_CATEGORY_OPTIONS.forEach((group) => {
        const HeaderIcon = GROUP_MAIN_ICON[group.header] || GroupsIcon;
        items.push(
            <ListSubheader
                key={`header-${group.header}`}
                sx={{ fontWeight: 900, fontSize: 13, lineHeight: '32px', color: 'text.primary', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <HeaderIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                {group.header}
            </ListSubheader>
        );
        group.items.forEach((item) => {
            items.push(
                <MenuItem key={item} value={item} sx={{ fontSize: 14, pl: 4.5 }}>
                    {item}
                </MenuItem>
            );
        });
    });
    return items;
}

// ============================================================================
// Helpers
// ============================================================================
function isEffectivelyStatewide(countyVal, cityVal) {
    const c = String(countyVal || '').trim();
    const ci = String(cityVal || '').trim();
    return (!c || c === ALL_COUNTIES_VALUE) && (!ci || ci === ALL_CITIES_VALUE);
}

// ============================================================================
// Cover Photo Crop Dialog (uses react-easy-crop, same as BusinessSetupPage)
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
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
};

function ImageCropDialog({ open, onClose, imageSrc, aspect, title, onCropComplete, outputSize, cropShape = 'rect' }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((c) => setCrop(c), []);
    const onZoomChange = useCallback((z) => setZoom(z), []);

    const onCropCompleteCallback = useCallback((_croppedArea, croppedAreaPx) => {
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
            // ignore
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
        <Dialog open={open} onClose={(_, reason) => { if (reason === 'backdropClick') return; handleClose(); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CropIcon sx={{ color: 'primary.dark' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }} size="small" aria-label="Close">
                    <CloseIcon />
                </IconButton>
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
                    <Stack direction="row" spacing={2} alignItems="center">
                        <ZoomInIcon sx={{ color: 'text.secondary' }} />
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(_, z) => setZoom(z)}
                            sx={{ flex: 1, color: 'primary.dark' }}
                        />
                        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 40, textAlign: 'right' }}>
                            {Math.round(zoom * 100)}%
                        </Typography>
                    </Stack>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={processing}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3 }}
                >
                    {processing ? 'Processing...' : 'Apply Crop'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================================================
// Component
// ============================================================================
export default function CreateGroupModal({ open, onClose, onGroupCreated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    // Step state
    const [activeStep, setActiveStep] = useState(0);

    // Form fields
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [category, setCategory] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [description, setDescription] = useState('');
    const [county, setCounty] = useState('');
    const [city, setCity] = useState('');

    // Rules
    const [rules, setRules] = useState([]);

    // Join questions (optional screening questions for new members)
    const [joinQuestions, setJoinQuestions] = useState([]);

    // Image state
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Cover crop state
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [rawCoverSrc, setRawCoverSrc] = useState('');

    // Avatar crop state
    const [avatarCropDialogOpen, setAvatarCropDialogOpen] = useState(false);
    const [rawAvatarSrc, setRawAvatarSrc] = useState('');

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Username validation
    const [usernameError, setUsernameError] = useState('');
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const usernameCheckTimerRef = useRef(null);
    const usernameTouchedRef = useRef(false);

    // Group name profanity validation
    const [nameError, setNameError] = useState('');
    const nameCheckTimerRef = useRef(null);

    // Per-field profanity errors (description, rules, join questions)
    const [descriptionError, setDescriptionError] = useState('');
    const [ruleErrors, setRuleErrors] = useState({}); // { '0-title': 'msg', '1-description': 'msg' }
    const [joinQuestionErrors, setJoinQuestionErrors] = useState({}); // { '0': 'msg' }

    // Generate a username from the group name
    const generateUsername = (groupName) => {
        return groupName
            .toLowerCase()
            .replace(/[^a-z0-9\s_]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .slice(0, USERNAME_MAX);
    };

    // Reset everything when modal opens
    useEffect(() => {
        if (open) {
            setActiveStep(0);
            setName('');
            setUsername('');
            setCategory('');
            setVisibility('public');
            setDescription('');
            setCounty('');
            setCity('');
            setRules([]);
            setJoinQuestions([]);
            setAvatarFile(null);
            setAvatarPreview('');
            setCoverFile(null);
            setCoverPreview('');
            setRawCoverSrc('');
            setCropDialogOpen(false);
            setRawAvatarSrc('');
            setAvatarCropDialogOpen(false);
            setSubmitting(false);
            setError('');
            setUsernameError('');
            setNameError('');
            setDescriptionError('');
            setRuleErrors({});
            setJoinQuestionErrors({});
            setUsernameChecking(false);
            setUsernameAvailable(null);
            usernameTouchedRef.current = false;
        }
    }, [open]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (usernameCheckTimerRef.current) {
                clearTimeout(usernameCheckTimerRef.current);
            }
            if (nameCheckTimerRef.current) {
                clearTimeout(nameCheckTimerRef.current);
            }
        };
    }, []);

    // ── Username availability check (debounced) ──────────────────────────

    const checkUsernameAvailability = (value) => {
        if (usernameCheckTimerRef.current) {
            clearTimeout(usernameCheckTimerRef.current);
        }

        if (!value || value.length < USERNAME_MIN) {
            setUsernameAvailable(null);
            setUsernameChecking(false);
            return;
        }

        if (!/^[a-z0-9_]{3,30}$/.test(value)) {
            setUsernameAvailable(null);
            setUsernameChecking(false);
            return;
        }

        setUsernameChecking(true);
        setUsernameAvailable(null);

        usernameCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await secureFetch(
                    apiUrl(`/api/groups/check-username?username=${encodeURIComponent(value)}`),
                    { credentials: 'include' }
                );
                const data = await res.json();

                setUsername((current) => {
                    if (current === value) {
                        setUsernameAvailable(Boolean(data.available));
                        if (!data.available && data.message) {
                            setUsernameError(data.message);
                        } else if (data.available) {
                            setUsernameError('');
                        }
                    }
                    return current;
                });
            } catch {
                setUsernameAvailable(null);
            } finally {
                setUsernameChecking(false);
            }
        }, USERNAME_CHECK_DEBOUNCE_MS);
    };

    // ── Group name profanity check (debounced) ──────────────────────────

    const checkNameProfanity = (value) => {
        if (nameCheckTimerRef.current) {
            clearTimeout(nameCheckTimerRef.current);
        }

        if (!value || !value.trim()) {
            setNameError('');
            return;
        }

        nameCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await secureFetch(
                    apiUrl(`/api/groups/check-name?name=${encodeURIComponent(value.trim())}`),
                    { credentials: 'include' }
                );
                const data = await res.json();

                setName((current) => {
                    if (current === value && !data.allowed) {
                        setNameError(data.message || 'That name contains language that is not allowed on this platform.');
                    }
                    return current;
                });
            } catch {
                // fail open — backend will still catch it on submit
            }
        }, USERNAME_CHECK_DEBOUNCE_MS);
    };

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleUsernameChange = (value) => {
        usernameTouchedRef.current = true;
        const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, USERNAME_MAX);
        setUsername(cleaned);
        setUsernameAvailable(null);

        if (cleaned && cleaned.length < USERNAME_MIN) {
            setUsernameError(`Must be at least ${USERNAME_MIN} characters.`);
            setUsernameChecking(false);
            if (usernameCheckTimerRef.current) {
                clearTimeout(usernameCheckTimerRef.current);
            }
        } else if (cleaned && !/^[a-z0-9_]+$/.test(cleaned)) {
            setUsernameError('Lowercase letters, numbers, and underscores only.');
            setUsernameChecking(false);
        } else {
            // Reserved username check (route conflicts + personally reserved)
            const reservedResult = checkReservedUsername(cleaned);
            if (reservedResult.reserved) {
                setUsernameError(reservedResult.message);
                setUsernameChecking(false);
                setUsernameAvailable(false);
                if (usernameCheckTimerRef.current) {
                    clearTimeout(usernameCheckTimerRef.current);
                }
                return;
            }
            // Client-side profanity check on username (matches ProfileHeader)
            if (cleaned) {
                const profResult = checkFieldsProfanity({ username: cleaned });
                if (!profResult.clean) {
                    setUsernameError('Username contains inappropriate language. Please revise.');
                    setUsernameChecking(false);
                    setUsernameAvailable(false);
                    if (usernameCheckTimerRef.current) {
                        clearTimeout(usernameCheckTimerRef.current);
                    }
                    return;
                }
            }
            setUsernameError('');
            checkUsernameAvailability(cleaned);
        }
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const src = URL.createObjectURL(file);
            setRawAvatarSrc(src);
            setAvatarCropDialogOpen(true);
        }
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleAvatarCropComplete = async (blob) => {
        const croppedFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
        // NSFW moderation scan
        const scanResult = await scanImageFile(croppedFile);
        if (!scanResult.safe) {
            setError(scanResult.message);
            return;
        }
        setAvatarFile(croppedFile);
        setAvatarPreview(URL.createObjectURL(blob));
        setRawAvatarSrc('');
    };

    const handleCoverFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const src = URL.createObjectURL(file);
            setRawCoverSrc(src);
            setCropDialogOpen(true);
        }
        if (coverInputRef.current) {
            coverInputRef.current.value = '';
        }
    };

    const handleCropComplete = async (blob) => {
        const croppedFile = new File([blob], `cover_${Date.now()}.jpg`, { type: 'image/jpeg' });
        // NSFW moderation scan
        const scanResult = await scanImageFile(croppedFile);
        if (!scanResult.safe) {
            setError(scanResult.message);
            return;
        }
        setCoverFile(croppedFile);
        setCoverPreview(URL.createObjectURL(blob));
        setRawCoverSrc('');
    };

    // Drag-and-drop helper
    const handleDrop = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const src = URL.createObjectURL(file);
        if (type === 'avatar') {
            setRawAvatarSrc(src);
            setAvatarCropDialogOpen(true);
        } else {
            setRawCoverSrc(src);
            setCropDialogOpen(true);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview('');
    };

    const handleRemoveCover = () => {
        setCoverFile(null);
        setCoverPreview('');
    };

    // ── Rules handlers ────────────────────────────────────────────────────

    const handleAddRule = () => {
        if (rules.length >= MAX_RULES) return;
        setRules((prev) => [...prev, { title: '', description: '' }]);
    };

    const handleRuleChange = (index, field, value) => {
        setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const handleRemoveRule = (index) => {
        setRules((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Join question handlers ───────────────────────────────────────────

    const handleAddJoinQuestion = () => {
        if (joinQuestions.length >= 5) return;
        setJoinQuestions((prev) => [...prev, { question: '', required: false }]);
    };

    const handleJoinQuestionChange = (index, field, value) => {
        setJoinQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
    };

    const handleRemoveJoinQuestion = (index) => {
        setJoinQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Validation ────────────────────────────────────────────────────────

    const isStep1Valid = () => {
        return (
            name.trim().length > 0 &&
            !nameError &&
            username.length >= USERNAME_MIN &&
            username.length <= USERNAME_MAX &&
            !usernameError &&
            usernameAvailable === true &&
            !usernameChecking &&
            category.length > 0
        );
    };

    const canSubmit = () => isStep1Valid();

    // ── Step navigation ───────────────────────────────────────────────────

    const handleNext = () => {
        setError('');
        if (activeStep === 0 && !isStep1Valid()) {
            if (usernameChecking) {
                setError('Please wait — checking username availability.');
            } else if (usernameAvailable === false) {
                setError('That username is taken. Please choose a different one.');
            } else {
                setError('Please fill in all required fields.');
            }
            return;
        }

        // ── Step 2 (Details): check description for profanity ──
        if (activeStep === 2) {
            const descTrimmed = String(description || '').trim();
            if (descTrimmed) {
                const descResult = checkFieldsProfanity({ description: descTrimmed });
                if (!descResult.clean) {
                    setDescriptionError('Description contains inappropriate language. Please revise.');
                    return;
                }
            }
            setDescriptionError('');
        }

        // ── Step 3 (Rules & Join Questions): check all rule/question text ──
        if (activeStep === 3) {
            const newRuleErrors = {};
            const newJoinErrors = {};
            let hasError = false;

            for (let i = 0; i < rules.length; i++) {
                const titleTrimmed = String(rules[i].title || '').trim();
                const descTrimmed = String(rules[i].description || '').trim();
                if (titleTrimmed) {
                    const r = checkFieldsProfanity({ title: titleTrimmed });
                    if (!r.clean) {
                        newRuleErrors[`${i}-title`] = 'Rule title contains inappropriate language. Please revise.';
                        hasError = true;
                    }
                }
                if (descTrimmed) {
                    const r = checkFieldsProfanity({ description: descTrimmed });
                    if (!r.clean) {
                        newRuleErrors[`${i}-description`] = 'Rule description contains inappropriate language. Please revise.';
                        hasError = true;
                    }
                }
            }

            for (let i = 0; i < joinQuestions.length; i++) {
                const qTrimmed = String(joinQuestions[i].question || '').trim();
                if (qTrimmed) {
                    const r = checkFieldsProfanity({ question: qTrimmed });
                    if (!r.clean) {
                        newJoinErrors[`${i}`] = 'Question contains inappropriate language. Please revise.';
                        hasError = true;
                    }
                }
            }

            setRuleErrors(newRuleErrors);
            setJoinQuestionErrors(newJoinErrors);

            if (hasError) return;
        }

        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setError('');
        setActiveStep((prev) => prev - 1);
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!canSubmit()) {
            setError('Please complete all required fields.');
            return;
        }

        // Client-side profanity check
        const profanityResult = checkFieldsProfanity({ name: name.trim(), description: String(description || '').trim() });
        if (!profanityResult.clean) {
            if (profanityResult.field === 'description') {
                setDescriptionError('Description contains inappropriate language. Please revise.');
            } else {
                setNameError(`Your ${profanityResult.field} contains inappropriate language. Please revise.`);
            }
            setError(`Your ${profanityResult.field} contains inappropriate language. Please revise and try again.`);
            return;
        }

        // Profanity check on rules and join questions
        const newRuleErrors = {};
        const newJoinErrors = {};
        let hasContentError = false;

        for (let i = 0; i < rules.length; i++) {
            const titleTrimmed = String(rules[i].title || '').trim();
            const descTrimmed = String(rules[i].description || '').trim();
            if (titleTrimmed) {
                const r = checkFieldsProfanity({ title: titleTrimmed });
                if (!r.clean) {
                    newRuleErrors[`${i}-title`] = 'Rule title contains inappropriate language. Please revise.';
                    hasContentError = true;
                }
            }
            if (descTrimmed) {
                const r = checkFieldsProfanity({ description: descTrimmed });
                if (!r.clean) {
                    newRuleErrors[`${i}-description`] = 'Rule description contains inappropriate language. Please revise.';
                    hasContentError = true;
                }
            }
        }

        for (let i = 0; i < joinQuestions.length; i++) {
            const qTrimmed = String(joinQuestions[i].question || '').trim();
            if (qTrimmed) {
                const r = checkFieldsProfanity({ question: qTrimmed });
                if (!r.clean) {
                    newJoinErrors[`${i}`] = 'Question contains inappropriate language. Please revise.';
                    hasContentError = true;
                }
            }
        }

        if (hasContentError) {
            setRuleErrors(newRuleErrors);
            setJoinQuestionErrors(newJoinErrors);
            setError('Some fields contain inappropriate language. Please revise and try again.');
            return;
        }

        // Reserved username check (safety net at submit)
        if (username) {
            const reservedCheck = checkReservedUsername(username);
            if (reservedCheck.reserved) {
                setUsernameError(reservedCheck.message);
                setError('That username is reserved and cannot be used. Please choose a different one.');
                return;
            }
        }

        // Username profanity check (matches ProfileHeader validation)
        if (username) {
            const usernameProfanity = checkFieldsProfanity({ username });
            if (!usernameProfanity.clean) {
                setUsernameError('Username contains inappropriate language. Please revise.');
                setError('Your username contains inappropriate language. Please revise and try again.');
                return;
            }
        }

        setSubmitting(true);
        setError('');

        try {
            let imageUrl = '';
            let coverPhotoUrl = '';

            if (avatarFile) {
                imageUrl = await uploadFileToGCS(avatarFile, 'groups/avatars');
            }
            if (coverFile) {
                coverPhotoUrl = await uploadFileToGCS(coverFile, 'groups/covers');
            }

            const statewide = isEffectivelyStatewide(county, city);

            // Build rules HTML
            const validRules = rules.filter((r) => r.title.trim());
            let rulesHtml = '';
            if (validRules.length > 0) {
                rulesHtml = '<ol>' + validRules.map((r) =>
                    `<li><strong>${r.title.trim()}</strong>${r.description.trim() ? `<br/>${r.description.trim()}` : ''}</li>`
                ).join('') + '</ol>';
            }

            const payload = {
                name: name.trim(),
                groupUsername: username,
                category,
                visibility,
                description: description.trim(),
                isStatewide: statewide,
                county: statewide ? '' : county,
                city: statewide ? '' : city,
            };
            if (imageUrl) payload.imageUrl = imageUrl;
            if (coverPhotoUrl) payload.coverPhotoUrl = coverPhotoUrl;
            if (rulesHtml) {
                payload.rulesHtml = rulesHtml;
                payload.rulesText = validRules.map((r, i) => `${i + 1}. ${r.title.trim()}${r.description.trim() ? ' - ' + r.description.trim() : ''}`).join('\n');
            }

            // Join questions
            const validJoinQuestions = joinQuestions.filter((q) => q.question.trim());
            if (validJoinQuestions.length > 0) {
                payload.joinQuestions = validJoinQuestions.map((q) => ({
                    question: q.question.trim(),
                    required: Boolean(q.required),
                }));
            }

            const res = await secureFetch(apiUrl('/api/groups'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || `Request failed: ${res.status}`);
            }

            const data = await res.json();
            const newGroup = data.group || data;

            // Close modal first so parent state is cleaned up before navigation
            onClose();

            if (onGroupCreated) {
                onGroupCreated(newGroup);
            }

            // Navigate to the group page using group_username
            const groupUsername = newGroup.group_username || newGroup.groupUsername || '';
            if (groupUsername) {
                setTimeout(() => navigate(`/groups/${encodeURIComponent(groupUsername)}`), 80);
            } else if (newGroup.id) {
                setTimeout(() => navigate(`/groups/${encodeURIComponent(newGroup.id)}`), 80);
            }
        } catch (err) {
            setError(err.message || 'Failed to create group. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Username helper text + color ──────────────────────────────────────

    const getUsernameHelperProps = () => {
        if (usernameChecking) {
            return { text: 'Checking availability...', color: 'text.secondary' };
        }
        if (usernameError) {
            return { text: usernameError, color: 'error.main' };
        }
        if (usernameAvailable === true && username.length >= USERNAME_MIN) {
            return { text: 'Username is available!', color: 'success.main' };
        }
        return { text: '3–30 chars: lowercase letters, numbers, and underscores only.', color: 'text.secondary' };
    };

    const usernameHelper = getUsernameHelperProps();

    // ── Render: Step 1 — Basics ───────────────────────────────────────────

    const renderStep1 = () => (
        <Stack spacing={2.5}>
            <Box>
                <TextField
                    label="Group Name *"
                    value={name}
                    onChange={(e) => {
                        const newName = e.target.value.slice(0, NAME_MAX);
                        setName(newName);
                        setNameError('');
                        checkNameProfanity(newName);
                        if (!usernameTouchedRef.current) {
                            const generated = generateUsername(newName);
                            setUsername(generated);
                            setUsernameAvailable(null);
                            if (generated.length >= USERNAME_MIN) {
                                // Reserved username check on auto-generated username
                                const reservedResult = checkReservedUsername(generated);
                                if (reservedResult.reserved) {
                                    setUsernameError(reservedResult.message);
                                    setUsernameAvailable(false);
                                    // Check profanity on auto-generated username (matches ProfileHeader)
                                } else {
                                    const profResult = checkFieldsProfanity({ username: generated });
                                    if (!profResult.clean) {
                                        setUsernameError('Username contains inappropriate language. Please revise.');
                                        setUsernameAvailable(false);
                                    } else {
                                        setUsernameError('');
                                        checkUsernameAvailability(generated);
                                    }
                                }
                            } else {
                                setUsernameError('');
                            }
                        }
                    }}
                    disabled={submitting}
                    fullWidth
                    placeholder="Give your group a name"
                    error={Boolean(nameError)}
                    inputProps={{ maxLength: NAME_MAX }}
                />
                {nameError && (
                    <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                        {nameError}
                    </Typography>
                )}
                <Typography variant="caption" color={name.length > NAME_MAX * 0.9 ? 'warning.main' : 'text.secondary'} sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
                    {name.length}/{NAME_MAX}
                </Typography>
            </Box>

            <Box>
                <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={submitting}
                    fullWidth
                    placeholder="my_group"
                    error={Boolean(usernameError)}
                    inputProps={{ maxLength: USERNAME_MAX }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start" disablePointerEvents sx={{ mr: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 16, userSelect: 'none' }}>@</Typography>
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                {usernameChecking && (
                                    <CircularProgress size={18} />
                                )}
                                {!usernameChecking && usernameAvailable === true && username.length >= USERNAME_MIN && (
                                    <AvailableIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                                {!usernameChecking && usernameAvailable === false && (
                                    <TakenIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                )}
                            </Box>
                        ),
                    }}
                />
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5, mx: 0.5 }}>
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: usernameHelper.color }}
                    >
                        {usernameHelper.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {username.length}/{USERNAME_MAX}
                    </Typography>
                </Stack>
            </Box>

            <FormControl fullWidth disabled={submitting}>
                <InputLabel>Category *</InputLabel>
                <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label="Category *"
                    renderValue={(selected) => {
                        if (!selected) return '';
                        // Find the parent header for this category to show its icon
                        const parentGroup = GROUP_CATEGORY_OPTIONS.find((g) => g.items.includes(selected));
                        const Icon = parentGroup ? (GROUP_MAIN_ICON[parentGroup.header] || GroupsIcon) : GroupsIcon;
                        return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                                <span>{selected}</span>
                            </Box>
                        );
                    }}
                    MenuProps={{
                        PaperProps: { sx: { maxHeight: 320 } },
                    }}
                >
                    {buildCategoryMenuItems()}
                </Select>
            </FormControl>

            <Box>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    Visibility
                </Typography>
                <Stack spacing={1}>
                    {VISIBILITY_OPTIONS.map((opt) => {
                        const isSelected = visibility === opt.value;
                        return (
                            <Box
                                key={opt.value}
                                onClick={() => !submitting && setVisibility(opt.value)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1.5px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    bgcolor: isSelected ? 'primary.50' : 'transparent',
                                    cursor: submitting ? 'default' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    '&:hover': submitting ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
                                }}
                            >
                                <opt.Icon sx={{ fontSize: 22, color: isSelected ? 'primary.main' : 'text.secondary' }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700} fontSize={14}>{opt.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
        </Stack>
    );

    // ── Render: Step 2 — Location ─────────────────────────────────────────

    const renderStep2 = () => (
        <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
                Where is this group located? This helps people in your area find it.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: -1 }}>
                Leave both set to &quot;All&quot; if the group is statewide.
            </Typography>

            <CityCountySelect
                city={city}
                setCity={setCity}
                county={county}
                setCounty={setCounty}
                countyRequired={false}
                countyLabelOverride="County"
                countyError=""
            />
        </Stack>
    );

    // ── Render: Step 3 — Details ──────────────────────────────────────────

    const renderStep3 = () => (
        <Stack spacing={2.5}>
            {/* Profile picture */}
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <ImageIcon fontSize="small" />
                    <Typography fontWeight={800} fontSize={14}>Group Profile Picture</Typography>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        onClick={() => avatarInputRef.current?.click()}
                        onDrop={(e) => handleDrop(e, 'avatar')}
                        onDragOver={handleDragOver}
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '2px solid',
                            borderColor: avatarPreview ? 'divider' : (t) => alpha(t.palette.primary.main, 0.22),
                            bgcolor: avatarPreview ? 'grey.200' : (t) => alpha(t.palette.primary.main, 0.14),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 150ms ease',
                            '&:hover': { transform: 'scale(1.04)' },
                            '&:hover .photo-overlay': { opacity: 1 },
                        }}
                    >
                        {avatarPreview ? (
                            <Avatar
                                src={avatarPreview}
                                alt="Group"
                                sx={{ width: '100%', height: '100%' }}
                                imgProps={{ style: { objectFit: 'cover' } }}
                            />
                        ) : (
                            <GroupsIcon sx={(t) => ({ fontSize: 38, color: t.palette.primary.main })} />
                        )}
                        <Box
                            className="photo-overlay"
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,0,0,0.25)',
                                borderRadius: '50%',
                                opacity: 0,
                                transition: 'opacity 150ms ease',
                            }}
                        >
                            <AddPhotoIcon sx={{ color: '#fff', fontSize: 24 }} />
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                            {isMobile ? 'Tap the icon to upload.' : 'Click the icon or drag an image to upload.'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button
                                variant="contained"
                                size="small"
                                disabled={submitting}
                                onClick={() => avatarInputRef.current?.click()}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                            >
                                {avatarPreview ? 'Change' : 'Upload'}
                            </Button>
                            {avatarPreview && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={submitting}
                                    onClick={handleRemoveAvatar}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Remove
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Stack>
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarSelect}
                />
            </Box>

            {/* Cover photo */}
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <CropIcon fontSize="small" />
                    <Typography fontWeight={800} fontSize={14}>Cover Photo</Typography>
                </Stack>

                <Box
                    onClick={() => coverInputRef.current?.click()}
                    onDrop={(e) => handleDrop(e, 'cover')}
                    onDragOver={handleDragOver}
                    sx={{
                        width: '100%',
                        aspectRatio: `${COVER_ASPECT}`,
                        borderRadius: 2,
                        border: coverPreview ? 'none' : '2px dashed',
                        borderColor: (t) => alpha(t.palette.text.primary, 0.15),
                        bgcolor: (t) => coverPreview ? 'transparent' : t.palette.grey[200],
                        overflow: 'hidden',
                        backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                        cursor: 'pointer',
                        transition: 'opacity 150ms ease',
                        '&:hover': { opacity: 0.9 },
                    }}
                >
                    {!coverPreview && (
                        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            <AddPhotoIcon sx={{ fontSize: 32, mb: 0.5, opacity: 0.7 }} />
                            <Typography variant="body2" fontWeight={700}>{isMobile ? 'Tap to add cover photo' : 'Click or drag to add cover photo'}</Typography>
                        </Box>
                    )}
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                        variant="contained"
                        size="small"
                        disabled={submitting}
                        onClick={() => coverInputRef.current?.click()}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                    >
                        {coverPreview ? 'Change' : 'Upload'}
                    </Button>
                    {coverPreview && (
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={submitting}
                            onClick={handleRemoveCover}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                        >
                            Remove
                        </Button>
                    )}
                </Stack>
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleCoverFileSelect}
                />
            </Box>

            {/* Description */}
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Typography fontWeight={800} fontSize={14}>Description</Typography>
                </Stack>
                <TextField
                    label="What's this group about?"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value.slice(0, DESCRIPTION_MAX)); setDescriptionError(''); }}
                    disabled={submitting}
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={8}
                    error={Boolean(descriptionError)}
                    inputProps={{ maxLength: DESCRIPTION_MAX }}
                />
                {descriptionError && (
                    <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                        {descriptionError}
                    </Typography>
                )}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5, mx: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Optional — you can always add this later.
                    </Typography>
                    <Typography variant="caption" color={description.length > DESCRIPTION_MAX * 0.9 ? 'warning.main' : 'text.secondary'} fontWeight={700}>
                        {description.length}/{DESCRIPTION_MAX}
                    </Typography>
                </Stack>
            </Box>
        </Stack>
    );

    // ── Render: Step 4 — Rules ────────────────────────────────────────────

    const renderStep4 = () => (
        <Stack spacing={2.5}>
            <Box>
                <Typography variant="body2" color="text.secondary">
                    Set rules for your group. Members will see these on the group page.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Optional — you can always add or edit rules later.
                </Typography>
            </Box>

            {rules.map((rule, index) => (
                <Box
                    key={index}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 2,
                        bgcolor: 'background.paper',
                        position: 'relative',
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography fontWeight={800} fontSize={14}>
                            Rule {index + 1}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => handleRemoveRule(index)}
                            disabled={submitting}
                            sx={{ color: 'error.main' }}
                            aria-label={`Remove rule ${index + 1}`}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Stack spacing={1.5}>
                        <Box>
                            <TextField
                                label="Rule title"
                                value={rule.title}
                                onChange={(e) => {
                                    handleRuleChange(index, 'title', e.target.value.slice(0, RULE_TITLE_MAX));
                                    setRuleErrors((prev) => { const next = { ...prev }; delete next[`${index}-title`]; return next; });
                                }}
                                disabled={submitting}
                                fullWidth
                                size="small"
                                placeholder="e.g. Be respectful"
                                error={Boolean(ruleErrors[`${index}-title`])}
                                inputProps={{ maxLength: RULE_TITLE_MAX }}
                            />
                            {ruleErrors[`${index}-title`] && (
                                <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                                    {ruleErrors[`${index}-title`]}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
                                {rule.title.length}/{RULE_TITLE_MAX}
                            </Typography>
                        </Box>
                        <Box>
                            <TextField
                                label="Description"
                                value={rule.description}
                                onChange={(e) => {
                                    handleRuleChange(index, 'description', e.target.value.slice(0, RULE_DESC_MAX));
                                    setRuleErrors((prev) => { const next = { ...prev }; delete next[`${index}-description`]; return next; });
                                }}
                                disabled={submitting}
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                maxRows={4}
                                placeholder="Optional explanation of this rule"
                                error={Boolean(ruleErrors[`${index}-description`])}
                                inputProps={{ maxLength: RULE_DESC_MAX }}
                            />
                            {ruleErrors[`${index}-description`] && (
                                <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                                    {ruleErrors[`${index}-description`]}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
                                {rule.description.length}/{RULE_DESC_MAX}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            ))}

            {rules.length < MAX_RULES && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddRule}
                    disabled={submitting}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        borderRadius: 999,
                        borderStyle: 'dashed',
                        py: 1.25,
                    }}
                >
                    Add Rule ({rules.length}/{MAX_RULES})
                </Button>
            )}

            {/* ── Join Questions ──────────────────────────────────────────── */}
            <Divider sx={{ my: 1 }} />

            <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <QuestionIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography fontWeight={800} fontSize={15}>Join Questions</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Ask new members to answer questions before joining. Their answers will appear in the join request for admins to review.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Optional — up to 5 questions.
                </Typography>
            </Box>

            {joinQuestions.map((jq, index) => (
                <Box
                    key={index}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 2,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography fontWeight={800} fontSize={14}>
                            Question {index + 1}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => handleRemoveJoinQuestion(index)}
                            disabled={submitting}
                            sx={{ color: 'error.main' }}
                            aria-label={`Remove question ${index + 1}`}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    <TextField
                        label="Question"
                        value={jq.question}
                        onChange={(e) => {
                            handleJoinQuestionChange(index, 'question', e.target.value.slice(0, 300));
                            setJoinQuestionErrors((prev) => { const next = { ...prev }; delete next[`${index}`]; return next; });
                        }}
                        disabled={submitting}
                        fullWidth
                        size="small"
                        placeholder="e.g. Why do you want to join this group?"
                        error={Boolean(joinQuestionErrors[`${index}`])}
                        inputProps={{ maxLength: 300 }}
                    />
                    {joinQuestionErrors[`${index}`] && (
                        <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                            {joinQuestionErrors[`${index}`]}
                        </Typography>
                    )}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={jq.required}
                                    onChange={(e) => handleJoinQuestionChange(index, 'required', e.target.checked)}
                                    disabled={submitting}
                                />
                            }
                            label={<Typography variant="body2" fontWeight={600}>Required</Typography>}
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {jq.question.length}/300
                        </Typography>
                    </Stack>
                </Box>
            ))}

            {joinQuestions.length < 5 && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddJoinQuestion}
                    disabled={submitting}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        borderRadius: 999,
                        borderStyle: 'dashed',
                        py: 1.25,
                    }}
                >
                    Add Question ({joinQuestions.length}/5)
                </Button>
            )}
        </Stack>
    );

    // ── Step content renderer ─────────────────────────────────────────────

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return renderStep1();
            case 1:
                return renderStep2();
            case 2:
                return renderStep3();
            case 3:
                return renderStep4();
            default:
                return null;
        }
    };

    // ── Is current step valid? ────────────────────────────────────────────

    const isCurrentStepValid = () => {
        switch (activeStep) {
            case 0:
                return isStep1Valid();
            case 1:
                return true;
            case 2:
                return true;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const isLastStep = activeStep === STEP_LABELS.length - 1;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <>
            <Dialog
                open={open}
                onClose={(_, reason) => { if (reason === 'backdropClick') return; if (!submitting) onClose(); }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        height: isMobile ? '100%' : '85vh',
                        maxHeight: isMobile ? '100%' : '90vh',
                        overflow: 'visible',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pr: 6,
                        fontWeight: 900,
                        fontSize: { xs: 18, sm: 20 },
                    }}
                >
                    <GroupsIcon color="primary" />
                    Create Group
                    <IconButton
                        onClick={onClose}
                        disabled={submitting}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                {/* Stepper */}
                <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1 }}>
                    <Stepper activeStep={activeStep} alternativeLabel={isMobile}>
                        {STEP_LABELS.map((label) => (
                            <Step key={label}>
                                <StepLabel
                                    sx={{
                                        '& .MuiStepLabel-label': {
                                            fontWeight: 700,
                                            fontSize: 13,
                                        },
                                    }}
                                >
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                <DialogContent
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        overflowY: 'auto',
                        overflowX: 'visible',
                        flex: 1,
                    }}
                >
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {renderStepContent()}
                </DialogContent>

                <Divider />

                <DialogActions
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        onClick={activeStep === 0 ? onClose : handleBack}
                        disabled={submitting}
                        startIcon={activeStep > 0 ? <ArrowBackIcon /> : undefined}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {activeStep === 0 ? 'Cancel' : 'Back'}
                    </Button>

                    {isLastStep ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting || !canSubmit()}
                            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 3,
                            }}
                        >
                            {submitting ? 'Creating...' : 'Create Group'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!isCurrentStepValid()}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 3,
                            }}
                        >
                            Next
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Cover Photo Crop Dialog */}
            <ImageCropDialog
                open={cropDialogOpen}
                onClose={() => { setCropDialogOpen(false); setRawCoverSrc(''); }}
                imageSrc={rawCoverSrc}
                aspect={COVER_ASPECT}
                title="Crop Cover Photo"
                outputSize={{ width: 1400, height: Math.round(1400 / COVER_ASPECT) }}
                onCropComplete={handleCropComplete}
            />

            {/* Avatar Crop Dialog */}
            <ImageCropDialog
                open={avatarCropDialogOpen}
                onClose={() => { setAvatarCropDialogOpen(false); setRawAvatarSrc(''); }}
                imageSrc={rawAvatarSrc}
                aspect={1}
                title="Crop Profile Picture"
                outputSize={{ width: 400, height: 400 }}
                cropShape="round"
                onCropComplete={handleAvatarCropComplete}
            />
        </>
    );
}

// src/pages/community/groups/admin/GroupAdminPage.jsx
/**
 * Group Admin Page — layout matches BusinessAdminPage
 * Desktop: Sidebar (260px) + main content area
 * Mobile: Compact sticky header + scrollable tabs
 */

import { secureFetch } from '../../../../utils/secureFetch';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    ButtonBase,
    Checkbox,
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
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Slider,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Close as CloseIcon,
    Person as ProfileIcon,
    Gavel as RulesIcon,
    Group as MembersIcon,
    Settings as SettingsIcon,
    Image as ImageIcon,
    Delete as DeleteIcon,
    Star as OwnerIcon,
    Shield as ShieldIcon,
    Warning as WarningIcon,
    Check as CheckIcon,
    PersonRemove as RemoveIcon,
    Search as SearchIcon,
    SwapHoriz as TransferIcon,
    Visibility as VisibilityIcon,
    Lock as LockIcon,
    Public as PublicIcon,
    HourglassEmpty as PendingIcon,
    Refresh as RefreshIcon,
    PersonAdd as InviteIcon,
    Link as LinkIcon,
    ContentCopy as CopyIcon,
    Block as BanIcon,
    Timer as TimeoutIcon,
    MoreVert as MoreIcon,
    Send as SendIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    AddPhotoAlternate as AddPhotoIcon,
    CropOriginal as CropIcon,
    ZoomIn as ZoomInIcon,
    Report as ReportIcon,
    HelpOutline as QuestionIcon,
    ExpandMore as ExpandMoreIcon,
    QuestionAnswer as QuestionAnswerIcon,
    CheckCircleOutline as AvailableIcon,
    ErrorOutline as TakenIcon,
} from '@mui/icons-material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PersonIcon from '@mui/icons-material/Person';

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
import Cropper from 'react-easy-crop';
import { alpha } from '@mui/material/styles';

import NotFound from '../../../NotFound';
import { useActiveAccount } from '../../../../components/AccountContext';
import ContentFadeIn from '../../../../components/ContentFadeIn';
import SmartMenu from '../../../../components/SmartMenu';
import CityCountySelect from '../../../../components/CityCountySelect';
import GroupAdminReportedPostsSection from './components/GroupAdminReportedPostsSection';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../../components/SuccessSnackbar';
import { checkFieldsProfanity } from '../../../../utils/profanityCheck';

// ============================================================================
// Constants
// ============================================================================
const TABS = {
    PROFILE: 0,
    RULES: 1,
    MEMBERS: 2,
    REPORTED_POSTS: 3,
    SETTINGS: 4,
};

const TAB_CONFIG = [
    { key: TABS.PROFILE, label: 'Profile', icon: <ProfileIcon /> },
    { key: TABS.RULES, label: 'Rules', icon: <RulesIcon /> },
    { key: TABS.MEMBERS, label: 'Members', icon: <MembersIcon /> },
    { key: TABS.REPORTED_POSTS, label: 'Reported', icon: <ReportIcon /> },
    { key: TABS.SETTINGS, label: 'Settings', icon: <SettingsIcon /> },
];

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', moderator: 'Moderator', member: 'Member' };
const ROLE_COLORS = { owner: 'warning', admin: 'primary', moderator: 'info', member: 'default' };

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', description: 'Anyone can see and join', icon: PublicIcon },
    { value: 'private', label: 'Private', description: 'Only members can see posts, approval required to join', icon: LockIcon },
];

const TIMEOUT_DURATION_OPTIONS = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 60, label: '1 hour' },
    { value: 360, label: '6 hours' },
    { value: 1440, label: '24 hours' },
    { value: 4320, label: '3 days' },
    { value: 10080, label: '1 week' },
];

const RULE_TITLE_MAX = 100;
const RULE_DESC_MAX = 500;
const MAX_RULES = 20;
const NAME_MAX = 50;
const USERNAME_MAX = 30;
const USERNAME_MIN = 3;
const DESCRIPTION_MAX = 5000;
const USERNAME_CHECK_DEBOUNCE_MS = 400;

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

/** Parse rules_html back into [{title, description}] */
function parseRulesHtml(html) {
    if (!html || typeof html !== 'string') return [];
    const rules = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = liRegex.exec(html)) !== null) {
        const inner = match[1];
        const strongMatch = inner.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
        const title = strongMatch ? strongMatch[1].replace(/<[^>]*>/g, '').trim() : inner.replace(/<[^>]*>/g, '').trim();
        let description = '';
        if (strongMatch) {
            const afterStrong = inner.slice(inner.indexOf('</strong>') + 9);
            description = afterStrong.replace(/<br\s*\/?>/gi, '').replace(/<[^>]*>/g, '').trim();
        }
        if (title) rules.push({ title, description });
    }
    // Fallback: if no <li> tags found, try splitting by newlines (plain text rules)
    if (rules.length === 0 && html.replace(/<[^>]*>/g, '').trim()) {
        const plain = html.replace(/<[^>]*>/g, '').trim();
        const lines = plain.split(/\n+/).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
        lines.forEach(line => {
            const dashIdx = line.indexOf(' - ');
            if (dashIdx > 0) {
                rules.push({ title: line.slice(0, dashIdx).trim(), description: line.slice(dashIdx + 3).trim() });
            } else {
                rules.push({ title: line, description: '' });
            }
        });
    }
    return rules;
}

/** Build rules_html from [{title, description}] */
function buildRulesHtml(rules) {
    const valid = rules.filter(r => r.title.trim());
    if (valid.length === 0) return '';
    return '<ol>' + valid.map(r =>
        `<li><strong>${r.title.trim()}</strong>${r.description.trim() ? `<br/>${r.description.trim()}` : ''}</li>`
    ).join('') + '</ol>';
}

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

// ============================================================================
// API Helpers
// ============================================================================

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

async function apiFetch(path, options = {}) {
    const res = await secureFetch(apiUrl(path), {
        credentials: 'include',
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Request failed: ${res.status}`);
    }
    return res.json();
}

async function uploadFileToGCS(file, folder = 'groups') {
    const signedUrlRes = await secureFetch(apiUrl('/api/uploads/signed-url'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, fileName: file.name || `image_${Date.now()}.jpg`, contentType: file.type || 'image/jpeg' }),
    });
    if (!signedUrlRes.ok) { const errText = await signedUrlRes.text().catch(() => ''); throw new Error(errText || 'Failed to get upload URL'); }
    const { uploadUrl, publicUrl } = await signedUrlRes.json();
    // Note: GCS PUT upload doesn't need CSRF (it's a direct-to-storage call with a signed URL)
    const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
    if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
    return publicUrl;
}

// ============================================================================
// Image Crop Helpers (matches CreateGroupModal)
// ============================================================================
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const COVER_ASPECT = 3.5;

function isAllowedImageFile(file) {
    const t = String(file?.type || '').toLowerCase();
    return ['image/jpeg', 'image/png', 'image/webp'].includes(t);
}

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
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, outputWidth, outputHeight
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
            const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels, outputSize.width, outputSize.height);
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
// Default image helpers (matches GroupsList + UserCardPopover patterns)
// ============================================================================
function getGroupPhotoSrc(group) {
    return group?.image_url || group?.imageUrl || group?.photo_url || group?.photoUrl || group?.group_photo_url || group?.groupPhotoUrl || '';
}

function hasCustomGroupPhoto(group) {
    return Boolean(getGroupPhotoSrc(group));
}

function hasValidUserAvatar(url) {
    if (!url) return false;
    if (url.includes('default_avatar') || url.includes('default_business') || url.includes('default_logo')) return false;
    return true;
}

function getUserAvatarUrl(user) {
    return user?.avatar_url || user?.avatarUrl || user?.profile_picture || '';
}

/** Renders a group default icon (matching GroupsList.jsx) */
function GroupDefaultAvatar({ size = 44, iconSize = 22, sx = {} }) {
    return (
        <Box sx={(t) => ({
            width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(t.palette.primary.main, 0.14), border: '2px solid', borderColor: alpha(t.palette.primary.main, 0.22),
            flexShrink: 0, ...sx,
        })}>
            <GroupsIcon sx={(t) => ({ fontSize: iconSize, color: t.palette.primary.main })} />
        </Box>
    );
}

/** Renders a user default icon (matching UserCardPopover) */
function UserDefaultAvatar({ size = 40, iconSize = 24, sx = {} }) {
    return (
        <Avatar sx={(t) => ({
            width: size, height: size,
            bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main,
            ...sx,
        })}>
            <PersonRoundedIcon sx={{ fontSize: iconSize }} />
        </Avatar>
    );
}

// ============================================================================
// Helper Components
// ============================================================================
function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return <Box>{children}</Box>;
}

function getRoleChipStyles(t, roleKey) {
    if (roleKey === 'owner') {
        return {
            background: `linear-gradient(135deg, ${t.palette.secondary.main} 0%, ${t.palette.secondary.dark} 100%)`,
            boxShadow: `0 2px 8px ${alpha(t.palette.secondary.main, 0.28)}`,
        };
    }
    if (roleKey === 'admin') {
        return {
            background: `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.28)}`,
        };
    }
    if (roleKey === 'moderator') {
        return {
            background: `linear-gradient(135deg, ${t.palette.info.main} 0%, ${t.palette.info.dark} 100%)`,
            boxShadow: `0 2px 8px ${alpha(t.palette.info.main, 0.22)}`,
        };
    }
    // member (default)
    return {
        background: `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`,
        boxShadow: `0 2px 8px ${alpha(t.palette.success.main, 0.22)}`,
    };
}

function RoleChip({ role, size = 'small' }) {
    const r = String(role || '').toLowerCase();
    const label = ROLE_LABELS[r] || 'Member';
    const icon = r === 'owner'
        ? <OwnerIcon sx={{ fontSize: 13 }} />
        : r === 'admin'
            ? <ShieldIcon sx={{ fontSize: 13 }} />
            : <PersonIcon sx={{ fontSize: 13 }} />;
    return (
        <Chip
            label={label}
            size={size}
            icon={icon}
            sx={(t) => ({
                height: 22,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 11,
                color: 'common.white',
                border: 'none',
                ...getRoleChipStyles(t, r),
                '& .MuiChip-label': { px: 0.75 },
                '& .MuiChip-icon': { color: 'common.white', ml: 0.5 },
            })}
        />
    );
}

function SectionHeader({ icon, title, subtitle, action, noDivider }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: subtitle ? 0.5 : 0 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    {icon && <Box sx={(t) => ({ color: 'primary.main', display: 'flex', p: 0.5, borderRadius: 1.5, bgcolor: alpha(t.palette.primary.main, 0.08) })}>{icon}</Box>}
                    <Typography variant="subtitle1" fontWeight={850} sx={{ fontSize: 16 }}>{title}</Typography>
                </Stack>
                {action}
            </Stack>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ ml: icon ? 5.5 : 0, fontWeight: 500 }}>{subtitle}</Typography>}
            {!noDivider && <Divider sx={{ mt: 1.5 }} />}
        </Box>
    );
}

function GroupSideNavItem({ icon, label, active, onClick }) {
    return (
        <ButtonBase onClick={onClick}
                    sx={(t) => ({
                        display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', px: 2, py: 1.25, borderRadius: 2.5,
                        textAlign: 'left', justifyContent: 'flex-start',
                        bgcolor: active ? 'primary.main' : 'transparent',
                        color: active ? 'common.white' : 'text.primary',
                        fontWeight: active ? 800 : 650, fontSize: 14,
                        transition: 'all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        boxShadow: active ? `0 2px 8px ${alpha(t.palette.primary.main, 0.25)}` : 'none',
                        '&:hover': {
                            bgcolor: active ? 'primary.main' : alpha(t.palette.primary.main, 0.08),
                            transform: active ? 'none' : 'translateX(2px)',
                        },
                    })}>
            <Box sx={{ display: 'flex', alignItems: 'center', '& .MuiSvgIcon-root': { fontSize: 20, opacity: active ? 1 : 0.7 } }}>{icon}</Box>
            <Typography sx={{ fontSize: 14, fontWeight: 'inherit', lineHeight: 1.3 }}>{label}</Typography>
        </ButtonBase>
    );
}

// ============================================================================
// Main Component
// ============================================================================
export default function GroupAdminPage({ groupUsername } = {}) {
    const { groupId: routeGroupId } = useParams();
    const groupIdParam = groupUsername || routeGroupId;
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const contentRef = useRef(null);
    const { isBusinessAccount, isArtistAccount } = useActiveAccount();
    const isOnPersonalAccount = !isBusinessAccount && !isArtistAccount;

    // State
    const [group, setGroup] = useState(null);
    const [viewerMembershipRaw, setViewerMembershipRaw] = useState(null);
    const viewerMembership = isOnPersonalAccount ? viewerMembershipRaw : null;
    const [groupLoading, setGroupLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        // If navigated from a notification with adminTab, start on that tab
        const tabMap = { profile: TABS.PROFILE, rules: TABS.RULES, members: TABS.MEMBERS, reported_posts: TABS.REPORTED_POSTS, settings: TABS.SETTINGS };
        const requested = String(location?.state?.adminTab || '').toLowerCase();
        return tabMap[requested] ?? TABS.PROFILE;
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Profile form
    const [profileForm, setProfileForm] = useState({ name: '', username: '', description: '', category: '', is_statewide: false, county: '', city: '' });
    const [profileChanged, setProfileChanged] = useState(false);

    // Username validation (matches CreateGroupModal)
    const [usernameError, setUsernameError] = useState('');
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const usernameCheckTimerRef = useRef(null);
    const originalUsernameRef = useRef('');

    // Group name profanity validation
    const [nameError, setNameError] = useState('');
    const nameCheckTimerRef = useRef(null);

    // Description profanity validation
    const [descriptionError, setDescriptionError] = useState('');
    const descriptionCheckTimerRef = useRef(null);

    // Photos
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [coverRemoved, setCoverRemoved] = useState(false);    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Profile crop dialog
    const [avatarCropDialogOpen, setAvatarCropDialogOpen] = useState(false);
    const [rawAvatarSrc, setRawAvatarSrc] = useState('');

    // Cover crop dialog
    const [coverCropDialogOpen, setCoverCropDialogOpen] = useState(false);
    const [rawCoverSrc, setRawCoverSrc] = useState('');

    // Invite members dialog
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteDialogSearch, setInviteDialogSearch] = useState('');
    const [inviteDialogResults, setInviteDialogResults] = useState([]);
    const [inviteDialogSearching, setInviteDialogSearching] = useState(false);
    const [inviteSentIds, setInviteSentIds] = useState(new Set());

    // Rules
    const [rules, setRules] = useState([]);
    const [rulesChanged, setRulesChanged] = useState(false);

    // Join questions
    const [joinQuestions, setJoinQuestions] = useState([]);
    const [joinQuestionsChanged, setJoinQuestionsChanged] = useState(false);

    // Members
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberFilter, setMemberFilter] = useState('all');
    const [joinRequests, setJoinRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    // Invite members (pending invites kept for display)
    const [pendingInvites, setPendingInvites] = useState([]);

    // Moderation
    const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
    const [moderationTarget, setModerationTarget] = useState(null);
    const [moderationAction, setModerationAction] = useState('timeout');
    const [moderationDuration, setModerationDuration] = useState(60);
    const [moderationReason, setModerationReason] = useState('');
    const [moderationBusy, setModerationBusy] = useState(false);

    // Settings
    const [settingsForm, setSettingsForm] = useState({ visibility: 'public' });
    const [settingsChanged, setSettingsChanged] = useState(false);

    // Delete/Transfer
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
    const [noAdminsDialogOpen, setNoAdminsDialogOpen] = useState(false);

    // Member menu
    const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
    const [memberMenuTarget, setMemberMenuTarget] = useState(null);

    // Track which member rows have their answers expanded
    const [expandedAnswers, setExpandedAnswers] = useState(new Set());

    // Admin limit popup
    const [adminLimitDialogOpen, setAdminLimitDialogOpen] = useState(false);

    // Derived — always prefer the resolved numeric ID for API calls
    const groupId = group?.id || null;
    const groupName = String(group?.name || 'Group').trim();
    const displayAvatarSrc = avatarPreview || getGroupPhotoSrc(group);
    const hasGroupPhoto = Boolean(displayAvatarSrc);
    const viewerRole = String(viewerMembership?.role || '').toLowerCase();
    const viewerUserId = viewerMembership?.user_id ?? viewerMembership?.userId ?? viewerMembership?.id ?? null;
    const ownerUserId = group?.owner_user_id ?? group?.ownerUserId ?? group?.created_by_user_id ?? group?.createdByUserId ?? null;
    const isOwner = viewerRole === 'owner' || (viewerUserId != null && ownerUserId != null && String(viewerUserId) === String(ownerUserId));
    const isAdmin = isOwner || viewerRole === 'admin';
    const isPrivate = String(group?.visibility || '').toLowerCase() === 'private';
    const hasJoinQuestions = (() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return false;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) && parsed.length > 0;
        } catch { return false; }
    })();
    const showJoinRequests = isPrivate || hasJoinQuestions;
    const memberCount = Number(group?.member_count ?? group?.memberCount ?? 0);

    // Stable ref so loadGroup always uses the latest numeric ID for reloads
    const groupIdRef = useRef(null);
    useEffect(() => { groupIdRef.current = groupId; }, [groupId]);

    // Load group — uses numeric ID for reloads, falls back to URL param for initial load
    const loadGroup = useCallback(async () => {
        const fetchId = groupIdRef.current || groupIdParam;
        if (!fetchId) return;
        setGroupLoading(true);
        try {
            const data = await apiFetch(`/api/groups/${encodeURIComponent(String(fetchId))}`);
            setGroup(data.group || data);
            setViewerMembershipRaw(data.viewerMembership || data.membership || data.viewer_membership || null);
        } catch (err) { setError(err.message || 'Failed to load group'); }
        finally { setGroupLoading(false); }
    }, [groupIdParam]);

    useEffect(() => { loadGroup(); }, [loadGroup]);

    // Cleanup debounce timers on unmount
    useEffect(() => {
        return () => {
            if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
            if (nameCheckTimerRef.current) clearTimeout(nameCheckTimerRef.current);
            if (descriptionCheckTimerRef.current) clearTimeout(descriptionCheckTimerRef.current);
        };
    }, []);

    // Init form
    useEffect(() => {
        if (group) {
            const origUsername = group.group_username || group.username || '';
            originalUsernameRef.current = origUsername;
            setProfileForm({
                name: group.name || '', username: origUsername,
                description: group.description || '', category: group.category || '',
                is_statewide: Boolean(group.is_statewide || group.isStatewide),
                county: group.county || '', city: group.city || '',
            });
            setUsernameError('');
            setUsernameAvailable(null);
            setUsernameChecking(false);
            setNameError('');
            setDescriptionError('');
            setRules(parseRulesHtml(group.rules_html || group.rules_text || group.rulesText || group.rules || ''));
            // Parse join questions JSON
            try {
                const jqRaw = group.join_questions_json || group.joinQuestionsJson || '';
                const jqArr = jqRaw ? (typeof jqRaw === 'string' ? JSON.parse(jqRaw) : jqRaw) : [];
                setJoinQuestions(Array.isArray(jqArr) ? jqArr.map(q => ({ question: q.question || q.text || '', required: Boolean(q.required) })) : []);
            } catch { setJoinQuestions([]); }
            setAvatarPreview(group.image_url || group.imageUrl || group.photo_url || '');
            setCoverPreview(group.cover_photo_url || group.coverPhotoUrl || '');
            setAvatarRemoved(false);
            setCoverRemoved(false);
            setSettingsForm({ visibility: group.visibility || 'public' });
            setProfileChanged(false); setRulesChanged(false); setJoinQuestionsChanged(false); setSettingsChanged(false);
        }
    }, [group]);

    useEffect(() => {
        setError('');
        // Scroll to top — try window first, then walk up to find scrollable parent
        window.scrollTo(0, 0);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
            // Also scroll the nearest scrollable ancestor (app shell, etc.)
            let el = contentRef.current.parentElement;
            while (el) {
                if (el.scrollTop > 0) { el.scrollTop = 0; }
                el = el.parentElement;
            }
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === TABS.MEMBERS && groupId) {
            loadMembers(); loadPendingInvites();
            if (showJoinRequests) loadJoinRequests();
        }
    }, [activeTab, groupId, showJoinRequests]);

    // API functions — groupId is null until the group loads; guard all calls
    const loadMembers = async () => {
        if (!groupId) return;
        setMembersLoading(true);
        try { const data = await apiFetch(`/api/groups/${groupId}/admin/members?limit=200`); setMembers(data.members || data.items || []); }
        catch (err) { setError(err.message || 'Failed to load members'); }
        finally { setMembersLoading(false); }
    };
    const loadJoinRequests = async () => {
        if (!groupId) return;
        setRequestsLoading(true);
        try { const data = await apiFetch(`/api/groups/${groupId}/admin/requests`); setJoinRequests(data.requests || data.items || []); }
        catch { setJoinRequests([]); } finally { setRequestsLoading(false); }
    };
    const loadPendingInvites = async () => {
        if (!groupId) return;
        try { const data = await apiFetch(`/api/groups/${groupId}/invites?status=pending`); setPendingInvites(data.invites || data.items || []); }
        catch { setPendingInvites([]); }
    };

    const handleCancelInvite = async (inviteId) => {
        setError('');
        try { await apiFetch(`/api/groups/${groupId}/admin/invites/${inviteId}/revoke`, { method: 'POST' }); showSuccess('Invite cancelled.'); loadPendingInvites(); }
        catch (err) { setError(err.message || 'Failed to cancel invite'); }
    };

    const handleOpenModeration = (member, action) => { setModerationTarget(member); setModerationAction(action); setModerationDuration(action === 'timeout' ? 60 : 0); setModerationReason(''); setModerationDialogOpen(true); };
    const handleExecuteModeration = async () => {
        if (!moderationTarget) return;
        setModerationBusy(true); setError('');
        const userId = moderationTarget.user_id || moderationTarget.userId || moderationTarget.user?.id;
        try {
            await apiFetch(`/api/groups/${groupId}/admin/members/${userId}/action`, { method: 'POST', body: JSON.stringify({ action: moderationAction, duration_minutes: moderationAction === 'timeout' ? moderationDuration : null, reason: moderationReason || null }) });
            const labels = { timeout: 'Member timed out', ban: 'Member banned', kick: 'Member removed', untimeout: 'Timeout removed', unban: 'Ban removed' };
            showSuccess(labels[moderationAction] || 'Action completed'); setModerationDialogOpen(false); loadMembers(); loadGroup();
        } catch (err) { setError(err.message || 'Failed to execute moderation action'); } finally { setModerationBusy(false); }
    };

    // Form handlers
    const handleProfileChange = (field, value) => { setProfileForm(prev => ({ ...prev, [field]: value })); setProfileChanged(true); };
    const handleSettingsChange = (field, value) => { setSettingsForm(prev => ({ ...prev, [field]: value })); setSettingsChanged(true); };

    // ── Username availability check (debounced, matches CreateGroupModal) ──
    const checkUsernameAvailability = (value) => {
        if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
        if (!value || value.length < USERNAME_MIN) { setUsernameAvailable(null); setUsernameChecking(false); return; }
        if (!/^[a-z0-9_]{3,30}$/.test(value)) { setUsernameAvailable(null); setUsernameChecking(false); return; }
        // If unchanged from original, skip the check
        if (value === originalUsernameRef.current) { setUsernameAvailable(true); setUsernameError(''); setUsernameChecking(false); return; }
        setUsernameChecking(true);
        setUsernameAvailable(null);
        usernameCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await secureFetch(apiUrl(`/api/groups/check-username?username=${encodeURIComponent(value)}`), { credentials: 'include' });
                const data = await res.json();
                setProfileForm(current => {
                    if (current.username === value) {
                        setUsernameAvailable(Boolean(data.available));
                        if (!data.available && data.message) setUsernameError(data.message);
                        else if (data.available) setUsernameError('');
                    }
                    return current;
                });
            } catch { setUsernameAvailable(null); }
            finally { setUsernameChecking(false); }
        }, USERNAME_CHECK_DEBOUNCE_MS);
    };

    const handleUsernameChange = (value) => {
        const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, USERNAME_MAX);
        handleProfileChange('username', cleaned);
        setUsernameAvailable(null);
        if (cleaned && cleaned.length < USERNAME_MIN) {
            setUsernameError(`Must be at least ${USERNAME_MIN} characters.`);
            setUsernameChecking(false);
            if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
        } else if (cleaned && !/^[a-z0-9_]+$/.test(cleaned)) {
            setUsernameError('Lowercase letters, numbers, and underscores only.');
            setUsernameChecking(false);
        } else {
            setUsernameError('');
            checkUsernameAvailability(cleaned);
        }
    };

    // ── Group name profanity check (debounced, matches CreateGroupModal) ──
    const checkNameProfanity = (value) => {
        if (nameCheckTimerRef.current) clearTimeout(nameCheckTimerRef.current);
        if (!value || !value.trim()) { setNameError(''); return; }
        nameCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await secureFetch(apiUrl(`/api/groups/check-name?name=${encodeURIComponent(value.trim())}`), { credentials: 'include' });
                const data = await res.json();
                setProfileForm(current => {
                    if (current.name === value && !data.allowed) {
                        setNameError(data.message || 'That name contains language that is not allowed on this platform.');
                    }
                    return current;
                });
            } catch { /* fail open */ }
        }, USERNAME_CHECK_DEBOUNCE_MS);
    };

    const handleNameChange = (value) => {
        const trimmed = value.slice(0, NAME_MAX);
        handleProfileChange('name', trimmed);
        setNameError('');
        checkNameProfanity(trimmed);
    };

    // ── Description profanity check (debounced) ──
    const checkDescriptionProfanity = (value) => {
        if (descriptionCheckTimerRef.current) clearTimeout(descriptionCheckTimerRef.current);
        if (!value || !value.trim()) { setDescriptionError(''); return; }
        descriptionCheckTimerRef.current = setTimeout(() => {
            const result = checkFieldsProfanity({ description: value.trim() });
            if (!result.clean) {
                setDescriptionError('Description contains inappropriate language. Please revise.');
            } else {
                setDescriptionError('');
            }
        }, USERNAME_CHECK_DEBOUNCE_MS);
    };

    const handleDescriptionChange = (value) => {
        handleProfileChange('description', value);
        setDescriptionError('');
        checkDescriptionProfanity(value);
    };

    // Username helper text + color (matches CreateGroupModal)
    const getUsernameHelperProps = () => {
        if (usernameChecking) return { text: 'Checking availability...', color: 'text.secondary' };
        if (usernameError) return { text: usernameError, color: 'error.main' };
        if (usernameAvailable === true && profileForm.username?.length >= USERNAME_MIN) return { text: 'Username is available!', color: 'success.main' };
        return { text: 'Lowercase letters, numbers, and underscores only.', color: 'text.secondary' };
    };
    const usernameHelper = getUsernameHelperProps();

    // Rules handlers
    const handleAddRule = () => { if (rules.length >= MAX_RULES) return; setRules(prev => [...prev, { title: '', description: '' }]); setRulesChanged(true); };
    const handleRuleChange = (index, field, value) => { setRules(prev => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))); setRulesChanged(true); };
    const handleRemoveRule = (index) => { setRules(prev => prev.filter((_, i) => i !== index)); setRulesChanged(true); };

    // Join question handlers
    const handleAddJoinQuestion = () => { if (joinQuestions.length >= 5) return; setJoinQuestions(prev => [...prev, { question: '', required: false }]); setJoinQuestionsChanged(true); };
    const handleJoinQuestionChange = (index, field, value) => { setJoinQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))); setJoinQuestionsChanged(true); };
    const handleRemoveJoinQuestion = (index) => { setJoinQuestions(prev => prev.filter((_, i) => i !== index)); setJoinQuestionsChanged(true); };

    // Avatar: open crop dialog
    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!isAllowedImageFile(file)) { setError('Please choose a JPG, PNG, or WebP image.'); return; }
        if (file.size > IMAGE_MAX_BYTES) { setError('Image is too large. Max 8MB.'); return; }
        setRawAvatarSrc(URL.createObjectURL(file));
        setAvatarCropDialogOpen(true);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    // Cover: open crop dialog
    const handleCoverSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!isAllowedImageFile(file)) { setError('Please choose a JPG, PNG, or WebP image.'); return; }
        if (file.size > IMAGE_MAX_BYTES) { setError('Image is too large. Max 8MB.'); return; }
        setRawCoverSrc(URL.createObjectURL(file));
        setCoverCropDialogOpen(true);
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    // Avatar crop complete → set preview + file
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
        setAvatarRemoved(false);
        setProfileChanged(true);
    };

    // Cover crop complete → set preview + file
    const handleCoverCropComplete = async (blob) => {
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
        setCoverRemoved(false);
        setProfileChanged(true);
    };

    const handleRemoveAvatar = () => { setAvatarFile(null); setAvatarPreview(''); setAvatarRemoved(true); setProfileChanged(true); };
    const handleRemoveCover = () => { setCoverFile(null); setCoverPreview(''); setCoverRemoved(true); setProfileChanged(true); };

    // Drag-and-drop helper (matches CreateGroupModal)
    const handleDrop = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (!isAllowedImageFile(file)) { setError('Please choose a JPG, PNG, or WebP image.'); return; }
        if (file.size > IMAGE_MAX_BYTES) { setError('Image is too large. Max 8MB.'); return; }
        const src = URL.createObjectURL(file);
        if (type === 'avatar') {
            setRawAvatarSrc(src);
            setAvatarCropDialogOpen(true);
        } else {
            setRawCoverSrc(src);
            setCoverCropDialogOpen(true);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

    // Invite dialog: open
    const handleOpenInviteDialog = () => {
        setInviteDialogOpen(true);
        setInviteDialogSearch('');
        setInviteDialogResults([]);
        setInviteSentIds(new Set());
        // Load followers on open
        handleLoadInviteCandidates('');
    };

    // Invite dialog: search followers (button click)
    const handleLoadInviteCandidates = async (query) => {
        setInviteDialogSearching(true);
        try {
            const data = await apiFetch(`/api/groups/invite-candidates?scope=followers&q=${encodeURIComponent(query || '')}`);
            // Filter out existing members
            const memberIds = new Set(members.map(m => m.user_id || m.userId || m.user?.id));
            setInviteDialogResults((data.users || []).filter(u => !memberIds.has(u.id)));
        } catch {
            setInviteDialogResults([]);
        } finally {
            setInviteDialogSearching(false);
        }
    };

    // Invite dialog: send invite
    const handleDialogSendInvite = async (userId) => {
        if (!groupId || !userId) return;
        try {
            await apiFetch(`/api/groups/${groupId}/admin/invites/send`, { method: 'POST', body: JSON.stringify({ user_id: userId }) });
            setInviteSentIds(prev => new Set(prev).add(userId));
            showSuccess('Invite sent!');
        } catch (err) {
            setError(err?.message || 'Failed to send invite.');
        }
    };

    // Save
    const handleSaveProfile = async () => {
        if (!groupId) return;
        // Validate username
        if (profileForm.username && profileForm.username !== originalUsernameRef.current) {
            if (profileForm.username.length < USERNAME_MIN) { setError(`Username must be at least ${USERNAME_MIN} characters.`); return; }
            if (usernameError) { setError(usernameError); return; }
            if (usernameChecking) { setError('Please wait — checking username availability.'); return; }
            if (usernameAvailable === false) { setError('That username is taken. Please choose a different one.'); return; }
        }
        // Validate name
        if (nameError) { setError(nameError); return; }
        // Validate description
        if (descriptionError) { setError(descriptionError); return; }
        // Client-side profanity check
        const profanityResult = checkFieldsProfanity({ name: profileForm.name.trim(), description: String(profileForm.description || '').trim() });
        if (!profanityResult.clean) {
            setError(`Your ${profanityResult.field} contains inappropriate language. Please revise and try again.`);
            return;
        }
        setSaving(true); setError('');
        try {
            const payload = { name: profileForm.name, group_username: profileForm.username, description: profileForm.description, category: profileForm.category, is_statewide: profileForm.is_statewide, county: profileForm.is_statewide ? '' : profileForm.county, city: profileForm.is_statewide ? '' : profileForm.city };
            if (avatarFile) { payload.image_url = await uploadFileToGCS(avatarFile, 'groups/avatars'); }
            else if (avatarRemoved) { payload.image_url = ''; }
            if (coverFile) { payload.cover_photo_url = await uploadFileToGCS(coverFile, 'groups/covers'); }
            else if (coverRemoved) { payload.cover_photo_url = ''; }
            await apiFetch(`/api/groups/${groupId}/admin/settings`, { method: 'POST', body: JSON.stringify(payload) });
            showSuccess('Profile saved successfully!'); setProfileChanged(false); setAvatarFile(null); setCoverFile(null); setAvatarRemoved(false); setCoverRemoved(false); loadGroup();
        } catch (err) { setError(err.message || 'Failed to save profile'); } finally { setSaving(false); }
    };
    const handleSaveRules = async () => {
        if (!groupId) return;
        setSaving(true); setError('');
        try {
            const payload = { rules_html: buildRulesHtml(rules) };
            // Include join questions
            const validJQ = joinQuestions.filter(q => q.question.trim());
            payload.join_questions_json = validJQ.length > 0
                ? JSON.stringify(validJQ.map(q => ({ question: q.question.trim(), required: Boolean(q.required) })))
                : '';
            await apiFetch(`/api/groups/${groupId}/admin/settings`, { method: 'POST', body: JSON.stringify(payload) });
            showSuccess('Rules & questions saved!'); setRulesChanged(false); setJoinQuestionsChanged(false); loadGroup();
        }
        catch (err) { setError(err.message || 'Failed to save rules'); } finally { setSaving(false); }
    };
    const handleSaveSettings = async () => {
        if (!groupId) return;
        setSaving(true); setError('');
        try { await apiFetch(`/api/groups/${groupId}/admin/settings`, { method: 'POST', body: JSON.stringify(settingsForm) }); showSuccess('Settings saved successfully!'); setSettingsChanged(false); loadGroup(); }
        catch (err) { setError(err.message || 'Failed to save settings'); } finally { setSaving(false); }
    };

    // Member actions
    const MAX_ADMINS = 5;
    const handleChangeRole = async (userId, newRole) => {
        setError('');
        if (newRole === 'admin') {
            const currentAdminCount = members.filter(m => {
                const r = String(m.role || '').toLowerCase();
                return r === 'admin' || r === 'owner';
            }).length;
            if (currentAdminCount >= MAX_ADMINS) {
                setAdminLimitDialogOpen(true);
                return;
            }
        }
        try {
            if (newRole === 'admin') {
                await apiFetch(`/api/groups/${groupId}/admin/admins`, { method: 'POST', body: JSON.stringify({ user_id: userId }) });
            } else {
                await apiFetch(`/api/groups/${groupId}/admin/admins/${userId}`, { method: 'DELETE' });
            }
            showSuccess('Role updated!'); loadMembers();
        } catch (err) { setError(err.message || 'Failed to change role'); }
    };
    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Remove this member from the group?')) return;
        setError('');
        try { await apiFetch(`/api/groups/${groupId}/admin/members/${userId}/action`, { method: 'POST', body: JSON.stringify({ action: 'kick' }) }); showSuccess('Member removed.'); loadMembers(); loadGroup(); }
        catch (err) { setError(err.message || 'Failed to remove member'); }
    };
    const handleApproveRequest = async (request) => {
        setError(''); const userId = request.user_id || request.userId;
        try { await apiFetch(`/api/groups/${groupId}/admin/requests/${userId}/approve`, { method: 'POST' }); showSuccess('Request approved!'); loadJoinRequests(); loadMembers(); loadGroup(); }
        catch (err) { setError(err.message || 'Failed to approve request'); }
    };
    const handleRejectRequest = async (request) => {
        setError(''); const userId = request.user_id || request.userId;
        try { await apiFetch(`/api/groups/${groupId}/admin/requests/${userId}/deny`, { method: 'POST' }); showSuccess('Request rejected.'); loadJoinRequests(); }
        catch (err) { setError(err.message || 'Failed to reject request'); }
    };
    const handleDeleteGroup = async () => {
        if (deleteConfirmName.trim().toLowerCase() !== groupName.trim().toLowerCase()) { setError('Group name does not match.'); return; }
        setDeleting(true); setError('');
        try { await apiFetch(`/api/groups/${groupId}/admin/delete`, { method: 'POST', body: JSON.stringify({ confirm_name: deleteConfirmName }) }); navigate('/community'); }
        catch (err) { setError(err.message || 'Failed to delete group'); setDeleting(false); }
    };

    const handleTransferOwnership = async () => {
        if (!transferTargetId) return;
        setTransferring(true); setError('');
        try {
            await apiFetch(`/api/groups/${groupId}/admin/transfer-ownership`, { method: 'POST', body: JSON.stringify({ user_id: transferTargetId }) });
            setTransferConfirmOpen(false);
            setTransferDialogOpen(false);
            setTransferTargetId('');
            showSuccess('Ownership transferred successfully!');
            // Reload group and members so sidebar + role reflects the change
            await loadGroup();
            if (activeTab === TABS.MEMBERS) loadMembers();
        } catch (err) { setError(err.message || 'Failed to transfer ownership'); }
        finally { setTransferring(false); }
    };

    // ── Fullscreen: hide app shell (top nav, bottom tabs) while admin is mounted ──
    useEffect(() => {
        // On mobile only: hide the app's top navbar and bottom tab bar so the admin console
        // is truly fullscreen. On desktop, the header should remain visible.
        if (!isMobile) {
            return;
        }

        const topNav = document.querySelector('header, nav.top-nav, [data-testid="app-header"], #app-header, .app-top-bar');
        const bottomNav = document.querySelector('nav.bottom-nav, [data-testid="bottom-tabs"], #bottom-tabs, .app-bottom-bar, .MuiBottomNavigation-root');
        const origBodyOverflow = document.body.style.overflow;

        if (topNav) { topNav._origDisplay = topNav.style.display; topNav.style.display = 'none'; }
        if (bottomNav) { bottomNav._origDisplay = bottomNav.style.display; bottomNav.style.display = 'none'; }
        document.body.style.overflow = 'hidden';

        return () => {
            if (topNav) topNav.style.display = topNav._origDisplay || '';
            if (bottomNav) bottomNav.style.display = bottomNav._origDisplay || '';
            document.body.style.overflow = origBodyOverflow;
        };
    }, [isMobile]);

    const handleBack = useCallback(() => { navigate(`/groups/${groupIdParam}`); }, [navigate, groupIdParam]);
    const handleOpenMemberMenu = (event, member) => { setMemberMenuAnchor(event.currentTarget); setMemberMenuTarget(member); };
    const handleCloseMemberMenu = () => { setMemberMenuAnchor(null); setMemberMenuTarget(null); };

    const filteredMembers = useMemo(() => {
        const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };
        let list = [...members];

        // Apply filter
        if (memberFilter === 'admins') {
            list = list.filter(m => {
                const r = String(m.role || '').toLowerCase();
                return r === 'admin' || r === 'owner';
            });
        } else if (memberFilter === 'banned') {
            list = list.filter(m => m.banned_until && new Date(m.banned_until) > new Date());
        } else if (memberFilter === 'timed_out') {
            list = list.filter(m => m.timeout_until && new Date(m.timeout_until) > new Date());
        } else if (memberFilter === 'recently_joined') {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            list = list.filter(m => {
                const joinedAt = m.joined_at || m.joinedAt || m.created_at;
                return joinedAt && new Date(joinedAt).getTime() > sevenDaysAgo;
            });
        }

        // Apply search
        if (memberSearch.trim()) {
            const q = memberSearch.toLowerCase();
            list = list.filter(m => {
                const user = m.user || m;
                return String(user.name || user.first_name || '').toLowerCase().includes(q) || String(user.username || user.handle || '').toLowerCase().includes(q);
            });
        }

        // Sort
        if (memberFilter === 'recently_joined') {
            // Sort newest first for recently joined
            list.sort((a, b) => {
                const aDate = new Date(a.joined_at || a.joinedAt || a.created_at || 0).getTime();
                const bDate = new Date(b.joined_at || b.joinedAt || b.created_at || 0).getTime();
                return bDate - aDate;
            });
        } else {
            // Default: owner first, then admins, then moderators, then members
            list.sort((a, b) => {
                const aRole = String(a.role || '').toLowerCase();
                const bRole = String(b.role || '').toLowerCase();
                const aIsOwner = aRole === 'owner' || (ownerUserId != null && String(a.user_id || a.userId || a.user?.id) === String(ownerUserId));
                const bIsOwner = bRole === 'owner' || (ownerUserId != null && String(b.user_id || b.userId || b.user?.id) === String(ownerUserId));
                const aOrder = aIsOwner ? 0 : (ROLE_ORDER[aRole] ?? 3);
                const bOrder = bIsOwner ? 0 : (ROLE_ORDER[bRole] ?? 3);
                return aOrder - bOrder;
            });
        }

        return list;
    }, [members, memberSearch, memberFilter, ownerUserId]);

    // ========================================================================
    // Render: Profile Tab
    // ========================================================================
    const renderProfileTab = () => (
        <Stack spacing={3}>
            {/* Profile Photo — clickable circle with hover overlay, matching CreateGroupModal */}
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <ImageIcon fontSize="small" sx={{ color: 'primary.main' }} />
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
                            border: '3px solid',
                            borderColor: avatarPreview ? 'divider' : 'transparent',
                            bgcolor: (t) => avatarPreview ? t.palette.action.hover : alpha(t.palette.primary.main, 0.18),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 150ms ease',
                            '&:hover': { transform: 'scale(1.04)' },
                            '&:hover .photo-overlay': { opacity: 1 },
                        }}
                    >
                        {avatarPreview ? (
                            <Avatar src={avatarPreview} alt="Group" sx={{ width: '100%', height: '100%' }} imgProps={{ style: { objectFit: 'cover' } }} />
                        ) : (
                            <GroupsIcon sx={{ fontSize: 38, color: 'primary.main' }} />
                        )}
                        <Box className="photo-overlay" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.25)', borderRadius: '50%', opacity: 0, transition: 'opacity 150ms ease' }}>
                            <AddPhotoIcon sx={{ color: 'common.white', fontSize: 24 }} />
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                            {isMobile ? 'Tap the icon to upload.' : 'Click the icon or drag an image to upload.'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button variant="contained" size="small" disabled={saving} onClick={() => avatarInputRef.current?.click()} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                                {avatarPreview ? 'Change' : 'Upload'}
                            </Button>
                            {avatarPreview && (
                                <Button variant="outlined" size="small" disabled={saving} onClick={handleRemoveAvatar} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                                    Remove
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Stack>
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
            </Paper>

            {/* Cover Photo — clickable area with dashed border and aspect ratio, matching CreateGroupModal */}
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <CropIcon fontSize="small" sx={{ color: 'primary.main' }} />
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
                        bgcolor: (t) => coverPreview ? 'transparent' : t.palette.action.hover,
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
                    <Button variant="contained" size="small" disabled={saving} onClick={() => coverInputRef.current?.click()} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                        {coverPreview ? 'Change' : 'Upload'}
                    </Button>
                    {coverPreview && (
                        <Button variant="outlined" size="small" disabled={saving} onClick={handleRemoveCover} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                            Remove
                        </Button>
                    )}
                </Stack>
                <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={handleCoverSelect} />
            </Paper>

            {/* Basic Information */}
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <SectionHeader icon={<ProfileIcon />} title="Basic Information" noDivider />
                <Stack spacing={2.5} sx={{ mt: 2 }}>
                    <Box>
                        <TextField
                            fullWidth
                            label="Group Name"
                            value={profileForm.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            error={Boolean(nameError)}
                            inputProps={{ maxLength: NAME_MAX }}
                        />
                        {nameError && (
                            <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                                {nameError}
                            </Typography>
                        )}
                        <Typography variant="caption" color={(profileForm.name?.length || 0) > NAME_MAX * 0.9 ? 'warning.main' : 'text.secondary'} sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
                            {profileForm.name?.length || 0}/{NAME_MAX}
                        </Typography>
                    </Box>
                    <Box>
                        <TextField
                            fullWidth
                            label="Username"
                            value={profileForm.username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
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
                                        {usernameChecking && <CircularProgress size={18} />}
                                        {!usernameChecking && usernameAvailable === true && (profileForm.username?.length || 0) >= USERNAME_MIN && (
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
                            <Typography variant="caption" sx={{ fontWeight: 700, color: usernameHelper.color }}>
                                {usernameHelper.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {profileForm.username?.length || 0}/{USERNAME_MAX}
                            </Typography>
                        </Stack>
                    </Box>
                    <Box>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            maxRows={8}
                            label="Description"
                            value={profileForm.description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Tell people what this group is about..."
                            error={Boolean(descriptionError)}
                            inputProps={{ maxLength: DESCRIPTION_MAX }}
                        />
                        {descriptionError && (
                            <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: 'block', fontWeight: 700, color: 'error.main' }}>
                                {descriptionError}
                            </Typography>
                        )}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: -1.5, mx: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Optional</Typography>
                            <Typography variant="caption" color={(profileForm.description?.length || 0) > DESCRIPTION_MAX * 0.9 ? 'warning.main' : 'text.secondary'} fontWeight={700}>
                                {profileForm.description?.length || 0}/{DESCRIPTION_MAX}
                            </Typography>
                        </Stack>
                    </Box>
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={profileForm.category}
                            onChange={(e) => handleProfileChange('category', e.target.value)}
                            label="Category"
                            renderValue={(selected) => {
                                if (!selected) return '';
                                const parentGroup = GROUP_CATEGORY_OPTIONS.find((g) => g.items.includes(selected));
                                const Icon = parentGroup ? (GROUP_MAIN_ICON[parentGroup.header] || GroupsIcon) : GroupsIcon;
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                                        <span>{selected}</span>
                                    </Box>
                                );
                            }}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                        >
                            {GROUP_CATEGORY_OPTIONS.flatMap((section) => {
                                const HeaderIcon = GROUP_MAIN_ICON[section.header] || GroupsIcon;
                                return [
                                    <ListSubheader key={`header-${section.header}`} sx={{ fontWeight: 900, fontSize: 13, lineHeight: '32px', color: 'text.primary', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <HeaderIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                        {section.header}
                                    </ListSubheader>,
                                    ...section.items.map((item) => <MenuItem key={item} value={item} sx={{ fontSize: 14, pl: 4.5 }}>{item}</MenuItem>),
                                ];
                            })}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Location — uses CityCountySelect matching CreateGroupModal */}
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <SectionHeader icon={<PublicIcon />} title="Location" subtitle="Where is this group based?" noDivider />
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1, mb: 2 }}>
                    Leave both set to &quot;All&quot; if the group is statewide.
                </Typography>
                <CityCountySelect
                    city={profileForm.city || ''}
                    setCity={(val) => handleProfileChange('city', val)}
                    county={profileForm.county || ''}
                    setCounty={(val) => handleProfileChange('county', val)}
                    countyRequired={false}
                    countyLabelOverride="County"
                    countyError=""
                />
            </Paper>
        </Stack>
    );

    // ========================================================================
    // Render: Rules Tab
    // ========================================================================
    const renderRulesTab = () => (
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
                            disabled={saving}
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
                                onChange={(e) => handleRuleChange(index, 'title', e.target.value.slice(0, RULE_TITLE_MAX))}
                                disabled={saving}
                                fullWidth
                                size="small"
                                placeholder="e.g. Be respectful"
                                inputProps={{ maxLength: RULE_TITLE_MAX }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
                                {rule.title.length}/{RULE_TITLE_MAX}
                            </Typography>
                        </Box>
                        <Box>
                            <TextField
                                label="Description"
                                value={rule.description}
                                onChange={(e) => handleRuleChange(index, 'description', e.target.value.slice(0, RULE_DESC_MAX))}
                                disabled={saving}
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                maxRows={4}
                                placeholder="Optional explanation of this rule"
                                inputProps={{ maxLength: RULE_DESC_MAX }}
                            />
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
                    disabled={saving}
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

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <QuestionIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography fontWeight={800} fontSize={15}>Join Questions</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Ask new members to answer questions before joining. Their answers will appear in the join request for admins to review.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5, mb: 2 }}>
                    Optional — up to 5 questions.
                </Typography>

                <Stack spacing={2}>
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
                                    disabled={saving}
                                    sx={{ color: 'error.main' }}
                                    aria-label={`Remove question ${index + 1}`}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                            <TextField
                                label="Question"
                                value={jq.question}
                                onChange={(e) => handleJoinQuestionChange(index, 'question', e.target.value.slice(0, 300))}
                                disabled={saving}
                                fullWidth
                                size="small"
                                placeholder="e.g. Why do you want to join this group?"
                                inputProps={{ maxLength: 300 }}
                            />
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={jq.required}
                                            onChange={(e) => handleJoinQuestionChange(index, 'required', e.target.checked)}
                                            disabled={saving}
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
                            disabled={saving}
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
            </Paper>
        </Stack>
    );

    // ========================================================================
    // Render: Members Tab
    // ========================================================================
    const renderMembersTab = () => (
        <Stack spacing={3}>
            {showJoinRequests && (
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                    <SectionHeader icon={<PendingIcon />} title="Join Requests" subtitle={`${joinRequests.length} pending request${joinRequests.length !== 1 ? 's' : ''}`}
                                   action={<IconButton size="small" onClick={loadJoinRequests} disabled={requestsLoading}><RefreshIcon fontSize="small" /></IconButton>} noDivider />
                    {requestsLoading ? (
                        <Stack spacing={1} sx={{ mt: 2 }}>{[1, 2].map(i => <Skeleton key={i} height={60} />)}</Stack>
                    ) : joinRequests.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No pending requests.</Typography>
                    ) : (
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            {joinRequests.map(req => {
                                const user = req.user || req;
                                const odId = req.user_id || req.userId || user.id;
                                const displayName = (
                                    user.name ||
                                    (user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : '') ||
                                    user.username ||
                                    user.handle ||
                                    'Unknown'
                                ).trim();
                                const displayHandle = user.handle || user.username || '';
                                const profilePath = displayHandle ? `/${displayHandle}` : (odId ? `/${odId}` : null);

                                // Parse join answers
                                let joinAnswers = [];
                                try {
                                    const raw = req.join_answers_json || req.joinAnswersJson;
                                    if (raw) {
                                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                        if (Array.isArray(parsed)) joinAnswers = parsed;
                                    }
                                } catch { /* ignore */ }

                                return (
                                    <Paper key={odId} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, px: 1.5 }}>
                                            {hasValidUserAvatar(getUserAvatarUrl(user)) ? (
                                                <Avatar
                                                    src={getUserAvatarUrl(user)}
                                                    sx={{ width: 40, height: 40, cursor: profilePath ? 'pointer' : 'default' }}
                                                    onClick={() => profilePath && navigate(profilePath)}
                                                />
                                            ) : (
                                                <Box onClick={() => profilePath && navigate(profilePath)} sx={{ cursor: profilePath ? 'pointer' : 'default' }}>
                                                    <UserDefaultAvatar size={40} iconSize={24} />
                                                </Box>
                                            )}
                                            <Box sx={{ flex: 1, minWidth: 0, cursor: profilePath ? 'pointer' : 'default' }} onClick={() => profilePath && navigate(profilePath)}>
                                                <Typography fontWeight={600} noWrap>{displayName}</Typography>
                                                {displayHandle && <Typography variant="caption" color="text.secondary">@{displayHandle}</Typography>}
                                            </Box>
                                            <Button size="small" variant="outlined" onClick={() => handleRejectRequest(req)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>Reject</Button>
                                            <Button size="small" variant="contained" onClick={() => handleApproveRequest(req)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>Approve</Button>
                                        </Stack>

                                        {joinAnswers.length > 0 && (
                                            <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                                                    Join Answers
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {joinAnswers.map((a, ai) => (
                                                        <Box key={ai}>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                                {a.question}
                                                                {a.required ? (
                                                                    <Chip label="Required" size="small" color="error" variant="outlined" sx={{ ml: 0.75, fontWeight: 700, fontSize: 9, height: 16 }} />
                                                                ) : (
                                                                    <Chip label="Optional" size="small" variant="outlined" sx={{ ml: 0.75, fontWeight: 600, fontSize: 9, height: 16, color: 'text.secondary', borderColor: 'divider' }} />
                                                                )}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: 13, color: a.answer ? 'text.primary' : 'text.disabled', fontStyle: a.answer ? 'normal' : 'italic', mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                {a.answer || 'No answer provided'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Paper>
            )}

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <SectionHeader icon={<InviteIcon />} title="Invite Members" subtitle="Invite your followers to join this group." noDivider />
                <Button variant="outlined" startIcon={<InviteIcon />} onClick={handleOpenInviteDialog}
                        sx={{ mt: 1, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                    Invite Followers
                </Button>
            </Paper>

            {pendingInvites.length > 0 && (
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                    <SectionHeader icon={<InviteIcon />} title="Pending Invites" subtitle={`${pendingInvites.length} pending`} noDivider />
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {pendingInvites.map(invite => {
                            const invUser = invite.user || invite;
                            const invDisplayName = (
                                invUser.name ||
                                (invUser.first_name ? `${invUser.first_name}${invUser.last_name ? ` ${invUser.last_name}` : ''}` : '') ||
                                invUser.username ||
                                invUser.handle ||
                                'User'
                            ).trim();
                            const invHandle = invUser.handle || invUser.username || '';
                            const invProfilePath = invHandle ? `/${invHandle}` : (invUser.id ? `/${invUser.id}` : null);
                            return (
                                <Stack key={invite.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, px: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    {hasValidUserAvatar(getUserAvatarUrl(invUser)) ? (
                                        <Avatar
                                            src={getUserAvatarUrl(invUser)}
                                            sx={{ width: 36, height: 36, cursor: invProfilePath ? 'pointer' : 'default' }}
                                            onClick={() => invProfilePath && navigate(invProfilePath)}
                                        />
                                    ) : (
                                        <Box onClick={() => invProfilePath && navigate(invProfilePath)} sx={{ cursor: invProfilePath ? 'pointer' : 'default' }}>
                                            <UserDefaultAvatar size={36} iconSize={20} />
                                        </Box>
                                    )}
                                    <Box sx={{ flex: 1, minWidth: 0, cursor: invProfilePath ? 'pointer' : 'default' }} onClick={() => invProfilePath && navigate(invProfilePath)}>
                                        <Typography fontWeight={600} noWrap>{invDisplayName}</Typography>
                                        {invHandle && <Typography variant="caption" color="text.secondary">@{invHandle}</Typography>}
                                    </Box>
                                    <Chip size="small" label="Pending" color="warning" sx={{ fontWeight: 700 }} />
                                    <Tooltip title="Cancel invite"><IconButton size="small" onClick={() => handleCancelInvite(invite.id)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                                </Stack>
                            );
                        })}
                    </Stack>
                </Paper>
            )}

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <SectionHeader icon={<MembersIcon />} title="Members" subtitle={`${memberCount} member${memberCount !== 1 ? 's' : ''}`}
                               action={<IconButton size="small" onClick={loadMembers} disabled={membersLoading}><RefreshIcon fontSize="small" /></IconButton>} noDivider />
                <TextField fullWidth size="small" placeholder="Search members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                           InputProps={{
                               startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                               endAdornment: memberSearch ? (
                                   <InputAdornment position="end">
                                       <IconButton size="small" onClick={() => setMemberSearch('')} edge="end" aria-label="Clear search">
                                           <CloseIcon sx={{ fontSize: 18 }} />
                                       </IconButton>
                                   </InputAdornment>
                               ) : null,
                           }}
                           sx={{ mt: 2, mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 999 } }} />

                {/* Filter chips */}
                {(() => {
                    const adminCount = members.filter(m => { const r = String(m.role || '').toLowerCase(); return r === 'admin' || r === 'owner'; }).length;
                    const bannedCount = members.filter(m => m.banned_until && new Date(m.banned_until) > new Date()).length;
                    const timedOutCount = members.filter(m => m.timeout_until && new Date(m.timeout_until) > new Date()).length;
                    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                    const recentCount = members.filter(m => {
                        const joinedAt = m.joined_at || m.joinedAt || m.created_at;
                        return joinedAt && new Date(joinedAt).getTime() > sevenDaysAgo;
                    }).length;
                    const filters = [
                        { key: 'all', label: 'All' },
                        { key: 'recently_joined', label: `Recently Joined (${recentCount})` },
                        { key: 'admins', label: `Admins (${adminCount}/${MAX_ADMINS})` },
                        ...(bannedCount > 0 ? [{ key: 'banned', label: `Banned (${bannedCount})` }] : []),
                        ...(timedOutCount > 0 ? [{ key: 'timed_out', label: `Timed Out (${timedOutCount})` }] : []),
                    ];
                    return (
                        <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
                            {filters.map(f => (
                                <Chip
                                    key={f.key}
                                    label={f.label}
                                    size="small"
                                    onClick={() => setMemberFilter(f.key)}
                                    color={memberFilter === f.key ? (f.key === 'banned' ? 'error' : f.key === 'timed_out' ? 'warning' : 'primary') : 'default'}
                                    variant={memberFilter === f.key ? 'filled' : 'outlined'}
                                    disableRipple
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        borderRadius: 999,
                                        '&.MuiChip-filled:hover': { filter: 'brightness(0.92)' },
                                        '& .MuiChip-label': { userSelect: 'none' },
                                    }}
                                />
                            ))}
                        </Stack>
                    );
                })()}

                {membersLoading ? (
                    <Stack spacing={1}>{[1, 2, 3].map(i => <Skeleton key={i} height={60} />)}</Stack>
                ) : filteredMembers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{memberSearch ? 'No members found.' : 'No members yet.'}</Typography>
                ) : (
                    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Stack spacing={0} divider={<Divider />}>
                            {filteredMembers.map(member => {
                                const user = member.user || member;
                                const odId = member.user_id || member.userId || user.id;
                                const rawRole = String(member.role || '').toLowerCase();
                                const isThisOwner = rawRole === 'owner' || (ownerUserId != null && String(odId) === String(ownerUserId));
                                const displayRole = isThisOwner ? 'owner' : rawRole;
                                const isThisViewer = viewerUserId != null && String(odId) === String(viewerUserId);
                                const canModify = !isThisViewer && !isThisOwner && (
                                    isOwner || (isAdmin && rawRole !== 'admin')
                                );
                                const canChangeRole = isOwner && !isThisOwner && !isThisViewer;
                                const isTimedOut = member.timeout_until && new Date(member.timeout_until) > new Date();
                                const isBanned = member.banned_until && new Date(member.banned_until) > new Date();
                                const timeoutRemaining = (() => {
                                    if (!isTimedOut) return '';
                                    const diffMs = Math.max(0, new Date(member.timeout_until).getTime() - Date.now());
                                    const mins = Math.ceil(diffMs / 60000);
                                    if (mins >= 1440) return `${Math.round(mins / 1440)}d`;
                                    if (mins >= 60) return `${Math.round(mins / 60)}h`;
                                    return `${mins}m`;
                                })();

                                // Parse join answers
                                let memberAnswers = [];
                                try {
                                    const raw = member.join_answers_json || member.joinAnswersJson;
                                    if (raw) {
                                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                        if (Array.isArray(parsed)) memberAnswers = parsed;
                                    }
                                } catch { /* ignore */ }
                                const hasAnswers = memberAnswers.length > 0;
                                const isAnswersExpanded = expandedAnswers.has(odId);

                                return (
                                    <Box key={odId}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}
                                               sx={{
                                                   py: 1.25, px: 2,
                                                   bgcolor: isBanned ? alpha(theme.palette.error.main, 0.04) : isTimedOut ? alpha(theme.palette.warning.main, 0.04) : 'transparent',
                                                   '&:hover': { bgcolor: isBanned ? alpha(theme.palette.error.main, 0.06) : isTimedOut ? alpha(theme.palette.warning.main, 0.06) : 'action.hover' },
                                               }}>
                                            {hasValidUserAvatar(getUserAvatarUrl(user)) ? (
                                                <Avatar
                                                    src={getUserAvatarUrl(user)}
                                                    sx={{ width: 40, height: 40, cursor: 'pointer' }}
                                                    onClick={() => navigate(`/${user.handle || user.username || odId}`)}
                                                />
                                            ) : (
                                                <Box onClick={() => navigate(`/${user.handle || user.username || odId}`)} sx={{ cursor: 'pointer' }}>
                                                    <UserDefaultAvatar size={40} iconSize={24} />
                                                </Box>
                                            )}
                                            <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/${user.handle || user.username || odId}`)}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography fontWeight={700} noWrap sx={{ fontSize: 14 }}>
                                                        {(user.name || (user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : '') || user.username || user.handle || 'Unknown').trim()}
                                                    </Typography>
                                                    {isTimedOut && <Chip size="small" label={`Timed out · ${timeoutRemaining} left`} color="warning" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />}
                                                    {isBanned && <Chip size="small" label="Banned" color="error" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />}
                                                </Stack>
                                                {(user.handle || '') && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>@{user.handle}</Typography>}
                                            </Box>
                                            {/* Show RoleChip only when there's no dropdown (owner/self/non-modifiable) */}
                                            {!canChangeRole && <RoleChip role={displayRole} />}
                                            {canChangeRole && (
                                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                                    <Select value={rawRole} onChange={(e) => handleChangeRole(odId, e.target.value)} size="small"
                                                            sx={{ borderRadius: 999, fontSize: 13 }}>
                                                        <MenuItem value="member">Member</MenuItem>
                                                        <MenuItem value="admin" disabled={(() => { const adminCountNow = members.filter(m => { const r = String(m.role || '').toLowerCase(); return r === 'admin' || r === 'owner'; }).length; return rawRole !== 'admin' && adminCountNow >= MAX_ADMINS; })()}>Admin{(() => { const adminCountNow = members.filter(m => { const r = String(m.role || '').toLowerCase(); return r === 'admin' || r === 'owner'; }).length; return rawRole !== 'admin' && adminCountNow >= MAX_ADMINS ? ' (max)' : ''; })()}</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                            {hasAnswers && (
                                                <Tooltip title={isAnswersExpanded ? 'Hide answers' : 'View join answers'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setExpandedAnswers(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(odId)) next.delete(odId); else next.add(odId);
                                                            return next;
                                                        })}
                                                        sx={{ color: isAnswersExpanded ? 'primary.main' : 'text.secondary' }}
                                                    >
                                                        <QuestionAnswerIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {canModify && (
                                                <IconButton size="small" onClick={(e) => handleOpenMemberMenu(e, member)} sx={{ ml: 'auto' }}><MoreIcon fontSize="small" /></IconButton>
                                            )}
                                        </Stack>

                                        {hasAnswers && (
                                            <Collapse in={isAnswersExpanded}>
                                                <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                                                        Join Answers
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {memberAnswers.map((a, ai) => (
                                                            <Box key={ai}>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                                    {a.question}
                                                                    {a.required ? (
                                                                        <Chip label="Required" size="small" color="error" variant="outlined" sx={{ ml: 0.75, fontWeight: 700, fontSize: 9, height: 16 }} />
                                                                    ) : (
                                                                        <Chip label="Optional" size="small" variant="outlined" sx={{ ml: 0.75, fontWeight: 600, fontSize: 9, height: 16, color: 'text.secondary', borderColor: 'divider' }} />
                                                                    )}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontSize: 13, color: a.answer ? 'text.primary' : 'text.disabled', fontStyle: a.answer ? 'normal' : 'italic', mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                    {a.answer || 'No answer provided'}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            </Collapse>
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Member Action Menu */}
            <SmartMenu anchorEl={memberMenuAnchor} open={Boolean(memberMenuAnchor)} onClose={handleCloseMemberMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                {memberMenuTarget?.timeout_until && new Date(memberMenuTarget.timeout_until) > new Date()
                    ? [<MenuItem key="untimeout" onClick={() => { handleCloseMemberMenu(); handleOpenModeration(memberMenuTarget, 'untimeout'); }}><ListItemIcon><TimeoutIcon fontSize="small" /></ListItemIcon><ListItemText>Remove Timeout</ListItemText></MenuItem>]
                    : [<MenuItem key="timeout" onClick={() => { handleCloseMemberMenu(); handleOpenModeration(memberMenuTarget, 'timeout'); }}><ListItemIcon><TimeoutIcon fontSize="small" color="warning" /></ListItemIcon><ListItemText>Timeout</ListItemText></MenuItem>]
                }
                {memberMenuTarget?.banned_until && new Date(memberMenuTarget.banned_until) > new Date()
                    ? [<MenuItem key="unban" onClick={() => { handleCloseMemberMenu(); handleOpenModeration(memberMenuTarget, 'unban'); }}><ListItemIcon><BanIcon fontSize="small" /></ListItemIcon><ListItemText>Unban</ListItemText></MenuItem>]
                    : [<MenuItem key="ban" onClick={() => { handleCloseMemberMenu(); handleOpenModeration(memberMenuTarget, 'ban'); }}><ListItemIcon><BanIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Ban</ListItemText></MenuItem>]
                }
                <Divider key="menu-divider" />
                <MenuItem key="remove" onClick={() => { handleCloseMemberMenu(); handleRemoveMember(memberMenuTarget?.user_id || memberMenuTarget?.userId || memberMenuTarget?.user?.id); }}>
                    <ListItemIcon><RemoveIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Remove from Group</ListItemText>
                </MenuItem>
            </SmartMenu>
        </Stack>
    );

    // ========================================================================
    // Render: Settings Tab
    // ========================================================================
    const renderSettingsTab = () => (
        <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                <SectionHeader icon={<VisibilityIcon />} title="Visibility" subtitle="Control who can see and join your group." noDivider />
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {VISIBILITY_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = settingsForm.visibility === opt.value;
                        return (
                            <Paper key={opt.value} variant={isSelected ? 'elevation' : 'outlined'} elevation={isSelected ? 2 : 0}
                                   onClick={() => handleSettingsChange('visibility', opt.value)}
                                   sx={{ p: 2, borderRadius: 2, cursor: 'pointer', border: isSelected ? '2px solid' : '1px solid', borderColor: isSelected ? 'primary.main' : 'divider', bgcolor: isSelected ? 'action.selected' : 'background.paper', transition: 'all 0.15s ease', '&:hover': { borderColor: 'primary.main' } }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Icon color={isSelected ? 'primary' : 'action'} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={700}>{opt.label}</Typography>
                                        <Typography variant="body2" color="text.secondary">{opt.description}</Typography>
                                    </Box>
                                    {isSelected && <CheckIcon color="primary" />}
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            </Paper>
            {isOwner && (
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
                    <SectionHeader icon={<TransferIcon />} title="Transfer Ownership" subtitle="Transfer this group to another admin." noDivider />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>You can transfer ownership to an existing admin. They will become an admin after the transfer.</Typography>
                    <Button variant="outlined" startIcon={<TransferIcon />} onClick={() => {
                        const adminMembers = members.filter(m => {
                            const r = String(m.role || '').toLowerCase();
                            const odId = m.user_id || m.userId || (m.user || m).id;
                            const isThisOwner = r === 'owner' || (ownerUserId != null && String(odId) === String(ownerUserId));
                            return r === 'admin' && !isThisOwner;
                        });
                        if (adminMembers.length === 0) {
                            setNoAdminsDialogOpen(true);
                        } else {
                            setTransferTargetId('');
                            setTransferDialogOpen(true);
                        }
                    }} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>Transfer Ownership</Button>
                </Paper>
            )}
            {isOwner && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'error.main' }}>
                    <SectionHeader icon={<WarningIcon sx={{ color: 'error.main' }} />} title="Danger Zone" subtitle="Irreversible actions." noDivider />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>Deleting a group permanently removes all posts, members, and data. This cannot be undone.</Typography>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>Delete Group</Button>
                </Paper>
            )}
        </Stack>
    );

    // Save config
    const getSaveConfig = () => {
        switch (activeTab) {
            case TABS.PROFILE: return { show: profileChanged, onClick: handleSaveProfile, label: 'Save Profile' };
            case TABS.RULES: return { show: rulesChanged || joinQuestionsChanged, onClick: handleSaveRules, label: 'Save Rules & Questions' };
            case TABS.SETTINGS: return { show: settingsChanged, onClick: handleSaveSettings, label: 'Save Settings' };
            default: return { show: false };
        }
    };
    const saveConfig = getSaveConfig();

    // ========================================================================
    // Main Render
    // ========================================================================
    if (groupLoading) return (
        <Box sx={(t) => ({
            bgcolor: 'background.default',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            // Mobile: full-screen fixed overlay (covers header — intentional)
            // Desktop: normal flow below header
            ...(isMobile
                ? { position: 'fixed', inset: 0, zIndex: 1200 }
                : { minHeight: 'calc(100vh - 72px)' }),
        })}>
            <Box sx={(t) => ({ width: 64, height: 64, borderRadius: 4, display: 'grid', placeItems: 'center', bgcolor: alpha(t.palette.primary.main, 0.08), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.15) })}>
                <CircularProgress size={32} thickness={3.5} />
            </Box>
            <Typography sx={{ fontWeight: 850, fontSize: 15.5, color: 'text.secondary', letterSpacing: 0.3 }}>
                Loading Admin Console…
            </Typography>
            <Button
                onClick={() => navigate(-1)}
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 0.5, textTransform: 'none', fontWeight: 700, borderRadius: 999, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
            >
                Go Back
            </Button>
        </Box>
    );
    if (error && !group) return <NotFound />;

    if (!isOnPersonalAccount) {
        // Check raw membership (before personal-account filter) to decide
        // whether to show the "switch account" prompt or a plain 404.
        const rawRole = String(viewerMembershipRaw?.role || '').toLowerCase();
        const rawViewerUserId = viewerMembershipRaw?.user_id ?? viewerMembershipRaw?.userId ?? viewerMembershipRaw?.id ?? null;
        const isRawAdmin = rawRole === 'owner' || rawRole === 'admin'
            || (rawViewerUserId != null && ownerUserId != null && String(rawViewerUserId) === String(ownerUserId));

        if (isRawAdmin) {
            return (
                <Container maxWidth="sm" sx={{ py: 6 }}>
                    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, borderColor: 'primary.main', borderWidth: 2 }}>
                        {hasGroupPhoto ? (
                            <Avatar src={displayAvatarSrc} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}>{groupName?.[0] || 'G'}</Avatar>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><GroupDefaultAvatar size={80} iconSize={40} /></Box>
                        )}
                        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Switch to Personal Account</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Group admin settings can only be accessed from your personal account. Switch to your personal profile using the account switcher in the header, then come back to manage <strong>{groupName}</strong>.</Typography>
                        <Button variant="contained" onClick={() => navigate(`/groups/${groupIdParam}`)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Back to Group</Button>
                    </Paper>
                </Container>
            );
        }
        return <NotFound />;
    }
    if (!isAdmin) return <NotFound />;

    return (
        <Box sx={{
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            ...(isMobile
                ? { position: 'fixed', inset: 0, zIndex: 1200, overflow: 'hidden' }
                : { minHeight: 'calc(100vh - 72px)' }),
        }}>
            {!isMobile ? (
                /* ── DESKTOP: Sidebar layout — sidebar sticks, page scrolls naturally ── */
                <Box sx={{ display: 'flex', flex: 1, minHeight: 0, maxWidth: '100%', mx: 'auto', width: '100%' }}>
                    {/* Sidebar — fixed width, stretches from header to bottom of viewport */}
                    <Box sx={(t) => ({
                        width: 280,
                        minWidth: 280,
                        maxWidth: 280,
                        flexShrink: 0,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 72,
                        height: 'calc(100vh - 72px)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(t.palette.text.primary, 0.12), borderRadius: 2 },
                    })}>
                        <Box sx={{ p: 2.5, pb: 2, flexShrink: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                {hasGroupPhoto ? (
                                    <Avatar src={displayAvatarSrc} sx={(t) => ({ width: 48, height: 48, bgcolor: 'action.hover', border: '2px solid', borderColor: alpha(t.palette.primary.main, 0.15), boxShadow: `0 2px 8px ${alpha(t.palette.common.black, 0.08)}` })} imgProps={{ style: { objectFit: 'cover' } }}>{groupName?.[0] || 'G'}</Avatar>
                                ) : (
                                    <GroupDefaultAvatar size={48} iconSize={24} />
                                )}
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 15.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupName}</Typography>
                                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>Admin Console</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                <Chip
                                    label={isOwner ? 'Owner' : viewerRole === 'admin' ? 'Admin' : 'Member'}
                                    size="small"
                                    icon={
                                        isOwner
                                            ? <OwnerIcon sx={{ fontSize: 13 }} />
                                            : viewerRole === 'admin'
                                                ? <ShieldIcon sx={{ fontSize: 13 }} />
                                                : <PersonIcon sx={{ fontSize: 13 }} />
                                    }
                                    sx={(t) => {
                                        const roleKey = isOwner ? 'owner' : viewerRole === 'admin' ? 'admin' : 'member';
                                        return {
                                            height: 22,
                                            borderRadius: 999,
                                            fontWeight: 800,
                                            fontSize: 11,
                                            color: 'common.white',
                                            border: 'none',
                                            ...getRoleChipStyles(t, roleKey),
                                            '& .MuiChip-label': { px: 0.75 },
                                            '& .MuiChip-icon': { color: 'common.white', ml: 0.5 },
                                        };
                                    }}
                                />
                                <Chip label={`${memberCount} member${memberCount !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                            </Box>
                        </Box>
                        <Box sx={(t) => ({ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5, px: 1.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' })}>
                            {TAB_CONFIG.map(tab => <GroupSideNavItem key={tab.key} icon={tab.icon} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />)}
                            <Divider sx={{ my: 0.75 }} />
                            <ButtonBase onClick={handleBack} sx={(t) => ({ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', px: 2, py: 1.25, borderRadius: 2.5, fontSize: 14, fontWeight: 600, color: 'text.secondary', justifyContent: 'flex-start', transition: 'all 0.15s ease', '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), color: 'primary.main' } })}>
                                <OpenInNewIcon sx={{ fontSize: 20, opacity: 0.7 }} />
                                <Typography sx={{ fontSize: 14, fontWeight: 650, lineHeight: 1.3 }}>View Group Page</Typography>
                            </ButtonBase>
                        </Box>
                    </Box>

                    {/* Main content — scrolls with the page */}
                    <Box sx={(t) => ({ flex: 1, minWidth: 0, py: 4, px: { md: 4, lg: 6 }, bgcolor: alpha(t.palette.background.default, 0.6) })} ref={contentRef}>
                        <Box sx={{ width: '100%', maxWidth: 860, mx: 'auto' }}>
                            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
                            {saveConfig.show && (
                                <Box sx={(t) => ({
                                    mb: 3, display: 'flex', justifyContent: 'flex-end', position: 'sticky', top: 80, zIndex: 10,
                                })}>
                                    <Button
                                        variant="contained"
                                        onClick={saveConfig.onClick}
                                        disabled={saving}
                                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                        sx={(t) => ({
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            borderRadius: 999,
                                            px: 3,
                                            py: 1,
                                            boxShadow: `0 4px 14px ${alpha(t.palette.primary.main, 0.3)}`,
                                            '&:hover': {
                                                boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.4)}`,
                                            },
                                        })}
                                    >
                                        {saving ? 'Saving...' : saveConfig.label}
                                    </Button>
                                </Box>
                            )}
                            {loading ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
                                <ContentFadeIn triggerKey={activeTab}>
                                    <TabPanel value={activeTab} index={TABS.PROFILE}>{renderProfileTab()}</TabPanel>
                                    <TabPanel value={activeTab} index={TABS.RULES}>{renderRulesTab()}</TabPanel>
                                    <TabPanel value={activeTab} index={TABS.MEMBERS}>{renderMembersTab()}</TabPanel>
                                    <TabPanel value={activeTab} index={TABS.REPORTED_POSTS}>
                                        <GroupAdminReportedPostsSection
                                            groupId={groupId}
                                            group={group}
                                            viewerMembership={viewerMembership}
                                            onToast={(severity, message) => {
                                                if (severity === 'error') setError(message);
                                                else { showSuccess(message); }
                                            }}
                                            onRefreshGroup={loadGroup}
                                        />
                                    </TabPanel>
                                    <TabPanel value={activeTab} index={TABS.SETTINGS}>{renderSettingsTab()}</TabPanel>
                                </ContentFadeIn>
                            )}
                        </Box>
                    </Box>
                </Box>
            ) : (
                /* ── MOBILE: Compact header + scrollable tabs ── */
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, zIndex: 1 }}>
                        <Box sx={{ px: 1.5, pt: 1.5, pb: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <ButtonBase onClick={handleBack} sx={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '&:hover': { bgcolor: 'action.hover' } }}>
                                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                                </ButtonBase>
                                {hasGroupPhoto ? (
                                    <Avatar src={displayAvatarSrc} sx={{ width: 34, height: 34, bgcolor: 'action.hover' }} imgProps={{ style: { objectFit: 'cover' } }}>{groupName?.[0] || 'G'}</Avatar>
                                ) : (
                                    <GroupDefaultAvatar size={34} iconSize={18} />
                                )}
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupName}</Typography>
                                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Admin Console</Typography>
                                </Box>
                                {saveConfig.show && <Button variant="contained" size="small" onClick={saveConfig.onClick} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, fontSize: 12 }}>{saving ? 'Saving...' : 'Save'}</Button>}
                            </Box>
                            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
                                  sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 700, fontSize: 13, px: 1.5, minWidth: 'auto' }, '& .MuiTabs-indicator': { height: 2.5, borderRadius: '3px 3px 0 0' } }}>
                                {TAB_CONFIG.map(tab => <Tab key={tab.key} icon={tab.icon} iconPosition="start" label={tab.label} sx={{ gap: 0.5 }} />)}
                            </Tabs>
                        </Box>
                    </Box>
                    <Box sx={{ px: 1.25, py: 2, flex: 1, minHeight: 0, overflowY: 'auto' }} ref={contentRef}>
                        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                        {loading ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
                            <ContentFadeIn triggerKey={activeTab}>
                                <TabPanel value={activeTab} index={TABS.PROFILE}>{renderProfileTab()}</TabPanel>
                                <TabPanel value={activeTab} index={TABS.RULES}>{renderRulesTab()}</TabPanel>
                                <TabPanel value={activeTab} index={TABS.MEMBERS}>{renderMembersTab()}</TabPanel>
                                <TabPanel value={activeTab} index={TABS.REPORTED_POSTS}>
                                    <GroupAdminReportedPostsSection
                                        groupId={groupId}
                                        group={group}
                                        viewerMembership={viewerMembership}
                                        onToast={(severity, message) => {
                                            if (severity === 'error') setError(message);
                                            else { showSuccess(message); }
                                        }}
                                        onRefreshGroup={loadGroup}
                                    />
                                </TabPanel>
                                <TabPanel value={activeTab} index={TABS.SETTINGS}>{renderSettingsTab()}</TabPanel>
                            </ContentFadeIn>
                        )}
                    </Box>
                </Box>
            )}

            {/* Success Snackbar */}
            <SuccessSnackbar {...successSnackbarProps} />

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} maxWidth="sm" fullWidth
                    fullScreen={isMobile}
                    PaperProps={{ sx: { borderRadius: { xs: 0, sm: 2 }, m: { xs: 0, sm: undefined } } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />Delete Group
                    <IconButton onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>This will permanently delete <strong>{groupName}</strong> and all its posts, members, and data.</Typography>
                    <Typography sx={{ mb: 2 }}>Type <strong>{groupName}</strong> to confirm:</Typography>
                    <TextField fullWidth value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder="Type group name" />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteGroup} disabled={deleting || deleteConfirmName.trim().toLowerCase() !== groupName.trim().toLowerCase()} sx={{ textTransform: 'none', fontWeight: 700 }}>{deleting ? 'Deleting...' : 'Delete Permanently'}</Button>
                </DialogActions>
            </Dialog>

            {/* Transfer Ownership Dialog */}
            <Dialog open={transferDialogOpen} onClose={() => !transferring && setTransferDialogOpen(false)} maxWidth="sm" fullWidth
                    fullScreen={isMobile}
                    PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, m: { xs: 0, sm: undefined } } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TransferIcon />Transfer Ownership
                    <IconButton onClick={() => setTransferDialogOpen(false)} disabled={transferring} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Select an admin to transfer ownership to. They will become the new owner and you will become an admin.</Typography>
                    <FormControl fullWidth>
                        <InputLabel>Select Admin</InputLabel>
                        <Select value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)} label="Select Admin" disabled={transferring}>
                            {members.filter(m => {
                                const r = String(m.role || '').toLowerCase();
                                const odId = m.user_id || m.userId || (m.user || m).id;
                                const isThisOwner = r === 'owner' || (ownerUserId != null && String(odId) === String(ownerUserId));
                                return r === 'admin' && !isThisOwner;
                            }).map(m => {
                                const user = m.user || m;
                                const odId = m.user_id || m.userId || user.id;
                                const displayName = (
                                    user.name ||
                                    (user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : '') ||
                                    user.username ||
                                    user.handle ||
                                    'Unknown'
                                ).trim();
                                const displayHandle = user.handle || user.username || '';
                                return (
                                    <MenuItem key={odId} value={odId}>
                                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                                            {hasValidUserAvatar(getUserAvatarUrl(user)) ? (
                                                <Avatar src={getUserAvatarUrl(user)} sx={{ width: 32, height: 32 }} />
                                            ) : (
                                                <UserDefaultAvatar size={32} iconSize={18} />
                                            )}
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography fontWeight={700} fontSize={14} noWrap>{displayName}</Typography>
                                                {displayHandle && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>@{displayHandle}</Typography>}
                                            </Box>
                                        </Stack>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setTransferDialogOpen(false)} disabled={transferring} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" onClick={() => setTransferConfirmOpen(true)} disabled={!transferTargetId || transferring} sx={{ textTransform: 'none', fontWeight: 700 }}>Transfer</Button>
                </DialogActions>
            </Dialog>

            {/* Transfer Ownership Confirmation Dialog */}
            <Dialog open={transferConfirmOpen} onClose={() => !transferring && setTransferConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <WarningIcon color="warning" />Confirm Transfer
                    <IconButton onClick={() => setTransferConfirmOpen(false)} disabled={transferring} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {(() => {
                        const targetMember = members.find(m => {
                            const odId = m.user_id || m.userId || (m.user || m).id;
                            return String(odId) === String(transferTargetId);
                        });
                        const targetUser = targetMember?.user || targetMember;
                        const targetName = targetUser ? (
                            targetUser.name ||
                            (targetUser.first_name ? `${targetUser.first_name}${targetUser.last_name ? ` ${targetUser.last_name}` : ''}` : '') ||
                            targetUser.username ||
                            targetUser.handle ||
                            'this admin'
                        ).trim() : 'this admin';
                        return (
                            <>
                                <Typography sx={{ mb: 1 }}>
                                    Are you sure you want to transfer ownership of <strong>{groupName}</strong> to <strong>{targetName}</strong>?
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    They will become the new owner and you will be changed to an admin. This action takes effect immediately.
                                </Typography>
                            </>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setTransferConfirmOpen(false)} disabled={transferring} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={handleTransferOwnership} disabled={transferring} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        {transferring ? 'Transferring...' : 'Yes, Transfer Ownership'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* No Admins Available Dialog */}
            <Dialog open={noAdminsDialogOpen} onClose={() => setNoAdminsDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <MembersIcon color="primary" />No Admins Available
                    <IconButton onClick={() => setNoAdminsDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 1 }}>There are no other admins to transfer ownership to.</Typography>
                    <Typography variant="body2" color="text.secondary">Promote a member to admin first from the <strong>Members</strong> tab, then come back here to transfer ownership.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setNoAdminsDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setNoAdminsDialogOpen(false); setActiveTab(TABS.MEMBERS); }} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}>Go to Members</Button>
                </DialogActions>
            </Dialog>

            {/* Admin Limit Dialog */}
            <Dialog open={adminLimitDialogOpen} onClose={() => setAdminLimitDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <WarningIcon color="warning" />Admin Limit Reached
                    <IconButton onClick={() => setAdminLimitDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 1 }}>You can only have up to <strong>{MAX_ADMINS} admins</strong> per group (owner included).</Typography>
                    <Typography variant="body2" color="text.secondary">Remove an existing admin before promoting another member.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="contained" onClick={() => setAdminLimitDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}>Got it</Button>
                </DialogActions>
            </Dialog>

            {/* Moderation Dialog */}
            <Dialog open={moderationDialogOpen} onClose={() => !moderationBusy && setModerationDialogOpen(false)} maxWidth="sm" fullWidth
                    fullScreen={isMobile}
                    PaperProps={{ sx: { borderRadius: { xs: 0, sm: 2 }, m: { xs: 0, sm: undefined } } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {moderationAction === 'timeout' && <TimeoutIcon color="warning" />}
                    {moderationAction === 'untimeout' && <TimeoutIcon />}
                    {moderationAction === 'ban' && <BanIcon color="error" />}
                    {moderationAction === 'unban' && <BanIcon />}
                    {moderationAction === 'kick' && <RemoveIcon color="error" />}
                    {moderationAction === 'timeout' && 'Timeout Member'}
                    {moderationAction === 'untimeout' && 'Remove Timeout'}
                    {moderationAction === 'ban' && 'Ban Member'}
                    {moderationAction === 'unban' && 'Unban Member'}
                    {moderationAction === 'kick' && 'Remove Member'}
                    <IconButton onClick={() => setModerationDialogOpen(false)} disabled={moderationBusy} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {moderationTarget && (
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            {hasValidUserAvatar(getUserAvatarUrl(moderationTarget.user)) ? (
                                <Avatar src={getUserAvatarUrl(moderationTarget.user)} sx={{ width: 48, height: 48 }} />
                            ) : (
                                <UserDefaultAvatar size={48} iconSize={28} />
                            )}
                            <Box>
                                <Typography fontWeight={700}>{(moderationTarget.user?.name || (moderationTarget.user?.first_name ? `${moderationTarget.user.first_name}${moderationTarget.user.last_name ? ` ${moderationTarget.user.last_name}` : ''}` : '') || moderationTarget.user?.username || moderationTarget.user?.handle || 'Unknown').trim()}</Typography>
                                {(moderationTarget.user?.handle || '') && <Typography variant="body2" color="text.secondary">@{moderationTarget.user.handle}</Typography>}
                            </Box>
                        </Stack>
                    )}
                    {moderationAction === 'timeout' && (
                        <>
                            <Typography sx={{ mb: 2 }}>This member will not be able to post or comment for the selected duration.</Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Duration</InputLabel>
                                <Select value={moderationDuration} onChange={(e) => setModerationDuration(e.target.value)} label="Duration">
                                    {TIMEOUT_DURATION_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </>
                    )}
                    {moderationAction === 'untimeout' && <Typography sx={{ mb: 2 }}>This will immediately allow the member to post and comment again.</Typography>}
                    {moderationAction === 'ban' && <Typography sx={{ mb: 2 }} color="error.main">This member will be permanently banned from the group.</Typography>}
                    {moderationAction === 'unban' && <Typography sx={{ mb: 2 }}>This will allow the member to participate in the group again.</Typography>}
                    {moderationAction === 'kick' && <Typography sx={{ mb: 2 }}>This member will be removed from the group. They can request to rejoin.</Typography>}
                    <TextField fullWidth label="Reason (optional)" value={moderationReason} onChange={(e) => setModerationReason(e.target.value)} placeholder="Provide a reason for this action..." multiline rows={2} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setModerationDialogOpen(false)} disabled={moderationBusy} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color={moderationAction === 'ban' || moderationAction === 'kick' ? 'error' : moderationAction === 'timeout' ? 'warning' : 'primary'} onClick={handleExecuteModeration} disabled={moderationBusy} sx={{ textTransform: 'none', fontWeight: 700 }}>{moderationBusy ? 'Processing...' : 'Confirm'}</Button>
                </DialogActions>
            </Dialog>

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

            {/* Cover Crop Dialog */}
            <ImageCropDialog
                open={coverCropDialogOpen}
                onClose={() => { setCoverCropDialogOpen(false); setRawCoverSrc(''); }}
                imageSrc={rawCoverSrc}
                aspect={COVER_ASPECT}
                title="Crop Cover Photo"
                outputSize={{ width: 1400, height: Math.round(1400 / COVER_ASPECT) }}
                onCropComplete={handleCoverCropComplete}
            />

            {/* Invite Followers Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} fullWidth maxWidth="sm"
                    fullScreen={isMobile}
                    PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, m: { xs: 0, sm: undefined } } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <InviteIcon fontSize="small" />Invite Followers
                    <IconButton onClick={() => setInviteDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                        Search your followers and send them an invite to this group.
                    </Typography>
                    <TextField
                        fullWidth size="small" placeholder="Search followers..."
                        value={inviteDialogSearch}
                        onChange={(e) => setInviteDialogSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLoadInviteCandidates(inviteDialogSearch); } }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button size="small" variant="contained" onClick={() => handleLoadInviteCandidates(inviteDialogSearch)} disabled={inviteDialogSearching}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, minWidth: 76 }}>
                                        Search
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
                    />

                    <Divider sx={{ mb: 1.5 }} />

                    {inviteDialogSearching ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                    ) : inviteDialogResults.length > 0 ? (
                        <Box sx={{ maxHeight: { xs: 'none', sm: 380 }, overflowY: 'auto', flex: { xs: 1, sm: 'none' }, minHeight: 0 }}>
                            <Stack spacing={1}>
                                {inviteDialogResults.map(user => {
                                    const uid = user.id;
                                    const alreadySent = inviteSentIds.has(uid);
                                    const userName = String(user.name || user.first_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User').trim();
                                    const userHandle = user.handle || user.username || '';
                                    return (
                                        <Stack key={uid} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, px: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                            {hasValidUserAvatar(getUserAvatarUrl(user)) ? (
                                                <Avatar src={getUserAvatarUrl(user)} sx={{ width: 40, height: 40 }} />
                                            ) : (
                                                <UserDefaultAvatar size={40} iconSize={24} />
                                            )}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography fontWeight={700} noWrap sx={{ fontSize: 14 }}>{userName}</Typography>
                                                {userHandle && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>@{userHandle}</Typography>}
                                            </Box>
                                            <Button
                                                size="small"
                                                variant={alreadySent ? 'outlined' : 'contained'}
                                                disabled={alreadySent}
                                                startIcon={alreadySent ? <CheckIcon fontSize="small" /> : <SendIcon fontSize="small" />}
                                                onClick={() => handleDialogSendInvite(uid)}
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, px: 1.5, flexShrink: 0 }}
                                            >
                                                {alreadySent ? 'Sent' : 'Invite'}
                                            </Button>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </Box>
                    ) : (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {inviteDialogSearch.trim() ? 'No followers match your search.' : 'Your followers will appear here.'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

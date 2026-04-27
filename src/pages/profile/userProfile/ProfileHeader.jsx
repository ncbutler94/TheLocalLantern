// src/pages/profile/userProfile/ProfileHeader.jsx
// Avatar-only profile header (cover photo removed).
//
// ENHANCED VERSION: Visual polish with gradient backgrounds, glowing avatar ring,
// and refined typography while preserving all existing logic.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import axios from '../../../api/axiosInstance';
import { secureFetch } from '../../../utils/secureFetch';
import { useLocation, useNavigate } from 'react-router-dom';

import { alpha as alphaColor, keyframes } from '@mui/material/styles';

import cityCountyMap from '../../../data/cityCountyMap.json';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import BlockIcon from '@mui/icons-material/Block';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';

import {
    Alert,
    Avatar,
    Autocomplete,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    Divider,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    Link,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Popper,
    Select,
    Snackbar,
    Checkbox,
    FormControlLabel,
    Radio,
    RadioGroup,
    Slider,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    LinearProgress,
} from '@mui/material';

import Cropper from 'react-easy-crop';
import CropIcon from '@mui/icons-material/Crop';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';

import PhotosUploadSection from '../../../components/PhotosUploadSection';
import SmartMenu from '../../../components/SmartMenu';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';

import { useActiveAccount } from '../../../components/AccountContext';
import ShareDialog from '../../../components/ShareDialog';
import { ReportDialog } from '../../../components/ActionBar';
import UserCardPopover from '../../../components/UserCardPopover';
import { useAuth } from '../../../components/AuthModalContext';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { checkReservedUsername } from '../../../utils/reservedUsernames';

// Social media platform icons (inline SVGs for platforms without MUI icons)
const FacebookSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const InstagramSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

const TikTokSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

const XTwitterSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const LinkedInSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const SnapchatSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.991-.246.045-.016.091-.031.105-.031.404 0 .712.283.712.58 0 .172-.09.344-.299.463-.615.343-1.489.555-1.78.63-.09.03-.148.045-.194.06.003.017.003.033.003.05 0 .06-.003.12-.015.18-.007.044-.017.088-.03.13.074.223.268.63.72 1.038.69.627 1.559.988 2.002 1.106.179.049.299.165.299.344 0 .209-.134.42-.479.554-.45.165-1.109.264-1.439.306-.03.003-.06.009-.089.015-.02.006-.029.021-.029.036 0 .09-.03.18-.092.254-.18.223-.449.39-.672.49-.12.06-.18.09-.18.18 0 .075.045.164.135.254.298.3.449.634.449.884 0 .135-.045.254-.135.344a.55.55 0 01-.389.15c-.135 0-.284-.045-.449-.135-.449-.24-.84-.36-1.17-.36-.15 0-.3.03-.449.09-.12.06-.179.12-.179.18 0 .075.06.164.18.269.269.239.404.524.404.824 0 .3-.135.57-.404.779C15.705 23.44 14.01 24 12.026 24c-1.98 0-3.678-.555-4.532-1.38-.269-.21-.404-.48-.404-.78 0-.299.135-.584.404-.824.12-.105.18-.194.18-.269 0-.06-.06-.12-.179-.18a1.162 1.162 0 00-.449-.09c-.33 0-.72.12-1.17.36-.165.09-.314.135-.449.135a.55.55 0 01-.39-.15.46.46 0 01-.134-.344c0-.25.15-.584.449-.884.09-.09.135-.18.135-.254 0-.09-.06-.12-.18-.18a2.003 2.003 0 01-.672-.49.448.448 0 01-.092-.254c0-.015-.009-.03-.03-.036a4.34 4.34 0 01-.088-.015c-.33-.042-.989-.141-1.439-.306-.345-.134-.479-.345-.479-.554 0-.179.12-.295.299-.344.443-.118 1.312-.479 2.002-1.106.452-.408.646-.815.72-1.038a.882.882 0 01-.03-.13 1.036 1.036 0 01-.015-.18c0-.017 0-.033.003-.05a1.478 1.478 0 01-.194-.06c-.291-.075-1.165-.287-1.78-.63-.21-.12-.299-.291-.299-.463 0-.297.308-.58.712-.58.014 0 .06.015.105.031.332.126.69.23.991.246.198 0 .326-.045.401-.09a8.262 8.262 0 01-.033-.57c-.104-1.628-.23-3.654.299-4.847C6.859 1.069 10.216.793 11.206.793h1z" />
    </svg>
);

// ── Cover photo crop constants (matching business admin) ──
const COVER_ASPECT = 3;
const COVER_OUTPUT = { width: 1200, height: 400 };
const AVATAR_CROP_ASPECT = 1;
const AVATAR_CROP_OUTPUT = { width: 400, height: 400 };

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const createCroppedImage = async (imageSrc, pixelCrop, outputWidth, outputHeight) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas is empty')); return; }
            resolve(blob);
        }, 'image/jpeg', 0.92);
    });
};

/**
 * Scan a single image File/Blob for NSFW content via the backend.
 * Returns { safe: true } or { safe: false, message: '...' }.
 * (Same helper used in CreateEditEventModal.)
 */
async function scanImageFile(file) {
    try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await secureFetch('/api/community/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn\u2019t meet our community guidelines.' };
            return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
        }
        if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn\u2019t meet our community guidelines.' };
        return { safe: true };
    } catch {
        return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
    }
}

// Platform config for social link icons display (defined outside component to prevent re-creation)
const SOCIAL_PLATFORMS = [
    { key: 'website', label: 'Website', icon: LanguageRoundedIcon, color: '#4A5568', isMui: true },
    { key: 'facebook', label: 'Facebook', icon: FacebookSvgIcon, color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: InstagramSvgIcon, color: '#E4405F' },
    { key: 'tiktok', label: 'TikTok', icon: TikTokSvgIcon, color: '#000000' },
    { key: 'x', label: 'X', icon: XTwitterSvgIcon, color: '#000000' },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInSvgIcon, color: '#0A66C2' },
];

// Country / US-state lists (same as Register.jsx — defined outside component)
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'IN', name: 'India' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'GR', name: 'Greece' },
    { code: 'TR', name: 'Turkey' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'EG', name: 'Egypt' },
    { code: 'KE', name: 'Kenya' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Peru' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'ID', name: 'Indonesia' },
];

const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' },
];


const alpha = alphaColor;
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

// Brand colors for visual enhancement
// Lantern gold — uses theme secondary.main
// Lantern green — uses theme primary.main
// Lantern green light — uses theme primary.light

// Subtle glow animation for the avatar ring
const pulseGlow = (t) => keyframes`
    0%, 100% {
        box-shadow: 0 0 0 4px ${t.palette.background.paper},
        0 0 0 6px ${alphaColor(t.palette.primary.main, 0.35)},
        0 8px 32px ${alphaColor(t.palette.primary.main, 0.18)};
    }
    50% {
        box-shadow: 0 0 0 4px ${t.palette.background.paper},
        0 0 0 8px ${alphaColor(t.palette.primary.main, 0.25)},
        0 12px 40px ${alphaColor(t.palette.primary.main, 0.22)};
    }
`;

// If you already have this file (you previously generated it for map flyTo),
// this import enables the auto-county behavior + city validation.
// Expected shapes supported (best-effort):
// - [{ city: "Piedmont", county: "Calhoun" }, ...]
// - [{ name: "Piedmont", county_name: "Calhoun" }, ...]
// - { "Piedmont": "Calhoun", ... }
const ALABAMA_COUNTIES = [
    'Autauga','Baldwin','Barbour','Bibb','Blount','Bullock','Butler','Calhoun','Chambers','Cherokee','Chilton','Choctaw',
    'Clarke','Clay','Cleburne','Coffee','Colbert','Conecuh','Coosa','Covington','Crenshaw','Cullman','Dale','Dallas','DeKalb',
    'Elmore','Escambia','Etowah','Fayette','Franklin','Geneva','Greene','Hale','Henry','Houston','Jackson','Jefferson','Lamar',
    'Lauderdale','Lawrence','Lee','Limestone','Lowndes','Macon','Madison','Marengo','Marion','Marshall','Mobile','Monroe',
    'Montgomery','Morgan','Perry','Pickens','Pike','Randolph','Russell','St. Clair','Shelby','Sumter','Talladega','Tallapoosa',
    'Tuscaloosa','Walker','Washington','Wilcox','Winston',
];

const normalizeCountyDraft = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    return s.replace(/\s*county\s*$/i, '').trim();
};

const normalizeCounty = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    return /county\s*$/i.test(s) ? s : `${s} County`;
};

const formatLongDate = (v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

function MetaPill({ locationLabel, joinedLabel }) {
    if (!locationLabel && !joinedLabel) return null;

    const Pill = ({ icon, text }) => (
        <Box
            sx={(t) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1.2,
                py: 0.6,
                borderRadius: 999,
                border: '1px solid',
                borderColor: alphaColor(t.palette.primary.main, 0.12),
                bgcolor: (t) => alpha(t.palette.background.paper, 0.92),
                backdropFilter: 'blur(8px)',
                boxShadow: `0 2px 8px ${alphaColor(t.palette.primary.main, 0.06)}`,
                maxWidth: 'fit-content',
                transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                '&:hover': {
                    bgcolor: (t) => alpha(t.palette.background.paper, 1),
                    borderColor: alpha(t.palette.primary.main, 0.3),
                    boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.1)}`,
                },
            })}
        >
            {icon}
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: { xs: 185, sm: 240, md: 280 },
                    color: "primary.main",
                    letterSpacing: '0.01em',
                }}
            >
                {text}
            </Typography>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.25,
                flexWrap: 'nowrap',
                mt: 0,
            }}
        >
            {locationLabel ? (
                <Pill
                    icon={<LocationOnIcon sx={{ fontSize: 14, color: "primary.main" }} />}
                    text={locationLabel}
                />
            ) : null}

            {joinedLabel ? (
                <Pill
                    icon={<CalendarMonthIcon sx={{ fontSize: 14, color: "primary.main" }} />}
                    text={`Joined ${joinedLabel}`}
                />
            ) : null}
        </Box>
    );
}

MetaPill.propTypes = {
    locationLabel: PropTypes.string,
    joinedLabel: PropTypes.string,
};

function AvatarLightbox({ open, onClose, src, alt, onReport, isOwner }) {
    const isMobileScreen = useMediaQuery((t) => t.breakpoints.down('sm'));
    const handleClose = (_e, reason) => {
        if (reason === 'backdropClick') return;
        onClose?.();
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen={isMobileScreen}
            disableScrollLock
            fullWidth
            maxWidth="lg"
            PaperProps={{ sx: { ...(!isMobileScreen && { height: '92vh', m: 0, borderRadius: 3 }), overflow: 'hidden' } }}
        >
            <Box sx={{ position: 'relative', height: '100%', bgcolor: 'common.black' }}>
                <IconButton
                    aria-label="Close"
                    onClick={() => onClose?.()}
                    sx={(t) => ({
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                        color: 'common.white',
                        zIndex: 3,
                        '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) },
                    })}
                >
                    <CloseIcon />
                </IconButton>

                {/* Report photo button — only shown for non-owners */}
                {!isOwner && typeof onReport === 'function' && (
                    <IconButton
                        aria-label="Report photo"
                        onClick={onReport}
                        sx={(t) => ({
                            position: 'absolute',
                            top: 10,
                            right: 56,
                            bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                            color: 'common.white',
                            zIndex: 3,
                            '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) },
                        })}
                    >
                        <FlagOutlinedIcon />
                    </IconButton>
                )}

                {src ? (
                    <Box
                        component="img"
                        src={src}
                        alt={alt || ''}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                ) : null}
            </Box>
        </Dialog>
    );
}

AvatarLightbox.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    src: PropTypes.string,
    alt: PropTypes.string,
    onReport: PropTypes.func,
    isOwner: PropTypes.bool,
};

/* ---------- timeAgo — matches PostDetailModal exactly ---------- */
/* ---------- @mention helpers (matches PostDetailModal) ---------- */
const renderTextWithMentions = (text, onMentionClick) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;
    const re = /@([a-zA-Z0-9_]{2,30})/g;
    const out = [];
    let last = 0;
    let m;
    let key = 0;
    while ((m = re.exec(raw)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        const handle = m[1];
        const before = start > 0 ? raw[start - 1] : '';
        if (before && /[a-zA-Z_.]/.test(before)) continue;
        if (start > last) out.push(raw.slice(last, start));
        out.push(
            <Link
                key={`mention_${key++}_${start}`}
                component="button"
                type="button"
                underline="hover"
                onClick={(e) => onMentionClick?.(e, handle)}
                sx={{ p: 0, fontWeight: 900, display: 'inline', color: 'primary.main', cursor: 'pointer' }}
            >
                @{handle}
            </Link>
        );
        last = end;
    }
    if (out.length === 0) return raw;
    if (last < raw.length) out.push(raw.slice(last));
    return out;
};

const getMentionMatch = (text, cursorIndex) => {
    const raw = typeof text === 'string' ? text : String(text ?? '');
    const cursor = Number.isFinite(Number(cursorIndex)) ? Number(cursorIndex) : raw.length;
    const clamped = Math.max(0, Math.min(raw.length, cursor));
    const upto = raw.slice(0, clamped);
    const at = upto.lastIndexOf('@');
    if (at < 0) return null;
    const before = at > 0 ? upto[at - 1] : '';
    if (before && /[A-Za-z_.]/.test(before)) return null;
    const query = upto.slice(at + 1);
    if (!query || /\s/.test(query)) return null;
    if (!/^[A-Za-z0-9_.]{1,30}$/.test(query)) return null;
    return { start: at, query, end: clamped };
};

const getMentionAnchorVirtualEl = (textareaEl, caretIndex) => {
    if (!textareaEl || typeof window === 'undefined') return null;
    try {
        const value = String(textareaEl.value || '');
        const pos = Math.max(0, Math.min(Number(caretIndex) || value.length, value.length));
        const computed = window.getComputedStyle(textareaEl);
        const mirror = document.createElement('div');
        Object.assign(mirror.style, {
            position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', wordWrap: 'break-word',
            overflow: 'hidden', boxSizing: computed.boxSizing, width: computed.width, padding: computed.padding,
            border: computed.border, fontFamily: computed.fontFamily, fontSize: computed.fontSize,
            fontWeight: computed.fontWeight, lineHeight: computed.lineHeight, letterSpacing: computed.letterSpacing,
            left: '-9999px', top: '0px',
        });
        mirror.textContent = value.slice(0, pos);
        const marker = document.createElement('span');
        marker.textContent = value.slice(pos) || '.';
        mirror.appendChild(marker);
        document.body.appendChild(mirror);
        const mirrorRect = mirror.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();
        document.body.removeChild(mirror);
        const taRect = textareaEl.getBoundingClientRect();
        const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.2 || 18;
        const caretLeft = taRect.left + (markerRect.left - mirrorRect.left) - textareaEl.scrollLeft;
        const caretTop = taRect.top + (markerRect.top - mirrorRect.top) - textareaEl.scrollTop;
        const anchorY = caretTop + lineHeight;
        const rect = { top: anchorY, bottom: anchorY, left: caretLeft, right: caretLeft, width: 0, height: 0 };
        return { getBoundingClientRect: () => rect, contextElement: textareaEl };
    } catch { return null; }
};

const timeAgoPhoto = (input) => {
    if (!input) return '';
    const dateString = String(input);
    let d;
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        d = new Date(dateString);
    } else if (dateString.includes('T')) {
        d = new Date(dateString);
    } else {
        d = new Date(dateString.replace(' ', 'T'));
    }
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}${w === 1 ? 'wk' : 'wks'} ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}${mo === 1 ? 'mo' : 'mos'} ago`;
    const y = Math.floor(dys / 365);
    return `${y}${y === 1 ? 'yr' : 'yrs'} ago`;
};

export function PhotoCommentsDialog({
                                        open,
                                        onClose,
                                        profileHandleOrId,
                                        viewerId,
                                        isOwner,
                                        highlightCommentId,
                                        onSuccess,
                                        photoType = 'avatar',
                                        photoId: directPhotoId,
                                        photoUrl: directPhotoUrl,
                                        apiPrefix,
                                        allPhotos,
                                        onNavigatePhoto,
                                        onReportPhoto,
                                    }) {
    // When apiPrefix is provided, it's used as the full base path for photo endpoints
    // e.g. apiPrefix="/api/music/artists" → photosBase="/api/music/artists/photos"
    const photosBase = apiPrefix
        ? `${apiPrefix.replace(/\/+$/, '')}/photos`
        : `${API_BASE}/users/photos`;
    const viewerIdSafe = Number(viewerId || 0);

    const [viewerProfile, setViewerProfile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [photoRecord, setPhotoRecord] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentSort, setCommentSort] = useState('popular');
    const [commentText, setCommentText] = useState('');
    const [mediaLiked, setMediaLiked] = useState(false);
    const [mediaLikeCount, setMediaLikeCount] = useState(0);
    const [mediaLikeLoading, setMediaLikeLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [expandedMap, setExpandedMap] = useState({});
    const [toast, setToast] = useState({ open: false, msg: '' });

    // 3-dot menu state (single shared menu)
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuCommentId, setMenuCommentId] = useState(null);
    const [menuCanDelete, setMenuCanDelete] = useState(false);

    // Report dialog state
    const [reportOpen, setReportOpen] = useState(false);
    const [reportCommentId, setReportCommentId] = useState(null);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDetails, setReportDetails] = useState('');

    const listRef = useRef(null);
    const [highlightedId, setHighlightedId] = useState(null);
    const highlightTimerRef = useRef(0);

    // @mention autocomplete state
    const commentInputRef = useRef(null);
    const [mention, setMention] = useState({ open: false, query: '', results: [], start: -1, end: -1, anchorEl: null });
    const [mentionLoading, setMentionLoading] = useState(false);

    // Blocked users state
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());

    // Mobile comment sheet drag-to-expand state — three snap points:
    //   'hidden'    = photo 92vh / comments collapsed to a slim action bar
    //                 (Like / Comment / Share). Drag up or tap to restore.
    //   'collapsed' = photo 45vh / comments 55vh  (default on open)
    //   'expanded'  = photo 15vh / comments 85vh  (user dragged up)
    // dragOffset is the live finger delta in pixels while dragging (negative = drag up).
    const [sheetState, setSheetState] = useState('collapsed');
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartYRef = useRef(null);
    const dragActiveRef = useRef(false);

    const TRUNCATE_AT = 260;

    const reset = useCallback(() => {
        setLoading(false);
        setError('');
        setPhotoRecord(null);
        setComments([]);
        setCommentSort('popular');
        setCommentText('');
        setMediaLiked(false);
        setMediaLikeCount(0);
        setMediaLikeLoading(false);
        setPosting(false);
        setExpandedMap({});
        setHighlightedId(null);
        setMenuAnchor(null);
        setMenuCommentId(null);
        setMenuCanDelete(false);
        setReportOpen(false);
        setReportCommentId(null);
        setReportSubmitted(false);
        setReportReason('spam');
        setReportDetails('');
        setMention({ open: false, query: '', results: [], start: -1, end: -1, anchorEl: null });
        setMentionLoading(false);
        setSheetState('collapsed');
        setDragOffset(0);
        dragStartYRef.current = null;
        dragActiveRef.current = false;
        if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = 0;
        }
    }, []);

    const safeClose = useCallback((_e, reason) => {
        if (reason === 'backdropClick') return;
        reset();
        onClose?.();
    }, [onClose, reset]);

    const fetchComments = useCallback(async (photoId, sortKey) => {
        const pid = Number(photoId || 0);
        if (!pid) return [];
        const s = sortKey === 'newest' ? 'newest' : 'popular';
        const resp = await axios.get(`${photosBase}/${encodeURIComponent(pid)}/comments`, {
            params: { sort: s },
            withCredentials: true,
        });
        const rows = Array.isArray(resp.data?.comments)
            ? resp.data.comments
            : Array.isArray(resp.data) ? resp.data : [];
        return rows;
    }, [photosBase]);

    const fetchPhotoLikes = useCallback(async (photoId) => {
        const pid = Number(photoId || 0);
        if (!pid) return { liked: false, likes: 0 };
        const resp = await axios.get(`${photosBase}/${encodeURIComponent(pid)}/likes`, {
            withCredentials: true,
        });
        return { liked: !!resp.data?.hasLiked, likes: Number(resp.data?.likeCount || 0) };
    }, [photosBase]);

    // Fetch viewer profile (matches PostPage.jsx pattern — axiosInstance baseURL
    // was mangling the URL, so use secureFetch against the known-good path).
    useEffect(() => {
        if (!open) return;
        let alive = true;
        (async () => {
            try {
                const r = await secureFetch('/users/profile', { credentials: 'include' });
                if (!r.ok) return;
                const resp = await r.json();
                const u = resp?.user || resp || null;
                if (u && alive) setViewerProfile(u);
            } catch { /* ignore */ }
        })();
        return () => { alive = false; };
    }, [open]);

    // Fetch blocked user IDs and handles (matches PostDetailModal)
    useEffect(() => {
        if (!open || !viewerIdSafe) return;
        let active = true;
        (async () => {
            try {
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || !active) return;
                const data = await res.json();
                const ids = Array.isArray(data?.blocked_user_ids) ? data.blocked_user_ids : [];
                const idSet = new Set(ids.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0));
                if (active && idSet.size > 0) {
                    setBlockedUserIds(idSet);
                    const handles = new Set();
                    await Promise.all(
                        Array.from(idSet).slice(0, 50).map(async (uid) => {
                            try {
                                const r = await secureFetch(`/api/users/public/${uid}`, {
                                    credentials: 'include',
                                    headers: { Accept: 'application/json' },
                                });
                                if (!r.ok) return;
                                const d = await r.json();
                                const h = (d?.profile?.handle || d?.handle || '').toLowerCase().trim();
                                if (h) handles.add(h);
                            } catch { /* skip */ }
                        })
                    );
                    if (active && handles.size > 0) setBlockedHandles(handles);
                }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [open, viewerIdSafe]);

    // Listen for blocked-changed events (real-time updates during session)
    useEffect(() => {
        const onBlockedChanged = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const blocked = Boolean(e?.detail?.blocked);
            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                if (blocked) next.add(uid);
                else next.delete(uid);
                return next;
            });
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);

    // Fetch photo + comments + likes
    useEffect(() => {
        if (!open) return;
        // Need either a directPhotoId or a profileHandleOrId + photoType
        if (!directPhotoId && !profileHandleOrId) return;
        let alive = true;
        (async () => {
            setLoading(true);
            setError('');
            setPhotoRecord(null);
            setComments([]);
            try {
                let rec;
                if (directPhotoId) {
                    // Gallery photo — we already have the photo id and url
                    rec = { id: Number(directPhotoId), url: String(directPhotoUrl || '') };
                } else {
                    const r = await axios.get(`${photosBase}/special/${encodeURIComponent(profileHandleOrId)}/${encodeURIComponent(photoType)}`, { withCredentials: true });
                    const photo = r.data?.photo || r.data?.record || r.data || null;
                    if (!photo?.id || !photo?.url) throw new Error('Could not resolve photo record');
                    rec = { id: Number(photo.id), url: String(photo.url) };
                }
                if (!alive) return;
                // If the resolved URL is empty or clearly a placeholder, auto-close
                if (!rec.url || rec.url === 'null' || rec.url === 'undefined') {
                    safeClose();
                    return;
                }
                setPhotoRecord(rec);
                try {
                    const likeState = await fetchPhotoLikes(rec.id);
                    if (alive) { setMediaLiked(!!likeState?.liked); setMediaLikeCount(Number(likeState?.likes || 0)); }
                } catch { /* ignore */ }
                const rows = await fetchComments(rec.id, commentSort);
                if (!alive) return;
                setComments(Array.isArray(rows) ? rows : []);
            } catch (e) {
                if (!alive) return;
                // If we can't resolve the photo at all, just close the dialog
                safeClose();
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [open, profileHandleOrId, photoType, directPhotoId, directPhotoUrl, fetchComments, fetchPhotoLikes, commentSort, safeClose]);

    // Highlight scroll-to
    useEffect(() => {
        if (!open) return;
        const target = highlightCommentId != null ? String(highlightCommentId) : '';
        if (!target || loading || !Array.isArray(comments) || comments.length === 0) return;
        const safeEscape = (v) => { try { if (typeof window !== 'undefined' && window.CSS?.escape) return window.CSS.escape(v); } catch { /* ignore */ } return String(v).replace(/"/g, '\\"'); };
        const attempt = (triesLeft) => {
            const root = listRef.current;
            if (!root) return;
            const el = root.querySelector(`[data-photo-comment-id="${safeEscape(target)}"]`);
            if (el) {
                try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* ignore */ }
                setHighlightedId(target);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => { setHighlightedId(null); highlightTimerRef.current = 0; }, 6500);
                return;
            }
            if (triesLeft <= 0) return;
            requestAnimationFrame(() => attempt(triesLeft - 1));
        };
        requestAnimationFrame(() => requestAnimationFrame(() => attempt(8)));
    }, [open, highlightCommentId, loading, comments]);

    // Helper: resolve active account with proper numeric ID (artist IDs may be "artist:39")
    const resolveActiveAccount = useCallback(() => {
        const raw = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        if (!raw) return { type: 'personal', id: null, raw: null };
        const ft = String(raw.type || '').toLowerCase();
        let numericId = null;
        if (ft === 'business') {
            const n = Number(raw.id);
            numericId = Number.isFinite(n) && n > 0 ? n : null;
        } else if (ft === 'artist') {
            const rawArtId = raw.artistId ?? raw.artist_id ?? null;
            if (rawArtId != null) { numericId = Number(rawArtId) || null; }
            else {
                const idStr = String(raw.id || '');
                const n = idStr.startsWith('artist:') ? Number(idStr.replace('artist:', '')) : Number(raw.id);
                numericId = Number.isFinite(n) && n > 0 ? n : null;
            }
        }
        return { type: ft, id: numericId, raw };
    }, []);

    const toggleLike = useCallback(async (commentId) => {
        const cid = Number(commentId || 0);
        if (!cid) return;
        const acct = resolveActiveAccount();
        const likeBody = {
            ...(acct.type === 'business' && acct.id ? { business_id: acct.id } : {}),
            ...(acct.type === 'artist' && acct.id ? { artist_id: acct.id } : {}),
        };
        try {
            const r = await axios.post(`${photosBase}/comments/${encodeURIComponent(cid)}/like`, likeBody, { withCredentials: true });
            const liked = !!r.data?.liked;
            const likes = Number(r.data?.likes || 0);
            setComments((prev) => Array.isArray(prev) ? prev.map((c) => (Number(c.id) === cid ? { ...c, viewer_liked: liked, like_count: likes } : c)) : prev);
        } catch (e) {
            if (Number(e?.response?.status || 0) === 401) { try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ } }
        }
    }, [photosBase, resolveActiveAccount]);

    const toggleMediaLike = useCallback(async () => {
        if (!photoRecord?.id) return;
        setMediaLikeLoading(true);
        const acct = resolveActiveAccount();
        const likeBody = {
            ...(acct.type === 'business' && acct.id ? { business_id: acct.id } : {}),
            ...(acct.type === 'artist' && acct.id ? { artist_id: acct.id } : {}),
        };
        try {
            const r = await axios.post(`${photosBase}/${encodeURIComponent(photoRecord.id)}/like`, likeBody, { withCredentials: true });
            setMediaLiked(!!r.data?.liked);
            setMediaLikeCount(Number(r.data?.likes || 0));
        } catch (e) {
            if (Number(e?.response?.status || 0) === 401) { try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ } }
        } finally { setMediaLikeLoading(false); }
    }, [photoRecord?.id]);

    const deleteComment = useCallback(async (commentId) => {
        const cid = Number(commentId || 0);
        if (!cid) return;
        try {
            await axios.delete(`${photosBase}/comments/${encodeURIComponent(cid)}`, { withCredentials: true });
            if (photoRecord?.id) { const rows = await fetchComments(photoRecord.id, commentSort); setComments(Array.isArray(rows) ? rows : []); }
            else { setComments((prev) => (Array.isArray(prev) ? prev.filter((c) => Number(c.id) !== cid) : prev)); }
            if (onSuccess) onSuccess('Comment deleted.');
        } catch (e) {
            if (Number(e?.response?.status || 0) === 401) { try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ } return; }
            setError(e?.response?.data?.message || 'Unable to delete comment');
        }
    }, [photoRecord?.id, fetchComments, commentSort, onSuccess]);

    const submitReport = useCallback(async () => {
        const cid = Number(reportCommentId || 0);
        if (!cid) return;
        try {
            await axios.post(`${photosBase}/comments/${encodeURIComponent(cid)}/flag`, { reason: reportReason, details: reportDetails }, { withCredentials: true });
            setReportSubmitted(true);
        } catch (e) {
            if (Number(e?.response?.status || 0) === 401) { try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ } }
            else { setToast({ open: true, msg: e?.response?.data?.message || 'Could not submit report.' }); }
        }
    }, [reportCommentId, reportReason, reportDetails, photosBase]);

    const submit = useCallback(async () => {
        if (!photoRecord?.id) return;
        const cleaned = String(commentText || '').trim().slice(0, 1000);
        if (!cleaned) return;
        setPosting(true);
        setError('');
        const acct = resolveActiveAccount();
        const payload = {
            content: cleaned,
            ...(acct.type === 'business' && acct.id ? {
                business_id: acct.id,
                account_type: 'business',
                account_id: acct.id,
                account_handle: acct.raw?.slug || acct.raw?.handle || '',
                account_name: acct.raw?.name || '',
                account_avatar_url: acct.raw?.avatar_url || acct.raw?.logo_url || '',
            } : {}),
            ...(acct.type === 'artist' && acct.id ? {
                artist_id: acct.id,
                account_type: 'artist',
                account_id: acct.id,
                account_handle: acct.raw?.slug || acct.raw?.handle || '',
                account_name: acct.raw?.name || '',
                account_avatar_url: acct.raw?.avatar_url || '',
            } : {}),
        };
        const acctHeaders = (() => { try { return typeof getAccountHeaders === 'function' ? getAccountHeaders() : {}; } catch { return {}; } })();
        try {
            await axios.post(`${photosBase}/${encodeURIComponent(photoRecord.id)}/comments`, payload, { withCredentials: true, headers: { ...acctHeaders } });
            setCommentText('');
            const rows = await fetchComments(photoRecord.id, commentSort);
            setComments(Array.isArray(rows) ? rows : []);
            setExpandedMap({});
        } catch (e) {
            if (Number(e?.response?.status || 0) === 401) { try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ } setError('Please log in to comment.'); }
            else { setError(e?.response?.data?.message || e?.message || 'Failed to post comment.'); }
        } finally { setPosting(false); }
    }, [photoRecord?.id, commentText, fetchComments, commentSort, photosBase, resolveActiveAccount]);

    const canSubmit = Boolean(String(commentText || '').trim()) && !posting;

    // @mention sync
    const closeMention = useCallback(() => {
        setMentionLoading(false);
        setMention({ open: false, query: '', results: [], start: -1, end: -1, anchorEl: null });
    }, []);

    const syncMention = useCallback((nextText) => {
        const el = commentInputRef.current;
        const caret = el?.selectionStart ?? nextText.length;
        const m = getMentionMatch(nextText, caret);
        if (!m) { if (mention.open) closeMention(); return; }
        const anchorEl = getMentionAnchorVirtualEl(el, m.end);
        setMention((s) => {
            if (s.open && s.query === m.query && s.start === m.start && s.end === m.end) return { ...s, anchorEl };
            return { open: true, query: m.query, results: [], start: m.start, end: m.end, anchorEl };
        });
    }, [closeMention, mention.open]);

    const selectMention = useCallback((handle) => {
        const h = String(handle || '').replace(/^@/, '').trim();
        if (!h || mention.start < 0) return;
        const before = commentText.slice(0, mention.start);
        const after = commentText.slice(mention.end);
        const next = `${before}@${h} ${after}`;
        setCommentText(next);
        closeMention();
        setTimeout(() => { const pos = mention.start + h.length + 2; commentInputRef.current?.setSelectionRange(pos, pos); commentInputRef.current?.focus(); }, 0);
    }, [commentText, mention.start, mention.end, closeMention]);

    // @mention search effect
    useEffect(() => {
        if (!mention.open || !mention.query) return undefined;
        setMentionLoading(true);
        const ctrl = new AbortController();
        const t = window.setTimeout(async () => {
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(mention.query)}`, {
                    credentials: 'include', signal: ctrl.signal, cache: 'no-store',
                });
                if (!res.ok) { setMentionLoading(false); return; }
                const data = await res.json().catch(() => []);
                setMention((s) => {
                    if (!s.open || s.query !== mention.query) return s;
                    return { ...s, results: Array.isArray(data) ? data : [] };
                });
            } catch { /* ignore */ } finally { setMentionLoading(false); }
        }, 180);
        return () => { window.clearTimeout(t); ctrl.abort(); };
    }, [mention.open, mention.query]);

    // Resolve viewer display based on active account (matches PostDetailModal)
    const auth = useAuth();
    const { isBusinessAccount: pcIsBA, isArtistAccount: pcIsAA, activeBusinessId: pcBizId, activeArtistId: pcArtId, activeAccount: pcAcctObj } = useActiveAccount();
    // Matches Header.jsx: placeholder/default URLs should be treated as no-avatar
    const isPlaceholderAvatar = (url) => {
        if (!url) return true;
        const s = String(url).trim().toLowerCase();
        if (!s || s === 'null' || s === 'undefined') return true;
        return s.includes('default_avatar')
            || s.includes('default_business')
            || s.includes('default_logo')
            || s.includes('default-avatar')
            || s.includes('placeholder');
    };

    // Pull from every shape we've seen the backend use — snake_case, camelCase,
    // and common nesting patterns (resp.user vs resp, auth.user vs auth.profile).
    const vp = viewerProfile || {};
    const vpUser = vp.user || {};
    const au = auth?.user || {};
    const auUser = au.user || {};
    const auProfile = auth?.profile || {};
    const viewerPersonalAvatarRaw =
        vp.avatar_url ||
        vp.avatarUrl ||
        vp.profile_picture ||
        vp.profilePicture ||
        vp.photo_url ||
        vp.photoUrl ||
        vp.avatarSrc ||
        vp.avatar ||
        vp.image_url ||
        vp.imageUrl ||
        vpUser.avatar_url ||
        vpUser.avatarUrl ||
        vpUser.profile_picture ||
        vpUser.profilePicture ||
        au.avatar_url ||
        au.avatarUrl ||
        au.profile_picture ||
        au.profilePicture ||
        au.photo_url ||
        au.photoUrl ||
        auUser.avatar_url ||
        auUser.avatarUrl ||
        auProfile.avatar_url ||
        auProfile.avatarUrl ||
        auProfile.profile_picture ||
        auProfile.profilePicture ||
        '';
    const viewerPersonalAvatarUrl = isPlaceholderAvatar(viewerPersonalAvatarRaw) ? '' : viewerPersonalAvatarRaw;
    const viewerPersonalLabel = `${viewerProfile?.first_name || ''} ${viewerProfile?.last_name || ''}`.trim() || viewerProfile?.display_name || 'Me';

    // ── Fetch active account avatar when not already in context (matches PostPage.jsx).
    // When the active account is a business or artist and its avatar_url isn't
    // populated, hit the public endpoint to resolve it, then cache to localStorage
    // so subsequent renders have it immediately.
    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState('');
    useEffect(() => {
        if (!pcIsBA && !pcIsAA) { setFetchedAccountAvatar(''); return; }
        const existingAvatar = String(pcAcctObj?.avatar_url || pcAcctObj?.avatarUrl || pcAcctObj?.logo_url || pcAcctObj?.logoUrl || '').trim();
        if (existingAvatar && !isPlaceholderAvatar(existingAvatar)) {
            setFetchedAccountAvatar('');
            return;
        }
        let active = true;
        (async () => {
            try {
                let url = '';
                if (pcIsBA) {
                    const slug = String(pcAcctObj?.slug || pcAcctObj?.handle || '').trim();
                    if (!slug || /^\d+$/.test(slug)) return;
                    url = `/api/business/${encodeURIComponent(slug)}`;
                } else if (pcIsAA && pcArtId) {
                    url = `/api/music/artists/${encodeURIComponent(String(pcArtId))}`;
                }
                if (!url) return;
                const res = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                if (!res.ok || !active) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data || {};
                const av = String(entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || '').trim();
                if (av && !isPlaceholderAvatar(av) && active) {
                    setFetchedAccountAvatar(av);
                    try {
                        const stored = JSON.parse(localStorage.getItem('ll:activeAccount') || '{}');
                        if (stored && typeof stored === 'object') {
                            stored.avatar_url = av;
                            localStorage.setItem('ll:activeAccount', JSON.stringify(stored));
                        }
                    } catch { /* ignore */ }
                }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [pcIsBA, pcIsAA, pcArtId, pcAcctObj?.slug, pcAcctObj?.handle, pcAcctObj?.avatar_url, pcAcctObj?.avatarUrl, pcAcctObj?.logo_url, pcAcctObj?.logoUrl]);

    // Business/artist accounts: use THEIR avatar only — never fall back to personal pic (matches Header.jsx).
    // Widened candidate list + fetchedAccountAvatar fallback mirrors PostPage.jsx.
    let viewerAvatarRaw;
    if (pcIsBA || pcIsAA) {
        if (fetchedAccountAvatar) {
            viewerAvatarRaw = fetchedAccountAvatar;
        } else {
            const candidates = [
                pcAcctObj?.avatar_url, pcAcctObj?.avatarUrl, pcAcctObj?.logo_url, pcAcctObj?.logoUrl,
                pcAcctObj?.image_url, pcAcctObj?.imageUrl, pcAcctObj?.photo_url, pcAcctObj?.photoUrl,
                pcAcctObj?.account_avatar_url,
            ];
            viewerAvatarRaw = '';
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && !isPlaceholderAvatar(s)) { viewerAvatarRaw = s; break; }
            }
        }
    } else {
        viewerAvatarRaw = viewerPersonalAvatarUrl;
    }

    // Cache-bust the avatar URL when dialog opens — but ONLY for legacy public
    // URLs. GCS v4 signed URLs have X-Goog-Signature computed over the canonical
    // query string; appending ?v=... invalidates the signature and produces 403.
    // (Matches PostPage.jsx cacheBustedAvatarUrl guard.)
    const [avatarCacheBust, setAvatarCacheBust] = useState(() => Date.now());
    useEffect(() => { if (open) setAvatarCacheBust(Date.now()); }, [open]);
    const viewerAvatarFinal = (() => {
        if (!viewerAvatarRaw) return '';
        // If it's a signed GCS URL, return it unchanged — the signature covers
        // every query param, so adding one causes GCS to reject with 403.
        if (/[?&]X-Goog-(Signature|Algorithm)=/i.test(viewerAvatarRaw)) return viewerAvatarRaw;
        // Legacy public URL — safe to cache-bust so stale browser cache doesn't
        // serve an old avatar after the user changes theirs.
        const sep = viewerAvatarRaw.includes('?') ? '&' : '?';
        return `${viewerAvatarRaw}${sep}v=${avatarCacheBust}`;
    })();
    const viewerDisplayName = (pcIsBA || pcIsAA)
        ? (pcAcctObj?.name || viewerPersonalLabel)
        : viewerPersonalLabel;

    // ── DIAGNOSTIC: enable with `localStorage.setItem('debugAvatar', '1')` in devtools,
    // then open the photo comments dialog. Remove this block once the composer avatar
    // is confirmed working.
    useEffect(() => {
        if (!open) return;
        try {
            if (localStorage.getItem('debugAvatar') !== '1') return;
            // eslint-disable-next-line no-console
            console.debug('[PhotoCommentsDialog] avatar resolution', {
                viewerProfile,
                authUser: auth?.user,
                pcIsBA, pcIsAA,
                pcAcctObj,
                fetchedAccountAvatar,
                viewerPersonalAvatarRaw,
                viewerPersonalAvatarUrl,
                viewerAvatarRaw,
                viewerAvatarFinal,
                isPlaceholderResultForPersonal: isPlaceholderAvatar(viewerPersonalAvatarRaw),
            });
        } catch { /* ignore */ }
    }, [open, viewerProfile, auth?.user, pcIsBA, pcIsAA, pcAcctObj, fetchedAccountAvatar, viewerPersonalAvatarRaw, viewerPersonalAvatarUrl, viewerAvatarRaw, viewerAvatarFinal]);


    // 3-dot menu handlers
    const openMenu = (event, commentId, canDel) => { setMenuAnchor(event.currentTarget); setMenuCommentId(commentId); setMenuCanDelete(canDel); };
    const closeMenu = () => { setMenuAnchor(null); setMenuCommentId(null); setMenuCanDelete(false); };
    const handleMenuDelete = () => { const cid = menuCommentId; closeMenu(); if (cid) deleteComment(cid); };
    const handleMenuReport = () => { const cid = menuCommentId; closeMenu(); if (cid) { setReportCommentId(cid); setReportSubmitted(false); setReportReason('spam'); setReportDetails(''); setReportOpen(true); } };

    // ── UserCardPopover state & handlers (matches PostDetailModal) ──
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    const viewerUser = viewerProfile || auth?.user || null;
    const { isBusinessAccount: ucIsBA, isArtistAccount: ucIsAA, activeBusinessId: ucBizId, activeArtistId: ucArtId } = useActiveAccount();

    const handleOpenUserCard = useCallback((el, author) => {
        setUserAnchor(el);
        setUserForCard({
            id: author?.id || author?.user_id,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url || author?.profile_picture,
            ...(author?.account_type ? { account_type: author.account_type } : {}),
            ...(author?.business_id ? { business_id: author.business_id } : {}),
            ...(author?.business_name ? { business_name: author.business_name } : {}),
            ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
            ...(author?.business_avatar_url ? { business_avatar_url: author.business_avatar_url } : {}),
            ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
            ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
            ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
            ...(author?.artist_avatar_url ? { artist_avatar_url: author.artist_avatar_url } : {}),
        });
    }, []);

    const onMentionClick = useCallback((e, mentionHandle) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const h = String(mentionHandle || '').replace(/^@/, '').trim();
        if (!h) return;
        handleOpenUserCard(e.currentTarget, { handle: h });
    }, [handleOpenUserCard]);

    const handleCardViewProfile = useCallback((u) => {
        if (u?.account_type === 'business' || u?.business_id) {
            const slug = u?.business_slug || u?.account_handle;
            if (slug) { window.location.assign(`/${slug}`); return; }
        }
        if (u?.account_type === 'artist' || u?.artist_id) {
            const artHandle = u?.artist_handle || u?.account_handle;
            if (artHandle) { window.location.assign(`/${artHandle}`); return; }
        }
        window.location.assign(`/${u?.handle || u?.id}`);
    }, []);

    const handleCardFollow = useCallback(async (targetUser) => {
        const tid = Number(targetUser?.id || userForCard?.id);
        if (!tid) return;
        if (viewerIdSafe && tid === viewerIdSafe) return;
        const urls = [`${API_BASE}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target_id: tid, action: 'follow' }),
                });
                if (res.ok) return;
            } catch { /* try next */ }
        }
    }, [userForCard, viewerIdSafe]);

    // Share the current photo via Web Share API (mobile) with clipboard fallback.
    const shareCurrentPhoto = useCallback(async () => {
        try {
            const shareUrl = (typeof window !== 'undefined' && window.location) ? window.location.href : '';
            if (!shareUrl) return;
            const title = 'Check out this photo';
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                try {
                    await navigator.share({ title, url: shareUrl });
                    return;
                } catch {
                    // user cancelled or share failed — fall through to clipboard
                }
            }
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                if (typeof onSuccess === 'function') onSuccess('Link copied to clipboard');
            }
        } catch { /* non-critical */ }
    }, [onSuccess]);

    const isSelfForCard = useMemo(() => {
        if (!viewerUser || !userForCard) return false;
        const isAccountCard = Boolean(userForCard.account_type === 'business' || userForCard.account_type === 'artist' || userForCard.business_id || userForCard.artist_id);
        if (ucIsBA && ucBizId) {
            if (!isAccountCard) return false;
            return (userForCard.account_type === 'business' || Boolean(userForCard.business_id)) && Number(userForCard.business_id) === Number(ucBizId);
        }
        if (ucIsAA && ucArtId) {
            if (!isAccountCard) return false;
            return (userForCard.account_type === 'artist' || Boolean(userForCard.artist_id)) && Number(userForCard.artist_id) === Number(ucArtId);
        }
        if (isAccountCard) return false;
        return (viewerUser.id != null && userForCard.id != null && Number(viewerUser.id) === Number(userForCard.id)) ||
            (viewerUser.handle && userForCard.handle && String(viewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase());
    }, [viewerUser, userForCard, ucIsBA, ucIsAA, ucBizId, ucArtId]);

    const isMobileScreen = useMediaQuery((t) => t.breakpoints.down('sm'));

    // ── Mobile comment sheet drag handlers ──
    // Drag up to expand the comments panel over the photo; drag down to collapse.
    // Snap to nearest state on release; threshold is ~60px of travel.
    const handleSheetTouchStart = useCallback((e) => {
        if (!isMobileScreen) return;
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        dragStartYRef.current = touch.clientY;
        dragActiveRef.current = true;
    }, [isMobileScreen]);

    const handleSheetTouchMove = useCallback((e) => {
        if (!isMobileScreen || !dragActiveRef.current) return;
        const touch = e.touches && e.touches[0];
        if (!touch || dragStartYRef.current == null) return;
        const delta = touch.clientY - dragStartYRef.current;
        // Clamp travel so the panel can't fly off-screen. Roughly ± 40% viewport height.
        const maxTravel = Math.round((typeof window !== 'undefined' ? window.innerHeight : 700) * 0.4);
        const clamped = Math.max(-maxTravel, Math.min(maxTravel, delta));
        setDragOffset(clamped);
    }, [isMobileScreen]);

    const handleSheetTouchEnd = useCallback(() => {
        if (!isMobileScreen || !dragActiveRef.current) return;
        dragActiveRef.current = false;
        const offset = dragOffset;
        const THRESHOLD = 60; // px of travel needed to flip state
        // Cascading snap: drag up steps expanded ← collapsed ← hidden,
        // drag down steps expanded → collapsed → hidden. One step per release.
        if (offset < -THRESHOLD) {
            if (sheetState === 'hidden') setSheetState('collapsed');
            else if (sheetState === 'collapsed') setSheetState('expanded');
        } else if (offset > THRESHOLD) {
            if (sheetState === 'expanded') setSheetState('collapsed');
            else if (sheetState === 'collapsed') setSheetState('hidden');
        }
        // Always reset the live finger offset; final size comes from sheetState.
        setDragOffset(0);
        dragStartYRef.current = null;
    }, [isMobileScreen, dragOffset, sheetState]);

    // Heights when snapped (before applying live drag offset).
    // 'hidden' leaves just enough room for the drag handle + action bar.
    // 11vh ≈ 88px on an 800px-tall viewport — room for handle (26px) + 44px tap
    // target + safe-area padding, without overflowing on shorter phones.
    const photoBaseVh = sheetState === 'expanded' ? 15 : sheetState === 'hidden' ? 89 : 45;
    const commentsBaseVh = sheetState === 'expanded' ? 85 : sheetState === 'hidden' ? 11 : 55;
    const sheetHidden = sheetState === 'hidden';

    return (
        <>
            <Dialog
                open={open}
                onClose={safeClose}
                fullScreen={isMobileScreen}
                disableScrollLock
                fullWidth
                maxWidth="lg"
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{
                    sx: {
                        ...(!isMobileScreen && {
                            height: { sm: '92vh' },
                            maxHeight: { sm: '92vh' },
                            m: { sm: 2 },
                            borderRadius: 3,
                        }),
                        ...(isMobileScreen && {
                            borderRadius: 0,
                        }),
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                    },
                }}
            >
                {/* ── Photo side (wider) ── */}
                <Box
                    sx={{
                        flex: { xs: 'unset', md: '1 1 62%' },
                        minWidth: 0,
                        bgcolor: 'common.black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: { xs: `calc(${photoBaseVh}vh + ${dragOffset}px)`, md: '100%' },
                        minHeight: { xs: 100 },
                        transition: dragActiveRef.current ? 'none' : 'height 0.25s ease',
                        position: 'relative',
                        '&:hover .photo-nav-arrow': { opacity: 1 },
                        // On mobile, always show nav arrows (no hover)
                        ...(isMobileScreen && {
                            '& .photo-nav-arrow': { opacity: 0.85 },
                        }),
                    }}
                >
                    {loading ? (
                        <CircularProgress sx={{ color: 'common.white' }} />
                    ) : photoRecord?.url ? (
                        <Box component="img" src={photoRecord.url} alt="Profile Photo" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    ) : (
                        <Typography color="grey.500">No photo available</Typography>
                    )}
                    {/* Mobile close button overlay on photo */}
                    {isMobileScreen && (
                        <IconButton
                            aria-label="Close"
                            onClick={() => safeClose(null, 'button')}
                            sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
                                color: 'common.white',
                                zIndex: 3,
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.75) },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                    {/* Report photo button — shown for non-owners on both mobile and desktop */}
                    {!isOwner && typeof onReportPhoto === 'function' && photoRecord?.url && (
                        <IconButton
                            aria-label="Report photo"
                            onClick={() => onReportPhoto(photoType, photoRecord.url, photoRecord.id || directPhotoId)}
                            sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
                                color: 'common.white',
                                zIndex: 3,
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.75) },
                            }}
                        >
                            <FlagOutlinedIcon />
                        </IconButton>
                    )}
                    {/* Album navigation arrows */}
                    {(() => {
                        if (!allPhotos || allPhotos.length <= 1 || !directPhotoId) return null;
                        const curIdx = allPhotos.findIndex((p) => {
                            const pid = typeof p === 'string' ? null : (p.id || p.photo_id || null);
                            return pid != null && Number(pid) === Number(directPhotoId);
                        });
                        if (curIdx < 0) return null;
                        const hasPrev = curIdx > 0;
                        const hasNext = curIdx < allPhotos.length - 1;
                        return (
                            <>
                                {hasPrev && (
                                    <IconButton
                                        className="photo-nav-arrow"
                                        onClick={() => {
                                            const prev = allPhotos[curIdx - 1];
                                            const pid = typeof prev === 'string' ? null : (prev.id || prev.photo_id || null);
                                            const purl = typeof prev === 'string' ? prev : prev.url;
                                            if (pid && onNavigatePhoto) onNavigatePhoto(pid, purl);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            left: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
                                            color: 'common.white',
                                            opacity: 0,
                                            transition: 'opacity 0.2s ease',
                                            '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.8) },
                                            zIndex: 2,
                                        }}
                                    >
                                        <CloseIcon sx={{ display: 'none' }} />
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    </IconButton>
                                )}
                                {hasNext && (
                                    <IconButton
                                        className="photo-nav-arrow"
                                        onClick={() => {
                                            const next = allPhotos[curIdx + 1];
                                            const pid = typeof next === 'string' ? null : (next.id || next.photo_id || null);
                                            const purl = typeof next === 'string' ? next : next.url;
                                            if (pid && onNavigatePhoto) onNavigatePhoto(pid, purl);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
                                            color: 'common.white',
                                            opacity: 0,
                                            transition: 'opacity 0.2s ease',
                                            '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.8) },
                                            zIndex: 2,
                                        }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                                    </IconButton>
                                )}
                            </>
                        );
                    })()}
                </Box>

                {/* ── Comments side ── */}
                <Box
                    sx={(t) => ({
                        flex: { xs: 'unset', md: '1 1 38%' },
                        minHeight: 0,
                        overflow: 'hidden',
                        minWidth: { md: 340 },
                        maxWidth: { md: 480 },
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: { xs: 'none', md: `1px solid ${alphaColor(t.palette.text.primary, 0.08)}` },
                        bgcolor: 'background.paper',
                        // On mobile fullscreen, the comments panel takes remaining space
                        ...(isMobileScreen && {
                            height: `calc(${commentsBaseVh}vh - ${dragOffset}px)`,
                            transition: dragActiveRef.current ? 'none' : 'height 0.25s ease',
                            borderTop: `1px solid ${alphaColor(t.palette.text.primary, 0.08)}`,
                            borderRadius: '16px 16px 0 0',
                            mt: -2,
                            position: 'relative',
                            zIndex: 1,
                        }),
                    })}
                >
                    {/* Drag handle indicator for mobile — draggable to expand/collapse the panel */}
                    {isMobileScreen && (
                        <Box
                            onTouchStart={handleSheetTouchStart}
                            onTouchMove={handleSheetTouchMove}
                            onTouchEnd={handleSheetTouchEnd}
                            onTouchCancel={handleSheetTouchEnd}
                            onClick={() => {
                                // Tap cycles: hidden → collapsed → expanded → collapsed.
                                // Covers the non-touch accessibility path too.
                                setSheetState((s) => (
                                    s === 'hidden' ? 'collapsed'
                                        : s === 'collapsed' ? 'expanded'
                                            : 'collapsed'
                                ));
                            }}
                            role="button"
                            aria-label={
                                sheetState === 'hidden' ? 'Show comments'
                                    : sheetState === 'expanded' ? 'Collapse comments'
                                        : 'Expand comments'
                            }
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                pt: 1.25,
                                pb: 1,
                                flexShrink: 0,
                                cursor: 'grab',
                                touchAction: 'none', // prevent the page from scrolling while dragging the handle
                                WebkitTapHighlightColor: 'transparent',
                                '&:active': { cursor: 'grabbing' },
                            }}
                        >
                            <Box sx={{ width: 44, height: 5, borderRadius: 2.5, bgcolor: (t) => alphaColor(t.palette.text.primary, 0.25) }} />
                        </Box>
                    )}
                    {sheetHidden ? (
                        /* Compact action bar — shown when sheet is collapsed away */
                        <Box
                            sx={(t) => ({
                                flex: 1,
                                minHeight: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                                px: 2,
                                pb: 'max(8px, env(safe-area-inset-bottom, 8px))',
                                gap: 1,
                            })}
                        >
                            <Box
                                component="button"
                                type="button"
                                onClick={toggleMediaLike}
                                disabled={mediaLikeLoading || !photoRecord?.id}
                                aria-label={mediaLiked ? 'Unlike photo' : 'Like photo'}
                                sx={(t) => ({
                                    all: 'unset',
                                    cursor: (mediaLikeLoading || !photoRecord?.id) ? 'default' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: mediaLiked ? 'primary.main' : 'text.secondary',
                                    opacity: (mediaLikeLoading || !photoRecord?.id) ? 0.5 : 1,
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 2,
                                    minHeight: 44,
                                    '&:active': { bgcolor: alphaColor(t.palette.primary.main, 0.08) },
                                })}
                            >
                                {mediaLiked ? <FavoriteIcon sx={{ fontSize: 22 }} /> : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
                                {Number(mediaLikeCount || 0) > 0 ? Number(mediaLikeCount || 0) : ''}
                            </Box>
                            <Box
                                component="button"
                                type="button"
                                onClick={() => setSheetState('collapsed')}
                                aria-label="Show comments"
                                sx={(t) => ({
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: 'text.secondary',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 2,
                                    minHeight: 44,
                                    '&:active': { bgcolor: alphaColor(t.palette.primary.main, 0.08) },
                                })}
                            >
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 22 }} />
                                {Array.isArray(comments) && comments.length > 0 ? comments.length : ''}
                            </Box>
                            <Box
                                component="button"
                                type="button"
                                onClick={shareCurrentPhoto}
                                aria-label="Share photo"
                                sx={(t) => ({
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: 'text.secondary',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 2,
                                    minHeight: 44,
                                    '&:active': { bgcolor: alphaColor(t.palette.primary.main, 0.08) },
                                })}
                            >
                                <ShareOutlinedIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box
                                component="button"
                                type="button"
                                onClick={() => safeClose(null, 'button')}
                                aria-label="Close"
                                sx={(t) => ({
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: 'text.secondary',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 2,
                                    minHeight: 44,
                                    '&:active': { bgcolor: alphaColor(t.palette.primary.main, 0.08) },
                                })}
                            >
                                <CloseIcon sx={{ fontSize: 22 }} />
                            </Box>
                        </Box>
                    ) : (<>
                        {/* Header — matches PostDetailModal sort toggle style */}
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1.5,
                                flexShrink: 0,
                                borderBottom: `1px solid ${alphaColor(t.palette.text.primary, 0.08)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            })}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                Comments
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {['popular', 'newest'].map((key) => (
                                    <Box
                                        key={key}
                                        component="button"
                                        type="button"
                                        onClick={() => setCommentSort(key)}
                                        sx={(t) => ({
                                            all: 'unset',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: commentSort === key ? 800 : 600,
                                            color: commentSort === key ? 'primary.main' : 'text.secondary',
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 1,
                                            bgcolor: commentSort === key ? alphaColor(t.palette.primary.main, 0.08) : 'transparent',
                                            '&:hover': { bgcolor: alphaColor(t.palette.primary.main, 0.06) },
                                        })}
                                    >
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </Box>
                                ))}

                                <IconButton
                                    aria-label="Close"
                                    onClick={() => safeClose(null, 'button')}
                                    size="small"
                                    sx={{ ml: 0.5, color: 'text.secondary' }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {error ? (
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography color="error" variant="body2">{error}</Typography>
                            </Box>
                        ) : null}

                        {/* Comments list */}
                        <Box ref={listRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 0 }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : comments.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">No comments yet. Be the first!</Typography>
                                </Box>
                            ) : (
                                comments.map((c) => {
                                    const cid = String(c.id || '');
                                    const commenterId = Number(c.user_id || 0);
                                    const commentPublicId = Number(c.public_id || 0);
                                    const commentBizId = Number(c.business_id || 0);
                                    const commentArtId = Number(c.artist_id || 0);

                                    // Resolve name/handle/avatar from business/artist account when present (matches ThreadedCommentItem)
                                    const name = c.business_name
                                        ? c.business_name
                                        : c.artist_name
                                            ? c.artist_name
                                            : (`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.display_name || 'User');
                                    const handle = c.business_slug
                                        ? c.business_slug
                                        : c.artist_handle
                                            ? c.artist_handle
                                            : (c.handle || c.username || '');
                                    const avatarSrc = c.business_avatar_url
                                        ? c.business_avatar_url
                                        : c.artist_avatar_url
                                            ? c.artist_avatar_url
                                            : (c.avatar_url || c.profile_picture || '');
                                    const hasAvatar = Boolean(c.business_avatar_url || c.artist_avatar_url || c.avatar_url || c.profile_picture);

                                    const commentHandle = (c.handle || c.business_slug || c.artist_handle || '').toLowerCase().trim();
                                    const body = String(c.content || c.body || c.text || '');
                                    const liked = Boolean(c.viewer_liked);
                                    const likeCount = Number(c.like_count || 0);
                                    const needsTruncate = body.length > TRUNCATE_AT;
                                    const isExpanded = expandedMap[cid];
                                    const displayBody = needsTruncate && !isExpanded ? `${body.slice(0, TRUNCATE_AT)}...` : body;
                                    const isHighlight = highlightedId === cid;
                                    const ts = timeAgoPhoto(c.created_at);

                                    // Account-aware delete logic (matches PostPage pattern)
                                    // 1) Photo owner can delete any comment — but only when
                                    //    logged in as the account that owns the photo.
                                    // 2) Comment author can delete their own comment — but
                                    //    only when logged in as the account that posted it.
                                    const acct = resolveActiveAccount();
                                    const activeIsBiz = acct.type === 'business' && acct.id > 0;
                                    const activeIsArt = acct.type === 'artist' && acct.id > 0;
                                    const isArtistPhotos = (apiPrefix || '').includes('artist');
                                    const isBusinessPhotos = (apiPrefix || '').includes('business');

                                    // Owner delete: only if active account matches the profile type
                                    const ownerCanDelete = isOwner && (
                                        (isArtistPhotos && activeIsArt) ||
                                        (isBusinessPhotos && activeIsBiz) ||
                                        (!isArtistPhotos && !isBusinessPhotos && !activeIsBiz && !activeIsArt)
                                    );

                                    // Own-comment delete: only if active account matches the comment's account
                                    const sameUser = commenterId === viewerIdSafe;
                                    const ownCommentDelete = sameUser && (
                                        (activeIsBiz && commentBizId === acct.id) ||
                                        (activeIsArt && commentArtId === acct.id) ||
                                        (!activeIsBiz && !activeIsArt && !commentBizId && !commentArtId)
                                    );

                                    const canDelete = ownerCanDelete || ownCommentDelete;

                                    // Build user card data with business/artist account info when present.
                                    // Loosened to trigger on the ID alone — some comment APIs don't
                                    // join business/music_artists to return the display fields, but
                                    // the ID tells us unambiguously that this comment was made by a
                                    // scoped account, which is all we need for avatar icon selection.
                                    const isBizComment = commentBizId > 0;
                                    const isArtComment = commentArtId > 0;
                                    // Visual-artist vs musician fallback. Backend stamps `profile_type`
                                    // on artist comments via the posts/comments API.
                                    const commentProfileType = String(
                                        c.profile_type || c.profileType ||
                                        c.artist_profile_type || c.artistProfileType || ''
                                    ).toLowerCase();
                                    const isVisualArtistComment = isArtComment && commentProfileType === 'artist';
                                    const cardData = {
                                        id: commenterId,
                                        first_name: c.first_name,
                                        last_name: c.last_name,
                                        handle: c.handle,
                                        avatar_url: c.avatar_url || c.profile_picture,
                                        ...(isBizComment ? {
                                            account_type: 'business',
                                            business_id: commentBizId,
                                            business_name: c.business_name,
                                            business_slug: c.business_slug,
                                            business_avatar_url: c.business_avatar_url,
                                        } : {}),
                                        ...(isArtComment ? {
                                            account_type: 'artist',
                                            artist_id: commentArtId,
                                            artist_name: c.artist_name,
                                            artist_handle: c.artist_handle,
                                            artist_avatar_url: c.artist_avatar_url,
                                        } : {}),
                                    };

                                    // Blocked user detection (matches PostDetailModal)
                                    const isBlockedUser = (
                                        (blockedUserIds.size > 0 && (
                                            (commenterId > 0 && blockedUserIds.has(commenterId)) ||
                                            (commentPublicId > 0 && blockedUserIds.has(commentPublicId)) ||
                                            (commentBizId > 0 && blockedUserIds.has(commentBizId)) ||
                                            (commentArtId > 0 && blockedUserIds.has(commentArtId))
                                        )) ||
                                        (blockedHandles.size > 0 && commentHandle && blockedHandles.has(commentHandle))
                                    );

                                    // Blocked placeholder
                                    if (isBlockedUser && !expandedMap[`blocked_${cid}`]) {
                                        return (
                                            <Box
                                                key={cid}
                                                data-photo-comment-id={cid}
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    alignItems: 'center',
                                                    py: 1,
                                                    px: 2,
                                                    bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                                                    my: 0.5,
                                                    mx: 1,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                                    Comment from a blocked user
                                                </Typography>
                                                <Link
                                                    component="button"
                                                    type="button"
                                                    underline="hover"
                                                    onClick={() => setExpandedMap((m) => ({ ...m, [`blocked_${cid}`]: true }))}
                                                    sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                                                >
                                                    Show
                                                </Link>
                                            </Box>
                                        );
                                    }

                                    return (
                                        <Box
                                            key={cid}
                                            data-photo-comment-id={cid}
                                            sx={(t) => ({
                                                display: 'flex',
                                                gap: 1.25,
                                                alignItems: 'flex-start',
                                                px: { xs: 1.75, sm: 2 },
                                                py: { xs: 1.5, sm: 1.25 },
                                                ...(isHighlight ? {
                                                    bgcolor: alphaColor(t.custom?.brand?.brass || '#A87822', 0.08),
                                                    borderRadius: 2.5,
                                                    border: '2px solid',
                                                    borderColor: alphaColor(t.custom?.brand?.brass || '#A87822', 0.45),
                                                    boxShadow: `0 0 16px ${alphaColor(t.custom?.brand?.brass || '#A87822', 0.15)}`,
                                                    mx: 1,
                                                    my: 0.5,
                                                    transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease',
                                                } : {}),
                                            })}
                                        >
                                            <Avatar
                                                src={hasAvatar ? avatarSrc : undefined}
                                                alt={name}
                                                onClick={(e) => handleOpenUserCard(e.currentTarget, cardData)}
                                                sx={(t) => ({ width: 44, height: 44, flexShrink: 0, border: '1px solid', borderColor: 'divider', cursor: 'pointer', bgcolor: hasAvatar ? undefined : alphaColor(t.palette.primary.main, 0.08), color: hasAvatar ? undefined : t.palette.primary.main })}
                                            >
                                                {isBizComment
                                                    ? <StorefrontOutlinedIcon sx={{ fontSize: 26 }} />
                                                    : isArtComment
                                                        ? (isVisualArtistComment
                                                            ? <PaletteRoundedIcon sx={{ fontSize: 24 }} />
                                                            : <MusicNoteRoundedIcon sx={{ fontSize: 24 }} />)
                                                        : <PersonRoundedIcon sx={{ fontSize: 26 }} />}
                                            </Avatar>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'nowrap' }}>
                                                    {/* Name + handle + time */}
                                                    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                                                        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                                                                onClick={(e) => handleOpenUserCard(e.currentTarget, cardData)}
                                                                noWrap
                                                            >
                                                                {name}
                                                            </Typography>
                                                            {ts ? (
                                                                <>
                                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                        {ts}
                                                                    </Typography>
                                                                </>
                                                            ) : null}
                                                            {isBlockedUser && expandedMap[`blocked_${cid}`] ? (
                                                                <>
                                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                                                                        Comment by a blocked user
                                                                    </Typography>
                                                                    <Link
                                                                        component="button"
                                                                        type="button"
                                                                        underline="hover"
                                                                        onClick={(e) => { e.stopPropagation(); setExpandedMap((m) => ({ ...m, [`blocked_${cid}`]: false })); }}
                                                                        sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}
                                                                    >
                                                                        Hide
                                                                    </Link>
                                                                </>
                                                            ) : null}
                                                        </Box>
                                                        {handle ? (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ lineHeight: 1.2, mt: 0.1, whiteSpace: 'nowrap', cursor: 'pointer' }}
                                                                onClick={(e) => handleOpenUserCard(e.currentTarget, cardData)}
                                                                noWrap
                                                            >
                                                                @{handle}
                                                            </Typography>
                                                        ) : null}
                                                    </Box>

                                                    {/* 3-dot menu — bordered button like PostDetailModal */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openMenu(e, cid, canDelete)}
                                                        sx={(t) => ({
                                                            flexShrink: 0,
                                                            border: `1px solid ${alphaColor(t.palette.text.primary, 0.10)}`,
                                                            bgcolor: 'background.paper',
                                                        })}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                {/* Comment body */}
                                                <Typography
                                                    variant="body2"
                                                    sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'text.primary' }}
                                                >
                                                    {renderTextWithMentions(displayBody, onMentionClick)}
                                                    {needsTruncate && !isExpanded ? (
                                                        <>
                                                            {' '}
                                                            <Box
                                                                component="button"
                                                                type="button"
                                                                onClick={() => setExpandedMap((m) => ({ ...m, [cid]: true }))}
                                                                sx={{ all: 'unset', cursor: 'pointer', fontSize: 14, color: 'primary.main', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                                                            >
                                                                more
                                                            </Box>
                                                        </>
                                                    ) : null}
                                                    {needsTruncate && isExpanded ? (
                                                        <>
                                                            {' '}
                                                            <Box
                                                                component="button"
                                                                type="button"
                                                                onClick={() => setExpandedMap((m) => ({ ...m, [cid]: false }))}
                                                                sx={{ all: 'unset', cursor: 'pointer', fontSize: 14, color: 'primary.main', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                                                            >
                                                                less
                                                            </Box>
                                                        </>
                                                    ) : null}
                                                </Typography>

                                                {/* Action buttons — Like (matches PostDetailModal Link style) */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75, minHeight: { xs: 36, sm: 'auto' } }}>
                                                    <Box
                                                        component="button"
                                                        type="button"
                                                        onClick={() => toggleLike(cid)}
                                                        sx={{
                                                            all: 'unset',
                                                            cursor: 'pointer',
                                                            fontSize: 13,
                                                            fontWeight: liked ? 900 : 700,
                                                            color: liked ? 'primary.main' : 'text.secondary',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            py: { xs: 0.5, sm: 0 },
                                                            // Larger touch target on mobile
                                                            minHeight: { xs: 32, sm: 'auto' },
                                                        }}
                                                    >
                                                        {liked
                                                            ? <FavoriteIcon sx={{ fontSize: 15 }} />
                                                            : <FavoriteBorderIcon sx={{ fontSize: 15 }} />
                                                        }
                                                        {likeCount > 0 ? likeCount : 'Like'}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>

                        {/* Like photo bar */}
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1,
                                flexShrink: 0,
                                borderTop: `1px solid ${alphaColor(t.palette.text.primary, 0.08)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            })}
                        >
                            <Box
                                component="button"
                                type="button"
                                onClick={toggleMediaLike}
                                disabled={mediaLikeLoading || !photoRecord?.id}
                                sx={{
                                    all: 'unset',
                                    cursor: (mediaLikeLoading || !photoRecord?.id) ? 'default' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: mediaLiked ? 'primary.main' : 'text.secondary',
                                    opacity: (mediaLikeLoading || !photoRecord?.id) ? 0.5 : 1,
                                }}
                            >
                                {mediaLiked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
                                {Number(mediaLikeCount || 0) > 0 ? Number(mediaLikeCount || 0) : ''} {mediaLiked ? 'Liked' : 'Like'}
                            </Box>
                        </Box>

                        {/* Composer */}
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1.25,
                                flexShrink: 0,
                                borderTop: `1px solid ${alphaColor(t.palette.text.primary, 0.08)}`,
                                bgcolor: alphaColor(t.palette.primary.main, 0.02),
                                // Safe area inset for iOS home indicator
                                pb: { xs: 'max(10px, env(safe-area-inset-bottom, 10px))', sm: 1.25 },
                            })}
                        >
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <Avatar
                                    src={viewerAvatarFinal || undefined}
                                    alt={viewerDisplayName}
                                    imgProps={{
                                        onError: (e) => {
                                            try {
                                                if (localStorage.getItem('debugAvatar') === '1') {
                                                    // eslint-disable-next-line no-console
                                                    console.warn('[PhotoCommentsDialog] composer avatar img failed to load', e?.target?.src);
                                                }
                                            } catch { /* ignore */ }
                                        },
                                    }}
                                    sx={(t) => ({ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, mt: 0.25, flexShrink: 0, border: '1px solid', borderColor: 'divider', bgcolor: viewerAvatarFinal ? undefined : alphaColor(t.palette.primary.main, 0.08), color: viewerAvatarFinal ? undefined : t.palette.primary.main })}
                                >
                                    {pcIsBA
                                        ? <StorefrontOutlinedIcon sx={{ fontSize: 24 }} />
                                        : pcIsAA
                                            ? ((String(pcAcctObj?.profile_type || pcAcctObj?.profileType || '').toLowerCase() === 'artist')
                                                ? <PaletteRoundedIcon sx={{ fontSize: 22 }} />
                                                : <MusicNoteRoundedIcon sx={{ fontSize: 22 }} />)
                                            : <PersonRoundedIcon sx={{ fontSize: 24 }} />}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                    <TextField
                                        fullWidth
                                        value={commentText}
                                        inputRef={commentInputRef}
                                        onChange={(e) => {
                                            const v = e?.target?.value ?? '';
                                            const next = v.length > 1000 ? v.slice(0, 1000) : v;
                                            setCommentText(next);
                                            syncMention(next);
                                        }}
                                        placeholder={`Comment as ${viewerDisplayName}…`}
                                        multiline
                                        maxRows={4}
                                        size="small"
                                        inputProps={{ maxLength: 1000 }}
                                        onKeyDown={(e) => {
                                            if (mention.open && e.key === 'Escape') { e.preventDefault(); closeMention(); return; }
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
                                        }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={submit}
                                                        disabled={!canSubmit}
                                                        aria-label="Send"
                                                        size="small"
                                                        sx={{ color: canSubmit ? "primary.main" : 'text.disabled' }}
                                                    >
                                                        <ArrowForwardRoundedIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: 2, alignItems: 'flex-end', fontSize: { xs: 13, sm: 'inherit' } },
                                        }}
                                    />

                                    {/* @mention autocomplete dropdown */}
                                    <Popper
                                        open={Boolean(mention.open)}
                                        anchorEl={mention.anchorEl || commentInputRef.current}
                                        placement="bottom-start"
                                        disablePortal={false}
                                        sx={{ zIndex: 2000 }}
                                    >
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                mt: 0.75,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                maxHeight: 240,
                                                width: { xs: '100%', sm: 320 },
                                                boxShadow: (t) => t.custom?.shadows?.lg || '0 8px 24px rgba(0,0,0,0.12)',
                                            }}
                                        >
                                            <List dense disablePadding>
                                                {mentionLoading ? (
                                                    <ListItem sx={{ py: 1 }}>
                                                        <ListItemText primary="Searching…" primaryTypographyProps={{ fontWeight: 800 }} />
                                                    </ListItem>
                                                ) : null}
                                                {!mentionLoading && (!mention.results || mention.results.length === 0) ? (
                                                    <ListItem sx={{ py: 1 }}>
                                                        <ListItemText primary="No results found" primaryTypographyProps={{ fontWeight: 800 }} />
                                                    </ListItem>
                                                ) : null}
                                                {!mentionLoading && mention.results.map((u) => {
                                                    const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User';
                                                    const uHandle = u.handle || u.username || '';
                                                    const uAvatar = u.avatar_url || u.profile_picture || '';
                                                    const uHasAvatar = Boolean(u.avatar_url || u.profile_picture);
                                                    return (
                                                        <ListItem
                                                            key={u.id || uHandle}
                                                            onClick={() => selectMention(uHandle)}
                                                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.06) } }}
                                                        >
                                                            <ListItemAvatar>
                                                                <Avatar src={uAvatar || undefined} sx={(t) => ({ width: 36, height: 36, bgcolor: uHasAvatar ? undefined : alphaColor(t.palette.primary.main, 0.08), color: uHasAvatar ? undefined : t.palette.primary.main })}>
                                                                    <PersonRoundedIcon sx={{ fontSize: 22 }} />
                                                                </Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary={uName}
                                                                secondary={uHandle ? `@${uHandle}` : ''}
                                                                primaryTypographyProps={{ fontWeight: 800, fontSize: 14 }}
                                                                secondaryTypographyProps={{ fontSize: 12 }}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        </Paper>
                                    </Popper>

                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.25, pr: 0.25 }}>
                                        {`${String(commentText || '').length}/1000`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </>)}
                </Box>
            </Dialog>

            {/* Shared 3-dot menu */}
            <SmartMenu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                onClick={(e) => e.stopPropagation()}
                disableScrollLock
                sx={{ zIndex: (t) => t.zIndex.modal + 55 }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alphaColor(t.palette.text.primary, 0.15)}`,
                        minWidth: 200,
                        py: 0.5,
                    },
                }}
            >
                {menuCanDelete ? (
                    <MenuItem onClick={handleMenuDelete} sx={{ py: 1 }}>
                        <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete" />
                    </MenuItem>
                ) : null}
                {menuCanDelete ? <Divider sx={{ my: 0.5 }} /> : null}
                <MenuItem onClick={handleMenuReport} sx={{ py: 1 }}>
                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Report comment" />
                </MenuItem>
            </SmartMenu>

            <Dialog
                disableScrollLock
                open={reportOpen}
                onClose={(_e, r) => {
                    if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                    setReportOpen(false); setReportCommentId(null); setReportSubmitted(false); setReportReason('spam'); setReportDetails('');
                }}
                fullWidth
                maxWidth="xs"
                sx={{ zIndex: (t) => t.zIndex.modal + 55 }}
                PaperProps={{ sx: { position: 'relative' } }}
            >
                <DialogTitle sx={{ pr: 7 }}>
                    {reportSubmitted ? 'Report submitted' : 'Report comment'}
                    <IconButton
                        aria-label="Close"
                        onClick={() => { setReportOpen(false); setReportCommentId(null); setReportSubmitted(false); setReportReason('spam'); setReportDetails(''); }}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {reportSubmitted ? (
                    <>
                        <DialogContent>
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                    <CheckRoundedIcon sx={{ fontSize: 28, color: 'success.dark' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Thank you for reporting</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your report helps keep our community safe. We'll review this comment and take appropriate action.
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() => { setReportOpen(false); setReportCommentId(null); setReportSubmitted(false); setReportReason('spam'); setReportDetails(''); }}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogContent dividers>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Choose a reason:
                            </Typography>
                            <RadioGroup value={reportReason} onChange={(e) => setReportReason(e.target.value)} sx={{ gap: 0.5 }}>
                                <FormControlLabel value="spam" control={<Radio />} label="Spam" />
                                <FormControlLabel value="harassment" control={<Radio />} label="Harassment" />
                                <FormControlLabel value="hate" control={<Radio />} label="Hate speech" />
                                <FormControlLabel value="nudity" control={<Radio />} label="Nudity" />
                                <FormControlLabel value="misinformation" control={<Radio />} label="Misinformation" />
                                <FormControlLabel value="illegal" control={<Radio />} label="Illegal content" />
                                <FormControlLabel value="other" control={<Radio />} label="Other" />
                            </RadioGroup>

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Details (optional)"
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button
                                variant="contained"
                                onClick={submitReport}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast({ open: false, msg: '' })}
                message={toast.msg}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => { setUserAnchor(null); setUserForCard(null); }}
                user={userForCard}
                isSelf={isSelfForCard}
                onFollow={handleCardFollow}
                onViewProfile={handleCardViewProfile}
            />
        </>
    );
}

PhotoCommentsDialog.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    profileHandleOrId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    viewerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isOwner: PropTypes.bool,
    highlightCommentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onSuccess: PropTypes.func,
    photoType: PropTypes.oneOf(['avatar', 'cover']),
    photoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    photoUrl: PropTypes.string,
    apiPrefix: PropTypes.string,
    allPhotos: PropTypes.array,
    onNavigatePhoto: PropTypes.func,
    onReportPhoto: PropTypes.func,
};


// Input styling
const CREAM_INPUT_SX = (t) => ({
    '& .MuiInputBase-root': { bgcolor: 'background.paper' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alphaColor(t.palette.primary.main, 0.2) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alphaColor(t.palette.primary.main, 0.4) },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "primary.main" },
});

export default function ProfileHeader({
                                          profile,
                                          avatarSrc,
                                          isMine,
                                          editMode,
                                          onEnterEdit,
                                          onSave,
                                          saveIcon,
                                          onCancel,
                                          onChangeAvatar,
                                          onDeleteAvatar,

                                          isFollowing,
                                          followRequested,
                                          isPrivateAccount,
                                          onToggleFollow,

                                          handleDraft,
                                          onHandleDraftChange,
                                          handleStats,
                                          handleError,

                                          firstNameDraft,
                                          lastNameDraft,
                                          onFirstNameDraftChange,
                                          onLastNameDraftChange,
                                          homeCityDraft,
                                          onHomeCityDraftChange,
                                          homeCountyDraft,
                                          onHomeCountyDraftChange,

                                          contact,
                                          onContactChange,

                                          countryDraft,
                                          onCountryDraftChange,
                                          stateDraft,
                                          onStateDraftChange,
                                          alabamaResident,
                                          onAlabamaResidentChange,

                                          privacyDraft,
                                          onPrivacyDraftChange,

                                          profileBioDraft,
                                          onProfileBioDraftChange,

                                          stagedDeleteAvatar = false,
                                          coverSrc,
                                          onChangeCover,
                                          onDeleteCover,
                                          stagedDeleteCover = false,
                                          hasCoverPhoto = false,
                                          viewerId,
                                          viewer: viewerProp,
                                          layout = 'full',
                                          onSuccess,
                                          galleryPhotos,
                                          setGalleryPhotos,
                                          onEditTouched,
                                      }) {
    const isSidebar = layout === 'sidebar';
    const viewerIdSafe = Number(viewerId || 0);
    const phTheme = useTheme();
    const isMobile = useMediaQuery(phTheme.breakpoints.down('sm'));
    const auth = useAuth();

    // Track whether user has touched any field since dialog opened.
    // If untouched, closing skips the "discard changes?" prompt.
    const editTouchedRef = useRef(false);
    useEffect(() => {
        if (editMode) editTouchedRef.current = false;
    }, [editMode]);
    const markTouched = useCallback(() => { editTouchedRef.current = true; }, []);

    // Detect if logged into a secondary (business/artist) account
    const { isBusinessAccount, isArtistAccount } = useActiveAccount();
    const isOnSecondaryAccount = isBusinessAccount || isArtistAccount;

    // When on a secondary account viewing your own personal profile,
    // show follow/share instead of Edit Profile
    const showEditButton = isMine && !isOnSecondaryAccount;
    const showFollowAndShare = !isMine || isOnSecondaryAccount;

    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Success snackbar for profile save
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const saveIntentRef = useRef(false);
    const prevEditModeRef = useRef(editMode);
    useEffect(() => {
        const wasEditing = prevEditModeRef.current;
        prevEditModeRef.current = editMode;
        // editMode went from true → false after save button was clicked
        if (wasEditing && !editMode && saveIntentRef.current) {
            showSuccess('Profile updated!');
        }
        saveIntentRef.current = false;
    }, [editMode, showSuccess]);

    // 3-dot menu state (profile header)
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const [profileReportOpen, setProfileReportOpen] = useState(false);
    const [profileReportSuccessOpen, setProfileReportSuccessOpen] = useState(false);
    const [profileToast, setProfileToast] = useState({ open: false, msg: '' });

    // Photo report state (for avatar/cover/gallery images)
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null); // { photoType, photoUrl, photoId, ownerId }

    // ── Moderation state ──
    const [moderationError, setModerationError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({}); // per-field profanity errors
    const editFormRef = useRef(null);

    // Use the viewer object passed from the parent (UserProfilePage passes `me`)
    // so ShareDialog immediately has the full user with handle/username.
    const viewerProfile = viewerProp || null;

    // ── Message button state ──
    const [msgDialogOpen, setMsgDialogOpen] = useState(false);
    const [msgBody, setMsgBody] = useState('');
    const [msgSending, setMsgSending] = useState(false);
    const [msgError, setMsgError] = useState('');
    const [msgSuccess, setMsgSuccess] = useState(false);

    const profileUserId = Number(profile?.id || 0);

    // Send message handler
    const handleSendMessage = useCallback(async () => {
        const body = String(msgBody || '').trim();
        if (!body || !profileUserId) return;

        // Client-side profanity check on message body
        const profanityResult = checkFieldsProfanity({ message: body });
        if (!profanityResult.clean) {
            setMsgError('Your message contains inappropriate language. Please revise.');
            return;
        }

        setMsgSending(true);
        setMsgError('');
        try {
            const hdrs = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
            const payload = {
                recipient_type: 'personal',
                recipient_id: profileUserId,
                body,
            };
            const axCfg = { withCredentials: true, headers: { ...hdrs } };

            const urls = [
                '/api/messages/send',
                `${API_BASE}/api/messages/send`,
                `${API_BASE}/messages/send`,
            ].filter(Boolean);

            let res = null;
            for (const url of urls) {
                try {
                    res = await axios.post(url, payload, axCfg);
                    break;
                } catch (e) {
                    if (e?.response?.status && e.response.status !== 404) throw e;
                }
            }
            if (!res) throw new Error('Could not reach messages API');

            if (res.data?.ok) {
                setMsgSuccess(true);
                setMsgBody('');
                setTimeout(() => {
                    setMsgDialogOpen(false);
                    setTimeout(() => { setMsgSuccess(false); }, 300);
                }, 1500);
            }
        } catch (err) {
            const status = Number(err?.response?.status || 0);
            if (status === 401) {
                try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ }
                setMsgError('Please log in to send a message.');
            } else {
                setMsgError(err?.response?.data?.message || 'Failed to send message.');
            }
        } finally {
            setMsgSending(false);
        }
    }, [msgBody, profileUserId]);

    const handleMsgDialogClose = useCallback(() => {
        if (msgSending) return;
        setMsgDialogOpen(false);
        setMsgBody('');
        setMsgError('');
        setMsgSuccess(false);
    }, [msgSending]);

    const realAvatarUrl = stagedDeleteAvatar ? '' : (avatarSrc || profile?.avatar_url || profile?.profile_picture || '');

    // Always show a friendly default avatar icon when none is set (PersonRoundedIcon via MUI Avatar child).
    // IMPORTANT: click-to-open avatar comments/lightbox is disabled unless a real avatar exists.
    const avatarUrl = realAvatarUrl || '';
    const hasRealAvatar = Boolean(realAvatarUrl);
    const editDialogOpen = Boolean(showEditButton && editMode);

    const displayName =
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
        profile?.display_name ||
        'User';

    const joinedIso = profile?.created_at || profile?.joined_at || profile?.createdAt || profile?.joinedAt || '';
    const joinedLabel = joinedIso ? formatLongDate(joinedIso) : '';

    const city = profile?.home_city || profile?.city || '';
    const countyRaw = profile?.home_county || profile?.county || '';
    const profileCountry = String(profile?.country || 'US').toUpperCase();
    const profileState = String(profile?.state || '').toUpperCase();
    const isProfileAlabama = profileCountry === 'US' && (profileState === 'AL' || profileState === '');

    const locationLabel = (() => {
        if (isProfileAlabama) {
            // Alabama resident — show City, County County, Alabama
            const parts = [String(city || '').trim(), normalizeCounty(countyRaw)].filter(Boolean);
            if (parts.length > 0) {
                return `${parts.join(', ')}, Alabama`;
            }
            return 'Alabama';
        }
        // Out-of-state — show location name + "(Out of State)"
        if (profileCountry === 'US' && profileState) {
            const stateObj = US_STATES.find((s) => s.code === profileState);
            const name = stateObj ? stateObj.name : profileState;
            return `${name} (Out of State)`;
        }
        if (profileCountry && profileCountry !== 'US') {
            const countryObj = COUNTRIES.find((c) => c.code === profileCountry);
            const name = countryObj ? countryObj.name : profileCountry;
            return `${name} (Out of State)`;
        }
        return '';
    })();
    const hasMetaLine = Boolean(joinedLabel || locationLabel);

    // Parse saved social links for display (read-only icons in the header)
    const savedContact = (() => {
        const sj = profile?.social_json
            ? typeof profile.social_json === 'string'
                ? (() => { try { return JSON.parse(profile.social_json); } catch { return {}; } })()
                : profile.social_json
            : {};
        return (sj && sj.contact) || {};
    })();
    const activeSocialLinks = SOCIAL_PLATFORMS.filter(
        (p) => String(savedContact[p.key] || '').trim().length > 0
    );

    // ── Profile identity: bio ──
    const profileBioText = String(profile?.profile_bio || '').trim();

    const containerSx = isSidebar
        ? { width: '100%', mx: 0, px: 0 }
        : { maxWidth: 1400, mx: 'auto', px: 2 };
    const AVATAR = isSidebar ? 120 : { xs: 110, sm: 140 };

    const cityDraft = homeCityDraft || '';
    const countyDraft = homeCountyDraft || '';

    const nextAllowed = isMine && editMode ? (handleStats?.nextAllowed ? new Date(handleStats.nextAllowed) : null) : null;
    const daysUntilNext =
        nextAllowed && nextAllowed.getTime() > Date.now()
            ? Math.max(1, Math.ceil((nextAllowed.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
            : 0;

    const usernameBlocked = Boolean(isMine && editMode && handleStats && handleStats.remaining <= 0 && daysUntilNext > 0);

    const antiFillAttrs = {
        autoComplete: 'off',
        'data-1p-ignore': 'true',
        'data-lpignore': 'true',
    };

    const editableOnFocus = (e) => {
        if (e?.target?.hasAttribute('readonly')) e.target.removeAttribute('readonly');
    };

    const privacyValue = privacyDraft === 'private' ? 'private' : 'public';
    const privacyHelp =
        privacyValue === 'private'
            ? 'Your profile can be viewed by followers only. People can request to follow you.'
            : 'Your profile can be viewed by the public.';


    const prevEditOpenRef = useRef(false);

    // Ensure the Privacy dropdown always reflects the *current* saved privacy when the Edit Profile dialog opens.
    // (Avoids stale draft values when entering the page from elsewhere or after saving.)
    useEffect(() => {
        const wasOpen = prevEditOpenRef.current;
        prevEditOpenRef.current = editDialogOpen;

        if (!editDialogOpen || wasOpen) return;

        const next = (Number(profile?.is_private || 0) === 1 || Boolean(profile?.isPrivateAccount))
            ? 'private'
            : 'public';

        onPrivacyDraftChange?.(next);
    }, [editDialogOpen, profile?.is_private, profile?.isPrivateAccount, onPrivacyDraftChange]);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);

    const openAvatar = useCallback(() => {
        if (!hasRealAvatar) return;
        if (editMode) return;
        setLightboxOpen(true);
    }, [hasRealAvatar, editMode]);

    const openPhotoComments = useCallback(() => {
        if (!hasRealAvatar) return;
        const handleOrId = profile?.handle || profile?.public_id || profile?.id;
        if (!handleOrId) return;
        setPhotoCommentsOpen(true);
    }, [profile, hasRealAvatar]);

    // Profile 3-dot menu handlers
    const handleProfileMenuOpen = useCallback((e) => {
        e.stopPropagation();
        setProfileMenuAnchor(e.currentTarget);
    }, []);
    const handleProfileMenuClose = useCallback(() => {
        setProfileMenuAnchor(null);
    }, []);

    const handleCopyProfileLink = useCallback(() => {
        setProfileMenuAnchor(null);
        const handle = profile?.handle || profile?.public_id || profile?.id;
        if (!handle) return;
        const origin = (process.env.REACT_APP_PUBLIC_SITE_URL || '').trim() || (typeof window !== 'undefined' ? window.location.origin : '');
        const link = `${origin}/${encodeURIComponent(handle)}`;
        navigator.clipboard.writeText(link).then(() => {
            if (onSuccess) onSuccess('Profile link copied!');
        }).catch(() => {});
    }, [profile]);

    const handleReportProfileOpen = useCallback(() => {
        setProfileMenuAnchor(null);
        setProfileReportOpen(true);
    }, []);

    const handleReportProfileSubmit = useCallback(async ({ reason, details }) => {
        const targetId = Number(profile?.id || 0);
        if (!targetId) return;
        try {
            await axios.post(
                `${API_BASE}/users/${encodeURIComponent(targetId)}/flag`,
                { reason, details },
                { withCredentials: true }
            );
            setProfileReportOpen(false);
            setProfileReportSuccessOpen(true);
        } catch (e) {
            const status = Number(e?.response?.status || 0);
            if (status === 401) {
                try { window.dispatchEvent(new CustomEvent('open-login')); } catch { /* ignore */ }
            } else {
                setProfileToast({ open: true, msg: e?.response?.data?.message || 'Could not submit report.' });
            }
        }
    }, [profile]);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(profile?.id || 0) });
        setPhotoReportOpen(true);
    }, [profile]);

    const handlePhotoReportSubmit = useCallback(async ({ reason, details }) => {
        if (!photoReportTarget) return;
        try {
            await secureFetch('/api/photos/report', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    details,
                    photo_type: photoReportTarget.photoType,
                    photo_url: photoReportTarget.photoUrl,
                    photo_id: photoReportTarget.photoId,
                    owner_user_id: photoReportTarget.ownerId,
                }),
            });
        } catch { /* handled by ReportDialog success state */ }
        setPhotoReportOpen(false);
        setPhotoReportTarget(null);
    }, [photoReportTarget]);

    const location = useLocation();
    const navigate = useNavigate();
    const [pendingAvatarHighlightId, setPendingAvatarHighlightId] = useState(null);

    // If we arrived here from a notification (or anywhere else) requesting avatar-photo comments,
    // auto-open the comments dialog and pass along an optional comment id to highlight.
    // NOTE: Cover and gallery photo notifications are handled by UserProfilePage instead,
    // since it has the openCoverComments / openGalleryPhotoComments callbacks.
    useEffect(() => {
        // Only the "full" layout instance should handle this — the "sidebar" instance
        // is a second mount of ProfileHeader (desktop left rail) and would otherwise
        // open a duplicate PhotoCommentsDialog, forcing the user to close twice.
        if (isSidebar) return;

        const st = location?.state || {};
        if (!st.llOpenAvatarComments) return;

        // If the notification is for a cover or gallery photo, skip — UserProfilePage handles those.
        const photoType = String(st.llPhotoType || 'avatar').toLowerCase();
        if (photoType === 'cover' || photoType === 'gallery') return;

        const nextId = st.llAvatarCommentId ? String(st.llAvatarCommentId) : null;
        setPendingAvatarHighlightId(nextId);

        // Open the photo comments dialog (not the lightbox — the dialog has the photo + comments).
        openPhotoComments();

        // Clear navigation state so refresh/back doesn't re-trigger.
        navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate, openPhotoComments, hasRealAvatar, editMode, isSidebar]);

    const followButton = useMemo(() => {
        // Hide follow when viewing own profile from personal account
        if (isMine && !isOnSecondaryAccount) return null;

        const isRequestedState = isPrivateAccount && !isFollowing && followRequested;
        const tooltipTitle = isRequestedState
            ? 'Follow Requested'
            : (isFollowing ? 'Following' : 'Follow User');
        const FollowIcon = (isFollowing || isRequestedState) ? HowToRegRoundedIcon : PersonAddAlt1Icon;

        return (
            <Tooltip title={tooltipTitle}>
                <span>
                    <IconButton
                        aria-label={tooltipTitle}
                        disabled={isRequestedState}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFollow?.();
                        }}
                        sx={(t) => ({
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: "primary.main",
                            bgcolor: (isFollowing || isRequestedState) ? 'transparent' : "primary.main",
                            color: (isFollowing || isRequestedState) ? 'primary.main' : 'common.white',
                            transition: t.transitions.create(['background-color', 'border-color', 'transform', 'box-shadow'], {
                                duration: t.transitions.duration.shorter,
                            }),
                            '&:hover': {
                                bgcolor: (isFollowing || isRequestedState)
                                    ? alphaColor(t.palette.primary.main, 0.08)
                                    : "primary.light",
                                transform: 'translateY(-1px)',
                                boxShadow: `0 8px 18px ${alphaColor(t.palette.primary.main, 0.18)}`,
                            },
                            '&.Mui-disabled': {
                                borderColor: alphaColor(t.palette.primary.main, 0.45),
                                color: 'primary.main',
                                bgcolor: alphaColor(t.palette.primary.main, 0.05),
                            },
                        })}
                    >
                        <FollowIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        );
    }, [followRequested, isFollowing, isMine, isOnSecondaryAccount, isPrivateAccount, onToggleFollow]);

    // ── Cover photo & avatar crop flow (matching business admin pattern) ──
    const coverInputRef = useRef(null);
    const avatarInputRef = useRef(null);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [cropType, setCropType] = useState(null); // 'cover' or 'avatar'
    const [cropState, setCropState] = useState({ x: 0, y: 0 });
    const [cropZoom, setCropZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropProcessing, setCropProcessing] = useState(false);
    const hasCover = Boolean(coverSrc && !stagedDeleteCover);

    const handleCoverFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        // Block GIF uploads
        if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
            setModerationError('GIF images are not allowed. Please upload a JPG, PNG, or WebP image.');
            return;
        }

        // Open crop dialog immediately. Moderation runs on the cropped blob
        // in handleCropSave — that's the scan that actually matters (those
        // are the bytes we pass to the parent's onChangeCover). A pre-crop
        // scan was doubling the moderation round-trips and making the file
        // picker feel laggy.
        setModerationError('');
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropType('cover');
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleAvatarFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        // Block GIF uploads
        if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
            setModerationError('GIF images are not allowed. Please upload a JPG, PNG, or WebP image.');
            return;
        }

        // Open crop dialog immediately. See note in handleCoverFileSelect —
        // moderation runs on the cropped blob in handleCropSave, which is
        // the scan that actually matters.
        setModerationError('');
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropType('avatar');
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleCropSave = useCallback(async () => {
        if (!croppedAreaPixels || !cropImageSrc) return;
        setCropProcessing(true);
        setModerationError('');
        try {
            const outSize = cropType === 'avatar' ? AVATAR_CROP_OUTPUT : COVER_OUTPUT;
            const croppedBlob = await createCroppedImage(cropImageSrc, croppedAreaPixels, outSize.width, outSize.height);

            // NSFW moderation scan on the cropped image before passing to parent
            const scanResult = await scanImageFile(croppedBlob);
            if (!scanResult.safe) {
                setModerationError(scanResult.message);
                setCropProcessing(false);
                return;
            }

            if (cropType === 'cover') {
                onEditTouched?.();
                onChangeCover?.(croppedBlob);
            } else if (cropType === 'avatar') {
                onEditTouched?.();
                onChangeAvatar?.(croppedBlob);
            }
            setCropDialogOpen(false);
            setCropImageSrc(null);
            setCropType(null);
            setCropState({ x: 0, y: 0 });
            setCropZoom(1);
            // Prevent focus-restoration from re-triggering the file picker
            avatarCooldownRef.current = true;
            setTimeout(() => { avatarCooldownRef.current = false; }, 400);
        } catch { /* silent */ } finally {
            setCropProcessing(false);
        }
    }, [croppedAreaPixels, cropImageSrc, cropType, onChangeCover, onChangeAvatar, onEditTouched]);

    const handleCropClose = useCallback(() => {
        setCropDialogOpen(false);
        setCropImageSrc(null);
        setCropType(null);
        setCropState({ x: 0, y: 0 });
        setCropZoom(1);
        setModerationError('');
        // Prevent focus-restoration from re-triggering the file picker
        avatarCooldownRef.current = true;
        setTimeout(() => { avatarCooldownRef.current = false; }, 400);
    }, []);

    const avatarCooldownRef = useRef(false);

    const avatarControls = isMine && editDialogOpen ? (
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
            <Button
                size="small"
                startIcon={<EditIcon fontSize="small" />}
                onClick={(e) => {
                    e.stopPropagation();
                    if (avatarCooldownRef.current) return;
                    avatarInputRef.current?.click();
                }}
                disabled={cropProcessing}
                sx={{
                    textTransform: 'none',
                    color: "primary.main",
                    fontWeight: 600,
                }}
            >
                Change picture
            </Button>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarFileSelect} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />
            {hasRealAvatar ? (
                <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditTouched?.();
                        onDeleteAvatar?.();
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Remove
                </Button>
            ) : null}
        </Box>
    ) : null;

    const coverControls = isMine && editDialogOpen ? (
        <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                Cover Photo
            </Typography>
            <Box sx={{ position: 'relative', width: '100%', paddingTop: `${100 / COVER_ASPECT}%`, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
                {hasCover && (
                    <Box component="img" src={coverSrc} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadRoundedIcon />}
                        onClick={() => coverInputRef.current?.click()}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, bgcolor: (t) => alpha(t.palette.common.black, 0.60), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.80) } }}
                    >
                        {hasCover ? 'Change Cover' : 'Upload Cover'}
                    </Button>
                    {hasCover && (
                        <Button
                            variant="contained"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => { onEditTouched?.(); onDeleteCover?.(); }}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, bgcolor: (t) => alpha(t.palette.error.main, 0.85), '&:hover': { bgcolor: 'error.dark' } }}
                        >
                            Remove
                        </Button>
                    )}
                </Box>
            </Box>
            <input type="file" ref={coverInputRef} onChange={handleCoverFileSelect} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />
        </Box>
    ) : null;

    const WHITE_AUTOCOMPLETE_SLOTS = useMemo(
        () => ({
            popper: {
                sx: {
                    '& .MuiAutocomplete-listbox': { backgroundColor: 'background.paper' },
                },
            },
            paper: { sx: { backgroundColor: 'background.paper', backgroundImage: 'none !important' } },
            listbox: { sx: { backgroundColor: 'background.paper' } },
        }),
        []
    );

    const allCountyNames = useMemo(() => {
        const arr = Array.isArray(cityCountyMap) ? cityCountyMap : [];
        const norm = (n) => String(n || '').replace(/\s*County\s*$/i, '').trim();
        return Array.from(new Set(arr.map((c) => norm(c?.county)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, []);

    const allCityNames = useMemo(() => {
        const arr = Array.isArray(cityCountyMap) ? cityCountyMap : [];
        return Array.from(new Set(arr.map((c) => String(c?.name || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, []);

    const countyByCityLower = useMemo(() => {
        const map = new Map();
        const arr = Array.isArray(cityCountyMap) ? cityCountyMap : [];
        arr.forEach((row) => {
            const city = String(row?.name || '').trim();
            const county = String(row?.county || '').trim();
            if (!city || !county) return;
            map.set(city.toLowerCase(), normalizeCountyDraft(county));
        });
        return map;
    }, []);

    // Auto-populate county when city is selected (matches Community filter behavior)
    // Skip the first render after dialog opens so we don't trigger a false dirty state.
    const countyAutoFillReady = useRef(false);
    useEffect(() => {
        if (!editDialogOpen) { countyAutoFillReady.current = false; return; }
        if (!countyAutoFillReady.current) { countyAutoFillReady.current = true; return; }
        if (!cityDraft) return;
        const mapped = countyByCityLower.get(cityDraft.toLowerCase());
        if (!mapped) return;
        if (!countyDraft || countyDraft.toLowerCase() !== String(mapped).toLowerCase()) {
            onHomeCountyDraftChange?.(mapped);
        }
    }, [editDialogOpen, cityDraft, countyDraft, countyByCityLower, onHomeCountyDraftChange]);

    const isCityProvided = cityDraft.length > 0;
    const isCountyProvided = countyDraft.length > 0;

    const isValidCounty = useMemo(() => {
        if (!isCountyProvided) return true;
        const norm = countyDraft.toLowerCase();
        const list = allCountyNames.length ? allCountyNames : ALABAMA_COUNTIES;
        return list.some((c) => String(c).toLowerCase() === norm);
    }, [allCountyNames, countyDraft, isCountyProvided]);

    const isValidCity = useMemo(() => {
        if (!isCityProvided) return true;
        const norm = cityDraft.toLowerCase();
        return allCityNames.length ? allCityNames.some((c) => String(c).toLowerCase() === norm) : true;
    }, [allCityNames, cityDraft, isCityProvided]);

    const cityErrorText = useMemo(() => {
        if (!editDialogOpen) return '';
        if (!isCityProvided) return '';
        if (!isValidCity) return 'Invalid Alabama City';
        return '';
    }, [editDialogOpen, isCityProvided, isValidCity]);

    const countyErrorText = useMemo(() => {
        if (!editDialogOpen) return '';
        if (!isCityProvided && !isCountyProvided) return '';
        if (isCityProvided && !isCountyProvided) return 'County is required when a city is entered.';
        if (!isValidCounty) return 'Invalid Alabama County';
        return '';
    }, [editDialogOpen, isCityProvided, isCountyProvided, isValidCounty]);

    // Alabama resident flag — driven by dedicated prop (not derived from country/state)
    const isAlabama = Boolean(alabamaResident);

    const canSaveLocation = useMemo(() => {
        if (!editDialogOpen) return true;
        // Out-of-state users: always savable (country/state are dropdowns)
        if (!isAlabama) return true;
        // Alabama residents: validate city/county
        if (!isCityProvided && !isCountyProvided) return true;
        if (isCityProvided && !isValidCity) return false;
        if (isCityProvided && !isCountyProvided) return false;
        if (isCountyProvided && !isValidCounty) return false;
        return true;
    }, [editDialogOpen, isAlabama, isCityProvided, isCountyProvided, isValidCity, isValidCounty]);

    const LocationControl = isMine && editDialogOpen ? (
        <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                Location (optional)
            </Typography>

            <FormControlLabel
                control={
                    <Checkbox
                        size="small"
                        checked={isAlabama}
                        onChange={(e) => {
                            onEditTouched?.();
                            if (e.target.checked) {
                                // Checking = Alabama resident
                                onAlabamaResidentChange?.(true);
                                onCountryDraftChange?.('US');
                                onStateDraftChange?.('AL');
                                onHomeCityDraftChange?.('');
                                onHomeCountyDraftChange?.('');
                            } else {
                                // Unchecking = not Alabama
                                onAlabamaResidentChange?.(false);
                                onCountryDraftChange?.('US');
                                onStateDraftChange?.('');
                                onHomeCityDraftChange?.('');
                                onHomeCountyDraftChange?.('');
                            }
                        }}
                        sx={{ color: 'primary.main' }}
                    />
                }
                label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Alabama resident
                    </Typography>
                }
                sx={{ mb: 0.5 }}
            />

            {isAlabama ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 1.2,
                        mt: 1,
                    }}
                >
                    {/* City */}
                    <Autocomplete
                        key="profile-city"
                        size="small"
                        slotProps={WHITE_AUTOCOMPLETE_SLOTS}
                        freeSolo
                        options={allCityNames}
                        value={cityDraft}
                        onChange={(_, val) => {
                            onHomeCityDraftChange?.(String(val || '').trim());
                        }}
                        onInputChange={(_, val) => {
                            onHomeCityDraftChange?.(String(val || ''));
                        }}
                        openOnFocus
                        renderInput={(p) => (
                            <TextField
                                {...p}
                                label="City"
                                fullWidth
                                error={Boolean(cityErrorText)}
                                helperText={cityErrorText || ' '}
                                sx={CREAM_INPUT_SX}
                                autoComplete="new-password"
                                inputProps={{
                                    ...p.inputProps,
                                    ...antiFillAttrs,
                                    name: 'll_profile_city',
                                    id: 'll_profile_city',
                                    autoComplete: 'new-password',
                                }}
                            />
                        )}
                        clearOnEscape
                        autoHighlight
                        filterSelectedOptions
                    />

                    {/* County */}
                    <Autocomplete
                        key="profile-county"
                        size="small"
                        slotProps={WHITE_AUTOCOMPLETE_SLOTS}
                        freeSolo
                        options={allCountyNames}
                        value={countyDraft}
                        onChange={(_, val) => {
                            onHomeCountyDraftChange?.(normalizeCountyDraft(String(val || '')));
                        }}
                        onInputChange={(_, val) => {
                            onHomeCountyDraftChange?.(normalizeCountyDraft(String(val || '')));
                        }}
                        openOnFocus
                        renderInput={(p) => (
                            <TextField
                                {...p}
                                label="County"
                                fullWidth
                                error={Boolean(countyErrorText)}
                                helperText={countyErrorText || ' '}
                                sx={CREAM_INPUT_SX}
                                autoComplete="new-password"
                                inputProps={{
                                    ...p.inputProps,
                                    ...antiFillAttrs,
                                    name: 'll_profile_county',
                                    id: 'll_profile_county',
                                    autoComplete: 'new-password',
                                }}
                            />
                        )}
                        clearOnEscape
                        autoHighlight
                        filterSelectedOptions
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: countryDraft === 'US' ? '1fr 1fr' : '1fr',
                        },
                        gap: 1.2,
                        mt: 1,
                    }}
                >
                    <Autocomplete
                        size="small"
                        options={COUNTRIES}
                        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                        value={COUNTRIES.find((c) => c.code === (countryDraft || 'US')) || null}
                        onChange={(_, val) => {
                            onEditTouched?.();
                            const code = val?.code || '';
                            onCountryDraftChange?.(code);
                            if (code !== 'US') {
                                onStateDraftChange?.('');
                            }
                        }}
                        isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                        disableClearable
                        openOnFocus
                        autoHighlight
                        slotProps={WHITE_AUTOCOMPLETE_SLOTS}
                        renderInput={(p) => (
                            <TextField
                                {...p}
                                label="Country"
                                fullWidth
                                sx={CREAM_INPUT_SX}
                                autoComplete="new-password"
                                inputProps={{
                                    ...p.inputProps,
                                    ...antiFillAttrs,
                                    autoComplete: 'new-password',
                                }}
                            />
                        )}
                    />

                    {countryDraft === 'US' ? (
                        <Autocomplete
                            size="small"
                            options={US_STATES.filter((s) => s.code !== 'AL')}
                            getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                            value={US_STATES.find((s) => s.code === stateDraft) || null}
                            onChange={(_, val) => {
                                onEditTouched?.();
                                onStateDraftChange?.(val?.code || '');
                            }}
                            isOptionEqualToValue={(opt, val) => opt?.code === val?.code}
                            openOnFocus
                            autoHighlight
                            slotProps={WHITE_AUTOCOMPLETE_SLOTS}
                            renderInput={(p) => (
                                <TextField
                                    {...p}
                                    label="State"
                                    fullWidth
                                    sx={CREAM_INPUT_SX}
                                    autoComplete="new-password"
                                    inputProps={{
                                        ...p.inputProps,
                                        ...antiFillAttrs,
                                        autoComplete: 'new-password',
                                    }}
                                />
                            )}
                        />
                    ) : null}
                </Box>
            )}
        </Box>
    ) : null;

    const PrivacyControl = isMine && editDialogOpen ? (
        <Box sx={{ display: 'grid', gap: 0.6, mt: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <LockRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                    Privacy
                </Typography>
            </Box>

            <FormControl size="small" sx={{ width: { xs: '100%', sm: 260 } }}>
                <Select
                    value={privacyValue}
                    onChange={(e) => { onEditTouched?.(); onPrivacyDraftChange?.(e.target.value); }}
                    sx={CREAM_INPUT_SX}
                >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                </Select>
                <FormHelperText sx={{ mx: 0, mt: 0.5 }}>{privacyHelp}</FormHelperText>
            </FormControl>
        </Box>
    ) : null;

    const NameAndHandleView = (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                    variant={isSidebar ? 'h6' : 'h5'}
                    sx={{
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 800,
                        color: "primary.main",
                        letterSpacing: '-0.01em',
                    }}
                >
                    {displayName}
                </Typography>
                {Boolean(Number(profile?.is_local_lantern_admin) === 1) && (
                    <VerifiedRoundedIcon sx={{ fontSize: isSidebar ? 18 : 20, color: 'primary.main', flexShrink: 0 }} />
                )}
            </Box>

            {profile?.handle ? (
                <Typography
                    variant="body2"
                    sx={(t) => ({
                        whiteSpace: 'nowrap',
                        color: alphaColor(t.palette.primary.main, 0.7),
                        fontWeight: 600,
                    })}
                >
                    @{profile.handle}
                </Typography>
            ) : (
                <Chip
                    size="small"
                    label="No username"
                    sx={(t) => ({
                        mt: 0.35,
                        bgcolor: alpha(t.palette.primary.main, 0.15),
                        color: "primary.main",
                        fontWeight: 600,
                    })}
                />
            )}

            {/* Social / link icons — inline under username */}
            {activeSocialLinks.length > 0 && !editDialogOpen ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.4,
                        mt: 0.4,
                    }}
                >
                    {activeSocialLinks.map((platform) => {
                        const url = String(savedContact[platform.key] || '').trim();
                        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                        const IconComp = platform.icon;
                        return (
                            <Tooltip key={platform.key} title={platform.label}>
                                <IconButton
                                    component="a"
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                    sx={(t) => ({
                                        width: 26,
                                        height: 26,
                                        bgcolor: alpha(t.palette.primary.main, 0.05),
                                        border: '1px solid',
                                        borderColor: alphaColor(t.palette.primary.main, 0.1),
                                        color: platform.color || t.palette.text.primary,
                                        transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                        '&:hover': {
                                            bgcolor: alpha(t.palette.primary.main, 0.1),
                                            borderColor: alphaColor(t.palette.primary.main, 0.25),
                                            transform: 'translateY(-1px)',
                                        },
                                    })}
                                >
                                    {platform.isMui
                                        ? <IconComp sx={{ fontSize: 14 }} />
                                        : <IconComp style={{ width: 13, height: 13 }} />
                                    }
                                </IconButton>
                            </Tooltip>
                        );
                    })}
                </Box>
            ) : null}
        </>
    );

    const NamesAndUsernameEdit = (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.2,
                maxWidth: 680,
            }}
        >
            <TextField
                size="small"
                label="First name"
                value={firstNameDraft || ''}
                onChange={(e) => {
                    onFirstNameDraftChange?.(e.target.value);
                    if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: '' }));
                }}
                onFocus={editableOnFocus}
                autoComplete="off"
                inputProps={{ ...antiFillAttrs, maxLength: 50, readOnly: true }}
                fullWidth
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName || ''}
                sx={CREAM_INPUT_SX}
            />
            <TextField
                size="small"
                label="Last name"
                value={lastNameDraft || ''}
                onChange={(e) => {
                    onLastNameDraftChange?.(e.target.value);
                    if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: '' }));
                }}
                onFocus={editableOnFocus}
                autoComplete="off"
                inputProps={{ ...antiFillAttrs, maxLength: 50, readOnly: true }}
                fullWidth
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName || ''}
                sx={CREAM_INPUT_SX}
            />

            <TextField
                size="small"
                label="Username"
                value={handleDraft || ''}
                onChange={(e) => {
                    const cleaned = e.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
                    onHandleDraftChange?.(cleaned);
                    if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }));
                    // Live reserved username check
                    if (cleaned && cleaned.length >= 3) {
                        const reserved = checkReservedUsername(cleaned);
                        if (reserved.reserved) {
                            setFieldErrors((prev) => ({ ...prev, username: reserved.message }));
                            return;
                        }
                        const prof = checkFieldsProfanity({ username: cleaned });
                        if (!prof.clean) {
                            setFieldErrors((prev) => ({ ...prev, username: 'Username contains inappropriate language. Please revise.' }));
                        }
                    }
                }}
                inputProps={{ maxLength: 30 }}
                placeholder="username"
                disabled={usernameBlocked}
                error={Boolean(handleError) || Boolean(fieldErrors.username)}
                helperText={
                    fieldErrors.username
                        ? fieldErrors.username
                        : handleError
                            ? handleError
                            : usernameBlocked
                                ? `You can edit your username again in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}.`
                                : '3–30 chars: lowercase letters, numbers, and underscores only.'
                }
                InputProps={{
                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                }}
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / span 2' }, maxWidth: { md: 420 }, ...CREAM_INPUT_SX }}
                fullWidth
            />

            <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / span 2' }, display: 'grid', gap: 1.1, mt: 0.25 }}>
                {/* Profile Bio */}
                <Box sx={{ display: 'grid', gap: 0.6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                        Short Bio (optional)
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="A short intro — who are you locally?"
                        value={profileBioDraft || ''}
                        onChange={(e) => {
                            onProfileBioDraftChange?.(e.target.value.slice(0, 120));
                            if (fieldErrors.bio) setFieldErrors((prev) => ({ ...prev, bio: '' }));
                        }}
                        fullWidth
                        sx={CREAM_INPUT_SX}
                        inputProps={{ maxLength: 120 }}
                        error={Boolean(fieldErrors.bio)}
                        helperText={fieldErrors.bio || `${String(profileBioDraft || '').length}/120`}
                        FormHelperTextProps={{ sx: { textAlign: fieldErrors.bio ? 'left' : 'right', mr: 0 } }}
                    />
                </Box>

                {LocationControl}
                {PrivacyControl}

                {/* Links — social + website (business-admin style with URL prefixes) */}
                <Box sx={{ display: 'grid', gap: 1.2, mt: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <LinkRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                            Links
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.8 }}>
                        <TextField
                            size="small"
                            label="Website"
                            placeholder="yoursite.com"
                            value={contact?.website || ''}
                            onChange={(e) => onContactChange?.({ ...contact, website: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <LanguageRoundedIcon sx={{ fontSize: 18, color: '#4A5568', mr: 0.75 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>https://</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            size="small"
                            label="Instagram"
                            placeholder="yourhandle"
                            value={contact?.instagram || ''}
                            onChange={(e) => onContactChange?.({ ...contact, instagram: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <InstagramSvgIcon style={{ width: 18, height: 18, color: '#E4405F', marginRight: 6 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>instagram.com/</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            size="small"
                            label="Facebook"
                            placeholder="yourhandle"
                            value={contact?.facebook || ''}
                            onChange={(e) => onContactChange?.({ ...contact, facebook: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <FacebookSvgIcon style={{ width: 18, height: 18, color: '#1877F2', marginRight: 6 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>facebook.com/</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            size="small"
                            label="TikTok"
                            placeholder="yourhandle"
                            value={contact?.tiktok || ''}
                            onChange={(e) => onContactChange?.({ ...contact, tiktok: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <TikTokSvgIcon style={{ width: 18, height: 18, marginRight: 6 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>tiktok.com/@</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            size="small"
                            label="X (Twitter)"
                            placeholder="yourhandle"
                            value={contact?.x || ''}
                            onChange={(e) => onContactChange?.({ ...contact, x: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <XTwitterSvgIcon style={{ width: 16, height: 16, marginRight: 6 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>x.com/</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            size="small"
                            label="LinkedIn"
                            placeholder="yourhandle"
                            value={contact?.linkedin || ''}
                            onChange={(e) => onContactChange?.({ ...contact, linkedin: e.target.value })}
                            fullWidth
                            sx={CREAM_INPUT_SX}
                            inputProps={{ maxLength: 200, autoComplete: 'new-password' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 0 }}>
                                        <LinkedInSvgIcon style={{ width: 18, height: 18, color: '#0A66C2', marginRight: 6 }} />
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>linkedin.com/in/</Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>

                {/* Photos — gallery upload section */}
                {typeof setGalleryPhotos === 'function' && (
                    <Box sx={{ mt: 1 }}>
                        <Divider sx={{ my: 1.5 }} />
                        <PhotosUploadSection
                            photos={Array.isArray(galleryPhotos) ? galleryPhotos : []}
                            setPhotos={setGalleryPhotos}
                            maxPhotos={12}
                            title="Photos"
                            helperText="Add up to 10 photos to your profile. Visitors can like and comment on them."
                            addButtonText="Add photos"
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );

    // Edit button is rendered in the header's top-right corner (requested).
    const EditProfileTopRight = showEditButton ? (
        <Button
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={() => {
                if (!editDialogOpen) onEnterEdit?.();
            }}
            disabled={editDialogOpen}
            size="small"
            sx={(t) => ({
                textTransform: 'none',
                borderRadius: 999,
                bgcolor: alpha(t.palette.background.paper, 0.95),
                backdropFilter: 'blur(8px)',
                borderColor: alphaColor(t.palette.primary.main, 0.25),
                color: "primary.main",
                fontWeight: 700,
                fontSize: '0.78rem',
                px: 1.5,
                py: 0.4,
                boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.1)}`,
                transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                '&:hover': {
                    bgcolor: 'background.paper',
                    borderColor: "primary.main",
                    boxShadow: `0 6px 20px ${alphaColor(t.palette.primary.main, 0.15)}`,
                },
            })}
        >
            Edit Profile
        </Button>
    ) : null;

    const shareProfileButton = (
        <Tooltip title="Share Profile">
            <IconButton
                aria-label="Share profile"
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    setShareDialogOpen(true);
                }}
                sx={(t) => ({
                    bgcolor: alpha(t.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    border: '1px solid',
                    borderColor: alphaColor(t.palette.primary.main, 0.25),
                    color: "primary.main",
                    boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.1)}`,
                    transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    '&:hover': {
                        bgcolor: 'background.paper',
                        borderColor: "primary.main",
                        boxShadow: `0 6px 20px ${alphaColor(t.palette.primary.main, 0.15)}`,
                    },
                })}
            >
                <ShareOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
        </Tooltip>
    );

    // Read the target user's message privacy setting (returned as a top-level
    // field from the backend's public profile endpoint).
    const targetMessagePrivacy = String(profile?.message_privacy || 'everyone').toLowerCase();

    // Message button visibility:
    // - 'nobody'    → hide the button entirely
    // - 'followers' → only show if the viewer follows this profile (isFollowing prop
    //                 updates in real-time when the user toggles follow)
    // - 'everyone'  → always show
    const canShowMessageBtn = showFollowAndShare && (() => {
        if (targetMessagePrivacy === 'nobody') return false;
        if (targetMessagePrivacy === 'followers') return !!isFollowing;
        return true;
    })();
    const messageProfileButton = canShowMessageBtn ? (
        <Tooltip title="Message" disableTouchListener>
            <IconButton
                aria-label="Send message"
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    // Require login before opening message dialog
                    const v = viewerProfile || auth?.user;
                    if (!v || !(v.id || v.user_id || v.handle)) {
                        try {
                            if (auth && typeof auth.open === 'function') auth.open();
                            else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
                            else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
                            else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
                        } catch { /* ignore */ }
                        try {
                            window.dispatchEvent(new CustomEvent('open-auth-modal'));
                            window.dispatchEvent(new CustomEvent('open-login'));
                            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                            window.dispatchEvent(new CustomEvent('open-login-popup'));
                        } catch { /* ignore */ }
                        return;
                    }
                    setMsgDialogOpen(true);
                }}
                sx={(t) => ({
                    bgcolor: alpha(t.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    border: '1px solid',
                    borderColor: alphaColor(t.palette.primary.main, 0.25),
                    color: "primary.main",
                    boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.1)}`,
                    transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    '&:hover': {
                        bgcolor: 'background.paper',
                        borderColor: "primary.main",
                        boxShadow: `0 6px 20px ${alphaColor(t.palette.primary.main, 0.15)}`,
                    },
                })}
            >
                <MailOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
        </Tooltip>
    ) : null;

    const FollowTopRight = showFollowAndShare ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
            {followButton}
            {messageProfileButton}
            {shareProfileButton}
        </Box>
    ) : null;

    // Non-owner action (Follow/Unfollow) stays in-flow.

    const handleEditDialogClose = (_e, reason) => {
        if (reason === 'backdropClick') return;
        onCancel?.();
    };

    const HeaderAvatarOnly = (
        <Box
            sx={(t) => ({
                p: { xs: 1.5, sm: 2 },
                pb: { xs: 2, sm: 2.5 },
                position: 'relative',
                bgcolor: t.palette.background.paper,
            })}
        >
            {EditProfileTopRight || FollowTopRight ? (
                <Box
                    sx={{
                        position: 'absolute',
                        top: { xs: 12, sm: 16 },
                        right: { xs: 12, sm: 16 },
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {EditProfileTopRight || FollowTopRight}

                    {/* 3-dot menu */}
                    <Tooltip title="More" disableTouchListener>
                        <IconButton
                            aria-label="More options"
                            size="small"
                            onClick={handleProfileMenuOpen}
                            sx={(t) => ({
                                bgcolor: alpha(t.palette.background.paper, 0.95),
                                backdropFilter: 'blur(8px)',
                                border: '1px solid',
                                borderColor: alphaColor(t.palette.primary.main, 0.25),
                                color: "primary.main",
                                boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.1)}`,
                                transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                '&:hover': {
                                    bgcolor: 'background.paper',
                                    borderColor: "primary.main",
                                    boxShadow: `0 6px 20px ${alphaColor(t.palette.primary.main, 0.15)}`,
                                },
                            })}
                        >
                            <MoreVertIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : null}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'auto 1fr', sm: 'auto 1fr' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    columnGap: { xs: 1.5, sm: 2.5 },
                    rowGap: 0.75,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Avatar with glowing ring effect */}
                <Box
                    sx={{
                        width: AVATAR,
                        minWidth: AVATAR,
                        cursor: hasRealAvatar && !editMode ? 'pointer' : 'default',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        openPhotoComments();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            openPhotoComments();
                        }
                    }}
                    role={hasRealAvatar && !editMode ? 'button' : undefined}
                    tabIndex={hasRealAvatar && !editMode ? 0 : undefined}
                >
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <Avatar
                            src={avatarUrl || undefined}
                            alt={displayName}
                            sx={(t) => ({
                                // When no avatar is set, layer the 8% primary tint over a solid
                                // paper background so the cover photo doesn't bleed through the
                                // default icon. The `primary.main` branch still applies when an
                                // image IS set, because MUI's img element covers the chrome.
                                background: hasRealAvatar
                                    ? t.palette.primary.main
                                    : `linear-gradient(${alphaColor(t.palette.primary.main, 0.08)}, ${alphaColor(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`,
                                color: hasRealAvatar ? undefined : t.palette.primary.main,
                                width: AVATAR,
                                height: AVATAR,
                                border: '4px solid',
                                borderColor: 'background.paper',
                                boxShadow: 3,
                                mt: hasCoverPhoto ? { xs: -7, sm: -8 } : { xs: 3, sm: 0 },
                                transition: (t) => `transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                '&:hover': hasRealAvatar && !editMode ? {
                                    transform: 'scale(1.02)',
                                } : {},
                                '& .MuiAvatar-img': {
                                    objectFit: 'cover',
                                },
                            })}
                            imgProps={{ referrerPolicy: 'no-referrer' }}
                        >
                            <PersonRoundedIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />
                        </Avatar>
                        {!isMine && !editMode && Boolean(profile?.is_online) && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: { xs: 6, sm: 10 },
                                    right: { xs: 2, sm: 4 },
                                    width: { xs: 28, sm: 32 },
                                    height: { xs: 28, sm: 32 },
                                    borderRadius: '50%',
                                    bgcolor: '#44b700',
                                    border: '3px solid',
                                    borderColor: 'background.paper',
                                    zIndex: 2,
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Name + handle */}
                <Box sx={{ minWidth: 0, mt: editMode ? 0.8 : 0.25 }}>
                    {NameAndHandleView}
                </Box>

                {/* Meta line (location + joined) */}
                {hasMetaLine ? (
                    <Box
                        sx={{
                            gridColumn: { xs: '1 / -1', sm: '1 / -1' },
                            mt: { xs: 1.25, sm: 1.5 },
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                            }}
                        >
                            <Box
                                sx={(t) => ({
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%',
                                    maxWidth: { xs: 560, md: 600 },
                                    mx: 'auto',
                                    px: { xs: 1.6, sm: 2.0 },
                                    py: { xs: 1.1, sm: 1.25 },
                                    minHeight: { xs: 48, sm: 52 },
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: alphaColor(t.palette.primary.main, 0.1),
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.8),
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: `0 8px 24px ${alphaColor(t.palette.primary.main, 0.08)}`,
                                })}
                            >
                                <MetaPill locationLabel={locationLabel} joinedLabel={joinedLabel} />
                            </Box>
                        </Box>
                    </Box>
                ) : null}

                {/* Profile bio — below location, scrollable if too long */}
                {profileBioText && !editDialogOpen ? (
                    <Box
                        sx={{
                            gridColumn: '1 / -1',
                            mt: 0.75,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Box
                            sx={(t) => ({
                                maxWidth: { xs: 400, sm: 480, md: 540 },
                                width: '100%',
                                maxHeight: 56,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                px: 1.5,
                                textAlign: 'center',
                                scrollbarWidth: 'thin',
                                '&::-webkit-scrollbar': { width: 3 },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: alphaColor(t.palette.primary.main, 0.15),
                                    borderRadius: 99,
                                },
                            })}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 450,
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word',
                                }}
                            >
                                {profileBioText}
                            </Typography>
                        </Box>
                    </Box>
                ) : null}
            </Box>
        </Box>
    );

    const profileHandleOrId = profile?.handle || profile?.public_id || profile?.id;

    return (
        <>
            {/* Visual header card — only rendered in sidebar layout */}
            {isSidebar && (
                <Box sx={{ ...containerSx, mb: { xs: 2, md: 2.5 } }}>
                    <Card
                        variant="outlined"
                        sx={(t) => ({
                            width: '100%',
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid',
                            borderColor: alphaColor(t.palette.text.primary, 0.08),
                            boxShadow: `0 2px 8px ${alphaColor(t.palette.text.primary, 0.04)}`,
                            bgcolor: 'background.paper',
                            transition: (t) => `box-shadow ${t.custom.motion.slow}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                            '&:hover': {
                                boxShadow: `0 2px 8px ${alphaColor(t.palette.text.primary, 0.04)}`,
                            },
                        })}
                    >
                        {HeaderAvatarOnly}
                    </Card>
                </Box>
            )}

            {showEditButton ? (
                <>
                    <Dialog
                        open={editDialogOpen}
                        onClose={handleEditDialogClose}
                        fullWidth
                        fullScreen={isMobile}
                        disableScrollLock
                        maxWidth="md"
                        PaperProps={{
                            sx: {
                                borderRadius: isMobile ? 0 : 3,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: isMobile ? undefined : '92vh',
                            },
                        }}
                    >
                        <Box
                            sx={(t) => ({
                                position: 'relative',
                                px: 2.5,
                                pt: 2.5,
                                pb: 1.5,
                                flexShrink: 0,
                                bgcolor: 'background.paper',
                                background: `linear-gradient(135deg, ${alphaColor(t.palette.primary.main, 0.03)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                            })}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 800, pr: 5, color: "primary.main" }}>
                                Edit Profile
                            </Typography>
                            <IconButton
                                aria-label="Close"
                                onClick={() => onCancel?.()}
                                sx={(t) => ({
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                    '&:hover': {
                                        bgcolor: alphaColor(t.palette.primary.main, 0.15),
                                    },
                                })}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Divider />

                        <Box component="form" autoComplete="off" onSubmit={(e) => e.preventDefault()}
                             ref={editFormRef}
                             onInput={() => onEditTouched?.()}
                             sx={{
                                 px: 2.5, py: 2.5, overflowY: 'auto', flex: 1,
                                 '&::-webkit-scrollbar': { width: 8 },
                                 '&::-webkit-scrollbar-track': { bgcolor: 'action.hover', borderRadius: 4 },
                                 '&::-webkit-scrollbar-thumb': { bgcolor: 'text.disabled', borderRadius: 4, '&:hover': { bgcolor: 'text.secondary' } },
                                 scrollbarWidth: 'thin',
                                 scrollbarColor: (t) => `${alphaColor(t.palette.text.primary, 0.25)} ${alphaColor(t.palette.text.primary, 0.06)}`,
                             }}>
                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                {/* Cover photo */}
                                {coverControls}
                                {/* Profile picture */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Box
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openAvatar();
                                        }}
                                        role={hasRealAvatar ? 'button' : undefined}
                                        tabIndex={hasRealAvatar ? 0 : undefined}
                                        onKeyDown={(e) => {
                                            if (!hasRealAvatar) return;
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.stopPropagation();
                                                openAvatar();
                                            }
                                        }}
                                        sx={{ cursor: hasRealAvatar && !editMode ? 'pointer' : 'default' }}
                                    >
                                        <Avatar
                                            src={avatarUrl || undefined}
                                            alt={displayName}
                                            sx={(t) => ({
                                                width: 80,
                                                height: 80,
                                                bgcolor: hasRealAvatar ? 'primary.main' : alphaColor(t.palette.primary.main, 0.08),
                                                color: hasRealAvatar ? undefined : t.palette.primary.main,
                                                border: '3px solid #fff',
                                                boxShadow: `0 0 0 2px ${alpha(t.palette.primary.main, 0.3)}, 0 8px 22px ${alpha(t.palette.text.primary, 0.15)}`,
                                                '& .MuiAvatar-img': {
                                                    objectFit: 'cover',
                                                    transform: 'scale(1.15)',
                                                },
                                            })}
                                            imgProps={{ referrerPolicy: 'no-referrer' }}
                                        >
                                            <PersonRoundedIcon sx={{ fontSize: 44 }} />
                                        </Avatar>
                                    </Box>
                                    {avatarControls}
                                </Box>

                                <Divider sx={{ my: 0.75 }} />

                                {NamesAndUsernameEdit}
                            </Box>
                        </Box>

                        {/* ── Moderation error alert ── */}
                        {moderationError && (
                            <Box sx={{ px: 2.5, pb: 1 }}>
                                <Alert severity="error" onClose={() => setModerationError('')} sx={{ borderRadius: 2 }}>
                                    {moderationError}
                                </Alert>
                            </Box>
                        )}

                        <Divider />
                        <Box
                            sx={(t) => ({
                                px: 2.5,
                                py: 2,
                                display: 'flex',
                                gap: 1.5,
                                justifyContent: 'flex-end',
                                flexWrap: 'nowrap',
                                flexShrink: 0,
                                bgcolor: alphaColor(t.palette.primary.main, 0.02),
                            })}
                        >
                            <Button
                                startIcon={<CloseIcon />}
                                onClick={() => { setModerationError(''); setFieldErrors({}); onCancel?.(); }}
                                sx={{
                                    textTransform: 'none',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                startIcon={saveIcon || <SaveIcon />}
                                variant="contained"
                                onClick={() => {
                                    // Location validation — show error message instead of silently blocking
                                    if (!canSaveLocation) {
                                        const locMsg = cityErrorText || countyErrorText || 'Please fix the location fields before saving.';
                                        setModerationError(locMsg);
                                        // Scroll to the location fields
                                        requestAnimationFrame(() => {
                                            const form = editFormRef.current;
                                            if (!form) return;
                                            const el = form.querySelector('#ll_profile_city, #ll_profile_county');
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        });
                                        return;
                                    }

                                    // Client-side profanity check on all text fields before saving
                                    setModerationError('');
                                    const newFieldErrors = {};

                                    if (firstNameDraft) {
                                        const r = checkFieldsProfanity({ firstName: firstNameDraft });
                                        if (!r.clean) newFieldErrors.firstName = 'First name contains inappropriate language. Please revise.';
                                    }
                                    if (lastNameDraft) {
                                        const r = checkFieldsProfanity({ lastName: lastNameDraft });
                                        if (!r.clean) newFieldErrors.lastName = 'Last name contains inappropriate language. Please revise.';
                                    }
                                    if (profileBioDraft) {
                                        const r = checkFieldsProfanity({ bio: profileBioDraft });
                                        if (!r.clean) newFieldErrors.bio = 'Bio contains inappropriate language. Please revise.';
                                    }
                                    if (handleDraft) {
                                        const r = checkFieldsProfanity({ username: handleDraft });
                                        if (!r.clean) newFieldErrors.username = 'Username contains inappropriate language. Please revise.';
                                        // Reserved username check (route conflicts + personally reserved)
                                        if (!newFieldErrors.username) {
                                            const reserved = checkReservedUsername(handleDraft);
                                            if (reserved.reserved) newFieldErrors.username = reserved.message;
                                        }
                                    }

                                    if (Object.keys(newFieldErrors).length > 0) {
                                        setFieldErrors(newFieldErrors);
                                        setModerationError('One or more fields contain inappropriate language. Please revise the highlighted fields.');
                                        // Scroll to the first field with an error
                                        requestAnimationFrame(() => {
                                            const form = editFormRef.current;
                                            if (!form) return;
                                            const firstErrorEl = form.querySelector('.Mui-error');
                                            if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        });
                                        return;
                                    }

                                    setFieldErrors({});
                                    saveIntentRef.current = true;
                                    onSave?.();
                                }}
                                disabled={cropProcessing}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: "primary.main",
                                    fontWeight: 700,
                                    px: 3,
                                    '&:hover': {
                                        bgcolor: "primary.light",
                                    },
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Dialog>

                    {/* ── Cover Photo Crop Dialog ── */}
                    <Dialog open={cropDialogOpen} onClose={handleCropClose} maxWidth="md" fullWidth disableRestoreFocus PaperProps={{ sx: { borderRadius: 3 } }}>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CropIcon sx={{ color: 'primary.dark' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {cropType === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Photo'}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleCropClose} size="small"><CloseIcon /></IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 400 }, bgcolor: 'grey.900' }}>
                                {cropImageSrc && (
                                    <Cropper
                                        image={cropImageSrc}
                                        crop={cropState}
                                        zoom={cropZoom}
                                        aspect={cropType === 'avatar' ? AVATAR_CROP_ASPECT : COVER_ASPECT}
                                        cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                                        showGrid={cropType !== 'avatar'}
                                        onCropChange={setCropState}
                                        onZoomChange={setCropZoom}
                                        onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
                                    />
                                )}
                            </Box>
                            <Box sx={{ px: 3, py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ZoomInIcon sx={{ color: 'text.secondary' }} />
                                    <Slider value={cropZoom} min={1} max={3} step={0.1} onChange={(_e, z) => setCropZoom(z)} sx={{ color: 'primary.dark' }} />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
                            {moderationError && (
                                <Alert severity="error" onClose={() => setModerationError('')} sx={{ borderRadius: 2, width: '100%' }}>
                                    {moderationError}
                                </Alert>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={handleCropClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                                <Button
                                    variant="contained"
                                    onClick={handleCropSave}
                                    disabled={cropProcessing}
                                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
                                >
                                    {cropProcessing ? 'Uploading...' : 'Apply Crop'}
                                </Button>
                            </Box>
                        </DialogActions>
                    </Dialog>
                </>
            ) : null}

            {/* Only render lightbox + photo-comments from the "full" layout instance.
                The "sidebar" instance is a second mount of ProfileHeader and would
                otherwise produce duplicate dialogs (requiring two clicks to close). */}
            {!isSidebar && (
                <AvatarLightbox
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    src={realAvatarUrl}
                    alt={displayName}
                    isOwner={!!isMine}
                    onReport={() => handlePhotoReportOpen('avatar', realAvatarUrl, null)}
                />
            )}

            {!isSidebar && (
                <PhotoCommentsDialog
                    open={photoCommentsOpen}
                    onClose={() => setPhotoCommentsOpen(false)}
                    profileHandleOrId={profileHandleOrId}
                    viewerId={viewerIdSafe}
                    isOwner={!!isMine}
                    highlightCommentId={pendingAvatarHighlightId}
                    onSuccess={onSuccess}
                    onReportPhoto={handlePhotoReportOpen}
                />
            )}

            <ShareDialog
                contentType="profile"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                profile={profile}
                viewer={viewerProfile || { id: viewerIdSafe }}
            />

            {/* Profile 3-dot menu */}
            <SmartMenu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                disableScrollLock
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, mt: 0.5 } } }}
            >
                <MenuItem onClick={handleCopyProfileLink}>
                    <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}>
                        Copy Link
                    </ListItemText>
                </MenuItem>
                {showFollowAndShare ? (
                    <MenuItem onClick={handleReportProfileOpen}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 700, color: 'error.main' }}>
                            Report User
                        </ListItemText>
                    </MenuItem>
                ) : null}
            </SmartMenu>

            <ReportDialog
                open={profileReportOpen}
                onClose={() => setProfileReportOpen(false)}
                onSubmit={handleReportProfileSubmit}
                title="Report User"
            />

            <ReportDialog
                open={photoReportOpen}
                onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }}
                onSubmit={handlePhotoReportSubmit}
                title="Report Photo"
            />

            <Dialog
                open={profileReportSuccessOpen}
                onClose={(_e, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                    setProfileReportSuccessOpen(false);
                }}
                fullWidth
                maxWidth="xs"
                disableEscapeKeyDown
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <Box sx={{ position: 'relative', px: 2.5, pt: 2.5, pb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, pr: 5, color: 'primary.main' }}>
                        Report Submitted
                    </Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={() => setProfileReportSuccessOpen(false)}
                        sx={(t) => ({
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: alphaColor(t.palette.primary.main, 0.08),
                            '&:hover': {
                                bgcolor: alphaColor(t.palette.primary.main, 0.15),
                            },
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <Box sx={{ px: 2.5, py: 2.25 }}>
                    <Typography variant="body2" color="text.secondary">
                        Thank you. Your report has been submitted and will be reviewed.
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2.5, py: 1.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => setProfileReportSuccessOpen(false)}
                        sx={{
                            textTransform: 'none',
                            bgcolor: 'primary.main',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: 'primary.light',
                            },
                        }}
                    >
                        Done
                    </Button>
                </Box>
            </Dialog>

            <Snackbar
                open={profileToast.open}
                autoHideDuration={3000}
                onClose={() => setProfileToast({ open: false, msg: '' })}
                message={profileToast.msg}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            {/* ── Send Message Dialog ── */}
            <Dialog
                open={msgDialogOpen}
                onClose={handleMsgDialogClose}
                fullWidth
                fullScreen={isMobile}
                maxWidth="sm"
                disableScrollLock
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? '100vh' : '85vh', overflow: 'hidden', ...(isMobile && { display: 'flex', flexDirection: 'column' }) } }}
                sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
            >
                <DialogTitle sx={{ pr: 6, ...(isMobile && { borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }) }}>
                    {!msgSuccess && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                            Message {displayName}
                        </Typography>
                    )}
                    <IconButton
                        aria-label="Close"
                        onClick={handleMsgDialogClose}
                        sx={{ position: 'absolute', right: 12, top: 12 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={isMobile ? { flex: 1, overflowY: 'auto', pb: 0, display: 'flex', flexDirection: 'column' } : undefined}>
                    {msgSuccess ? (
                        <Stack spacing={2} sx={{ py: 2, ...(isMobile && { flex: 1, justifyContent: 'center' }) }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={(t) => ({
                                        width: 56, height: 56, borderRadius: '50%',
                                        bgcolor: alphaColor(t.palette.success.main, 0.16),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        mx: 'auto', mb: 2,
                                    })}
                                >
                                    <CheckRoundedIcon sx={{ fontSize: 28, color: 'success.dark' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your message has been sent to {displayName}.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={handleMsgDialogClose}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(isMobile && { py: 1.5, fontSize: '1rem' }) }}>
                                Done
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                    src={avatarUrl || undefined}
                                    alt={displayName}
                                    sx={(t) => ({ width: 40, height: 40, bgcolor: hasRealAvatar ? 'primary.main' : alphaColor(t.palette.primary.main, 0.08), color: hasRealAvatar ? undefined : t.palette.primary.main })}
                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                >
                                    <PersonRoundedIcon sx={{ fontSize: 24 }} />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        {displayName}
                                    </Typography>
                                    {profile?.handle ? (
                                        <Typography variant="caption" color="text.secondary">
                                            @{profile.handle}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Box>
                            <TextField
                                multiline
                                minRows={isMobile ? 4 : 3}
                                maxRows={isMobile ? 8 : 8}
                                fullWidth
                                label="Message"
                                placeholder="Write your message..."
                                value={msgBody}
                                onChange={(e) => {
                                    setMsgBody(e.target.value.slice(0, 5000));
                                    if (msgError) setMsgError('');
                                }}
                                disabled={msgSending}
                                error={Boolean(msgError)}
                                helperText={msgError || `${String(msgBody || '').length} / 5,000`}
                                FormHelperTextProps={{ sx: { textAlign: msgError ? 'left' : 'right', mr: 0.5, fontWeight: 600, fontSize: '0.75rem' } }}
                                sx={CREAM_INPUT_SX}
                                inputProps={{ maxLength: 5000 }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                {/* Pinned bottom actions — only show when not in success state */}
                {!msgSuccess && (
                    <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', p: 2, pb: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 16px)' : 2, bgcolor: 'background.paper' }}>
                        {msgSending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={isMobile ? 'stretch' : 'flex-end'}>
                            <Button
                                variant="outlined"
                                onClick={handleMsgDialogClose}
                                disabled={msgSending}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(isMobile && { flex: 1, py: 1.4, fontSize: '0.95rem' }) }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!String(msgBody || '').trim() || msgSending}
                                startIcon={msgSending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 18 }} />}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(isMobile && { flex: 2, py: 1.4, fontSize: '0.95rem' }) }}
                            >
                                {msgSending ? 'Sending…' : 'Send Message'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            <SuccessSnackbar {...successSnackbarProps} />
        </>
    );
}

ProfileHeader.propTypes = {
    viewerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    viewer: PropTypes.object,
    profile: PropTypes.object,
    avatarSrc: PropTypes.string,
    isMine: PropTypes.bool,
    editMode: PropTypes.bool,
    onEnterEdit: PropTypes.func,
    onSave: PropTypes.func,
    saveIcon: PropTypes.node,
    onCancel: PropTypes.func,
    onChangeAvatar: PropTypes.func,
    onDeleteAvatar: PropTypes.func,

    isFollowing: PropTypes.bool,
    followRequested: PropTypes.bool,
    isPrivateAccount: PropTypes.bool,
    onToggleFollow: PropTypes.func,

    handleDraft: PropTypes.string,
    onHandleDraftChange: PropTypes.func,
    handleStats: PropTypes.object,
    handleError: PropTypes.string,

    firstNameDraft: PropTypes.string,
    lastNameDraft: PropTypes.string,
    onFirstNameDraftChange: PropTypes.func,
    onLastNameDraftChange: PropTypes.func,

    homeCityDraft: PropTypes.string,
    onHomeCityDraftChange: PropTypes.func,
    homeCountyDraft: PropTypes.string,
    onHomeCountyDraftChange: PropTypes.func,

    contact: PropTypes.object,
    onContactChange: PropTypes.func,

    countryDraft: PropTypes.string,
    onCountryDraftChange: PropTypes.func,
    stateDraft: PropTypes.string,
    onStateDraftChange: PropTypes.func,
    alabamaResident: PropTypes.bool,
    onAlabamaResidentChange: PropTypes.func,

    privacyDraft: PropTypes.string,
    onPrivacyDraftChange: PropTypes.func,

    profileBioDraft: PropTypes.string,
    onProfileBioDraftChange: PropTypes.func,

    stagedDeleteAvatar: PropTypes.bool,
    coverSrc: PropTypes.string,
    onChangeCover: PropTypes.func,
    onDeleteCover: PropTypes.func,
    stagedDeleteCover: PropTypes.bool,
    hasCoverPhoto: PropTypes.bool,
    layout: PropTypes.oneOf(['full', 'sidebar']),
    galleryPhotos: PropTypes.array,
    setGalleryPhotos: PropTypes.func,
    onEditTouched: PropTypes.func,
};

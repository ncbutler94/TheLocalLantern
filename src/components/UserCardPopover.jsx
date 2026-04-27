import React from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    Paper,
    Popper,
    Skeleton,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BlockIcon from '@mui/icons-material/Block';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

// Genre icons (matches ArtistDetailPanel)
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import NaturePeopleRoundedIcon from '@mui/icons-material/NaturePeopleRounded';
import PianoRoundedIcon from '@mui/icons-material/PianoRounded';
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded';
import WavesRoundedIcon from '@mui/icons-material/WavesRounded';
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded';
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import NightlifeRoundedIcon from '@mui/icons-material/NightlifeRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import RadioRoundedIcon from '@mui/icons-material/RadioRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';

// Business category icons (matches BusinessDetailPanel CATEGORY_ICON_MAP)
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
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';

import { useAuth } from './AuthModalContext';
import { useActiveAccount } from './AccountContext';
import { secureFetch } from '../utils/secureFetch';
import RichTextDisplay from './RichTextDisplay';

/* ── Inline social SVG icons (matches ProfileHeader) ── */
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

/* ── Music-specific SVG icons for artist links ── */
const SpotifySvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);
const YouTubeSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);
const SoundCloudSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.054 0 .09-.038.1-.094l.199-1.308-.199-1.332c-.01-.057-.046-.094-.1-.094m1.8-1.143c-.063 0-.11.048-.116.109l-.214 2.46.214 2.387c.005.061.053.107.116.107.065 0 .11-.046.116-.107l.241-2.387-.241-2.46c-.006-.061-.052-.109-.116-.109m.899-.166c-.07 0-.12.053-.124.12l-.195 2.627.195 2.525c.004.066.054.118.124.118.069 0 .12-.052.124-.118l.22-2.525-.22-2.627c-.004-.067-.055-.12-.124-.12m.899-.076c-.076 0-.13.058-.132.131l-.178 2.703.178 2.589c.002.072.056.129.132.129.075 0 .13-.057.131-.129l.2-2.589-.2-2.703c-.001-.073-.056-.131-.131-.131m.9-.061c-.082 0-.14.063-.14.14l-.16 2.764.16 2.639c0 .078.058.14.14.14.08 0 .14-.062.14-.14l.18-2.639-.18-2.764c0-.077-.06-.14-.14-.14m.9-.045c-.088 0-.152.068-.152.149l-.14 2.809.14 2.683c0 .084.064.15.152.15.086 0 .152-.066.152-.15l.16-2.683-.16-2.809c0-.081-.066-.149-.152-.149m.9-.017c-.094 0-.166.073-.166.159l-.12 2.826.12 2.72c0 .09.072.158.166.158.091 0 .166-.068.166-.158l.14-2.72-.14-2.826c0-.086-.075-.159-.166-.159m.9.012c-.1 0-.178.079-.178.168l-.1 2.815.1 2.747c0 .095.078.168.178.168.098 0 .178-.073.178-.168l.12-2.747-.12-2.815c0-.089-.08-.168-.178-.168m.9.044c-.107 0-.19.084-.19.178l-.08 2.771.08 2.773c0 .1.083.178.19.178.104 0 .19-.078.19-.178l.1-2.773-.1-2.771c0-.094-.086-.178-.19-.178m.9.056c-.113 0-.204.09-.204.188l-.06 2.715.06 2.8c0 .106.091.188.204.188.11 0 .204-.082.204-.188l.08-2.8-.08-2.715c0-.098-.094-.188-.204-.188m1.697-.406c-.146 0-.27.12-.27.267v5.59c0 .146.12.266.27.266h3.766c1.67 0 3.024-1.354 3.024-3.023 0-1.67-1.354-3.024-3.024-3.024-.528 0-1.023.136-1.455.376-.29-1.674-1.754-2.952-3.511-2.952-.45 0-.882.085-1.276.24-.12.045-.157.095-.162.188v5.07" />
    </svg>
);
const AppleMusicSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.451-.304.926-.374 1.413-.103.717-.14 1.44-.14 2.163V17.27c.011.153.02.306.027.458.05.758.131 1.512.415 2.226.56 1.41 1.554 2.395 2.973 2.94.413.16.849.262 1.293.33.562.084 1.13.104 1.698.12.418.012.835.015 1.253.015h8.282c.276 0 .553-.006.83-.016.636-.019 1.27-.047 1.893-.176.71-.146 1.37-.39 1.978-.753 1.14-.68 1.9-1.64 2.338-2.893.16-.46.26-.939.327-1.425.073-.534.106-1.071.115-1.61.004-.265.008-7.03.005-7.04zM17.13 17.202c-.024.153-.05.308-.087.458-.21.852-.62 1.293-1.442 1.52-.329.092-.665.132-1.002.147-.337.015-.673 0-1.008-.033-.335-.032-.668-.1-.987-.22-.32-.12-.612-.29-.862-.525-.25-.235-.435-.507-.562-.822-.128-.314-.188-.643-.186-.986.003-.344.077-.676.22-.995.143-.32.35-.591.614-.812.265-.22.564-.385.886-.498.322-.114.657-.183.996-.228.34-.046.682-.067 1.024-.075.22-.005.44 0 .66.01V11.06a.47.47 0 00-.048-.193.313.313 0 00-.18-.146.632.632 0 00-.243-.04c-.13.003-.258.02-.385.053-.128.033-.25.083-.37.15a.895.895 0 00-.31.284.84.84 0 00-.148.46l-.002.038v.022c-.002.077-.004.152-.004.23l-.007 5.84c0 .03-.002.06-.002.09a1.625 1.625 0 01-.097.505.99.99 0 01-.33.422c-.155.118-.33.2-.52.25-.189.05-.383.068-.578.063a1.854 1.854 0 01-.55-.093.975.975 0 01-.42-.274.94.94 0 01-.207-.447 1.564 1.564 0 01-.012-.44c.036-.26.136-.494.299-.69.163-.197.37-.343.603-.436.234-.094.48-.14.73-.15.25-.01.5.013.745.067V11.69c0-.24.018-.48.055-.717.074-.474.24-.912.495-1.312.256-.4.583-.728.976-.987.392-.26.826-.435 1.292-.53.466-.094.94-.11 1.413-.053.473.058.93.194 1.36.41.43.215.808.503 1.12.864.314.36.547.772.7 1.23.153.46.218.937.203 1.42l-.01.43c-.002.24 0 .482 0 .724v4.03z" />
    </svg>
);
const BandcampSvgIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z" />
    </svg>
);

// Social platform config (defined outside component for stable references)
const UCP_SOCIAL_PLATFORMS = [
    { key: 'website', label: 'Website', icon: LanguageRoundedIcon, color: '#4A5568', isMui: true },
    { key: 'facebook', label: 'Facebook', icon: FacebookSvgIcon, color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: InstagramSvgIcon, color: '#E4405F' },
    { key: 'tiktok', label: 'TikTok', icon: TikTokSvgIcon, color: '#000000' },
    { key: 'x', label: 'X', icon: XTwitterSvgIcon, color: '#000000' },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInSvgIcon, color: '#0A66C2' },
    { key: 'snapchat', label: 'Snapchat', icon: SnapchatSvgIcon, color: '#FFFC00' },
];

// Music-specific platforms for artist links_json (defined outside component)
const UCP_MUSIC_PLATFORMS = [
    { key: 'spotify', label: 'Spotify', icon: SpotifySvgIcon, color: '#1DB954' },
    { key: 'youtube', label: 'YouTube', icon: YouTubeSvgIcon, color: '#FF0000' },
    { key: 'soundcloud', label: 'SoundCloud', icon: SoundCloudSvgIcon, color: '#FF5500' },
    { key: 'apple_music', label: 'Apple Music', icon: AppleMusicSvgIcon, color: '#FA243C' },
    { key: 'appleMusic', label: 'Apple Music', icon: AppleMusicSvgIcon, color: '#FA243C' },
    { key: 'bandcamp', label: 'Bandcamp', icon: BandcampSvgIcon, color: '#1DA0C3' },
];

// Combined artist platforms (social + music) — defined outside component for stable reference
const UCP_ALL_ARTIST_PLATFORMS = [...UCP_SOCIAL_PLATFORMS, ...UCP_MUSIC_PLATFORMS];

/* ── Genre icon lookup (matches ArtistDetailPanel exactly) ── */
function getGenreIcon(genre) {
    const g = String(genre || '').toLowerCase().trim();
    if (g.includes('rock') || g.includes('metal') || g.includes('punk')) return BoltRoundedIcon;
    if (g.includes('pop')) return StarRoundedIcon;
    if (g.includes('hip') || g.includes('hop') || g.includes('rap')) return MicRoundedIcon;
    if (g.includes('r&b') || g.includes('rnb') || g.includes('soul') || g.includes('motown')) return FavoriteRoundedIcon;
    if (g.includes('country') || g.includes('folk') || g.includes('bluegrass') || g.includes('americana')) return NaturePeopleRoundedIcon;
    if (g.includes('jazz') || g.includes('classical') || g.includes('orchestra') || g.includes('symphony')) return PianoRoundedIcon;
    if (g.includes('electronic') || g.includes('edm') || g.includes('techno') || g.includes('house') || g.includes('trance')) return HeadphonesRoundedIcon;
    if (g.includes('blues')) return WavesRoundedIcon;
    if (g.includes('reggae') || g.includes('ska') || g.includes('dub')) return SelfImprovementRoundedIcon;
    if (g.includes('indie') || g.includes('alternative') || g.includes('alt')) return AlbumRoundedIcon;
    if (g.includes('latin') || g.includes('salsa') || g.includes('reggaeton') || g.includes('bachata')) return CelebrationRoundedIcon;
    if (g.includes('gospel') || g.includes('christian') || g.includes('worship') || g.includes('spiritual')) return FavoriteRoundedIcon;
    if (g.includes('dance') || g.includes('disco') || g.includes('club')) return NightlifeRoundedIcon;
    if (g.includes('acapella') || g.includes('a capella') || g.includes('vocal')) return RecordVoiceOverRoundedIcon;
    if (g.includes('bollywood') || g.includes('indian') || g.includes('desi')) return TheaterComedyRoundedIcon;
    if (g.includes('funk')) return GraphicEqRoundedIcon;
    if (g.includes('world') || g.includes('african') || g.includes('caribbean')) return RadioRoundedIcon;
    if (g.includes('experimental') || g.includes('ambient') || g.includes('noise')) return GraphicEqRoundedIcon;
    if (g.includes('hot') || g.includes('fire') || g.includes('trending')) return WhatshotRoundedIcon;
    return MusicNoteRoundedIcon;
}

/* ── Business category labels + icons (matches BusinessDetailPanel) ── */
const UCP_CATEGORY_LABELS = {
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

const UCP_CATEGORY_ICON_MAP = {
    food_drink: RestaurantRoundedIcon,
    shopping_retail: StorefrontRoundedIcon,
    automotive: DirectionsCarRoundedIcon,
    home_services: HomeRepairServiceRoundedIcon,
    home_garden: YardRoundedIcon,
    health_wellness: MedicalServicesRoundedIcon,
    beauty_personal_care: ContentCutRoundedIcon,
    fitness_recreation: FitnessCenterRoundedIcon,
    professional_services: BusinessCenterRoundedIcon,
    education_childcare: SchoolRoundedIcon,
    pets_animals: PetsRoundedIcon,
    travel_lodging: TravelExploreRoundedIcon,
    arts_entertainment: TheaterComedyRoundedIcon,
    community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildRoundedIcon,
    other: CategoryRoundedIcon,
};

/* ── Business entity type config (matches BusinessDetailPanel) ── */
const UCP_ENTITY_TYPE_CONFIG = {
    business: { label: 'Business', icon: StorefrontRoundedIcon },
    organization: { label: 'Organization', icon: GroupsRoundedIcon },
    nonprofit: { label: 'Nonprofit', icon: VolunteerActivismIcon },
    government: { label: 'Government', icon: AccountBalanceRoundedIcon },
};

function ucpGetCategoryLabel(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return UCP_CATEGORY_LABELS[k] || '';
}

function ucpGetCategoryIcon(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return UCP_CATEGORY_ICON_MAP[k] || CategoryRoundedIcon;
}

function ucpGetEntityConfig(type) {
    const k = String(type || 'business').toLowerCase().replace(/[^a-z]/g, '');
    return UCP_ENTITY_TYPE_CONFIG[k] || UCP_ENTITY_TYPE_CONFIG.business;
}

/* ────────────────────────────────────────────────────────────────────────────
   Helpers — defined OUTSIDE the component for stable references
   ─────────────────────────────────────────────────────────────── */

const API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    return raw ? `${raw}/api` : '/api';
})();

async function postJson(url, body, extraHeaders) {
    const res = await secureFetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(extraHeaders || {}) },
        body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error('Request failed');
    try { return await res.json(); } catch { return null; }
}

function safeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

/* ── Follow-state cache ── */
function getFollowStateCache() {
    if (typeof window === 'undefined') return {};
    if (!window.__llFollowStateCache) window.__llFollowStateCache = {};
    return window.__llFollowStateCache;
}
function readFollowState(targetKey, accountKey) {
    const cache = getFollowStateCache();
    return cache?.[`${String(targetKey)}:${accountKey || 'personal'}`] ?? null;
}
function writeFollowState(targetKey, patch, accountKey) {
    const cache = getFollowStateCache();
    const key = `${String(targetKey)}:${accountKey || 'personal'}`;
    cache[key] = { ...(cache[key] || {}), ...patch, t: Date.now() };
}

const USER_CARD_OPEN_EVT = 'll:usercard:open';

const fmtCount = (n = 0) => {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x % 1_000_000 ? 1 : 0).replace(/\.0$/, '')}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(x % 1_000 ? 1 : 0).replace(/\.0$/, '')}k`;
    return String(x);
};

/* ═══════════════════════════════════════════════════════════════════════════
   resolveCardTarget — single source of truth for target type + ID
   ═══════════════════════════════════════════════════════════════════════════ */
function resolveCardTarget(u) {
    if (!u) return { type: 'personal', id: 0 };
    const acctType = safeStr(u.account_type).toLowerCase();

    if (acctType === 'artist' || u.artist_id) {
        const artId = Number(u.artist_id || (acctType === 'artist' ? u.id : 0)) || 0;
        if (artId > 0) return { type: 'artist', id: artId };
    }

    if (acctType === 'business' || u.business_id) {
        const bizId = Number(u.business_id || (acctType === 'business' ? u.id : 0)) || 0;
        if (bizId > 0) return { type: 'business', id: bizId };
    }

    return { type: 'personal', id: Number(u.id) || 0 };
}

/* ── Location (matches ProfileHeader logic) ── */

const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
];

const COUNTRIES = [
    { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
    { code: 'GB', name: 'United Kingdom' }, { code: 'IE', name: 'Ireland' }, { code: 'NZ', name: 'New Zealand' },
    { code: 'IN', name: 'India' }, { code: 'MX', name: 'Mexico' }, { code: 'BR', name: 'Brazil' },
    { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' }, { code: 'NL', name: 'Netherlands' }, { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' }, { code: 'SG', name: 'Singapore' }, { code: 'ZA', name: 'South Africa' },
];

function normalizeCounty(s) {
    if (!s) return '';
    return /county\s*$/i.test(s) ? s : `${s} County`;
}

function buildLocationLabel(src) {
    const city = safeStr(src?.home_city || src?.city).trim();
    const countyRaw = safeStr(src?.home_county || src?.county).trim();
    const profileCountry = safeStr(src?.country || 'US').toUpperCase();
    const profileState = safeStr(src?.state).toUpperCase();
    const isAlabama = profileCountry === 'US' && (profileState === 'AL' || profileState === '');

    if (isAlabama) {
        return [city, countyRaw ? normalizeCounty(countyRaw) : ''].filter(Boolean).join(', ');
    }
    if (profileCountry === 'US' && profileState) {
        const stateObj = US_STATES.find((s) => s.code === profileState);
        return stateObj ? stateObj.name : profileState;
    }
    if (profileCountry && profileCountry !== 'US') {
        const countryObj = COUNTRIES.find((c) => c.code === profileCountry);
        return countryObj ? countryObj.name : profileCountry;
    }
    return '';
}

/* ── API helpers ── */

async function fetchFollowStatus(targetType, targetId, acctHeaders, signal) {
    if (!targetId) return { following: false, requested: false };
    const qs = new URLSearchParams({ target_id: String(targetId), target_type: targetType });
    try {
        const res = await secureFetch(`${API_BASE}/follows/status?${qs}`, {
            credentials: 'include',
            headers: { Accept: 'application/json', ...(acctHeaders || {}) },
            signal,
        });
        if (!res.ok) return { following: false, requested: false };
        const data = await res.json();
        return { following: Boolean(data?.following), requested: Boolean(data?.requested) };
    } catch {
        return { following: false, requested: false };
    }
}

async function fetchFollowCounts(targetType, targetId, signal) {
    if (!targetId) return { followers: 0, following: 0 };
    try {
        const res = await secureFetch(`${API_BASE}/follows/counts/${targetType}/${targetId}`, {
            credentials: 'include', headers: { Accept: 'application/json' }, signal,
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return { followers: Number(data?.followers) || 0, following: Number(data?.following) || 0 };
    } catch {
        return { followers: 0, following: 0 };
    }
}

async function fetchPublicProfile(key, signal) {
    const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    try {
        const res = await secureFetch(`${apiBase}/users/public/${encodeURIComponent(key)}`, {
            method: 'GET', credentials: 'include',
            headers: { Accept: 'application/json' }, signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.profile || null;
    } catch {
        return null;
    }
}

/**
 * Fetch public business profile by slug or ID (for popover about/links data).
 * Calls GET /api/business/:slug which returns full business profile.
 * URL pattern matches businessApi.js: apiUrl('/api/business/...')
 */
async function fetchBusinessProfile(slugOrId, signal) {
    if (!slugOrId) return null;
    const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    const url = apiBase ? `${apiBase}/api/business/${encodeURIComponent(slugOrId)}` : `/api/business/${encodeURIComponent(slugOrId)}`;
    try {
        const res = await secureFetch(url, {
            method: 'GET', credentials: 'include',
            headers: { Accept: 'application/json' }, signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        // The endpoint may return data.business or the business object directly
        return data?.business || data || null;
    } catch {
        return null;
    }
}

/**
 * Fetch public artist profile by handle or ID (for popover about/links data).
 * Calls GET /api/music/artists/:handle which returns full artist profile.
 * URL pattern matches music.js routes.
 */
async function fetchArtistProfile(handleOrId, signal) {
    if (!handleOrId) return null;
    // Use relative path so CRA proxy handles it, or prepend API_BASE if set
    const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    const url = apiBase ? `${apiBase}/api/music/artists/${encodeURIComponent(handleOrId)}` : `/api/music/artists/${encodeURIComponent(handleOrId)}`;
    try {
        const res = await secureFetch(url, {
            method: 'GET', credentials: 'include',
            headers: { Accept: 'application/json' }, signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.artist || data || null;
    } catch {
        return null;
    }
}

// Width thresholds — defined outside component for stable reference
const POPOVER_BASE_WIDTH = { xs: 300, sm: 320 };
const POPOVER_WIDE_WIDTH = { xs: 320, sm: 360 };


/* ═══════════════════════════════════════════════════════════════════════════
   UserCardPopover
   ═══════════════════════════════════════════════════════════════════════════ */

export default function UserCardPopover(props) {
    const {
        anchorEl, onClose, user,
        viewer: viewerProp, isSelf,
        following,
        followRequested: followRequestedProp,
        isPrivateAccount: isPrivateAccountProp,
        allowUnfollow, closeOnFollow,
        onFollow, onUnfollow,
        onViewProfile, onHideUser, onBlockUser,
        viewProfileOnly,
    } = props;

    const { user: me } = useAuth();
    const effectiveMe = me || viewerProp || null;
    const {
        isBusinessAccount, isArtistAccount,
        activeBusinessId, activeArtistId,
    } = useActiveAccount();
    const ucpTheme = useTheme();
    const ucpMobile = useMediaQuery(ucpTheme.breakpoints.down('sm'));

    // ── Stable account cache key ──
    const accountCacheKey = isBusinessAccount && activeBusinessId
        ? `biz:${activeBusinessId}`
        : isArtistAccount && activeArtistId
            ? `art:${activeArtistId}`
            : 'personal';

    // ── Account headers — sent on every API call so resolveActor works ──
    const accountHeaders = React.useMemo(() => {
        if (isBusinessAccount && activeBusinessId) {
            return { 'x-account-type': 'business', 'x-business-id': String(activeBusinessId) };
        }
        if (isArtistAccount && activeArtistId) {
            return { 'x-account-type': 'artist', 'x-artist-id': String(activeArtistId) };
        }
        return { 'x-account-type': 'personal' };
    }, [isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const isLoggedIn = Boolean(effectiveMe && (effectiveMe.id || effectiveMe.handle));

    // ── Self detection (account-aware) ──
    const isSelfEffective = (() => {
        if (isSelf === false) return false;
        if (!effectiveMe || !user) return false;
        const target = resolveCardTarget(user);
        if (isBusinessAccount && activeBusinessId) {
            return target.type === 'business' && target.id === Number(activeBusinessId);
        }
        if (isArtistAccount && activeArtistId) {
            return target.type === 'artist' && target.id === Number(activeArtistId);
        }
        if (target.type !== 'personal') return false;
        return effectiveMe.id != null && user.id != null && String(effectiveMe.id) === String(user.id);
    })();

    const allowUnfollowEffective = typeof allowUnfollow === 'boolean' ? allowUnfollow : true;
    const open = Boolean(anchorEl) && Boolean(user);
    const id = open ? 'user-card-popper' : undefined;

    // ── Mobile: navigate directly to profile instead of showing popover ──
    React.useEffect(() => {
        if (!ucpMobile || !open || !user) return;
        // Build the profile path from the user data
        const target = resolveCardTarget(user);
        let profilePath = '';
        if (target.type === 'business') {
            profilePath = user?.business_slug || user?.account_handle || user?.handle || '';
        } else if (target.type === 'artist') {
            profilePath = user?.artist_handle || user?.account_handle || user?.handle || '';
        } else {
            profilePath = user?.handle || user?.id || '';
        }
        if (profilePath) {
            // Close the popover state first
            if (typeof onClose === 'function') onClose();
            // Use onViewProfile callback if provided, otherwise navigate directly
            if (typeof onViewProfile === 'function') {
                onViewProfile(user);
            } else {
                window.location.assign(`/${encodeURIComponent(String(profilePath))}`);
            }
        } else {
            // No handle/slug — just close
            if (typeof onClose === 'function') onClose();
        }
    }, [ucpMobile, open, user, onClose, onViewProfile]);

    const paperRef = React.useRef(null);
    const instanceKeyRef = React.useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const privateFromUser = Boolean(typeof user?.isPrivateAccount === 'boolean' ? user.isPrivateAccount : user?.is_private);
    const isPrivateAccount = Boolean(typeof isPrivateAccountProp === 'boolean' ? isPrivateAccountProp : privateFromUser);

    // ── State ──
    const [loading, setLoading] = React.useState(true);
    const [localRequested, setLocalRequested] = React.useState(false);
    const [localFollowing, setLocalFollowing] = React.useState(false);
    const [localHidden, setLocalHidden] = React.useState(false);
    const [localBlocked, setLocalBlocked] = React.useState(false);
    const [busyKey, setBusyKey] = React.useState('');
    const [toastMessage, setToastMessage] = React.useState('');
    const [avatarError, setAvatarError] = React.useState(false);
    const [profileData, setProfileData] = React.useState(null);
    const [followCounts, setFollowCounts] = React.useState({ followers: 0, following: 0 });

    // ── Own-account detection (cross-account) ──
    // True if the card target is ANY account owned by the viewer — personal,
    // business, or artist — regardless of which account is currently active.
    // This prevents blocking/hiding your own linked accounts.
    const isOwnAccount = React.useMemo(() => {
        if (isSelfEffective) return true;
        if (!effectiveMe || !user) return false;
        const meId = Number(effectiveMe.id);
        if (!meId) return false;
        const target = resolveCardTarget(user);

        // Target is the viewer's personal account (even when viewing from biz/artist)
        if (target.type === 'personal' && target.id === meId) return true;

        // Check owner_user_id from either the user prop or fetched profileData
        const ownerUserId = Number(
            user?.owner_user_id || user?.ownerUserId ||
            user?.submitted_by_user_id || user?.submittedByUserId ||
            user?.created_by_user_id || user?.createdByUserId ||
            profileData?.owner_user_id || profileData?.ownerUserId ||
            profileData?.submitted_by_user_id || profileData?.submittedByUserId ||
            0
        );

        // Target is one of the viewer's business accounts
        if (target.type === 'business') {
            if (activeBusinessId && target.id === Number(activeBusinessId)) return true;
            if (ownerUserId === meId) return true;
        }

        // Target is one of the viewer's artist accounts
        if (target.type === 'artist') {
            if (activeArtistId && target.id === Number(activeArtistId)) return true;
            if (ownerUserId === meId) return true;
        }

        return false;
    }, [isSelfEffective, effectiveMe, user, profileData, activeBusinessId, activeArtistId]);

    const handleClose = React.useCallback(() => {
        if (typeof onClose === 'function') onClose();
    }, [onClose]);

    /* ── Lifecycle effects ── */

    React.useEffect(() => {
        const onOtherOpen = (e) => {
            if (!open) return;
            const otherKey = e?.detail?.instanceKey != null ? String(e.detail.instanceKey) : '';
            const myKey = instanceKeyRef.current ? String(instanceKeyRef.current) : '';
            if (!otherKey || !myKey || otherKey === myKey) return;
            handleClose();
        };
        try { window.addEventListener(USER_CARD_OPEN_EVT, onOtherOpen); } catch { /* */ }
        return () => { try { window.removeEventListener(USER_CARD_OPEN_EVT, onOtherOpen); } catch { /* */ } };
    }, [open, handleClose]);

    React.useEffect(() => {
        const handleFlush = () => {
            const cache = getFollowStateCache();
            Object.keys(cache).forEach((k) => delete cache[k]);
        };
        window.addEventListener('ll:action-cache:flush', handleFlush);
        return () => window.removeEventListener('ll:action-cache:flush', handleFlush);
    }, []);

    React.useEffect(() => {
        if (!open) return undefined;
        try {
            window.dispatchEvent(new CustomEvent(USER_CARD_OPEN_EVT, {
                detail: { instanceKey: instanceKeyRef.current, userId: user?.id ?? null },
            }));
        } catch { /* */ }
        const onPointerDown = (ev) => {
            try {
                const t = ev?.target;
                if (!t) return;
                if (anchorEl?.contains?.(t)) return;
                if (paperRef.current?.contains?.(t)) return;
                handleClose();
            } catch { handleClose(); }
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
    }, [open, anchorEl, handleClose, user?.id]);

    React.useEffect(() => {
        if (!open || !anchorEl) return undefined;
        const check = () => {
            try {
                if (!anchorEl.isConnected) { handleClose(); return; }
                const r = anchorEl.getBoundingClientRect?.();
                if (r && (r.width <= 0 || r.height <= 0)) handleClose();
            } catch { handleClose(); }
        };
        check();
        const raf = window.requestAnimationFrame(check);
        const tm = window.setTimeout(check, 120);
        return () => { try { window.cancelAnimationFrame(raf); window.clearTimeout(tm); } catch { /* */ } };
    }, [open, anchorEl, handleClose]);

    /* ══════════════════════════════════════════════════════════════════════
       HYDRATION — uses resolveCardTarget + /api/follows/status
       Also fetches business/artist profile data for about & links.
       ══════════════════════════════════════════════════════════════════════ */

    const _userId = user?.id;
    const _businessId = user?.business_id;
    const _artistId = user?.artist_id;
    const _accountType = user?.account_type;
    const _handle = user?.handle;

    React.useEffect(() => {
        if (!open) return undefined;

        const target = resolveCardTarget(user);
        if (!target.id) {
            // No valid target — clear loading so the card renders with whatever
            // data the user prop already contains instead of showing skeletons forever.
            setLoading(false);
            return undefined;
        }

        // Reset loading for each new hydration cycle
        setLoading(true);

        const cached = readFollowState(target.id, accountCacheKey);
        if (cached && cached.t && (Date.now() - cached.t) < 5000) {
            setLocalFollowing(Boolean(cached.following));
            setLocalRequested(Boolean(cached.requested));
            setLoading(false);
        }

        setLocalHidden(Boolean(
            user?.hiddenPostsByMe || user?.hidden_posts_by_me ||
            user?.hiddenByMe || user?.isHiddenByMe ||
            user?.mutedByMe || user?.isMutedByMe
        ));
        setLocalBlocked(Boolean(
            user?.blockedByMe || user?.isBlockedByMe ||
            user?.blocked_by_me || user?.blocked
        ));
        setBusyKey('');
        setAvatarError(false);

        let aborted = false;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const signal = controller?.signal;

        (async () => {
            try {
                // Determine which profile to fetch based on target type
                const profileKey = target.type === 'personal' && _userId
                    ? safeStr(_userId || _handle).replace(/^@/, '').trim()
                    : '';

                // For business cards: fetch by slug or ID
                const bizKey = target.type === 'business'
                    ? safeStr(user?.business_slug || user?.slug || user?.account_handle || target.id).trim()
                    : '';

                // For artist cards: fetch by handle or ID
                const artKey = target.type === 'artist'
                    ? safeStr(user?.artist_handle || user?.handle || user?.account_handle || target.id).trim()
                    : '';

                const [statusResult, profile, counts] = await Promise.all([
                    isLoggedIn && !isSelfEffective
                        ? fetchFollowStatus(target.type, target.id, accountHeaders, signal)
                        : Promise.resolve({ following: false, requested: false }),
                    profileKey
                        ? fetchPublicProfile(profileKey, signal)
                        : bizKey
                            ? fetchBusinessProfile(bizKey, signal)
                            : artKey
                                ? fetchArtistProfile(artKey, signal)
                                : Promise.resolve(null),
                    fetchFollowCounts(target.type, target.id, signal),
                ]);

                if (aborted) return;

                const isF = Boolean(statusResult.following);
                const isR = Boolean(statusResult.requested);
                setLocalFollowing(isR ? false : isF);
                setLocalRequested(isR);
                writeFollowState(target.id, { following: isR ? false : isF, requested: isR }, accountCacheKey);

                if (profile) {
                    setProfileData(profile);
                    if (typeof profile.hiddenPostsByMe === 'boolean') setLocalHidden(profile.hiddenPostsByMe);
                    if (typeof profile.blockedByMe === 'boolean') setLocalBlocked(profile.blockedByMe);
                }

                setFollowCounts(counts);
            } catch {
                if (!aborted) {
                    const propReq = Boolean(
                        typeof followRequestedProp === 'boolean' ? followRequestedProp :
                            (user?.followRequested || user?.follow_requested || user?.requested)
                    );
                    setLocalFollowing(propReq ? false : Boolean(following));
                    setLocalRequested(propReq);
                }
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => { aborted = true; try { controller?.abort(); } catch { /* */ } };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, _userId, _businessId, _artistId, _accountType, _handle, accountCacheKey, accountHeaders, isLoggedIn, isSelfEffective]);

    /* ── Follow / Unfollow — ALWAYS uses /api/follows/toggle directly ── */

    const handleFollowClick = React.useCallback(async () => {
        if (!user || isSelfEffective || localBlocked) return;

        const shouldUnfollow = Boolean(allowUnfollowEffective && localFollowing);
        if (!shouldUnfollow && localRequested) return;

        setBusyKey('follow');

        const target = resolveCardTarget(user);

        // Optimistic UI
        if (shouldUnfollow) {
            setLocalFollowing(false);
            setLocalRequested(false);
            writeFollowState(target.id, { requested: false, following: false }, accountCacheKey);
            setFollowCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        } else if (isPrivateAccount) {
            setLocalRequested(true);
            setLocalFollowing(false);
            writeFollowState(target.id, { requested: true, following: false }, accountCacheKey);
        } else {
            setLocalFollowing(true);
            setLocalRequested(false);
            writeFollowState(target.id, { requested: false, following: true }, accountCacheKey);
            setFollowCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
        }

        try {
            const body = {
                target_id: target.id,
                target_type: target.type,
                action: shouldUnfollow ? 'unfollow' : 'follow',
            };

            const hdrs = { 'Content-Type': 'application/json', ...accountHeaders };
            const res = await secureFetch(`${API_BASE}/follows/toggle`, {
                method: 'POST', credentials: 'include', headers: hdrs,
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed');
            const payload = await res.json().catch(() => null);

            if (payload && typeof payload === 'object') {
                const nextFollowing = Boolean(payload.following ?? payload.isFollowing);
                const nextRequested = Boolean(payload.requested ?? payload.followRequested);
                const serverPrivate = Boolean(payload.isPrivateAccount ?? payload.is_private_account);
                const privateFlag = Boolean(serverPrivate || isPrivateAccount);
                const shouldRequest = shouldUnfollow ? false : Boolean((privateFlag && !nextFollowing) || nextRequested);

                if (shouldRequest) {
                    setLocalRequested(true);
                    setLocalFollowing(false);
                } else {
                    setLocalFollowing(nextFollowing);
                    setLocalRequested(false);
                }
                writeFollowState(target.id, {
                    requested: shouldRequest,
                    following: !shouldRequest && nextFollowing,
                }, accountCacheKey);
            }

            // Broadcast for other components to sync
            if (target.type === 'business') {
                try {
                    window.dispatchEvent(new CustomEvent('ll:business:follow-changed', {
                        detail: { businessId: target.id, isFollowing: !shouldUnfollow, accountCacheKey, source: 'userCard' },
                    }));
                } catch { /* */ }
            }
            if (target.type === 'artist') {
                try {
                    window.dispatchEvent(new CustomEvent('ll:artist:follow-changed', {
                        detail: { artistId: target.id, isFollowing: !shouldUnfollow, source: 'userCard' },
                    }));
                } catch { /* */ }
            }

            // Also call parent callback (fire-and-forget) for any parent-level state sync
            try {
                if (shouldUnfollow && typeof onUnfollow === 'function') onUnfollow(user);
                if (!shouldUnfollow && typeof onFollow === 'function') onFollow(user);
            } catch { /* */ }

            if (shouldUnfollow && !ucpMobile) handleClose();
            if (!shouldUnfollow && closeOnFollow && !ucpMobile) handleClose();
        } catch {
            // Revert optimistic state
            if (shouldUnfollow) {
                setLocalFollowing(true);
                setFollowCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
                writeFollowState(target.id, { requested: false, following: true }, accountCacheKey);
            } else {
                setLocalFollowing(false);
                setLocalRequested(false);
                if (!isPrivateAccount) {
                    setFollowCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
                }
                writeFollowState(target.id, { requested: false, following: false }, accountCacheKey);
            }
        } finally {
            setBusyKey('');
        }
    }, [
        user, isSelfEffective, localBlocked, localRequested, localFollowing,
        allowUnfollowEffective, onFollow, onUnfollow,
        isPrivateAccount, closeOnFollow, handleClose, accountCacheKey, accountHeaders,
    ]);

    const handleViewProfile = React.useCallback(() => {
        if (typeof onViewProfile === 'function') onViewProfile(user);
        handleClose();
    }, [onViewProfile, user, handleClose]);

    const handleHidePosts = React.useCallback(async () => {
        if (!user?.id || isOwnAccount || busyKey) return;
        setBusyKey('hide');

        const target = resolveCardTarget(user);
        const nextHidden = !localHidden;
        const displayName = (() => {
            if (target.type === 'business') { const n = safeStr(user?.business_name || user?.account_name); if (n) return n; }
            if (target.type === 'artist') { const n = safeStr(user?.artist_name || user?.account_name); if (n) return n; }
            return `${safeStr(user?.first_name)} ${safeStr(user?.last_name)}`.trim() || safeStr(user?.handle) || 'User';
        })();

        try {
            if (typeof onHideUser === 'function') {
                await onHideUser(user);
            } else {
                const body = { target_id: target.id, target_type: target.type, action: nextHidden ? 'hide' : 'unhide' };
                if (isBusinessAccount && activeBusinessId) body.actor_business_id = Number(activeBusinessId);
                if (isArtistAccount && activeArtistId) body.actor_artist_id = Number(activeArtistId);
                await postJson('/api/users/hide', body, accountHeaders);
            }
            try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: target.id, targetType: target.type, hidden: nextHidden } })); } catch { /* */ }
            if (target.type === 'business') {
                try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: target.id, hidden: nextHidden, source: 'userCard' } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
            }
            setLocalHidden(nextHidden);
            setToastMessage(nextHidden ? `Posts from ${displayName} hidden` : `Posts from ${displayName} unhidden`);
        } catch { /* */ } finally { setBusyKey(''); handleClose(); }
    }, [user, isOwnAccount, localHidden, onHideUser, handleClose, busyKey, isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId, accountHeaders]);

    const handleBlockUser = React.useCallback(async () => {
        if (!user?.id || isOwnAccount || busyKey) return;
        setBusyKey('block');

        const target = resolveCardTarget(user);
        const nextBlocked = !localBlocked;
        const displayName = (() => {
            if (target.type === 'business') { const n = safeStr(user?.business_name || user?.account_name); if (n) return n; }
            if (target.type === 'artist') { const n = safeStr(user?.artist_name || user?.account_name); if (n) return n; }
            return `${safeStr(user?.first_name)} ${safeStr(user?.last_name)}`.trim() || safeStr(user?.handle) || 'User';
        })();

        try {
            if (typeof onBlockUser === 'function') {
                await onBlockUser(user);
            } else {
                const body = { target_id: target.id, target_type: target.type, action: nextBlocked ? 'block' : 'unblock' };
                if (isBusinessAccount && activeBusinessId) body.actor_business_id = Number(activeBusinessId);
                if (isArtistAccount && activeArtistId) body.actor_artist_id = Number(activeArtistId);
                await postJson('/api/users/block', body, accountHeaders);
            }
            try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: target.id, targetType: target.type, blocked: nextBlocked } })); } catch { /* */ }
            if (target.type === 'business') {
                try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: target.id, blocked: nextBlocked, source: 'userCard' } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
            }
            if (nextBlocked) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: target.id, targetType: target.type, hidden: true } })); } catch { /* */ }
                setLocalHidden(true);
            }
            setLocalBlocked(nextBlocked);
            setToastMessage(nextBlocked ? `${displayName} blocked` : `${displayName} unblocked`);
        } catch { /* */ } finally { setBusyKey(''); handleClose(); }
    }, [user, isOwnAccount, localBlocked, onBlockUser, handleClose, busyKey, isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId, accountHeaders]);

    /* ── Display fields ── */
    const isBusinessCard = Boolean(user?.account_type === 'business' || user?.business_id);
    const isArtistCard = Boolean(user?.account_type === 'artist' || user?.artist_id);
    // Distinguish musicians (music note) from visual artists (palette) via
    // profile_type. Falls back to music-note when missing.
    const artistProfileType = String(
        profileData?.profile_type || profileData?.profileType ||
        user?.profile_type || user?.profileType || ''
    ).toLowerCase();
    const isVisualArtistCard = isArtistCard && artistProfileType === 'artist';

    const displayName = (() => {
        if (isBusinessCard) { const bn = safeStr(profileData?.name || user?.business_name || user?.account_name || user?.name); if (bn) return bn; }
        if (isArtistCard) { const an = safeStr(profileData?.name || user?.artist_name || user?.account_name || user?.name); if (an) return an; }
        return `${safeStr(user?.first_name)} ${safeStr(user?.last_name)}`.replace(/\s+/g, ' ').trim();
    })();

    const handle = (() => {
        if (isBusinessCard) { const bh = safeStr(profileData?.slug || user?.business_slug || user?.account_handle || user?.slug); if (bh) return bh; }
        if (isArtistCard) { const ah = safeStr(profileData?.handle || user?.artist_handle || user?.account_handle); if (ah) return ah; }
        return safeStr(user?.handle || user?.username);
    })();

    const cardAvatar = (() => {
        if (isBusinessCard) {
            const candidates = [
                user?.logo_url, user?.logoUrl,
                user?.business_avatar_url, user?.business_logo_url,
                user?.account_avatar_url,
                user?.image_url, user?.imageUrl,
                user?.photo_url, user?.photoUrl,
                profileData?.logo_url, profileData?.logoUrl,
                profileData?.avatar_url, profileData?.avatarUrl,
                profileData?.image_url,
            ];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined') return s;
            }
            return '';
        }
        if (isArtistCard) return user?.artist_avatar_url || user?.account_avatar_url || profileData?.avatar_url || profileData?.avatarUrl || '';
        return user?.profile_picture || user?.avatar_url || '';
    })();

    const hasValidAvatar = (() => {
        if (!cardAvatar || avatarError) return false;
        if (cardAvatar.includes('default_avatar') || cardAvatar.includes('default_business') || cardAvatar.includes('default_logo')) return false;
        return true;
    })();

    const bio = safeStr(profileData?.bio || user?.bio || '').trim();
    const profileBio = safeStr(profileData?.profile_bio || user?.profile_bio || '').trim();

    // For businesses: description serves as bio; for artists: bio field
    const displayBio = (() => {
        if (isBusinessCard) {
            return safeStr(profileData?.description || user?.description || profileData?.tagline || user?.tagline || '').trim();
        }
        if (isArtistCard) {
            return safeStr(profileData?.bio || user?.bio || profileData?.tagline || user?.tagline || '').trim();
        }
        return profileBio || bio;
    })();

    const location = buildLocationLabel(profileData || user);

    // ── Business-specific about info (merge user prop + fetched profileData) ──
    const businessCategoryKey = (() => {
        if (!isBusinessCard) return '';
        return safeStr(profileData?.category_key || profileData?.categoryKey || user?.category_key || user?.categoryKey || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
    })();

    const businessCategoryLabel = ucpGetCategoryLabel(businessCategoryKey) || safeStr(profileData?.category || user?.category || '').trim();
    const BusinessCategoryIcon = ucpGetCategoryIcon(businessCategoryKey);

    const businessEntityType = (() => {
        if (!isBusinessCard) return '';
        return safeStr(profileData?.entity_type || profileData?.entityType || user?.entity_type || user?.entityType || 'business').trim().toLowerCase();
    })();
    const businessEntityConfig = ucpGetEntityConfig(businessEntityType);

    const businessPhone = (() => {
        if (!isBusinessCard) return '';
        return safeStr(profileData?.phone || user?.phone || '').trim();
    })();

    const businessEmail = (() => {
        if (!isBusinessCard) return '';
        return safeStr(profileData?.email_public || profileData?.emailPublic || profileData?.email || user?.email_public || user?.emailPublic || user?.email || '').trim();
    })();

    // ── Artist-specific about info (merge user prop + fetched profileData) ──
    const artistGenresAll = (() => {
        if (!isArtistCard) return [];
        // Try profileData first, then user prop — matching ArtistDetailPanel pattern
        let g = profileData?.genres || user?.genres;
        if (!g) {
            const raw = profileData?.genres_json || profileData?.genresJson || user?.genres_json || user?.genresJson;
            if (raw && typeof raw === 'string') { try { g = JSON.parse(raw); } catch { g = null; } }
            else if (raw && typeof raw === 'object') { g = raw; }
        }
        if (!g) return [];
        if (Array.isArray(g)) {
            return g.map((item) => {
                if (typeof item === 'string') return item;
                return safeStr(item?.name || item?.label || '');
            }).filter(Boolean);
        }
        return [];
    })();
    const artistGenres = artistGenresAll.slice(0, 3);
    const extraGenresCount = Math.max(0, artistGenresAll.length - 3);

    // Parse social links — works for personal (social_json.contact), business (top-level urls), and artist (links_json)
    const cardSocialLinks = (() => {
        // Personal users: social_json.contact
        if (!isBusinessCard && !isArtistCard) {
            const src = profileData || user;
            let sj = src?.social_json;
            if (!sj) return [];
            if (typeof sj === 'string') { try { sj = JSON.parse(sj); } catch { return []; } }
            const c = (sj && sj.contact) || {};
            return UCP_SOCIAL_PLATFORMS.filter((p) => {
                const v = String(c[p.key] || '').trim();
                return v.length > 0;
            }).map((p) => ({ ...p, url: String(c[p.key] || '').trim() }));
        }

        // Business: top-level url fields — check both profileData and user
        if (isBusinessCard) {
            const bizMap = [
                { key: 'website', platformKey: 'website', fields: ['website_url', 'websiteUrl'] },
                { key: 'facebook', platformKey: 'facebook', fields: ['facebook_url', 'facebookUrl'] },
                { key: 'instagram', platformKey: 'instagram', fields: ['instagram_url', 'instagramUrl'] },
                { key: 'x', platformKey: 'x', fields: ['twitter_url', 'twitterUrl'] },
            ];
            const result = [];
            for (const m of bizMap) {
                let v = '';
                // Try profileData first, then user prop
                for (const f of m.fields) {
                    v = String(profileData?.[f] || '').trim();
                    if (v) break;
                    v = String(user?.[f] || '').trim();
                    if (v) break;
                }
                if (!v) continue;
                const platform = UCP_SOCIAL_PLATFORMS.find((p) => p.key === m.platformKey);
                if (platform) result.push({ ...platform, url: v });
            }
            return result;
        }

        // Artist: links_json object — matching ArtistDetailPanel pattern (line 1126-1132)
        // Includes both social and music platforms
        if (isArtistCard) {
            // Resolve links object from multiple sources — matches ArtistDetailPanel exactly
            const lj = (() => {
                // Try profileData.links first (parsed object)
                if (profileData?.links && typeof profileData.links === 'object' && !Array.isArray(profileData.links) && Object.keys(profileData.links).length > 0) return profileData.links;
                // Then user.links
                if (user?.links && typeof user.links === 'object' && !Array.isArray(user.links) && Object.keys(user.links).length > 0) return user.links;
                // Then links_json from either source (may be string or object)
                const raw = profileData?.links_json || profileData?.linksJson || user?.links_json || user?.linksJson;
                if (raw && typeof raw === 'string') { try { const p = JSON.parse(raw); if (p && typeof p === 'object' && !Array.isArray(p)) return p; } catch { /* ignore */ } }
                if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
                return {};
            })();

            if (!lj || Object.keys(lj).length === 0) return [];

            // Deduplicate by label (UCP_ALL_ARTIST_PLATFORMS may have apple_music + appleMusic)
            const seen = new Set();
            const result = [];
            for (const p of UCP_ALL_ARTIST_PLATFORMS) {
                if (seen.has(p.label)) continue;
                const v = String(lj[p.key] || '').trim();
                if (v.length > 0) {
                    seen.add(p.label);
                    result.push({ ...p, url: v });
                }
            }
            return result;
        }

        return [];
    })();

    // Whether we should widen the popover (5+ links)
    const isWideCard = cardSocialLinks.length >= 5 || (isBusinessCard && businessCategoryLabel) || (isArtistCard && artistGenres.length > 0);

    const followLabel = (() => {
        if (localBlocked) return 'Blocked';
        if (localRequested) return 'Requested';
        if (localFollowing) return allowUnfollowEffective ? 'Unfollow' : 'Following';
        return 'Follow';
    })();

    const followDisabled = Boolean(
        busyKey === 'follow' || localBlocked || localRequested ||
        (!allowUnfollowEffective && localFollowing) || isSelfEffective
    );

    const FollowBtnIcon = (() => {
        if (busyKey === 'follow') return null;
        if (localBlocked) return BlockRoundedIcon;
        if (localRequested) return HourglassTopRoundedIcon;
        if (localFollowing) return CheckRoundedIcon;
        return PersonAddAlt1RoundedIcon;
    })();

    /* ═══════════════════════════════════════════════════════════
       CARD INNER
       ═══════════════════════════════════════════════════════════ */

    const cardInner = (
        <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 2, pt: 1.75, pb: 1 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                    <Avatar
                        src={hasValidAvatar ? cardAvatar : undefined}
                        onError={() => setAvatarError(true)}
                        alt={displayName || handle || 'User'}
                        sx={(t) => ({
                            width: 52, height: 52, flexShrink: 0,
                            border: '2px solid',
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                            ...(isBusinessCard || isArtistCard
                                    ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main }
                                    : { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main }
                            ),
                        })}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                    >
                        {isBusinessCard ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                            : isArtistCard ? (isVisualArtistCard
                                    ? <PaletteRoundedIcon sx={{ fontSize: 26 }} />
                                    : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />)
                                : <PersonRoundedIcon sx={{ fontSize: 28 }} />}
                    </Avatar>
                    {!isBusinessCard && !isArtistCard && Boolean(profileData?.is_online) && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: '#44b700',
                                border: '2px solid',
                                borderColor: 'background.paper',
                                zIndex: 1,
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                    {loading ? (
                        <>
                            <Skeleton width="70%" height={20} sx={{ borderRadius: 1 }} />
                            <Skeleton width="40%" height={16} sx={{ borderRadius: 1, mt: 0.5 }} />
                        </>
                    ) : (
                        <>
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography sx={{
                                    fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {displayName || handle || 'User'}
                                </Typography>
                                {isPrivateAccount && !isBusinessCard && !isArtistCard && (
                                    <Tooltip title="Private account" arrow>
                                        <LockRoundedIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                                    </Tooltip>
                                )}
                            </Stack>
                            {handle && (
                                <Typography variant="body2" sx={{
                                    color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.3,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    @{handle}
                                </Typography>
                            )}

                            {/* Business category + entity type chips */}
                            {isBusinessCard && (businessCategoryLabel || (businessEntityType && businessEntityType !== 'business')) && (
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.4, flexWrap: 'wrap', rowGap: 0.35 }}>
                                    {businessCategoryLabel && (
                                        <Chip
                                            icon={<BusinessCategoryIcon sx={{ fontSize: '12px !important' }} />}
                                            label={businessCategoryLabel}
                                            size="small"
                                            sx={(t) => ({
                                                fontSize: '0.62rem', fontWeight: 800, height: 20, borderRadius: 999,
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                color: t.palette.primary.main,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.25),
                                                '& .MuiChip-label': { px: 0.7, lineHeight: 1 },
                                                '& .MuiChip-icon': { ml: 0.4, color: t.palette.primary.main },
                                            })}
                                        />
                                    )}
                                    {businessEntityType && businessEntityType !== 'business' && (() => {
                                        const EntIcon = businessEntityConfig.icon;
                                        return (
                                            <Chip
                                                icon={<EntIcon sx={{ fontSize: '11px !important' }} />}
                                                label={businessEntityConfig.label}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.6rem', fontWeight: 700, height: 18, borderRadius: 999,
                                                    '& .MuiChip-icon': { color: 'text.secondary' },
                                                }}
                                            />
                                        );
                                    })()}
                                </Stack>
                            )}

                            {/* Artist genre chips with icons — matches ArtistCard */}
                            {isArtistCard && artistGenres.length > 0 && (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                    {artistGenres.map((g, idx) => {
                                        const GenreIcon = getGenreIcon(g);
                                        return (
                                            <Chip
                                                key={`${g}-${idx}`}
                                                icon={<GenreIcon sx={{ fontSize: '13px !important' }} />}
                                                label={g}
                                                size="small"
                                                sx={(t) => ({
                                                    height: 26,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(t.palette.primary.main, 0.07),
                                                    color: t.palette.text.primary,
                                                    fontWeight: 700,
                                                    fontSize: '0.73rem',
                                                    '& .MuiChip-icon': { color: t.palette.primary.main },
                                                    '& .MuiChip-label': { px: 0.75 },
                                                })}
                                            />
                                        );
                                    })}
                                    {extraGenresCount > 0 && (
                                        <Chip
                                            size="small"
                                            label={`+${extraGenresCount}`}
                                            sx={(t) => ({
                                                height: 22,
                                                borderRadius: 999,
                                                bgcolor: alpha(t.palette.text.primary, 0.04),
                                                color: t.palette.text.secondary,
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                '& .MuiChip-label': { px: 0.75 },
                                            })}
                                        />
                                    )}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>

                <IconButton onClick={handleClose} size="small" aria-label="Close"
                            sx={{ mt: -0.25, mr: -0.5, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Social link icons */}
            {!loading && cardSocialLinks.length > 0 && !isPrivateAccount && (
                <Box sx={{ px: 2, pb: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.35 }}>
                    {cardSocialLinks.map((platform) => {
                        const href = /^https?:\/\//i.test(platform.url) ? platform.url : `https://${platform.url}`;
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
                                    sx={(t) => {
                                        // Use theme-aware social colors (dark-safe) — matches ArtistCard
                                        const isDark = t.palette.mode === 'dark';
                                        const social = t.custom?.brand?.social || t.custom?.social || {};
                                        // Website icon: use text.primary on dark (white-ish), muted gray on light
                                        const themeColor = platform.key === 'website'
                                            ? (isDark ? t.palette.text.primary : (platform.color || t.palette.text.secondary))
                                            : (social[platform.key] || platform.color || t.palette.primary.main);
                                        return {
                                            width: 28,
                                            height: 28,
                                            color: themeColor,
                                            bgcolor: alpha(themeColor, 0.08),
                                            transition: `all 120ms ease`,
                                            '&:hover': {
                                                bgcolor: alpha(themeColor, 0.18),
                                            },
                                        };
                                    }}
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
            )}

            {/* Business contact info (phone & email) */}
            {!loading && isBusinessCard && (businessPhone || businessEmail) && !isPrivateAccount && (
                <Box sx={{ px: 2, pb: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                    {businessPhone && (
                        <Stack direction="row" spacing={0.35} alignItems="center">
                            <PhoneRoundedIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                            <Typography sx={{ fontSize: '0.7rem', color: 'primary.main', fontWeight: 600 }}>
                                {businessPhone}
                            </Typography>
                        </Stack>
                    )}
                    {businessEmail && !businessPhone && (
                        <Stack direction="row" spacing={0.35} alignItems="center">
                            <EmailRoundedIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                            <Typography sx={{
                                fontSize: '0.7rem', color: 'primary.main', fontWeight: 600,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 200,
                            }}>
                                {businessEmail}
                            </Typography>
                        </Stack>
                    )}
                </Box>
            )}

            {/* Profile bio with ...more link */}
            {!loading && displayBio && !isPrivateAccount && (
                <Box sx={{ px: 2, pb: 0.75 }}>
                    <Box
                        sx={{
                            fontSize: '0.8rem', lineHeight: 1.45, color: 'text.secondary',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            wordBreak: 'break-word',
                        }}
                    >
                        <RichTextDisplay
                            html={displayBio}
                            sx={{
                                fontSize: 'inherit',
                                lineHeight: 'inherit',
                                color: 'inherit',
                                '& p': { m: 0, mb: 0.15 },
                                '& p:last-of-type': { mb: 0 },
                                '& h3': { fontSize: 'inherit', fontWeight: 700, m: 0, mb: 0.15 },
                                '& ul, & ol': { my: 0, pl: 2 },
                                '& li': { mb: 0 },
                            }}
                        />
                    </Box>
                </Box>
            )}

            {!loading && (
                <Box sx={{ px: 2, pb: 1.25, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
                        {fmtCount(followCounts.followers)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', mr: 0.75 }}>
                        followers
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
                        {fmtCount(followCounts.following)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                        following
                    </Typography>
                    {location && (
                        <>
                            <Box sx={{ mx: 0.25, width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: 'text.disabled', ml: 0.25 }} />
                            <Typography variant="caption" sx={{
                                color: 'text.secondary', fontSize: '0.72rem',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {location}
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {loading && (
                <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 2 }}>
                    <Skeleton width={60} height={14} sx={{ borderRadius: 1 }} />
                    <Skeleton width={60} height={14} sx={{ borderRadius: 1 }} />
                </Box>
            )}

            <Divider />

            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                        <CircularProgress size={22} />
                    </Box>
                ) : !isLoggedIn || viewProfileOnly ? (
                    <Button fullWidth size="small" variant="contained" disableElevation
                            onClick={handleViewProfile}
                            startIcon={<PersonIcon sx={{ fontSize: '18px !important' }} />}
                            sx={(t) => ({
                                textTransform: 'none', fontWeight: 700, borderRadius: 999, fontSize: '0.82rem',
                                py: 0.7, bgcolor: t.palette.primary.main, color: t.palette.primary.contrastText,
                                '&:hover': { bgcolor: t.palette.primary.dark },
                            })}
                    >
                        View Profile
                    </Button>
                ) : isOwnAccount ? (
                    <Button fullWidth size="small" variant="contained" disableElevation
                            onClick={handleViewProfile}
                            startIcon={<PersonIcon sx={{ fontSize: '18px !important' }} />}
                            sx={(t) => ({
                                textTransform: 'none', fontWeight: 700, borderRadius: 999, fontSize: '0.82rem',
                                py: 0.7, bgcolor: t.palette.primary.main, color: t.palette.primary.contrastText,
                                '&:hover': { bgcolor: t.palette.primary.dark },
                            })}
                    >
                        View Profile
                    </Button>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Button fullWidth size="small" disableElevation
                                    variant={followLabel === 'Follow' ? 'contained' : 'outlined'}
                                    onClick={handleFollowClick}
                                    disabled={followDisabled}
                                    startIcon={
                                        busyKey === 'follow'
                                            ? <CircularProgress size={14} color="inherit" />
                                            : FollowBtnIcon ? <FollowBtnIcon sx={{ fontSize: '16px !important' }} /> : undefined
                                    }
                                    sx={(t) => {
                                        const isFollow = followLabel === 'Follow';
                                        const isBlk = followLabel === 'Blocked';
                                        return {
                                            textTransform: 'none', fontWeight: 700, borderRadius: 999,
                                            fontSize: '0.8rem', py: 0.6, minHeight: 0,
                                            ...(isFollow ? {
                                                bgcolor: t.palette.primary.main, color: t.palette.primary.contrastText,
                                                '&:hover': { bgcolor: t.palette.primary.dark },
                                            } : isBlk ? {
                                                color: t.palette.error.main, borderColor: alpha(t.palette.error.main, 0.3),
                                            } : {
                                                color: t.palette.text.primary, borderColor: alpha(t.palette.divider, 1),
                                                '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.04), borderColor: alpha(t.palette.text.primary, 0.3) },
                                            }),
                                        };
                                    }}
                            >
                                {followLabel}
                            </Button>
                            <Button fullWidth size="small" variant="outlined" disableElevation
                                    onClick={handleViewProfile}
                                    startIcon={<PersonIcon sx={{ fontSize: '16px !important' }} />}
                                    sx={(t) => ({
                                        textTransform: 'none', fontWeight: 700, borderRadius: 999,
                                        fontSize: '0.8rem', py: 0.6, minHeight: 0,
                                        color: t.palette.text.primary, borderColor: alpha(t.palette.divider, 1),
                                        '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.04), borderColor: alpha(t.palette.text.primary, 0.3) },
                                    })}
                            >
                                Profile
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                            <Button fullWidth size="small"
                                    onClick={handleHidePosts}
                                    disabled={busyKey === 'hide' || busyKey === 'block'}
                                    startIcon={busyKey === 'hide' ? <CircularProgress size={12} color="inherit" /> : <VisibilityOffIcon sx={{ fontSize: '14px !important' }} />}
                                    sx={(t) => ({
                                        textTransform: 'none', fontWeight: 600, borderRadius: 999,
                                        fontSize: '0.72rem', py: 0.4, minHeight: 0, color: t.palette.text.secondary,
                                        '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.04) },
                                    })}
                            >
                                {localHidden ? 'Unhide' : 'Hide Posts'}
                            </Button>
                            <Button fullWidth size="small"
                                    onClick={handleBlockUser}
                                    disabled={busyKey === 'hide' || busyKey === 'block'}
                                    startIcon={busyKey === 'block' ? <CircularProgress size={12} color="inherit" /> : <BlockIcon sx={{ fontSize: '14px !important' }} />}
                                    sx={(t) => ({
                                        textTransform: 'none', fontWeight: 600, borderRadius: 999,
                                        fontSize: '0.72rem', py: 0.4, minHeight: 0, color: alpha(t.palette.error.main, 0.7),
                                        '&:hover': { bgcolor: alpha(t.palette.error.main, 0.04) },
                                    })}
                            >
                                {localBlocked ? 'Unblock' : 'Block'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>

            {isLoggedIn && !isOwnAccount && isPrivateAccount && !localFollowing && !localRequested && !loading && (
                <Box sx={{ px: 2, pb: 1.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', lineHeight: 1.3 }}>
                        This account is private. Following sends a request.
                    </Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <>
            {ucpMobile ? null : (
                <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" disablePortal={false}
                        popperOptions={{ strategy: 'fixed' }}
                        sx={{ zIndex: (t) => Math.max(t.zIndex.modal + 3, 8000) }}
                >
                    <ClickAwayListener onClickAway={handleClose} disableReactTree mouseEvent="onClick" touchEvent="onTouchEnd">
                        <Paper ref={paperRef} elevation={12}
                               sx={{
                                   width: isWideCard ? POPOVER_WIDE_WIDTH : POPOVER_BASE_WIDTH,
                                   borderRadius: 3, overflow: 'hidden',
                                   border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                   boxShadow: (t) => t.custom?.shadows?.md || t.shadows[12],
                                   bgcolor: 'background.paper',
                               }}
                        >
                            {cardInner}
                        </Paper>
                    </ClickAwayListener>
                </Popper>
            )}
            <Snackbar open={Boolean(toastMessage)} autoHideDuration={3000}
                      onClose={() => setToastMessage('')} message={toastMessage}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </>
    );
}

UserCardPopover.propTypes = {
    anchorEl: PropTypes.any,
    onClose: PropTypes.func,
    user: PropTypes.object,
    viewer: PropTypes.object,
    isSelf: PropTypes.bool,
    following: PropTypes.bool,
    followRequested: PropTypes.bool,
    isPrivateAccount: PropTypes.bool,
    allowUnfollow: PropTypes.bool,
    closeOnFollow: PropTypes.bool,
    onFollow: PropTypes.func,
    onUnfollow: PropTypes.func,
    onViewProfile: PropTypes.func,
    onHideUser: PropTypes.func,
    onBlockUser: PropTypes.func,
    layoutVariant: PropTypes.oneOf(['default', 'social']),
    viewProfileOnly: PropTypes.bool,
};

UserCardPopover.defaultProps = {
    layoutVariant: 'default',
    viewProfileOnly: false,
};


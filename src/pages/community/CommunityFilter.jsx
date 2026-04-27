// src/pages/community/CommunityFilter.jsx
//
// Community filter bar used by CommunityPanel.
// Groups category selector:
// - Standard dropdown (no popup/dialog)
// - Shows ONLY main group categories with counts
// - Disabled when (0)
// - Selecting MAIN filters groups by that main category
//
// NOTE: CommunityPanel should pass `groupsForCounts` (unfiltered by category) so counts stay stable.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Collapse,
    TextField,
    Chip,
    Stack,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

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
import GroupsIcon from '@mui/icons-material/Groups';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

// News category icons (canonical RSS set)
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import SportsFootballRoundedIcon from '@mui/icons-material/SportsFootballRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import LocalPoliceRoundedIcon from '@mui/icons-material/LocalPoliceRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import SearchInput from '../../components/SearchInput';
import CityCountySelect from '../../components/CityCountySelect';
import { useAuth } from '../../components/AuthModalContext';
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from '../../utils/geoRadius';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';

// Community post category icons (MUI)
import { getCommunityCategory, COMMUNITY_CATEGORY_META, PeopleRoundedIcon } from './utils/communityPostCategoryIcons';

// Saved filters — slice 3 of the community revamp.
import SavedFiltersMenu from './SavedFiltersMenu';
import useSavedFilters from './useSavedFilters';

// News categories — mirrors TheNewsAPI's supported categories.
// `id` must match what the backend (newsService.js) expects in VALID_CATEGORIES.
// News date range presets — map to backend dateRange param.
// Matches TheNewsAPI's published_after lookback windows.
const NEWS_DATE_RANGES = [
    { value: 'today', label: 'Today', sublabel: 'Last 24 hours' },
    { value: 'week', label: 'This week', sublabel: 'Last 7 days' },
    { value: 'month', label: 'This month', sublabel: 'Last 30 days' },
    { value: 'all', label: 'All time', sublabel: 'No date filter' },
];

const NEWS_CATEGORIES = [
    { id: 'news', label: 'Top News', Icon: NewspaperRoundedIcon },
    { id: 'sports', label: 'Sports', Icon: SportsFootballRoundedIcon },
    { id: 'politics', label: 'Politics', Icon: AccountBalanceRoundedIcon },
    { id: 'weather', label: 'Weather', Icon: ThunderstormRoundedIcon },
    { id: 'business', label: 'Business', Icon: BusinessCenterRoundedIcon },
    { id: 'crime', label: 'Crime & Courts', Icon: LocalPoliceRoundedIcon },
    { id: 'community', label: 'Community', Icon: PeopleAltRoundedIcon },
    { id: 'entertainment', label: 'Entertainment', Icon: TheaterComedyRoundedIcon },
    { id: 'health', label: 'Health', Icon: HealthAndSafetyRoundedIcon },
    { id: 'education', label: 'Education', Icon: MenuBookRoundedIcon },
];

const DEFAULT_CATEGORIES = [
    { id: 'announcement', label: 'Announcements' },
    { id: 'discussion', label: 'General Discussion' },
    { id: 'lost-and-found', label: 'Lost & Found' },
    { id: 'poll', label: 'Polls' },
    { id: 'public-safety-alerts', label: 'Public Safety Alerts' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'help-requests', label: 'Help Requests' },
    { id: 'volunteers', label: 'Volunteers' },
];

// View options (Posts only). Groups are now a LEFT-SIDE TAB, not a View.
const VIEW_OPTIONS = [
    { value: 'all', label: 'All Posts', icon: VisibilityRoundedIcon },
    { value: 'trending', label: 'Trending', icon: TrendingUpRoundedIcon },
    { value: 'mine', label: 'My Posts', icon: PersonRoundedIcon },
    { value: 'following', label: 'Following', icon: PeopleOutlineRoundedIcon },
];

// Groups tab scope options
const GROUP_VIEW_OPTIONS = [
    { value: 'all', label: 'All Groups', icon: VisibilityRoundedIcon },
    { value: 'mine', label: 'My Groups', icon: PersonRoundedIcon },
    { value: 'following', label: 'People I Follow', icon: PeopleOutlineRoundedIcon },
];

const FALLBACK_SORT_OPTIONS = [
    { value: 'random', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most Popular' },
];

// Groups tab sort options
const GROUP_SORT_OPTIONS = [
    { value: 'random', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'most_active', label: 'Most Active' },
    { value: 'most_members', label: 'Most Members' },
];

// Groups tab member-type filter options
const GROUP_MEMBER_TYPE_OPTIONS = [
    { value: 'all', label: 'All', icon: BadgeRoundedIcon },
    { value: 'owner', label: 'Owner', icon: StarIcon },
    { value: 'admin', label: 'Admin', icon: ShieldIcon },
    { value: 'member', label: 'Member', icon: PersonRoundedIcon },
];

const FALLBACK_DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
];

const ALL_COUNTIES_LABEL = 'All Counties';
const ALL_CITIES_LABEL = 'All Cities';

const POST_CATEGORY_META = Object.fromEntries(
    Object.entries(COMMUNITY_CATEGORY_META).map(([key, meta]) => [key, { Icon: meta.Icon }])
);

// MUST match CreateGroupModal headers + items (values stored in DB).
// Filter will display ONLY main headers.
const GROUP_CATEGORY_OPTIONS = [
    { header: 'Local & Place-Based', items: ['Local Areas & Neighborhoods', 'City and Town Groups', 'County and Region Groups', 'New to the Area', 'Homeowners Associations'] },
    { header: 'Families & Life Stages', items: ['Parents & Families', 'Moms and Dads Groups', 'Homeschooling Families', 'Parenting Teens', 'New Parents', 'Seniors & Retirees', 'Caregivers'] },
    { header: 'Faith & Spiritual', items: ['Faith Communities', 'Church Small Groups', 'Men’s Groups', 'Women’s Groups', 'Young Adults Faith', 'Prayer and Devotional Groups'] },
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
    { header: 'Wellness & Support', items: ['Sobriety and Recovery Support', 'Mental Wellness and Mindfulness', 'Men’s Support Circles', 'Women’s Support Circles', 'Grief Support', 'Chronic Illness Community'] },
    { header: 'Clubs & Organizations', items: ['Civic Clubs', 'Fraternal and Service Organizations', 'Volunteer Teams', 'Community Project Groups'] },
    { header: 'Other', items: [] },
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

const normalizeStr = (v) => String(v ?? '').trim();

/**
 * Format a count for display:
 * - Under 10,000: show exact number
 * - 10,000+: show as "10k", "15k", etc.
 * - 100,000+: show as "100k", "150k", etc.
 * - 1,000,000+: show as "1M", "1.5M", etc.
 */
const formatCount = (num) => {
    const n = Number(num) || 0;
    if (n < 10000) return String(n);
    if (n < 1000000) {
        const k = Math.round(n / 1000);
        return `${k}k`;
    }
    const m = n / 1000000;
    if (m >= 10) return `${Math.round(m)}M`;
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
};

const getAnyString = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return '';
    for (const k of keys) {
        const val = obj[k];
        if (typeof val === 'string' && val.trim()) return val.trim();
        if (typeof val === 'number' && Number.isFinite(val)) return String(val);
    }
    return '';
};

const toValueString = (v) => {
    if (v === null || typeof v === 'undefined') return '';
    if (typeof v === 'string' || typeof v === 'number') return normalizeStr(v);
    if (typeof v === 'object') {
        const fromCommon = getAnyString(v, ['value', 'id', 'key', 'slug', 'name', 'label']);
        return normalizeStr(fromCommon);
    }
    return '';
};

const normalizePostCategoryId = (id) => {
    const v = toValueString(id);
    if (!v) return '';
    const key = normalizeStr(v).toLowerCase();
    if (key === 'community-chat' || key === 'communitychat' || key === 'community_chat') return 'discussion';
    if (key === 'polls') return 'poll';
    return v;
};

const getPostCategoryMeta = (id) => {
    const key = normalizeStr(id).toLowerCase();
    return POST_CATEGORY_META[key] || null;
};

const IconRow = ({ icon: IconComp, label, muted = false, count = null }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {IconComp ? (
                <IconComp
                    sx={{
                        fontSize: 20,
                        flexShrink: 0,
                        opacity: muted ? 0.45 : 1,
                        color: muted ? 'text.secondary' : 'primary.main',
                    }}
                />
            ) : (
                <Box sx={{ width: 20, height: 20, flexShrink: 0 }} />
            )}

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: muted ? 'text.disabled' : 'inherit',
                }}
            >
                {label}
            </Typography>
        </Box>
        <Typography
            component="span"
            sx={(t) => ({
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                visibility: count === null ? 'hidden' : 'visible',
                color: muted
                    ? 'text.disabled'
                    : count > 0
                        ? 'primary.main'
                        : 'text.secondary',
                bgcolor: muted
                    ? 'transparent'
                    : count > 0
                        ? alpha(t.palette.primary.main, 0.1)
                        : 'action.hover',
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                minWidth: 28,
                textAlign: 'center',
            })}
        >
            {count !== null ? formatCount(count) : '0'}
        </Typography>
    </Box>
);

const CategoryRow = ({ icon: IconComp, label, muted = false, count = null }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {IconComp ? (
                <IconComp
                    sx={{
                        fontSize: 20,
                        flexShrink: 0,
                        color: muted ? 'text.disabled' : 'primary.main',
                        opacity: muted ? 0.45 : 1,
                    }}
                />
            ) : (
                <Box sx={{ width: 22, height: 22, flexShrink: 0 }} />
            )}

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: muted ? 'text.disabled' : 'inherit',
                }}
            >
                {label}
            </Typography>
        </Box>
        <Typography
            component="span"
            sx={(t) => ({
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                visibility: count === null ? 'hidden' : 'visible',
                color: muted
                    ? 'text.disabled'
                    : count > 0
                        ? 'primary.main'
                        : 'text.secondary',
                bgcolor: muted
                    ? 'transparent'
                    : count > 0
                        ? alpha(t.palette.primary.main, 0.1)
                        : 'action.hover',
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                minWidth: 28,
                textAlign: 'center',
            })}
        >
            {count !== null ? formatCount(count) : '0'}
        </Typography>
    </Box>
);

function parseGroupCategoryValue(raw) {
    const s = normalizeStr(raw);
    if (!s) return { main: '', sub: '' };

    // Legacy "Main > Sub"
    if (s.includes('>')) {
        const parts = s.split('>').map((x) => normalizeStr(x)).filter(Boolean);
        if (parts.length >= 2) return { main: parts[0], sub: parts.slice(1).join(' > ') };
        return { main: parts[0] || s, sub: '' };
    }

    return { main: s, sub: '' };
}

// ── Stable constants: defined outside the component to prevent infinite re-render loops. ──
// When these were inside the component, new references were created every render,
// which could trigger child re-renders and dependency-chain loops.
const sharedMenuProps = Object.freeze({
    disableScrollLock: true,
    PaperProps: {
        sx: (t) => ({
            mt: 0.75,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            maxHeight: 340,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
                fontWeight: 600,
            },
            [t.breakpoints.down('md')]: {
                position: 'fixed',
                top: '0 !important',
                left: '0 !important',
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                height: '100%',
                borderRadius: 0,
                border: 'none',
                mt: 0,
                boxShadow: 'none',
                '& .MuiMenuItem-root': {
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 600,
                },
            },
        }),
    },
});

const CONTROL_SX = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.secondary',
    },
    '& .MuiSelect-select': {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 'unset',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
});

const CREAM_INPUT_SX = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.secondary',
    },
    '& .MuiSelect-select': {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 'unset',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
});

const WHITE_AUTOCOMPLETE_SLOTS = Object.freeze({
    popper: {
        sx: {
            '& .MuiPaper-root': {
                backgroundColor: 'background.paper',
                backgroundImage: 'none !important',
            },
            '& .MuiAutocomplete-listbox': {
                backgroundColor: 'background.paper',
            },
        },
    },
    paper: {
        sx: {
            backgroundColor: 'background.paper',
            backgroundImage: 'none !important',
        },
    },
    listbox: {
        sx: {
            backgroundColor: 'background.paper',
        },
    },
});

export default function CommunityFilter({
                                            /* groups */
                                            groupsForCounts,
                                            mode,
                                            groupView,
                                            onGroupViewChange,

                                            /* view */
                                            view,
                                            selectedView,
                                            onViewChange,

                                            /* search */
                                            searchTerm,
                                            onSearchTermChange,
                                            onSearchClick,
                                            onClearClick,

                                            /* UI */
                                            showAdvancedFilters = true,


                                            showSearchInput = true,
                                            /* city / county */
                                            filteredCities,
                                            filteredCounties,
                                            selectedCity,
                                            onCityChange,
                                            selectedCounty,
                                            onCountyChange,

                                            /* radius (miles around selected county) */
                                            selectedRadius = RADIUS_VALUE_WHEN_NO_COUNTY,
                                            onRadiusChange,

                                            /* category */
                                            selectedSubtype,
                                            subtypes,
                                            onSubtypeChange,

                                            /* news mode */
                                            newsCategory = 'all',
                                            onNewsCategoryChange = null,
                                            newsDateRange = 'week',
                                            onNewsDateRangeChange = null,

                                            /* post category counts - object like { announcement: 5, discussion: 12, ... } */
                                            postCategoryCounts = null,

                                            /* sort */
                                            selectedSort,
                                            sortOptions,
                                            onSortChange,

                                            /* date range */
                                            selectedDateRange,
                                            dateRangeOptions,
                                            onDateRangeChange,

                                            /* location counts for county/city badge display */
                                            locationCounts = null,

                                            /* groups member type filter */
                                            groupMemberType = 'all',
                                            onGroupMemberTypeChange,

                                            /* Force city/county to stack vertically (used in mobile drawer) */
                                            forceVerticalLocation = false,
                                        }) {
    const { isAuthenticated, user } = useAuth();

    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    const triggerSearch = useCallback(
        (mode = 'auto') => {
            if (typeof onSearchClick !== 'function') return;
            const term = normalizeStr(localSearchTerm);
            onSearchClick(mode, term);
        },
        [onSearchClick, localSearchTerm]
    );

    const effectiveView = toValueString(view) || toValueString(selectedView) || '';

    const modeNorm = normalizeStr(mode).toLowerCase();
    const isGroupsView = modeNorm === 'groups' || normalizeStr(effectiveView).toLowerCase() === 'groups';
    const isNewsView = modeNorm === 'news';

    // Groups tab has its own scope (All Groups / My Groups)
    const effectiveGroupView = toValueString(groupView) || (isGroupsView ? effectiveView : '') || 'all';
    const effectiveGroupViewNorm = normalizeStr(effectiveGroupView).toLowerCase();

    const effectiveSubtype = normalizePostCategoryId(selectedSubtype);
    const effectiveSort = toValueString(selectedSort);
    const effectiveDateRange = toValueString(selectedDateRange);

    // If unauthenticated while 'mine'/'following' is selected, reset to 'all' AND search.
    useEffect(() => {
        if (!isAuthenticated && (effectiveView === 'mine' || effectiveView === 'following')) {
            onViewChange('all');
            triggerSearch('auto');
        }
    }, [isAuthenticated, effectiveView, onViewChange, triggerSearch]);

    // If unauthenticated while groups tab is on 'mine'/'following', reset to 'all'.
    useEffect(() => {
        if (!isAuthenticated && isGroupsView && (effectiveGroupViewNorm === 'mine' || effectiveGroupViewNorm === 'following')) {
            const fn = typeof onGroupViewChange === 'function' ? onGroupViewChange : onViewChange;
            fn('all');
            triggerSearch('auto');
        }
    }, [isAuthenticated, isGroupsView, effectiveGroupViewNorm, onGroupViewChange, onViewChange, triggerSearch]);

    // Server-provided categories (posts). Ignored in groups view.
    const categories = useMemo(() => {
        if (isGroupsView) return [];

        const src = Array.isArray(subtypes) && subtypes.length ? subtypes : DEFAULT_CATEGORIES;

        const out = [];
        src.forEach((c) => {
            const id = toValueString(c?.id ?? c?.value ?? c);
            const label = normalizeStr(c?.label ?? c?.name ?? c?.text ?? '');

            if (id === 'recommendations-tips' || id === 'tips' || id === 'tip') {
                out.push({ id: 'recommendations', label: 'Recommendations' });
                return;
            }

            if (
                id === 'volunteer-requests' ||
                id === 'volunteer-help-requests' ||
                /volunteer\s*&\s*help/i.test(label)
            ) {
                out.push({ id: 'help-requests', label: 'Help Requests' });
                out.push({ id: 'volunteers', label: 'Volunteers' });
                return;
            }

            // Canonicalize legacy community chat -> discussion (prevents trending/filter mismatches)
            if (
                id === 'community-chat' ||
                id === 'communitychat' ||
                id === 'community_chat' ||
                /community\s*chat/i.test(label)
            ) {
                out.push({ id: 'discussion', label: 'General Discussion' });
                return;
            }

            out.push({
                id: id || normalizeStr(c?.id),
                label: label || normalizeStr(c?.label ?? c?.name ?? c?.id ?? id),
            });
        });

        const seen = new Set();
        const deduped = [];
        out.forEach((c) => {
            const key = normalizeStr(c.id).toLowerCase();
            if (!key) return;
            if (seen.has(key)) return;
            seen.add(key);
            deduped.push({ id: c.id, label: c.label });
        });

        return deduped;
    }, [subtypes, isGroupsView]);

    const groupMainHeaders = useMemo(() => GROUP_CATEGORY_OPTIONS.map((s) => s.header), []);

    const groupSubToMain = useMemo(() => {
        const map = new Map();
        GROUP_CATEGORY_OPTIONS.forEach((sec) => {
            (sec.items || []).forEach((it) => map.set(it, sec.header));
        });
        return map;
    }, []);

    // Counts (from unfiltered groups list passed in)
    const safeGroupsForCounts = useMemo(() => {
        const arr = Array.isArray(groupsForCounts) ? groupsForCounts : [];
        return arr.filter((g) => g && typeof g === 'object');
    }, [groupsForCounts]);

    const groupMainCounts = useMemo(() => {
        const map = new Map();
        GROUP_CATEGORY_OPTIONS.forEach((sec) => map.set(sec.header, 0));

        safeGroupsForCounts.forEach((g) => {
            const raw = normalizeStr(g?.category || g?.group_category || g?.category_name || g?.subcategory);
            if (!raw) return;

            const parsed = parseGroupCategoryValue(raw);
            const subOrMain = parsed.sub ? parsed.sub : parsed.main;
            const main = groupSubToMain.get(subOrMain) || parsed.main;
            if (!main) return;

            map.set(main, (map.get(main) || 0) + 1);
        });

        return map;
    }, [safeGroupsForCounts, groupSubToMain]);

    // Normalized post category counts for the posts dropdown
    const normalizedPostCounts = useMemo(() => {
        const map = new Map();
        if (!postCategoryCounts || typeof postCategoryCounts !== 'object') return map;

        Object.entries(postCategoryCounts).forEach(([key, val]) => {
            const normalizedKey = normalizeStr(key).toLowerCase();
            const count = Number(val) || 0;

            // Handle legacy category aliases
            if (normalizedKey === 'community-chat' || normalizedKey === 'communitychat' || normalizedKey === 'community_chat') {
                map.set('discussion', (map.get('discussion') || 0) + count);
            } else if (normalizedKey === 'announcements') {
                map.set('announcement', (map.get('announcement') || 0) + count);
            } else if (normalizedKey === 'tips' || normalizedKey === 'tip' || normalizedKey === 'recommendations-tips') {
                map.set('recommendations', (map.get('recommendations') || 0) + count);
            } else if (normalizedKey === 'volunteer-requests' || normalizedKey === 'volunteer-help-requests') {
                // Split between help-requests and volunteers if needed
                map.set('help-requests', (map.get('help-requests') || 0) + count);
            } else if (normalizedKey === 'volunteer') {
                // Normalize singular "volunteer" to plural "volunteers"
                map.set('volunteers', (map.get('volunteers') || 0) + count);
            } else {
                map.set(normalizedKey, (map.get(normalizedKey) || 0) + count);
            }
        });

        return map;
    }, [postCategoryCounts]);

    // Helper to get count for a post category
    const getPostCategoryCount = useCallback((categoryId) => {
        const key = normalizeStr(categoryId).toLowerCase();
        return normalizedPostCounts.get(key) || 0;
    }, [normalizedPostCounts]);

    // Total posts count (sum of all categories)
    const totalPostsCount = useMemo(() => {
        let total = 0;
        normalizedPostCounts.forEach((count) => {
            total += count;
        });
        return total;
    }, [normalizedPostCounts]);

    const safeSortOptions = useMemo(() => {
        if (isGroupsView) return GROUP_SORT_OPTIONS;

        const src = Array.isArray(sortOptions) ? sortOptions : [];
        const normed = src
            .map((o) => ({
                value: toValueString(o?.value ?? o?.id ?? o),
                label: normalizeStr(o?.label ?? o?.name ?? o?.text ?? o?.value ?? o?.id ?? o),
            }))
            .filter((o) => o.value && o.label);

        return normed.length ? normed : FALLBACK_SORT_OPTIONS;
    }, [sortOptions, isGroupsView]);

    const safeDateRangeOptions = useMemo(() => {
        const src = Array.isArray(dateRangeOptions) ? dateRangeOptions : [];
        const normed = src
            .map((o) => ({
                value: toValueString(o?.value ?? o?.id ?? o),
                label: normalizeStr(o?.label ?? o?.name ?? o?.text ?? o?.value ?? o?.id ?? o),
            }))
            .filter((o) => o.value && o.label);
        return normed.length ? normed : FALLBACK_DATE_RANGE_OPTIONS;
    }, [dateRangeOptions]);

    // Logged out users CAN view groups. Keep mine/following gated.
    const viewOptions = useMemo(() => {
        if (isAuthenticated) return VIEW_OPTIONS;
        return VIEW_OPTIONS.filter((o) => o.value === 'all' || o.value === 'trending');
    }, [isAuthenticated]);

    // NOTE: sharedMenuProps, CONTROL_SX, CREAM_INPUT_SX, WHITE_AUTOCOMPLETE_SLOTS
    // are now defined OUTSIDE the component (above) to prevent new object references
    // on every render, which can cause infinite re-render loops when passed as props/deps.

    const getCountyName = (c) => {
        if (typeof c === 'string') return c;
        if (typeof c === 'number') return String(c);
        if (c && typeof c === 'object') return getAnyString(c, ['label', 'name', 'value', 'id', 'county']) || '';
        return '';
    };

    const getCityName = (c) => {
        if (typeof c === 'string') return c;
        if (typeof c === 'number') return String(c);
        if (c && typeof c === 'object') return getAnyString(c, ['name', 'label', 'value', 'id', 'city']) || '';
        return '';
    };

    const countyName = normalizeStr(getCountyName(selectedCounty));
    const countyKey = countyName || 'all';
    const cityName = normalizeStr(getCityName(selectedCity));
    const cityLabel = countyName ? `City (${countyName})` : 'City';

    const [countyError, setCountyError] = useState(false);

    useEffect(() => {
        if (!selectedCounty) setCountyError(false);
    }, [selectedCounty]);

    // Default "View" to "All Posts" if empty
    useEffect(() => {
        if (!effectiveView) onViewChange('all');
    }, [effectiveView, onViewChange]);

    const safeCountiesRaw = Array.isArray(filteredCounties) ? filteredCounties : [];
    const safeCitiesRaw = Array.isArray(filteredCities) ? filteredCities : [];

    const safeCounties = useMemo(() => {
        return safeCountiesRaw
            .map((c) => (typeof c === 'string' ? c : (c?.label || c?.name || c?.value || '')))
            .map((s) => normalizeStr(s))
            .filter(Boolean);
    }, [safeCountiesRaw]);

    const safeCities = useMemo(() => {
        return safeCitiesRaw
            .map((c) => {
                if (typeof c === 'string') return { name: c, county: '' };
                if (!c || typeof c !== 'object') return { name: '', county: '' };
                const name = normalizeStr(c?.name || c?.label || c?.value || c?.city || '');
                const county = normalizeStr(c?.county || c?.county_name || c?.countyName || '');
                return { name, county };
            })
            .filter((c) => c.name);
    }, [safeCitiesRaw]);

    const maxCountyChars = useMemo(() => {
        return Math.max(...safeCounties.map((c) => c.length), ALL_COUNTIES_LABEL.length, 24);
    }, [safeCounties]);

    const maxCityChars = useMemo(() => {
        return Math.max(...safeCities.map((c) => c.name.length), ALL_CITIES_LABEL.length, 36);
    }, [safeCities]);

    const countiesWithAll = useMemo(() => {
        const uniq = Array.from(new Set(safeCounties));
        return [ALL_COUNTIES_LABEL, ...uniq];
    }, [safeCounties]);

    const cityOptions = useMemo(() => {
        const base = (!countyName
                ? safeCities
                : safeCities.filter((c) => !c.county || c.county === countyName)
        ).map((c) => c.name);

        const uniq = Array.from(new Set(base));
        return [ALL_CITIES_LABEL, ...uniq];
    }, [safeCities, countyName]);

    const applyGroupsCategory = useCallback((value) => {
        const v = normalizeStr(value);
        onSubtypeChange(v);
        triggerSearch('auto');
    }, [onSubtypeChange, triggerSearch]);

    const currentGroupMainValue = useMemo(() => {
        if (!isGroupsView) return '';
        const v = normalizeStr(effectiveSubtype);
        if (!v) return '';

        if (groupMainHeaders.includes(v)) return v;

        const parsed = parseGroupCategoryValue(v);
        const token = parsed.sub ? parsed.sub : parsed.main;
        const mapped = groupSubToMain.get(token) || '';
        return groupMainHeaders.includes(mapped) ? mapped : '';
    }, [effectiveSubtype, groupMainHeaders, groupSubToMain, isGroupsView]);

    // When the parent already renders a search bar (e.g., compact left-panel header),
    // we remove extra top padding/dividers so the expanded filter area doesn't waste
    // vertical space.
    const compactChrome = !showSearchInput;

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // Mobile layout is intentionally left alone — the mobile drawer passes
    // forceVerticalLocation=true and expects filters to always be visible.
    // On desktop, the full filter field grid starts COLLAPSED; users see a
    // compact row with a "Filters" toggle button, active-filter chips, and
    // a reset icon. Clicking the toggle reveals the full filter panel.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    // User's explicit expand/collapse action on desktop. `null` = not yet
    // interacted, follow default (collapsed on desktop).
    const [userExpanded, setUserExpanded] = useState(null);

    // On mobile (or when forceVerticalLocation — i.e., mobile drawer) we
    // always show filters expanded. On desktop we default to collapsed until
    // the user opens them.
    const fieldsExpanded = useMemo(() => {
        if (forceVerticalLocation) return true;       // mobile drawer: always open
        if (!isDesktop) return true;                  // mobile inline: always open
        if (userExpanded !== null) return userExpanded;
        return false;                                 // desktop default: collapsed
    }, [forceVerticalLocation, isDesktop, userExpanded]);

    // Defaults used to determine whether a filter is "active" (non-default).
    const defaultSortValue = safeSortOptions[0]?.value || 'newest';
    const defaultDateRangeValue = safeDateRangeOptions[0]?.value || 'all';

    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View: active when not 'all'
        if (!isGroupsView && !isNewsView && effectiveView && effectiveView !== 'all') {
            const opt = viewOptions.find((o) => o.value === effectiveView);
            if (opt) {
                chips.push({
                    key: 'view',
                    label: `View: ${opt.label}`,
                    onClear: () => {
                        onViewChange('all');
                        triggerSearch('auto');
                    },
                });
            }
        }

        // Category (posts only)
        if (!isGroupsView && !isNewsView && effectiveSubtype) {
            const cat = categories.find((c) => c.id === effectiveSubtype);
            const label = cat?.label || effectiveSubtype;
            chips.push({
                key: 'category',
                label: `Category: ${label}`,
                onClear: () => {
                    if (typeof onSubtypeChange === 'function') onSubtypeChange('');
                    triggerSearch('auto');
                },
            });
        }

        // News category (news mode)
        if (isNewsView && newsCategory && newsCategory !== 'all') {
            const cat = NEWS_CATEGORIES.find((c) => c.id === newsCategory);
            if (cat) {
                chips.push({
                    key: 'news-category',
                    label: `Category: ${cat.label}`,
                    onClear: () => {
                        if (typeof onNewsCategoryChange === 'function') onNewsCategoryChange('all');
                        triggerSearch('auto');
                    },
                });
            }
        }

        // News date range — active when not the default ('week')
        if (isNewsView && newsDateRange && newsDateRange !== 'week') {
            const dr = NEWS_DATE_RANGES.find((d) => d.value === newsDateRange);
            if (dr) {
                chips.push({
                    key: 'news-date',
                    label: `Date: ${dr.label}`,
                    onClear: () => {
                        if (typeof onNewsDateRangeChange === 'function') onNewsDateRangeChange('week');
                        triggerSearch('auto');
                    },
                });
            }
        }

        // Sort — active when not the first (default) option
        if (!isNewsView && effectiveSort && effectiveSort !== defaultSortValue) {
            const opt = safeSortOptions.find((o) => o.value === effectiveSort);
            if (opt) {
                chips.push({
                    key: 'sort',
                    label: `Sort: ${opt.label}`,
                    onClear: () => {
                        onSortChange(defaultSortValue);
                        triggerSearch('auto');
                    },
                });
            }
        }

        // Date range — posts only, active when not default
        if (!isGroupsView && !isNewsView && effectiveDateRange && effectiveDateRange !== defaultDateRangeValue) {
            const opt = safeDateRangeOptions.find((o) => o.value === effectiveDateRange);
            if (opt) {
                chips.push({
                    key: 'date',
                    label: `Date: ${opt.label}`,
                    onClear: () => {
                        onDateRangeChange(defaultDateRangeValue);
                        triggerSearch('auto');
                    },
                });
            }
        }

        // County
        if (countyName) {
            chips.push({
                key: 'county',
                label: `County: ${countyName}`,
                onClear: () => {
                    onCountyChange('');
                    onCityChange('');
                    triggerSearch('auto');
                },
            });
        }

        // City
        if (cityName) {
            chips.push({
                key: 'city',
                label: `City: ${cityName}`,
                onClear: () => {
                    onCityChange('');
                    triggerSearch('auto');
                },
            });
        }

        // Radius — only meaningful when a county is selected AND user has
        // chosen something other than the default.
        if (countyName && selectedRadius != null && String(selectedRadius) !== String(RADIUS_VALUE_WHEN_NO_COUNTY)) {
            const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(selectedRadius));
            if (opt && String(opt.value) !== '0') {
                chips.push({
                    key: 'radius',
                    label: `Radius: ${opt.label}`,
                    onClear: () => {
                        if (typeof onRadiusChange === 'function') {
                            onRadiusChange(RADIUS_VALUE_WHEN_NO_COUNTY);
                            triggerSearch('auto');
                        }
                    },
                });
            }
        }

        // ── Groups-view-specific chips ──
        if (isGroupsView) {
            // Groups scope (All / Mine / Following)
            const gv = normalizeStr(effectiveGroupView);
            if (gv && gv !== 'all') {
                const opt = GROUP_VIEW_OPTIONS.find((o) => o.value === gv);
                if (opt) {
                    chips.push({
                        key: 'group-view',
                        label: `View: ${opt.label}`,
                        onClear: () => {
                            if (typeof onGroupViewChange === 'function') onGroupViewChange('all');
                            triggerSearch('auto');
                        },
                    });
                }
            }

            // Group category (main header)
            if (currentGroupMainValue) {
                chips.push({
                    key: 'group-category',
                    label: `Category: ${currentGroupMainValue}`,
                    onClear: () => {
                        if (typeof onSubtypeChange === 'function') onSubtypeChange('');
                        triggerSearch('auto');
                    },
                });
            }

            // Member type (admin/owner/etc.) — active when not 'all'
            if (groupMemberType && groupMemberType !== 'all') {
                const label = groupMemberType.charAt(0).toUpperCase() + groupMemberType.slice(1);
                chips.push({
                    key: 'member-type',
                    label: `Role: ${label}`,
                    onClear: () => {
                        if (typeof onGroupMemberTypeChange === 'function') onGroupMemberTypeChange('all');
                        triggerSearch('auto');
                    },
                });
            }
        }

        return chips;
    }, [
        effectiveView, viewOptions, onViewChange,
        isGroupsView, isNewsView, effectiveSubtype, categories, onSubtypeChange,
        newsCategory, onNewsCategoryChange, newsDateRange, onNewsDateRangeChange,
        effectiveSort, safeSortOptions, defaultSortValue, onSortChange,
        effectiveDateRange, safeDateRangeOptions, defaultDateRangeValue, onDateRangeChange,
        countyName, onCountyChange, cityName, onCityChange,
        selectedRadius, onRadiusChange,
        effectiveGroupView, onGroupViewChange, currentGroupMainValue,
        groupMemberType, onGroupMemberTypeChange,
        triggerSearch,
    ]);

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Which tab the SavedFiltersMenu should scope to. Must match the
    // backend's VALID_TABS = ['posts', 'groups', 'news'].
    const savedFiltersTab = isNewsView ? 'news' : isGroupsView ? 'groups' : 'posts';

    // Snapshot of the current filter state to persist when the user hits
    // "Save current filter…". Only fields relevant to the current tab are
    // included — no point storing a news category on a posts filter.
    //
    // IMPORTANT: the key names here MUST match the backend service's
    // ALLOWED_KEYS schema (savedFiltersService.js). Keys the service
    // doesn't recognize are silently stripped, so a typo here = a field
    // that appears to save but is actually dropped on write.
    const currentFilterPayload = useMemo(() => {
        const base = {
            search: normalizeStr(searchTerm),
            city: toValueString(selectedCity),
            county: toValueString(selectedCounty),
            radius: toValueString(selectedRadius),
        };

        if (isNewsView) {
            return {
                ...base,
                newsCategory: toValueString(newsCategory) || 'all',
                newsDateRange: toValueString(newsDateRange) || 'week',
            };
        }

        if (isGroupsView) {
            return {
                ...base,
                groupView: effectiveGroupViewNorm,
                category: toValueString(selectedSubtype),
                sort: toValueString(selectedSort),
                memberType: toValueString(groupMemberType) || 'all',
            };
        }

        // posts
        return {
            ...base,
            view: effectiveView,
            subtype: effectiveSubtype,
            sort: toValueString(selectedSort),
            dateRange: toValueString(selectedDateRange),
        };
    }, [
        isNewsView, isGroupsView,
        searchTerm, selectedCity, selectedCounty, selectedRadius,
        newsCategory, newsDateRange,
        effectiveGroupViewNorm, selectedSubtype, selectedSort, groupMemberType,
        effectiveView, effectiveSubtype, selectedDateRange,
    ]);

    // Apply a saved filter. We route each field through the existing
    // setter props so the parent (CommunityPanel) sees the changes the
    // same way it would from any other interaction.
    //
    // Key-name note: payload keys here are the SHORT, backend-facing names
    // (search, city, county, radius, subtype, sort, dateRange, etc.) — NOT
    // the local prop names (selectedCity, selectedSort, ...). See the
    // schema in savedFiltersService.js ALLOWED_KEYS.
    //
    // Notes on the search term:
    //   • CommunityPage's onSearchTermChange only updates the `search` state
    //     — it does NOT update `appliedSearch`, which is what the backend
    //     fetch actually reads. `appliedSearch` is set inside handleSearchClick
    //     but ONLY on the 'manual' branch (which accepts an explicit term arg).
    //     So to actually apply the saved term we call onSearchClick('manual', term).
    //   • Every OTHER setter below (view, city, sort, etc.) already fires its
    //     own handleSearchClick('auto') debounced by 200ms. Our single manual
    //     call folds in with them — the parent coalesces.
    const handleApplySavedFilter = useCallback((filter) => {
        // Accept either `payload` or `payload_json` — the backend service
        // may serialize either name depending on how it maps DB rows to
        // API responses. Be defensive.
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        // shared
        let nextSearchTerm = null;
        if ('search' in payload) {
            nextSearchTerm = normalizeStr(payload.search);
            setLocalSearchTerm(nextSearchTerm);
            if (typeof onSearchTermChange === 'function') {
                onSearchTermChange(nextSearchTerm);
            }
        }
        if (typeof onCityChange === 'function' && 'city' in payload) {
            onCityChange(payload.city || '');
        }
        if (typeof onCountyChange === 'function' && 'county' in payload) {
            onCountyChange(payload.county || '');
        }
        if (typeof onRadiusChange === 'function' && 'radius' in payload) {
            onRadiusChange(payload.radius);
        }

        if (savedFiltersTab === 'news') {
            if (typeof onNewsCategoryChange === 'function' && 'newsCategory' in payload) {
                onNewsCategoryChange(payload.newsCategory || 'all');
            }
            if (typeof onNewsDateRangeChange === 'function' && 'newsDateRange' in payload) {
                onNewsDateRangeChange(payload.newsDateRange || 'week');
            }
        } else if (savedFiltersTab === 'groups') {
            if ('groupView' in payload) {
                const fn = typeof onGroupViewChange === 'function' ? onGroupViewChange : onViewChange;
                if (typeof fn === 'function') fn(payload.groupView || 'all');
            }
            if (typeof onSubtypeChange === 'function' && 'category' in payload) {
                onSubtypeChange(payload.category || '');
            }
            if (typeof onSortChange === 'function' && 'sort' in payload) {
                onSortChange(payload.sort || '');
            }
            if (typeof onGroupMemberTypeChange === 'function' && 'memberType' in payload) {
                onGroupMemberTypeChange(payload.memberType || 'all');
            }
        } else {
            // posts
            if (typeof onViewChange === 'function' && 'view' in payload) {
                onViewChange(payload.view || 'all');
            }
            if (typeof onSubtypeChange === 'function' && 'subtype' in payload) {
                onSubtypeChange(payload.subtype || '');
            }
            if (typeof onSortChange === 'function' && 'sort' in payload) {
                onSortChange(payload.sort || '');
            }
            if (typeof onDateRangeChange === 'function' && 'dateRange' in payload) {
                onDateRangeChange(payload.dateRange || '');
            }
        }

        // Fire a MANUAL search with the explicit term so appliedSearch gets
        // updated (and thus the backend actually queries with the new term).
        // If the payload had no search field, pass the current localSearchTerm
        // so we don't accidentally wipe an existing search the user had typed.
        if (typeof onSearchClick === 'function') {
            const termToApply = nextSearchTerm != null
                ? nextSearchTerm
                : normalizeStr(localSearchTerm);
            onSearchClick('manual', termToApply);
        }
    }, [
        savedFiltersTab,
        onSearchTermChange, onCityChange, onCountyChange, onRadiusChange,
        onNewsCategoryChange, onNewsDateRangeChange,
        onGroupViewChange, onViewChange,
        onSubtypeChange, onSortChange,
        onGroupMemberTypeChange, onDateRangeChange,
        onSearchClick, localSearchTerm,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    // Pull the default filter for the current tab. We call useSavedFilters
    // here (in addition to the one inside SavedFiltersMenu) specifically to
    // get access to defaultFilter for auto-apply. Two fetches per load is
    // cheap and keeps the menu component self-contained — if that ever
    // becomes a problem, lift the hook into a context.
    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: savedFiltersTab,
        viewer: user || null,
    });

    // "First load only" semantics require a ref that flips permanently
    // the first time auto-apply fires, regardless of tab switches after.
    const autoAppliedRef = useRef(false);

    // Capture the URL's filter params ONCE at mount. By the time the
    // default filter finishes loading (a few hundred ms later), the URL
    // may have already been rewritten by the app's state→URL sync — so
    // checking window.location.search in the effect would give a false
    // negative. We need the URL as it was when the user landed.
    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        // Lazy-init during render (runs once per instance). Safe because
        // we only read window and only assign to a ref.
        const FILTER_URL_KEYS = [
            'search', 'q', 'view', 'subtype', 'category', 'sort',
            'dateRange', 'city', 'county', 'counties', 'radius',
            'mine', 'following_ids', 'member_type',
            'newsCategory', 'newsDateRange',
        ];
        let has = false;
        try {
            if (typeof window !== 'undefined' && window.location?.search) {
                const sp = new URLSearchParams(window.location.search);
                has = FILTER_URL_KEYS.some((k) => sp.has(k));
            }
        } catch { /* treat as no-filters */ }
        hadUrlFiltersOnLoadRef.current = has;
    }

    useEffect(() => {
        if (autoAppliedRef.current) return;           // already fired — never again
        if (!savedDefaultFilter) return;              // no default set, or still loading
        if (hadUrlFiltersOnLoadRef.current) {         // URL had explicit filters — respect them
            autoAppliedRef.current = true;            // but still lock out future auto-apply
            return;
        }

        autoAppliedRef.current = true;
        handleApplySavedFilter(savedDefaultFilter);
    }, [savedDefaultFilter, handleApplySavedFilter]);

    return (
        <Box
            sx={{
                p: compactChrome ? { xs: 1, md: 0.75 } : { xs: 1, md: 1.25 },
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: (t) => t.custom.shadows.md,
                '&:focus-visible, &:focus-within': { outline: 'none', boxShadow: (t) => t.custom.shadows.md },
            }}
        >
            {showSearchInput && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SearchInput
                            placeholder={isGroupsView ? 'Search groups...' : 'Search posts...'}
                            value={localSearchTerm}
                            onChange={(e) => {
                                const next = e?.target?.value ?? '';
                                setLocalSearchTerm(next);
                                onSearchTermChange(next);
                            }}
                            onSearch={() => triggerSearch('manual')}
                            onClear={() => {
                                setLocalSearchTerm('');
                                onSearchTermChange('');
                                triggerSearch('manual');
                            }}
                        />
                    </Box>
                    <SavedFiltersMenu
                        tab={savedFiltersTab}
                        viewer={user || null}
                        currentPayload={currentFilterPayload}
                        onApply={handleApplySavedFilter}
                    />
                </Box>
            )}

            {/*
             * Filters container — holds the "Filters" dropdown button, any active
             * filter chips, and the reset icon on a single row. Expanding the
             * button reveals the full field grid below.
             *
             * Mobile (and the mobile drawer passing forceVerticalLocation=true)
             * skips this row because fields are always visible there.
             */}
            {isDesktop && !forceVerticalLocation && showAdvancedFilters && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: showSearchInput ? 1 : 0,
                    }}
                >
                    <Button
                        size="small"
                        variant={fieldsExpanded ? 'contained' : 'outlined'}
                        color="primary"
                        startIcon={<TuneRoundedIcon />}
                        endIcon={fieldsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        onClick={() => setUserExpanded(!fieldsExpanded)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 999,
                            flexShrink: 0,
                            px: 1.75,
                            height: 34,
                        }}
                    >
                        Filters
                        {activeFilterChips.length > 0 && !fieldsExpanded ? ` (${activeFilterChips.length})` : ''}
                    </Button>

                    {/* Active filter chips */}
                    {activeFilterChips.length > 0 && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                                flexWrap: 'wrap',
                                rowGap: 0.75,
                                alignItems: 'center',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {activeFilterChips.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    size="small"
                                    onDelete={chip.onClear}
                                    sx={(t) => ({
                                        height: 28,
                                        maxWidth: 240,
                                        borderRadius: 999,
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.22),
                                        '& .MuiChip-label': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            fontSize: 16,
                                            color: alpha(t.palette.primary.main, 0.55),
                                            '&:hover': { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Stack>
                    )}

                    {/* Reset / clear-all icon — right side of the row */}
                    <Tooltip title="Clear filters" arrow>
                        <span style={{ marginLeft: 'auto' }}>
                            <IconButton
                                onClick={() => { if (typeof onClearClick === 'function') onClearClick(); }}
                                disabled={typeof onClearClick !== 'function' || activeFilterChips.length === 0}
                                size="small"
                                aria-label="Clear filters"
                                sx={(t) => ({
                                    width: 34,
                                    height: 34,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                    backgroundColor: alpha(t.palette.text.primary, 0.03),
                                    color: t.palette.text.secondary,
                                    '&:hover': {
                                        backgroundColor: alpha(t.palette.primary.main, 0.08),
                                        borderColor: alpha(t.palette.primary.main, 0.3),
                                        color: t.palette.primary.main,
                                    },
                                    '&.Mui-disabled': { opacity: 0.4 },
                                })}
                            >
                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            <Collapse in={showAdvancedFilters && fieldsExpanded} timeout={200} unmountOnExit>
                {/* Only show a separating divider when the search input is rendered here. */}
                {showSearchInput && <Divider sx={{ my: 1.5 }} />}

                <Box
                    sx={{
                        mt: compactChrome ? 1 : 1.5,
                        p: compactChrome ? { xs: 1.25, md: 1 } : { xs: 1.5, md: 1.5 },
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        rowGap: { xs: 2, md: 1.25 },
                        alignItems: 'center',
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                        border: compactChrome ? 'none' : '1px solid',
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
                        borderRadius: 2.5,
                        bgcolor: compactChrome
                            ? 'transparent'
                            : (theme) => alpha(theme.palette.background.default, 0.92),
                        backgroundImage: compactChrome
                            ? 'none'
                            : (theme) =>
                                `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
                        boxShadow: compactChrome
                            ? 'none'
                            : (theme) =>
                                `0 10px 28px ${alpha(theme.palette.text.primary, 0.06)}, inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}`,
                        '&:focus-visible, &:focus-within': { outline: 'none' },
                    }}
                >
                    {/* Fallback mount: when the parent renders its own search
                        bar (so our inline bookmark next to SearchInput isn't
                        shown), surface the menu here. On mobile it takes the
                        full row and right-aligns so it reads as a deliberate
                        "controls" row; on desktop it sits inline with the
                        other filter chips. */}
                    {!showSearchInput && (
                        <Box
                            sx={{
                                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                                display: 'flex',
                                alignItems: 'center',
                                // nudge it slightly so the 36px icon vertically
                                // centers with the 40px Select controls
                                alignSelf: 'center',
                                justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                            }}
                        >
                            <SavedFiltersMenu
                                tab={savedFiltersTab}
                                viewer={user || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* View — hidden in News mode (not applicable to articles) */}
                    {isNewsView ? null : isGroupsView ? (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 140px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>View</InputLabel>
                                <Select
                                    label="View"
                                    value={GROUP_VIEW_OPTIONS.some((o) => o.value === effectiveGroupViewNorm) ? effectiveGroupViewNorm : 'all'}
                                    onChange={(e) => {
                                        const next = normalizeStr(e?.target?.value || 'all').toLowerCase() || 'all';
                                        const fn = typeof onGroupViewChange === 'function' ? onGroupViewChange : onViewChange;
                                        fn(next);
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = GROUP_VIEW_OPTIONS.find((o) => o.value === value) || GROUP_VIEW_OPTIONS[0];
                                        const IconComp = option.icon || VisibilityRoundedIcon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {GROUP_VIEW_OPTIONS.map((o) => {
                                        const IconComp = o.icon || VisibilityRoundedIcon;
                                        return (
                                            <MenuItem key={o.value} value={o.value} disabled={(o.value === 'mine' || o.value === 'following') && !isAuthenticated}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconComp sx={{ fontSize: 18, color: 'primary.main' }} />
                                                    {o.label}
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    ) : (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 130px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>View</InputLabel>
                                <Select
                                    label="View"
                                    value={viewOptions.some((o) => o.value === effectiveView) ? effectiveView : 'all'}
                                    onChange={(e) => {
                                        const nextView = normalizeStr(e?.target?.value || 'all').toLowerCase() || 'all';
                                        onViewChange(nextView);
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = viewOptions.find((o) => o.value === value) || viewOptions[0];
                                        const IconComp = option.icon || VisibilityRoundedIcon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {viewOptions.map((o) => {
                                        const IconComp = o.icon || VisibilityRoundedIcon;
                                        return (
                                            <MenuItem key={o.value} value={o.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconComp sx={{ fontSize: 18, color: 'primary.main' }} />
                                                    {o.label}
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Category */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '2 0 220px' } }}>
                        {isGroupsView ? (
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel id="groups-category-label" shrink>
                                    Category
                                </InputLabel>

                                <Select
                                    id="groups-category-select"
                                    labelId="groups-category-label"
                                    label="Category"
                                    value={currentGroupMainValue}
                                    onChange={(e) => {
                                        const next = normalizeStr(e?.target?.value || '');
                                        applyGroupsCategory(next);
                                    }}
                                    renderValue={(val) => {
                                        const v = normalizeStr(val);
                                        const totalGroups = Array.from(groupMainCounts.values()).reduce((s, n) => s + n, 0);
                                        if (!v) {
                                            return <IconRow icon={GroupsIcon} label="All" count={totalGroups} />;
                                        }
                                        const ct = Number(groupMainCounts.get(v) || 0);
                                        return <IconRow icon={GROUP_MAIN_ICON[v] || GroupsIcon} label={v} count={ct} />;
                                    }}
                                    MenuProps={sharedMenuProps}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        {(() => {
                                            const totalGroups = Array.from(groupMainCounts.values()).reduce((s, n) => s + n, 0);
                                            return <IconRow icon={GroupsIcon} label="All" count={totalGroups} />;
                                        })()}
                                    </MenuItem>

                                    {groupMainHeaders.map((header) => {
                                        const ct = Number(groupMainCounts.get(header) || 0);
                                        const disabled = ct <= 0;

                                        return (
                                            <MenuItem key={header} value={header} disabled={disabled}>
                                                <IconRow icon={GROUP_MAIN_ICON[header] || GroupsIcon} label={header} muted={disabled} count={ct} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        ) : isNewsView ? (
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel id="news-category-label" shrink>
                                    Category
                                </InputLabel>

                                <Select
                                    id="news-category-select"
                                    labelId="news-category-label"
                                    label="Category"
                                    value={newsCategory || 'all'}
                                    onChange={(e) => {
                                        const next = normalizeStr(e.target.value).toLowerCase() || 'all';
                                        if (typeof onNewsCategoryChange === 'function') {
                                            onNewsCategoryChange(next);
                                        }
                                        triggerSearch('auto');
                                    }}
                                    renderValue={(val) => {
                                        const v = normalizeStr(val).toLowerCase();
                                        if (!v || v === 'all') {
                                            return <CategoryRow icon={NewspaperRoundedIcon} label="All news" />;
                                        }
                                        const found = NEWS_CATEGORIES.find((c) => c.id === v);
                                        if (!found) return <CategoryRow icon={NewspaperRoundedIcon} label="All news" />;
                                        return <CategoryRow icon={found.Icon} label={found.label} />;
                                    }}
                                    MenuProps={sharedMenuProps}
                                    displayEmpty
                                >
                                    <MenuItem value="all">
                                        <CategoryRow icon={NewspaperRoundedIcon} label="All news" />
                                    </MenuItem>
                                    {NEWS_CATEGORIES.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            <CategoryRow icon={c.Icon} label={c.label} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel id="community-category-label" shrink>
                                    Category
                                </InputLabel>

                                <Select
                                    id="community-category-select"
                                    labelId="community-category-label"
                                    label="Category"
                                    value={effectiveSubtype}
                                    onChange={(e) => {
                                        const next = normalizePostCategoryId(e.target.value);
                                        onSubtypeChange(next);
                                        triggerSearch('auto');
                                    }}
                                    renderValue={(val) => {
                                        const v = normalizePostCategoryId(val);
                                        const countsLoaded = postCategoryCounts != null && typeof postCategoryCounts === 'object';
                                        if (!v) {
                                            return (
                                                <CategoryRow
                                                    icon={PeopleRoundedIcon}
                                                    label="All"
                                                    count={countsLoaded ? totalPostsCount : null}
                                                />
                                            );
                                        }
                                        const found = categories.find((c) => normalizeStr(c.id).toLowerCase() === v.toLowerCase());
                                        const label = found ? found.label : v;
                                        const meta = getPostCategoryMeta(v);
                                        const ct = getPostCategoryCount(v);
                                        return (
                                            <CategoryRow
                                                icon={meta?.Icon || PeopleRoundedIcon}
                                                label={label}
                                                count={countsLoaded ? ct : null}
                                            />
                                        );
                                    }}
                                    MenuProps={sharedMenuProps}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        {postCategoryCounts != null ? (
                                            <CategoryRow icon={PeopleRoundedIcon} label="All" count={totalPostsCount} />
                                        ) : (
                                            <CategoryRow icon={PeopleRoundedIcon} label="All" />
                                        )}
                                    </MenuItem>

                                    {categories.map((c) => {
                                        const meta = getPostCategoryMeta(c.id);
                                        const ct = getPostCategoryCount(c.id);
                                        const countsLoaded = postCategoryCounts != null && typeof postCategoryCounts === 'object';
                                        const disabled = countsLoaded && ct <= 0;

                                        return (
                                            <MenuItem key={c.id} value={c.id} disabled={disabled}>
                                                <CategoryRow
                                                    icon={meta?.Icon || PeopleRoundedIcon}
                                                    label={c.label}
                                                    muted={disabled}
                                                    count={countsLoaded ? ct : null}
                                                />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    {/* Date range — News mode only */}
                    {isNewsView && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 160px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel id="news-date-range-label" shrink>
                                    Date range
                                </InputLabel>
                                <Select
                                    id="news-date-range-select"
                                    labelId="news-date-range-label"
                                    label="Date range"
                                    value={NEWS_DATE_RANGES.some((o) => o.value === newsDateRange) ? newsDateRange : 'week'}
                                    onChange={(e) => {
                                        const next = normalizeStr(e.target.value).toLowerCase() || 'week';
                                        if (typeof onNewsDateRangeChange === 'function') {
                                            onNewsDateRangeChange(next);
                                        }
                                        triggerSearch('auto');
                                    }}
                                    renderValue={(val) => {
                                        const found = NEWS_DATE_RANGES.find((o) => o.value === val) || NEWS_DATE_RANGES[1];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <DateRangeRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                <Typography sx={{ fontSize: 14, fontWeight: 500 }} noWrap>
                                                    {found.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                    MenuProps={sharedMenuProps}
                                >
                                    {NEWS_DATE_RANGES.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                                                <DateRangeRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }} noWrap>
                                                        {o.label}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.2 }} noWrap>
                                                        {o.sublabel}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Type (Groups > My Groups only) */}
                    {isGroupsView && effectiveGroupViewNorm === 'mine' && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 130px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    label="Type"
                                    value={GROUP_MEMBER_TYPE_OPTIONS.some((o) => o.value === (groupMemberType || 'all')) ? (groupMemberType || 'all') : 'all'}
                                    onChange={(e) => {
                                        const next = normalizeStr(e?.target?.value || 'all').toLowerCase() || 'all';
                                        if (typeof onGroupMemberTypeChange === 'function') {
                                            onGroupMemberTypeChange(next);
                                        }
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = GROUP_MEMBER_TYPE_OPTIONS.find((o) => o.value === value) || GROUP_MEMBER_TYPE_OPTIONS[0];
                                        const IconComp = option.icon || BadgeRoundedIcon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {GROUP_MEMBER_TYPE_OPTIONS.map((o) => {
                                        const IconComp = o.icon || BadgeRoundedIcon;
                                        return (
                                            <MenuItem key={o.value} value={o.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconComp sx={{ fontSize: 18, color: 'primary.main' }} />
                                                    {o.label}
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Sort — hidden in News mode (news is always newest-first) */}
                    {!isNewsView && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 120px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>Sort by</InputLabel>
                                <Select
                                    label="Sort by"
                                    value={safeSortOptions.some((o) => o.value === effectiveSort) ? effectiveSort : (safeSortOptions[0]?.value || 'newest')}
                                    onChange={(e) => {
                                        const next = toValueString(e.target.value) || (safeSortOptions[0]?.value || 'newest');
                                        onSortChange(next);
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = safeSortOptions.find((o) => o.value === value) || safeSortOptions[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <SortRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option?.label || 'Any'}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {safeSortOptions.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {o.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Date range (Posts only — not groups, not news) */}
                    {!isGroupsView && !isNewsView && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 130px' } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>Date range</InputLabel>
                                <Select
                                    label="Date range"
                                    value={effectiveDateRange || (safeDateRangeOptions[0]?.value || 'all')}
                                    onChange={(e) => {
                                        const next = toValueString(e.target.value) || (safeDateRangeOptions[0]?.value || 'all');
                                        onDateRangeChange(next);
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = safeDateRangeOptions.find((o) => o.value === value) || safeDateRangeOptions[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <DateRangeRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option?.label || 'All time'}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {safeDateRangeOptions.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {o.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}



                    {/* County + City + Radius — same row on desktop, stacked on mobile */}
                    <Box
                        sx={{
                            flex: '1 1 100%',
                            minWidth: 0,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            // Match the outer filter row's mobile rowGap so Radius
                            // doesn't crowd up against City when these wrap.
                            rowGap: { xs: 2, md: 1 },
                        }}
                    >
                        {/* County + City (rendered by CityCountySelect as two side-by-side selects) */}
                        <Box sx={{ flex: { xs: '1 1 100%', md: '2 1 0%' }, minWidth: 0 }}>
                            <CityCountySelect
                                county={countyName || ALL_COUNTIES_LABEL}
                                setCounty={(v) => {
                                    const next = v === ALL_COUNTIES_LABEL ? '' : (v || '');
                                    onCountyChange(next);
                                    if (!next) onCityChange('');
                                    triggerSearch('auto');
                                }}
                                city={cityName || ALL_CITIES_LABEL}
                                setCity={(v) => {
                                    const next = v === ALL_CITIES_LABEL ? '' : (v || '');
                                    onCityChange(next);
                                    triggerSearch('auto');
                                }}
                                onCityCountyChange={({ city: nextCity, county: nextCounty }) => {
                                    onCityChange(nextCity === ALL_CITIES_LABEL ? '' : nextCity);
                                    onCountyChange(nextCounty === ALL_COUNTIES_LABEL ? '' : nextCounty);
                                    triggerSearch('auto');
                                }}
                                allCountyValue={ALL_COUNTIES_LABEL}
                                allCityValue={ALL_CITIES_LABEL}
                                countyCounts={locationCounts?.counties || null}
                                cityCounts={locationCounts?.cities || null}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                selectSx={CREAM_INPUT_SX}
                                filterMode
                                {...(forceVerticalLocation ? { sx: { flexDirection: 'column' } } : {})}
                            />
                        </Box>

                        {/* Radius — sits beside County+City on desktop, own row on mobile */}
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0%' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX} disabled={!countyName}>
                                <InputLabel id="community-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="community-radius-select"
                                    labelId="community-radius-label"
                                    label="Radius"
                                    value={String(countyName ? (selectedRadius ?? '0') : STATEWIDE)}
                                    onChange={(e) => {
                                        if (typeof onRadiusChange !== 'function') return;
                                        onRadiusChange(e.target.value);
                                        triggerSearch('auto');
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = !countyName
                                            ? 'All Alabama'
                                            : (opt?.label || 'County only');
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ExploreRoundedIcon fontSize="small" />
                                                <Typography component="span" sx={{ fontSize: 14 }}>
                                                    {label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {RADIUS_OPTIONS.map((opt) => (
                                        <MenuItem key={String(opt.value)} value={String(opt.value)}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
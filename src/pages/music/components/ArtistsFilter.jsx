import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Box,
    FormControl,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography,
    CircularProgress,
    Collapse,
    Chip,
    Stack,
    Button,
    IconButton,
    Tooltip,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import NaturePeopleRoundedIcon from "@mui/icons-material/NaturePeopleRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from "../../../utils/geoRadius";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

import { ART_CATEGORIES, getCategoryIcon } from "../utils/artistCategoryIcons";

/**
 * ArtistsFilter
 * - Styled to match CommunityFilter's advanced filter row (Groups tab look)
 * - Uses CityCountySelect for County/City (same behavior as Community)
 * - Loads genres from /api/music/genres with icons
 * - Shows counts next to each genre based on current filters
 * - Grays out genres with 0 artists
 *
 * Intended location:
 *   src/pages/music/components/ArtistsFilter.jsx
 */

/**
 * Get an appropriate icon component for a music genre
 */
function getGenreIcon(genre) {
    const g = String(genre || "").toLowerCase().trim();

    if (g.includes("rock") || g.includes("metal") || g.includes("punk") || g.includes("grunge")) {
        return BoltRoundedIcon;
    }
    if (g.includes("pop")) {
        return StarRoundedIcon;
    }
    if (g.includes("hip") || g.includes("hop") || g.includes("rap")) {
        return MicRoundedIcon;
    }
    if (g.includes("r&b") || g.includes("rnb") || g.includes("soul") || g.includes("motown")) {
        return FavoriteRoundedIcon;
    }
    if (g.includes("country") || g.includes("folk") || g.includes("bluegrass") || g.includes("americana")) {
        return NaturePeopleRoundedIcon;
    }
    if (g.includes("jazz") || g.includes("classical") || g.includes("orchestra") || g.includes("symphony")) {
        return PianoRoundedIcon;
    }
    if (g.includes("electronic") || g.includes("edm") || g.includes("techno") || g.includes("house") || g.includes("trance")) {
        return HeadphonesRoundedIcon;
    }
    if (g.includes("blues")) {
        return WavesRoundedIcon;
    }
    if (g.includes("reggae") || g.includes("ska") || g.includes("dub")) {
        return SelfImprovementRoundedIcon;
    }
    if (g.includes("indie") || g.includes("alternative") || g.includes("alt")) {
        return AlbumRoundedIcon;
    }
    if (g.includes("latin") || g.includes("salsa") || g.includes("reggaeton") || g.includes("bachata")) {
        return CelebrationRoundedIcon;
    }
    if (g.includes("gospel") || g.includes("christian") || g.includes("worship") || g.includes("spiritual")) {
        return FavoriteRoundedIcon;
    }
    if (g.includes("dance") || g.includes("disco") || g.includes("club")) {
        return NightlifeRoundedIcon;
    }
    if (g.includes("acapella") || g.includes("a capella") || g.includes("vocal")) {
        return RecordVoiceOverRoundedIcon;
    }
    if (g.includes("bollywood") || g.includes("indian") || g.includes("desi")) {
        return TheaterComedyRoundedIcon;
    }
    if (g.includes("funk")) {
        return GraphicEqRoundedIcon;
    }
    if (g.includes("world") || g.includes("african") || g.includes("caribbean")) {
        return RadioRoundedIcon;
    }
    if (g.includes("experimental") || g.includes("ambient") || g.includes("noise")) {
        return GraphicEqRoundedIcon;
    }
    if (g.includes("hot") || g.includes("fire") || g.includes("trending")) {
        return WhatshotRoundedIcon;
    }
    if (g.includes("soundtrack") || g.includes("score") || g.includes("film")) {
        return QueueMusicRoundedIcon;
    }
    if (g.includes("new age") || g.includes("meditation") || g.includes("relaxation")) {
        return SelfImprovementRoundedIcon;
    }
    if (g.includes("opera")) {
        return LibraryMusicRoundedIcon;
    }

    return MusicNoteRoundedIcon;
}

/* ── icon map for view options (matches CommunityFilter) ── */
function getViewIcon(value) {
    const v = String(value || "").toLowerCase().trim();
    if (v === "following") return PeopleOutlineRoundedIcon;
    if (v === "mine" || v === "my") return PersonRoundedIcon;
    // Profile-type scopes used by the Posts tab's view dropdown
    // (POSTS_VIEW_OPTIONS in MusicPage). Musicians get the music-note icon
    // and visual artists get the palette icon, mirroring the main tab nav.
    if (v === "music") return MusicNoteRoundedIcon;
    if (v === "artist") return PaletteRoundedIcon;
    return VisibilityRoundedIcon;
}

/* ── icon map for sort options ── */
const SORT_OPTIONS = [
    { value: "any", label: "Any" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "popular", label: "Most Popular" },
    { value: "trending", label: "Trending" },
];

/*
 * ─── STABLE OBJECTS DEFINED OUTSIDE THE COMPONENT ───
 * Prevents infinite re-render loops caused by new object references
 * on every render feeding into useEffect deps or child prop comparisons.
 */
const sharedMenuProps = {
    disableScrollLock: true,
    PaperProps: {
        sx: (t) => ({
            mt: 0.75,
            bgcolor: "background.paper",
            backgroundImage: "none",
            maxHeight: 340,
            border: "1px solid",
            borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            borderRadius: 2.5,
            "& .MuiMenuItem-root": {
                minHeight: 42,
                fontSize: "0.875rem",
                fontWeight: 600,
            },
            ['@media (max-width:1023px)']: {
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
                "& .MuiMenuItem-root": {
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 600,
                },
            },
        }),
    },
};

const selectPillSx = {
    "& .MuiOutlinedInput-root": {
        minHeight: 40,
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === "dark";
            const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: "saturate(140%) blur(10px)",
        overflow: "hidden",
        "& fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.18 : 0.14),
        },
        "&:hover fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.22),
        },
        "&.Mui-focused fieldset": {
            borderWidth: 1,
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    "& .MuiInputLabel-root": {
        color: "text.secondary",
        fontWeight: 600,
        fontSize: "0.875rem",
    },
    "& .MuiSelect-select": {
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 1,
        minHeight: "unset",
        fontSize: "0.875rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
    "& .MuiInputBase-input": {
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
};

/* ── stable empty-array fallback ── */
const EMPTY_ARRAY = [];

const DEFAULT_VIEW_OPTIONS = [
    { value: "all", label: "All Artists" },
    { value: "following", label: "Following" },
];

export default function ArtistsFilter({
                                          view = "all",
                                          onViewChange,
                                          viewOptions,

                                          genre = "",
                                          onGenreChange,

                                          sort = "any",
                                          onSortChange,

                                          // Profile-type scope — 'music' or 'artist'.
                                          // When 'artist', the genre dropdown is
                                          // sourced from the hardcoded art-category
                                          // list rather than the /api/music/genres
                                          // endpoint. All other filters unaffected.
                                          profileType = "music",

                                          // When true, the genre/category dropdown
                                          // is not rendered at all. Used on the
                                          // Posts tab when the profile-type scope
                                          // is "all" (we can't meaningfully show
                                          // "genre" across both musicians and
                                          // visual artists — they have different
                                          // category lists).
                                          hideGenre = false,

                                          county = "All Counties",
                                          onCountyChange,

                                          // radius
                                          radius,
                                          onRadiusChange,

                                          city = "All Cities",
                                          onCityChange,

                                          // For filtering genre counts
                                          searchQuery = "",

                                          // Location counts for county/city badge display
                                          // Shape: { counties: { "Calhoun": 5, ... }, cities: { "Piedmont": 2, ... } }
                                          locationCounts = null,

                                          /* saved filters (slice 3) */
                                          viewer = null,
                                          onSearchQueryChange = null,
                                          // Which sub-tab this instance serves — determines which
                                          // prefixed keys the saved-filter payload uses
                                          // (artistView vs postView, etc.). Defaults to 'artists'.
                                          subTab = "artists",
                                          showSavedFilters = true,

                                          /* UI — collapse control */
                                          showAdvancedFilters = true,
                                          /* in-bar reset handler */
                                          onClearAll = null,
                                      }) {
    // Load genres from API
    const [genreOptions, setGenreOptions] = useState(EMPTY_ARRAY);
    const [genresLoading, setGenresLoading] = useState(false);

    // Genre counts based on current filters
    const [genreCounts, setGenreCounts] = useState({});
    const [totalArtists, setTotalArtists] = useState(0);
    const [countsLoading, setCountsLoading] = useState(false);

    // Load genre list once (or swap to art categories for visual artists)
    useEffect(() => {
        let cancelled = false;

        // Visual-artist mode: use the hardcoded art-category list instead of
        // calling /api/music/genres. Synchronous, no loading state needed.
        if (profileType === "artist") {
            setGenresLoading(false);
            setGenreOptions([...ART_CATEGORIES].sort((a, b) => a.localeCompare(b)));
            return () => { cancelled = true; };
        }

        (async () => {
            setGenresLoading(true);
            try {
                const res = await secureFetch("/api/music/genres", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load genres");
                const data = await res.json().catch(() => ({}));
                const items = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                        ? data
                        : [];

                const names = items
                    .map((row) => {
                        if (typeof row === "string") return row;
                        return String(
                            row?.name || row?.label || row?.genre || row?.title || ""
                        ).trim();
                    })
                    .filter(Boolean);

                const uniq = Array.from(new Set(names)).sort((a, b) =>
                    a.localeCompare(b)
                );
                if (!cancelled) setGenreOptions(uniq);
            } catch {
                if (!cancelled) setGenreOptions(EMPTY_ARRAY);
            } finally {
                if (!cancelled) setGenresLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [profileType]);

    // Fetch genre counts when filters change (excluding genre itself)
    useEffect(() => {
        let cancelled = false;

        // Visual-artist mode: the /api/music/genres/counts endpoint only knows
        // about musical genres. Show the dropdown without count pills instead
        // of firing requests that would always return zero.
        if (profileType === "artist") {
            setCountsLoading(false);
            setGenreCounts({});
            setTotalArtists(0);
            return () => { cancelled = true; };
        }

        const fetchCounts = async () => {
            setCountsLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.set("q", searchQuery);

                const cityVal = city === "All Cities" ? "" : city;
                const countyVal = county === "All Counties" ? "" : county;
                if (cityVal) params.set("city", cityVal);
                if (countyVal) params.set("county", countyVal);
                if (view && view !== "all") params.set("view", view);
                if (sort && sort !== "any") params.set("sort", sort);

                const url = `/api/music/genres/counts?${params.toString()}`;
                const res = await secureFetch(url, { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load counts");

                const data = await res.json();
                if (!cancelled) {
                    setGenreCounts(data?.counts || {});
                    setTotalArtists(data?.total || 0);
                }
            } catch {
                if (!cancelled) {
                    setGenreCounts({});
                    setTotalArtists(0);
                }
            } finally {
                if (!cancelled) setCountsLoading(false);
            }
        };

        // Debounce the fetch slightly
        const timer = setTimeout(fetchCounts, 150);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery, city, county, view, sort, profileType]);

    /* ── Profile-type-aware genre/category helpers ──
       When the filter is scoped to visual artists, the dropdown resolves
       icons from the art-category map and shows "Category" / "All Categories"
       labels. For music this is unchanged. */
    const isVisualArtistFilter = profileType === "artist";
    const resolveChipIcon = isVisualArtistFilter ? getCategoryIcon : getGenreIcon;
    const genreLabel = isVisualArtistFilter ? "Category" : "Genre";
    const allGenresLabel = isVisualArtistFilter ? "All Categories" : "All Genres";
    // The empty-state icon on the select trigger should mirror the tab scope.
    const EmptyIconComp = isVisualArtistFilter ? getCategoryIcon("") : MusicNoteRoundedIcon;

    /* ── helper: count pill (matches ServicesFilters style) ── */
    const renderCountPill = (count, loading) => {
        if (loading) {
            return <CircularProgress size={14} sx={{ ml: "auto", flexShrink: 0 }} />;
        }
        const isLoaded = Number.isFinite(count);
        return (
            <Typography
                component="span"
                sx={{
                    ml: "auto",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    visibility: isLoaded ? 'visible' : 'hidden',
                    color: count > 0 ? "primary.main" : "text.secondary",
                    bgcolor: count > 0
                        ? (t) => alpha(t.palette.primary.main, 0.1)
                        : "action.hover",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    minWidth: 28,
                    textAlign: "center",
                    lineHeight: 1.4,
                    flexShrink: 0,
                }}
            >
                {isLoaded ? count : '\u200B'}
            </Typography>
        );
    };

    /* ── resolve the current view option ── */
    const resolvedViewOptions = Array.isArray(viewOptions) && viewOptions.length > 0
        ? viewOptions
        : DEFAULT_VIEW_OPTIONS;

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Which prefix this instance uses in the saved-filter payload.
    // The music schema holds both `artistX` and `postX` keys in a single
    // payload so users see all music filters regardless of sub-tab,
    // but each instance of ArtistsFilter only reads/writes the fields
    // for its own sub-tab.
    const isPostsSubTab = subTab === "posts";

    // Snapshot of current filter state, with the right prefix.
    const currentFilterPayload = useMemo(() => {
        const trimmedSearch = String(searchQuery || "").trim();
        const normalizedCity = city === "All Cities" ? "" : String(city || "").trim();
        const normalizedCounty = county === "All Counties" ? "" : String(county || "").trim();
        const normalizedRadius = String(radius || "").trim();

        if (isPostsSubTab) {
            return {
                postView:   view || "all",
                postGenre:  String(genre || "").trim(),
                postSort:   sort || "any",
                postCity:   normalizedCity,
                postCounty: normalizedCounty,
                postRadius: normalizedRadius,
                search:     trimmedSearch,
            };
        }
        return {
            artistView:   view || "all",
            artistGenre:  String(genre || "").trim(),
            artistSort:   sort || "any",
            artistCity:   normalizedCity,
            artistCounty: normalizedCounty,
            artistRadius: normalizedRadius,
            search:       trimmedSearch,
        };
    }, [view, genre, sort, city, county, radius, searchQuery, isPostsSubTab]);

    // Apply a saved filter. Read the payload using this instance's
    // sub-tab prefix. Fall back to the other sub-tab's keys so applying
    // a filter saved from the opposite sub-tab still restores shared
    // fields.
    //
    // IMPORTANT: always call every setter, even when a key is missing
    // from the payload. The backend sanitizer strips empty strings, so
    // a payload without `artistCity` could mean "user saved with no
    // city filter" OR "user saved on the Posts sub-tab". Either way,
    // applying should reset city to the UI's sentinel so the user ends
    // up in a clean known state — not with leftover state from before
    // they clicked Apply.
    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        const pick = (primary, fallback) => {
            if (primary in payload) return payload[primary];
            if (fallback in payload) return payload[fallback];
            return undefined;
        };

        const viewVal   = isPostsSubTab ? pick('postView',   'artistView')   : pick('artistView',   'postView');
        const genreVal  = isPostsSubTab ? pick('postGenre',  'artistGenre')  : pick('artistGenre',  'postGenre');
        const sortVal   = isPostsSubTab ? pick('postSort',   'artistSort')   : pick('artistSort',   'postSort');
        const cityVal   = isPostsSubTab ? pick('postCity',   'artistCity')   : pick('artistCity',   'postCity');
        const countyVal = isPostsSubTab ? pick('postCounty', 'artistCounty') : pick('artistCounty', 'postCounty');
        const radiusVal = isPostsSubTab ? pick('postRadius', 'artistRadius') : pick('artistRadius', 'postRadius');

        if (typeof onSearchQueryChange === 'function') {
            onSearchQueryChange(String(payload.search || ""));
        }
        if (typeof onViewChange === 'function') {
            onViewChange(viewVal || "all");
        }
        if (typeof onGenreChange === 'function') {
            onGenreChange(genreVal || "");
        }
        if (typeof onSortChange === 'function') {
            onSortChange(sortVal || "any");
        }
        if (typeof onCityChange === 'function') {
            // Restore the UI sentinel "All Cities" when the payload has
            // no city — the CityCountySelect + city state both use
            // "All Cities" as the "no filter" value in this codebase.
            onCityChange(cityVal ? String(cityVal) : "All Cities");
        }
        if (typeof onCountyChange === 'function') {
            onCountyChange(countyVal ? String(countyVal) : "All Counties");
        }
        if (typeof onRadiusChange === 'function') {
            onRadiusChange(radiusVal || "statewide");
        }
    }, [
        isPostsSubTab,
        onSearchQueryChange, onViewChange, onGenreChange, onSortChange,
        onCityChange, onCountyChange, onRadiusChange,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'music',
        viewer: viewer || null,
    });

    const autoAppliedRef = useRef(false);

    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'sort', 'genre',
            'city', 'county', 'counties', 'radius',
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
        if (autoAppliedRef.current) return;
        if (!savedDefaultFilter) return;
        if (hadUrlFiltersOnLoadRef.current) {
            autoAppliedRef.current = true;
            return;
        }
        autoAppliedRef.current = true;
        handleApplySavedFilter(savedDefaultFilter);
    }, [savedDefaultFilter, handleApplySavedFilter]);

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // Mobile always shows the field grid. Desktop defaults to collapsed;
    // compact row shows "Filters" toggle, active chips, reset icon.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;
        if (userExpanded !== null) return userExpanded;
        return false;
    }, [isDesktop, userExpanded]);

    // Normalize "All Counties"/"All Cities" sentinels to empty for chip detection
    const countyNorm = (county && county !== "All Counties") ? String(county) : "";
    const cityNorm = (city && city !== "All Cities") ? String(city) : "";

    const handleClearAllCallback = useCallback(() => {
        if (typeof onClearAll === "function") onClearAll();
    }, [onClearAll]);

    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View — active when not "all"
        const viewNorm = String(view || "all").toLowerCase();
        if (viewNorm && viewNorm !== "all") {
            const opts = Array.isArray(viewOptions) && viewOptions.length > 0 ? viewOptions : DEFAULT_VIEW_OPTIONS;
            const opt = opts.find((o) => o.value === viewNorm);
            if (opt) {
                chips.push({
                    key: "view",
                    label: `View: ${opt.label}`,
                    onClear: () => { if (typeof onViewChange === "function") onViewChange("all"); },
                });
            }
        }

        // Genre
        if (genre) {
            chips.push({
                key: "genre",
                label: `Genre: ${genre}`,
                onClear: () => { if (typeof onGenreChange === "function") onGenreChange(""); },
            });
        }

        // Sort — default "any"
        if (sort && sort !== "any") {
            const opt = SORT_OPTIONS.find((o) => o.value === sort);
            if (opt) {
                chips.push({
                    key: "sort",
                    label: `Sort: ${opt.label}`,
                    onClear: () => { if (typeof onSortChange === "function") onSortChange("any"); },
                });
            }
        }

        // County
        if (countyNorm) {
            chips.push({
                key: "county",
                label: `County: ${countyNorm}`,
                onClear: () => {
                    if (typeof onCountyChange === "function") onCountyChange("All Counties");
                    if (typeof onCityChange === "function") onCityChange("All Cities");
                },
            });
        }

        // City
        if (cityNorm) {
            chips.push({
                key: "city",
                label: `City: ${cityNorm}`,
                onClear: () => { if (typeof onCityChange === "function") onCityChange("All Cities"); },
            });
        }

        // Radius — only when a county is set and non-default
        if (countyNorm && radius != null &&
            String(radius) !== String(RADIUS_VALUE_WHEN_NO_COUNTY) &&
            String(radius) !== "0") {
            const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(radius));
            if (opt) {
                chips.push({
                    key: "radius",
                    label: `Radius: ${opt.label}`,
                    onClear: () => {
                        if (typeof onRadiusChange === "function") onRadiusChange(RADIUS_VALUE_WHEN_NO_COUNTY);
                    },
                });
            }
        }

        return chips;
    }, [view, viewOptions, onViewChange, genre, onGenreChange, sort, onSortChange,
        countyNorm, cityNorm, radius, onCountyChange, onCityChange, onRadiusChange]);

    return (
        <Box
            sx={(t) => ({
                p: isDesktop ? { xs: 1, md: 0.75 } : 1,
                '@media (min-width: 1024px)': isDesktop ? {} : { p: 1.25 },
                bgcolor: alpha(t.palette.background.paper, 0.62),
                color: "text.primary",
                fontFamily: t.typography.fontFamily,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                backdropFilter: "saturate(140%) blur(10px)",
                backgroundImage: "none",
                boxShadow: t.custom?.shadows?.md || `0 10px 28px ${alpha(t.palette.text.primary, 0.08)}`,
                display: showAdvancedFilters ? "block" : "none",
            })}
        >
            {/* Desktop-only toggle row: Filters button + active chips + reset */}
            {isDesktop && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    <Button
                        size="small"
                        variant={fieldsExpanded ? "contained" : "outlined"}
                        color="primary"
                        startIcon={<TuneRoundedIcon />}
                        endIcon={fieldsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        onClick={() => setUserExpanded(!fieldsExpanded)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 999,
                            flexShrink: 0,
                            px: 1.75,
                            height: 34,
                        }}
                    >
                        Filters
                        {activeFilterChips.length > 0 && !fieldsExpanded ? ` (${activeFilterChips.length})` : ""}
                    </Button>

                    {activeFilterChips.length > 0 && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                                flexWrap: "wrap",
                                rowGap: 0.75,
                                alignItems: "center",
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
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.22),
                                        "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        },
                                        "& .MuiChip-deleteIcon": {
                                            fontSize: 16,
                                            color: alpha(t.palette.primary.main, 0.55),
                                            "&:hover": { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Stack>
                    )}

                    <Tooltip title="Clear filters" arrow>
                        <span style={{ marginLeft: "auto" }}>
                            <IconButton
                                onClick={handleClearAllCallback}
                                disabled={typeof onClearAll !== "function" || activeFilterChips.length === 0}
                                size="small"
                                aria-label="Clear filters"
                                sx={(t) => ({
                                    width: 34,
                                    height: 34,
                                    borderRadius: 999,
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                    backgroundColor: alpha(t.palette.text.primary, 0.03),
                                    color: t.palette.text.secondary,
                                    "&:hover": {
                                        backgroundColor: alpha(t.palette.primary.main, 0.08),
                                        borderColor: alpha(t.palette.primary.main, 0.3),
                                        color: t.palette.primary.main,
                                    },
                                    "&.Mui-disabled": { opacity: 0.4 },
                                })}
                            >
                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            <Collapse in={!isDesktop || fieldsExpanded} timeout={200}>
                <Box
                    sx={(t) => ({
                        mt: isDesktop ? 1 : 0,
                        p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.25 },
                        '@media (min-width: 1024px)': isDesktop ? {} : { p: 1.5 },
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        rowGap: { xs: 2, md: 1.25 },
                        alignItems: "center",
                        "&::-webkit-scrollbar": { display: "none" },
                        scrollbarWidth: "none",
                        border: isDesktop ? "none" : "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        borderRadius: 2.5,
                        bgcolor: isDesktop ? "transparent" : alpha(t.palette.background.default, 0.92),
                        backgroundImage: isDesktop
                            ? "none"
                            : `linear-gradient(180deg, ${alpha(
                                t.palette.primary.main,
                                0.04
                            )} 0%, ${alpha(t.palette.primary.main, 0.01)} 100%)`,
                        boxShadow: isDesktop
                            ? "none"
                            : `0 10px 28px ${alpha(
                                t.palette.text.primary,
                                0.06
                            )}, inset 0 0 0 1px ${alpha(t.palette.primary.main, 0.08)}`,
                    })}
                >
                    {/* Saved filters bookmark — first child. On mobile it
                    takes the full row and right-aligns so it reads as
                    a deliberate "controls" row. On desktop it sits
                    inline as a chip. */}
                    {showSavedFilters && (
                        <Box
                            sx={{
                                flex: { xs: "1 1 100%", sm: "0 0 auto" },
                                display: "flex",
                                alignItems: "center",
                                alignSelf: "center",
                                justifyContent: { xs: "flex-end", sm: "flex-start" },
                            }}
                        >
                            <SavedFiltersMenu
                                tab="music"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* ── View (with icons like ServicesFilters) ── */}
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 130px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>View</InputLabel>
                            <Select
                                label="View"
                                value={view}
                                onChange={(e) => onViewChange?.(e.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(value) => {
                                    const opt = resolvedViewOptions.find((o) => o.value === value) || resolvedViewOptions[0];
                                    const IconComp = opt.icon || getViewIcon(value);
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {resolvedViewOptions.map((opt) => {
                                    const IconComp = opt.icon || getViewIcon(opt.value);
                                    return (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={opt.label} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* ── Genre / Category with icons and counts (badge pushed to far right) ──
                        Hidden when hideGenre is set — e.g. on the Posts tab when
                        the profile-type scope is "all", where the genre/category
                        concept doesn't apply uniformly across musicians and
                        visual artists. */}
                    {!hideGenre && (
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "2 0 180px" } }}>
                            <FormControl size="small" fullWidth sx={selectPillSx}>
                                <InputLabel id="artist-genre-label" shrink>
                                    {genreLabel}
                                </InputLabel>
                                <Select
                                    labelId="artist-genre-label"
                                    label={genreLabel}
                                    value={genre}
                                    onChange={(e) => onGenreChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    displayEmpty
                                    disabled={genresLoading}
                                    renderValue={(val) => {
                                        const v = String(val || "").trim();
                                        if (!v) {
                                            return (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
                                                    <EmptyIconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        All Genres
                                                    </Typography>
                                                    {renderCountPill(totalArtists, countsLoading)}
                                                </Box>
                                            );
                                        }
                                        const IconComp = resolveChipIcon(v);
                                        const count = genreCounts[v] || 0;
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
                                                <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {v}
                                                </Typography>
                                                {renderCountPill(count, countsLoading)}
                                            </Box>
                                        );
                                    }}
                                >
                                    <MenuItem value="">
                                        <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                            <EmptyIconComp fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={allGenresLabel} />
                                        {renderCountPill(totalArtists, countsLoading)}
                                    </MenuItem>
                                    {genreOptions.map((g) => {
                                        const IconComp = resolveChipIcon(g);
                                        const count = genreCounts[g] || 0;
                                        // Counts only exist for music genres. For art categories
                                        // we don't fetch counts, so never grey out options.
                                        const isDisabled = isVisualArtistFilter ? false : count === 0;

                                        return (
                                            <MenuItem
                                                key={g}
                                                value={g}
                                                disabled={isDisabled}
                                                sx={{
                                                    opacity: isDisabled ? 0.5 : 1,
                                                    "&.Mui-disabled": {
                                                        opacity: 0.5,
                                                    },
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 28,
                                                        color: isDisabled ? "text.disabled" : "primary.main",
                                                    }}
                                                >
                                                    <IconComp fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={g}
                                                    sx={{
                                                        color: isDisabled ? "text.disabled" : "inherit",
                                                    }}
                                                />
                                                {countsLoading ? (
                                                    <CircularProgress size={14} sx={{ ml: "auto", color: isDisabled ? "text.disabled" : "primary.main" }} />
                                                ) : (
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            ml: "auto",
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: isDisabled
                                                                ? "text.disabled"
                                                                : count > 0
                                                                    ? "primary.main"
                                                                    : "text.secondary",
                                                            bgcolor: isDisabled
                                                                ? "transparent"
                                                                : count > 0
                                                                    ? (t) => alpha(t.palette.primary.main, 0.1)
                                                                    : "action.hover",
                                                            px: 0.8,
                                                            py: 0.2,
                                                            borderRadius: 999,
                                                            minWidth: 28,
                                                            textAlign: "center",
                                                            lineHeight: 1.4,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {count}
                                                    </Typography>
                                                )}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* ── Sort (with icon like ServicesFilters) ── */}
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 130px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                label="Sort by"
                                value={sort}
                                onChange={(e) => onSortChange?.(e.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(value) => {
                                    const opt = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <SortRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* ── County + City + Radius ── */}
                    <Box sx={{ flex: "1 1 100%", minWidth: 0, display: "flex", flexWrap: "wrap", gap: 1, rowGap: { xs: 2, md: 1 } }}>
                        <Box sx={{ flex: { xs: "1 1 100%", md: "2 1 0%" }, minWidth: 0 }}>
                            <CityCountySelect
                                county={county}
                                setCounty={onCountyChange}
                                city={city}
                                setCity={onCityChange}
                                countyCounts={locationCounts?.counties || null}
                                cityCounts={locationCounts?.cities || null}
                                allCountyValue="All Counties"
                                allCityValue="All Cities"
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                sx={{ mt: 0 }}
                                selectSx={selectPillSx}
                                filterMode
                            />
                        </Box>

                        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0%" }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectPillSx} disabled={!county || county === "All Counties"}>
                                <InputLabel id="music-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="music-radius-select"
                                    labelId="music-radius-label"
                                    label="Radius"
                                    value={String(county && county !== "All Counties" ? (radius ?? "0") : STATEWIDE)}
                                    onChange={(e) => onRadiusChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = (!county || county === "All Counties") ? "All Alabama" : (opt?.label || "County only");
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <ExploreRoundedIcon fontSize="small" />
                                                <Typography component="span" sx={{ fontSize: 14 }}>{label}</Typography>
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

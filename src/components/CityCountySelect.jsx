// src/components/CityCountySelect.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, FormHelperText, TextField, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import cityCountyData from '../data/cityCountyMap.json';

const normalizeCounty = (name) => String(name || '').replace(/ County$/i, '').trim();

const ALL_COUNTIES = Array.from(
    new Set((Array.isArray(cityCountyData) ? cityCountyData : []).map((c) => normalizeCounty(c?.county)))
)
    .filter(Boolean)
    .sort();

const ALL_CITIES = (Array.isArray(cityCountyData) ? cityCountyData : [])
    .map((c) => String(c?.name || '').trim())
    .filter(Boolean)
    .sort();

// Build city-to-county lookup map for auto-selecting county when city is chosen
const CITY_TO_COUNTY_MAP = new Map();
(Array.isArray(cityCountyData) ? cityCountyData : []).forEach((c) => {
    const cityName = String(c?.name || '').trim();
    const countyName = normalizeCounty(c?.county);
    if (cityName && countyName) {
        CITY_TO_COUNTY_MAP.set(cityName.toLowerCase(), countyName);
    }
});

export default function CityCountySelect({
                                             city,
                                             setCity,
                                             county,
                                             setCounty,
                                             sx = {},
                                             cityError = '',
                                             countyError = '',
                                             selectSx = {},
                                             citySx = {},
                                             countySx = {},

                                             // Whether to include "All Cities" / "All Counties" options.
                                             // Default true for filters; set false when a specific home location is required.
                                             includeAllOptions = true,

                                             countyRequired = false,
                                             cityRequired = false,

                                             disabled = false,
                                             countyDisabled = false,
                                             cityDisabled = false,

                                             // Disable the clear (X) button
                                             disableClearable = false,
                                             countyDisableClearable = false,
                                             cityDisableClearable = false,

                                             emptyCountyLabel = 'Select county',
                                             emptyCityLabel = 'Select city',

                                             // Statewide behavior (optional)
                                             statewide = false,
                                             allCountyValue = 'All Counties',
                                             allCityValue = 'All Cities',
                                             profileCounty = '',
                                             profileCity = '',

                                             // Optional callback for batched city+county updates
                                             // Called as onCityCountyChange({ city, county }) when city selection also determines county
                                             onCityCountyChange = null,

                                             // Optional listing counts per county/city for badge display
                                             // { "Calhoun": 5, "Bibb": 0, ... }
                                             countyCounts = null,
                                             cityCounts = null,

                                             // When true, applies the filter-bar radiance styling:
                                             // pill-shaped inputs, themed dropdown paper, and a soft
                                             // white glow on focus/open — matching the CommunityFilter
                                             // Select dropdowns in dark mode.
                                             filterMode = false,
                                         }) {
    const theme = useTheme();

    // ── Mobile: text-first Autocomplete ──
    // Tap text input → focus + keyboard only (dropdown stays closed).
    // Tap the ▼ arrow → toggle fullscreen dropdown.
    // Start typing   → small inline dropdown (search-as-you-type).
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [countyOpen, setCountyOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    // Track when the popup-indicator arrow is the source of the open request
    const countyArrowClickRef = useRef(false);
    const cityArrowClickRef = useRef(false);
    // Track HOW each dropdown was opened: 'arrow' = fullscreen, 'typing' = small inline
    const [countyOpenMode, setCountyOpenMode] = useState('arrow');
    const [cityOpenMode, setCityOpenMode] = useState('arrow');

    const safeEmptyCountyLabel = typeof emptyCountyLabel === 'string' ? emptyCountyLabel : 'Select county';
    const safeEmptyCityLabel = typeof emptyCityLabel === 'string' ? emptyCityLabel : 'Select city';

    const safeAllCountyValue =
        typeof allCountyValue === 'string' && allCountyValue.trim() ? allCountyValue.trim() : 'All Counties';
    const safeAllCityValue =
        typeof allCityValue === 'string' && allCityValue.trim() ? allCityValue.trim() : 'All Cities';

    const safeProfileCounty = typeof profileCounty === 'string' ? profileCounty : '';
    const safeProfileCity = typeof profileCity === 'string' ? profileCity : '';

    const safeCountyValue = typeof county === 'string' ? county : '';
    const safeCityValue = typeof city === 'string' ? city : '';

    const allowAllOptions = Boolean(includeAllOptions);

    const isCountyDisabled = Boolean(disabled || countyDisabled || statewide);
    const isCityDisabled = Boolean(disabled || cityDisabled || statewide);

    const isCountyClearable = !(disableClearable || countyDisableClearable);
    const isCityClearable = !(disableClearable || cityDisableClearable);

    const prevStatewideRef = useRef(Boolean(statewide));
    const prevCountyRef = useRef(safeCountyValue);

    // Track when county change is triggered by city selection (to avoid resetting city)
    const countyChangedByCityRef = useRef(false);

    // ── Callback refs ──
    // Store setCity / setCounty in refs so useEffect closures always see the
    // latest function WITHOUT the function identity being a dependency.
    // This prevents infinite-loop re-renders when the parent passes inline
    // arrow functions (new reference each render).
    const setCityRef = useRef(setCity);
    const setCountyRef = useRef(setCounty);
    const onCityCountyChangeRef = useRef(onCityCountyChange);
    setCityRef.current = setCity;
    setCountyRef.current = setCounty;
    onCityCountyChangeRef.current = onCityCountyChange;

    // Controlled input text so:
    // - Users can type to search (input shown at top)
    // - Hitting the clear "X" always returns to "All Counties"/"All Cities"
    // - If the user deletes all text and blurs, we snap back to the default "All *" value
    const [countyInputValue, setCountyInputValue] = useState('');
    const [cityInputValue, setCityInputValue] = useState('');

    // ── Autocomplete-specific input styling ──
    // The parent selectSx targets .MuiSelect-select (which doesn't exist in
    // Autocomplete). We need to also style .MuiInputBase-input so the typed /
    // selected text in the Autocomplete matches the Select dropdowns exactly.
    const autocompleteFontSx = useMemo(() => ({
        '& .MuiInputBase-input': {
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'text.primary',
        },
        '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'text.secondary',
        },
    }), []);

    // ── Filter-mode styling (matches SearchInput frosted-glass look) ──
    const filterInputSx = useMemo(() => {
        if (!filterMode) return {};
        const isDark = theme.palette.mode === 'dark';
        const frost = theme.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
        const m = theme.custom?.motion || {};
        return {
            '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                backgroundColor: isDark ? alpha(frost, 0.6) : alpha(theme.palette.common.white, 0.92),
                backdropFilter: 'saturate(140%) blur(10px)',
                minHeight: 40,
                overflow: 'hidden',
                transition: `box-shadow ${m.base || 160}ms ${m.ease || 'ease'}, border-color ${m.base || 160}ms ${m.ease || 'ease'}`,
                '& fieldset': {
                    borderColor: alpha(theme.palette.text.primary, isDark ? 0.18 : 0.14),
                },
                '&:hover fieldset': {
                    borderColor: alpha(theme.palette.text.primary, isDark ? 0.28 : 0.22),
                },
                '&.Mui-focused': {
                    '& fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.50),
                    },
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.10)}`,
                },
            },
        };
    }, [filterMode, theme]);

    // Dropdown paper styling for filter mode — mirrors sharedMenuProps in CommunityFilter
    const filterSlotProps = useMemo(() => {
        if (!filterMode) return undefined;
        const sh = theme.custom?.shadows || {};
        return {
            popper: {
                sx: {
                    '& .MuiPaper-root': {
                        mt: 0.75,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none !important',
                        maxHeight: 340,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                        boxShadow: sh.lg || `0 16px 34px ${alpha(theme.palette.text.primary, 0.12)}`,
                    },
                    '& .MuiAutocomplete-listbox': {
                        backgroundColor: 'background.paper',
                        '& .MuiAutocomplete-option': {
                            minHeight: 42,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        },
                    },
                    [theme.breakpoints.down('md')]: {
                        position: 'fixed !important',
                        top: '0 !important',
                        left: '0 !important',
                        right: '0 !important',
                        bottom: '0 !important',
                        width: '100% !important',
                        maxWidth: '100% !important',
                        transform: 'none !important',
                        zIndex: 1400,
                        '& .MuiPaper-root': {
                            maxHeight: '100%',
                            height: '100%',
                            borderRadius: 0,
                            border: 'none',
                            mt: 0,
                            boxShadow: 'none',
                        },
                        '& .MuiAutocomplete-listbox': {
                            maxHeight: '100%',
                            '& .MuiAutocomplete-option': {
                                minHeight: 48,
                                fontSize: '1rem',
                            },
                        },
                    },
                },
            },
            paper: {
                sx: {
                    bgcolor: 'background.paper',
                    backgroundImage: 'none !important',
                },
            },
        };
    }, [filterMode, theme]);

    // Inline (non-fullscreen) variant for mobile typing — same base styling
    // but without the fullscreen breakpoint override so it stays as a small popper.
    const filterSlotPropsInline = useMemo(() => {
        if (!filterMode) return undefined;
        const sh = theme.custom?.shadows || {};
        return {
            popper: {
                sx: {
                    '& .MuiPaper-root': {
                        mt: 0.75,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none !important',
                        maxHeight: 240,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                        boxShadow: sh.lg || `0 16px 34px ${alpha(theme.palette.text.primary, 0.12)}`,
                    },
                    '& .MuiAutocomplete-listbox': {
                        backgroundColor: 'background.paper',
                        '& .MuiAutocomplete-option': {
                            minHeight: 42,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        },
                    },
                },
            },
            paper: {
                sx: {
                    bgcolor: 'background.paper',
                    backgroundImage: 'none !important',
                },
            },
        };
    }, [filterMode, theme]);

    // Merge selectSx with specific citySx/countySx AND the autocomplete font fix —
    // memoize to prevent new object references on every render (avoids infinite update loops).
    const mergedCountySx = useMemo(() => ({ ...selectSx, ...autocompleteFontSx, ...filterInputSx, ...countySx }), [selectSx, autocompleteFontSx, filterInputSx, countySx]);
    const mergedCitySx = useMemo(() => ({ ...selectSx, ...autocompleteFontSx, ...filterInputSx, ...citySx }), [selectSx, autocompleteFontSx, filterInputSx, citySx]);

    // Stable random name suffixes (created once per mount) to defeat autofill
    const stableCountyName = useRef(`county_${Math.random().toString(36).slice(2, 9)}`);
    const stableCityName = useRef(`city_${Math.random().toString(36).slice(2, 9)}`);

    // Keep input text in sync when the selected value changes externally.
    useEffect(() => {
        setCountyInputValue(safeCountyValue || '');
    }, [safeCountyValue]);

    useEffect(() => {
        setCityInputValue(safeCityValue || '');
    }, [safeCityValue]);

    // When toggling statewide:
    // - ON: force "All Counties"/"All Cities" and lock inputs
    // - OFF: restore profile defaults (only if currently on "All *")
    useEffect(() => {
        const was = prevStatewideRef.current;
        const now = Boolean(statewide);

        // If this instance doesn't allow "All" options, we don't force statewide defaults.
        if (now && allowAllOptions) {
            if (safeCountyValue !== safeAllCountyValue && typeof setCountyRef.current === 'function') {
                setCountyRef.current(safeAllCountyValue);
            }
            if (safeCityValue !== safeAllCityValue && typeof setCityRef.current === 'function') {
                setCityRef.current(safeAllCityValue);
            }
        }

        if (!now && was && allowAllOptions) {
            const countyIsAll = safeCountyValue === safeAllCountyValue;
            const cityIsAll = safeCityValue === safeAllCityValue;

            if (countyIsAll && typeof setCountyRef.current === 'function') setCountyRef.current(safeProfileCounty);
            if (cityIsAll && typeof setCityRef.current === 'function') setCityRef.current(safeProfileCity);
        }

        prevStatewideRef.current = now;
        // Callbacks read from refs — not listed as deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        statewide,
        allowAllOptions,
        safeAllCountyValue,
        safeAllCityValue,
        safeProfileCounty,
        safeProfileCity,
        safeCountyValue,
        safeCityValue,
    ]);

    // When county changes (and not statewide), reset city (unless switching to "All Counties").
    // BUT skip the reset if county was changed by selecting a city (countyChangedByCityRef).
    useEffect(() => {
        if (statewide) {
            prevCountyRef.current = safeAllCountyValue;
            return;
        }

        const prevCounty = prevCountyRef.current;
        const nextCounty = safeCountyValue;

        if (prevCounty !== nextCounty) {
            // If county change was triggered by city selection, don't reset the city
            if (countyChangedByCityRef.current) {
                countyChangedByCityRef.current = false;
                prevCountyRef.current = nextCounty;
                return;
            }

            if (typeof setCityRef.current === 'function') {
                if (allowAllOptions && nextCounty === safeAllCountyValue) {
                    if (safeCityValue !== safeAllCityValue) setCityRef.current(safeAllCityValue);
                } else {
                    // Selecting a specific county (or when "All" options are disabled) clears the city selection
                    if (safeCityValue) setCityRef.current('');
                }
            }
            prevCountyRef.current = nextCounty;
        }
        // Callbacks read from refs — not listed as deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statewide, allowAllOptions, safeAllCountyValue, safeAllCityValue, safeCountyValue, safeCityValue]);

    // Filtered cities depend on county selection (unless "All Counties")
    const [filteredCities, setFilteredCities] = useState(ALL_CITIES);

    useEffect(() => {
        const normalizedCounty = String(safeCountyValue || '').trim();
        if (!normalizedCounty || (allowAllOptions && normalizedCounty === safeAllCountyValue)) {
            setFilteredCities(ALL_CITIES);
            return;
        }

        setFilteredCities(
            (Array.isArray(cityCountyData) ? cityCountyData : [])
                .filter((c) => normalizeCounty(c?.county) === normalizedCounty)
                .map((c) => String(c?.name || '').trim())
                .filter(Boolean)
                .sort()
        );
    }, [safeCountyValue, safeAllCountyValue, allowAllOptions]);

    const countyOptions = (allowAllOptions ? [safeAllCountyValue, ...ALL_COUNTIES] : ALL_COUNTIES).filter(Boolean);
    const cityOptions = (allowAllOptions ? [safeAllCityValue, ...filteredCities] : filteredCities).filter(Boolean);

    const countyIsSpecific = allowAllOptions ? safeCountyValue && safeCountyValue !== safeAllCountyValue : Boolean(safeCountyValue);
    const cityLabel = countyIsSpecific ? `City (${safeCountyValue})` : 'City';

    const countyAutocompleteValue = countyOptions.includes(safeCountyValue)
        ? safeCountyValue
        : allowAllOptions
            ? safeAllCountyValue
            : null;

    const cityAutocompleteValue = cityOptions.includes(safeCityValue)
        ? safeCityValue
        : allowAllOptions
            ? safeAllCityValue
            : null;

    // Stable clear handlers — use refs so identity never changes.
    const handleCountyClear = useCallback(() => {
        if (!allowAllOptions) {
            if (typeof setCountyRef.current === 'function') setCountyRef.current('');
            if (typeof setCityRef.current === 'function') setCityRef.current('');
            return;
        }
        if (typeof setCountyRef.current === 'function') setCountyRef.current(safeAllCountyValue);
        if (typeof setCityRef.current === 'function') setCityRef.current(safeAllCityValue);
    }, [allowAllOptions, safeAllCountyValue, safeAllCityValue]);

    const handleCityClear = useCallback(() => {
        if (!allowAllOptions) {
            if (typeof setCityRef.current === 'function') setCityRef.current('');
            return;
        }
        if (typeof setCityRef.current === 'function') setCityRef.current(safeAllCityValue);
    }, [allowAllOptions, safeAllCityValue]);

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 1.5 }, minWidth: 0, ...sx }}>
            <Box sx={{ minWidth: 0, flex: { xs: '1 1 auto', sm: 1 } }}>
                <Autocomplete
                    options={countyOptions}
                    value={countyAutocompleteValue}
                    inputValue={countyInputValue}
                    disableClearable={!isCountyClearable}
                    {...(isMobile ? {
                        open: countyOpen,
                        onOpen: () => {
                            // Only open if triggered by the arrow or by typing
                            if (countyArrowClickRef.current) {
                                countyArrowClickRef.current = false;
                                setCountyOpenMode('arrow');
                                setCountyOpen(true);
                            }
                            // Otherwise ignore — input tap/focus should NOT open
                        },
                        onClose: () => setCountyOpen(false),
                    } : {})}
                    onInputChange={(_, nextInput, reason) => {
                        // Handle the clear "X" inside the input
                        if (reason === 'clear') {
                            handleCountyClear();
                            return;
                        }
                        setCountyInputValue(typeof nextInput === 'string' ? nextInput : '');
                        // On mobile, open small inline dropdown as user types
                        if (isMobile && reason === 'input' && nextInput) {
                            setCountyOpenMode('typing');
                            setCountyOpen(true);
                        }
                    }}
                    onBlur={() => {
                        const trimmed = String(countyInputValue || '').trim();
                        if (!trimmed) {
                            handleCountyClear();
                        }
                    }}
                    onChange={(_, next, reason) => {
                        const isCleared = reason === 'clear' || next === null;
                        const nextCounty = isCleared
                            ? allowAllOptions
                                ? safeAllCountyValue
                                : ''
                            : typeof next === 'string'
                                ? next
                                : '';

                        if (typeof setCountyRef.current === 'function') setCountyRef.current(nextCounty);

                        // When clearing back to "All Counties", also reset city immediately.
                        if (isCleared || (allowAllOptions && nextCounty === safeAllCountyValue)) {
                            if (typeof setCityRef.current === 'function') {
                                setCityRef.current(allowAllOptions ? safeAllCityValue : '');
                            }
                        }
                    }}
                    disabled={isCountyDisabled}
                    fullWidth
                    autoHighlight
                    clearOnEscape
                    slotProps={{
                        ...((isMobile && countyOpenMode === 'typing' ? filterSlotPropsInline : filterSlotProps) || {}),
                        ...(isMobile ? {
                            popupIndicator: {
                                onMouseDown: () => { countyArrowClickRef.current = true; },
                            },
                        } : {}),
                    }}
                    getOptionDisabled={countyCounts ? (option) => {
                        if (allowAllOptions && option === safeAllCountyValue) return false;
                        return (countyCounts[option] ?? 0) === 0;
                    } : undefined}
                    renderOption={countyCounts ? (props, option) => {
                        const isAll = allowAllOptions && option === safeAllCountyValue;
                        const count = isAll ? null : (countyCounts[option] ?? 0);
                        const isEmpty = count === 0;
                        return (
                            <Box component="li" {...props} sx={{ ...props.sx, opacity: isEmpty ? 0.45 : 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: isEmpty ? 400 : 600 }}>
                                        {option}
                                    </Typography>
                                    {count !== null && (
                                        <Typography
                                            sx={(t) => ({
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: isEmpty ? t.palette.text.disabled : t.palette.primary.main,
                                                bgcolor: isEmpty ? 'transparent' : alpha(t.palette.primary.main, 0.08),
                                                borderRadius: 1,
                                                px: 0.75,
                                                py: 0.1,
                                                minWidth: 20,
                                                textAlign: 'center',
                                                lineHeight: 1.5,
                                            })}
                                        >
                                            {count}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    } : undefined}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="County"
                            placeholder={safeEmptyCountyLabel}
                            size="small"
                            error={Boolean(countyError)}
                            required={countyRequired}
                            disabled={isCountyDisabled}
                            sx={mergedCountySx}
                            autoComplete="one-time-code"
                            name={stableCountyName.current}
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: "one-time-code",
                                autoCorrect: "off",
                                autoCapitalize: "off",
                                spellCheck: "false",
                                "data-form-type": "other",
                                "data-lpignore": "true",
                                "data-1p-ignore": "true",
                                role: "combobox",
                            }}
                            InputProps={{
                                ...params.InputProps,
                                autoComplete: "one-time-code",
                            }}
                        />
                    )}
                />
                {countyError ? <FormHelperText error>{countyError}</FormHelperText> : null}
            </Box>

            <Box sx={{ minWidth: 0, flex: { xs: '1 1 auto', sm: 1 } }}>
                <Autocomplete
                    options={cityOptions}
                    value={cityAutocompleteValue}
                    inputValue={cityInputValue}
                    disableClearable={!isCityClearable}
                    {...(isMobile ? {
                        open: cityOpen,
                        onOpen: () => {
                            if (cityArrowClickRef.current) {
                                cityArrowClickRef.current = false;
                                setCityOpenMode('arrow');
                                setCityOpen(true);
                            }
                        },
                        onClose: () => setCityOpen(false),
                    } : {})}
                    onInputChange={(_, nextInput, reason) => {
                        if (reason === 'clear') {
                            handleCityClear();
                            return;
                        }
                        setCityInputValue(typeof nextInput === 'string' ? nextInput : '');
                        // On mobile, open small inline dropdown as user types
                        if (isMobile && reason === 'input' && nextInput) {
                            setCityOpenMode('typing');
                            setCityOpen(true);
                        }
                    }}
                    onBlur={() => {
                        const trimmed = String(cityInputValue || '').trim();
                        if (!trimmed) {
                            handleCityClear();
                        }
                    }}
                    onChange={(_, next, reason) => {
                        const isCleared = reason === 'clear' || next === null;
                        const nextCity = isCleared
                            ? allowAllOptions
                                ? safeAllCityValue
                                : ''
                            : typeof next === 'string'
                                ? next
                                : '';

                        // Auto-select county when a valid city is chosen
                        if (!isCleared && nextCity && nextCity !== safeAllCityValue) {
                            const associatedCounty = CITY_TO_COUNTY_MAP.get(nextCity.toLowerCase());
                            if (associatedCounty) {
                                // If we have a batched callback, use it to update both at once
                                if (typeof onCityCountyChangeRef.current === 'function') {
                                    countyChangedByCityRef.current = true;
                                    onCityCountyChangeRef.current({ city: nextCity, county: associatedCounty });
                                    return;
                                }
                                // Otherwise, set flag and call both setters
                                countyChangedByCityRef.current = true;
                                if (typeof setCityRef.current === 'function') setCityRef.current(nextCity);
                                if (typeof setCountyRef.current === 'function') setCountyRef.current(associatedCounty);
                                return;
                            }
                        }

                        // Normal case: just update city
                        if (typeof setCityRef.current === 'function') setCityRef.current(nextCity);
                    }}
                    disabled={isCityDisabled}
                    fullWidth
                    autoHighlight
                    clearOnEscape
                    slotProps={{
                        ...((isMobile && cityOpenMode === 'typing' ? filterSlotPropsInline : filterSlotProps) || {}),
                        ...(isMobile ? {
                            popupIndicator: {
                                onMouseDown: () => { cityArrowClickRef.current = true; },
                            },
                        } : {}),
                    }}
                    getOptionDisabled={cityCounts ? (option) => {
                        if (allowAllOptions && option === safeAllCityValue) return false;
                        return (cityCounts[option] ?? 0) === 0;
                    } : undefined}
                    renderOption={cityCounts ? (props, option) => {
                        const isAll = allowAllOptions && option === safeAllCityValue;
                        const count = isAll ? null : (cityCounts[option] ?? 0);
                        const isEmpty = count === 0;
                        return (
                            <Box component="li" {...props} sx={{ ...props.sx, opacity: isEmpty ? 0.45 : 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: isEmpty ? 400 : 600 }}>
                                        {option}
                                    </Typography>
                                    {count !== null && (
                                        <Typography
                                            sx={(t) => ({
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: isEmpty ? t.palette.text.disabled : t.palette.primary.main,
                                                bgcolor: isEmpty ? 'transparent' : alpha(t.palette.primary.main, 0.08),
                                                borderRadius: 1,
                                                px: 0.75,
                                                py: 0.1,
                                                minWidth: 20,
                                                textAlign: 'center',
                                                lineHeight: 1.5,
                                            })}
                                        >
                                            {count}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    } : undefined}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={cityLabel}
                            placeholder={safeEmptyCityLabel}
                            size="small"
                            error={Boolean(cityError)}
                            required={cityRequired}
                            disabled={isCityDisabled}
                            sx={mergedCitySx}
                            autoComplete="one-time-code"
                            name={stableCityName.current}
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: "one-time-code",
                                autoCorrect: "off",
                                autoCapitalize: "off",
                                spellCheck: "false",
                                "data-form-type": "other",
                                "data-lpignore": "true",
                                "data-1p-ignore": "true",
                                role: "combobox",
                            }}
                            InputProps={{
                                ...params.InputProps,
                                autoComplete: "one-time-code",
                            }}
                        />
                    )}
                />
                {cityError ? <FormHelperText error>{cityError}</FormHelperText> : null}
            </Box>
        </Box>
    );
}

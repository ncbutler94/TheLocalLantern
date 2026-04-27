// src/components/SearchInput.jsx
//
// Search input used across Local Lantern pages.
// Style: magnifying glass is the "search" button, and the X just to its left clears.
// - Enter triggers search
// - Esc clears (if possible)
// - Keeps prior prop API used by CommunityPanel / CommunityFilter
//
// The component manages its own internal text state so that rapid keystrokes
// (e.g. holding a key) only cause lightweight local re-renders instead of
// flushing every keystroke into the parent.  The parent's `value` prop is
// still respected as the source of truth — whenever it diverges from the
// local draft (e.g. the parent clears it), the local state syncs.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function SearchInput({
                                        placeholder = 'Search',
                                        value = '',
                                        onChange = () => {},
                                        onSearch = () => {},
                                        onClear = () => {},
                                        inputProps = {},
                                        disabled = false,
                                        autoFocus = false,
                                        sx,
                                    }) {
    // ── Internal (local) state for the text field ──
    // This lets us absorb rapid keystrokes without re-rendering the parent on
    // every character.  The parent's `value` prop is the source of truth for
    // *external* resets (e.g. clearing filters).
    const [localValue, setLocalValue] = useState(value ?? '');

    // Track the last value we sent to the parent so we can tell when the
    // parent's `value` changed for a reason *other* than our own onChange.
    const lastEmittedRef = useRef(value ?? '');

    // Sync local state when the parent changes `value` externally
    // (e.g. handleClear sets searchTerm to '').
    useEffect(() => {
        if ((value ?? '') !== lastEmittedRef.current) {
            setLocalValue(value ?? '');
            lastEmittedRef.current = value ?? '';
        }
    }, [value]);

    // Debounce timer ref for notifying the parent
    const debounceRef = useRef(null);

    // Clean up any pending debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleChange = useCallback(
        (e) => {
            const raw = e?.target?.value ?? '';
            const next = raw.slice(0, 200);
            setLocalValue(next);

            // Debounce the parent notification so rapid typing doesn't
            // cause expensive parent re-renders on every keystroke.
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                debounceRef.current = null;
                lastEmittedRef.current = next;
                // Synthesize a minimal event-like object so callers that
                // read e.target.value keep working.
                onChange({ target: { value: next } });
            }, 150);
        },
        [onChange],
    );

    // Flush any pending debounce immediately (used before search / clear
    // so the parent has the latest value when those callbacks fire).
    const flush = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
            lastEmittedRef.current = localValue;
            onChange({ target: { value: localValue } });
        }
    }, [localValue, onChange]);

    const hasValue = localValue.length > 0;

    const handleSearch = useCallback(() => {
        flush();
        if (typeof onSearch === 'function') onSearch();
    }, [flush, onSearch]);

    const handleClear = useCallback(() => {
        // Clear local state immediately for snappy UX
        setLocalValue('');
        lastEmittedRef.current = '';
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        if (typeof onClear === 'function') onClear();
    }, [onClear]);

    return (
        <Box sx={{ width: '100%', ...(sx || {}) }}>
            <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder={placeholder}
                value={localValue}
                onChange={handleChange}
                disabled={disabled}
                autoFocus={autoFocus}
                autoComplete="off"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                        return;
                    }
                    if (e.key === 'Escape') {
                        if (hasValue) {
                            e.preventDefault();
                            handleClear();
                        }
                    }
                }}
                InputProps={{
                    sx: (t) => {
                        const isDark = t.palette.mode === 'dark';
                        const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
                        return {
                            borderRadius: 999,
                            backgroundColor: isDark
                                ? alpha(frost, 0.6)
                                : alpha(t.palette.common.white, 0.92),
                            backdropFilter: 'saturate(140%) blur(10px)',
                            px: 0.25,
                            color: t.palette.text.primary,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(t.palette.text.primary, isDark ? 0.18 : 0.14),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(t.palette.text.primary, isDark ? 0.28 : 0.22),
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(t.palette.primary.main, 0.50),
                                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
                            },
                            '& input': {
                                fontWeight: 700,
                                letterSpacing: '-0.01em',
                                color: t.palette.text.primary,
                            },
                            '& input::placeholder': {
                                color: alpha(t.palette.text.secondary, isDark ? 0.85 : 1),
                                opacity: 1,
                            },
                        };
                    },
                    endAdornment: (
                        <InputAdornment position="end">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <Tooltip title={hasValue ? 'Clear' : ''} arrow disableHoverListener={!hasValue}>
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={handleClear}
                                            disabled={disabled || !hasValue}
                                            aria-label="Clear search"
                                            sx={(t) => ({
                                                width: { xs: 38, sm: 34 },
                                                height: { xs: 38, sm: 34 },
                                                borderRadius: 999,
                                                color: alpha(t.palette.text.primary, hasValue ? 0.72 : 0.35),
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.05),
                                                },
                                            })}
                                        >
                                            <CloseRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Search" arrow>
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={handleSearch}
                                            disabled={disabled}
                                            aria-label="Search"
                                            sx={(t) => ({
                                                width: { xs: 38, sm: 34 },
                                                height: { xs: 38, sm: 34 },
                                                borderRadius: 999,
                                                bgcolor: alpha(t.palette.primary.main, 0.10),
                                                color: t.palette.primary.main,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.18),
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.primary.main, 0.16),
                                                    borderColor: alpha(t.palette.primary.main, 0.24),
                                                },
                                            })}
                                        >
                                            <SearchRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        </InputAdornment>
                    ),
                }}
                inputProps={{
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'none',
                    spellCheck: false,
                    maxLength: 200,
                    // Some browsers ignore autoComplete="off" unless the field has a stable name.
                    name: inputProps?.name || 'll-search',
                    ...inputProps,
                    'aria-label': inputProps?.['aria-label'] || placeholder || 'Search',
                }}
            />
        </Box>
    );
}

// src/components/themedInputSx.js
//
// Shared theme-aware sx factory for TextField / OutlinedInput components.
// Mirrors the frost/dark-mode styling from SearchInput so every text input
// across the app has a consistent look.
//
// Usage:
//   import { getThemedInputSx } from '../../../components/themedInputSx';
//   <TextField InputProps={{ sx: getThemedInputSx() }} ... />
//
// For multiline / textarea fields:
//   <TextField InputProps={{ sx: getThemedInputSx({ multiline: true }) }} ... />
//
// The returned value is an sx callback (theme => styles) compatible with
// MUI's InputProps.sx slot.

import { alpha } from '@mui/material/styles';

/**
 * @param {Object} [opts]
 * @param {boolean}  [opts.multiline=false]  If true, uses a softer border-radius suited for textareas.
 * @param {number}   [opts.borderRadius]     Override border-radius (default: 2.5 for multiline, 1.5 for single-line).
 * @param {boolean}  [opts.frostedBg=true]   Whether to apply the frosted-glass background.
 * @returns {Function} An sx callback `(theme) => styles`.
 */
export function getThemedInputSx(opts = {}) {
    const {
        multiline = false,
        borderRadius: brOverride,
        frostedBg = true,
    } = opts;

    const br = brOverride ?? (multiline ? 2.5 : 1.5);

    return (t) => {
        const isDark = t.palette.mode === 'dark';
        const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');

        return {
            borderRadius: br,
            ...(frostedBg && {
                backgroundColor: isDark
                    ? alpha(frost, 0.6)
                    : alpha(t.palette.common.white, 0.92),
                backdropFilter: 'saturate(140%) blur(10px)',
            }),
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
            '& input, & textarea': {
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: t.palette.text.primary,
            },
            '& input::placeholder, & textarea::placeholder': {
                color: alpha(t.palette.text.secondary, isDark ? 0.85 : 1),
                opacity: 1,
            },
        };
    };
}

/** Pre-built sx callbacks for the two most common cases. */
export const themedInputSx = getThemedInputSx();
export const themedMultilineInputSx = getThemedInputSx({ multiline: true });

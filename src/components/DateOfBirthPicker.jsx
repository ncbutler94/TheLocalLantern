// frontend/src/components/DateOfBirthPicker.jsx
//
// Three-dropdown DOB picker (Month / Day / Year).
//
// Why three dropdowns instead of native type="date" or a calendar?
//   - Target audience skews older. iOS date wheels start at today and
//     require flicking the year back decades.
//   - A Year dropdown lets a 55-year-old pick "1970" in ONE tap.
//   - Works on every device, every screen reader, no dependency.
//
// Contract:
//   - value: "YYYY-MM-DD" string (or '' if incomplete)
//   - onChange: called with the ISO string ONLY when all three parts are filled;
//               otherwise called with '' (so parent knows DOB is incomplete)
//
// DESIGN NOTE: This component tracks its OWN state for each of the three
// parts. The parent's `value` is only for hydration (loading an existing DOB)
// and for emitting back. Previous version tried to derive the three parts
// from the ISO string on every render, which meant picking "January" would
// immediately get wiped because the parent's value was still empty (no day,
// no year picked yet). That was the "dropdowns don't work" bug.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, FormHelperText } from '@mui/material';

const MONTHS = [
    { value: 1,  label: 'January' },
    { value: 2,  label: 'February' },
    { value: 3,  label: 'March' },
    { value: 4,  label: 'April' },
    { value: 5,  label: 'May' },
    { value: 6,  label: 'June' },
    { value: 7,  label: 'July' },
    { value: 8,  label: 'August' },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

function daysInMonth(month, year) {
    if (!month) return 31;
    return new Date(year || 2000, month, 0).getDate();
}

function parseDob(value) {
    if (!value || typeof value !== 'string') return { y: '', m: '', d: '' };
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return { y: '', m: '', d: '' };
    return { y: match[1], m: String(Number(match[2])), d: String(Number(match[3])) };
}

function formatDob(y, m, d) {
    if (!y || !m || !d) return '';
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
}

export default function DateOfBirthPicker({
                                              value,
                                              onChange,
                                              error,
                                              helperText,
                                              label = 'Date of Birth',
                                              minAge = 18,
                                              maxAge = 120,
                                              required = true,
                                              disabled = false,
                                          }) {
    // ── Internal state per part — this is the key fix ──────────────────
    const initial = parseDob(value);
    const [month, setMonth] = useState(initial.m);
    const [day, setDay] = useState(initial.d);
    const [year, setYear] = useState(initial.y);

    // If the parent's value changes externally (e.g. form reset), re-sync
    useEffect(() => {
        const currentIso = formatDob(year, month, day);
        if (value !== currentIso) {
            const parsed = parseDob(value);
            setMonth(parsed.m);
            setDay(parsed.d);
            setYear(parsed.y);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Emit ISO to parent. Only produces a full date when all three parts
    // are set; otherwise emits '' so parent can validate "incomplete".
    const emit = (newY, newM, newD) => {
        let finalD = newD;
        if (newM && finalD) {
            const max = daysInMonth(Number(newM), Number(newY) || 2000);
            if (Number(finalD) > max) {
                finalD = String(max);
                setDay(finalD);
            }
        }
        onChange(formatDob(newY, newM, finalD));
    };

    const now = new Date();
    const thisYear = now.getFullYear();

    const years = useMemo(() => {
        const maxYear = thisYear - minAge;
        const minYear = thisYear - maxAge;
        const arr = [];
        for (let yr = maxYear; yr >= minYear; yr--) arr.push(yr);
        return arr;
    }, [thisYear, minAge, maxAge]);

    const maxDay = daysInMonth(Number(month) || 0, Number(year) || 0);
    const days = useMemo(() => {
        const arr = [];
        for (let i = 1; i <= maxDay; i++) arr.push(i);
        return arr;
    }, [maxDay]);

    const handleMonth = (e) => {
        const newM = e.target.value;
        setMonth(newM);
        emit(year, newM, day);
    };
    const handleDay = (e) => {
        const newD = e.target.value;
        setDay(newD);
        emit(year, month, newD);
    };
    const handleYear = (e) => {
        const newY = e.target.value;
        setYear(newY);
        emit(newY, month, day);
    };

    // Native <select> styled to LOOK like an obvious dropdown.
    //
    // Why this styling matters:
    //   Older users were not recognizing the three fields as tappable
    //   dropdowns — one user tried to scroll the page backwards looking
    //   for her birth year instead of tapping "Year" to open the picker.
    //   The fix is visual affordance: filled background + chevron icon on
    //   the right so each field unmistakably reads as "tap to open a list."
    //
    //   We keep native <select> (not MUI Select) on purpose — on mobile,
    //   tapping a native select opens the full-screen OS picker, which is
    //   the best experience for the target audience.
    //
    // fontSize: 16 is critical on iOS — anything less triggers zoom-on-focus.
    //
    // appearance: none hides the browser's default dropdown arrow so our
    // custom chevron is the only one shown. The chevron is an inline SVG
    // data-URI in the background so it renders without any extra markup
    // or icon dependency.
    const chevronSvg = (color) =>
        `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`;

    const selectSx = (t) => {
        const isDark = t.palette.mode === 'dark';
        const fillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
        const fillBgHover = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
        const chevronColor = t.palette.text.secondary;

        return {
            width: '100%',
            minHeight: 56,
            // extra right padding so text never runs under the chevron
            padding: '16.5px 40px 16.5px 14px',
            fontSize: 16,
            fontFamily: 'inherit',
            color: t.palette.text.primary,
            backgroundColor: fillBg,
            // strip native arrow so our chevron is the only one visible
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: chevronSvg(chevronColor),
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            backgroundSize: '12px 8px',
            border: '1px solid',
            borderColor: error
                ? t.palette.error.main
                : isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
            borderRadius: `${t.shape.borderRadius}px`,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color 150ms ease, background-color 150ms ease',
            '&:hover': {
                backgroundColor: disabled ? fillBg : fillBgHover,
                borderColor: error
                    ? t.palette.error.main
                    : t.palette.text.primary,
            },
            '&:focus': {
                borderColor: error
                    ? t.palette.error.main
                    : t.palette.primary.main,
                borderWidth: 2,
                // compensate for thicker border so content doesn't shift
                padding: '15.5px 39px 15.5px 13px',
            },
            // IE / old Edge: hide the legacy dropdown arrow too
            '&::-ms-expand': { display: 'none' },
        };
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography
                component="label"
                sx={(t) => ({
                    display: 'block',
                    fontSize: 12,
                    color: error ? t.palette.error.main : t.palette.text.secondary,
                    mb: 0.75,
                    fontWeight: 500,
                })}
            >
                {label}{required ? ' *' : ''}
            </Typography>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1.1fr',
                gap: 1,
            }}>
                <Box
                    component="select"
                    value={month}
                    onChange={handleMonth}
                    disabled={disabled}
                    aria-label="Birth month"
                    sx={selectSx}
                >
                    <option value="" disabled>Month</option>
                    {MONTHS.map((mo) => (
                        <option key={mo.value} value={mo.value}>{mo.label}</option>
                    ))}
                </Box>

                <Box
                    component="select"
                    value={day}
                    onChange={handleDay}
                    disabled={disabled}
                    aria-label="Birth day"
                    sx={selectSx}
                >
                    <option value="" disabled>Day</option>
                    {days.map((dd) => (
                        <option key={dd} value={dd}>{dd}</option>
                    ))}
                </Box>

                <Box
                    component="select"
                    value={year}
                    onChange={handleYear}
                    disabled={disabled}
                    aria-label="Birth year"
                    sx={selectSx}
                >
                    <option value="" disabled>Year</option>
                    {years.map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                    ))}
                </Box>
            </Box>

            {helperText && (
                <FormHelperText
                    error={Boolean(error)}
                    sx={{ mx: 1.75, mt: 0.5 }}
                >
                    {helperText}
                </FormHelperText>
            )}
        </Box>
    );
}

// src/themes/ThemePicker.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Paintbrush icon button → dropdown showing available themes with colour-wheel
// previews.  Drops into the Header's settings column or beside Login buttons.
// ──────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Box,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from '@mui/material';
import BrushRoundedIcon from '@mui/icons-material/BrushRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useThemeSelector } from './ThemeContext';

/* ── Mini colour wheel (conic-gradient ring from the theme's 4 feature colours) */
function ColorWheel({ colors, size = 28, selected }) {
    const stops = colors.map((c, i) => `${c} ${(i / colors.length) * 360}deg ${((i + 1) / colors.length) * 360}deg`).join(', ');
    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `conic-gradient(${stops})`,
                border: selected ? '2.5px solid' : '2px solid',
                borderColor: selected ? 'secondary.main' : 'divider',
                boxShadow: selected ? (t) => `0 0 0 2px ${alpha(t.palette.secondary.main, 0.25)}` : 'none',
                transition: 'border-color 160ms ease, box-shadow 160ms ease',
                flexShrink: 0,
            }}
        />
    );
}

/* ── Dark / Light badge ────────────────────────────────────────────────────── */
function ModeBadge({ mode }) {
    const isDark = mode === 'dark';
    return (
        <Box
            component="span"
            sx={(t) => {
                // Use the CURRENT theme's mode to pick contrast colors
                const onDarkBg = t.palette.mode === 'dark';
                return {
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    px: 0.5,
                    py: 0.2,
                    borderRadius: 0.5,
                    bgcolor: onDarkBg
                        ? alpha(t.palette.common.white, 0.12)
                        : alpha(t.palette.common.black, 0.06),
                    color: onDarkBg
                        ? alpha(t.palette.common.white, 0.7)
                        : alpha(t.palette.common.black, 0.5),
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    ml: 0.75,
                    verticalAlign: 'middle',
                };
            }}
        >
            {isDark ? 'Dark' : 'Light'}
        </Box>
    );
}

/* ── ThemePicker ─────────────────────────────────────────────────────────── */
export default function ThemePicker({ iconSx, tooltipPlacement = 'bottom' }) {
    const theme = useTheme();
    const { themeId, setThemeId, themes } = useThemeSelector();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    return (
        <>
            <Tooltip title="Theme" arrow placement={tooltipPlacement}>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    aria-controls={open ? 'll-theme-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    sx={{
                        width: { xs: 40, sm: 32 },
                        height: { xs: 40, sm: 32 },
                        transition: `background-color 140ms ease, color 140ms ease`,
                        '&:hover': {
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                            color: 'primary.main',
                        },
                        ...iconSx,
                    }}
                >
                    <BrushRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Tooltip>

            <Menu
                id="ll-theme-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 220, maxWidth: 280, mt: 0.75 } } }}
            >
                <Box sx={{ px: 1.5, pt: 0.5, pb: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.8rem' }}>
                        Choose a Theme
                    </Typography>
                </Box>

                {themes.map((entry) => {
                    const isCurrent = entry.id === themeId;
                    const entryMode = entry.theme.palette.mode;
                    return (
                        <MenuItem
                            key={entry.id}
                            selected={isCurrent}
                            onClick={() => { setThemeId(entry.id); setAnchorEl(null); }}
                            sx={(t) => ({
                                minHeight: 44,
                                borderRadius: 1.5,
                                px: 1.25,
                                py: 0.75,
                                mx: 0.5,
                                mb: 0.25,
                                gap: 1,
                                transition: `background-color ${t.custom?.motion?.fast || 120}ms ease`,
                                ...(isCurrent && {
                                    bgcolor: alpha(t.palette.secondary.main, 0.08),
                                    '&:hover': { bgcolor: alpha(t.palette.secondary.main, 0.12) },
                                }),
                            })}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <ColorWheel colors={entry.colors} selected={isCurrent} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: isCurrent ? 800 : 600, fontSize: '0.84rem' }}
                                        >
                                            {entry.name}
                                        </Typography>
                                        <ModeBadge mode={entryMode} />
                                    </Box>
                                }
                            />
                            {isCurrent && (
                                <CheckRoundedIcon sx={{ fontSize: 16, color: 'secondary.main', ml: 'auto' }} />
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

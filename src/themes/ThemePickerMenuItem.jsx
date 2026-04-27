// src/themes/ThemePickerMenuItem.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Drop-in MenuItem for the Header's account-menu Settings column.
// Shows a paintbrush icon + "Theme" label.  Click opens a sub-menu of themes.
// ──────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
    Box,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from '@mui/material';
import BrushRoundedIcon from '@mui/icons-material/BrushRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useThemeSelector } from './ThemeContext';

/* Mini colour wheel */
function ColorWheel({ colors, size = 24, selected }) {
    const stops = colors.map((c, i) => `${c} ${(i / colors.length) * 360}deg ${((i + 1) / colors.length) * 360}deg`).join(', ');
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '50%',
            background: `conic-gradient(${stops})`,
            border: selected ? '2px solid' : '1.5px solid',
            borderColor: selected ? 'secondary.main' : 'divider',
            boxShadow: selected ? (t) => `0 0 0 2px ${alpha(t.palette.secondary.main, 0.25)}` : 'none',
            transition: 'border-color 160ms ease, box-shadow 160ms ease',
            flexShrink: 0,
        }} />
    );
}

function ModeBadge({ mode }) {
    const isDark = mode === 'dark';
    return (
        <Box component="span" sx={(t) => {
            const onDarkBg = t.palette.mode === 'dark';
            return {
                fontSize: '0.58rem', fontWeight: 700, lineHeight: 1, px: 0.4, py: 0.15, borderRadius: 0.5, ml: 0.5,
                bgcolor: onDarkBg ? alpha(t.palette.common.white, 0.12) : alpha(t.palette.common.black, 0.06),
                color: onDarkBg ? alpha(t.palette.common.white, 0.7) : alpha(t.palette.common.black, 0.5),
                textTransform: 'uppercase', letterSpacing: '0.04em',
            };
        }}>
            {isDark ? 'Dark' : 'Light'}
        </Box>
    );
}

export default function ThemePickerMenuItem() {
    const { themeId, setThemeId, themes } = useThemeSelector();
    const [subAnchor, setSubAnchor] = useState(null);
    const subOpen = Boolean(subAnchor);
    const current = themes.find((t) => t.id === themeId);

    return (
        <>
            {/* Trigger row inside the parent menu */}
            <MenuItem
                onClick={(e) => setSubAnchor(e.currentTarget)}
                sx={(t) => ({
                    minHeight: 44, borderRadius: 1.5, px: 1.25, py: 1, fontWeight: 700, gap: 0.25,
                    transition: `background-color ${t.custom?.motion?.fast || 120}ms ease`,
                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.primary.main, 0.12) },
                })}
            >
                <ListItemIcon sx={{ minWidth: 34 }}>
                    <Box
                        className="ll-menu-icon-wrap"
                        sx={(t) => ({
                            width: 28, height: 28, borderRadius: 1.25,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alpha(t.palette.primary.main, 0.07),
                            transition: `background-color ${t.custom?.motion?.fast || 120}ms ease`,
                        })}
                    >
                        <BrushRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                    </Box>
                </ListItemIcon>
                <ListItemText
                    primary="Theme"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                />
                {/* Show current swatch */}
                {current && <ColorWheel colors={current.colors} size={20} selected />}
            </MenuItem>

            {/* Sub-menu with all themes */}
            <Menu
                anchorEl={subAnchor}
                open={subOpen}
                onClose={() => setSubAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 210, ml: -0.5 } } }}
            >
                <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.78rem' }}>
                        Choose a Theme
                    </Typography>
                </Box>
                {themes.map((entry) => {
                    const isCurrent = entry.id === themeId;
                    return (
                        <MenuItem
                            key={entry.id}
                            selected={isCurrent}
                            onClick={() => { setThemeId(entry.id); setSubAnchor(null); }}
                            sx={(t) => ({
                                minHeight: 40, borderRadius: 1.5, px: 1, py: 0.5, mx: 0.5, mb: 0.25, gap: 0.75,
                                transition: `background-color ${t.custom?.motion?.fast || 120}ms ease`,
                                ...(isCurrent && {
                                    bgcolor: alpha(t.palette.secondary.main, 0.08),
                                    '&:hover': { bgcolor: alpha(t.palette.secondary.main, 0.12) },
                                }),
                            })}
                        >
                            <ColorWheel colors={entry.colors} size={22} selected={isCurrent} />
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                <Typography noWrap sx={{ fontWeight: isCurrent ? 800 : 600, fontSize: '0.82rem' }}>
                                    {entry.name}
                                </Typography>
                                <ModeBadge mode={entry.theme.palette.mode} />
                            </Box>
                            {isCurrent && <CheckRoundedIcon sx={{ fontSize: 14, color: 'secondary.main', flexShrink: 0 }} />}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

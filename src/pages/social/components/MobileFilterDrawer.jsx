// src/pages/social/components/MobileFilterDrawer.jsx
//
// MobileFilterDrawer
// ------------------
// Full-screen bottom drawer for mobile filter/search — mirrors the
// BusinessHubPage mobile filter drawer pattern exactly.
//
// Structure:
//   ┌─────────────────────────────────┐
//   │  ← Back    Search & Filter      │  ← sticky header
//   ├─────────────────────────────────┤
//   │  [Search input ................]│  ← sticky search
//   ├─────────────────────────────────┤
//   │  (scrollable filter controls)   │
//   │  ...                            │
//   ├─────────────────────────────────┤
//   │  Reset              Show Results│  ← sticky bottom
//   └─────────────────────────────────┘
//
// Props:
//   open              – Boolean controlling drawer visibility
//   onClose           – close handler
//   onApply           – called when "Show Results" is pressed (also closes drawer)
//   onReset           – called when "Reset" is pressed
//   searchTerm        – current search string
//   onSearchChange    – (e) => … for the search input
//   onSearchClear     – clear handler for the ✕ in the search input
//   searchPlaceholder – placeholder text for the input
//   children          – filter controls to render in the scrollable body
//   bottomNavHeight   – height of the app's bottom nav bar (default 56)
//   scrollTargetSelector – optional CSS selector to scroll-to-top after apply

import React from 'react';
import {
    Box,
    Button,
    Drawer,
    IconButton,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SearchInput from '../../../components/SearchInput';

// Import from your Header or define locally
// import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';
const DEFAULT_BOTTOM_NAV_HEIGHT = 56;

export default function MobileFilterDrawer({
                                               open,
                                               onClose,
                                               onApply,
                                               onReset,
                                               searchTerm = '',
                                               onSearchChange,
                                               onSearchClear,
                                               searchPlaceholder = 'Search posts…',
                                               children,
                                               bottomNavHeight = DEFAULT_BOTTOM_NAV_HEIGHT,
                                               scrollTargetSelector = null,
                                           }) {
    const handleApply = () => {
        onApply?.();
        onClose?.();
        if (scrollTargetSelector) {
            requestAnimationFrame(() => {
                const el = document.querySelector(scrollTargetSelector);
                if (el) el.scrollTop = 0;
            });
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    height: `calc(100vh - ${bottomNavHeight}px)`,
                    borderRadius: '16px 16px 0 0',
                    overflow: 'hidden',
                    bottom: `${bottomNavHeight}px`,
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
            ModalProps={{ keepMounted: true }}
            slotProps={{
                backdrop: { sx: { bottom: `${bottomNavHeight}px` } },
            }}
        >
            {/* ── Header ── */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                }}
            >
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ width: 36, height: 36 }}
                >
                    <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                </IconButton>
                <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>
                    Search & Filter
                </Typography>
            </Box>

            {/* ── Search input ── */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                <SearchInput
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={onSearchChange}
                    onSearch={handleApply}
                    onClear={onSearchClear}
                    inputProps={{
                        onKeyDown: handleSearchKeyDown,
                        autoFocus: true,
                    }}
                />
            </Box>

            {/* ── Scrollable filter controls ── */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                {children}
            </Box>

            {/* ── Sticky bottom actions ── */}
            <Box
                sx={(t) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: t.palette.background.paper,
                    flexShrink: 0,
                })}
            >
                <Button
                    onClick={onReset}
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 800,
                        color: 'text.secondary',
                        px: 2,
                    }}
                >
                    Reset
                </Button>
                <Button
                    variant="contained"
                    onClick={handleApply}
                    sx={(t) => ({
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 900,
                        px: 3,
                        height: 42,
                        bgcolor: t.palette.primary.main,
                        color: t.palette.common.white,
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: alpha(t.palette.primary.main, 0.92),
                            boxShadow: 'none',
                        },
                    })}
                >
                    Show Results
                </Button>
            </Box>
        </Drawer>
    );
}

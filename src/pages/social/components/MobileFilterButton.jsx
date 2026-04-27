// src/pages/social/components/MobileFilterButton.jsx
//
// MobileFilterButton
// ------------------
// Circular TuneIcon button that sits to the right of the search bar on mobile.
// Mirrors the BusinessHubPage filter icon exactly — same sizing, border,
// background, and active-filter highlight.
//
// Usage:
//   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//       <Box sx={{ flex: 1, minWidth: 0 }}>
//           <SearchInput ... />
//       </Box>
//       <MobileFilterButton
//           hasActiveFilters={activeFilterChips.length > 0}
//           onClick={() => setMobileFilterDrawerOpen(true)}
//       />
//   </Box>

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TuneIcon from '@mui/icons-material/Tune';

export default function MobileFilterButton({ hasActiveFilters = false, onClick }) {
    return (
        <Tooltip title="Search & Filter" arrow>
            <IconButton
                onClick={onClick}
                size="small"
                sx={(t) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: hasActiveFilters
                        ? alpha(t.palette.primary.main, 0.35)
                        : alpha(t.palette.text.primary, 0.12),
                    backgroundColor: hasActiveFilters
                        ? alpha(t.palette.primary.main, 0.08)
                        : alpha(t.palette.text.primary, 0.03),
                    color: hasActiveFilters
                        ? t.palette.primary.main
                        : t.palette.text.secondary,
                    flexShrink: 0,
                })}
                aria-label="Filters"
            >
                <TuneIcon sx={{ fontSize: 20 }} />
            </IconButton>
        </Tooltip>
    );
}

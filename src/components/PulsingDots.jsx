// src/components/PulsingDots.jsx
//
// Shared loading indicator used across all list/grid views
// (posts, groups, services, discover, etc.).
//
// Renders a MUI CircularProgress spinner for consistency
// with other loading states throughout the app.

import React from 'react';
import { Box, CircularProgress } from '@mui/material';

/**
 * PulsingDots — a minimal, theme-aware loading spinner.
 *
 * @param {object}  [props]
 * @param {number}  [props.size=10]       Base size reference (spinner renders at ~3× for visibility)
 * @param {number}  [props.gap]           Ignored — kept for backward compatibility
 * @param {string}  [props.color]         Override spinner color (defaults to theme primary)
 * @param {object}  [props.sx]            Extra sx on the outer container
 */
export default function PulsingDots({ size = 10, gap, color, sx }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                ...sx,
            }}
        >
            <CircularProgress
                size={Math.max(size * 3, 28)}
                thickness={4}
                sx={color ? { color } : undefined}
            />
        </Box>
    );
}

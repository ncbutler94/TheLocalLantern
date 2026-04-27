// frontend/src/components/FooterAttribution.jsx
//
// Tiny text line for your site footer. Gets included on every page that
// might show OSM-sourced data (the safe default is "everywhere"). Meets
// the ODbL visible-attribution requirement when paired with the per-listing
// credit shown by DataSourceAttribution.

import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export default function FooterAttribution() {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 1,
                color: 'text.secondary',
            }}
        >
            <Typography variant="caption">
                Map and business data ©{' '}
                <Link
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="inherit"
                >
                    OpenStreetMap contributors
                </Link>
                {' · '}
                <Link href="/data-sources" underline="hover" color="inherit">
                    About our data
                </Link>
            </Typography>
        </Box>
    );
}

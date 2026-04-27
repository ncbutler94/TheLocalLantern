// frontend/src/pages/DataSourcesPage.jsx
//
// Public-facing page at /data-sources explaining where Local Lantern's
// business listings come from, how claiming works, and the licenses that
// govern the underlying data (primarily OSM's ODbL).
//
// This page exists for three reasons:
//   1. Transparency — helps business owners understand why they have a
//      listing they didn't create and how to take control of it.
//   2. Legal — satisfies attribution obligations in one canonical place
//      that's linked from every unclaimed listing.
//   3. Trust — visitors who want to know "where did this data come from?"
//      have a clear answer instead of wondering.

import React from 'react';
import { Box, Container, Typography, Link, Paper } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';

export default function DataSourcesPage() {
    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                Where our business data comes from
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Local Lantern combines public business data with listings created by owners
                themselves. Here's how it works and how you can take control of your own listing.
            </Typography>

            {/* OSM section */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <MapIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        OpenStreetMap
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                    Much of our basic business information — names, addresses, phone numbers,
                    and websites for unclaimed listings — comes from{' '}
                    <Link
                        href="https://www.openstreetmap.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        OpenStreetMap
                    </Link>
                    , a free, collaborative map of the world maintained by a global community
                    of volunteers. OpenStreetMap data is shared under the{' '}
                    <Link
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Database License (ODbL)
                    </Link>
                    , which permits free commercial and non-commercial use with attribution.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    Unclaimed business listings sourced from OpenStreetMap are credited on the
                    individual listing page, and business information displayed on Local Lantern
                    is{' '}
                    <strong>© OpenStreetMap contributors</strong>
                    {' '}for its OSM-derived portions.
                </Typography>
            </Paper>

            {/* Claim section */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <VerifiedUserIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Claimed listings
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                    Once a business owner claims their listing, they take full control of it.
                    Claimed listings contain owner-provided content: descriptions, photos, hours,
                    services, and any other details the owner chooses to add. This content is
                    owned by the business and is not subject to the licenses that apply to the
                    unclaimed public-data listings.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    If you own a business listed here and want to claim it, use the "Claim This
                    Business" button on the listing itself. We'll verify you own the business
                    and hand over the keys.
                </Typography>
            </Paper>

            {/* Editorial section */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <EditIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Our editorial content
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    Local Lantern sometimes writes short editorial summaries or highlights for
                    unclaimed listings to help visitors understand what a business offers at a
                    glance. This content is our own and is not part of the underlying OSM
                    dataset. We aim to be factual and fair, and if you're the owner of a business
                    with incorrect editorial content, claiming the listing immediately gives you
                    the ability to edit or replace it.
                </Typography>
            </Paper>

            {/* Corrections / removal */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Corrections and removal
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                    If something about your listing is wrong, you have two options:
                </Typography>
                <Box component="ol" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li" variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                        <strong>Claim the listing</strong> — this gives you direct control of
                        what's shown on Local Lantern and replaces the auto-generated information.
                    </Typography>
                    <Typography component="li" variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                        <strong>Fix the public record</strong> — for OSM-sourced listings, you can
                        also edit the underlying OpenStreetMap record directly. This not only
                        updates what appears on Local Lantern on its next refresh, but also fixes
                        the data everywhere else that uses OSM.
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    If you'd like your business removed entirely rather than claimed, contact us
                    and we'll hide the listing from public view.
                </Typography>
            </Paper>

            <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="caption">
                    Map and business data © OpenStreetMap contributors,{' '}
                    <Link
                        href="https://opendatacommons.org/licenses/odbl/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ODbL
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}

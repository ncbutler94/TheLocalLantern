// frontend/src/components/DataSourceAttribution.jsx
//
// Small, unobtrusive credit shown on unclaimed business listings to satisfy
// the attribution requirements of the underlying data sources (primarily
// OpenStreetMap's ODbL license, but also works for Google Places).
//
// Two modes:
//   <DataSourceAttribution dataSource="osm" sourceId="osm/node/12345" />
//     → OSM credit with a "help improve this data" link
//   <DataSourceAttribution dataSource="google" variant="compact" />
//     → Google Places credit (for your existing Google-sourced rows)
//
// Set variant="card" for the tiny badge that goes on directory cards,
// variant="detail" (default) for the full attribution line on detail pages.

import React from 'react';
import { Box, Typography, Link, Chip, Tooltip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Build a link to edit the specific OSM entity, given our synthetic "osm/node/12345" id
function osmEditUrl(sourceId) {
    if (!sourceId || !sourceId.startsWith('osm/')) {
        return 'https://www.openstreetmap.org/';
    }
    const [, type, id] = sourceId.split('/');
    if (!type || !id) return 'https://www.openstreetmap.org/';
    // /edit?node=12345 | /edit?way=12345 | /edit?relation=12345
    return `https://www.openstreetmap.org/edit?${type}=${id}`;
}

function osmViewUrl(sourceId) {
    if (!sourceId || !sourceId.startsWith('osm/')) {
        return 'https://www.openstreetmap.org/';
    }
    const [, type, id] = sourceId.split('/');
    if (!type || !id) return 'https://www.openstreetmap.org/';
    return `https://www.openstreetmap.org/${type}/${id}`;
}

export default function DataSourceAttribution({
                                                  dataSource,
                                                  sourceId,
                                                  variant = 'detail',
                                              }) {
    // Nothing to show for manually-entered or claimed listings
    if (!dataSource || dataSource === 'manual') return null;

    // Small badge mode — for directory cards
    if (variant === 'card') {
        if (dataSource === 'osm') {
            return (
                <Tooltip title="Listing data from OpenStreetMap contributors">
                    <Chip
                        icon={<MapIcon sx={{ fontSize: 12 }} />}
                        label="OSM"
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 18,
                            fontSize: 10,
                            '& .MuiChip-icon': { ml: 0.5 },
                        }}
                    />
                </Tooltip>
            );
        }
        if (dataSource === 'google') {
            return (
                <Tooltip title="Listing data from Google Places">
                    <Chip
                        label="Google"
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                    />
                </Tooltip>
            );
        }
        return null;
    }

    // Full attribution — for detail panel
    if (dataSource === 'osm') {
        return (
            <Box
                sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    color: 'text.secondary',
                }}
            >
                <InfoOutlinedIcon sx={{ fontSize: 16, mt: 0.25, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                    Basic business information sourced from{' '}
                    <Link
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                    >
                        OpenStreetMap contributors
                    </Link>
                    {sourceId && (
                        <>
                            {' '}(
                            <Link
                                href={osmViewUrl(sourceId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                            >
                                view record
                            </Link>
                            )
                        </>
                    )}
                    . See something wrong?{' '}
                    <Link
                        href={sourceId ? osmEditUrl(sourceId) : 'https://www.openstreetmap.org/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                    >
                        Help improve the public record on OSM
                    </Link>
                    , or{' '}
                    <Link href="#" underline="hover" onClick={(e) => {
                        e.preventDefault();
                        // Bubble up — parent can listen for this if it wants
                        // to open the claim flow instead. Otherwise, anchor to top.
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                        claim this business
                    </Link>{' '}
                    to take full control of your listing.
                </Typography>
            </Box>
        );
    }

    if (dataSource === 'google') {
        return (
            <Box
                sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    color: 'text.secondary',
                }}
            >
                <InfoOutlinedIcon sx={{ fontSize: 16, mt: 0.25, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                    Basic business information sourced from Google Places.{' '}
                    <Link href="#" underline="hover" onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                        Claim this business
                    </Link>{' '}
                    to take full control of your listing.
                </Typography>
            </Box>
        );
    }

    return null;
}

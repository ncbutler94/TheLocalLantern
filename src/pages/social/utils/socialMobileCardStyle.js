// src/pages/social/utils/socialMobileCardStyles.js
//
// Mobile-only flat card styles for the Social page feed.
// Mirrors the BusinessPostCard `flat` mode and BusinessHubPage card wrappers.
//
// ─── CARD STYLES ───────────────────────────────────────────────────────────
//
//   import { getFlatCardSx, getActionBarSx } from '../utils/socialMobileCardStyles';
//
//   <Card sx={{ ...existingCardSx, ...getFlatCardSx(isMobile) }}>
//       ...
//       <CardActions sx={getActionBarSx(isMobile)}>
//           <ActionBar ... />
//       </CardActions>
//   </Card>
//
// ─── WRAPPER STYLES ────────────────────────────────────────────────────────
//
//   import { getCardWrapperSx } from '../utils/socialMobileCardStyles';
//
//   {posts.map((p, idx) => (
//       <Box key={p.id} sx={(t) => getCardWrapperSx(t, isMobile)}>
//           <PostCard post={p} flat={isMobile} />
//       </Box>
//   ))}

import { alpha } from '@mui/material/styles';

// ─── Card-level flat styles (mobile only) ──────────────────────────────────
// Strips border, radius, background, and shadow so cards lay flat.
// Returns empty object on desktop so existing styles persist unchanged.

export function getFlatCardSx(isMobile) {
    if (!isMobile) return {};
    return {
        borderRadius: '0 !important',
        border: '0 !important',
        borderColor: 'transparent',
        bgcolor: 'transparent !important',
        background: 'transparent !important',
        backgroundImage: 'none !important',
        boxShadow: 'none !important',
        overflow: 'visible',
    };
}

// ─── Action bar (CardActions) ──────────────────────────────────────────────
// On mobile: removes borderTop line, adjusts padding.
// On desktop: returns original sx or defaults.

export function getActionBarSx(isMobile, existingSx = {}) {
    if (!isMobile) return existingSx;
    return {
        ...existingSx,
        borderTop: 'none',
        borderColor: 'transparent',
        pt: 1.5,
        pb: 0.5,
    };
}

// ─── Card wrapper (Box around each card) ───────────────────────────────────
// On mobile: adds subtle divider between cards (last-child has no divider).
// On desktop: returns only base layout styles.

export function getCardWrapperSx(theme, isMobile) {
    const base = {
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
    };

    if (!isMobile) return base;

    return {
        ...base,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:last-child': {
            borderBottom: 'none',
        },
    };
}

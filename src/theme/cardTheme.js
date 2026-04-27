// src/theme/cardStyles.js
//
// Shared card design tokens.
// Every card component imports from here so avatar sizing, title weight,
// accent-bar behaviour, verified-badge rendering, and chip styling are
// guaranteed to be identical app-wide.
//
// Usage:
//   import { CARD, isVerified, verifiedBadgeSx, accentBarSx, ... } from '../../theme/cardStyles';

import { alpha } from "@mui/material/styles";

/* ─── 1. Avatar sizing ────────────────────────────────────────────────────── */
// Three tiers:
//   PROFILE  – ArtistCard, BusinessDirectoryCard (the entity IS the card)
//   POST     – PostCard, JobCard, ServiceCard, ServiceRequestCard, BusinessPostCard, MusicPostCard
//   COMPACT  – EventCard organizer row, ListingCard seller row (inline mini-avatar)

export const CARD = Object.freeze({
    avatar: {
        profile: { width: 72, height: 72, fontSize: 22, fontWeight: 950 },
        profileResponsive: { width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, fontSize: 22, fontWeight: 950 },
        post: { width: 48, height: 48, fontSize: 15, fontWeight: 700 },
        compact: { width: 30, height: 30, fontSize: 11, fontWeight: 900 },
    },
    title: {
        fontWeight: 800,
        fontSize: "1.05rem",
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
    },
    // Subtitle (poster name on post-type cards)
    subtitle: {
        fontWeight: 700,
        lineHeight: 1.3,
    },
    handle: {
        fontWeight: 600,
        fontSize: "0.78rem",
        lineHeight: 1.2,
    },
    // Accent bar height
    accentHeight: 3,
    // Standard chip sizing
    chip: {
        height: 24,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 11,
    },
    // Verified badge
    verified: {
        profileSize: 16,
        postSize: 15,
        color: "primary.main",
    },
    // Location text in footer area
    location: {
        fontSize: 12,
        fontWeight: 700,
        iconSize: 15,
        color: "primary.main",
    },
});


/* ─── 2. Verified check helper ────────────────────────────────────────────── */
// Works for users, businesses, and artists.
// Backend sends is_verified as 1, "1", true, or boolean.
// Some camelCase variants exist too (isVerified, posterIsVerified, etc.)

export function isVerified(entity, ...extraKeys) {
    if (!entity || typeof entity !== "object") return false;
    const keys = [
        "is_verified",
        "isVerified",
        "posterIsVerified",
        "poster_is_verified",
        ...extraKeys,
    ];
    for (const k of keys) {
        const v = entity[k];
        if (v === true || v === 1 || v === "1") return true;
    }
    return false;
}


/* ─── 3. Accent bar sx helper ─────────────────────────────────────────────── */
// Returns the sx object for the card's ::before accent bar.
// Accepts { selected, hovered, expired, disableHoverEffects }.

export function accentBarSx({ selected = false, hovered = false, expired = false, disableHoverEffects = false } = {}) {
    return {
        "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            height: CARD.accentHeight,
            zIndex: 1,
            backgroundColor: (t) =>
                expired
                    ? t.palette.error.main
                    : selected
                        ? t.palette.secondary.main
                        : t.palette.primary.main,
            transition: (t) => `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
        },
        "&:hover::before": (selected || disableHoverEffects || expired)
            ? {}
            : { backgroundColor: "secondary.main" },
    };
}


/* ─── 4. Common avatar border sx ──────────────────────────────────────────── */

export function avatarBorderSx(t) {
    return {
        border: "2px solid",
        borderColor: alpha(t.palette.text.primary, 0.06),
    };
}


/* ─── 5. Category chip sx factory ─────────────────────────────────────────── */
// Returns a consistent category-chip sx callback for use on any card.

export function categoryChipSx(t) {
    return {
        height: CARD.chip.height,
        borderRadius: CARD.chip.borderRadius,
        fontWeight: CARD.chip.fontWeight,
        fontSize: CARD.chip.fontSize,
        bgcolor: alpha(t.palette.primary.main, 0.08),
        color: t.palette.primary.main,
        border: "1px solid",
        borderColor: alpha(t.palette.primary.main, 0.25),
        "& .MuiChip-icon": { color: t.palette.primary.main, ml: 0.5 },
        "& .MuiChip-label": { px: 0.9, lineHeight: 1 },
        maxWidth: 180,
        overflow: "hidden",
        textOverflow: "ellipsis",
    };
}


/* ─── 6. Card container base sx ───────────────────────────────────────────── */
// Returns the base sx for a Card with accent bar, border, hover, selected state.

export function cardBaseSx({ selected = false, hovered = false, expired = false, disableHoverEffects = false } = {}) {
    const accent = accentBarSx({ selected, hovered, expired, disableHoverEffects });
    return {
        position: "relative",
        isolation: "isolate",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: (t) =>
            selected
                ? alpha(t.palette.secondary.main, 0.80)
                : expired
                    ? t.palette.error.light
                    : alpha(t.palette.text.primary, 0.08),
        bgcolor: (t) =>
            expired
                ? alpha(t.palette.error.light, 0.08)
                : t.palette.background.paper,
        overflow: "hidden",
        boxShadow: (t) =>
            selected
                ? `0 8px 32px ${alpha(t.palette.text.primary, 0.10)}`
                : t.custom?.shadows?.xs || "none",
        transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
        cursor: "pointer",
        "&:hover": (selected || disableHoverEffects)
            ? {}
            : {
                borderColor: (t) => alpha(t.palette.primary.main, 0.25),
                boxShadow: (t) => `0 4px 20px ${alpha(t.palette.text.primary, 0.06)}`,
            },
        ...accent,
    };
}


/* ─── 7. Kebab (more) button sx ───────────────────────────────────────────── */

export function kebabButtonSx(t) {
    return {
        width: { xs: 40, sm: 32 },
        height: { xs: 40, sm: 32 },
        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
        borderRadius: 999,
        "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) },
    };
}


/* ─── 8. Location row sx ──────────────────────────────────────────────────── */
// For the bottom-right location display (icon + label).

export const locationRowSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    px: 2,
    py: 0.75,
};

export function locationClickableSx(t, isClickable) {
    if (!isClickable) return { display: "flex", alignItems: "center", gap: 0.5 };
    return {
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        borderRadius: 1,
        px: 0.5,
        mx: -0.5,
        transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
        "&:hover .loc-icon, &:hover .loc-text": { color: "secondary.main" },
    };
}

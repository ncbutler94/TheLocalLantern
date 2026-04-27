// src/theme.js
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

/**
 * The Local Lantern — "Alabama Lantern" Theme
 *
 * Reworked around the uploaded logo colors:
 *   Crimson  → Alabama flag red
 *   Navy     → Lantern line art / typography
 *   White    → Clean field / background
 *
 * The palette stays polished and readable for the app while
 * making the whole UI feel tied to the logo.
 */

const BRAND = {
    // Core logo colors
    crimson: '#BF0D2E',
    crimsonDark: '#980A24',
    crimsonLight: '#D93A57',
    crimsonPale: '#FCECEF',

    navy: '#0F2D52',
    navyDark: '#0A1F3A',
    navyLight: '#2B4D76',
    navyPale: '#E9EEF5',

    brass: '#A87822',

    white: '#FFFFFF',
    paper: '#FCFCFD',
    mist: '#F3F5F8',
    frost: '#E7EBF1',

    // Text
    ink: '#10233D',
    slate: '#425166',

    // Semantic accents
    success: '#2D7A4B',
    info: '#2D6EA3',
    warning: '#B7791F',
    error: '#C0392B',
};

/* ── Motion tokens (standardized transitions) ───────────────── */
const MOTION = {
    ease: 'cubic-bezier(.2,.8,.2,1)',
    easeOut: 'cubic-bezier(.0,.0,.2,1)',
    easeIn: 'cubic-bezier(.4,.0,1,1)',
    spring: 'cubic-bezier(.34,1.56,.64,1)',
    fast: 120,
    base: 160,
    slow: 220,
    gentle: 320,
    get fadeBase() {
        return `opacity ${this.slow}ms ${this.ease}`;
    },
    get fadeGentle() {
        return `opacity ${this.gentle}ms ${this.ease}`;
    },
    get slideFade() {
        return `opacity ${this.slow}ms ${this.ease}, transform ${this.slow}ms ${this.ease}`;
    },
    get all() {
        return `all ${this.base}ms ${this.ease}`;
    },
    get allSlow() {
        return `all ${this.slow}ms ${this.ease}`;
    },
    get allGentle() {
        return `all ${this.gentle}ms ${this.ease}`;
    },
    staggerDelay: 40,

    contentFade: {
        durationMs: 260,
        get durationSec() { return this.durationMs / 1000; },
        exitDurationMs: 140,
        get exitDurationSec() { return this.exitDurationMs / 1000; },
        offsetY: 6,
        get transition() {
            return `opacity ${this.durationMs}ms cubic-bezier(.2,.8,.2,1), transform ${this.durationMs}ms cubic-bezier(.2,.8,.2,1)`;
        },
        get framer() {
            return {
                duration: this.durationSec,
                ease: [0.2, 0.8, 0.2, 1],
            };
        },
        get framerExit() {
            return {
                duration: this.exitDurationSec,
                ease: [0.4, 0.0, 1, 1],
            };
        },
        get variants() {
            return {
                initial: { opacity: 0, y: this.offsetY },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -4 },
            };
        },
    },

    listStagger: {
        keyframeName: 'listCardFadeIn',
        durationMs: 320,
        easing: 'ease-out',
        offsetY: 8,
        delayPerItem: 40,
        maxDelayMs: 400,
        get keyframesCss() {
            return `@keyframes ${this.keyframeName} {
  from { opacity: 0; transform: translateY(${this.offsetY}px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
        },
    },

    discoverStagger: {
        durationMs: 380,
        easing: 'cubic-bezier(.16,1,.3,1)',
        offsetY: 14,
        scaleFrom: 0.97,
        delayPerItem: 70,
        maxDelayMs: 560,
    },
};

/* ── Brand gradient token (reusable accent) ─────────────────── */
const BRAND_GRADIENT = `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.crimson})`;

/* ── Shadows ────────────────────────────────────────────────── */
const shadow = {
    xs: '0 1px 3px rgba(16, 35, 61, 0.06), 0 1px 2px rgba(16, 35, 61, 0.04)',
    sm: '0 4px 12px rgba(16, 35, 61, 0.08), 0 1px 3px rgba(16, 35, 61, 0.05)',
    md: '0 10px 28px rgba(16, 35, 61, 0.11), 0 4px 10px rgba(16, 35, 61, 0.05)',
    lg: '0 22px 56px rgba(16, 35, 61, 0.15), 0 8px 18px rgba(16, 35, 61, 0.06)',
    glow: (color, intensity = 0.16) => `0 4px 20px ${alpha(color, intensity)}`,
};

const focusRing = () =>
    `0 0 0 2px ${alpha(BRAND.navy, 0.10)}, 0 0 0 4px ${alpha(BRAND.brass, 0.22)}`;

const surfaceBorder = (t) =>
    `1px solid ${alpha(t.palette.text.primary, 0.07)}`;

/* ── Palette ──────────────────────────────────────────────── */
const palette = {
    mode: 'light',
    primary: {
        main: BRAND.navy,
        light: BRAND.navyLight,
        dark: BRAND.navyDark,
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: BRAND.crimson,
        light: BRAND.crimsonLight,
        dark: BRAND.crimsonDark,
        contrastText: '#FFFFFF',
    },
    success: {
        main: BRAND.success,
        light: '#469966',
        dark: '#215F3A',
        contrastText: '#FFFFFF',
    },
    info: {
        main: BRAND.info,
        light: '#4D89BA',
        dark: '#1F527C',
        contrastText: '#FFFFFF',
    },
    warning: {
        main: BRAND.warning,
        light: '#D49B45',
        dark: '#8C5A11',
        contrastText: '#FFFFFF',
    },
    error: {
        main: BRAND.error,
        light: '#D85C50',
        dark: '#962D23',
        contrastText: '#FFFFFF',
    },
    background: {
        default: BRAND.mist,
        paper: BRAND.paper,
    },
    text: {
        primary: BRAND.ink,
        secondary: BRAND.slate,
    },
    divider: alpha(BRAND.navy, 0.10),
    action: {
        hover: alpha(BRAND.navy, 0.045),
        selected: alpha(BRAND.navy, 0.075),
        disabledBackground: alpha(BRAND.navy, 0.06),
        focus: alpha(BRAND.brass, 0.18),
    },
    grey: {
        50: '#FAFBFC',
        100: '#F3F5F8',
        200: '#E7EBF1',
        300: '#D6DDE6',
        400: '#B4BFCC',
        500: '#8E9AAC',
        600: '#6D788A',
        700: '#4E596B',
        800: '#2F3B4E',
        900: '#162235',
    },
};

/* ── Theme ────────────────────────────────────────────────── */
let theme = createTheme({
    palette,
    shape: { borderRadius: 10 },

    custom: {
        shadows: shadow,
        brand: BRAND,
        motion: MOTION,
        brandGradient: BRAND_GRADIENT,
        elevation: {
            surface: shadow.xs,
            raised: shadow.sm,
            floating: shadow.md,
        },
        postCard: {
            borderRadius: 12,
            minHeight: { xs: 360, sm: 350, md: 340 },
        },

        profileSubTabs: {
            minHeight: { xs: 48, sm: 56 },
            tab: {
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '-0.01em',
                unselectedOpacity: 0.85,
                iconUnselectedOpacity: 0.7,
            },
            indicator: {
                height: 3,
                borderRadius: '3px 3px 0 0',
            },
        },

        profileFilterBar: {
            pt: 1.5,
            pb: 1,
            px: 1.5,
            gap: 1,
            borderOpacity: 0.08,
            bgOpacity: 0.025,
            inputBorderOpacity: 0.2,
            inputBorderHoverOpacity: 0.38,
        },

        social: {
            facebook: '#1877F2',
            instagram: '#E4405F',
            x: '#000000',
        },

        /* ── Post detail panel tokens (Community / Business / Music) ── */
        postDetail: {
            authorName: { fontWeight: 800, lineHeight: 1.3 },
            authorHandle: { fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.3 },
            title: { fontWeight: 900, lineHeight: 1.25 },
            body: { lineHeight: 1.6 },
            commentsHeading: { fontWeight: 700 },
            locationText: { fontWeight: 700, lineHeight: 1.3 },
            locationSecondary: { fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3 },
            locationIcon: { fontSize: 18, mt: '2px' },
            viewPageButton: { py: 1, borderRadius: 2, fontWeight: 800, fontSize: 14 },
            noCommentsText: { color: 'text.secondary', fontWeight: 700, fontSize: '0.85rem' },
            noCommentsIcon: { fontSize: 36, color: BRAND.navy, mb: 1 },
        },
        categories: {
            announcement: '#B3203D',
            discussion: '#1F4F82',
            tips: '#7A5A2A',
            helpRequests: '#2F6F89',
            lostFound: '#D17B17',
            safety: '#C0392B',
        },
        map: {
            tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
            containerBg: BRAND.mist,
            containerGlow: [
                `radial-gradient(900px 420px at 12% 8%, ${alpha(BRAND.crimson, 0.08)} 0%, transparent 58%)`,
                `radial-gradient(820px 420px at 92% 0%, ${alpha(BRAND.navy, 0.08)} 0%, transparent 62%)`,
            ].join(', '),
            countyBorder: alpha(BRAND.ink, 0.12),
            countyBorderWeight: 1,
            countyFill: alpha(BRAND.paper, 0.95),
            stateBorder: alpha(BRAND.navyDark, 0.25),
            stateBorderWeight: 2.5,
            maskFill: BRAND.mist,
            maskOpacity: 0.9,
            maskBorder: alpha(BRAND.ink, 0.08),
            countyLabelColor: alpha(BRAND.slate, 0.52),
            countyLabelSize: 10,
            cityLabelColor: alpha(BRAND.slate, 0.58),
            cityLabelSize: 10,
            cityLabelShadow: `0 1px 0 ${alpha(BRAND.white, 0.9)}`,
            placeOutline: alpha(BRAND.ink, 0.10),
            popupRadius: 14,
            popupShadow: `0 16px 48px ${alpha(BRAND.ink, 0.16)}`,
            popupCloseBtnShadow: `0 8px 18px ${alpha(BRAND.ink, 0.12)}`,
            chipBg: alpha(BRAND.white, 0.84),
            chipBorder: alpha(BRAND.ink, 0.09),
            chipBackdrop: 'blur(6px)',
            defaultCenter: [32.69, -86.79113],
            defaultZoom: 7.5,
            focusZoom: 10,
            maxZoom: 18,
            panOffsetPx: 50,
        },
    },

    typography: {
        fontFamily: [
            "'Inter'",
            "'SF Pro Display'",
            "'Segoe UI'",
            'Roboto',
            "'Helvetica Neue'",
            'Arial',
            'system-ui',
            '-apple-system',
            'sans-serif',
        ].join(','),

        h1: { fontWeight: 750, letterSpacing: '-0.032em', lineHeight: 1.1 },
        h2: { fontWeight: 720, letterSpacing: '-0.025em', lineHeight: 1.15 },
        h3: { fontWeight: 680, letterSpacing: '-0.018em', lineHeight: 1.22 },
        h4: { fontWeight: 660, letterSpacing: '-0.012em', lineHeight: 1.26 },
        h5: { fontWeight: 640, letterSpacing: '-0.008em', lineHeight: 1.32 },
        h6: { fontWeight: 620, letterSpacing: '-0.004em', lineHeight: 1.36 },

        button: {
            fontWeight: 620,
            textTransform: 'none',
            letterSpacing: '0.01em',
            fontSize: '0.875rem',
        },

        subtitle1: { fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.003em' },
        subtitle2: { fontWeight: 600, lineHeight: 1.4, fontSize: '0.8125rem', letterSpacing: '0.003em' },

        body1: { lineHeight: 1.6, letterSpacing: '0.005em', fontWeight: 400 },
        body2: { lineHeight: 1.55, letterSpacing: '0.005em', fontWeight: 400, fontSize: '0.875rem' },

        caption: {
            color: palette.text.secondary,
            lineHeight: 1.5,
            fontSize: '0.75rem',
            fontWeight: 450,
            letterSpacing: '0.01em',
        },
        overline: {
            fontWeight: 650,
            letterSpacing: '0.08em',
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            color: palette.text.secondary,
        },
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: (t) => ({
                html: { fontSize: '100%' },
                '@media (min-width: 1200px)': {
                    html: { fontSize: '93.75%' },
                },

                'html, body, #root': {
                    height: '100%',
                    backgroundColor: t.palette.background.default,
                    color: t.palette.text.primary,
                },

                body: {
                    textRendering: 'optimizeLegibility',
                    MozOsxFontSmoothing: 'grayscale',
                    WebkitFontSmoothing: 'antialiased',
                    backgroundImage: `
                        linear-gradient(180deg,
                            ${alpha(BRAND.white, 0.8)} 0%,
                            ${t.palette.background.default} 52%,
                            ${t.palette.background.default} 100%
                        )
                    `,
                    backgroundAttachment: 'fixed',
                },

                '@media (pointer: coarse)': {
                    body: { backgroundAttachment: 'scroll' },
                },

                '*': { WebkitTapHighlightColor: 'transparent' },
                '::selection': {
                    background: alpha(BRAND.brass, 0.25),
                    color: BRAND.ink,
                },

                '*::-webkit-scrollbar': { width: 6, height: 6 },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(BRAND.ink, 0.14),
                    borderRadius: 999,
                    border: '1px solid transparent',
                    backgroundClip: 'padding-box',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: alpha(BRAND.ink, 0.24),
                },
                '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },

                ':focus-visible': {
                    outline: 'none',
                    boxShadow: focusRing(),
                    borderRadius: t.shape.borderRadius,
                },
            }),
        },

        MuiPaper: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundImage: 'none',
                    borderRadius: t.shape.borderRadius,
                    border: surfaceBorder(t),
                }),
                outlined: ({ theme: t }) => ({
                    borderColor: alpha(t.palette.text.primary, 0.08),
                    boxShadow: 'none',
                }),
            },
        },

        MuiCard: {
            variants: [
                {
                    props: { variant: 'post' },
                    style: ({ theme: t }) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        minHeight: t.custom?.postCard?.minHeight?.xs ?? 360,
                        [t.breakpoints.up('sm')]: {
                            minHeight: t.custom?.postCard?.minHeight?.sm ?? 350,
                        },
                        [t.breakpoints.up('md')]: {
                            minHeight: t.custom?.postCard?.minHeight?.md ?? 340,
                        },
                        height: 'auto',
                        position: 'relative',
                        isolation: 'isolate',
                        borderRadius: t.custom?.postCard?.borderRadius || 12,
                        border: '1px solid',
                        borderColor: alpha(t.palette.text.primary, 0.07),
                        backgroundColor: t.palette.background.paper,
                        overflow: 'hidden',
                        boxShadow: 'none',
                        transition: `box-shadow ${MOTION.slow}ms ${MOTION.ease}, border-color ${MOTION.slow}ms ${MOTION.ease}`,

                        '&:hover, &[data-hovered="true"]': {
                            boxShadow: shadow.sm,
                        },

                        '&[data-selected="true"]': {
                            boxShadow: shadow.md,
                            borderColor: alpha(BRAND.crimson, 0.28),
                        },

                        '&[data-top-accent="true"]::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            right: 0,
                            height: 2,
                            background: BRAND_GRADIENT,
                            borderRadius: '2px 2px 0 0',
                            opacity: 0,
                            transition: `opacity ${MOTION.slow}ms ${MOTION.ease}`,
                        },
                        '&[data-top-accent="true"]:hover::before, &[data-top-accent="true"][data-selected="true"]::before, &[data-top-accent="true"][data-hovered="true"]::before': {
                            opacity: 1,
                        },
                    }),
                },
            ],
            styleOverrides: {
                root: ({ theme: t }) => ({
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: t.shape.borderRadius + 2,
                    border: surfaceBorder(t),
                    backgroundColor: t.palette.background.paper,
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    transition: `box-shadow ${MOTION.slow}ms ${MOTION.ease}, border-color ${MOTION.slow}ms ${MOTION.ease}`,

                    '&:hover': {
                        boxShadow: shadow.sm,
                    },

                    '&:focus-within': {
                        borderColor: alpha(BRAND.crimson, 0.22),
                        boxShadow: shadow.xs,
                    },
                }),
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, 0.82),
                    backdropFilter: 'saturate(1.4) blur(20px)',
                    WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    color: t.palette.text.primary,
                    boxShadow: 'none',
                    borderBottom: `1px solid ${alpha(BRAND.ink, 0.07)}`,
                }),
            },
        },

        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: 56,
                    '@media (min-width: 600px)': { minHeight: 60 },
                },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme: t }) => ({
                    backgroundImage: 'none',
                    backgroundColor: t.palette.background.paper,
                    borderRight: `1px solid ${alpha(t.palette.text.primary, 0.07)}`,
                }),
            },
        },

        MuiBottomNavigation: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, 0.88),
                    backdropFilter: 'saturate(1.4) blur(20px)',
                    WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    borderTop: `1px solid ${alpha(BRAND.ink, 0.07)}`,
                }),
            },
        },

        MuiBottomNavigationAction: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    '&.Mui-selected': { color: t.palette.primary.main },
                }),
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderColor: alpha(t.palette.text.primary, 0.07),
                }),
            },
        },

        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    paddingInline: 18,
                    paddingTop: 8,
                    paddingBottom: 8,
                    minHeight: 38,
                    '@media (min-width: 1200px)': {
                        paddingInline: 16,
                        paddingTop: 7,
                        paddingBottom: 7,
                        minHeight: 36,
                    },
                    fontWeight: 620,
                    letterSpacing: '0.01em',
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, opacity ${MOTION.base}ms ${MOTION.ease}`,
                    '&:active': { opacity: 0.85 },
                    '&:focus-visible': { boxShadow: focusRing() },
                    '&.Mui-disabled': { opacity: 1 },
                }),

                contained: ({ theme: t }) => ({
                    '&.Mui-disabled': {
                        backgroundImage: 'none !important',
                        backgroundColor: `${alpha(t.palette.primary.main, 0.25)} !important`,
                        color: '#FFFFFF !important',
                        boxShadow: 'none !important',
                        filter: 'none !important',
                    },
                }),

                containedPrimary: ({ theme: t }) => ({
                    backgroundColor: t.palette.primary.main,
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: BRAND.brass,
                        boxShadow: shadow.xs,
                    },
                }),

                containedSecondary: ({ theme: t }) => ({
                    backgroundColor: t.palette.secondary.main,
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: BRAND.brass,
                        boxShadow: shadow.xs,
                    },
                }),

                outlined: ({ theme: t }) => ({
                    borderColor: alpha(t.palette.text.primary, 0.14),
                    '&:hover': {
                        borderColor: alpha(BRAND.brass, 0.45),
                        backgroundColor: alpha(BRAND.brass, 0.06),
                    },
                }),

                text: () => ({
                    '&:hover': { backgroundColor: alpha(BRAND.brass, 0.08) },
                }),
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': {
                        backgroundColor: alpha(BRAND.brass, 0.10),
                    },
                    '&:active': { backgroundColor: alpha(BRAND.brass, 0.16) },
                    '&:focus-visible': { boxShadow: focusRing() },
                }),
            },
        },

        MuiFab: {
            styleOverrides: {
                root: () => ({
                    boxShadow: shadow.md,
                    '&:hover': {
                        boxShadow: shadow.lg,
                    },
                }),
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: '#FFFFFF',
                    transition: `box-shadow ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}`,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(t.palette.text.primary, 0.12),
                        transition: `border-color ${MOTION.base}ms ${MOTION.ease}`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(BRAND.navy, 0.26),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${alpha(BRAND.brass, 0.52)} !important`,
                        borderWidth: '1px !important',
                    },
                    '&.Mui-focused': {
                        boxShadow: 'none',
                        outline: 'none',
                    },
                    '& textarea:focus, & input:focus': {
                        outline: 'none',
                        boxShadow: 'none',
                    },
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                        borderColor: t.palette.error.main,
                    },
                }),
                input: {
                    paddingTop: 11,
                    paddingBottom: 11,
                    '@media (min-width: 1200px)': {
                        paddingTop: 9,
                        paddingBottom: 9,
                    },
                },
            },
        },

        MuiFilledInput: {
            styleOverrides: {
                root: () => ({
                    borderRadius: '10px 10px 0 0',
                    backgroundColor: alpha(BRAND.navy, 0.035),
                    '&:hover': { backgroundColor: alpha(BRAND.navy, 0.055) },
                    '&.Mui-focused': { backgroundColor: alpha(BRAND.navy, 0.045) },
                }),
            },
        },

        MuiInputLabel: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    fontWeight: 500,
                    '&.Mui-focused': { color: t.palette.primary.main },
                    '&.MuiInputLabel-shrink': {
                        backgroundColor: '#FFFFFF',
                        padding: '0 6px',
                        borderRadius: t.shape.borderRadius / 2,
                        lineHeight: 1.15,
                    },
                }),
            },
        },

        MuiSelect: {
            styleOverrides: {
                icon: ({ theme: t }) => ({ color: t.palette.text.secondary }),
            },
        },

        MuiTabs: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    minHeight: 'unset',
                    padding: 3,
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: alpha(BRAND.navy, 0.04),
                    border: 'none',
                    boxShadow: 'none',
                }),
                indicator: ({ theme: t }) => ({
                    height: 2,
                    borderRadius: 999,
                    backgroundColor: t.palette.secondary.main,
                }),
            },
        },

        MuiTab: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    textTransform: 'none',
                    fontWeight: 580,
                    fontSize: '0.8125rem',
                    color: t.palette.text.secondary,
                    minHeight: 'unset',
                    borderRadius: t.shape.borderRadius - 2,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingInline: 14,
                    zIndex: 1,
                    transition: `color ${MOTION.base}ms ${MOTION.ease}, background-color ${MOTION.base}ms ${MOTION.ease}`,
                    '@media (min-width: 1200px)': {
                        paddingTop: 7,
                        paddingBottom: 7,
                        paddingInline: 12,
                    },
                    '&:hover': {
                        color: t.palette.text.primary,
                        backgroundColor: alpha(BRAND.navy, 0.04),
                    },
                    '&.Mui-selected': {
                        color: t.palette.primary.dark,
                        fontWeight: 620,
                    },
                    '&:focus-visible': { boxShadow: focusRing() },
                }),
            },
        },

        MuiChip: {
            styleOverrides: {
                root: ({ theme: t, ownerState }) => ({
                    borderRadius: t.shape.borderRadius - 2,
                    fontWeight: 580,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                    backgroundColor: alpha(t.palette.text.primary, 0.03),
                    color: t.palette.text.secondary,
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                    '& .MuiChip-icon': {
                        color: t.palette.text.secondary,
                        transition: `color ${MOTION.base}ms ${MOTION.ease}`,
                    },

                    ...(ownerState?.clickable && {
                        '&:hover': {
                            boxShadow: shadow.xs,
                            borderColor: alpha(t.palette.text.primary, 0.13),
                        },
                        '&:active': {
                            backgroundColor: alpha(t.palette.text.primary, 0.06),
                        },
                    }),

                    ...(ownerState?.color === 'primary' && {
                        backgroundColor: alpha(BRAND.navy, 0.07),
                        borderColor: alpha(BRAND.navy, 0.16),
                        color: BRAND.navyDark,
                        '& .MuiChip-icon': { color: BRAND.navy },
                        ...(ownerState?.clickable && {
                            '&:hover': {
                                backgroundColor: alpha(BRAND.navy, 0.11),
                                borderColor: alpha(BRAND.navy, 0.26),
                            },
                        }),
                    }),

                    ...(ownerState?.color === 'secondary' && {
                        backgroundColor: alpha(BRAND.crimson, 0.08),
                        borderColor: alpha(BRAND.crimson, 0.18),
                        color: BRAND.crimsonDark,
                        '& .MuiChip-icon': { color: BRAND.crimson },
                        ...(ownerState?.clickable && {
                            '&:hover': {
                                backgroundColor: alpha(BRAND.crimson, 0.14),
                                borderColor: alpha(BRAND.crimson, 0.30),
                            },
                        }),
                    }),

                    ...(ownerState?.color === 'success' && {
                        backgroundColor: alpha(t.palette.success.main, 0.07),
                        borderColor: alpha(t.palette.success.main, 0.16),
                        color: t.palette.success.dark,
                        '& .MuiChip-icon': { color: t.palette.success.main },
                    }),

                    ...(ownerState?.color === 'info' && {
                        backgroundColor: alpha(t.palette.info.main, 0.07),
                        borderColor: alpha(t.palette.info.main, 0.16),
                        color: t.palette.info.dark,
                        '& .MuiChip-icon': { color: t.palette.info.main },
                    }),

                    ...(ownerState?.color === 'warning' && {
                        backgroundColor: alpha(t.palette.warning.main, 0.08),
                        borderColor: alpha(t.palette.warning.main, 0.18),
                        color: t.palette.warning.dark,
                        '& .MuiChip-icon': { color: t.palette.warning.main },
                    }),

                    ...(ownerState?.color === 'error' && {
                        backgroundColor: alpha(BRAND.error, 0.07),
                        borderColor: alpha(BRAND.error, 0.16),
                        color: BRAND.error,
                        '& .MuiChip-icon': { color: BRAND.error },
                    }),

                    ...(ownerState?.variant === 'outlined' && {
                        backgroundColor: 'transparent',
                    }),
                }),
            },
        },

        MuiDialog: {
            defaultProps: {
                slotProps: {
                    backdrop: {
                        onClick: (e) => e.stopPropagation(),
                    },
                },
            },
            styleOverrides: {
                paper: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius + 4,
                    border: surfaceBorder(t),
                    boxShadow: shadow.lg,
                    backgroundImage: 'none',
                    backgroundColor: t.palette.background.paper,
                }),
            },
        },

        MuiDialogContent: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    '&.MuiDialogContent-dividers': {
                        borderColor: alpha(t.palette.text.primary, 0.07),
                    },
                }),
            },
        },

        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '12px 24px 16px',
                    gap: 8,
                },
            },
        },

        MuiMenu: {
            defaultProps: {
                slotProps: {
                    backdrop: {
                        onClick: (e) => e.stopPropagation(),
                    },
                },
            },
            styleOverrides: {
                paper: ({ theme: t }) => ({
                    backgroundImage: 'none',
                    backgroundColor: t.palette.background.paper,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.07)}`,
                    boxShadow: shadow.md,
                    borderRadius: t.shape.borderRadius,
                }),
                list: { paddingTop: 4, paddingBottom: 4 },
            },
        },

        MuiMenuItem: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius - 3,
                    marginInline: 4,
                    paddingInline: 12,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                        backgroundColor: alpha(BRAND.navy, 0.07),
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.10) },
                    },
                }),
            },
        },

        MuiPopover: {
            defaultProps: {
                slotProps: {
                    backdrop: {
                        onClick: (e) => e.stopPropagation(),
                    },
                },
            },
            styleOverrides: {
                paper: ({ theme: t }) => ({
                    backgroundImage: 'none',
                    backgroundColor: t.palette.background.paper,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.07)}`,
                    boxShadow: shadow.md,
                    borderRadius: t.shape.borderRadius,
                }),
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: () => ({
                    borderRadius: 6,
                    backgroundColor: BRAND.ink,
                    color: BRAND.white,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    boxShadow: shadow.sm,
                    padding: '5px 10px',
                    border: 'none',
                }),
                arrow: () => ({ color: BRAND.ink }),
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    boxShadow: 'none',
                    border: `1px solid ${alpha(t.palette.text.primary, 0.07)}`,
                    '& .MuiAlert-icon': { alignItems: 'center' },
                }),
                standardSuccess: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.success.main, 0.07),
                    borderColor: alpha(t.palette.success.main, 0.14),
                }),
                standardInfo: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.info.main, 0.07),
                    borderColor: alpha(t.palette.info.main, 0.14),
                }),
                standardWarning: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.warning.main, 0.07),
                    borderColor: alpha(t.palette.warning.main, 0.14),
                }),
                standardError: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.error.main, 0.07),
                    borderColor: alpha(t.palette.error.main, 0.14),
                }),
            },
        },

        MuiSnackbarContent: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    boxShadow: shadow.md,
                    backgroundColor: t.palette.grey[800],
                }),
            },
        },

        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    height: 4,
                    backgroundColor: alpha(BRAND.navy, 0.10),
                    overflow: 'hidden',
                },
                bar: {
                    borderRadius: 999,
                    backgroundColor: BRAND.crimson,
                    transition: `transform ${MOTION.gentle}ms ${MOTION.ease}`,
                },
            },
        },

        MuiAvatar: {
            styleOverrides: {
                root: () => ({
                    backgroundColor: alpha(BRAND.navy, 0.08),
                    color: BRAND.navyDark,
                    fontWeight: 620,
                    border: `1.5px solid ${alpha(BRAND.navy, 0.10)}`,
                    transition: `border-color ${MOTION.base}ms ${MOTION.ease}`,
                }),
            },
        },

        MuiBadge: {
            styleOverrides: {
                colorPrimary: ({ theme: t }) => ({
                    backgroundColor: BRAND.navy,
                    color: '#FFFFFF',
                    boxShadow: `0 0 0 2px ${t.palette.background.paper}`,
                }),
                colorSecondary: ({ theme: t }) => ({
                    backgroundColor: BRAND.crimson,
                    color: '#FFFFFF',
                    boxShadow: `0 0 0 2px ${t.palette.background.paper}`,
                }),
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: () => ({
                    borderRadius: 10,
                    '&.Mui-selected': {
                        backgroundColor: alpha(BRAND.navy, 0.07),
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.10) },
                    },
                }),
            },
        },

        MuiSkeleton: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: alpha(t.palette.text.primary, 0.04),
                    '&::after': {
                        animationDuration: '1.8s',
                        background: `linear-gradient(90deg, transparent, ${alpha(t.palette.text.primary, 0.03)}, transparent)`,
                    },
                }),
            },
        },

        MuiTableCell: {
            styleOverrides: {
                head: ({ theme: t }) => ({
                    fontWeight: 620,
                    fontSize: '0.8125rem',
                    color: t.palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'transparent',
                    borderBottomColor: alpha(t.palette.text.primary, 0.09),
                }),
                body: ({ theme: t }) => ({
                    borderBottomColor: alpha(t.palette.text.primary, 0.06),
                }),
            },
        },

        MuiCheckbox: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: 4,
                    '&.Mui-checked': { color: t.palette.secondary.main },
                    '&.MuiCheckbox-indeterminate': { color: t.palette.secondary.main },
                    '&:focus-visible': { boxShadow: focusRing() },
                }),
            },
        },

        MuiRadio: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    '&.Mui-checked': { color: t.palette.secondary.main },
                    '&:focus-visible': { boxShadow: focusRing() },
                }),
            },
        },

        MuiSwitch: {
            styleOverrides: {
                root: { width: 44, height: 26, padding: 0, borderRadius: 999 },
                switchBase: ({ theme: t }) => ({
                    padding: 3,
                    '&.Mui-checked': {
                        transform: 'translateX(18px)',
                        color: '#FFF',
                        '& + .MuiSwitch-track': {
                            backgroundColor: t.palette.secondary.main,
                            opacity: 1,
                        },
                    },
                    '&:focus-visible': { boxShadow: focusRing() },
                }),
                track: () => ({
                    borderRadius: 999,
                    backgroundColor: alpha(BRAND.ink, 0.14),
                    opacity: 1,
                }),
                thumb: { width: 20, height: 20, boxShadow: shadow.xs },
            },
        },

        MuiSlider: {
            styleOverrides: {
                root: {
                    '& .MuiSlider-thumb': {
                        boxShadow: shadow.xs,
                        '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0 0 0 6px ${alpha(BRAND.crimson, 0.14)}`,
                        },
                    },
                    '& .MuiSlider-track': {
                        border: 'none',
                    },
                },
            },
        },

        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: 16,
                    paddingRight: 16,
                    '@media (min-width: 600px)': {
                        paddingLeft: 24,
                        paddingRight: 24,
                    },
                },
            },
        },

        MuiBreadcrumbs: {
            styleOverrides: {
                separator: ({ theme: t }) => ({ color: t.palette.text.secondary }),
            },
        },

        MuiAccordion: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    border: surfaceBorder(t),
                    borderRadius: `${t.shape.borderRadius}px !important`,
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                        margin: 0,
                        boxShadow: 'none',
                        borderColor: alpha(t.palette.text.primary, 0.11),
                    },
                }),
            },
        },

        MuiToggleButtonGroup: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.09)}`,
                }),
            },
        },

        MuiToggleButton: {
            styleOverrides: {
                root: () => ({
                    textTransform: 'none',
                    fontWeight: 580,
                    '&.Mui-selected': {
                        backgroundColor: alpha(BRAND.navy, 0.08),
                        color: BRAND.navyDark,
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.11) },
                    },
                }),
            },
        },

        MuiPagination: {
            styleOverrides: {
                root: {
                    '& .MuiPaginationItem-root': { borderRadius: 999 },
                },
            },
        },

        MuiLink: {
            defaultProps: { underline: 'none' },
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.primary.main,
                    fontWeight: 580,
                    textDecoration: 'none',
                    transition: `color ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': {
                        color: t.palette.secondary.main,
                        textDecoration: 'underline',
                        textDecorationColor: alpha(t.palette.secondary.main, 0.35),
                        textUnderlineOffset: '3px',
                    },
                    '&:focus-visible': {
                        outline: 'none',
                        boxShadow: focusRing(),
                        borderRadius: t.shape.borderRadius / 2,
                    },
                }),
            },
        },
    },
});

theme = responsiveFontSizes(theme);

/* ── List-stagger keyframe injection + sx helper ─────────── */
let _listStaggerInjected = false;
export function ensureListStaggerKeyframes() {
    if (_listStaggerInjected) return;
    _listStaggerInjected = true;
    const style = document.createElement('style');
    style.textContent = MOTION.listStagger.keyframesCss;
    document.head.appendChild(style);
}

/**
 * Returns an sx-compatible object that applies the stagger animation
 * to a list item at the given index.
 *
 * @param {number} idx  Zero-based index of the item in the list
 * @returns {{ animation: string, animationDelay: string }}
 */
export function getListStaggerSx(idx) {
    const ls = MOTION.listStagger;
    return {
        animation: `${ls.keyframeName} ${ls.durationMs}ms ${ls.easing} both`,
        animationDelay: `${Math.min(idx * ls.delayPerItem, ls.maxDelayMs)}ms`,
    };
}

/**
 * Returns an sx object for discover-panel spotlight stagger.
 * Uses CSS transitions driven by a `revealed` boolean.
 *
 * @param {number} idx       Zero-based item index
 * @param {boolean} revealed Whether items should be visible
 * @returns {object}         MUI sx-compatible style object
 */
export function getDiscoverStaggerSx(idx, revealed) {
    const ds = MOTION.discoverStagger;
    const delay = Math.min(idx * ds.delayPerItem, ds.maxDelayMs);
    return {
        opacity: revealed ? 1 : 0,
        transform: revealed
            ? 'translateY(0) scale(1)'
            : `translateY(${ds.offsetY}px) scale(${ds.scaleFrom})`,
        transition: `opacity ${ds.durationMs}ms ${ds.easing} ${delay}ms, transform ${ds.durationMs}ms ${ds.easing} ${delay}ms`,
        willChange: 'opacity, transform',
    };
}

/**
 * Returns Tabs `sx` for profile sub-tabs (Community, Events).
 * Uses theme tokens from `custom.profileSubTabs`.
 * Usage: <Tabs sx={getProfileSubTabsSx} ... >
 */
export function getProfileSubTabsSx(t) {
    const cfg = t.custom.profileSubTabs;
    const m = t.custom.motion;
    return {
        minHeight: cfg.minHeight,
        '& .MuiTab-root': {
            minHeight: cfg.minHeight,
            minWidth: 0,
            px: 1,
            py: { xs: 0.75, sm: 1 },
            textTransform: 'none',
            fontWeight: cfg.tab.fontWeight,
            fontSize: cfg.tab.fontSize,
            letterSpacing: cfg.tab.letterSpacing,
            borderRadius: 0,
            color: alpha(t.palette.primary.main, cfg.tab.unselectedOpacity),
            transition: `color ${m.base}ms ${m.ease}`,
            '& .MuiTab-iconWrapper': {
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center',
            },
            '& .MuiSvgIcon-root': {
                color: alpha(t.palette.primary.main, cfg.tab.iconUnselectedOpacity),
                transition: `color ${m.fast}ms ${m.ease}, transform ${m.fast}ms ${m.ease}`,
            },
            '&.Mui-selected': {
                color: t.palette.primary.main,
            },
            '&.Mui-selected .MuiSvgIcon-root': {
                color: t.palette.secondary.main,
            },
            '&:hover .MuiSvgIcon-root': {
                color: t.palette.secondary.main,
                transform: 'translateY(-1px)',
            },
            '& .llTabIcon': {
                color: alpha(t.palette.primary.main, cfg.tab.iconUnselectedOpacity),
                transition: `color ${m.fast}ms ${m.ease}`,
            },
            '&:hover .llTabIcon': {
                color: t.palette.secondary.main,
            },
            '&.Mui-selected .llTabIcon': {
                color: t.palette.secondary.main,
            },
        },
        '& .MuiTabs-indicator': {
            height: cfg.indicator.height,
            borderRadius: cfg.indicator.borderRadius,
            backgroundColor: t.palette.secondary.main,
        },
    };
}

/**
 * Returns Box `sx` for profile filter bar rows.
 * Uses theme tokens from `custom.profileFilterBar`.
 * Usage: <Box sx={(t) => getProfileFilterBarSx(t, columns)} ... >
 * @param {object} t - MUI theme
 * @param {object} [columns] - gridTemplateColumns override
 */
export function getProfileFilterBarSx(t, columns) {
    const cfg = t.custom.profileFilterBar;
    return {
        px: cfg.px,
        pt: cfg.pt,
        pb: cfg.pb,
        borderBottom: '1px solid',
        borderColor: alpha(t.palette.primary.main, cfg.borderOpacity),
        bgcolor: alpha(t.palette.primary.main, cfg.bgOpacity),
        display: 'grid',
        gap: cfg.gap,
        gridTemplateColumns: columns || { xs: '1fr', sm: '1fr 1fr' },
    };
}

/**
 * Returns Select `sx` for profile filter dropdowns.
 * Uses theme tokens from `custom.profileFilterBar`.
 */
export function getProfileSelectSx(t) {
    const cfg = t.custom.profileFilterBar;
    return {
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(t.palette.primary.main, cfg.inputBorderOpacity),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(t.palette.primary.main, cfg.inputBorderHoverOpacity),
        },
    };
}

/* ── Theme-adaptive colour helpers ────────────────────────────────
 *  Admin-chosen colours (accent, highlight, badge, spotlight) are stored
 *  as fixed hex values.  They can be invisible on a theme whose mode
 *  differs from the one the admin was using when they picked the colour.
 *
 *  adaptColor(hex, muiTheme)  returns a CSS colour string that is
 *  guaranteed to be readable on the current theme's background.
 *
 *  adaptBgColor(hex, muiTheme) — same but tuned for background colours.
 * ─────────────────────────────────────────────────────────────── */
function _hexToHsl(hex) {
    const h = hex.replace('#', '');
    let r = parseInt(h.substring(0, 2), 16) / 255;
    let g = parseInt(h.substring(2, 4), 16) / 255;
    let b = parseInt(h.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0, sat = 0, lit = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        sat = lit > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) hue = ((b - r) / d + 2) / 6;
        else hue = ((r - g) / d + 4) / 6;
    }
    return [hue * 360, sat * 100, lit * 100];
}

function _hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function adaptColor(hex, muiTheme) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
    const isDark = muiTheme?.palette?.mode === 'dark';
    const [h, s, l] = _hexToHsl(hex);

    if (isDark) {
        if (l < 40) {
            const newL = 40 + (l / 40) * 15;
            const newS = Math.min(s, 85);
            return _hslToHex(h, newS, newL);
        }
    } else {
        if (l > 75) {
            const newL = 75 - ((l - 75) / 25) * 30;
            return _hslToHex(h, s, newL);
        }
    }
    return hex;
}

export function adaptBgColor(hex, muiTheme) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
    const isDark = muiTheme?.palette?.mode === 'dark';
    const [h, s, l] = _hexToHsl(hex);

    if (isDark) {
        if (l > 35) {
            const newL = 10 + (l / 100) * 20;
            const newS = Math.min(s, 60);
            return _hslToHex(h, newS, newL);
        }
    } else {
        if (l < 65) {
            const newL = 88 + ((100 - l) / 100) * 8;
            const newS = Math.min(s, 40);
            return _hslToHex(h, newS, newL);
        }
    }
    return hex;
}

export default theme;

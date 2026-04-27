// src/themeDark.js
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

/**
 * The Local Lantern — "Alabama Lantern" Dark Theme
 *
 * Dark-mode counterpart to the light theme.
 * Same brand DNA (Crimson, Navy, Brass) but remapped for
 * dark surfaces so contrast and readability stay strong.
 */

const BRAND = {
    // Core logo colors – brightened for dark backgrounds
    crimson: '#E0354F',
    crimsonDark: '#BF0D2E',
    crimsonLight: '#F06680',
    crimsonPale: '#3A1520',

    navy: '#5A8ABF',
    navyDark: '#3D6A9E',
    navyLight: '#8BB4DE',
    navyPale: '#162435',

    brass: '#D4A046',

    // Surfaces
    white: '#FFFFFF',
    paper: '#1A2030',
    mist: '#121820',
    frost: '#232D3D',

    // Text – softened for dark-mode readability
    ink: '#CDD5E0',
    slate: '#8A9BB0',

    // Semantic accents – brightened for dark bg readability
    success: '#4EC97A',
    info: '#5BA3D9',
    warning: '#E0A83D',
    error: '#E85A4F',
};

/* ── Motion tokens (identical to light theme) ───────────────── */
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

/* ── Brand gradient token ──────────────────────────────────── */
const BRAND_GRADIENT = `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.crimson})`;

/* ── Shadows (darker, tighter for dark mode) ───────────────── */
const shadow = {
    xs: '0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.20)',
    sm: '0 4px 12px rgba(0, 0, 0, 0.30), 0 1px 3px rgba(0, 0, 0, 0.22)',
    md: '0 10px 28px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.22)',
    lg: '0 22px 56px rgba(0, 0, 0, 0.40), 0 8px 18px rgba(0, 0, 0, 0.25)',
    glow: (color, intensity = 0.22) => `0 4px 20px ${alpha(color, intensity)}`,
};

const focusRing = () =>
    `0 0 0 2px ${alpha(BRAND.navy, 0.20)}, 0 0 0 4px ${alpha(BRAND.brass, 0.30)}`;

const surfaceBorder = (t) =>
    `1px solid ${alpha(t.palette.text.primary, 0.10)}`;

/* ── Palette ──────────────────────────────────────────────── */
const palette = {
    mode: 'dark',
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
        light: '#6FD895',
        dark: '#38A05E',
        contrastText: '#0A1F12',
    },
    info: {
        main: BRAND.info,
        light: '#7DB8E3',
        dark: '#3D80B8',
        contrastText: '#0A1A28',
    },
    warning: {
        main: BRAND.warning,
        light: '#EABC65',
        dark: '#B8882E',
        contrastText: '#1A1408',
    },
    error: {
        main: BRAND.error,
        light: '#EE7E75',
        dark: '#C0403A',
        contrastText: '#1A0D0C',
    },
    background: {
        default: BRAND.mist,
        paper: BRAND.paper,
    },
    text: {
        primary: BRAND.ink,
        secondary: BRAND.slate,
    },
    divider: alpha(BRAND.ink, 0.10),
    action: {
        hover: alpha(BRAND.ink, 0.06),
        selected: alpha(BRAND.ink, 0.10),
        disabledBackground: alpha(BRAND.ink, 0.08),
        focus: alpha(BRAND.brass, 0.22),
    },
    grey: {
        50: '#1A2030',
        100: '#1E2638',
        200: '#252E42',
        300: '#313C52',
        400: '#475568',
        500: '#64748B',
        600: '#8A97AB',
        700: '#AAB5C5',
        800: '#C8D0DA',
        900: '#E2E8F0',
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
                unselectedOpacity: 0.65,
                iconUnselectedOpacity: 0.55,
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
            borderOpacity: 0.12,
            bgOpacity: 0.04,
            inputBorderOpacity: 0.25,
            inputBorderHoverOpacity: 0.42,
        },

        social: {
            facebook: '#4A9AF5',
            instagram: '#F06680',
            x: '#E8ECF2',
            tiktok: '#E8ECF2',
            youtube: '#FF4444',
            spotify: '#1DB954',
            soundcloud: '#FF5500',
            bandcamp: '#1DA0C3',
            appleMusic: '#FA243C',
            linktree: '#43E660',
        },

        /* ── Post detail panel tokens ── */
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
            announcement: '#E0354F',
            discussion: '#5A8ABF',
            tips: '#D4A046',
            helpRequests: '#5BA3D9',
            lostFound: '#E0A83D',
            safety: '#E85A4F',
        },
        map: {
            tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            containerBg: BRAND.mist,
            containerGlow: [
                `radial-gradient(900px 420px at 12% 8%, ${alpha(BRAND.crimson, 0.10)} 0%, transparent 58%)`,
                `radial-gradient(820px 420px at 92% 0%, ${alpha(BRAND.navy, 0.10)} 0%, transparent 62%)`,
            ].join(', '),
            countyBorder: alpha(BRAND.ink, 0.10),
            countyBorderWeight: 1,
            countyFill: alpha(BRAND.paper, 0.70),
            stateBorder: alpha(BRAND.navyLight, 0.30),
            stateBorderWeight: 2.5,
            maskFill: BRAND.mist,
            maskOpacity: 0.92,
            maskBorder: alpha(BRAND.ink, 0.08),
            countyLabelColor: alpha(BRAND.slate, 0.52),
            countyLabelSize: 10,
            cityLabelColor: alpha(BRAND.slate, 0.58),
            cityLabelSize: 10,
            cityLabelShadow: `0 1px 0 ${alpha(BRAND.mist, 0.9)}`,
            placeOutline: alpha(BRAND.ink, 0.15),
            popupRadius: 14,
            popupShadow: `0 16px 48px ${alpha('#000', 0.40)}`,
            popupCloseBtnShadow: `0 8px 18px ${alpha('#000', 0.30)}`,
            chipBg: alpha(BRAND.frost, 0.84),
            chipBorder: alpha(BRAND.ink, 0.12),
            chipBackdrop: 'blur(6px)',
            defaultCenter: [32.69, -86.79113],
            defaultZoom: 7.5,
            focusZoom: 10,
            maxZoom: 14,
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
                            ${alpha(BRAND.frost, 0.4)} 0%,
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
                    background: alpha(BRAND.brass, 0.30),
                    color: BRAND.ink,
                },

                '*::-webkit-scrollbar': { width: 6, height: 6 },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(BRAND.ink, 0.18),
                    borderRadius: 999,
                    border: '1px solid transparent',
                    backgroundClip: 'padding-box',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: alpha(BRAND.ink, 0.30),
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
                    borderColor: alpha(t.palette.text.primary, 0.10),
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
                        borderColor: alpha(t.palette.text.primary, 0.10),
                        backgroundColor: t.palette.background.paper,
                        overflow: 'hidden',
                        boxShadow: 'none',
                        transition: `box-shadow ${MOTION.slow}ms ${MOTION.ease}, border-color ${MOTION.slow}ms ${MOTION.ease}`,

                        '&:hover, &[data-hovered="true"]': {
                            boxShadow: shadow.sm,
                        },

                        '&[data-selected="true"]': {
                            boxShadow: shadow.md,
                            borderColor: alpha(BRAND.crimson, 0.35),
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
                        borderColor: alpha(BRAND.crimson, 0.28),
                        boxShadow: shadow.xs,
                    },
                }),
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, 0.85),
                    backdropFilter: 'saturate(1.4) blur(20px)',
                    WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    color: t.palette.text.primary,
                    boxShadow: 'none',
                    borderBottom: `1px solid ${alpha(BRAND.ink, 0.08)}`,
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
                    borderRight: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                }),
            },
        },

        MuiBottomNavigation: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, 0.90),
                    backdropFilter: 'saturate(1.4) blur(20px)',
                    WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    borderTop: `1px solid ${alpha(BRAND.ink, 0.08)}`,
                }),
            },
        },

        MuiBottomNavigationAction: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    '&.Mui-selected': { color: t.palette.primary.light },
                }),
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderColor: alpha(t.palette.text.primary, 0.08),
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
                        backgroundColor: `${alpha(t.palette.primary.main, 0.30)} !important`,
                        color: `${alpha('#FFFFFF', 0.50)} !important`,
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
                    borderColor: alpha(t.palette.text.primary, 0.18),
                    '&:hover': {
                        borderColor: alpha(BRAND.brass, 0.50),
                        backgroundColor: alpha(BRAND.brass, 0.10),
                    },
                }),

                text: () => ({
                    '&:hover': { backgroundColor: alpha(BRAND.brass, 0.12) },
                }),
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': {
                        backgroundColor: alpha(BRAND.brass, 0.14),
                    },
                    '&:active': { backgroundColor: alpha(BRAND.brass, 0.20) },
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
                    backgroundColor: alpha(BRAND.frost, 0.50),
                    color: t.palette.text.secondary,
                    transition: `box-shadow ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}`,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(t.palette.text.primary, 0.14),
                        transition: `border-color ${MOTION.base}ms ${MOTION.ease}`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(BRAND.navy, 0.35),
                    },
                    '&.Mui-focused': {
                        color: t.palette.text.primary,
                        boxShadow: 'none',
                        outline: 'none',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${alpha(BRAND.brass, 0.58)} !important`,
                        borderWidth: '1px !important',
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
                    backgroundColor: alpha(BRAND.navy, 0.08),
                    '&:hover': { backgroundColor: alpha(BRAND.navy, 0.12) },
                    '&.Mui-focused': { backgroundColor: alpha(BRAND.navy, 0.10) },
                }),
            },
        },

        MuiInputBase: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    '&.Mui-focused': { color: t.palette.text.primary },
                }),
                input: ({ theme: t }) => ({
                    '&::placeholder': {
                        color: alpha(t.palette.text.secondary, 0.65),
                        opacity: 1,
                    },
                }),
            },
        },

        MuiInputLabel: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    fontWeight: 500,
                    '&.Mui-focused': { color: t.palette.primary.light },
                    '&.MuiInputLabel-shrink': {
                        backgroundColor: BRAND.paper,
                        padding: '0 6px',
                        borderRadius: t.shape.borderRadius / 2,
                        lineHeight: 1.15,
                    },
                }),
            },
        },

        MuiSelect: {
            styleOverrides: {
                select: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    '&:focus': { color: t.palette.text.primary },
                }),
                icon: ({ theme: t }) => ({ color: t.palette.text.secondary }),
            },
        },

        MuiTabs: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    minHeight: 'unset',
                    padding: 3,
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: alpha(BRAND.navy, 0.10),
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
                        backgroundColor: alpha(BRAND.navy, 0.08),
                    },
                    '&.Mui-selected': {
                        color: t.palette.primary.light,
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
                    border: `1px solid ${alpha(t.palette.text.primary, 0.10)}`,
                    backgroundColor: alpha(t.palette.text.primary, 0.06),
                    color: t.palette.text.secondary,
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                    '& .MuiChip-icon': {
                        color: t.palette.text.secondary,
                        transition: `color ${MOTION.base}ms ${MOTION.ease}`,
                    },

                    ...(ownerState?.clickable && {
                        '&:hover': {
                            boxShadow: shadow.xs,
                            borderColor: alpha(t.palette.text.primary, 0.16),
                        },
                        '&:active': {
                            backgroundColor: alpha(t.palette.text.primary, 0.10),
                        },
                    }),

                    ...(ownerState?.color === 'primary' && {
                        backgroundColor: alpha(BRAND.navy, 0.14),
                        borderColor: alpha(BRAND.navy, 0.24),
                        color: BRAND.navyLight,
                        '& .MuiChip-icon': { color: BRAND.navy },
                        ...(ownerState?.clickable && {
                            '&:hover': {
                                backgroundColor: alpha(BRAND.navy, 0.20),
                                borderColor: alpha(BRAND.navy, 0.34),
                            },
                        }),
                    }),

                    ...(ownerState?.color === 'secondary' && {
                        backgroundColor: alpha(BRAND.crimson, 0.14),
                        borderColor: alpha(BRAND.crimson, 0.24),
                        color: BRAND.crimsonLight,
                        '& .MuiChip-icon': { color: BRAND.crimson },
                        ...(ownerState?.clickable && {
                            '&:hover': {
                                backgroundColor: alpha(BRAND.crimson, 0.20),
                                borderColor: alpha(BRAND.crimson, 0.34),
                            },
                        }),
                    }),

                    ...(ownerState?.color === 'success' && {
                        backgroundColor: alpha(t.palette.success.main, 0.12),
                        borderColor: alpha(t.palette.success.main, 0.22),
                        color: t.palette.success.light,
                        '& .MuiChip-icon': { color: t.palette.success.main },
                    }),

                    ...(ownerState?.color === 'info' && {
                        backgroundColor: alpha(t.palette.info.main, 0.12),
                        borderColor: alpha(t.palette.info.main, 0.22),
                        color: t.palette.info.light,
                        '& .MuiChip-icon': { color: t.palette.info.main },
                    }),

                    ...(ownerState?.color === 'warning' && {
                        backgroundColor: alpha(t.palette.warning.main, 0.14),
                        borderColor: alpha(t.palette.warning.main, 0.24),
                        color: t.palette.warning.light,
                        '& .MuiChip-icon': { color: t.palette.warning.main },
                    }),

                    ...(ownerState?.color === 'error' && {
                        backgroundColor: alpha(BRAND.error, 0.12),
                        borderColor: alpha(BRAND.error, 0.22),
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
                        borderColor: alpha(t.palette.text.primary, 0.08),
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
                    border: `1px solid ${alpha(t.palette.text.primary, 0.10)}`,
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
                        backgroundColor: alpha(BRAND.navy, 0.14),
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.18) },
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
                    border: `1px solid ${alpha(t.palette.text.primary, 0.10)}`,
                    boxShadow: shadow.md,
                    borderRadius: t.shape.borderRadius,
                }),
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: () => ({
                    borderRadius: 6,
                    backgroundColor: BRAND.frost,
                    color: BRAND.ink,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    boxShadow: shadow.sm,
                    padding: '5px 10px',
                    border: `1px solid ${alpha(BRAND.ink, 0.10)}`,
                }),
                arrow: () => ({ color: BRAND.frost }),
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    boxShadow: 'none',
                    border: `1px solid ${alpha(t.palette.text.primary, 0.10)}`,
                    '& .MuiAlert-icon': { alignItems: 'center' },
                }),
                standardSuccess: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.success.main, 0.10),
                    borderColor: alpha(t.palette.success.main, 0.20),
                }),
                standardInfo: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.info.main, 0.10),
                    borderColor: alpha(t.palette.info.main, 0.20),
                }),
                standardWarning: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.warning.main, 0.10),
                    borderColor: alpha(t.palette.warning.main, 0.20),
                }),
                standardError: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.error.main, 0.10),
                    borderColor: alpha(t.palette.error.main, 0.20),
                }),
            },
        },

        MuiSnackbarContent: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    boxShadow: shadow.md,
                    backgroundColor: t.palette.grey[200],
                }),
            },
        },

        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    height: 4,
                    backgroundColor: alpha(BRAND.navy, 0.18),
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
                    backgroundColor: alpha(BRAND.navy, 0.16),
                    color: BRAND.navyLight,
                    fontWeight: 620,
                    border: `1.5px solid ${alpha(BRAND.navy, 0.18)}`,
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
                        backgroundColor: alpha(BRAND.navy, 0.14),
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.18) },
                    },
                }),
            },
        },

        MuiSkeleton: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: alpha(t.palette.text.primary, 0.06),
                    '&::after': {
                        animationDuration: '1.8s',
                        background: `linear-gradient(90deg, transparent, ${alpha(t.palette.text.primary, 0.04)}, transparent)`,
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
                    borderBottomColor: alpha(t.palette.text.primary, 0.12),
                }),
                body: ({ theme: t }) => ({
                    borderBottomColor: alpha(t.palette.text.primary, 0.08),
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
                    backgroundColor: alpha(BRAND.ink, 0.20),
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
                            boxShadow: `0 0 0 6px ${alpha(BRAND.crimson, 0.20)}`,
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
                        borderColor: alpha(t.palette.text.primary, 0.14),
                    },
                }),
            },
        },

        MuiToggleButtonGroup: {
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.12)}`,
                }),
            },
        },

        MuiToggleButton: {
            styleOverrides: {
                root: () => ({
                    textTransform: 'none',
                    fontWeight: 580,
                    '&.Mui-selected': {
                        backgroundColor: alpha(BRAND.navy, 0.16),
                        color: BRAND.navyLight,
                        '&:hover': { backgroundColor: alpha(BRAND.navy, 0.22) },
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
                    color: t.palette.primary.light,
                    fontWeight: 580,
                    textDecoration: 'none',
                    transition: `color ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': {
                        color: t.palette.secondary.light,
                        textDecoration: 'underline',
                        textDecorationColor: alpha(t.palette.secondary.light, 0.40),
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
            color: alpha(t.palette.primary.light, cfg.tab.unselectedOpacity),
            transition: `color ${m.base}ms ${m.ease}`,
            '& .MuiTab-iconWrapper': {
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center',
            },
            '& .MuiSvgIcon-root': {
                color: alpha(t.palette.primary.light, cfg.tab.iconUnselectedOpacity),
                transition: `color ${m.fast}ms ${m.ease}, transform ${m.fast}ms ${m.ease}`,
            },
            '&.Mui-selected': {
                color: t.palette.primary.light,
            },
            '&.Mui-selected .MuiSvgIcon-root': {
                color: t.palette.secondary.main,
            },
            '&:hover .MuiSvgIcon-root': {
                color: t.palette.secondary.main,
                transform: 'translateY(-1px)',
            },
            '& .llTabIcon': {
                color: alpha(t.palette.primary.light, cfg.tab.iconUnselectedOpacity),
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

export default theme;

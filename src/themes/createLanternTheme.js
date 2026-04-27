// src/themes/createLanternTheme.js
// ──────────────────────────────────────────────────────────────────────────────
// Factory that produces a fully wired MUI theme from a compact colour config.
// Every theme (light, dark, crimson tide, etc.) delegates here so component
// overrides, motion tokens, typography and helper exports stay in ONE place.
// ──────────────────────────────────────────────────────────────────────────────
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

/* ── Motion tokens (shared across every theme) ──────────────────────────────── */
const MOTION = {
    ease: 'cubic-bezier(.2,.8,.2,1)',
    easeOut: 'cubic-bezier(.0,.0,.2,1)',
    easeIn: 'cubic-bezier(.4,.0,1,1)',
    spring: 'cubic-bezier(.34,1.56,.64,1)',
    fast: 120, base: 160, slow: 220, gentle: 320,
    get fadeBase()   { return `opacity ${this.slow}ms ${this.ease}`; },
    get fadeGentle() { return `opacity ${this.gentle}ms ${this.ease}`; },
    get slideFade()  { return `opacity ${this.slow}ms ${this.ease}, transform ${this.slow}ms ${this.ease}`; },
    get all()        { return `all ${this.base}ms ${this.ease}`; },
    get allSlow()    { return `all ${this.slow}ms ${this.ease}`; },
    get allGentle()  { return `all ${this.gentle}ms ${this.ease}`; },
    staggerDelay: 40,
    contentFade: {
        durationMs: 260,
        get durationSec() { return this.durationMs / 1000; },
        exitDurationMs: 140,
        get exitDurationSec() { return this.exitDurationMs / 1000; },
        offsetY: 6,
        get transition() { return `opacity ${this.durationMs}ms cubic-bezier(.2,.8,.2,1), transform ${this.durationMs}ms cubic-bezier(.2,.8,.2,1)`; },
        get framer()     { return { duration: this.durationSec, ease: [0.2, 0.8, 0.2, 1] }; },
        get framerExit() { return { duration: this.exitDurationSec, ease: [0.4, 0.0, 1, 1] }; },
        get variants()   { return { initial: { opacity: 0, y: this.offsetY }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } }; },
    },
    listStagger: {
        keyframeName: 'listCardFadeIn', durationMs: 320, easing: 'ease-out', offsetY: 8, delayPerItem: 40, maxDelayMs: 400,
        get keyframesCss() { return `@keyframes ${this.keyframeName} {\n  from { opacity: 0; transform: translateY(${this.offsetY}px); }\n  to   { opacity: 1; transform: translateY(0); }\n}`; },
    },
    discoverStagger: { durationMs: 380, easing: 'cubic-bezier(.16,1,.3,1)', offsetY: 14, scaleFrom: 0.97, delayPerItem: 70, maxDelayMs: 560 },
};

// ─── Default social colours (dark-safe) ─────────────────────────────────────
const DEFAULT_SOCIAL_LIGHT = { facebook: '#1877F2', instagram: '#E4405F', x: '#000000', tiktok: '#000000', youtube: '#FF0000', spotify: '#1DB954', soundcloud: '#FF5500', bandcamp: '#1DA0C3', appleMusic: '#FA243C', linktree: '#43E660' };
const DEFAULT_SOCIAL_DARK  = { facebook: '#4A9AF5', instagram: '#F06680', x: '#E8ECF2', tiktok: '#E8ECF2', youtube: '#FF4444', spotify: '#1DB954', soundcloud: '#FF5500', bandcamp: '#1DA0C3', appleMusic: '#FA243C', linktree: '#43E660' };

/**
 * @param {object} cfg  Compact colour / mode config.  Required keys:
 *   mode        – 'light' | 'dark'
 *   primary     – { main, light, dark }
 *   secondary   – { main, light, dark }
 *   background  – { default, paper }
 *   text        – { primary, secondary }
 *   success, info, warning, error – { main }  (light/dark auto-derived if omitted)
 *   frost       – mid-tone surface for inputs / cards (dark mode)
 *   brass       – accent / focus colour
 *   brandGradient – optional override
 *   social      – optional per-platform overrides
 *   mapTile     – optional Leaflet tile URL
 *   categories  – optional category colour overrides
 */
export default function createLanternTheme(cfg) {
    const isDark = cfg.mode === 'dark';
    const B = cfg;                       // shorthand

    // Derived helpers
    const brass   = B.brass   || (isDark ? '#D4A046' : '#A87822');
    const frost   = B.frost   || (isDark ? '#232D3D' : '#E7EBF1');
    const ink     = B.text.primary;
    const slate   = B.text.secondary;
    const paperBg = B.background.paper;

    const BRAND_GRADIENT = B.brandGradient || `linear-gradient(90deg, ${B.primary.main}, ${B.secondary.main})`;

    /* ── Shadows ─────────────────────────────────────────────────── */
    const shadowAlpha = isDark ? 'rgba(0,0,0,' : `rgba(${hexToRgb(ink)},`;
    const sa = (a) => `${shadowAlpha}${a})`;
    const shadow = isDark ? {
        xs: `0 1px 3px ${sa(0.25)}, 0 1px 2px ${sa(0.20)}`,
        sm: `0 4px 12px ${sa(0.30)}, 0 1px 3px ${sa(0.22)}`,
        md: `0 10px 28px ${sa(0.35)}, 0 4px 10px ${sa(0.22)}`,
        lg: `0 22px 56px ${sa(0.40)}, 0 8px 18px ${sa(0.25)}`,
        glow: (color, intensity = 0.22) => `0 4px 20px ${alpha(color, intensity)}`,
    } : {
        xs: `0 1px 3px ${sa(0.06)}, 0 1px 2px ${sa(0.04)}`,
        sm: `0 4px 12px ${sa(0.08)}, 0 1px 3px ${sa(0.05)}`,
        md: `0 10px 28px ${sa(0.11)}, 0 4px 10px ${sa(0.05)}`,
        lg: `0 22px 56px ${sa(0.15)}, 0 8px 18px ${sa(0.06)}`,
        glow: (color, intensity = 0.16) => `0 4px 20px ${alpha(color, intensity)}`,
    };

    const focusRing = () => `0 0 0 2px ${alpha(B.primary.main, isDark ? 0.20 : 0.10)}, 0 0 0 4px ${alpha(brass, isDark ? 0.30 : 0.22)}`;
    const surfaceBorder = (t) => `1px solid ${alpha(t.palette.text.primary, isDark ? 0.10 : 0.07)}`;
    const borderOp = isDark ? 0.10 : 0.07;

    /* ── Palette ─────────────────────────────────────────────────── */
    const palette = {
        mode: B.mode,
        primary:   { main: B.primary.main,   light: B.primary.light,   dark: B.primary.dark,   contrastText: '#FFFFFF' },
        secondary: { main: B.secondary.main, light: B.secondary.light, dark: B.secondary.dark, contrastText: '#FFFFFF' },
        success: { main: B.success?.main || (isDark ? '#4EC97A' : '#2D7A4B'), light: B.success?.light || (isDark ? '#6FD895' : '#469966'), dark: B.success?.dark || (isDark ? '#38A05E' : '#215F3A'), contrastText: isDark ? '#0A1F12' : '#FFFFFF' },
        info:    { main: B.info?.main    || (isDark ? '#5BA3D9' : '#2D6EA3'), light: B.info?.light    || (isDark ? '#7DB8E3' : '#4D89BA'), dark: B.info?.dark    || (isDark ? '#3D80B8' : '#1F527C'), contrastText: isDark ? '#0A1A28' : '#FFFFFF' },
        warning: { main: B.warning?.main || (isDark ? '#E0A83D' : '#B7791F'), light: B.warning?.light || (isDark ? '#EABC65' : '#D49B45'), dark: B.warning?.dark || (isDark ? '#B8882E' : '#8C5A11'), contrastText: isDark ? '#1A1408' : '#FFFFFF' },
        error:   { main: B.error?.main   || (isDark ? '#E85A4F' : '#C0392B'), light: B.error?.light   || (isDark ? '#EE7E75' : '#D85C50'), dark: B.error?.dark   || (isDark ? '#C0403A' : '#962D23'), contrastText: isDark ? '#1A0D0C' : '#FFFFFF' },
        background: { default: B.background.default, paper: paperBg },
        text: { primary: ink, secondary: slate },
        divider: alpha(ink, 0.10),
        action: {
            hover:              alpha(isDark ? ink : B.primary.main, isDark ? 0.06 : 0.045),
            selected:           alpha(isDark ? ink : B.primary.main, isDark ? 0.10 : 0.075),
            disabledBackground: alpha(isDark ? ink : B.primary.main, isDark ? 0.08 : 0.06),
            focus:              alpha(brass, isDark ? 0.22 : 0.18),
        },
        grey: isDark
            ? { 50:'#1A2030',100:'#1E2638',200:'#252E42',300:'#313C52',400:'#475568',500:'#64748B',600:'#8A97AB',700:'#AAB5C5',800:'#C8D0DA',900:'#E2E8F0' }
            : { 50:'#FAFBFC',100:'#F3F5F8',200:'#E7EBF1',300:'#D6DDE6',400:'#B4BFCC',500:'#8E9AAC',600:'#6D788A',700:'#4E596B',800:'#2F3B4E',900:'#162235' },
    };

    /* ── Social ──────────────────────────────────────────────────── */
    const social = { ...(isDark ? DEFAULT_SOCIAL_DARK : DEFAULT_SOCIAL_LIGHT), ...(B.social || {}) };

    /* ── Custom tokens ──────────────────────────────────────────── */
    // Dark-mode-safe accent text colours — use these for text/icons that sit
    // on the paper/default background.  On dark themes primary.main can be too
    // dim to read, so we promote primary.light.
    const primaryText   = isDark ? B.primary.light   : B.primary.main;
    const secondaryText = isDark ? B.secondary.light : B.secondary.main;

    const custom = {
        shadows: shadow, brand: { ...B, social }, motion: MOTION, brandGradient: BRAND_GRADIENT,
        primaryText,
        secondaryText,
        elevation: { surface: shadow.xs, raised: shadow.sm, floating: shadow.md },
        postCard: { borderRadius: 12, minHeight: { xs: 360, sm: 350, md: 340 } },
        profileSubTabs: {
            minHeight: { xs: 48, sm: 56 },
            tab: { fontWeight: 700, fontSize: '0.8rem', letterSpacing: '-0.01em', unselectedOpacity: isDark ? 0.65 : 0.85, iconUnselectedOpacity: isDark ? 0.55 : 0.7 },
            indicator: { height: 3, borderRadius: '3px 3px 0 0' },
        },
        profileFilterBar: {
            pt: 1.5, pb: 1, px: 1.5, gap: 1,
            borderOpacity: isDark ? 0.12 : 0.08,
            bgOpacity: isDark ? 0.04 : 0.025,
            inputBorderOpacity: isDark ? 0.25 : 0.2,
            inputBorderHoverOpacity: isDark ? 0.42 : 0.38,
        },
        social,
        reviews: {
            starColor: B.warning?.main || (isDark ? '#E0A83D' : '#B7791F'),
            starSize: { card: 14, detail: 15, summary: 'small', form: 'large' },
            countText: { fontWeight: 700, fontSize: '0.75rem', color: slate },
            summaryAvg: { fontWeight: 900, fontSize: '2rem', lineHeight: 1 },
            breakdownBar: { height: 6, borderRadius: 999 },
        },
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
            noCommentsIcon: { fontSize: 36, color: B.primary.main, mb: 1 },
        },
        categories: B.categories || {
            announcement: isDark ? '#E0354F' : '#B3203D',
            discussion:   isDark ? '#5A8ABF' : '#1F4F82',
            tips:         isDark ? '#D4A046' : '#7A5A2A',
            helpRequests: isDark ? '#5BA3D9' : '#2F6F89',
            lostFound:    isDark ? '#E0A83D' : '#D17B17',
            safety:       isDark ? '#E85A4F' : '#C0392B',
        },
        map: {
            tileUrl: B.mapTile || (isDark
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png'),
            containerBg: B.background.default,
            containerGlow: [
                `radial-gradient(900px 420px at 12% 8%, ${alpha(B.secondary.main, isDark ? 0.10 : 0.08)} 0%, transparent 58%)`,
                `radial-gradient(820px 420px at 92% 0%, ${alpha(B.primary.main, isDark ? 0.10 : 0.08)} 0%, transparent 62%)`,
            ].join(', '),
            countyBorder: alpha(ink, isDark ? 0.10 : 0.12),
            countyBorderWeight: 1,
            countyFill: alpha(paperBg, isDark ? 0.70 : 0.95),
            stateBorder: alpha(B.primary.dark, isDark ? 0.30 : 0.25),
            stateBorderWeight: 2.5,
            maskFill: B.background.default,
            maskOpacity: isDark ? 0.92 : 0.9,
            maskBorder: alpha(ink, 0.08),
            countyLabelColor: alpha(slate, 0.52),
            countyLabelSize: 10,
            cityLabelColor: alpha(slate, 0.58),
            cityLabelSize: 10,
            cityLabelShadow: `0 1px 0 ${alpha(isDark ? B.background.default : '#FFFFFF', 0.9)}`,
            placeOutline: alpha(ink, isDark ? 0.15 : 0.10),
            popupRadius: 14,
            popupShadow: `0 16px 48px ${alpha(isDark ? '#000' : ink, isDark ? 0.40 : 0.16)}`,
            popupCloseBtnShadow: `0 8px 18px ${alpha(isDark ? '#000' : ink, isDark ? 0.30 : 0.12)}`,
            chipBg: alpha(isDark ? frost : '#FFFFFF', 0.84),
            chipBorder: alpha(ink, isDark ? 0.12 : 0.09),
            chipBackdrop: 'blur(6px)',
            defaultCenter: [32.69, -86.79113],
            defaultZoom: 7.5, focusZoom: 10, maxZoom: 14, panOffsetPx: 50,
        },
    };

    /* ── Typography ──────────────────────────────────────────────── */
    const typography = {
        fontFamily: ["'Plus Jakarta Sans'","'Inter'","'SF Pro Display'","'Segoe UI'",'Roboto',"'Helvetica Neue'",'Arial','system-ui','-apple-system','sans-serif'].join(','),
        h1: { fontWeight: 750, letterSpacing: '-0.032em', lineHeight: 1.1 },
        h2: { fontWeight: 720, letterSpacing: '-0.025em', lineHeight: 1.15 },
        h3: { fontWeight: 680, letterSpacing: '-0.018em', lineHeight: 1.22 },
        h4: { fontWeight: 660, letterSpacing: '-0.012em', lineHeight: 1.26 },
        h5: { fontWeight: 640, letterSpacing: '-0.008em', lineHeight: 1.32 },
        h6: { fontWeight: 620, letterSpacing: '-0.004em', lineHeight: 1.36 },
        button:   { fontWeight: 620, textTransform: 'none', letterSpacing: '0.01em', fontSize: '0.875rem' },
        subtitle1:{ fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.003em' },
        subtitle2:{ fontWeight: 600, lineHeight: 1.4, fontSize: '0.8125rem', letterSpacing: '0.003em' },
        body1:    { lineHeight: 1.6, letterSpacing: '0.005em', fontWeight: 400 },
        body2:    { lineHeight: 1.55, letterSpacing: '0.005em', fontWeight: 400, fontSize: '0.875rem' },
        caption:  { color: slate, lineHeight: 1.5, fontSize: '0.75rem', fontWeight: 450, letterSpacing: '0.01em' },
        overline: { fontWeight: 650, letterSpacing: '0.08em', fontSize: '0.6875rem', textTransform: 'uppercase', color: slate },
    };

    /* ── Component overrides (the big block) ─────────────────────── */
    const components = {
        MuiCssBaseline: {
            styleOverrides: (t) => ({
                html: { fontSize: '100%' },
                '@media (min-width: 1200px)': { html: { fontSize: '93.75%' } },
                'html, body, #root': { height: '100%', backgroundColor: t.palette.background.default, color: t.palette.text.primary },
                body: {
                    textRendering: 'optimizeLegibility', MozOsxFontSmoothing: 'grayscale', WebkitFontSmoothing: 'antialiased',
                    backgroundImage: `linear-gradient(180deg, ${alpha(isDark ? frost : '#FFFFFF', isDark ? 0.4 : 0.8)} 0%, ${t.palette.background.default} 52%, ${t.palette.background.default} 100%)`,
                    backgroundAttachment: 'fixed',
                },
                '@media (pointer: coarse)': { body: { backgroundAttachment: 'scroll' } },
                // On mobile (< sm breakpoint: 600px), flatten the app background to match
                // the card surface color so cards visually dissolve into the page and the
                // UI reads as one continuous surface.
                '@media (max-width: 599.95px)': {
                    'html, body, #root': { backgroundColor: t.palette.background.paper },
                    body: { backgroundImage: 'none' },
                },
                '*': { WebkitTapHighlightColor: 'transparent' },
                '::selection': { background: alpha(brass, isDark ? 0.30 : 0.25), color: ink },
                '*::-webkit-scrollbar': { width: 6, height: 6 },
                '*::-webkit-scrollbar-thumb': { backgroundColor: alpha(ink, isDark ? 0.18 : 0.14), borderRadius: 999, border: '1px solid transparent', backgroundClip: 'padding-box' },
                '*::-webkit-scrollbar-thumb:hover': { backgroundColor: alpha(ink, isDark ? 0.30 : 0.24) },
                '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                ':focus-visible': { outline: 'none', boxShadow: focusRing(), borderRadius: t.shape.borderRadius },
            }),
        },
        MuiPaper: { styleOverrides: {
                root: ({ theme: t }) => ({
                    backgroundImage: 'none',
                    borderRadius: t.shape.borderRadius,
                    border: `1px solid ${alpha(t.palette.primary.main, isDark ? 0.14 : 0.12)}`,
                    // Mobile: remove border-radius and border for edge-to-edge feel
                    [t.breakpoints.down('sm')]: {
                        borderRadius: 0,
                        border: 'none',
                    },
                }),
                outlined: ({ theme: t }) => ({ borderColor: alpha(t.palette.primary.main, isDark ? 0.14 : 0.12), boxShadow: 'none' }),
            }},
        MuiCard: {
            variants: [{
                props: { variant: 'post' },
                style: ({ theme: t }) => ({
                    display: 'flex', flexDirection: 'column', width: '100%',
                    minHeight: t.custom?.postCard?.minHeight?.xs ?? 360,
                    [t.breakpoints.up('sm')]: { minHeight: t.custom?.postCard?.minHeight?.sm ?? 350 },
                    [t.breakpoints.up('md')]: { minHeight: t.custom?.postCard?.minHeight?.md ?? 340 },
                    height: 'auto', position: 'relative', isolation: 'isolate',
                    borderRadius: t.custom?.postCard?.borderRadius || 12,
                    border: '1px solid', borderColor: alpha(t.palette.text.primary, borderOp),
                    backgroundColor: t.palette.background.paper, overflow: 'hidden', boxShadow: 'none',
                    transition: `box-shadow ${MOTION.slow}ms ${MOTION.ease}, border-color ${MOTION.slow}ms ${MOTION.ease}`,
                    '&:hover, &[data-hovered="true"]': { boxShadow: shadow.sm },
                    '&[data-selected="true"]': { boxShadow: shadow.md, borderColor: alpha(B.secondary.main, isDark ? 0.35 : 0.28) },
                    '&[data-top-accent="true"]::before': { content: '""', position: 'absolute', left: 0, top: 0, right: 0, height: 2, background: BRAND_GRADIENT, borderRadius: '2px 2px 0 0', opacity: 0, transition: `opacity ${MOTION.slow}ms ${MOTION.ease}` },
                    '&[data-top-accent="true"]:hover::before, &[data-top-accent="true"][data-selected="true"]::before, &[data-top-accent="true"][data-hovered="true"]::before': { opacity: 1 },
                }),
            }],
            styleOverrides: {
                root: ({ theme: t }) => ({
                    position: 'relative', overflow: 'hidden', borderRadius: t.shape.borderRadius + 2,
                    border: `1px solid ${alpha(t.palette.primary.main, isDark ? 0.14 : 0.12)}`, backgroundColor: t.palette.background.paper, backgroundImage: 'none', boxShadow: 'none',
                    transition: `box-shadow ${MOTION.slow}ms ${MOTION.ease}, border-color ${MOTION.slow}ms ${MOTION.ease}`,
                    '&:hover': { boxShadow: shadow.sm },
                    '&:focus-within': { borderColor: alpha(B.secondary.main, isDark ? 0.28 : 0.22), boxShadow: shadow.xs },
                    // Mobile: edge-to-edge cards
                    [t.breakpoints.down('sm')]: {
                        borderRadius: 0,
                        border: 'none',
                    },
                }),
            },
        },
        MuiAppBar: { styleOverrides: { root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, isDark ? 0.85 : 0.82),
                    backdropFilter: 'saturate(1.4) blur(20px)', WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    color: t.palette.text.primary, boxShadow: 'none',
                    borderBottom: `1px solid ${alpha(ink, isDark ? 0.08 : 0.07)}`,
                })}},
        MuiToolbar: { styleOverrides: { root: { minHeight: 56, '@media (min-width: 600px)': { minHeight: 60 } } } },
        MuiDrawer: { styleOverrides: { paper: ({ theme: t }) => ({ backgroundImage: 'none', backgroundColor: t.palette.background.paper, borderRight: `1px solid ${alpha(t.palette.text.primary, 0.08)}` }) } },
        MuiBottomNavigation: { styleOverrides: { root: ({ theme: t }) => ({
                    backgroundColor: alpha(t.palette.background.paper, isDark ? 0.90 : 0.88),
                    backdropFilter: 'saturate(1.4) blur(20px)', WebkitBackdropFilter: 'saturate(1.4) blur(20px)',
                    borderTop: `1px solid ${alpha(ink, isDark ? 0.08 : 0.07)}`,
                })}},
        MuiBottomNavigationAction: { styleOverrides: { root: ({ theme: t }) => ({
                    color: t.palette.text.secondary,
                    '&.Mui-selected': { color: isDark ? t.palette.primary.light : t.palette.primary.main },
                })}},
        MuiDivider: { styleOverrides: { root: ({ theme: t }) => ({ borderColor: alpha(t.palette.text.primary, isDark ? 0.08 : 0.07) }) } },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius, paddingInline: 18, paddingTop: 8, paddingBottom: 8, minHeight: 38,
                    '@media (min-width: 1200px)': { paddingInline: 16, paddingTop: 7, paddingBottom: 7, minHeight: 36 },
                    fontWeight: 620, letterSpacing: '0.01em',
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, opacity ${MOTION.base}ms ${MOTION.ease}`,
                    '&:active': { opacity: 0.85 }, '&:focus-visible': { boxShadow: focusRing() }, '&.Mui-disabled': { opacity: 1 },
                }),
                contained: ({ theme: t }) => ({ '&.Mui-disabled': { backgroundImage: 'none !important', backgroundColor: `${alpha(t.palette.primary.main, isDark ? 0.30 : 0.25)} !important`, color: `${isDark ? alpha('#FFFFFF', 0.50) : '#FFFFFF'} !important`, boxShadow: 'none !important', filter: 'none !important' } }),
                containedPrimary: ({ theme: t }) => ({ backgroundColor: t.palette.primary.main, boxShadow: 'none', '&:hover': { backgroundColor: brass, boxShadow: shadow.xs } }),
                containedSecondary: ({ theme: t }) => ({ backgroundColor: t.palette.secondary.main, color: '#FFFFFF', boxShadow: 'none', '&:hover': { backgroundColor: brass, boxShadow: shadow.xs } }),
                outlined: ({ theme: t }) => ({ borderColor: alpha(t.palette.text.primary, isDark ? 0.18 : 0.14), '&:hover': { borderColor: alpha(brass, isDark ? 0.50 : 0.45), backgroundColor: alpha(brass, isDark ? 0.10 : 0.06) } }),
                text: () => ({ '&:hover': { backgroundColor: alpha(brass, isDark ? 0.12 : 0.08) } }),
            },
        },
        MuiIconButton: { styleOverrides: { root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    transition: `background-color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': { backgroundColor: alpha(brass, isDark ? 0.14 : 0.10) },
                    '&:active': { backgroundColor: alpha(brass, isDark ? 0.20 : 0.16) },
                    '&:focus-visible': { boxShadow: focusRing() },
                    // Mobile: strip circular borders app-wide so icon buttons are plain
                    [t.breakpoints.down('sm')]: {
                        border: 'none !important',
                    },
                })}},
        MuiFab: { styleOverrides: { root: () => ({ boxShadow: shadow.md, '&:hover': { boxShadow: shadow.lg } }) } },
        MuiOutlinedInput: { styleOverrides: {
                root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius,
                    backgroundColor: isDark ? alpha(frost, 0.6) : 'transparent',
                    color: isDark ? t.palette.text.primary : t.palette.text.primary,
                    transition: `box-shadow ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, background-color ${MOTION.base}ms ${MOTION.ease}`,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.text.primary, isDark ? 0.18 : 0.12), transition: `border-color ${MOTION.base}ms ${MOTION.ease}` },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(B.primary.main, isDark ? 0.35 : 0.26) },
                    '&.Mui-focused': { color: t.palette.text.primary, boxShadow: 'none', outline: 'none', backgroundColor: isDark ? alpha(frost, 0.8) : 'transparent' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: `${alpha(brass, isDark ? 0.58 : 0.52)} !important`, borderWidth: '1px !important' },
                    '& textarea:focus, & input:focus': { outline: 'none', boxShadow: 'none' },
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: t.palette.error.main },
                }),
                input: { paddingTop: 11, paddingBottom: 11, '@media (max-width: 600px)': { fontSize: '0.875rem' }, '@media (min-width: 1200px)': { paddingTop: 9, paddingBottom: 9 } },
            }},
        MuiFilledInput: { styleOverrides: { root: () => ({
                    borderRadius: '10px 10px 0 0',
                    backgroundColor: alpha(B.primary.main, isDark ? 0.08 : 0.035),
                    '&:hover': { backgroundColor: alpha(B.primary.main, isDark ? 0.12 : 0.055) },
                    '&.Mui-focused': { backgroundColor: alpha(B.primary.main, isDark ? 0.10 : 0.045) },
                })}},
        MuiInputBase: { styleOverrides: {
                root: ({ theme: t }) => ({
                    '@media (max-width: 600px)': { fontSize: '0.875rem' },
                    ...(isDark ? { color: t.palette.text.primary, '&.Mui-focused': { color: t.palette.text.primary } } : {}),
                }),
                ...(isDark ? { input: ({ theme: t }) => ({ '&::placeholder': { color: alpha(t.palette.text.secondary, 0.85), opacity: 1 } }) } : {}),
            }},
        MuiInputLabel: { styleOverrides: { root: ({ theme: t }) => ({
                    color: t.palette.text.secondary, fontWeight: 500,
                    '@media (max-width: 600px)': { fontSize: '0.875rem' },
                    '&.Mui-focused': { color: isDark ? t.palette.primary.light : t.palette.primary.main },
                    '&.MuiInputLabel-shrink': { backgroundColor: paperBg, padding: '0 6px', borderRadius: t.shape.borderRadius / 2, lineHeight: 1.15 },
                })}},
        MuiSelect: { styleOverrides: {
                ...(isDark ? { select: ({ theme: t }) => ({ color: t.palette.text.primary, '&:focus': { color: t.palette.text.primary } }) } : {}),
                icon: ({ theme: t }) => ({ color: isDark ? t.palette.text.primary : t.palette.text.secondary }),
            }},
        MuiTabs: { styleOverrides: {
                root: ({ theme: t }) => ({ minHeight: 'unset', padding: 3, borderRadius: t.shape.borderRadius, backgroundColor: alpha(B.primary.main, isDark ? 0.10 : 0.04), border: 'none', boxShadow: 'none' }),
                indicator: ({ theme: t }) => ({ height: 2, borderRadius: 999, backgroundColor: t.palette.secondary.main }),
            }},
        MuiTab: { styleOverrides: { root: ({ theme: t }) => ({
                    textTransform: 'none', fontWeight: 580, fontSize: '0.8125rem', color: t.palette.text.secondary, minHeight: 'unset',
                    borderRadius: t.shape.borderRadius - 2, paddingTop: 8, paddingBottom: 8, paddingInline: 14, zIndex: 1,
                    transition: `color ${MOTION.base}ms ${MOTION.ease}, background-color ${MOTION.base}ms ${MOTION.ease}`,
                    '@media (min-width: 1200px)': { paddingTop: 7, paddingBottom: 7, paddingInline: 12 },
                    '&:hover': { color: t.palette.text.primary, backgroundColor: alpha(B.primary.main, isDark ? 0.08 : 0.04) },
                    '&.Mui-selected': { color: isDark ? t.palette.primary.light : t.palette.primary.dark, fontWeight: 620 },
                    '&:focus-visible': { boxShadow: focusRing() },
                })}},
        MuiChip: { styleOverrides: { root: ({ theme: t, ownerState }) => {
                    const base = {
                        borderRadius: t.shape.borderRadius - 2, fontWeight: 580,
                        border: `1px solid ${alpha(t.palette.text.primary, borderOp)}`,
                        backgroundColor: alpha(t.palette.text.primary, isDark ? 0.06 : 0.03),
                        color: t.palette.text.secondary,
                        transition: `background-color ${MOTION.base}ms ${MOTION.ease}, border-color ${MOTION.base}ms ${MOTION.ease}, color ${MOTION.base}ms ${MOTION.ease}, box-shadow ${MOTION.base}ms ${MOTION.ease}`,
                        '& .MuiChip-icon': { color: t.palette.text.secondary, transition: `color ${MOTION.base}ms ${MOTION.ease}` },
                    };
                    const chipColor = (main, bg, border, text) => ({
                        backgroundColor: alpha(main, bg), borderColor: alpha(main, border),
                        color: text, '& .MuiChip-icon': { color: main },
                        ...(ownerState?.clickable ? { '&:hover': { backgroundColor: alpha(main, bg + 0.06), borderColor: alpha(main, border + 0.10) } } : {}),
                    });
                    return {
                        ...base,
                        ...(ownerState?.clickable ? { '&:hover': { boxShadow: shadow.xs, borderColor: alpha(t.palette.text.primary, borderOp + 0.06) }, '&:active': { backgroundColor: alpha(t.palette.text.primary, isDark ? 0.10 : 0.06) } } : {}),
                        ...(ownerState?.color === 'primary'   ? chipColor(B.primary.main,   isDark ? 0.14 : 0.07, isDark ? 0.24 : 0.16, isDark ? B.primary.light   : B.primary.dark)   : {}),
                        ...(ownerState?.color === 'secondary'  ? chipColor(B.secondary.main, isDark ? 0.14 : 0.08, isDark ? 0.24 : 0.18, isDark ? B.secondary.light : B.secondary.dark) : {}),
                        ...(ownerState?.color === 'success'    ? chipColor(t.palette.success.main, isDark ? 0.12 : 0.07, isDark ? 0.22 : 0.16, isDark ? t.palette.success.light : t.palette.success.dark) : {}),
                        ...(ownerState?.color === 'info'       ? chipColor(t.palette.info.main,    isDark ? 0.12 : 0.07, isDark ? 0.22 : 0.16, isDark ? t.palette.info.light    : t.palette.info.dark)    : {}),
                        ...(ownerState?.color === 'warning'    ? chipColor(t.palette.warning.main, isDark ? 0.14 : 0.08, isDark ? 0.24 : 0.18, isDark ? t.palette.warning.light : t.palette.warning.dark) : {}),
                        ...(ownerState?.color === 'error'      ? chipColor(t.palette.error.main,   isDark ? 0.12 : 0.07, isDark ? 0.22 : 0.16, isDark ? t.palette.error.main    : t.palette.error.main)   : {}),
                        ...(ownerState?.variant === 'outlined' ? { backgroundColor: 'transparent' } : {}),
                    };
                }}},
        MuiDialog: {
            defaultProps: { slotProps: { backdrop: { onClick: (e) => e.stopPropagation() } } },
            styleOverrides: { paper: ({ theme: t }) => ({ borderRadius: t.shape.borderRadius + 4, border: surfaceBorder(t), boxShadow: shadow.lg, backgroundImage: 'none', backgroundColor: t.palette.background.paper }) },
        },
        MuiDialogContent: { styleOverrides: { root: ({ theme: t }) => ({ '&.MuiDialogContent-dividers': { borderColor: alpha(t.palette.text.primary, isDark ? 0.08 : 0.07) } }) } },
        MuiDialogActions: { styleOverrides: { root: { padding: '12px 24px 16px', gap: 8 } } },
        MuiMenu: {
            defaultProps: { slotProps: { backdrop: { onClick: (e) => e.stopPropagation() } } },
            styleOverrides: {
                paper: ({ theme: t }) => ({ backgroundImage: 'none', backgroundColor: t.palette.background.paper, border: `1px solid ${alpha(t.palette.text.primary, borderOp)}`, boxShadow: shadow.md, borderRadius: t.shape.borderRadius }),
                list: { paddingTop: 4, paddingBottom: 4 },
            },
        },
        MuiMenuItem: { styleOverrides: { root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius - 3, marginInline: 4, paddingInline: 12, fontSize: '0.875rem',
                    '&.Mui-selected': { backgroundColor: alpha(B.primary.main, isDark ? 0.14 : 0.07), '&:hover': { backgroundColor: alpha(B.primary.main, isDark ? 0.18 : 0.10) } },
                })}},
        MuiPopover: {
            defaultProps: { slotProps: { backdrop: { onClick: (e) => e.stopPropagation() } } },
            styleOverrides: { paper: ({ theme: t }) => ({ backgroundImage: 'none', backgroundColor: t.palette.background.paper, border: `1px solid ${alpha(t.palette.text.primary, borderOp)}`, boxShadow: shadow.md, borderRadius: t.shape.borderRadius }) },
        },
        MuiTooltip: { styleOverrides: {
                tooltip: () => ({ borderRadius: 6, backgroundColor: isDark ? frost : ink, color: isDark ? ink : '#FFFFFF', fontWeight: 500, fontSize: '0.75rem', boxShadow: shadow.sm, padding: '5px 10px', ...(isDark ? { border: `1px solid ${alpha(ink, 0.10)}` } : { border: 'none' }) }),
                arrow: () => ({ color: isDark ? frost : ink }),
            }},
        MuiAlert: { styleOverrides: {
                root: ({ theme: t }) => ({ borderRadius: t.shape.borderRadius, boxShadow: 'none', border: `1px solid ${alpha(t.palette.text.primary, borderOp)}`, '& .MuiAlert-icon': { alignItems: 'center' } }),
                standardSuccess: ({ theme: t }) => ({ backgroundColor: alpha(t.palette.success.main, isDark ? 0.10 : 0.07), borderColor: alpha(t.palette.success.main, isDark ? 0.20 : 0.14) }),
                standardInfo:    ({ theme: t }) => ({ backgroundColor: alpha(t.palette.info.main,    isDark ? 0.10 : 0.07), borderColor: alpha(t.palette.info.main,    isDark ? 0.20 : 0.14) }),
                standardWarning: ({ theme: t }) => ({ backgroundColor: alpha(t.palette.warning.main, isDark ? 0.10 : 0.07), borderColor: alpha(t.palette.warning.main, isDark ? 0.20 : 0.14) }),
                standardError:   ({ theme: t }) => ({ backgroundColor: alpha(t.palette.error.main,   isDark ? 0.10 : 0.07), borderColor: alpha(t.palette.error.main,   isDark ? 0.20 : 0.14) }),
            }},
        MuiSnackbarContent: { styleOverrides: { root: ({ theme: t }) => ({ borderRadius: t.shape.borderRadius, boxShadow: shadow.md, backgroundColor: isDark ? t.palette.grey[200] : t.palette.grey[800] }) } },
        MuiLinearProgress: { styleOverrides: {
                root: { borderRadius: 999, height: 4, backgroundColor: alpha(B.primary.main, isDark ? 0.18 : 0.10), overflow: 'hidden' },
                bar:  { borderRadius: 999, backgroundColor: B.secondary.main, transition: `transform ${MOTION.gentle}ms ${MOTION.ease}` },
            }},
        MuiAvatar: { styleOverrides: { root: () => ({
                    backgroundColor: alpha(B.primary.main, isDark ? 0.16 : 0.08),
                    color: isDark ? B.primary.light : B.primary.dark, fontWeight: 620,
                    border: `1.5px solid ${alpha(B.primary.main, isDark ? 0.18 : 0.10)}`,
                    transition: `border-color ${MOTION.base}ms ${MOTION.ease}`,
                })}},
        MuiBadge: { styleOverrides: {
                colorPrimary:   ({ theme: t }) => ({ backgroundColor: B.primary.main,   color: '#FFFFFF', boxShadow: `0 0 0 2px ${t.palette.background.paper}` }),
                colorSecondary: ({ theme: t }) => ({ backgroundColor: B.secondary.main, color: '#FFFFFF', boxShadow: `0 0 0 2px ${t.palette.background.paper}` }),
            }},
        MuiListItemButton: { styleOverrides: { root: () => ({
                    borderRadius: 10,
                    '&.Mui-selected': { backgroundColor: alpha(B.primary.main, isDark ? 0.14 : 0.07), '&:hover': { backgroundColor: alpha(B.primary.main, isDark ? 0.18 : 0.10) } },
                })}},
        MuiSkeleton: { styleOverrides: { root: ({ theme: t }) => ({
                    borderRadius: t.shape.borderRadius, backgroundColor: alpha(t.palette.text.primary, isDark ? 0.06 : 0.04),
                    '&::after': { animationDuration: '1.8s', background: `linear-gradient(90deg, transparent, ${alpha(t.palette.text.primary, isDark ? 0.04 : 0.03)}, transparent)` },
                })}},
        MuiTableCell: { styleOverrides: {
                head: ({ theme: t }) => ({ fontWeight: 620, fontSize: '0.8125rem', color: t.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: 'transparent', borderBottomColor: alpha(t.palette.text.primary, isDark ? 0.12 : 0.09) }),
                body: ({ theme: t }) => ({ borderBottomColor: alpha(t.palette.text.primary, isDark ? 0.08 : 0.06) }),
            }},
        MuiCheckbox: { styleOverrides: { root: ({ theme: t }) => ({ borderRadius: 4, '&.Mui-checked': { color: t.palette.secondary.main }, '&.MuiCheckbox-indeterminate': { color: t.palette.secondary.main }, '&:focus-visible': { boxShadow: focusRing() } }) } },
        MuiRadio:    { styleOverrides: { root: ({ theme: t }) => ({ '&.Mui-checked': { color: t.palette.secondary.main }, '&:focus-visible': { boxShadow: focusRing() } }) } },
        MuiSwitch: { styleOverrides: {
                root: { width: 44, height: 26, padding: 0, borderRadius: 999 },
                switchBase: ({ theme: t }) => ({ padding: 3, '&.Mui-checked': { transform: 'translateX(18px)', color: '#FFF', '& + .MuiSwitch-track': { backgroundColor: t.palette.secondary.main, opacity: 1 } }, '&:focus-visible': { boxShadow: focusRing() } }),
                track: () => ({ borderRadius: 999, backgroundColor: alpha(ink, isDark ? 0.20 : 0.14), opacity: 1 }),
                thumb: { width: 20, height: 20, boxShadow: shadow.xs },
            }},
        MuiSlider: { styleOverrides: { root: { '& .MuiSlider-thumb': { boxShadow: shadow.xs, '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${alpha(B.secondary.main, isDark ? 0.20 : 0.14)}` } }, '& .MuiSlider-track': { border: 'none' } } } },
        MuiContainer: { styleOverrides: { root: { paddingLeft: 16, paddingRight: 16, '@media (min-width: 600px)': { paddingLeft: 24, paddingRight: 24 } } } },
        MuiBreadcrumbs: { styleOverrides: { separator: ({ theme: t }) => ({ color: t.palette.text.secondary }) } },
        MuiAccordion: { styleOverrides: { root: ({ theme: t }) => ({
                    border: surfaceBorder(t), borderRadius: `${t.shape.borderRadius}px !important`, boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0, boxShadow: 'none', borderColor: alpha(t.palette.text.primary, borderOp + 0.04) },
                })}},
        MuiToggleButtonGroup: { styleOverrides: { root: ({ theme: t }) => ({ borderRadius: t.shape.borderRadius, border: `1px solid ${alpha(t.palette.text.primary, isDark ? 0.12 : 0.09)}` }) } },
        MuiToggleButton: { styleOverrides: { root: () => ({
                    textTransform: 'none', fontWeight: 580,
                    '&.Mui-selected': { backgroundColor: alpha(B.primary.main, isDark ? 0.16 : 0.08), color: isDark ? B.primary.light : B.primary.dark, '&:hover': { backgroundColor: alpha(B.primary.main, isDark ? 0.22 : 0.11) } },
                })}},
        MuiPagination: { styleOverrides: { root: { '& .MuiPaginationItem-root': { borderRadius: 999 } } } },
        MuiLink: { defaultProps: { underline: 'none' }, styleOverrides: { root: ({ theme: t }) => ({
                    color: isDark ? t.palette.primary.light : t.palette.primary.main, fontWeight: 580, textDecoration: 'none',
                    transition: `color ${MOTION.base}ms ${MOTION.ease}`,
                    '&:hover': { color: isDark ? t.palette.secondary.light : t.palette.secondary.main, textDecoration: 'underline', textDecorationColor: alpha(isDark ? t.palette.secondary.light : t.palette.secondary.main, isDark ? 0.40 : 0.35), textUnderlineOffset: '3px' },
                    '&:focus-visible': { outline: 'none', boxShadow: focusRing(), borderRadius: t.shape.borderRadius / 2 },
                })}},
        MuiRating: { styleOverrides: {
                root: ({ theme: t }) => ({
                    '& .MuiRating-iconFilled': { color: t.palette.warning.main },
                    '& .MuiRating-iconHover': { color: t.palette.warning.main },
                    '& .MuiRating-iconEmpty': { color: t.palette.action.disabled },
                }),
            }},
    };

    /* ── Assemble ────────────────────────────────────────────────── */
    let theme = createTheme({ palette, shape: { borderRadius: 10 }, custom, typography, components });
    theme = responsiveFontSizes(theme);
    return theme;
}

/* ── Shared helper exports (same API as the old monolith themes) ──────────── */

let _listStaggerInjected = false;
export function ensureListStaggerKeyframes() {
    if (_listStaggerInjected) return;
    _listStaggerInjected = true;
    const style = document.createElement('style');
    style.textContent = MOTION.listStagger.keyframesCss;
    document.head.appendChild(style);
}

export function getListStaggerSx(idx) {
    const ls = MOTION.listStagger;
    return { animation: `${ls.keyframeName} ${ls.durationMs}ms ${ls.easing} both`, animationDelay: `${Math.min(idx * ls.delayPerItem, ls.maxDelayMs)}ms` };
}

export function getDiscoverStaggerSx(idx, revealed) {
    const ds = MOTION.discoverStagger;
    const delay = Math.min(idx * ds.delayPerItem, ds.maxDelayMs);
    return { opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0) scale(1)' : `translateY(${ds.offsetY}px) scale(${ds.scaleFrom})`, transition: `opacity ${ds.durationMs}ms ${ds.easing} ${delay}ms, transform ${ds.durationMs}ms ${ds.easing} ${delay}ms`, willChange: 'opacity, transform' };
}

export function getProfileSubTabsSx(t) {
    const cfg = t.custom.profileSubTabs; const m = t.custom.motion;
    const isDark = t.palette.mode === 'dark';
    return {
        minHeight: cfg.minHeight,
        '& .MuiTab-root': {
            minHeight: cfg.minHeight, minWidth: 0, px: 1, py: { xs: 0.75, sm: 1 }, textTransform: 'none',
            fontWeight: cfg.tab.fontWeight, fontSize: cfg.tab.fontSize, letterSpacing: cfg.tab.letterSpacing, borderRadius: 0,
            color: alpha(isDark ? t.palette.primary.light : t.palette.primary.main, cfg.tab.unselectedOpacity),
            transition: `color ${m.base}ms ${m.ease}`,
            '& .MuiTab-iconWrapper': { marginBottom: 0, display: 'flex', alignItems: 'center' },
            '& .MuiSvgIcon-root': { color: alpha(isDark ? t.palette.primary.light : t.palette.primary.main, cfg.tab.iconUnselectedOpacity), transition: `color ${m.fast}ms ${m.ease}, transform ${m.fast}ms ${m.ease}` },
            '&.Mui-selected': { color: isDark ? t.palette.primary.light : t.palette.primary.main },
            '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.secondary.main },
            '&:hover .MuiSvgIcon-root': { color: t.palette.secondary.main, transform: 'translateY(-1px)' },
            '& .llTabIcon': { color: alpha(isDark ? t.palette.primary.light : t.palette.primary.main, cfg.tab.iconUnselectedOpacity), transition: `color ${m.fast}ms ${m.ease}` },
            '&:hover .llTabIcon': { color: t.palette.secondary.main },
            '&.Mui-selected .llTabIcon': { color: t.palette.secondary.main },
        },
        '& .MuiTabs-indicator': { height: cfg.indicator.height, borderRadius: cfg.indicator.borderRadius, backgroundColor: t.palette.secondary.main },
    };
}

export function getProfileFilterBarSx(t, columns) {
    const cfg = t.custom.profileFilterBar;
    return { px: cfg.px, pt: cfg.pt, pb: cfg.pb, borderBottom: '1px solid', borderColor: alpha(t.palette.primary.main, cfg.borderOpacity), bgcolor: alpha(t.palette.primary.main, cfg.bgOpacity), display: 'grid', gap: cfg.gap, gridTemplateColumns: columns || { xs: '1fr', sm: '1fr 1fr' } };
}

export function getProfileSelectSx(t) {
    const cfg = t.custom.profileFilterBar;
    return { '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.primary.main, cfg.inputBorderOpacity) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.primary.main, cfg.inputBorderHoverOpacity) } };
}

/* ── Tiny utility ────────────────────────────────────────────────── */
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)].join(',');
}

/* ── Theme-adaptive colour helper ────────────────────────────────
 *  Admin-chosen colours (accent, highlight, badge, spotlight) are stored
 *  as fixed hex values.  They can be invisible on a theme whose mode
 *  differs from the one the admin was using when they picked the colour.
 *
 *  adaptColor(hex, muiTheme)  returns a CSS colour string that is
 *  guaranteed to be readable on the current theme's background.
 *
 *  Strategy: convert to HSL.  On dark themes, enforce a minimum lightness
 *  (lift very dark colours).  On light themes, enforce a maximum lightness
 *  (push very pale colours darker).  Saturation is preserved.
 *
 *  Usage in components:
 *    import { adaptColor } from '../themes/createLanternTheme';
 *    const safeAccent = adaptColor(item.accent_color, theme);
 * ─────────────────────────────────────────────────────────────── */
function hexToHsl(hex) {
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

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function adaptColor(hex, theme) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
    const isDark = theme?.palette?.mode === 'dark';
    const [h, s, l] = hexToHsl(hex);

    if (isDark) {
        // On dark backgrounds, colours below ~40% lightness disappear
        // Lift them while keeping hue & most of saturation
        if (l < 40) {
            const newL = 40 + (l / 40) * 15; // maps 0→40 into 40→55
            const newS = Math.min(s, 85);     // keep vivid but not neon
            return hslToHex(h, newS, newL);
        }
    } else {
        // On light backgrounds, colours above ~75% lightness wash out
        if (l > 75) {
            const newL = 75 - ((l - 75) / 25) * 30; // maps 75→100 into 75→45
            return hslToHex(h, s, newL);
        }
    }
    return hex; // colour is fine as-is
}

/**
 *  adaptBgColor — like adaptColor but for backgrounds (spotlight bar bg, etc.).
 *  On dark themes, very light bg colours get darkened.
 *  On light themes, very dark bg colours get lightened.
 */
export function adaptBgColor(hex, theme) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
    const isDark = theme?.palette?.mode === 'dark';
    const [h, s, l] = hexToHsl(hex);

    if (isDark) {
        // On dark themes, bright bg colours look jarring — darken them
        if (l > 35) {
            const newL = 10 + (l / 100) * 20; // compress into 10–30 range
            const newS = Math.min(s, 60);
            return hslToHex(h, newS, newL);
        }
    } else {
        // On light themes, dark bg colours look heavy — lighten them
        if (l < 65) {
            const newL = 88 + ((100 - l) / 100) * 8; // compress into 88–96 range
            const newS = Math.min(s, 40);
            return hslToHex(h, newS, newL);
        }
    }
    return hex;
}

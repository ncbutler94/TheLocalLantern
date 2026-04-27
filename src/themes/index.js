// src/themes/index.js
import createLanternTheme, {
    ensureListStaggerKeyframes, getListStaggerSx, getDiscoverStaggerSx,
    getProfileSubTabsSx, getProfileFilterBarSx, getProfileSelectSx,
    adaptColor, adaptBgColor,
} from './createLanternTheme';

export { ensureListStaggerKeyframes, getListStaggerSx, getDiscoverStaggerSx, getProfileSubTabsSx, getProfileFilterBarSx, getProfileSelectSx, adaptColor, adaptBgColor };

// Helper to build a config entry concisely
const T = (id, name, colors, config) => ({ id, name, colors, config });

// ═══════════════════════════════════════════════════════════════════════════
//  Logo colour reference (from uploaded Local Lantern logo):
//
//    Crimson   #BF0D2E   — Alabama flag cross
//    Brass     #C8982C   — Lantern body / handle
//    Gold      #D4A046   — Lantern warm glow
//    Amber     #F5C842   — Lantern flame highlight
//    White     #FFFFFF   — Flag field
//    Black     #000000   — Transparent background fill
//
//  Every theme is built from these anchors plus colours drawn from
//  Alabama's landscape — red clay, magnolia whites, Gulf turquoise,
//  yellowhammer gold, cotton whites, iron ore, bayou green, and mountain
//  twilight — so the UI always feels like it belongs to the state.
// ═══════════════════════════════════════════════════════════════════════════

const configs = [
    // ─────────────────── LIGHT THEMES (5) ───────────────────────────────────

    // 1. Cotton Country — the default light theme
    //    Deep denim-indigo primary inspired by workwear and wide skies,
    //    with a warm harvest-gold secondary. Natural cotton-white surfaces.
    //    Practical and trustworthy — like a clear day over the fields
    //    in the Wiregrass region. Universally welcoming as a default.
    T('light', 'Cotton Country', ['#2C5282','#8B6914','#C8982C','#FAFAF6'],
        {
            mode: 'light',
            primary:    { main: '#2C5282', light: '#3B6BA0', dark: '#1E3A5C' },
            secondary:  { main: '#8B6914', light: '#A8822A', dark: '#6E520E' },
            background: { default: '#FAFAF6', paper: '#FFFFFF' },
            text:       { primary: '#1A1E24', secondary: '#5A6070' },
            brass: '#C8982C',
            frost: '#E8E6DE',
            brandGradient: 'linear-gradient(135deg, #2C5282 0%, #8B6914 55%, #C8982C 100%)',
        }),

    // 2. Magnolia Morning — soft Southern elegance
    //    Sage-green primary from magnolia leaves, blush-rose secondary
    //    recalling the blooms at dawn. Warm cream surfaces and golden
    //    terracotta accents. Gentle and welcoming — like a front porch
    //    on a spring morning in Mobile.
    T('magnolia', 'Magnolia Morning', ['#4A6741','#C46B6B','#D4A046','#FAF8F4'],
        {
            mode: 'light',
            primary:    { main: '#4A6741', light: '#5E8254', dark: '#3A5234' },
            secondary:  { main: '#C46B6B', light: '#D48888', dark: '#A25252' },
            background: { default: '#FAF8F4', paper: '#FFFFFF' },
            text:       { primary: '#1E2A1A', secondary: '#5C6858' },
            brass: '#D4A046',
            frost: '#EDE9E0',
            brandGradient: 'linear-gradient(135deg, #4A6741 0%, #C46B6B 60%, #D4A046 100%)',
        }),

    // 3. Gulf Coast — breezy coastal Alabama
    //    Teal primary from the Gulf waters off Gulf Shores, with warm
    //    coral-sand secondary. Clean and sun-washed — like a Saturday
    //    on the white sand beaches of Orange Beach with salt air and
    //    a cold drink in hand.
    T('gulf-coast', 'Gulf Coast', ['#1E7A7A','#D47742','#F5C842','#F8FAFB'],
        {
            mode: 'light',
            primary:    { main: '#1E7A7A', light: '#2A9696', dark: '#145C5C' },
            secondary:  { main: '#D47742', light: '#E09060', dark: '#B55E2E' },
            background: { default: '#F8FAFB', paper: '#FFFFFF' },
            text:       { primary: '#142426', secondary: '#4E6264' },
            brass: '#F5C842',
            frost: '#E4EDEE',
            brandGradient: 'linear-gradient(135deg, #1E7A7A 0%, #D47742 55%, #F5C842 100%)',
        }),

    // 4. Yellowhammer — Alabama's state bird
    //    Rich golden-ochre primary with a warm chestnut-brown secondary.
    //    Sunny and distinctive — the yellow flicker of a yellowhammer's
    //    wings catching light through longleaf pine. Cheerful without
    //    being loud; proud without picking sides.
    T('yellowhammer', 'Yellowhammer', ['#8C6D1F','#6B4232','#D4A046','#FFFDF5'],
        {
            mode: 'light',
            primary:    { main: '#8C6D1F', light: '#A8862E', dark: '#6E5510' },
            secondary:  { main: '#6B4232', light: '#8A5A48', dark: '#4E2E22' },
            background: { default: '#FFFDF5', paper: '#FFFFFF' },
            text:       { primary: '#2A2210', secondary: '#6A5D48' },
            brass: '#D4A046',
            frost: '#F0EAD8',
            brandGradient: 'linear-gradient(135deg, #8C6D1F 0%, #D4A046 50%, #6B4232 100%)',
        }),

    // 5. Red Clay — bold crimson and brass
    //    Named for Alabama's iconic red clay soil that runs across the
    //    central part of the state. Deep crimson primary on warm ivory
    //    with brass-gold accents. Cards feel like pressed linen — warm,
    //    bold, and grounded in the land.
    T('red-clay', 'Red Clay', ['#8B1A2B','#C8982C','#D4A046','#FBF7F0'],
        {
            mode: 'light',
            primary:    { main: '#8B1A2B', light: '#A8324A', dark: '#6E1022' },
            secondary:  { main: '#C8982C', light: '#D9AD48', dark: '#A67A1C' },
            background: { default: '#FBF7F0', paper: '#FFFFFF' },
            text:       { primary: '#2C1810', secondary: '#6B5444' },
            brass: '#D4A046',
            frost: '#F2EBE0',
            brandGradient: 'linear-gradient(135deg, #8B1A2B 0%, #C8982C 55%, #D4A046 100%)',
        }),

    // ─────────────────── DARK THEMES (5) ────────────────────────────────────

    // 6. Southern Twilight — warm Alabama evening (default dark)
    //    Rich charcoal base with warm amber primary that glows like a
    //    lantern on a porch at dusk. Crimson secondary for highlights.
    //    Surfaces have a subtle warm undertone — the last light fading
    //    over the Tennessee Valley.
    T('dark', 'Southern Twilight', ['#E8B44A','#E0475A','#F5C842','#0D0B08'],
        {
            mode: 'dark',
            primary:    { main: '#D4A046', light: '#E8B44A', dark: '#B8862E' },
            secondary:  { main: '#E0475A', light: '#F06878', dark: '#BF0D2E' },
            background: { default: '#0D0B08', paper: '#1A1610' },
            text:       { primary: '#F0EADE', secondary: '#A89A86' },
            brass: '#F5C842',
            frost: '#2A2318',
            brandGradient: 'linear-gradient(135deg, #D4A046 0%, #E0475A 60%, #BF0D2E 100%)',
        }),

    // 7. Black Belt Ember — Alabama's heartland
    //    Named for the Black Belt region and its rich dark soil. Molten
    //    crimson primary with bright gold accents on near-black surfaces.
    //    Bold and dramatic — the lantern glowing fiercely against a
    //    moonless country night.
    T('black-belt', 'Black Belt Ember', ['#E84058','#F5C842','#D4A046','#080604'],
        {
            mode: 'dark',
            primary:    { main: '#E84058', light: '#F06878', dark: '#C4283E' },
            secondary:  { main: '#F5C842', light: '#F8D86E', dark: '#D4A046' },
            background: { default: '#080604', paper: '#141010' },
            text:       { primary: '#F2ECE4', secondary: '#B0A494' },
            brass: '#F5C842',
            frost: '#241C16',
            brandGradient: 'linear-gradient(135deg, #E84058 0%, #F5C842 60%, #D4A046 100%)',
        }),

    // 8. Iron City — Birmingham steel
    //    Named for Birmingham, once the iron and steel capital of the
    //    South. Cool steel-blue primary with forge-orange secondary on
    //    blue-tinted dark surfaces. Industrial strength with warm sparks —
    //    like the glow of a foundry against the night sky over Red Mountain.
    T('iron-city', 'Iron City', ['#7EB0CC','#E07840','#D4A046','#0A0C10'],
        {
            mode: 'dark',
            primary:    { main: '#6A9CB8', light: '#7EB0CC', dark: '#5286A0' },
            secondary:  { main: '#E07840', light: '#F09060', dark: '#C06028' },
            background: { default: '#0A0C10', paper: '#14181E' },
            text:       { primary: '#E0E4EC', secondary: '#8894A6' },
            brass: '#E07840',
            frost: '#1E2430',
            brandGradient: 'linear-gradient(135deg, #7EB0CC 0%, #E07840 55%, #D4A046 100%)',
        }),

    // 9. Bayou Moss — the Southern swamp at dusk
    //    Muted sage-green primary like Spanish moss hanging from
    //    cypress trees, with warm tawny-gold secondary. Green-tinted
    //    dark surfaces. Quiet and mysterious — like an evening on the
    //    Mobile-Tensaw Delta with fireflies just starting to blink.
    T('bayou', 'Bayou Moss', ['#8AAE7E','#C8A060','#D4A046','#080A06'],
        {
            mode: 'dark',
            primary:    { main: '#78A06C', light: '#8AAE7E', dark: '#5E8852' },
            secondary:  { main: '#C8A060', light: '#DABA7E', dark: '#A88240' },
            background: { default: '#080A06', paper: '#121610' },
            text:       { primary: '#E2E8DA', secondary: '#94A088' },
            brass: '#C8A060',
            frost: '#1C221A',
            brandGradient: 'linear-gradient(135deg, #8AAE7E 0%, #C8A060 55%, #D4A046 100%)',
        }),

    // 10. Cheaha Midnight — Alabama's highest point
    //     Named for Cheaha Mountain in the Talladega range. Cool mountain-
    //     blue primary with a warm ridge-sunset secondary. Deep blue-black
    //     surfaces. Calm and expansive — standing on the summit at night
    //     looking out over the Piedmont under a sky full of stars.
    T('cheaha', 'Cheaha Midnight', ['#8B9EC8','#D4784A','#D4A046','#08080E'],
        {
            mode: 'dark',
            primary:    { main: '#7A8CB8', light: '#8B9EC8', dark: '#6276A0' },
            secondary:  { main: '#D4784A', light: '#E09268', dark: '#B86032' },
            background: { default: '#08080E', paper: '#12121A' },
            text:       { primary: '#E4E6F0', secondary: '#8E92A8' },
            brass: '#D4A046',
            frost: '#1E1E2A',
            brandGradient: 'linear-gradient(135deg, #8B9EC8 0%, #D4784A 55%, #D4A046 100%)',
        }),
];

// ─── Fixed brand colours for SVG map markers (logo-level, theme-independent) ─
export const BRAND = {
    navy:        '#0F2D52',
    navyDark:    '#0A1F3A',
    crimson:     '#BF0D2E',
    crimsonDark: '#980A24',
    white:       '#FFFFFF',
};

// ─── Build & export ─────────────────────────────────────────────────────────
export const THEMES = configs.map(({ id, name, colors, config }) => ({
    id, name, colors,
    theme: createLanternTheme(config),
}));

export const DEFAULT_THEME = 'light';

export function getThemeById(id) {
    const entry = THEMES.find((t) => t.id === id);
    return entry ? entry.theme : THEMES[0].theme;
}

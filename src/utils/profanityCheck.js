// src/utils/profanityCheck.js
//
// Client-side profanity check for instant feedback before form submission.
// This is a BACKUP — the real moderation happens on the backend via
// OpenAI's Moderation API + nsfwjs. This just gives users a fast heads-up
// so they don't have to wait for the server round-trip.
//
// Uses the same NFKD normalization pattern as username blocking.
// ─────────────────────────────────────────────────────────────────────

/* ── Normalizers ── */

/**
 * Normalize for word-boundary token matching.
 * Keeps spaces so we can split into individual words.
 */
function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')     // strip diacritical marks
        .replace(/[^a-z0-9\s]/g, '')         // keep letters, numbers, spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Strict normalize — strips ALL non-alphanumeric including spaces.
 * "big dick" → "bigdick", "f.u.c.k" → "fuck", "çüñt" → "cunt"
 */
function normalizeStrict(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/* ── Banned words (single tokens, checked with word boundaries) ── */
/* IMPORTANT: This is intentionally a very short list. It only catches the
   most severe slurs that have NO legitimate use in any context.
   All other content moderation (profanity, harassment, threats, NSFW) is
   handled by the backend via OpenAI's Moderation API + nsfwjs, which
   understands context and doesn't false-positive on innocent text. */
const BANNED_WORDS = new Set([
    // Racial slurs — no legitimate use
    'nigger', 'niggers', 'nigga', 'niggas',
    'kike', 'kikes',
    'wetback', 'wetbacks',
    'beaner', 'beaners',
    'raghead', 'ragheads', 'towelhead', 'towelheads',
    'zipperhead', 'jigaboo',
    'darkie', 'darkies',

    // Homophobic slurs
    'faggot', 'faggots',
]);

/* ── Banned phrases (checked as substrings in raw lowercased text only) ── */
/* Same philosophy as above — only the most severe targeted attacks.
   The backend AI moderation catches everything else with context awareness. */
const BANNED_PHRASES = [
    // Targeted racial/ethnic attack phrases
    'go back to your country',
    'go back to africa',
    'go back to mexico',
].map(p => p.toLowerCase());

// Pre-normalize for evasion detection — only phrases long enough to avoid false positives
const BANNED_PHRASES_NORMALIZED = BANNED_PHRASES.map(p => normalizeStrict(p));
const BANNED_WORDS_NORMALIZED = new Set([...BANNED_WORDS].map(w => normalizeStrict(w)));


/**
 * Check a string for profanity.
 *
 * @param {string} text - The text to check
 * @returns {{ clean: boolean, reason?: string }}
 */
export function checkProfanity(text) {
    if (!text || typeof text !== 'string') return { clean: true };

    const lower = text.toLowerCase();

    // ── Pass 1: Raw text ──

    // Phrases (substring match on raw text — these are multi-word so false positives are rare)
    for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase)) {
            return { clean: false, reason: 'profanity' };
        }
    }

    // Words (word-boundary — only matches whole tokens separated by non-word chars)
    const tokens = lower.split(/[^a-zA-Z0-9\u00C0-\u024F]+/).filter(Boolean);
    for (const token of tokens) {
        if (BANNED_WORDS.has(token)) {
            return { clean: false, reason: 'profanity' };
        }
    }

    // ── Pass 2: Normalized word-boundary check (catches diacritics evasion like "fück") ──
    // Only checks individual word tokens — never substring matching on joined text,
    // which caused false positives like "passed" matching "ass".
    const normalizedSpaced = normalizeText(text);
    const normalizedTokens = normalizedSpaced.split(/\s+/).filter(Boolean);
    for (const token of normalizedTokens) {
        if (BANNED_WORDS_NORMALIZED.has(token)) {
            return { clean: false, reason: 'profanity' };
        }
    }

    return { clean: true };
}

/**
 * Check multiple fields at once. Returns the name of the first
 * field that fails, or null if everything is clean.
 *
 * @param {Record<string, string>} fields - e.g. { title: '...', description: '...' }
 * @returns {{ clean: boolean, field?: string }}
 */
export function checkFieldsProfanity(fields) {
    for (const [fieldName, value] of Object.entries(fields)) {
        if (!value) continue;
        const result = checkProfanity(value);
        if (!result.clean) {
            return { clean: false, field: fieldName };
        }
    }
    return { clean: true, field: null };
}

export default { checkProfanity, checkFieldsProfanity };

// src/pages/business/utils/slugify.js
/**
 * slugify
 * -------
 * Shared helper for generating URL-safe slugs for Businesses/Organizations.
 *
 * Notes:
 * - Keeps output stable and readable.
 * - Avoids trailing/leading dashes.
 * - Falls back to "business" when the input has no usable characters.
 *
 * We can later enforce uniqueness server-side by appending "-2", "-3", etc.
 */
export default function slugify(input) {
    const raw = String(input ?? '').trim().toLowerCase();

    // Replace & with "and" to avoid weird slugs like "a-&-b"
    const amp = raw.replace(/&/g, ' and ');

    // Keep alphanumerics, spaces, and dashes; drop everything else.
    const cleaned = amp
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const dashed = cleaned
        .replace(/\s/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    return dashed || 'business';
}

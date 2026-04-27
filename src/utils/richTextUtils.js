// src/utils/richTextUtils.js

/**
 * Lightweight HTML sanitiser for job descriptions.
 * Allows only a safe subset of tags / attributes — everything else is stripped.
 *
 * Allowed tags:
 *   p, br, b, strong, i, em, u, s, strike, h3, ul, ol, li, a, span, div
 *
 * Allowed attributes:
 *   a    → href, target, rel, class, data-mention
 *   span → class, data-mention, contenteditable
 *   *    → (none)
 *
 * This intentionally does NOT parse a full DOM tree; it uses a simple
 * tag-level regex walker which is safe for our use case (we control input
 * via contentEditable, not arbitrary user HTML).
 */

const ALLOWED_TAGS = new Set([
    "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
    "h3", "ul", "ol", "li", "a", "span", "div",
]);

const ALLOWED_ATTRS = {
    a:    new Set(["href", "target", "rel", "class", "data-mention"]),
    span: new Set(["class", "data-mention", "contenteditable"]),
};

/**
 * Sanitise an HTML string, keeping only safe tags and attributes.
 * @param {string} html  Raw HTML from contentEditable
 * @returns {string}     Sanitised HTML
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== "string") return "";

    // Replace all tags with sanitised versions
    return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)?\/?>/gi, (match, tag, attrs) => {
        const lower = tag.toLowerCase();
        if (!ALLOWED_TAGS.has(lower)) return "";

        // Self-closing tags
        if (lower === "br") return "<br>";

        // Closing tag
        if (match.startsWith("</")) return `</${lower}>`;

        // Opening tag — filter attributes
        const allowedSet = ALLOWED_ATTRS[lower];
        if (!allowedSet || !attrs || !attrs.trim()) {
            return `<${lower}>`;
        }

        // Parse attributes
        const safeAttrs = [];
        const attrRegex = /([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
            const name = attrMatch[1].toLowerCase();
            const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
            if (!allowedSet.has(name)) continue;

            // Block javascript: hrefs
            if (name === "href") {
                const trimmed = value.trim().toLowerCase();
                if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
                    continue;
                }
            }

            // Sanitise class values — only allow known safe class names
            if (name === "class") {
                const safeClasses = value.split(/\s+/).filter((c) =>
                    c === "mention-tag" || c === "mention-link"
                ).join(" ");
                if (!safeClasses) continue;
                safeAttrs.push(`class="${safeClasses}"`);
                continue;
            }

            // Sanitise data-mention — only allow simple handle characters
            if (name === "data-mention") {
                const cleaned = value.replace(/[^a-zA-Z0-9_.]/g, "");
                if (!cleaned) continue;
                safeAttrs.push(`data-mention="${cleaned}"`);
                continue;
            }

            // Sanitise contenteditable — only allow "false"
            if (name === "contenteditable") {
                if (value === "false") {
                    safeAttrs.push('contenteditable="false"');
                }
                continue;
            }

            safeAttrs.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
        }

        // For <a> tags, always force target and rel
        if (lower === "a") {
            if (!safeAttrs.some((a) => a.startsWith("target="))) {
                safeAttrs.push('target="_blank"');
            }
            if (!safeAttrs.some((a) => a.startsWith("rel="))) {
                safeAttrs.push('rel="noopener noreferrer"');
            }
        }

        const attrStr = safeAttrs.length ? ` ${safeAttrs.join(" ")}` : "";
        return `<${lower}${attrStr}>`;
    });
}

/**
 * Strip all HTML tags and return plain text.
 * Useful for card previews and character counting.
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
    if (!html || typeof html !== "string") return "";
    // Replace <br>, </p>, </div>, </li>, </h3> with newline, then strip tags
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(?:p|div|li|h3)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Check whether a string contains any HTML tags.
 * Used to decide between rich display and plain-text linkification.
 * @param {string} str
 * @returns {boolean}
 */
export function containsHtml(str) {
    if (!str || typeof str !== "string") return false;
    return /<[a-z][\s\S]*>/i.test(str);
}

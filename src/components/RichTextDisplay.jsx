// src/components/RichTextDisplay.jsx

import React, { useState, useRef, useMemo, useCallback } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { containsHtml, sanitizeHtml } from "../utils/richTextUtils";
import UserCardPopover from "./UserCardPopover";
import { useAuth } from "./AuthModalContext";
import { useActiveAccount } from "./AccountContext";
import { secureFetch } from "../utils/secureFetch";

const api = process.env.REACT_APP_API_URL || "";

/* ── Convert mention <span> tags from RichTextEditor into <a> tags ── */
const convertMentionSpansToLinks = (html) => {
    if (!html) return html;
    return html
        .replace(
            /<span\b[^>]*?\bclass="mention-tag"[^>]*?\bdata-mention="([^"]+)"[^>]*?>(@[^<]*?)<\/span>/gi,
            (_, handle, display) =>
                `<a href="/${handle}" class="mention-link" data-mention="${handle}">${display}</a>`
        )
        .replace(
            /<span\b[^>]*?\bdata-mention="([^"]+)"[^>]*?\bclass="mention-tag"[^>]*?>(@[^<]*?)<\/span>/gi,
            (_, handle, display) =>
                `<a href="/${handle}" class="mention-link" data-mention="${handle}">${display}</a>`
        );
};

/**
 * Convert plain-text @handle patterns inside HTML text nodes into mention <a> tags.
 */
const convertPlainMentionsInHtml = (html) => {
    if (!html || typeof html !== "string" || !html.includes("@")) return html;

    const TAG_RE = /<[^>]*>/g;
    const parts = [];
    let lastIndex = 0;
    let inAnchor = 0;
    let m;

    while ((m = TAG_RE.exec(html)) !== null) {
        if (m.index > lastIndex) {
            parts.push({ type: "text", value: html.slice(lastIndex, m.index), inAnchor });
        }
        const tag = m[0];
        parts.push({ type: "tag", value: tag, inAnchor });
        if (/^<a[\s>]/i.test(tag)) inAnchor++;
        else if (/^<\/a>/i.test(tag)) inAnchor = Math.max(0, inAnchor - 1);
        lastIndex = m.index + m[0].length;
    }
    if (lastIndex < html.length) {
        parts.push({ type: "text", value: html.slice(lastIndex), inAnchor });
    }

    const MENTION_RE = /(^|[^a-zA-Z_.])@([a-zA-Z0-9_]{2,30})/g;
    let changed = false;
    const output = parts.map((part) => {
        if (part.type !== "text" || part.inAnchor > 0) return part.value;
        if (!part.value.includes("@")) return part.value;
        const replaced = part.value.replace(MENTION_RE, (match, before, handle) => {
            changed = true;
            return `${before}<a href="/${handle}" class="mention-link" data-mention="${handle}">@${handle}</a>`;
        });
        return replaced;
    });

    return changed ? output.join("") : html;
};

/* ── Resolve a @mention handle to the correct account type ── */
const resolveMentionHandle = async (handle) => {
    const h = String(handle || "").replace(/^@/, "").trim();
    if (!h) return { handle: h };

    try {
        const res = await secureFetch(
            `/api/community/users/search?q=${encodeURIComponent(h)}`,
            { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return { handle: h };

        const data = await res.json();
        const results = Array.isArray(data) ? data : [];

        const exact = results.find(
            (r) => String(r?.handle || "").toLowerCase() === h.toLowerCase()
        );
        if (!exact) return { handle: h };

        const acctType = String(exact.account_type || "user").toLowerCase();

        if (acctType === "business") {
            return {
                handle: exact.handle, account_type: "business",
                business_id: exact.id, business_name: exact.name || exact.first_name || "",
                business_slug: exact.handle, business_avatar_url: exact.avatar_url || "",
                account_name: exact.name || exact.first_name || "",
                account_handle: exact.handle, account_avatar_url: exact.avatar_url || "",
                avatar_url: exact.avatar_url || "", first_name: exact.name || exact.first_name || "", last_name: "",
            };
        }
        if (acctType === "artist") {
            return {
                handle: exact.handle, account_type: "artist",
                artist_id: exact.id, artist_name: exact.name || exact.first_name || "",
                artist_handle: exact.handle, artist_avatar_url: exact.avatar_url || "",
                account_name: exact.name || exact.first_name || "",
                account_handle: exact.handle, account_avatar_url: exact.avatar_url || "",
                avatar_url: exact.avatar_url || "", first_name: exact.name || exact.first_name || "", last_name: "",
            };
        }
        return {
            id: exact.id, handle: exact.handle,
            first_name: exact.first_name || "", last_name: exact.last_name || "",
            avatar_url: exact.avatar_url || "", profile_picture: exact.profile_picture || "",
            public_id: exact.public_id ?? null,
        };
    } catch {
        return { handle: h };
    }
};

/**
 * Create a virtual anchor element from a real DOM element.
 * MUI Popper supports virtual elements (objects with getBoundingClientRect).
 * This also satisfies UserCardPopover's isConnected and getBoundingClientRect checks.
 */
const createVirtualAnchor = (domEl) => {
    if (!domEl) return null;
    const rect = domEl.getBoundingClientRect();
    return {
        // Popper needs getBoundingClientRect
        getBoundingClientRect: () => rect,
        // UserCardPopover checks isConnected
        isConnected: true,
        // UserCardPopover checks contains() for click-away
        contains: (node) => domEl.contains?.(node) ?? false,
        // Needed for nodeType check in some Popper internals
        nodeType: 1,
    };
};

/* ── Linkified text (plain-text fallback) ── */
const LINK_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|@[a-zA-Z0-9_]{2,30})/gi;

function LinkifiedText({ text, onMentionClick }) {
    if (!text) return null;
    const str = String(text);

    if (!/https?:\/\/|www\.|@/.test(str)) {
        return (
            <Typography variant="body2"
                        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                {str}
            </Typography>
        );
    }

    const parts = str.split(LINK_REGEX);
    const elements = parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
            return (<a key={i} href={part} target="_blank" rel="noopener noreferrer"
                       style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>{part}</a>);
        }
        if (/^www\./i.test(part)) {
            return (<a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer"
                       style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>{part}</a>);
        }
        if (/^@[a-zA-Z0-9_]{2,30}$/.test(part)) {
            const handle = part.slice(1);
            return (
                <Box key={i} component="a" href={`/${handle}`} data-mention={handle}
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMentionClick?.(e, handle); }}
                     sx={{ p: 0, fontWeight: 900, display: "inline", color: "primary.main",
                         cursor: "pointer", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    {part}
                </Box>
            );
        }
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (<a key={i} href={`mailto:${part}`} style={{ color: "inherit", fontWeight: 700 }}>{part}</a>);
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });

    return (
        <Typography variant="body2"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {elements}
        </Typography>
    );
}

/* ══════════════════════════════════════════════════════════════════ */

export default function RichTextDisplay({ html, sx }) {
    if (!html) return null;
    return <RichTextDisplayInner rawHtml={String(html)} sx={sx} />;
}

function RichTextDisplayInner({ rawHtml, sx }) {
    const auth = useAuth();
    const acctCtx = useActiveAccount();

    const activeAccount = acctCtx?.activeAccount;
    const isBusinessAccount = acctCtx?.isBusinessAccount;
    const isArtistAccount = acctCtx?.isArtistAccount;

    /* ── Viewer ── */
    const [viewer, setViewer] = useState(null);
    const viewerFetched = useRef(false);
    const ensureViewer = useCallback(() => {
        if (viewerFetched.current) return;
        viewerFetched.current = true;
        fetch("/users/profile", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((resp) => setViewer(resp?.user || resp || null))
            .catch(() => setViewer(null));
    }, []);

    /* ── UserCardPopover state ── */
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [userCardViewProfileOnly, setUserCardViewProfileOnly] = useState(false);
    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const viewerUser = viewer;
    const activeBusinessId = activeAccount?.business_id || null;
    const activeArtistId = activeAccount?.artist_id || null;

    /* ── Hydrate target profile ── */
    const hydrateTargetFromPublic = useCallback(async (target) => {
        if (!target) return null;
        const handleOrId = target.handle || target.id;
        if (!handleOrId) return null;
        const urls = [
            `${api}/users/public/${encodeURIComponent(handleOrId)}`,
            `/users/public/${encodeURIComponent(handleOrId)}`,
            `/api/users/public/${encodeURIComponent(handleOrId)}`,
        ].filter(Boolean);
        for (const u of urls) {
            try {
                const res = await secureFetch(u, { credentials: "include" });
                if (!res.ok) continue;
                const data = await res.json();
                const profile = data?.profile || data?.user || data;
                if (!profile) continue;
                setUserForCard((prev) => {
                    if (!prev) return prev;
                    if (!prev.id && profile.id) return { ...prev, id: profile.id };
                    return prev;
                });
                const sjRaw = profile.social_json;
                let sj = {};
                if (typeof sjRaw === "string") { try { sj = JSON.parse(sjRaw || "{}"); } catch { sj = {}; } }
                else if (sjRaw && typeof sjRaw === "object") sj = sjRaw;
                const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                if (!!viewerUser?.id && followers.includes(Number(viewerUser.id)) && profile.id) {
                    setServerFollowingSet((old) => { const n = new Set(old); n.add(Number(profile.id)); return n; });
                }
                return profile;
            } catch { /* try next */ }
        }
        return null;
    }, [viewerUser?.id]);

    /* ── Open UserCardPopover using a virtual anchor ── */
    const handleOpenUserCard = useCallback((clickedEl, author) => {
        ensureViewer();

        // Create a virtual anchor from the clicked element's current position.
        // This satisfies UserCardPopover's isConnected + getBoundingClientRect checks
        // and positions the Popper correctly at the mention link.
        const virtualAnchor = createVirtualAnchor(clickedEl);
        setUserAnchor(virtualAnchor);

        setUserCardViewProfileOnly(false);
        setUserForCard({
            id: author?.id, first_name: author?.first_name, last_name: author?.last_name,
            handle: author?.handle, avatar_url: author?.avatar_url,
            ...(author?.account_type ? { account_type: author.account_type } : {}),
            ...(author?.business_id ? { business_id: author.business_id } : {}),
            ...(author?.business_name ? { business_name: author.business_name } : {}),
            ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
            ...(author?.business_avatar_url ? { business_avatar_url: author.business_avatar_url } : {}),
            ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
            ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
            ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
            ...(author?.artist_avatar_url ? { artist_avatar_url: author.artist_avatar_url } : {}),
            ...(author?.account_name ? { account_name: author.account_name } : {}),
            ...(author?.account_handle ? { account_handle: author.account_handle } : {}),
            ...(author?.account_avatar_url ? { account_avatar_url: author.account_avatar_url } : {}),
        });
        const isAccountCard = Boolean(
            author?.account_type === "business" || author?.account_type === "artist" ||
            author?.business_id || author?.artist_id
        );
        if (!isAccountCard) hydrateTargetFromPublic(author);
    }, [ensureViewer, hydrateTargetFromPublic]);

    /* ── Mention click handler ── */
    const onMentionClick = useCallback((e, mentionHandle) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const h = String(mentionHandle || "").replace(/^@/, "").trim();
        if (!h) return;
        const anchorTarget = e?.currentTarget || e?.target;
        resolveMentionHandle(h).then((resolved) => {
            handleOpenUserCard(anchorTarget, resolved);
        });
    }, [handleOpenUserCard]);

    /* ── Follow / view profile ── */
    const postFollow = async (targetId) => {
        const urls = [`${api}/users/follow`, "/api/users/follow", "/users/follow"].filter(Boolean);
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ target_id: targetId, action: "follow" }) });
                if (res.ok) return true;
            } catch { /* try next */ }
        }
        return false;
    };

    const handleFollow = async (targetUser) => {
        let tid = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid && handle0) {
            const p = await hydrateTargetFromPublic({ handle: handle0 });
            if (p?.id) tid = Number(p.id);
        }
        if (!tid) return;
        const ok = await postFollow(tid);
        if (ok) setLocallyFollowed((prev) => new Set(prev).add(tid));
    };

    const handleViewProfile = (u) => {
        if (u?.account_type === "business" || u?.business_id) {
            const slug = u?.business_slug || u?.account_handle || u?.handle;
            if (slug) return window.location.assign(`/${slug}`);
        }
        if (u?.account_type === "artist" || u?.artist_id) {
            const h = u?.artist_handle || u?.account_handle || u?.handle;
            if (h) return window.location.assign(`/${h}`);
        }
        window.location.assign(`/${u.handle || u.id}`);
    };

    const isSelfForCard = useMemo(() => {
        if (!viewerUser || !userForCard) return false;
        const isAcct = Boolean(userForCard.account_type === "business" || userForCard.account_type === "artist" ||
            userForCard.business_id || userForCard.artist_id);
        if (isBusinessAccount && activeBusinessId) {
            if (!isAcct) return false;
            return (userForCard.account_type === "business" || Boolean(userForCard.business_id)) &&
                Number(userForCard.business_id) === Number(activeBusinessId);
        }
        if (isArtistAccount && activeArtistId) {
            if (!isAcct) return false;
            return (userForCard.account_type === "artist" || Boolean(userForCard.artist_id)) &&
                Number(userForCard.artist_id) === Number(activeArtistId);
        }
        if (isAcct) return false;
        return (viewerUser.id != null && userForCard.id != null && Number(viewerUser.id) === Number(userForCard.id)) ||
            (viewerUser.handle && userForCard.handle &&
                String(viewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase());
    }, [viewerUser, userForCard, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    /* ── Delegated click handler for rich HTML mention <a> tags ── */
    const handleRichTextClick = useCallback((e) => {
        const link = e.target.closest("a[data-mention]");
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        const handle = link.getAttribute("data-mention");
        if (!handle) return;
        resolveMentionHandle(handle).then((resolved) => {
            handleOpenUserCard(link, resolved);
        });
    }, [handleOpenUserCard]);

    const hasHtmlEntities = /&(?:#\d+|#x[\da-f]+|[a-z]\w{0,30});/i.test(rawHtml);
    const isPlainText = !containsHtml(rawHtml) && !hasHtmlEntities;

    const safeHtml = isPlainText
        ? null
        : sanitizeHtml(convertPlainMentionsInHtml(convertMentionSpansToLinks(
            // If text has HTML entities but no actual tags, wrap in <p> so the
            // sanitizer preserves it and the browser decodes entities properly.
            (!containsHtml(rawHtml) && hasHtmlEntities) ? `<p>${rawHtml}</p>` : rawHtml
        )));

    return (
        <>
            {isPlainText ? (
                <LinkifiedText text={rawHtml} onMentionClick={onMentionClick} />
            ) : (
                <Box
                    className="rich-text-display"
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                    onClick={handleRichTextClick}
                    sx={(t) => {
                        const brandColors = t.custom?.brand || {};
                        const linkColor = brandColors.brass || t.palette.primary.main;
                        const linkHoverColor = brandColors.clay || t.palette.secondary.main;

                        return {
                            fontSize: "0.875rem",
                            lineHeight: 1.65,
                            color: t.palette.text.primary,
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            "& h3": { fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.35, mt: 1.5, mb: 0.5,
                                color: t.palette.text.primary, letterSpacing: "-0.01em" },
                            "& h3:first-of-type": { mt: 0 },
                            "& p": { m: 0, mb: 0.75 },
                            "& p:last-of-type": { mb: 0 },
                            "& ul, & ol": { pl: 2.5, my: 0.75 },
                            "& li": { mb: 0.25 },
                            "& a": {
                                color: linkColor, fontWeight: 600,
                                textDecoration: "underline", textDecorationColor: alpha(linkColor, 0.35),
                                textUnderlineOffset: "2px", wordBreak: "break-all",
                                transition: "color 160ms ease, text-decoration-color 160ms ease",
                                "&:hover": { color: linkHoverColor, textDecorationColor: alpha(linkHoverColor, 0.35) },
                            },
                            "& a[data-mention]": {
                                color: t.palette.primary.main,
                                fontWeight: 900,
                                textDecoration: "none",
                                textDecorationColor: "transparent",
                                cursor: "pointer",
                                "&:hover": {
                                    textDecoration: "underline",
                                    textDecorationColor: t.palette.primary.main,
                                    color: t.palette.primary.main,
                                },
                            },
                            "& b, & strong": { fontWeight: 800, color: t.palette.text.primary },
                            "& i, & em": { fontStyle: "italic" },
                            "& u": { textDecoration: "underline" },
                            "& s, & strike": { textDecoration: "line-through" },
                            ...(typeof sx === "function" ? sx(t) : sx),
                        };
                    }}
                />
            )}

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => { setUserAnchor(null); setUserCardViewProfileOnly(false); }}
                user={userForCard}
                isSelf={isSelfForCard}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={handleViewProfile}
                viewProfileOnly={userCardViewProfileOnly}
            />
        </>
    );
}

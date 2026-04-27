// src/components/RichTextEditor.jsx



import React, { useEffect, useRef, useState, useCallback } from "react";
import { alpha } from "@mui/material/styles";
import {
    Box,
    Divider,
    IconButton,
    InputBase,
    Stack,
    Tooltip,
    Typography,
    useTheme,
    Popper,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
} from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import StrikethroughSRoundedIcon from "@mui/icons-material/StrikethroughSRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { stripHtml } from "../utils/richTextUtils";
import { secureFetch } from "../utils/secureFetch";

/* ── Toolbar button definitions (declared outside component to avoid re-creation) ── */
const TOOLBAR_BUTTONS = [
    { cmd: "bold", Icon: FormatBoldRoundedIcon, tip: "Bold (Ctrl+B)", query: "bold" },
    { cmd: "italic", Icon: FormatItalicRoundedIcon, tip: "Italic (Ctrl+I)", query: "italic" },
    { cmd: "underline", Icon: FormatUnderlinedRoundedIcon, tip: "Underline (Ctrl+U)", query: "underline" },
    { cmd: "strikeThrough", Icon: StrikethroughSRoundedIcon, tip: "Strikethrough", query: "strikeThrough" },
    { type: "divider" },
    { cmd: "heading", Icon: TitleRoundedIcon, tip: "Heading", query: "heading" },
    { type: "divider" },
    { cmd: "insertUnorderedList", Icon: FormatListBulletedRoundedIcon, tip: "Bullet list", query: "insertUnorderedList" },
    { cmd: "insertOrderedList", Icon: FormatListNumberedRoundedIcon, tip: "Numbered list", query: "insertOrderedList" },
    { type: "divider" },
    { cmd: "link", Icon: LinkRoundedIcon, tip: "Insert link", query: "link" },
    { cmd: "unlink", Icon: LinkOffRoundedIcon, tip: "Remove link", query: "unlink" },
];

/* ── Default avatar style (matches PostDetailModal) ── */
const DEFAULT_AVATAR_SX = {
    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
    color: "primary.main",
};

/* ── @mention helpers (adapted from PostDetailModal for contentEditable) ── */

/** Small inline badge showing verified status + account type for @mention results */
const MentionAccountBadge = ({ accountType }) => {
    const type = String(accountType || "user").toLowerCase();

    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, ml: 0.5 }}>
            {type === "business" && (
                <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", verticalAlign: "middle" }} />
            )}
            {type === "artist" && (
                <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", verticalAlign: "middle" }} />
            )}
        </Box>
    );
};

const coerceHandle = (u) => {
    const h = String(u?.handle || u?.username || "").replace(/^@/, "").trim();
    return h;
};

const coerceName = (u) => {
    const first = String(u?.first_name || "").trim();
    const last = String(u?.last_name || "").trim();
    const name = String(u?.name || "").trim();
    const full = `${first} ${last}`.trim();
    return full || name || (u?.handle ? `@${String(u.handle).replace(/^@/, "")}` : "User");
};

/**
 * Walk backwards from the caret in a contentEditable to find an active @mention query.
 * Returns { query, range } where range is the DOM Range covering "@query", or null.
 */
const getMentionMatchCE = (editorEl) => {
    if (!editorEl) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;

    const range = sel.getRangeAt(0);

    // We need to be inside the editor
    if (!editorEl.contains(range.startContainer)) return null;

    // Get the text node and offset
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return null;

    const text = textNode.textContent || "";
    const cursor = range.startOffset;
    const upto = text.slice(0, cursor);

    const atIndex = upto.lastIndexOf("@");
    if (atIndex < 0) return null;

    // Check character before @ — don't trigger after letters/underscore/dot
    const before = atIndex > 0 ? upto[atIndex - 1] : "";
    if (before && /[A-Za-z_.]/.test(before)) return null;

    const query = upto.slice(atIndex + 1);
    if (!query) return null; // bare "@" — don't trigger
    if (/\s/.test(query)) return null;
    if (!/^[A-Za-z0-9_.]{1,30}$/.test(query)) return null;

    // Build a range that covers "@query"
    const matchRange = document.createRange();
    matchRange.setStart(textNode, atIndex);
    matchRange.setEnd(textNode, cursor);

    return { query, range: matchRange };
};

/**
 * Get a virtual anchor element positioned at the end of the mention range,
 * for Popper placement.
 */
const getMentionAnchorFromRange = (matchRange) => {
    if (!matchRange) return null;
    try {
        const rects = matchRange.getClientRects();
        const last = rects[rects.length - 1];
        if (!last) return null;

        const rect = {
            top: last.bottom,
            bottom: last.bottom,
            left: last.right,
            right: last.right,
            width: 0,
            height: 0,
        };

        return {
            getBoundingClientRect: () => rect,
        };
    } catch {
        return null;
    }
};

/**
 * RichTextEditor
 *
 * Props:
 *  - value: string (HTML)
 *  - onChange: (html: string) => void
 *  - maxLength?: number (character limit, counts plain text length)
 *  - placeholder?: string
 *  - label?: string
 *  - required?: boolean
 *  - error?: boolean
 *  - helperText?: string | ReactNode
 *  - minRows?: number
 */
export default function RichTextEditor({
                                           value,
                                           onChange,
                                           maxLength,
                                           placeholder = "",
                                           label = "",
                                           required = false,
                                           error: errorProp = false,
                                           helperText,
                                           minRows = 4,
                                       }) {
    const t = useTheme();
    const editorRef = useRef(null);
    const isInternalChange = useRef(false);
    const [isFocused, setIsFocused] = useState(false);
    const [activeFormats, setActiveFormats] = useState({});

    /* ── @mention state ── */
    const [mention, setMention] = useState({
        open: false,
        query: "",
        results: [],
        anchorEl: null,
        range: null, // the DOM Range covering "@query"
    });
    const [mentionLoading, setMentionLoading] = useState(false);
    const mentionRangeRef = useRef(null); // store the range so we can replace it on selection

    /* ── Link popup state ── */
    const [linkPopup, setLinkPopup] = useState({ open: false, url: "", selection: null });
    const linkInputRef = useRef(null);

    const closeMention = useCallback(() => {
        setMentionLoading(false);
        setMention({
            open: false,
            query: "",
            results: [],
            anchorEl: null,
            range: null,
        });
        mentionRangeRef.current = null;
    }, []);

    const syncMention = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;

        const match = getMentionMatchCE(el);

        if (!match) {
            if (mention.open) closeMention();
            return;
        }

        const anchorEl = getMentionAnchorFromRange(match.range);
        mentionRangeRef.current = match.range;

        setMention((s) => {
            if (s.open && s.query === match.query) {
                return { ...s, anchorEl, range: match.range };
            }
            return { open: true, query: match.query, results: [], anchorEl, range: match.range };
        });
    }, [closeMention, mention.open]);

    /* ── Fetch mention results (debounced, matches PostDetailModal pattern) ── */
    useEffect(() => {
        if (!mention.open || !mention.query) return undefined;

        setMentionLoading(true);
        const ctrl = new AbortController();

        const timer = window.setTimeout(async () => {
            try {
                const res = await secureFetch(
                    `/api/community/users/search?q=${encodeURIComponent(mention.query)}`,
                    { credentials: "include", signal: ctrl.signal, cache: "no-store" }
                );

                if (!res.ok) {
                    setMentionLoading(false);
                    return;
                }

                const data = await res.json().catch(() => []);
                setMention((s) => {
                    if (!s.open || s.query !== mention.query) return s;
                    return { ...s, results: Array.isArray(data) ? data : [] };
                });
            } catch {
                // ignore (abort or network error)
            } finally {
                setMentionLoading(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
            ctrl.abort();
        };
    }, [mention.open, mention.query]);

    const emitChange = () => {
        const el = editorRef.current;
        if (!el) return;
        isInternalChange.current = true;
        const html = el.innerHTML || "";
        // Normalise empty state
        const isEmpty = !stripHtml(html).trim();
        onChange(isEmpty ? "" : html);
    };

    /** Insert a selected mention into the editor, replacing the "@query" range */
    const insertMention = useCallback(
        (handle) => {
            const el = editorRef.current;
            const matchRange = mentionRangeRef.current;
            if (!el || !matchRange || !handle) return;

            try {
                // Delete the @query text
                matchRange.deleteContents();

                // Create the mention span (styled, non-editable)
                const mentionNode = document.createElement("span");
                mentionNode.className = "mention-tag";
                mentionNode.setAttribute("data-mention", handle);
                mentionNode.setAttribute("contenteditable", "false");
                mentionNode.textContent = `@${handle}`;

                // Insert mention node
                matchRange.insertNode(mentionNode);

                // Add a space after the mention so the user can keep typing
                const space = document.createTextNode("\u00A0");
                mentionNode.parentNode.insertBefore(space, mentionNode.nextSibling);

                // Move cursor after the space
                const sel = window.getSelection();
                const newRange = document.createRange();
                newRange.setStartAfter(space);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
            } catch {
                // Fallback: just insert plain text
                document.execCommand("insertText", false, `@${handle} `);
            }

            closeMention();
            emitChange();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [closeMention]
    );

    // Sync external value → editor (only if not from our own edit)
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        const el = editorRef.current;
        if (!el) return;
        if (el.innerHTML !== (value || "")) {
            el.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = () => {
        emitChange();
        updateActiveFormats();
        syncMention();
    };

    const updateActiveFormats = () => {
        const next = {};
        try {
            next.bold = document.queryCommandState("bold");
            next.italic = document.queryCommandState("italic");
            next.underline = document.queryCommandState("underline");
            next.strikeThrough = document.queryCommandState("strikeThrough");
            next.insertUnorderedList = document.queryCommandState("insertUnorderedList");
            next.insertOrderedList = document.queryCommandState("insertOrderedList");

            // Check heading: see if the selection is inside an H3
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node = sel.anchorNode;
                let inH3 = false;
                while (node && node !== editorRef.current) {
                    if (node.nodeName === "H3") { inH3 = true; break; }
                    node = node.parentNode;
                }
                next.heading = inH3;
            }

            // Check link
            const sel2 = window.getSelection();
            if (sel2 && sel2.rangeCount > 0) {
                let node2 = sel2.anchorNode;
                let inLink = false;
                while (node2 && node2 !== editorRef.current) {
                    if (node2.nodeName === "A") { inLink = true; break; }
                    node2 = node2.parentNode;
                }
                next.link = inLink;
                next.unlink = inLink;
            }
        } catch {
            // queryCommandState may throw in some edge cases
        }
        setActiveFormats(next);
    };

    const handleSelectionChange = () => {
        if (!isFocused) return;
        updateActiveFormats();
        syncMention();
    };

    useEffect(() => {
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused]);

    const execCommand = (cmd) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();

        if (cmd === "heading") {
            // Toggle H3: if already in H3, format as paragraph
            const sel = window.getSelection();
            let inH3 = false;
            if (sel && sel.rangeCount > 0) {
                let node = sel.anchorNode;
                while (node && node !== el) {
                    if (node.nodeName === "H3") { inH3 = true; break; }
                    node = node.parentNode;
                }
            }
            document.execCommand("formatBlock", false, inH3 ? "p" : "h3");
        } else if (cmd === "link") {
            // Save current selection so we can restore it when applying the link
            const sel = window.getSelection();
            let savedRange = null;
            if (sel && sel.rangeCount > 0) {
                savedRange = sel.getRangeAt(0).cloneRange();
            }
            const selectedText = sel ? sel.toString().trim() : "";
            const defaultUrl = selectedText.startsWith("http") ? selectedText : "https://";
            setLinkPopup({ open: true, url: defaultUrl, selection: savedRange });
            // Focus the link input after it renders
            setTimeout(() => linkInputRef.current?.focus(), 50);
            return; // don't emitChange yet — wait for user to confirm
        } else if (cmd === "unlink") {
            document.execCommand("unlink", false, null);
        } else {
            document.execCommand(cmd, false, null);
        }

        emitChange();
        updateActiveFormats();
    };

    /* ── Link popup handlers ── */
    const closeLinkPopup = useCallback(() => {
        setLinkPopup({ open: false, url: "", selection: null });
    }, []);

    const applyLink = useCallback(() => {
        const url = linkPopup.url?.trim();
        if (!url) { closeLinkPopup(); return; }

        const el = editorRef.current;
        if (!el) { closeLinkPopup(); return; }

        el.focus();

        // Restore the saved selection
        if (linkPopup.selection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(linkPopup.selection);
        }

        document.execCommand("createLink", false, url);

        // Force target="_blank" on the new link
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            let node = sel.anchorNode;
            while (node && node !== el) {
                if (node.nodeName === "A") {
                    node.setAttribute("target", "_blank");
                    node.setAttribute("rel", "noopener noreferrer");
                    break;
                }
                node = node.parentNode;
            }
        }

        closeLinkPopup();
        emitChange();
        updateActiveFormats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkPopup, closeLinkPopup]);

    // Prevent pasting formatted HTML — normalise to plain text or simple HTML
    const handlePaste = (e) => {
        e.preventDefault();
        const html = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");

        if (html) {
            // Strip all but basic formatting from pasted HTML
            const temp = document.createElement("div");
            temp.innerHTML = html;
            // Walk and strip disallowed elements
            const walk = (node) => {
                const children = Array.from(node.childNodes);
                for (const child of children) {
                    if (child.nodeType === 1) {
                        const tag = child.tagName.toLowerCase();
                        const allowed = ["p", "br", "b", "strong", "i", "em", "u", "s", "h3", "ul", "ol", "li", "a", "div", "span"];
                        if (!allowed.includes(tag)) {
                            // Replace with its text content
                            const frag = document.createDocumentFragment();
                            while (child.firstChild) frag.appendChild(child.firstChild);
                            node.replaceChild(frag, child);
                        } else {
                            // Strip all attributes except href on <a> and mention-related attrs on <span>
                            const attrs = Array.from(child.attributes);
                            for (const attr of attrs) {
                                if (tag === "a" && attr.name === "href") continue;
                                if (tag === "span" && (attr.name === "data-mention" || attr.name === "class" || attr.name === "contenteditable")) continue;
                                child.removeAttribute(attr.name);
                            }
                            if (tag === "a") {
                                child.setAttribute("target", "_blank");
                                child.setAttribute("rel", "noopener noreferrer");
                            }
                            walk(child);
                        }
                    }
                }
            };
            walk(temp);
            document.execCommand("insertHTML", false, temp.innerHTML);
        } else if (text) {
            // Plain text — insert with line breaks preserved
            const escaped = text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>");
            document.execCommand("insertHTML", false, escaped);
        }
        emitChange();
    };

    const handleKeyDown = (e) => {
        // Close mention dropdown on Escape
        if (mention.open && e.key === "Escape") {
            e.preventDefault();
            closeMention();
            return;
        }

        // Override Tab for indentation in lists
        if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) {
                document.execCommand("outdent", false, null);
            } else {
                document.execCommand("indent", false, null);
            }
            emitChange();
        }
    };

    const plainLength = stripHtml(value || "").length;
    const showCounter = maxLength != null;
    const overLimit = showCounter && plainLength > maxLength;

    // ── Theme tokens ──
    const isDark = t.palette.mode === "dark";
    const brandColors = t.custom?.brand || {};
    const motionTokens = t.custom?.motion || {};

    // Frost background from theme (same token other themed inputs use)
    const frost = brandColors.frost || (isDark ? "#232D3D" : "#E7EBF1");

    // Editor surface: use theme paper in dark, near-white frost in light
    const editorBg = isDark
        ? alpha(frost, 0.6)
        : alpha(t.palette.common.white, 0.92);

    // Toolbar surface: subtle tinted background from theme
    const toolbarBg = isDark
        ? alpha(frost, 0.45)
        : alpha(frost, 0.38);

    const borderColor = errorProp || overLimit
        ? t.palette.error.main
        : isFocused
            ? alpha(brandColors.brass || t.palette.primary.main, 0.52)
            : alpha(t.palette.text.primary, isDark ? 0.18 : 0.12);

    // Focus ring glow (matches themed inputs)
    const focusRingShadow = isFocused && !errorProp && !overLimit
        ? `0 0 0 3px ${alpha(brandColors.brass || t.palette.primary.main, 0.10)}`
        : "none";

    return (
        <Box>
            {/* Label */}
            {label && (
                <Typography
                    component="label"
                    variant="body2"
                    sx={{
                        display: "block",
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: "0.8125rem",
                        color: isFocused ? (brandColors.brass || t.palette.primary.main) : t.palette.text.secondary,
                        transition: `color ${motionTokens.base || 160}ms ${motionTokens.ease || "ease"}`,
                    }}
                >
                    {label}
                    {required && (
                        <Typography
                            component="span"
                            sx={{ color: "error.main", fontWeight: 800, fontSize: "inherit", ml: 0.25 }}
                        >
                            *
                        </Typography>
                    )}
                </Typography>
            )}

            {/* Editor container */}
            <Box
                sx={{
                    position: "relative",
                    border: "1px solid",
                    borderColor,
                    borderRadius: `${t.shape.borderRadius}px`,
                    overflow: "hidden",
                    bgcolor: editorBg,
                    backdropFilter: "saturate(140%) blur(10px)",
                    boxShadow: focusRingShadow,
                    transition: `border-color ${motionTokens.base || 160}ms ${motionTokens.ease || "ease"}, box-shadow ${motionTokens.base || 160}ms ${motionTokens.ease || "ease"}`,
                }}
            >
                {/* Toolbar */}
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                        px: 0.5,
                        py: 0.25,
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.text.primary, isDark ? 0.12 : 0.08),
                        bgcolor: toolbarBg,
                        flexWrap: "nowrap",
                        gap: 0,
                        overflowX: "auto",
                        overflowY: "hidden",
                        WebkitOverflowScrolling: "touch",
                        "&::-webkit-scrollbar": { display: "none" },
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {TOOLBAR_BUTTONS.map((btn, idx) => {
                        if (btn.type === "divider") {
                            return (
                                <Divider
                                    key={`d-${idx}`}
                                    orientation="vertical"
                                    flexItem
                                    sx={{ mx: 0.25, my: 0.75, flexShrink: 0 }}
                                />
                            );
                        }
                        const isActive = Boolean(activeFormats[btn.query]);
                        return (
                            <Tooltip key={btn.cmd} title={btn.tip} arrow enterDelay={400}>
                                <IconButton
                                    size="small"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // keep editor focus
                                        execCommand(btn.cmd);
                                    }}
                                    sx={{
                                        borderRadius: 1,
                                        width: 30,
                                        height: 30,
                                        flexShrink: 0,
                                        color: isActive
                                            ? (brandColors.brass || t.palette.secondary.main)
                                            : t.palette.text.secondary,
                                        bgcolor: isActive
                                            ? alpha(brandColors.brass || t.palette.secondary.main, 0.09)
                                            : "transparent",
                                        "&:hover": {
                                            bgcolor: isActive
                                                ? alpha(brandColors.brass || t.palette.secondary.main, 0.14)
                                                : alpha(t.palette.text.primary, 0.05),
                                        },
                                    }}
                                >
                                    <btn.Icon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        );
                    })}
                </Stack>

                {/* ── Link URL inline popup ── */}
                {linkPopup.open && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.5,
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.text.primary, isDark ? 0.12 : 0.08),
                            bgcolor: alpha(brandColors.brass || t.palette.primary.main, 0.04),
                        }}
                    >
                        <LinkRoundedIcon sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }} />
                        <InputBase
                            inputRef={linkInputRef}
                            value={linkPopup.url}
                            onChange={(e) => setLinkPopup((s) => ({ ...s, url: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); applyLink(); }
                                if (e.key === "Escape") { e.preventDefault(); closeLinkPopup(); editorRef.current?.focus(); }
                            }}
                            placeholder="https://example.com"
                            size="small"
                            fullWidth
                            sx={{
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                "& input": { py: 0.5, px: 0.5 },
                            }}
                        />
                        <IconButton
                            size="small"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={applyLink}
                            sx={{
                                width: 28,
                                height: 28,
                                flexShrink: 0,
                                color: brandColors.brass || t.palette.primary.main,
                                bgcolor: alpha(brandColors.brass || t.palette.primary.main, 0.1),
                                "&:hover": { bgcolor: alpha(brandColors.brass || t.palette.primary.main, 0.18) },
                            }}
                        >
                            <CheckRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { closeLinkPopup(); editorRef.current?.focus(); }}
                            sx={{
                                width: 28,
                                height: 28,
                                flexShrink: 0,
                                color: "text.secondary",
                                "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) },
                            }}
                        >
                            <CloseRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                )}

                {/* Editable area */}
                <Box
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => { setIsFocused(false); emitChange(); }}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    data-placeholder={placeholder}
                    sx={{
                        minHeight: minRows * 24,
                        maxHeight: 400,
                        overflowY: "auto",
                        px: 1.75,
                        py: 1.25,
                        outline: "none",
                        fontSize: { xs: "16px", sm: "0.875rem" }, // 16px on mobile prevents iOS auto-zoom on focus
                        lineHeight: 1.65,
                        fontWeight: 400,
                        letterSpacing: "-0.01em",
                        color: t.palette.text.primary,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",

                        // Placeholder
                        "&:empty::before": {
                            content: "attr(data-placeholder)",
                            color: alpha(t.palette.text.secondary, isDark ? 0.85 : 0.55),
                            opacity: 1,
                            pointerEvents: "none",
                            display: "block",
                            fontWeight: 400,
                        },

                        // Formatting styles
                        "& h3": {
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            lineHeight: 1.35,
                            mt: 1.5,
                            mb: 0.5,
                            color: t.palette.text.primary,
                            letterSpacing: "-0.01em",
                        },
                        "& h3:first-of-type": {
                            mt: 0,
                        },
                        "& p": {
                            m: 0,
                            mb: 0.5,
                        },
                        "& ul, & ol": {
                            pl: 2.5,
                            my: 0.5,
                        },
                        "& li": {
                            mb: 0.25,
                        },
                        "& a": {
                            color: brandColors.brass || t.palette.primary.main,
                            fontWeight: 600,
                            textDecoration: "underline",
                            textDecorationColor: alpha(brandColors.brass || t.palette.primary.main, 0.35),
                            textUnderlineOffset: "2px",
                        },
                        "& b, & strong": {
                            fontWeight: 700,
                        },
                        // @mention tag styling inside the editor (matches RichTextDisplay)
                        "& .mention-tag": {
                            color: t.palette.primary.main,
                            fontWeight: 900,
                            textDecoration: "none",
                            cursor: "default",
                            userSelect: "all",
                            whiteSpace: "nowrap",
                        },
                    }}
                />
            </Box>

            {/* @mention autocomplete Popper */}
            <Popper
                open={Boolean(mention.open)}
                anchorEl={mention.anchorEl || editorRef.current}
                placement="bottom-start"
                disablePortal={false}
                sx={{ zIndex: 2000 }}
            >
                <ClickAwayListener onClickAway={closeMention}>
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 0.75,
                            borderRadius: 2,
                            overflow: "hidden",
                            width: { xs: "100%", sm: 460 },
                            boxShadow: (th) => th.custom?.shadows?.lg || "0 8px 32px rgba(0,0,0,0.12)",
                        }}
                    >
                        <List dense disablePadding>
                            {mentionLoading ? (
                                <ListItem sx={{ py: 1 }}>
                                    <ListItemText primary="Searching…" primaryTypographyProps={{ fontWeight: 800 }} />
                                </ListItem>
                            ) : null}

                            {!mentionLoading &&
                            (!mention.results || mention.results.length === 0) ? (
                                <ListItem sx={{ py: 1 }}>
                                    <ListItemText primary="No results found" primaryTypographyProps={{ fontWeight: 800 }} />
                                </ListItem>
                            ) : null}

                            {!mentionLoading
                                ? (mention.results || []).slice(0, 4).map((u) => {
                                    const handle = coerceHandle(u);
                                    const uLabel = coerceName(u);
                                    const avatar = u?.avatar_url || u?.profile_picture || "";
                                    const accountType = u?.account_type || "user";
                                    return (
                                        <ListItemButton
                                            key={String(u?.id || handle || uLabel) + "_" + accountType}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                if (handle) insertMention(handle);
                                            }}
                                            sx={{ py: 1, px: 1.5 }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 44 }}>
                                                <Avatar
                                                    src={avatar || undefined}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        ...((!avatar && (accountType === "business" || accountType === "artist"))
                                                            ? { bgcolor: (th) => alpha(th.palette.primary.main, 0.08), color: "primary.main" }
                                                            : (!avatar ? DEFAULT_AVATAR_SX : {})),
                                                    }}
                                                >
                                                    {!avatar
                                                        ? (accountType === "business"
                                                            ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                                            : accountType === "artist"
                                                                ? <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />
                                                                : <PersonRoundedIcon fontSize="small" />)
                                                        : null}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
                                                        {uLabel}
                                                        <MentionAccountBadge accountType={accountType} />
                                                    </Box>
                                                }
                                                secondary={handle ? `@${handle}` : ""}
                                                primaryTypographyProps={{ fontWeight: 800, noWrap: true }}
                                                secondaryTypographyProps={{ noWrap: true }}
                                            />
                                        </ListItemButton>
                                    );
                                })
                                : null}
                        </List>
                    </Paper>
                </ClickAwayListener>
            </Popper>

            {/* Helper text / counter */}
            {(helperText || showCounter) && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, px: 0.25 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: errorProp || overLimit ? "error.main" : "text.secondary",
                            fontSize: "0.75rem",
                        }}
                    >
                        {helperText || ""}
                    </Typography>
                    {showCounter && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: overLimit ? "error.main" : "text.secondary",
                                fontSize: "0.75rem",
                                fontWeight: overLimit ? 700 : 400,
                            }}
                        >
                            {plainLength}/{maxLength}
                        </Typography>
                    )}
                </Stack>
            )}
        </Box>
    );
}

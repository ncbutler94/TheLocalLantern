import { secureFetch } from '../../../utils/secureFetch';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Tooltip,
    Button,
    CircularProgress,
    Alert,
    Box,
    IconButton,
    Popper,
    Paper,
    List,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    ClickAwayListener,
} from '@mui/material';
import PhotosUploadSection from '../../../components/PhotosUploadSection';

import useBasePostForm, { MAX_TITLE, MAX_DESCRIPTION } from './useBasePostForm';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor';
import { stripHtml } from '../../../utils/richTextUtils';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const MAX_PHOTOS = 8;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const MAX_MENTION_RESULTS = 12;

function extractUrls(text) {
    const s = String(text || '');
    const matches = s.match(/https?:\/\/[^\s)\]]+/gi);
    return matches ? matches.map((u) => String(u)) : [];
}

function findDisallowedUrl(text) {
    const urls = extractUrls(text);
    for (const u of urls) {
        const trimmed = String(u || '').trim();
        if (!trimmed) continue;
        if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
    }
    return null;
}

function getMentionMatch(text, cursorIndex) {
    const s = String(text || '');
    const cursor = typeof cursorIndex === 'number' ? cursorIndex : s.length;
    const upToCursor = s.slice(0, cursor);

    const at = upToCursor.lastIndexOf('@');
    if (at < 0) return null;

    // Only trigger when @ starts a new token (start or preceded by whitespace/punctuation)
    const before = at > 0 ? upToCursor[at - 1] : '';
    if (before && !/[\s([\{{\"'.,:;!?]/.test(before)) return null;

    const query = upToCursor.slice(at + 1);
    if (!query) return null; // don't trigger on bare "@"
    if (/\s/.test(query)) return null;
    if (!/^[A-Za-z0-9_.-]{1,30}$/.test(query)) return null;

    return { start: at, query, end: cursor };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl || typeof window === 'undefined' || typeof document === 'undefined') return null;

    const pos = Number.isFinite(Number(caretIndex)) ? Number(caretIndex) : 0;
    const value = String(textareaEl.value || '');
    const clampedPos = Math.max(0, Math.min(pos, value.length));

    try {
        const computed = window.getComputedStyle(textareaEl);

        const mirror = document.createElement('div');
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';
        mirror.style.overflowWrap = 'break-word';
        mirror.style.overflow = 'hidden';

        // Mirror sizing + typography
        mirror.style.boxSizing = computed.boxSizing;
        mirror.style.width = computed.width;
        mirror.style.padding = computed.padding;
        mirror.style.border = computed.border;

        mirror.style.fontFamily = computed.fontFamily;
        mirror.style.fontSize = computed.fontSize;
        mirror.style.fontWeight = computed.fontWeight;
        mirror.style.fontStyle = computed.fontStyle;
        mirror.style.letterSpacing = computed.letterSpacing;
        mirror.style.textTransform = computed.textTransform;
        mirror.style.textAlign = computed.textAlign;
        mirror.style.lineHeight = computed.lineHeight;

        // Keep it off-screen
        mirror.style.left = '-9999px';
        mirror.style.top = '0px';

        const beforeText = value.slice(0, clampedPos);
        const afterText = value.slice(clampedPos);

        mirror.textContent = beforeText;

        const marker = document.createElement('span');
        // Ensure the marker has dimensions even when caret is at end
        marker.textContent = afterText || '.';
        mirror.appendChild(marker);

        document.body.appendChild(mirror);

        const mirrorRect = mirror.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();

        document.body.removeChild(mirror);

        const taRect = textareaEl.getBoundingClientRect();
        const lineHeight =
            Number.parseFloat(computed.lineHeight) ||
            Number.parseFloat(computed.fontSize) * 1.2 ||
            18;

        const caretLeft = taRect.left + (markerRect.left - mirrorRect.left) - textareaEl.scrollLeft;
        const caretTop = taRect.top + (markerRect.top - mirrorRect.top) - textareaEl.scrollTop;

        const anchorY = caretTop + lineHeight;

        const rect = {
            top: anchorY,
            bottom: anchorY,
            left: caretLeft,
            right: caretLeft,
            width: 0,
            height: 0,
        };

        return {
            getBoundingClientRect: () => rect,
            contextElement: textareaEl,
        };
    } catch {
        return null;
    }
}

function makeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseApiError(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;

    if (s.startsWith('{') && s.endsWith('}')) {
        try {
            const obj = JSON.parse(s);
            if (obj && typeof obj === 'object') return obj;
        } catch {
            // ignore
        }
    }
    return null;
}

function formatResetAt(resetAt) {
    if (!resetAt) return '';
    try {
        const d = new Date(resetAt);
        if (Number.isNaN(d.getTime())) return String(resetAt);
        return d.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return String(resetAt);
    }
}

function buildPrettyError(raw) {
    const obj = parseApiError(raw);
    const msg = String(obj?.message || raw || '').trim();

    const isEditLimit =
        msg.toLowerCase().includes('edit a post up to') &&
        msg.toLowerCase().includes('times') &&
        msg.toLowerCase().includes('24-hour');

    if (isEditLimit) {
        const when = obj?.resetAt ? formatResetAt(obj.resetAt) : '';
        return {
            title: 'Edit limit reached',
            body: 'You can edit a post up to 5 times within a 24-hour window.',
            footer: when ? `Try again after ${when}.` : '',
        };
    }

    if (obj && (obj.message || obj.resetAt || obj.remaining != null)) {
        const when = obj?.resetAt ? formatResetAt(obj.resetAt) : '';
        return {
            title: 'Unable to save',
            body: msg || 'Something went wrong.',
            footer: when ? `Try again after ${when}.` : '',
        };
    }

    if (!msg) return null;
    return { title: 'Unable to save', body: msg, footer: '' };
}

export default function NewPublicSafetyForm({
                                                onClose,
                                                HeaderIcon,
                                                onBack,
                                                onSubmit, // optional — safe local fallback included below
                                                onRefresh, // optional
                                                defaultCity = '',
                                                defaultCounty = '',
                                                countyRequired = false,

                                                // Edit-mode support
                                                editMode = false,
                                                initialData = null, // { id, title, description, city, county, expires_at, photos:[url...] }
                                                onDelete, // optional () => void
                                            }) {
    /* ─── shared base fields ─────────────────────────────────────────────── */
    const base = useBasePostForm({ defaultCity, defaultCounty, countyRequired });

    // Per-field profanity errors: { title: "...", description: "..." }
    const [fieldErrors, setFieldErrors] = React.useState({});
    const titleRef = React.useRef(null);
    const descriptionFieldRef = React.useRef(null);
    const scrollContainerRef = React.useRef(null);
    const photosSectionRef = React.useRef(null);

    const { city, county, setCity, setCounty } = base;

    // Apply passed defaults (create-mode only)
    React.useEffect(() => {
        if (editMode) return;
        if (!city && defaultCity) setCity(defaultCity);
        if (!county && defaultCounty) setCounty(defaultCounty);
    }, [editMode, city, county, defaultCity, defaultCounty, setCity, setCounty]);

    // Fallback: if no defaults were provided, auto-fill from profile (create-mode only)
    const fetchedProfileRef = React.useRef(false);
    React.useEffect(() => {
        if (editMode) return;
        if (fetchedProfileRef.current) return;
        if (defaultCity || defaultCounty) return;
        if (city || county) return;

        fetchedProfileRef.current = true;
        const ac = new AbortController();

        secureFetch('/users/profile', { credentials: 'include', signal: ac.signal })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const u = data?.user || null;
                const profileCity = String(u?.city || '').trim();
                const profileCounty = String(u?.county || '').trim();

                if (!city && profileCity) setCity(profileCity);
                if (!county && profileCounty) setCounty(profileCounty);
            })
            .catch((err) => {
                if (err?.name !== 'AbortError') {
                    // ignore
                }
            });

        return () => ac.abort();
    }, [editMode, city, county, defaultCity, defaultCounty, setCity, setCounty]);

    /* ─── public-safety specific fields ──────────────────────────────────── */
    const [expiresAt, setExpiresAt] = useState(dayjs().add(24, 'hour'));

    /* ─── photos (drag/drop + reorder) ───────────────────────────────────── */
    // Each item: { id, url, file?: File, existing?: boolean }
    const [photos, setPhotos] = useState([]);
    const photosRef = React.useRef([]);

// Frontend safety + mentions
    const [clientPhotoWarning, setClientPhotoWarning] = useState('');
    const descriptionInputRef = React.useRef(null);

    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionResults, setMentionResults] = useState([]);
    const [mentionLoading, setMentionLoading] = useState(false);
    const [mentionError, setMentionError] = useState('');
    const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
    const [mentionAnchorEl, setMentionAnchorEl] = useState(null);

    const mentionStartRef = React.useRef(null);
    const mentionEndRef = React.useRef(null);
    const mentionCaretIndexRef = React.useRef(null);
    const mentionAbortRef = React.useRef(null);

    const closeMention = React.useCallback(() => {
        if (mentionAbortRef.current) {
            try {
                mentionAbortRef.current.abort();
            } catch {
                // ignore
            }
        }
        mentionAbortRef.current = null;

        setMentionOpen(false);
        setMentionQuery('');
        setMentionResults([]);
        setMentionLoading(false);
        setMentionError('');
        setMentionActiveIndex(0);
        setMentionAnchorEl(null);

        mentionStartRef.current = null;
        mentionEndRef.current = null;
        mentionCaretIndexRef.current = null;
    }, []);

    const insertMention = React.useCallback(
        (user) => {
            const usernameRaw =
                user?.username ??
                user?.userName ??
                user?.handle ??
                user?.user_name ??
                '';
            const username = String(usernameRaw || '').replace(/^@/, '').trim();
            if (!username) return;

            const start = mentionStartRef.current;
            const end = mentionEndRef.current;

            const prev = String(base.description || '');
            if (typeof start !== 'number' || typeof end !== 'number' || start < 0 || end < start) {
                return;
            }

            const replacement = `@${username} `;
            const next = prev.slice(0, start) + replacement + prev.slice(end);

            base.setDescription(next);

            // restore caret
            const newPos = start + replacement.length;
            window.requestAnimationFrame(() => {
                try {
                    const el = descriptionInputRef.current;
                    if (el && typeof el.setSelectionRange === 'function') {
                        el.focus();
                        el.setSelectionRange(newPos, newPos);
                    }
                } catch {
                    // ignore
                }
            });

            closeMention();
        },
        [base, closeMention]
    );

    const fetchMentionUsers = React.useCallback(async (q, signal) => {
        const endpoints = [
            `/api/community/users/search?q=${encodeURIComponent(q)}`,
            `/api/users/search?q=${encodeURIComponent(q)}`,
        ];

        for (const url of endpoints) {
            try {
                const res = await secureFetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    signal,
                });

                if (!res.ok) continue;

                const data = await res.json().catch(() => null);

                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.users)
                        ? data.users
                        : Array.isArray(data?.results)
                            ? data.results
                            : Array.isArray(data?.data)
                                ? data.data
                                : [];

                return arr;
            } catch (e) {
                if (e?.name === 'AbortError') return [];
                // try next endpoint
            }
        }

        return [];
    }, []);

    React.useEffect(() => {
        if (!mentionOpen) return;

        if (!mentionQuery) {
            setMentionResults([]);
            setMentionLoading(false);
            setMentionError('');
            return;
        }

        const q = String(mentionQuery || '').trim();
        if (!q) return;

        const ac = new AbortController();
        mentionAbortRef.current = ac;

        setMentionLoading(true);
        setMentionError('');

        const t = window.setTimeout(async () => {
            try {
                const raw = await fetchMentionUsers(q, ac.signal);

                const needle = q.toLowerCase();
                const filtered = (Array.isArray(raw) ? raw : []).filter((u) => {
                    const uname = String(u?.username || u?.userName || u?.user_name || u?.handle || '').toLowerCase();
                    const name = String(u?.name || u?.full_name || u?.display_name || u?.displayName || '').toLowerCase();
                    return uname.includes(needle) || name.includes(needle);
                });

                setMentionResults(filtered.slice(0, MAX_MENTION_RESULTS));
                setMentionActiveIndex(0);
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setMentionError('Unable to load users.');
            } finally {
                setMentionLoading(false);
                if (mentionAbortRef.current === ac) mentionAbortRef.current = null;
            }
        }, 160);

        return () => {
            window.clearTimeout(t);
            try {
                ac.abort();
            } catch {
                // ignore
            }
        };
    }, [mentionOpen, mentionQuery, fetchMentionUsers]);

    const handleDescriptionChange = React.useCallback(
        (e) => {
            const value = String(e?.target?.value || '');
            base.setDescription(value);

            const caret = typeof e?.target?.selectionStart === 'number' ? e.target.selectionStart : value.length;
            const match = getMentionMatch(value, caret);

            if (!match) {
                if (mentionOpen) closeMention();
                return;
            }

            mentionStartRef.current = match.start;
            mentionEndRef.current = match.end;
            mentionCaretIndexRef.current = match.end;

            setMentionQuery(match.query);
            setMentionOpen(true);
            setMentionActiveIndex(0);

            const virtualEl = getMentionAnchorVirtualEl(e.target, match.end);
            setMentionAnchorEl(virtualEl);
        },
        [base, mentionOpen, closeMention]
    );

    const handleDescriptionKeyDown = React.useCallback(
        (e) => {
            if (!mentionOpen) return;

            const items = Array.isArray(mentionResults) ? mentionResults : [];
            const hasItems = items.length > 0;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeMention();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!hasItems) return;
                setMentionActiveIndex((prev) => (prev + 1) % items.length);
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!hasItems) return;
                setMentionActiveIndex((prev) => (prev - 1 + items.length) % items.length);
                return;
            }

            if (e.key === 'Enter' || e.key === 'Tab') {
                if (!hasItems) return;
                e.preventDefault();
                const picked = items[Math.max(0, Math.min(mentionActiveIndex, items.length - 1))];
                if (picked) insertMention(picked);
            }
        },
        [mentionOpen, mentionResults, mentionActiveIndex, insertMention, closeMention]
    );

    React.useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    React.useEffect(() => {
        return () => {
            photosRef.current.forEach((p) => {
                if (p?.existing) return;
                try {
                    if (p?.url) URL.revokeObjectURL(p.url);
                } catch (e) {
                    // ignore
                }
            });
        };
    }, []);

    // Prefill in edit mode
    React.useEffect(() => {
        if (!editMode) return;
        if (!initialData) return;

        if (typeof initialData.title === 'string') base.setTitle(initialData.title);
        if (typeof initialData.description === 'string') base.setDescription(initialData.description);
        if (typeof initialData.city === 'string') base.setCity(initialData.city);
        if (typeof initialData.county === 'string') base.setCounty(initialData.county);

        const exp = initialData.expires_at || initialData.expiresAt || null;
        if (exp) {
            const d = dayjs(exp);
            if (d.isValid()) setExpiresAt(d);
        }

        const existing = Array.isArray(initialData.photos) ? initialData.photos : [];
        const cleaned = existing
            .map((u) => String(u || '').trim())
            .filter(Boolean)
            .slice(0, MAX_PHOTOS)
            .map((url) => ({ id: makeId(), url, existing: true }));

        setPhotos(cleaned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, initialData]);

    /* ─── validation ─────────────────────────────────────────────────────── */
    const needsTitle = !base.title.trim();
    const isDisabled = base.submitting || needsTitle;

    const tooltipMsg = needsTitle ? 'Title is required.' : '';

    /* ─── safe local submitter (prevents “onSubmit is not a function”) ───── */
    const doSubmit = async (payloadOrFormData) => {
        if (typeof onSubmit === 'function') {
            return onSubmit(payloadOrFormData);
        }
        const res = await secureFetch('/api/public-safety', {
            method: 'POST',
            body: payloadOrFormData,
            credentials: 'include',
        });
        if (!res.ok) {
            const msg = (await res.text()) || 'Failed to submit public safety alert.';
            throw new Error(msg);
        }
        return res.json();
    };

    /* ─── submit ─────────────────────────────────────────────────────────── */
    async function handleSaveOrPost() {
        base.setAttemptedSubmit(true);
        base.setError('');
        setFieldErrors({});

        if (!String(base.title || '').trim()) {
            base.setError('Title is required.');
            return;
        }

        if (isDisabled) return;

        // Client-side profanity check (instant feedback before server round-trip)
        const strippedDesc = stripHtml(String(base.description || '')).trim();
        const profanityResult = base.checkContentProfanity({ description: strippedDesc });
        if (!profanityResult.clean) {
            const newFieldErrors = {};
            if (profanityResult.field === 'title') {
                newFieldErrors.title = 'Contains inappropriate language. Please revise.';
            } else if (profanityResult.field === 'description') {
                newFieldErrors.description = 'Contains inappropriate language. Please revise.';
            } else {
                newFieldErrors[profanityResult.field] = 'Contains inappropriate language. Please revise.';
            }
            setFieldErrors(newFieldErrors);

            requestAnimationFrame(() => {
                const container = scrollContainerRef.current;
                if (!container) return;
                let targetEl = null;
                if (newFieldErrors.title && titleRef.current) {
                    targetEl = titleRef.current;
                } else if (newFieldErrors.description && descriptionFieldRef.current) {
                    targetEl = descriptionFieldRef.current;
                }
                if (targetEl) {
                    const elRect = targetEl.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
                    container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
                }
            });
            return;
        }

        base.setSubmitting(true);
        try {
            const coords = (typeof base.resolveCoordinates === 'function') ? (base.resolveCoordinates() || []) : [];
            const [lat, lng] = (Array.isArray(coords) && coords.length === 2) ? coords : ['', ''];

            const disallowedUrl = findDisallowedUrl(base.description);
            if (disallowedUrl) {
                throw new Error(`Please remove this suspicious link before posting: ${disallowedUrl}`);
            }
            if (editMode) {
                const postId = Number(initialData?.id ?? initialData?.post_id ?? initialData?.postId);
                if (!Number.isFinite(postId) || postId <= 0) {
                    throw new Error('Missing post id for edit.');
                }

                const fd = new FormData();
                fd.append('title', base.title || '');
                fd.append('description', base.description || '');
                fd.append('city', base.sanitizeLocationValue(base.city));
                fd.append('county', base.sanitizeLocationValue(base.county));
                fd.append('latitude', lat ?? '');
                fd.append('longitude', lng ?? '');
                fd.append('expires_at', expiresAt ? expiresAt.format('YYYY-MM-DD HH:mm:ss') : '');

                const orderTokens = [];
                let newIndex = 0;

                photos.forEach((p) => {
                    if (!p) return;

                    if (p.existing && p.url) {
                        orderTokens.push(String(p.url).trim());
                        return;
                    }

                    if (p.file) {
                        fd.append('photos', p.file);
                        orderTokens.push(`__new__:${newIndex}`);
                        newIndex += 1;
                    }
                });

                fd.append('photo_order', JSON.stringify(orderTokens));

                // IMPORTANT: If we're being used inside EditCommunityPostDialog, it passes onSubmit().
                // Calling onSubmit ensures the global `ll:communityPost:updated` event fires and the feed refreshes.
                if (typeof onSubmit === 'function') {
                    await onSubmit(fd);
                } else {
                    const res = await secureFetch(`/api/community/${postId}`, {
                        method: 'PATCH',
                        body: fd,
                        credentials: 'include',
                    });

                    if (!res.ok) {
                        const msg = (await res.text()) || 'Save failed.';
                        throw new Error(msg);
                    }

                    // If we aren't inside the dialog wrapper, still emit a best-effort event so
                    // CommunityPage can patch/refetch.
                    try {
                        const updated = await res.json().catch(() => null);
                        if (updated && typeof updated === 'object') {
                            window.dispatchEvent(
                                new CustomEvent('ll:communityPost:updated', {
                                    detail: { postId, post: updated, forceRefresh: true },
                                })
                            );
                        }
                    } catch {
                        // ignore
                    }
                }

                if (typeof onRefresh === 'function') await onRefresh();
                onClose();
                return;
            }

            const fd = new FormData();
            fd.append('title', base.title);
            fd.append('description', base.description);
            fd.append('city', base.sanitizeLocationValue(base.city));
            fd.append('county', base.sanitizeLocationValue(base.county));
            fd.append('latitude', lat ?? '');
            fd.append('longitude', lng ?? '');
            fd.append('expires_at', expiresAt ? expiresAt.format('YYYY-MM-DD HH:mm:ss') : '');

            photos.forEach((p) => {
                if (p?.file) fd.append('photos', p.file);
            });

            await doSubmit(fd);
            if (typeof onRefresh === 'function') await onRefresh();
            onClose();
        } catch (err) {
            let errMsg = err?.message || (editMode ? 'Save failed.' : 'Submission failed.');
            try {
                const s = String(errMsg).trim();
                if (s.startsWith('{') && s.endsWith('}')) {
                    const parsed = JSON.parse(s);
                    if (parsed?.message) errMsg = parsed.message;
                }
            } catch { /* not JSON, use as-is */ }
            const isPhotoError = /image|photo|flagged|inappropriate|moderat|nudity/i.test(errMsg);
            if (isPhotoError) {
                setFieldErrors((prev) => ({ ...prev, photos: errMsg }));
                requestAnimationFrame(() => {
                    const container = scrollContainerRef.current;
                    const targetEl = photosSectionRef.current;
                    if (container && targetEl) {
                        const elRect = targetEl.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
                        container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
                    }
                });
            } else {
                base.setError(errMsg);
            }
        } finally {
            base.setSubmitting(false);
        }
    }

    const titleText = editMode ? 'Edit Public Safety Alert' : 'New Public Safety Alert';
    const primaryBtnText = editMode ? 'Save' : 'Post';

    /* ─── render ─────────────────────────────────────────────────────────── */
    return (
        <>

            <DialogTitle
                sx={{
                    pr: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    {HeaderIcon ? (
                        <HeaderIcon sx={{ fontSize: 24, flexShrink: 0, color: 'primary.main' }} />
                    ) : null}
                    <Typography sx={{ fontWeight: 900 }} noWrap>{titleText}</Typography>
                </Box>
            </DialogTitle>

            <DialogContent ref={scrollContainerRef} dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {base.error ? (() => {
                    const pe = buildPrettyError(base.error);
                    if (!pe) return null;
                    return (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                {pe.title}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.25 }}>
                                {pe.body}
                            </Typography>
                            {pe.footer ? (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                    {pe.footer}
                                </Typography>
                            ) : null}
                        </Alert>
                    );
                })() : null}

                {/* Title */}
                <TextField
                    label="Title"
                    required
                    fullWidth
                    value={base.title}
                    onChange={(e) => {
                        base.setTitle(e.target.value);
                        if (fieldErrors.title) setFieldErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                    }}
                    inputProps={{ maxLength: MAX_TITLE }}
                    inputRef={titleRef}
                    error={Boolean(fieldErrors.title)}
                    helperText={fieldErrors.title || ''}
                />
                <Typography variant="caption">
                    {base.title.length} / {MAX_TITLE}
                </Typography>

                <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>Location</Typography>
                </Box>

                <CityCountySelect
                    emptyCountyLabel="All Counties"
                    emptyCityLabel="All Cities"
                    city={base.city}
                    setCity={base.setCity}
                    county={base.county}
                    setCounty={base.setCounty}
                    disabled={false}
                    countyDisabled={false}
                    cityDisabled={false}
                    statewide={false}
                    allCountyValue="All Counties"
                    allCityValue="All Cities"
                    profileCounty={defaultCounty}
                    profileCity={defaultCity}
                    countyRequired={false}
                    countyError=""
                />

                {/* Expires At */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                        label="Expires At"
                        value={expiresAt}
                        onChange={(dt) => setExpiresAt(dt)}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </LocalizationProvider>

                {/* Description */}
                <Box ref={descriptionFieldRef}>
                    <RichTextEditor
                        label="Description"
                        value={base.description}
                        onChange={(html) => {
                            base.setDescription(html);
                            if (fieldErrors.description) setFieldErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                        }}
                        maxLength={MAX_DESCRIPTION}
                        placeholder="Describe the safety alert..."
                        minRows={6}
                    />
                    {fieldErrors.description && (
                        <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: 0.5, ml: 1.75 }}>
                            {fieldErrors.description}
                        </Typography>
                    )}
                </Box>

                {clientPhotoWarning ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        {clientPhotoWarning}
                    </Alert>
                ) : null}

                {/* Photos section */}
                <Box
                    ref={photosSectionRef}
                    sx={{
                        mt: 1,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        pt: 2,
                    }}
                >
                    <PhotosUploadSection
                        photos={photos}
                        setPhotos={setPhotos}
                        disabled={base.submitting}
                        maxPhotos={MAX_PHOTOS}
                        title="Photos"
                        helperText="Add photos to make your post stand out"
                        addButtonText="Add photos"
                    />

                    {editMode && photos.some((p) => p?.existing === false) && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                                Note: You can add, remove, and reorder photos while editing.
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Your changes will upload to the same cloud storage as new posts.
                            </Typography>
                        </Box>
                    )}

                    {fieldErrors.photos && (
                        <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: 0.5, ml: 1.75 }}>
                            {fieldErrors.photos}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between', gap: 1 }}>
                {/* Left-side navigation / destructive actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!editMode && typeof onBack === 'function' ? (
                        <Button variant="outlined" onClick={onBack} disabled={base?.submitting}>
                            Back
                        </Button>
                    ) : null}

                    {editMode && typeof onDelete === 'function' && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={onDelete}
                            disabled={base.submitting}
                        >
                            Delete Post
                        </Button>
                    )}
                </Box>

                {/* Right-side primary/secondary actions (standard web convention) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" onClick={onClose} disabled={base.submitting}>
                        Cancel
                    </Button>

                    <Tooltip title={tooltipMsg} disableHoverListener={!tooltipMsg}>
            <span>
                <Button
                    variant="contained"
                    onClick={handleSaveOrPost}
                    disabled={isDisabled}
                    startIcon={base.submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {base.submitting
                        ? (photos.some((p) => p?.file)
                            ? 'Uploading photos\u2026'
                            : (editMode ? 'Saving\u2026' : 'Posting\u2026'))
                        : primaryBtnText}
                </Button>
            </span>
                    </Tooltip>
                </Box>
            </DialogActions>
        </>
    );
}
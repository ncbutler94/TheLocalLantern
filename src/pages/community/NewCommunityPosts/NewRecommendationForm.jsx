import { secureFetch } from '../../../utils/secureFetch';
import React, { useState } from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhotosUploadSection from '../../../components/PhotosUploadSection';

import useBasePostForm, { MAX_TITLE, MAX_DESCRIPTION } from './useBasePostForm';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor';
import { stripHtml } from '../../../utils/richTextUtils';

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

/**
 * NewRecommendationForm
 * - Defaults location from the **database user** (passed in via props by NewPostDialogs)
 * - County is optional; City is optional
 * - Uses a safe local submitter to avoid "onSubmit is not a function"
 *
 * Edit-mode:
 * - Same UI as new form
 * - Save uses JSON payload via shared EditCommunityPostDialog
 * - Delete button visible when editMode + onDelete provided
 */
export default function NewRecommendationForm({
                                                  onClose,
                                                  HeaderIcon,
                                                  onBack,
                                                  onSubmit, // optional; safe fallback below
                                                  onRefresh, // optional
                                                  defaultCity = '',
                                                  defaultCounty = '',
                                                  countyRequired = false,

                                                  // Edit-mode support
                                                  editMode = false,
                                                  initialData = null, // { id, title, description, city, county, rec_type, photos:[url...] }
                                                  onDelete, // optional () => void
                                              }) {
    const base = useBasePostForm({ defaultCity, defaultCounty, countyRequired });

    // Per-field profanity errors: { title: "...", description: "..." }
    const [fieldErrors, setFieldErrors] = React.useState({});
    const titleRef = React.useRef(null);
    const descriptionFieldRef = React.useRef(null);
    const scrollContainerRef = React.useRef(null);
    const photosSectionRef = React.useRef(null);

    const isDisabled = Boolean(base.submitting || !String(base.title || '').trim());

    const [recType, setRecType] = useState('business'); // 'business' | 'tip'

    // Photos (ordered): index 0 = cover
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

    /* ── Featured Business (uses only existing imports) ── */
    const [featuredBusiness, setFeaturedBusiness] = useState(null);
    const [bizSearchOpen, setBizSearchOpen] = useState(false);
    const [bizSearchQuery, setBizSearchQuery] = useState('');
    const [bizSearchResults, setBizSearchResults] = useState([]);
    const [bizSearchLoading, setBizSearchLoading] = useState(false);
    const [bizSearchActiveIdx, setBizSearchActiveIdx] = useState(0);
    const bizSearchAbortRef = React.useRef(null);

    const fetchBusinesses = React.useCallback(async (q, signal) => {
        const endpoints = [
            `/api/business/search?q=${encodeURIComponent(q)}&limit=8`,
            `/api/business?q=${encodeURIComponent(q)}&limit=8`,
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
                const data = await res.json();
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.businesses)
                        ? data.businesses
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];
                return arr;
            } catch (e) {
                if (e?.name === 'AbortError') return [];
            }
        }
        return [];
    }, []);

    React.useEffect(() => {
        if (!bizSearchOpen) {
            setBizSearchResults([]);
            setBizSearchLoading(false);
            return;
        }
        const ac = new AbortController();
        bizSearchAbortRef.current = ac;
        setBizSearchLoading(true);

        // Fetch even with empty query to show popular/recent businesses
        const q = bizSearchQuery.trim();
        const t = window.setTimeout(async () => {
            try {
                const results = await fetchBusinesses(q || '', ac.signal);
                setBizSearchResults(Array.isArray(results) ? results.slice(0, 8) : []);
                setBizSearchActiveIdx(0);
            } catch (e) {
                if (e?.name !== 'AbortError') setBizSearchResults([]);
            } finally {
                setBizSearchLoading(false);
                if (bizSearchAbortRef.current === ac) bizSearchAbortRef.current = null;
            }
        }, q ? 200 : 50); // faster for initial load

        return () => {
            window.clearTimeout(t);
            try { ac.abort(); } catch { /* ignore */ }
        };
    }, [bizSearchOpen, bizSearchQuery, fetchBusinesses]);

    const selectBusiness = React.useCallback((biz) => {
        setFeaturedBusiness(biz);
        setBizSearchOpen(false);
        setBizSearchQuery('');
        setBizSearchResults([]);

        // Auto-fill location from the business (user can still change it)
        const bizCity = String(biz?.city || '').trim();
        const bizCounty = String(biz?.county || '').trim();
        if (bizCounty) base.setCounty(bizCounty);
        if (bizCity) base.setCity(bizCity);
    }, [base]);

    const removeFeaturedBusiness = React.useCallback(() => {
        setFeaturedBusiness(null);
    }, []);

    const handleBizSearchKeyDown = React.useCallback((e) => {
        if (!bizSearchOpen) return;
        const items = bizSearchResults || [];
        if (e.key === 'Escape') { e.preventDefault(); setBizSearchOpen(false); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) setBizSearchActiveIdx((p) => (p + 1) % items.length); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setBizSearchActiveIdx((p) => (p - 1 + items.length) % items.length); return; }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (items.length) {
                const picked = items[Math.max(0, Math.min(bizSearchActiveIdx, items.length - 1))];
                if (picked) selectBusiness(picked);
            }
        }
    }, [bizSearchOpen, bizSearchResults, bizSearchActiveIdx, selectBusiness]);

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
        const editCity = typeof initialData.city === 'string' ? String(initialData.city || '').trim() : '';
        const editCounty = typeof initialData.county === 'string' ? String(initialData.county || '').trim() : '';

        // Location: set city and county from initial data (statewide is derived from county being empty)
        base.setCity(editCity);
        base.setCounty(editCounty);

        const rt = String(initialData.rec_type || '').trim().toLowerCase();
        if (rt === 'tip' || rt === 'business' || rt === 'recommendation') {
            setRecType(rt === 'recommendation' ? 'business' : rt);
        }

        const existing = Array.isArray(initialData.photos) ? initialData.photos : [];
        const cleaned = existing
            .map((u) => String(u || '').trim())
            .filter(Boolean)
            .slice(0, MAX_PHOTOS)
            .map((url) => ({ id: makeId(), url, existing: true }));

        setPhotos(cleaned);

        // Prefill featured business if available
        const biz = initialData.featured_business || initialData.featuredBusiness || null;
        if (biz && typeof biz === 'object' && biz.id) {
            setFeaturedBusiness(biz);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, initialData]);

    const doSubmit = async (payloadOrFormData) => {
        if (typeof onSubmit === 'function') {
            return onSubmit(payloadOrFormData);
        }
        const res = await secureFetch('/api/recommendations', {
            method: 'POST',
            body: payloadOrFormData,
            credentials: 'include',
        });
        if (!res.ok) {
            const msg = (await res.text()) || 'Failed to submit recommendation/tip.';
            throw new Error(msg);
        }
        return res.json();
    };

    const handleSaveOrPost = async () => {
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

                const form = new FormData();
                form.append('title', base.title || '');
                form.append('description', base.description || '');
                form.append('rec_type', recType || 'business');
                form.append('city', base.sanitizeLocationValue(base.city));
                form.append('county', base.sanitizeLocationValue(base.county));
                form.append('latitude', lat ?? '');
                form.append('longitude', lng ?? '');
                if (featuredBusiness?.id) form.append('business_id', String(featuredBusiness.id));

                const orderTokens = [];
                let newIndex = 0;

                photos.forEach((p) => {
                    if (!p) return;

                    if (p.existing && p.url) {
                        orderTokens.push(String(p.url).trim());
                        return;
                    }

                    if (p.file) {
                        form.append('photos', p.file);
                        orderTokens.push(`__new__:${newIndex}`);
                        newIndex += 1;
                    }
                });

                form.append('photo_order', JSON.stringify(orderTokens));

                const res = await secureFetch(`/api/community/${postId}`, {
                    method: 'PATCH',
                    body: form,
                    credentials: 'include',
                });

                if (!res.ok) {
                    const msg = (await res.text()) || 'Save failed.';
                    throw new Error(msg);
                }

                try {
                    await res.json();
                } catch {
                    // ignore
                }

                if (typeof onRefresh === 'function') await onRefresh();
                onClose();
                return;
            }

            const form = new FormData();
            form.append('title', base.title);
            form.append('description', base.description);
            form.append('rec_type', recType);
            form.append('city', base.sanitizeLocationValue(base.city));
            form.append('county', base.sanitizeLocationValue(base.county));
            form.append('latitude', lat);
            form.append('longitude', lng);
            if (featuredBusiness?.id) form.append('business_id', String(featuredBusiness.id));

            photos.forEach((p) => {
                if (p?.file) form.append('photos', p.file);
            });

            await doSubmit(form);
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
    };

    const tooltipMsg = '';
    const titleText = editMode ? 'Edit Recommendation / Tip' : 'New Recommendation / Tip';
    const primaryBtnText = editMode ? 'Save' : 'Post';

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

            <DialogContent
                ref={scrollContainerRef}
                dividers
                autoComplete="off"
                component="form"
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
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

                <FormControl sx={{ mt: 0.5 }}>
                    <FormLabel sx={{ fontWeight: 800 }}>Type</FormLabel>
                    <RadioGroup
                        row
                        value={recType}
                        onChange={(e) => setRecType(e.target.value)}
                        sx={{ gap: 1 }}
                    >
                        <FormControlLabel
                            value="business"
                            control={<Radio />}
                            label="Recommendation"
                            sx={{ m: 0 }}
                        />
                        <FormControlLabel
                            value="tip"
                            control={<Radio />}
                            label="Tip"
                            sx={{ m: 0 }}
                        />
                    </RadioGroup>
                </FormControl>

                {/* ── Featured Business Section (zero new imports) ── */}
                {recType === 'business' && (
                    <Box
                        sx={{
                            mt: 0.5,
                            border: '1px solid',
                            borderColor: featuredBusiness ? 'primary.main' : 'divider',
                            borderRadius: 2.5,
                            bgcolor: featuredBusiness ? 'rgba(11, 61, 46, 0.03)' : 'transparent',
                            transition: 'border-color 200ms ease, background-color 200ms ease',
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                px: 1.75,
                                py: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                bgcolor: featuredBusiness ? 'rgba(11, 61, 46, 0.06)' : 'rgba(0,0,0,0.02)',
                                borderBottom: '1px solid',
                                borderColor: featuredBusiness ? 'rgba(11, 61, 46, 0.12)' : 'divider',
                            }}
                        >
                            <Box
                                component="span"
                                sx={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                                role="img"
                                aria-label="storefront"
                            >
                                🏪
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, flexGrow: 1 }}>
                                Feature a Local Lantern Business
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Optional
                            </Typography>
                        </Box>

                        {/* Body */}
                        <Box sx={{ px: 1.75, py: 1.5 }}>
                            {featuredBusiness ? (
                                /* ── Selected business card ── */
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Avatar / left accent */}
                                    <Box
                                        sx={{
                                            width: { xs: 72, sm: 80 },
                                            minHeight: 80,
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: featuredBusiness.avatar_url
                                                ? 'none'
                                                : 'linear-gradient(135deg, #0b3d2e 0%, #1a6b4f 100%)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {featuredBusiness.avatar_url ? (
                                            <img
                                                src={featuredBusiness.avatar_url}
                                                alt=""
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                component="span"
                                                sx={{ fontSize: 28, lineHeight: 1 }}
                                                role="img"
                                                aria-label="business"
                                            >
                                                🏢
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Info */}
                                    <Box sx={{ flex: 1, py: 1.25, px: 1.5, minWidth: 0 }}>
                                        {/* Business name */}
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 900,
                                                lineHeight: 1.3,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {featuredBusiness.name}
                                        </Typography>

                                        {/* @slug right under name */}
                                        {featuredBusiness.slug ? (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    mt: 0.25,
                                                    color: 'text.secondary',
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                }}
                                            >
                                                @{featuredBusiness.slug}
                                            </Typography>
                                        ) : null}

                                        {/* Category pill */}
                                        {featuredBusiness.category ? (
                                            <Box
                                                sx={{
                                                    display: 'inline-block',
                                                    mt: 0.75,
                                                    px: 1,
                                                    py: 0.15,
                                                    borderRadius: 999,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: 'rgba(11, 61, 46, 0.08)',
                                                    color: 'primary.main',
                                                    textTransform: 'capitalize',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {String(featuredBusiness.category || '').replace(/_/g, ' ')}
                                            </Box>
                                        ) : null}

                                        {/* Location */}
                                        {(featuredBusiness.city || featuredBusiness.county) ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                                    📍 {[featuredBusiness.city, featuredBusiness.county].filter(Boolean).join(', ')}
                                                </Typography>
                                            </Box>
                                        ) : null}
                                    </Box>

                                    {/* Remove button — uses already-imported DeleteOutlineIcon */}
                                    <IconButton
                                        size="small"
                                        onClick={removeFeaturedBusiness}
                                        disabled={base.submitting}
                                        sx={{
                                            position: 'absolute',
                                            top: 6,
                                            right: 6,
                                            bgcolor: 'rgba(0,0,0,0.06)',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.12)' },
                                        }}
                                        aria-label="Remove featured business"
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                /* ── Business picker ── */
                                <Box>
                                    {!bizSearchOpen ? (
                                        /* Tap-to-search button */
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => {
                                                setBizSearchOpen(true);
                                                // Auto-focus after render
                                                window.requestAnimationFrame(() => {
                                                    try {
                                                        const el = document.getElementById('biz-search-input');
                                                        if (el) el.focus();
                                                    } catch { /* ignore */ }
                                                });
                                            }}
                                            disabled={base.submitting}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 1.25,
                                                px: 1.5,
                                                borderRadius: 2,
                                                borderColor: 'divider',
                                                color: 'text.secondary',
                                                fontWeight: 600,
                                                fontSize: 13,
                                                bgcolor: 'background.paper',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    borderColor: 'text.secondary',
                                                },
                                            }}
                                        >
                                            🔍&nbsp;&nbsp;Search for a business to feature…
                                        </Button>
                                    ) : (
                                        /* Expanded inline search panel */
                                        <ClickAwayListener onClickAway={() => {
                                            // Only close if nothing typed and no results showing
                                            if (!bizSearchQuery.trim() && bizSearchResults.length === 0) {
                                                setBizSearchOpen(false);
                                            }
                                        }}>
                                            <Box
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'primary.main',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    bgcolor: 'background.paper',
                                                    boxShadow: '0 2px 12px rgba(11, 61, 46, 0.08)',
                                                }}
                                            >
                                                {/* Search input row */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1 }}>
                                                    <Box component="span" sx={{ fontSize: 14, lineHeight: 1, flexShrink: 0, color: 'text.secondary' }}>
                                                        🔍
                                                    </Box>
                                                    <TextField
                                                        id="biz-search-input"
                                                        autoFocus
                                                        fullWidth
                                                        size="small"
                                                        variant="standard"
                                                        placeholder="Type a business name…"
                                                        value={bizSearchQuery}
                                                        onChange={(e) => setBizSearchQuery(e.target.value.slice(0, 200))}
                                                        onKeyDown={handleBizSearchKeyDown}
                                                        InputProps={{
                                                            disableUnderline: true,
                                                            sx: { fontSize: 13, fontWeight: 600 },
                                                        }}
                                                        inputProps={{ maxLength: 200 }}
                                                    />
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            setBizSearchOpen(false);
                                                            setBizSearchQuery('');
                                                            setBizSearchResults([]);
                                                        }}
                                                        sx={{
                                                            minWidth: 'auto',
                                                            px: 1,
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            color: 'text.secondary',
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Box>

                                                <Divider />

                                                {/* Results area */}
                                                <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {bizSearchLoading ? (
                                                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                            <CircularProgress size={16} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {bizSearchQuery.trim() ? 'Searching…' : 'Loading businesses…'}
                                                            </Typography>
                                                        </Box>
                                                    ) : null}

                                                    {!bizSearchLoading && bizSearchResults.length === 0 ? (
                                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {bizSearchQuery.trim()
                                                                    ? `No businesses found for "${bizSearchQuery}"`
                                                                    : 'No businesses available'}
                                                            </Typography>
                                                        </Box>
                                                    ) : null}

                                                    {!bizSearchLoading && bizSearchResults.length > 0 ? (
                                                        <>
                                                            {!bizSearchQuery.trim() ? (
                                                                <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>
                                                                        Businesses on Local Lantern
                                                                    </Typography>
                                                                </Box>
                                                            ) : null}
                                                            <List dense sx={{ p: 0 }}>
                                                                {bizSearchResults.map((biz, idx) => {
                                                                    const locParts = [biz.city, biz.county].filter(Boolean);
                                                                    const catLabel = String(biz.category || '').replace(/_/g, ' ');

                                                                    return (
                                                                        <React.Fragment key={biz.id || idx}>
                                                                            <ListItemButton
                                                                                selected={idx === bizSearchActiveIdx}
                                                                                onMouseEnter={() => setBizSearchActiveIdx(idx)}
                                                                                onClick={() => selectBusiness(biz)}
                                                                                sx={{
                                                                                    py: 1,
                                                                                    px: 1.5,
                                                                                    '&.Mui-selected': {
                                                                                        bgcolor: 'rgba(11, 61, 46, 0.06)',
                                                                                    },
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(11, 61, 46, 0.04)',
                                                                                    },
                                                                                }}
                                                                            >
                                                                                <ListItemAvatar sx={{ minWidth: 48 }}>
                                                                                    <Avatar
                                                                                        src={biz.avatar_url || undefined}
                                                                                        variant="rounded"
                                                                                        sx={{
                                                                                            width: 40,
                                                                                            height: 40,
                                                                                            bgcolor: biz.avatar_url ? 'transparent' : 'primary.main',
                                                                                            fontSize: 15,
                                                                                            fontWeight: 800,
                                                                                        }}
                                                                                    >
                                                                                        {!biz.avatar_url ? String(biz.name || '?')[0].toUpperCase() : null}
                                                                                    </Avatar>
                                                                                </ListItemAvatar>
                                                                                <ListItemText
                                                                                    primary={
                                                                                        <Box>
                                                                                            <Typography component="span" sx={{ fontWeight: 800, fontSize: 13, display: 'block' }}>
                                                                                                {biz.name}
                                                                                            </Typography>
                                                                                            {biz.slug ? (
                                                                                                <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                                                                                                    @{biz.slug}
                                                                                                </Typography>
                                                                                            ) : null}
                                                                                        </Box>
                                                                                    }
                                                                                    secondary={
                                                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                                                            {catLabel ? (
                                                                                                <Box
                                                                                                    component="span"
                                                                                                    sx={{
                                                                                                        display: 'inline-block',
                                                                                                        px: 0.75,
                                                                                                        py: 0.1,
                                                                                                        borderRadius: 999,
                                                                                                        fontSize: 10,
                                                                                                        fontWeight: 700,
                                                                                                        bgcolor: 'rgba(11, 61, 46, 0.06)',
                                                                                                        color: 'primary.main',
                                                                                                        textTransform: 'capitalize',
                                                                                                    }}
                                                                                                >
                                                                                                    {catLabel}
                                                                                                </Box>
                                                                                            ) : null}
                                                                                            {locParts.length > 0 ? (
                                                                                                <Typography component="span" variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                                                                                                    {catLabel ? '· ' : ''}{locParts.join(', ')}
                                                                                                </Typography>
                                                                                            ) : null}
                                                                                        </Box>
                                                                                    }
                                                                                    secondaryTypographyProps={{ component: 'div' }}
                                                                                />
                                                                            </ListItemButton>
                                                                            {idx < bizSearchResults.length - 1 ? <Divider component="li" /> : null}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </List>
                                                        </>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                        </ClickAwayListener>
                                    )}

                                    {!bizSearchOpen ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                            Link a business profile so it shows on your recommendation post.
                                        </Typography>
                                    ) : null}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>Post Location</Typography>
                    {featuredBusiness ? (
                        <Typography variant="caption" color="text.secondary">
                            Where this post appears in the community feed. Auto-filled from the business — change if needed.
                        </Typography>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Choose where this post appears in the community feed.
                        </Typography>
                    )}
                </Box>

                <CityCountySelect
                    city={base.city}
                    setCity={base.setCity}
                    county={base.county}
                    setCounty={base.setCounty}
                    disabled={false}
                    countyDisabled={false}
                    cityDisabled={false}
                    emptyCountyLabel="All Counties"
                    emptyCityLabel="All Cities"
                    statewide={false}
                    allCountyValue="All Counties"
                    allCityValue="All Cities"
                    profileCounty={defaultCounty}
                    profileCity={defaultCity}
                    countyRequired={false}
                    countyError=""
                />

                <Box ref={descriptionFieldRef}>
                    <RichTextEditor
                        label="Description"
                        value={base.description}
                        onChange={(html) => {
                            base.setDescription(html);
                            if (fieldErrors.description) setFieldErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                        }}
                        maxLength={MAX_DESCRIPTION}
                        placeholder="Share your recommendation or ask for one..."
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

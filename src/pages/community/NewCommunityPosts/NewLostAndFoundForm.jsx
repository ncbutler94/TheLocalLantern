import { secureFetch } from '../../../utils/secureFetch';
import React, { useState } from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Tooltip,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
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
import PhotosUploadSection from '../../../components/PhotosUploadSection';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';

import useBasePostForm, { MAX_TITLE, MAX_DESCRIPTION } from './useBasePostForm';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor';
import { stripHtml } from '../../../utils/richTextUtils';

const MAX_REWARD_LENGTH = 11;
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
    if (before && !/[\s([\{"'.,:;!?]/.test(before)) return null;

    const query = upToCursor.slice(at + 1);
    if (!query) return null; // don't trigger on bare "@"
    if (/\s/.test(query)) return null;
    if (!/^[A-Za-z0-9_.]{1,30}$/.test(query)) return null;

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

/* ────────────────────────── component ───────────────────────── */
export default function NewLostAndFoundForm({
                                                onClose,
                                                HeaderIcon,
                                                onBack,
                                                onSubmit,
                                                onRefresh,
                                                defaultCity = '',
                                                defaultCounty = '',
                                                countyRequired = false,

                                                // Edit-mode support
                                                editMode = false,
                                                initialData = null, // { id, title, description, city, county, visibility, lost_or_found, reward, photos:[url] }
                                                onDelete, // optional () => void
                                            }) {
    /* 1. shared fields (title, desc, photos, city, county) */
    const base = useBasePostForm({ defaultCity, defaultCounty, countyRequired: false });

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

    /* 2b. other category-specific state */
    const [visibility, setVisibility] = useState('public');
    const [lostFound, setLostFound] = useState('');
    const [reward, setReward] = useState('');
    /* touched flags for inline validation */
    const [countyTouched, setCountyTouched] = useState(false);

    /* ───────── photos (drag/drop + reorder, like announcements) ───────── */
    // Photos (ordered): index 0 = cover
    // Each item: { id, url, file?: File, existing?: boolean }
    const [photos, setPhotos] = useState([]);
    const photosRef = React.useRef([]);

    // @mentions (Description)
    const descriptionInputRef = React.useRef(null);
    const [mentionOpen, setMentionOpen] = React.useState(false);
    const [mentionQuery, setMentionQuery] = React.useState('');
    const [mentionResults, setMentionResults] = React.useState([]);
    const [mentionLoading, setMentionLoading] = React.useState(false);
    const [mentionError, setMentionError] = React.useState('');
    const [mentionActiveIndex, setMentionActiveIndex] = React.useState(0);
    const [mentionAnchorEl, setMentionAnchorEl] = React.useState(null);
    const mentionCaretIndexRef = React.useRef(null);
    const mentionStartRef = React.useRef(null);
    const mentionEndRef = React.useRef(null);
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
        mentionStartRef.current = null;
        mentionEndRef.current = null;
        setMentionAnchorEl(null);
        mentionCaretIndexRef.current = null;
    }, []);

    const updateMentionAnchor = React.useCallback((caretIndex) => {
        const el = descriptionInputRef.current;
        if (!el) return;

        const virtual = getMentionAnchorVirtualEl(el, caretIndex);
        setMentionAnchorEl(virtual || el);
    }, []);

    React.useEffect(() => {
        if (!mentionOpen) return;

        const el = descriptionInputRef.current;
        if (!el) return;

        const sync = () => {
            const caret =
                typeof el.selectionStart === 'number'
                    ? el.selectionStart
                    : typeof mentionCaretIndexRef.current === 'number'
                        ? mentionCaretIndexRef.current
                        : null;

            if (typeof caret === 'number') updateMentionAnchor(caret);
        };

        sync();
        el.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync);

        return () => {
            el.removeEventListener('scroll', sync);
            window.removeEventListener('resize', sync);
        };
    }, [mentionOpen, updateMentionAnchor]);

    const insertMention = React.useCallback(
        (user) => {
            const username = String(user?.username || '').trim();
            if (!username) return;

            const start = mentionStartRef.current;
            const end = mentionEndRef.current;
            const current = String(base.description || '');

            if (typeof start !== 'number' || typeof end !== 'number') return;
            if (start < 0 || end < start) return;

            const insertion = `@${username} `;
            const next = current.slice(0, start) + insertion + current.slice(end);

            base.setDescription(next);
            closeMention();

            const pos = start + insertion.length;
            requestAnimationFrame(() => {
                const el = descriptionInputRef.current;
                if (el && typeof el.focus === 'function') {
                    el.focus();
                    try {
                        el.setSelectionRange(pos, pos);
                    } catch {
                        // ignore
                    }
                }
            });
        },
        [base.description, base.setDescription, closeMention]
    );

    const handleDescriptionChange = React.useCallback(
        (e) => {
            const val = e.target.value;
            base.setDescription(val);

            const cursor = typeof e.target.selectionStart === 'number' ? e.target.selectionStart : val.length;
            const match = getMentionMatch(val, cursor);

            if (!match) {
                closeMention();
                return;
            }

            mentionStartRef.current = match.start;
            mentionEndRef.current = match.end;
            mentionCaretIndexRef.current = match.end;
            updateMentionAnchor(match.end);
            setMentionQuery(match.query);
            setMentionOpen(true);
            setMentionActiveIndex(0);
        },
        [base.setDescription, closeMention, updateMentionAnchor]
    );

    const handleDescriptionKeyDown = React.useCallback(
        (e) => {
            if (!mentionOpen) return;

            if (e.key === 'Escape') {
                e.stopPropagation();
                closeMention();
                return;
            }

            if (mentionLoading) return;

            const items = Array.isArray(mentionResults) ? mentionResults : [];
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionActiveIndex((i) => Math.min(i + 1, items.length - 1));
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionActiveIndex((i) => Math.max(i - 1, 0));
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const picked = items[mentionActiveIndex];
                if (picked) insertMention(picked);
            }
        },
        [mentionOpen, mentionLoading, mentionResults, mentionActiveIndex, insertMention, closeMention]
    );

    React.useEffect(() => {
        if (!mentionOpen) return;

        if (!mentionQuery) {
            setMentionLoading(false);
            setMentionError('');
            setMentionResults([]);
            return;
        }

        const ac = new AbortController();
        if (mentionAbortRef.current) {
            try {
                mentionAbortRef.current.abort();
            } catch {
                // ignore
            }
        }
        mentionAbortRef.current = ac;

        setMentionError('');

        const t = setTimeout(async () => {
            setMentionLoading(true);
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(mentionQuery)}`, {
                    credentials: 'include',
                    cache: 'no-store',
                    signal: ac.signal,
                });

                if (!res.ok) {
                    const msg = (await res.text()) || 'Search failed.';
                    throw new Error(msg);
                }

                const data = await res.json();
                const rawUsers = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];

                const cleaned = rawUsers
                    .map((u) => {
                        const username = String(u?.username || u?.handle || '').trim();
                        const first = String(u?.first_name || u?.firstName || '').trim();
                        const last = String(u?.last_name || u?.lastName || '').trim();

                        return {
                            id: u?.id,
                            name: String(u?.name || u?.display_name || u?.full_name || `${first} ${last}` || '').trim(),
                            username,
                            avatarUrl: String(
                                u?.avatarUrl || u?.avatar_url || u?.avatar || u?.profile_picture || u?.profilePicture || ''
                            ).trim(),
                        };
                    })
                    .filter((u) => u.username)
                    .filter((u) => {
                        const q = String(mentionQuery || '').toLowerCase();
                        const un = String(u?.username || '').toLowerCase();
                        const nm = String(u?.name || '').toLowerCase();
                        return !q || un.includes(q) || nm.includes(q);
                    })
                    .slice(0, MAX_MENTION_RESULTS);

                setMentionResults(cleaned);
                setMentionActiveIndex(0);
            } catch (err) {
                if (err?.name === 'AbortError') return;
                setMentionResults([]);
                setMentionError('Unable to load users.');
            } finally {
                setMentionLoading(false);
            }
        }, 200);

        return () => {
            clearTimeout(t);
            try {
                ac.abort();
            } catch {
                // ignore
            }
            if (mentionAbortRef.current === ac) mentionAbortRef.current = null;
            setMentionLoading(false);
        };
    }, [mentionOpen, mentionQuery]);

    // Keep ref for cleanup
    React.useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    // Cleanup object URLs on unmount
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

    // Prefill for edit mode
    React.useEffect(() => {
        if (!editMode) return;
        if (!initialData) return;

        if (typeof initialData.title === 'string') base.setTitle(initialData.title);
        if (typeof initialData.description === 'string') base.setDescription(initialData.description);
        if (typeof initialData.city === 'string') base.setCity(initialData.city);
        if (typeof initialData.county === 'string') base.setCounty(initialData.county);

        const vis = String(initialData.visibility || '').trim().toLowerCase();
        if (vis === 'followers' || vis === 'public') setVisibility(vis || 'public');

        const lf = String(initialData.lost_or_found || '').trim().toLowerCase();
        if (lf === 'lost' || lf === 'found') setLostFound(lf);

        const rw = initialData.reward;
        if (rw === 0 || rw) {
            const n = Number(rw);
            if (Number.isFinite(n) && n > 0) setReward(String(n));
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

    /* ───────── validation combining hook + category fields ─────────
       Location optional except when a street address was entered and the
       helper requires a city to disambiguate.
    */
    const missingRequired =
        !base.title.trim() ||
        !lostFound;

    const isDisabled = missingRequired || base.submitting;

    const tooltipMsg = !base.title.trim()
        ? 'Title is required.'
        : !lostFound
            ? 'Select Lost or Found.'
            : '';

    /* ───────── reward helpers ───────── */
    const handleRewardChange = (e) => {
        const v = e.target.value;
        if (/^[0-9]{0,9}(?:\.\d{0,2})?$/.test(v)) {
            setReward(v.slice(0, MAX_REWARD_LENGTH));
        }
    };
    const handleRewardBlur = () => {
        if (!reward) return;
        let v = reward.endsWith('.') ? reward.slice(0, -1) : reward;
        if (v.includes('.')) {
            const [i, d] = v.split('.');
            v = `${i || '0'}.${d.padEnd(2, '0').slice(0, 2)}`;
        } else v = `${v}.00`;
        setReward(v);
    };

    /* Safe submitter */
    const doSubmit = async (payloadOrFormData) => {
        if (typeof onSubmit === 'function') {
            return onSubmit(payloadOrFormData);
        }
        // Create-mode fallback only
        const res = await secureFetch('/api/lost-and-found', {
            method: 'POST',
            body: payloadOrFormData,
            credentials: 'include',
        });
        if (!res.ok) {
            const msg = (await res.text()) || 'Failed to submit lost & found.';
            throw new Error(msg);
        }
        return res.json();
    };

    /* ───────── submit ───────── */
    async function handleSaveOrPost() {
        base.setAttemptedSubmit(true);
        base.setError('');
        setFieldErrors({});

        if (!String(base.title || '').trim()) {
            base.setError('Title is required.');
            return;
        }

        if (isDisabled) return;

        const badUrl = findDisallowedUrl(base.description);
        if (badUrl) {
            base.setError('For safety, links starting with "javascript:" or "data:" are not allowed.');
            return;
        }

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
            // Resolve coordinates only when county + city are provided (not "All Counties"/"All Cities")
            let lat = null;
            let lng = null;
            const countyVal = String(base.county || '').trim().toLowerCase();
            const cityVal = String(base.city || '').trim().toLowerCase();
            const isCountyAll = !countyVal || countyVal === 'all counties';
            const isCityAll = !cityVal || cityVal === 'all cities';

            if (!isCountyAll && !isCityAll) {
                const coords = (typeof base.resolveCoordinates === 'function') ? (base.resolveCoordinates() || []) : [];
                if (Array.isArray(coords) && coords.length === 2) {
                    [lat, lng] = coords;
                }
            }
            if (editMode) {
                const postId = Number(initialData?.id ?? initialData?.post_id ?? initialData?.postId);
                if (!Number.isFinite(postId) || postId <= 0) {
                    throw new Error('Missing post id for edit.');
                }

                const form = new FormData();
                form.append('title', base.title || '');
                form.append('visibility', visibility || 'public');
                form.append('lost_or_found', lostFound || '');
                if (reward) form.append('reward', parseFloat(reward).toString());
                form.append('description', base.description || '');
                form.append('city', base.sanitizeLocationValue(base.city));
                form.append('county', base.sanitizeLocationValue(base.county));
                if (lat != null && lng != null) {
                    form.append('latitude', String(lat));
                    form.append('longitude', String(lng));
                }

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
            // ALWAYS send strings (never null/undefined) so backend stores ''
            form.append('title', base.title || '');
            form.append('visibility', visibility || 'public');
            form.append('lost_or_found', lostFound || '');
            if (reward) form.append('reward', parseFloat(reward).toString());
            form.append('description', base.description || '');
            form.append('city', base.sanitizeLocationValue(base.city));
            form.append('county', base.sanitizeLocationValue(base.county));
            if (lat != null && lng != null) {
                form.append('latitude', String(lat));
                form.append('longitude', String(lng));
            }

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
    }

    const titleText = editMode ? 'Edit Lost & Found Post' : 'New Lost & Found Post';
    const primaryBtnText = editMode ? 'Save' : 'Post';

    /* ───────── render ───────── */
    return (
        <>

            <DialogTitle
                sx={{
                    pr: 6, // leave room for the top-right X button in the parent dialog
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

                    <Typography sx={{ fontWeight: 900 }} noWrap>
                        {titleText}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent
                ref={scrollContainerRef}
                component="form"
                autoComplete="off"
                dividers
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

                {/* Visibility */}
                <FormControl required sx={{ width: { xs: '100%', sm: 180 } }}>
                    <InputLabel>Visibility</InputLabel>
                    <Select
                        value={visibility}
                        label="Visibility"
                        size="small"
                        onChange={(e) => setVisibility(e.target.value)}
                    >
                        <MenuItem value="public">
                            <PublicIcon fontSize="small" sx={{ mr: 1 }} /> Public
                        </MenuItem>
                        <MenuItem value="followers">
                            <GroupIcon fontSize="small" sx={{ mr: 1 }} /> Followers
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Lost / Found + Reward */}
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <FormControl component="fieldset" required>
                        <FormLabel>Type</FormLabel>
                        <RadioGroup
                            row
                            value={lostFound}
                            onChange={(e) => {
                                const v = e.target.value;
                                setLostFound(v);
                                if (v === 'found') setReward('');
                            }}
                        >
                            <FormControlLabel value="lost" control={<Radio />} label="Lost" />
                            <FormControlLabel value="found" control={<Radio />} label="Found" />
                        </RadioGroup>
                    </FormControl>

                    {lostFound === 'lost' && (
                        <TextField
                            label="Reward (Optional)"
                            value={reward}
                            onChange={handleRewardChange}
                            onBlur={handleRewardBlur}
                            inputProps={{
                                inputMode: 'decimal',
                                pattern: '^\\d*(\\.\\d{0,2})?$',
                                maxLength: MAX_REWARD_LENGTH,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">$</InputAdornment>
                                ),
                            }}
                            sx={{ width: 180 }}
                        />
                    )}
                </Box>

                {/* Location */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>Location</Typography>

                    <CityCountySelect
                        city={base.city}
                        setCity={base.setCity}
                        county={base.county}
                        setCounty={(val) => {
                            base.setCounty(val);
                            setCountyTouched(true);
                        }}
                        countyRequired={false}
                        countyError=""
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
                    />
                </Box>

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
                        placeholder="Describe what was lost or found..."
                        minRows={6}
                    />
                    {fieldErrors.description && (
                        <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: 0.5, ml: 1.75 }}>
                            {fieldErrors.description}
                        </Typography>
                    )}
                </Box>

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
import { secureFetch } from '../../../utils/secureFetch';
import React from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Popper,
    Paper,
    List,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    Collapse,
    ClickAwayListener} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PhotosUploadSection from '../../../components/PhotosUploadSection';

import useBasePostForm, { MAX_TITLE, MAX_DESCRIPTION } from './useBasePostForm';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor'; // eslint-disable-line no-unused-vars -- may be used for edit mode
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

export default function NewGeneralDiscussionForm({
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
                                                     initialData = null, // { id, title, description, city, county, visibility, photos: [url...] }
                                                     onDelete, // optional () => void
                                                 }) {
    const base = useBasePostForm({ defaultCity, defaultCounty, countyRequired });

    // Per-field profanity errors: { title: "...", description: "..." }
    const [fieldErrors, setFieldErrors] = React.useState({});
    const titleRef = React.useRef(null);
    const descriptionFieldRef = React.useRef(null);
    const scrollContainerRef = React.useRef(null);
    const photosSectionRef = React.useRef(null);

    // Reddit-style composer: title is the required field, description is
    // optional. The Post button enables once the user has typed a title.
    const hasTitle = String(base.title || '').trim().length > 0;
    const isDisabled = Boolean(base.submitting || !hasTitle);

    // UI-only state for the new composer layout
    const [visibility, setVisibility] = React.useState('public');
    const [locationExpanded, setLocationExpanded] = React.useState(false);
    const [photosExpanded, setPhotosExpanded] = React.useState(false);
    const [visibilityMenuAnchor, setVisibilityMenuAnchor] = React.useState(null);

    // Photos (ordered): index 0 = cover
    // Each item: { id, url, file?: File, existing?: boolean }
    const [photos, setPhotos] = React.useState([]);
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

    const { city, county, setCity, setCounty } = base;

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

        const vis = String(initialData.visibility || '').trim().toLowerCase();
        if (vis === 'followers' || vis === 'public') setVisibility(vis || 'public');

        const existing = Array.isArray(initialData.photos) ? initialData.photos : [];
        const cleaned = existing
            .map((u) => String(u || '').trim())
            .filter(Boolean)
            .slice(0, MAX_PHOTOS)
            .map((url) => ({ id: makeId(), url, existing: true }));

        setPhotos(cleaned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, initialData]);

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
    }, [])

    const updateMentionAnchor = React.useCallback(
        (caretIndex) => {
            const el = descriptionInputRef.current;
            if (!el) return;

            const virtual = getMentionAnchorVirtualEl(el, caretIndex);
            setMentionAnchorEl(virtual || el);
        },
        []
    );

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

        // Sync immediately (e.g., on open)
        sync();

        el.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync);

        return () => {
            el.removeEventListener('scroll', sync);
            window.removeEventListener('resize', sync);
        };
    }, [mentionOpen, updateMentionAnchor]);

    ;

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

    const doSubmit = async (payloadOrFormData) => {
        if (typeof onSubmit === 'function') {
            return onSubmit(payloadOrFormData);
        }

        const res = await secureFetch('/api/community-chat', {
            method: 'POST',
            body: payloadOrFormData,
            credentials: 'include',
        });

        if (!res.ok) {
            const msg = (await res.text()) || 'Failed to submit Discussion post.';
            throw new Error(msg);
        }

        return res.json();
    };

    async function handleSaveOrPost() {
        base.setAttemptedSubmit(true);
        base.setError('');
        setFieldErrors({});

        if (!String(base.title || '').trim()) {
            base.setError('Title is required.');
            return;
        }

        const disallowed = findDisallowedUrl(base.description);
        if (disallowed) {
            base.setError('For safety, links starting with "javascript:" or "data:" are not allowed.');
            return;
        }

        // Reddit-style composer: title and description are separate fields.
        // Submit both as-is (no first-line stripping).
        const titleForSubmit = String(base.title || '').trim();
        const descriptionForSubmit = String(base.description || '');

        // Client-side profanity check (instant feedback before server round-trip)
        const strippedDesc = stripHtml(descriptionForSubmit).trim();
        const profanityResult = base.checkContentProfanity({
            title: titleForSubmit,
            description: strippedDesc,
        });
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

        if (isDisabled) return;

        base.setSubmitting(true);
        try {
            const coords = (typeof base.resolveCoordinates === 'function') ? (base.resolveCoordinates() || []) : [];
            const [lat, lng] = coords.length === 2 ? coords : ['', ''];

            if (editMode) {
                const postId = Number(initialData?.id ?? initialData?.post_id ?? initialData?.postId);
                if (!Number.isFinite(postId) || postId <= 0) {
                    throw new Error('Missing post id for edit.');
                }

                const form = new FormData();
                form.append('title', titleForSubmit);
                form.append('visibility', visibility || 'public');
                form.append('description', descriptionForSubmit);
                form.append('city', base.sanitizeLocationValue(base.city));
                form.append('county', base.sanitizeLocationValue(base.county));
                form.append('latitude', lat ?? '');
                form.append('longitude', lng ?? '');

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

                // IMPORTANT: In edit mode, prefer the parent-provided onSubmit so it can
                // dispatch global refresh events (group post preview + detail panels rely on it).
                if (typeof onSubmit === 'function') {
                    await onSubmit(form);
                    return;
                }

                // Fallback (should be rare): direct PATCH if no onSubmit was provided.
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
            form.append('title', titleForSubmit);
            form.append('visibility', visibility);
            form.append('description', descriptionForSubmit);
            form.append('city', base.sanitizeLocationValue(base.city));
            form.append('county', base.sanitizeLocationValue(base.county));
            form.append('latitude', lat);
            form.append('longitude', lng);

            photos.forEach((p) => {
                if (p?.file) form.append('photos', p.file);
            });

            await doSubmit(form);
            if (typeof onRefresh === 'function') await onRefresh();
            onClose();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            let errMsg = err?.message || (editMode ? 'Save failed.' : 'Submission failed.');
            // If the error message is a JSON string, extract the human-readable message
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
    const titleText = editMode ? 'Edit Discussion Post' : 'New Discussion Post';
    const primaryBtnText = editMode ? 'Share' : 'Post';

    // Display strings for the compact chip row under the textarea
    const visibilityLabel = visibility === 'followers' ? 'Followers' : 'Public';
    const VisibilityIcon = visibility === 'followers' ? GroupIcon : PublicIcon;

    const trimmedCounty = String(base.county || '').trim();
    const trimmedCity = String(base.city || '').trim();
    const isStatewide = !trimmedCounty || trimmedCounty.toLowerCase() === 'all counties';
    const locationLabel = isStatewide
        ? 'All Alabama'
        : (trimmedCity && trimmedCity.toLowerCase() !== 'all cities'
            ? `${trimmedCity}, ${trimmedCounty.replace(/ County$/i, '')}`
            : trimmedCounty.replace(/ County$/i, ''));

    const photoCount = photos.filter((p) => p).length;
    const photoLabel = photoCount > 0
        ? `${photoCount} photo${photoCount === 1 ? '' : 's'}`
        : 'Add photo';

    // Disabled-state hover hint for the Post button
    const disabledReason = !hasTitle ? 'Enter a title to post' : '';

    return (
        <>
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 1.25,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    {HeaderIcon ? (
                        <HeaderIcon sx={{ fontSize: 22, flexShrink: 0, color: 'primary.main' }} />
                    ) : null}

                    <Typography sx={{ fontWeight: 900, fontSize: 16 }} noWrap>
                        {titleText}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent
                ref={scrollContainerRef}
                dividers
                autoComplete="off"
                component="form"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    // Tighter padding than the old multi-field form — we want
                    // the composer textarea to feel roomy, not cramped.
                    px: { xs: 2, sm: 2.5 },
                    py: 2,
                }}
            >
                {/* Error banner (unchanged behavior) */}
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

                {/* ── Reddit-style composer: title on top, body below ──────
                    Clean, minimal styling so the two fields feel like one
                    composer rather than a multi-field form. The title field
                    is autofocused and looks like a heading. The body field
                    sits directly beneath, separated by a subtle divider. */}
                <Box
                    sx={(t) => ({
                        border: '1px solid',
                        borderColor: alpha(t.palette.text.primary, 0.15),
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        transition: 'border-color 120ms ease, box-shadow 120ms ease',
                        '&:focus-within': {
                            borderColor: t.palette.primary.main,
                            boxShadow: `0 0 0 1px ${alpha(t.palette.primary.main, 0.25)}`,
                        },
                    })}
                >
                    {/* Title row */}
                    <TextField
                        inputRef={titleRef}
                        autoFocus
                        fullWidth
                        placeholder="Title"
                        value={base.title}
                        onChange={(e) => {
                            base.setTitle(e.target.value);
                            if (fieldErrors.title) {
                                setFieldErrors((prev) => {
                                    const n = { ...prev };
                                    delete n.title;
                                    return n;
                                });
                            }
                        }}
                        inputProps={{ maxLength: MAX_TITLE }}
                        error={Boolean(fieldErrors.title)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: 18,
                                fontWeight: 800,
                                lineHeight: 1.35,
                                px: 1.75,
                                py: 1.25,
                            },
                            '& .MuiInputBase-input::placeholder': {
                                opacity: 0.6,
                                fontWeight: 700,
                            },
                        }}
                    />

                    {/* Subtle divider between title and body */}
                    <Box
                        sx={(t) => ({
                            height: '1px',
                            bgcolor: alpha(t.palette.text.primary, 0.09),
                            mx: 1.75,
                        })}
                    />

                    {/* Description (body) row */}
                    <Box ref={descriptionFieldRef}>
                        <TextField
                            inputRef={descriptionInputRef}
                            multiline
                            minRows={4}
                            maxRows={12}
                            fullWidth
                            placeholder={`Add more details${(() => {
                                const c = (defaultCounty || trimmedCounty || '').trim().replace(/ County$/i, '');
                                return c ? ` — What's happening in ${c}?` : ' (optional)';
                            })()}`}
                            value={base.description}
                            onChange={(e) => {
                                handleDescriptionChange(e);
                                if (fieldErrors.description) {
                                    setFieldErrors((prev) => {
                                        const n = { ...prev };
                                        delete n.description;
                                        return n;
                                    });
                                }
                            }}
                            onKeyDown={handleDescriptionKeyDown}
                            inputProps={{ maxLength: MAX_DESCRIPTION }}
                            error={Boolean(fieldErrors.description)}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: 15,
                                    lineHeight: 1.55,
                                    px: 1.75,
                                    py: 1.25,
                                },
                                '& textarea::placeholder': {
                                    opacity: 0.6,
                                },
                            }}
                        />
                    </Box>
                </Box>

                {/* Per-field error helper text (outside the composer box so
                    it doesn't disrupt the visual unit) */}
                {(fieldErrors.title || fieldErrors.description) && (
                    <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: -0.5, ml: 0.5 }}>
                        {fieldErrors.title || fieldErrors.description}
                    </Typography>
                )}

                {/* Character counters — unobtrusive, right-aligned */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 1.5,
                        mt: -0.75,
                        px: 0.5,
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                        Title {base.title.length}/{MAX_TITLE}
                    </Typography>
                    {base.description.length > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                            Body {base.description.length}/{MAX_DESCRIPTION}
                        </Typography>
                    )}
                </Box>

                {/* ── Mentions popper (unchanged behavior) ── */}
                <Popper
                    open={mentionOpen}
                    anchorEl={mentionAnchorEl || descriptionInputRef.current}
                    placement="bottom-start"
                    style={{ zIndex: 1500 }}
                >
                    <Paper elevation={8} sx={{ width: 340, maxWidth: '90vw', borderRadius: 2, overflow: 'hidden' }}>
                        <ClickAwayListener
                            onClickAway={(e) => {
                                const el = descriptionInputRef.current;
                                if (el && (e?.target === el || el.contains?.(e?.target))) return;
                                closeMention();
                            }}
                        >
                            <Box>
                                <Box sx={{ px: 1.25, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Tag people</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                        Type to search names or usernames
                                    </Typography>
                                </Box>
                                {mentionLoading ? (
                                    <Box sx={{ p: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2" color="text.secondary">Searching…</Typography>
                                    </Box>
                                ) : mentionError ? (
                                    <Box sx={{ p: 1.25 }}>
                                        <Typography variant="body2" color="error">{mentionError}</Typography>
                                    </Box>
                                ) : Array.isArray(mentionResults) && mentionResults.length === 0 ? (
                                    <Box sx={{ p: 1.25 }}>
                                        <Typography variant="body2" color="text.secondary">No users found.</Typography>
                                    </Box>
                                ) : (
                                    <List dense disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                                        {mentionResults.map((u, idx) => (
                                            <Box key={u?.id ?? u?.username ?? idx}>
                                                <ListItemButton
                                                    selected={idx === mentionActiveIndex}
                                                    onMouseEnter={() => setMentionActiveIndex(idx)}
                                                    onClick={() => insertMention(u)}
                                                    sx={{ alignItems: 'center', py: 0.75 }}
                                                >
                                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                                        <Avatar
                                                            src={u?.avatarUrl || ''}
                                                            alt={u?.name || u?.username || 'User'}
                                                            sx={{ width: 32, height: 32 }}
                                                        />
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                                                                {u?.name || u?.username}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                @{u?.username}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItemButton>
                                                {idx !== mentionResults.length - 1 ? <Divider /> : null}
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </ClickAwayListener>
                    </Paper>
                </Popper>

                {/* ── Compact action chip row ─────────────────────────────────
                    Three chips: Location, Visibility, Photos. Tapping a chip
                    expands its panel below (Collapse component). The default
                    state is collapsed so the composer dominates the viewport —
                    these are "configure this if you care" affordances, not
                    required fields staring the user down. */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 0.5,
                    }}
                >
                    {/* Location chip */}
                    <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => setLocationExpanded((v) => !v)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setLocationExpanded((v) => !v);
                            }
                        }}
                        sx={(t) => ({
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.75,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: locationExpanded
                                ? alpha(t.palette.primary.main, 0.5)
                                : alpha(t.palette.text.primary, 0.18),
                            bgcolor: locationExpanded
                                ? alpha(t.palette.primary.main, 0.08)
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            '&:hover': {
                                borderColor: alpha(t.palette.primary.main, 0.4),
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                            },
                        })}
                    >
                        <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12.5 }}>
                            {locationLabel}
                        </Typography>
                    </Box>

                    {/* Visibility chip — opens a small menu */}
                    <Box
                        role="button"
                        tabIndex={0}
                        onClick={(e) => setVisibilityMenuAnchor(e.currentTarget)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setVisibilityMenuAnchor(e.currentTarget);
                            }
                        }}
                        sx={(t) => ({
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.75,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: alpha(t.palette.text.primary, 0.18),
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            '&:hover': {
                                borderColor: alpha(t.palette.primary.main, 0.4),
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                            },
                        })}
                    >
                        <VisibilityIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12.5 }}>
                            {visibilityLabel}
                        </Typography>
                    </Box>

                    {/* Photos chip */}
                    <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => setPhotosExpanded((v) => !v)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setPhotosExpanded((v) => !v);
                            }
                        }}
                        sx={(t) => ({
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.75,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: (photosExpanded || photoCount > 0)
                                ? alpha(t.palette.primary.main, 0.5)
                                : alpha(t.palette.text.primary, 0.18),
                            bgcolor: (photosExpanded || photoCount > 0)
                                ? alpha(t.palette.primary.main, 0.08)
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            '&:hover': {
                                borderColor: alpha(t.palette.primary.main, 0.4),
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                            },
                        })}
                    >
                        <PhotoCameraRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12.5 }}>
                            {photoLabel}
                        </Typography>
                    </Box>
                </Box>

                {/* ── Visibility menu (anchored to the visibility chip) ── */}
                <Popper
                    open={Boolean(visibilityMenuAnchor)}
                    anchorEl={visibilityMenuAnchor}
                    placement="bottom-start"
                    style={{ zIndex: 1500 }}
                >
                    <Paper elevation={8} sx={{ mt: 0.5, borderRadius: 2, overflow: 'hidden', minWidth: 200 }}>
                        <ClickAwayListener onClickAway={() => setVisibilityMenuAnchor(null)}>
                            <List dense disablePadding>
                                <ListItemButton
                                    selected={visibility === 'public'}
                                    onClick={() => {
                                        setVisibility('public');
                                        setVisibilityMenuAnchor(null);
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <PublicIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography variant="body2" sx={{ fontWeight: 800 }}>Public</Typography>}
                                        secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>Anyone on The Local Lantern</Typography>}
                                    />
                                </ListItemButton>
                                <Divider />
                                <ListItemButton
                                    selected={visibility === 'followers'}
                                    onClick={() => {
                                        setVisibility('followers');
                                        setVisibilityMenuAnchor(null);
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <GroupIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography variant="body2" sx={{ fontWeight: 800 }}>Followers</Typography>}
                                        secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>Only people who follow you</Typography>}
                                    />
                                </ListItemButton>
                            </List>
                        </ClickAwayListener>
                    </Paper>
                </Popper>

                {/* ── Expandable location panel ── */}
                <Collapse in={locationExpanded} unmountOnExit>
                    <Box
                        sx={(t) => ({
                            mt: 0.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(t.palette.text.primary, 0.03),
                            border: '1px solid',
                            borderColor: 'divider',
                        })}
                    >
                        <CityCountySelect
                            city={base.city}
                            setCity={base.setCity}
                            county={base.county}
                            setCounty={base.setCounty}
                            countyRequired={false}
                            countyLabelOverride={base.countyLabelOverride}
                            cityLabelOverride={base.cityLabelOverride}
                            countyError=""
                            cityError=""
                            emptyCountyLabel="All Counties"
                            emptyCityLabel="All Cities"
                            allCountyValue="All Counties"
                            allCityValue="All Cities"
                            profileCounty={defaultCounty}
                            profileCity={defaultCity}
                        />
                    </Box>
                </Collapse>

                {/* ── Expandable photos panel ── */}
                <Collapse in={photosExpanded || photoCount > 0} unmountOnExit>
                    <Box
                        ref={photosSectionRef}
                        sx={(t) => ({
                            mt: 0.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(t.palette.text.primary, 0.03),
                            border: '1px solid',
                            borderColor: 'divider',
                        })}
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
                            </Box>
                        )}

                        {fieldErrors.photos && (
                            <Typography color="error" sx={{ fontSize: 12, fontWeight: 700, mt: 0.5 }}>
                                {fieldErrors.photos}
                            </Typography>
                        )}
                    </Box>
                </Collapse>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between', gap: 1 }}>
                {/* Left side: destructive/navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {editMode && typeof onDelete === 'function' && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={onDelete}
                            disabled={base.submitting}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                        >
                            Delete
                        </Button>
                    )}
                </Box>

                {/* Right side: Cancel + Post */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="text"
                        onClick={onClose}
                        disabled={base.submitting}
                        sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>

                    <Tooltip title={disabledReason} disableHoverListener={!disabledReason}>
                        <span>
                            <Button
                                variant="contained"
                                onClick={handleSaveOrPost}
                                disabled={isDisabled}
                                disableElevation
                                startIcon={base.submitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 900,
                                    borderRadius: 999,
                                    px: 3,
                                    minWidth: 88,
                                }}
                            >
                                {base.submitting
                                    ? (photos.some((p) => p?.file)
                                        ? 'Uploading\u2026'
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

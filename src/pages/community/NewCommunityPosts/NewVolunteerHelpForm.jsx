import { secureFetch } from '../../../utils/secureFetch';
// -----------------------------------------------------------------------------
// NewVolunteerHelpForm.jsx
//
// Community Help Requests + Volunteer Offers (separate UX, shared endpoint)
//
// Edit-mode support:
//  • Accepts editMode + initialData and renders identical UI as “New”
//  • Save uses JSON payload via shared EditCommunityPostDialog (PATCH)
//  • Delete button appears when editMode + onDelete provided (handled by wrapper)
//  • Photo editor supports existing photo URLs + reordering (cover = first)
//
// UPDATE 2025-12-23 (UI + simplification):
//  • Photos UI now matches the Lost & Found popup (drag/drop + 4 slots + cover + reorder)
//  • Removed: Needed-by date, Preferred time, Helpers needed (they were not shown on detail/page)
//  • Users describe timing/helpers in the Details field instead.
// -----------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    ListItemButton,
    MenuItem,
    Paper,
    Popper,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import PhotosUploadSection from '../../../components/PhotosUploadSection';

import useBasePostForm, { MAX_DESCRIPTION, MAX_TITLE } from './useBasePostForm';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor';
import { stripHtml } from '../../../utils/richTextUtils';
import { createVolunteerRequest } from '../api/volunteerHelp';

import { getCommunityCategory, COMMUNITY_CATEGORY_META, PeopleRoundedIcon } from '../utils/communityPostCategoryIcons';

const MAX_PHOTOS = 8;
const MAX_RESOLUTION_UPDATE = 1000;
const MAX_HELP_TYPE_OTHER = 25;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const HELP_TYPES = [
    { value: 'labor', label: 'Home & Yard Help' },
    { value: 'rides', label: 'Rides & Errands' },
    { value: 'meals', label: 'Meals & Groceries' },
    { value: 'donations', label: 'Donations & Supplies' },
    { value: 'care', label: 'Care & Support' },
    { value: 'staffing', label: 'Community Event Help' },
    { value: 'skills', label: 'Skills & Advice' },
    { value: 'other', label: 'Other' },
];

function normalizeCounty(v) {
    const raw = String(v || '').trim();
    if (!raw) return '';
    return raw.replace(/\s+County$/i, '').trim();
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

function findDisallowedUrl(text) {
    const s = String(text || '');
    const m = s.match(/\b(javascript|data)\s*:/i);
    return m ? m[0] : null;
}

function getMentionCandidate(text, caretPos) {
    const t = String(text || '');
    const posRaw = Number.isFinite(Number(caretPos)) ? Number(caretPos) : t.length;
    const pos = Math.max(0, Math.min(posRaw, t.length));
    const upto = t.slice(0, pos);

    const atIdx = upto.lastIndexOf('@');
    if (atIdx === -1) return null;

    const prev = atIdx === 0 ? '' : upto[atIdx - 1];
    // Only trigger when "@" begins a token (start, whitespace, or common openers).
    if (prev && !/\s|[([\{"'`]/.test(prev)) return null;

    const after = upto.slice(atIdx + 1);
    if (after.includes(' ') || after.includes('\n') || after.includes('\t')) return null;

    // Allow partial query; if user just typed "@", query will be empty.
    if (!/^[A-Za-z0-9_.-]{0,32}$/.test(after)) return null;

    return { atIdx, query: after, caret: pos };
}

function normalizeMentionUser(raw) {
    const username = String(raw?.username ?? raw?.handle ?? '').trim();
    if (!username) return null;

    const name = String(raw?.name ?? raw?.display_name ?? raw?.displayName ?? '').trim();
    const first = String(raw?.first_name ?? raw?.firstName ?? '').trim();
    const last = String(raw?.last_name ?? raw?.lastName ?? '').trim();
    const displayName = name || `${first} ${last}`.trim() || username;

    const avatarUrl = String(
        raw?.profile_picture ??
        raw?.profilePicture ??
        raw?.avatar_url ??
        raw?.avatarUrl ??
        raw?.photo_url ??
        raw?.photoUrl ??
        '',
    ).trim();

    const id = raw?.id ?? raw?.user_id ?? raw?.userId ?? username;

    return { id, username, displayName, avatarUrl };
}

function MentionTextField({
                              value,
                              onChangeText,
                              disabled,
                              maxLength,
                              label,
                              placeholder,
                              multiline,
                              rows,
                              sx,
                          }) {
    const inputRef = useRef(null);

    const [isFocused, setIsFocused] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [items, setItems] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [loading, setLoading] = useState(false);

    const candidateRef = useRef(null);
    const blurTimerRef = useRef(null);

    const closeMenu = useCallback(() => {
        setOpen(false);
        setItems([]);
        setQuery('');
        setActiveIdx(0);
        candidateRef.current = null;
    }, []);

    const updateCandidateFromSelection = useCallback(
        (nextVal) => {
            const caret = inputRef.current?.selectionStart;
            const cand = getMentionCandidate(nextVal, caret);
            candidateRef.current = cand;

            const q = String(cand?.query || '');
            if (q.length >= 1) {
                setQuery(q);
                setOpen(true);
            } else {
                // If user only typed "@", do not force a dropdown.
                setQuery('');
                setOpen(false);
                setItems([]);
                setActiveIdx(0);
            }
        },
        [],
    );

    const handleChange = useCallback(
        (e) => {
            const next = e.target.value;
            if (typeof onChangeText === 'function') onChangeText(next);
            updateCandidateFromSelection(next);
        },
        [onChangeText, updateCandidateFromSelection],
    );

    const handleKeyUp = useCallback(
        (e) => {
            // Cursor moved or text changed by mouse selection / arrows
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                updateCandidateFromSelection(String(value || ''));
            }
        },
        [updateCandidateFromSelection, value],
    );

    const insertMention = useCallback(
        (username) => {
            const cand = candidateRef.current;
            const full = String(value || '');
            if (!cand || cand.atIdx == null || cand.caret == null) return;

            const atIdx = cand.atIdx;
            const caret = cand.caret;

            const before = full.slice(0, atIdx);
            const after = full.slice(caret);
            const mentionText = `@${username}`;

            const needsSpace = after.length > 0 && !/^\s/.test(after);
            const next = `${before}${mentionText}${needsSpace ? ' ' : ''}${after}`;

            if (typeof onChangeText === 'function') onChangeText(next);

            // Move cursor to end of inserted mention (plus optional space)
            const nextPos = before.length + mentionText.length + (needsSpace ? 1 : 0);
            window.setTimeout(() => {
                try {
                    inputRef.current?.focus();
                    inputRef.current?.setSelectionRange(nextPos, nextPos);
                } catch {
                    // ignore
                }
            }, 0);

            closeMenu();
        },
        [closeMenu, onChangeText, value],
    );

    useEffect(() => {
        if (!isFocused) {
            closeMenu();
            return;
        }

        if (!open || query.length < 1) return;

        const ac = new AbortController();
        let alive = true;

        setLoading(true);

        const t = window.setTimeout(async () => {
            try {
                const res = await secureFetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                    credentials: 'include',
                    signal: ac.signal,
                });

                if (!res.ok) {
                    if (alive) setItems([]);
                    return;
                }

                const data = await res.json();
                const list = Array.isArray(data?.users)
                    ? data.users
                    : Array.isArray(data)
                        ? data
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

                const qLower = String(query || '').toLowerCase();

                const normalized = list
                    .map(normalizeMentionUser)
                    .filter(Boolean)
                    .filter((u) => {
                        const name = String(u?.displayName || '').toLowerCase();
                        const username = String(u?.username || '').toLowerCase();
                        return name.includes(qLower) || username.includes(qLower);
                    })
                    .slice(0, 8);

                if (!alive) return;
                setItems(normalized);
                setActiveIdx(0);
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    if (alive) setItems([]);
                }
            } finally {
                if (alive) setLoading(false);
            }
        }, 160);

        return () => {
            alive = false;
            ac.abort();
            window.clearTimeout(t);
        };
    }, [closeMenu, isFocused, open, query]);

    const handleKeyDown = useCallback(
        (e) => {
            if (!open) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeMenu();
                return;
            }

            const hasItems = items.length > 0;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!hasItems) return;
                setActiveIdx((prev) => {
                    const next = prev + 1;
                    return next >= items.length ? 0 : next;
                });
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!hasItems) return;
                setActiveIdx((prev) => {
                    const next = prev - 1;
                    return next < 0 ? items.length - 1 : next;
                });
                return;
            }

            if (e.key === 'Enter') {
                if (!hasItems) return;
                const picked = items[activeIdx];
                if (!picked) return;
                e.preventDefault();
                insertMention(picked.username);
            }
        },
        [activeIdx, closeMenu, insertMention, items, open],
    );

    const width = inputRef.current?.clientWidth ? `${inputRef.current.clientWidth}px` : undefined;

    return (
        <Box sx={{ position: 'relative', ...sx }}>
            <TextField
                label={label}
                fullWidth
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                inputRef={inputRef}
                disabled={disabled}
                multiline={multiline}
                rows={rows}
                placeholder={placeholder}
                inputProps={maxLength ? { maxLength } : undefined}
                onFocus={() => {
                    if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
                    setIsFocused(true);
                    updateCandidateFromSelection(String(value || ''));
                }}
                onBlur={() => {
                    // Give clicks on the dropdown time to register
                    blurTimerRef.current = window.setTimeout(() => {
                        setIsFocused(false);
                        closeMenu();
                    }, 160);
                }}
            />

            <Popper
                open={Boolean(isFocused && open)}
                anchorEl={inputRef.current}
                placement="top-start"
                sx={{ zIndex: 2000, width }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        mt: 1,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ px: 1.25, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                            Tag people
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            @{query}
                        </Typography>
                    </Box>
                    <Divider />

                    <List dense disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                        {loading ? (
                            <Box sx={{ px: 1.25, py: 1 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Searching…
                                </Typography>
                            </Box>
                        ) : items.length ? (
                            items.map((u, idx) => (
                                <React.Fragment key={String(u.id)}>
                                    <ListItemButton
                                        onMouseDown={(ev) => {
                                            ev.preventDefault();
                                            ev.stopPropagation();
                                            insertMention(u.username);
                                        }}
                                        selected={idx === activeIdx}
                                        sx={{ py: 1 }}
                                    >
                                        <Avatar
                                            src={u.avatarUrl || undefined}
                                            alt={u.displayName}
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                mr: 1.25,
                                                bgcolor: u.avatarUrl ? 'transparent' : 'grey.400',
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
                                                {u.displayName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                                @{u.username}
                                            </Typography>
                                        </Box>
                                    </ListItemButton>
                                    {idx !== items.length - 1 ? <Divider /> : null}
                                </React.Fragment>
                            ))
                        ) : (
                            <Box sx={{ px: 1.25, py: 1 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No users found.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </Paper>
            </Popper>
        </Box>
    );
}

export default function NewVolunteerHelpForm({
                                                 onClose,
                                                 HeaderIcon,
                                                 onBack,
                                                 onRefresh,
                                                 defaultRequestKind = 'help',
                                                 defaultCity = '',
                                                 defaultCounty = '',
                                                 countyRequired = false,

                                                 // injected by EditCommunityPostDialog
                                                 editMode = false,
                                                 initialData = null,
                                                 onDelete,
                                                 onSubmit, // in edit mode: receives JSON payload (PATCH wrapper). In create-mode we ignore and call createVolunteerRequest.
                                             }) {
    // Shared fields
    const base = useBasePostForm({
        defaultCity,
        defaultCounty: normalizeCounty(defaultCounty),
        countyRequired,
    });

    // Per-field profanity errors: { title: "...", description: "...", resolution: "..." }
    const [fieldErrors, setFieldErrors] = React.useState({});
    const titleRef = React.useRef(null);
    const descriptionFieldRef = React.useRef(null);
    const resolutionFieldRef = React.useRef(null);
    const scrollContainerRef = React.useRef(null);
    const photosSectionRef = React.useRef(null);

    // If defaults are fetched/updated after mount (create-mode only), fill missing
    useEffect(() => {
        if (editMode) return;
        const dc = String(defaultCity || '').trim();
        const dco = normalizeCounty(defaultCounty);
        if (!base.city && dc) base.setCity(dc);
        if (!base.county && dco) base.setCounty(dco);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, defaultCity, defaultCounty]);

    const requestKind =
        String(defaultRequestKind || '').trim().toLowerCase() === 'volunteer' ? 'volunteer' : 'help';
    const isVolunteer = requestKind === 'volunteer';

    useEffect(() => {
        if (isVolunteer) {
            setIsResolved(false);
            setResolutionText('');
        }
    }, [isVolunteer]);

    // Separate details
    const [helpType, setHelpType] = useState('labor');
    const [helpTypeOther, setHelpTypeOther] = useState('');

    // Urgent flag (help requests only)
    const [isUrgent, setIsUrgent] = useState(false);

    // Resolved status + resolution update (help requests only, edit-mode)
    const [isResolved, setIsResolved] = useState(false);
    const [resolutionText, setResolutionText] = useState('');

    /* ───────── photos (drag/drop + reorder, matches Lost & Found) ───────── */
    // Photos (ordered): index 0 = cover
    // Each item: { id, url, file?: File, existing?: boolean }
    const [photos, setPhotos] = useState([]);
    const photosRef = useRef([]);

    const [clientPhotoWarning, setClientPhotoWarning] = useState('');

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            photosRef.current.forEach((p) => {
                if (p?.existing) return;
                try {
                    if (p?.url) URL.revokeObjectURL(p.url);
                } catch {
                    // ignore
                }
            });
        };
    }, []);

    // Edit-mode prefill
    useEffect(() => {
        if (!editMode) return;
        if (!initialData) return;

        if (typeof initialData.title === 'string') base.setTitle(initialData.title);
        if (typeof initialData.description === 'string') base.setDescription(initialData.description);
        if (typeof initialData.city === 'string') base.setCity(initialData.city);
        if (typeof initialData.county === 'string') base.setCounty(normalizeCounty(initialData.county));

        const ht = String(initialData.help_type || '').trim();
        if (ht) setHelpType(ht);

        const hto = String(initialData.help_type_other || '').trim();
        if (hto) setHelpTypeOther(hto);

        // Urgent (support top-level + nested shapes)
        const urgentRaw =
            (initialData?.is_urgent ?? initialData?.isUrgent ?? initialData?.urgent) ??
            (initialData?.volunteer_help?.is_urgent ?? initialData?.volunteer_help?.isUrgent ?? initialData?.volunteer_help?.urgent) ??
            (initialData?.volunteerHelp?.is_urgent ?? initialData?.volunteerHelp?.isUrgent ?? initialData?.volunteerHelp?.urgent) ??
            (initialData?.volunteer_help_request?.is_urgent ?? initialData?.volunteer_help_request?.isUrgent ?? initialData?.volunteer_help_request?.urgent);

        const urgentStr = String(urgentRaw ?? '').trim().toLowerCase();
        const urgentBool =
            urgentStr === '1' ||
            urgentStr === 'true' ||
            urgentStr === 'yes' ||
            urgentStr === 'y' ||
            urgentStr === 'on' ||
            urgentStr === 'urgent';
        setIsUrgent(urgentBool);

        // Resolved (help requests only; support top-level + nested shapes)
        const resolvedRaw =
            (initialData?.is_resolved ?? initialData?.isResolved ?? initialData?.resolved) ??
            (initialData?.volunteer_help?.is_resolved ?? initialData?.volunteer_help?.isResolved ?? initialData?.volunteer_help?.resolved) ??
            (initialData?.volunteerHelp?.is_resolved ?? initialData?.volunteerHelp?.isResolved ?? initialData?.volunteerHelp?.resolved) ??
            (initialData?.volunteer_help_request?.is_resolved ??
                initialData?.volunteer_help_request?.isResolved ??
                initialData?.volunteer_help_request?.resolved);

        const resolvedStr = String(resolvedRaw ?? '').trim().toLowerCase();
        const resolvedBool =
            resolvedStr === '1' ||
            resolvedStr === 'true' ||
            resolvedStr === 'yes' ||
            resolvedStr === 'y' ||
            resolvedStr === 'on' ||
            resolvedStr === 'resolved';

        setIsResolved(!isVolunteer && resolvedBool);

        const resolutionRaw =
            (initialData?.resolution_text ?? initialData?.resolutionText ?? initialData?.resolved_text) ??
            (initialData?.volunteer_help?.resolution_text ??
                initialData?.volunteer_help?.resolutionText ??
                initialData?.volunteer_help?.resolved_text) ??
            (initialData?.volunteerHelp?.resolution_text ??
                initialData?.volunteerHelp?.resolutionText ??
                initialData?.volunteerHelp?.resolved_text) ??
            (initialData?.volunteer_help_request?.resolution_text ??
                initialData?.volunteer_help_request?.resolutionText ??
                initialData?.volunteer_help_request?.resolved_text);

        setResolutionText(!isVolunteer ? String(resolutionRaw || '') : '');

        const existing = Array.isArray(initialData.photos) ? initialData.photos : [];
        const cleaned = existing
            .map((u) => String(u || '').trim())
            .filter(Boolean)
            .slice(0, MAX_PHOTOS)
            .map((url) => ({ id: makeId(), url, existing: true }));
        setPhotos(cleaned);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, initialData]);

    // Validation (no useMemo — keep simple & safe)
    const requiredMissing = [];
    if (!String(base.title || '').trim()) requiredMissing.push('Title');
    if (!String(helpType || '').trim()) requiredMissing.push('Category');
    if (helpType === 'other' && !String(helpTypeOther || '').trim()) requiredMissing.push('Other category');

    const tooltipMsg = requiredMissing.length
        ? `Please fill: ${requiredMissing.join(', ')}`
        : '';

    const isDisabled = Boolean(base.submitting || requiredMissing.length > 0);
    const canSubmit = !isDisabled;

    const handleSaveOrPost = async () => {
        base.setAttemptedSubmit(true);
        base.setError('');
        setFieldErrors({});
        if (!canSubmit) return;

        base.setSubmitting(true);

        const badScheme1 = findDisallowedUrl(base.description);
        const badScheme2 = findDisallowedUrl(resolutionText);
        if (badScheme1 || badScheme2) {
            base.setError('That text contains a potentially unsafe link. Please remove it and try again.');
            base.setSubmitting(false);
            return;
        }

        // Client-side profanity check (instant feedback before server round-trip)
        const strippedDesc = stripHtml(String(base.description || '')).trim();
        const strippedResolution = stripHtml(String(resolutionText || '')).trim();
        const profanityResult = base.checkContentProfanity({
            description: strippedDesc,
            resolution: strippedResolution,
        });
        if (!profanityResult.clean) {
            const newFieldErrors = {};
            if (profanityResult.field === 'title') {
                newFieldErrors.title = 'Contains inappropriate language. Please revise.';
            } else if (profanityResult.field === 'description') {
                newFieldErrors.description = 'Contains inappropriate language. Please revise.';
            } else if (profanityResult.field === 'resolution') {
                newFieldErrors.resolution = 'Contains inappropriate language. Please revise.';
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
                } else if (newFieldErrors.resolution && resolutionFieldRef.current) {
                    targetEl = resolutionFieldRef.current;
                }
                if (targetEl) {
                    const elRect = targetEl.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
                    container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
                }
            });
            base.setSubmitting(false);
            return;
        }

        try {
            const coords = (typeof base.resolveCoordinates === 'function') ? (base.resolveCoordinates() || []) : [];
            const [lat, lng] = (Array.isArray(coords) && coords.length === 2) ? coords : [null, null];

            if (editMode) {
                const postId = Number(initialData?.id ?? initialData?.post_id ?? initialData?.postId);
                if (!Number.isFinite(postId) || postId <= 0) {
                    throw new Error('Missing post id for edit.');
                }

                const form = new FormData();
                form.append('title', base.title || '');
                form.append('description', base.description || '');
                form.append('request_kind', requestKind || 'help');
                form.append('help_type', helpType || '');
                form.append('help_type_other', helpType === 'other' ? String(helpTypeOther || '').trim() : '');
                form.append('is_urgent', !isVolunteer && isUrgent ? '1' : '0');
                form.append('urgent', !isVolunteer && isUrgent ? '1' : '0');

                form.append('is_resolved', !isVolunteer && isResolved ? '1' : '0');
                form.append('resolved', !isVolunteer && isResolved ? '1' : '0');
                form.append('resolution_text', !isVolunteer ? String(resolutionText || '') : '');
                form.append('resolutionText', !isVolunteer ? String(resolutionText || '') : '');
                form.append('city', base.sanitizeLocationValue(base.city));
                form.append('county', base.sanitizeLocationValue(base.county));
                form.append('latitude', lat ?? '');
                form.append('longitude', lng ?? '');

                const orderTokens = [];
                let newIndex = 0;

                (photos || []).forEach((p) => {
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
            form.append('extra_notes', base.description);
            form.append('request_kind', requestKind);
            form.append('help_type', helpType);

            // Urgent (help requests only)
            form.append('is_urgent', !isVolunteer && isUrgent ? '1' : '0');
            form.append('urgent', !isVolunteer && isUrgent ? '1' : '0');

            if (helpType === 'other' && String(helpTypeOther || '').trim()) {
                form.append('help_type_other', String(helpTypeOther).trim());
            }

            form.append('city', base.sanitizeLocationValue(base.city));
            form.append('county', base.sanitizeLocationValue(base.county));
            form.append('latitude', lat ?? '');
            form.append('longitude', lng ?? '');

            (photos || []).forEach((p) => {
                if (p?.file) form.append('photos', p.file);
            });

            await createVolunteerRequest(form);
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

    const titleText = editMode ? (isVolunteer ? 'Edit Volunteer Offer' : 'Edit Help Request') : (isVolunteer ? 'Offer to Volunteer' : 'Ask for Help');
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {(() => {
                        const ResolvedIcon = HeaderIcon
                            || (isVolunteer
                                ? (COMMUNITY_CATEGORY_META['volunteers']?.Icon || PeopleRoundedIcon)
                                : (COMMUNITY_CATEGORY_META['help-requests']?.Icon || PeopleRoundedIcon));
                        return <ResolvedIcon sx={{ fontSize: 28, flexShrink: 0, color: 'primary.main' }} />;
                    })()}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {titleText}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {isVolunteer
                                ? 'Share how you can help neighbors (not a paid service listing).'
                                : 'Request neighbor-to-neighbor support (not a paid service listing).'}
                        </Typography>
                    </Box>
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

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Community posts are for volunteer / neighbor support.
                    </Typography>
                    <Typography variant="body2">
                        If you’re hiring someone or offering a paid service, please use the Services page.
                    </Typography>
                </Alert>

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
                    placeholder={
                        isVolunteer
                            ? 'Example: "Available to help with rides on weekends"'
                            : 'Example: "Need help moving a couch this Saturday"'
                    }
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {base.title.length} / {MAX_TITLE}
                </Typography>

                <TextField
                    select
                    label={isVolunteer ? 'I can help with' : 'Help needed'}
                    required
                    fullWidth
                    value={helpType}
                    onChange={(e) => setHelpType(e.target.value)}
                >
                    {HELP_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                            {t.label}
                        </MenuItem>
                    ))}
                </TextField>

                {!isVolunteer ? (
                    <Box sx={{ mt: 0.25 }}>
                        <FormControlLabel
                            sx={{ alignItems: 'flex-start', m: 0 }}
                            control={
                                <Checkbox
                                    checked={isUrgent}
                                    onChange={(e) => setIsUrgent(e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        Mark as urgent
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.1 }}>
                                        Adds an “Urgent” badge so neighbors know this needs quick help.
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>
                ) : null}

                {!isVolunteer && editMode ? (
                    <Box sx={{ mt: 0.5 }}>
                        <FormControlLabel
                            sx={{ alignItems: 'flex-start', m: 0 }}
                            control={
                                <Checkbox
                                    checked={isResolved}
                                    onChange={(e) => setIsResolved(e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        Mark as resolved
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.1 }}>
                                        Adds a “Resolved” badge and lets you post a short resolution update.
                                    </Typography>
                                </Box>
                            }
                        />

                        {isResolved ? (
                            <Box sx={{ mt: 1 }} ref={resolutionFieldRef}>
                                <MentionTextField
                                    label="Resolution update (optional)"
                                    multiline
                                    rows={3}
                                    value={resolutionText}
                                    onChangeText={(val) => {
                                        setResolutionText(val);
                                        if (fieldErrors.resolution) setFieldErrors((prev) => { const n = { ...prev }; delete n.resolution; return n; });
                                    }}
                                    maxLength={MAX_RESOLUTION_UPDATE}
                                    disabled={base.submitting}
                                    placeholder='Example: "Neighbor helped move it — thanks!"'
                                    error={Boolean(fieldErrors.resolution)}
                                    helperText={fieldErrors.resolution || ''}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {resolutionText.length} / {MAX_RESOLUTION_UPDATE}
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>
                ) : null}

                {helpType === 'other' ? (
                    <Box sx={{ width: '100%' }}>
                        <TextField
                            label="Other category"
                            required
                            fullWidth
                            value={helpTypeOther}
                            onChange={(e) => setHelpTypeOther(e.target.value.slice(0, MAX_HELP_TYPE_OTHER))}
                            inputProps={{ maxLength: MAX_HELP_TYPE_OTHER }}
                            placeholder='Example: "Pet sitting"'
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                            {helpTypeOther.length} / {MAX_HELP_TYPE_OTHER}
                        </Typography>
                    </Box>
                ) : null}

                <Box sx={{ width: '100%' }}>
                    <Box sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>Location</Typography>
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

                </Box>

                <Box ref={descriptionFieldRef}>
                    <RichTextEditor
                        label={isVolunteer ? 'Details (what you can help with)' : 'Details (what you need)'}
                        value={base.description}
                        onChange={(html) => {
                            base.setDescription(html);
                            if (fieldErrors.description) setFieldErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                        }}
                        maxLength={MAX_DESCRIPTION}
                        placeholder={
                            isVolunteer
                                ? 'Include any limits, comfort level, and any timing details.'
                                : 'Include what you need, and any timing / number of helpers / tools needed.'
                        }
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

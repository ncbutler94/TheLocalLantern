import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/components/NewPollForm.jsx
// =============================================================================
// Creation form for community polls. Renders as content inside the parent
// Step-2 Dialog from NewPostDialogs (no inner <Dialog>).
// Matches the pattern used by NewAnnouncementForm, NewGeneralDiscussionForm, etc.
// =============================================================================

import React, { useState, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
    IconButton,
    Chip,
    Divider,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { alpha as alphaColor, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';

import CityCountySelect from '../../../components/CityCountySelect';
import { checkProfanity } from '../../../utils/profanityCheck';
import useBasePostForm, { MAX_TITLE, MAX_DESCRIPTION } from './useBasePostForm';

const MAX_QUESTION = 50;
const MAX_OPTION_LEN = 200;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

// Duration presets for poll expiration
const DURATION_PRESETS = [
    ['1h', '1 hour'],
    ['6h', '6 hours'],
    ['1d', '1 day'],
    ['3d', '3 days'],
    ['7d', '7 days'],
    ['14d', '2 weeks'],
    ['30d', '30 days'],
];

const DURATION_MS = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '14d': 14 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

let _nextOptId = 1;
const makeOption = (label = '') => ({ _id: _nextOptId++, label });

/**
 * NewPollForm
 *
 * Renders directly inside the parent Dialog (no inner <Dialog>).
 *
 * @param {function} onBack          — return to category picker
 * @param {function} onClose         — close the entire dialog
 * @param {function} onSubmit        — async (payload) => data
 * @param {function} onRefresh       — refresh the post list after success
 * @param {string}   defaultCity     — prefill city
 * @param {string}   defaultCounty   — prefill county
 * @param {boolean}  countyRequired  — is county required?
 * @param {React.ElementType} HeaderIcon — icon for the header
 */
export default function NewPollForm({
                                        onBack,
                                        onClose,
                                        onSubmit,
                                        onRefresh,
                                        defaultCity = '',
                                        defaultCounty = '',
                                        countyRequired = false,
                                        HeaderIcon,
                                    }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // ── Use the shared base form hook for location / state management ──
    const base = useBasePostForm({
        defaultCity,
        defaultCounty,
        defaultStatewide: false,
    });

    // ── Poll-specific state ──
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState(() => [makeOption(), makeOption()]);
    const [expiresAt, setExpiresAt] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');
    const [visibility, setVisibility] = useState('public');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Per-field profanity / validation errors
    const [fieldErrors, setFieldErrors] = useState({});

    const scrollContainerRef = useRef(null);
    const questionRef = useRef(null);
    const descriptionFieldRef = useRef(null);
    const optionRefsMap = useRef({});

    // ── Option management ──
    const updateOptionLabel = useCallback((optId, newLabel) => {
        setOptions((prev) =>
            prev.map((o) => (o._id === optId ? { ...o, label: newLabel.slice(0, MAX_OPTION_LEN) } : o))
        );
    }, []);

    const addOption = useCallback(() => {
        setOptions((prev) => {
            if (prev.length >= MAX_OPTIONS) return prev;
            return [...prev, makeOption()];
        });
    }, []);

    const removeOption = useCallback((optId) => {
        setOptions((prev) => {
            if (prev.length <= MIN_OPTIONS) return prev;
            return prev.filter((o) => o._id !== optId);
        });
    }, []);

    // ── Duration handler ──
    const handleDuration = useCallback((durationKey) => {
        const ms = DURATION_MS[durationKey];
        if (ms) {
            setExpiresAt(new Date(Date.now() + ms).toISOString());
            setSelectedDuration(durationKey);
        }
    }, []);

    const handleRemoveExpiry = useCallback(() => {
        setExpiresAt('');
        setSelectedDuration('');
    }, []);

    // ── Validation ──
    const questionTrimmed = question.trim();
    const filledOptions = options.filter((o) => o.label.trim());
    const hasEmptyOptions = options.some((o) => !o.label.trim());
    const hasDuplicates = (() => {
        const labels = filledOptions.map((o) => o.label.trim().toLowerCase());
        return labels.length !== new Set(labels).size;
    })();

    const canSubmit = Boolean(
        questionTrimmed &&
        filledOptions.length >= MIN_OPTIONS &&
        !hasEmptyOptions &&
        !hasDuplicates &&
        !submitting
    );

    // ── Submit handler ──
    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError('');
        setFieldErrors({});

        // Client-side profanity checks
        const newFieldErrors = {};

        const qCheck = checkProfanity(question.trim());
        if (!qCheck.clean) {
            newFieldErrors.question = 'Contains inappropriate language. Please revise.';
        }

        if (description.trim()) {
            const dCheck = checkProfanity(description.trim());
            if (!dCheck.clean) {
                newFieldErrors.description = 'Contains inappropriate language. Please revise.';
            }
        }

        for (const opt of options) {
            const optCheck = checkProfanity(opt.label.trim());
            if (!optCheck.clean) {
                newFieldErrors[`option-${opt._id}`] = 'Contains inappropriate language.';
            }
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);

            // Scroll to first error
            requestAnimationFrame(() => {
                const container = scrollContainerRef.current;
                if (!container) return;

                let targetEl = null;
                if (newFieldErrors.question && questionRef.current) {
                    targetEl = questionRef.current;
                } else if (newFieldErrors.description && descriptionFieldRef.current) {
                    targetEl = descriptionFieldRef.current;
                } else {
                    const firstOptKey = Object.keys(newFieldErrors).find((k) => k.startsWith('option-'));
                    if (firstOptKey) {
                        const optId = firstOptKey.replace('option-', '');
                        const el = optionRefsMap.current[optId];
                        if (el) targetEl = el;
                    }
                }

                if (targetEl) {
                    const elRect = targetEl.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
                    container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
                }
            });

            setSubmitting(false);
            return;
        }

        try {
            const coords = base.resolveCoordinates();

            const payload = {
                title: question.trim(),
                description: description.trim(),
                options: options.map((o) => o.label.trim()),
                city: base.sanitizeLocationValue(base.city),
                county: base.sanitizeLocationValue(base.county),
                visibility,
                ...(expiresAt ? { pollExpiresAt: expiresAt } : {}),
                ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}),
            };

            if (typeof onSubmit === 'function') {
                await onSubmit(payload);
            }

            if (typeof onRefresh === 'function') {
                onRefresh();
            }

            if (typeof onClose === 'function') {
                onClose();
            }
        } catch (err) {
            setError(err?.message || 'Failed to create poll.');
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, question, description, options, visibility, expiresAt, base, onSubmit, onRefresh, onClose]);

    // ── Location handlers (stable callbacks for CityCountySelect) ──
    const handleCityChange = useCallback(
        (val) => base.setCity(val),
        [base]
    );

    const handleCountyChange = useCallback(
        (val) => base.setCounty(val),
        [base]
    );

    // Resolve the header icon
    const IconComp = HeaderIcon || PollRoundedIcon;

    return (
        <>
            {/* ── HEADER ── */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 1,
                    pl: isMobile ? 1.5 : 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {onBack && (
                        <IconButton
                            onClick={onBack}
                            size="small"
                            aria-label="Back"
                            disabled={submitting}
                            sx={{ borderRadius: 2, mr: 0.5 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <IconComp sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Create Poll
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close"
                    disabled={submitting}
                    sx={{ borderRadius: 2 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* ── SCROLLABLE CONTENT ── */}
            <DialogContent
                ref={scrollContainerRef}
                sx={{
                    pt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    // Ensure content is scrollable on mobile full-screen
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {error && (
                    <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Error</Typography>
                        <Typography variant="body2">{error}</Typography>
                    </Alert>
                )}

                {/* ── QUESTION ── */}
                <Box sx={{ pb: 2 }}>
                    <TextField
                        label="Poll Question"
                        required
                        fullWidth
                        value={question}
                        onChange={(e) => {
                            setQuestion(e.target.value.slice(0, MAX_QUESTION));
                            if (fieldErrors.question)
                                setFieldErrors((prev) => {
                                    const n = { ...prev };
                                    delete n.question;
                                    return n;
                                });
                        }}
                        inputProps={{ maxLength: MAX_QUESTION }}
                        inputRef={questionRef}
                        disabled={submitting}
                        error={Boolean(fieldErrors.question)}
                        helperText={fieldErrors.question || `${question.length} / ${MAX_QUESTION}`}
                        placeholder="What do you want to ask?"
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── POLL OPTIONS ── */}
                <Box sx={{ pb: 2 }}>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            mb: 1,
                        }}
                    >
                        <PollRoundedIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                        Options ({options.length}/{MAX_OPTIONS})
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {options.map((opt, idx) => (
                            <Box key={opt._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {/* Number badge */}
                                <Box
                                    sx={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '8px',
                                        bgcolor: opt.label.trim()
                                            ? (t) => alphaColor(t.palette.primary.main, 0.1)
                                            : 'rgba(0,0,0,0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid',
                                        borderColor: opt.label.trim()
                                            ? (t) => alphaColor(t.palette.primary.main, 0.2)
                                            : 'rgba(0,0,0,0.08)',
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            fontWeight: 900,
                                            color: opt.label.trim() ? 'primary.main' : 'text.disabled',
                                        }}
                                    >
                                        {idx + 1}
                                    </Typography>
                                </Box>

                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt.label}
                                    onChange={(e) => {
                                        updateOptionLabel(opt._id, e.target.value);
                                        const key = `option-${opt._id}`;
                                        if (fieldErrors[key])
                                            setFieldErrors((prev) => {
                                                const n = { ...prev };
                                                delete n[key];
                                                return n;
                                            });
                                    }}
                                    disabled={submitting}
                                    inputProps={{
                                        maxLength: MAX_OPTION_LEN,
                                        ref: (el) => {
                                            if (el) optionRefsMap.current[opt._id] = el;
                                        },
                                    }}
                                    error={Boolean(fieldErrors[`option-${opt._id}`])}
                                    helperText={fieldErrors[`option-${opt._id}`] || ''}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px',
                                        },
                                    }}
                                />

                                {/* Remove button (only if > MIN_OPTIONS) */}
                                {options.length > MIN_OPTIONS && (
                                    <IconButton
                                        size="small"
                                        onClick={() => removeOption(opt._id)}
                                        disabled={submitting}
                                        sx={{ flexShrink: 0, color: 'text.secondary' }}
                                        aria-label={`Remove option ${idx + 1}`}
                                    >
                                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                    </Box>

                    {hasDuplicates && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 700 }}>
                            Remove duplicate options before submitting.
                        </Typography>
                    )}

                    {options.length < MAX_OPTIONS && (
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon />}
                            onClick={addOption}
                            disabled={submitting}
                            sx={{
                                mt: 1,
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 999,
                            }}
                        >
                            Add option
                        </Button>
                    )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── POLL DURATION ── */}
                <Box sx={{ pb: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Poll Duration</Typography>

                    {expiresAt ? (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                Expires:{' '}
                                {new Date(expiresAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                                {DURATION_PRESETS.map(([k, label]) => (
                                    <Chip
                                        key={k}
                                        label={label}
                                        clickable
                                        onClick={() => handleDuration(k)}
                                        disabled={submitting}
                                        size="small"
                                        color={selectedDuration === k ? 'primary' : 'default'}
                                        variant={selectedDuration === k ? 'filled' : 'outlined'}
                                        icon={<TimerRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                        sx={{ fontWeight: 700, fontSize: 12 }}
                                    />
                                ))}
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRemoveExpiry}
                                disabled={submitting}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                            >
                                Remove limit
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                No time limit. Add one (optional):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {DURATION_PRESETS.map(([k, label]) => (
                                    <Chip
                                        key={k}
                                        label={label}
                                        clickable
                                        onClick={() => handleDuration(k)}
                                        disabled={submitting}
                                        icon={<TimerRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 12,
                                            '&:hover': {
                                                bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
                                            },
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── VISIBILITY ── */}
                <Box sx={{ pb: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Visibility</Typography>
                    <FormControl sx={{ width: { xs: '100%', sm: 180 } }}>
                        <InputLabel>Visibility</InputLabel>
                        <Select
                            value={visibility}
                            label="Visibility"
                            size="small"
                            onChange={(e) => setVisibility(e.target.value)}
                            disabled={submitting}
                        >
                            <MenuItem value="public">
                                <PublicIcon fontSize="small" style={{ marginRight: 8 }} /> Public
                            </MenuItem>
                            <MenuItem value="followers">
                                <GroupIcon fontSize="small" style={{ marginRight: 8 }} /> Followers
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── LOCATION ── */}
                <Box sx={{ pb: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Location</Typography>
                    <CityCountySelect
                        city={base.city}
                        county={base.county}
                        setCity={handleCityChange}
                        setCounty={handleCountyChange}
                        disabled={submitting}
                        countyRequired={false}
                        countyError={''}
                        includeAllOptions={false}
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── DESCRIPTION ── */}
                <Box ref={descriptionFieldRef}>
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Description</Typography>
                    <TextField
                        label="Context (optional)"
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value.slice(0, MAX_DESCRIPTION));
                            if (fieldErrors.description)
                                setFieldErrors((prev) => {
                                    const n = { ...prev };
                                    delete n.description;
                                    return n;
                                });
                        }}
                        placeholder="Add any extra context for your poll..."
                        inputProps={{ maxLength: MAX_DESCRIPTION }}
                        error={Boolean(fieldErrors.description)}
                        helperText={fieldErrors.description || `${description.length}/${MAX_DESCRIPTION}`}
                        disabled={submitting}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </DialogContent>

            {/* ── FOOTER ── */}
            <DialogActions
                sx={{
                    p: 2,
                    justifyContent: 'space-between',
                    gap: 1,
                    // Safe area padding for phones with home indicators
                    pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', sm: 2 },
                }}
            >
                <Button
                    variant="outlined"
                    onClick={onBack || onClose}
                    disabled={submitting}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                >
                    {onBack ? 'Back' : 'Cancel'}
                </Button>
                <Tooltip
                    title={
                        !questionTrimmed
                            ? 'Enter a poll question'
                            : filledOptions.length < MIN_OPTIONS
                                ? `Add at least ${MIN_OPTIONS} options`
                                : hasEmptyOptions
                                    ? 'Fill in all options'
                                    : hasDuplicates
                                        ? 'Remove duplicate options'
                                        : ''
                    }
                    disableHoverListener={canSubmit}
                >
                    <span>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 3 }}
                        >
                            {submitting ? 'Creating poll\u2026' : 'Create Poll'}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>
        </>
    );
}

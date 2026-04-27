import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/components/EditPollForm.jsx
// =============================================================================
// Edit form for community polls. Allows editing the question, option labels,
// description, location, and expiration. Does NOT allow adding or removing
// options (structure is locked once a poll is live).
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
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
    IconButton,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { alpha as alphaColor } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HowToVoteRoundedIcon from '@mui/icons-material/HowToVoteRounded';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';

import CityCountySelect from '../../../components/CityCountySelect';
import { checkFieldsProfanity, checkProfanity } from '../../../utils/profanityCheck';

const MAX_QUESTION = 50;
const MAX_DESCRIPTION = 1000;
const MAX_OPTION_LEN = 200;

/**
 * EditPollForm
 *
 * @param {boolean}  open      — dialog open state
 * @param {number}   postId    — community post ID
 * @param {function} onClose   — called after close (and after successful save)
 */
export default function EditPollForm({ open, postId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState('');

    // Editable fields
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState([]);
    const [city, setCity] = useState('');
    const [county, setCounty] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [visibility, setVisibility] = useState('public');

    // Original values for dirty detection
    const originalRef = useRef(null);

    // ── Fetch post + poll data on open ──
    useEffect(() => {
        if (!open || !postId) return;

        let alive = true;
        setLoading(true);
        setFetchError('');
        setError('');

        (async () => {
            try {
                const res = await secureFetch(`/api/community/${encodeURIComponent(postId)}`, {
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) throw new Error('Failed to load post');
                const post = await res.json();
                if (!alive) return;

                const q = String(post?.title || post?.post_title || '').trim();
                const desc = String(post?.description || '').trim();
                const c = String(post?.city || '').trim();
                const co = String(post?.county || '').trim();
                const exp = post?.poll_expires_at
                    || post?.pollExpiresAt
                    || post?.poll?.poll_expires_at
                    || post?.poll?.pollExpiresAt
                    || post?.poll?.expires_at
                    || post?.poll?.expiresAt
                    || '';
                const expired = Boolean(post?.expired || post?.poll?.expired)
                    || (exp ? new Date(exp).getTime() <= Date.now() : false);

                // Visibility
                const vis = String(post?.visibility || 'public').toLowerCase().trim();
                const safeVis = (vis === 'followers') ? 'followers' : 'public';

                // Poll options from the post data
                const pollOpts = Array.isArray(post?.poll?.options)
                    ? post.poll.options
                    : Array.isArray(post?.pollOptions)
                        ? post.pollOptions
                        : Array.isArray(post?.poll_options)
                            ? post.poll_options
                            : [];

                const mappedOpts = pollOpts.map((o) => ({
                    id: o.id,
                    label: String(o.label || o.text || o.option_text || '').trim(),
                    votes: Number(o.votes || o.vote_count || o.voteCount || 0),
                }));

                setQuestion(q);
                setDescription(desc);
                setOptions(mappedOpts);
                setCity(c);
                setCounty(co);
                setExpiresAt(exp);
                setIsExpired(expired);
                setVisibility(safeVis);

                originalRef.current = {
                    question: q,
                    description: desc,
                    options: mappedOpts.map((o) => ({ ...o })),
                    city: c,
                    county: co,
                    expiresAt: exp,
                    visibility: safeVis,
                };
            } catch (err) {
                if (alive) setFetchError(err?.message || 'Failed to load poll data.');
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [open, postId]);

    // ── Option label updater ──
    const updateOptionLabel = useCallback((optId, newLabel) => {
        setOptions((prev) =>
            prev.map((o) => (o.id === optId ? { ...o, label: newLabel.slice(0, MAX_OPTION_LEN) } : o))
        );
    }, []);

    // ── Location change handlers (stable callbacks) ──
    const handleCityChange = useCallback((val) => {
        setCity(val);
    }, []);

    const handleCountyChange = useCallback((val) => {
        setCounty(val);
    }, []);

    // ── Dirty check ──
    const isDirty = (() => {
        if (!originalRef.current) return false;
        const orig = originalRef.current;
        if (question !== orig.question) return true;
        if (description !== orig.description) return true;
        if (city !== orig.city) return true;
        if (county !== orig.county) return true;
        if (expiresAt !== orig.expiresAt) return true;
        if (visibility !== orig.visibility) return true;
        for (let i = 0; i < options.length; i++) {
            if (options[i]?.label !== orig.options[i]?.label) return true;
        }
        return false;
    })();

    // ── Validation ──
    const questionTrimmed = question.trim();
    const filledOptions = options.filter((o) => o.label.trim());
    // Only flag empty labels on options with zero votes (voted options are locked and can't be emptied)
    const hasEmptyOptions = options.some((o) => !o.label.trim() && o.votes === 0);
    const hasDuplicates = (() => {
        const labels = filledOptions.map((o) => o.label.trim().toLowerCase());
        return labels.length !== new Set(labels).size;
    })();
    const canSave = Boolean(
        questionTrimmed &&
        !hasEmptyOptions &&
        !hasDuplicates &&
        isDirty &&
        !saving
    );

    // ── Save handler ──
    const handleSave = useCallback(async () => {
        if (!canSave) return;
        setSaving(true);
        setError('');

        // Client-side profanity check on question, description, and option labels
        const profanityResult = checkFieldsProfanity({
            question: question.trim(),
            description: description.trim(),
        });
        if (!profanityResult.clean) {
            setError(`Your ${profanityResult.field} contains inappropriate language. Please revise and try again.`);
            setSaving(false);
            return;
        }
        // Check each poll option label
        for (let i = 0; i < options.length; i++) {
            const optCheck = checkProfanity(options[i]?.label || '');
            if (!optCheck.clean) {
                setError(`Option ${i + 1} contains inappropriate language. Please revise and try again.`);
                setSaving(false);
                return;
            }
        }

        try {
            // ── Pre-save check: re-fetch poll to see if votes came in while editing ──
            const checkRes = await secureFetch(`/api/community/${encodeURIComponent(postId)}`, {
                credentials: 'include',
                cache: 'no-store',
                headers: { Accept: 'application/json' },
            });
            if (checkRes.ok) {
                const freshPost = await checkRes.json();
                const freshOpts = Array.isArray(freshPost?.poll?.options)
                    ? freshPost.poll.options
                    : Array.isArray(freshPost?.pollOptions)
                        ? freshPost.pollOptions
                        : Array.isArray(freshPost?.poll_options)
                            ? freshPost.poll_options
                            : [];

                // Check if any option we changed now has votes it didn't have before
                const blocked = [];
                for (const opt of options) {
                    const orig = originalRef.current?.options?.find((o) => o.id === opt.id);
                    if (!orig) continue;
                    // Only check options whose labels were actually changed
                    if (opt.label.trim() === orig.label.trim()) continue;
                    const fresh = freshOpts.find((o) => o.id === opt.id);
                    const freshVotes = Number(fresh?.votes || fresh?.vote_count || fresh?.voteCount || 0);
                    if (freshVotes > 0) {
                        blocked.push(opt.label.trim() || `Option ${options.indexOf(opt) + 1}`);
                    }
                }

                if (blocked.length > 0) {
                    // Update local state with fresh vote counts so the UI reflects reality
                    setOptions((prev) =>
                        prev.map((o) => {
                            const fresh = freshOpts.find((f) => f.id === o.id);
                            if (!fresh) return o;
                            const freshVotes = Number(fresh.votes || fresh.vote_count || fresh.voteCount || 0);
                            return { ...o, votes: freshVotes };
                        })
                    );
                    setError(
                        `Someone voted while you were editing. The following option${blocked.length > 1 ? 's are' : ' is'} now locked: ${blocked.join(', ')}. Your other changes were not saved — please review and try again.`
                    );
                    setSaving(false);
                    return;
                }
            }

            const payload = {
                title: question.trim(),
                description: description.trim(),
                city: city.trim(),
                county: county.trim(),
                visibility,
                pollOptions: options.map((o) => ({
                    id: o.id,
                    label: o.label.trim(),
                })),
            };

            if (expiresAt !== originalRef.current?.expiresAt) {
                payload.pollExpiresAt = expiresAt || null;
            }

            const res = await secureFetch(`/api/community/${encodeURIComponent(postId)}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || data?.error || 'Failed to save changes.');
            }

            // Broadcast update so list/detail re-hydrates
            try {
                const updated = await res.json().catch(() => null);
                if (updated) {
                    window.dispatchEvent(new CustomEvent('ll:communityPost:updated', {
                        detail: { postId, post: updated, forceRefresh: true },
                    }));
                }
            } catch { /* ignore */ }

            onClose();
        } catch (err) {
            setError(err?.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    }, [canSave, question, description, city, county, visibility, options, expiresAt, postId, onClose]);

    // ── Expiry controls ──
    const handleExtendExpiry = useCallback((durationKey) => {
        const durationMs = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '12h': 12 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '3d': 3 * 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '14d': 14 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
        }[durationKey];
        if (durationMs) {
            setExpiresAt(new Date(Date.now() + durationMs).toISOString());
            setIsExpired(false);
        }
    }, []);

    const handleRemoveExpiry = useCallback(() => {
        setExpiresAt('');
        setIsExpired(false);
    }, []);

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === 'backdropClick') return;
                onClose();
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PollRoundedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Edit Poll
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ borderRadius: 2 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : fetchError ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Failed to load poll</Typography>
                        <Typography variant="body2">{fetchError}</Typography>
                    </Alert>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Save failed</Typography>
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
                                onChange={(e) => setQuestion(e.target.value)}
                                inputProps={{ maxLength: MAX_QUESTION }}
                                disabled={saving}
                                helperText={`${question.length} / ${MAX_QUESTION}`}
                            />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* ── POLL OPTIONS ── */}
                        <Box sx={{ pb: 2 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <PollRoundedIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                                Options ({options.length})
                            </Typography>

                            {options.some((o) => o.votes > 0) && (
                                <Alert severity="info" icon={<LockRoundedIcon sx={{ fontSize: 18 }} />} sx={{ borderRadius: 2, mb: 1.25, py: 0.25 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                                        Options with votes cannot be edited to protect voter intent.
                                    </Typography>
                                </Alert>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {options.map((opt, idx) => {
                                    const hasVotes = opt.votes > 0;
                                    return (
                                        <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box
                                                sx={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: '8px',
                                                    bgcolor: hasVotes
                                                        ? (t) => alphaColor(t.palette.text.primary, 0.04)
                                                        : opt.label.trim()
                                                            ? (t) => alphaColor(t.palette.primary.main, 0.1)
                                                            : 'rgba(0,0,0,0.04)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    border: '1px solid',
                                                    borderColor: hasVotes
                                                        ? (t) => alphaColor(t.palette.text.primary, 0.08)
                                                        : opt.label.trim()
                                                            ? (t) => alphaColor(t.palette.primary.main, 0.2)
                                                            : 'rgba(0,0,0,0.08)',
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: hasVotes ? 'text.disabled' : opt.label.trim() ? 'primary.main' : 'text.disabled' }}>
                                                    {idx + 1}
                                                </Typography>
                                            </Box>

                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt.label}
                                                onChange={(e) => updateOptionLabel(opt.id, e.target.value)}
                                                disabled={saving || hasVotes}
                                                inputProps={{ maxLength: MAX_OPTION_LEN }}
                                                error={!opt.label.trim() && !hasVotes}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '10px',
                                                        ...(hasVotes && {
                                                            bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                                                        }),
                                                    },
                                                }}
                                            />

                                            {hasVotes && (
                                                <Chip
                                                    size="small"
                                                    icon={<HowToVoteRoundedIcon sx={{ fontSize: '13px !important' }} />}
                                                    label={`${opt.votes}`}
                                                    sx={{
                                                        height: 24,
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        borderRadius: 999,
                                                        flexShrink: 0,
                                                        bgcolor: (t) => alphaColor(t.palette.text.secondary, 0.06),
                                                        color: 'text.secondary',
                                                        '& .MuiChip-icon': { color: 'text.secondary' },
                                                        '& .MuiChip-label': { px: 0.5 },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>

                            {hasDuplicates && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 700 }}>
                                    Remove duplicate options before saving.
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* ── EXPIRATION ── */}
                        <Box sx={{ pb: 2 }}>
                            <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Poll Duration</Typography>
                            {isExpired ? (
                                <Box>
                                    <Alert severity="info" sx={{ borderRadius: 2, mb: 1.5, py: 0.25 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            This poll has expired. Reopen it by choosing a new duration.
                                        </Typography>
                                    </Alert>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {[['1h', '1 hour'], ['6h', '6 hours'], ['1d', '1 day'], ['3d', '3 days'], ['7d', '7 days'], ['14d', '2 weeks'], ['30d', '30 days']].map(([k, label]) => (
                                            <Chip
                                                key={k}
                                                label={label}
                                                clickable
                                                onClick={() => handleExtendExpiry(k)}
                                                disabled={saving}
                                                icon={<TimerRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    '&:hover': { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08) },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ) : expiresAt ? (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                        Expires: {new Date(expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.75 }}>
                                        Extend from now:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                                        {[['1h', '+1hr'], ['6h', '+6hr'], ['1d', '+1d'], ['3d', '+3d'], ['7d', '+7d'], ['30d', '+30d']].map(([k, label]) => (
                                            <Chip
                                                key={k}
                                                label={label}
                                                clickable
                                                onClick={() => handleExtendExpiry(k)}
                                                disabled={saving}
                                                size="small"
                                                sx={{ fontWeight: 700, fontSize: 12 }}
                                            />
                                        ))}
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleRemoveExpiry}
                                        disabled={saving}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                                    >
                                        Remove limit
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                        No time limit set. Add one:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {[['1h', '1 hour'], ['6h', '6 hours'], ['1d', '1 day'], ['3d', '3 days'], ['7d', '7 days'], ['14d', '2 weeks'], ['30d', '30 days']].map(([k, label]) => (
                                            <Chip
                                                key={k}
                                                label={label}
                                                clickable
                                                onClick={() => handleExtendExpiry(k)}
                                                disabled={saving}
                                                icon={<TimerRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    '&:hover': { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08) },
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
                            <FormControl sx={{ width: { xs: '100%', sm: 220 } }}>
                                <InputLabel>Visibility</InputLabel>
                                <Select
                                    value={visibility}
                                    label="Visibility"
                                    size="small"
                                    onChange={(e) => setVisibility(e.target.value)}
                                    disabled={saving}
                                >
                                    <MenuItem value="public"><PublicIcon fontSize="small" style={{ marginRight: 8 }} /> Public</MenuItem>
                                    <MenuItem value="followers"><GroupIcon fontSize="small" style={{ marginRight: 8 }} /> Followers</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* ── LOCATION ── */}
                        <Box sx={{ pb: 2 }}>
                            <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Location</Typography>
                            <CityCountySelect
                                city={city}
                                county={county}
                                setCity={handleCityChange}
                                setCounty={handleCountyChange}
                                disabled={saving}
                                countyRequired={false}
                                countyError=""
                                includeAllOptions={false}
                            />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* ── DESCRIPTION ── */}
                        <Box>
                            <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Description</Typography>
                            <TextField
                                label="Context (optional)"
                                fullWidth
                                multiline
                                minRows={2}
                                maxRows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                                placeholder="Add any extra context for your poll..."
                                inputProps={{ maxLength: MAX_DESCRIPTION }}
                                helperText={`${description.length}/${MAX_DESCRIPTION}`}
                                disabled={saving}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between', gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                >
                    Cancel
                </Button>
                <Tooltip title={!isDirty ? 'No changes to save' : !canSave ? 'Fix errors before saving' : ''} disableHoverListener={canSave}>
                    <span>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={!canSave}
                            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 3 }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
}

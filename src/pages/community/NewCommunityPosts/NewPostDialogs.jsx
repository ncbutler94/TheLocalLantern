import { secureFetch } from '../../../utils/secureFetch';
// Renders Step-1 (CategoryPopup) and Step-2 (category-specific form),
// with required modal behavior: no outside-click close.
// Also wires *all* Step-2 forms with onSubmit handlers so we never
// trigger “onSubmit is not a function”, and fetches the user's
// saved (database) location to pass as defaults (used when Statewide is unchecked).

import React, {useEffect, useMemo, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import CategoryPopup from './CategoryPopup.jsx';
import NewLostAndFoundForm from './NewLostAndFoundForm.jsx';
import NewAnnouncementForm from './NewAnnouncementForm.jsx';
import NewGeneralDiscussionForm from './NewGeneralDiscussionForm.jsx';
import NewPublicSafetyForm from './NewPublicSafetyForm.jsx';
import NewRecommendationForm from './NewRecommendationForm.jsx';
import NewVolunteerHelpForm from './NewVolunteerHelpForm.jsx';
import NewPollForm from './NewPollForm.jsx';

import { getCommunityCategory, COMMUNITY_CATEGORY_META, PeopleRoundedIcon } from '../utils/communityPostCategoryIcons';

/* ── Helpers (defined outside component to avoid recreating on every render) ── */

/** Normalize slug aliases to a canonical form used by the Step-2 switch. */
const normalizeStepTwoSlug = (raw) => {
    const s0 = String(raw || '').trim().toLowerCase();
    const ALIASES = {
        'lost-found': 'lost-and-found',
        'lost_and_found': 'lost-and-found',
        announcement: 'announcements',
        discussion: 'community-chat',
        'volunteer-help': 'volunteer-help-requests',
        'volunteer-help-requests': 'volunteer-help-requests',
        'help-requests': 'volunteer-help-requests',
        volunteers: 'volunteer-requests',
        'volunteer-requests': 'volunteer-requests',
        'public-safety': 'public-safety-alerts',
        'public_safety': 'public-safety-alerts',
        'public-safety-alerts': 'public-safety-alerts',
        recommendation: 'recommendations-tips',
        recommendations: 'recommendations-tips',
        'recommendations-tips': 'recommendations-tips',
        tips: 'recommendations-tips',
        tip: 'recommendations-tips',
        'recommendations_and_tips': 'recommendations-tips',
        polls: 'poll',
    };
    return ALIASES[s0] || s0;
};

/**
 * Maps a normalized step-2 slug to the MUI Icon component from COMMUNITY_CATEGORY_META.
 * Returns the Icon component (not an element), or PeopleRoundedIcon as fallback.
 */
const SLUG_TO_CATEGORY_KEY = {
    'announcements': 'announcement',
    'announcement': 'announcement',
    'community-chat': 'discussion',
    'discussion': 'discussion',
    'lost-and-found': 'lost-and-found',
    'public-safety-alerts': 'public-safety-alerts',
    'recommendations-tips': 'recommendations',
    'help-requests': 'help-requests',
    'volunteer-help-requests': 'help-requests',
    'volunteer-help': 'help-requests',
    'volunteer-requests': 'volunteers',
    'volunteers': 'volunteers',
    'poll': 'poll',
    'polls': 'poll',
};

const getCategoryHeaderIcon = (slug) => {
    const categoryKey = SLUG_TO_CATEGORY_KEY[slug];
    if (categoryKey && COMMUNITY_CATEGORY_META[categoryKey]?.Icon) {
        return COMMUNITY_CATEGORY_META[categoryKey].Icon;
    }
    // Fallback: try getCommunityCategory
    const resolved = typeof getCommunityCategory === 'function' ? getCommunityCategory(slug) : null;
    if (resolved?.Icon) return resolved.Icon;
    return PeopleRoundedIcon;
};


export default function NewPostDialogs({
                                           stepOneOpen,
                                           stepTwoOpen,
                                           stepOneData,          // { category: '<slug>' }
                                           onClose1,
                                           onClose2,
                                           onCategoryChosen,     // (data) => void
                                           onRefresh,            // () => refetch posts after successful submit
                                           subtypes,             // categories to show in CategoryPopup
                                       }) {
    /* ──────────────────────────────────────────────────────────────
     * 1) Pull the user’s saved (database) location once when the
     *    Step-2 dialog opens. We pass these defaults down so the
     *    forms can prefill (county required, city optional).
     * ────────────────────────────────────────────────────────────── */
    const [defaults, setDefaults] = useState({ city: '', county: '' });
    const [attemptedFetch, setAttemptedFetch] = useState(false);

    // Mobile: make dialogs full-screen (matches CreateJobModal pattern)
    const _npdTheme = useTheme();
    const _npdMobile = useMediaQuery(_npdTheme.breakpoints.down('sm'));

    // Local mirror of dialog open state so "Back" can reliably reopen Step-1
    // even if the parent closed Step-1 when opening Step-2.
    const [localStepOneOpen, setLocalStepOneOpen] = useState(false);
    const [localStepTwoOpen, setLocalStepTwoOpen] = useState(false);

    // Freeze the chosen category while Step-2 is open so we don't flash
    // the \"Unable to open this form\" fallback during close/back transitions
    // if the parent clears stepOneData immediately.
    const [stepTwoCategory, setStepTwoCategory] = useState('');

    useEffect(() => {
        // Keep local state in sync with parent-driven opens.
        if (stepOneOpen) setLocalStepOneOpen(true);
        if (!stepOneOpen && !stepTwoOpen) {
            // If both are closed upstream, fully reset locally too.
            setLocalStepOneOpen(false);
            setLocalStepTwoOpen(false);
        }
        if (stepTwoOpen) setLocalStepTwoOpen(true);
        if (!stepTwoOpen) setLocalStepTwoOpen(false);
    }, [stepOneOpen, stepTwoOpen]);


    useEffect(() => {
        if (!localStepTwoOpen) return;
        const c = stepOneData?.category;
        if (c) setStepTwoCategory(c);
    }, [localStepTwoOpen, stepOneData?.category]);


    useEffect(() => {
        if (!stepTwoOpen || attemptedFetch) return;
        setAttemptedFetch(true);

        const fetchDefaults = async () => {
            try {
                const r = await secureFetch('/users/profile', {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                });
                if (!r.ok) return;

                const obj = await r.json();

                const candidates = [
                    obj,
                    obj.user,
                    obj.me,
                    obj.profile,
                    obj.account,
                    obj.data,
                ].filter(Boolean);

                for (const root of candidates) {
                    const county =
                        (root.county ??
                            root.home_county ??
                            root.default_county ??
                            (root.location && root.location.county) ??
                            (root.address && root.address.county) ??
                            '');

                    const city =
                        (root.city ??
                            root.home_city ??
                            root.default_city ??
                            (root.location && root.location.city) ??
                            (root.address && root.address.city) ??
                            '');

                    if (county || city) {
                        setDefaults({
                            city: String(city || ''),
                            county: String(county || ''),
                        });
                        break;
                    }
                }
            } catch (e) {
                // silent (defaults remain empty)
            }
        };

        fetchDefaults();
    }, [stepTwoOpen, attemptedFetch]);

    useEffect(() => {
        if (!stepTwoOpen) {
            setAttemptedFetch(false);
            setDefaults({ city: '', county: '' });
        }
    }, [stepTwoOpen]);

    /* ──────────────────────────────────────────────────────────────
     * 2) Shared helper: POST as FormData
     * ────────────────────────────────────────────────────────────── */
    /**
     * Fire-and-forget: tell the backend to process @mentions in the newly created
     * post's description and create notifications for tagged users.
     */
    const processMentions = (postId) => {
        if (!postId) return;
        try {
            secureFetch(`/api/community/${postId}/process-mentions`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            }).catch(() => { /* best-effort, never block */ });
        } catch {
            // ignore
        }
    };

    const post = async (url, formData, failMsg) => {
        const res = await secureFetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (!res.ok) {
            const msg = (await res.text()) || failMsg;
            throw new Error(msg);
        }
        const data = await res.json();

        // Dispatch event to notify CommunityPage to refresh lists and scroll to top
        try {
            window.dispatchEvent(
                new CustomEvent('ll:communityPost:created', {
                    detail: { id: data?.id, post: data },
                })
            );
        } catch {
            // ignore
        }

        // Process @mentions → create notifications (fire-and-forget)
        processMentions(data?.id);

        return data;
    };

    const postLostAndFound      = (fd) => post('/api/lost-and-found',     fd, 'Failed to submit lost & found.');
    const postAnnouncement      = (fd) => post('/api/announcements',      fd, 'Failed to submit announcement.');
    const postGeneralDiscussion = (fd) => post('/api/community-chat', fd, 'Failed to submit Discussion post.');
    const postPublicSafety      = (fd) => post('/api/public-safety',      fd, 'Failed to submit public safety alert.');
    const postRecommendation    = (fd) => post('/api/recommendations',    fd, 'Failed to submit recommendation/tip.');
    // Volunteer/Help request submits inside its dialog via createVolunteerRequest()

    const postPoll = async (payload) => {
        // Polls send JSON, not FormData
        const res = await secureFetch('/api/polls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const msg = (await res.text()) || 'Failed to submit poll.';
            throw new Error(msg);
        }
        const data = await res.json();
        try {
            window.dispatchEvent(
                new CustomEvent('ll:communityPost:created', {
                    detail: { id: data?.id, post: data },
                })
            );
        } catch {
            // ignore
        }

        // Process @mentions → create notifications (fire-and-forget)
        processMentions(data?.id);

        return data;
    };

    const selectedHeaderIcon = useMemo(() => {
        const slug = normalizeStepTwoSlug(stepTwoCategory || stepOneData?.category || '');
        return getCategoryHeaderIcon(slug);
    }, [stepTwoCategory, stepOneData?.category]);



    /* ──────────────────────────────────────────────────────────────
     * 3) Render Step-2 form that matches the picked slug.
     * ────────────────────────────────────────────────────────────── */

    const handleBackToCategory = () => {
        // Back should show the category picker again.
        setLocalStepTwoOpen(false);
        setLocalStepOneOpen(true);

        // Signal parent to reopen Step-1 (it might have closed Step-1 when opening Step-2).
        if (typeof onCategoryChosen === 'function') {
            onCategoryChosen({ back: true });
        }
    };

    const renderStepTwoForm = () => {
        const slug = normalizeStepTwoSlug(stepTwoCategory || stepOneData?.category || '');

        const commonDefaults = {
            defaultCity: defaults.city,
            defaultCounty: defaults.county,
            // With the new Statewide-first UX, county is only required when Statewide is unchecked.
            countyRequired: false,
        };

        switch (slug) {
            case 'lost-and-found':
                return (
                    <NewLostAndFoundForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postLostAndFound}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'announcements':
            case 'announcement':
                return (
                    <NewAnnouncementForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postAnnouncement}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'community-chat':
            case 'discussion':
                return (
                    <NewGeneralDiscussionForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postGeneralDiscussion}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'public-safety-alerts':
                return (
                    <NewPublicSafetyForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postPublicSafety}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'recommendations-tips':
                return (
                    <NewRecommendationForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postRecommendation}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'help-requests':
            case 'volunteer-help-requests':
            case 'volunteer-help':
                return (
                    <NewVolunteerHelpForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onRefresh={onRefresh}
                        defaultRequestKind="help"
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'volunteer-requests':
            case 'volunteers':
                return (
                    <NewVolunteerHelpForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onRefresh={onRefresh}
                        defaultRequestKind="volunteer"
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            case 'poll':
            case 'polls':
                return (
                    <NewPollForm
                        onBack={handleBackToCategory}
                        onClose={onClose2}
                        onSubmit={postPoll}
                        onRefresh={onRefresh}
                        {...commonDefaults}
                        HeaderIcon={selectedHeaderIcon}
                    />
                );

            default:
                return (
                    <DialogContent dividers>
                        <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                            Unable to open this form
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            This category isn’t wired yet (category: {String(stepTwoCategory || stepOneData?.category || '')}).
                        </Typography>
                    </DialogContent>
                );
        }
    };

    /* ──────────────────────────────────────────────────────────────
     * 4) Step-1 and Step-2 dialogs with “X” buttons and no backdrop/ESC close
     * ────────────────────────────────────────────────────────────── */
    return (
        <>
            {/* Step 1 */}
            <Dialog
                open={localStepOneOpen && !localStepTwoOpen}
                onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setLocalStepOneOpen(false); if (typeof onClose1==='function') onClose1(); } }}
                fullWidth
                maxWidth="sm"
                fullScreen={_npdMobile}
                PaperProps={{ sx: { position: 'relative', borderRadius: _npdMobile ? 0 : 3, maxHeight: _npdMobile ? '100%' : 520, display: 'flex', flexDirection: 'column' } }}
            >
                <CategoryPopup
                    subtypes={subtypes}
                    onCancel={() => { setLocalStepOneOpen(false); if (typeof onClose1==='function') onClose1(); }}
                    onCategoryChosen={(d) => {
                        const c = d?.category ? String(d.category) : '';
                        if (c) setStepTwoCategory(c);
                        setLocalStepOneOpen(false);
                        setLocalStepTwoOpen(true);
                        onCategoryChosen(d);
                    }}
                />
            </Dialog>

            {/* Step 2 */}
            <Dialog
                open={localStepTwoOpen}
                onClose={(_, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setLocalStepTwoOpen(false); setLocalStepOneOpen(false); if (typeof onClose2==='function') onClose2(); if (typeof onClose1==='function') onClose1(); } }}
                fullWidth
                maxWidth="sm"
                fullScreen={_npdMobile}
                TransitionProps={{ onExited: () => setStepTwoCategory('') }}
                PaperProps={{ sx: { position: 'relative', borderRadius: _npdMobile ? 0 : 3, height: _npdMobile ? '100%' : '85vh', maxHeight: _npdMobile ? '100%' : 780, display: 'flex', flexDirection: 'column' } }}
            >
                {renderStepTwoForm()}
            </Dialog>
        </>
    );
}
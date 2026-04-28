// src/components/SidePanel/Community/NewCommunityPosts/SmartPostDialog.jsx
// -----------------------------------------------------------------------------
// Single-dialog replacement for the 2-dialog CategoryPopup → Step-2 form flow.
//
// BEHAVIOR:
//   1) Opens to a clean category picker (required — users MUST pick a category
//      before seeing any form fields, because the form shape is category-
//      dependent).
//   2) Once a category is chosen, the dialog transitions to that category's
//      form. A compact header at the top shows the chosen category with a
//      "Change" link that returns to the picker.
//   3) If `initialCategory` is passed in (e.g., user tapped the Poll shortcut
//      on the inline composer), step 1 is skipped entirely.
//
// This keeps category selection deliberate (which is the requirement) while
// still feeling like one dialog — the picker and form live in the same
// dialog shell, not separate modals.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Dialog,
    IconButton,
    Link as MuiLink,
    Slide,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import NewLostAndFoundForm from './NewLostAndFoundForm.jsx';
import NewAnnouncementForm from './NewAnnouncementForm.jsx';
import NewGeneralDiscussionForm from './NewGeneralDiscussionForm.jsx';
import NewPublicSafetyForm from './NewPublicSafetyForm.jsx';
import NewRecommendationForm from './NewRecommendationForm.jsx';
import NewVolunteerHelpForm from './NewVolunteerHelpForm.jsx';
import NewPollForm from './NewPollForm.jsx';
import useChromeTop from '../../../hooks/useChromeTop';

import {
    getCommunityCategory,
    COMMUNITY_CATEGORY_META,
    PeopleRoundedIcon,
} from '../utils/communityPostCategoryIcons';

/* ---------- category metadata ---------- */
// Each row: id (slug the forms understand), label (user-facing name),
// blurb (concrete examples so users pick the right category).
//
// Discussion sits at the top as the default/most-common choice. The rest
// follow in rough order of specificity. Blurbs use concrete examples
// rather than vague descriptions ("Lost a pet, keys, wallet?" works far
// better than "Report a lost item.").
const CATEGORIES = [
    {
        id: 'discussion',
        label: 'Discussion',
        blurb: 'Chat, ask, or share anything local.',
    },
    {
        id: 'lost-and-found',
        label: 'Lost & Found',
        blurb: 'Lost a pet, keys, wallet? Found something?',
    },
    {
        id: 'recommendations-tips',
        label: 'Recommendation',
        blurb: '"Best plumber?" "Anyone tried the new caf\u00e9?"',
    },
    {
        id: 'help-requests',
        label: 'Help Request',
        blurb: 'Need a hand with a task, ride, or errand?',
    },
    {
        id: 'announcements',
        label: 'Announcement',
        blurb: 'Event, opening, closure, or news to share.',
    },
    {
        id: 'volunteer-requests',
        label: 'Volunteers',
        blurb: 'Organizing or recruiting for a local cause.',
    },
    {
        id: 'poll',
        label: 'Poll',
        blurb: 'Ask a question with answer choices to vote on.',
    },
    {
        id: 'public-safety-alerts',
        label: 'Public Safety Alert',
        blurb: 'Time-sensitive safety info (call 911 for emergencies).',
    },
];

/* ---------- slug → form-key normalization (from NewPostDialogs) ---------- */
const normalizeStepTwoSlug = (raw) => {
    const s0 = String(raw || '').trim().toLowerCase();
    const ALIASES = {
        'lost-found': 'lost-and-found',
        lost_and_found: 'lost-and-found',
        announcement: 'announcements',
        discussion: 'community-chat',
        'volunteer-help': 'volunteer-help-requests',
        'volunteer-help-requests': 'volunteer-help-requests',
        'help-requests': 'volunteer-help-requests',
        volunteers: 'volunteer-requests',
        'volunteer-requests': 'volunteer-requests',
        'public-safety': 'public-safety-alerts',
        public_safety: 'public-safety-alerts',
        'public-safety-alerts': 'public-safety-alerts',
        recommendation: 'recommendations-tips',
        recommendations: 'recommendations-tips',
        'recommendations-tips': 'recommendations-tips',
        tips: 'recommendations-tips',
        tip: 'recommendations-tips',
        recommendations_and_tips: 'recommendations-tips',
        polls: 'poll',
    };
    return ALIASES[s0] || s0;
};

/* ---------- icon resolver ---------- */
const SLUG_TO_CATEGORY_KEY = {
    announcements: 'announcement',
    announcement: 'announcement',
    'community-chat': 'discussion',
    discussion: 'discussion',
    'lost-and-found': 'lost-and-found',
    'public-safety-alerts': 'public-safety-alerts',
    'recommendations-tips': 'recommendations',
    'help-requests': 'help-requests',
    'volunteer-help-requests': 'help-requests',
    'volunteer-help': 'help-requests',
    'volunteer-requests': 'volunteers',
    volunteers: 'volunteers',
    poll: 'poll',
    polls: 'poll',
};

const getCategoryIcon = (id) => {
    const key = String(id || '').toLowerCase();
    const catKey = SLUG_TO_CATEGORY_KEY[key] || key;
    if (COMMUNITY_CATEGORY_META[catKey]?.Icon) {
        return COMMUNITY_CATEGORY_META[catKey].Icon;
    }
    const resolved =
        typeof getCommunityCategory === 'function'
            ? getCommunityCategory(catKey)
            : null;
    if (resolved?.Icon) return resolved.Icon;
    return PeopleRoundedIcon;
};

const getCategoryLabel = (id) => {
    const hit = CATEGORIES.find((c) => c.id === id);
    return hit?.label || id;
};

/* ---------- transition ---------- */
const UpTransition = React.forwardRef(function UpTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/* ───────────────────────── Category Picker view ─────────────────────────
   Vertical list of all 8 categories. Each row shows icon + label + blurb.
   Tap a row to commit the category and move to the form view.
   -------------------------------------------------------------------- */
function CategoryPicker({ onPick, onClose, topOffset = 0 }) {
    return (
        <>
            {/* Header */}
            <Box
                sx={(t) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    pt: topOffset ? `calc(${topOffset}px + 12px)` : 2,
                    pb: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: t.palette.background.paper,
                    flexShrink: 0,
                })}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditRoundedIcon
                        sx={{ color: 'primary.main', fontSize: 22 }}
                    />
                    <Box>
                        <Typography
                            sx={{ fontWeight: 900, fontSize: 17, lineHeight: 1.2 }}
                        >
                            New Community Post
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontWeight: 600 }}
                        >
                            Pick the category that fits best
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    size="small"
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ flexShrink: 0 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Category list */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                }}
            >
                {CATEGORIES.map((c, idx) => {
                    const Icon = getCategoryIcon(c.id);
                    return (
                        <Box
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`${c.label}: ${c.blurb}`}
                            onClick={() => onPick(c.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onPick(c.id);
                                }
                            }}
                            sx={(t) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.5,
                                cursor: 'pointer',
                                transition: 'background-color 120ms ease',
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                },
                                '&:focus-visible': {
                                    outline: 'none',
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                },
                                ...(idx < CATEGORIES.length - 1 && {
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }),
                            })}
                        >
                            {/* Icon in a soft rounded square */}
                            <Box
                                sx={(t) => ({
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(t.palette.primary.main, 0.1),
                                })}
                            >
                                <Icon sx={{ fontSize: 22, color: 'primary.main' }} />
                            </Box>

                            {/* Label + blurb */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 15,
                                        lineHeight: 1.25,
                                        color: 'text.primary',
                                    }}
                                >
                                    {c.label}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        color: 'text.secondary',
                                        fontWeight: 500,
                                        lineHeight: 1.4,
                                        mt: 0.125,
                                    }}
                                >
                                    {c.blurb}
                                </Typography>
                            </Box>

                            {/* Chevron */}
                            <ArrowForwardIosRoundedIcon
                                sx={{
                                    fontSize: 14,
                                    color: 'text.disabled',
                                    flexShrink: 0,
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>

            {/* Footer: link to full community guidelines */}
            <Box
                sx={(t) => ({
                    px: 2,
                    py: 1.25,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(t.palette.primary.main, 0.04),
                    flexShrink: 0,
                })}
            >
                <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                    Not sure?{' '}
                    <MuiLink
                        component={RouterLink}
                        to="/guidelines"
                        target="_blank"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 800,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        See community guidelines
                    </MuiLink>
                </Typography>
            </Box>
        </>
    );
}

/* ───────────────────── Form View with compact header ───────────────────── */
function FormView({
                      category,
                      onChangeCategory,
                      onClose,
                      onRefresh,
                      postHandlers,
                      defaultCity,
                      defaultCounty,
                      initialTitle,
                      initialDescription,
                      topOffset = 0,
                  }) {
    const HeaderIcon = useMemo(() => getCategoryIcon(category), [category]);
    const label = getCategoryLabel(category);

    /* ---------- form dispatch (mirrors NewPostDialogs switch) ---------- */
    const slug = normalizeStepTwoSlug(category);
    const commonDefaults = {
        defaultCity,
        defaultCounty,
        countyRequired: false,
        HeaderIcon: null, // we render our own compact header above
        onClose,
        onRefresh,
    };

    // Seed prefill text into the form via the existing editMode/initialData path.
    const hasCarry =
        (initialTitle && initialTitle.trim()) ||
        (initialDescription && initialDescription.trim());
    const prefill = hasCarry
        ? {
            initialData: {
                title: initialTitle || '',
                description: initialDescription || '',
            },
        }
        : {};

    const renderForm = () => {
        switch (slug) {
            case 'lost-and-found':
                return (
                    <NewLostAndFoundForm
                        onSubmit={postHandlers?.postLostAndFound}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'announcements':
            case 'announcement':
                return (
                    <NewAnnouncementForm
                        onSubmit={postHandlers?.postAnnouncement}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'community-chat':
            case 'discussion':
                return (
                    <NewGeneralDiscussionForm
                        onSubmit={postHandlers?.postGeneralDiscussion}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'public-safety-alerts':
                return (
                    <NewPublicSafetyForm
                        onSubmit={postHandlers?.postPublicSafety}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'recommendations-tips':
                return (
                    <NewRecommendationForm
                        onSubmit={postHandlers?.postRecommendation}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'help-requests':
            case 'volunteer-help-requests':
            case 'volunteer-help':
                return (
                    <NewVolunteerHelpForm
                        defaultRequestKind="help"
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'volunteer-requests':
            case 'volunteers':
                return (
                    <NewVolunteerHelpForm
                        defaultRequestKind="volunteer"
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            case 'poll':
            case 'polls':
                return (
                    <NewPollForm
                        onSubmit={postHandlers?.postPoll}
                        {...commonDefaults}
                        {...prefill}
                    />
                );
            default:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                            Unable to open this form
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Category not recognized: {String(category || '')}
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <>
            {/* Compact category header with Change link */}
            <Box
                sx={(t) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.5,
                    py: 1,
                    pt: topOffset ? `calc(${topOffset}px + 8px)` : 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: t.palette.background.paper,
                    flexShrink: 0,
                })}
            >
                <IconButton
                    size="small"
                    aria-label="Change category"
                    onClick={onChangeCategory}
                    sx={{ flexShrink: 0 }}
                >
                    <ArrowBackRoundedIcon fontSize="small" />
                </IconButton>

                <Box
                    sx={(t) => ({
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.primary.main, 0.1),
                    })}
                >
                    <HeaderIcon
                        sx={{ fontSize: 16, color: 'primary.main' }}
                    />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: 14,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                    </Typography>
                </Box>

                <MuiLink
                    component="button"
                    onClick={onChangeCategory}
                    sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'primary.main',
                        textDecoration: 'none',
                        flexShrink: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        p: 0.5,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    Change
                </MuiLink>

                <IconButton
                    size="small"
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ flexShrink: 0 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* The actual form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                {renderForm()}
            </Box>
        </>
    );
}

/* ───────────────────────── Main exported component ───────────────────────── */
export default function SmartPostDialog({
                                            open,
                                            initialCategory = '',        // if passed (e.g., poll shortcut), skip picker
                                            initialTitle = '',
                                            initialDescription = '',
                                            focusPhotos = false,           // eslint-disable-line no-unused-vars
                                            focusLocation = false,         // eslint-disable-line no-unused-vars
                                            defaultCity = '',
                                            defaultCounty = '',
                                            onClose,
                                            onRefresh,
                                            postHandlers = {},
                                        }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const chromeTop = useChromeTop();
    // Only add the chrome offset when this dialog is in fullscreen mode (mobile);
    // on desktop the dialog is centered and doesn't touch the iOS notch.
    const topOffset = isMobile ? chromeTop : 0;

    // The chosen category. Empty string = picker view; non-empty = form view.
    const [category, setCategory] = useState(initialCategory || '');

    // Carry the inline-composer prefill across the picker → form transition.
    const carriedTextRef = useRef({
        title: initialTitle || '',
        description: initialDescription || '',
    });

    // Reset state whenever the dialog opens.
    useEffect(() => {
        if (!open) return;
        setCategory(initialCategory || '');
        carriedTextRef.current = {
            title: initialTitle || '',
            description: initialDescription || '',
        };
    }, [open, initialCategory, initialTitle, initialDescription]);

    const handlePickCategory = (id) => {
        setCategory(id);
    };

    const handleChangeCategory = () => {
        setCategory('');
    };

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                // Prevent accidental dismissal (matches existing behavior)
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    return;
                }
                if (typeof onClose === 'function') onClose();
            }}
            fullWidth
            maxWidth="sm"
            fullScreen={isMobile}
            TransitionComponent={isMobile ? UpTransition : undefined}
            PaperProps={{
                sx: {
                    position: 'relative',
                    borderRadius: isMobile ? 0 : 3,
                    height: isMobile ? '100%' : '85vh',
                    maxHeight: isMobile ? '100%' : 780,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    // On mobile (fullScreen), position:fixed top:0 bypasses
                    // the body's safe-area top inset — push content below
                    // the iOS notch so the close button / form header
                    // aren't clipped.
                    ...(isMobile && { pt: 'env(safe-area-inset-top, 0px)' }),
                },
            }}
        >
            {category ? (
                <FormView
                    category={category}
                    onChangeCategory={handleChangeCategory}
                    onClose={onClose}
                    onRefresh={onRefresh}
                    postHandlers={postHandlers}
                    defaultCity={defaultCity}
                    defaultCounty={defaultCounty}
                    initialTitle={carriedTextRef.current.title}
                    initialDescription={carriedTextRef.current.description}
                    topOffset={topOffset}
                />
            ) : (
                <CategoryPicker
                    onPick={handlePickCategory}
                    onClose={onClose}
                    topOffset={topOffset}
                />
            )}
        </Dialog>
    );
}

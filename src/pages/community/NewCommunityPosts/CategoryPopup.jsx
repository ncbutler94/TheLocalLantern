// src/components/SidePanel/Community/NewCommunityPosts/CategoryPopup.jsx
// -----------------------------------------------------------------------------
// Step-1 dialog: lets the user pick which kind of Community post to create.
// -----------------------------------------------------------------------------
//
// UI polish additions (NO dropdown/logic changes):
// • Header icon + short subheading
// • Single “Step 1 of 2” chip (under subtitle, left side)
// • Clean guidelines card
// -----------------------------------------------------------------------------
//
// NOTE: This file intentionally does NOT control the dialog close "X" button.
// That is owned by the parent dialog wrapper component.
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    FormControl,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    Select,
    MenuItem,
    Button,
    Divider,
    IconButton,
    Link,
    Slide,
    Typography,
    useMediaQuery,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Link as RouterLink } from 'react-router-dom';

import { getCommunityCategory, COMMUNITY_CATEGORY_META, PeopleRoundedIcon } from '../utils/communityPostCategoryIcons';

/* ─────────────── central list of post categories ─────────────── */
const DEFAULT_CATEGORIES = [
    { id: 'discussion', label: 'General Discussion' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'help-requests', label: 'Help Requests' },
    { id: 'lost-and-found', label: 'Lost & Found' },
    { id: 'poll', label: 'Poll' },
    { id: 'public-safety-alerts', label: 'Public Safety Alerts' },
    // Legacy combined label in some DBs — we normalize to Recommendations below
    { id: 'recommendations-tips', label: 'Recommendations' },
    { id: 'volunteer-requests', label: 'Volunteers' },
];

const normalizeStr = (v) => String(v ?? '').trim();

const CATEGORY_ORDER = [
    'discussion',
    'discussion',
    'announcements',
    'poll',
    'public-safety-alerts',
    'help-requests',
    'lost-and-found',
    'recommendations',
    'volunteer-requests',
];

const GUIDELINES = {
    'discussion': {
        title: 'Discussion Guidelines',
        bullets: [
            'Be respectful and neighborly.',
            'Keep it local, helpful, and on-topic when possible.',
            'No scams, spam, or harassment.',
        ],
    },
    announcements: {
        title: 'Announcements Guidelines',
        bullets: [
            'Share clear updates that matter to the community.',
            'Include key details (who/what/when/where) when relevant.',
            'No misleading info, spam, or repeated promos.',
        ],
    },
    'public-safety-alerts': {
        title: 'Public Safety Alerts Guidelines',
        bullets: [
            'Share factual, time-sensitive information when possible.',
            'Avoid rumors; include sources or details if you have them.',
            'If it’s an emergency, call local authorities first.',
        ],
    },
    'help-requests': {
        title: 'Help Requests Guidelines',
        bullets: [
            'Be specific about what you need and when you need it.',
            'Share only the info you’re comfortable posting publicly.',
            'No fundraising scams or suspicious requests.',
        ],
    },
    'lost-and-found': {
        title: 'Lost & Found Guidelines',
        bullets: [
            'Include a clear description and last known location (county/city, or Statewide if applicable).',
            'Add a photo if you can and share a safe contact method.',
            'For safety, avoid posting sensitive personal info.',
        ],
    },
    recommendations: {
        title: 'Recommendations Guidelines',
        bullets: [
            'Ask or recommend clearly (what you’re looking for and where).',
            'Be honest—disclose if you have a connection to a business.',
            'Keep it respectful; no harassment or spam.',
        ],
    },
    'volunteer-requests': {
        title: 'Volunteers Guidelines',
        bullets: [
            'Explain the opportunity, time commitment, and location (county/city, or Statewide).',
            'Include who’s organizing and how to get involved.',
            'No misleading or high-pressure solicitation.',
        ],
    },
    poll: {
        title: 'Poll Guidelines',
        bullets: [
            'Ask a clear question with fair, distinct answer choices.',
            'Keep polls respectful \u2014 no loaded or offensive options.',
            'Polls are public and votes cannot be made anonymous.',
        ],
    },
};

const normalizeCategoryId = (id) => {
    const key = normalizeStr(id).toLowerCase();
    if (!key) return '';
    if (key === 'community-chat') return 'discussion';
    if (key === 'recommendations-tips' || key === 'tips' || key === 'tip') return 'recommendations';
    if (key === 'volunteer-help-requests' || key === 'volunteer-help') return 'volunteer-requests';
    if (key === 'polls') return 'poll';
    return key;
};

const getDefaultCategoryId = () => {
    // Always start with "Select a category" as default
    return '';
};

/** Resolve a MUI icon component for a category id */
const getCategoryIcon = (id) => {
    const key = normalizeStr(id).toLowerCase();
    const meta = COMMUNITY_CATEGORY_META[key];
    if (meta?.Icon) return meta.Icon;
    const resolved = typeof getCommunityCategory === 'function' ? getCommunityCategory(key) : null;
    if (resolved?.Icon) return resolved.Icon;
    return PeopleRoundedIcon;
};

const CategoryRow = ({ categoryId, label, muted = false }) => {
    const Icon = categoryId ? getCategoryIcon(categoryId) : PeopleRoundedIcon;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Icon sx={{ fontSize: 20, flexShrink: 0, opacity: muted ? 0.4 : 0.8, color: muted ? 'text.disabled' : 'primary.main' }} />
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 750,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

function normalizeCategoryOptions(list) {
    const input = Array.isArray(list) && list.length ? list : DEFAULT_CATEGORIES;

    const normalized = [];
    input.forEach((item) => {
        const rawId = item?.id || item?.slug || item?.value || item;
        const rawLabel = item?.label || item?.name || item?.text || '';

        const id = normalizeStr(rawId);
        const label = normalizeStr(rawLabel);

        if (!id) return;

        // Canonicalize legacy “community-chat” -> Discussion
        if (id === 'community-chat') {
            normalized.push({ id: 'discussion', label: 'General Discussion' });
            return;
        }

        // Legacy “Recommendations & Tips” (and any “tips” slugs) -> Recommendations only
        if (id === 'recommendations-tips' || id === 'tips' || id === 'tip') {
            normalized.push({ id: 'recommendations', label: 'Recommendations' });
            return;
        }

        // Backwards compatibility: older DBs used a combined "Volunteer & Help Requests" slug.
        if (id === 'volunteer-help-requests' || id === 'volunteer-help') {
            normalized.push({ id: 'help-requests', label: 'Help Requests' });
            normalized.push({ id: 'volunteer-requests', label: 'Volunteers' });
            return;
        }

        normalized.push({ id, label: label || id });
    });

    // De-dupe by id (first one wins)
    const seen = new Set();
    return normalized.filter((c) => {
        const key = normalizeStr(c.id).toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

const SlideUpTransition = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function MobileCommunityPicker({ open, onClose, categories, selectedCategory, onSelect, getCategoryIcon: getIcon }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={SlideUpTransition}
            PaperProps={{ sx: { bgcolor: "background.paper", pt: 'env(safe-area-inset-top, 0px)' } }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1, flexShrink: 0 }}>
                <IconButton edge="start" onClick={onClose} aria-label="close" sx={{ mr: 0.5 }}>
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Select a Category
                </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                <List disablePadding>
                    {categories.map((c) => {
                        const Icon = getIcon(c.id);
                        const isSelected = c.id === selectedCategory;
                        return (
                            <ListItemButton
                                key={c.id}
                                onClick={() => onSelect(c.id)}
                                selected={isSelected}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    ...(isSelected && {
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    }),
                                }}
                            >
                                <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
                                    <Icon sx={{ fontSize: 22, color: "primary.main" }} />
                                </Box>
                                <ListItemText
                                    primary={c.label}
                                    primaryTypographyProps={{
                                        fontSize: 15,
                                        fontWeight: isSelected ? 800 : 600,
                                    }}
                                />
                                {isSelected && (
                                    <CheckRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </DialogContent>
        </Dialog>
    );
}

export default function CategoryPopup({
                                          subtypes = DEFAULT_CATEGORIES,
                                          onCancel,
                                          onCategoryChosen,
                                      }) {
    const [category, setCategory] = useState(() => getDefaultCategoryId(subtypes));
    const _cpTheme = useTheme();
    const _cpMobile = useMediaQuery(_cpTheme.breakpoints.down('sm'));
    const [catPickerOpen, setCatPickerOpen] = useState(false);

    const sorted = useMemo(() => {
        const list = normalizeCategoryOptions(subtypes);
        const orderIndex = (id) => {
            const norm = normalizeCategoryId(id);
            const idx = CATEGORY_ORDER.indexOf(norm);
            return idx === -1 ? 999 : idx;
        };
        return list.sort((a, b) => {
            const ao = orderIndex(a.id);
            const bo = orderIndex(b.id);
            if (ao !== bo) return ao - bo;
            return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
        });
    }, [subtypes]);

    const canNext = Boolean(category);

    const sharedMenuProps = {
        PaperProps: { className: 'll-cream-menu-paper' },
    };

    const selectedLabel = useMemo(() => {
        if (!category) return '';
        const target = normalizeCategoryId(category);
        const found = sorted.find((c) => normalizeCategoryId(c.id) === target);
        return found?.label || category;
    }, [category, sorted]);

    const guideline = useMemo(() => {
        const norm = normalizeCategoryId(category);
        return GUIDELINES[norm] || {
            title: 'Community posting guidelines',
            bullets: ['Be respectful and neighborly.', 'No scams, spam, or harassment.', 'Illegal content will be removed.'],
        };
    }, [category]);

    return (
        <>
            <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditRoundedIcon sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        New Community Post
                    </Typography>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>
                        Choose a category so your neighbors can find it faster.
                    </Typography>

                    {_cpMobile ? (
                        <>
                            <Box
                                onClick={() => setCatPickerOpen(true)}
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.25,
                                    px: 1.75,
                                    py: 1.5,
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.text.primary, 0.23),
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    '&:hover': { borderColor: t.palette.text.primary },
                                })}
                            >
                                {(() => {
                                    const Icon = category ? getCategoryIcon(category) : PeopleRoundedIcon;
                                    return <Icon sx={{ fontSize: 22, color: category ? 'primary.main' : 'text.disabled' }} />;
                                })()}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        flex: 1,
                                        fontWeight: category ? 700 : 400,
                                        color: category ? 'text.primary' : 'text.secondary',
                                    }}
                                >
                                    {category ? selectedLabel : 'Select a category *'}
                                </Typography>
                                <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            </Box>

                            <MobileCommunityPicker
                                open={catPickerOpen}
                                onClose={() => setCatPickerOpen(false)}
                                categories={sorted}
                                selectedCategory={category}
                                onSelect={(val) => {
                                    setCategory(val);
                                    setCatPickerOpen(false);
                                }}
                                getCategoryIcon={getCategoryIcon}
                            />
                        </>
                    ) : (
                        <FormControl fullWidth required>
                            <InputLabel id="new-general-chat-label" shrink>
                                Category
                            </InputLabel>

                            <Select
                                labelId="new-general-chat-label"
                                value={category}
                                label="Category"
                                onChange={(e) => setCategory(String(e.target.value))}
                                MenuProps={sharedMenuProps}
                                displayEmpty
                                renderValue={(val) => {
                                    const v = normalizeStr(val);
                                    if (!v) {
                                        return <CategoryRow categoryId="" label="Select a category" muted />;
                                    }
                                    return <CategoryRow categoryId={v} label={selectedLabel} />;
                                }}
                                sx={{
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.55),
                                        borderWidth: 2,
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <CategoryRow categoryId="" label="Select a category" muted />
                                </MenuItem>

                                {sorted.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <CategoryRow categoryId={c.id} label={c.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Guidelines card */}
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.08)',
                            backgroundColor: 'rgba(0,0,0,0.03)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 900,
                                fontSize: 13,
                                mb: 0.75,
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                            }}
                        >
                            {guideline.title}
                        </Typography>

                        <Box
                            component="ul"
                            sx={{
                                m: 0,
                                pl: 2.25,
                                fontSize: 12.5,
                                lineHeight: 1.55,
                                color: 'text.secondary',
                                '& li': { mb: 0.25 },
                                '& li:last-of-type': { mb: 0 },
                            }}
                        >
                            {guideline.bullets.map((b) => (
                                <li key={b}>{b}</li>
                            ))}
                        </Box>

                        <Link
                            component={RouterLink}
                            to="/guidelines"
                            target="_blank"
                            sx={{
                                display: 'inline-block',
                                mt: 1,
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            See full community guidelines →
                        </Link>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={onCancel} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}>
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    disabled={!canNext}
                    onClick={() => onCategoryChosen({ category })}
                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, px: 3 }}
                >
                    Next
                </Button>
            </DialogActions>
        </>
    );
}

// src/pages/community/utils/communityPostCategoryIcons.js
//
// Shared MUI icon + label map for community post categories.
// Replaces the old PNG marker-based system with Material UI icons.
//
// Usage:
//   import { getCommunityCategory, COMMUNITY_CATEGORY_META } from '../utils/communityPostCategoryIcons';
//   const meta = getCommunityCategory('announcement');
//   // → { label: 'Announcement', Icon: CampaignRoundedIcon }

import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';

// ─── Master map ─────────────────────────────────────────────────────────────

export const COMMUNITY_CATEGORY_META = {
    announcement:           { label: 'Announcement',    Icon: CampaignRoundedIcon },
    announcements:          { label: 'Announcement',    Icon: CampaignRoundedIcon },

    discussion:             { label: 'General Discussion',      Icon: ForumRoundedIcon },
    'community-chat':       { label: 'General Discussion',      Icon: ForumRoundedIcon },

    tips:                   { label: 'Recommendation',  Icon: ThumbUpRoundedIcon },
    recommendations:        { label: 'Recommendation',  Icon: ThumbUpRoundedIcon },
    'recommendations-tips': { label: 'Recommendation',  Icon: ThumbUpRoundedIcon },
    tip:                    { label: 'Recommendation',  Icon: ThumbUpRoundedIcon },

    'help-requests':        { label: 'Help Request',    Icon: PanToolRoundedIcon },

    volunteers:             { label: 'Volunteer',       Icon: VolunteerActivismRoundedIcon },
    'volunteer-requests':   { label: 'Volunteer/Help',  Icon: VolunteerActivismRoundedIcon },
    'volunteer-help-requests': { label: 'Help Request', Icon: PanToolRoundedIcon },

    'lost-found':           { label: 'Lost / Found',    Icon: SearchRoundedIcon },
    'lost-and-found':       { label: 'Lost / Found',    Icon: SearchRoundedIcon },

    'public-safety-alerts': { label: 'Safety Alert',    Icon: ShieldRoundedIcon },

    poll:                   { label: 'Poll',            Icon: PollRoundedIcon },
    polls:                  { label: 'Poll',            Icon: PollRoundedIcon },

    community:              { label: 'Community',       Icon: PeopleRoundedIcon },
};

// Fallback entry
const FALLBACK = { label: 'Community', Icon: PeopleRoundedIcon };

/**
 * Look up the MUI icon + label for a community post category.
 * Returns { label: string, Icon: MuiSvgIcon }
 */
export function getCommunityCategory(categoryId) {
    if (!categoryId) return FALLBACK;
    const key = String(categoryId).toLowerCase().trim();
    return COMMUNITY_CATEGORY_META[key] || FALLBACK;
}

/**
 * Get just the MUI icon component for a category.
 */
export function getCommunityCategoryIcon(categoryId) {
    return getCommunityCategory(categoryId).Icon;
}

/**
 * Get just the label for a category.
 */
export function getCommunityCategoryLabel(categoryId) {
    return getCommunityCategory(categoryId).label;
}

// Re-export the individual icons for consumers that import them directly
export {
    CampaignRoundedIcon,
    ForumRoundedIcon,
    ThumbUpRoundedIcon,
    PanToolRoundedIcon,
    VolunteerActivismRoundedIcon,
    SearchRoundedIcon,
    ShieldRoundedIcon,
    PollRoundedIcon,
    PeopleRoundedIcon,
};

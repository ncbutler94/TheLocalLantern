// src/utils/reservedUsernames.js
//
// Shared reserved-username list for client-side validation.
// Used by Register, CreateGroupModal, and ProfileHeader (edit mode).
//
// Two categories:
//   1. ROUTE CONFLICTS — names that collide with top-level app routes
//      (e.g. /businesses, /groups, /artists, /events, etc.)
//   2. PERSONALLY RESERVED — handles held back for specific people / the platform
//
// All comparisons are case-insensitive (lowercase).

const ROUTE_CONFLICT_NAMES = [
    // Top-level app routes
    'businesses',
    'business',
    'artists',
    'artist',
    'groups',
    'group',
    'events',
    'event',
    'community',
    'explore',
    'search',
    'login',
    'register',
    'signup',
    'signin',
    'logout',
    'settings',
    'admin',
    'dashboard',
    'profile',
    'profiles',
    'notifications',
    'messages',
    'inbox',
    'chat',
    'feed',
    'home',
    'about',
    'help',
    'support',
    'terms',
    'privacy',
    'api',
    'auth',
    'oauth',
    'callback',
    'verify',
    'reset',
    'password',
    'account',
    'accounts',
    'user',
    'users',
    'post',
    'posts',
    'music',
    'marketplace',
    'jobs',
    'classifieds',
    'lost_and_found',
    'lostandfound',
    'lost',
    'found',
    'map',
    'maps',
    'calendar',
    'news',
    'blog',
    'media',
    'photos',
    'videos',
    'uploads',
    'download',
    'downloads',
    'static',
    'assets',
    'public',
    'favicon',
    'robots',
    'sitemap',
    'undefined',
    'null',
    'error',
    '404',
    '500',
    'healthcheck',
    'status',
    'test',
    'staging',
    'dev',
    'moderator',
    'mod',
    'report',
    'reports',
    'flag',
    'block',
    'blocked',
    'invite',
    'invites',
    'onboarding',
    'welcome',
    'create',
    'edit',
    'delete',
    'new',
    'trending',
    'popular',
    'discover',
    'recommendations',
    'activity',
    'following',
    'followers',
    'friends',
    'connections',
];

const PERSONALLY_RESERVED_NAMES = [
    // 'thelocallantern',
    'locallantern',
    'the_local_lantern',
    'local_lantern',
];

// Combined set for O(1) lookup
const RESERVED_SET = new Set([
    ...ROUTE_CONFLICT_NAMES,
    ...PERSONALLY_RESERVED_NAMES,
]);

/**
 * Check if a username/handle is reserved.
 * @param {string} value — the username to check (will be lowercased + trimmed)
 * @returns {{ reserved: boolean, message: string }}
 */
export function checkReservedUsername(value) {
    const normalized = String(value || '').toLowerCase().trim();
    if (!normalized) return { reserved: false, message: '' };

    if (RESERVED_SET.has(normalized)) {
        return {
            reserved: true,
            message: 'That username is reserved and cannot be used.',
        };
    }

    return { reserved: false, message: '' };
}

export { ROUTE_CONFLICT_NAMES, PERSONALLY_RESERVED_NAMES, RESERVED_SET };
export default checkReservedUsername;

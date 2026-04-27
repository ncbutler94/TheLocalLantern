import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Switch,
    Typography,
} from '@mui/material';
import { useActiveAccount } from '../../components/AccountContext';
import { secureFetch } from '../../utils/secureFetch';

/**
 * src/pages/account/NotificationSettings.jsx
 *
 * Account-level notification preferences (in-app).
 * Supports switching between personal, business, and artist accounts.
 *
 * Backend:
 *  - GET  /api/notifications/settings?account_id=...&account_type=...
 *  - PUT  /api/notifications/settings
 *
 * Props:
 *  - embedded: when true, renders without an outer Paper wrapper.
 */

/* ─── Helpers (OUTSIDE component — stable references) ──────────────────── */

/**
 * Resolve account ID from an account object to a stable primitive.
 * Mirrors the logic in AccountSettingsPage so both components agree.
 */
function resolveAccountId(account) {
    if (!account) return 'personal';
    const isBusiness = account.type === 'business';
    const isArtist = account.type === 'artist';
    const candidates = [
        account.id,
        isArtist && account.artist_id,
        isArtist && account.artistId,
        isArtist && account.profile_id,
        isArtist && account.profileId,
        isBusiness && account.business_id,
        isBusiness && account.businessId,
    ];
    for (const c of candidates) {
        const n = Number(c);
        if (n > 0 && Number.isFinite(n)) return n;
    }
    return 'personal';
}

export default function NotificationSettings({ embedded = false }) {
    const accountContext = useActiveAccount();

    // Read active account directly from localStorage as primary source
    const [localStorageAccount, setLocalStorageAccount] = useState(() => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // Listen for account changes
    useEffect(() => {
        const handleAccountChanged = (e) => {
            const nextAccount = e?.detail?.account || null;
            if (nextAccount && typeof nextAccount === 'object') {
                setLocalStorageAccount(nextAccount);
            } else {
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    setLocalStorageAccount(raw ? JSON.parse(raw) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        const handleStorage = (e) => {
            if (e.key === 'll:activeAccount') {
                try {
                    setLocalStorageAccount(e.newValue ? JSON.parse(e.newValue) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        window.addEventListener('ll:account:changed', handleAccountChanged);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ll:account:changed', handleAccountChanged);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // Use localStorage account as primary, context as fallback
    const activeAccount = localStorageAccount || accountContext.activeAccount;
    const isBusinessAccount = activeAccount?.type === 'business';

    // Stable primitives for dependency arrays — avoids infinite loops
    const activeAccountId = resolveAccountId(activeAccount);
    const activeAccountType = activeAccount?.type || 'personal';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [settings, setSettings] = useState(null);
    const [draft, setDraft] = useState(null);

    // Reload settings whenever the active account changes (deps are primitives)
    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            setLoadError('');
            setSaveError('');
            setSaveSuccess(false);
            setSettings(null);
            setDraft(null);

            try {
                const params = new URLSearchParams();
                if (activeAccountId && activeAccountId !== 'personal') {
                    params.set('account_id', String(activeAccountId));
                    params.set('account_type', String(activeAccountType));
                }

                const url = params.toString()
                    ? `/api/notifications/settings?${params.toString()}`
                    : '/api/notifications/settings';

                const res = await secureFetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });

                if (!res.ok) {
                    const msg =
                        res.status === 401
                            ? 'Please sign in to manage notification settings.'
                            : res.status === 403
                                ? 'Unable to load settings for this account.'
                                : 'Failed to load notification settings.';
                    throw new Error(msg);
                }

                const data = await res.json();

                if (!mounted) return;

                const s = data?.settings || data || {};

                const normalized = {
                    pause_all: Boolean(s.pause_all),
                    // Posts
                    notify_post_comments: s.notify_post_comments !== false,
                    notify_post_likes: s.notify_post_likes !== false,
                    notify_post_reposts: s.notify_post_reposts !== false,
                    // Comments
                    notify_comment_replies: s.notify_comment_replies !== false,
                    notify_comment_likes: s.notify_comment_likes !== false,
                    // Profile photo
                    notify_photo_comments: s.notify_photo_comments !== false,
                    notify_photo_likes: s.notify_photo_likes !== false,
                    notify_photo_comment_likes: Boolean(s.notify_photo_comment_likes),
                    // Followers
                    notify_new_followers: s.notify_new_followers !== false,
                    // Shares & mentions
                    notify_post_shares: s.notify_post_shares !== false,
                    notify_post_mentions: s.notify_post_mentions !== false,
                    // Events
                    notify_event_activity: s.notify_event_activity !== false,
                    // Marketplace
                    notify_listing_favorites: s.notify_listing_favorites !== false,
                    notify_listing_reposts: s.notify_listing_reposts !== false,
                    notify_listing_activity: s.notify_listing_activity !== false,
                    notify_seller_reviews: s.notify_seller_reviews !== false,
                    // Services
                    notify_service_activity: s.notify_service_activity !== false,
                    // Jobs
                    notify_job_activity: s.notify_job_activity !== false,
                    // Business reviews
                    notify_business_reviews: s.notify_business_reviews !== false,
                    // Groups
                    notify_group_activity: s.notify_group_activity !== false,
                };

                setSettings(normalized);
                setDraft(normalized);
            } catch (err) {
                if (!mounted) return;
                setLoadError(String(err?.message || 'Failed to load notification settings.'));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [activeAccountId, activeAccountType]);

    const hasChanges = Boolean(
        settings &&
        draft &&
        Object.keys(settings).some((k) => Boolean(settings[k]) !== Boolean(draft[k]))
    );

    const handleToggle = (key) => (event) => {
        const nextVal = Boolean(event.target.checked);

        setSaveSuccess(false);
        setSaveError('');

        setDraft((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: nextVal };
        });
    };

    const handleReset = () => {
        if (!settings) return;
        setDraft(settings);
        setSaveSuccess(false);
        setSaveError('');
    };

    const handleSave = async () => {
        if (!draft) return;

        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const payload = {
                settings: { ...draft },
                account_id: activeAccountId,
                account_type: activeAccountType,
            };

            const res = await secureFetch('/api/notifications/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.message ||
                    (res.status === 401
                        ? 'Please sign in to save notification settings.'
                        : 'Failed to save notification settings.');
                throw new Error(msg);
            }

            setSettings({ ...draft });
            setSaveSuccess(true);
        } catch (err) {
            setSaveError(String(err?.message || 'Failed to save notification settings.'));
        } finally {
            setSaving(false);
        }
    };

    const disabledAll = Boolean(draft?.pause_all);
    const pausedAll = Boolean(draft?.pause_all);

    const isArtistAccount = activeAccount?.type === 'artist';

    // Get the display name for the account
    const accountLabel = isBusinessAccount
        ? (activeAccount?.name || activeAccount?.business_name || activeAccount?.display_name || 'Business Account')
        : isArtistAccount
            ? (activeAccount?.name || activeAccount?.artist_name || activeAccount?.display_name || 'Artist Account')
            : 'Personal Account';

    const content = (
        <Stack spacing={2}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={{ xs: 1.5, sm: 2 }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.25 }}>
                        Notification Settings
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Manage notifications for your <strong>{accountLabel}</strong>
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                        disabled={!hasChanges || saving}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                </Stack>
            </Stack>

            {loadError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {loadError}
                </Alert>
            )}
            {saveError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {saveError}
                </Alert>
            )}
            {saveSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Notification settings saved successfully!
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ fontWeight: 800 }}>Loading notification settings…</Typography>
                </Box>
            ) : draft ? (
                <>
                    <Divider />

                    <Stack spacing={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Master
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Pause all notifications</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Turn off all in-app notifications until you&apos;re ready to turn them back on.
                                </Typography>
                            </Box>
                            <Switch checked={Boolean(draft.pause_all)} onChange={handleToggle('pause_all')} />
                        </Stack>
                    </Stack>

                    {pausedAll ? (
                        <Alert severity="info">
                            Paused — you won't receive new notifications until you turn this back off.
                        </Alert>
                    ) : null}

                    <Divider />

                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Posts
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Comments on my posts</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone comments on a post you made.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_post_comments)}
                                onChange={handleToggle('notify_post_comments')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Likes on my posts</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone likes a post you made.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_post_likes)}
                                onChange={handleToggle('notify_post_likes')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Reposts of my posts</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone reposts your post.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_post_reposts)}
                                onChange={handleToggle('notify_post_reposts')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Comments
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Replies to my comments</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone replies to a comment you wrote.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_comment_replies)}
                                onChange={handleToggle('notify_comment_replies')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Likes on my comments</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone likes a comment you wrote.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_comment_likes)}
                                onChange={handleToggle('notify_comment_likes')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Photos
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Comments on my photos</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone comments on your photos.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_photo_comments)}
                                onChange={handleToggle('notify_photo_comments')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Likes on my photos</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone likes your photos.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_photo_likes)}
                                onChange={handleToggle('notify_photo_likes')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2,
                                px: 0.25,
                                py: 0.75,
                                borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Likes on photo comments</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone likes a comment on your photos.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_photo_comment_likes)}
                                onChange={handleToggle('notify_photo_comment_likes')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ FOLLOWERS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Followers
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>New followers</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone follows you or your page.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_new_followers)}
                                onChange={handleToggle('notify_new_followers')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ SHARES & MENTIONS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Shares &amp; Mentions
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Shares of my content</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone shares your posts, listings, events, or services.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_post_shares)}
                                onChange={handleToggle('notify_post_shares')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Mentions</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone mentions you in a post, comment, or listing.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_post_mentions)}
                                onChange={handleToggle('notify_post_mentions')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ EVENTS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Events
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Event activity</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    RSVPs, comments, likes, reposts, and shares on your events.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_event_activity)}
                                onChange={handleToggle('notify_event_activity')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ MARKETPLACE ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Marketplace
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Listing saves</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone saves one of your listings.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_listing_favorites)}
                                onChange={handleToggle('notify_listing_favorites')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Listing reposts</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone reposts one of your listings.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_listing_reposts)}
                                onChange={handleToggle('notify_listing_reposts')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Other listing activity</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Messages, sold notifications, mentions, and shares on your listings.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_listing_activity)}
                                onChange={handleToggle('notify_listing_activity')}
                                disabled={disabledAll}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Seller reviews</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    When someone leaves or replies to a seller review.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_seller_reviews)}
                                onChange={handleToggle('notify_seller_reviews')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ SERVICES ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Services
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Service activity</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Reviews, quote requests, saves, shares, and responses on your services.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_service_activity)}
                                onChange={handleToggle('notify_service_activity')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ JOBS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Jobs
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Job activity</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Applications, saves, and shares on your job postings.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_job_activity)}
                                onChange={handleToggle('notify_job_activity')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ BUSINESS REVIEWS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Reviews
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Business reviews</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    New reviews, helpful votes, and replies on your business page.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_business_reviews)}
                                onChange={handleToggle('notify_business_reviews')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ═══ GROUPS ═══ */}
                    <Stack
                        spacing={2}
                        sx={pausedAll ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Groups
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={(t) => ({
                                gap: 2, px: 0.25, py: 0.75, borderRadius: 2,
                                transition: t.custom.motion.all,
                                ...(pausedAll ? { opacity: 0.55, bgcolor: 'action.hover' } : {}),
                            })}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>Group activity</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Invites, join requests, approvals, and other group notifications.
                                </Typography>
                            </Box>
                            <Switch
                                checked={Boolean(draft.notify_group_activity)}
                                onChange={handleToggle('notify_group_activity')}
                                disabled={disabledAll}
                            />
                        </Stack>
                    </Stack>
                </>
            ) : null}
        </Stack>
    );

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: embedded ? '100%' : 980,
                mx: embedded ? 0 : 'auto',
                px: embedded ? 0 : { xs: 0, sm: 3 },
                py: embedded ? 0 : { xs: 0, sm: 3 },
            }}
        >
            {embedded ? (
                content
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: { xs: 0, sm: 3 },
                        border: { xs: 'none', sm: '1px solid' },
                        borderColor: { xs: 'transparent', sm: 'divider' },
                    }}
                >
                    {content}
                </Paper>
            )}
        </Box>
    );
}

// src/components/BlockedPostGate.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { Box, Button, Typography, Stack, Avatar } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { parseBlockedSets, handleBlockChangedEvent } from '../utils/commentBlockUtils';
import { secureFetch } from '../utils/secureFetch';

const CONTENT_LABELS = {
    post: { noun: 'post', action: 'View Post' },
    service: { noun: 'service', action: 'View Service' },
    listing: { noun: 'listing', action: 'View Listing' },
    job: { noun: 'job posting', action: 'View Job' },
    event: { noun: 'event', action: 'View Event' },
    event_post: { noun: 'post', action: 'View Post' },
};
function getLabels(ct) { return CONTENT_LABELS[ct] || CONTENT_LABELS.post; }

/**
 * Extract the content author/owner identity from any content shape.
 *
 * Handles:
 * - Posts: user_id / business_id / artist_id at top level
 * - Events: nested organizer object (organizer.id, organizer.user_id)
 * - Services: provider_id + provider_type
 * - Marketplace listings: seller_id, seller.id, userId
 */
function extractContentAuthor(item) {
    if (!item) return null;
    const p = item;
    const org = p.organizer || {};
    const seller = p.seller || {};

    const userId = Number(
        p.user_id || p.userId || p.author_id || p.authorId ||
        p.poster_id || p.posterId || p.uid ||
        p.owner_user_id || p.ownerUserId ||
        org.id || org.user_id ||
        p.organizer_user_id || p.organizerUserId || p.organizer_id || p.organizerId ||
        p.provider_id || p.providerId ||
        p.seller_id || p.sellerId || seller.id ||
        p.posted_by_user_id || p.createdBy || p.created_by || 0
    );

    const businessId = Number(
        p.business_id || p.businessId ||
        p.business_account_id || p.businessAccountId || 0
    );

    const artistId = Number(
        p.artist_id || p.artistId ||
        p.artist_account_id || p.artistAccountId || 0
    );

    const handle = (
        p.handle || p.userHandle || p.user_handle ||
        p.business_slug || p.businessSlug ||
        p.artist_handle || p.artistHandle ||
        p.account_handle || p.accountHandle ||
        p.providerHandle || p.provider_handle ||
        p.sellerHandle || p.seller_handle ||
        org.handle || org.username ||
        seller.handle || seller.username ||
        p.posterHandle || p.poster_handle ||
        p.organizerHandle || p.organizer_handle || ''
    ).toLowerCase().trim();

    const name =
        p.business_name || p.businessName ||
        p.artist_name || p.artistName ||
        p.account_name || p.accountName ||
        p.userName || p.user_name ||
        p.poster_name || p.posterName ||
        p.providerName || p.provider_name ||
        p.sellerName || p.seller_name || seller.name ||
        p.organizer_name || p.organizerName ||
        [org.firstName || org.first_name, org.lastName || org.last_name].filter(Boolean).join(' ').trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
        p.title || p.name || '';

    const avatar =
        p.business_avatar_url || p.businessAvatarUrl ||
        p.artist_avatar_url || p.artistAvatarUrl ||
        p.account_avatar_url || p.accountAvatarUrl ||
        p.userAvatar || p.user_avatar || p.avatar_url || p.avatarUrl ||
        p.poster_avatar || p.posterAvatar ||
        p.providerAvatar || p.provider_avatar ||
        p.serviceAvatarUrl || p.service_avatar_url ||
        org.avatarUrl || org.avatar_url || org.profile_picture ||
        seller.avatar_url || seller.avatarUrl || '';

    const providerType = (p.provider_type || p.providerType || '').toLowerCase();
    const accountType =
        p.account_type || p.accountType ||
        (providerType === 'business' ? 'business' : providerType === 'music' || providerType === 'artist' ? 'artist' : '') ||
        (businessId ? 'business' : artistId ? 'artist' : 'personal');

    return { userId, businessId, artistId, handle, name, avatar, accountType };
}

/* ── Hook ── */
export function useBlockedPostGate({ post, content, user, contentType = 'post' }) {
    const item = content || post;
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());
    const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());
    const [bypassed, setBypassed] = useState(false);
    const [loading, setLoading] = useState(true);
    const fetchedRef = useRef(false);
    const viewerId = user?.id || user?.user_id || null;

    useEffect(() => {
        if (!viewerId) { setLoading(false); return; }
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        let active = true;
        (async () => {
            try {
                const modRes = await secureFetch('/api/users/moderation-state', { credentials: 'include', headers: { Accept: 'application/json' } });
                if (modRes.ok && active) {
                    const data = await modRes.json();
                    const sets = parseBlockedSets(data);
                    if (active) {
                        setBlockedUserIds(sets.blockedUserIds);
                        setBlockedBusinessIds(sets.blockedBusinessIds);
                        setBlockedArtistIds(sets.blockedArtistIds);
                        if (sets.blockedUserIds.size > 0) {
                            const handles = new Set();
                            await Promise.all(Array.from(sets.blockedUserIds).slice(0, 50).map(async (uid) => {
                                try {
                                    const r = await secureFetch(`/api/users/public/${uid}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                                    if (!r.ok) return;
                                    const d = await r.json();
                                    const h = (d?.profile?.handle || d?.handle || '').toLowerCase().trim();
                                    if (h) handles.add(h);
                                } catch {}
                            }));
                            if (active && handles.size > 0) setBlockedHandles(handles);
                        }
                    }
                    const hidden = Array.isArray(data?.hidden_post_ids) ? data.hidden_post_ids : [];
                    const hiddenSet = new Set(hidden.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0));
                    if (active && hiddenSet.size > 0) setHiddenPostIds(hiddenSet);
                }
            } catch {}
            if (active) setLoading(false);
        })();
        return () => { active = false; };
    }, [viewerId]);

    useEffect(() => {
        const handler = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
            const blocked = Boolean(e?.detail?.blocked);
            if (!blocked) setBypassed(false);
        };
        window.addEventListener('ll:user:blocked-changed', handler);
        return () => window.removeEventListener('ll:user:blocked-changed', handler);
    }, []);

    const author = item ? extractContentAuthor(item) : null;
    const postId = Number(item?.id || item?.post_id || 0);
    let reason = null;
    if (!bypassed && author && !loading) {
        // Entity-aware blocking:
        // - If the content is from a business account, only block if that specific
        //   business ID is in blockedBusinessIds — NOT if the underlying personal
        //   user is in blockedUserIds.
        // - Same for artist accounts.
        // - If the content is personal (no businessId/artistId), block if the
        //   user ID is in blockedUserIds.
        const isBusinessContent = author.businessId > 0;
        const isArtistContent = author.artistId > 0;

        let isAuthorBlocked = false;
        if (isBusinessContent) {
            // Business content: only blocked if this specific business is blocked
            isAuthorBlocked = blockedBusinessIds.has(author.businessId);
        } else if (isArtistContent) {
            // Artist content: only blocked if this specific artist is blocked
            isAuthorBlocked = blockedArtistIds.has(author.artistId);
        } else {
            // Personal content: blocked if user ID or handle is blocked
            isAuthorBlocked = (
                (author.userId > 0 && blockedUserIds.has(author.userId)) ||
                (blockedHandles.size > 0 && author.handle && blockedHandles.has(author.handle))
            );
        }

        if (isAuthorBlocked) reason = 'blocked_account';
        if (!reason && postId > 0 && hiddenPostIds.has(postId)) reason = 'hidden_post';
    }

    return {
        gated: reason !== null,
        blocked: reason !== null,
        reason,
        author,
        bypass: useCallback(() => setBypassed(true), []),
        loading,
        contentType,
    };
}

/* ── Gate Component ── */
export default function BlockedPostGate({ gate }) {
    const navigate = useNavigate();
    const { reason, author, bypass, contentType = 'post' } = gate;
    const labels = getLabels(contentType);
    const isBlocked = reason === 'blocked_account';
    const Icon = isBlocked ? BlockIcon : VisibilityOffRoundedIcon;
    const title = isBlocked ? `This ${labels.noun} is from a blocked account` : `You\u2019ve hidden this ${labels.noun}`;
    const description = isBlocked
        ? `You\u2019ve blocked this account. You can still view this ${labels.noun} if you choose.`
        : `You previously hid this ${labels.noun}. You can view it again if you\u2019d like.`;
    const AvatarIcon = author?.accountType === 'business' ? StorefrontRoundedIcon : author?.accountType === 'artist' ? MusicNoteRoundedIcon : PersonRoundedIcon;
    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate('/'); };
    const handleManageSafety = () => { navigate('/social', { state: { socialTab: 'safety' } }); };

    return (
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 6 }}>
            <Box sx={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, textAlign: 'center' }}>
                <Box sx={(t) => ({ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(isBlocked ? t.palette.error.main : t.palette.warning.main, 0.08), border: '1px solid', borderColor: alpha(isBlocked ? t.palette.error.main : t.palette.warning.main, 0.20) })}>
                    <Icon sx={{ fontSize: 40, color: isBlocked ? 'error.main' : 'warning.main' }} />
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.3 }}>{title}</Typography>
                {isBlocked && author?.name && (
                    <Box sx={(t) => ({ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5, borderRadius: 2.5, bgcolor: alpha(t.palette.text.primary, 0.03), border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), width: '100%', maxWidth: 320 })}>
                        <Avatar src={author.avatar || undefined} sx={(t) => ({ width: 40, height: 40, bgcolor: alpha(t.palette.text.primary, 0.08), color: 'text.secondary' })}><AvatarIcon sx={{ fontSize: 22 }} /></Avatar>
                        <Box sx={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 750, fontSize: 14, lineHeight: 1.3 }} noWrap>{author.name}</Typography>
                            {author.handle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }} noWrap>@{author.handle}</Typography>}
                        </Box>
                    </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, maxWidth: 340 }}>{description}</Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                    <Button variant="outlined" startIcon={<ArrowBackRoundedIcon sx={{ fontSize: '18px !important' }} />} onClick={handleGoBack}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3, borderColor: (t) => alpha(t.palette.text.primary, 0.20), color: 'text.primary', '&:hover': { borderColor: 'text.primary', bgcolor: (t) => alpha(t.palette.text.primary, 0.04) } }}>
                        Go Back
                    </Button>
                    <Button variant="contained" startIcon={<VisibilityRoundedIcon sx={{ fontSize: '18px !important' }} />} onClick={bypass}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3 }}>
                        {labels.action}
                    </Button>
                </Stack>
                <Box onClick={handleManageSafety} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, cursor: 'pointer', '&:hover .safety-link-text': { textDecoration: 'underline' } }}>
                    <SettingsRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography className="safety-link-text" variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }}>
                        Manage blocked &amp; hidden accounts
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

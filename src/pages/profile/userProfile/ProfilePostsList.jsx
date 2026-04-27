// src/pages/profile/userProfile/ProfilePostsList.jsx
// Profile feed list that renders the EXACT Community PostCard, with profile-specific overrides:
// - Location line is NOT clickable (no map popup).
// - Category chip is re-homed under the Edit button (keeping the *original* chip styles + icons).
// - Lost posts: "Mark as Found" button appears to the right of the category chip.
// - Infinite render: show 50 initially; when you scroll past the 40th item of the current chunk, load 50 more.
//
// FIX (this patch):
// - Action bar no longer prompts "log in" while logged in.
//   We now pass the logged-in viewer object through to CommunityPostCard (viewer/me/currentUser/etc).
// - Adds a Delete Post button (red) next to Edit Post for the owner.
//   It triggers a global event so the shared DeletePostConfirmDialog can be reused elsewhere.

import React, {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

import { PostCard as CommunityPostCard } from '../../community/PostList';

import UserCardPopover from '../../../components/UserCardPopover';
import SharePostDialog from '../../../components/SharePostDialog';

// Business category labels — matches BusinessPostDetailModal
const BUSINESS_CATEGORY_LABELS = {
    food_drink: 'Food & Drink', shopping_retail: 'Shopping & Retail', automotive: 'Automotive',
    home_services: 'Home Services', home_garden: 'Home & Garden', health_wellness: 'Health & Wellness',
    beauty_personal_care: 'Beauty & Personal Care', fitness_recreation: 'Fitness & Recreation',
    professional_services: 'Professional Services', education_childcare: 'Education & Childcare',
    pets_animals: 'Pets & Animals', travel_lodging: 'Travel & Lodging', arts_entertainment: 'Arts & Entertainment',
    community_nonprofit: 'Community & Nonprofit', technology_repair: 'Technology & Repair', other: 'Other',
};
function getBizCategoryLabel(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return BUSINESS_CATEGORY_LABELS[k] || '';
}


/* ───────────────────────────────────────────
   Category chip re-home helper
   ─────────────────────────────────────────── */

function moveCategoryChipToHost(rootEl, hostEl) {
    if (!rootEl || !hostEl) return;

    hostEl.innerHTML = '';

    const prevHidden = rootEl.querySelectorAll('[data-ll-hidden-category-chip="1"]');
    prevHidden.forEach((chip) => {
        chip.style.display = chip.dataset.llPrevDisplay || '';
        chip.removeAttribute('data-ll-hidden-category-chip');
        delete chip.dataset.llPrevDisplay;
    });

    const chips = Array.from(rootEl.querySelectorAll('.MuiChip-root, [class*="MuiChip-root"]'));
    if (!chips.length) return;

    const rootBox = rootEl.getBoundingClientRect();

    let best = null;
    let bestScore = -Infinity;

    const scoreChip = (chip) => {
        if (!chip || hostEl.contains(chip)) return -Infinity;
        if (chip.getAttribute('data-ll-cloned-category-chip') === '1') return -Infinity;

        const r = chip.getBoundingClientRect();
        const relTop = r.top - rootBox.top;
        const relRight = rootBox.right - r.right;

        const headerPenalty = relTop <= 130 ? 0 : -250;
        const isGroupPostedChip = chip.getAttribute('aria-label') === 'View group' || /posted\s+in/i.test(String(chip.textContent || ''));
        if (isGroupPostedChip) return -Infinity;

        const hasIcon = !!chip.querySelector('svg');

        return (-(relTop * 2) - relRight) + (hasIcon ? 8 : 0) + headerPenalty;
    };

    for (const chip of chips) {
        const s = scoreChip(chip);
        if (s > bestScore) {
            bestScore = s;
            best = chip;
        }
    }

    if (!best || bestScore === -Infinity) return;

    best.dataset.llPrevDisplay = best.style.display || '';
    best.setAttribute('data-ll-hidden-category-chip', '1');
    best.style.display = 'none';

    const clone = best.cloneNode(true);
    clone.style.display = best.dataset.llPrevDisplay || '';
    clone.setAttribute('data-ll-cloned-category-chip', '1');

    clone.style.pointerEvents = 'none';
    clone.style.cursor = 'default';
    clone.style.userSelect = 'none';

    hostEl.appendChild(clone);
}

/* ───────────────────────────────────────────
   Photo extraction — matches PostList.jsx extractPhotos
   ─────────────────────────────────────────── */

function extractMediaUrls(post) {
    if (!post) return [];
    let processed = [];
    const { photos } = post;

    if (Array.isArray(photos)) {
        processed = photos.filter((p) => p && typeof p === 'string' && p !== 'null');
    } else if (typeof photos === 'string' && photos !== 'null' && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) {
                processed = parsed.filter((p) => p && typeof p === 'string' && p !== 'null');
            }
        } catch {
            processed = [photos];
        }
    }

    if (!processed.length) {
        const oneOffs = [
            post.photo_url, post.photo, post.image_url, post.image,
            post.thumbnail, post.main_photo_url, post.cover, post.cover_url,
            post.media_url, post.coverImage, post.cover_image,
        ].filter((u) => typeof u === 'string' && u && u !== 'null').slice(0, 1);
        if (oneOffs.length) processed = oneOffs;
    }

    if (!processed.length && post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            if (Array.isArray(parsed)) processed = parsed.filter((u) => typeof u === 'string' && u);
            else if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null') processed = [post.mediaUrl];
        } catch {
            if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null' && post.mediaUrl.trim()) {
                processed = [post.mediaUrl];
            }
        }
    }
    if (!processed.length && Array.isArray(post.community_photos)) {
        processed = post.community_photos.map((r) => r?.url || r?.photo_url || r?.path || null).filter(Boolean);
    }
    if (!processed.length && typeof post.photos_json === 'string') {
        try {
            const arr = JSON.parse(post.photos_json);
            if (Array.isArray(arr)) processed = arr.filter((u) => typeof u === 'string' && u);
        } catch { /* ignore */ }
    }
    return processed;
}

/* ───────────────────────────────────────────
   PostPhotoGrid — Facebook-style photo grid
   (matches ArtistPostCard rendering)
   ─────────────────────────────────────────── */

function PostPhotoGrid({ mediaUrls }) {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;

    // Clicks bubble up to the parent card row which opens the post detail.
    const imgCell = (url, idx, sx = {}) => (
        <Box
            key={idx}
            sx={{
                position: 'relative', cursor: 'pointer', overflow: 'hidden',

                ...sx,
            }}
        >
            <Box component="img" data-photo-grid src={url} alt="" sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        </Box>
    );

    const overlay = (extra) => (
        <Box sx={{
            position: 'absolute', inset: 0,
            bgcolor: (t) => alpha(t.palette.common.black, 0.55),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
        }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );

    if (count === 1) {
        return (
            <Box data-photo-grid-container sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                <Box sx={{ position: 'relative', cursor: 'pointer',  }}>
                    <Box component="img" data-photo-grid src={mediaUrls[0]} alt="" sx={{
                        width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block',
                        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                </Box>
            </Box>
        );
    }
    if (count === 2) {
        return (
            <Box data-photo-grid-container sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0)}
                {imgCell(mediaUrls[1], 1)}
            </Box>
        );
    }
    if (count === 3) {
        return (
            <Box data-photo-grid-container sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
            </Box>
        );
    }
    if (count === 4) {
        return (
            <Box data-photo-grid-container sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380, md: 440 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridColumn: '1 / 4' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
                {imgCell(mediaUrls[3], 3)}
            </Box>
        );
    }
    const extra = count - 5;
    return (
        <Box data-photo-grid-container sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 }, mt: 1.5 }}>
            {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
            {imgCell(mediaUrls[1], 1)}
            {imgCell(mediaUrls[2], 2)}
            {imgCell(mediaUrls[3], 3)}
            <Box sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' } }}>
                <Box component="img" data-photo-grid src={mediaUrls[4]} alt="" sx={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                    transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                {extra > 0 && overlay(extra)}
            </Box>
        </Box>
    );
}

function PhotoLightbox({ open, onClose, mediaUrls, initialIndex }) {
    const [index, setIndex] = useState(initialIndex || 0);
    useEffect(() => { if (open) setIndex(initialIndex || 0); }, [open, initialIndex]);
    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
                PaperProps={{ sx: { bgcolor: 'common.black', maxHeight: '90vh' } }}>
            <IconButton onClick={onClose}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 1 }}>
                <CloseIcon />
            </IconButton>
            {mediaUrls.length > 1 && (
                <>
                    <IconButton onClick={() => setIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)}
                                sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}>
                        <ChevronLeftRoundedIcon />
                    </IconButton>
                    <IconButton onClick={() => setIndex((prev) => (prev + 1) % mediaUrls.length)}
                                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}>
                        <ChevronRightRoundedIcon />
                    </IconButton>
                </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '80vh' }}>
                <Box component="img" src={mediaUrls[index]} alt=""
                     sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
        </Dialog>
    );
}

/* ───────────────────────────────────────────
   ProfilePostCard
   ─────────────────────────────────────────── */

export const ProfilePostCard = memo(function ProfilePostCard(props) {
    const {
        post,
        user,
        onCardClick,
        onOpenUserCard,
        onOpenShare,
        ...rest
    } = props;

    const rootRef = useRef(null);
    const categoryHostRef = useRef(null);

    const groupObj = post?.group && typeof post.group === 'object' ? post.group : null;
    const isGroupPost = Boolean(
        post?.group_id ??
        post?.groupId ??
        post?.groupID ??
        post?.community_group_id ??
        post?.communityGroupId ??
        post?.group_post_group_id ??
        post?.group_post?.group_id ??
        groupObj?.id ??
        groupObj?.group_id ??
        groupObj?.groupId ??
        null
    );

    const fire = useCallback((type, detail) => {
        try {
            window.dispatchEvent(new CustomEvent(type, { detail }));
        } catch {
            // ignore
        }
    }, []);

    const normHandle = useCallback(
        (h) => String(h || '').replace(/^@/, '').trim().toLowerCase(),
        []
    );

    const isEdited = useMemo(() => {
        const ea = post?.edited_at || post?.editedAt || post?.updated_at || null;
        if (!ea) return false;
        const posted = new Date(post?.posted_at || post?.date_created || post?.created_at || 0).getTime();
        const edited = new Date(ea).getTime();
        return edited && posted && edited > posted + 60 * 1000;
    }, [
        post?.edited_at,
        post?.editedAt,
        post?.updated_at,
        post?.posted_at,
        post?.date_created,
        post?.created_at,
    ]);

    const lostOrFound = String(post?.lost_or_found || '').toLowerCase();
    const resolvedAt = post?.resolved_at || post?.resolvedAt || null;
    const resolvedMessage = post?.resolved_message || post?.resolvedMessage || '';

    const displayPost = useMemo(() => {
        let result = post;

        // For business posts, resolve the category label so CommunityPostCard
        // can show the actual category (e.g. "Pets & Animals") instead of generic "Business"
        const isBizPost = Boolean(
            post?.business_id || post?.businessId || post?.businessPageId ||
            post?.business_page_id || post?.page_id || post?.pageId ||
            post?.businessName || post?.business_name || post?.pageName || post?.page_name
        );
        if (isBizPost) {
            const catKey = String(
                post?.businessCategoryKey || post?.business_category_key ||
                post?.categoryKey || post?.category_key || ''
            ).trim();
            const catLabel = getBizCategoryLabel(catKey)
                || String(post?.businessCategory || post?.business_category ||
                    post?.category_name || post?.categoryLabel || '').trim()
                || 'Business';
            result = {
                ...result,
                postSourceLabel: catLabel,
                businessCategoryLabel: catLabel,
            };
        }

        if (!resolvedAt) return result;

        const baseDesc = String(result?.description || '');
        const updateLine = resolvedMessage
            ? `Update: ${resolvedMessage}`
            : 'Update: Marked as Found by the Owner.';
        const combined = baseDesc ? `${updateLine}\n\n— Original Post —\n${baseDesc}` : updateLine;

        return { ...result, description: combined };
    }, [post, resolvedAt, resolvedMessage]);

    useLayoutEffect(() => {
        if (isGroupPost) return;
        moveCategoryChipToHost(rootRef.current, categoryHostRef.current);
    }, [isGroupPost, post?.id, post?.category, post?.lost_or_found, post?.rec_type]);

    useEffect(() => {
        if (isGroupPost) return undefined;
        const t = setTimeout(() => {
            moveCategoryChipToHost(rootRef.current, categoryHostRef.current);
        }, 0);
        return () => clearTimeout(t);
    }, [isGroupPost, post?.id, post?.category, post?.lost_or_found, post?.rec_type]);

    return (
        <Box ref={rootRef} sx={{ position: 'relative', height: '100%' }}>

            <CommunityPostCard
                {...rest}
                flat
                actionBarVariant="profile"
                forceProfileActionBar
                currentView="profile"
                showTopAccent={false}
                hideMedia
                hidePhotos
                suppressPhotos
                post={displayPost || post}
                viewer={user}
                me={user}
                currentUser={user}
                loggedInUser={user}
                sessionUser={user}
                locationClickable={false}
                onCardClick={onCardClick}
                onOpenUserCard={onOpenUserCard}
                onOpenShare={onOpenShare}
            />
        </Box>
    );
});

ProfilePostCard.displayName = 'ProfilePostCard';

ProfilePostCard.propTypes = {
    post: PropTypes.object,
    user: PropTypes.object,
    hoveredId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setHoveredId: PropTypes.func,
    previewWords: PropTypes.number,
    previewLineClamp: PropTypes.number,
    onCardClick: PropTypes.func,
    onOpenUserCard: PropTypes.func,
    onOpenShare: PropTypes.func,
};

/* ───────────────────────────────────────────
   List chunking
   ─────────────────────────────────────────── */

const CHUNK_SIZE = 50;
const LOAD_MORE_AT = 40;

export default function ProfilePostsList({
                                             user,
                                             posts = [],
                                             loading = false,
                                             hoveredId,
                                             setHoveredId,
                                             onCardClick,
                                             onVisibleCountChange,
                                             emptySubtitle = "",
                                         }) {
    const list = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);

    const [renderCount, setRenderCount] = useState(CHUNK_SIZE);
    useEffect(() => {
        setRenderCount(CHUNK_SIZE);
    }, [list.length]);

    const visibleCount = Math.min(renderCount, list.length);

    useEffect(() => {
        if (typeof onVisibleCountChange === 'function') onVisibleCountChange(visibleCount);
    }, [visibleCount, onVisibleCountChange]);

    const sentinelAfterIndex = Math.max(0, visibleCount - (CHUNK_SIZE - LOAD_MORE_AT));
    const loadMoreRef = useRef(null);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                setRenderCount((c) => Math.min(c + CHUNK_SIZE, list.length));
            },
            { root: null, rootMargin: '600px' }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [list.length, visibleCount]);

    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    const [shareOpen, setShareOpen] = useState(false);
    const [sharePost, setSharePost] = useState(null);

    const handleOpenUserCard = useCallback((el, authorLike) => {
        const id =
            Number(authorLike?.id) ||
            Number(authorLike?.user_id) ||
            (authorLike?.post?.user_id ? Number(authorLike.post.user_id) : undefined);

        setUserAnchor(el);
        setUserForCard({
            id: id || undefined,
            first_name: authorLike?.first_name,
            last_name: authorLike?.last_name,
            handle: authorLike?.handle,
            avatar_url: authorLike?.avatar_url || authorLike?.profile_picture,
        });
    }, []);

    const isSelf =
        !!user &&
        !!userForCard &&
        (Number(user.id) === Number(userForCard.id) ||
            (!!user.handle &&
                !!userForCard.handle &&
                String(user.handle).toLowerCase() === String(userForCard.handle).toLowerCase()));

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: 240,
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                overflowX: 'hidden',
                overflowY: 'visible',
                boxSizing: 'border-box',
            }}
        >
            {loading && visibleCount === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                    Loading…
                </Typography>
            ) : null}

            {/* Injected styles to fully flatten CommunityPostCard's MUI Card.
               MUI sx generates high-specificity emotion classes — a <style> block
               with !important is the only reliable override.
               Scoped to .MuiCard-root[data-post-id] so it ONLY hits post cards,
               not the outer wrapper Card used by ProfileEngagementTabs. */}
            <style>{`
                [data-flat-posts] [data-post-id],
                [data-flat-posts] [data-post-id][class],
                [data-flat-posts] .MuiCard-root[data-post-id],
                [data-flat-posts] .MuiPaper-root[data-post-id],
                [data-flat-posts] .MuiCard-root.MuiCard-root[data-post-id],
                [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-post-id],
                [data-flat-posts] [data-business-post-id],
                [data-flat-posts] .MuiCard-root[data-business-post-id],
                [data-flat-posts] [data-profile-post-id] > .MuiCard-root,
                [data-flat-posts] [data-profile-post-id] > .MuiPaper-root {
                    box-shadow: none !important;
                    border: none !important;
                    border-radius: 0 !important;
                    transform: none !important;
                    transition: none !important;
                    min-height: auto !important;
                    background-image: none !important;
                    background-color: transparent !important;
                    background: transparent !important;
                    overflow: visible !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    outline: none !important;
                }
                [data-flat-posts] [data-post-id]:hover,
                [data-flat-posts] [data-post-id][class]:hover,
                [data-flat-posts] .MuiCard-root[data-post-id]:hover,
                [data-flat-posts] .MuiPaper-root[data-post-id]:hover,
                [data-flat-posts] [data-business-post-id]:hover,
                [data-flat-posts] .MuiCard-root[data-business-post-id]:hover,
                [data-flat-posts] [data-profile-post-id] > .MuiCard-root:hover,
                [data-flat-posts] [data-profile-post-id] > .MuiPaper-root:hover {
                    box-shadow: none !important;
                    transform: none !important;
                    background-color: transparent !important;
                    background: transparent !important;
                }
                [data-flat-posts] [data-post-id]::before,
                [data-flat-posts] [data-post-id]::after,
                [data-flat-posts] [data-business-post-id]::before,
                [data-flat-posts] [data-business-post-id]::after {
                    display: none !important;
                }
                [data-flat-posts] [data-post-id] > .MuiCardActions-root,
                [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                    padding: 0 !important;
                    border: none !important;
                }
                /* Location wrapper: shrink to fit-content so hover only fires on actual text */
                [data-flat-posts] :has(> .post-loc-icon) {
                    width: fit-content !important;
                    max-width: fit-content !important;
                    margin-left: auto !important;
                }
                /* Hide ALL built-in photo/image elements inside post cards so only
                   the custom PostPhotoGrid (marked with data-photo-grid / data-photo-grid-container)
                   is visible.  Exclude avatars (.MuiAvatar-img) and icons (svg). */
                [data-flat-posts] [data-post-id] img:not([data-photo-grid]):not(.MuiAvatar-img),
                [data-flat-posts] [data-profile-post-id] img:not([data-photo-grid]):not(.MuiAvatar-img),
                [data-flat-posts] [data-business-post-id] img:not([data-photo-grid]):not(.MuiAvatar-img) {
                    display: none !important;
                }
                /* Hide the wrapper Box that contains internal card images (but not our grid container) */
                [data-flat-posts] [data-post-id] .MuiBox-root:has(> img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]),
                [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]),
                [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]),
                [data-flat-posts] [data-post-id] .MuiBox-root:has(> .MuiBox-root > img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]),
                [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]),
                [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img:not([data-photo-grid]):not(.MuiAvatar-img)):not([data-photo-grid-container]) {
                    display: none !important;
                }
                /* ── Zero out internal padding on Business/Music cards to match community flat style ── */
                [data-flat-posts] [data-business-post-id] > .MuiBox-root,
                [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiBox-root,
                [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiBox-root {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    padding-top: 0 !important;
                }
                [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiCardActions-root,
                [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiCardActions-root,
                [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    padding-bottom: 0 !important;
                    border-top: none !important;
                    margin-top: 0 !important;
                }
            `}</style>

            <Box
                data-flat-posts="1"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {list.slice(0, visibleCount).map((p, i) => (
                    <React.Fragment key={`${p?.category || 'post'}-${p?.id || i}`}>
                        <Box
                            onClick={() => {
                                // Catch-all: clicking anywhere in the highlighted card row
                                // opens the post. Interactive elements inside (action bar,
                                // user avatar, photos, chips) call stopPropagation() so
                                // this won't fire for those.
                                onCardClick?.(p);
                            }}
                            sx={{
                                width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box',
                                py: 2.5,
                                px: { xs: 2, sm: 3 },
                                borderBottom: '2px solid',
                                borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                '&:last-child': { borderBottom: 'none' },
                                bgcolor: 'transparent',
                                cursor: 'pointer',
                                transition: (t) => t.custom?.motion ? `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}` : 'background-color 180ms ease',
                                overflow: 'hidden',
                                '&:hover': {
                                    bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                                },
                            }}>
                            <ProfilePostCard
                                post={p}
                                user={user}
                                hoveredId={null}
                                setHoveredId={() => {}}
                                previewWords={28}
                                previewLineClamp={4}
                                onCardClick={onCardClick}
                                onOpenUserCard={undefined}
                                onOpenShare={(post0) => {
                                    setSharePost(post0);
                                    setShareOpen(true);
                                }}
                                renderBeforeActions={(() => { const urls = extractMediaUrls(p); return urls.length > 0 ? <PostPhotoGrid mediaUrls={urls} /> : null; })()}
                            />
                        </Box>
                        {i === sentinelAfterIndex - 1 ? <Box ref={loadMoreRef} sx={{ height: 1 }} /> : null}
                    </React.Fragment>
                ))}
            </Box>

            {!loading && list.length === 0 ? (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {emptySubtitle || 'No posts found.'}
                    </Typography>
                </Box>
            ) : null}

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={isSelf}
                following={false}
                onFollow={() => {}}
                onMessage={() =>
                    window.dispatchEvent(
                        new CustomEvent('open-message-center', {
                            detail: { userId: userForCard?.id },
                        })
                    )
                }
                onViewProfile={(u) => window.location.assign(`/${u?.handle || u?.id}`)}
            />

            <SharePostDialog open={shareOpen} onClose={() => setShareOpen(false)} viewer={user} post={sharePost} />
        </Box>
    );
}

ProfilePostsList.propTypes = {
    user: PropTypes.object,
    posts: PropTypes.array,
    loading: PropTypes.bool,
    hoveredId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setHoveredId: PropTypes.func,
    onCardClick: PropTypes.func,
    onVisibleCountChange: PropTypes.func,
};
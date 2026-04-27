import React, { useMemo, useRef, useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    CircularProgress,
    Divider,
    TextField,
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import PublicIcon from '@mui/icons-material/Public';

import ProfilePostsList from '../../../pages/profile/userProfile/ProfilePostsList';
import { secureFetch } from '../../../utils/secureFetch';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';

// ── Shared control styling — matches SearchInput frosted-glass look ──
const RIGHTRAIL_CONTROL_SX = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.secondary',
    },
    '& .MuiSelect-select': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        fontSize: '0.875rem',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
};

/* ──────────────────────────────── styles ──────────────────────────────── */
const sectionBoxSx = {
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    outline: 'none',
    '&:focus': { outline: 'none' },
    '&:focus-visible': { outline: 'none' },
    '&:focus-within': { outline: 'none' },
};

const headerRowSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
    px: 0,
    py: 1.25,
    borderBottom: (t) => `1px solid ${alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.12 : 0.06)}`,
};

const scrollerSx = {
    // On desktop, keep the rail compact by scrolling inside the list area.
    // On mobile, let the page itself scroll naturally.
    overflowY: { xs: 'visible', md: 'auto' },
    overflowX: 'hidden',
    maxHeight: { xs: 'none', md: 'none' },
    scrollbarGutter: 'stable',
    pl: 0,
    pr: 0,
    pt: 0,
    pb: 1.5,
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 0,
    '& > *': { maxWidth: '100%' },
};

// Pretty label
const PRIV_LABEL = { public: 'Public', friends: 'Followers', private: 'Only Me' };
const privText = (v) => PRIV_LABEL[v] || 'Public';

// API base (for dev where React runs on :3000 and API on :4001)
const API_BASE = process.env.REACT_APP_API_URL || '';

// Stable empty defaults — defined OUTSIDE the component to prevent re-creation
// on every render, which would cause infinite useEffect loops.
const STABLE_EMPTY_PRIVACY = {};

/* normalize post (unchanged) */
const normalizePost = (post) => {
    if (!post) return null;

    let photos = [];
    if (post.photos) {
        if (typeof post.photos === 'string') {
            if (post.photos.startsWith('[')) {
                try {
                    const parsed = JSON.parse(post.photos);
                    photos = Array.isArray(parsed)
                        ? parsed.filter((p) => p && typeof p === 'string' && p !== 'null')
                        : [];
                } catch {
                    if (post.photos !== 'null' && post.photos.trim()) photos = [post.photos];
                }
            } else if (post.photos !== 'null' && post.photos.trim()) {
                photos = [post.photos];
            }
        } else if (Array.isArray(post.photos)) {
            photos = post.photos.filter((p) => p && typeof p === 'string' && p !== 'null');
        }
    }

    return {
        ...post,
        photos,
        likesCount: Number(post.likesCount ?? post.likes_count ?? post.like_count ?? post.likes ?? 0),
        commentsCount: Number(
            post.commentsCount ?? post.comments_count ?? post.comment_count ?? post.comments ?? 0
        ),
        repostsCount: Number(
            post.repostsCount ?? post.reposts_count ?? post.repost_count ?? post.reposts ?? 0
        ),
        viewerLiked: Boolean(post.viewerLiked ?? post.viewer_liked ?? post.liked ?? post.is_liked ?? false),
        viewerReposted: Boolean(
            post.viewerReposted ?? post.viewer_reposted ?? post.reposted ?? post.is_reposted ?? false
        ),
    };
};

export default function RightRail({
                                      me,
                                      posts,
                                      onOpenPost,
                                      profile, // full profile object (fallback if profileHandle not provided)
                                      profileHandle, // optional
                                      editMode = false,
                                      onPrivacy, // (e, 'posts'|'reposts'|'likes')
                                      privacy = STABLE_EMPTY_PRIVACY, // { posts, reposts, likes }
                                      useProvidedPosts = false, // when true, use the posts prop as source of truth and skip fetching
                                      isScrollBox = true,
                                      scrollBoxHeight = 680,
                                  }) {
    const [subtype, setSubtype] = useState('all');
    const [sort, setSort] = useState('newest');
    const [postDateFrom, setPostDateFrom] = useState('');
    const [postDateTo, setPostDateTo] = useState('');

    const [autoScrollBoxHeight, setAutoScrollBoxHeight] = useState(scrollBoxHeight);

    const profileKey = useMemo(() => {
        const raw = profileHandle || profile?.handle || profile?.public_id || profile?.id;
        const k = raw != null ? String(raw).trim() : '';
        return k || '';
    }, [profileHandle, profile?.handle, profile?.public_id, profile?.id]);


    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const calc = () => {
            const vh = window.innerHeight || 900;
            // Keep the rail inside the viewport under the fixed header/profile header UI.
            // Clamp to a sane minimum so small windows still show content.
            const h = Math.max(420, vh - 320);
            setAutoScrollBoxHeight((prev) => (prev === h ? prev : h));
        };

        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    const effectiveScrollBoxHeight = Number.isFinite(Number(scrollBoxHeight)) ? Math.min(Number(scrollBoxHeight), autoScrollBoxHeight) : autoScrollBoxHeight;

    const postsScrollRef = useRef(null);
    const railRestoreAppliedRef = useRef('');

    // Persist right-rail inner scroll so returning from PostPage preserves the exact view.
    useEffect(() => {
        if (!profileKey) return undefined;

        const node = postsScrollRef.current;
        if (!node) return undefined;

        const onScroll = () => {
            try {
                sessionStorage.setItem(`ll:profile:${profileKey}:railY`, String(node.scrollTop || 0));
            } catch {
                /* ignore */
            }
        };

        node.addEventListener('scroll', onScroll, { passive: true });
        return () => node.removeEventListener('scroll', onScroll);
    }, [profileKey]);

    // Restore rail scroll when coming back from PostPage (flag set in PostPage).
    useEffect(() => {
        if (!profileKey) {
            railRestoreAppliedRef.current = '';
            return;
        }

        const rawKey = profileKey;
        const norm =
            typeof rawKey === 'string' ? String(rawKey).replace(/^@/, '').trim() : rawKey;

        const candidates = [];
        if (rawKey !== null && rawKey !== undefined && rawKey !== '') candidates.push(rawKey);
        if (typeof rawKey === 'string' && norm && norm !== rawKey) candidates.push(norm);
        if (typeof rawKey === 'string' && norm) candidates.push(`@${norm}`);

        let restoreIntent = false;
        try {
            restoreIntent = candidates.some(
                (k) => sessionStorage.getItem(`ll:profile:${k}:restore`) === '1'
            );
        } catch {
            restoreIntent = false;
        }

        let hasProfileSnapshot = false;
        try {
            hasProfileSnapshot = candidates.some(
                (k) => !!sessionStorage.getItem(`ll:profilePageState:${k}`)
            );
        } catch {
            hasProfileSnapshot = false;
        }

        let isBackForward = false;
        try {
            const navEntry = performance?.getEntriesByType?.('navigation')?.[0];
            isBackForward = navEntry?.type === 'back_forward';
        } catch {
            isBackForward = false;
        }

        const node = postsScrollRef.current;
        if (!node) return;

        let y = 0;
        try {
            y = Number(sessionStorage.getItem(`ll:profile:${profileKey}:railY`) || '0');
        } catch {
            y = 0;
        }

        const shouldRestore = restoreIntent || hasProfileSnapshot || (isBackForward && y > 0);
        if (!shouldRestore) return;

        const restoreKey = `${profileKey}:${y}`;
        if (railRestoreAppliedRef.current === restoreKey) return;
        railRestoreAppliedRef.current = restoreKey;

        let raf1 = 0;
        let raf2 = 0;

        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                try {
                    node.scrollTop = y;
                } catch {
                    /* ignore */
                }

                try {
                    candidates.forEach((k) => {
                        sessionStorage.removeItem(`ll:profile:${k}:restore`);
                    });
                } catch {
                    /* ignore */
                }
            });
        });

        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [profileKey, visiblePosts.length]);
    const scrollToTop = () => {
        if (!postsScrollRef.current) return;
        try {
            postsScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
            // ignore
        }
    };
    const handleSubtypeChange = (val) => {
        setSubtype((prev) => {
            if (prev === val) return prev;
            scrollToTop();
            return val;
        });
    };
    const handleSortChange = (val) => {
        setSort((prev) => {
            if (prev === val) return prev;
            scrollToTop();
            return val;
        });
    };

    const normalizedSubtype = useMemo(() => {
        if (subtype === 'public-safety') return 'public-safety-alerts';
        if (subtype === 'recommendation') return 'recommendations-tips';
        if (subtype === 'volunteer-help') return 'volunteer-requests';
        return subtype;
    }, [subtype]);

    // Determine if the viewer owns this profile (so they can see/change privacy without edit mode)
    const isOwner = useMemo(() => {
        if (!me || !profile) return false;
        return (
            (me.id && profile.id && me.id === profile.id) ||
            (me.handle &&
                profile.handle &&
                String(me.handle).toLowerCase() === String(profile.handle).toLowerCase())
        );
    }, [me, profile]);

    // Determine if viewer follows this profile (for "friends" privacy == Followers)
    const isFollower = useMemo(() => {
        if (!me || !profile) return false;
        if (isOwner) return true;

        try {
            const sjRaw = profile.social_json;
            const sj =
                sjRaw && typeof sjRaw === 'string'
                    ? JSON.parse(sjRaw || '{}')
                    : sjRaw && typeof sjRaw === 'object'
                        ? sjRaw
                        : {};
            const followerIds = Array.isArray(sj?.followers) ? sj.followers : [];
            const myId = Number(me.id);
            return Number.isFinite(myId) && followerIds.some((id) => Number(id) === myId);
        } catch {
            return false;
        }
    }, [me, profile, isOwner]);

    const canViewByPrivacy = (val) => {
        const v = val || 'public';
        if (isOwner) return true;
        if (v === 'private') return false;
        if (v === 'friends') return !!isFollower;
        return true;
    };

    const ownerCanSeePrivacy = editMode || isOwner;

    const [loadingPosts, setLoadingPosts] = useState(true);
    const [rawPosts, setRawPosts] = useState(Array.isArray(posts) ? posts : []);
    const [postsError, setPostsError] = useState(null);

    // Apply in-place updates after an edit/mark-found happens elsewhere on the profile
    useEffect(() => {
        const onUpdated = (e) => {
            const updated = e?.detail?.post;
            if (!updated || !updated.id) return;
            const idNum = Number(updated.id);
            if (!Number.isFinite(idNum)) return;

            const patchList = (prev) =>
                Array.isArray(prev)
                    ? prev.map((p) => (Number(p?.id) === idNum ? { ...p, ...updated } : p))
                    : prev;

            setRawPosts((prev) => patchList(prev));
            setRepostPosts((prev) => patchList(prev));
            setLikedPosts((prev) => patchList(prev));
        };

        const onDeleted = (e) => {
            const idNum = Number(e?.detail?.postId);
            if (!Number.isFinite(idNum)) return;

            const dropFrom = (prev) =>
                Array.isArray(prev) ? prev.filter((p) => Number(p?.id) !== idNum) : prev;

            setRawPosts((prev) => dropFrom(prev));
            setRepostPosts((prev) => dropFrom(prev));
            setLikedPosts((prev) => dropFrom(prev));
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:deleted', onDeleted);
        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
        };
    }, []);

    // Fetch profile posts (includes photos). We refetch on profileKey change unless caller preloaded them.
    useEffect(() => {
        if (useProvidedPosts) {
            setRawPosts(Array.isArray(posts) ? posts : []);
            setLoadingPosts(false);
            return;
        }
        if (!profileKey) {
            setRawPosts(Array.isArray(posts) ? posts : []);
            setLoadingPosts(false);
            return;
        }
        let alive = true;
        const ac = new AbortController();
        (async () => {
            setLoadingPosts(true);
            setPostsError(null);
            try {
                const res = await secureFetch(
                    `${API_BASE}/api/community?user=${encodeURIComponent(profileKey)}&limit=100`,
                    { credentials: 'include', signal: ac.signal }
                );
                const j = await res.json();
                if (!alive) return;
                const arr = Array.isArray(j) ? j : [];
                setRawPosts(arr);
            } catch (err) {
                if (alive) {
                    setPostsError(err);
                    setRawPosts(Array.isArray(posts) ? posts : []);
                }
            } finally {
                if (alive) setLoadingPosts(false);
            }
        })();
        return () => {
            alive = false;
            ac.abort();
        };
    }, [useProvidedPosts, profileKey, posts]);

    const visiblePosts = useMemo(() => {
        let list = rawPosts.slice().map(normalizePost).filter(Boolean);

        if (normalizedSubtype && normalizedSubtype !== 'all') {
            list = list.filter((p) => {
                const cat = String(p?.category || p?.subtype || '').toLowerCase();
                return cat === normalizedSubtype.toLowerCase();
            });
        }

        if (postDateFrom) {
            const from = new Date(postDateFrom);
            from.setHours(0, 0, 0, 0);
            list = list.filter((p) => {
                const d = new Date(p?.posted_at || p?.date_created || 0);
                return d >= from;
            });
        }
        if (postDateTo) {
            const to = new Date(postDateTo);
            to.setHours(23, 59, 59, 999);
            list = list.filter((p) => {
                const d = new Date(p?.posted_at || p?.date_created || 0);
                return d <= to;
            });
        }

        if (sort === 'newest') {
            list.sort(
                (a, b) =>
                    new Date(b?.posted_at || b?.date_created || 0) -
                    new Date(a?.posted_at || a?.date_created || 0)
            );
        } else if (sort === 'popular') {
            list.sort((a, b) => Number(b?.likesCount || 0) - Number(a?.likesCount || 0));
        }

        return list;
    }, [rawPosts, normalizedSubtype, sort, postDateFrom, postDateTo]);

    // Likes/Reposts
    const [loadingRL, setLoadingRL] = useState(false);
    const [repostPosts, setRepostPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);

    useEffect(() => {
        if (!profileKey) {
            setRepostPosts([]);
            setLikedPosts([]);
            return;
        }
        let alive = true;
        const ac = new AbortController();
        (async () => {
            setLoadingRL(true);
            try {
                const res = await secureFetch(
                    `${API_BASE}/users/${encodeURIComponent(profileKey)}/engagement/posts`,
                    { credentials: 'include', signal: ac.signal }
                );
                const j = await res.json();
                if (!alive) return;
                const mapN = (arr) => (Array.isArray(arr) ? arr.map(normalizePost).filter(Boolean) : []);
                setRepostPosts(mapN(j?.reposts));
                setLikedPosts(mapN(j?.likes));
            } catch {
                if (alive) {
                    setRepostPosts([]);
                    setLikedPosts([]);
                }
            } finally {
                if (alive) setLoadingRL(false);
            }
        })();
        return () => {
            alive = false;
            ac.abort();
        };
    }, [profileKey]);

    // Expand handler — tells UserProfilePage to open the large overlay grid
    const expandToOverlay = () => {
        window.dispatchEvent(new CustomEvent('profile-posts-expand', { detail: { tabIndex: 0, category: subtype === 'all' ? '' : subtype, sort } }));
    };

    const canViewReposts = canViewByPrivacy(privacy?.reposts || 'public');
    const canViewLikes = canViewByPrivacy(privacy?.likes || 'public');

    const cannotViewText = (val) => {
        const v = val || 'public';
        if (v === 'private') return 'This section is visible to you only.';
        return 'This section is visible to followers.';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', minWidth: 0 }}>
            {/* Community Posts */}
            <Box sx={sectionBoxSx}>
                <Box sx={headerRowSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Community Posts
                        </Typography>
                        {ownerCanSeePrivacy && (
                            <>
                                <Tooltip title="Privacy">
                                    <IconButton size="small" onClick={(e) => onPrivacy?.(e, 'posts')}>
                                        <PublicIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary">
                                    ({privText(privacy.posts)})
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Expand">
                            <IconButton size="small" onClick={expandToOverlay} aria-label="Expand">
                                <OpenInFullIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Filter bar */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, px: 0, py: 1.5, borderBottom: (t) => `1px solid ${alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.12 : 0.06)}` }}>
                    <FormControl size="small" sx={{ minWidth: 140, ...RIGHTRAIL_CONTROL_SX }}>
                        <InputLabel id="subtype-label">Category</InputLabel>
                        <Select
                            labelId="subtype-label"
                            label="Category"
                            value={subtype}
                            onChange={(e) => handleSubtypeChange(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="lost-and-found">Lost &amp; Found</MenuItem>
                            <MenuItem value="public-safety">Public Safety</MenuItem>
                            <MenuItem value="announcement">Announcements</MenuItem>
                            <MenuItem value="recommendation">Recommendations</MenuItem>
                            <MenuItem value="volunteer-help">Volunteer</MenuItem>
                            <MenuItem value="community-chat">Discussion</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120, ...RIGHTRAIL_CONTROL_SX }}>
                        <InputLabel id="sort-label">Sort</InputLabel>
                        <Select
                            labelId="sort-label"
                            label="Sort"
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                        >
                            <MenuItem value="newest">Newest</MenuItem>
                            <MenuItem value="popular">Popular</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="From"
                        type="date"
                        value={postDateFrom}
                        onChange={(e) => setPostDateFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 130, ...RIGHTRAIL_CONTROL_SX }}
                    />
                    <TextField
                        size="small"
                        label="To"
                        type="date"
                        value={postDateTo}
                        onChange={(e) => setPostDateTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 130, ...RIGHTRAIL_CONTROL_SX }}
                    />
                </Box>

                {/* IMPORTANT: add marker for save/restore logic */}
                <Box
                    ref={postsScrollRef}
                    sx={{
                        ...scrollerSx,
                        ...(isScrollBox
                            ? { maxHeight: { xs: 'none', md: effectiveScrollBoxHeight }, overflowY: { xs: 'visible', md: 'auto' } }
                            : { overflowY: 'visible' }),
                    }}
                    data-profile-posts-scroll
                    className="profile-posts-scroller"
                >
                    {isNetworkError(postsError) && visiblePosts.length === 0 ? (
                        <NetworkErrorState
                            message="The Local Lantern is currently offline. Posts couldn't be loaded."
                        />
                    ) : (
                        <ProfilePostsList
                            user={me}
                            posts={visiblePosts}
                            loading={loadingPosts}
                            onCardClick={onOpenPost}
                        />
                    )}
                </Box>

            </Box>

            {/* Reposts */}
            <Box sx={sectionBoxSx}>
                <Box sx={headerRowSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Reposts
                        </Typography>
                        {ownerCanSeePrivacy && (
                            <>
                                <Tooltip title="Privacy">
                                    <IconButton size="small" onClick={(e) => onPrivacy?.(e, 'reposts')}>
                                        <PublicIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary">
                                    ({privText(privacy.reposts)})
                                </Typography>
                            </>
                        )}
                    </Box>
                    {loadingRL ? <CircularProgress size={18} /> : null}
                </Box>
                <Divider />
                <Box
                    sx={{
                        ...scrollerSx,
                        ...(isScrollBox
                            ? { maxHeight: { xs: 'none', md: effectiveScrollBoxHeight }, overflowY: { xs: 'visible', md: 'auto' } }
                            : { overflowY: 'visible' }),
                    }}
                >
                    {canViewReposts ? (
                        repostPosts?.length ? (
                            <ProfilePostsList
                                user={me}
                                posts={repostPosts}
                                onCardClick={onOpenPost}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No reposts yet.
                            </Typography>
                        )
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            {cannotViewText(privacy?.reposts)}
                        </Typography>
                    )}
                </Box>

            </Box>

            {/* Likes */}
            <Box sx={sectionBoxSx}>
                <Box sx={headerRowSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Likes
                        </Typography>
                        {ownerCanSeePrivacy && (
                            <>
                                <Tooltip title="Privacy">
                                    <IconButton size="small" onClick={(e) => onPrivacy?.(e, 'likes')}>
                                        <PublicIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary">
                                    ({privText(privacy.likes)})
                                </Typography>
                            </>
                        )}
                    </Box>
                    {loadingRL ? <CircularProgress size={18} /> : null}
                </Box>
                <Divider />
                <Box
                    sx={{
                        ...scrollerSx,
                        ...(isScrollBox
                            ? { maxHeight: { xs: 'none', md: effectiveScrollBoxHeight }, overflowY: { xs: 'visible', md: 'auto' } }
                            : { overflowY: 'visible' }),
                    }}
                >
                    {canViewLikes ? (
                        likedPosts?.length ? (
                            <ProfilePostsList
                                user={me}
                                posts={likedPosts}
                                onCardClick={onOpenPost}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No likes yet.
                            </Typography>
                        )
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            {cannotViewText(privacy?.likes)}
                        </Typography>
                    )}
                </Box>

            </Box>
        </Box>
    );
}
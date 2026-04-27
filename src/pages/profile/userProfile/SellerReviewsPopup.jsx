// src/pages/profile/userProfile/SellerReviewsPopup.jsx
// Self-contained dialog that shows a seller's full review info.
// Used when clicking a marketplace review from the Reviews tab so the
// user stays on the current page instead of navigating away.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import { alpha } from '@mui/material/styles';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Stack, Typography, Avatar, IconButton,
    Rating, Chip, CircularProgress,
    useTheme, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';

export default function SellerReviewsPopup({ open, onClose, sellerId, highlightReviewId, highlightReviewerId }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [seller, setSeller] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avgRating: null, totalCount: 0 });
    const [sellerStats, setSellerStats] = useState({ totalListings: 0, soldListings: 0, activeListings: 0 });

    // Review photo lightbox
    const [rvLbPhotos, setRvLbPhotos] = useState([]);
    const [rvLbIndex, setRvLbIndex] = useState(0);
    const [rvLbOpen, setRvLbOpen] = useState(false);
    const openReviewPhotoLightbox = (photos, index) => {
        setRvLbPhotos(photos);
        setRvLbIndex(index);
        setRvLbOpen(true);
    };

    useEffect(() => {
        if (!open || !sellerId) return;
        let alive = true;
        setLoading(true);
        (async () => {
            try {
                const [sellerRes, reviewsRes] = await Promise.all([
                    axios.get(`/api/users/public/${sellerId}`, { withCredentials: true }).catch(() => null),
                    axios.get(`/api/marketplace/sellers/${sellerId}/reviews`, { params: { limit: 50 }, withCredentials: true }).catch(() => null),
                ]);
                if (!alive) return;
                const u = sellerRes?.data?.profile || sellerRes?.data?.user || sellerRes?.data || null;
                setSeller(u);
                setReviews(Array.isArray(reviewsRes?.data?.reviews) ? reviewsRes.data.reviews : []);
                setStats({ avgRating: reviewsRes?.data?.avgRating ?? null, totalCount: reviewsRes?.data?.totalCount ?? 0 });
                const ss = reviewsRes?.data?.sellerStats;
                if (ss) setSellerStats({ totalListings: Number(ss.totalListings || 0), soldListings: Number(ss.soldListings || 0), activeListings: Number(ss.activeListings || 0) });
            } catch {
                if (alive) { setSeller(null); setReviews([]); }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [open, sellerId]);

    // Boost highlighted review to the top of the list so the user sees it immediately
    const sortedReviews = useMemo(() => {
        if (!highlightReviewId && !highlightReviewerId) return reviews;
        const idx = reviews.findIndex((r) => {
            if (highlightReviewId && Number(r.id) === Number(highlightReviewId)) return true;
            if (highlightReviewerId) {
                const rid = r.reviewer_id || r.reviewer?.id;
                if (rid && Number(rid) === Number(highlightReviewerId)) return true;
            }
            return false;
        });
        if (idx <= 0) return reviews; // already first or not found
        const copy = [...reviews];
        const [target] = copy.splice(idx, 1);
        copy.unshift(target);
        return copy;
    }, [reviews, highlightReviewId, highlightReviewerId]);

    // Persistent highlight: stays until the review is visible, then fades
    const [hlDismissed, setHlDismissed] = useState(false);
    const hlObserverRef = useRef(null);

    useEffect(() => {
        setHlDismissed(false);
        if (hlObserverRef.current) { hlObserverRef.current.disconnect(); hlObserverRef.current = null; }
    }, [highlightReviewId, highlightReviewerId]);

    useEffect(() => {
        if (hlDismissed || (!highlightReviewId && !highlightReviewerId) || loading || reviews.length === 0) return;
        const timer = setTimeout(() => {
            let el = highlightReviewId ? document.querySelector(`[data-seller-popup-review-id="${highlightReviewId}"]`) : null;
            if (!el && highlightReviewerId) {
                const allRevs = document.querySelectorAll('[data-seller-popup-review-id]');
                for (const r of allRevs) {
                    if (r.getAttribute('data-seller-popup-reviewer-id') === String(highlightReviewerId)) { el = r; break; }
                }
            }
            if (el) {
                if (hlObserverRef.current) hlObserverRef.current.disconnect();
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        hlObserverRef.current = null;
                        setTimeout(() => setHlDismissed(true), 1800);
                    }
                }, { threshold: 0.3 });
                observer.observe(el);
                hlObserverRef.current = observer;
            }
        }, 200);
        return () => { clearTimeout(timer); if (hlObserverRef.current) { hlObserverRef.current.disconnect(); hlObserverRef.current = null; } };
    }, [highlightReviewId, highlightReviewerId, loading, reviews.length, hlDismissed]);

    const sellerName = seller ? [seller.first_name, seller.last_name].filter(Boolean).join(' ') || seller.handle || 'Seller' : 'Seller';
    const sellerAvatar = seller?.profile_picture || seller?.avatar_url || '';
    const sellerHandle = seller?.handle || '';

    // Mobile detection — match the 900px breakpoint used by isDesktopLayout in UserProfilePage
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    // Rating breakdown
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { const s = Math.round(Number(r.rating) || 0); if (s >= 1 && s <= 5) ratingCounts[s]++; });
    const maxCount = Math.max(1, ...Object.values(ratingCounts));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                fullScreen={!isDesktop}
                disableScrollLock
                PaperProps={{ sx: {
                        borderRadius: !isDesktop ? 0 : 3,
                        maxHeight: !isDesktop ? '100%' : '88vh',
                        height: !isDesktop ? '100%' : 'auto',
                        width: !isDesktop ? '100%' : undefined,
                    } }}
                slotProps={{ backdrop: { sx: { bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: 'blur(4px)' } } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1rem' }}>Seller Reviews</Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pb: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                ) : (
                    <>
                        {/* ── Seller card ── */}
                        <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), mb: 1.5 })}>
                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                <Avatar src={sellerAvatar || undefined} alt={sellerName}
                                        sx={(t) => ({ width: 48, height: 48, border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, cursor: 'pointer' })}
                                        onClick={() => { if (sellerHandle) { onClose(); navigate(`/${sellerHandle}`); } }}>
                                    <PersonRoundedIcon sx={{ fontSize: 26 }} />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 14, cursor: sellerHandle ? 'pointer' : 'default', '&:hover': sellerHandle ? { textDecoration: 'underline' } : {} }}
                                                onClick={() => { if (sellerHandle) { onClose(); navigate(`/${sellerHandle}`); } }}>
                                        {sellerName}
                                    </Typography>
                                    {sellerHandle && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>@{sellerHandle}</Typography>}
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                        {stats.avgRating !== null ? (
                                            <>
                                                <Rating value={stats.avgRating} precision={0.1} readOnly size="small"
                                                        icon={<StarRoundedIcon sx={{ fontSize: 14 }} />} emptyIcon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                        sx={{ '& .MuiRating-icon': { fontSize: 14 } }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11 }}>{stats.avgRating}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>({stats.totalCount})</Typography>
                                            </>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>No reviews yet</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>

                        {/* ── Listing stats badges ── */}
                        {(sellerStats.totalListings > 0 || sellerStats.soldListings > 0 || sellerStats.activeListings > 0) && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, mb: 1.5 }}>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.12), bgcolor: alpha(t.palette.primary.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'primary.main', lineHeight: 1.2 }}>{sellerStats.totalListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Listings</Typography>
                                </Box>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.success.main, 0.12), bgcolor: alpha(t.palette.success.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'success.main', lineHeight: 1.2 }}>{sellerStats.soldListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sold</Typography>
                                </Box>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.info.main, 0.12), bgcolor: alpha(t.palette.info.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'info.main', lineHeight: 1.2 }}>{sellerStats.activeListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Active</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ── Reviews header ── */}
                        <Typography sx={{ fontWeight: 900, fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
                            Seller Reviews {stats.totalCount > 0 ? `(${stats.totalCount})` : ''}
                        </Typography>

                        {/* ── Rating breakdown histogram ── */}
                        {reviews.length > 0 && stats.avgRating !== null && (
                            <Box sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box sx={{ textAlign: 'center', minWidth: 72 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>
                                            {(stats.avgRating || 0).toFixed(1)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
                                            <Rating value={stats.avgRating || 0} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 14 } }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, mt: 0.25 }}>
                                            {stats.totalCount} review{stats.totalCount !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, width: 10, textAlign: 'right' }}>{star}</Typography>
                                                <Rating value={1} max={1} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 12 } }} />
                                                <Box sx={(t) => ({ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(t.palette.divider, 0.3), overflow: 'hidden' })}>
                                                    <Box sx={{ width: `${(ratingCounts[star] / maxCount) * 100}%`, height: '100%', borderRadius: 4, bgcolor: 'secondary.main', transition: 'width 400ms ease' }} />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary', width: 20, textAlign: 'right' }}>{ratingCounts[star]}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* ── Review cards ── */}
                        {sortedReviews.length > 0 ? (
                            <Stack spacing={0}>
                                {sortedReviews.map((rev, idx) => {
                                    const revName = rev.reviewer_name || rev.reviewer?.name || [rev.reviewer_first_name, rev.reviewer_last_name].filter(Boolean).join(' ') || 'User';
                                    const revHandle = rev.reviewer_handle || rev.reviewer?.handle || '';
                                    const revAvatar = rev.reviewer_avatar || rev.reviewer?.avatarUrl || '';
                                    const revDate = rev.created_at || rev.createdAt;
                                    const revDateStr = revDate ? (() => {
                                        const d = new Date(revDate);
                                        if (Number.isNaN(d.getTime())) return '';
                                        const diffMs = Date.now() - d.getTime();
                                        const diffH = Math.floor(diffMs / 3600000);
                                        if (diffH < 1) return 'Just now';
                                        if (diffH < 24) return `${diffH}h ago`;
                                        const diffD = Math.floor(diffH / 24);
                                        if (diffD < 7) return `${diffD}d ago`;
                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })() : '';
                                    const revReviewerId = rev.reviewer_id || rev.reviewer?.id;
                                    const isHl = !hlDismissed && ((highlightReviewId && Number(rev.id) === Number(highlightReviewId)) ||
                                        (highlightReviewerId && revReviewerId && Number(revReviewerId) === Number(highlightReviewerId)));
                                    const revPhotos = rev.photo_urls || rev.photoUrls || [];

                                    return (
                                        <Box key={rev.id || idx} data-seller-popup-review-id={rev.id} data-seller-popup-reviewer-id={revReviewerId || ''}
                                             sx={(t) => {
                                                 const brass = t.custom?.brand?.brass || '#A87822';
                                                 return {
                                                     py: isHl ? 2 : 1.5,
                                                     px: isHl ? 1.5 : 0,
                                                     ...(isHl ? {
                                                         borderRadius: 2.5,
                                                         border: '2px solid',
                                                         borderColor: `${alpha(brass, 0.45)} !important`,
                                                         bgcolor: alpha(brass, 0.06),
                                                         boxShadow: `0 0 16px ${alpha(brass, 0.15)}`,
                                                         my: 1,
                                                     } : {
                                                         borderBottom: idx < sortedReviews.length - 1 ? '1px solid' : 'none',
                                                         borderColor: alpha(t.palette.divider, 0.5),
                                                     }),
                                                 };
                                             }}>
                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                <Avatar src={revAvatar || undefined} alt={revName}
                                                        sx={(t) => ({ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                                    <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{revName}</Typography>
                                                    {revHandle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>@{revHandle}</Typography>}
                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                                        <Rating value={Number(rev.rating) || 0} readOnly size="small"
                                                                icon={<StarRoundedIcon sx={{ fontSize: 15 }} />} emptyIcon={<StarRoundedIcon sx={{ fontSize: 15 }} />}
                                                                sx={{ '& .MuiRating-icon': { fontSize: 15 } }} />
                                                        {revDateStr && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{revDateStr}</Typography>}
                                                    </Stack>
                                                    {(rev.comment || rev.body) && (
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                                            {rev.comment || rev.body}
                                                        </Typography>
                                                    )}
                                                    {/* Review photos */}
                                                    {revPhotos.length > 0 && (
                                                        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, overflow: 'hidden' }}>
                                                            {revPhotos.slice(0, 4).map((url, pi) => (
                                                                <Box key={pi} onClick={() => openReviewPhotoLightbox(revPhotos, pi)}
                                                                     sx={{ position: 'relative', width: 64, height: 64, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 } }}>
                                                                    <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                                                         sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 200ms ease' }} />
                                                                    <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                        <Typography sx={{ color: 'common.white', fontSize: 18, fontWeight: 700 }}>⌕</Typography>
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                    {/* Listing reference */}
                                                    {rev.listingTitle && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 11, fontStyle: 'italic' }}>
                                                            Re: {rev.listingTitle}
                                                        </Typography>
                                                    )}
                                                    {/* Seller reply */}
                                                    {(rev.seller_reply || rev.sellerReply) && (() => {
                                                        const rpName = rev.reply_by_name || sellerName;
                                                        const rpHandle = rev.reply_by_handle || sellerHandle;
                                                        const rpAvatar = rev.reply_by_avatar || sellerAvatar;
                                                        const rpPhotos = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
                                                        return (
                                                            <Box sx={(t) => ({ mt: 1.5, ml: 1, pl: 1.5, py: 1, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                                                                    <Avatar src={rpAvatar || undefined} sx={(t) => ({ width: 28, height: 28, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, mt: 0.1, flexShrink: 0 })}>
                                                                        <PersonRoundedIcon sx={{ fontSize: 15 }} />
                                                                    </Avatar>
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 11.5, color: 'primary.dark', lineHeight: 1.3 }}>{rpName}</Typography>
                                                                            <Chip label="Seller" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, bgcolor: 'primary.main', color: 'common.white', '& .MuiChip-label': { px: 0.6 } }} />
                                                                        </Stack>
                                                                        {rpHandle && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.2, display: 'block' }}>@{rpHandle}</Typography>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                                <Typography variant="body2" sx={{ fontSize: 12.5, lineHeight: 1.45, color: 'text.secondary', pl: 4.5 }}>
                                                                    {rev.seller_reply || rev.sellerReply}
                                                                </Typography>
                                                                {rpPhotos.length > 0 && (
                                                                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, pl: 4.5, overflowX: 'auto', pb: 0.5 }}>
                                                                        {rpPhotos.map((url, ri) => (
                                                                            <Box key={ri} onClick={() => openReviewPhotoLightbox(rpPhotos, ri)}
                                                                                 sx={{ position: 'relative', width: 64, height: 64, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 } }}>
                                                                                <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                                                                     sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms ease' }} />
                                                                                <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                                    <Typography sx={{ color: 'common.white', fontSize: 18, fontWeight: 700 }}>⌕</Typography>
                                                                                </Box>
                                                                            </Box>
                                                                        ))}
                                                                    </Stack>
                                                                )}
                                                            </Box>
                                                        );
                                                    })()}
                                                </Box>
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <ReviewsRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>No reviews yet.</Typography>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            {/* Review photo lightbox */}
            <Dialog
                open={rvLbOpen}
                onClose={() => setRvLbOpen(false)}
                maxWidth={false}
                fullScreen={!isDesktop}
                disableScrollLock
                sx={{ zIndex: 1500 }}
                PaperProps={{
                    sx: !isDesktop
                        ? {
                            bgcolor: '#000',
                            m: 0, borderRadius: 0,
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        }
                        : {
                            bgcolor: 'rgba(0,0,0,0.92)',
                            borderRadius: 3,
                            maxWidth: '90vw', maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        },
                }}
            >
                <IconButton
                    onClick={() => setRvLbOpen(false)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                >
                    <CloseIcon />
                </IconButton>
                {rvLbPhotos.length > 1 && (
                    <Typography sx={{
                        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2,
                    }}>
                        {rvLbIndex + 1} / {rvLbPhotos.length}
                    </Typography>
                )}
                {rvLbPhotos[rvLbIndex] && (
                    <Box component="img" src={rvLbPhotos[rvLbIndex]} alt="" referrerPolicy="no-referrer"
                         sx={{ maxWidth: !isDesktop ? '100vw' : '85vw', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }} />
                )}
                {rvLbPhotos.length > 1 && (
                    <>
                        <IconButton
                            onClick={() => setRvLbIndex((p) => (p - 1 + rvLbPhotos.length) % rvLbPhotos.length)}
                            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        >
                            ‹
                        </IconButton>
                        <IconButton
                            onClick={() => setRvLbIndex((p) => (p + 1) % rvLbPhotos.length)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        >
                            ›
                        </IconButton>
                    </>
                )}
            </Dialog>
        </Dialog>
    );
}

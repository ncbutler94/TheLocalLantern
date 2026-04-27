import React from 'react';
import { Alert, Box, Button, IconButton, Typography } from '@mui/material';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';

const DEFAULT_MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function makeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ─── tiny hook: true when viewport ≤ 600 px (MUI xs breakpoint) ─── */
function useIsMobile(breakpoint = 600) {
    const [mobile, setMobile] = React.useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );
    React.useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e) => setMobile(e.matches);
        // Modern browsers
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else mq.addListener(handler); // Safari 13
        setMobile(mq.matches);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', handler);
            else mq.removeListener(handler);
        };
    }, [breakpoint]);
    return mobile;
}

export default function PhotosUploadSection({
                                                photos,
                                                setPhotos,
                                                disabled = false,
                                                maxPhotos = DEFAULT_MAX_PHOTOS,
                                                title = 'Photos',
                                                helperText = 'Add photos to make your profile stand out. You can create updates and events after publishing.',
                                                addButtonText = 'Add photos',
                                                hideTitle = false,
                                            }) {
    const fileInputRef = React.useRef(null);
    const [photoError, setPhotoError] = React.useState('');
    const [isDropActive, setIsDropActive] = React.useState(false);
    const isMobile = useIsMobile();

    /* ─── touch reorder state (mobile only) ─── */
    const [touchDragIdx, setTouchDragIdx] = React.useState(null);

    // Note: Image moderation (NSFW scan) runs server-side on submit.
    // We do NOT pre-scan here — it was duplicating the work, making each
    // photo selection require a network round-trip + model inference before
    // the thumbnail appeared. Photos now attach instantly; the server
    // rejects unsafe images when the post is submitted, and the error is
    // surfaced via fieldErrors.photos in the parent form.

    const dragIndexRef = React.useRef(null);
    const isReorderingRef = React.useRef(false);

    const safePhotos = Array.isArray(photos) ? photos : [];
    const maxSlots = Math.max(1, Number(maxPhotos) || DEFAULT_MAX_PHOTOS);
    const remainingCount = maxSlots - safePhotos.length;

    const addFiles = React.useCallback(
        (fileList) => {
            const all = Array.from(fileList || []);
            const incoming = [];
            let rejected = false;

            all.forEach((f) => {
                if (!f) return;
                const type = String(f?.type || '').toLowerCase();
                if (!ALLOWED_IMAGE_TYPES.has(type)) {
                    rejected = true;
                    return;
                }
                if (Number(f?.size || 0) > MAX_PHOTO_BYTES) {
                    rejected = true;
                    return;
                }
                incoming.push(f);
            });

            if (rejected) setPhotoError('Some images were skipped. Only JPG, PNG, or WEBP images up to 10MB are allowed.');
            else setPhotoError('');

            if (!incoming.length) return;

            setPhotos((prev) => {
                const current = Array.isArray(prev) ? prev : [];
                const room = maxSlots - current.length;
                if (room <= 0) return current;

                const slice = incoming.slice(0, room);
                const next = [...current];

                slice.forEach((file) => {
                    const url = URL.createObjectURL(file);
                    next.push({ id: makeId(), file, url });
                });

                return next;
            });
        },
        [maxSlots, setPhotos]
    );

    const handleBrowseClick = React.useCallback(() => {
        if (disabled) return;
        if (remainingCount <= 0) return;
        if (fileInputRef.current) fileInputRef.current.click();
    }, [disabled, remainingCount]);

    const handleFileChange = React.useCallback(
        (e) => {
            if (disabled) return;
            addFiles(e.target.files);
            e.target.value = '';
        },
        [addFiles, disabled]
    );

    const removePhoto = React.useCallback(
        (idx) => {
            setPhotos((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (idx < 0 || idx >= arr.length) return arr;

                const toRemove = arr[idx];
                if (toRemove?.url) {
                    try {
                        URL.revokeObjectURL(toRemove.url);
                    } catch {
                        // ignore
                    }
                }

                return arr.filter((_, i) => i !== idx);
            });
        },
        [setPhotos]
    );

    const movePhoto = React.useCallback(
        (from, to) => {
            setPhotos((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (from === to) return arr;
                if (from < 0 || from >= arr.length) return arr;
                if (to < 0 || to >= arr.length) return arr;

                const next = [...arr];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        },
        [setPhotos]
    );

    /* ─── Desktop drag-and-drop (unchanged) ─── */
    const onThumbDragStart = React.useCallback(
        (idx) => {
            if (disabled) return;
            if (idx < 0 || idx >= safePhotos.length) return;
            dragIndexRef.current = idx;
            isReorderingRef.current = true;
        },
        [disabled, safePhotos.length]
    );

    const onThumbDragEnd = React.useCallback(() => {
        dragIndexRef.current = null;
        isReorderingRef.current = false;
        setIsDropActive(false);
    }, []);

    const onThumbDrop = React.useCallback(
        (e, idx) => {
            e.preventDefault();
            e.stopPropagation();

            if (idx < 0 || idx >= safePhotos.length) {
                dragIndexRef.current = null;
                isReorderingRef.current = false;
                setIsDropActive(false);
                return;
            }

            const from = dragIndexRef.current;
            dragIndexRef.current = null;
            isReorderingRef.current = false;
            setIsDropActive(false);

            if (typeof from !== 'number') return;
            movePhoto(from, idx);
        },
        [movePhoto, safePhotos.length]
    );

    const onDropZoneDragOver = React.useCallback(
        (e) => {
            e.preventDefault();
            if (isReorderingRef.current) return;
            if (disabled || remainingCount <= 0) return;
            if (!isDropActive) setIsDropActive(true);
        },
        [disabled, remainingCount, isDropActive]
    );

    const onDropZoneDragLeave = React.useCallback(() => {
        if (isReorderingRef.current) return;
        setIsDropActive(false);
    }, []);

    const onDropZoneDrop = React.useCallback(
        (e) => {
            e.preventDefault();

            if (isReorderingRef.current) {
                dragIndexRef.current = null;
                isReorderingRef.current = false;
                setIsDropActive(false);
                return;
            }

            setIsDropActive(false);
            if (disabled) return;
            addFiles(e.dataTransfer.files);
        },
        [addFiles, disabled]
    );

    /* ═══════════════════════════════════════════════════════════════
       MOBILE LAYOUT
       ─ Horizontal scroll carousel with large cards
       ─ Big tap target for adding photos
       ─ Prominent delete / reorder controls
       ═══════════════════════════════════════════════════════════════ */
    if (isMobile) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 3 }}>
                {/* Header */}
                {!hideTitle && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: 1 }}>
                            <PhotoLibraryOutlinedIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                    {title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                    {helperText}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                <input ref={fileInputRef} hidden accept="image/jpeg,image/png,image/webp" type="file" multiple onChange={handleFileChange} />

                {photoError ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        {photoError}
                    </Alert>
                ) : null}

                {/* Counter */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                        {safePhotos.length === 0 ? 'No photos yet' : `${safePhotos.length} of ${maxSlots} photos`}
                    </Typography>
                    {safePhotos.length > 1 && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                            Swipe to see all • use arrows to reorder
                        </Typography>
                    )}
                </Box>

                {/* ── No photos: large add-photo card ── */}
                {safePhotos.length === 0 && (
                    <Box
                        onClick={handleBrowseClick}
                        sx={{
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            py: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            bgcolor: 'action.hover',
                            cursor: disabled ? 'default' : 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'background-color 150ms',
                            '&:active': { bgcolor: 'action.selected' },
                        }}
                    >
                        <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 44, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {'Tap to add photos'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            JPG, PNG, or WEBP • up to 10 MB
                        </Typography>
                    </Box>
                )}

                {/* ── Photos: horizontal scroll carousel ── */}
                {safePhotos.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.25,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            pb: 1,
                            mx: -2,
                            px: 2,
                            /* hide scrollbar on mobile for cleaner look */
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none',
                        }}
                    >
                        {safePhotos.map((p, idx) => (
                            <Box
                                key={p.id}
                                sx={{
                                    position: 'relative',
                                    flex: '0 0 72%',
                                    maxWidth: 280,
                                    aspectRatio: '4 / 5',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: touchDragIdx === idx ? 'primary.main' : 'divider',
                                    scrollSnapAlign: 'center',
                                    boxShadow: touchDragIdx === idx ? 4 : 1,
                                    bgcolor: 'background.paper',
                                    transition: 'box-shadow 200ms, border-color 200ms',
                                }}
                            >
                                <img
                                    src={p.url}
                                    alt={`Photo ${idx + 1} preview`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    draggable={false}
                                />

                                {/* Cover badge */}
                                {idx === 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            left: 10,
                                            px: 1,
                                            py: 0.35,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(0,0,0,0.65)',
                                            color: 'white',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.04em',
                                            lineHeight: 1.3,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Cover
                                    </Box>
                                )}

                                {/* ── Bottom action bar ── */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        px: 1.25,
                                        py: 1,
                                        background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
                                    }}
                                >
                                    {/* Reorder arrows */}
                                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                movePhoto(idx, idx - 1);
                                            }}
                                            disabled={disabled || idx === 0}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(8px)',
                                                color: 'white',
                                                '&:active': { bgcolor: 'rgba(255,255,255,0.35)' },
                                                '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                                            }}
                                            aria-label="Move photo left"
                                        >
                                            <KeyboardArrowLeftIcon sx={{ fontSize: 22 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                movePhoto(idx, idx + 1);
                                            }}
                                            disabled={disabled || idx === safePhotos.length - 1}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(8px)',
                                                color: 'white',
                                                '&:active': { bgcolor: 'rgba(255,255,255,0.35)' },
                                                '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                                            }}
                                            aria-label="Move photo right"
                                        >
                                            <KeyboardArrowRightIcon sx={{ fontSize: 22 }} />
                                        </IconButton>
                                    </Box>

                                    {/* Delete */}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removePhoto(idx);
                                        }}
                                        disabled={disabled}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: 'rgba(255,70,70,0.55)',
                                            backdropFilter: 'blur(8px)',
                                            color: 'white',
                                            '&:active': { bgcolor: 'rgba(255,70,70,0.75)' },
                                        }}
                                        aria-label={`Remove photo ${idx + 1}`}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>

                                {/* Photo index indicator */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        px: 0.85,
                                        py: 0.25,
                                        borderRadius: 1.5,
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {idx + 1}/{safePhotos.length}
                                </Box>
                            </Box>
                        ))}

                        {/* ── Add-more card at end of carousel ── */}
                        {remainingCount > 0 && (
                            <Box
                                onClick={handleBrowseClick}
                                sx={{
                                    flex: '0 0 40%',
                                    maxWidth: 160,
                                    aspectRatio: '4 / 5',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.75,
                                    bgcolor: 'action.hover',
                                    scrollSnapAlign: 'center',
                                    cursor: disabled ? 'default' : 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'background-color 150ms',
                                    '&:active': { bgcolor: 'action.selected' },
                                    flexShrink: 0,
                                }}
                            >
                                <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center', px: 1 }}>
                                    {'Add more'}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                                    {remainingCount} left
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Dot indicators for carousel */}
                {safePhotos.length > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: -0.5 }}>
                        {safePhotos.map((p, i) => (
                            <Box
                                key={p.id}
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: i === 0 ? 'text.primary' : 'action.disabled',
                                    transition: 'background-color 200ms',
                                }}
                            />
                        ))}
                        {remainingCount > 0 && (
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', border: '1px dashed', borderColor: 'action.disabled' }} />
                        )}
                    </Box>
                )}
            </Box>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       DESKTOP LAYOUT — unchanged from original
       ═══════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pb: 3 }}>
            {!hideTitle && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: 1 }}>
                        <PhotoLibraryOutlinedIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                {title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                {helperText}
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleBrowseClick}
                        disabled={disabled || remainingCount <= 0}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 14, px: 2 }}
                    >
                        {addButtonText}
                    </Button>

                    <input ref={fileInputRef} hidden accept="image/jpeg,image/png,image/webp" type="file" multiple onChange={handleFileChange} />
                </Box>
            )}
            {hideTitle && (
                <input ref={fileInputRef} hidden accept="image/jpeg,image/png,image/webp" type="file" multiple onChange={handleFileChange} />
            )}

            {photoError ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {photoError}
                </Alert>
            ) : null}

            <Box
                role="button"
                tabIndex={0}
                onClick={handleBrowseClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleBrowseClick();
                }}
                onDragOver={onDropZoneDragOver}
                onDragLeave={onDropZoneDragLeave}
                onDrop={onDropZoneDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: isDropActive ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 1.25,
                    cursor: disabled || remainingCount <= 0 ? 'default' : 'pointer',
                    bgcolor: isDropActive ? 'action.hover' : 'transparent',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                    outline: 'none',
                    '&:focus-visible': {
                        boxShadow: (theme) => `0 0 0 3px ${theme.palette.action.focus}`,
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>
                        {safePhotos.length === 0 ? 'Click to add photos' : (isMobile ? 'Tap to reorder' : 'Drag to reorder')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {safePhotos.length} / {maxSlots}
                    </Typography>
                </Box>

                {/* Photo grid */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            sm: `repeat(${Math.min(maxSlots, 3)}, minmax(0, 1fr))`,
                            md: `repeat(${Math.min(maxSlots, 4)}, minmax(0, 1fr))`,
                        },
                        gap: 1,
                        width: '100%',
                    }}
                >
                    {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                        const p = safePhotos[slotIdx] || null;

                        if (!p) {
                            if (slotIdx === 0 && safePhotos.length === 0) {
                                return (
                                    <Box
                                        key={`slot-${slotIdx}`}
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1 / 1',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.5,
                                            bgcolor: 'background.paper',
                                        }}
                                    >
                                        <PhotoLibraryOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.25 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>
                                            {isMobile ? 'Tap to add photos' : 'Click to add photos'}
                                        </Typography>
                                    </Box>
                                );
                            }

                            return (
                                <Box
                                    key={`slot-${slotIdx}`}
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '1 / 1',
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.25,
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: 12 }}>
                                        +
                                    </Typography>
                                </Box>
                            );
                        }

                        const canDropHere = slotIdx < safePhotos.length;

                        return (
                            <Box
                                key={p.id}
                                draggable={!disabled}
                                onDragStart={() => onThumbDragStart(slotIdx)}
                                onDragEnd={onThumbDragEnd}
                                onDragOver={(e) => {
                                    if (!canDropHere || disabled) return;
                                    e.preventDefault();
                                }}
                                onDrop={(e) => {
                                    if (!canDropHere || disabled) return;
                                    onThumbDrop(e, slotIdx);
                                }}
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    userSelect: 'none',
                                }}
                            >
                                <img
                                    src={p.url}
                                    alt={`Photo ${slotIdx + 1} preview`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    draggable={false}
                                />
                                {/* Cover photo badge */}
                                {slotIdx === 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 4,
                                            px: 0.75,
                                            py: 0.15,
                                            borderRadius: 1,
                                            bgcolor: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            fontSize: 9,
                                            fontWeight: 800,
                                            letterSpacing: '0.03em',
                                            lineHeight: 1.4,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Cover
                                    </Box>
                                )}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 6,
                                        left: 6,
                                        right: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 0.25,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                movePhoto(slotIdx, slotIdx - 1);
                                            }}
                                            disabled={disabled || slotIdx === 0}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'rgba(0,0,0,0.45)',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                                            }}
                                            aria-label="Move photo left"
                                        >
                                            <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                movePhoto(slotIdx, slotIdx + 1);
                                            }}
                                            disabled={disabled || slotIdx === safePhotos.length - 1}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'rgba(0,0,0,0.45)',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                                            }}
                                            aria-label="Move photo right"
                                        >
                                            <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>

                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removePhoto(slotIdx);
                                        }}
                                        disabled={disabled}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: 'rgba(0,0,0,0.45)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                                        }}
                                        aria-label={`Remove photo ${slotIdx + 1}`}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

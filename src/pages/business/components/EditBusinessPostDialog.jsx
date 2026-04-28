// src/pages/business/components/EditBusinessPostDialog.jsx
//
// Shared edit dialog for business posts. Reused by:
//   - BusinessPublicPage (inline edit)
//   - BusinessPostCard (from business hub / lists)
//   - BusinessPostDetailModal (from detail panel)
//
// Props:
//   open        - boolean
//   onClose     - () => void
//   post        - the post object to edit
//   businessId  - number (used for photo upload path)
//   businessName - string (shown in subtitle)
//   onPostUpdated - () => void (called after successful save)

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import PhotosUploadSection from '../../../components/PhotosUploadSection';
import RichTextEditor from '../../../components/RichTextEditor';
import { updateBusinessPost } from '../api/businessApi';
import { secureFetch } from '../../../utils/secureFetch';

const POST_TYPES = [
    { value: 'update', label: 'Update', description: 'General news or behind-the-scenes' },
    { value: 'deal', label: 'Deal', description: 'Sales, promotions, or special offers' },
    { value: 'announcement', label: 'Announcement', description: 'Important news or changes' },
];

const MAX_POST_PHOTOS = 8;

export default function EditBusinessPostDialog({ open, onClose, post, businessId, businessName, onPostUpdated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [postType, setPostType] = useState('update');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [discountText, setDiscountText] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [terms, setTerms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Edit limit state
    const [limitChecking, setLimitChecking] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    const isDeal = postType === 'deal';

    useEffect(() => {
        if (post && open) {
            setPostType(post.type || 'update');
            setTitle(post.title || '');
            setBody(post.body || '');
            setDiscountText(post.discountText || post.discount_text || '');
            setValidUntil(
                post.validUntil || post.valid_until
                    ? String(post.validUntil || post.valid_until).split('T')[0]
                    : ''
            );
            setTerms(post.terms || '');

            // Convert existing media_url (JSON array or string) into PhotosUploadSection shape
            let existingUrls = [];
            const raw = post.mediaUrl || post.media_url || post.mediaUrls || post.media_urls || '';
            if (raw) {
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    existingUrls = Array.isArray(parsed) ? parsed.filter(Boolean) : [String(raw)].filter(Boolean);
                } catch {
                    existingUrls = [String(raw)].filter(Boolean);
                }
            }
            setPhotos(existingUrls.map((url) => ({ id: url, url, _existing: true })));
            setError(null);
            setLimitReached(false);
            setLimitMessage('');

            // Check edit limit
            const pid = post.id || post.postId;
            if (pid) {
                setLimitChecking(true);
                secureFetch(`/api/business/posts/${encodeURIComponent(pid)}/edit-limit`, {
                    credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
                })
                    .then((r) => r.ok ? r.json() : null)
                    .then((data) => {
                        if (data && data.ok === false) {
                            setLimitReached(true);
                            setLimitMessage(data.message || 'You can edit a post up to 5 times within a 24-hour window.');
                        }
                    })
                    .catch(() => { /* allow edit on error */ })
                    .finally(() => setLimitChecking(false));
            }
        }
    }, [post, open]);

    const handleClose = () => {
        photos.forEach((p) => {
            if (p?.url && !p._existing) {
                try { URL.revokeObjectURL(p.url); } catch { /* ignore */ }
            }
        });
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await updateBusinessPost(post.id, {
                type: postType,
                title: title.trim(),
                body: body.trim(),
                discountText: isDeal ? discountText.trim() : null,
                validUntil: isDeal && validUntil ? validUntil : null,
                terms: isDeal ? terms.trim() || null : null,
                photos,
            });

            // Broadcast update event so lists refresh
            try {
                window.dispatchEvent(new CustomEvent('ll:businessPost:updated', {
                    detail: { postId: post.id, post: { ...post, title: title.trim(), body: body.trim(), type: postType } },
                }));
            } catch { /* ignore */ }

            if (typeof onPostUpdated === 'function') onPostUpdated();
            handleClose();
        } catch (err) {
            setError(err?.message || 'Failed to update post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{ sx: { maxHeight: isMobile ? '100vh' : '90vh', borderRadius: isMobile ? 0 : undefined, ...(isMobile && { pt: 'env(safe-area-inset-top, 0px)' }) } }}
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, ...(isMobile && { borderBottom: '1px solid', borderColor: 'divider' }) }}>
                {isMobile ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={handleClose} size="small"><ArrowBackIcon /></IconButton>
                        <Typography variant="h6" fontWeight={800}>Edit Post</Typography>
                    </Stack>
                ) : (
                    <>
                        <Typography variant="h6" fontWeight={800}>Edit Post</Typography>
                        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                    </>
                )}
            </DialogTitle>
            <DialogContent sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {limitReached ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {limitMessage || 'You can edit a post up to 5 times within a 24-hour window.'}
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            Please try again later.
                        </Typography>
                    </>
                ) : limitChecking ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <>
                        {businessName ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Update your post for {businessName}
                            </Typography>
                        ) : null}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="edit-post-type-label">Post Type</InputLabel>
                            <Select
                                labelId="edit-post-type-label"
                                value={postType}
                                label="Post Type"
                                onChange={(e) => setPostType(e.target.value)}
                            >
                                {POST_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        <Stack>
                                            <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 2 }}
                            inputProps={{ maxLength: 180 }}
                            helperText={`${title.length}/180`}
                            required
                        />

                        {isDeal && (
                            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocalOfferIcon sx={{ fontSize: 18 }} /> Deal Details
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Discount/Offer"
                                    value={discountText}
                                    onChange={(e) => setDiscountText(e.target.value)}
                                    sx={{ mb: 2 }}
                                    placeholder='e.g., "20% off all pizzas" or "Buy 1 Get 1 Free"'
                                    inputProps={{ maxLength: 100 }}
                                    helperText={`${discountText.length}/100`}
                                    required
                                />

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Valid Until (optional)"
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: minDate }}
                                    />
                                </Stack>

                                <TextField
                                    fullWidth
                                    label="Terms & Conditions (optional)"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    multiline
                                    rows={2}
                                    placeholder="e.g., Cannot be combined with other offers. Valid for dine-in only."
                                    inputProps={{ maxLength: 500 }}
                                    helperText={`${terms.length}/500`}
                                />
                            </Paper>
                        )}

                        <Box sx={{
                            '& .ProseMirror, & .tiptap, & [contenteditable="true"]': {
                                height: 280,
                                overflowY: 'auto',
                            },
                        }}>
                            <RichTextEditor
                                label="Description"
                                value={body}
                                onChange={(html) => setBody(html)}
                                maxLength={5000}
                                placeholder={isDeal ? "Add more details about this deal..." : "Tell your followers what's happening..."}
                                minRows={10}
                            />
                        </Box>

                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={setPhotos}
                            disabled={submitting}
                            maxPhotos={MAX_POST_PHOTOS}
                            title="Photos"
                            helperText="Add or remove photos"
                            addButtonText="Add photos"
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>{limitReached ? 'Close' : 'Cancel'}</Button>
                {!limitReached && !limitChecking && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!title.trim() || (isDeal && !discountText.trim()) || submitting}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

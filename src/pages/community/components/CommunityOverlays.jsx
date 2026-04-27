import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/components/CommunityOverlays.jsx
import React from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Alert,
    Box,
    Chip,
    Typography,
    Stack,
    Divider,
    CircularProgress,
} from '@mui/material';
import { alpha as alphaColor } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import UserCardPopover from '../../../components/UserCardPopover';
import NewPostDialogs from '../../community/NewCommunityPosts/NewPostDialogs';
import CreateGroupModal from '../groups/CreateGroupModal';
import CreateGroupPostModal from '../groups/CreateGroupPostModal';

import EditCommunityPostDialog from '../components/EditCommunityPostDialog';
import EditPollForm from '../components/EditPollForm';
import DeletePostConfirmDialog from '../components/DeletePostConfirmDialog';
import RichTextDisplay from '../../../components/RichTextDisplay';

/**
 * CommunityOverlays
 * -----------------
 * Popovers + modals extracted from CommunityPage.jsx.
 *
 * NOTE:
 * Group post cards and detail panels emit global events:
 *   - ll:communityPost:requestEdit
 *   - ll:communityPost:requestDelete
 * This component is the shared, always-mounted place that listens for those
 * events and opens the appropriate dialogs.
 */
export default function CommunityOverlays(props) {
    const {
        userAnchor,
        closeUserCard,
        userForCard,
        isSelfForCard,
        isFollowingForCard,
        handleFollow,
        handleViewProfile,

        stepOneOpen,
        stepTwoOpen,
        stepOneData,
        setStepOneOpen,
        setStepTwoOpen,
        setStepOneData,
        handleCategoryChosen,
        refetch,
        categories,

        isCreateGroupOpen,
        setIsCreateGroupOpen,
        handleCreateGroup,
        selectedCounty,
        selectedCity,

        isCreateGroupPostOpen,
        setIsCreateGroupPostOpen,
        selectedGroup,
        handleGroupPostCreated,
    } = props;

    // Mark overlays as mounted so other components (like PostList) can stand down.
    React.useEffect(() => {
        window.__llCommunityOverlaysMounted = true;
        try {
            window.dispatchEvent(new CustomEvent('ll:communityOverlays:mounted'));
        } catch {
            // ignore
        }
        return () => {
            window.__llCommunityOverlaysMounted = false;
            try {
                window.dispatchEvent(new CustomEvent('ll:communityOverlays:unmounted'));
            } catch {
                // ignore
            }
        };
    }, []);

    // Edit/Delete dialogs (opened from 3-dot menus via global events)
    const [editOpen, setEditOpen] = React.useState(false);
    const [editPostId, setEditPostId] = React.useState(null);
    const [editPostCategory, setEditPostCategory] = React.useState('');

    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deletePostId, setDeletePostId] = React.useState(null);
    const [deletePostTitle, setDeletePostTitle] = React.useState('');
    const [deleteGroupId, setDeleteGroupId] = React.useState(null);

// Edit history dialog (opened from "(Edited)" link via global event)
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const [historyPostId, setHistoryPostId] = React.useState(null);
    const [historyLoading, setHistoryLoading] = React.useState(false);
    const [historyError, setHistoryError] = React.useState('');
    const [historyRows, setHistoryRows] = React.useState([]);

    // Edit-limit warning dialog (the ONLY thing shown when limit is exceeded)
    const [editLimitOpen, setEditLimitOpen] = React.useState(false);
    const [editLimitMessage, setEditLimitMessage] = React.useState(
        'You can edit a post up to 5 times within a 24-hour window.'
    );

    const closeEditLimit = React.useCallback(() => {
        setEditLimitOpen(false);
    }, []);

    const closeEdit = React.useCallback(async () => {
        const pid = editPostId;

        setEditOpen(false);
        setEditPostId(null);

        // After edits, re-hydrate the canonical post row and broadcast it so the left list updates immediately.
        if (pid != null) {
            try {
                const res = await secureFetch(`/api/community/${encodeURIComponent(String(pid))}`, {
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const updated = await res.json().catch(() => null);
                    if (updated && typeof updated === 'object') {
                        try {
                            window.dispatchEvent(
                                new CustomEvent('ll:communityPost:updated', {
                                    detail: { postId: pid, post: updated, forceRefresh: true },
                                })
                            );
                        } catch {
                            // ignore
                        }
                    }
                }
            } catch {
                // ignore
            }
        }

        // Also refetch the current feed query so any derived sort/order stays correct.
        if (typeof refetch === 'function') {
            try {
                await refetch();
            } catch {
                // ignore
            }
        }
    }, [editPostId, refetch]);

    const closeDelete = React.useCallback(() => {
        setDeleteOpen(false);
        setDeletePostId(null);
        setDeletePostTitle('');
        setDeleteGroupId(null);
    }, []);


    const closeHistory = React.useCallback(() => {
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryLoading(false);
        setHistoryError('');
        setHistoryRows([]);
    }, []);

    const normalizePhotoList = React.useCallback((photos) => {
        if (!photos) return [];
        if (Array.isArray(photos)) {
            return photos
                .map((p) => {
                    if (!p) return null;
                    if (typeof p === 'string') return p;
                    if (typeof p === 'object') {
                        return p.url || p.image_url || p.photo_url || p.path || null;
                    }
                    return null;
                })
                .filter(Boolean);
        }
        return [];
    }, []);

    const buildDiffFallback = React.useCallback((prevSnap, currSnap) => {
        const prevTitle = String(prevSnap?.title ?? prevSnap?.post_title ?? '').trim();
        const currTitle = String(currSnap?.title ?? currSnap?.post_title ?? '').trim();

        const prevBody = String(prevSnap?.body ?? prevSnap?.description ?? prevSnap?.content ?? '').trim();
        const currBody = String(currSnap?.body ?? currSnap?.description ?? currSnap?.content ?? '').trim();

        const prevPhotos = normalizePhotoList(prevSnap?.photos ?? prevSnap?.images ?? prevSnap?.media);
        const currPhotos = normalizePhotoList(currSnap?.photos ?? currSnap?.images ?? currSnap?.media);

        const prevSet = new Set(prevPhotos);
        const currSet = new Set(currPhotos);

        const added = currPhotos.filter((u) => !prevSet.has(u));
        const removed = prevPhotos.filter((u) => !currSet.has(u));

        const sameSet = prevPhotos.length === currPhotos.length && added.length === 0 && removed.length === 0;
        const reordered = sameSet && prevPhotos.join('|') !== currPhotos.join('|');

        return {
            titleChanged: prevTitle !== currTitle,
            bodyChanged: prevBody !== currBody,
            added,
            removed,
            reordered,
            locationChanged:
                String(prevSnap?.city ?? '').trim() !== String(currSnap?.city ?? '').trim() ||
                String(prevSnap?.county ?? '').trim() !== String(currSnap?.county ?? '').trim(),
            visibilityChanged:
                String(prevSnap?.visibility ?? '').trim() !== String(currSnap?.visibility ?? '').trim(),
            pollExpirationChanged:
                String(prevSnap?.pollExpiresAt ?? prevSnap?.poll_expires_at ?? '').trim() !==
                String(currSnap?.pollExpiresAt ?? currSnap?.poll_expires_at ?? '').trim(),
        };
    }, [normalizePhotoList]);

    const fetchHistory = React.useCallback(
        async (pid) => {
            if (pid == null) return;

            setHistoryLoading(true);
            setHistoryError('');
            setHistoryRows([]);

            try {
                const res = await secureFetch(`/api/community/${encodeURIComponent(String(pid))}/edits`, {
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });

                if (!res.ok) {
                    throw new Error('Failed to load edit history.');
                }

                const data = await res.json().catch(() => null);
                const rowsRaw = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];

                // Ensure each row has a diff (fallback by comparing snapshots)
                const withDiff = rowsRaw.map((row, idx) => {
                    const currSnap = row?.snapshot ?? row?.post_snapshot ?? row?.data ?? null;
                    const prevRow = idx + 1 < rowsRaw.length ? rowsRaw[idx + 1] : null;
                    const prevSnap = prevRow?.snapshot ?? prevRow?.post_snapshot ?? prevRow?.data ?? null;

                    const serverDiff = row?.diff && typeof row.diff === 'object' ? row.diff : null;
                    const fallbackDiff = buildDiffFallback(prevSnap, currSnap);

                    // Mark the last item (oldest) as the original version
                    const isOriginal = idx === rowsRaw.length - 1;

                    return {
                        ...row,
                        __snapshot: currSnap,
                        __diff: serverDiff || fallbackDiff,
                        __isOriginal: isOriginal,
                    };
                });

                setHistoryRows(withDiff);
            } catch (err) {
                setHistoryError(err?.message || 'Failed to load edit history.');
            } finally {
                setHistoryLoading(false);
            }
        },
        [buildDiffFallback]
    );
    const handleDeleted = React.useCallback(() => {
        // Let existing listeners refresh lists / clear detail panes.
        try {
            window.dispatchEvent(
                new CustomEvent('ll:communityPost:deleted', {
                    detail: { postId: deletePostId, groupId: deleteGroupId },
                })
            );
        } catch {
            // ignore
        }
        closeDelete();
    }, [closeDelete, deleteGroupId, deletePostId]);

    React.useEffect(() => {
        let alive = true;

        const onRequestEdit = async (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const pid = detail.postId ?? detail.id ?? detail.post?.id ?? null;
            if (pid == null) return;

            const cat = String(detail.post?.category || detail.category || '').trim().toLowerCase();

            // Never show the heavy edit form while we preflight.
            setEditOpen(false);
            setEditPostId(null);
            setEditPostCategory(cat);

            try {
                const res = await secureFetch(`/api/community/${encodeURIComponent(String(pid))}/edit-limit`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });

                // If endpoint is missing (404) or errors, allow the edit dialog to open.
                if (!res.ok) {
                    if (!alive) return;
                    setEditPostId(pid);
                    setEditOpen(true);
                    return;
                }

                const data = await res.json().catch(() => null);
                if (!alive) return;

                if (data && data.ok === false) {
                    setEditLimitMessage(
                        data.message || 'You can edit a post up to 5 times within a 24-hour window.'
                    );
                    setEditLimitOpen(true);
                    return;
                }

                setEditPostId(pid);
                setEditOpen(true);
            } catch {
                if (!alive) return;
                // Network error: allow opening (PATCH still enforces).
                setEditPostId(pid);
                setEditOpen(true);
            }
        };

        const onRequestDelete = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const pid = detail.postId ?? detail.id ?? detail.post?.id ?? null;
            if (pid == null) return;

            const title = String(detail?.post?.title ?? detail?.post?.post_title ?? '').trim();
            const gid = detail.groupId ?? detail.group_id ?? detail.group?.id ?? detail.group?.group_id ?? null;

            setDeletePostId(pid);
            setDeletePostTitle(title);
            setDeleteGroupId(gid != null ? String(gid) : null);
            setDeleteOpen(true);
        };

        const onRequestHistory = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const pid = detail.postId ?? detail.id ?? detail.post?.id ?? null;
            if (pid == null) return;

            setHistoryPostId(pid);
            setHistoryOpen(true);
            fetchHistory(pid);
        };

        window.addEventListener('ll:communityPost:requestEdit', onRequestEdit);
        window.addEventListener('ll:communityPost:requestDelete', onRequestDelete);
        window.addEventListener('ll:communityPost:requestHistory', onRequestHistory);

        return () => {
            alive = false;
            window.removeEventListener('ll:communityPost:requestEdit', onRequestEdit);
            window.removeEventListener('ll:communityPost:requestDelete', onRequestDelete);
            window.removeEventListener('ll:communityPost:requestHistory', onRequestHistory);
        };
    }, [fetchHistory]);;

    // If the edit-limit warning is open, guarantee the edit form is closed behind it.
    React.useEffect(() => {
        if (!editLimitOpen) return;
        setEditOpen(false);
        setEditPostId(null);
    }, [editLimitOpen]);

    return (
        <>
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={closeUserCard}
                user={userForCard}
                isSelf={isSelfForCard}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={handleViewProfile}
                layoutVariant="social"
            />

            <NewPostDialogs
                stepOneOpen={stepOneOpen}
                stepTwoOpen={stepTwoOpen}
                stepOneData={stepOneData}
                onClose1={() => setStepOneOpen(false)}
                onClose2={() => {
                    setStepTwoOpen(false);
                    setStepOneData(null);
                }}
                onCategoryChosen={handleCategoryChosen}
                onRefresh={refetch}
                subtypes={categories}
            />

            <CreateGroupModal
                open={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onCreate={handleCreateGroup}
                defaultCounty={selectedCounty || ''}
                defaultCity={selectedCity || ''}
            />

            <CreateGroupPostModal
                open={isCreateGroupPostOpen}
                onClose={() => setIsCreateGroupPostOpen(false)}
                group={selectedGroup}
                onCreated={handleGroupPostCreated}
            />

            {/* Edit-limit warning (shows alone, no edit form behind it) */}
            <Dialog open={editLimitOpen} onClose={closeEditLimit} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    Edit limit reached
                    <IconButton
                        aria-label="Close"
                        onClick={closeEditLimit}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            {editLimitMessage || 'You can edit a post up to 5 times within a 24-hour window.'}
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="contained" onClick={closeEditLimit}>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Only mount the heavy edit dialog when we are NOT showing the limit warning */}
            {!editLimitOpen && editPostCategory === 'poll' && (
                <EditPollForm open={editOpen} postId={editPostId} onClose={closeEdit} />
            )}
            {!editLimitOpen && editPostCategory !== 'poll' && (
                <EditCommunityPostDialog open={editOpen} postId={editPostId} onClose={closeEdit} />
            )}

            <DeletePostConfirmDialog
                open={deleteOpen}
                postId={deletePostId}
                postTitle={deletePostTitle}
                onClose={closeDelete}
                onDeleted={handleDeleted}
            />

            <Dialog
                open={historyOpen}
                onClose={closeHistory}
                fullWidth
                maxWidth="sm"
                fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
                PaperProps={{ sx: { position: 'relative' } }}
                sx={{ zIndex: 1400 }}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                    Edit History
                    <IconButton
                        aria-label="close"
                        onClick={closeHistory}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : null}

                    {!historyLoading && historyError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>{historyError}</Alert>
                    ) : null}

                    {!historyLoading && !historyError && historyRows.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    ) : null}

                    {!historyLoading && !historyError && historyRows.length > 0 ? (
                        <Box sx={{ position: 'relative', pl: 2.5 }}>
                            {/* Timeline vertical line */}
                            <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                            {historyRows.map((row, idx) => {
                                // Resolve snapshot: try dedicated snapshot field, then fall back to the row itself
                                const rawSnap = row?.__snapshot ?? row?.snapshot ?? row?.post_snapshot ?? row?.data ?? null;
                                const snap = rawSnap && typeof rawSnap === 'object' ? { ...rawSnap } : { ...(row || {}) };
                                const rawPrevRow = idx + 1 < historyRows.length ? historyRows[idx + 1] : null;
                                const rawPrevSnap = rawPrevRow?.__snapshot ?? rawPrevRow?.snapshot ?? rawPrevRow?.post_snapshot ?? rawPrevRow?.data ?? null;
                                const prevSnap = rawPrevSnap && typeof rawPrevSnap === 'object' ? { ...rawPrevSnap } : { ...(rawPrevRow || {}) };
                                const diff = row?.__diff ?? row?.diff ?? {};
                                const when = row?.created_at || row?.edited_at || row?.timestamp || null;
                                const isOriginal = row?.__isOriginal || idx === historyRows.length - 1;
                                const isLatest = idx === 0;
                                const version = row?.version != null ? row.version : historyRows.length - idx;

                                const editorHandle = String(row?.editor_handle || row?.editorHandle || '').replace(/^@/, '');

                                const s = (v) => (v == null ? '' : String(v).trim());
                                const stripFragments = (v) => String(v || '').replace(/<!--\s*(?:Start|End)Fragment\s*-->/gi, '').trim();

                                // Helper: resolve poll options from multiple possible locations
                                const getPollOpts = (obj) => {
                                    if (!obj) return [];
                                    const candidates = [obj.pollOptions, obj.poll_options, obj.poll?.options, obj.options];
                                    for (const c of candidates) {
                                        if (Array.isArray(c) && c.length > 0) return c;
                                    }
                                    return [];
                                };

                                // Helper: resolve poll expiration from multiple possible locations
                                const getPollExp = (obj) => {
                                    if (!obj) return '';
                                    return s(obj.pollExpiresAt || obj.poll_expires_at || obj.poll?.pollExpiresAt || obj.poll?.poll_expires_at || obj.poll?.expires_at || obj.poll?.expiresAt);
                                };

                                // Build diff items
                                const diffItems = [];
                                if (!isOriginal) {
                                    const title = s(snap?.title ?? snap?.post_title);
                                    const prevTitle = s(prevSnap?.title ?? prevSnap?.post_title);
                                    if (title !== prevTitle) diffItems.push({ label: 'Title', from: prevTitle || '(empty)', to: title || '(empty)' });

                                    const body = s(snap?.body ?? snap?.description ?? snap?.content);
                                    const prevBody = s(prevSnap?.body ?? prevSnap?.description ?? prevSnap?.content);
                                    if (body !== prevBody) diffItems.push({ label: 'Description', from: prevBody || '(empty)', to: body || '(empty)' });

                                    const category = s(snap?.category);
                                    const prevCategory = s(prevSnap?.category);
                                    const formatCat = (c) => c ? c.replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '';
                                    if (category && prevCategory && category !== prevCategory) diffItems.push({ label: 'Category', from: formatCat(prevCategory), to: formatCat(category) });

                                    // Location changes (city + county)
                                    const curCity = s(snap?.city);
                                    const prevCity = s(prevSnap?.city);
                                    const curCounty = s(snap?.county);
                                    const prevCounty = s(prevSnap?.county);
                                    if (curCity !== prevCity || curCounty !== prevCounty) {
                                        const fmtLoc = (c, co) => {
                                            const countyStr = co ? (co.toLowerCase().includes('county') ? co : `${co} County`) : '';
                                            return [c, countyStr].filter(Boolean).join(', ') || '(none)';
                                        };
                                        diffItems.push({ label: 'Location', from: fmtLoc(prevCity, prevCounty), to: fmtLoc(curCity, curCounty) });
                                    }

                                    // Visibility changes
                                    const curVis = s(snap?.visibility);
                                    const prevVis = s(prevSnap?.visibility);
                                    if (curVis && prevVis && curVis !== prevVis) {
                                        const fmtVis = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
                                        diffItems.push({ label: 'Visibility', from: fmtVis(prevVis), to: fmtVis(curVis) });
                                    }

                                    // Poll option label changes
                                    const curOpts = getPollOpts(snap);
                                    const prevOpts = getPollOpts(prevSnap);
                                    if (curOpts.length > 0 && prevOpts.length > 0) {
                                        curOpts.forEach((co, coIdx) => {
                                            const po = prevOpts.find((p) => p.id === co.id);
                                            if (po) {
                                                const curLabel = s(co.label || co.text || co.option_text);
                                                const prevLabel = s(po.label || po.text || po.option_text);
                                                if (curLabel !== prevLabel) {
                                                    diffItems.push({ label: `Option ${coIdx + 1}`, from: prevLabel || '(empty)', to: curLabel || '(empty)' });
                                                }
                                            }
                                        });
                                    } else if (curOpts.length > 0 && prevOpts.length === 0) {
                                        // Previous snapshot didn't store options — show all current options as "added"
                                        diffItems.push({ label: 'Poll Options', changed: true, detail: `${curOpts.length} option${curOpts.length !== 1 ? 's' : ''} recorded` });
                                    }

                                    // Poll expiration changes
                                    const curExp = getPollExp(snap);
                                    const prevExp = getPollExp(prevSnap);
                                    if (curExp !== prevExp) {
                                        const fmtExp = (v) => {
                                            if (!v) return 'No limit';
                                            try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(v)); } catch { return v; }
                                        };
                                        diffItems.push({ label: 'Expiration', from: fmtExp(prevExp), to: fmtExp(curExp) });
                                    }

                                    const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                    const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                    const reordered = Boolean(diff?.reordered);
                                    if (added.length > 0 || removed.length > 0 || reordered) {
                                        const parts = [];
                                        if (added.length) parts.push(`${added.length} added`);
                                        if (removed.length) parts.push(`${removed.length} removed`);
                                        if (!parts.length && reordered) parts.push('reordered');
                                        diffItems.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
                                    }

                                    // Last resort: if we still have no diff items, check if the server-provided diff
                                    // object has any flags we can describe (e.g. diff.titleChanged, diff.bodyChanged, etc.)
                                    if (diffItems.length === 0 && diff && typeof diff === 'object') {
                                        if (diff.titleChanged) diffItems.push({ label: 'Title', changed: true, detail: 'Updated' });
                                        if (diff.bodyChanged) diffItems.push({ label: 'Description', changed: true, detail: 'Updated' });
                                        if (diff.locationChanged) diffItems.push({ label: 'Location', changed: true, detail: 'Updated' });
                                        if (diff.visibilityChanged) diffItems.push({ label: 'Visibility', changed: true, detail: 'Updated' });
                                        if (diff.pollExpirationChanged) diffItems.push({ label: 'Expiration', changed: true, detail: 'Updated' });
                                        // Check for any changed_fields array the server may provide
                                        const changedFields = Array.isArray(diff.changed_fields) ? diff.changed_fields : Array.isArray(diff.changedFields) ? diff.changedFields : [];
                                        changedFields.forEach((f) => {
                                            const label = String(f || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                                            if (label && !diffItems.some((d) => d.label === label)) {
                                                diffItems.push({ label, changed: true, detail: 'Updated' });
                                            }
                                        });
                                    }
                                }

                                const whenLabel = when ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(when)) : '';

                                return (
                                    <Box key={row?.id ?? `${historyPostId}-${idx}`} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                        {/* Timeline dot */}
                                        <Box sx={{
                                            position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                            bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                            border: '2px solid', borderColor: 'background.paper',
                                            boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                            zIndex: 1,
                                        }} />
                                        {/* Version label + date */}
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${version}`}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>{whenLabel}</Typography>
                                            {editorHandle ? (
                                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>@{editorHandle}</Typography>
                                            ) : null}
                                        </Stack>
                                        {/* Diff chips */}
                                        {!isOriginal && diffItems.length > 0 && (
                                            <Box sx={{ bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alphaColor(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {diffItems.map((item, i) => (
                                                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                            <Chip label={item.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                                                            {item.changed ? (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{item.detail || 'Updated'}</Typography>
                                                            ) : item.label === 'Description' ? (() => {
                                                                return (
                                                                    <Box sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
                                                                        <Box sx={{ textDecoration: 'line-through', opacity: 0.55, mb: 0.5 }}>
                                                                            <RichTextDisplay html={stripFragments(item.from)} sx={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }} />
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                                                            <Box component="span" sx={{ color: 'text.disabled', flexShrink: 0 }}>→</Box>
                                                                            <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                                                <RichTextDisplay html={stripFragments(item.to)} sx={{ fontSize: 'inherit', lineHeight: 'inherit' }} />
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })() : (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                                                                    <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{item.from}</Box>
                                                                    <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                                                                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.to}</Box>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {(item.photoAdded?.length > 0 || item.photoRemoved?.length > 0) && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 0.5, mt: 0.5 }}>
                                                                {(item.photoRemoved || []).slice(0, 4).map((url, pi) => (
                                                                    <Box key={`rm-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'error.main', opacity: 0.6 }}>
                                                                        <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                                                                            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                                {(item.photoAdded || []).slice(0, 4).map((url, pi) => (
                                                                    <Box key={`add-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.main' }}>
                                                                        <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                                            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                        {!isOriginal && diffItems.length === 0 && (
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>
                                        )}
                                        {isOriginal && (
                                            <Box sx={{ bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alphaColor(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {(snap?.title || snap?.post_title) && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{s(snap.title || snap.post_title)}</Typography>}
                                                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>Original post created</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : null}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={closeHistory} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

        </>
    );
}

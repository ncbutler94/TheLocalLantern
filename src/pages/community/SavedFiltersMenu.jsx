// src/pages/community/SavedFiltersMenu.jsx
//
// UI surface for saved filters — slice 3 of the community revamp.
//
// A single reusable component that renders:
//   • A button (bookmark icon) that opens a dropdown.
//   • In the dropdown: saved filters (default marked with a star),
//     "Save current filter…" at the bottom, and "Manage…" to open
//     the rename/delete/set-default dialog.
//   • Two dialogs: "Save" (name + "set as default" checkbox) and
//     "Manage" (list of filters with rename / delete / star).
//
// Consumer contract:
//
//   <SavedFiltersMenu
//     tab="posts"                            // or "groups" | "news"
//     viewer={currentUser}                   // object with .id or null
//     currentPayload={currentFilterSnapshot} // object matching the tab schema
//     onApply={(filter) => applyFilterToPage(filter.payload)}
//   />
//
// The component itself doesn't know how to APPLY filters — it fires the
// `onApply(filter)` callback with the filter record, and the parent is
// responsible for reading `filter.payload` and dispatching the
// appropriate state updates.
//
// Hidden for signed-out viewers (the backend rejects without auth
// anyway, and surfacing an empty menu confuses the user).

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import BookmarksRoundedIcon from '@mui/icons-material/BookmarksRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

import useSavedFilters from './useSavedFilters';

/* ─────────────────────────── save dialog ─────────────────────────── */

function SaveFilterDialog({ open, onClose, onSave, saving }) {
    const [name, setName] = useState('');
    const [makeDefault, setMakeDefault] = useState(false);
    const [localErr, setLocalErr] = useState('');

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setLocalErr('Please enter a name.');
            return;
        }
        setLocalErr('');
        try {
            await onSave({ name: trimmed, isDefault: makeDefault });
            setName('');
            setMakeDefault(false);
            onClose();
        } catch (err) {
            setLocalErr(err?.message || 'Could not save filter.');
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Save this filter</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Save your current filter settings so you can reapply them with one tap.
                </Typography>
                <TextField
                    label="Name"
                    fullWidth
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !saving) handleSave();
                    }}
                    inputProps={{ maxLength: 80 }}
                    helperText={localErr || `${name.length}/80`}
                    error={Boolean(localErr)}
                    disabled={saving}
                    sx={{ mb: 1.5 }}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={makeDefault}
                            onChange={(e) => setMakeDefault(e.target.checked)}
                            disabled={saving}
                        />
                    }
                    label="Apply automatically when I open this tab"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving || !name.trim()}
                >
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

SaveFilterDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    saving: PropTypes.bool,
};

/* ─────────────────────────── manage dialog ─────────────────────────── */

function ManageFiltersDialog({ open, onClose, filters, onRename, onDelete, onToggleDefault }) {
    const [busyId, setBusyId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [rowErr, setRowErr] = useState('');

    // Pending delete confirmation. `null` = no dialog, otherwise the filter
    // whose delete we're confirming. We keep the whole filter object around
    // so the dialog can show its name even if the list shifts under us.
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteErr, setDeleteErr] = useState('');

    const startRename = (f) => {
        setRenamingId(f.id);
        setRenameValue(f.name);
        setRowErr('');
    };
    const cancelRename = () => {
        setRenamingId(null);
        setRenameValue('');
        setRowErr('');
    };
    const commitRename = async (f) => {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === f.name) {
            cancelRename();
            return;
        }
        setBusyId(f.id);
        try {
            await onRename(f.id, trimmed);
            cancelRename();
        } catch (err) {
            setRowErr(err?.message || 'Could not rename.');
        } finally {
            setBusyId(null);
        }
    };

    // Click the trash icon — opens the confirmation dialog.
    const requestDelete = (f) => {
        setDeleteErr('');
        setConfirmDelete(f);
    };

    const cancelDelete = () => {
        if (deleting) return; // don't let the user escape mid-request
        setConfirmDelete(null);
        setDeleteErr('');
    };

    // User confirmed — actually perform the delete.
    const confirmDeleteNow = async () => {
        if (!confirmDelete) return;
        const f = confirmDelete;
        setDeleting(true);
        setDeleteErr('');
        setBusyId(f.id);
        try {
            await onDelete(f.id);
            setConfirmDelete(null);
        } catch (err) {
            setDeleteErr(err?.message || 'Could not delete.');
        } finally {
            setDeleting(false);
            setBusyId(null);
        }
    };

    const handleStar = async (f) => {
        setBusyId(f.id);
        try {
            await onToggleDefault(f.id, !f.is_default);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Manage saved filters</DialogTitle>
                <DialogContent>
                    {filters.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                            You haven&apos;t saved any filters for this tab yet.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filters.map((f, idx) => (
                                <React.Fragment key={f.id}>
                                    {idx > 0 && <Divider />}
                                    <ListItem
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title={f.is_default ? 'Remove auto-apply' : 'Auto-apply on open'}>
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={() => handleStar(f)}
                                                        disabled={busyId === f.id}
                                                    >
                                                        {f.is_default
                                                            ? <StarRoundedIcon sx={{ color: 'warning.main' }} fontSize="small" />
                                                            : <StarOutlineRoundedIcon fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Rename">
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={() => startRename(f)}
                                                        disabled={busyId === f.id || renamingId === f.id}
                                                    >
                                                        <EditRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={() => requestDelete(f)}
                                                        disabled={busyId === f.id}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                        sx={{ pr: 14 }}
                                    >
                                        {renamingId === f.id ? (
                                            <TextField
                                                size="small"
                                                value={renameValue}
                                                autoFocus
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onBlur={() => commitRename(f)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') commitRename(f);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                inputProps={{ maxLength: 80 }}
                                                helperText={rowErr || undefined}
                                                error={Boolean(rowErr)}
                                                sx={{ flex: 1 }}
                                            />
                                        ) : (
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                                                            {f.name}
                                                        </Typography>
                                                        {f.is_default && (
                                                            <Typography
                                                                component="span"
                                                                sx={{
                                                                    fontSize: 10.5,
                                                                    fontWeight: 700,
                                                                    color: 'warning.main',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: 0.4,
                                                                }}
                                                            >
                                                                Default
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        )}
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* Delete-confirmation dialog. Sibling (not nested) of the manage
            dialog so MUI's focus trap behaves correctly when both are open. */}
            <Dialog
                open={Boolean(confirmDelete)}
                onClose={cancelDelete}
                maxWidth="xs"
                fullWidth
                // Deleting is irreversible — ensure a stray Enter press doesn't
                // confirm by autofocusing Cancel instead of the destructive action.
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Delete this filter?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {confirmDelete
                            ? <>You&apos;re about to delete <strong>&ldquo;{confirmDelete.name}&rdquo;</strong>. This can&apos;t be undone.</>
                            : null}
                    </Typography>
                    {deleteErr && (
                        <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
                            {deleteErr}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} disabled={deleting} autoFocus>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDeleteNow}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

ManageFiltersDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onToggleDefault: PropTypes.func.isRequired,
};

/* ─────────────────────────── main component ─────────────────────────── */

export default function SavedFiltersMenu({
                                             tab,
                                             viewer = null,
                                             currentPayload = null,
                                             onApply = null,
                                             buttonSx = null,
                                         }) {
    const {
        filters,
        loading,
        error,
        saveNew,
        update,
        remove,
        setDefault,
    } = useSavedFilters({ tab, viewer });

    const [anchorEl, setAnchorEl] = useState(null);
    const [saveOpen, setSaveOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Match the app's general ID-detection pattern — user objects in
    // this codebase sometimes expose the ID as `id`, sometimes `_id`,
    // `user_id`, or `userId` depending on where they were constructed.
    // Any of those being truthy means we have a signed-in viewer.
    const viewerId = viewer?.id ?? viewer?._id ?? viewer?.user_id ?? viewer?.userId ?? null;
    const signedIn = viewerId != null && viewerId !== '';

    const openMenu = (e) => setAnchorEl(e.currentTarget);
    const closeMenu = () => setAnchorEl(null);

    const handleApply = useCallback(
        (filter) => {
            closeMenu();
            if (typeof onApply === 'function') onApply(filter);
        },
        [onApply]
    );

    const handleOpenSave = useCallback(() => {
        closeMenu();
        setSaveOpen(true);
    }, []);

    const handleOpenManage = useCallback(() => {
        closeMenu();
        setManageOpen(true);
    }, []);

    const handleSaveNew = useCallback(
        async ({ name, isDefault }) => {
            setSaving(true);
            try {
                await saveNew({
                    name,
                    payload: currentPayload || {},
                    isDefault,
                });
            } finally {
                setSaving(false);
            }
        },
        [saveNew, currentPayload]
    );

    const handleRename = useCallback(
        async (id, name) => { await update(id, { name }); },
        [update]
    );

    const menuItems = useMemo(() => filters, [filters]);

    // Hide entirely when signed out — a disabled button would just
    // prompt "why can't I click this?"
    if (!signedIn) return null;

    return (
        <>
            <Tooltip title="Saved filters">
                <span>
                    <IconButton
                        size="small"
                        onClick={openMenu}
                        aria-label="Saved filters"
                        aria-haspopup="menu"
                        aria-expanded={Boolean(anchorEl)}
                        sx={(t) => ({
                            border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
                            borderRadius: 2,
                            width: 36,
                            height: 36,
                            color: 'primary.main',
                            bgcolor: alpha(t.palette.primary.main, 0.06),
                            transition: 'background-color 160ms ease, transform 160ms ease',
                            '&:hover': {
                                bgcolor: alpha(t.palette.primary.main, 0.12),
                                transform: 'scale(1.04)',
                            },
                            ...(buttonSx || {}),
                        })}
                    >
                        <BookmarksRoundedIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
                slotProps={{
                    paper: {
                        sx: {
                            minWidth: 260,
                            maxWidth: 320,
                            mt: 0.5,
                        },
                    },
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {/* Header */}
                <Box sx={{ px: 2, py: 1, minWidth: 240 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        Saved filters
                    </Typography>
                </Box>

                {loading && (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    </MenuItem>
                )}

                {!loading && error && (
                    <MenuItem disabled>
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    </MenuItem>
                )}

                {!loading && !error && menuItems.length === 0 && (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                            No saved filters yet.
                        </Typography>
                    </MenuItem>
                )}

                {!loading && !error && menuItems.map((f) => (
                    <MenuItem key={f.id} onClick={() => handleApply(f)}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {f.is_default
                                ? <StarRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                : <StarOutlineRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                            }
                        </ListItemIcon>
                        <ListItemText
                            primary={f.name}
                            primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: f.is_default ? 700 : 500,
                                noWrap: true,
                            }}
                        />
                    </MenuItem>
                ))}

                <Divider />

                <MenuItem onClick={handleOpenSave}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        <AddRoundedIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Save current filter…"
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                    />
                </MenuItem>

                {menuItems.length > 0 && (
                    <MenuItem onClick={handleOpenManage}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <SettingsRoundedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Manage…"
                            primaryTypographyProps={{ fontSize: 14 }}
                        />
                    </MenuItem>
                )}
            </Menu>

            <SaveFilterDialog
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                onSave={handleSaveNew}
                saving={saving}
            />

            <ManageFiltersDialog
                open={manageOpen}
                onClose={() => setManageOpen(false)}
                filters={menuItems}
                onRename={handleRename}
                onDelete={remove}
                onToggleDefault={setDefault}
            />
        </>
    );
}

SavedFiltersMenu.propTypes = {
    tab: PropTypes.oneOf(['posts', 'groups', 'news']).isRequired,
    viewer: PropTypes.object,
    currentPayload: PropTypes.object,
    onApply: PropTypes.func,
    buttonSx: PropTypes.object,
};

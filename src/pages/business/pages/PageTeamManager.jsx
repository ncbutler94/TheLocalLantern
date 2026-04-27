// src/pages/business/components/pages/PageTeamManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';

import { createPageInvite, fetchPageMembers, updatePageMember } from '../api/pagesApi';

const ROLE_OPTIONS = ['owner', 'admin', 'editor', 'viewer'];

const safeStr = (v) => String(v ?? '').trim();

const initials = (u) => {
    const first = safeStr(u?.first_name);
    const last = safeStr(u?.last_name);
    const a = first ? first[0] : 'U';
    const b = last ? last[0] : '';
    return `${a}${b}`.toUpperCase();
};

const avatarSrc = (u) => u?.avatar_url || u?.profile_picture || '';

export default function PageTeamManager({ pageId, pageName = '' }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteResult, setInviteResult] = useState(null);

    const [mutating, setMutating] = useState(false);

    const canInvite = useMemo(() => {
        const e = safeStr(inviteEmail).toLowerCase();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
        return emailOk && ROLE_OPTIONS.includes(inviteRole);
    }, [inviteEmail, inviteRole]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchPageMembers(pageId);
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            setError(String(e?.message || 'Failed to load team.'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageId]);

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(String(text || ''));
        } catch {
            // ignore
        }
    };

    const createInvite = async () => {
        if (!canInvite || inviteLoading) return;
        setInviteLoading(true);
        setInviteError('');
        setInviteResult(null);
        try {
            const data = await createPageInvite(pageId, { email: inviteEmail, role: inviteRole });
            setInviteResult(data);

            // Clear inputs after success
            setInviteEmail('');
            setInviteRole('editor');

            // Refresh members (status stays accurate)
            void load();
        } catch (e) {
            setInviteError(String(e?.message || 'Failed to create invite.'));
        } finally {
            setInviteLoading(false);
        }
    };

    const inviteLink = useMemo(() => {
        const token = inviteResult?.token ? String(inviteResult.token) : '';
        if (!token) return '';
        // We’ll build an Accept Invite page later. For now, this link is what we’ll route to.
        return `${window.location.origin}/pages/invite?token=${encodeURIComponent(token)}`;
    }, [inviteResult?.token]);

    const updateRole = async (userId, nextRole) => {
        if (mutating) return;
        setMutating(true);
        try {
            await updatePageMember(pageId, userId, { role: nextRole });
            await load();
        } catch (e) {
            setError(String(e?.message || 'Failed to update role.'));
        } finally {
            setMutating(false);
        }
    };

    const revokeMember = async (userId) => {
        if (mutating) return;
        setMutating(true);
        try {
            await updatePageMember(pageId, userId, { status: 'revoked' });
            await load();
        } catch (e) {
            setError(String(e?.message || 'Failed to revoke member.'));
        } finally {
            setMutating(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                borderRadius: 3,
                overflow: 'hidden',
                borderColor: alpha(t.palette.primary.main, 0.12),
                bgcolor: alpha(t.palette.common.white, 0.62),
                backdropFilter: 'saturate(140%) blur(10px)',
                backgroundImage: 'none',
                boxShadow: 'none',
            })}
        >
            <Box
                sx={(t) => ({
                    px: { xs: 1.5, sm: 2 },
                    py: 1.35,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    borderBottom: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.10),
                })}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <GroupRoundedIcon sx={{ color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 950 }} noWrap>
                        Team {pageName ? `• ${pageName}` : ''}
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={load}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                >
                    Refresh
                </Button>
            </Box>

            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {error ? (
                    <Alert severity="error" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                        {error}
                    </Alert>
                ) : null}

                <Typography sx={{ fontWeight: 950, mb: 0.75 }}>Invite a teammate</Typography>

                {inviteError ? (
                    <Alert severity="error" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                        {inviteError}
                    </Alert>
                ) : null}

                {inviteResult?.token ? (
                    <Alert
                        severity="success"
                        sx={{ borderRadius: 2.5, mb: 1.25 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<ContentCopyRoundedIcon />}
                                onClick={() => copy(inviteLink)}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                            >
                                Copy link
                            </Button>
                        }
                    >
                        Invite created. Share this link: <strong>{inviteLink}</strong>
                    </Alert>
                ) : null}

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 160px 160px' },
                        gap: 1,
                        alignItems: 'center',
                    }}
                >
                    <TextField
                        label="Email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        fullWidth
                    />

                    <Select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        {ROLE_OPTIONS.map((r) => (
                            <MenuItem key={r} value={r}>
                                {r}
                            </MenuItem>
                        ))}
                    </Select>

                    <Button
                        variant="contained"
                        startIcon={<PersonAddRoundedIcon />}
                        onClick={createInvite}
                        disabled={!canInvite || inviteLoading}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950 }}
                    >
                        {inviteLoading ? 'Inviting…' : 'Invite'}
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: 950, mb: 0.75 }}>Members</Typography>

                {loading ? (
                    <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                        Loading members…
                    </Alert>
                ) : items.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontWeight: 750 }}>
                        No members found.
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {items.map((m) => {
                            const uid = Number(m?.user_id || 0);
                            const role = safeStr(m?.role) || 'viewer';
                            const status = safeStr(m?.status) || 'active';
                            const name = `${safeStr(m?.first_name)} ${safeStr(m?.last_name)}`.trim() || (m?.handle ? `@${m.handle}` : 'User');

                            return (
                                <Paper
                                    key={`${uid}-${role}-${status}`}
                                    variant="outlined"
                                    sx={(t) => ({
                                        borderRadius: 2.5,
                                        p: 1.25,
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        bgcolor: alpha(t.palette.background.paper, 0.6),
                                        display: 'flex',
                                        gap: 1.25,
                                        alignItems: 'center',
                                    })}
                                >
                                    <Avatar
                                        src={avatarSrc(m) || undefined}
                                        sx={(t) => ({
                                            width: 46,
                                            height: 46,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: alpha(t.palette.primary.main, 0.10),
                                            fontWeight: 950,
                                        })}
                                    >
                                        {initials(m)}
                                    </Avatar>

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: 950 }} noWrap>
                                            {name}
                                        </Typography>
                                        {m?.handle ? (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }} noWrap>
                                                @{m.handle}
                                            </Typography>
                                        ) : null}
                                        <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip size="small" label={status} sx={{ borderRadius: 999, fontWeight: 900 }} />
                                        </Box>
                                    </Box>

                                    <Select
                                        value={role}
                                        onChange={(e) => updateRole(uid, e.target.value)}
                                        size="small"
                                        disabled={mutating || status !== 'active'}
                                        sx={{ width: 140, borderRadius: 2 }}
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <MenuItem key={r} value={r}>
                                                {r}
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<RemoveCircleOutlineRoundedIcon />}
                                        onClick={() => revokeMember(uid)}
                                        disabled={mutating || status !== 'active' || role === 'owner'}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, whiteSpace: 'nowrap' }}
                                    >
                                        Remove
                                    </Button>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}

                <Typography color="text.secondary" sx={{ mt: 1.5, fontWeight: 750 }}>
                    Next: we’ll add the Accept Invite page at <code>/pages/invite</code> so recipients can join in one click.
                </Typography>
            </Box>
        </Paper>
    );
}

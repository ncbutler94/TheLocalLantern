// src/pages/admin/AdminClaimsPage.jsx
//
// Admin review queue for business claim requests.
// Route: /admin/claims
//
// Features:
//   - Tab-style status filter (Pending / Approved / Rejected / All)
//   - Per-claim card showing business info + claimant info + message
//   - Approve action: promotes unclaimed business to real businesses row
//   - Reject action: requires a reason (user-facing)
//   - Refresh after each decision
//
// Assumes the route is protected by admin middleware upstream.
// If the user isn't admin, API calls will return 403 and we surface that.

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Stack,
    Button,
    Chip,
    Avatar,
    TextField,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Tabs,
    Tab,
    Link as MuiLink,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import {
    adminListClaims,
    adminApproveClaim,
    adminRejectClaim,
} from '../business/api/businessApi';

const STATUS_TABS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
];

const ROLE_LABELS = {
    owner: 'Owner',
    manager: 'Manager',
    marketing: 'Marketing',
    authorized_rep: 'Authorized Rep',
    other: 'Other',
};

function formatDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        });
    } catch {
        return String(iso);
    }
}

function StatusChip({ status }) {
    const styles = {
        pending:  { label: 'Pending',   color: '#b47e00', bg: '#fff3d6' },
        approved: { label: 'Approved',  color: '#15803d', bg: '#dcfce7' },
        rejected: { label: 'Rejected',  color: '#991b1b', bg: '#fee2e2' },
        cancelled:{ label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
    }[status] || { label: status || '—', color: '#6b7280', bg: '#f3f4f6' };
    return (
        <Chip
            size="small"
            label={styles.label}
            sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: styles.color,
                bgcolor: styles.bg,
                border: 'none',
            }}
        />
    );
}

function ClaimCard({ claim, onApprove, onReject, busy }) {
    const [expanded, setExpanded] = useState(false);
    const isPending = claim.status === 'pending';

    const location = [
        claim.business_city,
        claim.business_county && `${claim.business_county} County`,
    ].filter(Boolean).join(', ');

    const userFullName = [claim.user_first_name, claim.user_last_name]
        .filter(Boolean).join(' ') || '(unknown user)';

    const shortMessage = claim.claim_message?.length > 180 && !expanded
        ? claim.claim_message.slice(0, 180) + '…'
        : claim.claim_message;

    return (
        <Paper
            elevation={0}
            sx={(t) => ({
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                border: `1px solid ${t.palette.divider}`,
                bgcolor: 'background.paper',
            })}
        >
            {/* ── Top row: business + status ── */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Avatar
                    src={claim.business_avatar_url || claim.business_cover_url || undefined}
                    alt={claim.business_name}
                    variant="rounded"
                    sx={{ width: 48, height: 48, borderRadius: 1.5 }}
                >
                    <StorefrontRoundedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                        {claim.business_name}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.25 }}>
                        {location}
                        {claim.business_category_key && (
                            <>
                                <Box component="span" sx={{ mx: 0.75 }}>·</Box>
                                {claim.business_category_key}
                            </>
                        )}
                    </Typography>
                    {(claim.business_google_rating || claim.business_google_review_count) && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                            <StarRoundedIcon sx={{ fontSize: 14, color: '#f5a623' }} />
                            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                                {Number(claim.business_google_rating || 0).toFixed(1)}
                                {claim.business_google_review_count && (
                                    <> · {claim.business_google_review_count} reviews</>
                                )}
                            </Typography>
                        </Stack>
                    )}
                </Box>
                <StatusChip status={claim.status} />
            </Stack>

            {/* ── Business extras (website, phone) ── */}
            {(claim.business_website_url || claim.business_phone) && (
                <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 0.5 }}>
                    {claim.business_website_url && (
                        <MuiLink
                            href={claim.business_website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                        >
                            Website <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                        </MuiLink>
                    )}
                    {claim.business_phone && (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {claim.business_phone}
                        </Typography>
                    )}
                </Stack>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* ── Claimant info ── */}
            <Box sx={(t) => ({
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.04),
                border: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                mb: 1.5,
            })}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <PersonRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                        {claim.claimant_name || userFullName}
                    </Typography>
                    <Chip
                        size="small"
                        label={ROLE_LABELS[claim.claimant_role] || claim.claimant_role || 'Other'}
                        sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                    />
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                    <EmailRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {claim.claimant_email}
                    </Typography>
                    {claim.user_email && claim.user_email !== claim.claimant_email && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic', ml: 0.5 }}>
                            (account: {claim.user_email})
                        </Typography>
                    )}
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <ScheduleRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        Submitted {formatDate(claim.created_at)}
                    </Typography>
                </Stack>
            </Box>

            {/* ── The claim message ── */}
            <Typography sx={{
                fontSize: 13, lineHeight: 1.55, color: 'text.primary',
                whiteSpace: 'pre-wrap', mb: 1,
            }}>
                {shortMessage}
            </Typography>
            {claim.claim_message?.length > 180 && (
                <Button
                    size="small"
                    onClick={() => setExpanded((v) => !v)}
                    sx={{ textTransform: 'none', mb: 1, fontSize: 12, p: 0 }}
                >
                    {expanded ? 'Show less' : 'Read more'}
                </Button>
            )}

            {/* ── Rejection reason (if rejected) ── */}
            {claim.status === 'rejected' && claim.rejection_reason && (
                <Alert severity="error" sx={{ mb: 1, fontSize: 12 }}>
                    <strong>Rejected:</strong> {claim.rejection_reason}
                </Alert>
            )}

            {/* ── Approval link (if approved) ── */}
            {claim.status === 'approved' && claim.promoted_business_id && (
                <Alert severity="success" sx={{ mb: 1, fontSize: 12 }}>
                    Approved — business ID {claim.promoted_business_id} was created
                </Alert>
            )}

            {/* ── Action buttons (pending only) ── */}
            {isPending && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                        onClick={() => onApprove(claim)}
                        disabled={busy}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelRoundedIcon sx={{ fontSize: 18 }} />}
                        onClick={() => onReject(claim)}
                        disabled={busy}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                    >
                        Reject
                    </Button>
                </Stack>
            )}
        </Paper>
    );
}

export default function AdminClaimsPage() {
    const [status, setStatus] = useState('pending');
    const [claims, setClaims] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Approve confirm dialog
    const [approveTarget, setApproveTarget] = useState(null);
    const [approveNotes, setApproveNotes] = useState('');

    // Reject dialog
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');

    // Action state
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const result = await adminListClaims({ status, limit: 100, offset: 0 });
            setClaims(Array.isArray(result?.items) ? result.items : []);
            setTotal(Number(result?.total || 0));
        } catch (err) {
            setError(err?.message || 'Failed to load claims.');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    function openApprove(claim) {
        setApproveTarget(claim);
        setApproveNotes('');
        setActionError('');
    }

    function openReject(claim) {
        setRejectTarget(claim);
        setRejectReason('');
        setRejectNotes('');
        setActionError('');
    }

    async function doApprove() {
        if (!approveTarget) return;
        setActionBusy(true);
        setActionError('');
        try {
            const result = await adminApproveClaim(approveTarget.id, { adminNotes: approveNotes || null });
            setActionSuccess(
                `Approved: "${approveTarget.business_name}" is now business ID ${result.business_id}. The claimant has been emailed.`,
            );
            setApproveTarget(null);
            await load();
        } catch (err) {
            setActionError(err?.message || 'Failed to approve.');
        } finally {
            setActionBusy(false);
        }
    }

    async function doReject() {
        if (!rejectTarget) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setActionError('Please provide a rejection reason.');
            return;
        }
        setActionBusy(true);
        setActionError('');
        try {
            await adminRejectClaim(rejectTarget.id, {
                rejectionReason: reason,
                adminNotes: rejectNotes || null,
            });
            setActionSuccess(
                `Rejected: "${rejectTarget.business_name}". The claimant has been emailed with the reason.`,
            );
            setRejectTarget(null);
            await load();
        } catch (err) {
            setActionError(err?.message || 'Failed to reject.');
        } finally {
            setActionBusy(false);
        }
    }

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                    <Typography sx={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'primary.main', mb: 0.25,
                    }}>
                        Admin
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 22, sm: 28 } }}>
                        Claim requests
                    </Typography>
                </Box>
                <Button
                    size="small"
                    startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={load}
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    Refresh
                </Button>
            </Stack>

            {/* Status tabs */}
            <Paper elevation={0} sx={(t) => ({
                mb: 2.5, borderRadius: 999, border: `1px solid ${t.palette.divider}`,
                overflow: 'hidden',
            })}>
                <Tabs
                    value={status}
                    onChange={(_, v) => setStatus(v)}
                    variant="fullWidth"
                    sx={{
                        minHeight: 38,
                        '& .MuiTab-root': {
                            minHeight: 38, textTransform: 'none', fontWeight: 700, fontSize: 13,
                        },
                    }}
                >
                    {STATUS_TABS.map((tab) => (
                        <Tab key={tab.value} value={tab.value} label={tab.label} />
                    ))}
                </Tabs>
            </Paper>

            {/* Action results */}
            {actionSuccess && (
                <Alert severity="success" onClose={() => setActionSuccess('')} sx={{ mb: 2 }}>
                    {actionSuccess}
                </Alert>
            )}

            {/* Loading / errors / empty states */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {!loading && !error && claims.length === 0 && (
                <Paper elevation={0} sx={(t) => ({
                    p: 6, borderRadius: 3, border: `1px solid ${t.palette.divider}`,
                    textAlign: 'center',
                })}>
                    <Typography sx={{ color: 'text.secondary' }}>
                        No claims {status === 'all' ? 'yet' : `in status "${status}"`}.
                    </Typography>
                </Paper>
            )}

            {/* Claim list */}
            {!loading && !error && claims.length > 0 && (
                <>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1.5 }}>
                        Showing {claims.length} of {total} {status === 'all' ? '' : status} claim{total === 1 ? '' : 's'}
                    </Typography>
                    <Stack spacing={2}>
                        {claims.map((claim) => (
                            <ClaimCard
                                key={claim.id}
                                claim={claim}
                                onApprove={openApprove}
                                onReject={openReject}
                                busy={actionBusy}
                            />
                        ))}
                    </Stack>
                </>
            )}

            {/* ── APPROVE CONFIRMATION DIALOG ── */}
            <Dialog open={!!approveTarget} onClose={() => !actionBusy && setApproveTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Approve claim?
                </DialogTitle>
                <DialogContent>
                    {approveTarget && (
                        <>
                            <Typography sx={{ mb: 2, fontSize: 14 }}>
                                This will:
                            </Typography>
                            <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3, fontSize: 13, color: 'text.secondary' }}>
                                <li>Create a new <strong>businesses</strong> row for "{approveTarget.business_name}"</li>
                                <li>Link <strong>{approveTarget.claimant_email}</strong> as the owner</li>
                                <li>Deactivate the unclaimed listing</li>
                                <li>Email the claimant a welcome message</li>
                            </Box>
                            <TextField
                                label="Admin notes (internal only, optional)"
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                                size="small"
                                placeholder="Why you approved this, any context for future reference"
                            />
                            {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setApproveTarget(null)}
                        disabled={actionBusy}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={doApprove}
                        disabled={actionBusy}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                    >
                        {actionBusy ? <CircularProgress size={20} color="inherit" /> : 'Approve claim'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── REJECT DIALOG ── */}
            <Dialog open={!!rejectTarget} onClose={() => !actionBusy && setRejectTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Reject claim
                </DialogTitle>
                <DialogContent>
                    {rejectTarget && (
                        <>
                            <Typography sx={{ mb: 2, fontSize: 14, color: 'text.secondary' }}>
                                The claimant will be emailed with your reason.
                            </Typography>
                            <TextField
                                label="Reason (visible to claimant)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                fullWidth
                                multiline
                                minRows={3}
                                required
                                size="small"
                                placeholder="We couldn't verify your connection to this business. Please resubmit with proof (business license, utility bill, etc.)"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Admin notes (internal only, optional)"
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                                size="small"
                                placeholder="Why you rejected this, any red flags"
                            />
                            {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setRejectTarget(null)}
                        disabled={actionBusy}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={doReject}
                        disabled={actionBusy || !rejectReason.trim()}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                    >
                        {actionBusy ? <CircularProgress size={20} color="inherit" /> : 'Reject claim'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

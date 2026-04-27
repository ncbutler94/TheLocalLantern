import React, { useCallback, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import BlockIcon from '@mui/icons-material/Block';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';

function getAvatarSrc(r) {
    return r?.avatar_url || r?.avatarUrl || r?.profile_picture || r?.profilePic || '';
}

function getDisplayName(r) {
    const name = String(r?.name || '').trim();
    if (name) return name;
    const first = String(r?.first_name || r?.firstName || '').trim();
    const last = String(r?.last_name || r?.lastName || '').trim();
    return [first, last].filter(Boolean).join(' ') || r?.handle || 'Unknown';
}

function getHandle(r) {
    return r?.handle || '';
}

function getUserId(r) {
    return r?.user_id ?? r?.userId ?? r?.id ?? r?.request_user_id ?? r?.requestUserId ?? null;
}

function parseAnswers(r) {
    try {
        const raw = r?.join_answers_json || r?.joinAnswersJson;
        if (!raw) return [];
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

/**
 * GroupAdminJoinRequestsSection
 *
 * Displays pending join requests with user info and their answers
 * to the group's screening questions (if any).
 *
 * Actions: Approve, Deny, Ban from group, Timeout.
 */
export default function GroupAdminJoinRequestsSection({
                                                          groupId,
                                                          group,
                                                          requests = [],
                                                          busy = false,
                                                          onApproveRequest,
                                                          onDenyRequest,
                                                          onBanUser,
                                                          onTimeoutUser,
                                                          onToast,
                                                      }) {
    const joinQuestions = useMemo(() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [group]);

    // Ban confirmation dialog
    const [banDialog, setBanDialog] = useState({ open: false, userId: null, name: '' });

    // Timeout dialog
    const [timeoutDialog, setTimeoutDialog] = useState({ open: false, userId: null, name: '' });
    const [timeoutDuration, setTimeoutDuration] = useState(60);

    const handleOpenBan = useCallback((userId, name) => {
        setBanDialog({ open: true, userId, name });
    }, []);

    const handleConfirmBan = useCallback(async () => {
        const { userId, name } = banDialog;
        if (!userId) return;
        setBanDialog({ open: false, userId: null, name: '' });
        if (typeof onBanUser === 'function') {
            await onBanUser(userId, name);
        }
    }, [banDialog, onBanUser]);

    const handleOpenTimeout = useCallback((userId, name) => {
        setTimeoutDuration(60);
        setTimeoutDialog({ open: true, userId, name });
    }, []);

    const handleConfirmTimeout = useCallback(async () => {
        const { userId, name } = timeoutDialog;
        if (!userId) return;
        setTimeoutDialog({ open: false, userId: null, name: '' });
        if (typeof onTimeoutUser === 'function') {
            await onTimeoutUser(userId, name, timeoutDuration);
        }
    }, [timeoutDialog, timeoutDuration, onTimeoutUser]);

    const hasQuestions = joinQuestions.length > 0;

    if (!requests.length) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.secondary' }}>
                    No pending join requests.
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    New requests will appear here when members request to join.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 0.5 }}>
                    Pending Requests ({requests.length})
                </Typography>

                {requests.map((r, idx) => {
                    const answers = parseAnswers(r);
                    const displayName = getDisplayName(r);
                    const handle = getHandle(r);
                    const avatarSrc = getAvatarSrc(r);
                    const userId = getUserId(r);
                    const requestedAt = r?.requested_at || r?.requestedAt || r?.created_at || '';

                    return (
                        <Paper
                            key={r?.user_id || r?.id || idx}
                            variant="outlined"
                            sx={{
                                borderRadius: 3,
                                overflow: 'hidden',
                            }}
                        >
                            {/* User info header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, pb: answers.length > 0 ? 1.5 : 2 }}>
                                <Avatar
                                    src={avatarSrc}
                                    sx={{ width: 40, height: 40, fontWeight: 800, fontSize: 15 }}
                                >
                                    {displayName?.[0]?.toUpperCase() || '?'}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>
                                        {displayName}
                                        {r?.is_verified ? ' ✓' : ''}
                                    </Typography>
                                    {handle && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            @{handle}
                                        </Typography>
                                    )}
                                </Box>
                                {requestedAt && (
                                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, flexShrink: 0 }}>
                                        {timeAgo(requestedAt)}
                                    </Typography>
                                )}
                            </Box>

                            {/* Join answers */}
                            {answers.length > 0 && (
                                <>
                                    <Divider />
                                    <Box sx={{ px: 2, py: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.02) }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <QuestionAnswerOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Join Answers
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {answers.map((a, ai) => (
                                                <Box key={ai}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                            {a.question}
                                                        </Typography>
                                                        {a.required ? (
                                                            <Chip
                                                                label="Required"
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                sx={{ fontWeight: 700, fontSize: 9, height: 16 }}
                                                            />
                                                        ) : null}
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: 13,
                                                            color: a.answer ? 'text.primary' : 'text.disabled',
                                                            fontStyle: a.answer ? 'normal' : 'italic',
                                                            pl: 0.5,
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {a.answer || 'No answer provided'}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </>
                            )}

                            {/* Actions */}
                            <Divider />
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 1,
                                    px: 2,
                                    py: 1.25,
                                    flexWrap: 'wrap',
                                    rowGap: 0.75,
                                }}
                            >
                                {/* Moderation actions (left side) */}
                                {userId && (
                                    <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
                                        <Tooltip title="Ban this user from the group">
                                            <span>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<BlockIcon />}
                                                    onClick={() => handleOpenBan(userId, displayName)}
                                                    disabled={busy}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2 }}
                                                >
                                                    Ban
                                                </Button>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Timeout this user">
                                            <span>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    startIcon={<TimerIcon />}
                                                    onClick={() => handleOpenTimeout(userId, displayName)}
                                                    disabled={busy}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2 }}
                                                >
                                                    Timeout
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                )}

                                {/* Approve / Deny (right side) */}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<HighlightOffIcon />}
                                    onClick={() => onDenyRequest?.(r)}
                                    disabled={busy}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2 }}
                                >
                                    Deny
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircleOutlineIcon />}
                                    onClick={() => onApproveRequest?.(r)}
                                    disabled={busy}
                                    disableElevation
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, px: 2 }}
                                >
                                    Approve
                                </Button>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            {/* ── Ban confirmation dialog ──────────────────────────────────── */}
            <Dialog
                open={banDialog.open}
                onClose={() => !busy && setBanDialog({ open: false, userId: null, name: '' })}
                maxWidth="xs"
                fullWidth
                transitionDuration={{ enter: 220, exit: 180 }}
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <WarningAmberIcon color="error" />
                    Ban user
                    <IconButton
                        onClick={() => setBanDialog({ open: false, userId: null, name: '' })}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        Are you sure you want to permanently ban{' '}
                        <strong>{banDialog.name || 'this user'}</strong> from the group?
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.7, fontWeight: 600 }}>
                        They will be removed and will no longer be able to view or post in this group.
                        Their join request will also be denied.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setBanDialog({ open: false, userId: null, name: '' })}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmBan}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950 }}
                    >
                        {busy ? 'Banning...' : 'Ban permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Timeout confirmation dialog ─────────────────────────────── */}
            <Dialog
                open={timeoutDialog.open}
                onClose={() => !busy && setTimeoutDialog({ open: false, userId: null, name: '' })}
                maxWidth="xs"
                fullWidth
                transitionDuration={{ enter: 220, exit: 180 }}
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 4 }, mx: { xs: 2, sm: 'auto' } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                    <TimerIcon color="warning" />
                    Timeout user
                    <IconButton
                        onClick={() => setTimeoutDialog({ open: false, userId: null, name: '' })}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        size="small"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>
                        Timeout <strong>{timeoutDialog.name || 'this user'}</strong> — they won&apos;t be able to
                        post or comment for the selected duration. Their join request will also be denied.
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Duration</InputLabel>
                        <Select
                            value={timeoutDuration}
                            onChange={(e) => setTimeoutDuration(e.target.value)}
                            label="Duration"
                        >
                            <MenuItem value={5}>5 minutes</MenuItem>
                            <MenuItem value={15}>15 minutes</MenuItem>
                            <MenuItem value={60}>1 hour</MenuItem>
                            <MenuItem value={360}>6 hours</MenuItem>
                            <MenuItem value={1440}>24 hours</MenuItem>
                            <MenuItem value={4320}>3 days</MenuItem>
                            <MenuItem value={10080}>1 week</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button
                        onClick={() => setTimeoutDialog({ open: false, userId: null, name: '' })}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleConfirmTimeout}
                        disabled={busy}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950 }}
                    >
                        {busy ? 'Processing...' : 'Confirm Timeout'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

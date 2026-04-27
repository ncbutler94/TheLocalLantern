import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/components/PollDisplay.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Chip,
    Tooltip,
} from '@mui/material';
import { alpha as alphaColor } from '@mui/material/styles';
import HowToVoteRoundedIcon from '@mui/icons-material/HowToVoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import TimerOffRoundedIcon from '@mui/icons-material/TimerOffRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { useAuth } from '../../../components/AuthModalContext';

const api = process.env.REACT_APP_API_URL || '';

/* ─── Time-remaining helper ─── */
function formatTimeRemaining(expiresIso) {
    if (!expiresIso) return null;
    const diff = new Date(expiresIso).getTime() - Date.now();
    if (diff <= 0) return null;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes % 60}m left`;
    if (minutes > 0) return `${minutes}m left`;
    return 'Less than a minute left';
}

/* ─── "Ended" timestamp formatter ─── */
function formatEndedAt(expiresIso) {
    if (!expiresIso) return '';
    const d = new Date(expiresIso);
    if (Number.isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * PollDisplay — renders poll options for community posts.
 *
 * Props:
 *   poll             — { totalVotes, viewerVoteOptionId, pollExpiresAt, expired, options: [...] }
 *   postId           — community post id (used for the vote API call)
 *   variant          — "card" | "full"
 *   onVoted          — optional callback after a successful vote
 *   onCardClick      — card variant click handler
 *   post             — full post object (passed through for card click)
 *   groupId          — optional group context for vote URL
 *   isNonPersonal    — true when viewer is on a business/artist account (blocks voting)
 *   activeBusinessId — current business account ID (passed to vote API)
 *   activeArtistId   — current artist account ID (passed to vote API)
 */
export default function PollDisplay({
                                        poll,
                                        postId,
                                        variant = 'full',
                                        onVoted,
                                        onCardClick,
                                        post,
                                        groupId,
                                        isNonPersonal = false,
                                        activeBusinessId = null,
                                        activeArtistId = null,
                                        groupMembershipGated = false,
                                        onJoinGroup = null,
                                        user = undefined,
                                    }) {
    const auth = useAuth();
    const viewer = user !== undefined ? user : auth?.user || null;

    /** Robust login-popup opener */
    const openAuthPopup = useCallback(() => {
        try {
            if (auth && typeof auth.open === 'function') auth.open();
            else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
            else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
            else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
        } catch { /* ignore */ }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch { /* ignore */ }
    }, [auth]);

    const [localPoll, setLocalPoll] = useState(null);
    const [voting, setVoting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [accountError, setAccountError] = useState('');
    const timerRef = useRef(null);

    const activePoll = localPoll || poll;
    const options = activePoll?.options || [];
    const totalVotes = activePoll?.totalVotes ?? 0;
    const viewerVoted = activePoll?.viewerVoteOptionId != null;
    const viewerVoteId = activePoll?.viewerVoteOptionId ?? null;

    /* ─── Expiry state ─── */
    const pollExpiresAt = activePoll?.pollExpiresAt ?? activePoll?.poll_expires_at ?? null;
    const isExpiredFromServer = Boolean(activePoll?.expired);
    const isExpiredClient = pollExpiresAt
        ? new Date(pollExpiresAt).getTime() <= Date.now()
        : false;
    const isExpired = isExpiredFromServer || isExpiredClient;
    const hasExpiry = Boolean(pollExpiresAt);

    // Voting is blocked when expired OR when on a non-personal account OR when not a group member
    const votingBlocked = isExpired || isNonPersonal || groupMembershipGated;

    // In expired state, always show results (even if viewer hasn't voted)
    const showResults = isExpired || viewerVoted;

    // Clear account error when switching back to personal
    useEffect(() => {
        if (!isNonPersonal) setAccountError('');
    }, [isNonPersonal]);

    /* ─── Countdown timer for active polls with expiry ─── */
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (!hasExpiry || isExpired || variant === 'card') {
            setTimeLeft(null);
            return undefined;
        }

        const update = () => {
            const remaining = formatTimeRemaining(pollExpiresAt);
            setTimeLeft(remaining);
        };
        update();
        timerRef.current = setInterval(update, 30000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [hasExpiry, isExpired, pollExpiresAt, variant]);

    /* ─── Vote handler (blocked when expired or non-personal account or not a group member) ─── */
    const handleVote = useCallback(async (optionId) => {
        if (voting || !postId || isExpired) return;

        // Require login
        if (!viewer) {
            openAuthPopup();
            return;
        }

        // Client-side block for non-group-members
        if (groupMembershipGated) {
            setAccountError('You must join this group to vote on polls.');
            return;
        }

        // Client-side block for non-personal accounts
        if (isNonPersonal) {
            setAccountError('Switch to your personal profile to vote on polls.');
            return;
        }

        setAccountError('');
        setVoting(true);
        try {
            const voteUrl = groupId
                ? `${api}/api/groups/${encodeURIComponent(groupId)}/polls/${encodeURIComponent(postId)}/vote`
                : `${api}/api/community/polls/${encodeURIComponent(postId)}/vote`;

            // Include account identity so the backend can enforce personal-only voting
            const voteBody = { optionId };
            if (activeBusinessId) voteBody.activeBusinessId = activeBusinessId;
            if (activeArtistId) voteBody.activeArtistId = activeArtistId;

            const res = await secureFetch(voteUrl, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voteBody),
            });

            if (res.ok) {
                const data = await res.json();
                setLocalPoll(data);
                if (onVoted) onVoted(data);
            } else {
                // Handle server-side account block
                try {
                    const err = await res.json();
                    if (err?.code === 'NON_PERSONAL_ACCOUNT' || res.status === 403) {
                        setAccountError(err?.message || 'Switch to your personal profile to vote.');
                    }
                } catch {
                    // silent
                }
            }
        } catch {
            // silent
        } finally {
            setVoting(false);
        }
    }, [voting, postId, onVoted, groupId, isExpired, isNonPersonal, groupMembershipGated, activeBusinessId, activeArtistId, viewer, openAuthPopup]);

    /* ─── Find winning option(s) for expired polls ─── */
    const winningOptionIds = isExpired && options.length > 0
        ? (() => {
            const maxVotes = Math.max(...options.map((o) => o.votes ?? 0));
            if (maxVotes === 0) return [];
            return options.filter((o) => (o.votes ?? 0) === maxVotes).map((o) => o.id);
        })()
        : [];


    /* ═══════════════════════════════════════════════════════════════
       CARD variant — inline poll preview for the feed list.
       Shows compact option rows (≤ 4 options) with voting support.
       Closed polls show results with winner. 5+ options fall back to chip.
       ═══════════════════════════════════════════════════════════════ */
    if (variant === 'card') {
        const showInline = options.length > 0 && options.length <= 4;
        const cardShowResults = isExpired || viewerVoted;

        // Winner info for closed polls
        const cardWinnerOpt = isExpired && winningOptionIds.length > 0
            ? options.find((o) => winningOptionIds.includes(o.id))
            : null;

        // Fallback chip for > 4 options
        if (!showInline) {
            return (
                <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {/* Winner banner for closed polls with many options */}
                    {isExpired && cardWinnerOpt && (
                        <Box
                            sx={(t) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1,
                                py: 0.5,
                                borderRadius: '8px',
                                bgcolor: alphaColor(t.palette.success.main, 0.07),
                                border: '1px solid',
                                borderColor: alphaColor(t.palette.success.main, 0.2),
                            })}
                        >
                            <EmojiEventsRoundedIcon sx={{ fontSize: 15, color: 'success.main' }} />
                            <Typography variant="caption" noWrap sx={{ fontWeight: 800, fontSize: 11.5, color: 'success.dark', flex: 1, minWidth: 0 }}>
                                Winner: {cardWinnerOpt.label}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: 'success.main', flexShrink: 0 }}>
                                {(cardWinnerOpt.percent ?? 0)}%
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            icon={isExpired
                                ? <TimerOffRoundedIcon sx={{ fontSize: 16 }} />
                                : <HowToVoteRoundedIcon sx={{ fontSize: 16 }} />
                            }
                            label={isExpired ? 'Final Results' : (viewerVoted ? 'View Results' : 'View Poll')}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onCardClick) onCardClick(post);
                            }}
                            sx={(t) => ({
                                fontWeight: 800,
                                fontSize: 12,
                                borderRadius: 999,
                                bgcolor: isExpired
                                    ? alphaColor(t.palette.text.secondary, 0.08)
                                    : alphaColor(t.palette.primary.main, 0.08),
                                border: '1px solid',
                                borderColor: isExpired
                                    ? alphaColor(t.palette.text.secondary, 0.2)
                                    : alphaColor(t.palette.primary.main, 0.2),
                                color: isExpired ? 'text.secondary' : 'primary.main',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: isExpired
                                        ? alphaColor(t.palette.text.secondary, 0.14)
                                        : alphaColor(t.palette.primary.main, 0.14),
                                },
                                '& .MuiChip-icon': { color: isExpired ? 'text.secondary' : 'primary.main' },
                            })}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11.5 }}>
                            {options.length} options
                            {totalVotes > 0 ? ` · ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}` : ''}
                            {isExpired ? ' · Closed' : ''}
                        </Typography>
                    </Box>
                </Box>
            );
        }

        // Inline options for ≤ 4 options
        return (
            <Box
                sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Winner banner for closed polls */}
                {isExpired && cardWinnerOpt && (
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1,
                            py: 0.5,
                            borderRadius: '8px',
                            bgcolor: alphaColor(t.palette.success.main, 0.07),
                            border: '1px solid',
                            borderColor: alphaColor(t.palette.success.main, 0.2),
                        })}
                    >
                        <EmojiEventsRoundedIcon sx={{ fontSize: 15, color: 'success.main' }} />
                        <Typography variant="caption" noWrap sx={{ fontWeight: 800, fontSize: 11.5, color: 'success.dark', flex: 1, minWidth: 0 }}>
                            Winner: {cardWinnerOpt.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: 'success.main', flexShrink: 0 }}>
                            {(cardWinnerOpt.percent ?? 0)}%
                        </Typography>
                    </Box>
                )}

                {/* Compact option rows */}
                {options.map((opt) => {
                    const pct = opt.percent ?? 0;
                    const isSelected = viewerVoteId != null && Number(viewerVoteId) === Number(opt.id);
                    const isWinner = isExpired && winningOptionIds.includes(opt.id);
                    const isClickable = !votingBlocked && !voting;

                    return (
                        <Box
                            key={opt.id}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isClickable) handleVote(opt.id);
                                else if (onCardClick) onCardClick(post);
                            }}
                            onKeyDown={isClickable ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleVote(opt.id);
                                }
                            } : undefined}
                            sx={(t) => ({
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1,
                                py: 0.65,
                                borderRadius: '10px',
                                border: '1.5px solid',
                                borderColor: isWinner
                                    ? alphaColor(t.palette.success.main, 0.45)
                                    : isSelected
                                        ? alphaColor(t.palette.primary.main, 0.4)
                                        : alphaColor(t.palette.common.black, 0.08),
                                bgcolor: isWinner
                                    ? alphaColor(t.palette.success.main, 0.05)
                                    : isSelected
                                        ? alphaColor(t.palette.primary.main, 0.04)
                                        : alphaColor(t.palette.common.black, 0.01),
                                cursor: isClickable ? 'pointer' : (votingBlocked ? 'default' : 'wait'),
                                overflow: 'hidden',
                                transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                                ...(isClickable && {
                                    '&:hover': {
                                        borderColor: alphaColor(t.palette.primary.main, 0.35),
                                        bgcolor: alphaColor(t.palette.primary.main, 0.05),
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    },
                                }),
                            })}
                        >
                            {/* Background progress bar */}
                            {cardShowResults && (
                                <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: '100%',
                                        borderRadius: '10px',
                                        bgcolor: 'transparent',
                                        opacity: isWinner ? 0.2 : (isSelected ? 0.15 : 0.08),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: '10px',
                                            bgcolor: isWinner ? 'success.main' : 'primary.main',
                                        },
                                    }}
                                />
                            )}

                            {/* Icon */}
                            {isSelected ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: isWinner ? 'success.main' : 'primary.main', flexShrink: 0, zIndex: 1 }} />
                            ) : (
                                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0, zIndex: 1 }} />
                            )}

                            {/* Label */}
                            <Typography
                                variant="caption"
                                noWrap
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontWeight: isWinner ? 800 : (isSelected ? 700 : 600),
                                    fontSize: 12.5,
                                    lineHeight: 1.3,
                                    zIndex: 1,
                                    color: isWinner ? 'success.dark' : 'text.primary',
                                }}
                            >
                                {opt.label}
                            </Typography>

                            {/* Percent */}
                            {cardShowResults && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 12,
                                        flexShrink: 0,
                                        zIndex: 1,
                                        color: isWinner ? 'success.main' : isSelected ? 'primary.main' : 'text.secondary',
                                    }}
                                >
                                    {pct}%
                                </Typography>
                            )}
                        </Box>
                    );
                })}

                {/* Footer */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.25, mt: 0.15 }}>
                    <HowToVoteRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11 }}>
                        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                        {isExpired ? ' · Closed' : ''}
                    </Typography>
                    {!isExpired && !viewerVoted && (
                        <Typography variant="caption" sx={{ ml: 'auto', color: (groupMembershipGated || isNonPersonal) ? 'warning.dark' : 'text.secondary', fontWeight: (groupMembershipGated || isNonPersonal) ? 700 : 500, fontSize: 10.5 }}>
                            {groupMembershipGated ? 'Join to vote' : isNonPersonal ? 'Personal profile required' : 'Tap to vote'}
                        </Typography>
                    )}
                    {!isExpired && viewerVoted && (
                        <Chip
                            size="small"
                            label="Voted"
                            icon={<CheckCircleRoundedIcon sx={{ fontSize: '12px !important' }} />}
                            sx={(t) => ({
                                ml: 'auto',
                                height: 20,
                                fontSize: 10.5,
                                fontWeight: 800,
                                borderRadius: 999,
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: 'primary.main',
                                border: '1px solid',
                                borderColor: alphaColor(t.palette.primary.main, 0.22),
                                '& .MuiChip-icon': { color: 'primary.main' },
                            })}
                        />
                    )}
                </Box>
            </Box>
        );
    }


    /* ═══════════════════════════════════════════════════════════════
       FULL variant — interactive poll on detail page / modal
       ═══════════════════════════════════════════════════════════════ */
    return (
        <Box
            sx={{
                mt: 1.5,
                mb: 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            {/* ── Poll Closed banner (with winner) ── */}
            {isExpired && (() => {
                const winnerOpt = winningOptionIds.length > 0
                    ? options.find((o) => winningOptionIds.includes(o.id))
                    : null;
                const winnerPct = winnerOpt?.percent ?? 0;
                const isTied = winningOptionIds.length > 1;

                return (
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'stretch',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid',
                            borderColor: winnerOpt
                                ? alphaColor(t.palette.success.main, 0.25)
                                : alphaColor(t.palette.text.secondary, 0.12),
                        })}
                    >
                        {/* Left: Poll Closed info */}
                        <Box
                            sx={(t) => ({
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 1,
                                bgcolor: alphaColor(t.palette.text.secondary, 0.05),
                            })}
                        >
                            <TimerOffRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 13, color: 'text.primary' }}>
                                    Poll Closed — Final Results
                                </Typography>
                                {pollExpiresAt && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 11.5 }}>
                                        Ended {formatEndedAt(pollExpiresAt)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Right: Winner highlight */}
                        {winnerOpt && (
                            <Box
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    px: 1.5,
                                    py: 1,
                                    bgcolor: alphaColor(t.palette.success.main, 0.07),
                                    borderLeft: '1.5px solid',
                                    borderColor: alphaColor(t.palette.success.main, 0.2),
                                    minWidth: 0,
                                    maxWidth: '55%',
                                })}
                            >
                                <EmojiEventsRoundedIcon sx={{ fontSize: 22, color: 'success.main', flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 900, fontSize: 13, color: 'success.dark', lineHeight: 1.3 }}>
                                        {winnerOpt.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: 'success.main' }}>
                                        Winner{winnerPct > 0 ? ` · ${winnerPct}%` : ''}{isTied ? ' (tied)' : ''}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                );
            })()}

            {/* ── Non-personal account warning ── */}
            {!isExpired && isNonPersonal && !groupMembershipGated && (
                <Box
                    sx={(t) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.85,
                        borderRadius: '12px',
                        bgcolor: alphaColor(t.palette.warning.main, 0.06),
                        border: '1px solid',
                        borderColor: alphaColor(t.palette.warning.main, 0.18),
                    })}
                >
                    <SwapHorizRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: 12, color: 'warning.dark' }}
                    >
                        Switch to your personal profile to vote
                    </Typography>
                </Box>
            )}

            {/* ── Group membership gating warning ── */}
            {!isExpired && groupMembershipGated && (
                <Box
                    sx={(t) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.85,
                        borderRadius: '12px',
                        bgcolor: alphaColor(t.palette.info.main, 0.06),
                        border: '1px solid',
                        borderColor: alphaColor(t.palette.info.main, 0.18),
                    })}
                >
                    <HowToVoteRoundedIcon sx={{ fontSize: 18, color: 'info.main' }} />
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: 12, color: 'info.dark' }}
                    >
                        Join this group to vote on polls
                    </Typography>
                </Box>
            )}

            {/* ── Account error (server-side rejection or client-side block) ── */}
            {accountError && !isNonPersonal && !groupMembershipGated && (
                <Box
                    sx={(t) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.85,
                        borderRadius: '12px',
                        bgcolor: alphaColor(t.palette.error.main, 0.06),
                        border: '1px solid',
                        borderColor: alphaColor(t.palette.error.main, 0.18),
                    })}
                >
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: 12, color: 'error.dark' }}
                    >
                        {accountError}
                    </Typography>
                </Box>
            )}

            {/* ── Time remaining indicator (active polls with expiry) ── */}
            {!isExpired && hasExpiry && timeLeft && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1,
                        py: 0.5,
                    }}
                >
                    <AccessTimeRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12 }}
                    >
                        {timeLeft}
                    </Typography>
                </Box>
            )}

            {/* ── Option rows ── */}
            {options.map((opt) => {
                const isSelected = viewerVoteId != null && Number(viewerVoteId) === Number(opt.id);
                const pct = opt.percent ?? 0;
                const isWinner = isExpired && winningOptionIds.includes(opt.id);

                /* Expired or non-personal or not a member: not clickable */
                const isClickable = !votingBlocked;

                return (
                    <Tooltip
                        key={opt.id}
                        title={groupMembershipGated && !isExpired ? 'Join this group to vote' : isNonPersonal && !isExpired ? 'Switch to your personal profile to vote' : ''}
                        placement="top"
                        arrow
                    >
                        <Box
                            onClick={isClickable ? () => handleVote(opt.id) : undefined}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onKeyDown={isClickable ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleVote(opt.id);
                                }
                            } : undefined}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 1.15,
                                borderRadius: '12px',
                                border: '1.5px solid',
                                borderColor: (t) => {
                                    if (isWinner) return alphaColor(t.palette.success.main, 0.55);
                                    if (isSelected) return alphaColor(t.palette.primary.main, 0.55);
                                    return alphaColor(t.palette.common.black, 0.10);
                                },
                                bgcolor: (t) => {
                                    if (isWinner) return alphaColor(t.palette.success.main, 0.06);
                                    if (isSelected) return alphaColor(t.palette.primary.main, 0.06);
                                    return alphaColor(t.palette.common.black, 0.015);
                                },
                                cursor: votingBlocked ? 'default' : (voting ? 'wait' : 'pointer'),
                                opacity: (isNonPersonal || groupMembershipGated) && !isExpired ? 0.7 : 1,
                                transition: (t) => `border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                overflow: 'hidden',
                                ...(!votingBlocked && {
                                    '&:hover': {
                                        borderColor: (t) => alphaColor(t.palette.primary.main, 0.4),
                                        bgcolor: (t) => alphaColor(t.palette.primary.main, 0.04),
                                        boxShadow: (t) => t.custom.shadows.xs,
                                    },
                                }),
                            }}
                        >
                            {/* Background progress bar (visible when showing results) */}
                            {showResults && (
                                <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: '100%',
                                        borderRadius: '12px',
                                        bgcolor: 'transparent',
                                        opacity: isWinner ? 0.22 : (isSelected ? 0.18 : 0.09),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: '12px',
                                            bgcolor: isWinner ? 'success.main' : 'primary.main',
                                        },
                                    }}
                                />
                            )}

                            {/* Radio / check icon */}
                            {isSelected ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: 20, color: isWinner ? 'success.main' : 'primary.main', flexShrink: 0, zIndex: 1 }} />
                            ) : (
                                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0, zIndex: 1 }} />
                            )}

                            {/* Label */}
                            <Typography
                                variant="body2"
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontWeight: isWinner ? 900 : (isSelected ? 800 : 600),
                                    fontSize: 14,
                                    lineHeight: 1.35,
                                    wordBreak: 'break-word',
                                    zIndex: 1,
                                    color: isWinner ? 'success.dark' : 'inherit',
                                }}
                            >
                                {opt.label}
                            </Typography>

                            {/* Percent (visible when showing results) */}
                            {showResults && (
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexShrink: 0, zIndex: 1 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 900,
                                            fontSize: 14,
                                            color: isWinner
                                                ? 'success.main'
                                                : isSelected
                                                    ? 'primary.main'
                                                    : 'text.secondary',
                                        }}
                                    >
                                        {pct}%
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Tooltip>
                );
            })}

            {/* ── Footer ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, px: 0.5, flexWrap: 'wrap' }}>
                <HowToVoteRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12.5 }}>
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </Typography>

                {/* Expired: "Poll Closed" chip */}
                {isExpired && (
                    <Chip
                        size="small"
                        label="Poll Closed"
                        icon={<TimerOffRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{
                            ml: 'auto',
                            height: 22,
                            fontSize: 11,
                            fontWeight: 800,
                            borderRadius: 999,
                            bgcolor: (t) => alphaColor(t.palette.text.secondary, 0.08),
                            color: 'text.secondary',
                            border: '1px solid',
                            borderColor: (t) => alphaColor(t.palette.text.secondary, 0.18),
                            '& .MuiChip-icon': { color: 'text.secondary' },
                        }}
                    />
                )}

                {/* Active + voted: "Voted" chip */}
                {!isExpired && viewerVoted && (
                    <Chip
                        size="small"
                        label="Voted"
                        icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{
                            ml: 'auto',
                            height: 22,
                            fontSize: 11,
                            fontWeight: 800,
                            borderRadius: 999,
                            bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: (t) => alphaColor(t.palette.primary.main, 0.22),
                            '& .MuiChip-icon': { color: 'primary.main' },
                        }}
                    />
                )}

                {/* Active + not voted: prompt (account-aware) */}
                {!isExpired && !viewerVoted && (
                    <Typography variant="caption" sx={{ ml: 'auto', color: (groupMembershipGated || isNonPersonal) ? 'warning.dark' : 'text.secondary', fontWeight: (groupMembershipGated || isNonPersonal) ? 700 : 500, fontSize: 11.5 }}>
                        {groupMembershipGated ? 'Join group to vote' : isNonPersonal ? 'Personal profile required' : 'Tap an option to vote'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

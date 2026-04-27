// src/components/RateLimitDialog.jsx
// Friendly popup shown when a user hits a client-side rate limit.
// Reusable across comments, posts, service creation, etc.
//
// Usage:
//   <RateLimitDialog
//       open={rateLimitOpen}
//       onClose={() => setRateLimitOpen(false)}
//       retryAfterSec={retryAfterSec}
//       reason="cooldown"          // 'cooldown' | 'hourly_limit'
//       actionLabel="comments"     // shown in the message: "...limit on comments..."
//   />

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';

function formatWaitTime(totalSeconds) {
    if (totalSeconds <= 0) return 'a moment';
    if (totalSeconds < 60) {
        return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`;
    }
    const minutes = Math.ceil(totalSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export default function RateLimitDialog({
                                            open,
                                            onClose,
                                            retryAfterSec = 10,
                                            reason = 'cooldown',
                                            actionLabel = 'comments',
                                        }) {
    // Live countdown so the user can see when they're free to go
    const [remaining, setRemaining] = useState(retryAfterSec);

    useEffect(() => {
        if (!open) return;
        setRemaining(retryAfterSec);

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [open, retryAfterSec]);

    // Auto-close when countdown hits 0
    useEffect(() => {
        if (open && remaining <= 0) {
            onClose?.();
        }
    }, [remaining, open, onClose]);

    const title =
        reason === 'hourly_limit'
            ? `You've reached your limit on ${actionLabel} for now`
            : `Hang on just a moment!`;

    const message =
        reason === 'hourly_limit'
            ? `You've been busy! To keep things running smoothly for everyone, there's a temporary limit on ${actionLabel}. You'll be able to continue in ${formatWaitTime(remaining)}.`
            : `Looks like you just posted one — give it a few seconds before sending another. You can try again in ${formatWaitTime(remaining)}.`;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            <Box
                sx={(t) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: 3.5,
                    pb: 1,
                    px: 3,
                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.warning.main, 0.06)} 100%)`,
                })}
            >
                <Box
                    sx={(t) => ({
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.warning.main, 0.12),
                        mb: 2,
                    })}
                >
                    <HourglassTopRoundedIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                </Box>
                <DialogTitle
                    sx={{
                        p: 0,
                        pb: 1,
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                    }}
                >
                    {title}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ px: 3, pt: 1.5, pb: 2 }}>
                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}
                >
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'center' }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, minWidth: 100 }}
                >
                    Got it
                </Button>
            </DialogActions>
        </Dialog>
    );
}

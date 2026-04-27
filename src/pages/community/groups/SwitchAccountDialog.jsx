import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    IconButton,
    Box,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

/**
 * SwitchAccountDialog
 *
 * Shown when a user on a business/artist account tries to join a group.
 * Tells them to switch to their personal account.
 */
export default function SwitchAccountDialog({ open, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            transitionDuration={{ enter: 220, exit: 180 }}
            PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 3 }, mx: { xs: 2, sm: 'auto' } } }}
        >
            <IconButton
                aria-label="Close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: (t) => alpha(t.palette.common.black, 0.05),
                    '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.10) },
                    zIndex: 2,
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
                <Box
                    sx={(t) => ({
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        mx: 'auto',
                        mb: 2,
                    })}
                >
                    <SwapHorizRoundedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>

                <Typography sx={{ fontWeight: 900, fontSize: 17, mb: 1 }}>
                    Switch to your personal account
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 300, mx: 'auto' }}>
                    You're currently browsing as a business. Groups are designed for a personal experience. Switch to your personal account to join, post, and interact.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    disableElevation
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 3 }}
                >
                    Got it
                </Button>
            </DialogActions>
        </Dialog>
    );
}

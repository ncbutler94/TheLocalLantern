import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    IconButton,
    Box,
    TextField,
    CircularProgress,
    Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

/**
 * JoinQuestionsDialog
 *
 * Shows the group's join/screening questions before the user can join.
 * Required questions must be answered. Non-required questions are optional.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSubmit: (answers: { question, answer, required }[]) => Promise<void>
 * - questions: { question: string, required: boolean }[]
 * - groupName: string
 * - submitting: boolean
 */
export default function JoinQuestionsDialog({
                                                open,
                                                onClose,
                                                onSubmit,
                                                questions = [],
                                                groupName = 'this group',
                                                submitting = false,
                                            }) {
    const [answers, setAnswers] = useState({});

    // Reset answers when dialog opens
    useEffect(() => {
        if (open) {
            setAnswers({});
        }
    }, [open]);

    const handleAnswerChange = useCallback((index, value) => {
        setAnswers((prev) => ({ ...prev, [index]: value }));
    }, []);

    const requiredUnanswered = questions.some(
        (q, i) => q.required && !String(answers[i] || '').trim()
    );

    const canSubmit = !requiredUnanswered && !submitting;

    const handleSubmit = useCallback(() => {
        if (!canSubmit) return;
        const formatted = questions.map((q, i) => ({
            question: q.question,
            answer: String(answers[i] || '').trim(),
            required: Boolean(q.required),
        }));
        onSubmit(formatted);
    }, [answers, canSubmit, onSubmit, questions]);

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === 'backdropClick' || submitting) return;
                onClose();
            }}
            fullWidth
            maxWidth="sm"
            fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
            transitionDuration={{ enter: 250, exit: 200 }}
            PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, position: 'relative', m: { xs: 0, sm: undefined } } }}
        >
            <IconButton
                aria-label="Close"
                onClick={onClose}
                disabled={submitting}
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

            <DialogTitle sx={{ pr: 5, fontWeight: 900 }}>
                Join {groupName}
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Please answer the following questions. An admin will review your answers before approving your request.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {questions.map((q, i) => (
                        <Box key={i}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {q.question}
                                </Typography>
                                {q.required ? (
                                    <Chip
                                        label="Required"
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontSize: 10, height: 20 }}
                                    />
                                ) : (
                                    <Chip
                                        label="Optional"
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 600, fontSize: 10, height: 20, color: 'text.secondary', borderColor: 'divider' }}
                                    />
                                )}
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                maxRows={4}
                                placeholder="Your answer..."
                                value={answers[i] || ''}
                                onChange={(e) => handleAnswerChange(i, e.target.value.slice(0, 1000))}
                                disabled={submitting}
                                inputProps={{ maxLength: 1000 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={submitting}
                    sx={{ fontWeight: 700, borderRadius: 999, px: 2.5, textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    disableElevation
                    sx={{ fontWeight: 800, borderRadius: 999, px: 2.5, textTransform: 'none' }}
                >
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit & Request to Join'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

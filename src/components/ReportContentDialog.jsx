// src/components/ReportContentDialog.jsx
//
// Shared report dialog matching the EventCard report style.
// Usage:
//   <ReportContentDialog
//       open={reportOpen}
//       onClose={() => setReportOpen(false)}
//       onSubmit={async ({ reason, details }) => { ... }}
//       title="Report post"
//   />
//
// Optional props:
//   subtitle    – text below the title (default: "Why are you reporting this? Your report is anonymous.")
//   reasons     – array of { value, label } (has sensible defaults)
//   successText – custom success message

import { useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseIcon from "@mui/icons-material/Close";

const DEFAULT_REASONS = [
    { value: "spam", label: "Spam or misleading" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "hate", label: "Hate speech" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "misinformation", label: "Misinformation" },
    { value: "illegal", label: "Illegal content" },
    { value: "other", label: "Other" },
];

export default function ReportContentDialog({
                                                open,
                                                onClose,
                                                onSubmit,
                                                title = "Report",
                                                subtitle,
                                                reasons = DEFAULT_REASONS,
                                                successText,
                                            }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetDialog = () => {
        onClose();
        setTimeout(() => {
            setReason("");
            setDetails("");
            setSubmitted(false);
            setSubmitting(false);
        }, 250);
    };

    const handleSubmit = async () => {
        if (!reason) return;
        setSubmitting(true);
        try {
            await onSubmit({ reason, details });
        } catch { /* swallow */ }
        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <Dialog
            open={open}
            onClose={resetDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                },
            }}
        >
            {submitted ? (
                <>
                    <DialogContent sx={{ textAlign: "center", py: 5, px: 3 }}>
                        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                            Thank you for your report
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}>
                            {successText || "We take reports seriously and will review this. If it violates our community guidelines, we'll take appropriate action."}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button
                            onClick={resetDialog}
                            fullWidth
                            variant="contained"
                            disableElevation
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, py: 1 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FlagOutlinedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                            {title}
                        </Box>
                        <IconButton size="small" onClick={resetDialog} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 0, pb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                            {subtitle || "Why are you reporting this? Your report is anonymous."}
                        </Typography>
                        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
                            {reasons.map((opt) => (
                                <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio size="small" />}
                                    label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                    sx={{
                                        mx: 0,
                                        py: 0.25,
                                        px: 1,
                                        borderRadius: 2,
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                />
                            ))}
                        </RadioGroup>
                        <TextField
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            placeholder="Add any additional details that might help us review this report…"
                            value={details}
                            onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                            inputProps={{ maxLength: 1000 }}
                            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                        />
                        <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                            {details.length}/1000
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button
                            onClick={resetDialog}
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disableElevation
                            disabled={!reason || submitting}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                fontWeight: 700,
                                textTransform: "none",
                                borderRadius: 2,
                                px: 3,
                            }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

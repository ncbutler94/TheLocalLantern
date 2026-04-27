// src/pages/jobs/components/ApplyToJobDialog.jsx
//
// Full "Apply to Job" dialog:
//   • Pre-filled name / email from logged-in user
//   • Phone (optional)
//   • Portfolio / website URL (optional)
//   • Cover letter / message (rich text editor)
//   • Resume upload (PDF, DOC, DOCX → GCS)
//   • Client-side content moderation on all text inputs
//   • Sends application to job poster via backend
//
import React, { useEffect, useRef, useState } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha } from "@mui/material/styles";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import { useActiveAccount } from "../../../components/AccountContext";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";

const ALLOWED_RESUME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PORTFOLIO_LENGTH = 500;

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* ═══════════════════════════════════════════════════════════════════
   CLIENT-SIDE PROFANITY CHECK
   Mirrors backend contentModeration.js localProfanityCheck exactly.
   ═══════════════════════════════════════════════════════════════════ */

const BANNED_WORDS = new Set([
    'fuck', 'fucks', 'fucked', 'fucker', 'fuckers', 'fucking',
    'shit', 'shits', 'shitty', 'bullshit',
    'bitch', 'bitches',
    'bastard', 'bastards',
    'ass', 'asses', 'asshole', 'assholes',
    'arse', 'arsehole',
    'dick', 'dicks',
    'cock', 'cocks',
    'pussy', 'pussies',
    'cunt', 'cunts',
    'whore', 'whores',
    'slut', 'sluts',
    'twat', 'twats',
    'piss', 'pissed',
    'damn', 'dammit', 'goddamn', 'goddammit',
    'hell', 'penis',
    'wanker', 'wankers',
    'tosser', 'tossers',
    'bollocks', 'bugger', 'bloody',
    'kys', 'stfu', 'gtfo', 'foad', 'diaf',
    'retard', 'retards', 'retarded',
    'spaz', 'spastic', 'tranny', 'shemale',
    'nigger', 'niggers', 'nigga', 'niggas',
    'spic', 'spics', 'wetback', 'wetbacks',
    'chink', 'chinks', 'gook', 'gooks',
    'kike', 'kikes', 'beaner', 'beaners',
    'cracker', 'crackers', 'honky', 'honkies',
    'fag', 'fags', 'faggot', 'faggots',
    'dyke', 'dykes', 'coon', 'coons',
    'darkie', 'darkies', 'raghead', 'ragheads',
    'towelhead', 'towelheads', 'zipperhead', 'jigaboo',
    'sh1t', 'b1tch', 'f4ck', 'fvck', 'phuck', 'phuk',
    'a$$', 'a$$hole', 'd1ck', 'p1ss', 'azz', 'biatch', 'beyotch',
    'scheiße', 'scheisse', 'arschloch', 'hurensohn', 'wichser',
    'fotze', 'missgeburt', 'drecksau', 'fick', 'ficken',
    'puta', 'puto', 'pendejo', 'pendeja', 'coño', 'cabron', 'cabrón',
    'mierda', 'verga', 'chingada', 'chingado', 'pinche', 'joder', 'maricón',
    'putain', 'enculé', 'connard', 'salope', 'merde', 'bordel',
    'porra', 'caralho', 'filho da puta',
    'cazzo', 'stronzo', 'puttana',
]);

const BANNED_PHRASES = [
    'big dick', 'big cock', 'suck my', 'eat shit', 'eat a dick',
    'suck a dick', 'blow me', 'jack off', 'jerk off',
    'screw you', 'screw off', 'fuck you', 'fuck off', 'piss off',
    'go to hell', 'kiss my ass', 'piece of shit', 'son of a bitch',
    'shut the fuck up', 'shut the hell up', 'holy shit',
    'what the fuck', 'go fuck yourself', 'get fucked',
    'dumb ass', 'dumbass', 'jack ass', 'jackass',
    'bull shit', 'horse shit', 'bat shit',
    'f u c k', 'f.u.c.k', 's h i t', 'a s s',
    'halt die fresse', 'leck mich', 'verpiss dich',
    'fick dich', 'du hurensohn', 'du arschloch',
    'puta madre', 'hijo de puta', 'chinga tu madre',
    'vete a la mierda', 'que te jodan',
    'nique ta mère', 'fils de pute', 'ta gueule',
    'va te faire foutre', 'ferme ta gueule',
].map(p => p.toLowerCase());

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTermStrict(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

const BANNED_PHRASES_NORMALIZED = BANNED_PHRASES.map(p => normalizeTermStrict(p));
const BANNED_WORDS_NORMALIZED = new Set([...BANNED_WORDS].map(w => normalizeTermStrict(w)));

function localProfanityCheck(text) {
    if (!text || typeof text !== 'string') return { clean: true };
    const lower = text.toLowerCase();

    for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase)) return { clean: false, reason: 'profanity' };
    }
    const tokens = lower.split(/[^a-zA-Z0-9\u00C0-\u024F]+/).filter(Boolean);
    for (const token of tokens) {
        if (BANNED_WORDS.has(token)) return { clean: false, reason: 'profanity' };
    }

    const normalized = normalizeTermStrict(text);
    for (const phrase of BANNED_PHRASES_NORMALIZED) {
        if (phrase.length >= 3 && normalized.includes(phrase)) return { clean: false, reason: 'profanity' };
    }
    const normalizedSpaced = normalizeText(text);
    const normalizedTokens = normalizedSpaced.split(/\s+/).filter(Boolean);
    for (const token of normalizedTokens) {
        if (BANNED_WORDS_NORMALIZED.has(token)) return { clean: false, reason: 'profanity' };
    }
    return { clean: true };
}


/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

/**
 * ApplyToJobDialog
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - job: object (the job being applied to)
 *  - user: object (logged-in user, for pre-fill)
 *  - onApplied: (jobId) => void — optional callback after success
 */
export default function ApplyToJobDialog({ open, onClose, job, user, onApplied }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const fileInputRef = useRef(null);
    const { isBusinessAccount, isArtistAccount } = useActiveAccount();
    const isNonPersonalAccount = isBusinessAccount || isArtistAccount;

    const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "";
    const userEmail = user?.email || "";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [message, setMessage] = useState("");
    const [resumeFile, setResumeFile] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);

    // Per-field moderation errors
    const [nameModError, setNameModError] = useState("");
    const [phoneModError, setPhoneModError] = useState("");
    const [portfolioModError, setPortfolioModError] = useState("");
    const [messageModError, setMessageModError] = useState("");

    // Pre-fill tracking refs
    const prevOpenRef = useRef(false);
    if (open && !prevOpenRef.current) {
        prevOpenRef.current = true;
    }
    if (!open && prevOpenRef.current) {
        prevOpenRef.current = false;
    }

    const resetRef = useRef(null);
    if (open && resetRef.current !== job?.id) {
        resetRef.current = job?.id;
    }

    // Reset form state whenever the dialog opens
    useEffect(() => {
        if (open) {
            setName(userName);
            setEmail(userEmail);
            setPhone("");
            setPortfolioUrl("");
            setMessage("");
            setResumeFile(null);
            setError("");
            setSuccess(false);
            setAttemptedSubmit(false);
            setSubmitting(false);
            setAlreadyApplied(Boolean(job?.viewerApplied));
            setNameModError("");
            setPhoneModError("");
            setPortfolioModError("");
            setMessageModError("");
        }
    }, [open, job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        if (!ALLOWED_RESUME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
            setError("Please upload a PDF, DOC, or DOCX file.");
            return;
        }
        if (file.size > MAX_RESUME_BYTES) {
            setError("Resume must be under 10 MB.");
            return;
        }
        setError("");
        setResumeFile(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveResume = () => {
        setResumeFile(null);
    };

    const effectiveName = name.trim();
    const effectiveEmail = email.trim();

    const nameError = attemptedSubmit && !effectiveName ? "Name is required." : nameModError || "";
    const emailError = attemptedSubmit && !effectiveEmail
        ? "Email is required."
        : attemptedSubmit && effectiveEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)
            ? "Enter a valid email address."
            : "";

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        setError("");
        setNameModError("");
        setPhoneModError("");
        setPortfolioModError("");
        setMessageModError("");

        if (!effectiveName || !effectiveEmail) return;
        if (effectiveEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) return;

        // Strip HTML from rich text message for moderation + submission
        const strippedMessage = stripHtml(message || "").trim();

        // Client-side profanity check — per-field so we highlight each offending input
        let hasModError = false;

        const nameCheck = localProfanityCheck(effectiveName);
        if (!nameCheck.clean) {
            setNameModError("Contains inappropriate language. Please revise.");
            hasModError = true;
        }

        if (phone.trim()) {
            const phoneCheck = localProfanityCheck(phone.trim());
            if (!phoneCheck.clean) {
                setPhoneModError("Contains inappropriate language. Please revise.");
                hasModError = true;
            }
        }

        if (portfolioUrl.trim()) {
            const portfolioCheck = localProfanityCheck(portfolioUrl.trim());
            if (!portfolioCheck.clean) {
                setPortfolioModError("Contains inappropriate language. Please revise.");
                hasModError = true;
            }
        }

        if (strippedMessage) {
            const messageCheck = localProfanityCheck(strippedMessage);
            if (!messageCheck.clean) {
                setMessageModError("Your cover letter contains inappropriate language. Please revise.");
                hasModError = true;
            }
        }

        if (hasModError) {
            setError("Your application contains inappropriate language. Please revise the highlighted fields and try again.");
            return;
        }

        setSubmitting(true);

        try {
            const form = new FormData();
            form.append("name", effectiveName);
            form.append("email", effectiveEmail);
            if (phone.trim()) form.append("phone", phone.trim());
            if (portfolioUrl.trim()) form.append("portfolioUrl", portfolioUrl.trim());
            if (strippedMessage) form.append("message", strippedMessage);
            if (resumeFile) form.append("resume", resumeFile);

            const res = await secureFetch(`/api/jobs/${encodeURIComponent(job.id)}/apply`, {
                method: "POST",
                credentials: "include",
                body: form,
            });

            if (!res.ok) {
                let msg = "Failed to submit application.";
                try {
                    const data = await res.json();
                    msg = data?.message || data?.error || msg;
                } catch {
                    // ignore parse error
                }
                if (res.status === 409) {
                    setAlreadyApplied(true);
                    return;
                }
                throw new Error(msg);
            }

            setSuccess(true);
            if (typeof onApplied === "function") onApplied(job.id);
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const jobTitle = job?.title || "this job";
    const companyName = job?.company || job?.companyName || job?.company_name || "";

    return (
        <Dialog
            open={open}
            onClose={submitting ? undefined : onClose}
            maxWidth={success || alreadyApplied || isNonPersonalAccount ? "sm" : "md"}
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    overflow: "hidden",
                    ...(isMobile
                        ? {
                            // True fullscreen on mobile — cover header + bottom nav
                            maxHeight: "none",
                            height: "100dvh",
                            "@supports not (height: 1dvh)": { height: "100vh" },
                            m: 0,
                        }
                        : {
                            maxHeight: "88vh",
                        }),
                },
            }}
            // Ensure the dialog renders above the app header & bottom nav on mobile
            sx={{
                ...(isMobile
                    ? {
                        "& .MuiDialog-container": {
                            alignItems: "stretch",
                        },
                        zIndex: (t) => t.zIndex.drawer + 10,
                    }
                    : {}),
            }}
        >
            <DialogTitle sx={{ pr: 6, pb: 1 }}>
                {!success && (
                    <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                            {alreadyApplied ? "Already Applied" : isNonPersonalAccount ? "Personal Account Required" : "Apply for this Job"}
                        </Typography>
                        {!alreadyApplied && !isNonPersonalAccount && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <WorkOutlineRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    {jobTitle}{companyName ? ` at ${companyName}` : ""}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                )}
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    disabled={submitting}
                    sx={{ position: "absolute", right: 12, top: 12 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 3, overflowY: "auto", ...(success ? { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", ...(isMobile ? {} : { py: 5 }) } : {}) }}>
                {success ? (
                    <Stack
                        spacing={3}
                        alignItems="center"
                        sx={{
                            py: { xs: 2, sm: 4 },
                            px: { xs: 1, sm: 3 },
                            maxWidth: 420,
                            mx: "auto",
                            ...(isMobile ? { flex: 1, justifyContent: "center" } : {}),
                        }}
                    >
                        <Box
                            sx={(t) => ({
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: alpha(t.palette.success.main, 0.1),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            })}
                        >
                            <CheckCircleRoundedIcon sx={{ fontSize: 44, color: "success.main" }} />
                        </Box>
                        <Stack spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: 950, fontSize: 22, textAlign: "center", lineHeight: 1.3 }}>
                                Application Submitted!
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.6, maxWidth: 340 }}
                            >
                                Your application for <strong>{jobTitle}</strong>
                                {companyName ? ` at ${companyName}` : ""} has been sent.
                                The employer will review your information and reach out if there's a match.
                            </Typography>
                        </Stack>
                        <Button
                            variant="contained"
                            onClick={onClose}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 900,
                                px: 5,
                                py: 1.25,
                                fontSize: 15,
                                color: t.palette.common.white,
                                boxShadow: "none",
                                "&:hover": { boxShadow: "none" },
                            })}
                        >
                            Done
                        </Button>
                    </Stack>
                ) : alreadyApplied ? (
                    <AlreadyAppliedView jobTitle={jobTitle} companyName={companyName} onClose={onClose} />
                ) : isNonPersonalAccount ? (
                    <PersonalRequiredView onClose={onClose} />
                ) : (
                    <Stack spacing={2} sx={{ pt: 1.5 }}>
                        {/* Name */}
                        <TextField
                            label="Full Name" value={name}
                            onChange={(e) => { setName(e.target.value); if (nameModError) setNameModError(""); }}
                            error={Boolean(nameError)} helperText={nameError}
                            fullWidth required disabled={submitting}
                            inputProps={{ maxLength: 100 }} size="small"
                        />

                        {/* Email */}
                        <TextField
                            label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            error={Boolean(emailError)} helperText={emailError}
                            fullWidth required disabled={submitting}
                            inputProps={{ maxLength: 200 }} size="small"
                        />

                        {/* Phone */}
                        <TextField
                            label="Phone Number (optional)" value={phone}
                            onChange={(e) => { setPhone(e.target.value); if (phoneModError) setPhoneModError(""); }}
                            error={Boolean(phoneModError)} helperText={phoneModError || undefined}
                            fullWidth disabled={submitting}
                            inputProps={{ maxLength: 30 }} size="small"
                        />

                        {/* Portfolio / Website URL */}
                        <TextField
                            label="Portfolio or Website (optional)"
                            value={portfolioUrl}
                            onChange={(e) => { setPortfolioUrl(e.target.value); if (portfolioModError) setPortfolioModError(""); }}
                            error={Boolean(portfolioModError)}
                            helperText={portfolioModError || undefined}
                            fullWidth
                            disabled={submitting}
                            inputProps={{ maxLength: MAX_PORTFOLIO_LENGTH }}
                            size="small"
                            placeholder="https://yourportfolio.com or LinkedIn profile"
                            InputProps={{
                                startAdornment: (
                                    <LanguageRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mr: 1 }} />
                                ),
                            }}
                        />

                        <Divider />

                        {/* Message / Cover Letter — Rich Text Editor */}
                        <Box>
                            <RichTextEditor
                                label="Message / Cover Letter"
                                value={message}
                                onChange={(html) => { setMessage(html); if (messageModError) setMessageModError(""); }}
                                maxLength={MAX_MESSAGE_LENGTH}
                                placeholder="Tell them why you're a great fit for this role..."
                                minRows={6}
                                error={Boolean(messageModError)}
                                helperText={messageModError || undefined}
                            />
                        </Box>

                        {/* Resume Upload */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                                Resume (optional)
                            </Typography>

                            {resumeFile ? (
                                <Box
                                    sx={(t) => ({
                                        display: "flex", alignItems: "center", gap: 1.25, p: 1.25, borderRadius: 2,
                                        border: "1px solid", borderColor: alpha(t.palette.success.main, 0.3),
                                        bgcolor: alpha(t.palette.success.main, 0.04),
                                    })}
                                >
                                    <DescriptionRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {resumeFile.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {formatFileSize(resumeFile.size)}
                                        </Typography>
                                    </Box>
                                    <IconButton size="small" onClick={handleRemoveResume} disabled={submitting} sx={{ color: "error.main" }}>
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box
                                    onClick={() => { if (!submitting && fileInputRef.current) fileInputRef.current.click(); }}
                                    sx={(t) => ({
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.75,
                                        py: 2.5, borderRadius: 2,
                                        border: "2px dashed", borderColor: alpha(t.palette.primary.main, 0.2),
                                        bgcolor: alpha(t.palette.primary.main, 0.02),
                                        cursor: submitting ? "default" : "pointer",
                                        transition: "all 140ms ease",
                                        "&:hover": submitting ? {} : {
                                            borderColor: alpha(t.palette.primary.main, 0.4),
                                            bgcolor: alpha(t.palette.primary.main, 0.05),
                                        },
                                    })}
                                >
                                    <UploadFileRoundedIcon sx={{ fontSize: 28, color: "primary.main", opacity: 0.7 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                                        Upload Resume
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        PDF, DOC, or DOCX — up to 10 MB
                                    </Typography>
                                </Box>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                        </Box>

                        {/* How to Apply info (if present) */}
                        {(job?.howToApply || job?.how_to_apply) ? (
                            <Box
                                sx={(t) => ({
                                    borderRadius: 2, p: 1.25,
                                    border: "1px solid", borderColor: alpha(t.palette.info.main, 0.2),
                                    bgcolor: alpha(t.palette.info.main, 0.03),
                                })}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 12, mb: 0.5, color: "info.dark" }}>
                                    Additional Instructions from Employer
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.5, wordBreak: "break-word" }}>
                                    {job?.howToApply || job?.how_to_apply}
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Error */}
                        {error ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        ) : null}

                        {/* Actions */}
                        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                            <Button variant="outlined" onClick={onClose} disabled={submitting}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                            >
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                                    startIcon={
                                        submitting
                                            ? <CircularProgress size={16} color="inherit" />
                                            : <SendRoundedIcon sx={{ fontSize: 16, transform: "rotate(-30deg)" }} />
                                    }
                                    sx={(t) => ({
                                        borderRadius: 999, textTransform: "none", fontWeight: 900,
                                        color: t.palette.common.white, boxShadow: "none",
                                        "&:hover": { boxShadow: "none" },
                                    })}
                            >
                                {submitting ? "Submitting..." : "Submit Application"}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AlreadyAppliedView({ jobTitle, companyName, onClose }) {
    return (
        <Stack spacing={2.5} alignItems="center" sx={{ py: 3 }}>
            <InfoOutlinedIcon sx={{ fontSize: 64, color: "info.main" }} />
            <Stack spacing={0.75} alignItems="center">
                <Typography sx={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>
                    You&apos;ve Already Applied
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 340 }}>
                    You&apos;ve already submitted an application for <strong>{jobTitle}</strong>
                    {companyName ? ` at ${companyName}` : ""}. The employer has your information and will reach out if there&apos;s a match.
                </Typography>
            </Stack>
            <Button variant="contained" onClick={onClose}
                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 4, color: t.palette.common.white, boxShadow: "none", "&:hover": { boxShadow: "none" } })}
            >
                Got It
            </Button>
        </Stack>
    );
}

function PersonalRequiredView({ onClose }) {
    return (
        <Stack spacing={2.5} alignItems="center" sx={{ py: 3 }}>
            <InfoOutlinedIcon sx={{ fontSize: 64, color: "primary.main" }} />
            <Stack spacing={0.75} alignItems="center">
                <Typography sx={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>
                    Personal Account Required
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 340 }}>
                    Job applications can only be submitted from your personal account.
                    Please switch to your personal profile using the account switcher in the header, then try again.
                </Typography>
            </Stack>
            <Button variant="contained" onClick={onClose}
                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 4, color: t.palette.common.white, boxShadow: "none", "&:hover": { boxShadow: "none" } })}
            >
                Got It
            </Button>
        </Stack>
    );
}

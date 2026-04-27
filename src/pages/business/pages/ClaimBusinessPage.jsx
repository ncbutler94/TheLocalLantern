// src/pages/business/pages/ClaimBusinessPage.jsx
//
// The page users land on when they click "Claim This Business" on an
// unclaimed business profile. Path: /claim-business/:businessId
//
// Flow:
//   1. Check user is logged in (prompt login if not)
//   2. Fetch the business being claimed (show it so user knows they're in right place)
//   3. Show a form: role, email, message, optional proof upload
//   4. Submit to /api/claims
//   5. Show success state with next steps
//
// Design: calm, editorial, feels like the rest of The Local Lantern.
// No pressure, no upsells, just "here's what happens next".

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    Avatar,
    CircularProgress,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    FormHelperText,
    Chip,
    Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

import { useAuth } from '../../../components/AuthModalContext';
import { submitBusinessClaim } from '../api/businessApi';

const ROLE_OPTIONS = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'marketing', label: 'Marketing / Social Media Manager' },
    { value: 'authorized_rep', label: 'Authorized Representative' },
    { value: 'other', label: 'Other' },
];

export default function ClaimBusinessPage() {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const user = auth?.user || null;

    const [business, setBusiness] = useState(null);
    const [loadingBiz, setLoadingBiz] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Form state
    const [claimantName, setClaimantName] = useState('');
    const [claimantEmail, setClaimantEmail] = useState('');
    const [claimantRole, setClaimantRole] = useState('owner');
    const [claimMessage, setClaimMessage] = useState('');

    // Submit state
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // ─── Pre-fill from user when available ─────────────────────────────
    useEffect(() => {
        if (!user) return;
        if (!claimantName) {
            const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
                || user.display_name || user.username || '';
            if (name) setClaimantName(name);
        }
        if (!claimantEmail && user.email) setClaimantEmail(user.email);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ─── Load the business being claimed ───────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoadingBiz(true);
                setLoadError('');
                const res = await fetch(
                    `/api/businesses/unclaimed/${encodeURIComponent(businessId)}`,
                    { credentials: 'include', headers: { Accept: 'application/json' } },
                );
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Business not found.');
                    throw new Error(`Failed to load business (${res.status})`);
                }
                const data = await res.json();
                if (cancelled) return;
                setBusiness(data);
            } catch (err) {
                if (!cancelled) setLoadError(err?.message || 'Failed to load business.');
            } finally {
                if (!cancelled) setLoadingBiz(false);
            }
        }
        if (businessId) load();
        return () => { cancelled = true; };
    }, [businessId]);

    // ─── Validation ────────────────────────────────────────────────────
    const messageLength = claimMessage.trim().length;
    const messageValid = messageLength >= 20 && messageLength <= 4000;
    const emailValid = /^\S+@\S+\.\S+$/.test(String(claimantEmail).trim());
    const canSubmit = !submitting && messageValid && emailValid && !!business && !submitSuccess;

    // ─── Submit ────────────────────────────────────────────────────────
    async function handleSubmit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            await submitBusinessClaim({
                unclaimed_business_id: Number(businessId),
                claimant_name: claimantName.trim(),
                claimant_email: claimantEmail.trim(),
                claimant_role: claimantRole,
                claim_message: claimMessage.trim(),
            });
            setSubmitSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            setSubmitError(err?.message || 'Failed to submit claim.');
        } finally {
            setSubmitting(false);
        }
    }

    // ─── Not logged in state ───────────────────────────────────────────
    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper elevation={0} sx={(t) => ({
                    p: 4,
                    borderRadius: 3,
                    border: `1px solid ${t.palette.divider}`,
                    textAlign: 'center',
                })}>
                    <StorefrontRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        Sign in to claim a business
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: 14 }}>
                        To claim a business profile on The Local Lantern, you need a free account.
                        It takes under a minute.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            variant="contained"
                            onClick={() => auth?.openLoginPopup?.()}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 3 }}
                        >
                            Sign in
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                        >
                            Go back
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    // ─── Loading ───────────────────────────────────────────────────────
    if (loadingBiz) {
        return (
            <Container maxWidth="sm" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    // ─── Load error ────────────────────────────────────────────────────
    if (loadError || !business) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper elevation={0} sx={(t) => ({
                    p: 4, borderRadius: 3, border: `1px solid ${t.palette.divider}`,
                })}>
                    <Alert severity="error">{loadError || 'Business not found.'}</Alert>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        sx={{ mt: 2, borderRadius: 999, textTransform: 'none' }}
                        startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
                    >
                        Go back
                    </Button>
                </Paper>
            </Container>
        );
    }

    // ─── Success state ─────────────────────────────────────────────────
    if (submitSuccess) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper elevation={0} sx={(t) => ({
                    p: 4,
                    borderRadius: 3,
                    border: `1px solid ${t.palette.divider}`,
                    textAlign: 'center',
                })}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        Claim submitted
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: 14, lineHeight: 1.6 }}>
                        Thanks for submitting a claim for <strong>{business.name}</strong>. We'll review it
                        personally and email you at <strong>{claimantEmail}</strong> with a decision, usually
                        within 1-2 business days.
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 3 }}>
                        If approved, you'll get full access to manage this business profile on The Local Lantern.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            variant="contained"
                            onClick={() => navigate('/business')}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 3 }}
                        >
                            Browse more businesses
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    // ─── Main form ─────────────────────────────────────────────────────
    const location = [business.city, business.county && `${business.county} County`]
        .filter(Boolean).join(', ');

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
            <Button
                onClick={() => navigate(-1)}
                startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{
                    mb: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary',
                    '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                }}
            >
                Back
            </Button>

            <Paper elevation={0} sx={(t) => ({
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                border: `1px solid ${t.palette.divider}`,
            })}>
                {/* Header */}
                <Typography sx={{
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'primary.main', mb: 0.5,
                }}>
                    Claim Your Business
                </Typography>
                <Typography variant="h4" sx={{
                    fontWeight: 900, lineHeight: 1.15, mb: 2, fontSize: { xs: 24, sm: 28 },
                }}>
                    Take ownership of this profile
                </Typography>

                {/* The business card */}
                <Box sx={(t) => ({
                    display: 'flex',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(t.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                    mb: 3,
                })}>
                    <Avatar
                        src={business.avatar_url || business.cover_url || undefined}
                        alt={business.name}
                        sx={{ width: 56, height: 56, borderRadius: 1.5 }}
                        variant="rounded"
                    >
                        <StorefrontRoundedIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                            {business.name}
                        </Typography>
                        {location && (
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.25 }}>
                                {location}
                            </Typography>
                        )}
                        <Chip
                            size="small"
                            label="Unclaimed"
                            sx={{
                                mt: 0.5, height: 18, fontSize: 10, fontWeight: 700,
                                borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}
                            variant="outlined"
                        />
                    </Box>
                </Box>

                <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6, mb: 3 }}>
                    We manually review every claim to keep The Local Lantern trustworthy. Tell us
                    who you are and why you should manage this listing. We'll get back to you within
                    1-2 business days.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {/* Form */}
                <Stack spacing={2.5}>
                    <Box>
                        <TextField
                            label="Your name"
                            value={claimantName}
                            onChange={(e) => setClaimantName(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Box>

                    <Box>
                        <TextField
                            label="Email for correspondence"
                            value={claimantEmail}
                            onChange={(e) => setClaimantEmail(e.target.value)}
                            fullWidth
                            size="small"
                            error={claimantEmail.length > 0 && !emailValid}
                            helperText={
                                claimantEmail.length > 0 && !emailValid
                                    ? 'Please enter a valid email address'
                                    : "We'll email you here with our decision"
                            }
                        />
                    </Box>

                    <FormControl size="small" fullWidth>
                        <InputLabel>Your role</InputLabel>
                        <Select
                            value={claimantRole}
                            label="Your role"
                            onChange={(e) => setClaimantRole(e.target.value)}
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box>
                        <TextField
                            label="Tell us about yourself and your connection to this business"
                            value={claimMessage}
                            onChange={(e) => setClaimMessage(e.target.value)}
                            fullWidth
                            multiline
                            minRows={5}
                            maxRows={10}
                            size="small"
                            placeholder="For example: 'I've owned this shop since 2018. I can provide a photo of my business license if needed.'"
                            error={messageLength > 0 && !messageValid}
                        />
                        <FormHelperText sx={{
                            display: 'flex', justifyContent: 'space-between', mt: 0.5, mx: 1.5,
                        }}>
                            <span>
                                {messageLength < 20 ? `${20 - messageLength} more characters needed` : ' '}
                            </span>
                            <span style={{ color: messageLength > 3800 ? '#d32f2f' : undefined }}>
                                {messageLength} / 4000
                            </span>
                        </FormHelperText>
                    </Box>

                    {submitError && (
                        <Alert severity="error" onClose={() => setSubmitError('')}>
                            {submitError}
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        sx={{
                            borderRadius: 999, textTransform: 'none', fontWeight: 800,
                            py: 1.25, minHeight: 44, fontSize: 15,
                        }}
                    >
                        {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit claim request'}
                    </Button>

                    <Typography sx={{
                        fontSize: 11, color: 'text.secondary', textAlign: 'center', lineHeight: 1.5,
                    }}>
                        By submitting, you confirm that you are the owner, manager, or an authorized
                        representative of this business. False claims may result in account suspension.
                    </Typography>
                </Stack>
            </Paper>
        </Container>
    );
}

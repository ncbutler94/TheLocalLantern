// src/components/SocialLoginButtons.jsx
//
// Reusable Google + Apple OAuth buttons.
//
// Platform behavior:
//   GOOGLE:
//     • Web          → redirects the browser to /auth/google on the backend
//                      (Passport handles the OAuth dance).
//     • Mobile       → uses the native Google Sign-In plugin to get an ID
//       (Capacitor)    token, exchanges it at /auth/google/mobile, then
//                      navigates to /social-login-success so the cookie
//                      gets set just like on web.
//
//   APPLE:
//     • iOS native   → uses the system Apple Sign-In sheet (required by
//       (Capacitor)    Apple whenever another third-party sign-in is
//                      offered in the same app).
//     • Other        → hidden. (Web Sign in with Apple requires a
//                      separate Services ID + domain verification; we
//                      don't expose the button on web until that's set up.)
//
// Usage is unchanged:
//   <SocialLoginButtons />
//   <SocialLoginButtons label="Sign up" dividerText="or sign up with email" />

import React, { useState } from 'react';
import { Box, Button, CircularProgress, Divider, Typography } from '@mui/material';
import { isNativeGoogleAvailable, signInWithGoogleNative } from '../utils/nativeGoogleAuth';
import { isNativeAppleAvailable, signInWithAppleNative } from '../utils/nativeAppleAuth';

const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

// ── Inline SVG icons (no extra dependency) ───────────────────────────

function GoogleIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.08 24.08 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

function FacebookIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48">
            <path fill="#1877F2" d="M48 24C48 10.745 37.255 0 24 0S0 10.745 0 24c0 11.979 8.776 21.908 20.25 23.708V30.937h-6.094V24h6.094v-5.288c0-6.014 3.583-9.337 9.065-9.337 2.626 0 5.372.469 5.372.469v5.906h-3.026c-2.981 0-3.911 1.85-3.911 3.75V24h6.656l-1.064 6.938H27.75v16.77C39.224 45.908 48 35.978 48 24z" />
            <path fill="#fff" d="M33.342 30.938 34.406 24H27.75v-4.5c0-1.9.93-3.75 3.911-3.75h3.026V9.844s-2.746-.469-5.372-.469c-5.482 0-9.065 3.323-9.065 9.337V24h-6.094v6.938h6.094v16.77a24.18 24.18 0 0 0 7.5 0v-16.77h5.592z" />
        </svg>
    );
}

// Apple's own logo. Color flips between black and white depending on
// the button background (we use white on the dark/black Apple button).
function AppleIcon({ size = 18, color = '#fff' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M17.564 13.13c-.02-2.03 1.662-3.003 1.737-3.05-.947-1.384-2.42-1.573-2.943-1.594-1.253-.127-2.446.74-3.083.74-.638 0-1.62-.72-2.664-.702-1.37.02-2.636.796-3.342 2.02-1.425 2.47-.363 6.125 1.024 8.127.677.98 1.484 2.08 2.54 2.04 1.02-.04 1.41-.66 2.644-.66 1.234 0 1.584.66 2.664.64 1.1-.02 1.797-1 2.47-1.983.776-1.137 1.096-2.24 1.116-2.296-.025-.01-2.143-.82-2.163-3.26zM15.54 7.19c.557-.68.938-1.61.833-2.55-.808.033-1.79.538-2.37 1.214-.515.6-.976 1.57-.852 2.487.903.07 1.83-.46 2.39-1.15z"/>
        </svg>
    );
}

// ── Component ────────────────────────────────────────────────────────

export default function SocialLoginButtons({
                                               label = 'Continue',
                                               dividerText = 'or',
                                               dark = false,
                                               sx = {},
                                           }) {
    const [googleBusy, setGoogleBusy]   = useState(false);
    const [googleError, setGoogleError] = useState('');
    const [appleBusy, setAppleBusy]     = useState(false);
    const [appleError, setAppleError]   = useState('');

    // Show the Apple button only where it's meaningful (iOS native for now).
    // See the header comment for why we don't expose it on web yet.
    const showAppleButton = isNativeAppleAvailable();

    const handleGoogle = async () => {
        // ── Native mobile (Capacitor iOS/Android) ──
        if (isNativeGoogleAvailable()) {
            setGoogleError('');
            setGoogleBusy(true);
            try {
                await signInWithGoogleNative();
                // signInWithGoogleNative navigates the webview on success,
                // so execution normally stops before returning here.
            } catch (err) {
                if (!err?.cancelled) {
                    // Show a short, friendly message; specifics go to console.
                    console.error('[SocialLoginButtons] native Google sign-in failed:', err);
                    setGoogleError(
                        err?.response?.data?.error ||
                        err?.message ||
                        'Google sign-in failed. Please try again.'
                    );
                }
            } finally {
                setGoogleBusy(false);
            }
            return;
        }

        // ── Web redirect flow (unchanged) ──
        window.location.href = `${API_URL}/auth/google`;
    };

    const handleApple = async () => {
        setAppleError('');
        setAppleBusy(true);
        try {
            await signInWithAppleNative();
            // signInWithAppleNative navigates the webview on success,
            // so execution normally stops before returning here.
        } catch (err) {
            if (!err?.cancelled) {
                console.error('[SocialLoginButtons] native Apple sign-in failed:', err);
                setAppleError(
                    err?.response?.data?.error ||
                    err?.message ||
                    'Apple sign-in failed. Please try again.'
                );
            }
        } finally {
            setAppleBusy(false);
        }
    };

    const handleFacebook = () => {
        window.location.href = `${API_URL}/auth/facebook`;
    };

    const btnSx = dark
        ? {
            py: 1.15,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.08)',
            },
        }
        : {
            py: 1.15,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            borderColor: (t) => t.palette.divider,
            color: 'text.primary',
            '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: (t) => t.palette.action.hover,
            },
        };

    // Apple's Human Interface Guidelines require the button to be solid
    // black (or solid white for dark backgrounds) — not outlined. We use
    // the "contained" variant with an overridden color scheme to match.
    const appleBtnSx = dark
        ? {
            py: 1.15,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            bgcolor: '#fff',
            color: '#000',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#f2f2f2', boxShadow: 'none' },
        }
        : {
            py: 1.15,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            bgcolor: '#000',
            color: '#fff',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#1a1a1a', boxShadow: 'none' },
        };

    return (
        <Box sx={{ width: '100%', ...sx }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={
                        googleBusy
                            ? <CircularProgress size={16} thickness={5} />
                            : <GoogleIcon />
                    }
                    onClick={handleGoogle}
                    disabled={googleBusy}
                    sx={btnSx}
                >
                    {googleBusy ? 'Signing in…' : `${label} with Google`}
                </Button>

                {googleError && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'error.main',
                            fontSize: 12.5,
                            textAlign: 'center',
                            mt: -0.5,
                        }}
                    >
                        {googleError}
                    </Typography>
                )}

                {showAppleButton && (
                    <>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={
                                appleBusy
                                    ? <CircularProgress size={16} thickness={5} sx={{ color: dark ? '#000' : '#fff' }} />
                                    : <AppleIcon color={dark ? '#000' : '#fff'} />
                            }
                            onClick={handleApple}
                            disabled={appleBusy}
                            sx={appleBtnSx}
                        >
                            {appleBusy ? 'Signing in…' : `${label} with Apple`}
                        </Button>

                        {appleError && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'error.main',
                                    fontSize: 12.5,
                                    textAlign: 'center',
                                    mt: -0.5,
                                }}
                            >
                                {appleError}
                            </Typography>
                        )}
                    </>
                )}

                {/* Facebook login temporarily disabled — pending business verification
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FacebookIcon />}
                    onClick={handleFacebook}
                    sx={btnSx}
                >
                    {label} with Facebook
                </Button>
                */}
            </Box>

            {dividerText && (
                <Divider sx={{ my: 2.5, ...(dark && { borderColor: 'rgba(255,255,255,0.15)' }) }}>
                    <Typography variant="body2" sx={{ color: dark ? 'rgba(255,255,255,0.45)' : 'text.secondary', px: 1.5, fontSize: 12.5 }}>
                        {dividerText}
                    </Typography>
                </Divider>
            )}
        </Box>
    );
}

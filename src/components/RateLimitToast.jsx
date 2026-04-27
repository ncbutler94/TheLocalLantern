// frontend/src/components/RateLimitToast.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in global toast that shows a friendly message when the user hits a
// rate limit (429).  Listens for the 'api:rate-limited' CustomEvent that
// secureFetch and axiosInstance dispatch after a failed retry.
//
// Usage — add once near the root of your app (e.g. in App.jsx or Layout):
//   import RateLimitToast from './components/RateLimitToast';
//   ...
//   <RateLimitToast />
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function RateLimitToast() {
    const [open, setOpen] = useState(false);
    const [retryAfter, setRetryAfter] = useState(null);

    const handleRateLimit = useCallback((e) => {
        const sec = e?.detail?.retryAfterSec;
        setRetryAfter(sec && Number.isFinite(sec) ? Math.ceil(sec) : null);
        setOpen(true);
    }, []);

    useEffect(() => {
        window.addEventListener('api:rate-limited', handleRateLimit);
        return () => window.removeEventListener('api:rate-limited', handleRateLimit);
    }, [handleRateLimit]);

    const message = retryAfter
        ? `You're doing that a bit too fast — try again in ${retryAfter}s.`
        : "You're doing that a bit too fast — try again in a moment.";

    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                onClose={() => setOpen(false)}
                severity="warning"
                variant="filled"
                sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}

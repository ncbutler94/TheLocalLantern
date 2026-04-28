// src/components/AppSplash.jsx
//
// Full-screen splash overlay shown on app launch.
// Performs a Ken Burns-style slow zoom on the lantern logo,
// then fades itself out. Sits above all other content via a portal-free
// fixed-position container.
//
// Gating:
//   - Only renders on mobile viewports (MUI `sm` breakpoint and below).
//   - Only renders when the user lands on the home page ("/").
// Both gates are evaluated ONCE on mount so that if the user navigates
// away mid-animation the splash still finishes cleanly, and we don't
// re-show the splash on later visits to "/" in the same session.
//
// Must be rendered INSIDE <Router> so useLocation() works.
//
// Usage: render <AppSplash /> inside the Router in App.js. It
// self-dismisses after ~2.2s so no props/state needed from the parent.

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const SPLASH_VISIBLE_MS  = 2000;   // how long the zoom plays
const FADE_OUT_MS        = 500;    // cross-fade to the app

export default function AppSplash() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { pathname } = useLocation();

    // Capture the "should we show?" decision exactly once on mount.
    // This prevents the splash from disappearing if the user rotates to
    // a wider viewport mid-animation, and prevents it from re-appearing
    // on later returns to "/" in the same session.
    const shouldShowRef = useRef(isMobile && pathname === '/');

    const [stage, setStage] = useState(
        shouldShowRef.current ? 'visible' : 'gone'
    ); // 'visible' -> 'fading' -> 'gone'

    useEffect(() => {
        if (!shouldShowRef.current) return;

        const fadeTimer = setTimeout(() => setStage('fading'), SPLASH_VISIBLE_MS);
        const goneTimer = setTimeout(
            () => setStage('gone'),
            SPLASH_VISIBLE_MS + FADE_OUT_MS
        );
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(goneTimer);
        };
    }, []);

    if (stage === 'gone') return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Matches the Home page background (#1A344D) so there's
                // no color flash when the splash fades into the app.
                bgcolor: '#1A344D',
                opacity: stage === 'fading' ? 0 : 1,
                transition: `opacity ${FADE_OUT_MS}ms ease-out`,
                pointerEvents: stage === 'fading' ? 'none' : 'auto',
                // Ensure splash is above status bar / navigation bars in Capacitor
                // (status bar still shows through since overlaysWebView is false)
            }}
        >
            <Box
                component="img"
                src="/LocalLanternLogoDarkMode.png"
                alt="The Local Lantern"
                sx={{
                    width: { xs: '60vw', sm: '40vw', md: '28vw' },
                    maxWidth: 360,
                    height: 'auto',
                    // Ken Burns: slow zoom-in with subtle drift
                    animation: 'lanternKenBurns 2.4s ease-in-out forwards',
                    transformOrigin: 'center center',
                    // Soft glow to make it feel alive
                    filter: 'drop-shadow(0 0 24px rgba(245, 200, 66, 0.35))',

                    '@keyframes lanternKenBurns': {
                        '0%': {
                            transform: 'scale(0.85) translateY(8px)',
                            opacity: 0,
                        },
                        '20%': {
                            opacity: 1,
                        },
                        '55%': {
                            transform: 'scale(1.08) translateY(-4px)',
                            opacity: 1,
                        },
                        '100%': {
                            transform: 'scale(1.02) translateY(0)',
                            opacity: 1,
                        },
                    },
                }}
            />
        </Box>
    );
}

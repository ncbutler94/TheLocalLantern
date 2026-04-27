// src/components/ContentFadeIn.jsx
//
// Lightweight wrapper that fades its children in using the theme's
// `custom.motion.contentFade` tokens.  Drop it around any inner-content
// block that swaps when the user navigates, clicks a tab, selects a
// post, etc.
//
// Usage:
//   <ContentFadeIn triggerKey={selectedPost?.id}>
//     <PostDetailModal ... />
//   </ContentFadeIn>
//
//   • triggerKey — change this value to re-trigger the animation
//   • disableSlide — set true for a pure opacity fade (no translateY)
//
// The component uses a CSS transition driven by a state toggle so
// there's zero extra dependencies (no framer-motion needed).

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ContentFadeIn({
                                          children,
                                          triggerKey,
                                          disableSlide = false,
                                          sx,
                                      }) {
    const theme = useTheme();
    const cf = theme.custom?.motion?.contentFade;
    const durationMs = cf?.durationMs ?? 260;
    const offsetY = cf?.offsetY ?? 6;
    const ease = theme.custom?.motion?.ease ?? 'cubic-bezier(.2,.8,.2,1)';

    const [visible, setVisible] = useState(false);
    const prevKeyRef = useRef(triggerKey);
    const rafRef = useRef(null);

    useEffect(() => {
        // On first mount OR when the trigger key changes, reset & re-fade.
        if (prevKeyRef.current !== triggerKey) {
            prevKeyRef.current = triggerKey;
            setVisible(false);
        }

        // Allow a single frame for the "hidden" state to paint before fading in.
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = requestAnimationFrame(() => {
                setVisible(true);
            });
        });

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [triggerKey]);

    return (
        <Box
            sx={{
                opacity: visible ? 1 : 0,
                transform: visible || disableSlide
                    ? 'translateY(0px)'
                    : `translateY(${offsetY}px)`,
                transition: `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`,
                willChange: 'opacity, transform',
                width: '100%',
                height: '100%',
                ...sx,
            }}
        >
            {children}
        </Box>
    );
}

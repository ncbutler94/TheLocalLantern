// src/components/LanternIcon.jsx
//
// Custom SVG lantern brand mark for The Local Lantern.
// Replaces the 🏮 emoji for a polished, ownable identity.

import { memo } from 'react';

function LanternIcon({ size = 28, glowColor = '#D4A855', bodyColor = '#C0392B', sx = {}, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            style={{ display: 'block', flexShrink: 0, ...sx }}
            aria-hidden="true"
            {...props}
        >
            <circle cx="32" cy="36" r="22" fill={glowColor} opacity="0.12" />
            <path d="M30 8 Q30 4 32 4 Q34 4 34 8 L34 12 L30 12 Z" fill={glowColor} opacity="0.85" />
            <rect x="24" y="12" width="16" height="4" rx="1.5" fill={glowColor} opacity="0.9" />
            <path d="M24 16 L22 22 Q20 30 22 40 L24 46 L40 46 L42 40 Q44 30 42 22 L40 16 Z" fill={bodyColor} opacity="0.88" />
            <path d="M27 20 L26 26 Q25 32 26 38 L28 42 L36 42 L38 38 Q39 32 38 26 L37 20 Z" fill={glowColor} opacity="0.55" />
            <ellipse cx="32" cy="30" rx="3.5" ry="6" fill={glowColor} opacity="0.9" />
            <ellipse cx="32" cy="29" rx="1.8" ry="3.5" fill="#FFF5E0" opacity="0.85" />
            <rect x="25" y="46" width="14" height="3.5" rx="1.5" fill={glowColor} opacity="0.85" />
            <circle cx="32" cy="52" r="1.5" fill={glowColor} opacity="0.7" />
            <line x1="29" y1="17" x2="28" y2="45" stroke={glowColor} strokeWidth="0.6" opacity="0.25" />
            <line x1="35" y1="17" x2="36" y2="45" stroke={glowColor} strokeWidth="0.6" opacity="0.25" />
        </svg>
    );
}

export default memo(LanternIcon);

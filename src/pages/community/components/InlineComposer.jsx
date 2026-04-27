// src/pages/community/components/InlineComposer.jsx
// -----------------------------------------------------------------------------
// Inline composer that lives above the Feed on mobile. A single compact row
// with an avatar and "Share with your community..." placeholder. Tapping the
// row opens the SmartPostDialog, which ALWAYS starts on the category picker
// so users make a deliberate category choice before seeing any form fields.
//
// Previous versions had shortcut icons (camera/poll/location) that bypassed
// the picker. Those were removed because they caused category miscategorization
// (the picker is the whole point — it prevents users from funneling everything
// into "Discussion").
//
// Props:
//   - viewerUser: the current user object (for avatar)
//   - defaultCounty / defaultCity: forwarded to the dialog (unused here)
//   - onCompose(intent): called when the user taps the composer.
//       intent = { category: '', prefillText: string }
//       category is always '' so SmartPostDialog shows the picker.
//   - isNonPersonalAccount: if true, the parent shows the switch-account dialog
//   - isLoggedIn: if false, parent redirects to login
// -----------------------------------------------------------------------------

import React, { useRef, useState } from 'react';
import {
    Avatar,
    Box,
    InputBase,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

/* ---------- placeholder ----------
   A single, stable placeholder. Kept intentionally short and action-oriented
   so the composer reads the same every time — rotating prompts ended up
   feeling random and distracting. */
const COMPOSER_PLACEHOLDER = 'Share with your community\u2026';

/* ---------- the component ---------- */
export default function InlineComposer({
                                           viewerUser,
                                           defaultCounty = '',
                                           defaultCity = '',
                                           onCompose,
                                           isLoggedIn = true,
                                           isNonPersonalAccount = false,
                                           onRequireLogin,
                                           onRequireAccountSwitch,
                                       }) {
    const theme = useTheme();
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    /* ---------- gate: auth + account type ---------- */
    const gateAndProceed = (proceed) => {
        if (!isLoggedIn) {
            if (typeof onRequireLogin === 'function') onRequireLogin();
            return;
        }
        if (isNonPersonalAccount) {
            if (typeof onRequireAccountSwitch === 'function') onRequireAccountSwitch();
            return;
        }
        proceed();
    };

    /* ---------- tap handler ----------
       There's only one outcome now: tap the composer → category picker opens.
       Shortcut icons (camera/poll/location) that bypassed the picker have
       been removed to keep the flow predictable and consistent. */
    const handleOpenComposer = () => {
        gateAndProceed(() => {
            // Blur the hidden input so the mobile keyboard doesn't flash up
            // before the dialog mounts.
            if (inputRef.current) inputRef.current.blur();
            onCompose?.({
                category: '', // empty = always show category picker first
                prefillText: text,
            });
            setText('');
        });
    };

    /* ---------- avatar ----------
       Matches the exact logic Header.jsx uses:
         - avatar_url takes precedence, falls back to profile_picture
         - strings like "default_avatar" / "null" / "undefined" are treated
           as "no avatar set" → we show the PersonRoundedIcon fallback
       Keep this in sync with Header's activeAvatarSrc() when that changes. */
    const isPlaceholderAvatar = (url) => {
        if (!url) return true;
        const s = String(url).trim().toLowerCase();
        if (!s || s === 'null' || s === 'undefined') return true;
        return (
            s.includes('default_avatar') ||
            s.includes('default_business') ||
            s.includes('default_logo') ||
            s.includes('default-avatar') ||
            s.includes('placeholder')
        );
    };
    const rawAvatar = viewerUser?.avatar_url || viewerUser?.profile_picture || null;
    const avatarSrc = isPlaceholderAvatar(rawAvatar) ? null : rawAvatar;
    const avatarAlt = viewerUser
        ? `${viewerUser.first_name || ''} ${viewerUser.last_name || ''}`.trim() || viewerUser.handle || 'You'
        : 'You';

    return (
        <Box
            sx={(t) => ({
                mx: 1.5,
                mt: 1.25,
                mb: 1,
                px: 1.5,
                py: 1,
                borderRadius: 3,
                bgcolor: t.palette.background.paper,
                border: '1px solid',
                borderColor: alpha(t.palette.text.primary, 0.08),
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                // Subtle affordance
                transition: 'border-color 120ms ease, box-shadow 120ms ease',
                '&:hover': {
                    borderColor: alpha(t.palette.text.primary, 0.18),
                },
            })}
            role="button"
            aria-label="Create a new community post"
            onClick={handleOpenComposer}
        >
            {/* Avatar — matches Header's top-right avatar treatment */}
            <Avatar
                src={avatarSrc || undefined}
                alt={avatarAlt}
                imgProps={{ referrerPolicy: 'no-referrer' }}
                sx={(t) => ({
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    bgcolor: avatarSrc ? 'transparent' : alpha(t.palette.primary.main, 0.08),
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiAvatar-img': {
                        objectFit: 'cover',
                    },
                })}
            >
                {!avatarSrc && <PersonRoundedIcon sx={{ fontSize: 20 }} />}
            </Avatar>

            {/* Text field — acts as a trigger, not a real input.
                We render an InputBase purely for placeholder styling; clicking
                anywhere in the row opens the dialog. */}
            <InputBase
                inputRef={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={handleOpenComposer}
                placeholder={COMPOSER_PLACEHOLDER}
                readOnly
                sx={{
                    flex: 1,
                    fontSize: 14.5,
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '& input': {
                        cursor: 'pointer',
                        padding: 0,
                    },
                    '& input::placeholder': {
                        opacity: 0.9,
                        color: theme.palette.text.secondary,
                    },
                }}
                inputProps={{
                    'aria-label': 'Create a new community post',
                }}
            />
        </Box>
    );
}

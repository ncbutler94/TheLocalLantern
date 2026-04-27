/**
 * AccountAvatar — Drop-in replacement for <Avatar> with account-type-aware fallbacks.
 *
 * Instead of showing default_avatar.png for every account, this renders:
 *   • PersonRoundedIcon   → personal / user accounts
 *   • StorefrontRoundedIcon → business accounts
 *   • MusicNoteRoundedIcon  → artist accounts
 *
 * Usage:
 *   <AccountAvatar
 *     src={user.avatar_url}
 *     alt={user.name}
 *     accountType="business"       // "user" | "business" | "artist"
 *     profileType="artist"         // (artist accounts only) "music" | "artist" — picks music-note vs palette icon for the no-image fallback. Defaults to "music" when omitted.
 *     size={44}                     // number or { xs: 36, sm: 44 }
 *     onClick={handleClick}
 *     sx={{ border: '2px solid red' }}
 *   />
 *
 * You can also pass accountType detection props for convenience:
 *   <AccountAvatar
 *     src={node.avatar}
 *     businessId={node.business_id}
 *     businessName={node.business_name}
 *     artistId={node.artist_id}
 *     artistName={node.artist_name}
 *   />
 *
 * All extra props (onClick, onMouseEnter, ref, etc.) are forwarded to MUI <Avatar>.
 */
import React from 'react';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';

/* ── Icon config (defined outside component — never recreated) ── */
const ACCOUNT_ICON_MAP = {
    business: StorefrontRoundedIcon,
    artist: MusicNoteRoundedIcon,
    user: PersonRoundedIcon,
};

/* ── Helpers (stable references — no re-render cost) ────────── */
function resolveAccountType({ accountType, businessId, businessName, artistId, artistName }) {
    if (accountType) {
        const t = String(accountType).toLowerCase();
        if (t === 'business') return 'business';
        if (t === 'artist') return 'artist';
        return 'user';
    }
    if (businessId || businessName) return 'business';
    if (artistId || artistName) return 'artist';
    return 'user';
}

function getIconFontSize(size) {
    if (typeof size === 'number') {
        if (size >= 56) return 28;
        if (size >= 44) return 22;
        if (size >= 36) return 19;
        return 16;
    }
    // Responsive object — return a safe default; the icon scales fine
    return 22;
}

/* ── Component ──────────────────────────────────────────────── */
const AccountAvatar = React.forwardRef(function AccountAvatar(props, ref) {
    const {
        src,
        alt,
        accountType: accountTypeProp,
        // Sub-type for artist accounts: 'music' (musicians, default) or 'artist'
        // (visual artists — painters/photographers/etc). Ignored when accountType
        // isn't 'artist'. Reads from artist.profile_type at call sites.
        profileType: profileTypeProp,
        businessId,
        businessName,
        artistId,
        artistName,
        size = 44,
        sx,
        children,
        ...rest
    } = props;

    const type = resolveAccountType({
        accountType: accountTypeProp,
        businessId,
        businessName,
        artistId,
        artistName,
    });

    const hasImage = Boolean(src && String(src).trim());

    // For artist accounts, pick Music Note (musician) vs Palette (visual artist)
    // based on profileType. Anything not explicitly 'artist' keeps the legacy
    // music-note fallback so existing callers are unaffected.
    let FallbackIcon = ACCOUNT_ICON_MAP[type] || PersonRoundedIcon;
    if (type === 'artist') {
        const sub = String(profileTypeProp || '').toLowerCase();
        FallbackIcon = (sub === 'artist') ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    }

    const iconSize = getIconFontSize(size);

    // Build size sx — supports both number and responsive object
    const sizeSx =
        typeof size === 'number'
            ? { width: size, height: size }
            : { width: size, height: size };

    return (
        <Avatar
            ref={ref}
            src={hasImage ? src : undefined}
            alt={alt || ''}
            sx={(t) => {
                // Merge caller sx (which may also be a function)
                const callerSx = typeof sx === 'function' ? sx(t) : sx;

                // Default styling per account type when no image
                const fallbackSx = hasImage
                    ? {}
                    : type === 'user'
                        ? {
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                        }
                        : type === 'business'
                            ? {
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                            }
                            : {
                                // artist
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                            };

                return {
                    ...sizeSx,
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: alpha(t.palette.text.primary, 0.06),
                    ...fallbackSx,
                    ...callerSx,
                };
            }}
            {...rest}
        >
            {!hasImage ? <FallbackIcon sx={{ fontSize: iconSize }} /> : null}
            {children}
        </Avatar>
    );
});

export default AccountAvatar;

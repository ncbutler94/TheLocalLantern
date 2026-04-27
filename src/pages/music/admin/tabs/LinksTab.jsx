// src/pages/music/admin/tabs/LinksTab.jsx
/**
 * LinksTab – Artist social / streaming links.
 * Matches the BusinessAdminPage pattern: each platform is a fixed row with
 * the site prefix baked into an InputAdornment so the user only types their
 * handle or slug.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Box,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";
import { themedInputSx } from "../../../../components/themedInputSx";

import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import LanguageIcon from "@mui/icons-material/Language";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { updateArtist } from "../../api/artists";
import { checkFieldsProfanity } from '../../../../utils/profanityCheck';

// ── Platform definitions ────────────────────────────────────────────
// `key`    – the property name stored in artist.links  (e.g. links.spotify)
// `label`  – TextField label text
// `prefix` – non-editable URL prefix shown in the adornment
// `icon`   – MUI icon element (or an SVG for platforms without one)
// `placeholder` – ghost text in the input
// `color`  – icon tint

const SpotifyIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.52 17.28c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.7 1.32.36.22.48.66.24 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.99-.12-1.11-.6-.12-.48.12-.99.6-1.11 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.21 1.17zm.12-3.42C15.24 8.4 8.88 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-.96 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
    </svg>
);

const AppleMusicIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
        <path d="M23.997 6.124a9.23 9.23 0 0 0-.24-2.19 4.66 4.66 0 0 0-1.09-1.86 4.52 4.52 0 0 0-1.86-1.09A9.23 9.23 0 0 0 18.617.744C17.727.7 17.427.69 14.997.69h-6c-2.43 0-2.73.01-3.62.054a9.23 9.23 0 0 0-2.19.24 4.66 4.66 0 0 0-1.86 1.09 4.52 4.52 0 0 0-1.09 1.86 9.23 9.23 0 0 0-.24 2.19C.957 7.014.947 7.314.947 9.744v4.512c0 2.43.01 2.73.054 3.62a9.23 9.23 0 0 0 .24 2.19 4.66 4.66 0 0 0 1.09 1.86 4.52 4.52 0 0 0 1.86 1.09 9.23 9.23 0 0 0 2.19.24c.89.044 1.19.054 3.62.054h4.512c2.43 0 2.73-.01 3.62-.054a9.23 9.23 0 0 0 2.19-.24 4.88 4.88 0 0 0 2.95-2.95 9.23 9.23 0 0 0 .24-2.19c.044-.89.054-1.19.054-3.62V9.744c0-2.43-.01-2.73-.054-3.62zM17.997 16.284a.75.75 0 0 1-.75.75.75.75 0 0 1-.75-.75v-5.46l-6 1.2v5.01a.75.75 0 0 1-.75.75.75.75 0 0 1-.75-.75V9.744a.75.75 0 0 1 .6-.735l7.5-1.5a.75.75 0 0 1 .9.735v8.04z" />
    </svg>
);

const YouTubeIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.56 31.56 0 0 0 0 12a31.56 31.56 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.56 31.56 0 0 0 24 12a31.56 31.56 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
);

const SoundCloudIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
        <path d="M1.14 14.23c-.06 0-.1-.04-.11-.1L.7 12.01l.33-2.08c.01-.06.05-.1.11-.1s.1.04.11.1l.39 2.08-.39 2.12c-.01.06-.05.1-.11.1zm1.87.7c-.06 0-.11-.04-.12-.11L2.6 12.01l.29-3.53c.01-.07.06-.11.12-.11s.11.04.12.11l.33 3.53-.33 2.81c-.01.07-.06.11-.12.11zm1.9.14c-.07 0-.12-.05-.13-.12l-.27-2.94.27-3.88c.01-.07.06-.12.13-.12s.12.05.13.12l.31 3.88-.31 2.94c-.01.07-.06.12-.13.12zm1.92.02c-.08 0-.14-.06-.14-.14l-.24-2.94.24-4.21c.01-.08.07-.14.14-.14.08 0 .14.06.15.14l.27 4.21-.27 2.94c-.01.08-.07.14-.15.14zm1.93-.05c-.08 0-.15-.06-.16-.15l-.21-2.88.21-4.38c.01-.09.08-.15.16-.15.09 0 .15.06.16.15l.24 4.38-.24 2.88c-.01.09-.07.15-.16.15zm1.94.05c-.09 0-.16-.07-.17-.16l-.19-2.92.19-4.49c.01-.1.08-.17.17-.17.09 0 .16.07.17.17l.21 4.49-.21 2.92c-.01.09-.08.16-.17.16zm3.86-.12c-.1 0-.18-.08-.18-.18L14.2 12l.18-5.81c0-.1.08-.18.18-.18.1 0 .18.08.19.18l.16 5.81-.16 2.89c-.01.1-.09.18-.19.18zm1.93-.02c-.1 0-.18-.08-.19-.18l-.12-2.81.12-5.98c0-.11.09-.19.19-.19.11 0 .19.08.19.19l.14 5.98-.14 2.81c0 .1-.08.18-.19.18zm3.73-.02c-.11 0-.19-.09-.19-.2l-.07-2.6c0 0 .07-5.85.07-5.86 0-.11.09-.2.19-.2a2.81 2.81 0 0 1 0 0c.78 0 3.3.11 4.52 1.54.67.78 1.01 1.77 1.01 2.94 0 2.81-1.97 4.38-5.53 4.38z" />
    </svg>
);

const TikTokIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.15z" />
    </svg>
);

const BandcampIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z" />
    </svg>
);

// All platform definitions live in one map. The MUSIC_PLATFORMS and
// ARTIST_PLATFORMS arrays below pick from this and control ordering per
// profile type. To add a new platform, define it here and add its key to
// the relevant list(s).
const PLATFORMS = {
    spotify:     { key: "spotify",     label: "Spotify",       prefix: "open.spotify.com/artist/", icon: <SpotifyIcon />,                         color: "#1DB954",      placeholder: "artist-id" },
    apple_music: { key: "apple_music", label: "Apple Music",   prefix: "music.apple.com/artist/",  icon: <AppleMusicIcon />,                      color: "#FA233B",      placeholder: "artist-name/id" },
    youtube:     { key: "youtube",     label: "YouTube",       prefix: "youtube.com/",             icon: <YouTubeIcon />,                         color: "#FF0000",      placeholder: "@yourchannel" },
    soundcloud:  { key: "soundcloud",  label: "SoundCloud",    prefix: "soundcloud.com/",          icon: <SoundCloudIcon />,                      color: "#FF5500",      placeholder: "yourprofile" },
    bandcamp:    { key: "bandcamp",    label: "Bandcamp",      prefix: ".bandcamp.com",            icon: <BandcampIcon />,                        color: "#1DA0C3",      placeholder: "yourname", prefixPosition: "end" },
    instagram:   { key: "instagram",   label: "Instagram",     prefix: "instagram.com/",           icon: <InstagramIcon sx={{ fontSize: 20 }} />, color: "#E4405F",      placeholder: "yourhandle" },
    tiktok:      { key: "tiktok",      label: "TikTok",        prefix: "tiktok.com/@",             icon: <TikTokIcon />,                          color: "#000000",      placeholder: "yourhandle" },
    twitter:     { key: "twitter",     label: "X (Twitter)",   prefix: "x.com/",                   icon: <XIcon sx={{ fontSize: 18 }} />,         color: "text.primary", placeholder: "yourhandle" },
    facebook:    { key: "facebook",    label: "Facebook",      prefix: "facebook.com/",            icon: <FacebookIcon sx={{ fontSize: 20 }} />,  color: "#1877F2",      placeholder: "yourpage" },
    etsy:        { key: "etsy",        label: "Etsy Shop",     prefix: "etsy.com/shop/",           icon: <StorefrontIcon sx={{ fontSize: 20 }} />, color: "#F1641E",     placeholder: "yourshop" },
    website:     { key: "website",     label: "Website",       prefix: "",                         icon: <LanguageIcon sx={{ fontSize: 20 }} />,  color: "primary.main", placeholder: "https://yourwebsite.com", fullUrl: true },
};

// Music artists — unchanged from before.
const MUSIC_PLATFORMS = [
    PLATFORMS.spotify,
    PLATFORMS.apple_music,
    PLATFORMS.youtube,
    PLATFORMS.soundcloud,
    PLATFORMS.bandcamp,
    PLATFORMS.instagram,
    PLATFORMS.tiktok,
    PLATFORMS.twitter,
    PLATFORMS.facebook,
    PLATFORMS.website,
];

// Visual artists — streamlined to socials + Etsy + site.
const ARTIST_PLATFORMS = [
    PLATFORMS.facebook,
    PLATFORMS.instagram,
    PLATFORMS.twitter,
    PLATFORMS.etsy,
    PLATFORMS.website,
];

/**
 * LinksTab
 * Each platform is a pre-labelled TextField — the user only enters their
 * handle / slug.  The prefix is displayed as a non-editable InputAdornment.
 */
export default function LinksTab({
                                     artist,
                                     onRefresh,
                                     onSaveToast,
                                     registerSaveHandler,
                                     onFieldChange,
                                     registerDataCollector,
                                 }) {
    // links stored as { spotify: "abc123", instagram: "handle", ... }
    const [links, setLinks] = useState({});
    const [originalLinks, setOriginalLinks] = useState({});

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const currentLinksRef = useRef({});
    currentLinksRef.current = links;

    // Register data collector so parent can read current links on global save
    useEffect(() => {
        if (typeof registerDataCollector !== "function") return undefined;
        return registerDataCollector("links", () => ({ links: currentLinksRef.current }));
    }, [registerDataCollector]);

    // Hydrate from artist prop
    useEffect(() => {
        if (!artist) return;
        const raw = (artist.links && typeof artist.links === "object") ? { ...artist.links } : {};
        setLinks(raw);
        setOriginalLinks(raw);
        setError("");
        setSuccess("");
    }, [artist]);

    const hasChanges = JSON.stringify(links) !== JSON.stringify(originalLinks);

    // Report changes to parent for live preview
    const prevLinksRef = useRef("");
    useEffect(() => {
        if (typeof onFieldChange !== "function") return;
        const key = JSON.stringify(links);
        if (key === prevLinksRef.current) return;
        prevLinksRef.current = key;
        onFieldChange({ links });
    });

    const handleLinkChange = (platformKey, value) => {
        setLinks((prev) => ({ ...prev, [platformKey]: value }));
    };

    const handleSave = useCallback(async () => {
        setError("");
        setSuccess("");

        // Client-side profanity check on link values
        const profanityFields = {};
        Object.entries(links).forEach(([k, v]) => {
            if (v && v.trim()) profanityFields[k] = v.trim();
        });
        if (Object.keys(profanityFields).length > 0) {
            const profanityResult = checkFieldsProfanity(profanityFields);
            if (!profanityResult.clean) {
                setError(`Your ${profanityResult.field} link contains inappropriate language. Please revise and try again.`);
                return false;
            }
        }

        // Block javascript: and data: URLs
        for (const [key, val] of Object.entries(links)) {
            const v = String(val || '').trim().toLowerCase();
            if (/^javascript:/i.test(v) || /^data:/i.test(v)) {
                setError(`Your ${key} link contains a disallowed URL scheme. Please use a normal web link.`);
                return false;
            }
        }

        setSaving(true);

        try {
            // Strip empty values before saving
            const cleaned = {};
            Object.entries(links).forEach(([k, v]) => {
                if (v && v.trim()) cleaned[k] = v.trim();
            });

            await updateArtist({
                artistId: artist.id,
                payload: {
                    links: cleaned,
                    links_json: JSON.stringify(cleaned),
                },
            });

            setSuccess("Links updated successfully!");
            setOriginalLinks({ ...cleaned });

            if (typeof onRefresh === "function") await onRefresh();
            if (typeof onSaveToast === "function") onSaveToast("Links updated successfully!");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not save links.";
            setError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [artist, links, onRefresh, onSaveToast]);

    useEffect(() => {
        if (typeof registerSaveHandler !== "function") return undefined;
        return registerSaveHandler({
            key: "links",
            save: handleSave,
            hasChanges,
            saving,
        });
    }, [registerSaveHandler, handleSave, hasChanges, saving]);

    // Pick the platform list to render based on profile type.
    // Defaults to music when the type is missing/unknown so existing artists
    // keep seeing the full list until the new column is populated.
    const profileType = String(artist?.profile_type || artist?.profileType || "").toLowerCase();
    const platforms = (profileType === "artist") ? ARTIST_PLATFORMS : MUSIC_PLATFORMS;

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                    {success}
                </Alert>
            )}

            <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                    {profileType === "artist"
                        ? "Add your social links and shop so fans can find and support your work."
                        : "Add your streaming profiles and social links so fans can find you everywhere."}
                </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {platforms.map((platform) => (
                    <TextField
                        key={platform.key}
                        label={platform.label}
                        value={links[platform.key] || ""}
                        onChange={(e) => handleLinkChange(platform.key, e.target.value.slice(0, 500))}
                        fullWidth
                        size="small"
                        placeholder={platform.placeholder}
                        inputProps={{ autoComplete: "new-password", maxLength: 500 }}
                        helperText={`${(links[platform.key] || "").length}/500`}
                        InputProps={{
                            sx: themedInputSx,
                            startAdornment: platform.prefix ? (
                                <InputAdornment position="start" sx={{ mr: 0 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            color: platform.color,
                                            mr: 0.75,
                                            fontSize: 20,
                                        }}
                                    >
                                        {platform.icon}
                                    </Box>
                                    {!platform.prefixPosition && (
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                color: "text.secondary",
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {platform.prefix}
                                        </Typography>
                                    )}
                                </InputAdornment>
                            ) : (
                                <InputAdornment position="start" sx={{ mr: 0 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            color: platform.color,
                                            mr: 0.75,
                                            fontSize: 20,
                                        }}
                                    >
                                        {platform.icon}
                                    </Box>
                                </InputAdornment>
                            ),
                            endAdornment: platform.prefixPosition === "end" ? (
                                <InputAdornment position="end">
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: "text.secondary",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {platform.prefix}
                                    </Typography>
                                </InputAdornment>
                            ) : undefined,
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
}

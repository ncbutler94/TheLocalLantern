// src/pages/music/components/ArtistDiscoverTab.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    Divider,
    Fade,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InstagramMuiIcon from "@mui/icons-material/Instagram";
import FacebookMuiIcon from "@mui/icons-material/Facebook";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import PulsingDots from "../../../components/PulsingDots";
import RichTextDisplay from "../../../components/RichTextDisplay";
import { getDiscoverStaggerSx, adaptColor } from "../../../themes/theme";

// ─── Branded SVG Icons ───────────────────────────────────

function FacebookIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
        </Box>
    );
}

function InstagramIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <defs>
                <linearGradient id="ig-grad-disc" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" /><stop offset="25%" stopColor="#F77737" />
                    <stop offset="50%" stopColor="#E1306C" /><stop offset="75%" stopColor="#C13584" />
                    <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.778.91.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.76 1.831 9.14 1.82 12 1.82zm0-1.657C8.741.163 8.332.175 7.052.234 5.775.293 4.902.5 4.14.81a5.726 5.726 0 00-2.08 1.356A5.726 5.726 0 00.705 4.245C.4 5.007.19 5.88.134 7.157.075 8.437.063 8.846.063 12.106s.012 3.668.07 4.948c.058 1.277.265 2.15.572 2.912a5.726 5.726 0 001.356 2.08 5.726 5.726 0 002.08 1.356c.762.306 1.636.513 2.912.571 1.28.059 1.689.07 4.948.07s3.668-.012 4.948-.07c1.277-.058 2.15-.265 2.912-.571a5.726 5.726 0 002.08-1.356 5.726 5.726 0 001.356-2.08c.306-.762.513-1.636.571-2.912.059-1.28.07-1.689.07-4.948s-.012-3.668-.07-4.948c-.058-1.277-.265-2.15-.571-2.912a5.726 5.726 0 00-1.356-2.08A5.726 5.726 0 0019.86.81c-.762-.306-1.636-.513-2.912-.571C15.668.175 15.259.163 12 .163zm0 5.838a5.838 5.838 0 100 11.676 5.838 5.838 0 000-11.676zm0 9.838a4 4 0 110-8 4 4 0 010 8zm6.406-10.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" fill="url(#ig-grad-disc)" />
        </Box>
    );
}

function TikTokIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#25F4EE" />
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#FE2C55" transform="translate(0.8, -0.8)" />
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#000" />
        </Box>
    );
}

function SpotifyIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954" />
        </Box>
    );
}

function AppleMusicIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 361 361" sx={{ width: size, height: size, display: "block" }}>
            <linearGradient id="am-g" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#FA233B" /><stop offset="100%" stopColor="#FB5C74" /></linearGradient>
            <rect width="361" height="361" rx="80" fill="url(#am-g)" />
            <path d="M255 96.7v131.8c0 14.6-9 26.3-25.3 29.7-6 1.3-12.3 1-17.8-1.5-7.6-3.5-12.2-10.2-12.8-18.6-.7-10 4.3-18.4 13.2-22.7 5.6-2.7 11.7-3.7 17.8-4.5 4-.5 8-1.2 11-3.8 2-1.7 3-4 3-6.8V137l-88 19.7v103c0 14.8-8.8 26.4-25.3 29.9-5.9 1.3-12 1-17.4-1.3-7.8-3.3-12.6-9.9-13.3-18.3-.9-10.2 4-18.8 13-23.2 5.5-2.7 11.5-3.8 17.6-4.6 4.2-.6 8.3-1.3 11.3-4 1.8-1.5 2.8-3.7 2.9-6.2V115c0-3.5 1-6.3 4-8.3 2-1.3 4.3-2 6.7-2.5l78-17.5c3.5-.8 7-1.5 10.6-.7 4.6 1.1 7.3 4.1 7.6 8.9.1.6.1 1.2.1 1.8z" fill="#fff" />
        </Box>
    );
}

function YouTubeIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
        </Box>
    );
}

function SoundCloudIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.057-.05-.1-.1-.1m-.899.828c-.06 0-.091.038-.098.085L0 15.479l.178 1.29c.007.047.038.085.098.085.058 0 .087-.038.098-.085l.216-1.29-.216-1.341c-.011-.047-.04-.085-.098-.085m1.82-1.466c-.062 0-.112.054-.12.114l-.206 2.809.206 2.678c.008.06.058.114.12.114s.11-.054.118-.114l.238-2.678-.238-2.809c-.008-.06-.056-.114-.118-.114m.859-.067c-.07 0-.13.062-.137.13l-.18 2.876.18 2.744c.007.069.067.131.137.131.068 0 .127-.062.136-.131l.208-2.744-.208-2.876c-.009-.068-.068-.13-.136-.13m.878-.373c-.079 0-.145.068-.151.148l-.164 3.249.164 2.78c.006.079.072.148.151.148.077 0 .143-.069.15-.148l.19-2.78-.19-3.249c-.007-.08-.073-.148-.15-.148m.903-.169c-.088 0-.161.078-.166.166l-.15 3.418.15 2.793c.005.088.078.165.166.165.086 0 .159-.077.166-.165l.17-2.793-.17-3.418c-.007-.088-.08-.166-.166-.166m.947.023c-.095 0-.175.083-.18.18l-.133 3.216.133 2.79c.005.094.085.179.18.179.093 0 .173-.085.18-.179l.153-2.79-.153-3.216c-.007-.097-.087-.18-.18-.18m.965-.285c-.1 0-.189.091-.193.197l-.118 3.5.118 2.791c.004.104.093.197.193.197.098 0 .188-.093.193-.197l.136-2.791-.136-3.5c-.005-.106-.095-.197-.193-.197m1.004-.312c-.104 0-.204.097-.208.213l-.104 3.813.104 2.79c.004.115.104.213.208.213.107 0 .204-.098.21-.213l.117-2.79-.117-3.813c-.006-.116-.103-.213-.21-.213m1.025-.07c-.114 0-.213.104-.216.228l-.093 3.883.093 2.782c.003.124.102.228.216.228.114 0 .214-.104.218-.228l.106-2.782-.106-3.883c-.004-.124-.104-.228-.218-.228m1.055-.06c-.12 0-.226.112-.228.245l-.083 3.943.083 2.775c.002.131.108.245.228.245.12 0 .227-.114.228-.245l.095-2.775-.095-3.943c-.001-.133-.108-.245-.228-.245m1.217-.137c-.009-.14-.12-.257-.242-.257s-.232.117-.242.257l-.073 4.08.073 2.769c.01.14.12.258.242.258s.233-.118.242-.258l.084-2.769-.084-4.08m.79-.264c-.14 0-.262.124-.267.274l-.058 4.344.058 2.765c.005.148.127.274.267.274.14 0 .262-.126.267-.274l.067-2.765-.067-4.344c-.005-.15-.127-.274-.267-.274m1.094.115c-.008-.162-.137-.294-.279-.294-.142 0-.27.132-.28.294l-.054 4.229.054 2.758c.01.159.138.292.28.292.141 0 .271-.133.279-.292l.061-2.758-.061-4.229m.738-.138c-.148 0-.28.14-.283.306l-.044 4.367.044 2.749c.003.163.135.307.283.307.148 0 .282-.144.285-.307l.05-2.749-.05-4.367c-.003-.166-.137-.306-.285-.306m1.312.272c-.008-.175-.146-.318-.296-.318s-.287.143-.296.318l-.035 4.095.035 2.742c.009.173.146.316.296.316s.288-.143.296-.316l.04-2.742-.04-4.095m.783-.15c-.003-.184-.15-.332-.305-.332-.156 0-.3.148-.305.332l-.032 4.245.032 2.736c.005.182.149.33.305.33.155 0 .302-.148.305-.33l.035-2.736-.035-4.245m1.372-.471c-.006-.006-.016-.015-.027-.015a3.313 3.313 0 00-1.396-.296c-.326 0-.644.044-.944.13-.156.043-.203.116-.203.273v7.349c0 .166.134.307.296.315h2.274c.857 0 1.551-.703 1.551-1.571 0-.868-.694-1.572-1.551-1.572" fill="#FF5500" />
        </Box>
    );
}

// ─── Theme-aware social icon color (matches ArtistCard) ─────
function getLinkColor(key, theme) {
    const k = String(key).toLowerCase();
    const isDark = theme?.palette?.mode === "dark";
    const social = theme?.custom?.brand?.social || theme?.custom?.social || {};
    if (k.includes("instagram")) return social.instagram || "#E4405F";
    if (k.includes("facebook")) return social.facebook || "#1877F2";
    if (k.includes("tiktok")) return social.tiktok || (isDark ? theme.palette.text.primary : "#000000");
    if (k.includes("website") || k.includes("web")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || "#4A5568");
    if (k.includes("email") || k.includes("mail")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || "#4A5568");
    return null;
}

function TikTokCurrentColorIcon({ size = 14 }) {
    return (
        <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13.1a8.16 8.16 0 005.58 2.2V11.9a4.85 4.85 0 01-3.58-1.63V6.69h3.58z" />
            </svg>
        </Box>
    );
}

// ─── Video Player ────────────────────────────────────────

function BunnyVideoPlayer({ videoId }) {
    const [embedUrl, setEmbedUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!videoId) { setLoading(false); return; }
        let cancelled = false;
        fetch(`/api/video/embed-url/${videoId}`)
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((d) => { if (!cancelled) { setEmbedUrl(d.embedUrl.replace("&autoplay=true", "")); setLoading(false); } })
            .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
        return () => { cancelled = true; };
    }, [videoId]);

    if (!videoId) return null;

    if (loading) {
        return (
            <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 3, overflow: "hidden", bgcolor: (t) => alpha(t.palette.common.black, 0.06) }}>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress size={32} />
                </Box>
            </Box>
        );
    }

    if (error || !embedUrl) {
        return (
            <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 3, overflow: "hidden", bgcolor: (t) => alpha(t.palette.common.black, 0.06) }}>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
                    <PlayArrowRoundedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="caption" color="text.secondary">Video unavailable</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 3, overflow: "hidden", boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.12)}` }}>
            <iframe
                src={embedUrl}
                title="Featured video"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
                allowFullScreen
            />
        </Box>
    );
}

// ─── Streaming config ────────────────────────────────────

const STREAM_CONFIG = [
    { key: "spotify", label: "Spotify", Icon: SpotifyIcon, color: "#1DB954" },
    { key: "appleMusic", label: "Apple Music", Icon: AppleMusicIcon, color: "#FA233B" },
    { key: "youtube", label: "YouTube", Icon: YouTubeIcon, color: "#FF0000" },
    { key: "soundcloud", label: "SoundCloud", Icon: SoundCloudIcon, color: "#FF5500" },
    { key: "bandcamp", label: "Bandcamp", Icon: MusicNoteRoundedIcon, isMui: true, color: "#1DA0C3" },
];

// ─── Artist Spotlight Card ──────────────────────────────
// ─── Highlight Section Icon helper ───────────────────
const HL_ICONS_ARTIST = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Album: AlbumRoundedIcon,
    Music: MusicNoteRoundedIcon,
    Headphones: HeadphonesRoundedIcon,
    Event: EventRoundedIcon,
    Groups: GroupsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
};
function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS_ARTIST[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ─── Ken Burns Slideshow for Cover Photos ────────────────

function getCoverPhotos(item) {
    const arr = Array.isArray(item.cover_photos) ? item.cover_photos.filter(Boolean) : [];
    if (arr.length > 0) return arr;
    if (item.cover_photo_url) return [item.cover_photo_url];
    return [];
}

const KB_DURATION = 6000;
const KB_TRANSITION = 1500;

const KB_VARIANTS = [
    { transform: "scale(1.0)", transformEnd: "scale(1.18) translate(-1.5%, 0%)" },
    { transform: "scale(1.0)", transformEnd: "scale(1.18) translate(1.5%, 0%)" },
    { transform: "scale(1.12) translate(-1%, 0%)", transformEnd: "scale(1.0) translate(1%, 1%)" },
    { transform: "scale(1.12) translate(1%, 1%)", transformEnd: "scale(1.0) translate(-1%, 0%)" },
];

function CoverSlideshow({ photos, coverPosition, height, onClick, children }) {
    const images = Array.isArray(photos) && photos.length > 0 ? photos : [];
    const [activeIdx, setActiveIdx] = useState(() => Math.floor(Math.random() * (images.length || 1)));
    const [imgCycles, setImgCycles] = useState(() => images.map((_, i) => i));
    const uidRef = useRef(`kb${Math.random().toString(36).slice(2, 8)}`);
    const globalCycleRef = useRef(images.length);

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx((prev) => {
                const next = (prev + 1) % images.length;
                const newCycle = globalCycleRef.current++;
                setImgCycles((prev) => {
                    const copy = [...prev];
                    copy[next] = newCycle;
                    return copy;
                });
                return next;
            });
        }, KB_DURATION);
        return () => clearInterval(interval);
    }, [images.length]);

    if (images.length === 0) return null;

    const uid = uidRef.current;
    const kbAnimDuration = KB_DURATION + KB_TRANSITION;
    const allKeyframes = images.map((_, idx) => {
        const myCycle = imgCycles[idx] ?? idx;
        const variant = KB_VARIANTS[myCycle % KB_VARIANTS.length];
        return `@keyframes ${uid}_${idx}_${myCycle} { 0% { transform: ${variant.transform}; } 100% { transform: ${variant.transformEnd}; } }`;
    }).join("\n");

    return (
        <Box sx={{ position: "relative", width: "100%", height, overflow: "hidden", bgcolor: "grey.900" }}>
            <style>{allKeyframes}</style>
            {images.map((src, idx) => {
                const isActive = idx === activeIdx;
                const myCycle = imgCycles[idx] ?? idx;
                return (
                    <React.Fragment key={src + idx}>
                        {/* Blurred backdrop fill — uses cover so it always paints the full container,
                            so when the foreground image is `contain`-fit the empty space looks intentional */}
                        <Box
                            component="img"
                            src={src}
                            alt=""
                            aria-hidden
                            draggable={false}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                display: "block",
                                opacity: isActive ? 1 : 0,
                                transition: `opacity ${KB_TRANSITION}ms ease-in-out`,
                                filter: "blur(24px) brightness(0.85)",
                                transform: "scale(1.15)", // hide blur edges
                                pointerEvents: "none",
                            }}
                        />
                        {/* Foreground sharp image — contain so the whole image is always visible */}
                        <Box
                            component="img"
                            src={src}
                            alt=""
                            draggable={false}
                            onClick={onClick ? () => onClick(src) : undefined}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                objectPosition: `center ${coverPosition || "center"}`,
                                transformOrigin: "center top",
                                display: "block",
                                cursor: onClick ? "pointer" : "default",
                                opacity: isActive ? 1 : 0,
                                transition: `opacity ${KB_TRANSITION}ms ease-in-out`,
                                animation: `${uid}_${idx}_${myCycle} ${kbAnimDuration}ms ease-in-out forwards`,
                                willChange: "transform, opacity",
                            }}
                        />
                    </React.Fragment>
                );
            })}
            {children}
        </Box>
    );
}


// EDITORIAL LAYOUT — deliberately different from the Artist detail/profile panel.
// Profile panel = cover → big overlapping avatar → name → tabs (About, Releases…)
// Spotlight    = header badge → cinematic cover with overlaid name → compact info strip → sections

// ──────────────────────────────────────────────────────────
// SWIPE SUPPORT FOR HIGHLIGHT CYCLING
// ──────────────────────────────────────────────────────────
function useHighlightSwipe(total, setIdx) {
    const touchRef = useRef({ x: 0, y: 0, t: 0, locked: false, isHorizontal: null });
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const onTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now(), locked: false, isHorizontal: null };
        // NOTE: don't set isDragging yet — wait until we confirm a horizontal gesture.
        // Otherwise a purely vertical page-scroll that starts on the carousel feels "locked".
        setDragOffset(0);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!touchRef.current.x) return;
        // Once we've decided this is a vertical scroll, bail out completely
        // so the page scrolls natively without any interference.
        if (touchRef.current.isHorizontal === false) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchRef.current.x;
        const dy = touch.clientY - touchRef.current.y;

        if (touchRef.current.isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            touchRef.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
            if (touchRef.current.isHorizontal) {
                // Only now do we take over the gesture as a horizontal drag.
                setIsDragging(true);
            } else {
                // Vertical scroll wins — release the gesture so the page scrolls natively.
                return;
            }
        }

        if (touchRef.current.isHorizontal) {
            e.preventDefault();
            const resistance = 0.3;
            let offset = dx;
            setIdx((currentIdx) => {
                if ((currentIdx === 0 && dx > 0) || (currentIdx === total - 1 && dx < 0)) {
                    offset = dx * resistance;
                }
                return currentIdx;
            });
            setDragOffset(offset);
        }
    }, [total, setIdx]);

    const onTouchEnd = useCallback((e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchRef.current.x;
        const dy = touch.clientY - touchRef.current.y;
        const dt = Date.now() - touchRef.current.t;
        const velocity = Math.abs(dx) / Math.max(dt, 1);

        setIsDragging(false);
        setDragOffset(0);

        if (touchRef.current.isHorizontal && (Math.abs(dx) > 50 || velocity > 0.4) && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) setIdx((i) => (i + 1) % total);
            else setIdx((i) => (i - 1 + total) % total);
        }

        touchRef.current = { x: 0, y: 0, t: 0, locked: false, isHorizontal: null };
    }, [total, setIdx]);

    return { onTouchStart, onTouchMove, onTouchEnd, dragOffset, isDragging };
}

function ArtistSpotlightCard({ item }) {
    const [bioExpanded, setBioExpanded] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState("");

    const genres = Array.isArray(item.services_list) ? item.services_list : [];
    const links = item.music_links && typeof item.music_links === "object" ? item.music_links : {};
    const activeStreams = STREAM_CONFIG.filter((s) => links[s.key]);
    const coverPhotos = getCoverPhotos(item);
    const hasCover = coverPhotos.length > 0;
    const bioPhotos = Array.isArray(item.bio_photos) ? item.bio_photos.filter(Boolean) : [];

    // Cycle through highlight sections (start at random index)
    const allHighlightSections = Array.isArray(item.highlight_sections) ? item.highlight_sections : [];
    const [highlightIdx, setHighlightIdx] = useState(() =>
        allHighlightSections.length > 1
            ? Math.floor(Math.random() * allHighlightSections.length)
            : 0
    );
    const hasMultipleHighlights = allHighlightSections.length > 1;
    const visibleHighlightSections = allHighlightSections.length > 0
        ? [allHighlightSections[highlightIdx % allHighlightSections.length]]
        : [];
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const hlSwipe = useHighlightSwipe(allHighlightSections.length, setHighlightIdx);

    const hasSocials = Boolean(item.facebook_url || item.instagram_url || item.tiktok_url || item.website_url);
    const hasContact = Boolean(item.owner_phone || item.owner_email);
    const bioText = item.description || "";
    const BIO_COLLAPSE_LENGTH = 180;
    const bioIsLong = bioText.length > BIO_COLLAPSE_LENGTH;

    return (
        <Box>
            {/* ══════════ CINEMATIC COVER — name overlaid ON image ══════════ */}
            {hasCover ? (
                <CoverSlideshow photos={coverPhotos} coverPosition={item.cover_position} height={{ xs: 225, sm: 275 }} onClick={(src) => setLightboxSrc(src)}>
                    {/* Heavy gradient for text legibility */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.05) 100%)",
                            zIndex: 1,
                        }}
                    />
                    {/* Name + tagline overlaid on cover */}
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 2, pb: 2, zIndex: 2 }}>
                        <Typography
                            sx={{
                                fontWeight: 950,
                                fontSize: { xs: 24, sm: 30 },
                                lineHeight: 1.05,
                                letterSpacing: "-0.03em",
                                color: "#fff",
                                textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                            }}
                        >
                            {item.title}
                        </Typography>
                        {item.tagline && (
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: 12, sm: 13.5 },
                                    color: "rgba(255,255,255,0.82)",
                                    mt: 0.25,
                                    fontStyle: "italic",
                                    lineHeight: 1.35,
                                }}
                            >
                                {item.tagline}
                            </Typography>
                        )}
                        {/* Genre pills on cover */}
                        {genres.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                                {genres.slice(0, 5).map((g) => (
                                    <Chip
                                        key={g}
                                        label={g}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 10,
                                            height: 20,
                                            bgcolor: "rgba(255,255,255,0.18)",
                                            color: "#fff",
                                            backdropFilter: "blur(8px)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </CoverSlideshow>
            ) : (
                /* No-cover: show name in a styled header block */
                <Box sx={(t) => ({ px: 2, pt: 2.5, pb: 1.5, bgcolor: alpha(t.palette.secondary.main, 0.03) })}>
                    <Typography
                        sx={{
                            fontWeight: 950,
                            fontSize: { xs: 22, sm: 26 },
                            lineHeight: 1.1,
                            letterSpacing: "-0.02em",
                            color: "text.primary",
                        }}
                    >
                        {item.title}
                    </Typography>
                    {item.tagline && (
                        <Typography sx={{ fontWeight: 600, fontSize: 13, color: "text.secondary", mt: 0.25, fontStyle: "italic" }}>
                            {item.tagline}
                        </Typography>
                    )}
                    {genres.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                            {genres.map((g) => (
                                <Chip
                                    key={g}
                                    label={g}
                                    size="small"
                                    sx={(t) => ({
                                        fontWeight: 700,
                                        fontSize: 10.5,
                                        height: 22,
                                        bgcolor: alpha(t.palette.secondary.main, 0.08),
                                        color: "secondary.dark",
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.secondary.main, 0.18),
                                    })}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {/* ══════════ COMPACT INFO STRIP ══════════ */}
            <Box
                sx={{
                    px: 2,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    borderBottom: "1px solid",
                    borderColor: (t) => alpha(t.palette.divider, 0.5),
                }}
            >
                <Avatar
                    src={item.logo_url || defaultAvatar}
                    onClick={() => { if (item.logo_url) setLightboxSrc(item.logo_url); }}
                    sx={{
                        width: 52,
                        height: 52,
                        border: "2px solid",
                        borderColor: (t) => alpha(t.palette.secondary.main, 0.15),
                        flexShrink: 0,
                        cursor: item.logo_url ? "pointer" : "default",
                        transition: "opacity 0.15s",
                        "&:hover": item.logo_url ? { opacity: 0.85 } : {},
                        "& .MuiAvatar-img": { objectPosition: item.avatar_position || "center" },
                    }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {item.subtitle && (
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: 11,
                                color: "secondary.main",
                                letterSpacing: "0.03em",
                                textTransform: "uppercase",
                                lineHeight: 1.2,
                            }}
                        >
                            {item.subtitle}
                        </Typography>
                    )}
                    {item.owner_location && (
                        <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 0.15 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary" }}>
                                {item.owner_location}
                            </Typography>
                        </Stack>
                    )}
                </Box>
                {/* Social icons — compact right side, themed like ArtistCard */}
                <Stack direction="row" spacing={0.25} alignItems="center">
                    {item.facebook_url && (
                        <Tooltip title="Facebook" arrow>
                            <IconButton
                                component="a" href={item.facebook_url} target="_blank" rel="noopener noreferrer" size="small"
                                sx={(t) => {
                                    const color = getLinkColor("facebook", t);
                                    return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } };
                                }}
                            >
                                <FacebookMuiIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {item.instagram_url && (
                        <Tooltip title="Instagram" arrow>
                            <IconButton
                                component="a" href={item.instagram_url} target="_blank" rel="noopener noreferrer" size="small"
                                sx={(t) => {
                                    const color = getLinkColor("instagram", t);
                                    return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } };
                                }}
                            >
                                <InstagramMuiIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {item.tiktok_url && (
                        <Tooltip title="TikTok" arrow>
                            <IconButton
                                component="a" href={item.tiktok_url} target="_blank" rel="noopener noreferrer" size="small"
                                sx={(t) => {
                                    const color = getLinkColor("tiktok", t);
                                    return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } };
                                }}
                            >
                                <TikTokCurrentColorIcon size={14} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {item.website_url && (
                        <Tooltip title="Website" arrow>
                            <IconButton
                                component="a" href={item.website_url} target="_blank" rel="noopener noreferrer" size="small"
                                sx={(t) => {
                                    const color = getLinkColor("website", t);
                                    return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } };
                                }}
                            >
                                <LanguageRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {item.owner_email && (
                        <Tooltip title="Email" arrow>
                            <IconButton
                                component="a" href={`mailto:${item.owner_email}`} size="small"
                                sx={(t) => {
                                    const color = getLinkColor("email", t);
                                    return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } };
                                }}
                            >
                                <EmailRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Box>

            {/* ══════════ FEATURED VIDEO ══════════ */}
            {item.video_id && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <BunnyVideoPlayer videoId={item.video_id} />
                </Box>
            )}

            {/* ══════════ STREAMING LINKS — prominent branded pills ══════════ */}
            {activeStreams.length > 0 && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            fontSize: 11,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            mb: 1,
                        }}
                    >
                        Listen On
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                        {activeStreams.map(({ key, label, Icon, isMui }) => (
                            <Button
                                key={key}
                                component="a"
                                href={links[key]}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                variant="text"
                                disableElevation
                                startIcon={isMui ? <Icon sx={{ fontSize: "15px !important" }} /> : <Icon size={15} />}
                                sx={(t) => ({
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    borderRadius: 999,
                                    px: 1.75,
                                    py: 0.6,
                                    bgcolor: alpha(t.palette.text.primary, 0.06),
                                    color: "text.primary",
                                    "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) },
                                })}
                            >
                                {label}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ══════════ ABOUT — float photo left, text wraps, gallery underneath ══════════ */}
            {(bioText || item.about_photo_url || bioPhotos.length > 0) && (
                <Box sx={{ px: 2, pt: 2.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1.25 }}>About {item.title}</Typography>

                    <Box
                        sx={{
                            position: "relative",
                            maxHeight: (!bioExpanded && bioIsLong) ? 180 : "none",
                            overflow: "hidden",
                            transition: "max-height 0.3s ease",
                        }}
                    >
                        {item.about_photo_url && (
                            <Box
                                component="img"
                                src={item.about_photo_url}
                                alt={`About ${item.title}`}
                                onClick={() => setLightboxSrc(item.about_photo_url)}
                                sx={{
                                    float: "left",
                                    width: { xs: 130, sm: 155 },
                                    height: "auto",
                                    maxHeight: 200,
                                    objectFit: "contain",
                                    borderRadius: 2.5,
                                    mr: 1.75,
                                    mb: 0.75,
                                    cursor: "pointer",
                                    transition: "opacity 0.15s",
                                    "&:hover": { opacity: 0.85 },
                                }}
                            />
                        )}
                        {bioText && (
                            <RichTextDisplay
                                html={bioText}
                                sx={{ fontSize: 13.5, lineHeight: 1.65, color: "text.secondary", fontWeight: 500 }}
                            />
                        )}
                        <Box sx={{ clear: "both" }} />

                        {/* Fade overlay when collapsed */}
                        {!bioExpanded && bioIsLong && (
                            <Box
                                sx={(t) => ({
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 40,
                                    background: `linear-gradient(transparent, ${t.palette.background.paper})`,
                                    pointerEvents: "none",
                                })}
                            />
                        )}
                    </Box>

                    {bioIsLong && (
                        <Button
                            size="small"
                            onClick={() => setBioExpanded((prev) => !prev)}
                            endIcon={
                                <ExpandMoreRoundedIcon
                                    sx={{
                                        fontSize: "16px !important",
                                        transform: bioExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                    }}
                                />
                            }
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "secondary.main",
                                mt: 0.25,
                                px: 0,
                                minWidth: 0,
                                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                            }}
                        >
                            {bioExpanded ? "Show less" : "Read more"}
                        </Button>
                    )}

                    {/* Bio / press photos gallery — underneath text */}
                    {bioPhotos.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                overflowX: "auto",
                                mt: 1.5,
                                pb: 0.5,
                                "&::-webkit-scrollbar": { height: 4 },
                                "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.15), borderRadius: 2 },
                            }}
                        >
                            {bioPhotos.map((url, idx) => (
                                <Box
                                    key={idx}
                                    component="img"
                                    src={url}
                                    alt={`${item.title} photo ${idx + 1}`}
                                    onClick={() => setLightboxSrc(url)}
                                    sx={{
                                        height: 110,
                                        width: "auto",
                                        maxWidth: 180,
                                        objectFit: "contain",
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: (t) => alpha(t.palette.divider, 0.4),
                                        flexShrink: 0,
                                        cursor: "pointer",
                                        transition: "opacity 0.15s",
                                        "&:hover": { opacity: 0.85 },
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {/* ══════════ HIGHLIGHT SECTIONS (cycle through if multiple) ══════════ */}
            {visibleHighlightSections.length > 0 && visibleHighlightSections.map((sec, secIdx) => (
                <Box
                    key={`hl-wrapper-${secIdx}`}
                    sx={{ px: { xs: 0, md: 2 }, pt: 2 }}
                >
                    <Box
                        {...(isMobile && hasMultipleHighlights ? { onTouchStart: hlSwipe.onTouchStart, onTouchMove: hlSwipe.onTouchMove, onTouchEnd: hlSwipe.onTouchEnd } : {})}
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                            touchAction: isMobile && hasMultipleHighlights ? "pan-y" : "auto",
                        }}
                    >
                        {/* Sliding track */}
                        <Box
                            sx={(t) => ({
                                display: "flex",
                                width: `${allHighlightSections.length * 100}%`,
                                transform: `translateX(calc(-${(highlightIdx % allHighlightSections.length) * (100 / allHighlightSections.length)}% + ${hlSwipe.isDragging ? hlSwipe.dragOffset : 0}px))`,
                                transition: hlSwipe.isDragging ? "none" : "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                                willChange: "transform",
                            })}
                        >
                            {allHighlightSections.map((slideSec, slideIdx) => (
                                <Box
                                    key={slideIdx}
                                    sx={{
                                        width: `${100 / allHighlightSections.length}%`,
                                        flexShrink: 0,
                                        px: { xs: 0.5, md: 0 },
                                    }}
                                >
                                    <Box
                                        sx={(t) => ({
                                            borderRadius: { xs: 2, md: 3 },
                                            overflow: "hidden",
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.divider, 0.6),
                                            bgcolor: alpha(t.palette.common.black, 0.02),
                                            mx: { xs: 0.5, md: 0 },
                                        })}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                px: 1.75,
                                                py: 0.9,
                                                bgcolor: alpha(t.palette.secondary.main, 0.06),
                                                borderBottom: "1px solid",
                                                borderColor: alpha(t.palette.secondary.main, 0.1),
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.75,
                                            })}
                                        >
                                            <HlIconRender name={slideSec.icon} sx={{ fontSize: 16, color: "secondary.main" }} />
                                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: "secondary.dark", letterSpacing: "0.04em", textTransform: "uppercase", flex: 1 }}>
                                                {slideSec.title || "Highlight"}
                                            </Typography>
                                            {hasMultipleHighlights && (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto" }}>
                                                    <IconButton size="small" onClick={() => setHighlightIdx((i) => (i - 1 + allHighlightSections.length) % allHighlightSections.length)} sx={{ width: 24, height: 24, color: "secondary.main" }}>
                                                        <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "secondary.main", minWidth: 28, textAlign: "center" }}>
                                                        {(highlightIdx % allHighlightSections.length) + 1}/{allHighlightSections.length}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => setHighlightIdx((i) => (i + 1) % allHighlightSections.length)} sx={{ width: 24, height: 24, color: "secondary.main" }}>
                                                        <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                        {(slideSec.photo_url || slideSec.body) && (
                                            <Box sx={{ overflow: "hidden" }}>
                                                {slideSec.photo_url && (
                                                    <Box
                                                        component="img"
                                                        src={slideSec.photo_url}
                                                        alt={slideSec.title}
                                                        onClick={() => setLightboxSrc(slideSec.photo_url)}
                                                        draggable={false}
                                                        sx={{
                                                            width: "100%",
                                                            height: { xs: "auto", md: 405 },
                                                            maxHeight: { xs: "75vh", md: "none" },
                                                            objectFit: { xs: "contain", md: "cover" },
                                                            display: "block",
                                                            cursor: "pointer",
                                                            transition: "opacity 0.15s",
                                                            "&:hover": { opacity: 0.85 },
                                                            pointerEvents: hlSwipe.isDragging ? "none" : "auto",
                                                        }}
                                                    />
                                                )}
                                                {slideSec.body && (
                                                    <Box sx={{ px: 1.75, pt: slideSec.photo_url ? 1.25 : 1.75, pb: 1.75 }}>
                                                        <RichTextDisplay
                                                            html={slideSec.body}
                                                            sx={{ fontSize: 13.5, lineHeight: 1.6, color: "text.primary", fontWeight: 500, opacity: 0.85 }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Dot indicators for mobile */}
                        {isMobile && hasMultipleHighlights && (
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, pt: 1.25, pb: 0.5 }}>
                                {allHighlightSections.map((_, dotIdx) => (
                                    <Box
                                        key={dotIdx}
                                        onClick={() => setHighlightIdx(dotIdx)}
                                        sx={(t) => ({
                                            width: dotIdx === (highlightIdx % allHighlightSections.length) ? 18 : 6,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: dotIdx === (highlightIdx % allHighlightSections.length)
                                                ? t.palette.secondary.main
                                                : alpha(t.palette.secondary.main, 0.2),
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            cursor: "pointer",
                                        })}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            ))}

            {/* ══════════ LEGACY FEATURED RELEASE — album card style ══════════ */}
            {allHighlightSections.length === 0 && item.highlight_title && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box
                        sx={(t) => ({
                            borderRadius: 3,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.6),
                            bgcolor: alpha(t.palette.common.black, 0.02),
                        })}
                    >
                        {/* Release header */}
                        <Box
                            sx={(t) => ({
                                px: 1.75,
                                py: 0.9,
                                bgcolor: alpha(t.palette.secondary.main, 0.06),
                                borderBottom: "1px solid",
                                borderColor: alpha(t.palette.secondary.main, 0.1),
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                            })}
                        >
                            <AlbumRoundedIcon sx={{ fontSize: 16, color: "secondary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: "secondary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                Featured Release
                            </Typography>
                        </Box>
                        {/* Release body */}
                        <Box sx={{ overflow: "hidden" }}>
                            {item.highlight_photo_url && (
                                <Box
                                    component="img"
                                    src={item.highlight_photo_url}
                                    alt={item.highlight_title}
                                    onClick={() => setLightboxSrc(item.highlight_photo_url)}
                                    sx={{
                                        width: "100%",
                                        height: { xs: "auto", md: 405 },
                                        maxHeight: { xs: "75vh", md: "none" },
                                        objectFit: { xs: "contain", md: "cover" },
                                        display: "block",
                                        cursor: "pointer",
                                        transition: "opacity 0.15s",
                                        "&:hover": { opacity: 0.85 },
                                    }}
                                />
                            )}
                            <Box sx={{ px: 1.75, pt: item.highlight_photo_url ? 1.25 : 1.75, pb: 1.75 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 14.5, lineHeight: 1.2, color: "text.primary", mb: 0.5 }}>
                                    {item.highlight_title}
                                </Typography>
                                {item.highlight_body && (
                                    <RichTextDisplay
                                        html={item.highlight_body}
                                        sx={{ fontSize: 13.5, lineHeight: 1.6, color: "text.primary", fontWeight: 500, opacity: 0.85 }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══════════ CONTACT ROW ══════════ */}
            {hasContact && (
                <Box sx={{ px: 2, pt: 1.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                        {item.owner_phone && (
                            <Typography
                                component="a"
                                href={`tel:${item.owner_phone}`}
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "text.secondary",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    pointerEvents: { xs: "auto", sm: "none" },
                                    cursor: { xs: "pointer", sm: "default" },
                                    "@media (hover: hover)": { pointerEvents: "none", cursor: "default" },
                                }}
                            >
                                <PhoneRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                {item.owner_phone}
                            </Typography>
                        )}
                        {item.owner_email && !hasSocials && (
                            <Typography
                                component="a"
                                href={`mailto:${item.owner_email}`}
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "secondary.main",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                <EmailRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                {item.owner_email}
                            </Typography>
                        )}
                    </Stack>
                </Box>
            )}

            <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />

            {/* ══════════ CTAs ══════════ */}
            <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                {item.cta_primary_label && (
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<HeadphonesRoundedIcon />}
                        href={item.cta_primary_link || undefined}
                        sx={{
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 14,
                            py: 1.25,
                            borderRadius: 2.5,
                            mb: 1,
                        }}
                    >
                        {item.cta_primary_label}
                    </Button>
                )}
                {item.cta_secondary_label && (
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EventRoundedIcon />}
                        href={item.cta_secondary_link || undefined}
                        sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            fontSize: 13,
                            py: 1,
                            borderRadius: 2.5,
                            borderColor: "divider",
                            color: "text.primary",
                        }}
                    >
                        {item.cta_secondary_label}
                    </Button>
                )}
            </Box>

            {/* ══════════ PHOTO LIGHTBOX ══════════ */}
            <Dialog
                open={Boolean(lightboxSrc)}
                onClose={() => setLightboxSrc("")}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        bgcolor: "transparent",
                        boxShadow: "none",
                        m: 1,
                        maxWidth: "95vw",
                        maxHeight: "95vh",
                        overflow: "visible",
                    },
                }}
                slotProps={{
                    backdrop: { sx: { bgcolor: "rgba(0,0,0,0.85)" } },
                }}
            >
                <IconButton
                    onClick={() => setLightboxSrc("")}
                    aria-label="Close"
                    sx={{
                        position: "absolute",
                        top: -16,
                        right: -16,
                        zIndex: 1,
                        bgcolor: "rgba(255,255,255,0.9)",
                        color: "text.primary",
                        width: 36,
                        height: 36,
                        boxShadow: 2,
                        "&:hover": { bgcolor: "#fff" },
                    }}
                >
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {lightboxSrc && (
                    <Box
                        component="img"
                        src={lightboxSrc}
                        alt="Full size"
                        sx={{
                            display: "block",
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            objectFit: "contain",
                            borderRadius: 2,
                        }}
                    />
                )}
            </Dialog>
        </Box>
    );
}

// ─── Main Tab ────────────────────────────────────────────


// ──────────────────────────────────────────────────────────
// SHUFFLE UTILITY — Fisher-Yates
// ──────────────────────────────────────────────────────────
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ──────────────────────────────────────────────────────────
// ENTRY-LEVEL SWIPE HOOK
// ──────────────────────────────────────────────────────────
function useEntrySwipe(total, setIdx) {
    const touchRef = useRef({ x: 0, y: 0, t: 0 });
    const onTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    }, []);
    const onTouchEnd = useCallback((e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchRef.current.x;
        const dy = touch.clientY - touchRef.current.y;
        const dt = Date.now() - touchRef.current.t;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
            if (dx < 0) setIdx((i) => Math.min(i + 1, total - 1));
            else setIdx((i) => Math.max(i - 1, 0));
        }
    }, [total, setIdx]);
    return { onTouchStart, onTouchEnd };
}

// ──────────────────────────────────────────────────────────
// STICKY NAV BAR — single compact row with View All dropdown
// ──────────────────────────────────────────────────────────
function EntryNavBar({ count, activeIdx, onPrev, onNext, onDotClick, accent, items }) {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isMobileNav = useMediaQuery(theme.breakpoints.down("md"));
    if (count <= 1) return null;
    const isFirst = activeIdx === 0;
    const isLast = activeIdx === count - 1;

    const handlePick = (i) => {
        onDotClick(i);
        setOpen(false);
    };

    return (
        <Box
            sx={(t) => ({
                position: "sticky",
                top: 0,
                zIndex: 12,
                bgcolor: alpha(t.palette.background.paper, 0.92),
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${alpha(t.palette.divider, 0.1)}`,
                ...(isMobileNav && {
                    bgcolor: alpha(t.palette.background.paper, 0.97),
                    borderTop: `1px solid ${alpha(t.palette.divider, 0.06)}`,
                    boxShadow: `0 2px 8px ${alpha(t.palette.common.black, 0.06)}`,
                }),
            })}
        >
            {/* ── Single row: ‹  1/2 · View All ▾  › ── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 0.5,
                    py: 0.35,
                    gap: 0.25,
                }}
            >
                <IconButton
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-label="Previous spotlight"
                    size="small"
                    sx={(t) => ({
                        width: 30, height: 30,
                        color: isFirst ? alpha(t.palette.text.disabled, 0.3) : t.palette.text.primary,
                    })}
                >
                    <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>

                {/* Counter + View All toggle */}
                <Box
                    onClick={() => setOpen((o) => !o)}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) },
                    }}
                >
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary" }}>
                        {activeIdx + 1}/{count}
                    </Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 400, color: "text.disabled" }}>·</Typography>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary" }}>
                        {open ? "Close" : "View All"}
                    </Typography>
                    <ExpandMoreRoundedIcon
                        sx={{
                            fontSize: 15,
                            color: "text.secondary",
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.25s ease",
                            ml: -0.25,
                        }}
                    />
                </Box>

                <IconButton
                    onClick={onNext}
                    disabled={isLast}
                    aria-label="Next spotlight"
                    size="small"
                    sx={(t) => ({
                        width: 30, height: 30,
                        color: isLast ? alpha(t.palette.text.disabled, 0.3) : t.palette.text.primary,
                    })}
                >
                    <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* ── Expandable picker tray ── */}
            <Box
                sx={{
                    maxHeight: open ? 320 : 0,
                    overflowY: open ? "auto" : "hidden",
                    transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&::-webkit-scrollbar": { width: 3 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.1), borderRadius: 2 },
                }}
            >
                <Box
                    sx={(t) => ({
                        px: 0.75,
                        pb: 0.75,
                        pt: 0.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.25,
                        borderTop: `1px solid ${alpha(t.palette.divider, 0.06)}`,
                    })}
                >
                    {(items || []).map((entry, i) => {
                        const isActive = i === activeIdx;
                        const thumb = entry.logo_url
                            || (Array.isArray(entry.cover_photos) && entry.cover_photos[0])
                            || entry.cover_photo_url
                            || null;
                        return (
                            <Box
                                key={i}
                                onClick={() => handlePick(i)}
                                sx={(t) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    px: 1.25,
                                    py: 0.85,
                                    borderRadius: 2.5,
                                    cursor: "pointer",
                                    bgcolor: isActive
                                        ? alpha(accent || t.palette.primary.main, 0.08)
                                        : "transparent",
                                    transition: "all 0.15s ease",
                                    "&:hover": {
                                        bgcolor: isActive
                                            ? alpha(accent || t.palette.primary.main, 0.12)
                                            : alpha(t.palette.text.primary, 0.04),
                                    },
                                })}
                            >
                                {thumb ? (
                                    <Avatar
                                        src={thumb}
                                        variant="rounded"
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            flexShrink: 0,
                                            border: isActive ? "2px solid" : "1px solid",
                                            borderColor: isActive
                                                ? (accent || "primary.main")
                                                : (t) => alpha(t.palette.divider, 0.3),
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        variant="rounded"
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            flexShrink: 0,
                                            bgcolor: (t) => alpha(accent || t.palette.primary.main, 0.1),
                                            color: accent || "primary.main",
                                            fontSize: 14,
                                            fontWeight: 800,
                                            border: isActive ? "2px solid" : "1px solid",
                                            borderColor: isActive
                                                ? (accent || "primary.main")
                                                : "transparent",
                                        }}
                                    >
                                        {(entry.title || "?")[0]}
                                    </Avatar>
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: isActive ? 800 : 600,
                                            lineHeight: 1.25,
                                            color: isActive ? "text.primary" : "text.secondary",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {entry.title || "Spotlight"}
                                    </Typography>
                                    {entry.subtitle && (
                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                fontWeight: 500,
                                                color: "text.disabled",
                                                lineHeight: 1.2,
                                                mt: 0.2,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {entry.subtitle}
                                        </Typography>
                                    )}
                                </Box>
                                {isActive && (
                                    <Box
                                        sx={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: "50%",
                                            bgcolor: accent || "primary.main",
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

export default function ArtistDiscoverTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [activeEntryIdx, setActiveEntryIdx] = useState(0);
    const [fadeIn, setFadeIn] = useState(true);
    const scrollRef = useRef(null);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    useEffect(() => {
        let cancelled = false;
        secureFetch("/api/discover-highlights?page=artists")
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((d) => {
                if (!cancelled) {
                    const all = Array.isArray(d?.items) ? d.items : [];
                    // Shuffle randomly so order is different each visit
                    setItems(all.length > 1 ? shuffleArray(all) : all);
                    setLoading(false);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => { if (!cancelled) setRevealed(true); });
                    });
                }
            })
            .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    // Crossfade transition when changing entries
    const navigateTo = useCallback((newIdx) => {
        if (newIdx === activeEntryIdx) return;
        setFadeIn(false);
        setTimeout(() => {
            setActiveEntryIdx(newIdx);
            setFadeIn(true);
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        }, 220);
    }, [activeEntryIdx]);

    const goNext = useCallback(() => {
        if (activeEntryIdx < items.length - 1) navigateTo(activeEntryIdx + 1);
    }, [activeEntryIdx, items.length, navigateTo]);

    const goPrev = useCallback(() => {
        if (activeEntryIdx > 0) navigateTo(activeEntryIdx - 1);
    }, [activeEntryIdx, navigateTo]);

    // Keyboard arrow support (desktop)
    useEffect(() => {
        if (!isDesktop || items.length <= 1) return;
        const handler = (e) => {
            if (e.key === "ArrowRight") goNext();
            else if (e.key === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isDesktop, items.length, goNext, goPrev]);

    // Mobile swipe for entry cycling
    const entrySwipe = useEntrySwipe(items.length, (setter) => {
        const newIdx = typeof setter === "function" ? setter(activeEntryIdx) : setter;
        navigateTo(newIdx);
    });

    const hasMultipleEntries = items.length > 1;
    const currentItem = items[activeEntryIdx];
    const currentAccent = currentItem ? (adaptColor(currentItem.accent_color, theme) || null) : null;

    if (loading) {
        return (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PulsingDots />
            </Box>
        );
    }

    if (error || items.length === 0) {
        return (
            <Box sx={{ position: { xs: "relative", md: "absolute" }, inset: { md: 0 }, minHeight: { xs: "100%" }, overflowY: "auto", p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {error ? "Failed to load highlights." : "Featured spotlights coming soon!"}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            ref={scrollRef}
            {...(!isDesktop && hasMultipleEntries ? entrySwipe : {})}
            sx={{
                position: { xs: "relative", md: "absolute" },
                inset: { md: 0 },
                minHeight: { xs: "100%" },
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehavior: { md: "contain" },
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.12), borderRadius: 3 },
            }}
        >
            {/* Sticky nav bar */}
            {hasMultipleEntries && (
                <Box sx={{ ...getDiscoverStaggerSx(0, revealed) }}>
                    <EntryNavBar
                        count={items.length}
                        activeIdx={activeEntryIdx}
                        onPrev={goPrev}
                        onNext={goNext}
                        onDotClick={(i) => navigateTo(i)}
                        accent={currentAccent}
                        items={items}
                    />
                </Box>
            )}

            {/* Spotlight card with crossfade */}
            <Box sx={{ ...getDiscoverStaggerSx(hasMultipleEntries ? 1 : 0, revealed) }}>
                <Box
                    sx={{
                        opacity: fadeIn ? 1 : 0,
                        transition: "opacity 0.22s ease-in-out",
                    }}
                >
                    <ArtistSpotlightCard item={items[activeEntryIdx]} />
                </Box>
            </Box>
        </Box>
    );
}
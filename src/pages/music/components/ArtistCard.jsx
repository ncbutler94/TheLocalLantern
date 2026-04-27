import React, { useCallback, useEffect, useRef, useState } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    ListItemIcon,
    MenuItem,
    ListItemText,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Divider,
    CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

// Genre icons — must match ArtistDetailPanel exactly

import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import ShareDialog from "../../../components/ShareDialog";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

import MicRoundedIcon from "@mui/icons-material/MicRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import NaturePeopleRoundedIcon from "@mui/icons-material/NaturePeopleRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";

import { getCategoryIcon, isVisualArtistProfile } from "../utils/artistCategoryIcons";

import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ReportContentDialog from "../../../components/ReportContentDialog";
import RichTextDisplay from "../../../components/RichTextDisplay";

// ─── Social link helpers (matches ArtistProfilePage exactly) ─────────────────

function buildSocialUrl(val, platform) {
    if (!val) return "#";
    const s = String(val).trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    const domains = {
        facebook: "facebook.com", instagram: "instagram.com", twitter: "x.com",
        youtube: "youtube.com", tiktok: "tiktok.com/@", spotify: "open.spotify.com/artist",
        soundcloud: "soundcloud.com", bandcamp: "bandcamp.com", appleMusic: "music.apple.com",
        etsy: "etsy.com/shop",
    };
    const domain = domains[platform] || "";
    if (!domain) return s.includes(".") ? `https://${s}` : s;
    if (s.startsWith(domain) || s.startsWith(`www.${domain}`)) return `https://${s}`;
    const username = s.replace(/^@/, "");
    if (platform === "tiktok") return `https://tiktok.com/@${username}`;
    if (platform === "etsy") return `https://etsy.com/shop/${username}`;
    return `https://${domain}/${username}`;
}

function getLinkIcon(key, size = 20) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return <InstagramIcon sx={{ fontSize: size }} />;
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return <XIcon sx={{ fontSize: size }} />;
    if (k.includes("youtube")) return <YouTubeIcon sx={{ fontSize: size }} />;
    if (k.includes("facebook")) return <FacebookIcon sx={{ fontSize: size }} />;
    if (k.includes("tiktok")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13.1a8.16 8.16 0 005.58 2.2V11.9a4.85 4.85 0 01-3.58-1.63V6.69h3.58z" /></svg></Box>);
    if (k.includes("spotify")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg></Box>);
    if (k.includes("soundcloud")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.084-.1zm-.899 1.67c-.06 0-.091.037-.104.09L0 15.479l.165 1.308c.014.057.045.09.111.09.068 0 .09-.033.104-.09l.21-1.319-.21-1.334c-.014-.064-.036-.09-.104-.09zm1.83-1.62c-.074 0-.12.06-.12.135l-.21 2.07.21 2.134c0 .075.046.135.12.135.074 0 .12-.06.12-.135l.24-2.134-.24-2.07c0-.075-.046-.12-.12-.12v-.015zm.945-.57c-.09 0-.135.075-.135.15l-.193 2.19.193 2.176c0 .09.045.149.135.149.075 0 .135-.06.135-.15l.21-2.175-.21-2.19c0-.075-.06-.15-.135-.15zm1.065-.375c-.105 0-.165.09-.165.165l-.18 2.385.18 2.31c0 .095.06.18.165.18.089 0 .164-.085.164-.18l.195-2.31-.195-2.385c0-.09-.059-.165-.164-.165zm1.14-.12c-.12 0-.195.105-.195.195l-.165 2.385.165 2.37c0 .105.075.195.195.195.104 0 .18-.09.18-.195l.195-2.37-.195-2.385c0-.09-.076-.195-.18-.195zm1.155-.12c-.135 0-.225.12-.225.225l-.15 2.385.15 2.385c0 .12.09.225.225.225.119 0 .225-.105.225-.225l.165-2.385-.165-2.385c0-.105-.106-.225-.225-.225zm1.2.045c-.149 0-.254.135-.254.255l-.15 2.19.15 2.4c0 .135.105.255.254.255.135 0 .255-.12.255-.255l.15-2.4-.15-2.19c0-.12-.12-.255-.255-.255zm1.215-.09c-.165 0-.285.15-.285.285l-.135 2.13.135 2.43c0 .15.12.285.285.285.15 0 .285-.135.285-.285l.15-2.43-.15-2.13c0-.135-.135-.285-.285-.285zm1.215-.03c-.18 0-.315.165-.315.315L9.75 14.4l.12 2.43c0 .165.135.315.315.315.165 0 .315-.15.315-.315l.135-2.43-.135-2.385c0-.15-.15-.315-.315-.315zm1.23.105c-.195 0-.345.18-.345.345l-.105 2.19.105 2.445c0 .18.15.345.345.345.18 0 .345-.165.345-.345l.12-2.445-.12-2.19c0-.165-.165-.345-.345-.345zm1.245-.06c-.21 0-.375.195-.375.375l-.09 2.205.09 2.445c0 .195.165.375.375.375.195 0 .375-.18.375-.375l.105-2.445-.105-2.205c0-.18-.18-.375-.375-.375zm1.26-.015c-.225 0-.405.21-.405.405l-.075 2.175.075 2.445c0 .21.18.405.405.405.21 0 .405-.195.405-.405l.09-2.445-.09-2.175c0-.195-.195-.405-.405-.405zm1.275.06c-.24 0-.435.225-.435.435l-.06 2.085.06 2.445c0 .225.195.435.435.435.225 0 .42-.21.42-.435l.075-2.445-.075-2.085c0-.21-.195-.435-.42-.435zm1.29.09c-.255 0-.45.24-.45.465l-.045 1.965.045 2.43c0 .24.195.465.45.465.24 0 .45-.225.45-.465l.06-2.43-.06-1.965c0-.225-.21-.465-.45-.465zm1.305.255c-.27 0-.48.255-.48.495l-.03 1.665.03 2.4c0 .255.21.495.48.495.255 0 .48-.24.48-.495l.045-2.4-.045-1.665c0-.24-.225-.495-.48-.495zm1.32.465c-.285 0-.51.27-.51.525l-.015 1.155.015 2.37c0 .27.225.525.51.525.27 0 .51-.255.51-.525l.03-2.37-.03-1.155c0-.255-.24-.525-.51-.525zm1.335.6c-.3 0-.54.285-.54.54v.69l.015 2.325c0 .27.24.555.525.555.27 0 .54-.285.54-.555l.015-2.325v-.69c0-.255-.255-.54-.54-.54h-.015zm3.39-.45c-.405 0-.795.075-1.155.195-.24-2.715-2.535-4.86-5.355-4.86-.72 0-1.425.15-2.055.405-.24.12-.315.24-.315.465v9.555c0 .24.18.465.435.48h8.445c1.395 0 2.52-1.17 2.52-2.61s-1.125-2.63-2.52-2.63z" /></svg></Box>);
    if (k.includes("bandcamp")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" /></svg></Box>);
    if (k.includes("apple") && k.includes("music")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.237C19.103.1 18.496.04 17.89.003 17.717-.004 17.543 0 17.37 0H6.63c-.174 0-.347-.004-.521.003C5.503.04 4.896.1 4.3.237a5.023 5.023 0 00-1.875.655C1.307 1.625.561 2.624.245 3.935A9.23 9.23 0 00.003 6.124C-.003 6.297 0 6.47 0 6.643v10.714c0 .173-.003.347.003.52a9.23 9.23 0 00.242 2.19c.316 1.31 1.062 2.31 2.18 3.042.568.38 1.196.645 1.874.655.607.138 1.214.197 1.821.235.173.007.347.003.52.003h10.74c.174 0 .347.004.521-.003.607-.038 1.214-.097 1.821-.235a5.023 5.023 0 001.875-.655c1.118-.733 1.863-1.732 2.18-3.043.17-.713.236-1.441.24-2.19.003-.173 0-.347 0-.52V6.643c0-.173.004-.346-.003-.52zM16.95 17.22c-.12.15-.27.28-.44.37-.33.17-.69.25-1.07.27-.17.01-.34 0-.51-.03a2.1 2.1 0 01-.79-.33c-.44-.35-.7-.81-.74-1.38-.04-.51.13-.97.47-1.34.39-.41.88-.63 1.44-.66.44-.02.84.09 1.19.36v-5l-5.56 1.68v5.94c.01.18 0 .36-.04.54-.1.57-.42 1-.93 1.29-.27.15-.57.24-.88.27-.18.01-.36 0-.54-.02a2.06 2.06 0 01-.82-.35c-.42-.34-.67-.78-.72-1.33-.05-.54.12-1 .47-1.38.38-.41.87-.63 1.42-.66.44-.02.85.09 1.2.37V7.19c0-.13.03-.24.1-.35.1-.16.24-.26.42-.3l6.4-1.93c.04-.01.07-.02.11-.02.25-.05.44.09.46.35v10c.01.19 0 .38-.05.57-.1.55-.41.97-.91 1.26z" /></svg></Box>);
    if (k.includes("linktree")) return (<Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7.953 15.066l-.038-4.2-4.058-.048L7.07 7.645.903 4.395l2.955-2.063L7.14 6.65l3.285-4.317.84.84-2.34 4.29 4.17.048-3.225 3.15 4.08 3.225-2.955 2.07-3.285-4.318-3.285 4.317-2.955-2.069 4.473-3.72zm8.147 0l.037-4.2 4.059-.048-3.213-3.173L23.1 4.395l-2.955-2.063-3.282 4.318L13.578 2.333l-.84.84 2.34 4.29-4.17.048 3.225 3.15-4.08 3.225 2.955 2.07 3.285-4.318 3.285 4.317 2.955-2.069-4.473-3.72zM10.5 18.75h3v5.25h-3z" /></svg></Box>);
    if (k.includes("etsy")) return <StorefrontRoundedIcon sx={{ fontSize: size }} />;
    if (k.includes("email") || k.includes("mail")) return <MailOutlineRoundedIcon sx={{ fontSize: size }} />;
    if (k.includes("website") || k.includes("web") || k.includes("home")) return <LanguageRoundedIcon sx={{ fontSize: size }} />;
    return <LinkRoundedIcon sx={{ fontSize: size }} />;
}

function getLinkPlatform(key) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return "instagram";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return "twitter";
    if (k.includes("youtube")) return "youtube";
    if (k.includes("facebook")) return "facebook";
    if (k.includes("tiktok")) return "tiktok";
    if (k.includes("spotify")) return "spotify";
    if (k.includes("soundcloud")) return "soundcloud";
    if (k.includes("bandcamp")) return "bandcamp";
    if (k.includes("apple") && k.includes("music")) return "appleMusic";
    if (k.includes("linktree")) return "linktree";
    if (k.includes("etsy")) return "etsy";
    return null;
}

function getLinkColor(key, theme) {
    const k = String(key).toLowerCase();
    const isDark = theme?.palette?.mode === 'dark';
    const social = theme?.custom?.brand?.social || theme?.custom?.social || {};
    if (k.includes("instagram")) return social.instagram || "#E4405F";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return social.x || (isDark ? theme.palette.text.primary : "#000000");
    if (k.includes("youtube")) return social.youtube || "#FF0000";
    if (k.includes("facebook")) return social.facebook || "#1877F2";
    if (k.includes("tiktok")) return social.tiktok || (isDark ? theme.palette.text.primary : "#000000");
    if (k.includes("spotify")) return social.spotify || "#1DB954";
    if (k.includes("soundcloud")) return social.soundcloud || "#FF5500";
    if (k.includes("bandcamp")) return social.bandcamp || "#1DA0C3";
    if (k.includes("apple") && k.includes("music")) return social.appleMusic || "#FA243C";
    if (k.includes("linktree")) return social.linktree || "#43E660";
    if (k.includes("etsy")) return social.etsy || "#F1641E";
    if (k.includes("website") || k.includes("web") || k.includes("home")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || "#4A5568");
    if (k.includes("email") || k.includes("mail")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || "#4A5568");
    return null;
}

function isStreamingPlatform(key) {
    const k = String(key).toLowerCase();
    return (
        k.includes("spotify") || k.includes("soundcloud") || k.includes("bandcamp") ||
        k.includes("applemusic") || k.includes("apple_music") || k.includes("apple music") ||
        k.includes("tidal") || k.includes("deezer") || k.includes("amazon") ||
        k.includes("youtube") || k.includes("yt")
    );
}

function sortLinksStreamingFirst(entries) {
    const streaming = [];
    const social = [];
    for (const entry of entries) {
        if (isStreamingPlatform(entry[0])) streaming.push(entry);
        else social.push(entry);
    }
    return [...streaming, ...social];
}

// ─── Follow API helpers ─────────────────────────────────────────────────────

const API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    return raw ? `${raw}/api` : "/api";
})();

function getArtistId(artist) {
    if (!artist) return null;
    const raw = artist.id ?? artist.artist_id ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchFollowState(artist, acctHeaders) {
    const artistId = getArtistId(artist);
    if (!artistId) return { isFollowing: false };
    try {
        const qs = new URLSearchParams({ target_id: String(artistId), target_type: "artist" });
        const res = await secureFetch(`${API_BASE}/follows/status?${qs}`, {
            credentials: "include",
            headers: { Accept: "application/json", ...(acctHeaders || {}) },
        });
        if (!res.ok) return { isFollowing: false };
        const data = await res.json();
        return { isFollowing: Boolean(data?.following) };
    } catch {
        return { isFollowing: false };
    }
}

async function fetchFollowCounts(artistId) {
    if (!artistId) return { followers: 0, following: 0 };
    try {
        const res = await secureFetch(`${API_BASE}/follows/counts/artist/${artistId}`, {
            credentials: "include",
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return {
            followers: Number(data?.followers) || 0,
            following: Number(data?.following) || 0,
        };
    } catch {
        return { followers: 0, following: 0 };
    }
}

async function callFollowApi(artist, currentlyFollowing, acctHeaders, acctPayload) {
    const artistId = getArtistId(artist);
    if (!artistId) throw new Error("No artist ID");
    const res = await secureFetch(`${API_BASE}/follows/toggle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(acctHeaders || {}) },
        body: JSON.stringify({
            target_id: artistId,
            target_type: "artist",
            action: currentlyFollowing ? "unfollow" : "follow",
            ...(acctPayload || {}),
        }),
    });
    if (!res.ok) throw new Error("Follow request failed");
    return res.json();
}

/**
 * ArtistCard
 * - Restyled to match BusinessDirectoryCard exactly
 * - Card with top accent bar, hover/selected states
 * - Footer with followers, releases, and social links
 * - Genre chips with icons
 * - Follow button only shows when user is signed in AND is NOT viewing their own artist profile
 *
 * Intended location:
 *   src/pages/music/components/ArtistCard.jsx
 */

// ─── Genre Icon Mapping (mirrors ArtistDetailPanel exactly) ──────────────────

function getGenreIcon(genre) {
    const g = String(genre || "").toLowerCase().trim();
    if (g.includes("rock") || g.includes("metal") || g.includes("punk")) return BoltRoundedIcon;
    if (g.includes("pop")) return StarRoundedIcon;
    if (g.includes("hip") || g.includes("hop") || g.includes("rap")) return MicRoundedIcon;
    if (g.includes("r&b") || g.includes("rnb") || g.includes("soul") || g.includes("motown")) return FavoriteRoundedIcon;
    if (g.includes("country") || g.includes("folk") || g.includes("bluegrass") || g.includes("americana")) return NaturePeopleRoundedIcon;
    if (g.includes("jazz") || g.includes("classical") || g.includes("orchestra") || g.includes("symphony")) return PianoRoundedIcon;
    if (g.includes("electronic") || g.includes("edm") || g.includes("techno") || g.includes("house") || g.includes("trance")) return HeadphonesRoundedIcon;
    if (g.includes("blues")) return WavesRoundedIcon;
    if (g.includes("reggae") || g.includes("ska") || g.includes("dub")) return SelfImprovementRoundedIcon;
    if (g.includes("indie") || g.includes("alternative") || g.includes("alt")) return AlbumRoundedIcon;
    if (g.includes("latin") || g.includes("salsa") || g.includes("reggaeton") || g.includes("bachata")) return CelebrationRoundedIcon;
    if (g.includes("gospel") || g.includes("christian") || g.includes("worship") || g.includes("spiritual")) return FavoriteRoundedIcon;
    if (g.includes("dance") || g.includes("disco") || g.includes("club")) return NightlifeRoundedIcon;
    if (g.includes("acapella") || g.includes("a capella") || g.includes("vocal")) return RecordVoiceOverRoundedIcon;
    if (g.includes("bollywood") || g.includes("indian") || g.includes("desi")) return TheaterComedyRoundedIcon;
    if (g.includes("funk")) return GraphicEqRoundedIcon;
    if (g.includes("world") || g.includes("african") || g.includes("caribbean")) return RadioRoundedIcon;
    if (g.includes("experimental") || g.includes("ambient") || g.includes("noise")) return GraphicEqRoundedIcon;
    if (g.includes("hot") || g.includes("fire") || g.includes("trending")) return WhatshotRoundedIcon;
    return MusicNoteRoundedIcon;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatLocation(artist) {
    const city = safeStr(artist?.city).trim();
    const countyRaw = safeStr(artist?.county).trim();
    const county = countyRaw
        ? /county$/i.test(countyRaw)
            ? countyRaw
            : `${countyRaw} County`
        : "";
    if (city && county) return `${city}, ${county}`;
    return city || county || "";
}

function getAvatar(artist, fallback) {
    const raw =
        safeStr(artist?.avatar_url).trim() ||
        safeStr(artist?.avatarUrl).trim() ||
        safeStr(artist?.photo_url).trim() ||
        safeStr(artist?.photoUrl).trim() ||
        "";
    return raw || fallback || "";
}

function getInitials(name) {
    const parts = safeStr(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2);
    const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
    return letters.join("") || "♪";
}

const clampText = (value, max = 140) => {
    const s = String(value ?? "").trim();
    if (!s) return "";
    if (s.length <= max) return s;
    return s.slice(0, max).trimEnd();
};

// Fixed card height so every ArtistCard, BusinessDirectoryCard, and ServiceCard are the same size
const CARD_FIXED_HEIGHT = 248;

// Stable empty object so `artist || EMPTY_ARTIST` never creates a new reference per render
const EMPTY_ARTIST = Object.freeze({});

/**
 * Determine if the activeAccount matches this artist.
 */
function checkIsActiveProfile(artist, activeAccount) {
    if (!artist || !activeAccount) return false;

    const artistId = String(artist.id || "");
    const artistHandle = String(artist.handle || "").toLowerCase().trim();
    const artistName = String(artist.name || "").toLowerCase().trim();

    const candidateIds = [
        activeAccount.id,
        activeAccount.artist_id,
        activeAccount.artistId,
        activeAccount.profile_id,
        activeAccount.profileId,
        activeAccount.business_id,
        activeAccount.businessId,
    ].filter(Boolean).map(String);

    if (artistId && candidateIds.includes(artistId)) return true;

    const candidateHandles = [
        activeAccount.handle,
        activeAccount.artist_handle,
        activeAccount.artistHandle,
        activeAccount.username,
    ].filter(Boolean).map((h) => String(h).toLowerCase());

    if (artistHandle && candidateHandles.includes(artistHandle)) return true;

    const acctName = String(
        activeAccount.name || activeAccount.display_name || activeAccount.displayName || ""
    ).toLowerCase().trim();
    if (artistName && acctName && artistName === acctName) return true;

    return false;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function ArtistCardSkeleton() {
    const Sk = ({ variant = "text", width, height, sx: sxProp }) => (
        <Box
            sx={{
                bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                borderRadius: variant === "circular" ? "50%" : variant === "rounded" ? 999 : 0.5,
                width,
                height,
                ...sxProp,
            }}
        />
    );

    return (
        <Card
            sx={(t) => ({
                position: "relative",
                isolation: "isolate",
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(t.palette.text.primary, 0.10),
                backgroundColor: t.palette.background.paper,
                overflow: "hidden",
                boxShadow: (t) => `0 2px 10px ${alpha(t.palette.text.primary, 0.08)}`,
            })}
        >
            <Box sx={{ p: 2, pb: 1.5 }}>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <Sk variant="circular" width={72} height={72} />
                    <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                        <Sk height={20} width="55%" sx={{ mb: 0.35 }} />
                        <Sk height={13} width="35%" sx={{ mb: 0.5 }} />
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Sk variant="rounded" width={90} height={22} />
                            <Sk variant="rounded" width={70} height={22} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ mt: 1, minHeight: 24 }}>
                    <Sk height={14} width="90%" />
                </Box>
            </Box>
            <Box
                sx={{
                    px: 2,
                    pb: 1.5,
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Sk variant="rounded" width={100} height={24} />
                    <Sk variant="rounded" width={85} height={24} />
                </Box>
                <Sk width={90} height={13} />
            </Box>
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ArtistCard({
                                       artist,
                                       isFollowing = false,
                                       onOpenArtist,
                                       onOpenUserCard,
                                       disabled = false,
                                       defaultAvatarSrc = "",
                                       loading = false,
                                       selected = false,
                                       hovered = false,
                                       onHover,
                                       flat = false,
                                   }) {
    const { user } = useAuth();
    const { activeAccount, accountCacheKey, getAccountHeaders: getAcctHdrs, getAccountPayload: getAcctPayload } = useActiveAccount();

    // ── Stable refs for account helper functions to prevent infinite re-render loops ──
    // These functions are recreated every render by the context provider, so using
    // them directly in useEffect / useCallback dependency arrays causes setState
    // inside useEffect → re-render → new function ref → effect fires again → loop.
    const getAcctHdrsRef = useRef(getAcctHdrs);
    getAcctHdrsRef.current = getAcctHdrs;
    const getAcctPayloadRef = useRef(getAcctPayload);
    getAcctPayloadRef.current = getAcctPayload;

    // ── Stable ref for artist object — prevents useCallback re-creation on every render ──
    const aRef = useRef(artist || EMPTY_ARTIST);
    aRef.current = artist || EMPTY_ARTIST;

    const [avatarError, setAvatarError] = useState(false);
    const [localFollowing, setLocalFollowing] = useState(false);
    const [localFollowerCount, setLocalFollowerCount] = useState(0);
    const [localFollowingCount, setLocalFollowingCount] = useState(0);
    const [followBusy, setFollowBusy] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [artistMenuEl, setArtistMenuEl] = useState(null);
    const [artistReportOpen, setArtistReportOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState("");
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const timer = window.setTimeout(() => setHideBlockToast(""), 1800);
        return () => window.clearTimeout(timer);
    }, [hideBlockToast]);

    useEffect(() => {
        if (!copyLinkToast) return undefined;
        const timer = window.setTimeout(() => setCopyLinkToast(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copyLinkToast]);

    const a = artist || EMPTY_ARTIST;

    // Determine if the Header's active account IS this artist
    const isActiveProfile = checkIsActiveProfile(a, activeAccount);

    // ── Hydrate follow state on mount, artist change, and account switch ──
    useEffect(() => {
        if (!a?.id || !user || isActiveProfile) {
            setLocalFollowing(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const hdrs = typeof getAcctHdrsRef.current === 'function' ? getAcctHdrsRef.current() : {};
                const { isFollowing: serverFollow } = await fetchFollowState(a, hdrs);
                if (!cancelled) setLocalFollowing(serverFollow);
            } catch {
                if (!cancelled) setLocalFollowing(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [a?.id, user?.id, accountCacheKey]);

    // ── Listen for follow changes from the detail panel or other sources ──
    useEffect(() => {
        const artistId = getArtistId(a);
        if (!artistId) return;
        const handler = (e) => {
            const { artistId: evtId, isFollowing: nowFollowing, source } = e.detail || {};
            if (source === "card") return;
            if (evtId && Number(evtId) === artistId) {
                setLocalFollowing(Boolean(nowFollowing));
                // Re-fetch real count from API
                fetchFollowCounts(artistId).then((counts) => {
                    setLocalFollowerCount(counts.followers);
                    setLocalFollowingCount(counts.following);
                });
            }
        };
        window.addEventListener("ll:artist:follow-changed", handler);
        return () => window.removeEventListener("ll:artist:follow-changed", handler);
    }, [a?.id]);

    const handleFollowClick = useCallback(async (e) => {
        e.stopPropagation();
        if (disabled || followBusy) return;
        setFollowBusy(true);
        const prev = localFollowing;
        setLocalFollowing(!prev);
        setLocalFollowerCount((c) => Math.max(0, (c || 0) + (prev ? -1 : 1)));
        try {
            const hdrs = typeof getAcctHdrsRef.current === 'function' ? getAcctHdrsRef.current() : {};
            const payload = typeof getAcctPayloadRef.current === 'function' ? getAcctPayloadRef.current() : {};
            const currentArtist = aRef.current;
            const result = await callFollowApi(currentArtist, prev, hdrs, payload);
            const nowFollowing = Boolean(result?.following ?? result?.isFollowing);
            setLocalFollowing(nowFollowing);
            // Re-fetch real count from API to ensure accuracy
            const realCounts = await fetchFollowCounts(getArtistId(currentArtist));
            setLocalFollowerCount(realCounts.followers);
            setLocalFollowingCount(realCounts.following);
            // Broadcast so detail panel syncs
            window.dispatchEvent(new CustomEvent("ll:artist:follow-changed", {
                detail: { artistId: getArtistId(currentArtist), isFollowing: nowFollowing, source: "card" },
            }));
        } catch {
            setLocalFollowing(prev);
            setLocalFollowerCount((c) => Math.max(0, (c || 0) + (prev ? 1 : -1)));
        } finally {
            setFollowBusy(false);
        }
    }, [disabled, followBusy, localFollowing]);

    // Fetch follower count from API (same endpoint as detail panel)
    useEffect(() => {
        const artistId = getArtistId(a);
        if (!artistId) {
            setLocalFollowerCount(0);
            setLocalFollowingCount(0);
            return;
        }
        let cancelled = false;
        fetchFollowCounts(artistId).then((counts) => {
            if (!cancelled) {
                setLocalFollowerCount(counts.followers);
                setLocalFollowingCount(counts.following);
            }
        });
        return () => { cancelled = true; };
    }, [a?.id, accountCacheKey]);

    const handleArtistMenuOpen = (e) => {
        e.stopPropagation();
        setArtistMenuEl(e.currentTarget);
    };

    const handleArtistMenuClose = () => setArtistMenuEl(null);

    const handleArtistCopyLink = useCallback(async () => {
        handleArtistMenuClose();
        const currentArtist = aRef.current;
        const slug = safeStr(currentArtist?.slug || currentArtist?.handle).trim();
        const artistId = getArtistId(currentArtist);
        const path = slug
            ? `/music/${encodeURIComponent(slug)}`
            : artistId
                ? `/music/artists/${encodeURIComponent(String(artistId))}`
                : "/music";
        const url = `${window.location.origin}${path}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // ignore clipboard errors; still show confirmation
        }
        setCopyLinkToast(true);
    }, []);

    const handleArtistReportClick = useCallback(() => {
        handleArtistMenuClose();
        setArtistReportOpen(true);
    }, []);

    const submitArtistReport = useCallback(async ({ reason, details }) => {
        const artistId = getArtistId(aRef.current);
        if (!artistId) return;
        try {
            const res = await secureFetch(`${API_BASE}/music/artists/${encodeURIComponent(String(artistId))}/report`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("[ArtistCard] Report failed:", res.status, data);
                throw new Error(data?.error || data?.message || "Report failed");
            }
        } catch (err) {
            console.error("[ArtistCard] Report error:", err);
            throw err;
        }
    }, []);

    // ── Hide posts / Block handlers ──
    // Mirrors BusinessDirectoryCard pattern. Posts to /api/users/hide and
    // /api/users/block with target_type='artist' — the backend resolves this
    // to the artist's owner user and enforces a self-ownership guard.
    const handleHideArtist = useCallback(async () => {
        const currentArtist = aRef.current;
        const artistId = getArtistId(currentArtist);
        if (!artistId || hideBusy || blockBusy) return;
        handleArtistMenuClose();
        setHideBusy(true);
        const displayName = safeStr(currentArtist?.name).trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrsRef.current?.() || {}) };
            const payload = { target_id: Number(artistId), target_type: "artist", action: "hide" };
            const res = await secureFetch(`${API_BASE}/users/hide`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:hidden-changed", { detail: { artistId, hidden: true, source: "artistCard" } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [hideBusy, blockBusy]);

    const handleBlockArtist = useCallback(async () => {
        const currentArtist = aRef.current;
        const artistId = getArtistId(currentArtist);
        if (!artistId || hideBusy || blockBusy) return;
        handleArtistMenuClose();
        setBlockBusy(true);
        const displayName = safeStr(currentArtist?.name).trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrsRef.current?.() || {}) };
            const payload = { target_id: Number(artistId), target_type: "artist", action: "block" };
            const res = await secureFetch(`${API_BASE}/users/block`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:blocked-changed", { detail: { userId: artistId, targetType: "artist", blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:blocked-changed", { detail: { artistId, blocked: true, source: "artistCard" } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [hideBusy, blockBusy]);


    if (loading) return <ArtistCardSkeleton />;

    const name = safeStr(a?.name).trim() || "Artist";
    const handle = safeStr(a?.handle).trim().replace(/^@/, "");
    const locationLabel = formatLocation(a);
    const isStatewide = Boolean(a?.is_statewide || a?.isStatewide);

    const genres = Array.isArray(a?.genres)
        ? a.genres.map((g) => safeStr(g).trim()).filter(Boolean)
        : [];

    const shownGenres = genres.slice(0, 3);
    const extraGenresCount = Math.max(0, genres.length - shownGenres.length);

    // Visual artists use category icons (palette, brush, camera, ...);
    // musicians use the existing genre icons (mic, album, guitar, ...).
    const chipIconResolver = isVisualArtistProfile(a) ? getCategoryIcon : getGenreIcon;

    const avatarSrc = getAvatar(a, defaultAvatarSrc || "");
    const hasValidAvatar = avatarSrc && !avatarError;
    const initials = getInitials(name);

    const bioText = clampText(safeStr(a?.bio).trim(), 140);
    const bioIsLong = safeStr(a?.bio).trim().length > 140;

    const showFollow = Boolean(user) && !isActiveProfile;
    // Link check — true when this artist is tied to the viewer's account in
    // any way (active artist profile OR viewer is the owner_user_id on the
    // artist record). Used to hide destructive menu items even when the user
    // is on their personal account.
    const artistOwnerUserId = Number(a?.owner_user_id || a?.ownerUserId || 0);
    const viewerId = Number(user?.id || user?.user_id || 0);
    const isLinkedToArtist = Boolean(
        isActiveProfile ||
        (viewerId > 0 && artistOwnerUserId > 0 && viewerId === artistOwnerUserId)
    );
    const canReportArtist = !isLinkedToArtist;
    const artistMenuOpen = Boolean(artistMenuEl);
    const isVerified = a?.is_verified === true || a?.is_verified === 1 || a?.is_verified === "1" || a?.isVerified === true || a?.isVerified === 1 || a?.isVerified === "1";

    // Social links — parse links_json if links object isn't available (matches ArtistProfilePage)
    const links = (() => {
        if (a?.links && typeof a.links === "object" && !Array.isArray(a.links) && Object.keys(a.links).length > 0) return a.links;
        const raw = a?.links_json || a?.linksJson;
        if (raw && typeof raw === "string") { try { const p = JSON.parse(raw); if (p && typeof p === "object") return p; } catch { /* ignore */ } }
        if (raw && typeof raw === "object") return raw;
        return {};
    })();
    const linkEntries = Object.entries(links).filter(([, v]) => Boolean(String(v || "").trim()));
    const hasAnySocials = linkEntries.length > 0;

    const handleCardClick = () => {
        if (disabled) return;
        if (artistReportOpen || shareDialogOpen) return;
        if (onOpenArtist) onOpenArtist(a);
    };

    const handleLocationClick = (event) => {
        event.stopPropagation();
        if (disabled) return;
        window.dispatchEvent(
            new CustomEvent("ll:music:artist-location-click", {
                detail: { artist: a },
            })
        );
    };

    return (
        <Card
            data-hovered={hovered ? "true" : undefined}
            data-selected={selected ? "true" : undefined}
            onClick={handleCardClick}
            onMouseEnter={() => onHover?.(a?.id ?? null)}
            onMouseLeave={() => onHover?.(null)}
            elevation={flat ? 0 : 0}
            sx={(t) => {
                const m = t.custom.motion;
                const sh = t.custom.shadows;
                return {
                    position: "relative",
                    isolation: flat ? "auto" : "isolate",
                    borderRadius: flat ? "0 !important" : "16px",
                    border: flat ? "0 !important" : "1px solid",
                    display: "flex",
                    flexDirection: "column",
                    // Desktop: fixed height so every card lines up in the grid.
                    // Mobile (flat): let the card grow so long bios aren't clipped.
                    height: flat ? "auto" : CARD_FIXED_HEIGHT,
                    minHeight: flat ? CARD_FIXED_HEIGHT : undefined,
                    borderColor: flat
                        ? "transparent"
                        : selected
                            ? t.palette.secondary.main
                            : alpha(t.palette.text.primary, 0.08),
                    backgroundColor: t.palette.background.paper,
                    overflow: "hidden",
                    ...(flat ? { backgroundImage: "none !important", boxShadow: "none !important",
                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)} !important`,
                    } : {}),
                    cursor: disabled ? "default" : "pointer",
                    boxShadow: flat
                        ? "none"
                        : selected
                            ? (sh?.md || `0 8px 32px ${alpha(t.palette.text.primary, 0.12)}`)
                            : hovered
                                ? (sh?.sm || `0 6px 20px ${alpha(t.palette.text.primary, 0.08)}`)
                                : (sh?.xs || `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`),
                    transition: flat ? "none" : `box-shadow ${m?.slow || 300}ms ${m?.ease || "ease"}, border-color ${m?.slow || 300}ms ${m?.ease || "ease"}, transform ${m?.slow || 300}ms ${m?.ease || "ease"}`,
                    transform: "translateY(0)",
                    // Mobile: active press feedback
                    "@media (hover: none)": {
                        "&:active": (!flat && !disabled) ? {
                            transform: "scale(0.985)",
                            boxShadow: sh?.xs || `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`,
                        } : {},
                    },
                    "&:hover": flat ? {} : {
                        boxShadow: sh?.sm || `0 6px 20px ${alpha(t.palette.text.primary, 0.08)}`,
                        transform: "none",
                    },
                };
            }}
        >
            {/* Top-right actions removed — now in-flow below */}

            <Box
                sx={{
                    p: flat ? 0 : { xs: 1.5, sm: 2 },
                    px: flat ? 2 : undefined,
                    pt: flat ? 1.5 : undefined,
                    pb: flat ? 0.5 : 1.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    overflow: "hidden",
                }}
            >
                {/* Header row: Avatar+Name on left, Follow+Menu on right (in-flow, matching BusinessDirectoryCard) */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Left: Avatar + Name + Handle */}
                    <Box
                        onClick={(e) => {
                            if (typeof onOpenUserCard === 'function') {
                                e.stopPropagation();
                                onOpenUserCard(e.currentTarget, {
                                    account_type: 'artist',
                                    artist_id: a?.id,
                                    artist_name: name,
                                    artist_handle: handle,
                                    artist_avatar_url: avatarSrc || '',
                                    handle: handle,
                                    first_name: name,
                                    last_name: '',
                                    avatar_url: avatarSrc || '',
                                });
                            }
                        }}
                        sx={{
                            display: "flex",
                            gap: 1.5,
                            alignItems: "flex-start",
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            minWidth: 0,
                            flex: 1,
                            cursor: typeof onOpenUserCard === 'function' ? 'pointer' : 'default',
                        }}
                    >
                        {/* Avatar — matches BusinessDirectoryCard sizing (always 48) */}
                        <Avatar
                            src={hasValidAvatar ? avatarSrc : undefined}
                            onError={() => setAvatarError(true)}
                            alt={name}
                            sx={(t) => ({
                                width: 48,
                                height: 48,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                flexShrink: 0,
                                border: "2px solid",
                                borderColor: alpha(t.palette.text.primary, 0.06),
                                "& .MuiAvatar-img": {
                                    objectFit: "cover",
                                    transform: "scale(1.15)",
                                },
                            })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        >
                            {isVisualArtistProfile(a)
                                ? <PaletteRoundedIcon sx={{ fontSize: 26 }} />
                                : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />}
                        </Avatar>

                        {/* Name, Handle, Genre Chips */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Name + Verified */}
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: "1.05rem",
                                        lineHeight: 1.25,
                                        color: "text.primary",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {name}
                                </Typography>
                                {isVerified ? (
                                    <Tooltip title="Verified Artist" arrow>
                                        <VerifiedRoundedIcon sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} />
                                    </Tooltip>
                                ) : null}
                            </Stack>

                            {handle ? (
                                <Typography
                                    sx={{
                                        mt: 0.15,
                                        fontWeight: 600,
                                        fontSize: "0.78rem",
                                        lineHeight: 1.2,
                                        color: "text.secondary",
                                    }}
                                    noWrap
                                >
                                    @{handle}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>

                    {/* Right: Follow + 3-dot menu — in flow, aligned with header (matching BusinessDirectoryCard) */}
                    <Box sx={{ flexShrink: 0, mt: -0.75, display: "flex", alignItems: "center", gap: 0.5 }}
                         onClick={(e) => e.stopPropagation()}>
                        {showFollow && (
                            <Tooltip title={localFollowing ? "Following" : "Follow"} arrow>
                                <IconButton
                                    size="small"
                                    onClick={handleFollowClick}
                                    sx={(t) => ({
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                        borderRadius: 999,
                                        opacity: followBusy ? 0.6 : 1,
                                        color: localFollowing ? "primary.main" : "text.secondary",
                                        "&:hover": {
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                        },
                                    })}
                                >
                                    {localFollowing
                                        ? <HowToRegRoundedIcon sx={{ fontSize: 18 }} />
                                        : <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="More" arrow>
                            <IconButton
                                size="small"
                                onClick={handleArtistMenuOpen}
                                sx={(t) => ({
                                    flexShrink: 0,
                                    width: 32,
                                    height: 32,
                                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                    borderRadius: 999,
                                    color: "text.secondary",
                                    "&:hover": {
                                        bgcolor: alpha(t.palette.text.primary, 0.06),
                                    },
                                })}
                            >
                                <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <SmartMenu
                            anchorEl={artistMenuEl}
                            open={artistMenuOpen}
                            onClose={handleArtistMenuClose}
                            onClick={(e) => e.stopPropagation()}
                            disableScrollLock
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                            PaperProps={{
                                sx: {
                                    mt: 0.5,
                                    borderRadius: 2.5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`,
                                    minWidth: 200,
                                    py: 0.5,
                                },
                            }}
                        >
                            <MenuItem onClick={handleArtistCopyLink} sx={{ py: 1 }}>
                                <ListItemIcon>
                                    <LinkIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>
                            {canReportArtist ? [
                                <Divider key="report-divider" sx={{ my: 0.5 }} />,
                                <MenuItem key="report-item" onClick={handleArtistReportClick} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <FlagOutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Report artist" />
                                </MenuItem>,
                            ] : null}
                            {viewerId > 0 && !isLinkedToArtist && (
                                <MenuItem onClick={handleHideArtist} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <VisibilityOffRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Hide posts" />
                                </MenuItem>
                            )}
                            {viewerId > 0 && !isLinkedToArtist && (
                                <MenuItem onClick={handleBlockArtist} disabled={hideBusy || blockBusy} sx={{ py: 1, color: "error.main" }}>
                                    <ListItemIcon sx={{ color: "error.main" }}>
                                        <BlockRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Block artist" />
                                </MenuItem>
                            )}
                        </SmartMenu>
                    </Box>
                </Box>

                {/* Genre Chips — own line below name (matching category chips in BusinessDirectoryCard) */}
                {shownGenres.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.5 }}>
                        {shownGenres.map((g, idx) => {
                            const GenreIcon = chipIconResolver(g);
                            return (
                                <Chip
                                    key={`${g}-${idx}`}
                                    size="small"
                                    icon={<GenreIcon sx={{ fontSize: "13px !important" }} />}
                                    label={g}
                                    sx={(t) => ({
                                        height: 22,
                                        borderRadius: 999,
                                        bgcolor: alpha(t.palette.primary.main, 0.07),
                                        color: t.palette.text.primary,
                                        fontWeight: 700,
                                        fontSize: "0.7rem",
                                        "& .MuiChip-icon": {
                                            color: t.palette.primary.main,
                                            ml: 0.5,
                                        },
                                        "& .MuiChip-label": { px: 0.75 },
                                    })}
                                />
                            );
                        })}
                        {extraGenresCount > 0 ? (
                            <Chip
                                size="small"
                                label={`+${extraGenresCount}`}
                                sx={(t) => ({
                                    height: 22,
                                    borderRadius: 999,
                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                    color: t.palette.text.secondary,
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.text.primary, 0.08),
                                    "& .MuiChip-label": { px: 0.75 },
                                })}
                            />
                        ) : null}
                    </Stack>
                )}

                {/* Description / Bio — 3 lines max, always rendered for consistent card height */}
                <Box sx={{ mt: 1.75, minHeight: 0, flex: 1, overflow: "hidden" }}>
                    {bioText ? (
                        <Box
                            sx={{
                                fontSize: "0.82rem",
                                lineHeight: 1.45,
                                color: "text.secondary",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                            }}
                        >
                            <RichTextDisplay
                                html={safeStr(a?.bio).trim()}
                                sx={{
                                    fontSize: "inherit",
                                    lineHeight: "inherit",
                                    color: "inherit",
                                    '& p': { m: 0, mb: 0.25 },
                                    '& p:last-of-type': { mb: 0 },
                                    '& h3': { fontSize: "inherit", fontWeight: 700, m: 0, mb: 0.25 },
                                    '& ul, & ol': { my: 0, pl: 2 },
                                    '& li': { mb: 0 },
                                }}
                            />
                        </Box>
                    ) : null}
                </Box>

                {/* Location — right-aligned, above footer (all breakpoints, matching BusinessDirectoryCard) */}
                {(locationLabel || isStatewide) && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", mt: "auto", pt: 0.5, minHeight: 38, flexShrink: 0 }}>
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            onClick={handleLocationClick}
                            sx={(t) => ({
                                cursor: disabled ? "default" : "pointer",
                                borderRadius: 1,
                                px: 0.5,
                                mx: -0.5,
                                transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover .artist-loc-icon, &:hover .artist-loc-text": {
                                    color: t.palette.secondary.main,
                                },
                            })}
                        >
                            {isStatewide ? (
                                <PublicRoundedIcon
                                    className="artist-loc-icon"
                                    sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                />
                            ) : (
                                <LocationOnRoundedIcon
                                    className="artist-loc-icon"
                                    sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                />
                            )}
                            <Typography
                                className="artist-loc-text"
                                noWrap
                                sx={(t) => ({
                                    fontSize: 12,
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    color: "primary.main",
                                    whiteSpace: "nowrap",
                                    transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                })}
                            >
                                {isStatewide ? "Statewide · Alabama" : locationLabel}
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Footer: Share | Social Links (matching BusinessDirectoryCard — no location here) */}
            <Box
                sx={{
                    px: flat ? 2 : { xs: 1.25, sm: 1.5 },
                    py: 0.75,
                    borderTop: flat ? "none" : "1px solid",
                    borderColor: flat ? "transparent" : "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.5,
                    minHeight: 44,
                }}
            >
                {/* Left: Share */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Tooltip title="Share" arrow>
                        <Box
                            onClick={(e) => { e.stopPropagation(); setShareDialogOpen(true); }}
                            role="button"
                            tabIndex={0}
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 999,
                                cursor: "pointer",
                                transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                "&:active": { transform: "scale(0.97)" },
                            }}
                        >
                            <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                        </Box>
                    </Tooltip>
                </Stack>

                {/* Right: Social links — flat icons, no background (matching BusinessDirectoryCard) */}
                {hasAnySocials ? (
                    <Stack direction="row" spacing={0.125} sx={{ flexShrink: 0 }}>
                        {sortLinksStreamingFirst(linkEntries).slice(0, 8).map(([k, v]) => {
                            const platform = getLinkPlatform(k);
                            const label = String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());
                            return (
                                <Tooltip key={k} title={label} arrow>
                                    <IconButton
                                        component="a"
                                        href={buildSocialUrl(String(v), platform || "")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                        sx={(t) => {
                                            const color = getLinkColor(k, t);
                                            return {
                                                width: { xs: 28, sm: 24 },
                                                height: { xs: 28, sm: 24 },
                                                color: color || (t.palette.mode === "dark" ? t.palette.text.primary : t.palette.text.secondary),
                                                "&:hover": { bgcolor: alpha(color || t.palette.text.primary, 0.08) },
                                            };
                                        }}
                                    >
                                        {getLinkIcon(k, 15)}
                                    </IconButton>
                                </Tooltip>
                            );
                        })}
                    </Stack>
                ) : null}
            </Box>

            <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                <ReportContentDialog
                    open={artistReportOpen}
                    onClose={() => setArtistReportOpen(false)}
                    onSubmit={submitArtistReport}
                    title="Report artist"
                    sx={{ zIndex: 100001 }}
                />
            </Box>

            <SuccessSnackbar
                open={copyLinkToast}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
            />

            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast("")}
                message={hideBlockToast}
            />

            <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                <ShareDialog
                    contentType="artist"
                    open={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    artist={artist}
                    viewer={user}
                    sx={{ zIndex: 100001 }}
                />
            </Box>
        </Card>
    );
}
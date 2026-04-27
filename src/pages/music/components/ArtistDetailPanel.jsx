import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Alert,
    Avatar,
    Box,
    Button,

    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    InputAdornment,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    MenuItem,
    Radio,
    RadioGroup,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

// Icons
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import DynamicFeedRoundedIcon from "@mui/icons-material/DynamicFeedRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ShareIcon from "@mui/icons-material/Share";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";

// Genre icons
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
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import MicExternalOnRoundedIcon from "@mui/icons-material/MicExternalOnRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

import defaultAvatar from "../../../assets/profile/default_avatar.png";
import { PhotoCommentsDialog } from '../../profile/userProfile/ProfileHeader';
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import SharePostDialog from "../../../components/SharePostDialog";
import ShareDialog from "../../../components/ShareDialog";
import MusicPostDetailPanel from "./MusicPostDetailPanel";
import { DetailPanel } from "../../../components/MobileActivityShell";
import ActionBar from "../../../components/ActionBar";
import ArtistEngagementTabs from "./ArtistEngagementTabs";
import ReportContentDialog from "../../../components/ReportContentDialog";
import EventDetailPanel from "../../events/components/EventDetailPanel";
import { fetchEvents, formatEventDateTimeCT, formatEventLocation, getEventCategoryLabel } from "../../events/api/eventsApi";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

// Highlight section icon map
const HL_DETAIL_ICONS = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    MusicNote: MusicNoteRoundedIcon,
    Album: AlbumRoundedIcon,
    Groups: GroupsRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
    Mic: MicExternalOnRoundedIcon,
    Campaign: CampaignRoundedIcon,
};
function HlDetailIcon({ name, ...props }) {
    const Icon = HL_DETAIL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

/**
 * ArtistDetailPanel
 * Right panel component for displaying artist details on the Music page.
 * Modeled after BusinessDetailPanel – cover photo, avatar, bio, genres,
 * links, photo gallery, with internal About / Photos / Releases tabs.
 *
 * Intended location:
 *   src/pages/music/components/ArtistDetailPanel.jsx
 */

// ─── Genre Icon Mapping ─────────────────────────────────────────────────────

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

function getInitials(name) {
    return String(name || "")
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] || "")
        .join("")
        .toUpperCase();
}

// ─── Social / Link Icons (matches ArtistProfilePage exactly) ────────────────

function buildSocialUrl(val, platform) {
    if (!val) return "#";
    const s = String(val).trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    const domains = {
        facebook: "facebook.com", instagram: "instagram.com", twitter: "x.com",
        youtube: "youtube.com", tiktok: "tiktok.com/@", spotify: "open.spotify.com/artist",
        soundcloud: "soundcloud.com", bandcamp: "bandcamp.com", appleMusic: "music.apple.com",
    };
    const domain = domains[platform] || "";
    if (!domain) return s.includes(".") ? `https://${s}` : s;
    if (s.startsWith(domain) || s.startsWith(`www.${domain}`)) return `https://${s}`;
    const username = s.replace(/^@/, "");
    if (platform === "tiktok") return `https://tiktok.com/@${username}`;
    return `https://${domain}/${username}`;
}

function getLinkIcon(key, size = 20) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return <InstagramIcon sx={{ fontSize: size }} />;
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return <XIcon sx={{ fontSize: size }} />;
    if (k.includes("youtube")) return <YouTubeIcon sx={{ fontSize: size }} />;
    if (k.includes("facebook")) return <FacebookIcon sx={{ fontSize: size }} />;
    if (k.includes("tiktok")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13.1a8.16 8.16 0 005.58 2.2V11.9a4.85 4.85 0 01-3.58-1.63V6.69h3.58z" /></svg></Box>
        );
    }
    if (k.includes("spotify")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg></Box>
        );
    }
    if (k.includes("soundcloud")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.084-.1zm-.899 1.67c-.06 0-.091.037-.104.09L0 15.479l.165 1.308c.014.057.045.09.111.09.068 0 .09-.033.104-.09l.21-1.319-.21-1.334c-.014-.064-.036-.09-.104-.09zm1.83-1.62c-.074 0-.12.06-.12.135l-.21 2.07.21 2.134c0 .075.046.135.12.135.074 0 .12-.06.12-.135l.24-2.134-.24-2.07c0-.075-.046-.12-.12-.12v-.015zm.945-.57c-.09 0-.135.075-.135.15l-.193 2.19.193 2.176c0 .09.045.149.135.149.075 0 .135-.06.135-.15l.21-2.175-.21-2.19c0-.075-.06-.15-.135-.15zm1.065-.375c-.105 0-.165.09-.165.165l-.18 2.385.18 2.31c0 .095.06.18.165.18.089 0 .164-.085.164-.18l.195-2.31-.195-2.385c0-.09-.059-.165-.164-.165zm1.14-.12c-.12 0-.195.105-.195.195l-.165 2.385.165 2.37c0 .105.075.195.195.195.104 0 .18-.09.18-.195l.195-2.37-.195-2.385c0-.09-.076-.195-.18-.195zm1.155-.12c-.135 0-.225.12-.225.225l-.15 2.385.15 2.385c0 .12.09.225.225.225.119 0 .225-.105.225-.225l.165-2.385-.165-2.385c0-.105-.106-.225-.225-.225zm1.2.045c-.149 0-.254.135-.254.255l-.15 2.19.15 2.4c0 .135.105.255.254.255.135 0 .255-.12.255-.255l.15-2.4-.15-2.19c0-.12-.12-.255-.255-.255zm1.215-.09c-.165 0-.285.15-.285.285l-.135 2.13.135 2.43c0 .15.12.285.285.285.15 0 .285-.135.285-.285l.15-2.43-.15-2.13c0-.135-.135-.285-.285-.285zm1.215-.03c-.18 0-.315.165-.315.315L9.75 14.4l.12 2.43c0 .165.135.315.315.315.165 0 .315-.15.315-.315l.135-2.43-.135-2.385c0-.15-.15-.315-.315-.315zm1.23.105c-.195 0-.345.18-.345.345l-.105 2.19.105 2.445c0 .18.15.345.345.345.18 0 .345-.165.345-.345l.12-2.445-.12-2.19c0-.165-.165-.345-.345-.345zm1.245-.06c-.21 0-.375.195-.375.375l-.09 2.205.09 2.445c0 .195.165.375.375.375.195 0 .375-.18.375-.375l.105-2.445-.105-2.205c0-.18-.18-.375-.375-.375zm1.26-.015c-.225 0-.405.21-.405.405l-.075 2.175.075 2.445c0 .21.18.405.405.405.21 0 .405-.195.405-.405l.09-2.445-.09-2.175c0-.195-.195-.405-.405-.405zm1.275.06c-.24 0-.435.225-.435.435l-.06 2.085.06 2.445c0 .225.195.435.435.435.225 0 .42-.21.42-.435l.075-2.445-.075-2.085c0-.21-.195-.435-.42-.435zm1.29.09c-.255 0-.45.24-.45.465l-.045 1.965.045 2.43c0 .24.195.465.45.465.24 0 .45-.225.45-.465l.06-2.43-.06-1.965c0-.225-.21-.465-.45-.465zm1.305.255c-.27 0-.48.255-.48.495l-.03 1.665.03 2.4c0 .255.21.495.48.495.255 0 .48-.24.48-.495l.045-2.4-.045-1.665c0-.24-.225-.495-.48-.495zm1.32.465c-.285 0-.51.27-.51.525l-.015 1.155.015 2.37c0 .27.225.525.51.525.27 0 .51-.255.51-.525l.03-2.37-.03-1.155c0-.255-.24-.525-.51-.525zm1.335.6c-.3 0-.54.285-.54.54v.69l.015 2.325c0 .27.24.555.525.555.27 0 .54-.285.54-.555l.015-2.325v-.69c0-.255-.255-.54-.54-.54h-.015zm3.39-.45c-.405 0-.795.075-1.155.195-.24-2.715-2.535-4.86-5.355-4.86-.72 0-1.425.15-2.055.405-.24.12-.315.24-.315.465v9.555c0 .24.18.465.435.48h8.445c1.395 0 2.52-1.17 2.52-2.61s-1.125-2.63-2.52-2.63z" /></svg></Box>
        );
    }
    if (k.includes("bandcamp")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" /></svg></Box>
        );
    }
    if (k.includes("apple") && k.includes("music")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.237C19.103.1 18.496.04 17.89.003 17.717-.004 17.543 0 17.37 0H6.63c-.174 0-.347-.004-.521.003C5.503.04 4.896.1 4.3.237a5.023 5.023 0 00-1.875.655C1.307 1.625.561 2.624.245 3.935A9.23 9.23 0 00.003 6.124C-.003 6.297 0 6.47 0 6.643v10.714c0 .173-.003.347.003.52a9.23 9.23 0 00.242 2.19c.316 1.31 1.062 2.31 2.18 3.042.568.38 1.196.645 1.874.655.607.138 1.214.197 1.821.235.173.007.347.003.52.003h10.74c.174 0 .347.004.521-.003.607-.038 1.214-.097 1.821-.235a5.023 5.023 0 001.875-.655c1.118-.733 1.863-1.732 2.18-3.043.17-.713.236-1.441.24-2.19.003-.173 0-.347 0-.52V6.643c0-.173.004-.346-.003-.52zM16.95 17.22c-.12.15-.27.28-.44.37-.33.17-.69.25-1.07.27-.17.01-.34 0-.51-.03a2.1 2.1 0 01-.79-.33c-.44-.35-.7-.81-.74-1.38-.04-.51.13-.97.47-1.34.39-.41.88-.63 1.44-.66.44-.02.84.09 1.19.36v-5l-5.56 1.68v5.94c.01.18 0 .36-.04.54-.1.57-.42 1-.93 1.29-.27.15-.57.24-.88.27-.18.01-.36 0-.54-.02a2.06 2.06 0 01-.82-.35c-.42-.34-.67-.78-.72-1.33-.05-.54.12-1 .47-1.38.38-.41.87-.63 1.42-.66.44-.02.85.09 1.2.37V7.19c0-.13.03-.24.1-.35.1-.16.24-.26.42-.3l6.4-1.93c.04-.01.07-.02.11-.02.25-.05.44.09.46.35v10c.01.19 0 .38-.05.57-.1.55-.41.97-.91 1.26z" /></svg></Box>
        );
    }
    if (k.includes("linktree")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7.953 15.066l-.038-4.2-4.058-.048L7.07 7.645.903 4.395l2.955-2.063L7.14 6.65l3.285-4.317.84.84-2.34 4.29 4.17.048-3.225 3.15 4.08 3.225-2.955 2.07-3.285-4.318-3.285 4.317-2.955-2.069 4.473-3.72zm8.147 0l.037-4.2 4.059-.048-3.213-3.173L23.1 4.395l-2.955-2.063-3.282 4.318L13.578 2.333l-.84.84 2.34 4.29-4.17.048 3.225 3.15-4.08 3.225 2.955 2.07 3.285-4.318 3.285 4.317 2.955-2.069-4.473-3.72zM10.5 18.75h3v5.25h-3z" /></svg></Box>
        );
    }
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
    return null;
}

function getLinkColor(key, theme) {
    const k = String(key).toLowerCase();
    const isDark = theme?.palette?.mode === 'dark';
    const social = theme?.custom?.brand?.social || theme?.custom?.social || {};
    if (k.includes("instagram")) return social.instagram || "#E4405F";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return social.x || (isDark ? theme.palette.text.primary : null);
    if (k.includes("youtube")) return social.youtube || "#FF0000";
    if (k.includes("facebook")) return social.facebook || "#1877F2";
    if (k.includes("tiktok")) return social.tiktok || (isDark ? theme.palette.text.primary : null);
    if (k.includes("spotify")) return social.spotify || "#1DB954";
    if (k.includes("soundcloud")) return social.soundcloud || "#FF5500";
    if (k.includes("bandcamp")) return social.bandcamp || "#1DA0C3";
    if (k.includes("apple") && k.includes("music")) return social.appleMusic || "#FA243C";
    if (k.includes("linktree")) return social.linktree || "#43E660";
    if (k.includes("website") || k.includes("web") || k.includes("home")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || null);
    if (k.includes("email") || k.includes("mail")) return isDark ? theme.palette.text.primary : (theme?.palette?.text?.secondary || null);
    return null;
}

/** Returns true for music streaming / distribution platforms. */
function isStreamingPlatform(key) {
    const k = String(key).toLowerCase();
    return (
        k.includes("spotify") || k.includes("soundcloud") || k.includes("bandcamp") ||
        k.includes("applemusic") || k.includes("apple_music") || k.includes("apple music") ||
        k.includes("tidal") || k.includes("deezer") || k.includes("amazon") ||
        k.includes("youtube") || k.includes("yt")
    );
}

/** Reorders link entries so streaming platforms appear first, then social/other. */
function sortLinksStreamingFirst(entries) {
    const streaming = [];
    const social = [];
    for (const entry of entries) {
        if (isStreamingPlatform(entry[0])) streaming.push(entry);
        else social.push(entry);
    }
    return [...streaming, ...social];
}



// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ scope = "any" }) {
    // Scope is one of: "music" (musicians), "artist" (visual artists), "any".
    // Picks the icon + title + body copy to match the tab the user was
    // browsing when they arrived here with no selection.
    const EmptyIcon = scope === "artist" ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    const title = scope === "artist"
        ? "Select a visual artist"
        : scope === "music"
            ? "Select a music artist"
            : "Select an artist";
    const body = scope === "artist"
        ? "Choose a visual artist from the directory to see their full profile, photos, and work."
        : scope === "music"
            ? "Choose a music artist from the directory to see their full profile, photos, and music."
            : "Choose an artist from the directory to see their full profile, photos, and work.";
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "@keyframes artistFadeIn": {
                    "0%": { opacity: 0, transform: "translateY(8px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                animation: "artistFadeIn 280ms ease-out both",
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                    py: 3,
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 420,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.1,
                        textAlign: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid",
                            borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                            bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                            boxShadow: (t) => `0 1px 0 ${alpha(t.palette.text.primary, 0.04)}`,
                        }}
                    >
                        <EmptyIcon sx={{ fontSize: 48, color: "primary.main" }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                        {title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                        {body}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Skeleton variant="rectangular" height={140} />
            <Box sx={{ px: 2, mt: -3, position: "relative", zIndex: 2 }}>
                <Skeleton variant="rounded" width={88} height={88} sx={{ borderRadius: 2.5 }} />
                <Skeleton height={26} width="60%" sx={{ mt: 1 }} />
                <Skeleton height={16} width="40%" sx={{ mt: 0.5 }} />
                <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                    <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 999 }} />
                </Box>
            </Box>
            <Box sx={{ px: 2, mt: 2 }}>
                <Skeleton height={40} width="100%" />
            </Box>
            <Box sx={{ px: 2, mt: 2 }}>
                <Skeleton height={14} width="100%" />
                <Skeleton height={14} width="90%" sx={{ mt: 0.5 }} />
                <Skeleton height={14} width="75%" sx={{ mt: 0.5 }} />
            </Box>
        </Box>
    );
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────

function PhotoGallery({ photos, onPhotoClick }) {
    const [openIdx, setOpenIdx] = useState(null);

    const items = Array.isArray(photos) ? photos.filter(Boolean) : [];

    if (items.length === 0) {
        return (
            <Box
                sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <Box
                    sx={(t) => ({
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(t.palette.primary.main, 0.06),
                        border: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.10),
                        mb: 0.5,
                    })}
                >
                    <PhotoLibraryRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                    No photos yet
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 260 }}>
                    Photos will appear here once this artist adds them.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Thumbnail grid */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 0.75,
                }}
            >
                {items.map((item, i) => {
                    const url = typeof item === 'string' ? item : item.url;
                    return (
                        <Box
                            key={i}
                            onClick={() => {
                                if (onPhotoClick) {
                                    const photoId = typeof item === 'string' ? null : (item.id || item.photo_id || null);
                                    onPhotoClick(photoId, url);
                                } else {
                                    setOpenIdx(i);
                                }
                            }}
                            sx={(t) => ({
                                position: "relative",
                                width: "100%",
                                paddingTop: "100%",
                                borderRadius: 2,
                                overflow: "hidden",
                                cursor: "pointer",
                                bgcolor: "grey.100",
                                transition: "opacity 150ms ease, transform 150ms ease",
                                "&:hover": {
                                    opacity: 0.85,
                                    transform: "scale(1.02)",
                                },
                                "&:hover .photo-overlay": {
                                    opacity: 1,
                                },
                            })}
                        >
                            <Box
                                component="img"
                                src={url}
                                alt={`Photo ${i + 1}`}
                                referrerPolicy="no-referrer"
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            <Box
                                className="photo-overlay"
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    bgcolor: (t) => alpha(t.palette.text.primary, 0.15),
                                    opacity: 0,
                                    transition: "opacity 150ms ease",
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>

            {/* Fullscreen photo dialog */}
            <Dialog
                open={openIdx !== null}
                onClose={() => setOpenIdx(null)}
                maxWidth="md"
                fullWidth
                slotProps={{
                    backdrop: {
                        sx: { bgcolor: (t) => alpha(t.palette.text.primary, 0.75), backdropFilter: "blur(6px)" },
                    },
                }}
                PaperProps={{
                    sx: {
                        bgcolor: "transparent",
                        boxShadow: "none",
                        overflow: "visible",
                        m: 1,
                    },
                }}
            >
                {/* Close button */}
                <IconButton
                    onClick={() => setOpenIdx(null)}
                    sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        zIndex: 10,
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.6),
                        color: "common.white",
                        width: 36,
                        height: 36,
                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.8) },
                    }}
                >
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>

                {openIdx !== null && items[openIdx] && (
                    <Box sx={{ position: "relative" }}>
                        <Box
                            component="img"
                            src={typeof items[openIdx] === 'string' ? items[openIdx] : items[openIdx].url}
                            alt={`Photo ${openIdx + 1}`}
                            referrerPolicy="no-referrer"
                            sx={{
                                width: "100%",
                                maxHeight: "85vh",
                                objectFit: "contain",
                                display: "block",
                                borderRadius: 2,
                            }}
                        />

                        {/* Navigation arrows */}
                        {items.length > 1 && (
                            <>
                                <IconButton
                                    size="small"
                                    onClick={() => setOpenIdx((prev) => (prev - 1 + items.length) % items.length)}
                                    sx={{
                                        position: "absolute",
                                        left: 8,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                                        color: "common.white",
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => setOpenIdx((prev) => (prev + 1) % items.length)}
                                    sx={{
                                        position: "absolute",
                                        right: 8,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                                        color: "common.white",
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                {/* Counter */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 12,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        bgcolor: (t) => alpha(t.palette.text.primary, 0.55),
                                        color: "common.white",
                                        borderRadius: 999,
                                        px: 1.5,
                                        py: 0.25,
                                        fontSize: "0.75rem",
                                        fontWeight: 800,
                                        backdropFilter: "blur(4px)",
                                    }}
                                >
                                    {openIdx + 1} / {items.length}
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Dialog>
        </Box>
    );
}

// ─── Date helper ─────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Fetch artist posts (paginated) ──────────────────────────────────────────

async function fetchArtistPosts({ artistId, limit = 50, offset = 0 }) {
    const params = new URLSearchParams({ sort: "newest", limit: String(limit), offset: String(offset) });
    const res = await secureFetch(`/api/music/artists/${artistId}/posts?${params.toString()}`, {
        credentials: "include",
        headers: { ...getAccountHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
}

// ─── Follow API helpers ─────────────────────────────────────────────────────

const FOLLOW_API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    return raw ? `${raw}/api` : "/api";
})();

function getArtistId(artist) {
    if (!artist) return null;
    const raw = artist.id ?? artist.artist_id ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchArtistFollowState(artist, acctHeaders) {
    const artistId = getArtistId(artist);
    if (!artistId) return { isFollowing: false };
    try {
        const qs = new URLSearchParams({ target_id: String(artistId), target_type: "artist" });
        const res = await secureFetch(`${FOLLOW_API_BASE}/follows/status?${qs}`, {
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

async function callArtistFollowApi(artist, currentlyFollowing, acctHeaders, acctPayload) {
    const artistId = getArtistId(artist);
    if (!artistId) throw new Error("No artist ID");
    const res = await secureFetch(`${FOLLOW_API_BASE}/follows/toggle`, {
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

async function fetchArtistFollowCounts(artistId, viewerUserId, acctHeaders) {
    if (!artistId) return { followers: 0, following: 0 };
    try {
        // Use the same /follows/social/ endpoint that SocialHome and the popup dialog use.
        // This returns the actual follower/following arrays, so .length matches the popup exactly.
        if (viewerUserId) {
            const res = await secureFetch(
                `${FOLLOW_API_BASE}/follows/social/${encodeURIComponent(viewerUserId)}?account_type=artist&account_id=${artistId}`,
                {
                    credentials: "include",
                    headers: { Accept: "application/json", ...(acctHeaders || {}) },
                }
            );
            if (res.ok) {
                const data = await res.json();
                const followersArr = Array.isArray(data?.followers) ? data.followers : [];
                const followingArr = Array.isArray(data?.following) ? data.following : [];
                return { followers: followersArr.length, following: followingArr.length };
            }
        }
        // Fallback to counts endpoint if no viewer or social endpoint fails
        const res = await secureFetch(`${FOLLOW_API_BASE}/follows/counts/artist/${artistId}`, {
            credentials: "include",
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return { followers: Number(data?.followers) || 0, following: Number(data?.following) || 0 };
    } catch {
        return { followers: 0, following: 0 };
    }
}

// ─── Main Component ──────────────────────────────────────────────────────────

const DESC_MAX_HEIGHT = 160;

export default function ArtistDetailPanel({ artist, user: userProp, onOpenUserCard, onSavePageState, activeTab: activeTabProp }) {
    const navigate = useNavigate();
    const authCtx = useAuth();
    const adpTheme = useTheme();
    const isMobile = useMediaQuery(adpTheme.breakpoints.down('md'));
    const user = userProp || authCtx?.user || null;
    const { activeAccount, accountCacheKey, getAccountHeaders: getAcctHdrs, getAccountPayload: getAcctPayload } = useActiveAccount();
    // Read saved restore state synchronously during init to prevent flash
    const _restoreRef = useRef(null);
    if (_restoreRef.current === null) {
        try {
            const savedArtistId = sessionStorage.getItem("ll:artist:id");
            const savedTab = sessionStorage.getItem("ll:artist:activeTab");
            const savedPostId = sessionStorage.getItem("ll:artist:selectedPostId");
            const savedScroll = sessionStorage.getItem("ll:artist:scrollTop");
            if (savedArtistId && String(artist?.id) === savedArtistId && savedTab === "1") {
                _restoreRef.current = { tab: 2, postId: savedPostId || null, scroll: Number(savedScroll || 0) };
                sessionStorage.removeItem("ll:artist:scrollTop");
                sessionStorage.removeItem("ll:artist:id");
                sessionStorage.removeItem("ll:artist:selectedPostId");
                sessionStorage.removeItem("ll:artist:activeTab");
            } else {
                _restoreRef.current = {};
            }
        } catch {
            _restoreRef.current = {};
        }
    }
    const _rs = _restoreRef.current;

    const [activeTab, setActiveTab] = useState(_rs.tab ?? 0);
    const [descExpanded, setDescExpanded] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [followsDialogOpen, setFollowsDialogOpen] = useState(false);
    const [followsDialogTab, setFollowsDialogTab] = useState(0); // 0 = Followers, 1 = Following
    const [canManage, setCanManage] = useState(false);

    // ── Mobile Activity dialog state ──
    const [activityOpen, setActivityOpen] = useState(false);
    const [activitySelectedPost, setActivitySelectedPost] = useState(null);
    const [activitySelectedEvent, setActivitySelectedEvent] = useState(null);
    const [activityScrollCommentId, setActivityScrollCommentId] = useState(null);
    const [activityHighlightCommentId, setActivityHighlightCommentId] = useState(null);

    // ── Photo comments/likes state ──
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar');
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState('');
    const [photoCommentsLoading, setPhotoCommentsLoading] = useState(false);
    const [artistGalleryPhotos, setArtistGalleryPhotos] = useState([]);
    const [artistGalleryLoaded, setArtistGalleryLoaded] = useState(false);

    // Posts state
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsLoadingMore, setPostsLoadingMore] = useState(false);
    const [postsHasMore, setPostsHasMore] = useState(false);
    const [postsTotal, setPostsTotal] = useState(0);
    const postsLoadMoreRef = useRef(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [sharePost, setSharePost] = useState(null);
    const [profileShareOpen, setProfileShareOpen] = useState(false);
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [artistMenuEl, setArtistMenuEl] = useState(null);
    const [artistReportOpen, setArtistReportOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState("");
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(_rs.postId ?? null);
    const artistScrollRef = useRef(null);

    // Events state
    const [artistEvents, setArtistEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsTotal, setEventsTotal] = useState(0);
    const [selectedEventId, setSelectedEventId] = useState(null);

    // ── Activity: jobs / services detection ──
    const [artistHasJobs, setArtistHasJobs] = useState(false);
    const [artistHasServices, setArtistHasServices] = useState(false);

    const scrollToTop = useCallback(() => {
        requestAnimationFrame(() => {
            const wrapper = artistScrollRef.current;
            if (!wrapper) return;
            let sp = wrapper.parentElement;
            while (sp) {
                const s = window.getComputedStyle(sp);
                if (s.overflowY === "auto" || s.overflowY === "scroll") { sp.scrollTop = 0; break; }
                sp = sp.parentElement;
            }
        });
    }, []);

    useEffect(() => {
        if (!copyLinkToast) return undefined;
        const timer = window.setTimeout(() => setCopyLinkToast(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copyLinkToast]);

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const timer = window.setTimeout(() => setHideBlockToast(""), 1800);
        return () => window.clearTimeout(timer);
    }, [hideBlockToast]);

    const hasSelection = Boolean(artist && (artist.id || artist.name || artist.handle));

    // Reset tab + collapse when artist changes
    const [prevArtistId, setPrevArtistId] = useState(null);
    const currentId = artist?.id ?? artist?.handle ?? null;
    if (currentId !== prevArtistId) {
        setPrevArtistId(currentId);
        if (activeTab !== 0) {
            setActiveTab(0);
        }
        if (descExpanded) {
            setDescExpanded(false);
        }
        if (selectedPostId) {
            setSelectedPostId(null);
        }
        if (selectedEventId) {
            setSelectedEventId(null);
        }
    }

    // Check if current user can manage this artist (owner or team member)
    useEffect(() => {
        if (!artist || !user) {
            setCanManage(false);
            return;
        }
        const userId = user.id || user.user_id;
        if (!userId) {
            setCanManage(false);
            return;
        }
        const artistId = artist.id;
        const ownerUserId = artist.owner_user_id || artist.ownerUserId;
        if (ownerUserId && String(ownerUserId) === String(userId)) {
            setCanManage(true);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(`/api/music/artists/${artistId}/team`, {
                    credentials: "include",
                    headers: { ...getAccountHeaders() },
                });
                if (!res.ok) {
                    if (!cancelled) setCanManage(false);
                    return;
                }
                const data = await res.json();
                const isMember = Array.isArray(data?.members) && data.members.some(
                    (m) => String(m.userId || m.user_id) === String(userId)
                );
                if (!cancelled) setCanManage(isMember);
            } catch {
                if (!cancelled) setCanManage(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artist, user]);

    // Hydrate follow state + counts — re-check on artist change or account switch
    useEffect(() => {
        if (!artist?.id || !user) {
            setIsFollowing(false);
            setFollowCounts({ followers: 0, following: 0 });
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const hdrs = typeof getAcctHdrs === 'function' ? getAcctHdrs() : {};
                const [{ isFollowing: f }, counts] = await Promise.all([
                    fetchArtistFollowState(artist, hdrs),
                    fetchArtistFollowCounts(artist.id, user?.public_id || user?.id || user?.handle, hdrs),
                ]);
                if (!cancelled) {
                    setIsFollowing(f);
                    setFollowCounts(counts);
                }
            } catch {
                if (!cancelled) {
                    setIsFollowing(false);
                    setFollowCounts({ followers: 0, following: 0 });
                }
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artist?.id, user?.id, accountCacheKey]);

    // ── Listen for follow changes from the card or other sources ──
    useEffect(() => {
        const artistId = getArtistId(artist);
        if (!artistId) return;
        const handler = (e) => {
            const { artistId: evtId, isFollowing: nowFollowing, source } = e.detail || {};
            if (source === "detail") return; // ignore our own events
            if (evtId && Number(evtId) === artistId) {
                setIsFollowing(Boolean(nowFollowing));
            }
        };
        window.addEventListener("ll:artist:follow-changed", handler);
        return () => window.removeEventListener("ll:artist:follow-changed", handler);
    }, [artist?.id]);

    const handleFollowClick = useCallback(async () => {
        if (!artist || !user || followBusy) return;
        setFollowBusy(true);
        const prev = isFollowing;
        setIsFollowing(!prev);
        // Optimistic count update
        setFollowCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (prev ? -1 : 1)) }));
        try {
            const hdrs = typeof getAcctHdrs === 'function' ? getAcctHdrs() : {};
            const payload = typeof getAcctPayload === 'function' ? getAcctPayload() : {};
            const result = await callArtistFollowApi(artist, prev, hdrs, payload);
            const nowFollowing = Boolean(result?.following ?? result?.isFollowing);
            setIsFollowing(nowFollowing);
            // Refresh real counts from server (use social endpoint for accurate counts)
            fetchArtistFollowCounts(artist.id, user?.public_id || user?.id || user?.handle, hdrs).then((c) => setFollowCounts(c)).catch(() => {});
            // Broadcast so card and other components sync
            window.dispatchEvent(new CustomEvent("ll:artist:follow-changed", {
                detail: { artistId: getArtistId(artist), isFollowing: nowFollowing, source: "detail" },
            }));
        } catch {
            setIsFollowing(prev);
            setFollowCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (prev ? 1 : -1)) }));
        } finally {
            setFollowBusy(false);
        }
    }, [artist, user, followBusy, isFollowing, getAcctHdrs, getAcctPayload]);

    const handleArtistCopyLink = useCallback(() => {
        setArtistMenuEl(null);
        const slugOrHandle = String(artist?.handle || artist?.id || "").trim();
        if (!slugOrHandle) return;
        const url = `${window.location.origin}/${slugOrHandle}`;
        navigator.clipboard.writeText(url).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [artist?.handle, artist?.id]);

    const handleArtistReportClick = useCallback(() => {
        setArtistMenuEl(null);
        setArtistReportOpen(true);
    }, []);

    const submitArtistReport = useCallback(async ({ reason, details }) => {
        const artistId = artist?.id;
        if (!artistId) return;
        try {
            await secureFetch(`/api/music/artists/${encodeURIComponent(artistId)}/report`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
        } catch {
            // silent
        }
    }, [artist?.id]);

    // ── Hide posts / Block handlers ──
    // Mirrors BusinessDirectoryCard / ArtistCard pattern. The backend
    // resolves target_type='artist' to the artist's owner and enforces a
    // self-ownership guard in /api/users/{hide,block}.
    const handleHideArtist = useCallback(async () => {
        const artistId = artist?.id;
        if (!artistId || hideBusy || blockBusy) return;
        setArtistMenuEl(null);
        setHideBusy(true);
        const displayName = String(artist?.name || "Artist").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrs?.() || {}) };
            const res = await secureFetch(`/api/users/hide`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({ target_id: Number(artistId), target_type: "artist", action: "hide" }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:hidden-changed", { detail: { artistId, hidden: true, source: "artistDetailPanel" } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [artist?.id, artist?.name, hideBusy, blockBusy, getAcctHdrs]);

    const handleBlockArtist = useCallback(async () => {
        const artistId = artist?.id;
        if (!artistId || hideBusy || blockBusy) return;
        setArtistMenuEl(null);
        setBlockBusy(true);
        const displayName = String(artist?.name || "Artist").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrs?.() || {}) };
            const res = await secureFetch(`/api/users/block`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({ target_id: Number(artistId), target_type: "artist", action: "block" }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:blocked-changed", { detail: { userId: artistId, targetType: "artist", blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:blocked-changed", { detail: { artistId, blocked: true, source: "artistDetailPanel" } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [artist?.id, artist?.name, hideBusy, blockBusy, getAcctHdrs]);

    // Fetch posts when artist changes
    useEffect(() => {
        let cancelled = false;
        const artistId = artist?.id;
        if (!artistId) {
            setPosts([]);
            setPostsTotal(0);
            setPostsHasMore(false);
            return;
        }
        async function loadPosts() {
            setPostsLoading(true);
            setPosts([]);
            setPostsHasMore(false);
            setPostsTotal(0);
            try {
                const res = await fetchArtistPosts({ artistId, limit: 50, offset: 0 });
                if (!cancelled) {
                    const items = res?.items || [];
                    const total = Number(res?.total || items.length);
                    setPosts(items);
                    setPostsTotal(total);
                    setPostsHasMore(items.length < total);
                }
            } catch {
                if (!cancelled) {
                    setPosts([]);
                    setPostsTotal(0);
                    setPostsHasMore(false);
                }
            } finally {
                if (!cancelled) setPostsLoading(false);
            }
        }
        loadPosts();
        return () => { cancelled = true; };
    }, [artist?.id, accountCacheKey]);

    // Load more posts — ref to avoid stale closures in observer
    const loadMorePostsRef = useRef(null);
    loadMorePostsRef.current = async () => {
        const artistId = artist?.id;
        if (!artistId || postsLoadingMore || !postsHasMore) return;
        setPostsLoadingMore(true);
        try {
            const currentLen = posts.length;
            const res = await fetchArtistPosts({ artistId, limit: 50, offset: currentLen });
            const items = res?.items || [];
            const total = Number(res?.total || 0);
            setPosts((prev) => [...prev, ...items]);
            setPostsTotal(total);
            setPostsHasMore(currentLen + items.length < total);
        } catch {
            // silent
        } finally {
            setPostsLoadingMore(false);
        }
    };

    // IntersectionObserver for posts infinite scroll
    useEffect(() => {
        const sentinel = postsLoadMoreRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMorePostsRef.current?.();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [postsHasMore, postsLoadingMore, postsLoading]);

    // Ref to store scroll position before navigating to full post page
    const postsScrollRef = useRef(0);

    // Restore scroll position (deferred since DOM needs to render first)
    useEffect(() => {
        if (_rs.scroll) {
            requestAnimationFrame(() => {
                postsScrollRef.current = _rs.scroll;
            });
        }
    }, []);

    // Fetch events created by this artist
    useEffect(() => {
        let cancelled = false;
        const artistId = artist?.id;
        if (!artistId) {
            setArtistEvents([]);
            setEventsTotal(0);
            return;
        }
        setEventsLoading(true);
        (async () => {
            try {
                const data = await fetchEvents({
                    artistAccountId: artistId,
                    limit: 20,
                    page: 1,
                    includeTotal: 1,
                    range: "all",
                });
                if (!cancelled) {
                    const items = Array.isArray(data?.items) ? data.items : [];
                    setArtistEvents(items);
                    setEventsTotal(Number(data?.totalCount || items.length));
                }
            } catch {
                if (!cancelled) {
                    setArtistEvents([]);
                    setEventsTotal(0);
                }
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artist?.id]);

    // ── Activity: check if artist has jobs ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId) { setArtistHasJobs(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterArtistId: aId, limit: 1 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setArtistHasJobs(items.length > 0);
            } catch { if (alive) setArtistHasJobs(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artist?.id]);

    // ── Activity: check if artist has services ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId) { setArtistHasServices(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/services/feed', {
                    params: { posterArtistId: aId, limit: 1 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setArtistHasServices(items.length > 0);
            } catch { if (alive) setArtistHasServices(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artist?.id]);

    // ── Photo comments callbacks (must be before early return) ──
    const openArtistPhotoComments = useCallback(async (kind) => {
        const aId = artist?.id;
        if (!aId) return;
        const aUrl = kind === 'cover'
            ? (artist?.cover_url || artist?.coverUrl || '')
            : (artist?.avatar_url || artist?.avatarUrl || '');
        if (!aUrl) return;
        if (kind === 'avatar' && (aUrl.includes('default_avatar') || aUrl.includes('default_artist'))) return;
        setPhotoCommentsLoading(true);
        try {
            const r = await axios.get(`/api/music/artists/${aId}/photos/special/${kind}`, { withCredentials: true });
            const photo = r.data?.photo;
            if (photo?.id) {
                setPhotoCommentsType(kind === 'cover' ? 'cover' : 'avatar');
                setPhotoCommentsPhotoId(photo.id);
                setPhotoCommentsPhotoUrl(photo.url || aUrl);
                setPhotoCommentsOpen(true);
            }
        } catch {
            // silently fail
        } finally {
            setPhotoCommentsLoading(false);
        }
    }, [artist]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || '');
        setPhotoCommentsOpen(true);
    }, []);

    // ── Fetch artist gallery photos with DB IDs (for like/comment support) ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/music/artists/${aId}/photos`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) { setArtistGalleryPhotos(items); setArtistGalleryLoaded(true); }
            } catch { if (alive) setArtistGalleryLoaded(true); }
        })();
        return () => { alive = false; };
    }, [artist?.id]);

    if (!hasSelection) {
        // Tell EmptyState which directory the user was browsing so the
        // copy + icon match: "Select a visual artist" (palette) on the
        // Artists tab, "Select a musician" (music note) on the Music tab,
        // or a neutral "Select an artist" fallback when the tab isn't known.
        const scope = activeTabProp === "visualArtists"
            ? "artist"
            : activeTabProp === "artists"
                ? "music"
                : "any";
        return <EmptyState scope={scope} />;
    }

    const safeArtist = artist || {};

    const name = String(safeArtist.name || "").trim() || "Unknown Artist";
    const handle = safeArtist.handle ? `@${safeArtist.handle}` : "";
    // Artist sub-type: 'music' (musicians) or 'artist' (visual artists).
    // The serializer normalizes `profileType`; we also read `profile_type`
    // for defensive compatibility with any caller that passes a raw row.
    const profileType = String(safeArtist.profileType || safeArtist.profile_type || "music").toLowerCase();
    const isVisualArtist = profileType === "artist";
    // Shared default icon used anywhere this page renders a fallback avatar
    // for the current artist. Picks Palette for visual artists, Music Note
    // for musicians — mirrors the pattern used elsewhere (AccountAvatar etc.).
    const ArtistDefaultIcon = isVisualArtist ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    // Human-readable label shared between chips and the "Music Artist" line
    // in the message recipient card.
    const artistTypeLabel = isVisualArtist ? "Visual Artist" : "Music Artist";
    const city = String(safeArtist.city || "").trim();
    const countyRaw = String(safeArtist.county || "").trim();
    const isStatewide = Boolean(safeArtist.isStatewide);

    const countyLabel = countyRaw
        ? /county$/i.test(countyRaw)
            ? countyRaw
            : `${countyRaw} County`
        : "";

    const location = isStatewide
        ? "Statewide · Alabama"
        : [city, countyLabel].filter(Boolean).join(", ");

    const genres = Array.isArray(safeArtist.genres) ? safeArtist.genres : [];
    const bio = String(safeArtist.bio || "").trim();
    const tagline = String(safeArtist.tagline || "").trim();
    const foundingYear = safeArtist.foundingYear || safeArtist.founding_year || "";
    const hometown = String(safeArtist.hometown || "").trim();

    // Parse highlight sections from settings
    const artistHighlightSections = (() => {
        const raw = safeArtist.settings_json || safeArtist.settingsJson || safeArtist.settings;
        let s = {};
        if (raw && typeof raw === "string") { try { s = JSON.parse(raw); } catch { s = {}; } }
        else if (raw && typeof raw === "object") { s = raw; }
        return Array.isArray(s.highlightSections) ? s.highlightSections.filter((sec) => sec.title?.trim() || sec.body?.trim() || sec.photoUrl) : [];
    })();

    const links = (() => {
        if (safeArtist.links && typeof safeArtist.links === "object" && !Array.isArray(safeArtist.links) && Object.keys(safeArtist.links).length > 0) return safeArtist.links;
        const raw = safeArtist.links_json || safeArtist.linksJson;
        if (raw && typeof raw === "string") { try { const p = JSON.parse(raw); if (p && typeof p === "object") return p; } catch { /* ignore */ } }
        if (raw && typeof raw === "object") return raw;
        return {};
    })();
    const linkEntries = Object.entries(links).filter(([, v]) => Boolean(v));

    const avatarSrc = safeArtist.avatarUrl || safeArtist.avatar_url || "";
    const resolvedAvatarSrc = avatarSrc;
    const coverUrl = String(safeArtist.coverUrl || safeArtist.cover_url || "").trim();

    // Photos
    const photoCandidates =
        safeArtist.photos ||
        safeArtist.photoUrls ||
        safeArtist.images ||
        safeArtist.imageUrls ||
        safeArtist.mediaPhotos ||
        [];
    const photos = Array.isArray(photoCandidates)
        ? photoCandidates
            .map((p) => {
                if (typeof p === "string") return p;
                if (p && typeof p === "object" && p.url) return p.url;
                return null;
            })
            .filter(Boolean)
        : [];

    const galleryPhotos = artistGalleryLoaded && artistGalleryPhotos.length > 0
        ? artistGalleryPhotos
        : (photos.length > 0 ? photos : (coverUrl ? [coverUrl] : []));

    // Artist settings (from settings_json)
    const artistAllowMessages = (() => {
        const raw = safeArtist.settings_json || safeArtist.settingsJson || safeArtist.settings;
        let s = {};
        if (raw && typeof raw === 'string') { try { s = JSON.parse(raw); } catch { s = {}; } }
        else if (raw && typeof raw === 'object') { s = raw; }
        const v = s.allow_messages ?? s.allowMessages;
        if (v == null) return true; // default enabled
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    // Stats
    const followersCount = followCounts.followers;
    const followingCount = followCounts.following;

    const idOrHandle = safeArtist.handle || safeArtist.id;
    const canViewProfile = Boolean(idOrHandle);

    // Determine if the active account IS this artist (logged into this artist profile)
    const isOnArtistProfile = (() => {
        if (!activeAccount || !artist) return false;

        const artistId = String(artist.id || '');
        const artistHandleLower = String(artist.handle || '').toLowerCase();

        // Match active account ID fields against artist ID
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

        // Fallback: match on handle
        const candidateHandles = [
            activeAccount.handle,
            activeAccount.artist_handle,
            activeAccount.artistHandle,
            activeAccount.username,
        ].filter(Boolean).map((h) => String(h).toLowerCase());

        if (artistHandleLower && candidateHandles.includes(artistHandleLower)) return true;

        // Fallback: match on name
        const artistNameLower = String(artist.name || '').toLowerCase().trim();
        const acctNameLower = String(activeAccount.name || activeAccount.display_name || activeAccount.displayName || '').toLowerCase().trim();
        if (artistNameLower && acctNameLower && artistNameLower === acctNameLower) return true;

        return false;
    })();

    // Check if the personal user can manage this artist (owner) but is on wrong profile
    const personalCanManage = (() => {
        if (!user || !artist) return false;
        const userId = String(user.id || user.user_id || '');
        const ownerUserId = String(artist.owner_user_id || artist.ownerUserId || '');
        return Boolean(userId && ownerUserId && userId === ownerUserId);
    })();

    // Broader link check — true when the viewer is tied to this artist in any
    // way (active artist profile OR personal account whose user_id matches the
    // artist's owner_user_id). Used to hide Report / Hide posts / Block so a
    // user can't target an artist that belongs to them from any account.
    const isLinkedToArtist = Boolean(isOnArtistProfile || personalCanManage);
    const viewerId = Number(user?.id || user?.user_id || 0);

    const canReportArtist = !isLinkedToArtist;
    const artistMenuOpen = Boolean(artistMenuEl);

    const handleViewProfile = () => {
        if (!canViewProfile) return;
        navigate(`/${encodeURIComponent(String(idOrHandle))}`);
    };

    // Resolve selected post detail from posts array
    const selectedPostDetail = selectedPostId
        ? posts.find((p) => String(p?.post_id || p?.id) === String(selectedPostId)) || null
        : null;

    // The community post ID used for routes (post_id is the community post; id may be the artist_posts row)
    const selectedPostRouteId = selectedPostDetail
        ? (selectedPostDetail.post_id || selectedPostDetail.id)
        : null;

    const selectedEventDetail = selectedEventId
        ? artistEvents.find((e) => String(e?.id) === String(selectedEventId)) || null
        : null;

    const handleViewPostPage = (postId) => {
        const artistHandleStr = safeArtist.handle || "";
        // Use the community post ID for the route
        const routeId = postId || selectedPostRouteId;
        if (!artistHandleStr || !routeId) return;
        // Save MusicPage state so it can restore on return
        if (typeof onSavePageState === "function") onSavePageState();
        try {
            // Save artist detail state for local restoration
            sessionStorage.setItem("ll:artist:scrollTop", String(postsScrollRef.current || 0));
            sessionStorage.setItem("ll:artist:id", String(artist?.id || ""));
            sessionStorage.setItem("ll:artist:selectedPostId", String(selectedPostId || ""));
            sessionStorage.setItem("ll:artist:activeTab", "1");
        } catch {}
        navigate(`/${artistHandleStr}/posts/${routeId}`, {
            state: { post: selectedPostDetail, from: "music", fromArtist: true },
        });
    };

    return (
        <Box
            key={currentId}
            ref={artistScrollRef}
            sx={{
                bgcolor: "background.paper",
                "@keyframes artistFadeIn": {
                    "0%": { opacity: 0, transform: "translateY(8px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                animation: "artistFadeIn 280ms ease-out both",
            }}
        >
            {selectedPostDetail ? (
                <Box sx={{ bgcolor: "background.paper" }}>
                    {/* Back header */}
                    <Box
                        sx={(t) => ({
                            bgcolor: "background.paper",
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.6),
                            px: 1.5,
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        })}
                    >
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => { setSelectedPostId(null); scrollToTop(); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                        >
                            Back to posts
                        </Button>

                        <Chip
                            icon={
                                <Avatar
                                    src={safeArtist.avatar_url || safeArtist.avatarUrl || undefined}
                                    sx={(t) => ({ width: 20, height: 20, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}
                                >
                                    <ArtistDefaultIcon sx={{ fontSize: 12 }} />
                                </Avatar>
                            }
                            label={`Posted by ${name}`}
                            sx={(t) => ({
                                fontWeight: 900,
                                borderRadius: 999,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.16),
                                "& .MuiChip-icon": { ml: 0.75, mr: 0.25 },
                                "& .MuiChip-label": {
                                    py: 0.2,
                                    pl: 0.5,
                                    pr: 1.25,
                                    maxWidth: 220,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                },
                            })}
                        />
                    </Box>

                    {/* Post detail content */}
                    <Box sx={{ flex: 1 }}>
                        <MusicPostDetailPanel
                            user={user}
                            post={{
                                ...selectedPostDetail,
                                artist_id: selectedPostDetail.artist_id || safeArtist.id || "",
                                artist_name: selectedPostDetail.artist_name || name,
                                artist_handle: selectedPostDetail.artist_handle || safeArtist.handle || "",
                                artist_avatar_url: selectedPostDetail.artist_avatar_url || safeArtist.avatar_url || safeArtist.avatarUrl || "",
                            }}
                            onViewPost={(p) => handleViewPostPage(p?.post_id || p?.id || selectedPostRouteId)}
                        />
                    </Box>
                </Box>
            ) : selectedEventDetail ? (
                <Box sx={{ bgcolor: "background.paper" }}>
                    {/* Back header */}
                    <Box
                        sx={(t) => ({
                            bgcolor: "background.paper",
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.6),
                            px: 1.5,
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        })}
                    >
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => { setSelectedEventId(null); scrollToTop(); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                        >
                            Back to events
                        </Button>

                        <Chip
                            icon={
                                <Avatar
                                    src={safeArtist.avatar_url || safeArtist.avatarUrl || undefined}
                                    sx={(t) => ({ width: 20, height: 20, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}
                                >
                                    <ArtistDefaultIcon sx={{ fontSize: 12 }} />
                                </Avatar>
                            }
                            label={`Event by ${name}`}
                            sx={(t) => ({
                                fontWeight: 900,
                                borderRadius: 999,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.16),
                                "& .MuiChip-icon": { ml: 0.75, mr: 0.25 },
                                "& .MuiChip-label": {
                                    py: 0.2,
                                    pl: 0.5,
                                    pr: 1.25,
                                    maxWidth: 220,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                },
                            })}
                        />
                    </Box>

                    {/* Event detail content */}
                    <Box sx={{ flex: 1 }}>
                        <EventDetailPanel
                            event={selectedEventDetail}
                            user={user}
                            onClearSelection={() => { setSelectedEventId(null); scrollToTop(); }}
                            onClose={() => { setSelectedEventId(null); scrollToTop(); }}
                        />
                    </Box>
                </Box>
            ) : (
                <Box sx={{ bgcolor: "background.paper" }}>
                    {/* ─── Cover Photo ─── */}
                    {coverUrl && (
                        <Box sx={{ position: 'relative', width: '100%', height: { xs: 140, sm: 180, md: 200 }, overflow: 'hidden', cursor: 'pointer' }}
                             onClick={() => openArtistPhotoComments('cover')}>
                            <Box component="img" src={coverUrl} alt="" referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = "none"; }} sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                        </Box>
                    )}

                    {/* ═══ HEADER: AVATAR + TITLE + ACTIONS (matching BusinessDetailPanel) ═══ */}
                    <Box sx={{ px: 2, pt: coverUrl ? 1.5 : 2, pb: 0.5 }}>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            <Avatar
                                src={resolvedAvatarSrc || undefined}
                                alt={name}
                                variant="circular"
                                onClick={() => { if (resolvedAvatarSrc) openArtistPhotoComments('avatar'); }}
                                sx={{ width: 64, height: 64, flexShrink: 0, border: '2px solid', borderColor: (t) => alpha(t.palette.divider, 0.3), bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main', cursor: resolvedAvatarSrc ? 'pointer' : 'default', "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" } }}
                                imgProps={{ referrerPolicy: "no-referrer" }}
                            >
                                <ArtistDefaultIcon sx={{ fontSize: 28 }} />
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 950, fontSize: '1.05rem', lineHeight: 1.2, color: 'text.primary', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{name}</Typography>
                                {handle && <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600, mt: 0.15 }}>{handle}</Typography>}
                                {tagline && <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 700, mt: 0.15, letterSpacing: '0.03em', fontStyle: 'italic' }}>{tagline}</Typography>}
                                {location && (<Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.3 }}><LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} /><Typography sx={{ fontWeight: 700, fontSize: 12, color: "primary.main" }} noWrap>{location}</Typography></Stack>)}
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.35 }}>
                                    <Stack direction="row" spacing={0.35} alignItems="baseline" onClick={() => { setFollowsDialogTab(0); setFollowsDialogOpen(true); }} sx={{ cursor: 'pointer', '&:hover .fc-lbl': { textDecoration: 'underline' } }}><Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1 }}>{followersCount}</Typography><Typography className="fc-lbl" sx={{ fontWeight: 600, fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>Followers</Typography></Stack>
                                    <Stack direction="row" spacing={0.35} alignItems="baseline" onClick={() => { setFollowsDialogTab(1); setFollowsDialogOpen(true); }} sx={{ cursor: 'pointer', '&:hover .fc-lbl': { textDecoration: 'underline' } }}><Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1 }}>{followingCount}</Typography><Typography className="fc-lbl" sx={{ fontWeight: 600, fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>Following</Typography></Stack>
                                </Stack>
                            </Box>

                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                                {canManage && isOnArtistProfile ? (
                                    <Tooltip title="More" arrow><IconButton size="small" onClick={(e) => setArtistMenuEl(e.currentTarget)} sx={(t) => ({ width: 32, height: 32, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, bgcolor: "background.paper", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) } })}><MoreVertIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                ) : (
                                    <>
                                        {isMobile ? (
                                            <Tooltip title={isFollowing ? 'Following' : 'Follow'} arrow><IconButton size="small" onClick={() => { if (!user) { authCtx?.requireAuth?.(); return; } handleFollowClick(); }} disabled={followBusy} sx={{ width: 32, height: 32, border: '1px solid', borderColor: isFollowing ? 'primary.main' : (t) => alpha(t.palette.text.primary, 0.2), borderRadius: 1.5, color: isFollowing ? 'primary.main' : 'text.secondary', bgcolor: isFollowing ? (t) => alpha(t.palette.primary.main, 0.06) : 'transparent', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>{isFollowing ? <HowToRegRoundedIcon sx={{ fontSize: 18 }} /> : <PersonAddRoundedIcon sx={{ fontSize: 18 }} />}</IconButton></Tooltip>
                                        ) : (
                                            <Button size="small" variant={isFollowing ? "outlined" : "contained"} startIcon={isFollowing ? <HowToRegRoundedIcon sx={{ fontSize: "14px !important" }} /> : <PersonAddRoundedIcon sx={{ fontSize: "14px !important" }} />} onClick={() => { if (!user) { authCtx?.requireAuth?.(); return; } handleFollowClick(); }} disabled={followBusy} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 900, fontSize: "0.72rem", px: 1, py: 0.35, minHeight: 0, minWidth: 0, whiteSpace: "nowrap" }}>{isFollowing ? "Following" : "Follow"}</Button>
                                        )}
                                        <IconButton size="small" onClick={(e) => setArtistMenuEl(e.currentTarget)} sx={{ flexShrink: 0, color: 'text.secondary' }}><MoreVertIcon sx={{ fontSize: 18 }} /></IconButton>
                                    </>
                                )}
                            </Stack>
                        </Stack>

                        {/* ─── Genres — neatly below profile area ─── */}
                        {genres.length > 0 && (
                            <Box sx={{ px: 2, mt: 0.5 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                                    {genres.slice(0, 6).map((g) => { const GenreIcon = getGenreIcon(g); return (<Chip key={g} icon={<GenreIcon sx={{ fontSize: '13px !important' }} />} label={g} size="small" sx={(t) => ({ height: 22, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.custom?.primaryText || t.palette.primary.main, fontWeight: 800, fontSize: 10.5, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.25), '& .MuiChip-icon': { color: t.custom?.primaryText || t.palette.primary.main, ml: 0.5 }, '& .MuiChip-label': { px: 0.75, lineHeight: 1 } })} />); })}
                                </Stack>
                            </Box>
                        )}

                        {/* ─── Links — matching business detail icon row ─── */}
                        {linkEntries.length > 0 && (
                            <Box sx={{ px: 2, mt: 0.5 }}>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                                    {sortLinksStreamingFirst(linkEntries).slice(0, 8).map(([k, v]) => { const platform = getLinkPlatform(k); const label = String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase()); return (<Tooltip key={k} title={label} arrow><IconButton component="a" href={buildSocialUrl(String(v), platform || "")} target="_blank" rel="noreferrer" size="small" sx={(t) => { const color = getLinkColor(k, t); return { width: 28, height: 28, color: color || t.palette.primary.main, bgcolor: alpha(color || t.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(color || t.palette.primary.main, 0.18) } }; }}>{getLinkIcon(k, 14)}</IconButton></Tooltip>); })}
                                </Stack>
                            </Box>
                        )}
                    </Box>

                    {/* ─── Action Button Row ─── */}
                    {canManage && isOnArtistProfile ? (
                        <Stack direction="row" spacing={1} sx={{ px: 2, pt: isMobile ? 1 : 1.5, pb: 0.5 }}>
                            {!isMobile && <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />} onClick={handleViewProfile} disabled={!canViewProfile} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 0.75, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>View Profile</Button>}
                            <Button variant="outlined" fullWidth startIcon={<ShareIcon sx={{ fontSize: isMobile ? "16px !important" : "18px !important" }} />} onClick={() => setProfileShareOpen(true)} sx={{ borderRadius: isMobile ? 999 : 2, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.75rem" : "0.85rem", py: isMobile ? 0.5 : 0.75, minHeight: isMobile ? 34 : undefined, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Share</Button>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1} sx={{ px: 2, pt: isMobile ? 1 : 1.5, pb: 0.5 }}>
                            {Boolean(user) && !isOnArtistProfile && artistAllowMessages && (<Button variant="contained" fullWidth startIcon={<MailOutlineRoundedIcon sx={{ fontSize: isMobile ? "16px !important" : "18px !important" }} />} onClick={() => { if (!user) { authCtx?.requireAuth?.(); return; } setQuickMsgOpen(true); }} sx={{ borderRadius: isMobile ? 999 : 2, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.75rem" : "0.85rem", py: isMobile ? 0.5 : 0.75, minHeight: isMobile ? 34 : undefined }}>Message</Button>)}
                            {!isMobile && <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />} onClick={handleViewProfile} disabled={!canViewProfile} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 0.75, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>View Profile</Button>}
                            <Button variant="outlined" fullWidth startIcon={<ShareIcon sx={{ fontSize: isMobile ? "16px !important" : "18px !important" }} />} onClick={() => setProfileShareOpen(true)} sx={{ borderRadius: isMobile ? 999 : 2, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.75rem" : "0.85rem", py: isMobile ? 0.5 : 0.75, minHeight: isMobile ? 34 : undefined, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Share</Button>
                        </Stack>
                    )}

                    {/* ─── Tabs ─── */}
                    <Tabs value={activeTab} onChange={(_e, v) => { if (isMobile && v === 1) return; setActiveTab(v); }} variant="fullWidth"
                          sx={(t) => ({ minHeight: isMobile ? 52 : 38, flexShrink: 0, borderRadius: 0, padding: 0, backgroundColor: "transparent", border: "none", boxShadow: "none", borderBottom: "1px solid", borderColor: t.palette.divider, "& .MuiTab-root": { minHeight: isMobile ? 52 : 38, textTransform: "none", fontWeight: 850, fontSize: isMobile ? "0.68rem" : "0.8rem", py: 0, borderRadius: 0, color: alpha(t.palette.text.primary, 0.55), '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5) }, '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary } }, "& .Mui-selected": { color: `${t.palette.text.primary} !important` }, "& .MuiTabs-indicator": { bgcolor: t.palette.text.primary, height: 2.5, borderRadius: 0 } })}>
                        <Tab icon={<InfoRoundedIcon sx={{ fontSize: 16 }} />} iconPosition={isMobile ? "top" : "start"} label="About" value={0} />
                        {isMobile ? (<Tab icon={<DynamicFeedRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="top" label="Activity" value={1} onClick={(e) => { e.preventDefault(); setActivityOpen(true); }} />) : (<Tab icon={<ArticleRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Posts" value={1} />)}
                        {!isMobile && <Tab icon={<EventAvailableRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Events" value={2} />}
                        <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition={isMobile ? "top" : "start"} label="Photos" value={3} />
                    </Tabs>

                    {/* ─── Tab Content ─── */}
                    <Box
                        sx={{
                            px: 2,
                            py: 1.75,
                        }}
                    >
                        {/* ABOUT TAB */}
                        {activeTab === 0 && (
                            <Box>
                                {/* About / Bio */}
                                {bio ? (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 0.5 }}>About</Typography>
                                        <Box sx={{ position: "relative" }}>
                                            <Box
                                                sx={{
                                                    maxHeight: descExpanded ? "none" : DESC_MAX_HEIGHT,
                                                    overflowY: descExpanded ? "visible" : "hidden",
                                                    position: "relative",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.86rem",
                                                        lineHeight: 1.65,
                                                        color: "text.primary",
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {bio}
                                                </Typography>
                                            </Box>
                                            {/* Gradient fade overlay */}
                                            {!descExpanded && bio.length > 200 && (
                                                <Box
                                                    sx={(t) => ({
                                                        position: "absolute",
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 64,
                                                        background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                                        pointerEvents: "none",
                                                    })}
                                                />
                                            )}
                                            {/* Show more / Show less */}
                                            {bio.length > 200 && (
                                                <Button
                                                    size="small"
                                                    onClick={() => setDescExpanded((prev) => !prev)}
                                                    sx={{
                                                        mt: descExpanded ? 0.5 : -0.25,
                                                        position: "relative",
                                                        zIndex: 2,
                                                        textTransform: "none",
                                                        fontWeight: 850,
                                                        fontSize: "0.78rem",
                                                        px: 0,
                                                        minWidth: 0,
                                                        color: "primary.main",
                                                        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                                    }}
                                                >
                                                    {descExpanded ? "Show less" : "Show more"}
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography color="text.secondary" sx={{ fontSize: "0.85rem", fontStyle: "italic" }}>
                                            No description provided.
                                        </Typography>
                                    </Box>
                                )}

                                {/* Quick Facts: Founding Year + Hometown */}
                                {(foundingYear || hometown) && (
                                    <Box sx={{ mb: 2 }}>
                                        <Stack spacing={0.5}>
                                            {foundingYear && (
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.secondary" }}>
                                                        Est. {foundingYear}
                                                    </Typography>
                                                </Stack>
                                            )}
                                            {hometown && (
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <HomeRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.secondary" }}>
                                                        From {hometown}
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Highlight Sections */}
                                {artistHighlightSections.length > 0 && artistHighlightSections.map((sec, hlIdx) => (
                                    <Box key={hlIdx} sx={{ mb: 1.5 }}>
                                        <Box
                                            sx={(t) => ({
                                                borderRadius: 2.5,
                                                overflow: "hidden",
                                                bgcolor: alpha(t.palette.primary.main, 0.03),
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.primary.main, 0.15),
                                            })}
                                        >
                                            {sec.title && (
                                                <Box
                                                    sx={(t) => ({
                                                        px: 1.5,
                                                        py: 0.65,
                                                        bgcolor: alpha(t.palette.primary.main, 0.07),
                                                        borderBottom: "1px solid",
                                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.75,
                                                    })}
                                                >
                                                    <HlDetailIcon name={sec.icon} sx={{ fontSize: 15, color: "primary.main" }} />
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            fontSize: 11,
                                                            color: "primary.dark",
                                                            letterSpacing: "0.04em",
                                                            textTransform: "uppercase",
                                                        }}
                                                    >
                                                        {sec.title}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {(sec.photoUrl || sec.body) && (
                                                <Box>
                                                    {sec.photoUrl && (
                                                        <Box
                                                            component="img"
                                                            src={sec.photoUrl}
                                                            alt={sec.title || "Highlight"}
                                                            referrerPolicy="no-referrer"
                                                            sx={{
                                                                width: "100%",
                                                                height: "auto",
                                                                maxHeight: 319,
                                                                objectFit: "cover",
                                                                display: "block",
                                                            }}
                                                        />
                                                    )}
                                                    {sec.body && (
                                                        <Box sx={{ px: 1.5, py: 1.25 }}>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: 12,
                                                                    lineHeight: 1.55,
                                                                    color: "text.secondary",
                                                                    fontWeight: 500,
                                                                    whiteSpace: "pre-line",
                                                                }}
                                                            >
                                                                {sec.body}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                ))}

                            </Box>
                        )}

                        {/* POSTS TAB — desktop only (mobile uses Activity dialog) */}
                        {activeTab === 1 && !isMobile && (
                            <Box>
                                {postsLoading ? (
                                    <Stack spacing={0} divider={<Divider />}>
                                        {[0, 1, 2].map((i) => (
                                            <Box key={i} sx={{ px: 1.5, py: 1.5 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                    <Skeleton variant="circular" width={34} height={34} animation="wave" />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Skeleton width="40%" height={14} animation="wave" />
                                                        <Skeleton width="25%" height={12} animation="wave" sx={{ mt: 0.25 }} />
                                                    </Box>
                                                </Stack>
                                                <Box sx={{ display: "flex", gap: 1.5 }}>
                                                    <Skeleton variant="rounded" width={110} height={110} sx={{ borderRadius: "10px", flexShrink: 0 }} animation="wave" />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Skeleton width="80%" height={16} animation="wave" />
                                                        <Skeleton width="100%" height={12} animation="wave" sx={{ mt: 0.5 }} />
                                                        <Skeleton width="60%" height={12} animation="wave" sx={{ mt: 0.25 }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : posts.length > 0 ? (
                                    <Stack spacing={0} divider={<Divider />}>
                                        {posts.map((post) => {
                                            const isPinned = Boolean(post.isPinned || post.is_pinned);
                                            const artistName = String(artist?.name || "").trim() || "Artist";
                                            const artistAvatarSrc = artist?.avatar_url || artist?.avatarUrl || artist?.profilePicture || "";
                                            const artistHandleStr = artist?.handle || "";
                                            const body = String(post.body || post.content || "");
                                            const BODY_LIMIT = 180;
                                            const truncatedBody = body.length > BODY_LIMIT ? `${body.slice(0, BODY_LIMIT).trimEnd()}…` : body;

                                            let photos = [];
                                            if (post.mediaUrl) {
                                                try {
                                                    const parsed = JSON.parse(post.mediaUrl);
                                                    photos = Array.isArray(parsed) ? parsed : [post.mediaUrl];
                                                } catch {
                                                    photos = [post.mediaUrl];
                                                }
                                            }
                                            photos = photos.filter((u) => u && typeof u === "string");
                                            const mainPhoto = photos[0] || "";
                                            const showImage = Boolean(mainPhoto);

                                            return (
                                                <Box
                                                    key={post.post_id || post.id}
                                                    sx={{
                                                        py: 1.5,
                                                        px: 1.5,
                                                        cursor: "pointer",
                                                        transition: "background-color 0.15s",
                                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) },
                                                    }}
                                                >
                                                    {/* Header row */}
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                                        <Avatar
                                                            src={artistAvatarSrc || undefined}
                                                            sx={(t) => ({
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                color: t.palette.primary.main,
                                                                border: "2px solid",
                                                                borderColor: alpha(t.palette.text.primary, 0.06),
                                                                "& .MuiAvatar-img": {
                                                                    objectFit: "cover",
                                                                    transform: "scale(1.15)",
                                                                },
                                                            })}
                                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                                        >
                                                            <ArtistDefaultIcon sx={{ fontSize: 20 }} />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.3 }} noWrap>
                                                                    {artistName}
                                                                </Typography>
                                                                {artistHandleStr && (
                                                                    <Typography noWrap sx={{ fontSize: "0.68rem", color: "text.secondary", lineHeight: 1.3 }}>@{artistHandleStr}</Typography>
                                                                )}
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", lineHeight: 1.2, mt: 0.1, display: "block" }}>
                                                                {formatRelativeTime(post.createdAt || post.created_at || post.publishedAt || post.published_at)}
                                                                {(post.isEdited || post.is_edited) && (
                                                                    <Typography component="span" sx={{ color: "text.secondary", ml: 0.5, fontStyle: "italic", fontSize: "0.68rem" }}>
                                                                        (Edited)
                                                                    </Typography>
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                        {isPinned && (
                                                            <Chip
                                                                icon={<PushPinRoundedIcon sx={{ fontSize: 10, transform: "rotate(45deg)" }} />}
                                                                label="Pinned"
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: "0.6rem",
                                                                    height: 20,
                                                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                                                    border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                                                    color: "warning.dark",
                                                                    "& .MuiChip-icon": { color: "warning.dark" },
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>

                                                    {/* Content area (clickable — opens inline detail) */}
                                                    <Box
                                                        onClick={() => { setSelectedPostId(String(post.post_id || post.id)); scrollToTop(); }}
                                                        sx={{ display: "flex", gap: showImage ? 1.5 : 0, mb: 0.5 }}
                                                    >
                                                        {/* Photo thumbnail */}
                                                        {showImage && (
                                                            <Box sx={{ position: "relative", flexShrink: 0, width: { xs: 100, sm: 110 }, height: { xs: 100, sm: 110 } }}>
                                                                <Box
                                                                    component="img"
                                                                    src={mainPhoto}
                                                                    loading="lazy"
                                                                    sx={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        objectFit: "cover",
                                                                        borderRadius: "10px",
                                                                        border: "1px solid",
                                                                        borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                                                        boxShadow: (t) => `0 1px 4px ${alpha(t.palette.text.primary, 0.06)}`,
                                                                        display: "block",
                                                                    }}
                                                                    alt=""
                                                                />
                                                                {photos.length > 1 && (
                                                                    <Box
                                                                        sx={{
                                                                            position: "absolute",
                                                                            left: "50%",
                                                                            bottom: 5,
                                                                            transform: "translateX(-50%)",
                                                                            px: 0.8,
                                                                            py: 0.15,
                                                                            borderRadius: 999,
                                                                            bgcolor: (t) => alpha(t.palette.text.primary, 0.7),
                                                                            backdropFilter: "blur(4px)",
                                                                            fontSize: "0.65rem",
                                                                            fontWeight: 700,
                                                                            color: "common.white",
                                                                            lineHeight: 1.2,
                                                                            whiteSpace: "nowrap",
                                                                            userSelect: "none",
                                                                        }}
                                                                    >
                                                                        +{photos.length - 1} more
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* Text content */}
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            {post.title && (
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: "0.92rem",
                                                                        fontWeight: 700,
                                                                        lineHeight: 1.3,
                                                                        wordBreak: "break-word",
                                                                        mb: 0.5,
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: "vertical",
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    {post.title}
                                                                </Typography>
                                                            )}
                                                            {body && (
                                                                <Typography
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        fontSize: "0.8rem",
                                                                        lineHeight: 1.5,
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: showImage ? 3 : 4,
                                                                        WebkitBoxOrient: "vertical",
                                                                        overflow: "hidden",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    {truncatedBody}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>

                                                    {/* Action bar */}
                                                    <Box sx={{ pt: 0.5 }}>
                                                        <ActionBar
                                                            user={user}
                                                            postId={post.post_id || post.id}
                                                            post={{ ...post, artist_id: artist?.id }}
                                                            initialLikes={post.likeCount || post.like_count || 0}
                                                            initiallyLiked={post.viewerLiked || post.viewer_liked}
                                                            commentsCount={post.commentCount || post.comment_count || 0}
                                                            initialReposts={post.repostCount || post.repost_count || 0}
                                                            initiallyReposted={post.viewerReposted || post.viewer_reposted}
                                                            showBoost={false}
                                                            onComment={() => { setSelectedPostId(String(post.post_id || post.id)); scrollToTop(); }}
                                                            onShare={() => {
                                                                setSharePost({
                                                                    ...post,
                                                                    shareUrl: `${window.location.origin}/${artistHandleStr}/posts/${post.post_id || post.id}`,
                                                                    authorName: artistName,
                                                                    authorAvatar: artistAvatarSrc,
                                                                    photos: JSON.stringify(photos),
                                                                    photo_url: mainPhoto || null,
                                                                    image_url: mainPhoto || null,
                                                                    main_photo_url: mainPhoto || null,
                                                                });
                                                                setShareOpen(true);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })}

                                        {/* Loading more skeletons */}
                                        {postsLoadingMore && (
                                            <>
                                                {[0, 1, 2].map((i) => (
                                                    <Box key={`lm-${i}`} sx={{ px: 1.5, py: 1.5 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                            <Skeleton variant="circular" width={34} height={34} animation="wave" />
                                                            <Box sx={{ flex: 1 }}>
                                                                <Skeleton width="40%" height={14} animation="wave" />
                                                                <Skeleton width="25%" height={12} animation="wave" sx={{ mt: 0.25 }} />
                                                            </Box>
                                                        </Stack>
                                                        <Box sx={{ display: "flex", gap: 1.5 }}>
                                                            <Skeleton variant="rounded" width={110} height={110} sx={{ borderRadius: "10px", flexShrink: 0 }} animation="wave" />
                                                            <Box sx={{ flex: 1 }}>
                                                                <Skeleton width="80%" height={16} animation="wave" />
                                                                <Skeleton width="100%" height={12} animation="wave" sx={{ mt: 0.5 }} />
                                                                <Skeleton width="60%" height={12} animation="wave" sx={{ mt: 0.25 }} />
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </>
                                        )}

                                        {/* Infinite scroll sentinel */}
                                        {postsHasMore && !postsLoadingMore && (
                                            <Box ref={postsLoadMoreRef} sx={{ height: 1 }} />
                                        )}
                                    </Stack>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 1,
                                            py: 6,
                                        }}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                width: 56,
                                                height: 56,
                                                borderRadius: 3,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.primary.main, 0.10),
                                                mb: 0.5,
                                            })}
                                        >
                                            <ArticleRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                        </Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                                            No posts yet
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 260 }}>
                                            Posts and updates will appear here once this artist starts sharing.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* EVENTS TAB */}
                        {activeTab === 2 && (
                            <Box>
                                {eventsLoading ? (
                                    <Stack spacing={1.25}>
                                        {[0, 1, 2].map((i) => (
                                            <Box key={i} sx={{ p: 1.5 }}>
                                                <Skeleton variant="rounded" width="100%" height={80} sx={{ borderRadius: 2.5 }} animation="wave" />
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : artistEvents.length > 0 ? (
                                    <Stack spacing={0} divider={<Divider />}>
                                        {artistEvents.map((evt) => {
                                            const evtTitle = evt?.title || "Untitled Event";
                                            const evtDate = formatEventDateTimeCT(evt);
                                            const evtLocation = formatEventLocation(evt);
                                            const evtCategory = getEventCategoryLabel(evt);
                                            const evtPhoto = evt?.mainPhotoUrl || evt?.coverPhoto || "";

                                            return (
                                                <Box
                                                    key={evt.id}
                                                    onClick={() => { setSelectedEventId(String(evt.id)); scrollToTop(); }}
                                                    sx={{
                                                        py: 1.5,
                                                        px: 1.5,
                                                        cursor: "pointer",
                                                        transition: "background-color 0.15s",
                                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) },
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", gap: 1.5 }}>
                                                        {/* Event thumbnail */}
                                                        <Box
                                                            sx={(t) => ({
                                                                width: 72,
                                                                height: 72,
                                                                borderRadius: 2,
                                                                flexShrink: 0,
                                                                overflow: "hidden",
                                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                border: "1px solid",
                                                                borderColor: alpha(t.palette.primary.main, 0.10),
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            })}
                                                        >
                                                            {evtPhoto ? (
                                                                <Box
                                                                    component="img"
                                                                    src={evtPhoto}
                                                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                    onError={(e) => { e.target.style.display = "none"; }}
                                                                />
                                                            ) : (
                                                                <CalendarTodayRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                                            )}
                                                        </Box>

                                                        {/* Event info */}
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {evtTitle}
                                                            </Typography>
                                                            {evtDate && (
                                                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25, fontWeight: 600 }}>
                                                                    {evtDate}
                                                                </Typography>
                                                            )}
                                                            {evtLocation && (
                                                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.15 }}>
                                                                    {evtLocation}
                                                                </Typography>
                                                            )}
                                                            {evtCategory && (
                                                                <Chip
                                                                    label={evtCategory}
                                                                    size="small"
                                                                    sx={(t) => ({
                                                                        mt: 0.5,
                                                                        height: 20,
                                                                        fontWeight: 700,
                                                                        fontSize: "0.65rem",
                                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                        color: t.palette.primary.main,
                                                                        border: "1px solid",
                                                                        borderColor: alpha(t.palette.primary.main, 0.16),
                                                                    })}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                ) : (
                                    <Box sx={{ textAlign: "center", py: 6, px: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                        <Box
                                            sx={(t) => ({
                                                width: 56,
                                                height: 56,
                                                borderRadius: 3,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.primary.main, 0.10),
                                                mb: 0.5,
                                            })}
                                        >
                                            <EventAvailableRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                        </Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>No events yet</Typography>
                                        <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 260 }}>
                                            This artist hasn't created any events.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* PHOTOS TAB */}
                        {activeTab === 3 && (
                            <PhotoGallery photos={galleryPhotos} onPhotoClick={openGalleryPhotoComments} />
                        )}
                    </Box>
                </Box>
            )}

            <SharePostDialog
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                viewer={user}
                post={sharePost}
            />

            <ShareDialog
                contentType="artist"
                open={profileShareOpen}
                onClose={() => setProfileShareOpen(false)}
                artist={artist}
                viewer={user}
            />

            {/* Quick Message Dialog for Artist */}
            <ArtistQuickMessageDialog
                open={quickMsgOpen}
                onClose={() => setQuickMsgOpen(false)}
                onSent={() => { setQuickMsgOpen(false); }}
                recipient={{
                    type: "artist",
                    id: artist?.id,
                    name: artist?.name || artist?.handle || "Artist",
                    avatar_url: artist?.avatar_url || artist?.avatarUrl || null,
                }}
            />

            <SmartMenu
                anchorEl={artistMenuEl}
                open={artistMenuOpen}
                onClose={() => setArtistMenuEl(null)}
                onClick={(e) => e.stopPropagation()}
                disableScrollLock
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
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

            <ReportContentDialog
                open={artistReportOpen}
                onClose={() => setArtistReportOpen(false)}
                onSubmit={submitArtistReport}
                title="Report artist"
            />

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

            {/* ── Artist Followers / Following Dialog ── */}
            <ArtistFollowsDialog
                open={followsDialogOpen}
                onClose={() => setFollowsDialogOpen(false)}
                artistId={artist?.id}
                artistName={safeArtist.name || "Artist"}
                initialTab={followsDialogTab}
                viewerUserId={user?.id}
                acctHeaders={typeof getAcctHdrs === 'function' ? getAcctHdrs() : {}}
            />

            {/* ═══ Photo Comments Dialog ═══ */}
            <PhotoCommentsDialog
                open={photoCommentsOpen}
                onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsType('avatar'); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(''); }}
                profileHandleOrId={safeArtist.handle || artist?.id}
                viewerId={user?.id}
                isOwner={canManage}
                photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                photoId={photoCommentsPhotoId}
                photoUrl={photoCommentsPhotoUrl}
                apiPrefix="/api/music/artists"
                allPhotos={photoCommentsType === 'gallery' ? (artistGalleryLoaded && artistGalleryPhotos.length > 0 ? artistGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0)) : undefined) : undefined}
                onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                    setPhotoCommentsPhotoId(newPhotoId);
                    setPhotoCommentsPhotoUrl(newPhotoUrl || '');
                } : undefined}
            />

            {/* ═══ Mobile Activity fullscreen dialog ═══ */}
            {isMobile && (
                <Dialog
                    open={activityOpen}
                    fullScreen
                    onClose={() => { setActivityOpen(false); setActiveTab(0); setActivitySelectedPost(null); setActivitySelectedEvent(null); }}
                    PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 0, overflowY: 'auto', overflowX: 'hidden', display: 'block' } }}
                    TransitionProps={{ unmountOnExit: true }}
                    disableScrollLock
                >
                    <ArtistEngagementTabs
                        artist={safeArtist}
                        user={user}
                        posts={posts}
                        postsLoading={postsLoading}
                        mobileFullscreen
                        stickyTabs
                        hasEvents={artistEvents.length > 0}
                        eventsCount={eventsTotal}
                        hasJobs={artistHasJobs}
                        hasServices={artistHasServices}
                        onPostClick={(post) => {
                            setActivityScrollCommentId(null);
                            setActivityHighlightCommentId(null);
                            const p = post ? { ...post, id: post.id || post.post_id || post.postId } : null;
                            setActivitySelectedPost(p);
                        }}
                        onCommentClick={(post, commentId) => {
                            if (!post) return;
                            const pid = post.id || post.post_id || post.postId;
                            if (!pid) return;
                            setActivityScrollCommentId(commentId);
                            setActivityHighlightCommentId(commentId);
                            setActivitySelectedPost({ ...post, id: pid });
                        }}
                        onEventClick={(evt) => {
                            if (!evt) return;
                            setActivitySelectedEvent(evt);
                        }}
                        activityBarContent={
                            <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, minHeight: 48 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton size="small" onClick={() => { setActivityOpen(false); setActiveTab(0); setActivitySelectedPost(null); setActivitySelectedEvent(null); }} sx={{ color: 'text.primary' }}>
                                        <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                                    </IconButton>
                                    <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Activity</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.75} onClick={() => { setActivityOpen(false); setActiveTab(0); }} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }}>{name}</Typography>
                                        {handle && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1, display: 'block' }}>{handle}</Typography>}
                                    </Box>
                                    <Avatar src={resolvedAvatarSrc || undefined} alt={name} imgProps={{ referrerPolicy: 'no-referrer' }} sx={(t) => ({ width: 32, height: 32, border: '1px solid', borderColor: 'divider', ...(!resolvedAvatarSrc ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}) })}>
                                        <ArtistDefaultIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                </Stack>
                            </Box>
                        }
                    />

                    {/* Detail panel — slides in from the right for post detail */}
                    <DetailPanel
                        open={Boolean(activitySelectedPost)}
                        onClose={() => { setActivitySelectedPost(null); setActivityScrollCommentId(null); setActivityHighlightCommentId(null); }}
                        title="Post"
                    >
                        {activitySelectedPost && (
                            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                <MusicPostDetailPanel
                                    key={`act-${activitySelectedPost?.id}`}
                                    post={activitySelectedPost}
                                    user={user}
                                    onViewPost={() => {}}
                                    onLocationClick={() => {}}
                                    scrollToCommentId={activityScrollCommentId}
                                    highlightCommentId={activityHighlightCommentId}
                                />
                            </Box>
                        )}
                    </DetailPanel>

                    {/* Detail panel — slides in from the right for event detail */}
                    <DetailPanel
                        open={Boolean(activitySelectedEvent)}
                        onClose={() => setActivitySelectedEvent(null)}
                        title="Event"
                    >
                        {activitySelectedEvent && (
                            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                <EventDetailPanel
                                    key={`evt-${activitySelectedEvent?.id}`}
                                    event={activitySelectedEvent}
                                    user={user}
                                    onClearSelection={() => setActivitySelectedEvent(null)}
                                    onClose={() => setActivitySelectedEvent(null)}
                                />
                            </Box>
                        )}
                    </DetailPanel>
                </Dialog>
            )}
        </Box>
    );
}

/* ─── Artist Quick Message Rate-Limit Tracker (client-side, per-recipient, 5 msgs / 10 min) ─── */
const _artistPanelMsgTracker = new Map();
const _ARTIST_PANEL_MSG_WINDOW = 10 * 60 * 1000;
const _ARTIST_PANEL_MSG_MAX = 5;

function _trackArtistPanelMsg(recipientId) {
    const now = Date.now();
    const key = String(recipientId);
    const entries = (_artistPanelMsgTracker.get(key) || []).filter(t => now - t < _ARTIST_PANEL_MSG_WINDOW);
    entries.push(now);
    _artistPanelMsgTracker.set(key, entries);
}

function _isArtistPanelLimited(recipientId) {
    const now = Date.now();
    const key = String(recipientId);
    const entries = (_artistPanelMsgTracker.get(key) || []).filter(t => now - t < _ARTIST_PANEL_MSG_WINDOW);
    return entries.length >= _ARTIST_PANEL_MSG_MAX;
}

/* ─── Reusable Quick Message Dialog for Artists ─── */
function ArtistQuickMessageDialog({ open, onClose, onSent, recipient }) {
    const [body, setBody] = useState("");
    const [photos, setPhotos] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [success, setSuccess] = useState(false);

    // Artist sub-type for the recipient — musicians get a music-note, visual
    // artists get a palette. Derived locally from the recipient since this
    // dialog is a standalone component and doesn't share scope with the
    // outer ArtistDetailPanel.
    const recipientProfileType = String(
        recipient?.profile_type || recipient?.profileType || "music"
    ).toLowerCase();
    const recipientIsVisualArtist = recipientProfileType === "artist";
    const RecipientDefaultIcon = recipientIsVisualArtist ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    const recipientTypeLabel = recipientIsVisualArtist ? "Visual Artist" : "Music Artist";

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setBody("");
                setPhotos([]);
                setError("");
                setCooldown(0);
                setSuccess(false);
            }, 200);
            return () => clearTimeout(timer);
        }
        // Check limit when opening
        if (open && recipient?.id && _isArtistPanelLimited(recipient.id)) {
            setLimitReached(true);
        }
    }, [open, recipient?.id]);

    const handleSend = async () => {
        if (!recipient?.id || (!body.trim() && photos.length === 0) || cooldown > 0) return;
        if (_isArtistPanelLimited(recipient.id)) { setLimitReached(true); return; }
        setSending(true);
        setError("");
        try {
            // Upload photos
            const photoPayload = [];
            for (const p of photos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "music/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }

            const hdrs = getAccountHeaders();
            await axios.post("/api/messages/send", {
                recipient_type: "artist",
                recipient_id: recipient.id,
                body: body.trim(),
                photos: photoPayload,
            }, { withCredentials: true, headers: { ...hdrs } });
            _trackArtistPanelMsg(recipient.id);
            photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setPhotos([]);
            setSuccess(true);
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setCooldown(wait);
                const timer = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setError(""); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                const msg = data?.message || err?.message || "Failed to send message.";
                setError(msg);
            }
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        if (sending) return;
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setPhotos([]);
        onClose();
    };

    return (
        <>
            <Dialog open={open && !limitReached} onClose={handleClose} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Contact Artist</Typography>
                    <IconButton aria-label="Close" onClick={handleClose} disabled={sending} sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {success ? (
                        <Stack spacing={2} sx={{ py: 2 }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The artist will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { onSent(); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                Done
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {/* Locked recipient */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar
                                            src={recipient?.avatar_url || undefined}
                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                            sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main", width: 24, height: 24 }}
                                        >
                                            <RecipientDefaultIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                    }
                                    label={recipient?.name || "Artist"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            {/* Artist context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{recipient?.name || "Artist"}</Typography>
                                <Typography variant="caption" color="text.secondary">{recipientTypeLabel}</Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Describe what you need, timeline, budget, etc."
                                multiline
                                minRows={5}
                                maxRows={10}
                                value={body}
                                onChange={(e) => { setBody(e.target.value.slice(0, 2000)); if (error) setError(""); }}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                error={Boolean(error)}
                                helperText={error || `${body.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: error ? "left" : "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }}
                            />
                            {/* Photos */}
                            <PhotosUploadSection photos={photos} setPhotos={setPhotos} disabled={sending}
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need."
                                                 addButtonText="Add photos" />
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="outlined" onClick={handleClose} disabled={sending}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleSend} disabled={(!body.trim() && photos.length === 0) || sending || cooldown > 0}
                                        startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <ChatBubbleOutlineRoundedIcon />}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                    {cooldown > 0 ? `Wait ${cooldown}s` : sending ? "Sending\u2026" : "Send Message"}
                                </Button>
                            </Stack>
                            {sending && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rate limit reached dialog */}
            <Dialog open={limitReached} onClose={() => { setLimitReached(false); onClose(); }} maxWidth="xs" fullWidth
                    disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this artist recently. Give them a chance to respond before sending more.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => { setLimitReached(false); onClose(); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/* ─── Artist Followers / Following Dialog (matches FollowsSection popup) ─── */
function ArtistFollowsDialog({ open, onClose, artistId, artistName, initialTab, viewerUserId, acctHeaders }) {
    const navigate = useNavigate();
    const [tab, setTab] = useState(initialTab || 0);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");
    const dialogScrollRef = useRef(null);

    useEffect(() => {
        if (open) setTab(initialTab || 0);
    }, [open, initialTab]);

    // Reset search when switching tabs
    useEffect(() => {
        if (!open) return;
        setSearchText("");
        setAppliedQuery("");
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    }, [tab, open]);

    useEffect(() => {
        if (!open || !artistId || !viewerUserId) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await secureFetch(
                    `${FOLLOW_API_BASE}/follows/social/${viewerUserId}?account_type=artist&account_id=${artistId}`,
                    { credentials: "include", headers: { Accept: "application/json", ...(acctHeaders || {}) } }
                );
                if (cancelled) return;
                if (!res.ok) { setLoading(false); return; }
                const data = await res.json();
                setFollowers(Array.isArray(data?.followers) ? data.followers : []);
                setFollowing(Array.isArray(data?.following) ? data.following : []);
            } catch {
                if (!cancelled) { setFollowers([]); setFollowing([]); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, artistId, viewerUserId, acctHeaders]);

    const handleClose = () => { setSearchText(""); setAppliedQuery(""); onClose(); };

    const handleApplySearch = () => {
        setAppliedQuery(searchText);
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    };
    const handleClearSearch = () => {
        setSearchText("");
        setAppliedQuery("");
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    };

    const list = tab === 0 ? followers : following;
    const normalizedQuery = appliedQuery.trim().toLowerCase();
    const filtered = normalizedQuery
        ? list.filter((u) => {
            const n = String(u.name || `${u.first_name || ""} ${u.last_name || ""}`).toLowerCase();
            const h = String(u.handle || "").toLowerCase();
            const d = String(u.display_name || "").toLowerCase();
            return n.includes(normalizedQuery) || h.includes(normalizedQuery) || d.includes(normalizedQuery);
        })
        : list;

    // Sort alphabetically
    const sorted = filtered.slice().sort((a, b) => {
        const norm = (s) => String(s || "").toLowerCase().trim();
        const aKey = norm(a.last_name || a.first_name) ? `${norm(a.last_name)} ${norm(a.first_name)}`.trim() : (norm(a.display_name || a.name || a.handle));
        const bKey = norm(b.last_name || b.first_name) ? `${norm(b.last_name)} ${norm(b.first_name)}`.trim() : (norm(b.display_name || b.name || b.handle));
        return aKey.localeCompare(bKey, undefined, { sensitivity: "base" });
    });

    const handleUserClick = (u) => {
        if (!u) return;
        const slug = u.handle || u.id;
        navigate(`/${slug}`);
        handleClose();
    };

    const getAcctBadge = (u) => {
        const acctType = String(u?.account_type || "").toLowerCase();
        if (acctType === "artist") {
            // Branch artist badge on each user's own profile_type so
            // visual-artist followers show the Palette icon and musicians
            // show the Music Note icon.
            const pt = String(u?.profile_type || u?.profileType || "music").toLowerCase();
            const isVA = pt === "artist";
            return {
                label: isVA ? "Visual Artist" : "Artist",
                Icon: isVA ? PaletteRoundedIcon : MusicNoteRoundedIcon,
                color: "info.main",
            };
        }
        if (acctType === "business") return { label: "Business", Icon: StorefrontRoundedIcon, color: "secondary.main" };
        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: (t) => ({
                    width: 980,
                    maxWidth: "96vw",
                    height: { xs: "92vh", sm: "90vh", md: "88vh" },
                    maxHeight: "92vh",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    border: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                    boxShadow: `0 24px 80px ${alpha(t.palette.primary.main, 0.25)}`,
                }),
            }}
        >
            <DialogTitle
                sx={(t) => ({
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    py: 1.5,
                    px: { xs: 1.5, sm: 2.5 },
                    borderBottom: 1,
                    borderColor: alpha(t.palette.primary.main, 0.1),
                    bgcolor: "background.paper",
                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.03)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                })}
            >
                <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                    {artistName}
                </Typography>
                <IconButton
                    aria-label="Close"
                    onClick={handleClose}
                    size="small"
                    sx={(t) => ({
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.15) },
                    })}
                >
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100% - 56px)", overflow: "hidden" }}>
                {/* Tabs + search */}
                <Box sx={{ flexShrink: 0 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={(t) => ({
                            borderBottom: 1,
                            borderColor: alpha(t.palette.text.primary, 0.1),
                            px: { xs: 1, sm: 2 },
                            "& .MuiTabs-indicator": { backgroundColor: t.palette.text.primary, height: 3, borderRadius: "3px 3px 0 0" },
                        })}
                    >
                        <Tab label={`Followers (${followers.length})`} sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem", minHeight: 40 }} />
                        <Tab label={`Following (${following.length})`} sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem", minHeight: 40 }} />
                    </Tabs>

                    {/* Search bar */}
                    <Box sx={(t) => ({ p: { xs: 1.25, sm: 2 }, borderBottom: 1, borderColor: alpha(t.palette.primary.main, 0.08), bgcolor: alpha(t.palette.primary.main, 0.02) })}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name or username…"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleApplySearch(); }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={(t) => ({ color: alpha(t.palette.primary.main, 0.5) })} /></InputAdornment>,
                                    endAdornment: searchText ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchText("")} sx={{ p: 0.25 }}><ClearRoundedIcon fontSize="small" /></IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                                sx={(t) => ({
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "background.paper", borderRadius: 2,
                                        "& fieldset": { borderColor: alpha(t.palette.primary.main, 0.2) },
                                        "&:hover fieldset": { borderColor: alpha(t.palette.primary.main, 0.4) },
                                        "&.Mui-focused fieldset": { borderColor: "primary.main" },
                                    },
                                })}
                            />
                            <Button variant="contained" onClick={handleApplySearch} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "primary.main", borderRadius: 2, px: 2.5, "&:hover": { bgcolor: "primary.light" } }}>
                                Search
                            </Button>
                            <Button onClick={handleClearSearch} disabled={!appliedQuery} sx={{ textTransform: "none", fontWeight: 600, color: "primary.main" }}>
                                Clear
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Scrollable list */}
                <Box
                    ref={dialogScrollRef}
                    sx={(t) => ({
                        flex: "1 1 auto", minHeight: 0, overflowY: "auto",
                        px: { xs: 1.25, sm: 2 }, pb: 2, pt: 1.5,
                        bgcolor: alpha(t.palette.primary.main, 0.015),
                    })}
                >
                    {loading ? (
                        <Stack spacing={1.5} sx={{ px: 2, pt: 1 }}>
                            {[0, 1, 2, 3].map((i) => (
                                <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                                    <Skeleton variant="rounded" width={72} height={72} sx={{ borderRadius: 2 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton width="60%" height={16} />
                                        <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    ) : list.length === 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 2 }}>
                            <Box sx={(t) => ({ width: 72, height: 72, borderRadius: "50%", bgcolor: alpha(t.palette.primary.main, 0.08), display: "flex", alignItems: "center", justifyContent: "center" })}>
                                {tab === 0 ? <PeopleAltRoundedIcon sx={{ fontSize: 36, color: "primary.main" }} /> : <PersonAddRoundedIcon sx={{ fontSize: 36, color: "primary.main" }} />}
                            </Box>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "text.primary", mb: 0.5 }}>
                                    {tab === 0 ? "No followers yet" : "Not following anyone"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                                    {tab === 0 ? "When people follow this artist, they'll show up here." : "Accounts that this artist follows will appear here."}
                                </Typography>
                            </Box>
                        </Box>
                    ) : normalizedQuery && filtered.length === 0 ? (
                        <Typography sx={{ p: 2 }} color="text.secondary">No results.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                            {sorted.map((u) => {
                                const displayName = u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown";
                                const handleStr = u.handle ? `@${u.handle}` : "";
                                const avatarUrl = u.avatar_url || defaultAvatar;
                                const isVerified = Boolean(u.is_verified);
                                const badge = getAcctBadge(u);
                                const hasRealAvatar = Boolean(avatarUrl && avatarUrl !== "null" && !avatarUrl.includes("default_avatar"));
                                const acctType = String(u.account_type || "").toLowerCase();

                                return (
                                    <Box
                                        key={`${u.account_type || "p"}-${u.id}`}
                                        onClick={() => handleUserClick(u)}
                                        sx={(t) => ({
                                            display: "grid",
                                            gridTemplateColumns: "auto 1fr",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 2.5,
                                            bgcolor: "background.paper",
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.primary.main, 0.12),
                                            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.05)}`,
                                            cursor: "pointer",
                                            transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                                            "&:hover": {
                                                boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}`,
                                                borderColor: alpha(t.palette.primary.main, 0.3),
                                            },
                                        })}
                                    >
                                        <Avatar
                                            src={hasRealAvatar ? avatarUrl : undefined}
                                            variant="rounded"
                                            sx={(t) => ({
                                                width: { xs: 72, sm: 80 },
                                                height: { xs: 72, sm: 80 },
                                                borderRadius: 2,
                                                border: `2px solid ${alpha(t.palette.primary.main, 0.1)}`,
                                                bgcolor: acctType === "artist" ? alpha(t.palette.primary.main, 0.06) : alpha(t.palette.text.primary, 0.04),
                                                color: acctType === "artist" ? t.palette.primary.main : t.palette.text.secondary,
                                            })}
                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                        >
                                            {acctType === "artist"
                                                ? (String(u?.profile_type || u?.profileType || "music").toLowerCase() === "artist"
                                                    ? <PaletteRoundedIcon sx={{ fontSize: 36 }} />
                                                    : <MusicNoteRoundedIcon sx={{ fontSize: 36 }} />)
                                                : acctType === "business"
                                                    ? <StorefrontRoundedIcon sx={{ fontSize: 36 }} />
                                                    : <PeopleAltRoundedIcon sx={{ fontSize: 36 }} />}
                                        </Avatar>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Typography
                                                    noWrap
                                                    title={displayName}
                                                    sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "primary.main", fontSize: "0.85rem" }}
                                                >
                                                    {displayName}
                                                </Typography>
                                                {isVerified && <VerifiedRoundedIcon sx={{ fontSize: 14, color: "primary.main", flexShrink: 0 }} />}
                                            </Box>
                                            {handleStr && (
                                                <Typography noWrap sx={(t) => ({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: alpha(t.palette.primary.main, 0.6), fontSize: "0.75rem" })}>
                                                    {handleStr}
                                                </Typography>
                                            )}
                                            {(u.city || u.county) && (
                                                <Typography sx={{ color: "text.disabled", fontSize: "0.7rem", mt: 0.15 }}>
                                                    {[u.city, u.county].filter(Boolean).join(", ")}
                                                </Typography>
                                            )}
                                            {badge ? (() => {
                                                const BadgeIcon = badge.Icon;
                                                return (
                                                    <Box sx={(t) => ({ display: "inline-flex", alignItems: "center", gap: 0.3, mt: 0.25, px: 0.6, py: 0.15, borderRadius: 1, bgcolor: alpha(t.palette[badge.color.split(".")[0]]?.main || t.palette.secondary.main, 0.12) })}>
                                                        <BadgeIcon sx={{ fontSize: 12, color: badge.color }} />
                                                        <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: badge.color, lineHeight: 1.2 }}>
                                                            {badge.label}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })() : null}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
}

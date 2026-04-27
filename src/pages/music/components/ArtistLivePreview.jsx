// src/pages/music/components/ArtistLivePreview.jsx
/**
 * ArtistLivePreview — Real-time preview of the artist profile
 * shown in the admin console's right pane.
 *
 * Mirrors the ArtistDetailPanel layout exactly:
 *   - Genre chips with icons
 *   - Social/streaming link icon buttons (right side)
 *   - Message / View Profile / Share buttons
 *   - About | Posts | Events | Photos tabs
 *   - Highlight sections in About tab
 */
import { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ShareIcon from "@mui/icons-material/Share";

import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";

// Genre icons
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import NaturePeopleRoundedIcon from "@mui/icons-material/NaturePeopleRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";

// Highlight section icons
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MicExternalOnRoundedIcon from "@mui/icons-material/MicExternalOnRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

// ── Highlight icons ──
const HL_ICONS = {
    Star: StarRoundedIcon, Favorite: FavoriteRoundedIcon, MusicNote: MusicNoteRoundedIcon,
    Album: AlbumRoundedIcon, Groups: GroupsRoundedIcon, Trophy: EmojiEventsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon, Mic: MicExternalOnRoundedIcon, Campaign: CampaignRoundedIcon,
};
function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ── Genre icon (matches ArtistDetailPanel exactly) ──
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

// ── Link helpers (matches ArtistDetailPanel exactly) ──
function getLinkIcon(key, size = 20) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return <InstagramIcon sx={{ fontSize: size }} />;
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return <XIcon sx={{ fontSize: size }} />;
    if (k.includes("youtube")) return <YouTubeIcon sx={{ fontSize: size }} />;
    if (k.includes("facebook")) return <FacebookIcon sx={{ fontSize: size }} />;
    if (k.includes("tiktok")) return <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13.1a8.16 8.16 0 005.58 2.2V11.9a4.85 4.85 0 01-3.58-1.63V6.69h3.58z" /></svg></Box>;
    if (k.includes("spotify")) return <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg></Box>;
    if (k.includes("soundcloud")) return <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.084-.1zm-.899 1.67c-.06 0-.091.037-.104.09L0 15.479l.165 1.308c.014.057.045.09.111.09.068 0 .09-.033.104-.09l.21-1.319-.21-1.334c-.014-.064-.036-.09-.104-.09zm1.83-1.62c-.074 0-.12.06-.12.135l-.21 2.07.21 2.134c0 .075.046.135.12.135.074 0 .12-.06.12-.135l.24-2.134-.24-2.07c0-.075-.046-.12-.12-.12v-.015zm.945-.57c-.09 0-.135.075-.135.15l-.193 2.19.193 2.176c0 .09.045.149.135.149.075 0 .135-.06.135-.15l.21-2.175-.21-2.19c0-.075-.06-.15-.135-.15zm1.065-.375c-.105 0-.165.09-.165.165l-.18 2.385.18 2.31c0 .095.06.18.165.18.089 0 .164-.085.164-.18l.195-2.31-.195-2.385c0-.09-.059-.165-.164-.165zm1.14-.12c-.12 0-.195.105-.195.195l-.165 2.385.165 2.37c0 .105.075.195.195.195.104 0 .18-.09.18-.195l.195-2.37-.195-2.385c0-.09-.076-.195-.18-.195zm1.155-.12c-.135 0-.225.12-.225.225l-.15 2.385.15 2.385c0 .12.09.225.225.225.119 0 .225-.105.225-.225l.165-2.385-.165-2.385c0-.105-.106-.225-.225-.225zm1.2.045c-.149 0-.254.135-.254.255l-.15 2.19.15 2.4c0 .135.105.255.254.255.135 0 .255-.12.255-.255l.15-2.4-.15-2.19c0-.12-.12-.255-.255-.255zm1.215-.09c-.165 0-.285.15-.285.285l-.135 2.13.135 2.43c0 .15.12.285.285.285.15 0 .285-.135.285-.285l.15-2.43-.15-2.13c0-.135-.135-.285-.285-.285zm1.215-.03c-.18 0-.315.165-.315.315L9.75 14.4l.12 2.43c0 .165.135.315.315.315.165 0 .315-.15.315-.315l.135-2.43-.135-2.385c0-.15-.15-.315-.315-.315zm1.23.105c-.195 0-.345.18-.345.345l-.105 2.19.105 2.445c0 .18.15.345.345.345.18 0 .345-.165.345-.345l.12-2.445-.12-2.19c0-.165-.165-.345-.345-.345zm1.245-.06c-.21 0-.375.195-.375.375l-.09 2.205.09 2.445c0 .195.165.375.375.375.195 0 .375-.18.375-.375l.105-2.445-.105-2.205c0-.18-.18-.375-.375-.375zm1.26-.015c-.225 0-.405.21-.405.405l-.075 2.175.075 2.445c0 .21.18.405.405.405.21 0 .405-.195.405-.405l.09-2.445-.09-2.175c0-.195-.195-.405-.405-.405zm1.275.06c-.24 0-.435.225-.435.435l-.06 2.085.06 2.445c0 .225.195.435.435.435.225 0 .42-.21.42-.435l.075-2.445-.075-2.085c0-.21-.195-.435-.42-.435zm1.29.09c-.255 0-.45.24-.45.465l-.045 1.965.045 2.43c0 .24.195.465.45.465.24 0 .45-.225.45-.465l.06-2.43-.06-1.965c0-.225-.21-.465-.45-.465zm1.305.255c-.27 0-.48.255-.48.495l-.03 1.665.03 2.4c0 .255.21.495.48.495.255 0 .48-.24.48-.495l.045-2.4-.045-1.665c0-.24-.225-.495-.48-.495zm1.32.465c-.285 0-.51.27-.51.525l-.015 1.155.015 2.37c0 .27.225.525.51.525.27 0 .51-.255.51-.525l.03-2.37-.03-1.155c0-.255-.24-.525-.51-.525zm1.335.6c-.3 0-.54.285-.54.54v.69l.015 2.325c0 .27.24.555.525.555.27 0 .54-.285.54-.555l.015-2.325v-.69c0-.255-.255-.54-.54-.54h-.015zm3.39-.45c-.405 0-.795.075-1.155.195-.24-2.715-2.535-4.86-5.355-4.86-.72 0-1.425.15-2.055.405-.24.12-.315.24-.315.465v9.555c0 .24.18.465.435.48h8.445c1.395 0 2.52-1.17 2.52-2.61s-1.125-2.63-2.52-2.63z" /></svg></Box>;
    if (k.includes("bandcamp")) return <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" /></svg></Box>;
    if (k.includes("apple") && k.includes("music")) return <Box component="span" sx={{ display: "flex", alignItems: "center" }}><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.237C19.103.1 18.496.04 17.89.003 17.717-.004 17.543 0 17.37 0H6.63c-.174 0-.347-.004-.521.003C5.503.04 4.896.1 4.3.237a5.023 5.023 0 00-1.875.655C1.307 1.625.561 2.624.245 3.935A9.23 9.23 0 00.003 6.124C-.003 6.297 0 6.47 0 6.643v10.714c0 .173-.003.347.003.52a9.23 9.23 0 00.242 2.19c.316 1.31 1.062 2.31 2.18 3.042.568.38 1.196.645 1.874.655.607.138 1.214.197 1.821.235.173.007.347.003.52.003h10.74c.174 0 .347.004.521-.003.607-.038 1.214-.097 1.821-.235a5.023 5.023 0 001.875-.655c1.118-.733 1.863-1.732 2.18-3.043.17-.713.236-1.441.24-2.19.003-.173 0-.347 0-.52V6.643c0-.173.004-.346-.003-.52zM16.95 17.22c-.12.15-.27.28-.44.37-.33.17-.69.25-1.07.27-.17.01-.34 0-.51-.03a2.1 2.1 0 01-.79-.33c-.44-.35-.7-.81-.74-1.38-.04-.51.13-.97.47-1.34.39-.41.88-.63 1.44-.66.44-.02.84.09 1.19.36v-5l-5.56 1.68v5.94c.01.18 0 .36-.04.54-.1.57-.42 1-.93 1.29-.27.15-.57.24-.88.27-.18.01-.36 0-.54-.02a2.06 2.06 0 01-.82-.35c-.42-.34-.67-.78-.72-1.33-.05-.54.12-1 .47-1.38.38-.41.87-.63 1.42-.66.44-.02.85.09 1.2.37V7.19c0-.13.03-.24.1-.35.1-.16.24-.26.42-.3l6.4-1.93c.04-.01.07-.02.11-.02.25-.05.44.09.46.35v10c.01.19 0 .38-.05.57-.1.55-.41.97-.91 1.26z" /></svg></Box>;
    if (k.includes("email") || k.includes("mail")) return <MailOutlineRoundedIcon sx={{ fontSize: size }} />;
    if (k.includes("website") || k.includes("web") || k.includes("home")) return <LanguageRoundedIcon sx={{ fontSize: size }} />;
    return <LinkRoundedIcon sx={{ fontSize: size }} />;
}

function getLinkColor(key, theme) {
    const k = String(key).toLowerCase();
    const social = theme?.custom?.brand?.social || theme?.custom?.social || {};
    if (k.includes("instagram")) return social.instagram || "#E4405F";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return social.x || null;
    if (k.includes("youtube")) return social.youtube || "#FF0000";
    if (k.includes("facebook")) return social.facebook || "#1877F2";
    if (k.includes("tiktok")) return social.tiktok || null;
    if (k.includes("spotify")) return social.spotify || "#1DB954";
    if (k.includes("soundcloud")) return social.soundcloud || "#FF5500";
    if (k.includes("bandcamp")) return social.bandcamp || "#1DA0C3";
    if (k.includes("apple") && k.includes("music")) return social.appleMusic || "#FA243C";
    if (k.includes("linktree")) return social.linktree || "#43E660";
    return null;
}

function isStreamingPlatform(key) {
    const k = String(key).toLowerCase();
    return k.includes("spotify") || k.includes("soundcloud") || k.includes("bandcamp") ||
        k.includes("apple") || k.includes("youtube") || k.includes("tidal") ||
        k.includes("deezer") || k.includes("amazon");
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

// ═══════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ArtistLivePreview({
                                              name = "",
                                              handle = "",
                                              bio = "",
                                              avatarUrl = "",
                                              coverUrl = "",
                                              city = "",
                                              county = "",
                                              genres = [],
                                              links = {},
                                              photos = [],
                                              tagline = "",
                                              foundingYear = "",
                                              hometown = "",
                                              highlightSections = [],
                                              settings = {},
                                              followersCount = 0,
                                              followingCount = 0,
                                              // Profile sub-type: 'music' (default) or 'artist' (visual artists).
                                              // Drives which default icon renders in the avatar fallback and
                                              // in the About tab header — palette for visual artists, music-note
                                              // for musicians. Falls back to 'music' when unspecified.
                                              profileType = "music",
                                          }) {
    // Shared default icon used anywhere this preview renders a fallback for
    // the artist identity (avatar + tab label + "About" section header).
    const isVisualArtist = String(profileType || "").toLowerCase() === "artist";
    const ArtistDefaultIcon = isVisualArtist ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    const [bioExpanded, setBioExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const BIO_COLLAPSE = 280;

    const hasCover = Boolean(coverUrl);
    const locationLabel = [city, county].filter(Boolean).join(", ") || "";
    const displayHandle = handle ? `@${handle.replace(/^@/, "")}` : "";

    // Links
    const linkEntries = Object.entries(links).filter(([, v]) => v);

    // Photo gallery
    const photoUrls = (Array.isArray(photos) ? photos : []).map((p) =>
        typeof p === "string" ? p : p?.url || ""
    ).filter(Boolean);

    // Highlight sections
    const validHighlights = Array.isArray(highlightSections)
        ? highlightSections.filter((s) => s.title?.trim() || s.body?.trim() || s.photoUrl)
        : [];

    // Quick facts
    const hasQuickFacts = Boolean(foundingYear || hometown);

    return (
        <Box
            sx={(t) => ({
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.15),
                borderRadius: 2.5,
                overflow: "hidden",
                boxShadow: `0 8px 30px ${alpha(t.palette.common.black, 0.08)}`,
                bgcolor: "background.paper",
            })}
        >
            {/* ── Cover Photo ── */}
            {hasCover && (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 140, sm: 180, md: 200 }, bgcolor: "grey.200", overflow: "hidden" }}>
                    <Box component="img" src={coverUrl} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {/* Gradient overlay */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.text.primary, 0.02)} 0%, ${alpha(t.palette.text.primary, 0.30)} 100%)`,
                        }}
                    />
                </Box>
            )}

            {/* ── Header: Avatar + Name/Info side by side, overlapping cover ── */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, position: "relative", zIndex: 2 }}>
                {/* Row with Avatar + Name/Info */}
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.25, minWidth: 0 }}>
                    {/* Avatar — overlaps bottom of cover */}
                    <Avatar
                        src={avatarUrl || undefined}
                        variant="circular"
                        sx={(t) => ({
                            width: { xs: 68, sm: 90 }, height: { xs: 68, sm: 90 }, flexShrink: 0,
                            border: "3px solid",
                            borderColor: "background.paper",
                            boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.1)}`,
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            "& .MuiAvatar-img": {
                                objectFit: "cover",
                                transform: "scale(1.15)",
                            },
                        })}
                    >
                        <ArtistDefaultIcon sx={{ fontSize: 36 }} />
                    </Avatar>

                    {/* Name + Handle + Location + Followers — next to avatar */}
                    <Box sx={{ minWidth: 0, flex: 1, pb: 0.5, pt: 0 }}>
                        <Typography sx={{ fontWeight: 880, fontSize: "1.1rem", lineHeight: 1.3, color: "text.primary", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "normal" }}>
                            {name || "Artist Name"}
                        </Typography>
                        {displayHandle && (
                            <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }} noWrap>
                                {displayHandle}
                            </Typography>
                        )}
                        {/* Tagline */}
                        {tagline && (
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, fontStyle: "italic", color: "text.secondary", lineHeight: 1.35, mt: 0.25 }}>
                                {tagline}
                            </Typography>
                        )}
                        {/* Location */}
                        {locationLabel && (
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.25 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "primary.main", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {locationLabel}
                                </Typography>
                            </Stack>
                        )}
                        {/* Followers / Following */}
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ mt: 0.5 }}
                            divider={
                                <Typography sx={{ color: "text.disabled", fontSize: "0.75rem" }}>•</Typography>
                            }
                        >
                            <Stack direction="row" spacing={0.4} alignItems="baseline">
                                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "text.primary" }}>
                                    {(followersCount || 0).toLocaleString()}
                                </Typography>
                                <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                                    Followers
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.4} alignItems="baseline">
                                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "text.primary" }}>
                                    {(followingCount || 0).toLocaleString()}
                                </Typography>
                                <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                                    Following
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Box>

                {/* Genre chips + Social link icons row */}
                <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mt: 1, gap: 1 }}>
                    {/* Genre chips */}
                    {genres.length > 0 ? (
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.65, flex: 1, minWidth: 0 }}>
                            {genres.slice(0, 8).map((g) => {
                                const label = typeof g === "object" ? g.name || g.label || "" : g;
                                if (!label) return null;
                                const GenreIcon = getGenreIcon(label);
                                return (
                                    <Chip
                                        key={label}
                                        icon={<GenreIcon sx={{ fontSize: "13px !important" }} />}
                                        label={label}
                                        size="small"
                                        sx={(t) => ({
                                            borderRadius: 2,
                                            fontWeight: 700,
                                            fontSize: "0.73rem",
                                            height: 26,
                                            bgcolor: alpha(t.palette.primary.main, 0.07),
                                            color: t.palette.text.primary,
                                            "& .MuiChip-icon": { color: t.palette.primary.main },
                                        })}
                                    />
                                );
                            })}
                        </Stack>
                    ) : (
                        <Box sx={{ flex: 1 }} />
                    )}

                    {/* Social / streaming link icons */}
                    {linkEntries.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                            {sortLinksStreamingFirst(linkEntries).slice(0, 8).map(([k]) => {
                                const label = String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());
                                return (
                                    <Tooltip key={k} title={label} arrow>
                                        <Box
                                            sx={(t) => {
                                                const color = getLinkColor(k, t);
                                                return {
                                                    width: 28, height: 28,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "50%",
                                                    color: color || t.palette.primary.main,
                                                    bgcolor: alpha(color || t.palette.primary.main, 0.08),
                                                };
                                            }}
                                        >
                                            {getLinkIcon(k, 14)}
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </Box>

            <Divider sx={{ mt: 1.25 }} />

            {/* ── Action Buttons (decorative only — matches detail panel owner view) ── */}
            <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    disableRipple
                    disableElevation
                    startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 0.75, borderColor: "divider", color: "text.primary", cursor: "default", pointerEvents: "none" }}
                >
                    View Profile
                </Button>
                <Button
                    variant="outlined"
                    fullWidth
                    disableRipple
                    disableElevation
                    startIcon={<ShareIcon sx={{ fontSize: "18px !important" }} />}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 0.75, borderColor: "divider", color: "text.primary", cursor: "default", pointerEvents: "none" }}
                >
                    Share
                </Button>
            </Stack>

            {/* ── Tabs ── */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={(t) => ({
                    minHeight: 38,
                    flexShrink: 0,
                    borderRadius: 0,
                    padding: 0,
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    borderBottom: "1px solid",
                    borderColor: t.palette.divider,
                    "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 850, fontSize: "0.8rem", py: 0, borderRadius: 0 },
                    "& .Mui-selected": { color: `${t.palette.primary.dark} !important` },
                    "& .MuiTabs-indicator": { bgcolor: t.palette.secondary?.main || t.palette.primary.main, height: 2.5, borderRadius: 0 },
                })}
            >
                <Tab icon={<InfoRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="About" />
                <Tab icon={<ArticleRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Posts" />
                <Tab icon={<EventAvailableRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Events" />
                <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Photos${photoUrls.length > 0 ? ` (${photoUrls.length})` : ""}`} />
            </Tabs>

            {/* ── Tab Content ── */}
            <Box sx={{ px: 2, py: 1.75, minHeight: 180 }}>

                {/* ══ ABOUT TAB ══ */}
                {activeTab === 0 && (
                    <Box>
                        {/* Bio */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 0.5 }}>About</Typography>
                            {bio ? (
                                <Box sx={{ position: "relative" }}>
                                    <Typography sx={{ fontSize: "0.86rem", lineHeight: 1.65, color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                        {bio.length > BIO_COLLAPSE && !bioExpanded ? `${bio.slice(0, BIO_COLLAPSE).trim()}…` : bio}
                                    </Typography>
                                    {bio.length > BIO_COLLAPSE && (
                                        <Button size="small" onClick={() => setBioExpanded((v) => !v)}
                                                sx={{ textTransform: "none", fontWeight: 850, fontSize: "0.78rem", px: 0, minWidth: 0, color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                                            {bioExpanded ? "Show less" : "Show more"}
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Typography color="text.secondary" sx={{ fontSize: "0.85rem", fontStyle: "italic" }}>No description provided.</Typography>
                            )}
                        </Box>

                        {/* Quick Facts */}
                        {hasQuickFacts && (
                            <Box sx={{ mb: 2 }}>
                                <Stack spacing={0.5}>
                                    {foundingYear && (
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.secondary" }}>Est. {foundingYear}</Typography>
                                        </Stack>
                                    )}
                                    {hometown && (
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <HomeRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.secondary" }}>From {hometown}</Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {/* Highlight Sections */}
                        {validHighlights.map((sec, idx) => (
                            <Box key={idx} sx={{ mb: 1.5 }}>
                                <Box sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15) })}>
                                    {sec.title && (
                                        <Box sx={(t) => ({ px: 1.5, py: 0.65, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), display: "flex", alignItems: "center", gap: 0.75 })}>
                                            <HlIconRender name={sec.icon} sx={{ fontSize: 15, color: "primary.main" }} />
                                            <Typography sx={{ fontWeight: 900, fontSize: 11, color: "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                                {sec.title}
                                            </Typography>
                                        </Box>
                                    )}
                                    {(sec.photoUrl || sec.body) && (
                                        <Box>
                                            {sec.photoUrl && (
                                                <Box component="img" src={sec.photoUrl} alt={sec.title || "Highlight"} referrerPolicy="no-referrer"
                                                     sx={{ width: "100%", height: "auto", maxHeight: 319, objectFit: "cover", display: "block" }} />
                                            )}
                                            {sec.body && (
                                                <Box sx={{ px: 1.5, py: 1.25 }}>
                                                    <Typography sx={{ fontSize: 12, lineHeight: 1.55, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line" }}>
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

                {/* ══ POSTS TAB ══ */}
                {activeTab === 1 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <ArticleRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Posts</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>
                            Your published posts will appear here for fans and followers to see.
                        </Typography>
                    </Box>
                )}

                {/* ══ EVENTS TAB ══ */}
                {activeTab === 2 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <EventAvailableRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Events</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>
                            Your upcoming shows and events will appear here.
                        </Typography>
                    </Box>
                )}

                {/* ══ PHOTOS TAB ══ */}
                {activeTab === 3 && (
                    <Box>
                        {photoUrls.length > 0 ? (
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                                {photoUrls.map((url, i) => (
                                    <Box
                                        key={i}
                                        sx={(t) => ({
                                            position: "relative",
                                            width: "100%",
                                            paddingTop: "100%",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            bgcolor: "grey.100",
                                            transition: "opacity 150ms ease, transform 150ms ease",
                                            "&:hover": { opacity: 0.85, transform: "scale(1.02)" },
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
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <PhotoLibraryRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Photos</Typography>
                                <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>
                                    Any photos you add will appear here.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// src/pages/community/components/CommunityDiscoverTab.jsx
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
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import XIcon from "@mui/icons-material/X";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import NatureRoundedIcon from "@mui/icons-material/NatureRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import ChurchRoundedIcon from "@mui/icons-material/ChurchRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import PulsingDots from "../../../components/PulsingDots";
import RichTextDisplay from "../../../components/RichTextDisplay";
import { getDiscoverStaggerSx, adaptColor } from "../../../themes/theme";

// ─── Social Icons ──────────────────────────────────────
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
                <linearGradient id="ig-grad-comm" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" /><stop offset="25%" stopColor="#F77737" />
                    <stop offset="50%" stopColor="#E1306C" /><stop offset="75%" stopColor="#C13584" />
                    <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.778.91.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.76 1.831 9.14 1.82 12 1.82zm0-1.657C8.741.163 8.332.175 7.052.234 5.775.293 4.902.5 4.14.81a5.726 5.726 0 00-2.08 1.356A5.726 5.726 0 00.705 4.245C.4 5.007.19 5.88.134 7.157.075 8.437.063 8.846.063 12.106s.012 3.668.07 4.948c.058 1.277.265 2.15.572 2.912a5.726 5.726 0 001.356 2.08 5.726 5.726 0 002.08 1.356c.762.306 1.636.513 2.912.571 1.28.059 1.689.07 4.948.07s3.668-.012 4.948-.07c1.277-.058 2.15-.265 2.912-.571a5.726 5.726 0 002.08-1.356 5.726 5.726 0 001.356-2.08c.306-.762.513-1.636.571-2.912.059-1.28.07-1.689.07-4.948s-.012-3.668-.07-4.948c-.058-1.277-.265-2.15-.571-2.912a5.726 5.726 0 00-1.356-2.08A5.726 5.726 0 0019.86.81c-.762-.306-1.636-.513-2.912-.571C15.668.175 15.259.163 12 .163zm0 5.838a5.838 5.838 0 100 11.676 5.838 5.838 0 000-11.676zm0 9.838a4 4 0 110-8 4 4 0 010 8zm6.406-10.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" fill="url(#ig-grad-comm)" />
        </Box>
    );
}

function TikTokIcon({ size = 16 }) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, display: "block" }}>
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="currentColor" />
        </Box>
    );
}

const CTA_ICON_MAP = {
    OpenInNew: OpenInNewRoundedIcon,
    Link: LinkRoundedIcon,
    Info: InfoRoundedIcon,
    Check: CheckCircleRoundedIcon,
    Volunteer: VolunteerActivismRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Celebration: CelebrationRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    Community: GroupsRoundedIcon,
    Storefront: StorefrontRoundedIcon,
    Music: MusicNoteRoundedIcon,
    Build: BuildRoundedIcon,
    Phone: PhoneRoundedIcon,
    Email: EmailRoundedIcon,
    Place: LocationOnRoundedIcon,
    Globe: PublicRoundedIcon,
    Lightbulb: LightbulbRoundedIcon,
    Star: StarRoundedIcon,
};

function normalizeActionHref(url) {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:|sms:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;
    return `https://${trimmed}`;
}

function CtaButton({ label, link, iconName, variant = "contained", sx }) {
    if (!label) return null;
    const href = normalizeActionHref(link);
    const IconComp = CTA_ICON_MAP[iconName] || OpenInNewRoundedIcon;

    return (
        <Button
            variant={variant}
            fullWidth
            component={href ? "a" : "button"}
            href={href || undefined}
            target={href && !href.startsWith("/") && !href.startsWith("tel:") && !href.startsWith("mailto:") && !href.startsWith("sms:") ? "_blank" : undefined}
            rel={href && !href.startsWith("/") ? "noopener noreferrer" : undefined}
            startIcon={<IconComp sx={{ fontSize: 18 }} />}
            sx={sx}
        >
            {label}
        </Button>
    );
}

function normalizeSocialHref(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;
    return `https://${trimmed}`;
}

function getSocialIconMeta(key) {
    const socialKey = String(key || "").toLowerCase();
    if (socialKey.includes("instagram")) return { label: "Instagram", icon: <InstagramIcon size={14} />, color: "#E4405F" };
    if (socialKey.includes("facebook")) return { label: "Facebook", icon: <FacebookIcon size={14} />, color: "#1877F2" };
    if (socialKey.includes("twitter") || socialKey === "x" || socialKey.includes("x.com")) return { label: "X", icon: <XIcon sx={{ fontSize: 14 }} />, color: null };
    if (socialKey.includes("youtube")) return { label: "YouTube", icon: <YouTubeIcon sx={{ fontSize: 14 }} />, color: "#FF0000" };
    if (socialKey.includes("tiktok")) return { label: "TikTok", icon: <TikTokIcon size={14} />, color: null };
    if (socialKey.includes("website") || socialKey.includes("web")) return { label: "Website", icon: <LanguageRoundedIcon sx={{ fontSize: 14 }} />, color: null };
    return { label: "Link", icon: <LanguageRoundedIcon sx={{ fontSize: 14 }} />, color: null };
}

function SocialIconLinks({ entries, size = 28 }) {
    if (!Array.isArray(entries) || entries.length === 0) return null;
    return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            {entries.map(([key, value]) => {
                const href = normalizeSocialHref(value);
                if (!href) return null;
                const meta = getSocialIconMeta(key);
                return (
                    <Tooltip key={key} title={meta.label} arrow>
                        <IconButton
                            component="a"
                            href={href}
                            target={href.startsWith("/") || href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
                            rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
                            size="small"
                            sx={(t) => ({
                                width: size,
                                height: size,
                                color: meta.color || t.palette.text.primary,
                                bgcolor: alpha(meta.color || t.palette.text.primary, 0.08),
                                "&:hover": {
                                    bgcolor: alpha(meta.color || t.palette.text.primary, 0.18),
                                },
                            })}
                        >
                            {meta.icon}
                        </IconButton>
                    </Tooltip>
                );
            })}
        </Stack>
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
        secureFetch(`/api/video/embed-url/${videoId}`)
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((d) => { if (!cancelled) { setEmbedUrl(d.embedUrl.replace("&autoplay=true", "")); setLoading(false); } })
            .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
        return () => { cancelled = true; };
    }, [videoId]);

    if (!videoId) return null;

    if (loading) {
        return (
            <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 2.5, overflow: "hidden", bgcolor: (t) => alpha(t.palette.common.black, 0.06) }}>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress size={28} />
                </Box>
            </Box>
        );
    }

    if (error || !embedUrl) {
        return (
            <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 2.5, overflow: "hidden", bgcolor: (t) => alpha(t.palette.common.black, 0.06) }}>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
                    <PlayArrowRoundedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                    <Typography variant="caption" color="text.secondary">Video unavailable</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 2.5, overflow: "hidden", boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.12)}` }}>
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

// ─── Badge Icon helper ───────────────────────────────
const BADGE_ICONS = {
    CheckCircle: CheckCircleRoundedIcon,
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Campaign: CampaignRoundedIcon,
    Volunteer: VolunteerActivismRoundedIcon,
    Groups: GroupsRoundedIcon,
};

const SECTION_ICONS = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Fire: LocalFireDepartmentRoundedIcon,
    Celebrate: CelebrationRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    Volunteer: VolunteerActivismRoundedIcon,
    Nature: NatureRoundedIcon,
    Park: ParkRoundedIcon,
    Handshake: HandshakeRoundedIcon,
    School: SchoolRoundedIcon,
    Sports: SportsSoccerRoundedIcon,
    Fitness: FitnessCenterRoundedIcon,
    Restaurant: RestaurantRoundedIcon,
    Brush: BrushRoundedIcon,
    Camera: CameraAltRoundedIcon,
    Pets: PetsRoundedIcon,
    Car: DirectionsCarRoundedIcon,
    Home: HomeRoundedIcon,
    Check: CheckCircleRoundedIcon,
    Info: InfoRoundedIcon,
    Lightbulb: LightbulbRoundedIcon,
    Sparkle: AutoAwesomeRoundedIcon,
    Globe: PublicRoundedIcon,
    Child: ChildCareRoundedIcon,
    Church: ChurchRoundedIcon,
    Building: AccountBalanceRoundedIcon,
    Community: GroupsRoundedIcon,
};

function BadgeIconRender({ name, ...props }) {
    const Icon = BADGE_ICONS[name] || CheckCircleRoundedIcon;
    return <Icon {...props} />;
}

function SectionIconRender({ name, ...props }) {
    const Icon = SECTION_ICONS[name] || GroupsRoundedIcon;
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

// ──────────────────────────────────────────────────────────
// COMMUNITY SPOTLIGHT CARD
// ──────────────────────────────────────────────────────────
function CommunitySpotlightCard({ item }) {
    const [descExpanded, setDescExpanded] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState("");
    const theme = useTheme();

    const additionalOwners = Array.isArray(item.additional_owners) ? item.additional_owners.filter((ao) => ao && ao.name) : [];
    const aboutPhotos = Array.isArray(item.about_photos) ? item.about_photos.filter(Boolean) : [];
    const allHighlightSections = Array.isArray(item.highlight_sections) ? item.highlight_sections : [];
    const coverPhotos = getCoverPhotos(item);
    const hasCover = coverPhotos.length > 0;
    const descText = item.description || "";
    const DESC_COLLAPSE = 180;
    const descIsLong = descText.length > DESC_COLLAPSE;

    // Cycle through highlight sections (start at random index)
    const [highlightIdx, setHighlightIdx] = useState(() =>
        allHighlightSections.length > 1
            ? Math.floor(Math.random() * allHighlightSections.length)
            : 0
    );
    const hasMultipleHighlights = allHighlightSections.length > 1;
    const visibleHighlightSections = allHighlightSections.length > 0
        ? [allHighlightSections[highlightIdx % allHighlightSections.length]]
        : [];
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const hlSwipe = useHighlightSwipe(allHighlightSections.length, setHighlightIdx);

    const socialEntries = [
        ["facebook_url", item.facebook_url],
        ["instagram_url", item.instagram_url],
        ["twitter_url", item.twitter_url],
        ["youtube_url", item.youtube_url],
        ["tiktok_url", item.tiktok_url],
        ["website_url", item.website_url],
    ].filter(([, value]) => Boolean(String(value || "").trim()));

    // Adapt admin-chosen colors to current theme
    const accent = adaptColor(item.accent_color, theme) || null;
    const hlColor = adaptColor(item.highlight_color, theme) || null;
    const badgeColor = adaptColor(item.badge_color, theme) || null;

    return (
        <Box>

            {/* ══════════ COVER / VIDEO ══════════ */}
            {(hasCover || item.video_id) && (
                <Box sx={{ position: "relative" }}>
                    {item.video_id ? (
                        <BunnyVideoPlayer videoId={item.video_id} />
                    ) : (
                        <CoverSlideshow photos={coverPhotos} coverPosition={item.cover_position} height={{ xs: 263, sm: 313 }} />
                    )}
                </Box>
            )}

            {/* ══════════ TITLE + INFO STRIP ══════════ */}
            <Box sx={{ px: 2, pt: 1.5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    {item.logo_url && (
                        <Avatar
                            src={item.logo_url}
                            alt={item.title}
                            sx={{ width: 40, height: 40, border: "2px solid", borderColor: (t) => alpha(t.palette.divider, 0.3) }}
                        />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2, minWidth: 0, flex: 1, wordBreak: "break-word", overflowWrap: "break-word" }}>
                                {item.title}
                            </Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                                <SocialIconLinks entries={socialEntries} size={28} />
                            </Stack>
                        </Stack>
                        {item.subtitle && (
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>
                                {item.subtitle}
                            </Typography>
                        )}
                        {item.badge_text && (
                            <Chip
                                icon={<BadgeIconRender name={item.badge_icon} sx={{ fontSize: "12px !important" }} />}
                                label={item.badge_text}
                                size="small"
                                sx={{ fontWeight: 800, fontSize: 10, height: 20, mt: 0.35, bgcolor: badgeColor || "secondary.main", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }}
                            />
                        )}
                    </Box>
                </Stack>

                {/* Location */}
                {item.owner_location && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                        <LocationOnRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
                            {item.owner_location}
                        </Typography>
                    </Stack>
                )}
            </Box>

            {/* ══════════ ABOUT SECTION ══════════ */}
            {(descText || item.about_photo_url || aboutPhotos.length > 0) && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>
                        About {item.title}
                    </Typography>

                    <Box
                        sx={{
                            position: "relative",
                            maxHeight: (!descExpanded && descIsLong) ? 150 : "none",
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
                                    width: { xs: 110, sm: 130 },
                                    height: "auto",
                                    maxHeight: 170,
                                    objectFit: "contain",
                                    borderRadius: 2,
                                    mr: 1.5,
                                    mb: 0.5,
                                    cursor: "pointer",
                                    transition: "opacity 0.15s",
                                    "&:hover": { opacity: 0.85 },
                                }}
                            />
                        )}
                        {descText && (
                            <RichTextDisplay
                                html={descText}
                                sx={{ fontSize: 12.5, lineHeight: 1.6, color: "text.secondary", fontWeight: 500 }}
                            />
                        )}
                        <Box sx={{ clear: "both" }} />

                        {!descExpanded && descIsLong && (
                            <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: `linear-gradient(transparent, ${t.palette.background.paper})`, pointerEvents: "none" })} />
                        )}
                    </Box>

                    {descIsLong && (
                        <Button
                            size="small"
                            onClick={() => setDescExpanded((prev) => !prev)}
                            endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: "15px !important", transform: descExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />}
                            sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, color: accent || "secondary.main", mt: 0.25, px: 0, minWidth: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                        >
                            {descExpanded ? "Show less" : "Read more"}
                        </Button>
                    )}

                    {aboutPhotos.length > 0 && descExpanded && (
                        <Box sx={{ display: "flex", gap: 1, mt: 1.25, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.12), borderRadius: 2 } }}>
                            {aboutPhotos.map((url, idx) => (
                                <Box key={idx} component="img" src={url} alt={`About photo ${idx + 1}`} onClick={() => setLightboxSrc(url)} sx={{ height: 100, width: "auto", maxWidth: 160, objectFit: "contain", borderRadius: 2, flexShrink: 0, cursor: "pointer", transition: "opacity 0.15s", "&:hover": { opacity: 0.85 } }} />
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
                                            borderColor: alpha(hlColor || t.palette.primary.main, 0.18),
                                            bgcolor: alpha(hlColor || t.palette.primary.main, 0.02),
                                            mx: { xs: 0.5, md: 0 },
                                        })}
                                    >
                                        <Box sx={(t) => ({ display: "flex", alignItems: "center", gap: 0.75, px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(hlColor || t.palette.primary.main, 0.12) })}>
                                            <SectionIconRender name={slideSec.icon} sx={{ fontSize: 16, color: hlColor || "primary.main" }} />
                                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: hlColor || "primary.dark", flex: 1 }}>
                                                {slideSec.title || "Highlight"}
                                            </Typography>
                                            {hasMultipleHighlights && (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto" }}>
                                                    <IconButton size="small" onClick={() => setHighlightIdx((i) => (i - 1 + allHighlightSections.length) % allHighlightSections.length)} sx={{ width: 24, height: 24, color: hlColor || "primary.main" }}>
                                                        <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: hlColor || "primary.main", minWidth: 28, textAlign: "center" }}>
                                                        {(highlightIdx % allHighlightSections.length) + 1}/{allHighlightSections.length}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => setHighlightIdx((i) => (i + 1) % allHighlightSections.length)} sx={{ width: 24, height: 24, color: hlColor || "primary.main" }}>
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
                                                ? (hlColor || t.palette.primary.main)
                                                : alpha(hlColor || t.palette.primary.main, 0.2),
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

            {/* ══════════ LEGACY HIGHLIGHT SECTION ══════════ */}
            {allHighlightSections.length === 0 && item.highlight_title && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={(t) => ({ borderRadius: 2, overflow: "hidden", border: `1px solid ${alpha(hlColor || t.palette.secondary.main, 0.15)}` })}>
                        <Box sx={(t) => ({ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, bgcolor: alpha(hlColor || t.palette.secondary.main, 0.06), borderBottom: `1px solid ${alpha(hlColor || t.palette.secondary.main, 0.12)}` })}>
                            <SectionIconRender name={item.highlight_icon || item.section_icon || item.icon} sx={{ fontSize: 16, color: hlColor || "secondary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: hlColor || "secondary.main" }}>
                                {item.highlight_title}
                            </Typography>
                        </Box>
                        <Box sx={{ overflow: "hidden" }}>
                            {item.highlight_video_id && (
                                <Box sx={{ px: 1.5, pt: 1.5 }}>
                                    <BunnyVideoPlayer videoId={item.highlight_video_id} />
                                </Box>
                            )}
                            {item.highlight_photo_url && (
                                <Box
                                    component="img"
                                    src={item.highlight_photo_url}
                                    alt=""
                                    onClick={() => setLightboxSrc(item.highlight_photo_url)}
                                    sx={{ width: "100%", height: { xs: "auto", md: 405 }, maxHeight: { xs: "75vh", md: "none" }, objectFit: { xs: "contain", md: "cover" }, display: "block", cursor: "pointer", transition: "opacity 0.15s", "&:hover": { opacity: 0.85 } }}
                                />
                            )}
                            {item.highlight_body && (
                                <Box sx={{ px: 1.5, pt: item.highlight_photo_url ? 1.25 : 1.5, pb: 1.5 }}>
                                    <RichTextDisplay
                                        html={item.highlight_body}
                                        sx={{ fontSize: 13.5, lineHeight: 1.6, color: "text.primary", fontWeight: 500, opacity: 0.85 }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══════════ ORGANIZER / TEAM SECTION ══════════ */}
            {(item.owner_name || item.owner_avatar_url || item.owner_title) && (
                <>
                    <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
                            {item.owner_section_title || (additionalOwners.length > 0 ? "Community Leaders" : "Organizer")}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                component="img"
                                src={item.owner_avatar_url || defaultAvatar}
                                alt={item.owner_name}
                                onClick={() => setLightboxSrc(item.owner_avatar_url || defaultAvatar)}
                                sx={{
                                    width: 110,
                                    height: 110,
                                    borderRadius: 2.5,
                                    objectFit: "cover",
                                    objectPosition: item.owner_avatar_position || "center",
                                    border: "2px solid",
                                    borderColor: (t) => alpha(accent || t.palette.secondary.main, 0.12),
                                    boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}`,
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    transition: "opacity 0.15s",
                                    "&:hover": { opacity: 0.85 },
                                }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
                                    {item.owner_name}
                                </Typography>
                                {item.owner_title && (
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>
                                        {item.owner_title}
                                    </Typography>
                                )}
                                {(item.owner_phone || item.owner_email) && (
                                    <Stack spacing={0.3} sx={{ mt: 0.75 }}>
                                        {item.owner_phone && (
                                            <Typography component="a" href={`tel:${item.owner_phone}`} sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <PhoneRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                {item.owner_phone}
                                            </Typography>
                                        )}
                                        {item.owner_email && (
                                            <Typography component="a" href={`mailto:${item.owner_email}`} sx={{ fontSize: 12.5, fontWeight: 600, color: accent || "secondary.main", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5, "&:hover": { textDecoration: "underline" } }}>
                                                <EmailRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                {item.owner_email}
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                        {item.owner_about && (
                            <Box sx={{ mt: 1.25 }}>
                                <RichTextDisplay
                                    html={item.owner_about}
                                    sx={{ fontSize: 12.5, lineHeight: 1.6, color: "text.secondary", fontWeight: 500 }}
                                />
                            </Box>
                        )}

                        {/* Additional team members */}
                        {additionalOwners.map((ao, aoIdx) => (
                            <Box key={aoIdx}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                                    <Box
                                        component="img"
                                        src={ao.avatar_url || defaultAvatar}
                                        alt={ao.name || "Team member"}
                                        onClick={() => setLightboxSrc(ao.avatar_url || defaultAvatar)}
                                        sx={{
                                            width: 110,
                                            height: 110,
                                            borderRadius: 2.5,
                                            objectFit: "cover",
                                            objectPosition: ao.avatar_position || "center",
                                            border: "2px solid",
                                            borderColor: (t) => alpha(accent || t.palette.secondary.main, 0.10),
                                            boxShadow: (t) => `0 2px 10px ${alpha(t.palette.common.black, 0.06)}`,
                                            flexShrink: 0,
                                            cursor: "pointer",
                                            transition: "opacity 0.15s",
                                            "&:hover": { opacity: 0.85 },
                                        }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
                                            {ao.name}
                                        </Typography>
                                        {ao.title && (
                                            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>
                                                {ao.title}
                                            </Typography>
                                        )}
                                        {(ao.phone || ao.email) && (
                                            <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                                                {ao.phone && (
                                                    <Typography component="a" href={`tel:${ao.phone}`} sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <PhoneRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                        {ao.phone}
                                                    </Typography>
                                                )}
                                                {ao.email && (
                                                    <Typography component="a" href={`mailto:${ao.email}`} sx={{ fontSize: 12, fontWeight: 600, color: accent || "secondary.main", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5, "&:hover": { textDecoration: "underline" } }}>
                                                        <EmailRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                        {ao.email}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        )}
                                    </Box>
                                </Stack>
                                {ao.about && (
                                    <Box sx={{ mt: 1 }}>
                                        <RichTextDisplay
                                            html={ao.about}
                                            sx={{ fontSize: 12.5, lineHeight: 1.6, color: "text.secondary", fontWeight: 500 }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </>
            )}


            {/* ══════════ PHOTO LIGHTBOX ══════════ */}
            <Dialog
                open={Boolean(lightboxSrc)}
                onClose={() => setLightboxSrc("")}
                maxWidth={false}
                PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", m: 1, maxWidth: "95vw", maxHeight: "95vh", overflow: "visible" } }}
                slotProps={{ backdrop: { sx: { bgcolor: "rgba(0,0,0,0.85)" } } }}
            >
                <IconButton onClick={() => setLightboxSrc("")} aria-label="Close" sx={{ position: "absolute", top: -16, right: -16, zIndex: 1, bgcolor: "rgba(255,255,255,0.9)", color: "text.primary", width: 36, height: 36, boxShadow: 2, "&:hover": { bgcolor: "#fff" } }}>
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {lightboxSrc && (
                    <Box component="img" src={lightboxSrc} alt="Full size" sx={{ display: "block", maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 2 }} />
                )}
            </Dialog>

            {(item.cta_primary_label || item.cta_secondary_label) && (
                <>
                    <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />
                    <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
                            Learn More
                        </Typography>
                        <CtaButton
                            label={item.cta_primary_label}
                            link={item.cta_primary_link}
                            iconName={item.cta_primary_icon || "Info"}
                            variant="contained"
                            sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                fontSize: 14,
                                py: 1.25,
                                borderRadius: 2.5,
                                mb: item.cta_secondary_label ? 1 : 0,
                                ...(accent ? { bgcolor: accent, "&:hover": { bgcolor: accent, filter: "brightness(0.9)" } } : {}),
                            }}
                        />
                        <CtaButton
                            label={item.cta_secondary_label}
                            link={item.cta_secondary_link}
                            iconName={item.cta_secondary_icon || "Volunteer"}
                            variant="outlined"
                            sx={{
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 13,
                                py: 1,
                                borderRadius: 2.5,
                                borderColor: "divider",
                                color: "text.primary",
                            }}
                        />
                    </Box>
                </>
            )}

            {/* Bottom spacing */}
            <Box sx={{ pb: 2 }} />
        </Box>
    );
}

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
// ENTRY-LEVEL SWIPE HOOK (for mobile entry cycling)
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

// ──────────────────────────────────────────────────────────
// MAIN COMMUNITY DISCOVER TAB
// ──────────────────────────────────────────────────────────
export default function CommunityDiscoverTab() {
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

        secureFetch("/api/discover-highlights?page=community")
            .then((r) => {
                if (!r.ok) throw new Error("Failed");
                return r.json();
            })
            .then((data) => {
                if (!cancelled) {
                    const all = Array.isArray(data?.items) ? data.items : [];
                    // Shuffle randomly so order is different each visit
                    setItems(all.length > 1 ? shuffleArray(all) : all);
                    setLoading(false);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => { if (!cancelled) setRevealed(true); });
                    });
                }
            })
            .catch(() => {
                if (!cancelled) { setError(true); setLoading(false); }
            });

        return () => { cancelled = true; };
    }, []);

    // Crossfade transition when changing entries
    const navigateTo = useCallback((newIdx) => {
        if (newIdx === activeEntryIdx) return;
        setFadeIn(false);
        setTimeout(() => {
            setActiveEntryIdx(newIdx);
            setFadeIn(true);
            // Scroll to top of the container
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

    // Get accent color from current item for dot highlight
    const currentItem = items[activeEntryIdx];
    const currentAccent = currentItem ? (adaptColor(currentItem.accent_color, theme) || null) : null;

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", py: 6 }}>
                <PulsingDots />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    Unable to load community spotlights.
                </Typography>
            </Box>
        );
    }

    if (items.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                <CampaignRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "text.secondary" }}>
                    Community spotlights coming soon
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                    Stay tuned for stories, events, and local highlights.
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
                minHeight: { xs: "auto" },
                overflowY: { xs: "visible", md: "auto" },
                overflowX: "hidden",
                overscrollBehavior: { md: "contain" },
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.12), borderRadius: 3 },
            }}
        >
            {/* Sticky nav bar — arrows + dots, sticks to top while content scrolls beneath */}
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
                    <CommunitySpotlightCard item={items[activeEntryIdx]} />
                </Box>
            </Box>
        </Box>
    );
}
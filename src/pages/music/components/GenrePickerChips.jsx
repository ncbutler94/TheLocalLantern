// src/pages/music/components/GenrePickerChips.jsx
/**
 * Visual genre picker - shows all genres as clickable chips with icons.
 * Select up to MAX_GENRES (4). Fetches genres from /api/music/genres.
 *
 * FIX: Any previously-selected genres that aren't in the fetched list
 * are appended so they always render and can be deselected.
 */
import { useEffect, useState } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
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
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

function getGenreIcon(genre) {
    const g = String(genre || "").toLowerCase().trim();
    if (g.includes("rock") || g.includes("metal") || g.includes("punk") || g.includes("grunge")) return BoltRoundedIcon;
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
    if (g.includes("soundtrack") || g.includes("score") || g.includes("film")) return QueueMusicRoundedIcon;
    if (g.includes("new age") || g.includes("meditation") || g.includes("relaxation")) return SelfImprovementRoundedIcon;
    if (g.includes("opera")) return LibraryMusicRoundedIcon;
    if (g.includes("other")) return MoreHorizRoundedIcon;
    return MusicNoteRoundedIcon;
}

const MAX_GENRES = 4;

/**
 * @param {Object} props
 * @param {string[]} props.selected  - Currently selected genre strings
 * @param {(genres: string[]) => void} props.onChange - Called with updated selection
 * @param {number} [props.max]  - Max selectable (default 4)
 */
export default function GenrePickerChips({ selected = [], onChange, max = MAX_GENRES }) {
    const [genreOptions, setGenreOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch genre options from the database
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await secureFetch("/api/music/genres", { credentials: "include" });
                if (!res.ok) throw new Error("Could not load genres");
                const data = await res.json();
                const raw = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.genres)
                        ? data.genres
                        : [];
                const genres = raw
                    .map((g) => (typeof g === "string" ? g : g?.label || g?.name || g?.genre || ""))
                    .filter(Boolean);
                if (!cancelled) setGenreOptions(genres);
            } catch {
                if (!cancelled) setError("Could not load genres.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Merge fetched options with any previously-selected genres that aren't in the list.
    // This ensures genres like "Other" can always be deselected even if the API
    // doesn't return them (or returns them under a different key/shape).
    const allGenres = (() => {
        const set = new Set(genreOptions);
        const merged = [...genreOptions];
        for (const g of selected) {
            if (g && !set.has(g)) {
                merged.push(g);
            }
        }
        return merged;
    })();

    const handleToggle = (genre) => {
        const isSelected = selected.includes(genre);
        if (isSelected) {
            onChange(selected.filter((g) => g !== genre));
        } else if (selected.length < max) {
            onChange([...selected, genre]);
        }
    };

    const atLimit = selected.length >= max;

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Loading genres…</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5, fontWeight: 600 }}>
                Select up to {max} genres ({selected.length}/{max} selected)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {allGenres.map((genre) => {
                    const IconComp = getGenreIcon(genre);
                    const isSelected = selected.includes(genre);
                    const isDisabled = !isSelected && atLimit;

                    return (
                        <Chip
                            key={genre}
                            icon={<IconComp sx={{ fontSize: "16px !important" }} />}
                            label={genre}
                            clickable={!isDisabled}
                            onClick={() => !isDisabled && handleToggle(genre)}
                            sx={(t) => ({
                                borderRadius: 2,
                                fontWeight: isSelected ? 800 : 600,
                                fontSize: "0.8rem",
                                height: 34,
                                border: "1.5px solid",
                                borderColor: isSelected
                                    ? alpha(t.palette.primary.main, 0.5)
                                    : alpha(t.palette.text.primary, 0.12),
                                bgcolor: isSelected
                                    ? alpha(t.palette.primary.main, 0.12)
                                    : "transparent",
                                color: isSelected
                                    ? t.palette.primary.dark
                                    : isDisabled
                                        ? t.palette.text.disabled
                                        : t.palette.text.primary,
                                opacity: isDisabled ? 0.45 : 1,
                                cursor: isDisabled ? "default" : "pointer",
                                transition: "all 150ms ease",
                                "& .MuiChip-icon": {
                                    color: isSelected
                                        ? t.palette.primary.main
                                        : isDisabled
                                            ? t.palette.text.disabled
                                            : t.palette.text.secondary,
                                },
                                "&:hover": isDisabled
                                    ? {}
                                    : {
                                        bgcolor: isSelected
                                            ? alpha(t.palette.primary.main, 0.18)
                                            : alpha(t.palette.primary.main, 0.06),
                                        borderColor: alpha(t.palette.primary.main, 0.35),
                                    },
                            })}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

// Export the icon helper for reuse
export { getGenreIcon, MAX_GENRES };

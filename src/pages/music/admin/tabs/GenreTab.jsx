// src/pages/music/admin/tabs/GenreTab.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Alert, Box, Chip, Typography } from "@mui/material";

import { updateArtist } from "../../api/artists";
import GenrePickerChips from "../../components/GenrePickerChips";
import { ART_CATEGORIES, getCategoryIcon } from "../../utils/artistCategoryIcons";

const MAX_GENRES = 3;

// Visual-artist category list is sourced from utils/artistCategoryIcons so
// the picker, directory cards, detail panel, and filter all agree on the
// same canonical set. Do not duplicate the list here.

/**
 * Simple chip picker for visual-artist categories.
 * Mirrors the visual style of GenrePickerChips without needing to fetch
 * from the backend. Toggles selection up to `max`.
 */
function ArtCategoryChips({ selected, onChange, max }) {
    const isSelected = (c) => selected.includes(c);

    const toggle = (category) => {
        if (isSelected(category)) {
            onChange(selected.filter((c) => c !== category));
            return;
        }
        if (selected.length >= max) return; // silently block past the cap
        onChange([...selected, category]);
    };

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {ART_CATEGORIES.map((category) => {
                const active = isSelected(category);
                const disabled = !active && selected.length >= max;
                const CategoryIcon = getCategoryIcon(category);
                return (
                    <Chip
                        key={category}
                        label={category}
                        icon={<CategoryIcon sx={{ fontSize: "16px !important" }} />}
                        clickable={!disabled}
                        onClick={() => !disabled && toggle(category)}
                        variant={active ? "filled" : "outlined"}
                        color={active ? "primary" : "default"}
                        sx={{
                            fontWeight: active ? 700 : 500,
                            opacity: disabled ? 0.45 : 1,
                            cursor: disabled ? "not-allowed" : "pointer",
                        }}
                    />
                );
            })}
        </Box>
    );
}

/**
 * GenresTab
 * Musicians: visual genre picker using shared GenrePickerChips (DB-backed list).
 * Visual artists: hardcoded art-category picker above.
 * Both persist to `genres_json` on music_artists.
 */
export default function GenresTab({
                                      artist,
                                      onRefresh,
                                      onSaveToast,
                                      registerSaveHandler,
                                      onFieldChange,
                                      registerDataCollector,
                                  }) {
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [originalGenres, setOriginalGenres] = useState([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Determine profile type once; drives label/helper/picker choice.
    const isVisualArtist = useMemo(() => {
        const t = String(artist?.profile_type || artist?.profileType || "").toLowerCase();
        return t === "artist";
    }, [artist]);

    // Keep a ref to current genres so the data collector always reads the latest
    const currentGenresRef = useRef([]);
    currentGenresRef.current = selectedGenres;

    // Register data collector so parent can read current genres on save
    useEffect(() => {
        if (typeof registerDataCollector !== "function") return undefined;
        return registerDataCollector("genres", () => ({ genres: currentGenresRef.current }));
    }, [registerDataCollector]);

    useEffect(() => {
        if (!artist) return;
        const genres = Array.isArray(artist.genres) ? artist.genres : [];
        setSelectedGenres(genres);
        setOriginalGenres(genres);
        setError("");
        setSuccess("");
    }, [artist]);

    const hasChanges =
        JSON.stringify(selectedGenres.slice().sort()) !==
        JSON.stringify(originalGenres.slice().sort());

    // Report changes to parent for live preview (deduped)
    const prevGenresRef = useRef("");

    useEffect(() => {
        if (typeof onFieldChange !== "function") return;
        const key = JSON.stringify(selectedGenres);
        if (key === prevGenresRef.current) return;
        prevGenresRef.current = key;
        onFieldChange({ genres: selectedGenres });
    });

    const handleSave = useCallback(async () => {
        setError("");
        setSuccess("");

        if (selectedGenres.length === 0) {
            setError(isVisualArtist
                ? "Please select at least one art category."
                : "Please select at least one genre.");
            return false;
        }

        setSaving(true);

        try {
            await updateArtist({
                artistId: artist.id,
                payload: {
                    // Send BOTH keys so it works regardless of which backend route handles it
                    genres: selectedGenres,
                    genres_json: selectedGenres,
                },
            });

            const successMsg = isVisualArtist
                ? "Art categories updated successfully!"
                : "Genres updated successfully!";
            setSuccess(successMsg);
            setOriginalGenres(selectedGenres);

            if (typeof onRefresh === "function") await onRefresh();
            if (typeof onSaveToast === "function") onSaveToast(successMsg);

            return true;
        } catch (err) {
            const msg = err instanceof Error
                ? err.message
                : (isVisualArtist ? "Could not save art categories." : "Could not save genres.");
            setError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [artist, selectedGenres, isVisualArtist, onRefresh, onSaveToast]);

    useEffect(() => {
        if (typeof registerSaveHandler !== "function") return undefined;
        return registerSaveHandler({
            key: "genres",
            save: handleSave,
            hasChanges,
            saving,
        });
    }, [registerSaveHandler, handleSave, hasChanges, saving]);

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
                    {isVisualArtist
                        ? `Select up to ${MAX_GENRES} categories that best describe your art. This helps collectors discover you.`
                        : `Select up to ${MAX_GENRES} genres that best describe your music. This helps fans discover you.`}
                </Typography>
            </Box>

            <Box
                sx={{
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    p: { xs: 2, md: 3 },
                }}
            >
                {isVisualArtist ? (
                    <ArtCategoryChips
                        selected={selectedGenres}
                        onChange={setSelectedGenres}
                        max={MAX_GENRES}
                    />
                ) : (
                    <GenrePickerChips
                        selected={selectedGenres}
                        onChange={setSelectedGenres}
                        max={MAX_GENRES}
                    />
                )}
            </Box>
        </Box>
    );
}

import React, { useEffect } from "react";
import ArtistsDirectory from "./ArtistsDirectory";
import useArtistsDirectoryApi from "../hooks/useArtistsDirectoryApi";

/**
 * ArtistsDirectoryContainer
 * - Thin container: data + handlers, renders ArtistsDirectory UI component
 * - Accepts external filter values (from MusicPage)
 * - Supports right-panel preview selection via onSelectArtist
 * - Emits stats for footer ("Displaying X out of Y") via onStatsChange
 *
 * Intended location:
 *   src/pages/music/components/ArtistsDirectoryContainer.jsx
 */

export default function ArtistsDirectoryContainer({
                                                      defaultAvatarSrc = "",
                                                      query = "",
                                                      city = "",
                                                      county = "",
                                                      genre = "",
                                                      view = "all",
                                                      // Profile-type scope — "music" (musicians) or "artist" (visual artists).
                                                      // Forwarded to the hook so the /api/music/artists request gets the
                                                      // right ?type=... param. Without this, both tabs on MusicPage render
                                                      // the same mixed list.
                                                      type = "",
                                                      onSelectArtist,
                                                      selectedArtistId,
                                                      onStatsChange,
                                                      refreshKey = 0,
                                                  }) {
    const { artists, totalCount, loading, error, setQuery, setCity, setCounty, setGenre, setView } =
        useArtistsDirectoryApi({ refreshKey, type });

    // Keep hook filters in sync with external props (MusicPage filters)
    useEffect(() => {
        setQuery(query || "");
    }, [query, setQuery]);

    useEffect(() => {
        setCity(city || "");
    }, [city, setCity]);

    useEffect(() => {
        setCounty(county || "");
    }, [county, setCounty]);

    useEffect(() => {
        setGenre(genre || "");
    }, [genre, setGenre]);

    useEffect(() => {
        setView(view || "all");
    }, [view, setView]);

    // Emit list stats upward for MusicPage footer
    useEffect(() => {
        if (!onStatsChange) return;

        onStatsChange({
            shown: Array.isArray(artists) ? artists.length : 0,
            total: Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0,
            loading: Boolean(loading),
        });
    }, [artists, totalCount, loading, onStatsChange]);

    const handleOpenArtist = (artist) => {
        if (onSelectArtist) onSelectArtist(artist);
    };

    return (
        <ArtistsDirectory
            artists={artists}
            loading={loading}
            error={error}
            defaultAvatarSrc={defaultAvatarSrc}
            onOpenArtist={handleOpenArtist}
            selectedArtistId={selectedArtistId}
        />
    );
}
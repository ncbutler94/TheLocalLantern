import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import { getArtist } from "./api/artists";
import { useActiveAccount } from "../../components/AccountContext";
import ArtistProfilePage from "./pages/ArtistProfilePage";

/**
 * ArtistProfileRoute
 * - Loads an artist by :handle (or id) and renders ArtistProfilePage
 * - Keeps data loading out of the presentation component
 *
 * Intended location:
 *   src/pages/music/ArtistProfileRoute.jsx
 */

export default function ArtistProfileRoute({ defaultAvatarSrc = "", defaultCoverSrc = "" }) {
    const { handle } = useParams();
    const { accountCacheKey } = useActiveAccount();

    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        (async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getArtist({ handle });
                if (!active) return;
                setArtist(data);
                setLoading(false);
            } catch (e) {
                if (!active) return;
                const msg = e instanceof Error ? e.message : "Could not load artist.";
                setError(msg);
                setArtist(null);
                setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [handle, accountCacheKey]);

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 3,
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <ArtistProfilePage
            artist={artist}
            defaultAvatarSrc={defaultAvatarSrc}
            defaultCoverSrc={defaultCoverSrc}
        />
    );
}

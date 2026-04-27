// src/components/TenorGifPicker.jsx
//
// Searchable Tenor GIF picker rendered inside a Popover.
// Uses VITE_TENOR_API_KEY from env.
// Calls onSelect(gifUrl) when a GIF is picked.

import React, { useEffect, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    Box,
    CircularProgress,
    IconButton,
    InputAdornment,
    Popover,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import GifBoxRoundedIcon from "@mui/icons-material/GifBoxRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY || "";
const TENOR_SEARCH_URL = "https://tenor.googleapis.com/v2/search";
const TENOR_FEATURED_URL = "https://tenor.googleapis.com/v2/featured";
const RESULT_LIMIT = 20;

function pickGifUrl(result) {
    // Prefer tinygif for small file sizes, fall back to gif
    const tiny = result?.media_formats?.tinygif?.url;
    if (tiny) return tiny;
    const gif = result?.media_formats?.gif?.url;
    if (gif) return gif;
    const med = result?.media_formats?.mediumgif?.url;
    if (med) return med;
    return "";
}

function pickPreviewUrl(result) {
    const nano = result?.media_formats?.nanogif?.url;
    if (nano) return nano;
    return pickGifUrl(result);
}

export default function TenorGifPicker({ onSelect, disabled = false }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const open = Boolean(anchorEl);

    const handleOpen = (e) => {
        if (!TENOR_API_KEY) return;
        setAnchorEl(e.currentTarget);
        // Load featured on open if no query
        if (!query.trim()) loadFeatured();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const loadFeatured = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ key: TENOR_API_KEY, limit: String(RESULT_LIMIT), client_key: "local_lantern" });
            const res = await fetch(`${TENOR_FEATURED_URL}?${params}`);
            const data = await res.json();
            setResults(Array.isArray(data?.results) ? data.results : []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (q) => {
        if (!q.trim()) {
            loadFeatured();
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ key: TENOR_API_KEY, q: q.trim(), limit: String(RESULT_LIMIT), client_key: "local_lantern" });
            const res = await fetch(`${TENOR_SEARCH_URL}?${params}`);
            const data = await res.json();
            setResults(Array.isArray(data?.results) ? data.results : []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchGifs(query);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, open]);

    const handlePick = (result) => {
        const url = pickGifUrl(result);
        if (url && onSelect) onSelect(url);
        handleClose();
    };

    if (!TENOR_API_KEY) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[TenorGifPicker] Missing REACT_APP_TENOR_API_KEY in .env — GIF button hidden. Restart dev server after adding it.');
        }
        return null;
    }

    return (
        <>
            <Tooltip title="Add GIF" arrow>
                <span>
                    <IconButton
                        size="small"
                        disabled={disabled}
                        onClick={handleOpen}
                        sx={(t) => ({
                            width: 34,
                            height: 34,
                            borderRadius: 1.5,
                            color: open ? t.palette.secondary.main : t.palette.text.secondary,
                            bgcolor: open ? alpha(t.palette.secondary.main, 0.08) : "transparent",
                            "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) },
                        })}
                    >
                        <GifBoxRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                </span>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                slotProps={{
                    paper: {
                        sx: (t) => ({
                            width: 340,
                            maxHeight: 420,
                            borderRadius: `${t.shape.borderRadius + 2}px`,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }),
                    },
                }}
            >
                {/* Search bar */}
                <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search GIFs…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                                endAdornment: query ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setQuery("")}>
                                            <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </Box>

                {/* Results grid */}
                <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : results.length === 0 ? (
                        <Typography variant="body2" sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                            {query.trim() ? "No GIFs found" : "Search for a GIF"}
                        </Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                            {results.map((r) => {
                                const preview = pickPreviewUrl(r);
                                if (!preview) return null;
                                return (
                                    <Box
                                        key={r.id}
                                        onClick={() => handlePick(r)}
                                        sx={(t) => ({
                                            cursor: "pointer",
                                            borderRadius: 1.5,
                                            overflow: "hidden",
                                            aspectRatio: "4/3",
                                            bgcolor: alpha(t.palette.text.primary, 0.04),
                                            "&:hover": { opacity: 0.82 },
                                            transition: "opacity 120ms ease",
                                        })}
                                    >
                                        <img
                                            src={preview}
                                            alt={r.content_description || "GIF"}
                                            loading="lazy"
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>

                {/* Tenor attribution */}
                <Box sx={{ px: 1.5, py: 0.75, borderTop: "1px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06), display: "flex", justifyContent: "flex-end" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10, fontWeight: 600 }}>
                        Powered by Tenor
                    </Typography>
                </Box>
            </Popover>
        </>
    );
}

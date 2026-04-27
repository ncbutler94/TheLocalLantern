// src/components/NetworkErrorState.jsx
import React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

/**
 * Checks whether an error object represents a network / connectivity failure
 * (backend offline, no internet, DNS failure, etc.) as opposed to a server-side
 * application error (4xx / 5xx with a JSON body).
 */
export function isNetworkError(error) {
    if (!error) return false;

    // Check the error itself AND any nested cause
    const msg = String(error.message || error || "").toLowerCase();
    const causeMsg = String(error?.cause?.message || "").toLowerCase();
    const combined = `${msg} ${causeMsg}`;

    return (
        combined.includes("failed to fetch") ||
        combined.includes("networkerror") ||
        combined.includes("network error") ||
        combined.includes("network request failed") ||
        combined.includes("err_connection_refused") ||
        combined.includes("err_connection_reset") ||
        combined.includes("err_internet_disconnected") ||
        combined.includes("err_name_not_resolved") ||
        combined.includes("load failed") ||
        combined.includes("timeout") ||
        combined.includes("econnrefused") ||
        combined.includes("enotfound") ||
        combined.includes("error occurred while trying to proxy") ||
        combined.includes("proxy error") ||
        combined.includes("failed to load") ||
        combined.includes("request failed") ||
        msg === "failed to fetch"
    );
}

/**
 * NetworkErrorState
 *
 * A friendly, centered empty-state shown when the backend can't be reached.
 * Drop this in wherever the list/grid of cards would normally render.
 *
 * Props:
 * - onRetry?: () => void — optional retry callback (shows a Retry button)
 * - message?: string     — override the subtitle text
 */
export default function NetworkErrorState({ onRetry, message }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                flex: 1,
                minHeight: 0,
                height: "100%",
                py: 6,
                px: 2,
            }}
        >
            <Stack spacing={1.5} alignItems="center">
                <Box
                    sx={(t) => ({
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        bgcolor: alpha(t.palette.warning.main, 0.10),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 0.5,
                    })}
                >
                    <WifiOffRoundedIcon
                        sx={(t) => ({
                            fontSize: 42,
                            color: alpha(t.palette.warning.dark, 0.78),
                        })}
                    />
                </Box>

                <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                    Couldn't Connect
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", maxWidth: 360, lineHeight: 1.6 }}
                >
                    {message ||
                        "The Local Lantern is currently offline. Please check your connection and try again in a moment."}
                </Typography>

                {typeof onRetry === "function" && (
                    <Button
                        variant="outlined"
                        startIcon={<RefreshRoundedIcon />}
                        onClick={onRetry}
                        sx={(t) => ({
                            mt: 1,
                            borderRadius: 999,
                            textTransform: "none",
                            fontWeight: 800,
                            fontSize: 14,
                            px: 2.5,
                            py: 0.75,
                            borderColor: alpha(t.palette.primary.main, 0.3),
                            "&:hover": {
                                borderColor: alpha(t.palette.primary.main, 0.5),
                                bgcolor: alpha(t.palette.primary.main, 0.04),
                            },
                        })}
                    >
                        Try Again
                    </Button>
                )}
            </Stack>
        </Box>
    );
}

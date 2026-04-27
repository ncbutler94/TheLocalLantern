// src/pages/music/AcceptArtistInvitePage.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LoginIcon from "@mui/icons-material/Login";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography,
} from "@mui/material";

import { acceptArtistInvite } from "./api/artists";

/**
 * AcceptArtistInvitePage
 *
 * Route: /music/artists/invite/:token
 *
 * Handles accepting team invites via shareable links.
 * - If user is logged in: attempts to accept the invite
 * - If user is not logged in: prompts them to log in first
 */
export default function AcceptArtistInvitePage({ user, onRequireAuth }) {
    const { token } = useParams();
    const navigate = useNavigate();

    const isLoggedIn = Boolean(user?.id || user?.user_id);

    const [status, setStatus] = useState("loading"); // loading | success | error | login_required
    const [message, setMessage] = useState("");
    const [artistId, setArtistId] = useState(null);
    const [artistName, setArtistName] = useState("");

    // Attempt to accept invite
    const handleAccept = useCallback(async () => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid invite link.");
            return;
        }

        if (!isLoggedIn) {
            setStatus("login_required");
            return;
        }

        setStatus("loading");

        try {
            const result = await acceptArtistInvite({ token });

            if (result.alreadyMember) {
                setStatus("success");
                setMessage("You're already a member of this team!");
                setArtistId(result.artistId);
            } else {
                setStatus("success");
                setMessage(result.message || "You've successfully joined the team!");
                setArtistId(result.artistId);
            }
        } catch (err) {
            setStatus("error");
            setMessage(err.message || "Failed to accept invite. The link may be invalid or expired.");
        }
    }, [token, isLoggedIn]);

    // Auto-accept on mount if logged in
    useEffect(() => {
        if (isLoggedIn) {
            handleAccept();
        } else {
            setStatus("login_required");
        }
    }, [isLoggedIn, handleAccept]);

    // Handle login redirect
    const handleLogin = useCallback(() => {
        // Store the current URL to redirect back after login
        const returnUrl = window.location.pathname;
        sessionStorage.setItem("authReturnUrl", returnUrl);

        if (typeof onRequireAuth === "function") {
            onRequireAuth();
        } else {
            // Fallback: redirect to login page
            navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }
    }, [navigate, onRequireAuth]);

    // Navigate to artist admin console
    const goToArtist = useCallback(() => {
        if (artistId) {
            navigate(`/music/artists/${artistId}/admin?tab=team`);
        } else {
            navigate("/music/artists");
        }
    }, [navigate, artistId]);

    return (
        <Box
            sx={{
                minHeight: "70vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
            }}
        >
            <Box
                sx={{
                    maxWidth: 480,
                    width: "100%",
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    p: { xs: 3, sm: 4 },
                    textAlign: "center",
                }}
            >
                {/* Loading State */}
                {status === "loading" && (
                    <>
                        <CircularProgress size={48} sx={{ mb: 3 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                            Processing invite...
                        </Typography>
                        <Typography sx={{ color: "text.secondary", mt: 1 }}>
                            Please wait while we verify your invitation.
                        </Typography>
                    </>
                )}

                {/* Success State */}
                {status === "success" && (
                    <>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: "success.50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 1 }}>
                            Welcome to the team!
                        </Typography>
                        <Typography sx={{ color: "text.secondary", mb: 3 }}>
                            {message}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={goToArtist}
                            sx={{
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 700,
                                minWidth: 200,
                            }}
                        >
                            Go to Artist Dashboard
                        </Button>
                    </>
                )}

                {/* Error State */}
                {status === "error" && (
                    <>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: "error.50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 1 }}>
                            Invite Not Found
                        </Typography>
                        <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                            {message}
                        </Alert>
                        <Typography sx={{ color: "text.secondary", mb: 3, fontSize: 14 }}>
                            The invite link may have expired or already been used.
                            Please ask the artist owner to send a new invite.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/music/artists")}
                            sx={{
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            Browse Artists
                        </Button>
                    </>
                )}

                {/* Login Required State */}
                {status === "login_required" && (
                    <>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: "primary.50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <GroupAddIcon sx={{ fontSize: 48, color: "primary.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 1 }}>
                            You've Been Invited!
                        </Typography>
                        <Typography sx={{ color: "text.secondary", mb: 3 }}>
                            You've been invited to join an artist team on Local Lantern.
                            Please log in or create an account to accept this invitation.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<LoginIcon />}
                            onClick={handleLogin}
                            sx={{
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 700,
                                minWidth: 200,
                            }}
                        >
                            Log In to Accept
                        </Button>
                        <Typography sx={{ color: "text.disabled", fontSize: 12, mt: 2 }}>
                            Don't have an account? You can create one after clicking the button.
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}

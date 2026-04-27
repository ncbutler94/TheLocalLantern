import React from "react";
import { Button, Typography, Stack } from "@mui/material";

/**
 * ServicesAuthGate
 *
 * Lightweight, non-opinionated auth gate for Services.
 * - If authenticated: renders primary action
 * - If not: calls onRequireAuth (login modal, redirect, etc.)
 *
 * This avoids coupling Services to any specific auth implementation.
 */

export default function ServicesAuthGate({
                                             isAuthenticated,
                                             onRequireAuth,
                                             onAllowed,
                                             label = "Offer a service",
                                         }) {
    if (isAuthenticated) {
        return (
            <Button variant="contained" fullWidth onClick={onAllowed}>
                {label}
            </Button>
        );
    }

    return (
        <Stack spacing={0.5}>
            <Button variant="contained" fullWidth onClick={onRequireAuth}>
                {label}
            </Button>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Sign in to create and manage service profiles.
            </Typography>
        </Stack>
    );
}

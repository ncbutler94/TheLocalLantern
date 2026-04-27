import React, { useEffect, useState } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useActiveAccount } from "../../../components/AccountContext";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { secureFetch } from "../../../utils/secureFetch";

/**
 * NewReleasesPanel
 * - Placeholder "real" widget
 * - For now: fetches newest artists as a stand-in until music posts/releases exist.
 *
 * Intended location:
 *   src/pages/music/components/NewReleasesPanel.jsx
 */

export default function NewReleasesPanel() {
    const { accountCacheKey } = useActiveAccount();
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const res = await secureFetch("/api/music/artists?limit=4", {
                    credentials: "include",
                    headers: { ...getAccountHeaders() },
                });
                const data = await res.json();
                if (!active) return;

                const list = Array.isArray(data?.items) ? data.items : [];
                setItems(list);
            } catch (e) {
                if (!active) return;
                setError("Could not load new releases.");
                setItems([]);
            }
        })();

        return () => {
            active = false;
        };
    }, [accountCacheKey]);

    if (error) {
        return (
            <Typography variant="body2" color="text.secondary">
                {error}
            </Typography>
        );
    }

    return (
        <Stack spacing={1.25}>
            {items.map((a) => (
                <Paper
                    key={a.id || a.handle}
                    elevation={0}
                    sx={(t) => ({
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: t.palette.divider,
                        p: 1.25,
                        backgroundColor: alpha(t.palette.background.paper, 0.92),
                    })}
                >
                    <Typography sx={{ fontWeight: 900 }} noWrap>
                        {a.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        @{a.handle}
                    </Typography>
                </Paper>
            ))}
            {!items.length ? (
                <Box
                    sx={(t) => ({
                        height: 44,
                        borderRadius: 2,
                        backgroundColor: alpha(t.palette.text.primary, 0.06),
                    })}
                />
            ) : null}
        </Stack>
    );
}

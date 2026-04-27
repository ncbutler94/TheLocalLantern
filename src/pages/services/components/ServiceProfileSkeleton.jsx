import React from "react";
import { Box, Paper, Skeleton, Stack } from "@mui/material";

export default function ServiceProfileSkeleton() {
    return (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid", borderColor: "divider",
                        backgroundImage: "none",
                    }}
                >
                    <Stack spacing={1}>
                        <Skeleton variant="text" height={34} width={260} />
                        <Skeleton variant="text" height={20} width={220} />
                        <Skeleton variant="text" height={20} width={180} />
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid", borderColor: "divider",
                        backgroundImage: "none",
                    }}
                >
                    <Stack spacing={1}>
                        <Skeleton variant="text" height={26} width={120} />
                        <Skeleton variant="text" height={20} />
                        <Skeleton variant="text" height={20} width="85%" />
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid", borderColor: "divider",
                        backgroundImage: "none",
                    }}
                >
                    <Stack spacing={1}>
                        <Skeleton variant="text" height={26} width={120} />
                        <Skeleton variant="rounded" height={36} />
                        <Skeleton variant="rounded" height={36} />
                        <Skeleton variant="rounded" height={36} />
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
}

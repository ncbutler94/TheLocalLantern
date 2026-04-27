import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

/**
 * ServicesSkeletons
 * Matches Community list skeleton cards:
 * - Flat container (no Paper)
 * - Same spacing + rhythm as ServiceCard
 */

export default function ServicesSkeletons({ count = 6 }) {
    return (
        <Stack spacing={1}>
            {Array.from({ length: count }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box
                    key={idx}
                    sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                    }}
                >
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Skeleton variant="rounded" width={90} height={26} />
                            <Skeleton variant="rounded" width={70} height={26} />
                            <Box sx={{ flex: 1 }} />
                            <Skeleton variant="text" width={120} height={20} />
                        </Stack>

                        <Skeleton variant="text" height={28} />
                        <Skeleton variant="text" height={20} />
                        <Skeleton variant="text" height={20} width="85%" />

                        <Skeleton variant="text" height={18} width={180} />
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
}

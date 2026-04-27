// src/pages/community/groups/components/admin/GroupAdminShared.jsx
import React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export function StatPill({ label, value, icon }) {
    return (
        <Box
            sx={(t) => ({
                px: 1,
                py: 0.5,
                borderRadius: 999,
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.14),
                bgcolor: alpha(t.palette.common.white, 0.8),
                backdropFilter: "saturate(160%) blur(10px)",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                height: 30,
            })}
        >
            {icon ? (
                <Box
                    sx={(t) => ({
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        border: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        flex: "0 0 auto",
                    })}
                >
                    {icon}
                </Box>
            ) : null}

            <Typography sx={{ fontWeight: 1000, fontSize: 12.5, lineHeight: 1 }} noWrap>
                {value}
            </Typography>

            {label ? (
                <Typography sx={{ fontWeight: 900, fontSize: 11.25, opacity: 0.7 }} noWrap>
                    {label}
                </Typography>
            ) : null}
        </Box>
    );
}

export function EmptyState({ icon, title, description }) {
    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                borderRadius: 4,
                p: { xs: 1.75, sm: 2.25 },
                borderStyle: "dashed",
                borderColor: alpha(t.palette.primary.main, 0.18),
                bgcolor: alpha(t.palette.primary.main, 0.04),
            })}
        >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                    sx={(t) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(t.palette.primary.main, 0.1),
                        border: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.18),
                        flex: "0 0 auto",
                    })}
                >
                    {icon}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 1000, fontSize: 14.25, lineHeight: 1.15 }}>{title}</Typography>
                    {description ? (
                        <Typography sx={{ opacity: 0.74, fontWeight: 850, fontSize: 12.75, mt: 0.25 }}>{description}</Typography>
                    ) : null}
                </Box>
            </Stack>
        </Paper>
    );
}

export function SectionShell({
                                 title,
                                 subtitle,
                                 icon,
                                 action,
                                 headerMiddle,
                                 banner,
                                 busy,
                                 children,
                                 tone,
                                 sx = {},
                                 scrollable = false,
                                 headerAlign = "flex-start",
                             }) {
    const resolvedSx = (t) => (typeof sx === "function" ? sx(t) : sx);

    const toneSx = (t) => {
        if (tone === "danger") {
            return {
                background: `linear-gradient(180deg, ${alpha(t.palette.error.main, 0.08)} 0%, ${alpha(t.palette.background.paper, 0.92)} 58%)`,
                borderColor: alpha(t.palette.error.main, 0.18),
            };
        }
        return {
            background: alpha(t.palette.background.paper, 0.92),
            borderColor: t.palette.divider,
        };
    };

    return (
        <Card
            elevation={0}
            sx={(t) => ({
                borderRadius: { xs: 3, md: 5 },
                border: "1px solid",
                ...toneSx(t),
                overflow: "hidden",
                boxShadow: t.shadows[1],
                "&:hover": { transform: "none" },
                ...(resolvedSx(t) || {}),
            })}
        >
            <CardContent
                sx={{
                    p: { xs: 1.5, sm: 2, md: 2.25 },
                    display: scrollable ? "flex" : "block",
                    flexDirection: scrollable ? "column" : undefined,
                    height: scrollable ? "100%" : undefined,
                    minHeight: scrollable ? 0 : undefined,
                }}
            >
                <Stack
                    direction="row"
                    alignItems={headerAlign}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ flexWrap: "wrap", rowGap: 1, columnGap: 1.5 }}
                >
                    <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, flex: "0 1 auto" }} alignItems={headerAlign}>
                        <Box
                            sx={(t) => ({
                                width: 38,
                                height: 38,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.18),
                                flex: "0 0 auto",
                            })}
                        >
                            {icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 1100, fontSize: 16.25, lineHeight: 1.15 }} noWrap>
                                {title}
                            </Typography>
                            {subtitle ? (
                                <Typography sx={{ opacity: 0.74, fontWeight: 850, fontSize: 12.75 }} noWrap>
                                    {subtitle}
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>

                    {headerMiddle ? (
                        <Box
                            sx={{
                                flex: { xs: "1 1 100%", sm: "1 1 520px" },
                                minWidth: 0,
                                display: "flex",
                                justifyContent: "center",
                                order: { xs: 3, sm: 2 },
                            }}
                        >
                            {headerMiddle}
                        </Box>
                    ) : null}

                    {action ? <Box sx={{ flex: "0 0 auto", order: { xs: 2, sm: 3 } }}>{action}</Box> : null}
                </Stack>

                {banner ? <Box sx={{ mt: 0.25 }}>{banner}</Box> : null}

                <Divider sx={{ my: 1.5, opacity: 0.65 }} />

                {scrollable ? <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</Box> : children}
            </CardContent>

            {busy ? <LinearProgress /> : null}
        </Card>
    );
}

export function ConfirmDialog({
                                  open,
                                  title,
                                  description,
                                  confirmText,
                                  confirmColor,
                                  busy,
                                  onClose,
                                  onConfirm,
                              }) {
    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs"
                transitionDuration={{ enter: 220, exit: 180 }}
                PaperProps={{ sx: { borderRadius: { xs: 2.5, sm: 2 }, mx: { xs: 2, sm: 'auto' } } }}>
            <DialogTitle sx={{ fontWeight: 1050 }}>{title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ opacity: 0.86, fontWeight: 800, fontSize: 13.5 }}>{description}</Typography>
            </DialogContent>
            {busy ? <LinearProgress /> : null}
            <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={busy} variant="outlined" sx={{ borderRadius: 999, fontWeight: 900 }}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={busy}
                    variant="contained"
                    color={confirmColor || "primary"}
                    sx={{ borderRadius: 999, fontWeight: 950 }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

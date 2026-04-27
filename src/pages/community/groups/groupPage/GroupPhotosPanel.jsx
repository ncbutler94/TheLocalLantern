import { useMemo, useState } from "react";
import { Box, Dialog, IconButton, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import CloseIcon from "@mui/icons-material/Close";

function SectionHeader({ icon, title }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box
                sx={(t) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 1.75,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                })}
            >
                {icon}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.01em" }}>
                {title}
            </Typography>
        </Box>
    );
}

function PhotoThumb({ src, onClick }) {
    const [fitMode, setFitMode] = useState("cover");
    const [objectPosition, setObjectPosition] = useState("center");

    const handleLoad = (e) => {
        const img = e.currentTarget;
        const w = img?.naturalWidth || 0;
        const h = img?.naturalHeight || 0;
        if (!w || !h) return;
        const ratio = w / h;
        if (ratio < 0.72 || ratio > 1.85) {
            setFitMode("contain");
            setObjectPosition("center");
            return;
        }
        setFitMode("cover");
        setObjectPosition(ratio < 0.95 ? "center 20%" : "center");
    };

    return (
        <Box
            onClick={onClick}
            sx={(t) => ({
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: { xs: 1.5, sm: 2.5 },
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid",
                borderColor: alpha(t.palette.divider, 0.08),
                transition: "all 200ms ease",
                bgcolor: "background.paper",
                position: "relative",
                "&:hover": {
                    transform: { xs: 'none', sm: "translateY(-2px)" },
                    boxShadow: { xs: 'none', sm: `0 6px 20px ${alpha(t.palette.common.black, 0.1)}` },
                    borderColor: alpha(t.palette.primary.main, 0.15),
                },
            })}
        >
            <Box
                component="img"
                src={src}
                alt="Group photo"
                loading="lazy"
                onLoad={handleLoad}
                sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: fitMode,
                    objectPosition,
                    display: "block",
                }}
            />
        </Box>
    );
}

export default function GroupPhotosPanel({ group }) {
    const [openPhoto, setOpenPhoto] = useState(null);

    const photoUrls = useMemo(() => {
        const raw = Array.isArray(group?.photos) ? group.photos : [];
        return raw
            .map((p) => {
                if (!p) return "";
                if (typeof p === "string") return p.trim();
                if (typeof p === "object" && typeof p.url === "string") return p.url.trim();
                return "";
            })
            .filter((u) => {
                const s = String(u || "").trim();
                if (!s) return false;
                const lower = s.toLowerCase();
                return lower !== "null" && lower !== "undefined";
            });
    }, [group?.photos]);

    if (!group || !photoUrls.length) {
        return (
            <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 3, sm: 4 }, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 700, opacity: 0.5 }}>No photos have been added yet.</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                px: { xs: 0, sm: 2.5 },
                py: { xs: 0, sm: 2.5 },
            }}
        >
            <Paper
                elevation={0}
                sx={(t) => ({
                    p: { xs: 1.5, sm: 2.75 },
                    borderRadius: { xs: 0, sm: 3 },
                    border: { xs: 'none', sm: "1px solid" },
                    borderBottom: { xs: '1px solid', sm: "1px solid" },
                    borderColor: alpha(t.palette.divider, 0.08),
                    bgcolor: "background.paper",
                })}
            >
                <SectionHeader icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 17 }} />} title="Photos" />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(3, 1fr)",
                            sm: "repeat(3, 1fr)",
                            md: "repeat(4, 1fr)",
                        },
                        gap: { xs: 0.5, sm: 1.5 },
                    }}
                >
                    {photoUrls.map((url) => (
                        <PhotoThumb key={url} src={url} onClick={() => setOpenPhoto(url)} />
                    ))}
                </Box>
            </Paper>

            {/* Lightbox */}
            <Dialog
                open={Boolean(openPhoto)}
                onClose={() => setOpenPhoto(null)}
                maxWidth="md"
                fullWidth
                disableScrollLock
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    },
                }}
            >
                <Box
                    sx={(t) => ({
                        bgcolor: "background.paper",
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.divider, 0.06),
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                    })}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.5 }}>
                        Photo preview
                    </Typography>
                    <IconButton
                        onClick={() => setOpenPhoto(null)}
                        aria-label="Close"
                        size="small"
                        sx={(t) => ({
                            width: 32,
                            height: 32,
                            border: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.12),
                            "&:hover": {
                                bgcolor: alpha(t.palette.error.main, 0.06),
                                borderColor: alpha(t.palette.error.main, 0.2),
                            },
                        })}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        bgcolor: "#0a0a0a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: { xs: 1.5, sm: 2 },
                    }}
                >
                    {openPhoto ? (
                        <Box
                            component="img"
                            src={openPhoto}
                            alt="Large view"
                            draggable={false}
                            sx={{
                                width: "100%",
                                height: { xs: "70vh", sm: "75vh" },
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    ) : null}
                </Box>
            </Dialog>
        </Box>
    );
}

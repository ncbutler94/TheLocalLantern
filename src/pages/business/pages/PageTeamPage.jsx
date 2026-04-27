// src/pages/business/pages/PageTeamPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
    Box,
    Button,
    Fade,
    Paper,
    Typography,
} from '@mui/material';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function PageTeamPage() {
    const navigate = useNavigate();
    const { pageId } = useParams();

    // Subtle mount fade (matches Community page feel)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const pid = useMemo(() => {
        const n = Number(pageId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [pageId]);

    const footerText = useMemo(() => {
        return pid ? `Team · Page #${pid}` : 'Team';
    }, [pid]);

    return (
        <Fade in={pageVisible} timeout={220} appear>
            <Box
                sx={{
                    width: '100%',
                    px: { xs: 1.1, sm: 2 },
                    pt: { xs: 1.1, sm: 2 },
                    pb: { xs: 1.25, sm: 2.5 },
                }}
            >
                <Box
                    sx={{
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                        bgcolor: (t) => alpha(t.palette.common.white, 0.62),
                        backdropFilter: 'saturate(140%) blur(10px)',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        minHeight: 260,
                    }}
                >
                    <Box sx={{ p: { xs: 1.25, sm: 1.75 } }}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackRoundedIcon />}
                            onClick={() => navigate(-1)}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                        >
                            Back
                        </Button>

                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                mt: 1.25,
                                borderRadius: 3,
                                p: 2,
                                borderColor: alpha(t.palette.primary.main, 0.14),
                                bgcolor: alpha(t.palette.background.paper, 0.92),
                                boxShadow: `0 16px 46px ${alpha(t.palette.common.black, 0.08)}`,
                            })}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.75 }}>
                                Page Team
                            </Typography>

                            <Typography color="text.secondary" sx={{ fontWeight: 750 }}>
                                Team management UI will appear here next.
                            </Typography>
                        </Paper>
                    </Box>

                    <Box
                        sx={(t) => ({
                            mt: 'auto',
                            px: 1.25,
                            py: 0.9,
                            borderTop: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            bgcolor: alpha(t.palette.background.paper, 0.92),
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        })}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 850, color: 'text.secondary' }}>
                            {footerText}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Fade>
    );
}

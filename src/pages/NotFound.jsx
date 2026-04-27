// src/pages/NotFound.jsx
import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    const theme = useTheme();

    return (
        <Box
            sx={(t) => ({
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: t.palette.background.default,
                px: 2,
            })}
        >
            <Container
                maxWidth="sm"
                sx={{
                    textAlign: 'center',
                    py: 4,
                }}
            >
                <Typography
                    sx={(t) => ({
                        fontSize: { xs: '3rem', sm: '3.5rem' },
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        mb: 1.5,
                        color: t.palette.text.primary,
                    })}
                >
                    Lost your way?
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        mb: 4,
                        maxWidth: 380,
                        mx: 'auto',
                        lineHeight: 1.6,
                    }}
                >
                    The page you're looking for doesn't seem to exist. It may have been moved, renamed, or removed altogether.
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => navigate('/')}
                    sx={(t) => {
                        const m = t.custom?.motion || {};
                        const sh = t.custom?.shadows || {};
                        return {
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 4,
                            py: 1.2,
                            backgroundColor: t.palette.secondary.main,
                            color: t.palette.secondary.contrastText,
                            boxShadow: sh.xs || t.shadows[2],
                            transition: `background-color ${m.base || 160}ms ${m.ease || 'ease'}, box-shadow ${m.base || 160}ms ${m.ease || 'ease'}`,
                            '&:hover': {
                                backgroundColor: t.palette.secondary.dark,
                                boxShadow: sh.sm || t.shadows[4],
                            },
                        };
                    }}
                >
                    Take me home
                </Button>
            </Container>
        </Box>
    );
}

// src/components/MapErrorBoundary.jsx
// React error boundary for all Leaflet map views.
// Catches the known "_leaflet_pos" crash (and any other render-time errors)
// and shows a friendly retry message instead of a white screen.

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Log for debugging but don't rethrow
        // eslint-disable-next-line no-console
        console.warn('[MapErrorBoundary] Caught error in map view:', error?.message || error, info?.componentStack?.slice(0, 300));
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (t) => t.palette.background.default,
                        zIndex: 10,
                    }}
                >
                    <Box
                        sx={(t) => ({
                            textAlign: 'center',
                            p: 4,
                            maxWidth: 340,
                            borderRadius: 3,
                            bgcolor: alpha(t.palette.background.paper, 0.95),
                            backdropFilter: 'blur(8px)',
                            border: `1px solid ${t.palette.divider}`,
                            boxShadow: `0 8px 32px ${alpha(t.palette.text.primary, 0.08)}`,
                        })}
                    >
                        <ErrorOutlineRoundedIcon
                            sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }}
                        />
                        <Typography
                            sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary', mb: 0.5 }}
                        >
                            Something went wrong with the map
                        </Typography>
                        <Typography
                            sx={{ fontSize: 13, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}
                        >
                            This can happen during rapid zooming or navigation.
                            Give it another try — it usually clears right up.
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={this.handleRetry}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: 13,
                                px: 3,
                                py: 0.75,
                                boxShadow: 'none',
                                '&:hover': { boxShadow: 'none' },
                            }}
                        >
                            Reload Map
                        </Button>
                    </Box>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;

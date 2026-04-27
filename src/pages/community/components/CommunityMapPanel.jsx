import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import CommunityMap from '../CommunityMap';
import MapErrorBoundary from '../MapErrorBoundary';

export default function CommunityMapPanel({
                                              pointsSource,
                                              mapRef,
                                              center,
                                              zoomLevel,
                                              onMarkerClick,
                                              hoveredId,
                                              openedPopupId,
                                              popupContentById,
                                              onPopupClose,
                                              isLoading,
                                          }) {
    return (
        <MapErrorBoundary>
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                }}
            >
                <CommunityMap
                    data={pointsSource}
                    mapRef={mapRef}
                    center={center}
                    zoomLevel={zoomLevel}
                    onMarkerClick={onMarkerClick}
                    hoveredId={hoveredId}
                    openedPopupId={openedPopupId}
                    popupContentById={popupContentById}
                    onPopupClose={onPopupClose}
                />
                {isLoading && (
                    <CircularProgress size={48} sx={{ position: 'absolute', top: 24, left: 24 }} />
                )}
            </Box>
        </MapErrorBoundary>
    );
}

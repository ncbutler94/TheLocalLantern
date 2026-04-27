import React from 'react';
import { Box } from '@mui/material';

import CommunityPanel from '../CommunityPanel';
import ContentFadeIn from '../../../components/ContentFadeIn';

/**
 * CommunityLeftPanel
 * ------------------
 * Pure view wrapper for the left rail.
 *
 * IMPORTANT: Keep ALL state/logic in CommunityPage.
 */
export default function CommunityLeftPanel({ sx, communityPanelProps, fadeKey }) {
    return (
        <Box sx={sx}>
            <ContentFadeIn triggerKey={fadeKey ?? 'left-panel'}>
                <CommunityPanel {...(communityPanelProps || {})} />
            </ContentFadeIn>
        </Box>
    );
}

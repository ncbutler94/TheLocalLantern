// src/pages/social/components/SocialFeedCardWrapper.jsx
//
// SocialFeedCardWrapper
// ---------------------
// Wraps any feed card (post, like, repost) to apply the business-page
// flat-card style on mobile.  Desktop is completely unaffected.
//
// What it does on mobile (xs–sm):
//  • Strips card border, radius, background, shadow via a global sx override
//  • Removes the borderTop line above the action bar (CardActions)
//  • Adds a subtle divider between cards
//
// Usage in a feed list:
//
//   {posts.map((post, idx) => (
//       <SocialFeedCardWrapper key={post.id} index={idx} isMobile={isMobile}>
//           <PostCard post={post} flat={isMobile} ... />
//       </SocialFeedCardWrapper>
//   ))}
//
// The child card should accept a `flat` prop (or you can apply the sx
// overrides from socialMobileCardStyles.js directly on the Card).

import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function SocialFeedCardWrapper({
                                                  children,
                                                  isMobile = false,
                                                  index = 0,
                                                  staggerSx = null,
                                              }) {
    return (
        <Box
            sx={(t) => ({
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                // Mobile: subtle divider between cards (matching BusinessHubPage)
                ...(isMobile
                    ? {
                        borderBottom: `1px solid ${alpha(t.palette.divider, 0.1)}`,
                        '&:last-child': { borderBottom: 'none' },
                    }
                    : {}),
                // Optional stagger animation
                ...(staggerSx || {}),
            })}
        >
            {children}
        </Box>
    );
}

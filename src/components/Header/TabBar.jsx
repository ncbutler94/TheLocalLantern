// src/components/Header/TabBar.jsx
// ---------------------------------------------------------------
// Generic tab bar that now accepts **either** plain strings OR
// objects shaped like { value: string, label: ReactNode }.
// The parent (Header.jsx) can therefore inject icons or other
// rich content into labels without breaking anything.
//
// Update:
// - Treats "no active tab" as a valid state (value=false) so nothing
//   is selected when on non-tabbed routes (e.g., profile pages).
// - Hides the Tabs indicator line entirely when nothing is selected.
// ---------------------------------------------------------------

import React from 'react';
import { alpha } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

/**
 * Extract the tab's unique value (always a string).
 * @param {string|{value:string,label:React.ReactNode}} t
 * @returns {string}
 */
const getValue = (t) => (typeof t === 'string' ? t : t.value);

/**
 * Extract the tab's display label (string or React node).
 * @param {string|{value:string,label:React.ReactNode}} t
 * @returns {React.ReactNode}
 */
const getLabel = (t) => (typeof t === 'string' ? t : t.label);

/**
 * @param {Object}   props
 * @param {Array}    props.tabs        - Array of strings OR {value,label} objects
 * @param {string}   props.activeTab   - The current tab's **value** string
 * @param {Function} props.onTabChange - (newValueString) => void
 */
export default function TabBar({ tabs, activeTab, onTabChange }) {
    // Map the active string value to its index for MUI's <Tabs>
    const activeIndex = tabs.findIndex((t) => getValue(t) === activeTab);
    const noSelection = activeIndex === -1; // when parent intentionally clears activeTab

    // When the user clicks a tab, MUI gives us the new index → resolve to value
    const handleChange = (_event, newIndex) => {
        const tab = tabs[newIndex];
        onTabChange(getValue(tab));
    };

    return (
        <Box sx={{ flexGrow: 1, pt: { xs: 0.75, sm: 1 } }}>
            <Tabs
                // If there's no active tab, set value to `false` (no selection)
                value={noSelection ? false : activeIndex}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Main navigation tabs"
                sx={{
                    minHeight: 0,
                    // Remove underline indicator — pills handle active state.
                    // Belt-and-suspenders: display:none + height:0 in case a
                    // descendant rule re-shows it on iOS WebKit.
                    '& .MuiTabs-indicator': { display: 'none', height: 0 },
                    // Compact scroll buttons
                    '& .MuiTabScrollButton-root': {
                        width: 28,
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                    },
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        // Slightly smaller at md (tablet/small laptop), normal at lg+
                        fontSize: { xs: 13, md: 13, lg: 14 },
                        minHeight: 0,
                        minWidth: 0,
                        // Tighter horizontal padding at md to reclaim row width
                        px: { xs: 1, md: 1, lg: 1.5 },
                        py: 0.75,
                        // Tighter spacing between pills at md
                        mx: { xs: 0.25, md: 0.125, lg: 0.25 },
                        borderRadius: 999,
                        border: '1px solid transparent',
                        color: 'text.secondary',
                        transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                        // Kill the iOS/Android tap highlight box and the
                        // browser's default focus outline that appears on tap.
                        WebkitTapHighlightColor: 'transparent',
                        outline: 'none',
                        '&:focus, &:focus-visible': { outline: 'none' },
                        '&:hover': {
                            bgcolor: (t) => alpha(t.palette.secondary.main, 0.05),
                            color: 'secondary.main',
                        },
                    },
                    '& .Mui-selected': {
                        fontWeight: 800,
                        color: 'secondary.main',
                        bgcolor: (t) => alpha(t.palette.secondary.main, 0.07),
                        borderColor: (t) => alpha(t.palette.secondary.main, 0.15),
                        '&:hover': {
                            bgcolor: (t) => alpha(t.palette.secondary.main, 0.11),
                            color: 'secondary.dark',
                        },
                    },
                }}
            >
                {tabs.map((t, idx) => (
                    <Tab key={getValue(t)} value={idx} label={getLabel(t)} disableRipple />
                ))}
            </Tabs>
        </Box>
    );
}

// src/pages/legal/LegalPage.jsx
//
// Combined legal hub — renders Terms, Privacy, and Community Guidelines
// in a single page with tabs. Accessible at /legal
//
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Box, Container, Tab, Tabs, Typography, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import useChromeTop from '../../hooks/useChromeTop';

const TermsAndConditions = lazy(() => import('./TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
const CommunityGuidelines = lazy(() => import('./CommunityGuidelines'));

const TAB_MAP = { terms: 0, privacy: 1, guidelines: 2 };
const TAB_KEYS = ['terms', 'privacy', 'guidelines'];

export default function LegalPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = TAB_MAP[searchParams.get('tab')] ?? 0;
    const [tab, setTab] = useState(initialTab);
    const chromeTop = useChromeTop();

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleTabChange = (_, newVal) => {
        setTab(newVal);
        setSearchParams({ tab: TAB_KEYS[newVal] }, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: '100vh' }, pt: { xs: `${chromeTop}px`, sm: 0 } }}>
            {/* Sticky tab bar */}
            <Box
                sx={(t) => ({
                    position: 'sticky',
                    top: { xs: `${chromeTop}px`, sm: 0 },
                    zIndex: 10,
                    bgcolor: alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.88 : 0.85),
                    backdropFilter: 'blur(16px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
                    borderBottom: '1px solid',
                    borderColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.08 : 0.06),
                })}
            >
                <Container maxWidth="md">
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={(t) => ({
                            minHeight: 52,
                            '& .MuiTab-root': {
                                minHeight: 52,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                gap: 0.75,
                                color: alpha(t.palette.text.primary, 0.55),
                                transition: `color ${t.custom?.motion?.fast || 120}ms ${t.custom?.motion?.ease || 'ease'}`,
                                '&.Mui-selected': {
                                    color: t.palette.mode === 'dark' ? t.palette.primary.light : t.palette.primary.main,
                                    fontWeight: 800,
                                },
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                                backgroundColor: t.palette.secondary.main,
                            },
                        })}
                    >
                        <Tab icon={<GavelRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Terms" />
                        <Tab icon={<ShieldRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Privacy" />
                        <Tab icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Guidelines" />
                    </Tabs>
                </Container>
            </Box>

            {/* Content — each legal page renders its own Container/Paper structure */}
            <Suspense
                fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={28} />
                    </Box>
                }
            >
                {tab === 0 && <TermsAndConditions />}
                {tab === 1 && <PrivacyPolicy />}
                {tab === 2 && <CommunityGuidelines />}
            </Suspense>
        </Box>
    );
}

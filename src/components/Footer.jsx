// src/components/Footer.jsx
//
// Minimal site-wide footer shown on every page (inside Layout).
// Links to Terms, Privacy, Community Guidelines, and the combined Legal page.
//
import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={(t) => ({
                width: '100%',
                mt: 'auto',
                pt: 4,
                pb: 3,
                px: 2,
                textAlign: 'center',
                borderTop: '1px solid',
                borderColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.06 : 0.05),
            })}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: { xs: 1.5, sm: 2.5 },
                    mb: 1,
                }}
            >
                <FooterLink to="/terms" label="Terms" />
                <FooterLink to="/privacy" label="Privacy" />
                <FooterLink to="/guidelines" label="Community Guidelines" />
            </Box>
            <Typography
                sx={(t) => ({
                    color: alpha(t.palette.text.primary, 0.28),
                    fontSize: 11,
                    letterSpacing: 0.3,
                    mt: 0.5,
                })}
            >
                © {new Date().getFullYear()} The Local Lantern · Piedmont, Alabama
            </Typography>
        </Box>
    );
}

function FooterLink({ to, label }) {
    return (
        <Link
            component={RouterLink}
            to={to}
            underline="none"
            sx={(t) => ({
                color: alpha(t.palette.text.primary, 0.35),
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.2,
                transition: `color ${t.custom?.motion?.fast || 120}ms ${t.custom?.motion?.ease || 'ease'}`,
                '&:hover': {
                    color: alpha(t.palette.text.primary, 0.6),
                },
            })}
        >
            {label}
        </Link>
    );
}

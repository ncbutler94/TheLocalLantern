// src/pages/legal/PrivacyPolicy.jsx
//
// The Local Lantern — Privacy Policy
// Accessible at /privacy
//
import React, { useEffect } from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const LAST_UPDATED = 'April 22, 2026';

const Section = ({ id, title, children }) => (
    <Box id={id} sx={{ mb: 4 }}>
        <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}
        >
            {title}
        </Typography>
        <Box sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.75, '& p': { mb: 1.5 }, '& ul': { pl: 2.5, mb: 1.5, '& li': { mb: 0.5 } } }}>
            {children}
        </Box>
    </Box>
);

export default function PrivacyPolicy() {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 0, sm: 5 } }}>
            <Container maxWidth="md" sx={{ px: { xs: 0, sm: 3 } }}>
                <Box
                    sx={(t) => ({
                        bgcolor: 'background.paper',
                        borderRadius: `${t.shape.borderRadius}px`,
                        border: '1px solid',
                        borderColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.10 : 0.07),
                        p: { xs: 3, sm: 5 },
                        boxShadow: t.custom?.shadows?.md,
                        [t.breakpoints.down('sm')]: { borderRadius: 0, border: 'none' },
                    })}
                >
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                        Privacy Policy
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                        Last updated: {LAST_UPDATED}
                    </Typography>

                    <Box sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.75, mb: 4 }}>
                        <p>
                            The Local Lantern ("we," "us," or "our") operates the website and mobile application located at thelocallantern.com (the "Platform"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. Please read this policy carefully. By accessing or using the Platform, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of the Platform.
                        </p>
                    </Box>

                    <Section id="info-we-collect" title="1. Information We Collect">
                        <p><strong>1.1 Information You Provide Directly</strong></p>
                        <ul>
                            <li><strong>Account Information:</strong> When you create an account, we collect your first and last name, email address, username (handle), password (stored in hashed form), date of birth, country, and (if applicable) state, county, and city.</li>
                            <li><strong>Profile Information:</strong> You may optionally provide a profile picture, bio, social media links, and other details you choose to share.</li>
                            <li><strong>Content You Post:</strong> Community posts, comments, photos, event listings, marketplace listings, job postings, business pages, artist profiles, service listings, group content, messages, and any other content you submit.</li>
                            <li><strong>Communications:</strong> Direct messages sent through the Platform's messaging features, and any communications you send to us (such as support requests or feedback).</li>
                            <li><strong>Transaction Information:</strong> If you list items on the marketplace or post services, we collect the details you provide in those listings. The Local Lantern does not process payments directly; any payments occur between users outside the Platform.</li>
                            <li><strong>Engagement Data:</strong> Likes, reposts, comments, RSVPs, event engagement, follows, and other interactions you make on the Platform.</li>
                        </ul>

                        <p><strong>1.2 Information Collected Automatically</strong></p>
                        <ul>
                            <li><strong>Device and Usage Information:</strong> IP address, browser type, operating system, device identifiers, pages visited, links clicked, time spent on pages, and referring URLs.</li>
                            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies (such as session cookies for authentication) to maintain your login session, remember preferences, and improve your experience. We do not use advertising or third-party tracking cookies.</li>
                            <li><strong>Log Data:</strong> Our servers automatically record information when you access the Platform, including request timestamps, error logs, and API usage data.</li>
                        </ul>

                        <p><strong>1.3 Information From Third Parties</strong></p>
                        <ul>
                            <li><strong>Social Login:</strong> If you sign in using Google or Facebook, we receive your name, email address, and profile picture from that service in accordance with their privacy policies. We do not receive your password from these services.</li>
                        </ul>
                    </Section>

                    <Section id="how-we-use" title="2. How We Use Your Information">
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Create, maintain, and secure your account.</li>
                            <li>Provide, personalize, and improve the Platform and its features.</li>
                            <li>Display your profile and content to other users as part of the Platform's community features.</li>
                            <li>Enable community interactions including posts, comments, likes, reposts, messaging, event RSVPs, marketplace listings, and group participation.</li>
                            <li>Send you essential service communications (account verification, password resets, security alerts).</li>
                            <li>Send optional notifications about activity relevant to you (which you can configure in your notification settings).</li>
                            <li>Enforce our Terms and Conditions, moderate content, and respond to reports of abuse or policy violations.</li>
                            <li>Detect, prevent, and address technical issues, fraud, abuse, and security threats.</li>
                            <li>Comply with legal obligations and respond to lawful requests from authorities.</li>
                            <li>Analyze aggregate, de-identified usage trends to improve the Platform (we do not sell this data).</li>
                        </ul>
                    </Section>

                    <Section id="sharing" title="3. How We Share Your Information">
                        <p><strong>3.1 Public Information</strong></p>
                        <p>
                            Certain information is publicly visible by design: your display name, username, profile picture, and any content you post with public visibility. Posts made in public groups and community feeds are visible to all users, including those who are not logged in. Posts made with "followers only" visibility are visible only to your followers.
                        </p>

                        <p><strong>3.2 Other Users</strong></p>
                        <p>
                            When you interact with the Platform, other users can see your engagement (likes, comments, reposts), profile information, and content you share. Direct messages are visible only to the participants of the conversation.
                        </p>

                        <p><strong>3.3 Service Providers and Third-Party Services</strong></p>
                        <p>
                            We may share information with third-party service providers who perform services on our behalf, such as hosting, email delivery, and error monitoring. These providers are contractually bound to use your information only to provide services to us and are required to protect it.
                        </p>
                        <p>The Platform relies on the following third-party services, each governed by its own privacy policy:</p>
                        <ul>
                            <li><strong>Google Sign-In</strong> (Google LLC): Authentication when you choose to sign in with Google. See <MuiLink href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>policies.google.com/privacy</MuiLink>.</li>
                            <li><strong>Google Cloud Platform</strong> (Google LLC): Application hosting and data storage.</li>
                            <li><strong>Mapbox</strong> (Mapbox, Inc.): Map rendering and geocoding. See <MuiLink href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>mapbox.com/legal/privacy</MuiLink>.</li>
                            <li><strong>Tenor</strong> (Google LLC): GIF search and embedding in posts and messages. Queries are sent to Tenor when you use the GIF picker.</li>
                        </ul>

                        <p><strong>3.4 Legal Requirements</strong></p>
                        <p>
                            We may disclose your information if required by law, regulation, legal process, or governmental request, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request.
                        </p>

                        <p><strong>3.5 Business Transfers</strong></p>
                        <p>
                            In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our Platform of any change in ownership or use of your personal information.
                        </p>

                        <p><strong>3.6 What We Never Do</strong></p>
                        <ul>
                            <li>We do <strong>not</strong> sell your personal information to third parties.</li>
                            <li>We do <strong>not</strong> share your information with advertisers for ad targeting.</li>
                            <li>We do <strong>not</strong> use your private messages for advertising or analytics purposes.</li>
                        </ul>
                    </Section>

                    <Section id="mobile-permissions" title="4. Mobile App Permissions">
                        <p>
                            Our mobile apps (available on the App Store and Google Play) may request the following device permissions. Each permission is only used when you actively take an action that requires it — we do not access these features in the background.
                        </p>
                        <ul>
                            <li><strong>Camera:</strong> To let you take photos for posts, comments, and profile pictures. Only accessed when you choose to take a photo.</li>
                            <li><strong>Photo Library:</strong> To let you select existing photos to upload. We only access photos you specifically select.</li>
                            <li><strong>Location:</strong> To auto-detect your city or county for local content recommendations. You can decline this and manually select your location instead. Location is not tracked in the background.</li>
                            <li><strong>Notifications:</strong> To deliver alerts about activity relevant to you (replies, messages, event reminders). You can disable notifications at any time in your device settings or in your account's notification preferences.</li>
                        </ul>
                        <p>
                            You can grant or revoke any of these permissions at any time through your device's system settings. Denying a permission will only affect the specific feature that requires it; the rest of the app will continue to function normally.
                        </p>

                        <p><strong>App Tracking Transparency (iOS)</strong></p>
                        <p>
                            Our iOS app does not track you or your activity across other companies' apps or websites. We do not request App Tracking Transparency permission because we do not engage in cross-app or cross-site tracking, and we do not share your data with data brokers or advertising networks.
                        </p>
                    </Section>

                    <Section id="data-retention" title="5. Data Retention">
                        <p>
                            We retain your account information for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal, regulatory, or security purposes (such as fraud prevention records or legal hold obligations).
                        </p>
                        <p>
                            Content you have posted in public areas (community posts, comments, marketplace listings) may persist in anonymized form even after account deletion, as other users may have interacted with or relied upon that content.
                        </p>
                    </Section>

                    <Section id="data-security" title="6. Data Security">
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal information, including:
                        </p>
                        <ul>
                            <li>Passwords are hashed using industry-standard algorithms and are never stored in plain text.</li>
                            <li>All data in transit is encrypted using TLS/HTTPS.</li>
                            <li>Access to user data is restricted to authorized personnel on a need-to-know basis.</li>
                            <li>Rate limiting and abuse detection are applied to protect against automated attacks.</li>
                            <li>Authentication sessions use secure, HttpOnly cookies.</li>
                        </ul>
                        <p>
                            While we strive to use commercially acceptable means to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </Section>

                    <Section id="your-rights" title="7. Your Rights and Choices">
                        <p>You have the following rights regarding your information:</p>
                        <ul>
                            <li><strong>Access and Correction:</strong> You can access and update your account information at any time through your account settings.</li>
                            <li><strong>Deletion:</strong> You can request deletion of your account by contacting us. We will process your request within 30 days.</li>
                            <li><strong>Notification Preferences:</strong> You can manage your notification preferences in your account settings.</li>
                            <li><strong>Visibility Controls:</strong> You can control the visibility of your posts (public, followers-only) and manage who can see your content.</li>
                            <li><strong>Blocking:</strong> You can block other users to prevent them from seeing your content and interacting with you.</li>
                            <li><strong>Data Portability:</strong> You may request a copy of your personal data by contacting us.</li>
                        </ul>
                    </Section>

                    <Section id="children" title="8. Children's Privacy">
                        <p>
                            The Platform is not intended for anyone under the age of 18. We do not knowingly collect personal information from children under 18. Date of birth verification is required during registration, and users must be at least 18 years old to create an account. If we discover that we have collected information from a person under 18, we will delete that information promptly. If you believe a child under 18 has provided us with personal information, please contact us immediately.
                        </p>
                    </Section>

                    <Section id="cookies" title="9. Cookies and Tracking">
                        <p>
                            We use essential cookies required for the Platform to function (such as authentication session cookies). We do not use advertising cookies, third-party analytics trackers, or cross-site tracking technologies. You can configure your browser to refuse cookies, but doing so may prevent you from using certain features of the Platform (such as staying logged in).
                        </p>
                    </Section>

                    <Section id="third-party-links" title="10. Third-Party Links and Services">
                        <p>
                            The Platform may contain links to third-party websites, services, or content posted by users (such as social media links on profiles). We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access through the Platform.
                        </p>
                    </Section>

                    <Section id="state-laws" title="11. Regional Privacy Rights">
                        <p><strong>Alabama Residents:</strong> Alabama does not currently have a comprehensive state privacy law. However, we are committed to protecting the privacy of all our users and voluntarily provide the rights described in Section 7 to all users.</p>
                        <p><strong>California Residents (CCPA/CPRA):</strong> If you are a California resident, you have additional rights under the California Consumer Privacy Act, including the right to know what personal information we collect, the right to delete your information, and the right to opt out of the sale of personal information. We do not sell personal information. To exercise your rights, contact us using the information below.</p>
                        <p><strong>Other U.S. States:</strong> If you reside in a state with specific privacy legislation (such as Virginia, Colorado, Connecticut, or others), we will honor the applicable rights provided by your state's law. Contact us to exercise those rights.</p>
                        <p><strong>European Union / EEA Residents (GDPR):</strong> If you reside in the EU or European Economic Area, you have additional rights under the General Data Protection Regulation, including the right to access, correct, delete, restrict processing, object to processing, data portability, and to lodge a complaint with a supervisory authority. Our legal basis for processing your personal data is your consent and the performance of our agreement with you to provide the Platform. To exercise your rights, contact us using the information below.</p>
                    </Section>

                    <Section id="international" title="12. International Users">
                        <p>
                            The Platform is primarily designed for users in the United States, with a focus on Alabama communities. If you access the Platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your jurisdiction. By using the Platform, you consent to this transfer.
                        </p>
                    </Section>

                    <Section id="changes" title="13. Changes to This Privacy Policy">
                        <p>
                            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. For material changes, we will provide a more prominent notice (such as a banner on the Platform or an email notification). Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.
                        </p>
                    </Section>

                    <Section id="contact" title="14. Contact Us">
                        <p>
                            If you have questions about this Privacy Policy, wish to exercise your privacy rights, or have concerns about how your information is handled, please contact us at:
                        </p>
                        <p>
                            <strong>The Local Lantern</strong><br />
                            Piedmont, Alabama<br />
                            Email: <MuiLink href="mailto:privacy@thelocallantern.com" sx={{ fontWeight: 700 }}>privacy@thelocallantern.com</MuiLink>
                        </p>
                    </Section>

                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            <MuiLink component={RouterLink} to="/terms" sx={{ fontWeight: 700 }}>
                                Terms and Conditions
                            </MuiLink>
                            {' · '}
                            <MuiLink component={RouterLink} to="/" sx={{ fontWeight: 700 }}>
                                Back to Home
                            </MuiLink>
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

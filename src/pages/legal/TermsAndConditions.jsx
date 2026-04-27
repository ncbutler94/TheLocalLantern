// src/pages/legal/TermsAndConditions.jsx
//
// The Local Lantern — Terms and Conditions
// Accessible at /terms
//
import React, { useEffect } from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const LAST_UPDATED = 'April 12, 2026';

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

export default function TermsAndConditions() {
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
                        Terms and Conditions
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                        Last updated: {LAST_UPDATED}
                    </Typography>

                    <Box sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.75, mb: 4 }}>
                        <p>
                            Welcome to The Local Lantern. These Terms and Conditions ("Terms") govern your access to and use of the website, mobile application, and services provided by The Local Lantern ("we," "us," or "our"), located at thelocallantern.com (collectively, the "Platform"). By creating an account or using the Platform in any way, you agree to be bound by these Terms. If you do not agree to all of these Terms, do not access or use the Platform.
                        </p>
                    </Box>

                    <Section id="eligibility" title="1. Eligibility">
                        <p>
                            You must be at least 18 years of age to create an account or use the Platform. By registering, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If we discover that an account has been created by someone under 18, we will terminate that account immediately.
                        </p>
                    </Section>

                    <Section id="account" title="2. Account Registration and Security">
                        <p><strong>2.1 Account Creation:</strong> To access most features of the Platform, you must create an account by providing accurate and complete information, including your real name, a valid email address, a username, a password, your date of birth, and your location (country, and state/county/city if applicable). You agree to keep this information current and accurate.</p>
                        <p><strong>2.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss resulting from unauthorized use of your account.</p>
                        <p><strong>2.3 One Account Per Person:</strong> Each individual may maintain only one personal account. Creating duplicate or fake accounts is prohibited and may result in termination of all associated accounts.</p>
                        <p><strong>2.4 Username:</strong> Your username must be 3–30 characters, using only lowercase letters, numbers, and underscores. Usernames that impersonate others, contain profanity, or conflict with Platform routes or reserved names are prohibited. We reserve the right to reclaim or reassign usernames at our discretion.</p>
                    </Section>

                    <Section id="platform-description" title="3. Platform Description">
                        <p>
                            The Local Lantern is a community platform built primarily for Alabama communities, though open to all users. The Platform provides the following features and services:
                        </p>
                        <ul>
                            <li><strong>Community:</strong> Public and group-based forums for discussions, announcements, tips, help requests, lost-and-found postings, and general community engagement.</li>
                            <li><strong>Events:</strong> Event discovery, creation, RSVPs, and community event engagement.</li>
                            <li><strong>Business Pages:</strong> Business profiles, posts, reviews, and team management for local businesses.</li>
                            <li><strong>Music:</strong> Artist profiles, music sharing, and artist community features for Alabama musicians.</li>
                            <li><strong>Services:</strong> Service provider listings and service request connections.</li>
                            <li><strong>Marketplace:</strong> User-to-user marketplace for buying, selling, and trading goods locally.</li>
                            <li><strong>Jobs:</strong> Local job postings and job discovery.</li>
                            <li><strong>Messaging:</strong> Direct messaging between users.</li>
                            <li><strong>Groups:</strong> Public and private community groups with moderation tools.</li>
                        </ul>
                        <p>
                            Features may be added, modified, or removed at our discretion. We may, but are not obligated to, provide notice of significant changes.
                        </p>
                        <p>
                            We may modify, suspend, or discontinue any part of the Platform, including features or services, at any time without notice or liability.
                        </p>
                    </Section>

                    <Section id="user-conduct" title="4. User Conduct and Content Standards">
                        <p><strong>4.1 General Conduct:</strong> You agree to use the Platform in a lawful, respectful, and constructive manner. You will not use the Platform to:</p>
                        <ul>
                            <li>Post, share, or distribute content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, hateful, or discriminatory.</li>
                            <li>Engage in bullying, intimidation, stalking, or harassment of any user.</li>
                            <li>Impersonate any person or entity, or falsely claim an affiliation with any person or entity.</li>
                            <li>Post spam, unsolicited advertising, pyramid schemes, or chain letters.</li>
                            <li>Upload or transmit viruses, malware, or any code designed to disrupt, damage, or interfere with the Platform.</li>
                            <li>Attempt to gain unauthorized access to other user accounts, the Platform's servers, or any connected systems.</li>
                            <li>Use automated scripts, bots, scrapers, or other automated means to access the Platform or collect data without our written permission.</li>
                            <li>Circumvent, disable, or interfere with any security features of the Platform, including rate limiting, content moderation, or block/mute features.</li>
                            <li>Use the Platform for any purpose that violates any applicable local, state, national, or international law.</li>
                        </ul>

                        <p><strong>4.2 Content Standards:</strong> All content you post must:</p>
                        <ul>
                            <li>Be truthful and not intentionally misleading.</li>
                            <li>Not infringe on any third party's intellectual property rights, privacy rights, or other rights.</li>
                            <li>Not contain personal information of others without their consent (such as phone numbers, addresses, or private photos).</li>
                            <li>Comply with all applicable laws, including consumer protection, fair housing, employment, and anti-discrimination laws when posting marketplace listings, job postings, or service offerings.</li>
                        </ul>

                        <p><strong>4.3 Marketplace and Services Conduct:</strong></p>
                        <ul>
                            <li>Listings must accurately describe the item or service offered.</li>
                            <li>You must not list illegal items, stolen property, counterfeit goods, or prohibited materials.</li>
                            <li>All transactions are between users. The Local Lantern is not a party to any transaction and does not guarantee, endorse, or assume liability for any goods, services, or payments exchanged between users.</li>
                            <li>You are solely responsible for complying with all applicable tax obligations arising from your transactions.</li>
                        </ul>

                        <p><strong>4.4 Job Postings:</strong> Job listings must comply with all applicable employment laws, including anti-discrimination laws. Listings must not contain misleading compensation information, require illegal activities, or discriminate based on protected characteristics.</p>

                        <p><strong>4.5 No Reliance on Content:</strong> You acknowledge that any content posted by users is for informational purposes only. We do not endorse, verify, or guarantee the accuracy, completeness, or reliability of any User Content.</p>
                    </Section>

                    <Section id="content-ownership" title="5. Content Ownership and License">
                        <p><strong>5.1 Your Content:</strong> You retain ownership of all content you post on the Platform ("User Content"). By posting User Content, you grant The Local Lantern a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, modify, distribute, display, and perform your User Content in connection with operating and improving the Platform. This license ends when you delete your User Content or your account, except where your content has been shared with others and they have not deleted it, or where retention is reasonably necessary for legal or operational purposes.</p>

                        <p><strong>5.2 Our Content:</strong> The Platform, including its design, logos, trademarks, service marks, graphics, text, software, and all other content not posted by users ("Our Content"), is owned by The Local Lantern and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works based on Our Content without our express written permission.</p>

                        <p><strong>5.3 Feedback:</strong> If you provide us with feedback, suggestions, or ideas regarding the Platform, you grant us an unrestricted, perpetual, irrevocable, non-exclusive, royalty-free right to use that feedback for any purpose without compensation to you.</p>
                    </Section>

                    <Section id="moderation" title="6. Content Moderation and Enforcement">
                        <p><strong>6.1 Right to Moderate:</strong> We reserve the right (but are not obligated) to review, monitor, edit, refuse, or remove any User Content, and to suspend or terminate accounts, at our sole discretion, for any reason or no reason, including but not limited to violations of these Terms or behavior we believe may harm the Platform or its users.</p>

                        <p><strong>6.2 Reporting:</strong> Users can report content or accounts that violate these Terms. We will review reports in a reasonable timeframe, but we do not guarantee any specific outcome or timeline.</p>

                        <p><strong>6.3 Enforcement Actions:</strong> Violations of these Terms may result in one or more of the following actions, at our sole discretion:</p>
                        <ul>
                            <li>Content removal or editing.</li>
                            <li>Temporary suspension of account features or access.</li>
                            <li>Permanent account termination.</li>
                            <li>Reporting to law enforcement if we believe illegal activity has occurred.</li>
                        </ul>

                        <p><strong>6.4 Appeals:</strong> If you believe an enforcement action was taken in error, you may contact us to request a review. We will consider appeals in good faith but are not obligated to reverse any decision.</p>
                    </Section>

                    <Section id="privacy" title="7. Privacy">
                        <p>
                            Your use of the Platform is also governed by our{' '}
                            <MuiLink component={RouterLink} to="/privacy" sx={{ fontWeight: 700 }}>
                                Privacy Policy
                            </MuiLink>
                            , which is incorporated into these Terms by reference. Please review the Privacy Policy to understand how we collect, use, and protect your information.
                        </p>
                    </Section>

                    <Section id="groups" title="8. Groups">
                        <p><strong>8.1 Group Creation:</strong> Users may create groups for community purposes. Group creators ("admins") are responsible for moderating content within their groups in accordance with these Terms.</p>
                        <p><strong>8.2 Group Rules:</strong> Groups may establish additional rules beyond these Terms, but group rules may not contradict or undermine these Terms. In any conflict, these Terms prevail.</p>
                        <p><strong>8.3 Private Groups:</strong> Content in private groups is visible only to group members. However, we retain the right to access private group content for moderation, legal compliance, and safety purposes.</p>
                    </Section>

                    <Section id="business-pages" title="9. Business Pages and Artist Profiles">
                        <p><strong>9.1 Accuracy:</strong> Business pages and artist profiles must represent real businesses or artists. Information must be accurate and kept up to date. Misrepresentation may result in page removal.</p>
                        <p><strong>9.2 Team Access:</strong> Business page admins may invite team members with various permission levels. Admins are responsible for the actions taken by their team members on the page.</p>
                        <p><strong>9.3 Reviews:</strong> Users may leave reviews on business pages. Reviews must be honest and based on genuine experiences. Fake reviews (both positive and negative) are prohibited and may be removed.</p>
                    </Section>

                    <Section id="messaging" title="10. Messaging">
                        <p>
                            The messaging feature is provided for legitimate communication between users. You must not use messaging for spam, harassment, phishing, solicitation of personal information, or any illegal purpose. We do not routinely monitor private messages, but we may access message content in response to user reports, legal requests, or to investigate potential violations of these Terms.
                        </p>
                    </Section>

                    <Section id="disclaimers" title="11. Disclaimers">
                        <p><strong>11.1 "As Is" Basis:</strong> THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</p>

                        <p><strong>11.2 No Guarantee:</strong> We do not guarantee that the Platform will be uninterrupted, error-free, secure, or free of viruses or other harmful components. We do not guarantee the accuracy, completeness, or usefulness of any content posted by users.</p>

                        <p><strong>11.3 User Interactions:</strong> We are not responsible for the conduct, whether online or offline, of any user. We are not responsible for any goods, services, or transactions between users, including those facilitated through the marketplace, services, or job features. You interact with other users at your own risk.</p>

                        <p><strong>11.4 Third-Party Content:</strong> The Platform may contain links to or content from third-party websites or services. We do not endorse or assume responsibility for any third-party content, products, or services.</p>

                        <p><strong>11.5 User Content Disclaimer:</strong> We are not responsible for any User Content posted on the Platform. We do not endorse or guarantee the accuracy, reliability, or legality of any User Content.</p>
                    </Section>

                    <Section id="liability" title="12. Limitation of Liability">
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE LOCAL LANTERN, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                        </p>
                        <p>
                            OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF FIFTY DOLLARS ($50.00) OR THE AMOUNT YOU HAVE PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                        </p>
                        <p>
                            We do not guarantee that any content, data, or information will be stored, backed up, or available at any time. You are solely responsible for maintaining copies of any content you wish to retain.
                        </p>
                    </Section>

                    <Section id="indemnification" title="13. Indemnification">
                        <p>
                            You agree to indemnify, defend, and hold harmless The Local Lantern and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Platform; (b) your User Content; (c) your violation of these Terms; (d) your violation of any third party's rights, including intellectual property, privacy, or publicity rights; or (e) any transaction or interaction between you and another user.
                        </p>
                    </Section>

                    <Section id="termination" title="14. Termination">
                        <p><strong>14.1 By You:</strong> You may delete your account at any time through your account settings or by contacting us. Upon deletion, your access to the Platform will cease, and your personal data will be handled in accordance with our Privacy Policy.</p>

                        <p><strong>14.2 By Us:</strong> We may suspend, restrict, or terminate your account at any time, with or without notice, and for any reason or no reason, including but not limited to violations of these Terms, suspected harmful behavior, or actions that may negatively impact the Platform or its users. Upon termination, your right to use the Platform ceases immediately.</p>

                        <p><strong>14.3 Survival:</strong> The following sections survive termination: Content Ownership and License (Section 5), Disclaimers (Section 11), Limitation of Liability (Section 12), Indemnification (Section 13), and Governing Law (Section 17).</p>
                    </Section>

                    <Section id="modifications" title="15. Modifications to These Terms">
                        <p>
                            We reserve the right to modify these Terms at any time. When we make changes, we will update the "Last updated" date. We may, but are not obligated to, provide notice of material changes (such as a banner on the Platform or email notification). Your continued use of the Platform after changes take effect constitutes acceptance of the modified Terms. If you do not agree with the modified Terms, you must stop using the Platform and delete your account.
                        </p>
                    </Section>

                    <Section id="dispute" title="16. Dispute Resolution">
                        <p><strong>16.1 Informal Resolution:</strong> Before filing any formal legal claim, you agree to first contact us and attempt to resolve the dispute informally for at least 30 days.</p>
                        <p><strong>16.2 Arbitration:</strong> If informal resolution is unsuccessful, any dispute, claim, or controversy arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration administered in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in the State of Alabama. You agree to arbitrate on an individual basis — class actions and class arbitrations are not permitted.</p>
                        <p><strong>16.3 Exceptions:</strong> Either party may seek injunctive or equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.</p>
                    </Section>

                    <Section id="governing-law" title="17. Governing Law">
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the State of Alabama, United States, without regard to its conflict of law provisions. Any legal proceedings not subject to arbitration shall be brought exclusively in the state or federal courts located in Alabama.
                        </p>
                    </Section>

                    <Section id="general" title="18. General Provisions">
                        <p><strong>18.1 Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and The Local Lantern regarding your use of the Platform and supersede all prior agreements.</p>
                        <p><strong>18.2 Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, severed. The remaining provisions shall continue in full force and effect.</p>
                        <p><strong>18.3 Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</p>
                        <p><strong>18.4 Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations without restriction.</p>
                        <p><strong>18.5 No Agency:</strong> Nothing in these Terms creates a partnership, joint venture, employment, or agency relationship between you and The Local Lantern.</p>
                    </Section>

                    <Section id="contact" title="19. Contact Us">
                        <p>
                            If you have questions about these Terms and Conditions, please contact us at:
                        </p>
                        <p>
                            <strong>The Local Lantern</strong><br />
                            Piedmont, Alabama<br />
                            Email: <MuiLink href="mailto:legal@thelocallantern.com" sx={{ fontWeight: 700 }}>legal@thelocallantern.com</MuiLink>
                        </p>
                    </Section>

                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            <MuiLink component={RouterLink} to="/privacy" sx={{ fontWeight: 700 }}>
                                Privacy Policy
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

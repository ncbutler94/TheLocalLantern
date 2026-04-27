// src/pages/legal/CommunityGuidelines.jsx
//
// The Local Lantern — Community Guidelines
// Accessible at /guidelines
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

export default function CommunityGuidelines() {
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
                        Community Guidelines
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                        Last updated: {LAST_UPDATED}
                    </Typography>

                    <Box sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.75, mb: 4 }}>
                        <p>
                            The Local Lantern is a community platform built for Alabama — a place where neighbors, local businesses, artists, and community members can connect, share, and support one another. These guidelines exist to keep the Platform welcoming, safe, and useful for everyone. They apply to all content and interactions on the Platform, including community posts, comments, messages, events, groups, marketplace listings, job postings, service listings, business pages, artist profiles, and reviews.
                        </p>
                        <p>
                            By using The Local Lantern, you agree to follow these guidelines. Violations may result in content removal, temporary suspension, or permanent account termination at our discretion. These guidelines supplement our{' '}
                            <MuiLink component={RouterLink} to="/terms" sx={{ fontWeight: 700 }}>Terms and Conditions</MuiLink>
                            {' '}— please review those as well.
                        </p>
                    </Box>

                    {/* ── SECTION 1 ── */}
                    <Section id="respect" title="1. Treat Everyone with Respect">
                        <p>
                            The Local Lantern serves a diverse community. We expect all members to treat others with basic dignity and respect, even during disagreements. Specifically:
                        </p>
                        <ul>
                            <li><strong>No harassment or bullying.</strong> Do not target, intimidate, threaten, or repeatedly antagonize another person. This includes coordinated harassment by multiple accounts.</li>
                            <li><strong>No hate speech.</strong> Content that attacks, demeans, or incites violence against individuals or groups based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, age, or veteran status is not allowed.</li>
                            <li><strong>No personal attacks.</strong> Criticize ideas, not people. "That policy is misguided" is fine. "You're an idiot" is not.</li>
                            <li><strong>No doxxing.</strong> Never share someone else's private information (home address, phone number, workplace, photos of their children, etc.) without their explicit consent.</li>
                            <li><strong>No stalking.</strong> Obsessively following, monitoring, or contacting someone who has asked you to stop — or who has blocked you — is prohibited.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 2 ── */}
                    <Section id="authenticity" title="2. Be Authentic and Honest">
                        <ul>
                            <li><strong>Use your real identity.</strong> The Local Lantern is a real-name community. Your account should represent you (or your real business/artist project). Fake accounts, sock puppets, and impersonation accounts are not allowed.</li>
                            <li><strong>Don't impersonate others.</strong> Don't pretend to be another person, business, artist, government entity, or organization.</li>
                            <li><strong>Don't spread misinformation.</strong> Don't knowingly post false or misleading information, especially regarding public health, emergencies, elections, or safety. Sharing genuine opinions or speculation is fine — presenting fabricated claims as fact is not.</li>
                            <li><strong>Be transparent about affiliations.</strong> If you're promoting your own business, product, event, or service, say so. Undisclosed self-promotion (astroturfing) undermines community trust.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 3 ── */}
                    <Section id="safety" title="3. Keep the Community Safe">
                        <ul>
                            <li><strong>No threats of violence.</strong> Threats of physical harm — whether serious, conditional, or "joking" — are strictly prohibited and may be reported to law enforcement.</li>
                            <li><strong>No promotion of dangerous activities.</strong> Don't encourage, instruct, or glorify activities that could cause serious physical harm to yourself or others.</li>
                            <li><strong>No exploitation of minors.</strong> Any content that exploits, sexualizes, or endangers children will result in immediate permanent ban and a report to the National Center for Missing & Exploited Children (NCMEC) and/or law enforcement.</li>
                            <li><strong>Report urgent safety concerns.</strong> If you believe someone is in immediate danger, contact 911 first, then report the content to us. We are not an emergency service.</li>
                            <li><strong>No illegal activity.</strong> Don't use the Platform to facilitate, promote, or coordinate any illegal activity, including drug sales, weapons trafficking, fraud, or theft.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 4 ── */}
                    <Section id="content-standards" title="4. Content Standards">
                        <p><strong>4.1 Appropriate Content</strong></p>
                        <ul>
                            <li><strong>No sexually explicit content.</strong> Nudity, pornography, and sexually explicit material are not allowed. This includes profile pictures, posts, comments, messages, and any other content on the Platform.</li>
                            <li><strong>No graphic violence.</strong> Excessively gory, violent, or disturbing imagery is not allowed. Newsworthy content may be permitted with appropriate context and content warnings, at our discretion.</li>
                            <li><strong>Use content warnings when appropriate.</strong> If your post discusses sensitive topics (domestic violence, substance abuse, mental health crises, graphic accidents, etc.), consider adding a brief content warning at the beginning.</li>
                        </ul>

                        <p><strong>4.2 Intellectual Property</strong></p>
                        <ul>
                            <li><strong>Only post content you have the right to share.</strong> Don't upload copyrighted photos, videos, music, articles, or other content belonging to others without permission.</li>
                            <li><strong>Credit creators.</strong> When sharing others' work (with permission), give proper attribution.</li>
                            <li><strong>Respect trademarks.</strong> Don't use business names, logos, or branding in a way that suggests false affiliation or endorsement.</li>
                        </ul>

                        <p><strong>4.3 Post Quality</strong></p>
                        <ul>
                            <li><strong>Post in the right place.</strong> Use the appropriate section for your content — community posts in the community feed, job listings in jobs, marketplace items in the marketplace, etc. Post in relevant groups when applicable.</li>
                            <li><strong>No spam.</strong> Don't flood the feed with repetitive, low-quality, or irrelevant posts. Don't post the same content across multiple groups or sections simultaneously.</li>
                            <li><strong>No chain letters or pyramid schemes.</strong> Multi-level marketing recruitment, chain letters, and get-rich-quick schemes are not welcome.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 5 ── */}
                    <Section id="marketplace-guidelines" title="5. Marketplace, Jobs, and Services">
                        <p><strong>5.1 Marketplace Listings</strong></p>
                        <ul>
                            <li><strong>List real items at honest prices.</strong> Descriptions must accurately represent the item's condition, features, and any defects.</li>
                            <li><strong>No prohibited items.</strong> You may not list illegal items, stolen property, counterfeit goods, recalled products, weapons, drugs or drug paraphernalia, animals (except through legitimate rescue/rehoming with appropriate context), hazardous materials, or anything else prohibited by law.</li>
                            <li><strong>Honor your commitments.</strong> If you agree to a sale or trade, follow through. Repeated no-shows or bait-and-switch behavior will result in enforcement action.</li>
                            <li><strong>Meet safely.</strong> We strongly encourage meeting in well-lit public places for transactions. The Local Lantern is not responsible for in-person meetups — use good judgment.</li>
                        </ul>

                        <p><strong>5.2 Job Postings</strong></p>
                        <ul>
                            <li><strong>Post legitimate opportunities only.</strong> Job postings must be for real positions with genuine compensation. Unpaid internships must be clearly labeled.</li>
                            <li><strong>No discriminatory postings.</strong> Job listings must comply with all applicable employment and anti-discrimination laws.</li>
                            <li><strong>No misleading compensation claims.</strong> Be upfront about pay structure (hourly, salary, commission, tips, etc.).</li>
                        </ul>

                        <p><strong>5.3 Service Listings</strong></p>
                        <ul>
                            <li><strong>Represent your qualifications honestly.</strong> Don't claim licenses, certifications, or experience you don't have.</li>
                            <li><strong>Comply with all applicable regulations.</strong> Services requiring professional licenses (electrical, plumbing, medical, legal, etc.) must be performed by properly licensed individuals.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 6 ── */}
                    <Section id="groups" title="6. Groups">
                        <ul>
                            <li><strong>Group admins set the tone.</strong> Group admins may establish additional rules beyond these guidelines (but not contradicting them). Respect group-specific rules.</li>
                            <li><strong>Group admins are responsible for moderation.</strong> If you create a group, you're responsible for moderating it. Groups that consistently violate these guidelines may be removed.</li>
                            <li><strong>Private groups are not exempt.</strong> These guidelines apply in private groups just as they do in public spaces. "It was a private group" is not a defense for violations.</li>
                            <li><strong>No group raiding.</strong> Coordinating with others to join a group and disrupt it with spam, trolling, or hostile content is prohibited.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 7 ── */}
                    <Section id="business-artist" title="7. Business Pages and Artist Profiles">
                        <ul>
                            <li><strong>Represent real entities.</strong> Business pages must represent real, operating businesses. Artist profiles must represent real artists or music projects.</li>
                            <li><strong>Keep information accurate.</strong> Business hours, contact information, location, and services should be current and truthful.</li>
                            <li><strong>Reviews must be genuine.</strong> Don't solicit fake reviews (positive or negative). Don't review your own business. Don't offer incentives in exchange for reviews without clear disclosure. Don't post retaliatory reviews against competitors.</li>
                            <li><strong>Respond to reviews professionally.</strong> Business owners can respond to reviews, but responses should be professional and constructive, not hostile or retaliatory.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 8 ── */}
                    <Section id="events" title="8. Events">
                        <ul>
                            <li><strong>Post real events.</strong> Event listings must be for actual events that are genuinely planned to occur.</li>
                            <li><strong>Include accurate details.</strong> Date, time, location, and any costs or requirements should be clearly stated.</li>
                            <li><strong>No misleading events.</strong> Don't create fake events to lure people to a location, promote a product under the guise of an event, or misrepresent what attendees will experience.</li>
                            <li><strong>Cancel responsibly.</strong> If your event is canceled or significantly changed, update the listing promptly.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 9 ── */}
                    <Section id="messaging" title="9. Direct Messaging">
                        <ul>
                            <li><strong>Don't spam.</strong> Unsolicited bulk messages, mass promotional outreach, and repeated unwanted contact are prohibited.</li>
                            <li><strong>Respect boundaries.</strong> If someone doesn't respond or asks you to stop, stop. Continued unwanted contact is harassment.</li>
                            <li><strong>No phishing or scams.</strong> Don't use messages to solicit passwords, financial information, or personal data. Don't send links to malicious sites.</li>
                            <li><strong>Messages are still covered by these guidelines.</strong> The fact that a message is "private" doesn't exempt it from these rules. Reported messages will be reviewed.</li>
                            <li><strong>Business outreach.</strong> Repeated unsolicited business outreach — such as DMing users to promote your business, services, or products without being asked — may be treated as spam.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 10 ── */}
                    <Section id="politics" title="10. Political and Controversial Topics">
                        <p>
                            We don't ban political discussion — politics affects Alabama communities directly, and people should be able to talk about it. However:
                        </p>
                        <ul>
                            <li><strong>Discuss policies and issues, not people's character.</strong> "I disagree with this zoning decision because..." is constructive. "Anyone who supports this is a [slur]" is not.</li>
                            <li><strong>No coordinated political manipulation.</strong> Don't use fake accounts, bots, or organized campaigns to artificially amplify political messages or suppress opposing views.</li>
                            <li><strong>No voter intimidation or election interference.</strong> Don't post false information about voting procedures, polling locations, or election dates. Don't threaten or intimidate people based on how they vote.</li>
                            <li><strong>Keep it local when possible.</strong> The Local Lantern is at its best when discussions center on how issues affect our Alabama communities specifically.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 11 ── */}
                    <Section id="lost-found" title="11. Lost and Found">
                        <ul>
                            <li><strong>Post with urgency, not panic.</strong> Include clear descriptions, photos if available, and the general area (not exact home addresses).</li>
                            <li><strong>Update your post.</strong> If a lost item or pet is found, update or resolve the post so the community knows.</li>
                            <li><strong>Be a good Samaritan.</strong> If you find something, make a reasonable effort to connect it with the owner through the Platform. Don't demand rewards or hold items hostage.</li>
                            <li><strong>No false reports.</strong> Don't post fake lost/found reports for attention, to track someone's location, or for any other deceptive purpose.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 12 ── */}
                    <Section id="enforcement" title="12. How We Enforce These Guidelines">
                        <p><strong>12.1 Reporting</strong></p>
                        <p>
                            If you see content or behavior that violates these guidelines, please report it. You can report posts, comments, messages, profiles, business pages, and other content directly through the Platform. We review reports as reasonably possible, but cannot guarantee review of every report and we may not respond to each one individually.
                        </p>

                        <p><strong>12.2 What Happens When Guidelines Are Violated</strong></p>
                        <p>
                            Enforcement actions are taken at our sole discretion and may not follow a set sequence — we reserve the right to take any action we deem appropriate based on the severity of the violation. Actions we may take include, but are not limited to:
                        </p>
                        <ul>
                            <li><strong>Content removal:</strong> The offending content is removed. The user may or may not be notified.</li>
                            <li><strong>Warning:</strong> A notice that the content or behavior violated guidelines, with an expectation of compliance going forward.</li>
                            <li><strong>Permanent ban:</strong> Permanent removal from the Platform. Circumventing a ban with new accounts will result in those accounts being banned as well.</li>
                            <li><strong>Law enforcement referral:</strong> For threats of violence, exploitation of minors, or other criminal activity, we may report to appropriate authorities.</li>
                        </ul>
                        <p>
                            We may introduce additional enforcement measures (such as temporary restrictions or account suspensions) in the future. We are not obligated to warn before taking action, and a first offense may result in a permanent ban depending on severity.
                        </p>

                        <p><strong>12.3 Appeals</strong></p>
                        <p>
                            If you believe an enforcement action was taken in error, you may contact us to request a review. We will consider appeals in good faith but are not obligated to reverse any decision. Our enforcement decisions are final.
                        </p>

                        <p><strong>12.4 We Can't Catch Everything</strong></p>
                        <p>
                            We do our best to maintain a safe and welcoming community, but we cannot review every piece of content in real time. The presence of content on the Platform does not mean we have reviewed or endorsed it. Community reporting is essential — if you see something, say something.
                        </p>
                    </Section>

                    {/* ── SECTION 13 ── */}
                    <Section id="blocking" title="13. Blocking and Muting">
                        <p>
                            You have tools to manage your own experience:
                        </p>
                        <ul>
                            <li><strong>Block users</strong> to prevent them from seeing your content, interacting with you, or messaging you.</li>
                            <li><strong>Report content</strong> that violates these guidelines so our team can review it.</li>
                        </ul>
                        <p>
                            Blocking is not a violation of guidelines — every user has the right to control who they interact with. Retaliating against someone for blocking you (via alternate accounts, mutual contacts, etc.) is a violation.
                        </p>
                    </Section>

                    {/* ── SECTION 14 ── */}
                    <Section id="changes" title="14. Changes to These Guidelines">
                        <p>
                            We may update these Community Guidelines from time to time as the Platform grows and evolves. When we make significant changes, we will update the "Last updated" date at the top of this page. We encourage you to review these guidelines periodically. Continued use of the Platform after changes are posted constitutes acceptance of the updated guidelines.
                        </p>
                    </Section>

                    {/* ── SECTION 15 ── */}
                    <Section id="promoted-content" title="15. Promoted and Boosted Content">
                        <p>
                            Users may have the option to promote or boost their content for increased visibility across the Platform. Promoted content must still comply with all Community Guidelines. Specifically:
                        </p>
                        <ul>
                            <li><strong>No misleading promotions.</strong> Promoted content must be truthful and not deceptive. Clickbait, false claims, and bait-and-switch tactics are prohibited.</li>
                            <li><strong>Quality matters.</strong> Low-quality, spammy, or irrelevant promoted content may be removed at our discretion.</li>
                            <li><strong>All guidelines still apply.</strong> Paying to promote content does not exempt it from any of these guidelines. Violations may result in content removal, loss of promotion privileges, and/or account enforcement actions.</li>
                            <li><strong>No promoting prohibited content.</strong> Content that would violate these guidelines in organic form cannot be promoted.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 16 ── */}
                    <Section id="platform-integrity" title="16. Platform Integrity">
                        <ul>
                            <li><strong>No manipulation of the platform.</strong> Do not attempt to artificially inflate engagement (likes, comments, followers), manipulate rankings, or exploit platform features for unfair visibility. This includes coordinated inauthentic behavior, engagement pods, and fake account networks.</li>
                            <li><strong>No abuse of reporting tools.</strong> The reporting system exists to keep the community safe. Filing false, frivolous, or malicious reports against content or users is prohibited and may result in enforcement action against the reporter.</li>
                            <li><strong>No circumventing enforcement.</strong> Creating new accounts to evade bans, using alternate accounts to interact with users who have blocked you, or any other attempt to circumvent Platform enforcement actions is prohibited.</li>
                            <li><strong>No automated abuse.</strong> Bots, scripts, and automated tools that interact with the Platform without authorization — including auto-liking, auto-following, mass messaging, or scraping — are prohibited.</li>
                        </ul>
                    </Section>

                    {/* ── SECTION 17 ── */}
                    <Section id="spirit" title="17. The Spirit of These Guidelines">
                        <p>
                            No set of rules can cover every possible scenario. We will always consider the intent and impact of behavior, not just whether it technically violates a specific rule. If something feels like it's making the community worse — even if it doesn't neatly fit into one of the categories above — we may still take action.
                        </p>
                        <p>
                            At its heart, The Local Lantern is about Alabama neighbors helping each other, sharing what's happening, and building stronger local communities. If you're contributing to that mission, you're doing it right.
                        </p>
                    </Section>

                    {/* ── CONTACT ── */}
                    <Section id="contact" title="Questions or Concerns?">
                        <p>
                            If you have questions about these Community Guidelines or need to report a concern that can't be handled through the in-app reporting tools, contact us at:
                        </p>
                        <p>
                            <strong>The Local Lantern</strong><br />
                            Piedmont, Alabama<br />
                            Email: <MuiLink href="mailto:community@thelocallantern.com" sx={{ fontWeight: 700 }}>community@thelocallantern.com</MuiLink>
                        </p>
                    </Section>

                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            <MuiLink component={RouterLink} to="/terms" sx={{ fontWeight: 700 }}>
                                Terms and Conditions
                            </MuiLink>
                            {' · '}
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

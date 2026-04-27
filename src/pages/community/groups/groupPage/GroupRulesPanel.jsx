import { Box, Divider, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";

const safeStr = (v) => String(v ?? "").trim();

function SectionHeader({ icon, title }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box
                sx={(t) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 1.75,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                })}
            >
                {icon}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.01em" }}>
                {title}
            </Typography>
        </Box>
    );
}

export default function GroupRulesPanel({ group }) {
    if (!group) return null;

    const rulesHtml = safeStr(group.rulesHtml ?? group.rules_html);
    const rulesText = safeStr(group.rulesText ?? group.rules_text ?? group.rules);

    if (!rulesHtml && !rulesText) {
        return (
            <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 3, sm: 4 }, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 700, opacity: 0.5 }}>No rules have been added yet.</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                px: { xs: 0, sm: 2.5 },
                py: { xs: 0, sm: 2.5 },
            }}
        >
            <Paper
                elevation={0}
                sx={(t) => ({
                    p: { xs: 2, sm: 2.75 },
                    borderRadius: { xs: 0, sm: 3 },
                    border: { xs: 'none', sm: "1px solid" },
                    borderBottom: { xs: '1px solid', sm: "1px solid" },
                    borderColor: alpha(t.palette.divider, 0.08),
                    bgcolor: "background.paper",
                })}
            >
                <SectionHeader icon={<RuleOutlinedIcon sx={{ fontSize: 17 }} />} title="Rules" />
                <Divider sx={(t) => ({ mb: 1.5, borderColor: alpha(t.palette.divider, 0.06) })} />

                {rulesHtml ? (
                    <Box
                        sx={(t) => ({
                            typography: "body1",
                            fontSize: 14.5,
                            lineHeight: 1.7,
                            color: alpha(t.palette.text.primary, 0.75),
                            "& p": { m: 0, mb: 1.25 },
                            "& p:last-of-type": { mb: 0 },
                            "& ul, & ol": { pl: 2.75, my: 1 },
                            "& li": { mb: 0.5 },
                            "& a": { color: "primary.main" },
                        })}
                        dangerouslySetInnerHTML={{ __html: rulesHtml }}
                    />
                ) : (
                    <Typography
                        sx={(t) => ({
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                            fontSize: 14.5,
                            color: alpha(t.palette.text.primary, 0.75),
                        })}
                    >
                        {rulesText}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

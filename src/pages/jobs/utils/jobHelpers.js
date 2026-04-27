// src/pages/jobs/utils/jobHelpers.js
//
// Shared helpers for Jobs components — category icons/names, job-type labels,
// experience-level labels, and expiry formatting.
//

import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

/* ══════════════════════════════════════════════════════════════════════
   CATEGORY INFO
   ══════════════════════════════════════════════════════════════════════ */

/** Master category list — defined once, used everywhere. */
const CATEGORY_MAP = {
    "administrative-office":              { name: "Administrative & Office",                  shortName: "Admin & Office",        Icon: BusinessCenterRoundedIcon },
    "accounting-finance":                 { name: "Accounting & Finance",                     shortName: "Accounting & Finance",  Icon: AccountBalanceRoundedIcon },
    "sales-business-development":         { name: "Sales & Business Development",             shortName: "Sales & Business Dev",  Icon: TrendingUpRoundedIcon },
    "customer-service-support":           { name: "Customer Service & Support",               shortName: "Customer Service",      Icon: SupportAgentRoundedIcon },
    "marketing-creative-communications":  { name: "Marketing, Creative & Communications",     shortName: "Marketing & Creative",  Icon: CampaignRoundedIcon },
    "technology-data":                    { name: "Technology & Data",                         shortName: "Technology & Data",     Icon: MemoryRoundedIcon },
    "healthcare":                         { name: "Healthcare",                                shortName: "Healthcare",            Icon: LocalHospitalRoundedIcon },
    "education-childcare":                { name: "Education & Childcare",                    shortName: "Education & Childcare", Icon: SchoolRoundedIcon },
    "skilled-trades-maintenance":         { name: "Skilled Trades & Maintenance",             shortName: "Skilled Trades",        Icon: HandymanRoundedIcon },
    "construction-contracting":           { name: "Construction & Contracting",               shortName: "Construction",          Icon: ConstructionRoundedIcon },
    "manufacturing-production":           { name: "Manufacturing & Production",               shortName: "Manufacturing",         Icon: PrecisionManufacturingRoundedIcon },
    "warehouse-transportation-logistics": { name: "Warehouse, Transportation & Logistics",    shortName: "Warehouse & Logistics", Icon: LocalShippingRoundedIcon },
    "hospitality-food-service":           { name: "Hospitality & Food Service",               shortName: "Hospitality & Food",    Icon: RestaurantRoundedIcon },
    "retail-merchandising":               { name: "Retail & Merchandising",                   shortName: "Retail",                Icon: StorefrontRoundedIcon },
    "cleaning-security-general-labor":    { name: "Cleaning, Security & General Labor",       shortName: "Cleaning & Security",   Icon: CleaningServicesRoundedIcon },
    "professional-services":              { name: "Professional Services",                    shortName: "Professional Services", Icon: GavelRoundedIcon },
    "government-public-safety-community": { name: "Government, Public Safety & Community",    shortName: "Government & Safety",   Icon: GppGoodRoundedIcon },
    "nonprofit-social-services":          { name: "Nonprofit & Social Services",              shortName: "Nonprofit & Social",    Icon: VolunteerActivismRoundedIcon },
    "agriculture-outdoor-environmental":  { name: "Agriculture, Outdoor & Environmental",     shortName: "Agriculture & Outdoor", Icon: AgricultureRoundedIcon },
    "other":                              { name: "Other",                                    shortName: "Other",                 Icon: CategoryRoundedIcon },
};

/**
 * Returns { name, shortName, Icon } for a category slug, or null if not found.
 */
export function getCategoryInfo(slug) {
    const key = String(slug || "").toLowerCase().trim();
    if (!key) return null;
    const entry = CATEGORY_MAP[key];
    if (entry) return entry;
    // Fallback: humanise the slug
    const humanised = key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { name: humanised, shortName: humanised, Icon: CategoryRoundedIcon };
}

/* ══════════════════════════════════════════════════════════════════════
   JOB TYPE LABEL
   ══════════════════════════════════════════════════════════════════════ */

const JOB_TYPE_MAP = {
    FT:         "Full-time",
    PT:         "Part-time",
    Contract:   "Contract",
    Temp:       "Temporary",
    Internship: "Internship",
};

export function getJobTypeLabel(raw) {
    const key = String(raw || "").trim();
    if (!key) return "";
    return JOB_TYPE_MAP[key] || key;
}

/* ══════════════════════════════════════════════════════════════════════
   EXPERIENCE LEVEL LABEL  (new v2)
   ══════════════════════════════════════════════════════════════════════ */

const EXP_LEVEL_MAP = {
    entry:     "Entry Level",
    mid:       "Mid Level",
    senior:    "Senior Level",
    lead:      "Lead / Manager",
    executive: "Executive",
    any:       "Any Experience",
};

/**
 * Returns a human-readable label for an experience level slug.
 * Returns empty string if the value is empty / not specified.
 */
export function getExperienceLevelLabel(raw) {
    const key = String(raw || "").trim().toLowerCase();
    if (!key) return "";
    return EXP_LEVEL_MAP[key] || key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ══════════════════════════════════════════════════════════════════════
   EXPIRY FORMATTING
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Returns { label, dateLabel, urgency, isExpired } for a job expiresAt ISO string.
 * urgency: "expired" | "critical" | "normal"
 */
export function formatExpiryInfo(expiresAt) {
    if (!expiresAt) return null;

    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.valueOf())) return null;

    const diffMs = exp.getTime() - Date.now();
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs <= 0;

    const dateLabel = exp.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    if (isExpired) {
        return { label: "Expired", dateLabel, urgency: "expired", isExpired: true };
    }

    if (daysLeft <= 3) {
        return { label: `Expires in ${daysLeft}d`, dateLabel, urgency: "critical", isExpired: false };
    }

    if (daysLeft <= 7) {
        return { label: `${daysLeft}d left`, dateLabel, urgency: "critical", isExpired: false };
    }

    return { label: `${daysLeft}d left`, dateLabel, urgency: "normal", isExpired: false };
}

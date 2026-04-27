// src/pages/services/utils/serviceHelpers.js
//
// Shared lookups for service category icons/names and price model labels.
// Used by ServiceCard, ServiceDetailPanel, CreateServiceModal, ServicesFilters.
//
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import PlumbingRoundedIcon from "@mui/icons-material/PlumbingRounded";
import ElectricalServicesRoundedIcon from "@mui/icons-material/ElectricalServicesRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import FormatPaintRoundedIcon from "@mui/icons-material/FormatPaintRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

export const SERVICE_CATEGORY_MAP = {
    "home-repair-handyman":     { name: "Home Repair & Handyman",     Icon: HandymanRoundedIcon },
    "lawn-care-landscaping":    { name: "Lawn Care & Landscaping",    Icon: GrassRoundedIcon },
    "cleaning":                 { name: "Cleaning Services",          Icon: CleaningServicesRoundedIcon },
    "plumbing":                 { name: "Plumbing",                   Icon: PlumbingRoundedIcon },
    "electrical":               { name: "Electrical",                 Icon: ElectricalServicesRoundedIcon },
    "hvac":                     { name: "HVAC & Climate",             Icon: AcUnitRoundedIcon },
    "painting-drywall":         { name: "Painting & Drywall",         Icon: FormatPaintRoundedIcon },
    "roofing-exteriors":        { name: "Roofing & Exteriors",        Icon: RoofingRoundedIcon },
    "auto-repair-detailing":    { name: "Auto Repair & Detailing",    Icon: DirectionsCarRoundedIcon },
    "moving-hauling":           { name: "Moving & Hauling",           Icon: LocalShippingRoundedIcon },
    "tutoring-education":       { name: "Tutoring & Education",       Icon: SchoolRoundedIcon },
    "childcare":                { name: "Childcare & Babysitting",    Icon: ChildCareRoundedIcon },
    "pet-care":                 { name: "Pet Care",                   Icon: PetsRoundedIcon },
    "photography-videography":  { name: "Photography & Videography",  Icon: CameraAltRoundedIcon },
    "music-entertainment":      { name: "Music & Entertainment",      Icon: MusicNoteRoundedIcon },
    "beauty-personal-care":     { name: "Beauty & Personal Care",     Icon: SpaRoundedIcon },
    "catering-food":            { name: "Catering & Food",            Icon: RestaurantRoundedIcon },
    "technology-it":            { name: "Technology & IT Support",     Icon: ComputerRoundedIcon },
    "accounting-tax":           { name: "Accounting & Tax",           Icon: AccountBalanceRoundedIcon },
    "legal":                    { name: "Legal Services",             Icon: GavelRoundedIcon },
    "fitness-wellness":         { name: "Fitness & Wellness",         Icon: FitnessCenterRoundedIcon },
    "event-planning":           { name: "Event Planning",             Icon: EventRoundedIcon },
    "other":                    { name: "Other",                      Icon: CategoryRoundedIcon },
};

export function getServiceCategoryInfo(slug) {
    const key = String(slug || "").trim().toLowerCase();
    return SERVICE_CATEGORY_MAP[key] || { name: slug || "Other", Icon: CategoryRoundedIcon };
}

/** Flat array for dropdowns (same order as DB sort_order) */
export const SERVICE_CATEGORIES = [
    { slug: "home-repair-handyman",     name: "Home Repair & Handyman",     Icon: HandymanRoundedIcon },
    { slug: "lawn-care-landscaping",    name: "Lawn Care & Landscaping",    Icon: GrassRoundedIcon },
    { slug: "cleaning",                 name: "Cleaning Services",          Icon: CleaningServicesRoundedIcon },
    { slug: "plumbing",                 name: "Plumbing",                   Icon: PlumbingRoundedIcon },
    { slug: "electrical",               name: "Electrical",                 Icon: ElectricalServicesRoundedIcon },
    { slug: "hvac",                     name: "HVAC & Climate",             Icon: AcUnitRoundedIcon },
    { slug: "painting-drywall",         name: "Painting & Drywall",         Icon: FormatPaintRoundedIcon },
    { slug: "roofing-exteriors",        name: "Roofing & Exteriors",        Icon: RoofingRoundedIcon },
    { slug: "auto-repair-detailing",    name: "Auto Repair & Detailing",    Icon: DirectionsCarRoundedIcon },
    { slug: "moving-hauling",           name: "Moving & Hauling",           Icon: LocalShippingRoundedIcon },
    { slug: "tutoring-education",       name: "Tutoring & Education",       Icon: SchoolRoundedIcon },
    { slug: "childcare",                name: "Childcare & Babysitting",    Icon: ChildCareRoundedIcon },
    { slug: "pet-care",                 name: "Pet Care",                   Icon: PetsRoundedIcon },
    { slug: "photography-videography",  name: "Photography & Videography",  Icon: CameraAltRoundedIcon },
    { slug: "music-entertainment",      name: "Music & Entertainment",      Icon: MusicNoteRoundedIcon },
    { slug: "beauty-personal-care",     name: "Beauty & Personal Care",     Icon: SpaRoundedIcon },
    { slug: "catering-food",            name: "Catering & Food",            Icon: RestaurantRoundedIcon },
    { slug: "technology-it",            name: "Technology & IT Support",     Icon: ComputerRoundedIcon },
    { slug: "accounting-tax",           name: "Accounting & Tax",           Icon: AccountBalanceRoundedIcon },
    { slug: "legal",                    name: "Legal Services",             Icon: GavelRoundedIcon },
    { slug: "fitness-wellness",         name: "Fitness & Wellness",         Icon: FitnessCenterRoundedIcon },
    { slug: "event-planning",           name: "Event Planning",             Icon: EventRoundedIcon },
    { slug: "other",                    name: "Other",                      Icon: CategoryRoundedIcon },
];

export const PRICE_MODEL_LABELS = {
    "hourly": "Hourly",
    "flat":   "Flat Rate",
    "quote":  "Quote",
    "free":   "Free",
};

export function getPriceModelLabel(code) {
    return PRICE_MODEL_LABELS[code] || code || "";
}

export function formatPriceRange(priceModel, min, max) {
    if (priceModel === "free") return "Free";
    if (priceModel === "quote") return "Get a Quote";

    const hasMin = min != null && Number.isFinite(Number(min));
    const hasMax = max != null && Number.isFinite(Number(max));
    const suffix = priceModel === "hourly" ? "/hr" : "";

    if (hasMin && hasMax && Number(min) !== Number(max)) {
        return `$${Number(min).toLocaleString()}–$${Number(max).toLocaleString()}${suffix}`;
    }
    if (hasMin) return `$${Number(min).toLocaleString()}${suffix}`;
    if (hasMax) return `Up to $${Number(max).toLocaleString()}${suffix}`;
    return getPriceModelLabel(priceModel);
}

export const PROVIDER_TYPE_LABELS = {
    "user":     "Personal",
    "business": "Business",
    "music":    "Music",
};

export function getProviderTypeLabel(type) {
    return PROVIDER_TYPE_LABELS[type] || type || "Provider";
}

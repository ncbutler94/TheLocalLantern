// src/pages/music/utils/artistCategoryIcons.js
/**
 * Art-category catalog + icon mapping for visual-artist profiles.
 *
 * Mirrors the shape of getGenreIcon() used for musicians in ArtistCard.jsx
 * so chip rendering can swap between music genres and art categories based
 * on artist.profile_type without any other styling changes.
 *
 * Same hardcoded list lives conceptually in GenreTab's picker — it imports
 * ART_CATEGORIES from here so there's exactly one source of truth.
 */

import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import DesktopMacRoundedIcon from "@mui/icons-material/DesktopMacRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import MuseumRoundedIcon from "@mui/icons-material/MuseumRounded";
import EmojiFoodBeverageRoundedIcon from "@mui/icons-material/EmojiFoodBeverageRounded";
import AutoAwesomeMosaicRoundedIcon from "@mui/icons-material/AutoAwesomeMosaicRounded";
import CheckroomRoundedIcon from "@mui/icons-material/CheckroomRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import CarpenterRoundedIcon from "@mui/icons-material/CarpenterRounded";
import DesignServicesRoundedIcon from "@mui/icons-material/DesignServicesRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import FormatPaintRoundedIcon from "@mui/icons-material/FormatPaintRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";

// Canonical list — keep in sync with the picker in GenreTab.jsx.
// Order here controls the order of chips in the picker.
export const ART_CATEGORIES = [
    "Painting",
    "Drawing & Illustration",
    "Photography",
    "Digital Art",
    "Printmaking",
    "Sculpture",
    "Ceramics & Pottery",
    "Mixed Media",
    "Textile & Fiber Art",
    "Jewelry",
    "Woodworking",
    "Graphic Design",
    "Calligraphy & Lettering",
    "Collage",
    "Street Art / Murals",
    "Tattoo Art",
    "Glass Art",
    "Leatherwork",
];

/**
 * Return a MUI icon component for an art-category string.
 * Substring match (case-insensitive) so minor label variants still resolve.
 * Falls back to a palette icon.
 */
export function getCategoryIcon(category) {
    const c = String(category || "").toLowerCase().trim();

    if (c.includes("paint") && !c.includes("street")) return BrushRoundedIcon;
    if (c.includes("drawing") || c.includes("illustration")) return EditRoundedIcon;
    if (c.includes("photo")) return PhotoCameraRoundedIcon;
    if (c.includes("digital")) return DesktopMacRoundedIcon;
    if (c.includes("printmaking") || c.includes("print ")) return GridViewRoundedIcon;
    if (c.includes("sculpt")) return MuseumRoundedIcon;
    if (c.includes("ceramic") || c.includes("pottery")) return EmojiFoodBeverageRoundedIcon;
    if (c.includes("mixed media")) return AutoAwesomeMosaicRoundedIcon;
    if (c.includes("textile") || c.includes("fiber") || c.includes("fibre")) return CheckroomRoundedIcon;
    if (c.includes("jewelry") || c.includes("jewellery")) return DiamondRoundedIcon;
    if (c.includes("wood")) return CarpenterRoundedIcon;
    if (c.includes("graphic")) return DesignServicesRoundedIcon;
    if (c.includes("calligraphy") || c.includes("lettering")) return DrawRoundedIcon;
    if (c.includes("collage")) return DashboardCustomizeRoundedIcon;
    if (c.includes("street") || c.includes("mural")) return FormatPaintRoundedIcon;
    if (c.includes("tattoo")) return ColorLensRoundedIcon;
    if (c.includes("glass")) return AutoAwesomeRoundedIcon;
    if (c.includes("leather")) return LocalMallRoundedIcon;

    return PaletteRoundedIcon;
}

/**
 * Convenience check. Some components receive an `artist` row and need to
 * decide between getGenreIcon and getCategoryIcon.
 */
export function isVisualArtistProfile(artist) {
    const t = String(artist?.profile_type || artist?.profileType || "").toLowerCase();
    return t === "artist";
}

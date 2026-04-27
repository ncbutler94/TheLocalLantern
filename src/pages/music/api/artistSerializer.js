/**
 * Artist Serializer (Updated for Admin Console)
 *
 * Location: src/pages/music/api/artistSerializer.js
 *
 * Maps backend music_artists fields to frontend-friendly camelCase
 *
 * Changes from original:
 * - Added premium tier fields
 * - Added verification fields
 * - Added new profile fields (tagline, foundingYear, hometown)
 * - Added settings parsing
 */

function parseJsonField(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Normalize photos array
 */
function normalizePhotos(raw) {
    const photosRaw = raw.photos || raw.photoUrls || raw.photo_urls || [];

    if (!Array.isArray(photosRaw)) return [];

    return photosRaw.map((p) => {
        if (p && typeof p === "object" && p.url) {
            return {
                id: p.id || null,
                url: p.url,
                objectPath: p.objectPath || p.object_path || "",
                kind: p.kind || "gallery",
                sortOrder: p.sortOrder ?? p.sort_order ?? 0,
            };
        }
        if (typeof p === "string" && p.trim()) {
            return {
                id: null,
                url: p.trim(),
                objectPath: "",
                kind: "gallery",
                sortOrder: 0,
            };
        }
        return null;
    }).filter(Boolean);
}

/**
 * Get just the URLs from normalized photos
 */
function getPhotoUrls(photos) {
    if (!Array.isArray(photos)) return [];
    return photos.map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && p.url) return p.url;
        return null;
    }).filter(Boolean);
}

/**
 * Serialize a single artist from backend format to frontend format
 */
export function serializeArtist(raw) {
    if (!raw) return null;

    const genres = parseJsonField(raw.genres_json || raw.genresJson || raw.genres);
    const links = parseJsonField(raw.links_json || raw.linksJson || raw.links);
    const settings = parseJsonField(raw.settings_json || raw.settingsJson || raw.settings);
    const photos = normalizePhotos(raw);

    return {
        // Core fields
        id: raw.id,
        ownerUserId: raw.owner_user_id || raw.ownerUserId || null,
        name: raw.name || "",
        handle: raw.handle || "",
        status: raw.status || null,

        // Profile sub-type: 'music' (musicians) or 'artist' (visual artists).
        // Normalized to one of those two values; anything unrecognized falls
        // back to 'music' so legacy rows without the column still render.
        profileType: (() => {
            const raw_ = String(raw.profile_type || raw.profileType || "").toLowerCase();
            return (raw_ === "artist") ? "artist" : "music";
        })(),

        // Location
        city: raw.city || "",
        county: raw.county || "",
        latitude: raw.latitude != null ? Number(raw.latitude) : null,
        longitude: raw.longitude != null ? Number(raw.longitude) : null,
        isStatewide: Boolean(raw.is_statewide || raw.isStatewide),

        // Profile content
        bio: raw.bio || "",
        tagline: raw.tagline || "",
        foundingYear: raw.founding_year || raw.foundingYear || null,
        hometown: raw.hometown || "",

        // Media
        avatarUrl: raw.avatar_url || raw.avatarUrl || "",
        coverUrl: raw.cover_url || raw.coverUrl || "",
        featuredVideoUrl: raw.featured_video_url || raw.featuredVideoUrl || "",

        // JSON fields
        genres: Array.isArray(genres) ? genres : [],
        links: links && typeof links === "object" ? links : {},
        settings: settings && typeof settings === "object" ? settings : {},

        // Premium/Subscription
        isPremium: Boolean(raw.is_premium || raw.isPremium),
        premiumTier: raw.premium_tier || raw.premiumTier || "free",
        premiumStartedAt: raw.premium_started_at || raw.premiumStartedAt || null,
        premiumExpiresAt: raw.premium_expires_at || raw.premiumExpiresAt || null,

        // Verification
        isVerified: Boolean(raw.is_verified || raw.isVerified),
        verifiedAt: raw.verified_at || raw.verifiedAt || null,
        verificationStatus: raw.verification_status || raw.verificationStatus || "none",
        verificationRequestedAt: raw.verification_requested_at || raw.verificationRequestedAt || null,

        // Timestamps
        createdAt: raw.created_at || raw.createdAt || null,
        updatedAt: raw.updated_at || raw.updatedAt || null,
        lastActiveAt: raw.last_active_at || raw.lastActiveAt || null,

        // Stats
        profileViews: Number(raw.profile_views || raw.profileViews || 0),
        followersCount: Number(raw.followers_count || raw.followersCount || 0),
        releasesCount: Number(raw.releases_count || raw.releasesCount || 0),
        tracksCount: Number(raw.tracks_count || raw.tracksCount || 0),
        monthlyListeners: Number(raw.monthly_listeners || raw.monthlyListeners || 0),

        // Handle change tracking
        handleChangesJson: raw.handle_changes_json || raw.handleChangesJson || null,

        // Photos
        photos: photos,
        photoUrls: getPhotoUrls(photos),
    };
}

/**
 * Serialize a list of artists
 */
export function serializeArtistsList(items) {
    if (!Array.isArray(items)) return [];
    return items.map(serializeArtist).filter(Boolean);
}

export default {
    serializeArtist,
    serializeArtistsList,
};

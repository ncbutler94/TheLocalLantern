/**
 * Service Profiles API (Provider profiles)
 *
 * These are NOT separate logins. They are entities owned by users.
 * Users can later invite members to manage a profile.
 *
 * Keep this aligned with other module API helpers.
 */

export async function fetchServiceProfileById(serviceProfileId) {
    // TODO: replace with real HTTP call
    // Example:
    // return api.get(`/services/profiles/${serviceProfileId}`);

    return null;
}

export async function fetchMyServiceProfiles() {
    // TODO: for header account switcher + management
    // return api.get("/services/profiles/mine");
    return [];
}

export async function createServiceProfile(payload) {
    // TODO: may be created implicitly when the first service listing is created
    // return api.post("/services/profiles", payload);
    return { success: true };
}

export async function inviteServiceProfileMember(serviceProfileId, payload) {
    // TODO: invite member to manage this profile
    // return api.post(`/services/profiles/${serviceProfileId}/invites`, payload);
    return { success: true };
}

// frontend/src/api/community/volunteerHelp.js
// ─────────────────────────────────────────────────────────────────────────────
// Security: uses the hardened axiosInstance (CSRF, token-expiry, rate-limit).
// Do NOT import raw axios — always go through the shared instance.
//
// NOTE: removed manual { withCredentials, headers } — same reasoning as
// recommendations.js.  The shared instance handles credentials, and
// Content-Type is auto-detected for FormData.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../../api/axiosInstance';

/**
 * Create a new Volunteer Help request.
 *
 * @param {FormData} formData – title, description, up to 4 photos, location…
 * @returns {Promise<{ id: number, photos: string[] }>}
 */
export async function createVolunteerRequest(formData) {
    const { data } = await api.post('/api/volunteer-help', formData);
    return data; // { id, photos }
}

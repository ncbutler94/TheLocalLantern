// frontend/src/api/community/generalDiscussion.js
// ─────────────────────────────────────────────────────────────────────────────
// Security: uses the hardened axiosInstance (CSRF, token-expiry, rate-limit).
// Do NOT import raw axios — always go through the shared instance.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../../api/axiosInstance';

/**
 * Create a new General Discussion post.
 *
 * @param {FormData} formData – title, description, photos, location fields, etc.
 * @returns {Promise<{ id: number, photos: string[] }>}
 */
export async function createGeneralDiscussion(formData) {
    const { data } = await api.post('/api/community-chat', formData);
    return data; // { id, photos }
}

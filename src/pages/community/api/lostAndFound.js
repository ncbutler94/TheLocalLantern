// frontend/src/api/community/lostAndFound.js
// ─────────────────────────────────────────────────────────────────────────────
// Security: uses the hardened axiosInstance (CSRF, token-expiry, rate-limit).
// Do NOT import raw axios — always go through the shared instance.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../../api/axiosInstance';

/**
 * Create a new Lost & Found post.
 *
 * @param {FormData} formData – title, description, files, location…
 * @returns {Promise<{ id: number, photos: string[] }>}
 */
export async function createLostAndFound(formData) {
    const { data } = await api.post('/api/lost-and-found', formData);
    return data; // { id, photos }
}

// frontend/src/api/community/recommendations.js
// ─────────────────────────────────────────────────────────────────────────────
// Security: uses the hardened axiosInstance (CSRF, token-expiry, rate-limit).
// Do NOT import raw axios — always go through the shared instance.
//
// NOTE: removed the manual { withCredentials, headers } overrides — the
// shared instance already sets withCredentials: true, and axios auto-detects
// Content-Type: multipart/form-data when you pass a FormData object.
// Manually setting the Content-Type header actually BREAKS multipart uploads
// because axios won't append the boundary string.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../../api/axiosInstance';

/**
 * Create a new Recommendation / Tip post.
 *
 * @param {FormData} formData – title, description, photos, location…
 * @returns {Promise<{ id: number, photos: string[] }>}
 */
export async function createRecommendation(formData) {
    const { data } = await api.post('/api/recommendations', formData);
    return data; // { id, photos }
}

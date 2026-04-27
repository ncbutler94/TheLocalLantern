// frontend/src/api/community/publicSafety.js
// ─────────────────────────────────────────────────────────────────────────────
// Security: uses the hardened axiosInstance (CSRF, token-expiry, rate-limit).
// Do NOT import raw axios — always go through the shared instance.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../../api/axiosInstance';

/**
 * Create a new Public Safety alert.
 *
 * @param {FormData} formData – title, severity, alert_type, photos, etc.
 * @returns {Promise<{ id: number, photos: string[] }>}
 */
export async function createPublicSafetyAlert(formData) {
    const { data } = await api.post('/api/public-safety', formData);
    return data; // { id, photos }
}

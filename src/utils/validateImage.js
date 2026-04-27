// src/utils/validateImage.js
/**
 * Shared image validation — mirrors the rules from NewAnnouncementForm.
 *
 * Usage:
 *   import { validateImageFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../utils/validateImage';
 *
 *   const error = validateImageFile(file);
 *   if (error) { setError(error); return; }
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);

/**
 * Validate a single image file for type and size.
 * @param {File} file
 * @returns {string|null} Error message, or null if valid.
 */
export function validateImageFile(file) {
    if (!file) return 'No file selected.';

    const type = String(file.type || '').toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(type)) {
        return 'Invalid image type. Only JPG, PNG, WEBP, and GIF are allowed.';
    }

    if (Number(file.size || 0) > MAX_IMAGE_BYTES) {
        return 'Image is too large. Maximum size is 10 MB.';
    }

    return null;
}

/**
 * Validate an array of files, returning accepted files and an error summary.
 * Mirrors NewAnnouncementForm's addFiles() validation logic.
 *
 * @param {FileList|File[]} fileList
 * @returns {{ accepted: File[], error: string }}
 */
export function validateImageFiles(fileList) {
    const all = Array.from(fileList || []);
    const accepted = [];
    let rejectedType = 0;
    let rejectedSize = 0;

    all.forEach((f) => {
        if (!f) return;
        const type = String(f.type || '').toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.has(type)) {
            rejectedType += 1;
            return;
        }
        if (Number(f.size || 0) > MAX_IMAGE_BYTES) {
            rejectedSize += 1;
            return;
        }
        accepted.push(f);
    });

    let error = '';
    if (rejectedType || rejectedSize) {
        error = 'Some images were skipped. Only JPG, PNG, WEBP, or GIF images up to 10 MB are allowed.';
    }

    return { accepted, error };
}

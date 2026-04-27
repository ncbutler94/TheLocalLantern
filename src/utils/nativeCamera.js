// src/utils/nativeCamera.js
//
// Unified photo picker/camera capture that returns a File object
// (the same shape your existing upload code probably expects).
// On web, it falls back to a hidden <input type="file"> picker.

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Pick or capture an image.
 *
 * @param {Object} opts
 * @param {'camera'|'photos'|'prompt'} [opts.source='prompt']
 *   'camera'  → skip picker, open camera directly
 *   'photos'  → skip picker, open gallery directly
 *   'prompt'  → let user choose (default, most apps use this)
 * @param {number} [opts.quality=85] 0-100 JPEG quality
 * @param {boolean} [opts.allowEditing=false] crop/edit UI on native
 *
 * @returns {Promise<File>} A File object ready to append to FormData.
 */
export async function pickPhoto({
                                    source = 'prompt',
                                    quality = 85,
                                    allowEditing = false,
                                } = {}) {
    if (Capacitor.isNativePlatform()) {
        const sourceMap = {
            camera: CameraSource.Camera,
            photos: CameraSource.Photos,
            prompt: CameraSource.Prompt,
        };

        const photo = await Camera.getPhoto({
            quality,
            allowEditing,
            resultType: CameraResultType.Uri, // file URL we can fetch into a Blob
            source: sourceMap[source] ?? CameraSource.Prompt,
            // Capacitor needs this to save to a temporary location it can read
            saveToGallery: false,
        });

        // Convert the local file URI to a Blob, then wrap as a File
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const filename = `photo-${Date.now()}.${photo.format || 'jpg'}`;
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    }

    // Web fallback — trigger an <input type="file"> programmatically
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // 'camera' hint on mobile browsers — opens camera if supported
        if (source === 'camera') input.capture = 'environment';
        input.style.display = 'none';

        input.onchange = () => {
            const file = input.files && input.files[0];
            document.body.removeChild(input);
            if (!file) return reject(new Error('No file selected'));
            resolve(file);
        };
        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('Picker cancelled'));
        };

        document.body.appendChild(input);
        input.click();
    });
}

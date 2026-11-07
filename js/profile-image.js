/* Local image processing only. Upload happens when the profile form is saved. */
(function (root) {
  'use strict';
  const maxFileBytes = 10 * 1024 * 1024;
  function prepare(file) {
    if (!file || !file.type?.startsWith('image/') || file.type === 'image/svg+xml' || !file.size) return Promise.reject(new Error('profile.photoInvalid'));
    if (file.size > maxFileBytes) return Promise.reject(new Error('profile.photoTooLarge'));
    return new Promise((resolve, reject) => {
      const image = new Image(), url = URL.createObjectURL(file);
      const fail = () => { URL.revokeObjectURL(url); reject(new Error('profile.photoInvalid')); };
      image.onerror = fail;
      image.onload = () => {
        try {
          const width = image.naturalWidth, height = image.naturalHeight, side = Math.min(width, height);
          if (!side) { fail(); return; }
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
          const context = canvas.getContext('2d');
          context.fillStyle = '#fff'; context.fillRect(0, 0, 256, 256);
          context.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 256, 256);
          const data = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);
          if (!data.startsWith('data:image/jpeg;base64,') || data.length > 350000) { reject(new Error('profile.photoInvalid')); return; }
          resolve(data);
        } catch { fail(); }
      };
      image.decoding = 'async'; image.src = url;
    });
  }
  const api = { prepare, maxFileBytes };
  if (root) root.IEBProfileImage = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : null);

/**
 * Compress + resize an image file to a small JPEG data-URL for profile upload.
 * Target: ≤256px, ~quality 0.82, under ~100KB.
 */
export async function compressImageToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, or WebP).');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image is too large. Pick a file under 8MB.');
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Could not process image on this device.');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 160_000 && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > 180_000) {
    throw new Error('Could not shrink this photo enough. Try a simpler image.');
  }

  return dataUrl;
}

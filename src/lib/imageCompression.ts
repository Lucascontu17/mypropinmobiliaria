/**
 * Compresión de imágenes en el navegador.
 *
 * Reduce el peso de las fotos ANTES de enviarlas al backend (que luego las
 * sube a Cloudflare R2), para que la creación/edición de propiedades con
 * muchas fotos sea mucho más rápida.
 *
 * - Si no es imagen, es GIF/SVG, o ya es liviana (< 300 KB) → devuelve el original.
 * - Si no, la escala a máx. 1600 px (lado mayor), pinta fondo blanco y
 *   re-encodea a JPEG calidad 0.82.
 * - Si algo falla (ej. HEIC no decodificable), devuelve el original (nunca se pierde la foto).
 */

const MAX_DIMENSION = 1600; // px en el lado mayor
const QUALITY = 0.82; // calidad JPEG
const SIZE_THRESHOLD = 300 * 1024; // 300 KB: no comprimir si ya es liviana
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']); // no romper GIF animado / SVG

/**
 * Carga un File como HTMLImageElement usando un object URL.
 * (Compatible con todos los navegadores, a diferencia de createImageBitmap.)
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen'));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (SKIP_TYPES.has(file.type)) return file;
  if (file.size <= SIZE_THRESHOLD) return file;

  try {
    const img = await loadImage(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (!width || !height) return file;

    // No ampliar imágenes que ya son pequeñas
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Fondo blanco para evitar fondo negro en PNGs con transparencia
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );

    if (!blob || blob.size === 0) return file;

    // Si la compresión no redujo el tamaño, conservar la original
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch (err) {
    console.warn('[COMPRESS] Fallback a imagen original:', err);
    return file;
  }
}

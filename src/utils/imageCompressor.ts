/**
 * Client-Side Botanical Image Compressor & Optimizer
 * 
 * Takes high-resolution phone/camera photos (e.g. 4K/12MB+), downsamples dimensions
 * to a maximum constraint (default 1600px max dimension), and applies quality compression
 * to achieve a lightweight ~400KB-800KB payload for instant Gemini AI processing.
 */

export interface CompressionOptions {
  maxDimension?: number; // Max width or height in pixels (default: 1600)
  targetMaxSizeBytes?: number; // Target max size in bytes (default: 800 * 1024 = 800KB)
  initialQuality?: number; // Starting JPEG quality 0..1 (default: 0.85)
  minQuality?: number; // Minimum acceptable quality (default: 0.65)
  outputType?: 'image/jpeg' | 'image/webp';
}

export interface CompressionResult {
  base64: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  compressionRatio: number; // e.g. 0.85 = 85% reduction
  formattedOriginalSize: string;
  formattedCompressedSize: string;
  durationMs: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Loads an image source (File, Blob, or base64 URL) into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for compression: ' + e));
    img.src = src;
  });
}

/**
 * Calculates new width & height respecting the maxDimension while preserving aspect ratio.
 */
function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    const scale = maxDimension / width;
    return {
      width: Math.round(maxDimension),
      height: Math.round(height * scale)
    };
  } else {
    const scale = maxDimension / height;
    return {
      width: Math.round(scale * width),
      height: Math.round(maxDimension)
    };
  }
}

/**
 * Compresses and resizes an image File or Base64 data URL to an optimized format.
 */
export async function compressImage(
  source: File | Blob | string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = performance.now();
  const maxDimension = options.maxDimension || 1600;
  const targetMaxSizeBytes = options.targetMaxSizeBytes || 800 * 1024; // 800 KB
  const initialQuality = options.initialQuality ?? 0.85;
  const minQuality = options.minQuality ?? 0.65;
  const outputType = options.outputType || 'image/jpeg';

  let srcUrl: string;
  let originalSizeBytes: number;
  let shouldRevoke = false;

  if (typeof source === 'string') {
    srcUrl = source;
    // Estimate original size from base64 string length
    const base64Clean = source.split(',')[1] || source;
    originalSizeBytes = Math.round((base64Clean.length * 3) / 4);
  } else {
    srcUrl = URL.createObjectURL(source);
    originalSizeBytes = source.size;
    shouldRevoke = true;
  }

  try {
    const img = await loadImage(srcUrl);
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    const { width, height } = calculateScaledDimensions(originalWidth, originalHeight, maxDimension);

    // Render to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality bicubic-like interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw background to avoid black background if PNG has transparency
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, 0, 0, width, height);

    // Iteratively find optimal quality if file is too large
    let currentQuality = initialQuality;
    let base64Result = canvas.toDataURL(outputType, currentQuality);
    let currentSizeBytes = Math.round(((base64Result.length - base64Result.indexOf(',') - 1) * 3) / 4);

    // If still larger than target, reduce quality progressively
    let iterations = 0;
    while (currentSizeBytes > targetMaxSizeBytes && currentQuality > minQuality && iterations < 3) {
      currentQuality = Math.max(minQuality, currentQuality - 0.1);
      base64Result = canvas.toDataURL(outputType, currentQuality);
      currentSizeBytes = Math.round(((base64Result.length - base64Result.indexOf(',') - 1) * 3) / 4);
      iterations++;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const compressionRatio = originalSizeBytes > 0 
      ? Math.max(0, Math.round(((originalSizeBytes - currentSizeBytes) / originalSizeBytes) * 100))
      : 0;

    return {
      base64: base64Result,
      originalSizeBytes,
      compressedSizeBytes: currentSizeBytes,
      originalWidth,
      originalHeight,
      width,
      height,
      compressionRatio,
      formattedOriginalSize: formatBytes(originalSizeBytes),
      formattedCompressedSize: formatBytes(currentSizeBytes),
      durationMs
    };
  } finally {
    if (shouldRevoke) {
      URL.revokeObjectURL(srcUrl);
    }
  }
}

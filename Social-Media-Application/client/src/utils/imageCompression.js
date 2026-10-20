// Browser-side image compression before upload: no library, just a canvas.
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // checked on the final (compressed) file
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024; // refuse to decode anything bigger
const QUALITY = 0.85;

export function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Decodes with EXIF orientation applied, so phone photos are not sideways.
async function decode(file) {
    if (typeof createImageBitmap === "function") {
        try {
            return await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch (e) {
            // Older engines reject the options object; fall through to <img>, which applies
            // EXIF orientation by default in current browsers.
        }
    }
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.decoding = "async";
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function toBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export function readAsDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read this image. Try another file."));
        reader.readAsDataURL(blob);
    });
}

/**
 * Resizes so the long edge is at most maxEdge and re-encodes as WebP (JPEG where the
 * browser can't encode WebP). GIFs are passed through to keep animation. If the result
 * is not smaller and the original needs no resizing, the original is kept.
 * Returns { blob, originalSize, finalSize, width, height, type, compressed }.
 */
export async function compressImage(file, { maxEdge = 1600, quality = QUALITY } = {}) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
    }
    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error(`This image is too large to process (over ${formatBytes(MAX_SOURCE_BYTES)}).`);
    }
    const passThrough = (width = 0, height = 0) => ({
        blob: file, originalSize: file.size, finalSize: file.size, width, height, type: file.type, compressed: false,
    });
    if (file.type === "image/gif") {
        return passThrough();
    }

    let source;
    try {
        source = await decode(file);
    } catch (e) {
        throw new Error("Could not read this image. Try another file.");
    }
    const srcW = source.width;
    const srcH = source.height;
    const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    source.close?.();

    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
        // Safari < 17 silently returns PNG for unsupported types.
        blob = await toBlob(canvas, "image/jpeg", quality);
    }
    if (!blob) {
        return passThrough(srcW, srcH);
    }
    // Small PNG/WebP files that would only grow: keep the original bytes. JPEGs are always
    // re-encoded because they may carry an EXIF rotation that we have now applied.
    if (blob.size >= file.size && scale === 1 && file.type !== "image/jpeg") {
        return passThrough(srcW, srcH);
    }
    return { blob, originalSize: file.size, finalSize: blob.size, width, height, type: blob.type, compressed: true };
}

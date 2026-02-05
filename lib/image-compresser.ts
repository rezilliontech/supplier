import sharp from "sharp";

export type ImageFormat = "jpeg" | "png" | "webp";

interface ImageProcessOptions {
  width?: number;
  quality?: number;
  format?: ImageFormat;
}

/**
 * Default behavior:
 * - width: 1200px
 * - quality: 80
 * - format: jpeg
 */
export async function compressImage(
  file: File | Buffer,
  options: ImageProcessOptions = {},
) {
  const {
    width = 1200, // ✅ default width
    quality = 80,
    format = "jpeg", // ✅ default format
  } = options;

  const buffer =
    file instanceof Buffer
      ? file
      : Buffer.from(await (file as File).arrayBuffer());

  let image = sharp(buffer);

  image = image.resize({
    width,
    withoutEnlargement: true,
  });

  switch (format) {
    case "png":
      image = image.png({ quality });
      break;
    case "webp":
      image = image.webp({ quality });
      break;
    default:
      image = image.jpeg({ quality });
      break;
  }

  const processedBuffer = await image.toBuffer();

  return {
    buffer: processedBuffer,
    contentType: `image/${format}`,
    size: processedBuffer.length,
    format,
    width,
  };
}

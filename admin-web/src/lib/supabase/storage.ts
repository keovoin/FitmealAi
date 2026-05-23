import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./server";

/**
 * Allowed mime types for recipe imagery. Keep small — Supabase Storage
 * has its own per-bucket "allowed_mime_types" knob but we double-check
 * here so the upload never round-trips an obviously bogus file.
 */
const ALLOWED_RECIPE_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/** 8 MB — generous for a hero shot, far below Vercel's 4.5 MB body limit
 *  for traditional API routes. Server actions bypass that limit; this
 *  is the safety net on top. */
export const RECIPE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export class StorageUploadError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

export interface UploadedImage {
  /** Public CDN URL persisted in `recipes.image_url`. */
  url: string;
  /** Path inside the bucket, useful if we later add a "delete" flow. */
  storagePath: string;
}

/**
 * Upload a recipe image to the public `recipe-images` bucket and
 * return its CDN URL. The path is `<slug?>-<uuid>.<ext>` so two
 * "paneer-tikka.jpg" uploads can coexist without overwriting.
 *
 * Throws `StorageUploadError` on validation/upload failures so the
 * caller can surface a friendly toast.
 */
export async function uploadRecipeImage(opts: {
  buffer: Buffer;
  contentType: string;
  /** Optional human-readable hint used as the filename prefix. */
  slug?: string;
}): Promise<UploadedImage> {
  const { buffer, contentType, slug } = opts;

  if (!ALLOWED_RECIPE_IMAGE_MIME.has(contentType)) {
    throw new StorageUploadError(
      `Unsupported image type "${contentType}". Use PNG, JPEG, or WebP.`,
      "unsupported_mime",
    );
  }
  if (buffer.byteLength === 0) {
    throw new StorageUploadError("Image file is empty.", "empty_file");
  }
  if (buffer.byteLength > RECIPE_IMAGE_MAX_BYTES) {
    throw new StorageUploadError(
      `Image is ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB; max is ${
        RECIPE_IMAGE_MAX_BYTES / 1024 / 1024
      } MB.`,
      "too_large",
    );
  }

  const ext =
    contentType === "image/jpeg"
      ? "jpg"
      : contentType === "image/webp"
        ? "webp"
        : "png";
  const prefix = slug?.trim() ? `${slug.trim().slice(0, 40)}-` : "";
  const objectPath = `${prefix}${randomUUID()}.${ext}`;

  const sb = getSupabaseAdmin();
  const { error } = await sb.storage
    .from("recipe-images")
    .upload(objectPath, buffer, {
      contentType,
      upsert: false, // we generated a fresh UUID, collision implies a bug
      cacheControl: "31536000, immutable",
    });
  if (error) {
    throw new StorageUploadError(
      `Storage upload failed: ${error.message}`,
      "upload_failed",
    );
  }

  const { data } = sb.storage.from("recipe-images").getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new StorageUploadError(
      "Storage returned no public URL.",
      "no_public_url",
    );
  }

  return { url: data.publicUrl, storagePath: objectPath };
}

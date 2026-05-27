import { Readable } from "stream";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import sharp from "sharp";
import { connectMongo } from "@/lib/db";
import { ImageAsset } from "@/lib/models/image-asset";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB is not connected.");
  }

  return new GridFSBucket(mongoose.connection.db, { bucketName: "images" });
}

function streamToBuffer(stream: NodeJS.ReadableStream) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function writeGridFile(buffer: Buffer, filename: string, contentType: string, metadata: Record<string, unknown>) {
  const bucket = getBucket();
  const upload = bucket.openUploadStream(filename, {
    metadata: { ...metadata, contentType },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(upload).on("error", reject).on("finish", () => resolve());
  });

  return upload.id as ObjectId;
}

export async function saveImageToGridFS({
  file,
  uploadedBy,
}: {
  file: File;
  uploadedBy: string;
}) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, GIF, or WebP images are allowed.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 6 MB or smaller.");
  }

  await connectMongo();

  const source = Buffer.from(await file.arrayBuffer());
  const image = sharp(source, { animated: false }).rotate();
  const metadata = await image.metadata();

  const optimized = await image
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();

  const thumb = await image
    .clone()
    .resize({ width: 360, height: 260, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 68, effort: 4 })
    .toBuffer();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const ownerId = new ObjectId(uploadedBy);
  const baseMetadata = { uploadedBy: ownerId, originalMimeType: file.type };
  const fileId = await writeGridFile(optimized, `${crypto.randomUUID()}.webp`, "image/webp", baseMetadata);
  const thumbnailFileId = await writeGridFile(thumb, `${crypto.randomUUID()}-thumb.webp`, "image/webp", {
    ...baseMetadata,
    variant: "thumb",
  });

  const asset = await ImageAsset.create({
    fileId,
    thumbnailFileId,
    mimeType: "image/webp",
    width,
    height,
    size: optimized.length,
    thumbnailSize: thumb.length,
    uploadedBy: ownerId,
  });

  return {
    id: asset._id.toString(),
    url: `/api/images/${asset._id.toString()}`,
    thumbnailUrl: `/api/images/${asset._id.toString()}?variant=thumb`,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    size: asset.size,
  };
}

export async function getImageAssetStream(id: string, variant: "full" | "thumb") {
  await connectMongo();
  if (!ObjectId.isValid(id)) return null;

  const asset = await ImageAsset.findById(id).lean();
  if (!asset) return null;

  const bucket = getBucket();
  const fileId = variant === "thumb" ? asset.thumbnailFileId : asset.fileId;
  const stream = bucket.openDownloadStream(fileId as ObjectId);
  const buffer = await streamToBuffer(stream);

  return {
    buffer,
    mimeType: asset.mimeType,
    size: variant === "thumb" ? asset.thumbnailSize : asset.size,
    width: asset.width,
    height: asset.height,
  };
}

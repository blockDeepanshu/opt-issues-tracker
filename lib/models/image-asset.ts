import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const imageAssetSchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, required: true },
    thumbnailFileId: { type: Schema.Types.ObjectId, required: true },
    mimeType: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    size: { type: Number, required: true },
    thumbnailSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

imageAssetSchema.index({ createdAt: -1 });

export type ImageAssetDocument = InferSchemaType<typeof imageAssetSchema>;

export const ImageAsset =
  (mongoose.models.ImageAsset as Model<ImageAssetDocument>) ||
  mongoose.model("ImageAsset", imageAssetSchema);

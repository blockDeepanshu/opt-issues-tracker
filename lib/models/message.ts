import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderName: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    messageType: { type: String, enum: ["text", "image", "mixed"], required: true, default: "text" },
    imageId: { type: Schema.Types.ObjectId, ref: "ImageAsset" },
    imageMetadata: {
      mimeType: String,
      width: Number,
      height: Number,
      size: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ ticketId: 1, createdAt: 1 });
messageSchema.index({ messageType: 1, createdAt: -1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;

export const Message =
  (mongoose.models.Message as Model<MessageDocument>) ||
  mongoose.model("Message", messageSchema);

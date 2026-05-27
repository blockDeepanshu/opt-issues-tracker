import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    image: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
  (mongoose.models.User as Model<UserDocument>) || mongoose.model("User", userSchema);

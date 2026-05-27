import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 1000 },
});

export type CounterDocument = InferSchemaType<typeof counterSchema>;

export const Counter =
  (mongoose.models.Counter as Model<CounterDocument>) ||
  mongoose.model("Counter", counterSchema);

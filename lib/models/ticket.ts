import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { INSURANCE_PARTNERS, ISSUE_TYPES, PRIORITIES, TICKET_STATUSES } from "@/lib/constants";

const ticketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    issueType: { type: String, enum: ISSUE_TYPES, required: true, index: true },
    insurancePartner: {
      type: String,
      enum: INSURANCE_PARTNERS,
      index: true,
    },
    mobileNumber: { type: String, trim: true, index: true },
    issueDescription: { type: String, required: true, trim: true },
    raisedBy: { type: String, required: true, trim: true },
    priority: { type: String, enum: PRIORITIES, required: true, index: true },
    status: { type: String, enum: TICKET_STATUSES, default: "Pending", index: true },
    imageId: { type: Schema.Types.ObjectId, ref: "ImageAsset" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assigneeEmail: { type: String, lowercase: true, trim: true, index: true },
    assignedAt: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ priority: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ insurancePartner: 1, createdAt: -1 });
ticketSchema.index({ assigneeEmail: 1, status: 1 });
ticketSchema.index({
  ticketNumber: "text",
  issueDescription: "text",
  raisedBy: "text",
  mobileNumber: "text",
  insurancePartner: "text",
  assigneeEmail: "text",
});

export type TicketDocument = InferSchemaType<typeof ticketSchema>;

export const Ticket =
  (mongoose.models.Ticket as Model<TicketDocument>) || mongoose.model("Ticket", ticketSchema);

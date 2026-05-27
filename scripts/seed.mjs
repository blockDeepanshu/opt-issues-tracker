import mongoose from "mongoose";

const partners = [
  "HDFC Ergo",
  "ICICI Lombard",
  "Tata AIG",
  "Bajaj Allianz",
  "Reliance General",
  "Star Health",
  "Care Health",
];
const priorities = ["Low", "Medium", "High"];
const statuses = ["Pending", "In Progress", "Resolved"];
const issueTypes = ["Policy Issue", "General Issue"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    image: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    issueType: { type: String, enum: issueTypes, required: true, index: true },
    insurancePartner: { type: String, enum: partners, index: true },
    mobileNumber: { type: String, trim: true, index: true },
    issueDescription: { type: String, required: true, trim: true },
    raisedBy: { type: String, required: true, trim: true },
    priority: { type: String, enum: priorities, required: true, index: true },
    status: { type: String, enum: statuses, default: "Pending", index: true },
    imageId: mongoose.Schema.Types.ObjectId,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assigneeEmail: { type: String, lowercase: true, trim: true, index: true },
    assignedAt: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true },
);

const messageSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderName: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    messageType: { type: String, enum: ["text", "image", "mixed"], default: "text" },
    imageId: mongoose.Schema.Types.ObjectId,
    imageMetadata: Object,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 1000 },
});

ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ assigneeEmail: 1, status: 1 });
messageSchema.index({ ticketId: 1, createdAt: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required. Copy .env.example to .env.local or export it before seeding.");
  process.exit(1);
}

await mongoose.connect(uri);

const [opsUser, supportUser] = await Promise.all([
  User.findOneAndUpdate({ email: "ops@example.com" }, { name: "Ops Lead", email: "ops@example.com" }, { upsert: true, new: true }),
  User.findOneAndUpdate({ email: "support@example.com" }, { name: "Support User", email: "support@example.com" }, { upsert: true, new: true }),
]);

await Ticket.deleteMany({});
await Message.deleteMany({});
await Counter.findOneAndUpdate({ name: "ticketNumber" }, { seq: 1012 }, { upsert: true });

const tickets = await Ticket.insertMany(
  Array.from({ length: 12 }, (_, index) => {
    const issueType = issueTypes[index % issueTypes.length];
    const status = statuses[index % statuses.length];
    const createdAt = new Date(Date.now() - index * 86_400_000);

    return {
      ticketNumber: `${issueType === "Policy Issue" ? "INS" : "GEN"}-${1001 + index}`,
      issueType,
      insurancePartner: issueType === "Policy Issue" ? partners[index % partners.length] : undefined,
      mobileNumber: issueType === "Policy Issue" ? `98765432${String(index).padStart(2, "0")}` : undefined,
      issueDescription: [
        "Policy document not generated after payment confirmation. Customer needs the PDF for vehicle verification.",
        "Office internet outage is slowing policy operations. Please coordinate with facilities.",
        "Premium mismatch between quotation and punched policy. Please validate add-ons and partner response.",
        "Customer mobile number update is not reflecting on the insurer portal after endorsement.",
      ][index % 4],
      raisedBy: ["Aarav Sharma", "Meera Iyer", "Kabir Khan", "Nisha Patel"][index % 4],
      priority: priorities[index % priorities.length],
      status,
      createdBy: opsUser._id,
      assigneeEmail: index % 2 === 0 ? opsUser.email : supportUser.email,
      assignedAt: createdAt,
      assignedBy: opsUser._id,
      resolvedAt: status === "Resolved" ? new Date(createdAt.getTime() + 36 * 60 * 60 * 1000) : undefined,
      createdAt,
      updatedAt: createdAt,
    };
  }),
);

await Message.insertMany(
  tickets.slice(0, 4).map((ticket) => ({
    ticketId: ticket._id,
    senderId: opsUser._id,
    senderName: opsUser.name,
    message: "Seed note: partner follow-up has been initiated.",
    messageType: "text",
  })),
);

console.log(`Seeded ${tickets.length} tickets.`);
await mongoose.disconnect();

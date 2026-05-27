import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Counter } from "@/lib/models/counter";
import { Ticket } from "@/lib/models/ticket";
import { User } from "@/lib/models/user";
import { fail, handleApiError, ok } from "@/lib/api";
import { serializeTicket } from "@/lib/serializers";
import { ticketCreateSchema, ticketQuerySchema } from "@/lib/validations/ticket";
import { publishRealtime } from "@/lib/realtime/broker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const query = ticketQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      insurancePartner: searchParams.get("insurancePartner") ?? undefined,
      assigneeEmail: searchParams.get("assigneeEmail") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
    });

    await connectMongo();
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.insurancePartner) filter.insurancePartner = query.insurancePartner;
    if (query.assigneeEmail) filter.assigneeEmail = query.assigneeEmail.toLowerCase();
    if (query.mine === "true") filter.assigneeEmail = session.user.email?.toLowerCase();
    if (query.search) {
      const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { ticketNumber: regex },
        { mobileNumber: regex },
        { issueDescription: regex },
        { insurancePartner: regex },
        { assigneeEmail: regex },
        { raisedBy: regex },
      ];
    }

    const tickets = await Ticket.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok(tickets.map(serializeTicket));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const input = ticketCreateSchema.parse(await request.json());
    await connectMongo();
    if (input.assigneeEmail) {
      const assigneeExists = await User.exists({ email: input.assigneeEmail.toLowerCase() });
      if (!assigneeExists) return fail("No authenticated user exists with that email.", 404);
    }
    const counter = await Counter.findOneAndUpdate(
      { name: "ticketNumber" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const prefix = input.issueType === "Policy Issue" ? "INS" : "GEN";

    const ticket = await Ticket.create({
      ...input,
      ticketNumber: `${prefix}-${counter.seq}`,
      insurancePartner: input.issueType === "Policy Issue" ? input.insurancePartner : undefined,
      mobileNumber: input.issueType === "Policy Issue" ? input.mobileNumber : undefined,
      imageId: input.imageId || undefined,
      assigneeEmail: input.assigneeEmail?.toLowerCase() || undefined,
      assignedAt: input.assigneeEmail ? new Date() : undefined,
      assignedBy: input.assigneeEmail ? session.user.id : undefined,
      createdBy: session.user.id,
    });
    const dto = serializeTicket(ticket.toObject());
    publishRealtime({ type: "ticket:created", payload: dto });

    return ok(dto, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

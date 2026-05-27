import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { fail, handleApiError, ok } from "@/lib/api";
import { Ticket } from "@/lib/models/ticket";
import { User } from "@/lib/models/user";
import { publishRealtime } from "@/lib/realtime/broker";
import { serializeTicket } from "@/lib/serializers";
import { ticketAssignSchema } from "@/lib/validations/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    const { assigneeEmail } = ticketAssignSchema.parse(await request.json());
    await connectMongo();
    const user = await User.findOne({ email: assigneeEmail }).select("_id email").lean();
    if (!user) return fail("No authenticated user exists with that email.", 404);

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        assigneeEmail,
        assignedAt: new Date(),
        assignedBy: session.user.id,
      },
      { new: true },
    ).lean();
    if (!ticket) return fail("Ticket not found.", 404);

    const dto = serializeTicket(ticket);
    publishRealtime({ type: "ticket:updated", payload: dto });
    return ok(dto);
  } catch (error) {
    return handleApiError(error);
  }
}

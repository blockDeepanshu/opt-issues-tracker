import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Message } from "@/lib/models/message";
import { Ticket } from "@/lib/models/ticket";
import { fail, handleApiError, ok } from "@/lib/api";
import { publishRealtime } from "@/lib/realtime/broker";
import { serializeTicket } from "@/lib/serializers";
import { canManageTicket } from "@/lib/ticket-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    await connectMongo();
    const ticket = await Ticket.findById(id).lean();
    if (!ticket) return fail("Ticket not found.", 404);

    return ok(serializeTicket(ticket));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    await connectMongo();
    const ticket = await Ticket.findById(id).lean();
    if (!ticket) return fail("Ticket not found.", 404);
    if (!canManageTicket(ticket, session.user)) {
      return fail("Only the creator or current assignee can delete this ticket.", 403);
    }

    await Message.deleteMany({ ticketId: id });
    await Ticket.findByIdAndDelete(id);
    publishRealtime({ type: "ticket:deleted", payload: { id } });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

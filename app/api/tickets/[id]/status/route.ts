import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { fail, handleApiError, ok } from "@/lib/api";
import { Ticket } from "@/lib/models/ticket";
import { publishRealtime } from "@/lib/realtime/broker";
import { serializeTicket } from "@/lib/serializers";
import { ticketStatusSchema } from "@/lib/validations/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    const { status } = ticketStatusSchema.parse(await request.json());
    await connectMongo();
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status,
        resolvedAt: status === "Resolved" ? new Date() : null,
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

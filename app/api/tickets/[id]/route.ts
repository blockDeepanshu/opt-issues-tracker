import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Ticket } from "@/lib/models/ticket";
import { fail, handleApiError, ok } from "@/lib/api";
import { serializeTicket } from "@/lib/serializers";

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

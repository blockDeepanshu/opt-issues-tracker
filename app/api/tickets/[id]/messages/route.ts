import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { fail, handleApiError, ok } from "@/lib/api";
import { ImageAsset } from "@/lib/models/image-asset";
import { Message } from "@/lib/models/message";
import { Ticket } from "@/lib/models/ticket";
import { publishRealtime } from "@/lib/realtime/broker";
import { rateLimit } from "@/lib/rate-limit";
import { serializeMessage } from "@/lib/serializers";
import { messageCreateSchema } from "@/lib/validations/message";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    await connectMongo();
    const messages = await Message.find({ ticketId: id }).sort({ createdAt: 1 }).limit(300).lean();
    return ok(messages.map(serializeMessage));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);
  if (!rateLimit(`messages:${session.user.id}`, 60, 60_000)) return fail("Too many messages. Try again shortly.", 429);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Ticket not found.", 404);

    const input = messageCreateSchema.parse(await request.json());
    await connectMongo();
    const ticketExists = await Ticket.exists({ _id: id });
    if (!ticketExists) return fail("Ticket not found.", 404);
    const image = input.imageId ? await ImageAsset.findById(input.imageId).lean() : null;
    if (input.imageId && !image) return fail("Image not found.", 404);
    const messageType = input.imageId && input.message?.trim() ? "mixed" : input.imageId ? "image" : "text";

    const message = await Message.create({
      ticketId: id,
      senderId: session.user.id,
      senderName: session.user.name ?? session.user.email ?? "Teammate",
      message: input.message?.trim() ?? "",
      messageType,
      imageId: input.imageId || undefined,
      imageMetadata: image
        ? {
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
            size: image.size,
          }
        : undefined,
    });
    const dto = serializeMessage(message.toObject());
    publishRealtime({ type: "message:created", payload: dto });

    return ok(dto, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

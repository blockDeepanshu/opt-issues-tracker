import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { connectMongo } from "@/lib/db";
import { Message } from "@/lib/models/message";
import { Ticket } from "@/lib/models/ticket";
import { serializeMessage, serializeTicket } from "@/lib/serializers";
import { TicketDetail } from "@/components/tickets/ticket-detail";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectMongo();
  const [ticket, messages] = await Promise.all([
    Ticket.findById(id).lean(),
    Message.find({ ticketId: id }).sort({ createdAt: 1 }).limit(300).lean(),
  ]);
  if (!ticket) notFound();

  return (
    <TicketDetail
      ticket={serializeTicket(ticket)}
      messages={messages.map(serializeMessage)}
    />
  );
}

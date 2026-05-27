import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Message } from "@/lib/models/message";
import { Ticket } from "@/lib/models/ticket";
import { serializeMessage, serializeTicket } from "@/lib/serializers";
import { canManageTicket } from "@/lib/ticket-access";
import { TicketDetail } from "@/components/tickets/ticket-detail";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectMongo();
  const [ticket, messages] = await Promise.all([
    Ticket.findById(id).lean(),
    Message.find({ ticketId: id }).sort({ createdAt: 1 }).limit(300).lean(),
  ]);
  if (!ticket) notFound();

  const canManage = session?.user?.id ? canManageTicket(ticket, session.user) : false;

  return (
    <TicketDetail
      ticket={serializeTicket(ticket)}
      messages={messages.map(serializeMessage)}
      canManage={canManage}
    />
  );
}

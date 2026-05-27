import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Ticket } from "@/lib/models/ticket";
import { serializeTicket } from "@/lib/serializers";
import { KanbanBoard } from "@/components/tickets/kanban-board";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const session = await auth();
  await connectMongo();
  const tickets = await Ticket.find({})
    .sort({ createdAt: -1 })
    .limit(150)
    .lean();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ticket board</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track policy issues from intake to resolution.
        </p>
      </div>
      <KanbanBoard
        initialTickets={tickets.map(serializeTicket)}
        currentUser={session?.user?.id ? { id: session.user.id, email: session.user.email } : undefined}
      />
    </div>
  );
}

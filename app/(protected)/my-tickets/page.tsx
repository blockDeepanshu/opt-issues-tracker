import { auth } from "@/auth";
import { connectMongo } from "@/lib/db";
import { Ticket } from "@/lib/models/ticket";
import { serializeTicket } from "@/lib/serializers";
import { KanbanBoard } from "@/components/tickets/kanban-board";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const session = await auth();
  await connectMongo();
  const email = session?.user?.email?.toLowerCase() ?? "";
  const tickets = await Ticket.find({ assigneeEmail: email }).sort({ updatedAt: -1 }).limit(150).lean();
  const unresolved = tickets.filter((ticket) => ticket.status !== "Resolved").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">Tickets assigned to {email || "you"}.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold">{unresolved}</span> unresolved
        </div>
      </div>
      <KanbanBoard
        initialTickets={tickets.map(serializeTicket)}
        baseQuery={{ mine: "true" }}
        currentUser={session?.user?.id ? { id: session.user.id, email: session.user.email } : undefined}
      />
    </div>
  );
}

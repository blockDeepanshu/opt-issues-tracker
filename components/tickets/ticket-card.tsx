"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TicketDTO } from "@/lib/serializers";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/tickets/status-select";
import { cn } from "@/lib/utils";

const priorityBorder = {
  Low: "border-l-emerald-500",
  Medium: "border-l-amber-500",
  High: "border-l-rose-500",
};

export function TicketCard({ ticket }: { ticket: TicketDTO }) {
  const router = useRouter();

  async function copyId(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(ticket.ticketNumber);
    toast.success("Ticket number copied.");
  }

  function openTicket() {
    router.push(`/tickets/${ticket.id}`);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openTicket}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTicket();
        }
      }}
      className={cn(
        "group block cursor-pointer rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
        priorityBorder[ticket.priority],
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">{ticket.ticketNumber}</p>
          <p className="mt-1 line-clamp-3 text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">{ticket.issueDescription}</p>
        </div>
        <button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={copyId}
          className="cursor-pointer rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Copy ticket ID"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge label={ticket.priority} />
        <StatusSelect ticketId={ticket.id} value={ticket.status} />
      </div>
      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex justify-between gap-3">
          <span>{ticket.raisedBy}</span>
          <span>{ticket.issueType === "Policy Issue" ? ticket.insurancePartner : "General"}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ticket.assigneeEmail || "Unassigned"}</span>
        </div>
        <div>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
      </div>
    </article>
  );
}

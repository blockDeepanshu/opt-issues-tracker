"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy, Trash2, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { TicketDTO } from "@/lib/serializers";
import { canManageTicket } from "@/lib/ticket-access";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/tickets/status-select";
import { useTicketStore } from "@/components/tickets/ticket-store";
import { Spinner } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

const priorityBorder = {
  Low: "border-l-emerald-500",
  Medium: "border-l-amber-500",
  High: "border-l-rose-500",
};

export function TicketCard({
  ticket,
  currentUser,
}: {
  ticket: TicketDTO;
  currentUser?: { id: string; email?: string | null };
}) {
  const router = useRouter();
  const removeTicket = useTicketStore((state) => state.removeTicket);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManage = currentUser ? canManageTicket(ticket, currentUser) : false;

  async function copyId(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(ticket.ticketNumber);
    toast.success("Ticket number copied.");
  }

  async function deleteTicket(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const confirmed = window.confirm(`Delete ticket ${ticket.ticketNumber}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? "Could not delete ticket.");
        return;
      }

      removeTicket(ticket.id);
      toast.success("Ticket deleted.");
    } catch {
      toast.error("Could not delete ticket.");
    } finally {
      setIsDeleting(false);
    }
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
        <div className="flex items-center gap-0.5">
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onClick={copyId}
            className="cursor-pointer rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Copy ticket ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {canManage ? (
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={deleteTicket}
              disabled={isDeleting}
              className="cursor-pointer rounded p-1 text-slate-400 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 disabled:cursor-not-allowed dark:hover:bg-rose-950 dark:hover:text-rose-400"
              aria-label="Delete ticket"
            >
              {isDeleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          ) : null}
        </div>
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

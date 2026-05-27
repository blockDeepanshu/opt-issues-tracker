"use client";

import { format } from "date-fns";
import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MessageDTO, TicketDTO } from "@/lib/serializers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/tickets/chat-panel";
import { StatusSelect } from "@/components/tickets/status-select";
import { Spinner } from "@/components/ui/loader";

export function TicketDetail({ ticket, messages }: { ticket: TicketDTO; messages: MessageDTO[] }) {
  const [assigneeEmail, setAssigneeEmail] = useState(ticket.assigneeEmail ?? "");
  const [isAssigning, setIsAssigning] = useState(false);

  async function copyId() {
    await navigator.clipboard.writeText(ticket.ticketNumber);
    toast.success("Ticket number copied.");
  }

  async function assignTicket() {
    if (!assigneeEmail.trim()) {
      toast.error("Enter an assignee email.");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeEmail }),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? "Assignment failed.");
      } else {
        setAssigneeEmail(json.data.assigneeEmail ?? "");
        toast.success("Ticket assigned.");
      }
    } catch {
      toast.error("Assignment failed.");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge label={ticket.priority} />
              <Badge label={ticket.status} />
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{ticket.ticketNumber}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{ticket.issueType}</h1>
            <p className="mt-1 text-sm text-slate-500">Created {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusSelect ticketId={ticket.id} value={ticket.status} />
            <Button variant="secondary" size="icon" onClick={copyId} aria-label="Copy ticket ID"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Description</h2>
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 dark:bg-slate-950">{ticket.issueDescription}</p>
        </div>
        {ticket.imageUrl && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Attachment</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" src={ticket.imageUrl} alt="Ticket attachment" className="max-h-[460px] rounded-lg border border-slate-200 object-contain dark:border-slate-800" />
          </div>
        )}
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold">Assignment</h2>
          <div className="flex gap-2">
            <input value={assigneeEmail} onChange={(event) => setAssigneeEmail(event.target.value)} className="input" placeholder="teammate@company.com" />
            <Button type="button" disabled={isAssigning} onClick={assignTicket}>
              {isAssigning && <Spinner />}
              Assign
            </Button>
          </div>
        </div>
        <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950 sm:grid-cols-2">
          <Info label="Raised by" value={ticket.raisedBy} />
          <Info label="Insurance partner" value={ticket.issueType === "Policy Issue" ? ticket.insurancePartner : "Not applicable"} />
          <Info label="Mobile number" value={ticket.issueType === "Policy Issue" ? ticket.mobileNumber : "Not applicable"} />
          <Info label="Ticket number" value={ticket.ticketNumber} />
          <Info label="Database ID" value={ticket.id} />
          <Info label="Assignee" value={assigneeEmail || "Unassigned"} />
        </dl>
      </section>
      <ChatPanel ticketId={ticket.id} initialMessages={messages} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}

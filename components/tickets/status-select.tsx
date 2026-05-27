"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TICKET_STATUSES, type TicketStatus } from "@/lib/constants";
import { useTicketStore } from "@/components/tickets/ticket-store";

export function StatusSelect({ ticketId, value }: { ticketId: string; value: TicketStatus }) {
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const [isSaving, setIsSaving] = useState(false);

  async function onChange(status: TicketStatus) {
    const previous = value;
    updateStatus(ticketId, status);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        updateStatus(ticketId, previous);
        toast.error("Status update failed.");
      }
    } catch {
      updateStatus(ticketId, previous);
      toast.error("Status update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <span
      className="relative inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <select
        value={value}
        disabled={isSaving}
        onChange={(event) => onChange(event.target.value as TicketStatus)}
        className="h-8 cursor-pointer rounded-md border border-slate-200 bg-white px-2 pr-7 text-xs font-medium outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950"
      >
        {TICKET_STATUSES.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      {isSaving && <span className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-200" />}
    </span>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { INSURANCE_PARTNERS, PRIORITIES, TICKET_STATUSES, type TicketPriority, type TicketStatus } from "@/lib/constants";
import type { TicketDTO } from "@/lib/serializers";
import { cn } from "@/lib/utils";
import { TicketCard } from "@/components/tickets/ticket-card";
import { useTicketStore } from "@/components/tickets/ticket-store";

function DraggableTicket({ ticket }: { ticket: TicketDTO }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id, data: { ticket } });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={cn(isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <TicketCard ticket={ticket} />
    </div>
  );
}

function Column({ status, tickets }: { status: TicketStatus; tickets: TicketDTO[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={cn("flex min-h-[360px] flex-col rounded-lg border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50", isOver && "ring-2 ring-blue-500")}>
      <div className="sticky top-14 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <h2 className="text-sm font-semibold">{status}</h2>
        <span className="rounded bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">{tickets.length}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tickets.length ? tickets.map((ticket) => <DraggableTicket key={ticket.id} ticket={ticket} />) : (
          <div className="grid h-32 place-items-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">No tickets</div>
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({ initialTickets, baseQuery }: { initialTickets: TicketDTO[]; baseQuery?: Record<string, string> }) {
  const tickets = useTicketStore((state) => state.tickets);
  const setTickets = useTicketStore((state) => state.setTickets);
  const upsertTicket = useTicketStore((state) => state.upsertTicket);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const [activeTicket, setActiveTicket] = useState<TicketDTO | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [partner, setPartner] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [movingTicketId, setMovingTicketId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => setTickets(initialTickets), [initialTickets, setTickets]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTickets() {
      setIsLoading(true);
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(baseQuery ?? {})) {
        if (value) params.set(key, value);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (priority) params.set("priority", priority);
      if (partner) params.set("insurancePartner", partner);
      if (assignee) params.set("assigneeEmail", assignee);

      try {
        const response = await fetch(`/api/tickets?${params.toString()}`, { signal: controller.signal });
        const json = await response.json();
        if (response.ok) {
          setTickets(json.data);
        }
      } catch {
        if (!controller.signal.aborted) toast.error("Could not refresh tickets.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadTickets();
    return () => controller.abort();
  }, [assignee, baseQuery, debouncedSearch, partner, priority, setTickets]);

  useEffect(() => {
    const source = new EventSource("/api/realtime");
    source.addEventListener("ticket:created", (event) => upsertTicket(JSON.parse((event as MessageEvent).data)));
    source.addEventListener("ticket:updated", (event) => upsertTicket(JSON.parse((event as MessageEvent).data)));
    source.onerror = () => source.close();
    return () => source.close();
  }, [upsertTicket]);

  const filtered = useMemo(() => tickets, [tickets]);

  async function handleDragEnd(event: DragEndEvent) {
    const ticket = event.active.data.current?.ticket as TicketDTO | undefined;
    const nextStatus = event.over?.id as TicketStatus | undefined;
    setActiveTicket(null);
    if (!ticket || !nextStatus || ticket.status === nextStatus) return;

    updateStatus(ticket.id, nextStatus);
    setMovingTicketId(ticket.id);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        updateStatus(ticket.id, ticket.status);
        toast.error("Could not move ticket.");
      }
    } catch {
      updateStatus(ticket.id, ticket.status);
      toast.error("Could not move ticket.");
    } finally {
      setMovingTicketId(null);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTicket(event.active.data.current?.ticket ?? null);
  }

  return (
    <div className="space-y-4">
      {(movingTicketId || isLoading) && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          {movingTicketId ? "Updating ticket status" : "Refreshing tickets"}
        </div>
      )}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_180px_220px_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950" />
        </label>
        <select value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority | "")} className="h-10 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={partner} onChange={(event) => setPartner(event.target.value)} className="h-10 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
          <option value="">All partners</option>
          {INSURANCE_PARTNERS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Assignee email" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950" />
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-3">
          {TICKET_STATUSES.map((status) => (
            <Column key={status} status={status} tickets={filtered.filter((ticket) => ticket.status === status)} />
          ))}
        </div>
        <DragOverlay>{activeTicket ? <TicketCard ticket={activeTicket} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

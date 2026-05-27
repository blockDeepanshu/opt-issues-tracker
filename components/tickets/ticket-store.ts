"use client";

import { create } from "zustand";
import type { TicketStatus } from "@/lib/constants";
import type { TicketDTO } from "@/lib/serializers";

type TicketState = {
  tickets: TicketDTO[];
  setTickets: (tickets: TicketDTO[]) => void;
  upsertTicket: (ticket: TicketDTO) => void;
  updateStatus: (ticketId: string, status: TicketStatus) => void;
};

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  upsertTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets.filter((item) => item.id !== ticket.id)].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    })),
  updateStatus: (ticketId, status) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket)),
    })),
}));

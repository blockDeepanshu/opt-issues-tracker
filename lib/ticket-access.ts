type TicketAccessRecord = {
  createdBy: { toString(): string } | string;
  assigneeEmail?: string | null;
};

type AccessUser = {
  id: string;
  email?: string | null;
};

export function isTicketCreator(ticket: TicketAccessRecord, userId: string) {
  const createdBy = typeof ticket.createdBy === "string" ? ticket.createdBy : ticket.createdBy.toString();
  return createdBy === userId;
}

export function isTicketAssignee(ticket: TicketAccessRecord, userEmail?: string | null) {
  if (!ticket.assigneeEmail || !userEmail) return false;
  return ticket.assigneeEmail.toLowerCase() === userEmail.toLowerCase();
}

export function canManageTicket(ticket: TicketAccessRecord, user: AccessUser) {
  return isTicketCreator(ticket, user.id) || isTicketAssignee(ticket, user.email);
}

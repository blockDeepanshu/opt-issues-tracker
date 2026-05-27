import type { IssueType, TicketPriority, TicketStatus } from "@/lib/constants";

export type TicketDTO = {
  id: string;
  ticketNumber: string;
  issueType: IssueType;
  insurancePartner: string;
  mobileNumber: string;
  issueDescription: string;
  raisedBy: string;
  priority: TicketPriority;
  status: TicketStatus;
  imageId?: string | null;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdBy: string;
  assigneeEmail?: string | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageDTO = {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: "text" | "image" | "mixed";
  imageId?: string | null;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageMetadata?: {
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    size?: number | null;
  };
  createdAt: string;
};

type RawTicket = {
  _id: { toString(): string };
  ticketNumber?: string;
  issueType?: IssueType;
  insurancePartner?: string | null;
  mobileNumber?: string | null;
  issueDescription: string;
  raisedBy: string;
  priority: TicketPriority;
  status: TicketStatus;
  imageId?: { toString(): string } | null;
  createdBy: { toString(): string };
  assigneeEmail?: string | null;
  assignedAt?: Date | null;
  assignedBy?: { toString(): string } | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RawMessage = {
  _id: { toString(): string };
  ticketId: { toString(): string };
  senderId: { toString(): string };
  senderName: string;
  message?: string | null;
  messageType?: "text" | "image" | "mixed";
  imageId?: { toString(): string } | null;
  imageMetadata?: MessageDTO["imageMetadata"] | null;
  createdAt: Date;
};

export function serializeTicket(ticket: RawTicket): TicketDTO {
  const imageId = ticket.imageId?.toString();

  return {
    id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber ?? ticket._id.toString(),
    issueType: ticket.issueType ?? "Policy Issue",
    insurancePartner: ticket.insurancePartner ?? "",
    mobileNumber: ticket.mobileNumber ?? "",
    issueDescription: ticket.issueDescription,
    raisedBy: ticket.raisedBy,
    priority: ticket.priority,
    status: ticket.status,
    imageId,
    imageUrl: imageId ? `/api/images/${imageId}` : undefined,
    thumbnailUrl: imageId ? `/api/images/${imageId}?variant=thumb` : undefined,
    createdBy: ticket.createdBy.toString(),
    assigneeEmail: ticket.assigneeEmail,
    assignedAt: ticket.assignedAt?.toISOString() ?? null,
    assignedBy: ticket.assignedBy?.toString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function serializeMessage(message: RawMessage): MessageDTO {
  const imageId = message.imageId?.toString();

  return {
    id: message._id.toString(),
    ticketId: message.ticketId.toString(),
    senderId: message.senderId.toString(),
    senderName: message.senderName,
    message: message.message ?? "",
    messageType: message.messageType ?? "text",
    imageId,
    imageUrl: imageId ? `/api/images/${imageId}` : undefined,
    thumbnailUrl: imageId ? `/api/images/${imageId}?variant=thumb` : undefined,
    imageMetadata: message.imageMetadata ?? undefined,
    createdAt: message.createdAt.toISOString(),
  };
}

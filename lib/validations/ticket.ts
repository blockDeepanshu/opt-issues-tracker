import { z } from "zod";
import { INSURANCE_PARTNERS, ISSUE_TYPES, PRIORITIES, TICKET_STATUSES } from "@/lib/constants";

const baseTicketSchema = z.object({
  issueType: z.enum(ISSUE_TYPES),
  issueDescription: z.string().trim().min(12, "Describe the issue in at least 12 characters."),
  raisedBy: z.string().trim().min(2, "Enter the name of the person raising this ticket."),
  priority: z.enum(PRIORITIES, { error: "Choose a priority." }),
  imageId: z.string().optional().or(z.literal("")),
  assigneeEmail: z.email("Enter a valid assignee email.").optional().or(z.literal("")),
});

export const ticketCreateSchema = z.discriminatedUnion("issueType", [
  baseTicketSchema.extend({
    issueType: z.literal("Policy Issue"),
    insurancePartner: z.enum(INSURANCE_PARTNERS, { error: "Choose an insurance partner." }),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian mobile number."),
  }),
  baseTicketSchema.extend({
    issueType: z.literal("General Issue"),
    insurancePartner: z.literal("").optional(),
    mobileNumber: z.literal("").optional(),
  }),
]);

export const ticketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});

export const ticketQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  insurancePartner: z.enum(INSURANCE_PARTNERS).optional(),
  assigneeEmail: z.email().optional(),
  mine: z.enum(["true", "false"]).optional(),
});

export const ticketAssignSchema = z.object({
  assigneeEmail: z.email("Enter a valid assignee email.").toLowerCase(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

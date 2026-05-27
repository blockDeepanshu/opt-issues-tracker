export const INSURANCE_PARTNERS = [
  "HDFC Ergo",
  "ICICI Lombard",
  "Tata AIG",
  "Bajaj Allianz",
  "Reliance General",
  "Star Health",
  "Care Health",
] as const;

export const TICKET_STATUSES = ["Pending", "In Progress", "Resolved"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export const ISSUE_TYPES = ["Policy Issue", "General Issue"] as const;

export type InsurancePartner = (typeof INSURANCE_PARTNERS)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof PRIORITIES)[number];
export type IssueType = (typeof ISSUE_TYPES)[number];

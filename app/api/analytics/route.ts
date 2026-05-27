import { auth } from "@/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { connectMongo } from "@/lib/db";
import { Ticket } from "@/lib/models/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PARTNER_MATCH = {
  insurancePartner: { $exists: true, $nin: [null, ""] },
};

const NORMALIZED_ISSUE_TYPE = {
  $switch: {
    branches: [
      { case: { $eq: ["$issueType", "Policy Issue"] }, then: "Policy Issue" },
      { case: { $eq: ["$issueType", "General Issue"] }, then: "General Issue" },
      {
        case: { $regexMatch: { input: { $ifNull: ["$ticketNumber", ""] }, regex: /^GEN-/ } },
        then: "General Issue",
      },
      {
        case: { $regexMatch: { input: { $ifNull: ["$ticketNumber", ""] }, regex: /^INS-/ } },
        then: "Policy Issue",
      },
    ],
    default: "Legacy ticket",
  },
};

function labelValue(value: unknown, fallback = "Unspecified") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function utcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fillDailyActivity(
  created: Array<{ _id: string; count: number }>,
  resolved: Array<{ _id: string; count: number }>,
) {
  const createdMap = new Map(created.map((item) => [item._id, item.count]));
  const resolvedMap = new Map(resolved.map((item) => [item._id, item.count]));
  const allDates = new Set([...createdMap.keys(), ...resolvedMap.keys()]);

  if (!allDates.size) return [];

  const sortedDates = [...allDates].sort();
  const todayKey = utcDateKey(new Date());
  const startKey = sortedDates[0];
  const endKey = sortedDates[sortedDates.length - 1] > todayKey ? sortedDates[sortedDates.length - 1] : todayKey;

  const rows = [];
  let cursor = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);

  while (cursor <= end) {
    const key = utcDateKey(cursor);
    rows.push({
      date: key,
      label: cursor.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" }),
      created: createdMap.get(key) ?? 0,
      resolved: resolvedMap.get(key) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return rows;
}

function buildPartnerByStatus(raw: Array<{ _id: { partner: string; status: string }; count: number }>) {
  const partnerMap = new Map<string, { partner: string; Pending: number; "In Progress": number; Resolved: number }>();

  for (const item of raw) {
    const partner = labelValue(item._id.partner, "Unknown partner");
    const status = labelValue(item._id.status, "Unspecified") as "Pending" | "In Progress" | "Resolved" | "Unspecified";
    if (!partnerMap.has(partner)) {
      partnerMap.set(partner, { partner, Pending: 0, "In Progress": 0, Resolved: 0 });
    }
    const bucket = partnerMap.get(partner)!;
    if (status in bucket) {
      bucket[status as "Pending" | "In Progress" | "Resolved"] = item.count;
    }
  }

  return Array.from(partnerMap.values()).sort(
    (left, right) =>
      right.Pending + right["In Progress"] + right.Resolved - (left.Pending + left["In Progress"] + left.Resolved),
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    await connectMongo();

    const [
      statusCounts,
      priorityCounts,
      partnerCounts,
      partnerStatusCounts,
      issueTypeCounts,
      assigneeCounts,
      dailyCreated,
      dailyResolved,
      totals,
      resolvedDurations,
      resolutionByPriority,
    ] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: PARTNER_MATCH },
        { $group: { _id: "$insurancePartner", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        { $match: PARTNER_MATCH },
        { $group: { _id: { partner: "$insurancePartner", status: "$status" }, count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $addFields: { normalizedIssueType: NORMALIZED_ISSUE_TYPE } },
        { $group: { _id: "$normalizedIssueType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        { $match: { assigneeEmail: { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$assigneeEmail", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { status: "Resolved" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $ifNull: ["$resolvedAt", "$updatedAt"] },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $addFields: { normalizedIssueType: NORMALIZED_ISSUE_TYPE } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$priority", ""] }, "High"] }, 1, 0] } },
            policyIssues: { $sum: { $cond: [{ $eq: ["$normalizedIssueType", "Policy Issue"] }, 1, 0] } },
            generalIssues: { $sum: { $cond: [{ $eq: ["$normalizedIssueType", "General Issue"] }, 1, 0] } },
            unassigned: {
              $sum: {
                $cond: [{ $in: ["$assigneeEmail", [null, ""]] }, 1, 0],
              },
            },
          },
        },
      ]),
      Ticket.aggregate([
        { $match: { resolvedAt: { $exists: true, $ne: null } } },
        { $project: { durationMs: { $subtract: ["$resolvedAt", "$createdAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$durationMs" } } },
      ]),
      Ticket.aggregate([
        { $match: { resolvedAt: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$priority",
            avgMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = totals[0] ?? {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      high: 0,
      policyIssues: 0,
      generalIssues: 0,
      unassigned: 0,
    };

    return ok({
      metrics: {
        total: summary.total,
        pending: summary.pending,
        inProgress: summary.inProgress,
        resolved: summary.resolved,
        highPriority: summary.high,
        policyIssues: summary.policyIssues,
        generalIssues: summary.generalIssues,
        unassigned: summary.unassigned,
        averageResolutionHours: resolvedDurations[0]?.avgMs
          ? Math.round(resolvedDurations[0].avgMs / 36_000) / 100
          : 0,
        resolutionRate: summary.total ? Math.round((summary.resolved / summary.total) * 100) : 0,
      },
      byStatus: statusCounts.map((item) => ({ name: labelValue(item._id), value: item.count })),
      byPriority: priorityCounts.map((item) => ({ name: labelValue(item._id), value: item.count })),
      byPartner: partnerCounts.map((item) => ({ name: labelValue(item._id), value: item.count })),
      byIssueType: issueTypeCounts.map((item) => ({ name: labelValue(item._id), value: item.count })),
      byAssignee: assigneeCounts.map((item) => ({ name: labelValue(item._id), value: item.count })),
      partnerByStatus: buildPartnerByStatus(partnerStatusCounts),
      dailyActivity: fillDailyActivity(dailyCreated, dailyResolved),
      resolutionByPriority: resolutionByPriority.map((item) => ({
        name: labelValue(item._id),
        hours: item.avgMs ? Math.round(item.avgMs / 36_000) / 100 : 0,
        count: item.count,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

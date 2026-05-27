import { auth } from "@/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { connectMongo } from "@/lib/db";
import { Ticket } from "@/lib/models/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);

  try {
    await connectMongo();
    const [statusCounts, priorityCounts, partnerCounts, dailyCounts, totals, resolvedDurations] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { issueType: "Policy Issue", insurancePartner: { $exists: true } } },
        { $group: { _id: "$insurancePartner", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] } },
          },
        },
      ]),
      Ticket.aggregate([
        { $match: { resolvedAt: { $exists: true, $ne: null } } },
        { $project: { durationMs: { $subtract: ["$resolvedAt", "$createdAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$durationMs" } } },
      ]),
    ]);

    return ok({
      metrics: {
        total: totals[0]?.total ?? 0,
        pending: totals[0]?.pending ?? 0,
        resolved: totals[0]?.resolved ?? 0,
        highPriority: totals[0]?.high ?? 0,
        averageResolutionHours: resolvedDurations[0]?.avgMs ? Math.round(resolvedDurations[0].avgMs / 36_000) / 100 : 0,
      },
      byStatus: statusCounts.map((item) => ({ name: item._id, value: item.count })),
      byPriority: priorityCounts.map((item) => ({ name: item._id, value: item.count })),
      byPartner: partnerCounts.map((item) => ({ name: item._id, value: item.count })),
      dailyCreated: dailyCounts.map((item) => ({ date: item._id, tickets: item.count })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

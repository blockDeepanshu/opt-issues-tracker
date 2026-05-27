"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner } from "@/components/ui/loader";

type AnalyticsData = {
  metrics: {
    total: number;
    pending: number;
    resolved: number;
    highPriority: number;
    averageResolutionHours: number;
  };
  byStatus: Array<{ name: string; value: number }>;
  byPriority: Array<{ name: string; value: number }>;
  byPartner: Array<{ name: string; value: number }>;
  dailyCreated: Array<{ date: string; tickets: number }>;
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((response) => response.json())
      .then((json) => setData(json.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner />
          Loading analytics
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Total" value={data.metrics.total} />
        <Metric label="Pending" value={data.metrics.pending} />
        <Metric label="Resolved" value={data.metrics.resolved} />
        <Metric label="High priority" value={data.metrics.highPriority} />
        <Metric label="Avg resolution" value={`${data.metrics.averageResolutionHours}h`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Chart title="Tickets by status" data={data.byStatus} />
        <Chart title="Tickets by priority" data={data.byPriority} />
        <Chart title="Tickets per partner" data={data.byPartner} />
        <DailyChart data={data.dailyCreated} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Chart({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={92} fill="#2563eb" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DailyChart({ data }: { data: Array<{ date: string; tickets: number }> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold">Daily created tickets</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="tickets" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

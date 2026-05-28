"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Layers3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "@/components/ui/loader";

type AnalyticsData = {
  metrics: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    highPriority: number;
    policyIssues: number;
    generalIssues: number;
    unassigned: number;
    averageResolutionHours: number;
    resolutionRate: number;
  };
  byStatus: Array<{ name: string; value: number }>;
  byPriority: Array<{ name: string; value: number }>;
  byPartner: Array<{ name: string; value: number }>;
  byIssueType: Array<{ name: string; value: number }>;
  byAssignee: Array<{ name: string; value: number }>;
  partnerByStatus: Array<{ partner: string; Pending: number; "In Progress": number; Resolved: number }>;
  dailyActivity: Array<{ date: string; label: string; created: number; resolved: number }>;
  resolutionByPriority: Array<{ name: string; hours: number; count: number }>;
};

const PALETTE = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#ca8a04", "#dc2626"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Resolved: "#22c55e",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};
const ISSUE_TYPE_COLORS: Record<string, string> = {
  "Policy Issue": "#6366f1",
  "General Issue": "#14b8a6",
  "Legacy ticket": "#94a3b8",
};

function colorFor(name: string, index: number, map?: Record<string, string>) {
  return map?.[name] ?? PALETTE[index % PALETTE.length];
}

function ChartFrame({ height, children }: { height: number; children: ReactElement }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="w-full min-w-0" style={{ height }}>
      {ready ? (
        <ResponsiveContainer width="100%" height={height} minWidth={0} debounce={50}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const labelText = label == null ? undefined : String(label);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {labelText ? <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{labelText}</p> : null}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "#64748b" }} />
            <span>{entry.name}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAnalytics(showLoader = false) {
      if (showLoader) setLoading(true);
      try {
        const response = await fetch("/api/analytics", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.data) {
          throw new Error(json.error ?? "Could not load analytics.");
        }
        if (active) {
          setData(json.data);
          setError(null);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Could not load analytics.");
        }
      } finally {
        if (active && showLoader) setLoading(false);
      }
    }

    void loadAnalytics(true);

    function handleRefresh() {
      if (document.visibilityState === "visible") {
        void loadAnalytics(false);
      }
    }

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      active = false;
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner />
          Loading analytics
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/40">
        <div>
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error ?? "Analytics unavailable."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total tickets" value={data.metrics.total} hint="All open and closed tickets" icon={Layers3} accent="blue" />
        <MetricCard label="Pending" value={data.metrics.pending} hint={`${data.metrics.inProgress} in progress`} icon={Clock3} accent="amber" />
        <MetricCard label="Resolved" value={data.metrics.resolved} hint={`${data.metrics.resolutionRate}% resolution rate`} icon={CheckCircle2} accent="green" />
        <MetricCard label="High priority" value={data.metrics.highPriority} hint={`${data.metrics.unassigned} unassigned overall`} icon={AlertTriangle} accent="rose" />
        <MetricCard label="Avg resolution" value={`${data.metrics.averageResolutionHours}h`} hint={`${data.metrics.policyIssues} policy / ${data.metrics.generalIssues} general`} icon={TrendingUp} accent="violet" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <DonutChart
          title="Tickets by status"
          subtitle="Current workflow distribution"
          icon={PieChartIcon}
          data={data.byStatus}
          colorMap={STATUS_COLORS}
        />
        <DonutChart
          title="Tickets by priority"
          subtitle="Risk concentration across the queue"
          icon={AlertTriangle}
          data={data.byPriority}
          colorMap={PRIORITY_COLORS}
        />
        <DonutChart
          title="Tickets by issue type"
          subtitle="Policy vs general workload split"
          icon={Activity}
          data={data.byIssueType}
          colorMap={ISSUE_TYPE_COLORS}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <PartnerBarChart data={data.byPartner} />
        <PartnerStatusChart data={data.partnerByStatus} />
      </section>

      <section className="space-y-4">
        <ActivityChart data={data.dailyActivity} />
        <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
          <AssigneeChart data={data.byAssignee} />
          <ResolutionChart data={data.resolutionByPriority} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Layers3;
  accent: "blue" | "amber" | "green" | "rose" | "violet";
}) {
  const accents = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={`rounded-lg border p-2 ${accents[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof BarChart3;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}>
      <div className="mb-4 flex items-start gap-3">
        {Icon ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40">
      {message}
    </div>
  );
}

function DonutChart({
  title,
  subtitle,
  icon,
  data,
  colorMap,
}: {
  title: string;
  subtitle: string;
  icon: typeof PieChartIcon;
  data: Array<{ name: string; value: number }>;
  colorMap?: Record<string, string>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Panel title={title} subtitle={subtitle} icon={icon}>
      {!data.length ? (
        <EmptyChart message="No data available yet." />
      ) : (
        <>
          <ChartFrame height={288}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colorFor(entry.name, index, colorMap)} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ChartFrame>
          <p className="mt-1 text-center text-xs text-slate-500">{total} tickets total</p>
        </>
      )}
    </Panel>
  );
}

function PartnerBarChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Panel title="Tickets per partner" subtitle="All tickets grouped by insurance partner" icon={BarChart3}>
      {!data.length ? (
        <EmptyChart message="No tickets with an insurance partner yet." />
      ) : (
        <ChartFrame height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Tickets" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colorFor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
      )}
    </Panel>
  );
}

function PartnerStatusChart({
  data,
}: {
  data: Array<{ partner: string; Pending: number; "In Progress": number; Resolved: number }>;
}) {
  return (
    <Panel title="Partner status breakdown" subtitle="Open vs resolved workload by partner" icon={Layers3}>
      {!data.length ? (
        <EmptyChart message="No partner status data available yet." />
      ) : (
        <ChartFrame height={320}>
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="partner" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={64} stroke="#64748b" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="Pending" stackId="partner" fill={STATUS_COLORS.Pending} radius={[0, 0, 0, 0]} />
              <Bar dataKey="In Progress" stackId="partner" fill={STATUS_COLORS["In Progress"]} />
              <Bar dataKey="Resolved" stackId="partner" fill={STATUS_COLORS.Resolved} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
      )}
    </Panel>
  );
}

function ActivityChart({ data }: { data: AnalyticsData["dailyActivity"] }) {
  return (
    <Panel title="Daily ticket activity" subtitle="All-time created vs resolved ticket trend" icon={Activity}>
      {!data.length ? (
        <EmptyChart message="No recent ticket activity." />
      ) : (
        <ChartFrame height={320}>
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={18} stroke="#64748b" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="created" name="Created" stroke="#2563eb" fill="url(#createdGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" fill="url(#resolvedGradient)" strokeWidth={2} />
            </AreaChart>
          </ChartFrame>
      )}
    </Panel>
  );
}

function AssigneeChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const chartData = data.map((item) => ({
    name: item.name.split("@")[0] ?? item.name,
    fullName: item.name,
    value: item.value,
  }));

  return (
    <Panel title="Top assignees" subtitle="Highest assigned ticket volume" icon={Users}>
      {!chartData.length ? (
        <EmptyChart message="No assigned tickets yet." />
      ) : (
        <ChartFrame height={320}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    label={payload?.[0]?.payload?.fullName ?? label}
                    payload={payload?.map((entry) => ({
                      name: "Assigned tickets",
                      value: entry.value as number,
                      color: entry.color,
                    }))}
                  />
                )}
              />
              <Bar dataKey="value" name="Assigned tickets" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.fullName} fill={colorFor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
      )}
    </Panel>
  );
}

function ResolutionChart({ data }: { data: Array<{ name: string; hours: number; count: number }> }) {
  return (
    <Panel title="Resolution time by priority" subtitle="Average hours to resolve closed tickets" icon={Clock3}>
      {!data.length ? (
        <EmptyChart message="No resolved tickets yet." />
      ) : (
        <ChartFrame height={320}>
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    label={label}
                    payload={payload?.flatMap((entry) => [
                      { name: "Avg hours", value: entry.value as number, color: entry.color },
                      { name: "Resolved count", value: entry.payload?.count as number, color: "#64748b" },
                    ])}
                  />
                )}
              />
              <Bar dataKey="hours" name="Avg hours" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colorFor(entry.name, index, PRIORITY_COLORS)} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
      )}
    </Panel>
  );
}

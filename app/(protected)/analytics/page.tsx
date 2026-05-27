import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Detailed operational metrics, partner insights, and ticket flow trends.</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}

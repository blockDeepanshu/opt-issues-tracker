export function BoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((column) => (
        <div key={column} className="h-[540px] rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg bg-white dark:bg-slate-800" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

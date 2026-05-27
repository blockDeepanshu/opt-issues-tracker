import { Spinner } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="grid min-h-[480px] place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        Loading ticket details
      </div>
    </div>
  );
}

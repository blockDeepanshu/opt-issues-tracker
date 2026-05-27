import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function LoadingOverlay({ label = "Loading" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/70 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Spinner />
        {label}
      </div>
    </div>
  );
}

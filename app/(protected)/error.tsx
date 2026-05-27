"use client";

import { Button } from "@/components/ui/button";

export default function ProtectedError({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">The dashboard could not finish loading.</p>
        <Button className="mt-5" onClick={reset}>Retry</Button>
      </div>
    </div>
  );
}

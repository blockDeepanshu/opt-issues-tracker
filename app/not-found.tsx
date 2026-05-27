import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Ticket not found</h1>
        <p className="mt-2 text-sm text-slate-500">The ticket may have been removed or the link is incorrect.</p>
        <Link href="/tickets" className="mt-5 inline-block">
          <Button>Back to board</Button>
        </Link>
      </div>
    </main>
  );
}

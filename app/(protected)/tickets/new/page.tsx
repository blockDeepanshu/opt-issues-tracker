import { TicketForm } from "@/components/tickets/ticket-form";

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create ticket</h1>
        <p className="mt-1 text-sm text-slate-500">
          Capture the policy context clearly so the team can resolve it fast.
        </p>
      </div>
      <TicketForm />
    </div>
  );
}

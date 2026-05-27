import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginButton } from "@/components/auth/login-button";
import { AppProviders } from "@/components/providers/app-providers";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/tickets");

  return (
    <AppProviders>
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              IT
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Insurance Issue Tracker</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with your company Google account to manage policy tickets.
            </p>
          </div>
          <LoginButton />
        </section>
      </main>
    </AppProviders>
  );
}

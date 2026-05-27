import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}

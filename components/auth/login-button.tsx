"use client";

import { signIn } from "next-auth/react";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  return (
    <Button onClick={() => signIn("google", { callbackUrl: "/tickets" })} className="w-full">
      <CircleUserRound className="h-4 w-4" />
      Continue with Google
    </Button>
  );
}

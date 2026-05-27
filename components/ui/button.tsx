import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export function buttonClasses({
  className,
  variant = "primary",
  size = "md",
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white",
    variant === "secondary" && "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
    variant === "ghost" && "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
    variant === "danger" && "border-red-600 bg-red-600 text-white hover:bg-red-700",
    size === "sm" && "h-8 px-3",
    size === "md" && "h-10 px-4",
    size === "icon" && "h-9 w-9 p-0",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses({ className, variant, size })}
      {...props}
    />
  );
}

export function LinkButton({ className, variant = "primary", size = "md", ...props }: LinkButtonProps) {
  return <Link className={buttonClasses({ className, variant, size })} {...props} />;
}

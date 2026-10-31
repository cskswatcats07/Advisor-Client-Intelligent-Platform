import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const styles: Record<Variant, string> = {
  primary:
    "bg-primary text-cream hover:bg-[#641823] shadow-[0_8px_24px_rgba(122,31,43,0.22)]",
  secondary:
    "bg-transparent text-primary border border-primary/30 hover:bg-primary/5",
  ghost: "bg-transparent text-foreground hover:bg-black/5",
  gold: "bg-gold text-white hover:bg-[#9a7848] shadow-[0_8px_24px_rgba(176,141,87,0.25)]",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

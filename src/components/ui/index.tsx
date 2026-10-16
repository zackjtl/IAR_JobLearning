import * as React from "react";
import { cn } from "@/lib/utils";

type BtnVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type BtnSize = "sm" | "md" | "lg";

export function buttonClass(variant: BtnVariant = "primary", size: BtnSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer whitespace-nowrap",
    size === "sm" && "h-8 px-2.5 text-[13px]",
    size === "md" && "h-9 px-3.5 text-sm",
    size === "lg" && "h-11 px-5 text-base",
    variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
    variant === "secondary" && "bg-surface-2 text-fg hover:bg-border",
    variant === "outline" && "border border-border bg-surface text-fg hover:bg-surface-2",
    variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
    variant === "danger" && "bg-bad text-white hover:opacity-90",
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-surface", className)} {...props} />;
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4 pb-2", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-2", className)} {...props} />;
}

type BadgeTone = "neutral" | "accent" | "ok" | "warn" | "bad";
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] font-medium leading-none whitespace-nowrap",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "ok" | "warn" | "bad" }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "accent" && "bg-accent",
          tone === "ok" && "bg-ok",
          tone === "warn" && "bg-warn",
          tone === "bad" && "bg-bad",
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn("w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-faint focus:outline-2 focus:outline-accent", className)}
      {...props}
    />
  );
});

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn("h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-faint focus:outline-2 focus:outline-accent", className)}
      {...props}
    />
  );
});

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-fg focus:outline-2 focus:outline-accent", className)} {...props} />;
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-md border border-border bg-surface-2 p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 rounded px-3 text-[13px] font-medium transition-colors cursor-pointer",
            value === o.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Callout({ tone = "accent", title, children, className }: { tone?: BadgeTone; title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border-l-[3px] px-4 py-3 text-sm",
        tone === "accent" && "border-accent bg-accent-soft/60",
        tone === "ok" && "border-ok bg-ok-soft/60",
        tone === "warn" && "border-warn bg-warn-soft/60",
        tone === "bad" && "border-bad bg-bad-soft/60",
        tone === "neutral" && "border-border bg-surface-2",
        className,
      )}
    >
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="text-fg/90">{children}</div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-faint">{hint}</div>}
    </div>
  );
}

import {
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/utils/cn";
import { useCopy } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { Icon, type IconName } from "@/components/Icons";
import { Link } from "@/lib/router";

/* -------------------------------- primitives ------------------------------- */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1220px] min-w-0 px-4 sm:px-6 lg:px-8", className)}>{children}</div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-mist-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-brand-400", className)} />;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-400 text-ink-950 font-bold hover:bg-brand-300 shadow-[0_6px_24px_-12px_rgba(199,240,95,0.8)]",
  secondary:
    "border border-white/10 bg-white/[0.035] text-mist-100 font-semibold hover:border-white/20 hover:bg-white/[0.07]",
  ghost: "text-mist-300 font-medium hover:bg-white/[0.06] hover:text-mist-50",
  dark: "bg-ink-900 text-mist-100 border border-white/8 font-semibold hover:bg-ink-800 hover:border-white/15",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-lg px-3 text-[13px] gap-1.5",
  md: "h-11 rounded-xl px-4 text-sm gap-2",
  lg: "h-12 rounded-xl px-5 text-[15px] gap-2",
};

const iconButtonSizes: Record<ButtonSize, string> = {
  sm: "size-9 rounded-lg",
  md: "size-11 rounded-xl",
  lg: "size-12 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        buttonVariants[variant],
        iconOnly ? iconButtonSizes[size] : buttonSizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size = "sm",
  iconOnly = false,
  className,
  disabled,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const { copy, copiedKey } = useCopy();
  const copied = copiedKey === "copy";

  return (
    <Button
      variant={copied ? "primary" : variant}
      size={size}
      iconOnly={iconOnly}
      className={className}
      onClick={() => void copy(value)}
      disabled={disabled || !value}
      aria-label={copied ? copiedLabel : label}
    >
      <Icon name={copied ? "check" : "copy"} size={size === "md" ? 16 : 14} />
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}

/* --------------------------------- inputs --------------------------------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold leading-none tracking-[-0.01em] text-mist-200"
        >
          {label}
          {optional && <span className="ml-1.5 font-normal text-mist-500">optional</span>}
        </label>
        {hint && <span className="text-[11px] text-mist-500">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-[12px] font-medium text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field-input", className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field-input py-3 leading-relaxed", className)} {...rest} />;
}

export function Select({
  options,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        className={cn(
          "field-input cursor-pointer appearance-none pr-9",
          "[&>option]:bg-ink-900 [&>option]:text-mist-100",
          className
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mist-500"
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex w-full gap-1 overflow-x-auto rounded-xl border border-white/8 bg-ink-925/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[12.5px] transition-colors",
              active
                ? "bg-brand-400 font-bold text-ink-950 shadow-sm"
                : "font-medium text-mist-400 hover:bg-white/[0.05] hover:text-mist-100"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  id?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-mist-200">
          {label}
        </label>
        <output
          htmlFor={inputId}
          className="rounded-md border border-white/8 bg-ink-900 px-2 py-1 font-mono text-[11px] text-brand-300"
        >
          {value}
          {suffix ? <span className="ml-0.5 text-mist-500">{suffix}</span> : null}
        </output>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2.5"
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
      />
    </div>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-50",
        checked
          ? "border-brand-400/25 bg-brand-400/[0.055]"
          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[13px] font-semibold leading-tight",
            checked ? "text-mist-50" : "text-mist-300"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-mist-500">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-brand-400" : "bg-ink-700"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] size-4 rounded-full transition-all duration-200",
            checked ? "left-[19px] bg-ink-950" : "left-[3px] bg-mist-400"
          )}
        />
      </span>
    </button>
  );
}

/* --------------------------------- display -------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warn" | "soft";
  className?: string;
}) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.04] text-mist-300",
    brand: "border-brand-400/25 bg-brand-400/10 text-brand-200",
    warn: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    soft: "border-white/5 bg-ink-900/60 text-mist-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ResultCard({
  label,
  value,
  suffix,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-400/[0.11] via-white/[0.025] to-transparent p-5",
        className
      )}
      aria-live="polite"
    >
      <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-brand-200/80">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="break-words font-mono text-[27px] font-medium leading-none tracking-tight text-mist-50 sm:text-[32px]">
          {value}
        </span>
        {suffix && <span className="text-[13px] font-semibold text-mist-300">{suffix}</span>}
      </div>
      {hint && <p className="mt-2 text-[12px] leading-relaxed text-mist-400">{hint}</p>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-white/8 bg-white/[0.022] p-3.5", className)}>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mist-500">{label}</p>
      <p className="mt-1.5 font-mono text-lg font-medium leading-none text-mist-50">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-mist-500">{hint}</p>}
    </div>
  );
}

export function Note({
  children,
  tone = "info",
  title,
  icon = true,
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "brand";
  title?: string;
  icon?: boolean;
  className?: string;
}) {
  const styles = {
    info: "border-white/8 bg-white/[0.025] text-mist-400",
    warn: "border-amber-400/20 bg-amber-400/[0.06] text-amber-100/75",
    brand: "border-brand-400/20 bg-brand-400/[0.055] text-mist-300",
  };
  const iconName: IconName = tone === "warn" ? "alert" : tone === "brand" ? "info" : "info";
  const iconColor = tone === "warn" ? "text-amber-300" : "text-brand-300";

  return (
    <div className={cn("flex gap-2.5 rounded-xl border p-3.5 text-[12px] leading-relaxed", styles[tone], className)}>
      {icon && <Icon name={iconName} size={15} className={cn("mt-0.5 shrink-0", iconColor)} />}
      <div>
        {title && <p className="mb-1 font-semibold text-mist-100">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Workspace({
  slug,
  children,
  className,
}: {
  slug: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-[18px] border border-white/8 bg-ink-850 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.95)] sm:rounded-[22px]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-925/70 px-4 py-2.5">
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-brand-400/50" />
        </span>
        <span className="truncate font-mono text-[10px] tracking-wide text-mist-500">
          toolsy / {slug}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-300/85">
          <span className="size-1.5 rounded-full bg-brand-400" />
          local
        </span>
      </div>
      <div className="min-w-0 p-3 sm:p-5 lg:p-6">
        {slug.startsWith("pdf") && typeof window !== "undefined" && window.location.protocol === "file:" && (
          <div role="status" className="mb-4 flex gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3 text-[11.5px] leading-relaxed text-amber-100/80">
            <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
            <span>
              <strong className="font-semibold text-amber-100">PDF processing needs a hosted copy.</strong>{" "}
              You are viewing <code className="break-all font-mono">index.html</code> directly from disk, and browsers
              block the PDF engine&apos;s worker on <code className="font-mono">file://</code>. Open the deployed site or
              run <code className="font-mono">npm run dev</code>. Other tools work normally.
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function FavoriteButton({
  slug,
  name,
  withLabel = false,
  className,
  iconSize = 16,
}: {
  slug: string;
  name: string;
  withLabel?: boolean;
  className?: string;
  iconSize?: number;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      title={active ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border transition-all duration-200",
        withLabel ? "min-h-10 px-3.5 text-[13px] font-semibold" : "size-9 sm:size-9",
        active
          ? "border-brand-400/30 bg-brand-400/10 text-brand-300 hover:bg-brand-400/15"
          : "border-white/10 bg-white/[0.025] text-mist-400 hover:border-white/20 hover:text-mist-100",
        className
      )}
    >
      <Icon name={active ? "starFilled" : "star"} size={iconSize} />
      {withLabel && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}

export function AdSlot({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Reserved advertising space"
      className={cn("mx-auto w-full max-w-3xl", className)}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist-600">
          Advertisement
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
          Space reserved
        </span>
      </div>
      <div className="grid min-h-[84px] place-items-center rounded-xl border border-dashed border-white/[0.09] bg-white/[0.012] px-5 py-5 text-center">
        <p className="max-w-md text-[11.5px] leading-relaxed text-mist-500">
          This placement is reserved for a future, clearly labelled ad. Toolsy shows no ads today —
          and will never disguise one as a tool or a result.
        </p>
      </div>
    </aside>
  );
}

export function EmptyState({
  icon = "search",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-white/8 bg-ink-900 text-mist-400">
        <Icon name={icon} size={19} />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-mist-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-mist-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-mist-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <Icon name="chevronRight" size={12} className="text-mist-600" />}
            {item.href ? (
              <Link href={item.href} className="-my-1 inline-flex min-h-8 items-center rounded py-1 transition-colors hover:text-mist-200">
                {item.label}
              </Link>
            ) : (
              <span className="text-mist-300" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/40">
      {faqs.map((faq) => (
        <details key={faq.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-mist-100">
            <h3 className="text-[14px] font-semibold leading-snug">{faq.q}</h3>
            <Icon
              name="plus"
              size={16}
              className="shrink-0 text-mist-500 transition-transform duration-200 group-open:rotate-45"
            />
          </summary>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-mist-400">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

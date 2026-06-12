import type { ComponentChildren } from "preact";
import cn from "@/util/cn.ts";

export interface AppLauncherItem {
  id: string;
  label: ComponentChildren;
  onClick: () => void;
}

interface AppLauncherProps {
  items: AppLauncherItem[];
  onToggle: () => void;
  open: boolean;
  title: string;
}

export default function AppLauncher({ items, onToggle, open, title }: AppLauncherProps) {
  return (
    <div className="fixed right-6 top-5 z-50 flex flex-col items-end sm:right-12">
      <button
        type="button"
        onClick={onToggle}
        title={title}
        aria-expanded={open}
        aria-label={title}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-bmm-accent bg-bmm-accent text-[1.75rem] font-light leading-none text-white shadow-bmm-card",
          "transition-[background,border-color,box-shadow,transform] duration-200",
          "hover:-translate-y-0.5 hover:border-bmm-accent-strong hover:bg-bmm-accent-strong hover:shadow-bmm-panel",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bmm-accent/30 focus-visible:ring-offset-2",
          open && "rotate-45 border-bmm-accent-strong bg-bmm-accent-strong",
        )}
      >
        +
      </button>

      <div
        className={cn(
          "mt-2.5 w-64 origin-top-right overflow-hidden rounded-xl border border-bmm-border bg-bmm-surface shadow-bmm-panel",
          "transition-[max-height,opacity,transform] duration-200",
          open
            ? "pointer-events-auto max-h-80 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0",
        )}
      >
        <div className="border-b border-bmm-border bg-bmm-surface-muted px-3 py-2">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-bmm-faint">{title}</div>
        </div>

        <div className="p-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left",
                "text-sm font-semibold text-bmm-ink",
                "transition-[background,color,transform] duration-150",
                "hover:bg-bmm-surface-muted hover:text-bmm-accent",
                "active:translate-y-px",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bmm-accent/25",
              )}
            >
              <span className="min-w-0 truncate">{item.label}</span>

              <span className="shrink-0 text-bmm-faint transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-bmm-accent">
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

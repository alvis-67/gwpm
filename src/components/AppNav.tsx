"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT_NAME, navItems } from "@/lib/labels";

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--color-brand)" : "var(--color-ink-muted)";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "projects":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.8-3 10.2-3 11 0" />
          <circle cx="17" cy="9" r="2" />
          <path d="M16 19c.4-2 4.8-2.6 5.5-1" />
        </svg>
      );
    case "today":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-4 14.5-4 16 0" />
        </svg>
      );
  }
}

export function AppNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[var(--nav-side-width)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] z-30">
        <div className="px-5 py-5">
          <div className="brand-mark text-lg">{PRODUCT_NAME}</div>
          <p className="muted text-xs mt-1">現場調度台</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 min-h-11 px-3 rounded-[var(--radius-md)]"
                style={{
                  color: active ? "var(--color-brand)" : "var(--color-ink-muted)",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--color-brand-subtle)" : "transparent",
                }}
              >
                <Icon name={item.icon} active={active} />
                <span>{item.label}</span>
                {item.icon === "notifications" && unread > 0 && (
                  <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-danger)] text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{
          height: "calc(var(--nav-bottom-height) + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-xs"
              style={{
                color: active ? "var(--color-brand)" : "var(--color-ink-muted)",
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon name={item.icon} active={active} />
              <span>{item.label}</span>
              {item.icon === "notifications" && unread > 0 && (
                <span className="absolute top-1 right-[22%] min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] leading-[1.1rem] text-center font-semibold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

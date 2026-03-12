"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function TabLink(props: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === props.href;
  return (
    <Link
      href={props.href}
      className={[
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {props.label}
    </Link>
  );
}

export function NavTabs() {
  return (
    <nav className="flex items-center gap-2">
      <TabLink href="/intake" label="Patient Intake" />
      <TabLink href="/upload" label="Upload" />
      {/* <TabLink href="/gallery" label="Gallery" /> */}
    </nav>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavTabs } from "@/components/NavTabs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dental AI Viewer",
  description: "Upload or pick an X-ray image, run inference, and visualize detections as overlays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
          <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <div className="text-sm font-semibold tracking-tight">Dental AI Viewer</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Upload or browse local images, then overlay detections
                </div>
              </div>
              <NavTabs />
            </div>
          </header>
          <main className="mx-auto max-w-5/6 px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Backend: set <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">AI_MODULE_URL</code>{" "}
            to your running <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">AIModule</code>{" "}
            server (default: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">http://localhost:5560</code>).
          </footer>
        </div>
      </body>
    </html>
  );
}

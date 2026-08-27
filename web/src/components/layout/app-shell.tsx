"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SessionProvider } from "./session-context";
import type { SessionUser } from "@/types";

interface AppShellProps {
  user: SessionUser;
  children: ReactNode;
}

/**
 * الهيكل العام للتطبيق: Sidebar على اليمين + Header في الأعلى + منطقة المحتوى.
 */
export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider user={user}>
      <div className="app-canvas flex min-h-screen">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col lg:mr-[17.5rem]">
          <Header
            user={user}
            onMenuClick={() => setSidebarOpen((o) => !o)}
          />
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
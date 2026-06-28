"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import NavRail from "./NavRail";
import { IngestionProvider } from "@/context/IngestionContext";
import { ChatProvider } from "@/context/ChatContext";
import { ToastProvider } from "@/context/ToastContext";
import { AIConfigProvider } from "@/context/AIConfigContext";
import AIConfigModal from "./AIConfigModal";
import CogneeConsole from "./CogneeConsole";
import SessionProvider from "./SessionProvider";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <IngestionProvider>
        <ChatProvider>
          <ToastProvider>
            <AIConfigProvider>
              {children}
            </AIConfigProvider>
          </ToastProvider>
        </ChatProvider>
      </IngestionProvider>
    </ThemeProvider>
    </SessionProvider>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAuth = pathname === "/login" || pathname.startsWith("/login");

  if (isLanding || isAuth) {
    return (
      <Providers>
        <div className="w-full relative">{children}</div>
      </Providers>
    );
  }

  return (
    <Providers>
      <div className="h-full w-full relative">
        <NavRail />
        <main className="h-full w-full pb-16 md:pb-0 md:pl-60 relative overflow-hidden">
          {children}
        </main>
        <AIConfigModal />
        <CogneeConsole />
      </div>
    </Providers>
  );
}

import type { Role } from "@prisma-generated-client";

import { requireAuth } from "@auth/session";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role as Role,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">Área logada</span>
            <span className="truncate text-xs text-muted-foreground">
              Use o menu para navegar pelas funcionalidades disponíveis.
            </span>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

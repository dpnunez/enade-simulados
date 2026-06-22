"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  Home,
  LogOut,
  PenLine,
  ShieldCheck,
  UserPlus,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

import { signOut } from "@auth/client";
import type { Role } from "@prisma-generated-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type AppSidebarUser = {
  name?: string | null;
  email: string;
  role: Role;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType;
};

const ROLE_LABELS = {
  ADMIN: "Administrador",
  STUDENT: "Estudante",
  TEACHER: "Professor",
} as const satisfies Record<Role, string>;

const ROLE_NAV_ITEMS = {
  ADMIN: [
    {
      href: "/app/admin/usuarios",
      label: "Usuários",
      description: "Contas cadastradas",
      icon: UsersRound,
    },
    {
      href: "/app/admin/convites",
      label: "Convites",
      description: "Criar e acompanhar convites",
      icon: UserPlus,
    },
  ],
  STUDENT: [
    {
      href: "/app/aluno",
      label: "Inicio",
      description: "Resumo da sua jornada",
      icon: Home,
    },
    {
      href: "/app/aluno/simulados/novo",
      label: "Gerar simulado",
      description: "Monte uma nova pratica",
      icon: PenLine,
    },
    {
      href: "/app/aluno/lista-simulados",
      label: "Lista de simulados",
      description: "Retome ou revise simulados",
      icon: ClipboardList,
    },
  ],
  TEACHER: [
    {
      href: "/app/professor",
      label: "Inicio",
      description: "Painel do professor",
      icon: Home,
    },
    {
      href: "/app/professor/grandes-areas",
      label: "Grandes áreas",
      description: "Organize áreas de conhecimento",
      icon: BookOpenCheck,
    },
    {
      href: "/app/professor/questoes",
      label: "Questões",
      description: "Crie e revise questões",
      icon: ClipboardList,
    },
    {
      href: "/app/professor/ranking",
      label: "Ranking",
      description: "Acompanhe desempenho",
      icon: Trophy,
    },
  ],
} as const satisfies Record<Role, NavItem[]>;

function getInitials(user: AppSidebarUser) {
  const identity = user.name?.trim() || user.email;
  const [first = "", second = ""] = identity.split(/[.\s@_-]+/).filter(Boolean);

  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "U";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ user }: { user: AppSidebarUser }) {
  const pathname = usePathname();
  const identity = user.name?.trim() || user.email;
  const navItems = ROLE_NAV_ITEMS[user.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="ENADE ENG">
              <Link href="/app">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap aria-hidden="true" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">ENADE ENG</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Área logada
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={identity}>
                  <Avatar>
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{identity}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel>Conta</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <UserRound aria-hidden="true" />
                    <span className="truncate">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <ShieldCheck aria-hidden="true" />
                    {ROLE_LABELS[user.role]}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={async () => {
                    await signOut();
                    window.location.href = "/login";
                  }}
                >
                  <LogOut aria-hidden="true" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Search,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/layout/logout-button";
import type { Role } from "@/lib/frota/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Definido aqui dentro (Client Component), não recebido como prop do
// layout (Server Component): referências de componente/função não são
// serializáveis na fronteira Server→Client do App Router — passar
// `icon: ListChecks` como prop quebra em produção (passa no build local,
// só estoura numa request real).
const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  suprimentos: [{ href: "/fila", label: "Fila de Solicitações", icon: ListChecks }],
  unidade: [
    { href: "/buscar", label: "Buscar Item", icon: Search },
    { href: "/solicitar", label: "Solicitar Item Novo", icon: PlusCircle },
    { href: "/minhas-solicitacoes", label: "Minhas Solicitações", icon: ClipboardList },
  ],
  frota_corporativo: [
    { href: "/governanca", label: "Governança", icon: LayoutDashboard },
  ],
};

const PAINEL_LABEL: Record<Role, string> = {
  suprimentos: "Painel Suprimentos",
  unidade: "Painel da Unidade",
  frota_corporativo: "Frota Corporativo",
};

const PAINEIS_DISPONIVEIS: { role: Role; href: string }[] = [
  { role: "suprimentos", href: "/fila" },
  { role: "unidade", href: "/buscar" },
  { role: "frota_corporativo", href: "/governanca" },
];

export function Sidebar({
  role,
  userNome,
  userSubtitulo,
  isAdmin,
}: {
  role: Role;
  userNome: string;
  userSubtitulo: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_ROLE[role];
  const outrosPaineis = PAINEIS_DISPONIVEIS.filter((p) => p.role !== role);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <span className="text-sm font-bold tracking-tight text-foreground">
          Gestão em Movimento
        </span>
      </div>
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">
          {PAINEL_LABEL[role]}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-accent bg-surface-hover text-foreground"
                  : "border-l-2 border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isAdmin && outrosPaineis.length > 0 ? (
        <div className="flex flex-col gap-1 border-t border-border p-3">
          <p className="flex items-center gap-1 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <ArrowLeftRight className="size-3" /> Trocar de painel
          </p>
          {outrosPaineis.map((painel) => (
            <Link
              key={painel.role}
              href={painel.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              {PAINEL_LABEL[painel.role]}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{userNome}</p>
          <p className="truncate text-xs text-muted-foreground">{userSubtitulo}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

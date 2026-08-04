import { Sidebar } from "@/components/layout/sidebar";
import { requireRole } from "@/lib/auth/profile";

export default async function UnidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("unidade");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        role="unidade"
        userNome={profile.nome}
        userSubtitulo={profile.unidade ?? "Unidade não configurada"}
        isAdmin={profile.is_admin}
      />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

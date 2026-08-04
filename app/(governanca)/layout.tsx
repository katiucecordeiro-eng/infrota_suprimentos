import { Sidebar } from "@/components/layout/sidebar";
import { requireRole } from "@/lib/auth/profile";

export default async function GovernancaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("frota_corporativo");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        role="frota_corporativo"
        userNome={profile.nome}
        userSubtitulo="Frota Corporativo"
        isAdmin={profile.is_admin}
      />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

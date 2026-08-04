import { Sidebar } from "@/components/layout/sidebar";
import { requireRole } from "@/lib/auth/profile";

export default async function SuprimentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("suprimentos");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar role="suprimentos" userNome={profile.nome} userSubtitulo="Suprimentos" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

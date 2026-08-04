import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/frota/types";

// Rota "home" de cada papel — usada tanto no redirect pós-login quanto no
// guard de página quando o usuário tenta acessar um painel que não é o seu.
export const ROLE_HOME: Record<Role, string> = {
  unidade: "/buscar",
  suprimentos: "/fila",
  frota_corporativo: "/governanca",
};

// Busca o profile (role + unidade + is_admin) do usuário autenticado.
// Retorna null se não houver sessão — quem chama decide se isso significa
// redirect pro login (o proxy.ts já cobre a maioria dos casos, isso é
// defesa em profundidade para Server Components/Actions chamados
// diretamente).
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, nome, role, unidade, is_admin")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

// Garante que o usuário logado pode ver essa página: precisa ter
// role === role pedido, OU is_admin (nesse caso navega por qualquer um
// dos 3 painéis a partir da mesma conta — profiles.role continua sendo só
// o "painel padrão" pra onde login/"/" mandam). Sem sessão, manda pro
// login; role errado sem is_admin, manda pra home do papel real.
export async function requireRole(role: Role): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== role && !profile.is_admin) {
    redirect(ROLE_HOME[profile.role]);
  }

  return profile;
}

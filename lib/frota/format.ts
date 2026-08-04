export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Colunas `numeric` do Postgres chegam como string via PostgREST (evita
// perda de precisão de ponto flutuante) — nunca number direto, mesmo com
// o campo tipado como number no TS. Sempre formatar preço por aqui.
export function formatarPreco(valor: number | string): string {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Usado nos KPIs de SLA do Painel Frota Corporativo (média em horas) —
// vira dias quando passa de 48h, pra não mostrar "127h" num card.
export function formatarHoras(horas: number): string {
  if (horas < 48) return `${Math.round(horas)}h`;
  return `${(horas / 24).toFixed(1)}d`;
}

export function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`;
}

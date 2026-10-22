const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Remove tudo que não for dígito. Essencial porque o banco guarda CPF/CNPJ sem máscara. */
export function onlyDigits(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Numeric do Postgres pode chegar como string; normaliza antes de formatar. */
export function formatCurrency(value: number | string | null | undefined): string {
  return BRL.format(Number(value ?? 0));
}

export function formatNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('pt-BR').format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatCpf(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCnpj(digits: string): string {
  const d = onlyDigits(digits).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatDocument(digits: string): string {
  const d = onlyDigits(digits);
  return d.length > 11 ? formatCnpj(d) : formatCpf(d);
}

/** Iniciais para avatar: "Maria Silva" → "MS". */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Dias restantes até uma data. Negativo significa vencido. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86_400_000);
}
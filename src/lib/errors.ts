/**
 * O Supabase devolve erros em formatos diferentes (PostgrestError, AuthError,
 * Error comum). Centralizar aqui evita `error.message` espalhado e vazio.
 */
 export function describeError(error: unknown): string {
  if (!error) return 'Erro desconhecido.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return 'Erro desconhecido.';
}

/** Detecta o erro clássico de schema cache do PostgREST. */
export function isSchemaCacheError(error: unknown): boolean {
  const message = describeError(error).toLowerCase();
  return message.includes('schema cache') || message.includes('could not find');
}
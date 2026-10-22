import { describeError } from '../errors';
import { supabase } from '../supabase';

export class ApiError extends Error {
  context?: string;

  constructor(message: string, context?: string) {
    super(context ? `${context}: ${message}` : message);
    this.name = 'ApiError';
    this.context = context;
  }
}

/**
 * Cliente tipado. Centraliza a checagem de configuracao para que cada
 * modulo de dados nao repita `if (!supabase) throw`.
 */
export function getSupabase() {
  if (!supabase) {
    throw new ApiError('Supabase nao configurado. Verifique o arquivo .env.');
  }
  return supabase;
}

export async function run<T>(
  context: string,
  operation: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T> {
  const { data, error } = await operation();
  if (error) throw new ApiError(describeError(error), context);
  return data as T;
}
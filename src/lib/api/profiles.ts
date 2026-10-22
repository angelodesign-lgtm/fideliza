import type { Profile } from '../types';
import { ApiError, getSupabase } from './client';

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, full_name, phone, cpf, cnpj, role, qr_token, requested_billing_plan_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel carregar o perfil');
  }
  return (data as Profile | null) ?? null;
}

export async function loadCustomerCard(userId: string) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('qr_token, full_name, phone, cpf')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel carregar o cartao');
  }
  return data;
}

/** Grava o CPF do cliente. String vazia vira null, para nao ocupar o indice unico. */
export async function saveCustomerCpf(userId: string, cpf: string): Promise<void> {
  const digits = cpf.replace(/\D/g, '');

  if (digits && digits.length !== 11) {
    throw new ApiError('Digite os 11 numeros do CPF.');
  }

  const { error } = await getSupabase()
    .from('profiles')
    .update({ cpf: digits || null })
    .eq('id', userId);

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel salvar o CPF');
  }
}
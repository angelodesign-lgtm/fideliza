import type {
  CustomerLookupResult,
  Establishment,
  LoyaltyProgram,
  LoyaltyProgramInput,
  MerchantCustomer,
} from '../types';
import { ApiError, getSupabase } from './client';

// ---------------------------------------------------------
// Estabelecimento do lojista logado
// ---------------------------------------------------------

const ESTABLISHMENT_FIELDS = [
  'id',
  'name',
  'business_type',
  'description',
  'address',
  'phone',
  'website',
  'logo_url',
  'whatsapp_url',
  'location_url',
  'public_link_url',
  'opening_hours',
  'gallery_urls',
].join(', ');

export async function loadOwnEstablishment(ownerId: string): Promise<Establishment | null> {
  const { data, error } = await getSupabase()
    .from('establishments')
    .select(ESTABLISHMENT_FIELDS)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel carregar o estabelecimento');
  }
  return (data as Establishment | null) ?? null;
}

// ---------------------------------------------------------
// Programa de fidelidade
// ---------------------------------------------------------

export async function loadLoyaltyProgram(establishmentId: string): Promise<LoyaltyProgram | null> {
  const { data, error } = await getSupabase()
    .from('loyalty_programs')
    .select(
      'id, establishment_id, name, stamps_required, reward_description, active, cashback_percent, benefit_type',
    )
    .eq('establishment_id', establishmentId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel carregar o programa');
  }
  return (data as LoyaltyProgram | null) ?? null;
}

export async function saveLoyaltyProgram(input: LoyaltyProgramInput): Promise<LoyaltyProgram> {
  const { data, error } = await getSupabase()
    .from('loyalty_programs')
    .upsert(input, { onConflict: 'establishment_id' })
    .select(
      'id, establishment_id, name, stamps_required, reward_description, active, cashback_percent, benefit_type',
    )
    .single();

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel salvar o programa');
  }
  return data as LoyaltyProgram;
}

// ---------------------------------------------------------
// Busca de cliente por CPF (usada no registro de compra)
// ---------------------------------------------------------

/**
 * A funcao do banco devolve JSON com um objeto unico.
 * O tratamento de array fica aqui, uma vez, em vez de espalhado na tela.
 */
export async function findCustomerByCpf(cpf: string): Promise<CustomerLookupResult | null> {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) {
    throw new ApiError('Digite os 11 numeros do CPF para localizar o cliente.');
  }

  const { data, error } = await getSupabase().rpc('find_fideliza_customer_by_cpf', {
    p_cpf: digits,
  });

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel localizar o cliente');
  }

  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return null;

  const result = raw as CustomerLookupResult;
  if (!result.customer_name) return null;

  return result;
}

// ---------------------------------------------------------
// Clientes do lojista
// ---------------------------------------------------------

export async function listMerchantCustomers(establishmentId: string): Promise<MerchantCustomer[]> {
  const { data, error } = await getSupabase().rpc('fideliza_list_customers', {
    p_establishment_id: establishmentId,
  });

  if (error) {
    throw new ApiError(error.message, 'Nao foi possivel carregar os clientes');
  }
  return (data ?? []) as MerchantCustomer[];
}
// Tipos do dominio Fideliza, espelhando o schema real do banco
// e o contrato que o App.tsx consome.

export type UserRole = 'cliente' | 'lojista' | 'admin';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BenefitType = 'pontos' | 'cashback' | 'ambos';
export type BillingCycle = 'mensal' | 'semestral' | 'anual';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PlanChangeStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
export type CashbackType = 'credit' | 'debit';
export type DocumentType = 'cpf' | 'cnpj';
export type IdentificationMethod = 'qr' | 'cpf';

export type Page =
  | 'overview'
  | 'program'
  | 'profile'
  | 'register'
  | 'admin'
  | 'customers'
  | 'billing';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  role: UserRole;
  qr_token: string;
  requested_billing_plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Establishment {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  business_type: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  whatsapp_url: string | null;
  location_url: string | null;
  public_link_url: string | null;
  opening_hours: string | null;
  logo_url: string | null;
  gallery_urls: string[];
  is_public: boolean;
  is_approved: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  id: string;
  establishment_id: string;
  name: string;
  stamps_required: number;
  cashback_percent: number;
  benefit_type: BenefitType;
  reward_description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload do upsert do programa: o app grava exatamente estes campos. */
export interface LoyaltyProgramInput {
  establishment_id: string;
  name: string;
  stamps_required: number;
  reward_description: string;
  active: boolean;
  cashback_percent: number;
  benefit_type: BenefitType;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  establishment_id: string;
  customer_id: string;
  amount: number;
  stamps_earned: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LoyaltyRedemption {
  id: string;
  establishment_id: string;
  customer_id: string;
  reward_description: string | null;
  stamps_used: number;
  created_by: string | null;
  created_at: string;
}

export interface CashbackTransaction {
  id: string;
  establishment_id: string;
  customer_id: string;
  amount: number;
  transaction_type: CashbackType;
  purchase_transaction_id: string | null;
  created_at: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string | null;
  billing_cycle: BillingCycle;
  period_months: number;
  period_price: number;
  monthly_price: number;
  trial_days: number;
  is_active: boolean;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  establishment_id: string;
  plan_id: string;
  pending_plan_id: string | null;
  pending_plan_effective_at: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  due_date: string | null;
  period_price: number | null;
  monthly_price: number | null;
  billing_cycle: BillingCycle | null;
  period_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface BillingPayment {
  id: string;
  subscription_id: string;
  establishment_id: string | null;
  amount: number;
  paid_at: string;
  method: string | null;
  reference: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface PlanChangeRequest {
  id: string;
  subscription_id: string;
  establishment_id: string | null;
  requested_plan_id: string;
  status: PlanChangeStatus;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

/** Cartao digital do cliente. */
export interface CustomerCard {
  qr_token: string;
  full_name: string | null;
  phone: string | null;
  cpf: string | null;
}

/**
 * Retorno de find_fideliza_customer_by_cpf.
 * A funcao devolve JSON (objeto unico), nao array.
 */
export interface CustomerLookupResult {
  customer_id: string;
  customer_name: string;
  name: string;
  cpf: string;
  qr_token: string;
  phone: string | null;
}

/** Linha de fideliza_list_customers (painel de clientes do lojista). */
export interface MerchantCustomer {
  customer_id: string;
  full_name: string;
  phone: string | null;
  purchases_count: number;
  total_spent: number;
  stamps_earned: number;
  cashback_credited: number;
  cashback_redeemed: number;
  stamps_balance?: number;
  cashback_balance?: number;
  last_purchase_at?: string | null;
}

/** Resumo de saldos que o cliente ve na propria conta. */
export interface CustomerLoyaltySummary {
  establishment_id: string;
  establishment_name: string;
  business_type: string | null;
  stamps_balance: number;
  cashback_balance: number;
  purchases_count: number;
  total_spent: number;
  last_purchase_at: string | null;
  program_name: string | null;
  stamps_required: number | null;
  reward_description: string | null;
  program_active: boolean;
  benefit_type: BenefitType;
}

export type PublicEstablishment = Pick<
  Establishment,
  | 'id'
  | 'name'
  | 'category'
  | 'description'
  | 'address'
  | 'location_url'
  | 'public_link_url'
  | 'opening_hours'
  | 'logo_url'
  | 'gallery_urls'
>;

export interface Notice {
  message: string;
  type: 'success' | 'error';
}
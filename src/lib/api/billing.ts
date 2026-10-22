import { describeError } from '../errors';
import { supabase } from '../supabase';
import type {
  BillingPayment,
  BillingPlan,
  BillingSubscription,
  PlanChangeRequest,
} from '../types';
import { ApiError, run } from './client';

function db() {
  if (!supabase) {
    throw new ApiError('Supabase nao configurado. Verifique o arquivo .env.');
  }
  return supabase;
}

/** Assinatura com os nomes já resolvidos pelo embed do PostgREST. */
export interface SubscriptionRow extends BillingSubscription {
  establishments: { name: string } | null;
  fideliza_billing_plans: { name: string } | null;
}

export interface PaymentRow extends BillingPayment {
  establishments: { name: string } | null;
}

export interface PlanChangeRequestRow extends PlanChangeRequest {
  establishments: { name: string } | null;
  fideliza_billing_plans: { name: string } | null;
}

const CTX_PLANOS = 'Nao foi possivel carregar os planos';
const CTX_ASSINATURAS = 'Nao foi possivel carregar as assinaturas';
const CTX_PAGAMENTOS = 'Nao foi possivel carregar os pagamentos';
const CTX_SOLICITACOES = 'Nao foi possivel carregar solicitacoes de alteracao';

// ---------- Planos ----------

export async function listBillingPlans(): Promise<BillingPlan[]> {
  return run(CTX_PLANOS, () =>
    db().from('fideliza_billing_plans').select('*').order('created_at', { ascending: true }),
  );
}

export async function createBillingPlan(
  input: Omit<BillingPlan, 'id' | 'created_at'>,
): Promise<BillingPlan> {
  return run('Nao foi possivel criar o plano', () =>
    db().from('fideliza_billing_plans').insert(input).select().single(),
  );
}

export async function updateBillingPlan(
  id: string,
  updates: Partial<Omit<BillingPlan, 'id' | 'created_at'>>,
): Promise<BillingPlan> {
  return run('Nao foi possivel atualizar o plano', () =>
    db().from('fideliza_billing_plans').update(updates).eq('id', id).select().single(),
  );
}

/** Conta vínculos que impedem excluir o plano. Retorna 0 quando pode excluir. */
export async function countPlanLinks(planId: string): Promise<number> {
  const subs = await db()
    .from('fideliza_billing_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('pending_plan_id', planId);
  if (subs.error) throw new ApiError(describeError(subs.error), CTX_PLANOS);

  const requests = await db()
    .from('fideliza_billing_plan_change_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requested_plan_id', planId);
  if (requests.error) throw new ApiError(describeError(requests.error), CTX_PLANOS);

  return (subs.count ?? 0) + (requests.count ?? 0);
}

// ---------- Assinaturas ----------

export async function listBillingSubscriptions(): Promise<SubscriptionRow[]> {
  return run(CTX_ASSINATURAS, () =>
    db()
      .from('fideliza_billing_subscriptions')
      .select('*, establishments(name), fideliza_billing_plans(name)')
      .order('due_date', { ascending: true }),
  );
}

export async function updateBillingSubscription(
  id: string,
  updates: Partial<Omit<BillingSubscription, 'id' | 'created_at' | 'establishment_id'>>,
): Promise<BillingSubscription> {
  return run('Nao foi possivel atualizar a assinatura', () =>
    db().from('fideliza_billing_subscriptions').update(updates).eq('id', id).select().single(),
  );
}

/**
 * Cria (ou reaproveita) a assinatura de teste do estabelecimento com o plano
 * escolhido no cadastro. Passa pela função do banco, que valida o plano e
 * respeita a regra de vigência.
 */
export async function applyInitialPlan(establishmentId: string, planId: string): Promise<void> {
  const { error } = await db().rpc('fideliza_apply_initial_billing_plan', {
    p_establishment_id: establishmentId,
    p_plan_id: planId,
  });
  if (error) throw new ApiError(describeError(error), 'Nao foi possivel aplicar o plano');
}

// ---------- Pagamentos ----------

export async function listBillingPayments(limit = 100): Promise<PaymentRow[]> {
  return run(CTX_PAGAMENTOS, () =>
    db()
      .from('fideliza_billing_payments')
      .select('*, establishments(name)')
      .order('paid_at', { ascending: false })
      .limit(limit),
  );
}

export async function recordBillingPayment(
  subscriptionId: string,
  amount: number,
  method?: string | null,
): Promise<void> {
  const { error } = await db().rpc('fideliza_record_billing_payment', {
    p_subscription_id: subscriptionId,
    p_amount: amount,
    p_method: method ?? null,
  });
  if (error) throw new ApiError(describeError(error), 'Nao foi possivel registrar o pagamento');
}

// ---------- Troca de plano ----------

export async function listPendingPlanChanges(): Promise<PlanChangeRequestRow[]> {
  return run(CTX_SOLICITACOES, () =>
    db()
      .from('fideliza_billing_plan_change_requests')
      .select('*, establishments(name), fideliza_billing_plans(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  );
}

export async function requestPlanChange(
  subscriptionId: string,
  requestedPlanId: string,
): Promise<void> {
  const { error } = await db().rpc('fideliza_request_billing_plan_change', {
    p_subscription_id: subscriptionId,
    p_requested_plan_id: requestedPlanId,
  });
  if (error) throw new ApiError(describeError(error), 'Nao foi possivel solicitar a troca de plano');
}

export async function decidePlanChange(
  requestId: string,
  decision: 'approved' | 'rejected',
): Promise<void> {
  const { error } = await db().rpc('fideliza_admin_decide_billing_plan_change', {
    p_request_id: requestId,
    p_decision: decision,
  });
  if (error) {
    throw new ApiError(
      describeError(error),
      decision === 'approved'
        ? 'Nao foi possivel aprovar a solicitacao'
        : 'Nao foi possivel rejeitar a solicitacao',
    );
  }
}
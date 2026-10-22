import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  LogOut,
  Palette,
  QrCode,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  Save,
  LayoutDashboard,
  Search,
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  Clock,
  ExternalLink,
  ShoppingBag,
  TrendingUp,
  Coins,
  Activity,
  Trash2,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Establishment = {
  id: string;
  name: string;
  business_type: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  whatsapp_url?: string | null;
  location_url?: string | null;
  public_link_url?: string | null;
  opening_hours?: { text?: string } | string | null;
  gallery_urls?: string[] | null;
};

type LoyaltyProgram = {
  id: string;
  establishment_id: string;
  name: string;
  stamps_required: number;
  reward_description: string;
  active: boolean;
  cashback_percent?: number;
  benefit_type?: 'pontos' | 'cashback' | 'ambos';
};

type AdminEstablishment = {
  id: string;
  name: string;
  business_type: string | null;
  address: string | null;
  phone: string | null;
  is_public: boolean;
  is_approved: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
};

type PublicEstablishment = {
  id: string;
  name: string;
  business_type: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  whatsapp_url: string | null;
  location_url: string | null;
  public_link_url: string | null;
  opening_hours: { text?: string } | string | null;
  gallery_urls: string[] | null;
};

type Page = 'overview' | 'program' | 'profile' | 'register' | 'admin' | 'customers' | 'billing';

type MerchantCustomer = {
  customer_id: string;
  full_name: string;
  phone: string | null;
  purchases_count: number;
  total_spent: number;
  stamps_earned: number;
  cashback_credited: number;
  cashback_redeemed: number;
  last_purchase_at: string | null;
};

type PurchaseResult = {
  transaction_id: string;
  customer_name: string;
  establishment_name: string;
  amount: number;
  stamps_earned: number;
  stamps_balance: number;
  created_at: string;
};

type CashbackRedemptionResult = {
  redemption_id: string;
  customer_name: string;
  establishment_name: string;
  amount_redeemed: number;
  cashback_balance: number;
  created_at: string;
};

type RedemptionResult = {
  redemption_id: string;
  customer_name: string;
  establishment_name: string;
  reward_description: string;
  stamps_used: number;
  stamps_balance: number;
  created_at: string;
};

type CustomerHistoryItem = {
  id: string;
  kind: 'compra' | 'resgate' | 'cashback';
  establishment_name: string;
  description: string;
  amount: number | null;
  stamps: number;
  created_at: string;
};

type CustomerLoyaltySummary = {
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
  benefit_type: 'pontos' | 'cashback' | 'ambos';
};

function onlyDigits(value: string) { return value.replace(/\D/g, ''); }

function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11; if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11; if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calc(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
  const second = calc(cnpj.slice(0, 12) + first, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}


function FidelizaLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  const wordColor = light ? '#ffffff' : '#062b52';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 7 : 12, minWidth: 0 }}>
      <svg width={compact ? 42 : 64} height={compact ? 42 : 58} viewBox="0 0 64 58" role="img" aria-label="Símbolo Fideliza" style={{ flexShrink: 0, overflow: 'visible' }}>
        <path d="M31 14 C12 -8 1 7 12 17 C18 22 25 19 31 14 C39 3 51 1 54 10 C57 19 45 23 31 14" fill="none" stroke="#ffca05" strokeWidth="5.5" strokeLinecap="round"/>
        {/* Corpo da caixa */}
        <path d="M10 28 H54 L48 49 Q47 52 43 52 H18 Q14 52 13 48 Z" fill="#ffca05"/>
        {/* Letra F centralizada e totalmente abaixo da tampa */}
        <text
          x="32"
          y="50"
          textAnchor="middle"
          fontFamily="Arial Black, Arial, Helvetica, sans-serif"
          fontSize="30"
          fontWeight="900"
          fill={wordColor}
        >F</text>
        {/* Tampa desenhada por último, sem cobrir a letra */}
        <path d="M7 20 Q7 17 11 17 H53 Q57 17 57 21 V27 H7 Z" fill="#ffca05"/>
        <path d="M51 43 L54 49 L61 50 L56 54 L57 58 L51 55 L45 58 L46 52 L42 49 L48 48 Z" fill="#ffca05"/>
      </svg>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, minWidth: 0 }}>
        <strong style={{ color: wordColor, fontSize: compact ? 22 : 30, letterSpacing: '-1.2px', fontWeight: 800 }}>Fideliza</strong>
        {!compact && <span style={{ color: '#ffca05', fontSize: 9, fontWeight: 800, letterSpacing: '2px', marginTop: 5, whiteSpace: 'nowrap' }}>FIDELIDADE QUE PREMIA</span>}
      </span>
    </span>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profileRole, setProfileRole] = useState<
    'admin' | 'lojista' | 'cliente' | null
  >(null);
  const [customerCard, setCustomerCard] = useState<{ qr_token: string; full_name: string | null; phone: string | null; cpf: string | null } | null>(null);
  const [customerCpf, setCustomerCpf] = useState('');
  const [savingCpf, setSavingCpf] = useState(false);
  const [identificationMethod, setIdentificationMethod] = useState<'qr' | 'cpf'>('qr');
  const [customerCpfInput, setCustomerCpfInput] = useState('');
  const [cpfCustomerPreview, setCpfCustomerPreview] = useState<{ cpf: string; name: string } | null>(null);
  const [lookingUpCpf, setLookingUpCpf] = useState(false);
  const [loadingCustomerCard, setLoadingCustomerCard] = useState(false);
  const [customerLoyaltySummary, setCustomerLoyaltySummary] = useState<CustomerLoyaltySummary[]>([]);
  const [loadingCustomerLoyalty, setLoadingCustomerLoyalty] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryItem[]>([]);
  const [visibleCustomerHistoryCount, setVisibleCustomerHistoryCount] = useState(5);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [cashbackRedemptionResult, setCashbackRedemptionResult] = useState<CashbackRedemptionResult | null>(null);
  const [cashbackRedeemAmount, setCashbackRedeemAmount] = useState('');

  const [adminEstablishments, setAdminEstablishments] = useState<
    AdminEstablishment[]
  >([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'recovery'>('login');
  const [authVisible, setAuthVisible] = useState(false);
  const [publicPortalVisible, setPublicPortalVisible] = useState(false);
  const [publicEstablishments, setPublicEstablishments] = useState<PublicEstablishment[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicCategoryFilter, setPublicCategoryFilter] = useState('Todas');
  const [selectedPublicEstablishment, setSelectedPublicEstablishment] = useState<PublicEstablishment | null>(null);
  const [profileDescription, setProfileDescription] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileLogoUrl, setProfileLogoUrl] = useState('');
  const [profileWhatsappUrl, setProfileWhatsappUrl] = useState('');
  const [profileLocationUrl, setProfileLocationUrl] = useState('');
  const [profileOpeningHours, setProfileOpeningHours] = useState('');
  const [profilePublicLinkUrl, setProfilePublicLinkUrl] = useState('');
  const [profileGalleryUrls, setProfileGalleryUrls] = useState<string[]>(['', '', '', '', '']);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [deletingEstablishmentId, setDeletingEstablishmentId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [signupRole, setSignupRole] = useState<'cliente' | 'lojista'>('lojista');
  const [signupDocumentType, setSignupDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [signupDocumentNumber, setSignupDocumentNumber] = useState('');
  const [signupAvailablePlans, setSignupAvailablePlans] = useState<any[]>([]);
  const [signupPlanId, setSignupPlanId] = useState('');
  const [merchantPlanSelection, setMerchantPlanSelection] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Lanchonete');
  const [business, setBusiness] = useState<Establishment | null>(null);

  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [programName, setProgramName] = useState('Programa de Fidelidade');
  const [stampsRequired, setStampsRequired] = useState('10');
  const [rewardDescription, setRewardDescription] = useState('');
  const [programActive, setProgramActive] = useState(false);
  const [cashbackPercent, setCashbackPercent] = useState('0');
  const [benefitType, setBenefitType] = useState<'pontos' | 'cashback' | 'ambos'>('ambos');

  const [page, setPage] = useState<Page>('overview');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>(
    'success',
  );
  const [busy, setBusy] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ purchases: 0, customers: 0, stamps: 0, cashback: 0 });
  const [dashboardStatsError, setDashboardStatsError] = useState('');
  const [merchantCustomers, setMerchantCustomers] = useState<MerchantCustomer[]>([]);
  const [loadingMerchantCustomers, setLoadingMerchantCustomers] = useState(false);
  const [merchantCustomerSearch, setMerchantCustomerSearch] = useState('');
  const [merchantCustomersError, setMerchantCustomersError] = useState('');
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [deletingCustomerBusy, setDeletingCustomerBusy] = useState(false);
  const [billingPlans, setBillingPlans] = useState<any[]>([]);
  const [billingSubscriptions, setBillingSubscriptions] = useState<any[]>([]);
  const [billingPlanChangeRequests, setBillingPlanChangeRequests] = useState<any[]>([]);
  const [billingPayments, setBillingPayments] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingPlanName, setBillingPlanName] = useState('Fideliza Mensal');
  const [billingPlanPrice, setBillingPlanPrice] = useState('19.90');
  const [billingPlanCycle, setBillingPlanCycle] = useState<'mensal' | 'semestral' | 'anual'>('mensal');
  const [billingPlanDescription, setBillingPlanDescription] = useState('Plano inicial para pequenos estabelecimentos.');
  const [billingEditingPlanId, setBillingEditingPlanId] = useState<string | null>(null);
  const [billingPaymentAmount, setBillingPaymentAmount] = useState('19.90');
  const [billingPaymentReference, setBillingPaymentReference] = useState('');
  const [billingSelectedSubscription, setBillingSelectedSubscription] = useState('');
  const [billingDueDate, setBillingDueDate] = useState('');

  // Indicadores do painel: todos filtrados para o estabelecimento atual.
  useEffect(() => {
    let cancelled = false;
    async function loadDashboardStats() {
      if (!supabase || profileRole !== 'lojista' || !business?.id) {
        setDashboardStats({ purchases: 0, customers: 0, stamps: 0, cashback: 0 });
        setDashboardStatsError('');
        return;
      }
      setDashboardStatsError('');
      const [purchasesResult, cashbackResult] = await Promise.all([
        supabase.from('loyalty_transactions')
          .select('customer_id, stamps_earned')
          .eq('establishment_id', business.id),
        supabase.from('cashback_transactions')
          .select('amount, transaction_type')
          .eq('establishment_id', business.id)
          .eq('transaction_type', 'credito'),
      ]);
      if (cancelled) return;
      if (purchasesResult.error || cashbackResult.error) {
        setDashboardStatsError('Alguns indicadores não puderam ser carregados. Confira as permissões de acesso no Supabase.');
        return;
      }
      const purchases = purchasesResult.data ?? [];
      const credits = cashbackResult.data ?? [];
      setDashboardStats({
        purchases: purchases.length,
        customers: new Set(purchases.map((row) => row.customer_id).filter(Boolean)).size,
        stamps: purchases.reduce((total, row) => total + Number(row.stamps_earned || 0), 0),
        cashback: credits.reduce((total, row) => total + Number(row.amount || 0), 0),
      });
    }
    void loadDashboardStats();
    return () => { cancelled = true; };
  }, [business?.id, profileRole]);

  useEffect(() => {
    let cancelled = false;
    async function loadMerchantCustomers() {
      if (!supabase || profileRole !== 'lojista' || page !== 'customers' || !business?.id) return;
      setLoadingMerchantCustomers(true);
      setMerchantCustomersError('');
      const { data, error } = await supabase.rpc('fideliza_list_customers', {
        p_establishment_id: business.id,
      });
      if (cancelled) return;
      if (error) {
        setMerchantCustomersError('Não foi possível carregar os clientes. Confira se a função SQL foi criada no Supabase e tente novamente.');
        setMerchantCustomers([]);
      } else {
        setMerchantCustomers((data ?? []) as MerchantCustomer[]);
      }
      setLoadingMerchantCustomers(false);
    }
    void loadMerchantCustomers();
    return () => { cancelled = true; };
  }, [business?.id, page, profileRole]);

  async function deleteMerchantCustomer(customer: MerchantCustomer) {
    if (!supabase || !business?.id || deletingCustomerBusy) return;
    const customerName = customer.full_name || 'este cliente';
    const confirmed = window.confirm(
      `ATENÇÃO: deseja excluir ${customerName} somente do estabelecimento ${business.name}?\n\n` +
      'Serão apagados permanentemente o histórico de compras, selos/resgates e movimentações de cashback deste estabelecimento. ' +
      'A conta do cliente e os dados dele em outras lojas serão preservados. Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;

    setDeletingCustomerBusy(true);
    setDeletingCustomerId(customer.customer_id);
    setMerchantCustomersError('');
    const { data, error } = await supabase.rpc('fideliza_delete_customer_from_establishment', {
      p_establishment_id: business.id,
      p_customer_id: customer.customer_id,
    });
    setDeletingCustomerBusy(false);
    setDeletingCustomerId(null);
    if (error) {
      showNotice(error.message || 'Não foi possível excluir os registros deste cliente.', 'error');
      return;
    }
    setMerchantCustomers((current) => current.filter((item) => item.customer_id !== customer.customer_id));
    showNotice(`Os dados e históricos de ${customerName} foram excluídos somente desta loja.`);
  }

  const filteredMerchantCustomers = merchantCustomers.filter((customer) => {
    const term = merchantCustomerSearch.trim().toLocaleLowerCase('pt-BR');
    if (!term) return true;
    return (customer.full_name || '').toLocaleLowerCase('pt-BR').includes(term)
      || (customer.phone || '').includes(term);
  });

  const isAdmin = profileRole === 'admin';

  function showNotice(
    message: string,
    type: 'success' | 'error' = 'success',
  ) {
    setNotice(message);
    setNoticeType(type);
  }

  // Recupera a sessão de autenticação.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) showNotice(error.message, 'error');
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        if (event === 'PASSWORD_RECOVERY') { setMode('recovery'); setAuthVisible(true); setPublicPortalVisible(false); setNotice('Escolha uma nova senha para sua conta.'); }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Carrega apenas estabelecimentos aprovados e publicados no portal público.
  useEffect(() => {
    let cancelled = false;

    async function loadPublicEstablishments() {
      if (!supabase) {
        setLoadingPublic(false);
        return;
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, business_type, description, address, phone, website, logo_url, whatsapp_url, location_url, public_link_url, opening_hours, gallery_urls')
        .eq('is_public', true)
        .eq('is_approved', true)
        .order('name', { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error('Erro ao carregar o diretório público:', error.message);
        setPublicEstablishments([]);
      } else {
        setPublicEstablishments((data ?? []) as PublicEstablishment[]);
      }
      setLoadingPublic(false);
    }

    loadPublicEstablishments();
    return () => { cancelled = true; };
  }, []);

  // Verifica a função do usuário.
  useEffect(() => {
    let cancelled = false;

    async function loadProfileRole() {
      if (!supabase || !session?.user) {
        setProfileRole(null);
        setPage('overview');
        return;
      }

      // Primeiro consulta a função administrativa segura do banco.
      const {
        data: adminResult,
        error: adminCheckError,
      } = await supabase.rpc('is_fideliza_admin');

      if (cancelled) return;

      if (!adminCheckError && adminResult === true) {
        setProfileRole('admin');
        setPage('admin');
        return;
      }

      // Se não for administrador, consulta a função do perfil.
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setProfileRole(null);
        showNotice(
          `Não foi possível verificar o perfil. Detalhe: ${error.message}`,
          'error',
        );
        return;
      }

      const role = String(data?.role ?? session.user.user_metadata?.role ?? '').toLowerCase();

      if (
        role === 'admin' ||
        role === 'lojista' ||
        role === 'cliente'
      ) {
        setProfileRole(role);

        if (role === 'admin') {
          setPage('admin');
        } else {
          setPage('overview');
        }
      } else {
        setProfileRole(null);
        showNotice(
          'Não encontramos um perfil válido para esta conta. Confira o cadastro em public.profiles.',
          'error',
        );
      }
    }

    loadProfileRole();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Carrega o cartão digital apenas para o próprio cliente autenticado.
  useEffect(() => {
    let cancelled = false;

    async function loadCustomerCard() {
      if (!supabase || !session?.user || profileRole !== 'cliente') {
        setCustomerCard(null);
        return;
      }

      setLoadingCustomerCard(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('qr_token, full_name, phone, cpf')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data?.qr_token) {
        setCustomerCard(null);
        showNotice(
          error
            ? `Não foi possível carregar seu cartão digital: ${error.message}`
            : 'O cartão digital ainda não foi criado para esta conta. Execute a atualização SQL do cartão Fideliza.',
          'error',
        );
      } else {
        setCustomerCard(data as { qr_token: string; full_name: string | null; phone: string | null; cpf: string | null });
        setCustomerCpf(data.cpf ?? '');
      }
      setLoadingCustomerCard(false);
    }

    loadCustomerCard();
    return () => { cancelled = true; };
  }, [session, profileRole]);

  // Carrega os saldos de fidelidade do cliente, separados por estabelecimento.
  useEffect(() => {
    let cancelled = false;

    async function loadCustomerLoyalty() {
      if (!supabase || !session?.user || profileRole !== 'cliente') {
        setCustomerLoyaltySummary([]);
        return;
      }

      setLoadingCustomerLoyalty(true);
      try {
        const { data: transactions, error: transactionsError } = await supabase
          .from('loyalty_transactions')
          .select('establishment_id, amount, stamps_earned, created_at')
          .eq('customer_id', session.user.id)
          .order('created_at', { ascending: false });
        if (transactionsError) throw transactionsError;

        const rows = (transactions ?? []) as Array<{ establishment_id: string; amount: number | string; stamps_earned: number; created_at: string }>;
        const establishmentIds: string[] = [...new Set<string>(rows.map((row) => row.establishment_id))];
        if (establishmentIds.length === 0) {
          if (!cancelled) { setCustomerLoyaltySummary([]); setCustomerHistory([]); }
          return;
        }

        const [{ data: establishments, error: establishmentsError }, { data: programs, error: programsError }, { data: redemptions, error: redemptionsError }, { data: cashbackRows, error: cashbackError }] = await Promise.all([
          supabase.from('establishments').select('id, name, business_type').in('id', establishmentIds),
          supabase.from('loyalty_programs').select('establishment_id, name, stamps_required, reward_description, active, cashback_percent').in('establishment_id', establishmentIds),
          supabase.from('loyalty_redemptions').select('establishment_id, stamps_used').eq('customer_id', session.user.id).in('establishment_id', establishmentIds),
          supabase.from('cashback_transactions').select('id, establishment_id, transaction_type, amount, description, created_at').eq('customer_id', session.user.id).order('created_at', { ascending: false }),
        ]);
        if (establishmentsError) throw establishmentsError;
        if (programsError) throw programsError;
        if (redemptionsError) throw redemptionsError;
        if (cashbackError) throw cashbackError;

        const nextSummary: CustomerLoyaltySummary[] = establishmentIds.map((establishmentId) => {
          const store = establishments?.find((item) => item.id === establishmentId);
          const program = programs?.find((item) => item.establishment_id === establishmentId);
          const storeTransactions = rows.filter((row) => row.establishment_id === establishmentId);
          return {
            establishment_id: establishmentId,
            establishment_name: store?.name ?? 'Estabelecimento participante',
            business_type: store?.business_type ?? null,
            stamps_balance: Math.max(0, storeTransactions.reduce((sum, row) => sum + Number(row.stamps_earned || 0), 0) - (redemptions ?? []).filter((item) => item.establishment_id === establishmentId).reduce((sum, item) => sum + Number(item.stamps_used || 0), 0)),
            cashback_balance: Math.max(0, (cashbackRows ?? []).filter((item) => item.establishment_id === establishmentId).reduce((sum, item) => sum + (item.transaction_type === 'credito' ? Number(item.amount || 0) : -Number(item.amount || 0)), 0)),
            purchases_count: storeTransactions.length,
            total_spent: storeTransactions.reduce((sum, row) => sum + Number(row.amount || 0), 0),
            last_purchase_at: storeTransactions[0]?.created_at ?? null,
            program_name: program?.name ?? null,
            stamps_required: program ? Number(program.stamps_required) : null,
            reward_description: program?.reward_description ?? null,
            program_active: Boolean(program?.active),
            benefit_type: (program?.benefit_type ?? 'ambos') as 'pontos' | 'cashback' | 'ambos',
          };
        }).sort((a, b) => (b.last_purchase_at ?? '').localeCompare(a.last_purchase_at ?? ''));

        const establishmentNames = new Map<string, string>((establishments ?? []).map((item) => [item.id, item.name]));
        const { data: redemptionHistory, error: historyError } = await supabase
          .from('loyalty_redemptions')
          .select('id, establishment_id, reward_description, stamps_used, created_at')
          .eq('customer_id', session.user.id)
          .order('created_at', { ascending: false });
        if (historyError) throw historyError;

        const historyItems: CustomerHistoryItem[] = [
          ...rows.map((row, index) => ({
            id: `purchase-${index}-${row.created_at}`,
            kind: 'compra' as const,
            establishment_name: establishmentNames.get(row.establishment_id) ?? 'Estabelecimento participante',
            description: 'Compra registrada',
            amount: Number(row.amount || 0),
            stamps: Number(row.stamps_earned || 0),
            created_at: row.created_at,
          })),
          ...((redemptionHistory ?? []) as Array<{ id: string; establishment_id: string; reward_description: string; stamps_used: number; created_at: string }>).map((item) => ({
            id: item.id,
            kind: 'resgate' as const,
            establishment_name: establishmentNames.get(item.establishment_id) ?? 'Estabelecimento participante',
            description: item.reward_description,
            amount: null,
            stamps: Number(item.stamps_used || 0),
            created_at: item.created_at,
          })),
          ...((cashbackRows ?? []) as Array<{ id: string; establishment_id: string; transaction_type: string; amount: number | string; description: string; created_at: string }>).map((item) => ({
            id: `cashback-${item.id}`,
            kind: 'cashback' as const,
            establishment_name: establishmentNames.get(item.establishment_id) ?? 'Estabelecimento participante',
            description: item.description,
            amount: Number(item.amount || 0) * (item.transaction_type === 'resgate' ? -1 : 1),
            stamps: 0,
            created_at: item.created_at,
          })),
        ].sort((a, b) => b.created_at.localeCompare(a.created_at));

        if (!cancelled) { setCustomerLoyaltySummary(nextSummary); setCustomerHistory(historyItems); }
      } catch (error) {
        if (!cancelled) showNotice(error instanceof Error ? `Não foi possível carregar suas fidelidades: ${error.message}` : 'Não foi possível carregar suas fidelidades.', 'error');
      } finally {
        if (!cancelled) setLoadingCustomerLoyalty(false);
      }
    }

    void loadCustomerLoyalty();
    return () => { cancelled = true; };
  }, [session, profileRole]);

  // Liga a câmera somente enquanto a tela de registro de compra estiver aberta.
  useEffect(() => {
    if (page !== 'register' || profileRole !== 'lojista' || !business || identificationMethod !== 'qr') return;

    let scanner: Html5Qrcode | null = null;
    let cancelled = false;

    async function startScanner() {
      try {
        scanner = new Html5Qrcode('fideliza-qr-reader');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (cancelled) return;
            setQrTokenInput(decodedText.trim());
            showNotice('QR Code lido. Confira o valor e registre a compra.');
            if (scanner?.isScanning) {
              scanner.stop().catch(() => undefined);
            }
          },
          () => undefined,
        );
      } catch (error) {
        if (!cancelled) {
          showNotice(
            `Não foi possível abrir a câmera. Confira a permissão do navegador ou digite o código manualmente. ${error instanceof Error ? error.message : ''}`,
            'error',
          );
        }
      }
    }

    // Aguarda a tela inserir o elemento que receberá a câmera.
    const startTimer = window.setTimeout(() => { void startScanner(); }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (scanner?.isScanning) scanner.stop().catch(() => undefined);
      scanner?.clear();
    };
  }, [page, profileRole, business, identificationMethod]);

  async function findCustomerByCpf() {
    if (!supabase) {
      showNotice('O Supabase não está configurado.', 'error');
      return;
    }
    const digits = customerCpfInput.replace(/\D/g, '');
    if (digits.length !== 11) {
      setCpfCustomerPreview(null);
      showNotice('Digite os 11 números do CPF para localizar o cliente.', 'error');
      return;
    }
    setLookingUpCpf(true);
    setCpfCustomerPreview(null);
    
    setPurchaseResult(null);
    try {
      const { data, error } = await supabase.rpc('find_fideliza_customer_by_cpf', {
        p_cpf: digits,
      });
      if (error) throw error;
      const result = data as { customer_name?: string } | null;
      if (!result?.customer_name) {
        throw new Error('Não encontramos um cliente com esse CPF. Confira os números ou peça ao cliente para cadastrar o CPF no perfil.');
      }
      setCpfCustomerPreview({ cpf: digits, name: result.customer_name });
      
      showNotice('Cliente localizado. Confira o nome antes de registrar a compra.');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Não foi possível localizar o cliente.', 'error');
    } finally {
      setLookingUpCpf(false);
    }
  }

  async function registerPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      showNotice('O Supabase não está configurado.', 'error');
      return;
    }
    setBusy(true);
    setPurchaseResult(null);
    try {
      const cpfDigits = customerCpfInput.replace(/\D/g, '');
      if (identificationMethod === 'cpf' && cpfDigits.length !== 11) {
        throw new Error('Digite um CPF válido com 11 números.');
      }
      if (identificationMethod === 'cpf' && (!cpfCustomerPreview || cpfCustomerPreview.cpf !== cpfDigits)) {
        throw new Error('Localize o cliente pelo CPF antes de registrar a compra.');
      }
      const { data, error } = await supabase.rpc('register_fideliza_purchase', {
        p_qr_token: identificationMethod === 'qr' ? (qrTokenInput.trim() || null) : null,
        p_cpf: identificationMethod === 'cpf' ? cpfDigits : null,
        p_amount: Number(purchaseAmount.replace(',', '.')),
      });
      if (error) throw error;
      const result = data as PurchaseResult;
      setPurchaseResult(result);
      setPurchaseAmount('');
      showNotice('Compra registrada com sucesso!');
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : 'Não foi possível registrar a compra.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  async function redeemReward() {
    if (!supabase) {
      showNotice('O Supabase não está configurado.', 'error');
      return;
    }
    if (identificationMethod === 'cpf') {
      const digits = customerCpfInput.replace(/\D/g, '');
      if (digits.length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== digits) {
        showNotice('Localize o cliente pelo CPF antes de resgatar a recompensa.', 'error');
        return;
      }
    } else if (!qrTokenInput.trim()) {
      showNotice('Leia ou informe o QR Code do cliente antes do resgate.', 'error');
      return;
    }
    setBusy(true);
    setRedemptionResult(null);
    try {
      const { data, error } = await supabase.rpc('redeem_fideliza_reward', {
        p_customer_qr_token: identificationMethod === 'qr' ? qrTokenInput.trim() : null,
        p_customer_cpf: identificationMethod === 'cpf' ? customerCpfInput.replace(/\D/g, '') : null,
      });
      if (error) throw error;
      setRedemptionResult(data as RedemptionResult);
      showNotice('Recompensa resgatada com sucesso!');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Não foi possível resgatar a recompensa.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function redeemCashback() {
    if (!supabase) {
      showNotice('O Supabase não está configurado.', 'error');
      return;
    }
    if (identificationMethod === 'cpf') {
      const digits = customerCpfInput.replace(/\D/g, '');
      if (digits.length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== digits) {
        showNotice('Localize o cliente pelo CPF antes de resgatar cashback.', 'error');
        return;
      }
    } else if (!qrTokenInput.trim()) {
      showNotice('Leia ou informe o QR Code do cliente antes do resgate.', 'error');
      return;
    }
    const amount = Number(cashbackRedeemAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotice('Informe o valor de cashback que será utilizado.', 'error');
      return;
    }
    setBusy(true);
    setCashbackRedemptionResult(null);
    try {
      const { data, error } = await supabase.rpc('redeem_fideliza_cashback', {
        p_customer_qr_token: identificationMethod === 'qr' ? qrTokenInput.trim() : null,
        p_customer_cpf: identificationMethod === 'cpf' ? customerCpfInput.replace(/\D/g, '') : null,
        p_amount: amount,
      });
      if (error) throw error;
      setCashbackRedemptionResult(data as CashbackRedemptionResult);
      setCashbackRedeemAmount('');
      showNotice('Cashback resgatado com sucesso!');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Não foi possível resgatar o cashback.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveCustomerCpf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user) return;
    const digits = customerCpf.replace(/\D/g, '');
    if (digits && digits.length !== 11) {
      showNotice('Digite os 11 números do CPF.', 'error');
      return;
    }
    setSavingCpf(true);
    const { error } = await supabase
      .from('profiles')
      .update({ cpf: digits || null })
      .eq('id', session.user.id);
    setSavingCpf(false);
    if (error) {
      showNotice(`Não foi possível salvar o CPF: ${error.message}`, 'error');
      return;
    }
    setCustomerCard((current) => current ? { ...current, cpf: digits || null } : current);
    setCustomerCpf(digits);
    showNotice(digits ? 'CPF salvo com segurança no seu perfil.' : 'CPF removido do perfil.');
  }

  async function loadBilling() {
    if (!supabase || (!isAdmin && profileRole !== 'lojista')) return;
    setBillingLoading(true);
    const plansResult = await supabase.from('fideliza_billing_plans').select('*').order('created_at', { ascending: true });
    if (!plansResult.error) setBillingPlans(plansResult.data ?? []);
    if (isAdmin) {
      const [subsResult, paymentsResult, requestsResult] = await Promise.all([
        supabase.from('fideliza_billing_subscriptions').select('*, establishments(name), fideliza_billing_plans(name)').order('due_date', { ascending: true }),
        supabase.from('fideliza_billing_payments').select('*, establishments(name)').order('paid_at', { ascending: false }).limit(100),
        supabase.from('fideliza_billing_plan_change_requests').select('*, establishments(name), fideliza_billing_plans(name)').eq('status', 'pending').order('created_at', { ascending: false }),
      ]);
      if (!subsResult.error) setBillingSubscriptions(subsResult.data ?? []);
      if (!paymentsResult.error) setBillingPayments(paymentsResult.data ?? []);
      if (!requestsResult.error) setBillingPlanChangeRequests(requestsResult.data ?? []);
      else showNotice(`Não foi possível carregar solicitações de alteração: ${requestsResult.error.message}`, 'error');
    } else if (business?.id) {
      const [subResult, payResult] = await Promise.all([
        supabase.from('fideliza_billing_subscriptions').select('*, fideliza_billing_plans(name, description)').eq('establishment_id', business.id).maybeSingle(),
        supabase.from('fideliza_billing_payments').select('*').eq('establishment_id', business.id).order('paid_at', { ascending: false }).limit(20),
      ]);
      setBillingSubscriptions(subResult.data ? [subResult.data] : []);
      if (subResult.data?.pending_plan_id || subResult.data?.plan_id) setMerchantPlanSelection(subResult.data.pending_plan_id ?? subResult.data.plan_id);
      setBillingPayments(payResult.data ?? []);
    }
    setBillingLoading(false);
  }

  useEffect(() => { if (page === 'billing') void loadBilling(); }, [page, isAdmin, profileRole, business?.id]);

  async function saveBillingPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isAdmin) return;
    const periodPrice = Number(billingPlanPrice.replace(',', '.'));
    const periodMonths = billingPlanCycle === 'semestral' ? 6 : billingPlanCycle === 'anual' ? 12 : 1;
    const cycleLabel = billingPlanCycle === 'semestral' ? 'Semestral' : billingPlanCycle === 'anual' ? 'Anual' : 'Mensal';
    if (!billingPlanName.trim() || !Number.isFinite(periodPrice) || periodPrice < 0) {
      showNotice('Informe um nome e um preço válido.', 'error');
      return;
    }
    const values = {
      name: billingPlanName.trim(),
      description: billingPlanDescription.trim(),
      billing_cycle: billingPlanCycle,
      period_months: periodMonths,
      period_price: periodPrice,
      monthly_price: Number((periodPrice / periodMonths).toFixed(2)),
      trial_days: 30,
    };
    const result = billingEditingPlanId
      ? await supabase.from('fideliza_billing_plans').update(values).eq('id', billingEditingPlanId)
      : await supabase.from('fideliza_billing_plans').insert({ ...values, is_active: true });
    if (result.error) {
      showNotice(`Não foi possível ${billingEditingPlanId ? 'salvar as alterações do' : 'criar o'} plano: ${result.error.message}`, 'error');
      return;
    }
    showNotice(billingEditingPlanId ? `Plano ${billingPlanName.trim()} atualizado. Assinaturas vigentes não foram alteradas automaticamente.` : `Plano ${cycleLabel} criado com sucesso.`);
    setBillingEditingPlanId(null);
    setBillingPlanName('Fideliza Mensal');
    setBillingPlanCycle('mensal');
    setBillingPlanPrice('19.90');
    setBillingPlanDescription('Plano inicial para pequenos estabelecimentos.');
    await loadBilling();
  }

  function startEditingBillingPlan(plan: any) {
    setBillingEditingPlanId(plan.id);
    setBillingPlanName(String(plan.name ?? ''));
    setBillingPlanCycle(plan.billing_cycle === 'semestral' || plan.billing_cycle === 'anual' ? plan.billing_cycle : 'mensal');
    setBillingPlanPrice(String(plan.period_price ?? plan.monthly_price ?? '19.90'));
    setBillingPlanDescription(String(plan.description ?? ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteBillingPlan(plan: any) {
    if (!supabase || !isAdmin) return;
    if (!window.confirm(`Excluir permanentemente o plano "${plan.name}"? Essa ação não pode ser desfeita.`)) return;

    // Não apaga planos que já fazem parte do histórico de assinaturas ou solicitações.
    const [subscriptionsCheck, pendingPlansCheck, requestsCheck] = await Promise.all([
      supabase.from('fideliza_billing_subscriptions').select('id', { count: 'exact', head: true }).eq('plan_id', plan.id),
      supabase.from('fideliza_billing_subscriptions').select('id', { count: 'exact', head: true }).eq('pending_plan_id', plan.id),
      supabase.from('fideliza_billing_plan_change_requests').select('id', { count: 'exact', head: true }).eq('requested_plan_id', plan.id),
    ]);
    const checkError = subscriptionsCheck.error ?? pendingPlansCheck.error ?? requestsCheck.error;
    if (checkError) {
      showNotice(`Não foi possível verificar se o plano pode ser excluído: ${checkError.message}`, 'error');
      return;
    }
    if ((subscriptionsCheck.count ?? 0) > 0 || (pendingPlansCheck.count ?? 0) > 0 || (requestsCheck.count ?? 0) > 0) {
      showNotice('Este plano possui assinaturas ou solicitações vinculadas. Para preservar o histórico, use “Desativar”.', 'error');
      return;
    }
    const { error } = await supabase.from('fideliza_billing_plans').delete().eq('id', plan.id);
    if (error) {
      showNotice(`Não foi possível excluir o plano: ${error.message}. Se ele estiver vinculado a algum registro, desative-o para preservar o histórico.`, 'error');
      return;
    }
    if (billingEditingPlanId === plan.id) {
      setBillingEditingPlanId(null);
      setBillingPlanName('Fideliza Mensal');
      setBillingPlanCycle('mensal');
      setBillingPlanPrice('19.90');
      setBillingPlanDescription('Plano inicial para pequenos estabelecimentos.');
    }
    showNotice(`Plano "${plan.name}" excluído com sucesso.`);
    await loadBilling();
  }

  async function toggleBillingPlan(plan: any) {
    if (!supabase || !isAdmin) return;
    if (plan.is_active && billingPlans.filter(item => item.is_active).length <= 1) {
      showNotice('Mantenha pelo menos um plano ativo para novos cadastros.', 'error');
      return;
    }
    const action = plan.is_active ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${action} o plano "${plan.name}"? ${plan.is_active ? 'Ele deixará de aparecer para novos cadastros; assinaturas existentes serão preservadas.' : 'Ele voltará a aparecer para novos cadastros.'}`)) return;
    const { error } = await supabase.from('fideliza_billing_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    if (error) {
      showNotice(`Não foi possível ${action} o plano: ${error.message}`, 'error');
      return;
    }
    showNotice(`Plano ${plan.name} ${plan.is_active ? 'desativado' : 'ativado'} com sucesso.`);
    await loadBilling();
  }

  function getBillingAlert(subscription: any): { label: string; detail: string } | null {
    if (!subscription || subscription.status === 'cancelled') return null;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (subscription.status === 'overdue') return { label: 'Pagamento em atraso', detail: 'Confira o pagamento e entre em contato com o lojista.' };
    if (subscription.status === 'pending') return { label: 'Pagamento pendente', detail: 'Aguardando confirmação do pagamento.' };
    if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() < now.getTime()) {
      return { label: 'Teste gratuito encerrado', detail: 'O período de teste terminou. Avise o lojista sobre a assinatura.' };
    }
    if (subscription.due_date && subscription.due_date < today) {
      return { label: 'Vencimento em atraso', detail: 'A data de vencimento passou. Verifique se o Pix foi realizado.' };
    }
    return null;
  }

  async function saveBillingPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isAdmin || !billingSelectedSubscription) return;
    const sub = billingSubscriptions.find((item) => item.id === billingSelectedSubscription);
    const amount = Number(billingPaymentAmount.replace(',', '.'));
    if (!sub || !Number.isFinite(amount) || amount <= 0) { showNotice('Selecione uma assinatura e informe um valor válido.', 'error'); return; }
    const { error } = await supabase.rpc('fideliza_record_billing_payment', {
      p_subscription_id: sub.id,
      p_amount: amount,
      p_reference: billingPaymentReference.trim(),
    });
    if (error) { showNotice(`Não foi possível registrar o pagamento: ${error.message}`, 'error'); return; }
    const appliedPlan = sub.pending_plan_id ? billingPlans.find(plan => plan.id === sub.pending_plan_id) : null;
    const periodMonths = Number(appliedPlan?.period_months ?? sub.period_months ?? 1);
    showNotice(`Pagamento Pix registrado e assinatura atualizada por ${periodMonths} ${periodMonths === 1 ? 'mês' : 'meses'}.`); setBillingPaymentReference(''); await loadBilling();
  }

  async function requestMerchantPlanChange(subscription: any) {
    if (!supabase || profileRole !== 'lojista' || !subscription?.id || !merchantPlanSelection) return;
    if (merchantPlanSelection === subscription.plan_id) { showNotice('Esse já é o plano atual da assinatura.', 'error'); return; }
    const chosen = billingPlans.find(plan => plan.id === merchantPlanSelection && plan.is_active);
    if (!chosen) { showNotice('Selecione um plano ativo.', 'error'); return; }
    const { error } = await supabase.rpc('fideliza_request_billing_plan_change', {
      p_subscription_id: subscription.id,
      p_plan_id: chosen.id,
    });
    if (error) { showNotice(`Não foi possível agendar a alteração de plano: ${error.message}`, 'error'); return; }
    showNotice('Alteração de plano agendada. Ela terá vigência após o término do período atual.');
    await loadBilling();
  }

  async function requestMerchantPlanChangeByEstablishment(planId: string) {
    if (!supabase || profileRole !== 'lojista' || !business?.id) {
      showNotice('Não foi possível identificar seu estabelecimento. Atualize a página e tente novamente.', 'error');
      return;
    }
    const chosen = billingPlans.find(plan => plan.id === planId && plan.is_active);
    if (!chosen) { showNotice('Selecione um plano ativo.', 'error'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('fideliza_request_establishment_plan_change', {
      p_establishment_id: business.id,
      p_plan_id: chosen.id,
    });
    setBusy(false);
    if (error) {
      showNotice(`Não foi possível solicitar a alteração: ${error.message}`, 'error');
      await loadBilling();
      return;
    }
    setMerchantPlanSelection(chosen.id);
    showNotice(`Solicitação de alteração para o plano ${chosen.name} enviada ao administrador. O plano atual continua vigente até a análise.`, 'success');
    await loadBilling();
  }

  async function chooseInitialMerchantPlan(planId: string) {
    if (!supabase || profileRole !== 'lojista') return;
    if (!business?.id) {
      showNotice('Cadastre primeiro os dados do seu estabelecimento para vincular a assinatura à sua loja.', 'error');
      return;
    }
    if (billingSubscriptions.length > 0) {
      showNotice('Sua loja já possui uma assinatura. Use a opção de alteração de plano.', 'error');
      return;
    }
    const chosen = billingPlans.find(plan => plan.id === planId && plan.is_active);
    if (!chosen) {
      showNotice('Selecione um plano ativo.', 'error');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('fideliza_apply_initial_billing_plan', {
      p_establishment_id: business.id,
      p_plan_id: chosen.id,
    });
    setBusy(false);
    if (error) {
      showNotice(`Não foi possível selecionar o plano: ${error.message}`, 'error');
      return;
    }
    setMerchantPlanSelection(chosen.id);
    showNotice(`Plano ${chosen.name} selecionado. O período gratuito e as datas da assinatura serão definidos pelo sistema.`);
    await loadBilling();
  }

  async function decideBillingPlanChange(requestId: string, decision: 'approved' | 'rejected') {
    if (!supabase || !isAdmin) return;
    const actionLabel = decision === 'approved' ? 'aprovar' : 'rejeitar';
    if (!window.confirm(`Deseja ${actionLabel} esta solicitação de alteração de plano?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc('fideliza_admin_decide_billing_plan_change', {
      p_request_id: requestId,
      p_decision: decision,
    });
    setBusy(false);
    if (error) {
      showNotice(`Não foi possível ${actionLabel} a solicitação: ${error.message}`, 'error');
      return;
    }
    showNotice(decision === 'approved' ? 'Solicitação aprovada. A mudança foi programada conforme a regra de vigência.' : 'Solicitação rejeitada.');
    await loadBilling();
  }

  async function updateBillingSubscription(id: string, updates: Record<string, any>) {
    if (!supabase || !isAdmin) return;
    const { error } = await supabase.from('fideliza_billing_subscriptions').update(updates).eq('id', id);
    if (error) { showNotice(`Não foi possível atualizar a assinatura: ${error.message}`, 'error'); return; }
    showNotice('Assinatura atualizada. Nenhuma conta será bloqueada automaticamente.'); await loadBilling();
  }

  async function deleteAdminEstablishment(establishment: AdminEstablishment) {
    if (!supabase || !isAdmin) return;
    const confirmed = window.confirm(`Excluir permanentemente a loja "${establishment.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    setDeletingEstablishmentId(establishment.id);
    const { error } = await supabase.rpc('fideliza_admin_delete_establishment', { p_establishment_id: establishment.id });
    setDeletingEstablishmentId(null);
    if (error) {
      showNotice(`Não foi possível excluir a loja: ${error.message}. Confira se a migração SQL de exclusão foi executada.`, 'error');
      return;
    }
    setAdminEstablishments(current => current.filter(item => item.id !== establishment.id));
    showNotice(`A loja "${establishment.name}" foi excluída.`);
  }

  // Busca os estabelecimentos para o painel administrativo.
  async function loadAdminEstablishments() {
    if (!supabase || !isAdmin) return;

    setLoadingAdmin(true);

    const { data, error } = await supabase
      .from('establishments')
      .select(
        'id, name, business_type, address, phone, is_public, is_approved, moderation_status, created_at',
      )
      .order('created_at', { ascending: false });

    setLoadingAdmin(false);

    if (error) {
      showNotice(
        `Não foi possível carregar as lojas: ${error.message}`,
        'error',
      );
      return;
    }

    setAdminEstablishments(
      (data ?? []) as AdminEstablishment[],
    );
  }

  useEffect(() => {
    if (isAdmin && page === 'admin') {
      loadAdminEstablishments();
    }
  }, [isAdmin, page]);

  // Aprova, rejeita ou suspende um estabelecimento.
  async function moderateEstablishment(
    establishment: AdminEstablishment,
    status: AdminEstablishment['moderation_status'],
  ) {
    if (!supabase || !isAdmin) {
      showNotice(
        'Você não tem permissão para moderar estabelecimentos.',
        'error',
      );
      return;
    }

    setBusy(true);
    setNotice('');

    const approved = status === 'approved';

    const { error } = await supabase
      .from('establishments')
      .update({
        moderation_status: status,
        is_approved: approved,
        is_public: approved,
      })
      .eq('id', establishment.id);

    setBusy(false);

    if (error) {
      showNotice(
        `Não foi possível atualizar a loja: ${error.message}`,
        'error',
      );
      return;
    }

    setAdminEstablishments((current) =>
      current.map((item) =>
        item.id === establishment.id
          ? {
              ...item,
              moderation_status: status,
              is_approved: approved,
              is_public: approved,
            }
          : item,
      ),
    );

    showNotice(
      `Status de "${establishment.name}" atualizado: ${moderationLabel(status)}.`,
    );
  }

  function moderationLabel(
    status: AdminEstablishment['moderation_status'],
  ) {
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
      suspended: 'Suspensa',
    };

    return labels[status];
  }

  // Carrega o estabelecimento do lojista.
  useEffect(() => {
    async function loadEstablishment() {
      if (!supabase || !session?.user) {
        setBusiness(null);
        setProgram(null);
        return;
      }

      setLoadingBusiness(true);

      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, business_type, description, address, phone, website, logo_url, whatsapp_url, location_url, public_link_url, opening_hours, gallery_urls')
        .eq('owner_id', session.user.id)
        .limit(1)
        .maybeSingle();

      setLoadingBusiness(false);

      if (error) {
        showNotice(
          `Não foi possível carregar o estabelecimento: ${error.message}`,
          'error',
        );
        return;
      }

      const loadedBusiness = data as Establishment | null;
      setBusiness(loadedBusiness);
      if (loadedBusiness) {
        setProfileDescription(loadedBusiness.description ?? '');
        setProfileAddress(loadedBusiness.address ?? '');
        setProfilePhone(loadedBusiness.phone ?? '');
        setProfileWebsite(loadedBusiness.website ?? '');
        setProfileLogoUrl(loadedBusiness.logo_url ?? '');
        setProfileWhatsappUrl(loadedBusiness.whatsapp_url ?? '');
        setProfileLocationUrl(loadedBusiness.location_url ?? '');
        setProfilePublicLinkUrl(loadedBusiness.public_link_url ?? '');
        const hours = loadedBusiness.opening_hours;
        setProfileOpeningHours(typeof hours === 'string' ? hours : hours?.text ?? '');
        setProfileGalleryUrls(Array.from({ length: 5 }, (_, index) => loadedBusiness.gallery_urls?.[index] ?? ''));
      }
    }

    loadEstablishment();
  }, [session]);

  // Carrega o programa de fidelidade do estabelecimento.
  useEffect(() => {
    async function loadProgram() {
      if (!supabase || !business) {
        setProgram(null);
        setProgramName('Programa de Fidelidade');
        setStampsRequired('10');
        setRewardDescription('');
        setProgramActive(false);
        setCashbackPercent('0');
        setBenefitType('ambos');
        return;
      }

      setLoadingProgram(true);

      const { data, error } = await supabase
        .from('loyalty_programs')
        .select(
          'id, establishment_id, name, stamps_required, reward_description, active, cashback_percent, benefit_type',
        )
        .eq('establishment_id', business.id)
        .maybeSingle();

      setLoadingProgram(false);

      if (error) {
        showNotice(
          `Não foi possível carregar o programa: ${error.message}`,
          'error',
        );
        return;
      }

      const savedProgram = data as LoyaltyProgram | null;
      setProgram(savedProgram);

      if (savedProgram) {
        setProgramName(savedProgram.name);
        setStampsRequired(String(savedProgram.stamps_required));
        setRewardDescription(savedProgram.reward_description);
        setProgramActive(savedProgram.active);
        setCashbackPercent(String(savedProgram.cashback_percent ?? 0));
        setBenefitType(savedProgram.benefit_type ?? 'ambos');
      } else {
        setProgramName('Programa de Fidelidade');
        setStampsRequired('10');
        setRewardDescription('');
        setProgramActive(false);
        setCashbackPercent('0');
        setBenefitType('ambos');
      }
    }

    loadProgram();
  }, [business]);

  // Carrega os planos públicos disponíveis para a seleção durante o cadastro de lojista.
  useEffect(() => {
    let cancelled = false;
    async function loadSignupPlans() {
      if (!supabase || mode !== 'signup' || signupRole !== 'lojista') return;
      const { data, error } = await supabase.from('fideliza_billing_plans').select('id, name, billing_cycle, period_months, period_price, monthly_price, trial_days, is_active').eq('is_active', true).order('created_at', { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        setSignupAvailablePlans(data);
        setSignupPlanId(current => data.some(plan => plan.id === current) ? current : (data.find(plan => plan.billing_cycle === 'mensal')?.id ?? data[0]?.id ?? ''));
      }
    }
    void loadSignupPlans();
    return () => { cancelled = true; };
  }, [mode, signupRole]);

  // Login e cadastro.
  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setBusy(true);

    try {
      if (!supabase) {
        showNotice(
          'Verifique a configuração do Supabase no arquivo .env.',
          'error',
        );
        return;
      }

      if (mode === 'recovery') {
        if (password.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMode('login'); setAuthVisible(false); setPassword('');
        showNotice('Senha alterada com sucesso. Faça login com sua nova senha.');
        await supabase.auth.signOut();
        return;
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setResetEmailSent(true);
        showNotice('Se houver uma conta cadastrada com esse e-mail, você receberá um link para redefinir a senha. Confira também o spam.');
        return;
      }

      if (mode === 'signup') {
        const documentDigits = onlyDigits(signupDocumentNumber);
        const documentValid = signupDocumentType === 'cpf' ? isValidCpf(documentDigits) : isValidCnpj(documentDigits);
        if (!documentValid) throw new Error(signupDocumentType === 'cpf' ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.');
        if (signupRole === 'lojista' && (!signupPlanId || !signupAvailablePlans.some(plan => plan.id === signupPlanId))) {
          throw new Error('Selecione um plano de assinatura disponível para continuar.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: signupRole,
              document_type: signupDocumentType,
              document_number: documentDigits,
              requested_billing_plan_id: signupRole === 'lojista' ? signupPlanId : null,
            },
          },
        });

        if (error) throw error;

        showNotice(
          signupRole === 'cliente'
            ? 'Cadastro de cliente enviado! Confira seu e-mail para confirmar a conta e depois faça login.'
            : 'Cadastro de lojista enviado! Confira seu e-mail para confirmar a conta e depois faça login.',
        );
        setSignupDocumentNumber('');
        setMode('login');
        setResetEmailSent(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar na conta.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  // Cadastro de estabelecimento.
  async function createEstablishment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setNotice('');
    setBusy(true);

    try {
      if (!supabase || !session?.user) {
        showNotice(
          'Entre na sua conta antes de cadastrar o estabelecimento.',
          'error',
        );
        return;
      }

      const { data, error } = await supabase
        .from('establishments')
        .insert({
          owner_id: session.user.id,
          name: businessName.trim(),
          business_type: category,
        })
        .select('id, name, business_type')
        .single();

      if (error) throw error;

      setBusiness(data as Establishment);
      const { data: signupProfile, error: signupProfileError } = await supabase
        .from('profiles')
        .select('requested_billing_plan_id')
        .eq('id', session.user.id)
        .maybeSingle();
      if (signupProfileError) {
        showNotice('Estabelecimento criado, mas não foi possível consultar o plano selecionado. Confira a área de assinatura.', 'error');
      } else if (signupProfile?.requested_billing_plan_id) {
        const { error: planError } = await supabase.rpc('fideliza_apply_initial_billing_plan', {
          p_establishment_id: data.id,
          p_plan_id: signupProfile.requested_billing_plan_id,
        });
        if (planError) {
          showNotice(`Estabelecimento criado, mas o plano selecionado não foi aplicado: ${planError.message}`, 'error');
        } else {
          showNotice('Estabelecimento cadastrado! O plano escolhido no cadastro foi aplicado à sua assinatura.');
        }
      } else {
        showNotice('Estabelecimento cadastrado com sucesso!');
      }
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o estabelecimento.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  // Salva os dados do cartão de visita digital do estabelecimento.
  async function saveBusinessProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !business) {
      showNotice('Cadastre ou carregue seu estabelecimento antes de editar o cartão.', 'error');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const gallery = profileGalleryUrls.map((url) => url.trim()).filter(Boolean).slice(0, 5);
      const { data, error } = await supabase
        .from('establishments')
        .update({
          description: profileDescription.trim() || null,
          address: profileAddress.trim() || null,
          phone: profilePhone.trim() || null,
          website: profileWebsite.trim() || null,
          logo_url: profileLogoUrl.trim() || null,
          whatsapp_url: profileWhatsappUrl.trim() || null,
          location_url: profileLocationUrl.trim() || null,
          public_link_url: profilePublicLinkUrl.trim() || null,
          opening_hours: { text: profileOpeningHours.trim() },
          gallery_urls: gallery,
        })
        .eq('id', business.id)
        .select('id, name, business_type, description, address, phone, website, logo_url, whatsapp_url, location_url, public_link_url, opening_hours, gallery_urls')
        .single();
      if (error) throw error;
      setBusiness(data as Establishment);
      setPublicEstablishments((current) => current.map((item) => item.id === business.id ? { ...item, ...(data as PublicEstablishment) } : item));
      showNotice('Cartão de visita digital salvo com sucesso.');
    } catch (error) {
      showNotice(error instanceof Error ? `Não foi possível salvar: ${error.message}` : 'Não foi possível salvar o cartão digital.', 'error');
    } finally {
      setBusy(false);
    }
  }

  // Salva o programa de fidelidade.
  async function saveProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');

    if (!supabase || !business) {
      showNotice(
        'Não encontramos seu estabelecimento. Atualize a página e tente novamente.',
        'error',
      );
      return;
    }

    const offersStamps = benefitType === 'pontos' || benefitType === 'ambos';
    const offersCashback = benefitType === 'cashback' || benefitType === 'ambos';
    const quantity = offersStamps ? Number(stampsRequired) : 1;

    if (offersStamps && (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    )) {
      showNotice(
        'Informe uma quantidade de selos entre 1 e 100.',
        'error',
      );
      return;
    }

    if (offersStamps && !rewardDescription.trim()) {
      showNotice(
        'Descreva a recompensa que o cliente vai receber.',
        'error',
      );
      return;
    }

    const cashback = offersCashback ? Number(cashbackPercent.replace(',', '.')) : 0;
    if (offersCashback && (!Number.isFinite(cashback) || cashback < 0 || cashback > 100)) {
      showNotice('Informe um percentual de cashback entre 0 e 100.', 'error');
      return;
    }

    setBusy(true);

    try {
      const values = {
        establishment_id: business.id,
        name: programName.trim() || 'Programa de Fidelidade',
        stamps_required: quantity,
        reward_description: offersStamps ? rewardDescription.trim() : 'Sem recompensa por selos',
        active: programActive,
        cashback_percent: cashback,
        benefit_type: benefitType,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('loyalty_programs')
        .upsert(values, { onConflict: 'establishment_id' })
        .select(
          'id, establishment_id, name, stamps_required, reward_description, active, cashback_percent, benefit_type',
        )
        .single();

      if (error) throw error;

      setProgram(data as LoyaltyProgram);
      showNotice('Programa de fidelidade salvo com sucesso!');
    } catch (error) {
      showNotice(
        error instanceof Error
          ? `Não foi possível salvar: ${error.message}`
          : 'Não foi possível salvar o programa.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  // Encerra a sessão.
  async function signOut() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      showNotice(error.message, 'error');
      return;
    }

    setBusiness(null);
    setProgram(null);
    setProfileRole(null);
    setAdminEstablishments([]);
    setPage('overview');
    showNotice('Você saiu da sua conta.');
  }

  if (loading) {
    return (
      <main className="center">
        <div className="loader" />
        <p>Carregando Fideliza…</p>
      </main>
    );
  }

  // Tela de login.
  if ((!session || mode === 'recovery') && authVisible) {
    return (
      <main className="auth-shell">
        <section className="auth-intro">
          <div style={{ marginBottom: 22 }}><FidelizaLogo light /></div>

          <span className="eyebrow">FIDELIZA · WHITE LABEL</span>

          <h1>
            Clientes que voltam.
            <br />
            <em>Negócios que crescem.</em>
          </h1>

          <p>
            Crie programas de fidelidade com a marca do seu negócio,
            sem precisar desenvolver um aplicativo próprio.
          </p>

          <div className="feature-list">
            <span>
              <QrCode size={18} /> Cartões digitais com QR Code
            </span>
            <span>
              <Palette size={18} /> Sua marca, suas cores
            </span>
            <span>
              <ShieldCheck size={18} /> Acesso protegido por conta
            </span>
          </div>

          <div className="intro-foot">
            Uma plataforma de fidelidade para pequenos negócios.
          </div>
        </section>

        <section className="auth-panel">
          <button
            type="button"
            onClick={() => { setAuthVisible(false); setPublicPortalVisible(true); setNotice(''); }}
            style={{ alignSelf: 'flex-start', marginBottom: 18, background: 'transparent', border: 0, color: '#073568', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
            aria-label="Voltar ao portal público do Fideliza"
          >
            <ArrowLeft size={17} /> <span style={{ fontSize: 20, letterSpacing: '-1px', color: '#062b52' }}>Fideliza<span style={{ color: '#ffca05' }}>.</span></span> <span>Portal público</span>
          </button>
          <div className="auth-card">
            <span className="eyebrow">{mode === 'signup' ? (signupRole === 'cliente' ? 'CADASTRO DE CLIENTE' : 'CADASTRO DE LOJISTA') : (mode === 'reset' || mode === 'recovery') ? 'RECUPERAÇÃO DE SENHA' : 'ACESSO AO FIDELIZA'}</span>

            <h2>
              {mode === 'signup' ? 'Crie sua conta' : mode === 'reset' ? 'Recuperar senha' : mode === 'recovery' ? 'Defina uma nova senha' : 'Boas-vindas de volta'}
            </h2>

            <p className="muted">
              {mode === 'signup' ? (signupRole === 'cliente' ? 'Crie sua conta para acompanhar suas fidelidades e benefícios.' : 'Cadastre-se para configurar seu negócio.') : mode === 'reset' ? 'Informe seu e-mail e enviaremos instruções para redefinir sua senha.' : mode === 'recovery' ? 'Crie uma senha nova com pelo menos 8 caracteres.' : 'Entre para acessar sua conta.'}
            </p>

            <form onSubmit={handleAuth} className="stack">
              {mode === 'signup' && (
                <fieldset style={{ border: '1px solid #d6e3f2', borderRadius: 12, padding: 14, margin: '0 0 4px' }}>
                  <legend style={{ padding: '0 6px', fontWeight: 700 }}>Como você vai usar o Fideliza?</legend>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                    <input type="radio" name="signupRole" value="cliente" checked={signupRole === 'cliente'} onChange={() => setSignupRole('cliente')} style={{ marginTop: 4 }} />
                    <span><strong>Sou cliente</strong><br /><small className="muted">Quero acompanhar meus pontos e benefícios.</small></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="radio" name="signupRole" value="lojista" checked={signupRole === 'lojista'} onChange={() => setSignupRole('lojista')} style={{ marginTop: 4 }} />
                    <span><strong>Sou lojista</strong><br /><small className="muted">Quero cadastrar e administrar meu estabelecimento.</small></span>
                  </label>
                </fieldset>
              )}

              {mode === 'signup' && (
                <label>
                  Seu nome
                  <input
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                    placeholder="Nome e sobrenome"
                    autoComplete="name"
                  />
                </label>
              )}

              {mode === 'signup' && (
                <label>
                  Tipo de documento
                  <select value={signupDocumentType} onChange={event => { const type = event.target.value as 'cpf' | 'cnpj'; setSignupDocumentType(type); setSignupDocumentNumber(''); }} required>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                  <input
                    value={signupDocumentNumber}
                    onChange={event => setSignupDocumentNumber(onlyDigits(event.target.value).slice(0, signupDocumentType === 'cpf' ? 11 : 14))}
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={signupDocumentType === 'cpf' ? 'Digite os 11 números do CPF' : 'Digite os 14 números do CNPJ'}
                    aria-label={signupDocumentType === 'cpf' ? 'CPF obrigatório' : 'CNPJ obrigatório'}
                  />
                  <small className="muted">Documento obrigatório para criar a conta.</small>
                </label>
              )}

              {mode === 'signup' && signupRole === 'lojista' && (
                <label>
                  Plano de assinatura
                  <select value={signupPlanId} onChange={event => setSignupPlanId(event.target.value)} required disabled={signupAvailablePlans.length === 0}>
                    <option value="">{signupAvailablePlans.length ? 'Selecione um plano' : 'Carregando planos disponíveis…'}</option>
                    {signupAvailablePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.period_price ?? plan.monthly_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {plan.billing_cycle === 'semestral' ? '6 meses' : plan.billing_cycle === 'anual' ? 'ano' : 'mês'} ({plan.trial_days} dias grátis)</option>)}
                  </select>
                  <small className="muted">Você poderá solicitar a troca de plano depois. A alteração valerá ao terminar o período atual.</small>
                </label>
              )}

              <label>
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                />
              </label>

              {mode !== 'reset' && <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  minLength={mode === 'signup' || mode === 'recovery' ? 8 : undefined}
                  placeholder={
                    mode === 'signup' || mode === 'recovery'
                      ? 'Mínimo de 8 caracteres'
                      : 'Sua senha'
                  }
                  autoComplete={
                    mode === 'signup' || mode === 'recovery'
                      ? 'new-password'
                      : 'current-password'
                  }
                />
              </label>}

              <button className="primary-btn" disabled={busy}>
                {busy
                  ? 'Aguarde…'
                  : mode === 'signup'
                    ? 'Criar minha conta'
                    : 'Entrar'}
                <ArrowRight size={18} />
              </button>
            </form>

            {mode !== 'reset' && mode !== 'recovery' && <p className="switch-mode">
              {mode === 'signup' ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
              <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setNotice(''); setResetEmailSent(false); }}>
                {mode === 'signup' ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>}
            {mode === 'login' && <button type="button" onClick={() => { setMode('reset'); setNotice(''); setResetEmailSent(false); }} style={{ marginTop: 10, background: 'transparent', border: 0, color: '#073568', cursor: 'pointer', fontWeight: 700 }}>Esqueci minha senha</button>}
            {(mode === 'reset' || mode === 'recovery') && <button type="button" onClick={() => { setMode('login'); setNotice(''); setResetEmailSent(false); }} style={{ marginTop: 10, background: 'transparent', border: 0, color: '#073568', cursor: 'pointer', fontWeight: 700 }}>Voltar para o login</button>}


            <button
              type="button"
              onClick={() => { setAuthVisible(false); setNotice(''); }}
              style={{ marginTop: 12, background: 'transparent', border: 0, color: '#073568', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> Voltar ao portal público
            </button>

            {notice && (
              <div className="notice" role="status">
                {notice}
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="setup-note">
                Configure as variáveis do Supabase no arquivo .env
                para ativar o sistema.
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (!session || publicPortalVisible || mode === 'recovery') {
    const normalizedSearch = publicSearch.trim().toLocaleLowerCase('pt-BR');
    const publicCategories = ['Todas', 'Lanchonete', 'Açaíteria', 'Sorveteria', 'Padaria', 'Nail designer', 'Designer de sobrancelhas', 'Barbearia', 'Salão de beleza', 'Manutenção', 'Outro'];
    const categoryIcons: Record<string, string> = { 'Todas': '✨', 'Lanchonete': '🍔', 'Açaíteria': '🍧', 'Sorveteria': '🍦', 'Padaria': '🥖', 'Nail designer': '💅', 'Designer de sobrancelhas': '✨', 'Barbearia': '💈', 'Salão de beleza': '💇', 'Manutenção': '🛠️', 'Outro': '🏪' };
    const visibleEstablishments = publicEstablishments.filter((item) =>
      (publicCategoryFilter === 'Todas' || (item.business_type || 'Outro').toLocaleLowerCase('pt-BR') === publicCategoryFilter.toLocaleLowerCase('pt-BR')) &&
      [item.name, item.business_type, item.description, item.address].some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalizedSearch)),
    );

    return (
      <main style={{ minHeight: '100vh', background: '#f1f6fc', color: '#082b50' }}>
        <style>{`
:root { --fideliza-navy: #062b52; --fideliza-blue: #0b3c70; --fideliza-yellow: #ffca05; --fideliza-pale: #f1f6fc; }
.primary-btn { background: var(--fideliza-navy) !important; color: #fff !important; border-color: var(--fideliza-navy) !important; }
.primary-btn:hover { background: var(--fideliza-blue) !important; }
.secondary-btn { color: var(--fideliza-navy) !important; border-color: #c9d9ec !important; }
.topbar { border-bottom-color: #d8e5f4 !important; }
.sidebar { background: linear-gradient(180deg, #062b52 0%, #031d3b 100%) !important; color: #fff !important; }
.sidebar .active, .sidebar button.active { background: var(--fideliza-yellow) !important; color: var(--fideliza-navy) !important; }
input:focus, select:focus, textarea:focus { outline-color: var(--fideliza-yellow) !important; border-color: var(--fideliza-blue) !important; }
.public-store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
@media (max-width: 430px) { .public-store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
`}</style>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px clamp(20px, 6vw, 84px)', background: '#fff', borderBottom: '1px solid #d9e5f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => { if (session) setPublicPortalVisible(true); else { setAuthVisible(false); setNotice(''); } window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Ir ao início do portal Fideliza" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 0, padding: 0, color: 'inherit', cursor: 'pointer' }}>
              <FidelizaLogo compact />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {session ? (
              <button type="button" className="primary-btn" onClick={() => setPublicPortalVisible(false)} style={{ background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}>Voltar ao painel <ArrowRight size={17} /></button>
            ) : (
              <>
                <button type="button" className="primary-btn" onClick={() => { setMode('login'); setAuthVisible(true); setPublicPortalVisible(false); }} style={{ background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}>Entrar</button>
                <button type="button" className="primary-btn" onClick={() => { setMode('signup'); setSignupRole('cliente'); setAuthVisible(true); setPublicPortalVisible(false); }} style={{ background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}>Criar conta de cliente</button>
                <button type="button" className="primary-btn" onClick={() => { setMode('signup'); setSignupRole('lojista'); setAuthVisible(true); setPublicPortalVisible(false); }}>Cadastrar estabelecimento <ArrowRight size={17} /></button>
              </>
            )}
          </div>
        </header>

        <section style={{ padding: 'clamp(36px, 7vw, 84px) clamp(20px, 6vw, 84px) 46px', background: 'linear-gradient(135deg, #eaf2fb, #ffffff)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <span className="eyebrow">FIDELIDADE QUE APROXIMA</span>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-2px', margin: '16px 0' }}>Valorize cada compra.<br /><em style={{ color: '#ffbf00' }}>Volte para quem valoriza você.</em></h1>
            <p style={{ maxWidth: 650, margin: '0 auto', color: '#536b87', fontSize: 18, lineHeight: 1.7 }}>Descubra estabelecimentos participantes e conheça programas de fidelidade para aproveitar vantagens nos negócios da sua região.</p>
            <button type="button" className="primary-btn" onClick={() => document.getElementById('estabelecimentos-fideliza')?.scrollIntoView({ behavior: 'smooth' })} style={{ marginTop: 24 }}>Explorar estabelecimentos <ArrowRight size={17} /></button>
          </div>
        </section>

        <section id="estabelecimentos-fideliza" style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
            <div>
              <span className="eyebrow">NOSSO DIRETÓRIO</span>
              <h2 style={{ fontSize: 30, margin: '8px 0' }}>Estabelecimentos participantes</h2>
              <p className="muted" style={{ margin: 0 }}>Conheça as lojas aprovadas que já fazem parte do Fideliza.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid #d6e3f2', borderRadius: 12, padding: '0 13px', background: '#fff', minWidth: 260 }}>
              <Search size={18} color="#708076" />
              <input aria-label="Buscar estabelecimento" value={publicSearch} onChange={(event) => setPublicSearch(event.target.value)} placeholder="Buscar por nome ou categoria" style={{ border: 0, outline: 0, padding: '13px 0', width: '100%', background: 'transparent' }} />
            </label>
          </div>

          {!selectedPublicEstablishment && <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0 20px', marginBottom: 8 }} aria-label="Filtrar por tipo de estabelecimento">
            {publicCategories.map(cat => <button key={cat} type="button" onClick={() => setPublicCategoryFilter(cat)} aria-pressed={publicCategoryFilter === cat} style={{ flex: '0 0 auto', minWidth: 88, display: 'grid', justifyItems: 'center', gap: 7, border: publicCategoryFilter === cat ? '2px solid #ffbf00' : '1px solid #d6e3f2', background: publicCategoryFilter === cat ? '#fff5c2' : '#fff', color: '#092f57', borderRadius: 14, padding: '10px 12px', cursor: 'pointer', fontWeight: publicCategoryFilter === cat ? 700 : 500 }}><span style={{ fontSize: 25, lineHeight: 1.1 }}>{categoryIcons[cat] || '🏪'}</span><span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{cat}</span></button>)}
          </div>}

          {selectedPublicEstablishment ? (
            <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', border: '1px solid #d6e3f2', borderRadius: 22, overflow: 'hidden' }}>
              <button type="button" onClick={() => setSelectedPublicEstablishment(null)} style={{ margin: 20, border: 0, background: 'transparent', color: '#073568', display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}><ArrowLeft size={17} /> Voltar às lojas</button>
              <div style={{ padding: '8px 24px 28px', textAlign: 'center' }}>
                {selectedPublicEstablishment.logo_url && <img src={selectedPublicEstablishment.logo_url} alt={`Logo de ${selectedPublicEstablishment.name}`} style={{ width: 130, height: 130, objectFit: 'contain', borderRadius: 20, margin: '0 auto 18px' }} />}
                <span className="eyebrow">{selectedPublicEstablishment.business_type || 'Estabelecimento participante'}</span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '10px 0' }}>{selectedPublicEstablishment.name}</h2>
                {selectedPublicEstablishment.description && <p style={{ color: '#536b87', lineHeight: 1.7, maxWidth: 650, margin: '0 auto 24px' }}>{selectedPublicEstablishment.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                  {selectedPublicEstablishment.whatsapp_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.whatsapp_url) ? selectedPublicEstablishment.whatsapp_url : `https://${selectedPublicEstablishment.whatsapp_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none' }}><Phone size={17} /> WhatsApp</a>}
                  {selectedPublicEstablishment.location_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.location_url) ? selectedPublicEstablishment.location_url : `https://${selectedPublicEstablishment.location_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none', background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}><MapPin size={17} /> Como chegar</a>}
                  {selectedPublicEstablishment.public_link_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.public_link_url) ? selectedPublicEstablishment.public_link_url : `https://${selectedPublicEstablishment.public_link_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none', background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}><ExternalLink size={17} /> Ver cardápio / catálogo</a>}
                </div>
                {selectedPublicEstablishment.address && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#536b87' }}><MapPin size={17} />{selectedPublicEstablishment.address}</p>}
                {selectedPublicEstablishment.phone && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#536b87' }}><Phone size={17} />{selectedPublicEstablishment.phone}</p>}
                {selectedPublicEstablishment.opening_hours && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#536b87', whiteSpace: 'pre-line' }}><Clock size={17} />{typeof selectedPublicEstablishment.opening_hours === 'string' ? selectedPublicEstablishment.opening_hours : (selectedPublicEstablishment.opening_hours as { text?: string } | null)?.text}</p>}
                {selectedPublicEstablishment.website && <p><a href={/^https?:\/\//i.test(selectedPublicEstablishment.website) ? selectedPublicEstablishment.website : `https://${selectedPublicEstablishment.website}`} target="_blank" rel="noreferrer" style={{ color: '#073568' }}><Globe size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Site oficial</a></p>}
              </div>
              {(selectedPublicEstablishment.gallery_urls ?? []).filter(Boolean).length > 0 && <div style={{ padding: '0 24px 28px' }}><h3 style={{ marginBottom: 14 }}>Conheça nosso espaço</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>{(selectedPublicEstablishment.gallery_urls ?? []).filter(Boolean).slice(0, 5).map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Foto ${index + 1} de ${selectedPublicEstablishment.name}`} style={{ width: '100%', height: 210, objectFit: 'cover', borderRadius: 14 }} />)}</div></div>}
            </div>
          ) : loadingPublic ? (
            <div className="setup-card"><div className="loader" /><p>Carregando estabelecimentos…</p></div>
          ) : visibleEstablishments.length === 0 ? (
            <div className="setup-card" style={{ maxWidth: 'none' }}>
              <div className="setup-icon"><Store size={25} /></div>
              <h3>{publicEstablishments.length === 0 ? 'Em breve, novas lojas por aqui!' : 'Nenhum resultado encontrado'}</h3>
              <p className="muted">{publicEstablishments.length === 0 ? 'Ainda não há estabelecimentos aprovados e publicados. Volte em breve para conhecer as novidades.' : 'Tente buscar por outro nome, categoria ou endereço.'}</p>
            </div>
          ) : (
            <div className="public-store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {visibleEstablishments.map((item) => (
                <article key={item.id} style={{ background: '#fff', border: '1px solid #d6e3f2', borderRadius: 15, overflow: 'hidden', boxShadow: '0 6px 22px rgba(35, 60, 42, 0.04)', minWidth: 0 }}>
                  <button type="button" onClick={() => { setSelectedPublicEstablishment(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label={`Abrir cartão digital de ${item.name}`} style={{ width: '100%', height: 86, background: 'linear-gradient(135deg, #e5f2e7, #f4f8f3)', display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer' }}>
                    {item.logo_url ? <img src={item.logo_url} alt={`Logo de ${item.name}`} style={{ maxWidth: '75%', maxHeight: 86, objectFit: 'contain' }} /> : <div style={{ width: 58, height: 58, borderRadius: 18, background: '#fff', display: 'grid', placeItems: 'center', color: '#ffbf00' }}><Store size={28} /></div>}
                  </button>
                  <div style={{ padding: 13 }}>
                    <span style={{ color: '#ffbf00', fontSize: 12, fontWeight: 700 }}>{item.business_type || 'Estabelecimento participante'}</span>
                    <h3 style={{ margin: '6px 0', fontSize: 16, lineHeight: 1.25 }}>{item.name}</h3>
                    <p style={{ color: '#536b87', lineHeight: 1.55, minHeight: 38, margin: '0 0 10px', fontSize: 12 }}>{item.description || 'Faça uma visita e conheça as vantagens deste estabelecimento no Fideliza.'}</p>
                    {item.address && <p style={{ display: 'flex', alignItems: 'start', gap: 7, color: '#536b87', fontSize: 11, margin: '6px 0' }}><MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />{item.address}</p>}
                    {item.phone && <p style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#536b87', fontSize: 11, margin: '6px 0' }}><Phone size={15} />{item.phone}</p>}
                    {item.website && <a href={/^https?:\/\//i.test(item.website) ? item.website : `https://${item.website}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#073568', fontSize: 13, marginTop: 8 }}><Globe size={15} />Visitar site</a>}
                    <button type="button" onClick={() => { setSelectedPublicEstablishment(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="primary-btn" style={{ width: '100%', marginTop: 10, padding: '9px 10px', fontSize: 12 }}>Ver cartão digital <ArrowRight size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer style={{ background: '#082b50', color: '#eaf1eb', padding: '28px 20px', textAlign: 'center' }}>
          <strong style={{ fontSize: 20 }}>fideliza<span style={{ color: '#91c69e' }}>.</span></strong>
          <p style={{ margin: '8px 0 0', color: '#c5d2c7', fontSize: 13 }}>Conectando pessoas e negócios por meio da fidelidade.</p>
        </footer>
      </main>
    );
  }

  const navButtonStyle = {
    width: '100%',
    border: 0,
    background: 'transparent',
    textAlign: 'left' as const,
  };

  return (
    <main className="app-shell">
      <style>{`
        :root { --fideliza-navy: #062b52; --fideliza-blue: #0b3c70; --fideliza-yellow: #ffca05; --fideliza-pale: #f1f6fc; }
        .app-shell { background: var(--fideliza-pale) !important; color: var(--fideliza-navy) !important; }
        .sidebar { background: linear-gradient(180deg, #062b52 0%, #031d3b 100%) !important; color: #fff !important; border-color: #0b3c70 !important; }
        .side-brand strong, .side-brand strong span { color: #fff !important; }
        .brand-mark { background: var(--fideliza-yellow) !important; color: var(--fideliza-navy) !important; }
        .nav-item.active, .nav-item[aria-current="page"] { background: var(--fideliza-yellow) !important; color: var(--fideliza-navy) !important; }
        .primary-btn { background: var(--fideliza-navy) !important; color: #fff !important; border-color: var(--fideliza-navy) !important; }
        .primary-btn:hover { background: var(--fideliza-blue) !important; }
        .secondary-btn { color: var(--fideliza-navy) !important; border-color: #c9d9ec !important; background: #fff !important; }
        .app-shell input:focus, .app-shell select:focus, .app-shell textarea:focus { outline-color: var(--fideliza-yellow) !important; border-color: var(--fideliza-blue) !important; }
        .app-shell a { color: var(--fideliza-blue); }
        .app-shell [role="status"] { border-color: #c9d9ec !important; background: #f1f6fc !important; color: var(--fideliza-navy) !important; }
        .app-shell progress { accent-color: var(--fideliza-yellow) !important; }
      `}</style>
      <aside className="sidebar">
        <div className="side-brand" style={{ padding: '10px 12px' }}>
          <FidelizaLogo compact light />
        </div>

        <div className="workspace-label">
          ESPAÇO DE TRABALHO
        </div>

        <button
          type="button"
          className={`nav-item ${
            page === 'overview' ? 'active' : ''
          }`}
          style={navButtonStyle}
          onClick={() => {
            setPage(isAdmin ? 'admin' : 'overview');
            setNotice('');
          }}
        >
          <LayoutDashboard size={18} /> {isAdmin ? 'Painel inicial' : profileRole === 'cliente' ? 'Minha conta' : 'Visão geral'}
        </button>

        {profileRole === 'lojista' && business && (
          <button
            type="button"
            className={`nav-item ${page === 'profile' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('profile'); setNotice(''); }}
          >
            <Store size={18} /> Cartão de visita digital
          </button>
        )}

        {profileRole === 'lojista' && (
          <button
            type="button"
            className={`nav-item ${page === 'program' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('program'); setNotice(''); }}
          >
            <WalletCards size={18} /> Programa de fidelidade
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            className={`nav-item ${
              page === 'admin' ? 'active' : ''
            }`}
            style={navButtonStyle}
            onClick={() => {
              setPage('admin');
              setNotice('');
            }}
          >
            <ShieldCheck size={18} /> Administração
          </button>
        )}

        {(isAdmin || profileRole === 'lojista') && (
          <button type="button" className={`nav-item ${page === 'billing' ? 'active' : ''}`} style={navButtonStyle} onClick={() => { setPage('billing'); setNotice(''); }}>
            <WalletCards size={18} /> {isAdmin ? 'Assinaturas e cobranças' : 'Minha assinatura'}
          </button>
        )}

        {profileRole === 'lojista' && (
          <button
            type="button"
            className={`nav-item ${page === 'customers' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('customers'); setMerchantCustomerSearch(''); setNotice(''); }}
          >
            <Users size={18} /> Gestão de clientes
          </button>
        )}

        {profileRole === 'lojista' && (
          <button
            type="button"
            className={`nav-item ${page === 'register' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('register'); setQrTokenInput(''); setPurchaseAmount(''); setPurchaseResult(null); setNotice(''); }}
          >
            <QrCode size={18} /> Registrar compra
          </button>
        )}

        <div className="nav-bottom">
          <div className="avatar">
            {(session.user.email?.[0] || 'U').toUpperCase()}
          </div>

          <div className="account-text">
            <strong>
              {session.user.user_metadata?.full_name ||
                'Minha conta'}
            </strong>
            <small>{session.user.email}</small>
          </div>

          <button
            className="icon-btn"
            onClick={signOut}
            title="Sair da conta"
            type="button"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              {page === 'billing' ? (isAdmin ? 'GESTÃO FINANCEIRA' : 'PLANO E PAGAMENTOS') : isAdmin && page === 'admin'
                ? 'PAINEL ADMINISTRATIVO'
                : profileRole === 'cliente'
                  ? 'ÁREA DO CLIENTE'
                  : page === 'customers'
                    ? 'RELACIONAMENTO COM CLIENTES'
                    : page === 'register'
                    ? 'REGISTRO DE COMPRAS'
                    : 'PAINEL DO ESTABELECIMENTO'}
            </span>

            <h1>
              {page === 'billing' ? (isAdmin ? 'Assinaturas e cobranças' : 'Minha assinatura') : page === 'admin'
                ? 'Administração de lojas'
                : profileRole === 'cliente'
                  ? 'Minha conta Fideliza'
                  : page === 'customers'
                    ? 'Gestão de clientes'
                    : page === 'register'
                    ? 'Registrar compra'
                    : page === 'overview'
                  ? 'Visão geral'
                  : page === 'profile'
                    ? 'Cartão de visita digital'
                    : 'Programa de fidelidade'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="secondary-btn" onClick={() => setPublicPortalVisible(true)} style={{ border: '1px solid #d6e3f2', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#092f57', cursor: 'pointer', fontWeight: 600 }}>Portal público</button>
            <div className="secure-label">
              <ShieldCheck size={16} /> Sessão autenticada
            </div>
          </div>
        </header>

        {notice && (
          <div
            className="notice"
            role="status"
            style={
              noticeType === 'error'
                ? {
                    background: '#fff0ef',
                    borderColor: '#f2c7c3',
                    color: '#9b3029',
                  }
                : {}
            }
          >
            {noticeType === 'success' && (
              <CheckCircle2
                size={16}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 7,
                }}
              />
            )}
            {notice}
          </div>
        )}

        {page === 'billing' ? (
          <section className="setup-card" style={{ maxWidth: 1100, width: '100%', alignSelf: 'stretch' }}>
            <div className="setup-icon"><WalletCards size={25} /></div>
            <h2>{isAdmin ? 'Planos, assinaturas e pagamentos' : 'Resumo da sua assinatura'}</h2>
            <p className="muted">Plano inicial de R$ 19,90/mês e teste de 30 dias. Atrasos geram avisos, nunca bloqueio automático.</p>
            {billingLoading ? <p>Carregando dados de cobrança…</p> : <>
              {isAdmin && <>
                <section style={{ margin: '18px 0 22px', padding: 18, border: '1px solid #dbe7de', borderRadius: 14, background: '#f8fbf8' }}>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 5px' }}>{billingEditingPlanId ? 'Editar plano de assinatura' : 'Cadastrar novo plano'}</h3>
                    <p className="muted" style={{ margin: 0 }}>Defina o nome, a duração e o preço total cobrado por período. O teste gratuito permanece em 30 dias.</p>
                  </div>
                  <form onSubmit={saveBillingPlan} className="form-grid" style={{ margin: 0, padding: 0, border: 0, borderRadius: 0 }}>
                    <label>Nome do plano<input required value={billingPlanName} onChange={e => setBillingPlanName(e.target.value)} placeholder="Ex.: Fideliza Essencial" /></label>
                    <label>Periodicidade<select value={billingPlanCycle} onChange={e => { const cycle = e.target.value as 'mensal' | 'semestral' | 'anual'; setBillingPlanCycle(cycle); setBillingPlanName(cycle === 'mensal' ? 'Fideliza Mensal' : cycle === 'semestral' ? 'Fideliza Semestral' : 'Fideliza Anual'); setBillingPlanPrice(cycle === 'mensal' ? '19.90' : cycle === 'semestral' ? '119.40' : '238.80'); }}><option value="mensal">1 mês — Mensal</option><option value="semestral">6 meses — Semestral</option><option value="anual">12 meses — Anual</option></select></label>
                    <label>Preço total do período (R$)<input required type="number" min="0.01" step="0.01" value={billingPlanPrice} onChange={e => setBillingPlanPrice(e.target.value)} /></label>
                    <label>Descrição do plano<input value={billingPlanDescription} onChange={e => setBillingPlanDescription(e.target.value)} placeholder="Benefícios ou detalhes do plano" /></label>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                      <div className="muted" style={{ fontSize: 13 }}>Equivalente mensal: {(() => { const months = billingPlanCycle === 'semestral' ? 6 : billingPlanCycle === 'anual' ? 12 : 1; const amount = Number(billingPlanPrice.replace(',', '.')); return Number.isFinite(amount) && amount > 0 ? (amount / months).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'; })()}. Teste gratuito: 30 dias.</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="primary-btn" type="submit">{billingEditingPlanId ? 'Salvar alterações' : 'Cadastrar plano'}</button>{billingEditingPlanId && <button type="button" className="secondary-btn" onClick={() => { setBillingEditingPlanId(null); setBillingPlanName('Fideliza Mensal'); setBillingPlanCycle('mensal'); setBillingPlanPrice('19.90'); setBillingPlanDescription('Plano inicial para pequenos estabelecimentos.'); }}>Cancelar edição</button>}</div>
                    </div>
                  </form>
                </section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h3 style={{ marginBottom: 4 }}>Planos cadastrados</h3><p className="muted" style={{ marginTop: 0 }}>Edite, ative, desative ou exclua planos sem vínculos. Planos com histórico devem ser desativados para preservar os dados.</p></div><span className="muted">{billingPlans.length} plano(s)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12, marginBottom: 24 }}>
                  {billingPlans.map(plan => <div key={plan.id} style={{ border: '1px solid #e1e8e3', borderRadius: 12, padding: 16, opacity: plan.is_active ? 1 : 0.78, background: plan.is_active ? '#fff' : '#f7f8f7', boxShadow: '0 2px 8px rgba(20,50,30,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><strong>{plan.name}</strong><span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 20, background: plan.is_active ? '#e8f5eb' : '#edf0ed', color: plan.is_active ? '#28613a' : '#5b665e' }}>{plan.is_active ? 'Ativo' : 'Inativo'}</span></div>
                    <div className="muted" style={{ margin: '7px 0 10px', minHeight: 20 }}>{plan.description || 'Sem descrição.'}</div>
                    <div style={{ fontSize: 22, fontWeight: 750 }}>{Number(plan.period_price ?? plan.monthly_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}<small style={{ fontSize: 13, fontWeight: 500 }}> / {plan.billing_cycle === 'semestral' ? '6 meses' : plan.billing_cycle === 'anual' ? '12 meses' : '1 mês'}</small></div>
                    <div className="muted" style={{ marginTop: 5, fontSize: 13 }}>Equivale a {Number(plan.monthly_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/mês · {plan.trial_days} dias grátis</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}><button type="button" className="secondary-btn" onClick={() => startEditingBillingPlan(plan)}>Editar</button><button type="button" className="secondary-btn" onClick={() => void toggleBillingPlan(plan)}>{plan.is_active ? 'Desativar' : 'Ativar'}</button><button type="button" className="secondary-btn" style={{ color: '#a32929', borderColor: '#e4bcbc' }} onClick={() => void deleteBillingPlan(plan)}>Excluir</button></div>
                  </div>)}
                  {billingPlans.length === 0 && <p className="muted">Nenhum plano cadastrado. Use o formulário acima para criar o primeiro.</p>}
                </div>
                <h3>Solicitações de alteração de plano</h3>
                {billingPlanChangeRequests.length === 0 ? <p className="muted">Nenhuma solicitação de alteração de plano recebida.</p> : <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>{billingPlanChangeRequests.map(request => <article key={request.id} style={{ border: '1px solid #e1e8e3', borderRadius: 12, padding: 14, background: request.status === 'pending' ? '#fff7d6' : '#fff' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}><div><strong>{request.establishments?.name ?? 'Estabelecimento'}</strong><div className="muted">Plano solicitado: {request.fideliza_billing_plans?.name ?? 'Plano não identificado'}</div><small>Solicitado em: {request.created_at ? new Date(request.created_at).toLocaleString('pt-BR') : '—'}</small></div><strong>{request.status === 'pending' ? 'Aguardando análise' : request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}</strong></div>{request.status === 'pending' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}><button type="button" className="primary-btn" disabled={busy} onClick={() => void decideBillingPlanChange(request.id, 'approved')}>Aprovar solicitação</button><button type="button" className="secondary-btn" disabled={busy} onClick={() => void decideBillingPlanChange(request.id, 'rejected')}>Rejeitar</button></div>}</article>)}</div>}
                <h3>Assinaturas por estabelecimento</h3>
                {billingSubscriptions.filter(sub => getBillingAlert(sub)).length > 0 && <div role="status" style={{ border: '1px solid #edcf8a', background: '#fff8e8', color: '#76520d', borderRadius: 12, padding: 14, marginBottom: 12 }}><strong>{billingSubscriptions.filter(sub => getBillingAlert(sub)).length} assinatura(s) precisam de atenção.</strong><p style={{ margin: '5px 0 0' }}>Há pagamentos pendentes/atrasados ou períodos de teste encerrados. O Fideliza apenas exibe avisos e não bloqueia o acesso automaticamente.</p></div>}
                <div style={{ display: 'grid', gap: 10 }}>{billingSubscriptions.map(sub => <div key={sub.id} style={{ border: '1px solid #e1e8e3', borderRadius: 12, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><strong>{sub.establishments?.name ?? 'Estabelecimento'}</strong><div className="muted">{sub.fideliza_billing_plans?.name ?? 'Plano'} · {Number(sub.period_price ?? sub.monthly_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} / {sub.billing_cycle === 'semestral' ? '6 meses' : sub.billing_cycle === 'anual' ? 'ano' : 'mês'}</div><small>Teste até: {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('pt-BR') : '—'} · Vencimento: {sub.due_date ? new Date(`${sub.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'não definido'}</small></div><div style={{ display: 'grid', gap: 8, minWidth: 190 }}><label>Plano<select aria-label="Plano da assinatura" value={sub.plan_id ?? ''} onChange={e => { const selectedPlan = billingPlans.find(plan => plan.id === e.target.value); if (selectedPlan) updateBillingSubscription(sub.id, { plan_id: selectedPlan.id, monthly_price: selectedPlan.monthly_price, billing_cycle: selectedPlan.billing_cycle, period_months: selectedPlan.period_months, period_price: selectedPlan.period_price }); }}><option value="">Selecione um plano</option>{billingPlans.filter(plan => plan.is_active).map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><label>Status<select aria-label="Status da assinatura" value={sub.status} onChange={e => updateBillingSubscription(sub.id,{status:e.target.value})}><option value="trial">Em teste</option><option value="active">Ativa</option><option value="pending">Pendente</option><option value="overdue">Atrasada</option><option value="cancelled">Cancelada</option></select></label></div></div>{getBillingAlert(sub) && <div style={{ marginTop: 10, border: '1px solid #edcf8a', background: '#fff8e8', color: '#76520d', borderRadius: 9, padding: 10 }}><strong>{getBillingAlert(sub)?.label}</strong><div style={{ fontSize: 13 }}>{getBillingAlert(sub)?.detail} Nenhum bloqueio automático será aplicado.</div></div>}<div style={{ marginTop: 10 }}><label>Próximo vencimento<input type="date" value={sub.due_date ?? ''} onChange={e => setBillingSubscriptions(curr => curr.map(x => x.id === sub.id ? {...x, due_date:e.target.value} : x))} /></label><button type="button" className="secondary-btn" onClick={() => updateBillingSubscription(sub.id,{due_date:sub.due_date || null})}>Salvar vencimento</button></div></div>)}</div>
                <form onSubmit={saveBillingPayment} style={{ marginTop: 24, padding: 16, border: '1px solid #e1e8e3', borderRadius: 12 }}>
                  <h3>Registrar pagamento via Pix</h3>
                  <label>Estabelecimento / assinatura<select required value={billingSelectedSubscription} onChange={e => { setBillingSelectedSubscription(e.target.value); const sub = billingSubscriptions.find(x => x.id === e.target.value); if (sub) { const scheduledPlan = sub.pending_plan_id ? billingPlans.find(plan => plan.id === sub.pending_plan_id) : null; setBillingPaymentAmount(String(scheduledPlan?.period_price ?? sub.period_price ?? sub.monthly_price)); } }}><option value="">Selecione…</option>{billingSubscriptions.map(sub => <option key={sub.id} value={sub.id}>{sub.establishments?.name ?? sub.establishment_id}</option>)}</select></label>
                  <label>Valor recebido (R$)<input required type="number" min="0.01" step="0.01" value={billingPaymentAmount} onChange={e => setBillingPaymentAmount(e.target.value)} /></label>
                  <label>Referência / comprovante<input value={billingPaymentReference} onChange={e => setBillingPaymentReference(e.target.value)} placeholder="Identificação do Pix (opcional)" /></label>
                  <button className="primary-btn" type="submit">Registrar pagamento</button>
                </form>
                <h3 style={{ marginTop: 24 }}>Resumo financeiro</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
                  <div className="stat-card"><span>Recebido</span><strong>{billingPayments.reduce((a,p)=>a+Number(p.amount||0),0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
                  <div className="stat-card"><span>Assinaturas com alerta</span><strong>{billingSubscriptions.filter(s=>getBillingAlert(s)).length}</strong></div>
                  <div className="stat-card"><span>Em teste</span><strong>{billingSubscriptions.filter(s=>s.status==='trial').length}</strong></div>
                </div>
                <h3 style={{ marginTop: 24 }}>Pagamentos recentes</h3>
                {billingPayments.length === 0 ? <p className="muted">Nenhum pagamento registrado ainda.</p> : billingPayments.map(pay => <div key={pay.id} style={{ padding: 10, borderBottom: '1px solid #e1e8e3' }}>{pay.establishments?.name ?? 'Estabelecimento'} — {Number(pay.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} — {new Date(pay.paid_at).toLocaleDateString('pt-BR')} {pay.reference && `· ${pay.reference}`}</div>)}
              </>}
              {!isAdmin && billingSubscriptions.map(sub => <div key={sub.id} style={{ border: '1px solid #e1e8e3', borderRadius: 12, padding: 18, marginTop: 16 }}><h3>{sub.fideliza_billing_plans?.name ?? 'Fideliza Mensal'}</h3><strong style={{ fontSize: 28 }}>{Number(sub.period_price ?? sub.monthly_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}<small>/{sub.billing_cycle === 'semestral' ? '6 meses' : sub.billing_cycle === 'anual' ? 'ano' : 'mês'}</small></strong><p>Status: <strong>{({trial:'Teste gratuito',active:'Ativa',pending:'Pagamento pendente',overdue:'Pagamento em atraso',cancelled:'Cancelada'} as Record<string,string>)[sub.status] ?? sub.status}</strong></p><p>Fim do teste: {new Date(sub.trial_ends_at).toLocaleDateString('pt-BR')}</p><p>Próximo vencimento: {sub.due_date ? new Date(`${sub.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'A definir pelo administrador'}</p><p className="muted">Se houver atraso, você receberá um aviso. O acesso ao Fideliza não será bloqueado automaticamente.</p><div style={{ marginTop: 18, padding: 14, background: '#f0f6fd', borderRadius: 10 }}><h4 style={{ marginTop: 0 }}>Alterar plano de assinatura</h4><p className="muted">Escolha outro plano. A mudança será agendada para depois do término do período atual, sem alterar a assinatura vigente.</p><label>Novo plano<select value={merchantPlanSelection || sub.plan_id || ''} onChange={e => setMerchantPlanSelection(e.target.value)}><option value="">Selecione um plano</option>{billingPlans.filter(plan => plan.is_active).map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.period_price ?? plan.monthly_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} / {plan.billing_cycle === 'semestral' ? '6 meses' : plan.billing_cycle === 'anual' ? 'ano' : 'mês'}</option>)}</select></label><button type="button" className="primary-btn" onClick={() => void requestMerchantPlanChange(sub)} disabled={!merchantPlanSelection || merchantPlanSelection === sub.plan_id || merchantPlanSelection === sub.pending_plan_id}>Solicitar alteração de plano</button>{sub.pending_plan_id && <p style={{ marginBottom: 0 }}><strong>Alteração agendada:</strong> {billingPlans.find(plan => plan.id === sub.pending_plan_id)?.name ?? 'Novo plano'} · vigência prevista para {sub.pending_plan_effective_at ? new Date(sub.pending_plan_effective_at).toLocaleDateString('pt-BR') : (sub.due_date ? new Date(`${sub.due_date}T12:00:00`).toLocaleDateString('pt-BR') : new Date(sub.trial_ends_at).toLocaleDateString('pt-BR'))}.<br/><small className="muted">O plano atual permanece válido até essa data.</small></p>}</div><h4>Pagamentos registrados</h4>{billingPayments.length ? billingPayments.map(pay=><div key={pay.id} style={{padding:8,borderBottom:'1px solid #e1e8e3'}}>{Number(pay.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · {new Date(pay.paid_at).toLocaleDateString('pt-BR')} · Pix</div>) : <p className="muted">Nenhum pagamento registrado.</p>}</div>)}
              {!isAdmin && business && <div style={{ marginTop: 18, padding: 16, border: '1px solid #d6e3f2', borderRadius: 12 }}>
                <h3 style={{ marginTop: 0 }}>{billingSubscriptions.length > 0 ? 'Solicitar alteração de plano' : 'Escolha ou altere seu plano'}</h3>
                <p className="muted">{billingSubscriptions.length > 0 ? 'Escolha outro plano e envie a solicitação ao administrador. Sua assinatura atual permanece vigente até a análise e a data de vigência definida.' : 'Se sua assinatura já existir no sistema, o Fideliza enviará uma solicitação de alteração. Caso ainda não exista, você poderá selecionar o plano inicial.'}</p>
                {billingPlans.filter(plan => plan.is_active).length === 0 ? <p className="muted">Não há planos ativos disponíveis no momento. Entre em contato com o administrador.</p> :
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                    {billingPlans.filter(plan => plan.is_active).map(plan => <article key={plan.id} style={{ border: '1px solid #e1e8e3', borderRadius: 10, padding: 14 }}>
                      <h4 style={{ margin: '0 0 8px' }}>{plan.name}</h4>
                      <p className="muted" style={{ minHeight: 36 }}>{plan.description || 'Plano Fideliza para seu estabelecimento.'}</p>
                      <strong style={{ fontSize: 22 }}>{Number(plan.period_price ?? plan.monthly_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      <div className="muted">por {plan.billing_cycle === 'semestral' ? '6 meses' : plan.billing_cycle === 'anual' ? 'ano' : 'mês'}</div>
                      <div className="muted" style={{ marginTop: 6 }}>{plan.trial_days ?? 30} dias de teste gratuito</div>
                      {billingSubscriptions.length > 0 ?
                        <button type="button" className="primary-btn" style={{ marginTop: 12, width: '100%' }} disabled={busy || plan.id === billingSubscriptions[0]?.plan_id || plan.id === billingSubscriptions[0]?.pending_plan_id} onClick={() => void requestMerchantPlanChangeByEstablishment(plan.id)}>Solicitar alteração de plano</button> :
                        <>
                          <button type="button" className="primary-btn" style={{ marginTop: 12, width: '100%' }} disabled={busy} onClick={() => void chooseInitialMerchantPlan(plan.id)}>Escolher este plano</button>
                          <button type="button" className="secondary-btn" style={{ marginTop: 8, width: '100%' }} disabled={busy} onClick={() => void requestMerchantPlanChangeByEstablishment(plan.id)}>Solicitar alteração de plano</button>
                        </>}
                    </article>)}
                  </div>}
              </div>}
              {!isAdmin && !business && <p>Para escolher uma assinatura, primeiro conclua o cadastro do seu estabelecimento.</p>}
            </>}
            <button type="button" className="secondary-btn" onClick={() => void loadBilling()}>Atualizar informações</button>
          </section>
        ) : null}

        {/* Painel administrativo */}
        {isAdmin && page === 'admin' ? (
          <section
            className="setup-card"
            style={{
              maxWidth: 1000,
              width: '100%',
              alignSelf: 'stretch',
            }}
          >
            <div className="setup-icon">
              <Store size={25} />
            </div>

            <h2>Estabelecimentos cadastrados</h2>

            <p className="muted">
              Aprove lojas para publicá-las no portal ou
              suspenda/rejeite o acesso público.
            </p>

            {loadingAdmin ? (
              <p className="muted">
                Carregando estabelecimentos…
              </p>
            ) : adminEstablishments.length === 0 ? (
              <p className="muted">
                Nenhum estabelecimento encontrado.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 18,
                }}
              >
                {adminEstablishments.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      border: '1px solid #d6e3f2',
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <h3 style={{ margin: '0 0 6px' }}>
                          {item.name}
                        </h3>

                        <p
                          className="muted"
                          style={{ margin: '0 0 5px' }}
                        >
                          {item.business_type ||
                            'Categoria não informada'}
                        </p>

                        {item.address && (
                          <p
                            className="muted"
                            style={{ margin: '0 0 5px' }}
                          >
                            Endereço: {item.address}
                          </p>
                        )}

                        {item.phone && (
                          <p
                            className="muted"
                            style={{ margin: '0 0 5px' }}
                          >
                            Telefone: {item.phone}
                          </p>
                        )}

                        <small className="muted">
                          Cadastro:{' '}
                          {new Date(
                            item.created_at,
                          ).toLocaleDateString('pt-BR')}
                        </small>
                      </div>

                      <span
                        style={{
                          borderRadius: 20,
                          padding: '6px 10px',
                          background:
                            item.moderation_status === 'approved'
                              ? '#e8f7ed'
                              : item.moderation_status ===
                                  'suspended' ||
                                item.moderation_status === 'rejected'
                                ? '#fff0ef'
                                : '#fff6df',
                          color:
                            item.moderation_status === 'approved'
                              ? '#216b3a'
                              : item.moderation_status ===
                                  'suspended' ||
                                item.moderation_status === 'rejected'
                                ? '#9b3029'
                                : '#805b00',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {moderationLabel(item.moderation_status)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 14,
                      }}
                    >
                      {item.moderation_status !== 'approved' && (
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={busy}
                          onClick={() =>
                            moderateEstablishment(
                              item,
                              'approved',
                            )
                          }
                        >
                          <CheckCircle2 size={16} />
                          Aprovar e publicar
                        </button>
                      )}

                      {item.moderation_status !== 'rejected' && (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{
                            background: '#fff',
                            color: '#092f57',
                            border: '1px solid #d6e3f2',
                          }}
                          disabled={busy}
                          onClick={() =>
                            moderateEstablishment(
                              item,
                              'rejected',
                            )
                          }
                        >
                          Rejeitar
                        </button>
                      )}
                      <button type="button" className="secondary-btn" disabled={deletingEstablishmentId === item.id} onClick={() => void deleteAdminEstablishment(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #efc5c2', color: '#a52d27', background: '#fff7f6' }}><Trash2 size={15} />{deletingEstablishmentId === item.id ? 'Excluindo…' : 'Excluir loja'}</button>

                      {item.moderation_status === 'approved' && (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{
                            background: '#fff',
                            color: '#092f57',
                            border: '1px solid #d6e3f2',
                          }}
                          disabled={busy}
                          onClick={() =>
                            moderateEstablishment(
                              item,
                              'suspended',
                            )
                          }
                        >
                          Suspender
                        </button>
                      )}

                      {(item.moderation_status === 'rejected' ||
                        item.moderation_status === 'suspended') && (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{
                            background: '#fff',
                            color: '#092f57',
                            border: '1px solid #d6e3f2',
                          }}
                          disabled={busy}
                          onClick={() =>
                            moderateEstablishment(
                              item,
                              'pending',
                            )
                          }
                        >
                          Voltar para pendente
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              className="primary-btn"
              onClick={loadAdminEstablishments}
              disabled={loadingAdmin}
              style={{
                marginTop: 18,
                background: '#fff',
                color: '#092f57',
                border: '1px solid #d6e3f2',
              }}
            >
              Atualizar lista
            </button>
          </section>
        ) : profileRole === 'cliente' ? (
          <section className="setup-card" style={{ maxWidth: 900, width: '100%', alignSelf: 'stretch' }}>
            <div className="setup-icon"><Gift size={25} /></div>
            <span className="eyebrow">BEM-VINDO AO FIDELIZA</span>
            <h2>Olá, {session.user.user_metadata?.full_name || 'cliente'}!</h2>
            <p className="muted">Apresente seu cartão nas lojas participantes para que elas possam registrar suas compras e benefícios.</p>
            <form onSubmit={saveCustomerCpf} className="stack" style={{ maxWidth: 460, alignSelf: 'stretch', background: '#fff', border: '1px solid #d6e3f2', borderRadius: 14, padding: 16, marginTop: 14 }}>
              <h3 style={{ margin: 0 }}>Identificação alternativa por CPF</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Opcional. Se preferir, o lojista poderá localizar sua conta pelo CPF em vez de ler o QR Code.</p>
              <label>Seu CPF<input inputMode="numeric" autoComplete="off" value={customerCpf} onChange={(event) => setCustomerCpf(event.target.value.replace(/[^0-9.\-/]/g, '').slice(0, 14))} placeholder="000.000.000-00" /></label>
              <button className="primary-btn" disabled={savingCpf || (!!customerCpf.replace(/\D/g, '') && customerCpf.replace(/\D/g, '').length !== 11)}>{savingCpf ? 'Salvando…' : 'Salvar CPF'}</button>
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>O CPF é dado pessoal e ficará restrito às funções necessárias do sistema.</p>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, width: '100%', marginTop: 14 }}>
              <div style={{ border: '1px solid #d6e3f2', borderRadius: 16, padding: 22, textAlign: 'center', background: '#fff' }}>
                <QrCode size={26} color="#ffbf00" />
                <h3>Meu cartão Fideliza</h3>
                {loadingCustomerCard ? (
                  <p className="muted">Carregando seu cartão…</p>
                ) : customerCard?.qr_token ? (
                  <>
                    <div style={{ display: 'inline-flex', padding: 14, margin: '8px auto 12px', background: '#fff', border: '1px solid #d9e5f3', borderRadius: 12 }}>
                      <QRCodeSVG value={customerCard.qr_token} size={208} level="H" includeMargin />
                    </div>
                    <p style={{ fontWeight: 700, margin: '4px 0' }}>{customerCard.full_name || session.user.user_metadata?.full_name || 'Cliente Fideliza'}</p>
                    <p className="muted" style={{ fontSize: 13 }}>Cartão digital exclusivo</p>
                    <button type="button" className="secondary-btn" onClick={() => window.print()} style={{ border: '1px solid #d6e3f2', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#092f57', cursor: 'pointer', fontWeight: 600 }}>Imprimir / salvar em PDF</button>
                  </>
                ) : (
                  <p className="muted">Não foi possível carregar o QR Code. Atualize a página ou confira a migração do banco.</p>
                )}
                <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>O QR Code contém apenas um identificador aleatório, não seu nome, telefone ou e-mail.</p>
              </div>
              <div style={{ border: '1px solid #d6e3f2', borderRadius: 16, padding: 18, textAlign: 'left' }}>
                <Gift size={24} color="#ffbf00" />
                <h3>Minhas fidelidades</h3>
                {loadingCustomerLoyalty ? (
                  <p className="muted">Carregando seus saldos…</p>
                ) : customerLoyaltySummary.length === 0 ? (
                  <p className="muted">Você ainda não tem compras registradas. Quando uma loja participante registrar sua primeira compra, o saldo aparecerá aqui, separado por estabelecimento.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                    {customerLoyaltySummary.map((item) => {
                      const progress = item.stamps_required ? Math.min(100, Math.round((item.stamps_balance / item.stamps_required) * 100)) : 0;
                      return (
                        <div key={item.establishment_id} style={{ border: '1px solid #e1e9e2', borderRadius: 12, padding: 14, background: '#fbfdfb' }}>
                          <h4 style={{ margin: '0 0 4px' }}>{item.establishment_name}</h4>
                          {item.program_name && <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>{item.program_name}</p>}
                          {(item.benefit_type === 'pontos' || item.benefit_type === 'ambos') && <p style={{ margin: '6px 0' }}><strong>{item.stamps_balance}</strong>{item.stamps_required ? ` de ${item.stamps_required} selos` : ' selos acumulados'}</p>}
                          {(item.benefit_type === 'cashback' || item.benefit_type === 'ambos') && <p style={{ margin: '8px 0', padding: '10px 12px', borderRadius: 10, background: '#fff5c2', color: '#2f6d43' }}><strong>Cashback disponível: {item.cashback_balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>}
                          {(item.benefit_type === 'pontos' || item.benefit_type === 'ambos') && item.stamps_required && (
                            <div style={{ height: 8, background: '#e5ece6', borderRadius: 999, overflow: 'hidden', margin: '8px 0 10px' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: '#ffbf00', borderRadius: 999 }} />
                            </div>
                          )}
                          {(item.benefit_type === 'pontos' || item.benefit_type === 'ambos') && item.program_active && item.reward_description && <p style={{ margin: '6px 0', fontSize: 13 }}><strong>Recompensa:</strong> {item.reward_description}</p>}
                          {!item.program_active && <p className="muted" style={{ margin: '6px 0', fontSize: 12 }}>Programa de fidelidade não está ativo no momento.</p>}
                          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>Compras: {item.purchases_count} · Total registrado: {item.total_spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          {item.last_purchase_at && <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>Última compra: {new Date(item.last_purchase_at).toLocaleDateString('pt-BR')}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ border: '1px solid #d6e3f2', borderRadius: 16, padding: 18, marginTop: 14, background: '#fff', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ marginTop: 0 }}>Histórico de fidelidade</h3>
              <p className="muted" style={{ marginTop: 0 }}>Confira suas compras e recompensas resgatadas em cada estabelecimento.</p>
              {loadingCustomerLoyalty ? <p className="muted">Carregando histórico…</p> : customerHistory.length === 0 ? <p className="muted">Seu histórico aparecerá aqui depois da primeira compra ou do primeiro resgate.</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {customerHistory.slice(0, visibleCustomerHistoryCount).map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #edf1ed', padding: '10px 0' }}>
                      <div style={{ minWidth: 0 }}>
                        <strong>{item.kind === 'compra' ? 'Compra registrada' : item.kind === 'resgate' ? 'Recompensa resgatada' : (item.amount ?? 0) < 0 ? 'Cashback utilizado' : 'Cashback recebido'}</strong>
                        <p style={{ margin: '3px 0', fontSize: 13 }}>{item.establishment_name}</p>
                        <p className="muted" style={{ margin: '3px 0', fontSize: 13 }}>{item.kind === 'compra' ? `${item.stamps} selo(s) recebido(s)` : item.kind === 'resgate' ? `${item.description} · ${item.stamps} selo(s) utilizados` : item.description}</p>
                        <p className="muted" style={{ margin: '3px 0', fontSize: 12 }}>{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {item.kind === 'cashback' ? <strong style={{ color: (item.amount ?? 0) >= 0 ? '#0b3c70' : '#a05a18' }}>{(item.amount ?? 0) >= 0 ? '+' : '-'}{Math.abs(item.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> : <strong style={{ color: item.kind === 'compra' ? '#0b3c70' : '#a05a18' }}>{item.kind === 'compra' ? `+${item.stamps}` : `-${item.stamps}`} selos</strong>}
                        {item.amount !== null && <p style={{ margin: '4px 0', fontSize: 12 }}>{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                      </div>
                    </div>
                  ))}
                  {customerHistory.length > visibleCustomerHistoryCount && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setVisibleCustomerHistoryCount((count) => count + 5)}
                      style={{ justifySelf: 'center', marginTop: 6 }}
                    >
                      Mostrar mais ({customerHistory.length - visibleCustomerHistoryCount} restantes)
                    </button>
                  )}
                  {visibleCustomerHistoryCount > 5 && customerHistory.length > 5 && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setVisibleCustomerHistoryCount(5)}
                      style={{ justifySelf: 'center' }}
                    >
                      Mostrar menos
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" className="primary-btn" onClick={() => setPublicPortalVisible(true)} style={{ marginTop: 22 }}>Explorar lojas participantes <ArrowRight size={17} /></button>
          </section>
        ) : profileRole === 'lojista' && page === 'customers' ? (
          <section className="setup-card" style={{ maxWidth: 1100, width: '100%', alignSelf: 'stretch' }}>
            <div className="setup-icon"><Users size={25} /></div>
            <h2>Clientes do seu estabelecimento</h2>
            <p className="muted">Veja quem já realizou compras, o valor registrado e os benefícios acumulados nesta loja. Os dados são exclusivos do seu estabelecimento.</p>
            <div className="stats-grid fz-metrics-grid" style={{ margin: '18px 0' }}>
              <article className="stat-card fz-metric-card"><div className="fz-metric-icon"><Users size={19} /></div><span>Clientes atendidos</span><strong>{merchantCustomers.length}</strong><small>Clientes com ao menos uma compra</small></article>
              <article className="stat-card fz-metric-card"><div className="fz-metric-icon"><ShoppingBag size={19} /></div><span>Compras registradas</span><strong>{merchantCustomers.reduce((sum, c) => sum + Number(c.purchases_count || 0), 0)}</strong><small>Total de compras nesta loja</small></article>
              <article className="stat-card fz-metric-card"><div className="fz-metric-icon"><TrendingUp size={19} /></div><span>Valor vendido</span><strong>{merchantCustomers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><small>Soma das compras registradas</small></article>
            </div>
            <label style={{ display: 'block', margin: '18px 0' }}>Buscar cliente
              <input value={merchantCustomerSearch} onChange={(event) => setMerchantCustomerSearch(event.target.value)} placeholder="Digite o nome ou telefone" />
            </label>
            {loadingMerchantCustomers ? <p className="muted">Carregando clientes…</p> : merchantCustomersError ? (
              <div className="notice" role="alert" style={{ background: '#fff0ef', borderColor: '#f2c7c3', color: '#9b3029' }}>{merchantCustomersError}<button type="button" className="secondary-btn" onClick={() => { setMerchantCustomerSearch(current => current); setPage('overview'); setTimeout(() => setPage('customers'), 0); }} style={{ marginLeft: 10 }}>Tentar novamente</button></div>
            ) : filteredMerchantCustomers.length === 0 ? (
              <div style={{ border: '1px dashed #cbd8ce', borderRadius: 14, padding: 24, textAlign: 'center' }}><Users size={28} /><h3>{merchantCustomers.length === 0 ? 'Ainda não há clientes registrados' : 'Nenhum cliente encontrado'}</h3><p className="muted">{merchantCustomers.length === 0 ? 'Quando uma compra for registrada para um cliente, ele aparecerá aqui.' : 'Tente buscar por outro nome ou telefone.'}</p></div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredMerchantCustomers.map((customer) => {
                  const cashbackBalance = Math.max(0, Number(customer.cashback_credited || 0) - Number(customer.cashback_redeemed || 0));
                  return <article key={customer.customer_id} style={{ border: '1px solid #e0e8e2', borderRadius: 14, padding: 16, background: '#fff', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div><h3 style={{ margin: '0 0 5px' }}>{customer.full_name || 'Cliente sem nome'}</h3><p className="muted" style={{ margin: 0 }}>{customer.phone || 'Telefone não informado'}</p></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <strong>{Number(customer.total_spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        <button type="button" className="secondary-btn" onClick={() => void deleteMerchantCustomer(customer)} disabled={deletingCustomerBusy} aria-label={`Excluir histórico de ${customer.full_name || 'cliente'}`} title="Excluir cliente desta loja" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #efc5c2', color: '#a52d27', background: '#fff7f6', opacity: deletingCustomerBusy && deletingCustomerId !== customer.customer_id ? 0.6 : 1 }}>
                          <Trash2 size={16} /> {deletingCustomerId === customer.customer_id ? 'Excluindo…' : 'Excluir desta loja'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13 }}>
                      <span><ShoppingBag size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />{customer.purchases_count} {Number(customer.purchases_count) === 1 ? 'compra' : 'compras'}</span>
                      <span><Gift size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />{customer.stamps_earned} selos concedidos</span>
                      <span><Coins size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Cashback disponível: {cashbackBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <small className="muted">Última compra: {customer.last_purchase_at ? new Date(customer.last_purchase_at).toLocaleString('pt-BR') : '—'}</small>
                  </article>;
                })}
              </div>
            )}
          </section>
        ) : profileRole === 'lojista' && page === 'register' ? (
          <section className="setup-card" style={{ maxWidth: 900, width: '100%', alignSelf: 'stretch' }}>
            <div className="setup-icon"><QrCode size={25} /></div>
            <h2>Registrar compra de cliente</h2>
            <p className="muted">Leia o QR Code do cartão Fideliza pela câmera ou cole/digite o identificador. Depois informe o valor da compra. O sistema valida a operação no Supabase antes de salvar.</p>
            {!business ? (
              <p className="muted">Cadastre seu estabelecimento e aguarde a aprovação para registrar compras.</p>
            ) : (
              <form className="stack" onSubmit={registerPurchase}>
                <div style={{ border: '1px solid #d6e3f2', borderRadius: 14, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginTop: 0 }}>1. Identifique o cliente</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <button type="button" className={identificationMethod === 'qr' ? 'primary-btn' : 'secondary-btn'} onClick={() => { setIdentificationMethod('qr'); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={identificationMethod === 'qr' ? {} : { background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}>Ler QR Code</button>
                    <button type="button" className={identificationMethod === 'cpf' ? 'primary-btn' : 'secondary-btn'} onClick={() => { setIdentificationMethod('cpf'); setQrTokenInput(''); setCpfCustomerPreview(null); }} style={identificationMethod === 'cpf' ? {} : { background: '#fff', color: '#092f57', border: '1px solid #d6e3f2' }}>Digitar CPF</button>
                  </div>
                  {identificationMethod === 'qr' ? (
                    <>
                      <div id="fideliza-qr-reader" style={{ width: '100%', maxWidth: 360, margin: '0 auto 14px' }} />
                      <label>Identificador do QR Code<input value={qrTokenInput} onChange={(event) => setQrTokenInput(event.target.value)} placeholder="Leia ou cole o identificador do cartão" required /></label>
                      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Permita o acesso à câmera ou digite o identificador do cartão.</p>
                    </>
                  ) : (
                    <>
                      <label>CPF do cliente<input inputMode="numeric" autoComplete="off" value={customerCpfInput} onChange={(event) => { setCustomerCpfInput(event.target.value.replace(/[^0-9.\-/]/g, '').slice(0, 14)); setCpfCustomerPreview(null); }} placeholder="000.000.000-00" required /></label>
                      <button type="button" className="secondary-btn" onClick={() => void findCustomerByCpf()} disabled={lookingUpCpf || customerCpfInput.replace(/\D/g, '').length !== 11} style={{ alignSelf: 'flex-start', border: '1px solid #ea580c', background: '#f97316', color: '#fff', fontWeight: 700, boxShadow: '0 3px 8px rgba(249, 115, 22, 0.25)' }}>{lookingUpCpf ? 'Localizando cliente…' : 'Localizar cliente'}</button>
                      {cpfCustomerPreview && cpfCustomerPreview.cpf === customerCpfInput.replace(/\D/g, '') && (
                        <div role="status" style={{ border: '1px solid #c9d9ec', background: '#f1f6fc', borderRadius: 12, padding: 14, color: '#062b52' }}>
                          <p style={{ margin: '0 0 6px', fontWeight: 700 }}><CheckCircle2 size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />Cliente encontrado</p>
                          <p style={{ margin: 0 }}>Nome cadastrado: <strong>{cpfCustomerPreview.name}</strong></p>
                        </div>
                      )}
                      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Digite o CPF e clique em “Localizar cliente”. Confira o nome retornado antes de registrar a compra.</p>
                    </>
                  )}
                </div>
                <div style={{ border: '1px solid #d6e3f2', borderRadius: 14, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginTop: 0 }}>2. Informe a compra</h3>
                  <label>Valor total da compra (R$)<input type="number" min="0.01" max="10000000" step="0.01" value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} placeholder="Ex.: 35,90" required /></label>
                  <p className="muted" style={{ fontSize: 12 }}>Nesta primeira versão, cada compra confirmada concede 1 selo. A regra por valor e o resgate de recompensas serão configurados depois.</p>
                  <button className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, ''))) || !purchaseAmount || Number(purchaseAmount.replace(',', '.')) <= 0}><CheckCircle2 size={18} />{busy ? 'Registrando compra…' : 'Confirmar e registrar compra'}</button>
                </div>
              </form>
            )}
            <div style={{ marginTop: 18, border: '1px solid #d6e3f2', borderRadius: 14, padding: 16, background: '#fff' }}>
              <h3 style={{ marginTop: 0 }}><Gift size={18} style={{ verticalAlign: 'middle', marginRight: 7 }} />Resgatar recompensa</h3>
              <p className="muted" style={{ fontSize: 13 }}>Use o mesmo QR Code ou CPF informado acima. O sistema só confirma o resgate se o cliente tiver selos suficientes e o programa estiver ativo.</p>
              <button type="button" className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, '')))} onClick={() => void redeemReward()}><Gift size={18} />{busy ? 'Processando…' : 'Confirmar resgate da recompensa'}</button>
            </div>
            <div style={{ marginTop: 18, border: '1px solid #d6e3f2', borderRadius: 14, padding: 16, background: '#fff' }}>
              <h3 style={{ marginTop: 0 }}><WalletCards size={18} style={{ verticalAlign: 'middle', marginRight: 7 }} />Resgatar cashback</h3>
              <p className="muted" style={{ fontSize: 13 }}>Informe quanto do saldo de cashback o cliente deseja usar nesta loja. O sistema valida o saldo disponível antes de confirmar.</p>
              <form className="stack" onSubmit={(event) => { event.preventDefault(); void redeemCashback(); }}>
                <label>Valor de cashback a utilizar (R$)<input type="number" min="0.01" max="10000000" step="0.01" value={cashbackRedeemAmount} onChange={(event) => setCashbackRedeemAmount(event.target.value)} placeholder="Ex.: 5,00" required /></label>
                <button type="submit" className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, ''))) || !cashbackRedeemAmount || Number(cashbackRedeemAmount.replace(',', '.')) <= 0}><WalletCards size={18} />{busy ? 'Processando…' : 'Confirmar resgate de cashback'}</button>
              </form>
            </div>
            {cashbackRedemptionResult && (
              <div role="status" style={{ marginTop: 18, padding: 18, border: '1px solid #c9d9ec', background: '#f1f6fc', borderRadius: 14, color: '#062b52' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Cashback resgatado</h3>
                <p><strong>Cliente:</strong> {cashbackRedemptionResult.customer_name}</p>
                <p><strong>Valor utilizado:</strong> {Number(cashbackRedemptionResult.amount_redeemed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Saldo restante nesta loja:</strong> {Number(cashbackRedemptionResult.cashback_balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button type="button" className="secondary-btn" onClick={() => { setCashbackRedemptionResult(null); setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={{ border: '1px solid #c9d9ec', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#062b52', cursor: 'pointer', fontWeight: 600 }}>Atender outro cliente</button>
              </div>
            )}
            {redemptionResult && (
              <div role="status" style={{ marginTop: 18, padding: 18, border: '1px solid #c9d9ec', background: '#f1f6fc', borderRadius: 14, color: '#062b52' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Recompensa resgatada</h3>
                <p><strong>Cliente:</strong> {redemptionResult.customer_name}</p>
                <p><strong>Recompensa:</strong> {redemptionResult.reward_description}</p>
                <p><strong>Selos utilizados:</strong> {redemptionResult.stamps_used}</p>
                <p><strong>Saldo restante nesta loja:</strong> {redemptionResult.stamps_balance} selos</p>
                <button type="button" className="secondary-btn" onClick={() => { setRedemptionResult(null); setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={{ border: '1px solid #c9d9ec', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#062b52', cursor: 'pointer', fontWeight: 600 }}>Atender outro cliente</button>
              </div>
            )}
            {purchaseResult && (
              <div style={{ marginTop: 18, padding: 18, border: '1px solid #c9d9ec', background: '#f1f6fc', borderRadius: 14, color: '#062b52' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Compra registrada</h3>
                <p><strong>Cliente:</strong> {purchaseResult.customer_name}</p>
                <p><strong>Estabelecimento:</strong> {purchaseResult.establishment_name}</p>
                <p><strong>Valor:</strong> {Number(purchaseResult.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Selos concedidos:</strong> {purchaseResult.stamps_earned}</p>
                <p><strong>Total de selos deste cliente nesta loja:</strong> {purchaseResult.stamps_balance}</p>
                <button type="button" className="secondary-btn" onClick={() => { setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); setPurchaseResult(null); setNotice(''); }} style={{ border: '1px solid #c9d9ec', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#062b52', cursor: 'pointer', fontWeight: 600 }}>Registrar outra compra</button>
              </div>
            )}
          </section>
        ) : loadingBusiness ? (
          <section className="setup-card">
            <div className="loader" />
            <p>Carregando estabelecimento…</p>
          </section>
        ) : !business && profileRole === 'lojista' ? (
          <section className="setup-card">
            <div className="setup-icon">
              <Store size={25} />
            </div>

            <h2>Vamos configurar seu negócio</h2>

            <p className="muted">
              Informe os dados do estabelecimento para começar a
              criar seu programa de fidelidade.
            </p>

            <form
              onSubmit={createEstablishment}
              className="stack"
            >
              <label>
                Nome do estabelecimento
                <input
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  required
                  minLength={2}
                  placeholder="Ex.: Açaí da Praça"
                />
              </label>

              <label>
                Categoria
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option>Lanchonete</option>
                  <option>Açaíteria</option>
                  <option>Sorveteria</option>
                  <option>Padaria</option>
                  <option>Nail designer</option>
                  <option>Designer de sobrancelhas</option>
                  <option>Barbearia</option>
                  <option>Manutenção</option>
                  <option>Salão de beleza</option>
                  <option>Outro</option>
                </select>
              </label>

              <button
                className="primary-btn"
                disabled={busy}
              >
                {busy
                  ? 'Salvando…'
                  : 'Cadastrar estabelecimento'}
                <ArrowRight size={18} />
              </button>
            </form>
          </section>
        ) : page === 'overview' ? (
          <div className="fz-dashboard">
            <section className="welcome-card fz-dashboard-welcome">
              <div>
                <span className="eyebrow">SEU ESTABELECIMENTO</span>
                <h2>{business?.name || 'Estabelecimento'}</h2>
                <p>{business?.business_type || 'Outro'} · Painel de fidelidade</p>
                <div className="fz-status-line">
                  <span className={`fz-status-dot ${program?.active ? 'is-active' : ''}`} />
                  {program ? (program.active ? 'Programa ativo' : 'Programa pausado') : 'Programa ainda não configurado'}
                </div>
              </div>
              <div className="business-avatar"><Store size={28} /></div>
            </section>

            {dashboardStatsError && <p className="fz-dashboard-note">{dashboardStatsError}</p>}

            <div className="stats-grid fz-metrics-grid">
              <article className="stat-card fz-metric-card">
                <div className="fz-metric-icon"><Users size={19} /></div>
                <span>Clientes atendidos</span>
                <strong>{dashboardStats.customers}</strong>
                <small>Clientes únicos com compras registradas</small>
              </article>
              <article className="stat-card fz-metric-card">
                <div className="fz-metric-icon"><ShoppingBag size={19} /></div>
                <span>Compras registradas</span>
                <strong>{dashboardStats.purchases}</strong>
                <small>Compras registradas neste estabelecimento</small>
              </article>
              {(program?.benefit_type ?? benefitType) !== 'cashback' && (
                <article className="stat-card fz-metric-card">
                  <div className="fz-metric-icon"><Gift size={19} /></div>
                  <span>Selos concedidos</span>
                  <strong>{dashboardStats.stamps}</strong>
                  <small>Total de selos gerados nas compras</small>
                </article>
              )}
              {(program?.benefit_type ?? benefitType) !== 'pontos' && (
                <article className="stat-card fz-metric-card">
                  <div className="fz-metric-icon"><Coins size={19} /></div>
                  <span>Cashback concedido</span>
                  <strong>{dashboardStats.cashback.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  <small>Total de créditos de cashback gerados</small>
                </article>
              )}
            </div>

            <section className="fz-dashboard-section">
              <div className="fz-section-heading">
                <div><span className="eyebrow">ACESSO RÁPIDO</span><h3>O que você deseja fazer?</h3></div>
                <Activity size={21} />
              </div>
              <div className="fz-shortcuts-grid">
                <button type="button" className="fz-shortcut" onClick={() => { setPage('register'); setQrTokenInput(''); setPurchaseAmount(''); setPurchaseResult(null); setNotice(''); }}>
                  <span className="fz-shortcut-icon"><QrCode size={21} /></span><span><strong>Registrar compra</strong><small>Ler QR Code ou localizar por CPF</small></span><ArrowRight size={17} />
                </button>
                <button type="button" className="fz-shortcut" onClick={() => { setPage('program'); setNotice(''); }}>
                  <span className="fz-shortcut-icon"><WalletCards size={21} /></span><span><strong>Programa de fidelidade</strong><small>Editar regras e benefícios</small></span><ArrowRight size={17} />
                </button>
                <button type="button" className="fz-shortcut" onClick={() => { setPage('profile'); setNotice(''); }}>
                  <span className="fz-shortcut-icon"><Store size={21} /></span><span><strong>Cartão digital da loja</strong><small>Atualizar perfil público e contatos</small></span><ArrowRight size={17} />
                </button>
              </div>
            </section>

            <section className="next-card fz-program-summary">
              <div className="next-icon"><TrendingUp size={22} /></div>
              <div className="fz-program-summary-copy">
                <span className="eyebrow">RESUMO DO PROGRAMA</span>
                <h3>{program ? program.name : 'Crie seu programa de fidelidade'}</h3>
                <p>{program ? `Benefícios: ${(program.benefit_type ?? 'ambos') === 'pontos' ? 'pontos/selos' : (program.benefit_type ?? 'ambos') === 'cashback' ? 'cashback' : 'pontos/selos e cashback'}. ${program.active ? 'Seu programa está ativo.' : 'Seu programa está pausado.'}` : 'Configure os benefícios para começar a fidelizar seus clientes.'}</p>
                {program && <small className="fz-program-detail">{(program.benefit_type ?? 'ambos') !== 'cashback' ? `Recompensa: ${program.reward_description || 'não informada'}. ` : ''}{(program.benefit_type ?? 'ambos') !== 'pontos' ? `Cashback: ${Number(program.cashback_percent ?? 0).toLocaleString('pt-BR')}% por compra.` : ''}</small>}
              </div>
              <button type="button" className="primary-btn" onClick={() => { setPage('program'); setNotice(''); }}>
                {program ? 'Editar programa' : 'Configurar agora'} <ArrowRight size={17} />
              </button>
            </section>
          </div>
        ) : page === 'profile' ? (
          <section className="setup-card" style={{ maxWidth: 900, width: '100%', alignSelf: 'stretch' }}>
            <div className="setup-icon"><Store size={25} /></div>
            <h2>Seu cartão de visita digital</h2>
            <p className="muted">Essas informações aparecerão quando alguém clicar na sua loja no portal público. Para logo e fotos, informe links diretos para as imagens (https://...).</p>
            <form onSubmit={saveBusinessProfile} className="stack">
              <label>Descrição da loja<textarea value={profileDescription} onChange={e => setProfileDescription(e.target.value)} rows={3} placeholder="Conte brevemente sobre sua loja e seus produtos" /></label>
              <label>Link da logo<input type="url" value={profileLogoUrl} onChange={e => setProfileLogoUrl(e.target.value)} placeholder="https://.../logo.png" /></label>
              <label>WhatsApp (link de conversa)<input type="url" value={profileWhatsappUrl} onChange={e => setProfileWhatsappUrl(e.target.value)} placeholder="https://wa.me/5562999999999" /></label>
              <label>Endereço completo<input value={profileAddress} onChange={e => setProfileAddress(e.target.value)} placeholder="Rua, número, bairro e cidade" /></label>
              <label>Link de localização (Google Maps)<input type="url" value={profileLocationUrl} onChange={e => setProfileLocationUrl(e.target.value)} placeholder="https://maps.google.com/..." /></label>
              <label>Horário de atendimento<textarea value={profileOpeningHours} onChange={e => setProfileOpeningHours(e.target.value)} rows={3} placeholder={"Seg a sex: 8h às 18h\nSábado: 8h às 12h\nDomingo: fechado"} /></label>
              <label>Link principal (cardápio, catálogo, agendamento ou outro)<input type="url" value={profilePublicLinkUrl} onChange={e => setProfilePublicLinkUrl(e.target.value)} placeholder="https://..." /></label>
              <label>Telefone de contato (opcional)<input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="(62) 99999-9999" /></label>
              <label>Site (opcional)<input type="url" value={profileWebsite} onChange={e => setProfileWebsite(e.target.value)} placeholder="https://sualoja.com.br" /></label>
              <div><strong>Galeria de fotos (até 5)</strong><p className="muted">Cole o link de cada foto. Deixe em branco os espaços que não for usar.</p></div>
              {profileGalleryUrls.map((url, index) => <label key={index}>Foto {index + 1}<input type="url" value={url} onChange={e => setProfileGalleryUrls(current => current.map((value, i) => i === index ? e.target.value : value))} placeholder={`https://.../foto-${index + 1}.jpg`} /></label>)}
              <button className="primary-btn" disabled={busy}><Save size={18} />{busy ? 'Salvando…' : 'Salvar cartão digital'}</button>
            </form>
          </section>
        ) : !isAdmin && page === 'program' ? (
          <section className="setup-card">
            <div className="setup-icon">
              <Gift size={25} />
            </div>

            <h2>Configure sua campanha</h2>

            <p className="muted">
              Escolha como seu programa vai funcionar. Por exemplo,
              o cliente acumula 10 selos e ganha um produto grátis.
            </p>

            {loadingProgram ? (
              <p className="muted">
                Carregando configurações…
              </p>
            ) : (
              <form onSubmit={saveProgram} className="stack">
                <label>
                  Nome do programa
                  <input
                    value={programName}
                    onChange={(event) =>
                      setProgramName(event.target.value)
                    }
                    required
                    placeholder="Ex.: Cliente Especial"
                  />
                </label>

                <label>
                  Quais benefícios deseja oferecer?
                  <select
                    value={benefitType}
                    onChange={(event) => setBenefitType(event.target.value as 'pontos' | 'cashback' | 'ambos')}
                    required
                  >
                    <option value="pontos">Somente pontos/selos</option>
                    <option value="cashback">Somente cashback</option>
                    <option value="ambos">Pontos/selos e cashback</option>
                  </select>
                  <small className="muted">Você pode mudar essa escolha quando quiser.</small>
                </label>

                {(benefitType === 'pontos' || benefitType === 'ambos') && (
                  <>
                    <label>
                      Quantos selos o cliente precisa acumular?
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={stampsRequired}
                        onChange={(event) => setStampsRequired(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Qual será a recompensa?
                      <input
                        value={rewardDescription}
                        onChange={(event) => setRewardDescription(event.target.value)}
                        required
                        placeholder="Ex.: 1 açaí de 300 ml grátis"
                      />
                    </label>
                  </>
                )}

                {(benefitType === 'cashback' || benefitType === 'ambos') && (
                  <label>
                    Percentual de cashback por compra (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={cashbackPercent}
                      onChange={(event) => setCashbackPercent(event.target.value)}
                      required
                    />
                    <small className="muted">Ex.: 5 significa 5% do valor da compra.</small>
                  </label>
                )}

                <label
                  style={{
                    display: 'flex',
                    gridTemplateColumns: 'auto 1fr',
                    alignItems: 'center',
                    gap: 10,
                    padding: 14,
                    border: '1px solid #d6e3f2',
                    borderRadius: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={programActive}
                    onChange={(event) =>
                      setProgramActive(event.target.checked)
                    }
                    style={{
                      width: 17,
                      height: 17,
                      margin: 0,
                    }}
                  />
                  Ativar o programa
                </label>

                <button
                  className="primary-btn"
                  disabled={busy}
                >
                  <Save size={18} />
                  {busy
                    ? 'Salvando…'
                    : 'Salvar programa de fidelidade'}
                </button>
              </form>
            )}

            {program && (
              <p
                className="muted"
                style={{ marginTop: 18 }}
              >
                Programa salvo. Você pode alterar os campos e
                salvar novamente.
              </p>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
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

type Page = 'overview' | 'program' | 'profile' | 'register' | 'admin' | 'customers';

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
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authVisible, setAuthVisible] = useState(false);
  const [publicPortalVisible, setPublicPortalVisible] = useState(false);
  const [publicEstablishments, setPublicEstablishments] = useState<PublicEstablishment[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicSearch, setPublicSearch] = useState('');
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
  const [fullName, setFullName] = useState('');
  const [signupRole, setSignupRole] = useState<'cliente' | 'lojista'>('lojista');

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
      (_event, nextSession) => {
        setSession(nextSession);
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

      const role = data?.role;

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

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: signupRole },
          },
        });

        if (error) throw error;

        showNotice(
          signupRole === 'cliente'
            ? 'Cadastro de cliente enviado! Confira seu e-mail para confirmar a conta e depois faça login.'
            : 'Cadastro de lojista enviado! Confira seu e-mail para confirmar a conta e depois faça login.',
        );
        setMode('login');
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
      showNotice('Estabelecimento cadastrado com sucesso!');
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
  if (!session && authVisible) {
    return (
      <main className="auth-shell">
        <section className="auth-intro">
          <div className="brand-mark">
            <Gift size={25} />
          </div>

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
            style={{ alignSelf: 'flex-start', marginBottom: 18, background: 'transparent', border: 0, color: '#426b52', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
            aria-label="Voltar ao portal público do Fideliza"
          >
            <ArrowLeft size={17} /> <span style={{ fontSize: 20, letterSpacing: '-1px' }}>fideliza<span style={{ color: '#5a9870' }}>.</span></span> <span>Portal público</span>
          </button>
          <div className="auth-card">
            <span className="eyebrow">{mode === 'signup' ? (signupRole === 'cliente' ? 'CADASTRO DE CLIENTE' : 'CADASTRO DE LOJISTA') : 'ACESSO AO FIDELIZA'}</span>

            <h2>
              {mode === 'signup'
                ? 'Crie sua conta'
                : 'Boas-vindas de volta'}
            </h2>

            <p className="muted">
              {mode === 'signup'
                ? (signupRole === 'cliente' ? 'Crie sua conta para acompanhar suas fidelidades e benefícios.' : 'Cadastre-se para configurar seu negócio.')
                : 'Entre para acessar sua conta.'}
            </p>

            <form onSubmit={handleAuth} className="stack">
              {mode === 'signup' && (
                <fieldset style={{ border: '1px solid #dce5df', borderRadius: 12, padding: 14, margin: '0 0 4px' }}>
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

              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  placeholder={
                    mode === 'signup'
                      ? 'Mínimo de 8 caracteres'
                      : 'Sua senha'
                  }
                  autoComplete={
                    mode === 'signup'
                      ? 'new-password'
                      : 'current-password'
                  }
                />
              </label>

              <button className="primary-btn" disabled={busy}>
                {busy
                  ? 'Aguarde…'
                  : mode === 'signup'
                    ? 'Criar minha conta'
                    : 'Entrar'}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="switch-mode">
              {mode === 'signup'
                ? 'Já tem uma conta?'
                : 'Ainda não tem conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(
                    mode === 'signup' ? 'login' : 'signup',
                  );
                  setNotice('');
                }}
              >
                {mode === 'signup'
                  ? 'Fazer login'
                  : 'Criar conta'}
              </button>
            </p>

            <button
              type="button"
              onClick={() => { setAuthVisible(false); setNotice(''); }}
              style={{ marginTop: 12, background: 'transparent', border: 0, color: '#426b52', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
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

  if (!session || publicPortalVisible) {
    const normalizedSearch = publicSearch.trim().toLocaleLowerCase('pt-BR');
    const visibleEstablishments = publicEstablishments.filter((item) =>
      [item.name, item.business_type, item.description, item.address]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalizedSearch)),
    );

    return (
      <main style={{ minHeight: '100vh', background: '#f6f8f5', color: '#24352b' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px clamp(20px, 6vw, 84px)', background: '#fff', borderBottom: '1px solid #e3e9e3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => { if (session) setPublicPortalVisible(true); else { setAuthVisible(false); setNotice(''); } window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Ir ao início do portal Fideliza" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 0, padding: 0, color: 'inherit', cursor: 'pointer' }}>
              <div className="brand-mark"><Gift size={23} /></div>
              <strong style={{ fontSize: 24, letterSpacing: '-1px' }}>fideliza<span style={{ color: '#5a9870' }}>.</span></strong>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {session ? (
              <button type="button" className="primary-btn" onClick={() => setPublicPortalVisible(false)} style={{ background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}>Voltar ao painel <ArrowRight size={17} /></button>
            ) : (
              <>
                <button type="button" className="primary-btn" onClick={() => { setMode('login'); setAuthVisible(true); setPublicPortalVisible(false); }} style={{ background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}>Entrar</button>
                <button type="button" className="primary-btn" onClick={() => { setMode('signup'); setSignupRole('cliente'); setAuthVisible(true); setPublicPortalVisible(false); }} style={{ background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}>Criar conta de cliente</button>
                <button type="button" className="primary-btn" onClick={() => { setMode('signup'); setSignupRole('lojista'); setAuthVisible(true); setPublicPortalVisible(false); }}>Cadastrar estabelecimento <ArrowRight size={17} /></button>
              </>
            )}
          </div>
        </header>

        <section style={{ padding: 'clamp(36px, 7vw, 84px) clamp(20px, 6vw, 84px) 46px', background: 'linear-gradient(135deg, #edf6ee, #f9fbf8)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <span className="eyebrow">FIDELIDADE QUE APROXIMA</span>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-2px', margin: '16px 0' }}>Valorize cada compra.<br /><em style={{ color: '#4b8a60' }}>Volte para quem valoriza você.</em></h1>
            <p style={{ maxWidth: 650, margin: '0 auto', color: '#647268', fontSize: 18, lineHeight: 1.7 }}>Descubra estabelecimentos participantes e conheça programas de fidelidade para aproveitar vantagens nos negócios da sua região.</p>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid #dce5df', borderRadius: 12, padding: '0 13px', background: '#fff', minWidth: 260 }}>
              <Search size={18} color="#708076" />
              <input aria-label="Buscar estabelecimento" value={publicSearch} onChange={(event) => setPublicSearch(event.target.value)} placeholder="Buscar por nome ou categoria" style={{ border: 0, outline: 0, padding: '13px 0', width: '100%', background: 'transparent' }} />
            </label>
          </div>

          {selectedPublicEstablishment ? (
            <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', border: '1px solid #e1e8e1', borderRadius: 22, overflow: 'hidden' }}>
              <button type="button" onClick={() => setSelectedPublicEstablishment(null)} style={{ margin: 20, border: 0, background: 'transparent', color: '#39734b', display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}><ArrowLeft size={17} /> Voltar às lojas</button>
              <div style={{ padding: '8px 24px 28px', textAlign: 'center' }}>
                {selectedPublicEstablishment.logo_url && <img src={selectedPublicEstablishment.logo_url} alt={`Logo de ${selectedPublicEstablishment.name}`} style={{ width: 130, height: 130, objectFit: 'contain', borderRadius: 20, margin: '0 auto 18px' }} />}
                <span className="eyebrow">{selectedPublicEstablishment.business_type || 'Estabelecimento participante'}</span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '10px 0' }}>{selectedPublicEstablishment.name}</h2>
                {selectedPublicEstablishment.description && <p style={{ color: '#647268', lineHeight: 1.7, maxWidth: 650, margin: '0 auto 24px' }}>{selectedPublicEstablishment.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                  {selectedPublicEstablishment.whatsapp_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.whatsapp_url) ? selectedPublicEstablishment.whatsapp_url : `https://${selectedPublicEstablishment.whatsapp_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none' }}><Phone size={17} /> WhatsApp</a>}
                  {selectedPublicEstablishment.location_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.location_url) ? selectedPublicEstablishment.location_url : `https://${selectedPublicEstablishment.location_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none', background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}><MapPin size={17} /> Como chegar</a>}
                  {selectedPublicEstablishment.public_link_url && <a href={/^https?:\/\//i.test(selectedPublicEstablishment.public_link_url) ? selectedPublicEstablishment.public_link_url : `https://${selectedPublicEstablishment.public_link_url}`} target="_blank" rel="noreferrer" className="primary-btn" style={{ textDecoration: 'none', background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}><ExternalLink size={17} /> Ver cardápio / catálogo</a>}
                </div>
                {selectedPublicEstablishment.address && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#647268' }}><MapPin size={17} />{selectedPublicEstablishment.address}</p>}
                {selectedPublicEstablishment.phone && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#647268' }}><Phone size={17} />{selectedPublicEstablishment.phone}</p>}
                {selectedPublicEstablishment.opening_hours && <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#647268', whiteSpace: 'pre-line' }}><Clock size={17} />{typeof selectedPublicEstablishment.opening_hours === 'string' ? selectedPublicEstablishment.opening_hours : (selectedPublicEstablishment.opening_hours as { text?: string } | null)?.text}</p>}
                {selectedPublicEstablishment.website && <p><a href={/^https?:\/\//i.test(selectedPublicEstablishment.website) ? selectedPublicEstablishment.website : `https://${selectedPublicEstablishment.website}`} target="_blank" rel="noreferrer" style={{ color: '#39734b' }}><Globe size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Site oficial</a></p>}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 18 }}>
              {visibleEstablishments.map((item) => (
                <article key={item.id} style={{ background: '#fff', border: '1px solid #e1e8e1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 6px 22px rgba(35, 60, 42, 0.04)' }}>
                  <button type="button" onClick={() => { setSelectedPublicEstablishment(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label={`Abrir cartão digital de ${item.name}`} style={{ width: '100%', height: 110, background: 'linear-gradient(135deg, #e5f2e7, #f4f8f3)', display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer' }}>
                    {item.logo_url ? <img src={item.logo_url} alt={`Logo de ${item.name}`} style={{ maxWidth: '75%', maxHeight: 86, objectFit: 'contain' }} /> : <div style={{ width: 58, height: 58, borderRadius: 18, background: '#fff', display: 'grid', placeItems: 'center', color: '#4b8a60' }}><Store size={28} /></div>}
                  </button>
                  <div style={{ padding: 20 }}>
                    <span style={{ color: '#4b8a60', fontSize: 12, fontWeight: 700 }}>{item.business_type || 'Estabelecimento participante'}</span>
                    <h3 style={{ margin: '8px 0', fontSize: 21 }}>{item.name}</h3>
                    <p style={{ color: '#647268', lineHeight: 1.55, minHeight: 44, margin: '0 0 14px' }}>{item.description || 'Faça uma visita e conheça as vantagens deste estabelecimento no Fideliza.'}</p>
                    {item.address && <p style={{ display: 'flex', alignItems: 'start', gap: 7, color: '#647268', fontSize: 13, margin: '8px 0' }}><MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />{item.address}</p>}
                    {item.phone && <p style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#647268', fontSize: 13, margin: '8px 0' }}><Phone size={15} />{item.phone}</p>}
                    {item.website && <a href={/^https?:\/\//i.test(item.website) ? item.website : `https://${item.website}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#39734b', fontSize: 13, marginTop: 8 }}><Globe size={15} />Visitar site</a>}
                    <button type="button" onClick={() => { setSelectedPublicEstablishment(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="primary-btn" style={{ width: '100%', marginTop: 16 }}>Ver cartão digital <ArrowRight size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer style={{ background: '#24352b', color: '#eaf1eb', padding: '28px 20px', textAlign: 'center' }}>
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
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-mark small">
            <Gift size={20} />
          </div>
          <strong>
            fideliza<span>.</span>
          </strong>
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
            setPage('overview');
            setNotice('');
          }}
        >
          <LayoutDashboard size={18} /> Visão geral
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

        {profileRole === 'lojista' ? (
          <button
            type="button"
            className={`nav-item ${page === 'customers' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('customers'); setMerchantCustomerSearch(''); setNotice(''); }}
          >
            <Users size={18} /> Gestão de clientes
          </button>
        ) : (
          <div className="nav-item disabled">
            <Users size={18} /> Clientes <small>Área do lojista</small>
          </div>
        )}

        {profileRole === 'lojista' ? (
          <button
            type="button"
            className={`nav-item ${page === 'register' ? 'active' : ''}`}
            style={navButtonStyle}
            onClick={() => { setPage('register'); setQrTokenInput(''); setPurchaseAmount(''); setPurchaseResult(null); setNotice(''); }}
          >
            <QrCode size={18} /> Registrar compra
          </button>
        ) : (
          <div className="nav-item disabled">
            <QrCode size={18} /> Registrar compra <small>Área do lojista</small>
          </div>
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
              {isAdmin && page === 'admin'
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
              {page === 'admin'
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
            <button type="button" className="secondary-btn" onClick={() => setPublicPortalVisible(true)} style={{ border: '1px solid #dce5df', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#34443a', cursor: 'pointer', fontWeight: 600 }}>Portal público</button>
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
                      border: '1px solid #dce5df',
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
                            color: '#34443a',
                            border: '1px solid #dce5df',
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

                      {item.moderation_status === 'approved' && (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{
                            background: '#fff',
                            color: '#34443a',
                            border: '1px solid #dce5df',
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
                            color: '#34443a',
                            border: '1px solid #dce5df',
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
                color: '#34443a',
                border: '1px solid #dce5df',
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
            <form onSubmit={saveCustomerCpf} className="stack" style={{ maxWidth: 460, alignSelf: 'stretch', background: '#fff', border: '1px solid #dce5df', borderRadius: 14, padding: 16, marginTop: 14 }}>
              <h3 style={{ margin: 0 }}>Identificação alternativa por CPF</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Opcional. Se preferir, o lojista poderá localizar sua conta pelo CPF em vez de ler o QR Code.</p>
              <label>Seu CPF<input inputMode="numeric" autoComplete="off" value={customerCpf} onChange={(event) => setCustomerCpf(event.target.value.replace(/[^0-9.\-/]/g, '').slice(0, 14))} placeholder="000.000.000-00" /></label>
              <button className="primary-btn" disabled={savingCpf || (!!customerCpf.replace(/\D/g, '') && customerCpf.replace(/\D/g, '').length !== 11)}>{savingCpf ? 'Salvando…' : 'Salvar CPF'}</button>
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>O CPF é dado pessoal e ficará restrito às funções necessárias do sistema.</p>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, width: '100%', marginTop: 14 }}>
              <div style={{ border: '1px solid #dce5df', borderRadius: 16, padding: 22, textAlign: 'center', background: '#fff' }}>
                <QrCode size={26} color="#4b8a60" />
                <h3>Meu cartão Fideliza</h3>
                {loadingCustomerCard ? (
                  <p className="muted">Carregando seu cartão…</p>
                ) : customerCard?.qr_token ? (
                  <>
                    <div style={{ display: 'inline-flex', padding: 14, margin: '8px auto 12px', background: '#fff', border: '1px solid #e3e9e3', borderRadius: 12 }}>
                      <QRCodeSVG value={customerCard.qr_token} size={208} level="H" includeMargin />
                    </div>
                    <p style={{ fontWeight: 700, margin: '4px 0' }}>{customerCard.full_name || session.user.user_metadata?.full_name || 'Cliente Fideliza'}</p>
                    <p className="muted" style={{ fontSize: 13 }}>Cartão digital exclusivo</p>
                    <button type="button" className="secondary-btn" onClick={() => window.print()} style={{ border: '1px solid #dce5df', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#34443a', cursor: 'pointer', fontWeight: 600 }}>Imprimir / salvar em PDF</button>
                  </>
                ) : (
                  <p className="muted">Não foi possível carregar o QR Code. Atualize a página ou confira a migração do banco.</p>
                )}
                <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>O QR Code contém apenas um identificador aleatório, não seu nome, telefone ou e-mail.</p>
              </div>
              <div style={{ border: '1px solid #dce5df', borderRadius: 16, padding: 18, textAlign: 'left' }}>
                <Gift size={24} color="#4b8a60" />
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
                          {(item.benefit_type === 'cashback' || item.benefit_type === 'ambos') && <p style={{ margin: '8px 0', padding: '10px 12px', borderRadius: 10, background: '#edf7ef', color: '#2f6d43' }}><strong>Cashback disponível: {item.cashback_balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>}
                          {(item.benefit_type === 'pontos' || item.benefit_type === 'ambos') && item.stamps_required && (
                            <div style={{ height: 8, background: '#e5ece6', borderRadius: 999, overflow: 'hidden', margin: '8px 0 10px' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: '#4b8a60', borderRadius: 999 }} />
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
            <div style={{ border: '1px solid #dce5df', borderRadius: 16, padding: 18, marginTop: 14, background: '#fff', width: '100%', boxSizing: 'border-box' }}>
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
                        {item.kind === 'cashback' ? <strong style={{ color: (item.amount ?? 0) >= 0 ? '#287a45' : '#a05a18' }}>{(item.amount ?? 0) >= 0 ? '+' : '-'}{Math.abs(item.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> : <strong style={{ color: item.kind === 'compra' ? '#287a45' : '#a05a18' }}>{item.kind === 'compra' ? `+${item.stamps}` : `-${item.stamps}`} selos</strong>}
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
                <div style={{ border: '1px solid #dce5df', borderRadius: 14, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginTop: 0 }}>1. Identifique o cliente</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <button type="button" className={identificationMethod === 'qr' ? 'primary-btn' : 'secondary-btn'} onClick={() => { setIdentificationMethod('qr'); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={identificationMethod === 'qr' ? {} : { background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}>Ler QR Code</button>
                    <button type="button" className={identificationMethod === 'cpf' ? 'primary-btn' : 'secondary-btn'} onClick={() => { setIdentificationMethod('cpf'); setQrTokenInput(''); setCpfCustomerPreview(null); }} style={identificationMethod === 'cpf' ? {} : { background: '#fff', color: '#34443a', border: '1px solid #dce5df' }}>Digitar CPF</button>
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
                        <div role="status" style={{ border: '1px solid #b9dec1', background: '#f1faf3', borderRadius: 12, padding: 14, color: '#244d30' }}>
                          <p style={{ margin: '0 0 6px', fontWeight: 700 }}><CheckCircle2 size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />Cliente encontrado</p>
                          <p style={{ margin: 0 }}>Nome cadastrado: <strong>{cpfCustomerPreview.name}</strong></p>
                        </div>
                      )}
                      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Digite o CPF e clique em “Localizar cliente”. Confira o nome retornado antes de registrar a compra.</p>
                    </>
                  )}
                </div>
                <div style={{ border: '1px solid #dce5df', borderRadius: 14, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginTop: 0 }}>2. Informe a compra</h3>
                  <label>Valor total da compra (R$)<input type="number" min="0.01" max="10000000" step="0.01" value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} placeholder="Ex.: 35,90" required /></label>
                  <p className="muted" style={{ fontSize: 12 }}>Nesta primeira versão, cada compra confirmada concede 1 selo. A regra por valor e o resgate de recompensas serão configurados depois.</p>
                  <button className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, ''))) || !purchaseAmount || Number(purchaseAmount.replace(',', '.')) <= 0}><CheckCircle2 size={18} />{busy ? 'Registrando compra…' : 'Confirmar e registrar compra'}</button>
                </div>
              </form>
            )}
            <div style={{ marginTop: 18, border: '1px solid #dce5df', borderRadius: 14, padding: 16, background: '#fff' }}>
              <h3 style={{ marginTop: 0 }}><Gift size={18} style={{ verticalAlign: 'middle', marginRight: 7 }} />Resgatar recompensa</h3>
              <p className="muted" style={{ fontSize: 13 }}>Use o mesmo QR Code ou CPF informado acima. O sistema só confirma o resgate se o cliente tiver selos suficientes e o programa estiver ativo.</p>
              <button type="button" className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, '')))} onClick={() => void redeemReward()}><Gift size={18} />{busy ? 'Processando…' : 'Confirmar resgate da recompensa'}</button>
            </div>
            <div style={{ marginTop: 18, border: '1px solid #dce5df', borderRadius: 14, padding: 16, background: '#fff' }}>
              <h3 style={{ marginTop: 0 }}><WalletCards size={18} style={{ verticalAlign: 'middle', marginRight: 7 }} />Resgatar cashback</h3>
              <p className="muted" style={{ fontSize: 13 }}>Informe quanto do saldo de cashback o cliente deseja usar nesta loja. O sistema valida o saldo disponível antes de confirmar.</p>
              <form className="stack" onSubmit={(event) => { event.preventDefault(); void redeemCashback(); }}>
                <label>Valor de cashback a utilizar (R$)<input type="number" min="0.01" max="10000000" step="0.01" value={cashbackRedeemAmount} onChange={(event) => setCashbackRedeemAmount(event.target.value)} placeholder="Ex.: 5,00" required /></label>
                <button type="submit" className="primary-btn" disabled={busy || !business || (identificationMethod === 'qr' ? !qrTokenInput.trim() : (customerCpfInput.replace(/\D/g, '').length !== 11 || !cpfCustomerPreview || cpfCustomerPreview.cpf !== customerCpfInput.replace(/\D/g, ''))) || !cashbackRedeemAmount || Number(cashbackRedeemAmount.replace(',', '.')) <= 0}><WalletCards size={18} />{busy ? 'Processando…' : 'Confirmar resgate de cashback'}</button>
              </form>
            </div>
            {cashbackRedemptionResult && (
              <div role="status" style={{ marginTop: 18, padding: 18, border: '1px solid #b9dec1', background: '#f1faf3', borderRadius: 14, color: '#244d30' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Cashback resgatado</h3>
                <p><strong>Cliente:</strong> {cashbackRedemptionResult.customer_name}</p>
                <p><strong>Valor utilizado:</strong> {Number(cashbackRedemptionResult.amount_redeemed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Saldo restante nesta loja:</strong> {Number(cashbackRedemptionResult.cashback_balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button type="button" className="secondary-btn" onClick={() => { setCashbackRedemptionResult(null); setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={{ border: '1px solid #b9dec1', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#244d30', cursor: 'pointer', fontWeight: 600 }}>Atender outro cliente</button>
              </div>
            )}
            {redemptionResult && (
              <div role="status" style={{ marginTop: 18, padding: 18, border: '1px solid #b9dec1', background: '#f1faf3', borderRadius: 14, color: '#244d30' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Recompensa resgatada</h3>
                <p><strong>Cliente:</strong> {redemptionResult.customer_name}</p>
                <p><strong>Recompensa:</strong> {redemptionResult.reward_description}</p>
                <p><strong>Selos utilizados:</strong> {redemptionResult.stamps_used}</p>
                <p><strong>Saldo restante nesta loja:</strong> {redemptionResult.stamps_balance} selos</p>
                <button type="button" className="secondary-btn" onClick={() => { setRedemptionResult(null); setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); }} style={{ border: '1px solid #b9dec1', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#244d30', cursor: 'pointer', fontWeight: 600 }}>Atender outro cliente</button>
              </div>
            )}
            {purchaseResult && (
              <div style={{ marginTop: 18, padding: 18, border: '1px solid #b9dec1', background: '#f1faf3', borderRadius: 14, color: '#244d30' }}>
                <h3 style={{ marginTop: 0 }}><CheckCircle2 size={19} style={{ verticalAlign: 'middle', marginRight: 6 }} />Compra registrada</h3>
                <p><strong>Cliente:</strong> {purchaseResult.customer_name}</p>
                <p><strong>Estabelecimento:</strong> {purchaseResult.establishment_name}</p>
                <p><strong>Valor:</strong> {Number(purchaseResult.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Selos concedidos:</strong> {purchaseResult.stamps_earned}</p>
                <p><strong>Total de selos deste cliente nesta loja:</strong> {purchaseResult.stamps_balance}</p>
                <button type="button" className="secondary-btn" onClick={() => { setQrTokenInput(''); setCustomerCpfInput(''); setCpfCustomerPreview(null); setPurchaseResult(null); setNotice(''); }} style={{ border: '1px solid #b9dec1', borderRadius: 10, padding: '10px 14px', background: '#fff', color: '#244d30', cursor: 'pointer', fontWeight: 600 }}>Registrar outra compra</button>
              </div>
            )}
          </section>
        ) : loadingBusiness ? (
          <section className="setup-card">
            <div className="loader" />
            <p>Carregando estabelecimento…</p>
          </section>
        ) : !business ? (
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
                <h2>{business.name}</h2>
                <p>{business.business_type || 'Outro'} · Painel de fidelidade</p>
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
        ) : (
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
                    border: '1px solid #dce5df',
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
        )}
      </section>
    </main>
  );
}
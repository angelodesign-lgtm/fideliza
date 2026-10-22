import type { BenefitType, ModerationStatus, UserRole } from './types';

export const ESTABLISHMENT_CATEGORIES = [
  'Lanchonete',
  'Açaíteria',
  'Sorveteria',
  'Padaria',
  'Nail designer',
  'Designer de sobrancelhas',
  'Barbearia',
  'Salão de beleza',
  'Manutenção',
  'Outro',
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  lojista: 'Lojista',
  admin: 'Administrador',
};

export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  pontos: 'Pontos/Selos',
  cashback: 'Cashback',
  ambos: 'Pontos/Selos e Cashback',
};

export const MODERATION_LABELS: Record<ModerationStatus, string> = {
  pending: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
};

export const MIN_PASSWORD_LENGTH = 6;
export const CPF_LENGTH = 11;
export const CNPJ_LENGTH = 14;
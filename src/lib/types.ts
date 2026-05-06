/* Data models matching the specification */

export enum TipoTransacao {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export enum FormaPagamento {
  Transferencia = 'Transferência',
  PIX = 'PIX',
  CartaoDebito = 'Cartão Débito',
  CartaoCredito = 'Cartão Crédito',
  DebitoAutomatico = 'Débito Automático',
  ContaCorrente = 'Conta Corrente',
  ContaPoupanca = 'Conta Poupança',
}

export interface Categoria {
  id: string
  nome: string
  icon?: string
}

export interface Transacao {
  id: string
  data: Date
  descricao: string
  valor: number
  categoria_id: string
  tipo_id: TipoTransacao
  forma_pagamento_id: FormaPagamento
  observacoes?: string
}

export interface User {
  id: string
  name: string
  totalPaid: number
  avgMonthlySpend: number
  status: 'Ativo' | 'Em Risco'
}

export interface KPIMetric {
  label: string
  value: string | number
  subValue?: string
  trend: number
  trendLabel: string
  progress: number
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray'
}

export interface DashboardKPIs {
  totalBalance: number
  monthIncome: number
  monthExpense: number
  lastMonthIncome: number
  lastMonthExpense: number
}

export interface ChartDataPoint {
  date: string
  revenue: number
  expenses: number
}

export interface CategoryDistribution {
  name: string
  value: number
  percentage: number
  color: string
}

export interface PaymentMethodDistribution {
  name: string
  value: number
  color: string
}

export type Role = 'admin' | 'colaborador' | 'visitante'

export interface UserProfile {
  id: string
  full_name: string | null
  role: Role
  created_at?: string | null
  updated_at?: string | null
}

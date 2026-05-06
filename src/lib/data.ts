/* Mock data for the application */
import {
  Categoria,
  Transacao,
  TipoTransacao,
  FormaPagamento,
  User,
  KPIMetric,
} from './types'

export const mockCategories: Categoria[] = [
  { id: '1', nome: 'Taxa Empresarial' },
  { id: '2', nome: 'Compra TI' },
  { id: '3', nome: 'Taxas de Serviço' },
]

export const mockTransactions: Transacao[] = [
  {
    id: 't1',
    data: new Date(),
    descricao: 'Serviço de Consultoria',
    valor: 1250.0,
    categoria_id: '1',
    tipo_id: TipoTransacao.Receita,
    forma_pagamento_id: FormaPagamento.Transferencia,
  },
  {
    id: 't2',
    data: new Date(),
    descricao: 'Materiais de Escritório',
    valor: 300.0,
    categoria_id: '2',
    tipo_id: TipoTransacao.Despesa,
    forma_pagamento_id: FormaPagamento.CartaoCredito,
  },
]

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'NexaCorp',
    totalPaid: 18400,
    avgMonthlySpend: 6100,
    status: 'Ativo',
  },
  {
    id: 'u2',
    name: 'MonoTech',
    totalPaid: 11200,
    avgMonthlySpend: 3200,
    status: 'Em Risco',
  },
  {
    id: 'u3',
    name: 'NexaCorp',
    totalPaid: 18400,
    avgMonthlySpend: 6100,
    status: 'Ativo',
  },
  {
    id: 'u4',
    name: 'MonoTech',
    totalPaid: 11200,
    avgMonthlySpend: 3200,
    status: 'Em Risco',
  },
]

export const kpiData: KPIMetric[] = [
  {
    label: 'Receita Realizada',
    value: 'R$ 118.000',
    subValue: '150.000',
    trend: 6,
    trendLabel: 'Desde a semana passada',
    progress: 78,
    color: 'blue',
  },
  {
    label: 'Margem de Lucro (%)',
    value: '27',
    subValue: '30',
    trend: -6,
    trendLabel: 'Desde a semana passada',
    progress: 90,
    color: 'green',
  },
  {
    label: 'Crescimento de Clientes',
    value: '325',
    subValue: '400',
    trend: 6,
    trendLabel: 'Desde a semana passada',
    progress: 80,
    color: 'purple',
  },
  {
    label: 'Taxa de Churn (%)',
    value: '3,1',
    subValue: '>2,5',
    trend: -6,
    trendLabel: 'Desde a semana passada',
    progress: 35,
    color: 'yellow',
  },
]

export const performanceData = [
  { day: 'Dom', revenue: 120, expenses: 150 },
  { day: 'Seg', revenue: 150, expenses: 130 },
  { day: 'Ter', revenue: 100, expenses: 140 },
  { day: 'Qua', revenue: 85, expenses: 145 },
  { day: 'Qui', revenue: 130, expenses: 110 },
  { day: 'Sex', revenue: 180, expenses: 160 },
  { day: 'Sab', revenue: 70, expenses: 140 },
]

export const categoryData = [
  {
    name: 'Taxa Empresarial',
    value: 1250,
    percentage: 90,
    color: 'bg-green-500',
  },
  { name: 'Compra TI', value: 1120, percentage: 80, color: 'bg-blue-500' },
  {
    name: 'Taxas de Serviço',
    value: 663,
    percentage: 45,
    color: 'bg-yellow-400',
  },
]

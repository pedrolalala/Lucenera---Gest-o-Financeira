import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
  PackageSearch,
  ShieldAlert,
} from 'lucide-react'

import {
  cn,
  formatCircuitId,
  formatCircuitIdInput,
  sortItemsByCircuitId,
} from '@/lib/utils'
import { isValidUUID } from '@/lib/uuid'
import {
  buildClientApprovalLink,
  getStatusLabel,
  getStatusBadgeClass,
} from '@/lib/budget-status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ProductSelectButton } from '@/components/ProductSelectButton'
import { ProjectCreateModal } from '@/components/ProjectCreateModal'
import { ClientCreateModal } from '@/components/ClientCreateModal'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useOptions } from '@/hooks/use-options'
import { useAuth } from '@/hooks/use-auth'
import {
  approveBudgetFinancial,
  type ApprovalResult,
} from '@/services/budgetApprovalService'
import { approveProjectFinancial } from '@/services/projectFinancialApprovalService'
import { FinancialApprovalDialog } from '@/components/budgets/FinancialApprovalDialog'
import { FinanceResultModal } from '@/components/budgets/FinanceResultModal'
import { supabase } from '@/lib/supabase/client'
import {
  ProductSearchModal,
  type ProductSearchItem,
} from '@/components/budgets/ProductSearchModal'
import { BatchPdfImport } from '@/components/budgets/BatchPdfImport'
import {
  BudgetItemCard,
  type ProductMeta,
} from '@/components/budgets/BudgetItemCard'
import type { ParsedPdfResult } from '@/lib/pdf-import'

const formSchema = z
  .object({
    empresa_id: z
      .string({ required_error: 'Selecione uma empresa' })
      .min(1, 'Selecione uma empresa'),
    projeto_codigo: z
      .string({ required_error: 'O código do projeto é obrigatório' })
      .trim()
      .min(1, 'O código do projeto é obrigatório'),
    cliente_id: z
      .string({ required_error: 'Selecione um cliente' })
      .min(1, 'Selecione um cliente'),
    arquiteto_id: z.string().optional().nullable(),
    vendedor_id: z.string().optional().nullable(),
    status: z.string().default('rascunho'),
    data_emissao: z.date({ required_error: 'Data de emissão é obrigatória' }),
    desconto_global: z.coerce
      .number()
      .min(0, 'O desconto não pode ser negativo')
      .max(100, 'O desconto não pode ser maior que 100%')
      .nullish()
      .transform((v) => (v === null || v === undefined ? 0 : v))
      .default(0),
    forma_pagamento: z.string().optional().nullable(),
    parcelas: z.coerce
      .number()
      .int('Deve ser um valor inteiro')
      .min(1)
      .max(120)
      .optional()
      .default(1),
    prazo_inicio_cobranca_dias: z.coerce
      .number({ invalid_type_error: 'Informe o prazo em dias' })
      .int('Deve ser um valor inteiro')
      .min(0, 'O prazo não pode ser negativo'),
    frete_tipo: z.enum(['com_frete', 'sem_frete'], {
      required_error: 'Selecione o frete',
      invalid_type_error: 'Selecione o frete',
    }),
    frete_valor: z.coerce
      .number()
      .min(0, 'O valor do frete não pode ser negativo')
      .default(0),
    observacoes: z.string().optional().nullable(),
    validade: z.date().optional().nullable(),
    itens: z
      .array(
        z.object({
          uid: z.string().optional(),
          custom_id: z.string().optional(),
          produto_id: z.string().optional().default(''),
          descricao: z.string().optional().default(''),
          quantidade: z.coerce
            .number()
            .int('Deve ser um valor inteiro')
            .min(1, 'Quantidade inválida'),
          preco_unitario: z.coerce.number().min(0, 'Preço inválido'),
          desconto: z.coerce
            .number()
            .int('Deve ser um valor inteiro')
            .min(0)
            .default(0),
          sub_ordem: z.number().optional(),
        }),
      )
      .min(1, 'Adicione pelo menos um item'),
  })
  .superRefine((data, ctx) => {
    if (data.frete_tipo === 'com_frete' && !(data.frete_valor > 0)) {
      ctx.addIssue({
        path: ['frete_valor'],
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor do frete (maior que zero)',
      })
    }
    data.itens.forEach((item, index) => {
      if (!item.produto_id && !item.descricao?.trim()) {
        ctx.addIssue({
          path: ['itens', index, 'produto_id'],
          code: z.ZodIssueCode.custom,
          message: 'Selecione um produto ou informe uma descrição',
        })
      }
    })
  })

export default function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const { addBudget, updateBudget, budgets, fetchBudgets } = useBudgetStore()
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [productSearchRowIndex, setProductSearchRowIndex] = useState<
    number | null
  >(null)
  const {
    empresas,
    clientes,
    arquitetos,
    vendedores,
    produtos,
    projetos,
    loading: optionsLoading,
    fetchProjetos,
    fetchClientes,
  } = useOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingBudget, setIsLoadingBudget] = useState(isEditing)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)
  const [assignedVendedorNome, setAssignedVendedorNome] = useState<
    string | null
  >(null)
  const [projectDetails, setProjectDetails] = useState<{
    nome?: string
    responsavel_nome?: string
    arquiteto_nome?: string
    cliente_nome?: string
    responsavel_sistema_nome?: string
    empresa_nome?: string
    isLoading?: boolean
  } | null>(null)
  const [projectStatus, setProjectStatus] = useState<string | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )
  const [productMetaMap, setProductMetaMap] = useState<
    Map<string, ProductMeta>
  >(new Map())
  const { role } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: '',
      projeto_codigo: '',
      cliente_id: '',
      arquiteto_id: 'none',
      vendedor_id: 'none',
      status: 'rascunho',
      data_emissao: new Date(),
      desconto_global: 0,
      forma_pagamento: '',
      parcelas: 1,
      prazo_inicio_cobranca_dias: 0,
      frete_valor: 0,
      observacoes: '',
      validade: null,
      itens: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'itens',
  })

  const PRIORITY_SELLERS = [
    'Marina Pousa',
    'Barbara Gregorio',
    'Thairine Cristina',
    'Thais Gomes',
    'Teresinha do Amaral',
  ].map((n) => n.toLowerCase())

  const sortedVendedores = [...vendedores].sort((a, b) => {
    const idxA = PRIORITY_SELLERS.findIndex((n) =>
      a.nome.toLowerCase().includes(n),
    )
    const idxB = PRIORITY_SELLERS.findIndex((n) =>
      b.nome.toLowerCase().includes(n),
    )

    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.nome.localeCompare(b.nome)
  })

  const getProductInfo = (
    produtoId: string | null | undefined,
  ): ProductMeta | null => {
    if (!produtoId || !isValidUUID(produtoId)) return null
    const fromMeta = productMetaMap.get(produtoId)
    if (fromMeta) return fromMeta
    const fromList = produtos.find((p) => p.id === produtoId)
    if (fromList) {
      return {
        codigo_produto: (fromList as any).codigo_produto ?? null,
        referencia: fromList.referencia ?? null,
        nome: ((fromList as any).originalNome || fromList.nome) ?? null,
        sku: fromList.sku ?? null,
      }
    }
    return null
  }

  useEffect(() => {
    async function loadBudget() {
      if (!isEditing || !id) return

      try {
        setIsLoadingBudget(true)
        // First check in store
        let budget = budgets.find((b) => b.id === id)

        if (!budget) {
          // fetch from supabase
          const { data, error } = await supabase
            .from('orcamentos')
            .select(
              `
              *,
              itens:orcamento_itens(
                id, produto_id, quantidade, preco_unitario, desconto, custom_id, sub_ordem,
                descricao,
                produto:produtos(codigo_produto, referencia, nome, sku)
              )
            `,
            )
            .eq('id', id)
            .single()

          if (error) throw error
          budget = data as any
        }

        if (budget) {
          if (budget.vendedor_id) {
            const { data: vData } = await supabase
              .from('funcionarios')
              .select('nome')
              .eq('id', budget.vendedor_id)
              .single()
            if (vData) setAssignedVendedorNome(vData.nome)
          }

          let projetoCodigo = ''
          if (budget.projeto_id) {
            const { data: pData } = await supabase
              .from('projetos')
              .select('codigo, status')
              .eq('id', budget.projeto_id)
              .single()
            if (pData) {
              projetoCodigo = pData.codigo
              setProjectStatus(pData.status)
            }
          }

          const parsedParcelas = Array.isArray(budget.prazo_pagamento_dias)
            ? Math.max(1, budget.prazo_pagamento_dias.length)
            : 1

          const metaMap = new Map<string, ProductMeta>()
          budget.itens?.forEach((i: any) => {
            if (i.produto_id && i.produto) {
              metaMap.set(i.produto_id, {
                codigo_produto: i.produto.codigo_produto ?? null,
                referencia: i.produto.referencia ?? null,
                nome: i.produto.nome ?? null,
                sku: i.produto.sku ?? null,
              })
            }
          })
          setProductMetaMap(metaMap)
          setBudgetToEdit(budget)
          form.reset({
            empresa_id: budget.empresa_id,
            projeto_codigo: projetoCodigo,
            cliente_id: budget.cliente_id || '',
            arquiteto_id: budget.arquiteto_id || 'none',
            vendedor_id: budget.vendedor_id || 'none',
            status: budget.status || 'enviado_cliente',
            desconto_global: budget.desconto_global ?? 0,
            forma_pagamento: budget.forma_pagamento || '',
            parcelas: parsedParcelas,
            prazo_inicio_cobranca_dias: budget.prazo_inicio_cobranca_dias ?? 0,
            frete_tipo:
              (budget.frete_tipo as 'com_frete' | 'sem_frete' | undefined) ??
              undefined,
            frete_valor: budget.frete_valor ?? 0,
            observacoes: budget.observacoes || '',
            data_emissao: budget.data_emissao
              ? new Date(budget.data_emissao)
              : new Date(),
            validade: budget.validade ? new Date(budget.validade) : null,
            itens: sortItemsByCircuitId(
              budget.itens?.map((i) => ({
                uid: crypto.randomUUID(),
                custom_id: formatCircuitId(i.custom_id || ''),
                produto_id: i.produto_id || '',
                descricao: i.descricao || '',
                quantidade: Math.max(1, Math.floor(Number(i.quantidade) || 1)),
                preco_unitario: i.preco_unitario,
                desconto: i.desconto || 0,
                sub_ordem: i.sub_ordem ?? 0,
              })) || [],
            ),
          })
        }
      } catch (error) {
        toast.error('Erro ao carregar orçamento')
        navigate('/budgets')
      } finally {
        setIsLoadingBudget(false)
      }
    }

    loadBudget()
  }, [id, isEditing, budgets, form, navigate])

  const watchItens = form.watch('itens')
  const descontoGlobalPerc = form.watch('desconto_global') || 0
  const freteTipo = form.watch('frete_tipo')
  const freteValor = form.watch('frete_valor') || 0

  const valorSubtotal = watchItens.reduce((acc, item) => {
    const q = Number(item.quantidade) || 0
    const p = Number(item.preco_unitario) || 0
    const d = Math.round(Number(item.desconto) || 0) // %
    return acc + q * p * (1 - d / 100)
  }, 0)

  const valorComDesconto = valorSubtotal * (1 - descontoGlobalPerc / 100)
  const valorTotal =
    valorComDesconto + (freteTipo === 'com_frete' ? freteValor : 0)

  const customIdsKey = watchItens.map((i) => i.custom_id || '').join('|')

  useEffect(() => {
    const items = form.getValues('itens')
    if (!items || items.length <= 1) return
    const sorted = sortItemsByCircuitId(items)
    const currentKey = items.map((i) => i.custom_id || '').join('|')
    const sortedKey = sorted.map((i) => i.custom_id || '').join('|')
    if (currentKey !== sortedKey) {
      replace(sorted, { shouldFocus: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customIdsKey])

  const handleProjectSelect = async (codigo: string) => {
    if (!codigo) {
      setProjectDetails(null)
      return
    }

    setProjectDetails({ isLoading: true })

    try {
      const { data: projeto, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('codigo', codigo)
        .single()

      if (error || !projeto) {
        setProjectDetails(null)
        return
      }

      let clienteNome = 'Não encontrado'
      let empresaNome = 'Não encontrado'
      let responsavelSisNome = 'Não encontrado'

      if (projeto.cliente_id) {
        const { data: cli } = await supabase
          .from('contatos')
          .select('nome')
          .eq('id', projeto.cliente_id)
          .single()
        if (cli) clienteNome = cli.nome
      }

      if (projeto.empresa_id) {
        const { data: emp } = await supabase
          .from('empresas')
          .select('nome')
          .eq('id', projeto.empresa_id)
          .single()
        if (emp) empresaNome = emp.nome
      }

      if (projeto.responsavel_id) {
        const { data: usr } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', projeto.responsavel_id)
          .single()
        if (usr) responsavelSisNome = usr.nome
      }

      setProjectDetails({
        nome: projeto.nome,
        responsavel_nome: projeto.responsavel_nome || 'Não preenchido',
        arquiteto_nome: projeto['Nome Arquiteto'] || 'Não preenchido',
        cliente_nome: clienteNome,
        responsavel_sistema_nome: responsavelSisNome,
        empresa_nome: empresaNome,
        isLoading: false,
      })

      if (projeto.empresa_id) {
        form.setValue('empresa_id', projeto.empresa_id, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      if (projeto.cliente_id) {
        form.setValue('cliente_id', projeto.cliente_id, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      if (projeto.arquiteto_id) {
        form.setValue('arquiteto_id', projeto.arquiteto_id, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      const targetVendedorId = projeto.vendedor_id || projeto.responsavel_id
      if (targetVendedorId) {
        form.setValue('vendedor_id', targetVendedorId, {
          shouldValidate: true,
          shouldDirty: true,
        })

        if (!sortedVendedores.some((v) => v.id === targetVendedorId)) {
          let nome = ''
          const { data: vData } = await supabase
            .from('funcionarios')
            .select('nome')
            .eq('id', targetVendedorId)
            .maybeSingle()

          if (vData?.nome) {
            nome = vData.nome
          } else {
            const { data: uData } = await supabase
              .from('usuarios')
              .select('nome')
              .eq('id', targetVendedorId)
              .maybeSingle()

            if (uData?.nome) {
              nome = uData.nome
            } else {
              const { data: pData } = await supabase
                .from('profiles')
                .select('nome')
                .eq('id', targetVendedorId)
                .maybeSingle()

              if (pData?.nome) nome = pData.nome
            }
          }
          if (nome) setAssignedVendedorNome(nome)
        }
      }

      form.setValue('data_emissao', new Date(), {
        shouldValidate: true,
        shouldDirty: true,
      })
    } catch (err) {
      console.error('Erro ao buscar dados do projeto:', err)
      setProjectDetails(null)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const invalidItems = values.itens.filter(
        (i) => i.produto_id && !isValidUUID(i.produto_id),
      )
      if (invalidItems.length > 0) {
        toast.error(
          `${invalidItems.length} item(ns) com produto_id inválido. Serão tratados como item avulso.`,
        )
      }

      const { data: projeto, error: projError } = await supabase
        .from('projetos')
        .select('id, arquivado')
        .eq('codigo', values.projeto_codigo)
        .single()

      if (projError || !projeto) {
        form.setError('projeto_codigo', {
          message: 'Código de projeto não encontrado na base de dados',
        })
        setIsSubmitting(false)
        return
      }

      if (
        projeto.arquivado &&
        (!isEditing || budgetToEdit?.projeto_id !== projeto.id)
      ) {
        form.setError('projeto_codigo', {
          message: 'Código de projeto não encontrado na base de dados',
        })
        setIsSubmitting(false)
        return
      }

      // SPEC-002: o usuário informa apenas o prazo (em dias) para início da
      // cobrança. As parcelas seguintes vencem em múltiplos desse mesmo
      // intervalo (ex.: prazo 30 dias + 3 parcelas = vencimentos 30/60/90),
      // reproduzindo o padrão manual usado no Connect.
      const totalParcelas = ['boleto', 'cartao'].includes(
        values.forma_pagamento || '',
      )
        ? values.parcelas || 1
        : 1
      const prazoDias = values.prazo_inicio_cobranca_dias
      const prazoPagamentoDias = Array.from(
        { length: totalParcelas },
        (_, i) => prazoDias * (i + 1),
      )

      const hasUnregisteredItems = values.itens.some(
        (i) => !i.produto_id || !isValidUUID(i.produto_id),
      )

      const payload = {
        empresa_id: values.empresa_id,
        projeto_id: projeto.id,
        cliente_id: values.cliente_id,
        arquiteto_id:
          values.arquiteto_id === 'none' ? null : values.arquiteto_id,
        vendedor_id: values.vendedor_id === 'none' ? null : values.vendedor_id,
        status: isEditing ? values.status : 'rascunho',
        desconto_global: values.desconto_global ?? 0,
        forma_pagamento: values.forma_pagamento || null,
        prazo_inicio_cobranca_dias: prazoDias,
        prazo_pagamento_dias: prazoPagamentoDias,
        condicoes_pagamento: prazoPagamentoDias.join('/'),
        frete_tipo: values.frete_tipo,
        frete_valor: values.frete_tipo === 'sem_frete' ? 0 : values.frete_valor,
        observacoes: values.observacoes,
        data_emissao: values.data_emissao.toISOString(),
        validade: values.validade
          ? format(values.validade, 'yyyy-MM-dd')
          : null,
        valor_total: valorTotal,
        requer_revisao_financeira: hasUnregisteredItems,
      }

      if (isEditing && budgetToEdit) {
        await updateBudget(budgetToEdit.id, payload, values.itens)
        toast.success('Orçamento atualizado com sucesso')
      } else {
        const newBudgetId = await addBudget(payload, values.itens)
        try {
          const { data: newBudget } = await supabase
            .from('orcamentos')
            .select('token_aprovacao_cliente, status')
            .eq('id', newBudgetId)
            .single()
          if (
            newBudget?.status === 'enviado_cliente' &&
            newBudget?.token_aprovacao_cliente
          ) {
            const link = buildClientApprovalLink(
              newBudgetId,
              newBudget.token_aprovacao_cliente,
            )
            await navigator.clipboard.writeText(link)
            toast.success(
              'Orçamento criado e enviado para aprovação do cliente! Link copiado.',
              {
                description: link,
                duration: 8000,
              },
            )
          } else {
            toast.info('Orçamento salvo como rascunho.', {
              description:
                'Preencha a forma de pagamento e os campos obrigatórios para enviá-lo ao cliente.',
              duration: 6000,
            })
          }
        } catch (err: any) {
          toast.success('Orçamento criado com sucesso!')
        }
      }

      // Update store budgets list so table is updated without hard refresh
      await fetchBudgets()
      navigate('/budgets')
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message ||
          'Falha ao salvar orçamento. Verifique os dados e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductSearchConfirm = (products: ProductSearchItem[]) => {
    console.log(`[DEBUG] Itens recebidos: [${products.length}]`)

    if (products.length === 0) {
      setIsProductSearchOpen(false)
      setProductSearchRowIndex(null)
      return
    }

    const currentItems = form.getValues('itens') || []

    const maxL = currentItems.reduce((max, item) => {
      const match = (item.custom_id || '').match(/L(\d+)/i)
      return Math.max(max, match ? parseInt(match[1], 10) : 0)
    }, 0)

    const buildNewItem = (p: ProductSearchItem, seq: number) => ({
      uid: crypto.randomUUID(),
      custom_id: formatCircuitId(`L${seq}`),
      produto_id: p.source === 'produtos' && isValidUUID(p.id) ? p.id : '',
      descricao: p.source === 'produtos' && isValidUUID(p.id) ? '' : p.nome,
      quantidade: 1,
      preco_unitario: p.preco_venda || p.valor_venda || 0,
      desconto: 0,
    })

    if (
      productSearchRowIndex !== null &&
      productSearchRowIndex >= 0 &&
      productSearchRowIndex < currentItems.length
    ) {
      const updatedItems = [...currentItems]
      const existingCustomId =
        updatedItems[productSearchRowIndex].custom_id || ''

      updatedItems[productSearchRowIndex] = {
        ...updatedItems[productSearchRowIndex],
        ...buildNewItem(products[0], productSearchRowIndex + 1),
        custom_id:
          existingCustomId || formatCircuitId(`L${productSearchRowIndex + 1}`),
      }

      if (products.length > 1) {
        const remaining = products
          .slice(1)
          .map((p, idx) => buildNewItem(p, maxL + idx + 1))
        updatedItems.push(...remaining)
      }

      replace(updatedItems, { shouldFocus: false })
    } else {
      const newItems = products.map((p, idx) => buildNewItem(p, maxL + idx + 1))
      const combinedItems = [...currentItems, ...newItems]
      replace(combinedItems, { shouldFocus: false })
    }

    const finalCount = (form.getValues('itens') || []).length
    console.log(
      `[DEBUG] Total de itens na lista após inserção: [${finalCount}]`,
    )

    toast.success(
      products.length === 1
        ? '1 produto adicionado com sucesso'
        : `${products.length} produtos adicionados com sucesso`,
    )
    setIsProductSearchOpen(false)
    setProductSearchRowIndex(null)
  }

  const handleBatchComplete = (results: ParsedPdfResult[]) => {
    if (results.length === 0) return

    let empresaId = form.getValues('empresa_id')
    const empresaNome = results.find((r) => r.empresa_nome)?.empresa_nome
    if (empresaNome) {
      const found = empresas.find(
        (emp) =>
          emp.nome.toLowerCase().includes(empresaNome.toLowerCase()) ||
          empresaNome.toLowerCase().includes(emp.nome.toLowerCase()),
      )
      if (found) empresaId = found.id
    }

    let clienteId = form.getValues('cliente_id')
    const clienteNome = results.find((r) => r.cliente_nome)?.cliente_nome
    if (clienteNome) {
      const found = clientes.find((c) =>
        c.nome.toLowerCase().includes(clienteNome.toLowerCase()),
      )
      if (found) clienteId = found.id
    }

    let arquitetoId = form.getValues('arquiteto_id')
    const arquitetoNome = results.find((r) => r.arquiteto_nome)?.arquiteto_nome
    if (arquitetoNome) {
      const found = arquitetos.find((a) =>
        a.nome.toLowerCase().includes(arquitetoNome.toLowerCase()),
      )
      if (found) arquitetoId = found.id
    }

    let vendedorId = form.getValues('vendedor_id')
    const vendedorNome = results.find((r) => r.vendedor_nome)?.vendedor_nome
    if (vendedorNome) {
      const found = sortedVendedores.find((v) =>
        v.nome.toLowerCase().includes(vendedorNome.toLowerCase()),
      )
      if (found) vendedorId = found.id
    }

    const validFormas = ['pix', 'cartao', 'boleto', 'dinheiro']
    const formaPgtoRaw =
      results.find((r) => r.forma_pagamento)?.forma_pagamento?.toLowerCase() ||
      ''
    let formaPgto = formaPgtoRaw
    if (formaPgto.includes('transferencia')) formaPgto = 'pix'
    else if (!validFormas.includes(formaPgto)) formaPgto = ''

    let parsedParcelas = 1
    const condicoes = results.find(
      (r) => r.condicoes_pagamento,
    )?.condicoes_pagamento
    if (condicoes) {
      const num = parseInt(condicoes.replace(/\D/g, ''))
      if (!isNaN(num) && num > 0) parsedParcelas = num
    }

    form.reset({
      ...form.getValues(),
      empresa_id: empresaId,
      cliente_id: clienteId,
      arquiteto_id: arquitetoId || 'none',
      vendedor_id: vendedorId || 'none',
      status: results.find((r) => r.status)?.status || 'enviado_cliente',
      desconto_global:
        results.find((r) => r.desconto_global)?.desconto_global || 0,
      forma_pagamento: formaPgto,
      parcelas: parsedParcelas,
      observacoes: results.find((r) => r.observacoes)?.observacoes || '',
    })

    const allParsedItems = results.flatMap((r) => r.itens || [])

    if (allParsedItems.length > 0) {
      const newItens = allParsedItems.map((i) => {
        let produtoId = ''
        if (i.custom_id || i.descricao) {
          const found = produtos.find(
            (p) =>
              (i.custom_id &&
                (p.sku === i.custom_id || p.referencia === i.custom_id)) ||
              (i.descricao &&
                (p.originalNome || p.nome)
                  .toLowerCase()
                  .includes(i.descricao.toLowerCase())),
          )
          if (found && isValidUUID(found.id)) produtoId = found.id
        }

        let displayCustomId = i.custom_id || ''
        if (!produtoId && i.descricao && !displayCustomId) {
          displayCustomId = i.descricao
        }

        return {
          uid: crypto.randomUUID(),
          custom_id: formatCircuitId(displayCustomId),
          produto_id: produtoId,
          descricao: produtoId ? '' : i.descricao || displayCustomId,
          quantidade: i.quantidade || 1,
          preco_unitario: i.preco_unitario || 0,
          desconto: i.desconto || 0,
        }
      })

      const existingItems = form.getValues('itens') || []
      replace(sortItemsByCircuitId([...existingItems, ...newItens]))
    }

    toast.success(
      `${results.length} arquivo(s) processado(s) com sucesso. Revise os dados preenchidos.`,
    )
  }

  const handleFinancialApproval = async () => {
    if (!budgetToEdit) return
    try {
      const result = await approveBudgetFinancial(budgetToEdit.id)
      if (budgetToEdit.projeto_id) {
        try {
          await approveProjectFinancial(budgetToEdit.projeto_id)
          setProjectStatus('Orçamento Aprovado')
        } catch (projErr: any) {
          console.warn('Project status update failed:', projErr?.message)
          toast.info('Status do projeto não foi atualizado automaticamente', {
            description: projErr?.message,
          })
        }
      }
      setApprovalResult(result)
      form.setValue('status', 'aprovado', { shouldDirty: false })
      toast.success('Orçamento aprovado financeiramente!', {
        description: `Itens: ${result.projeto_itens_criados}, Parcelas: ${result.parcelas_criadas}, Boletos: ${result.boletos_criados}`,
      })
    } catch (error: any) {
      toast.error('Falha na aprovação financeira', {
        description: error?.message,
      })
      throw error
    }
  }

  if (isLoadingBudget || optionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Carregando dados do orçamento...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 w-full max-w-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/budgets">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h1>
            <p className="text-gray-500">
              {isEditing
                ? `Editando orçamento #${budgetToEdit?.numero || budgetToEdit?.id.split('-')[0].toUpperCase()}`
                : 'Preencha os detalhes para criar um novo orçamento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing &&
            projectStatus === 'Aprovação Financeira' &&
            (role === 'admin' || role === 'gerente') && (
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setShowApprovalDialog(true)}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Aprovar Financeiro
              </Button>
            )}
          <Button variant="outline" asChild>
            <Link to="/budgets">Cancelar</Link>
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Detalhes do cliente e dados comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Empresa <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projeto_codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Código do Projeto{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <SearchableSelect
                              options={projetos
                                .filter(
                                  (p) =>
                                    !p.arquivado ||
                                    (isEditing &&
                                      budgetToEdit?.projeto_id === p.id),
                                )
                                .map((p) => ({
                                  value: p.codigo,
                                  label: `${p.codigo} - ${p.nome || 'Sem nome'}`,
                                  searchTerms: [p.codigo, p.nome].filter(
                                    Boolean,
                                  ) as string[],
                                }))}
                              value={field.value}
                              onChange={(val) => {
                                field.onChange(val)
                                handleProjectSelect(val)
                              }}
                              placeholder="Selecione um projeto..."
                              searchPlaceholder="Buscar código do projeto..."
                              emptyText="Nenhum projeto encontrado."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsProjectModalOpen(true)}
                            title="Criar Novo Projeto"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {projectDetails && (
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-2 mb-4 animate-in fade-in zoom-in-95">
                    {projectDetails.isLoading ? (
                      <div className="flex items-center gap-2 text-slate-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando
                        detalhes do projeto...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Nome do Projeto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.nome || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Empresa
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.empresa_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Cliente
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.cliente_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Arquiteto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.arquiteto_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Responsável do Projeto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.responsavel_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Responsável (Sistema)
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.responsavel_sistema_nome}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <div>
                    <span
                      className={`inline-flex items-center h-7 px-3 rounded-full border text-xs font-medium ${getStatusBadgeClass(
                        isEditing ? form.watch('status') : 'rascunho',
                      )}`}
                    >
                      {isEditing
                        ? getStatusLabel(form.watch('status'))
                        : 'Rascunho'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O status é definido automaticamente pelas ações do fluxo
                    (enviar, aprovar, recusar) e não pode ser editado
                    diretamente.
                  </p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Cliente <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <SearchableSelect
                              options={clientes.map((c) => ({
                                value: c.id,
                                label:
                                  (c as any).razao_social?.trim() || c.nome,
                                searchTerms: [
                                  (c as any).razao_social,
                                  c.nome,
                                  c.nome_empresa,
                                ].filter(Boolean) as string[],
                              }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione um cliente..."
                              searchPlaceholder="Buscar cliente..."
                              emptyText="Nenhum cliente encontrado."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsClientModalOpen(true)}
                            title="Criar Novo Cliente"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arquiteto_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arquiteto / Profissional</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={[
                            { value: 'none', label: 'Nenhum' },
                            ...arquitetos.map((a) => ({
                              value: a.id,
                              label: a.nome,
                            })),
                          ]}
                          value={field.value || 'none'}
                          onChange={field.onChange}
                          placeholder="Nenhum"
                          searchPlaceholder="Buscar arquiteto..."
                          emptyText="Nenhum arquiteto encontrado."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={[
                            { value: 'none', label: 'Nenhum' },
                            ...sortedVendedores.map((v) => ({
                              value: v.id,
                              label: v.nome,
                            })),
                            ...(field.value &&
                            field.value !== 'none' &&
                            !sortedVendedores.some(
                              (v) => v.id === field.value,
                            ) &&
                            assignedVendedorNome
                              ? [
                                  {
                                    value: field.value,
                                    label: assignedVendedorNome,
                                  },
                                ]
                              : []),
                          ]}
                          value={field.value || 'none'}
                          onChange={field.onChange}
                          placeholder="Nenhum"
                          searchPlaceholder="Buscar vendedor..."
                          emptyText="Nenhum vendedor encontrado."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_emissao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validade"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Validade (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itens do Orçamento</CardTitle>
                <CardDescription>
                  Produtos e quantidades que compõem o orçamento.
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setProductSearchRowIndex(null)
                    setIsProductSearchOpen(true)
                  }}
                >
                  <PackageSearch className="w-4 h-4 mr-2" /> Buscar Produtos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      uid: crypto.randomUUID(),
                      custom_id: '',
                      produto_id: '',
                      descricao: '',
                      quantidade: 1,
                      preco_unitario: 0,
                      desconto: 0,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    append({
                      uid: crypto.randomUUID(),
                      custom_id: '',
                      produto_id: '',
                      descricao: '',
                      quantidade: 1,
                      preco_unitario: 0,
                      desconto: 0,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Item não
                  Cadastrado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-lg bg-gray-50/50">
                  <p className="text-gray-500 mb-2 font-medium">
                    Nenhum item adicionado
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Adicione produtos para compor este orçamento.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        setProductSearchRowIndex(null)
                        setIsProductSearchOpen(true)
                      }}
                    >
                      <PackageSearch className="w-4 h-4 mr-2" /> Buscar Produtos
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        append({
                          uid: crypto.randomUUID(),
                          custom_id: '',
                          produto_id: '',
                          descricao: '',
                          quantidade: 1,
                          preco_unitario: 0,
                          desconto: 0,
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({
                          uid: crypto.randomUUID(),
                          custom_id: '',
                          produto_id: '',
                          descricao: '',
                          quantidade: 1,
                          preco_unitario: 0,
                          desconto: 0,
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Item não
                      Cadastrado
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  return (
                    <BudgetItemCard
                      key={field.uid || field.id || `item-${index}`}
                      index={index}
                      fieldId={field.uid || field.id || `item-${index}`}
                      onRemove={remove}
                      onSearchProduct={(idx) => {
                        setProductSearchRowIndex(idx)
                        setIsProductSearchOpen(true)
                      }}
                      getProductInfo={getProductInfo}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento e Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="forma_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="pix">Pix</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {['boleto', 'cartao'].includes(
                    form.watch('forma_pagamento') || '',
                  ) && (
                    <FormField
                      control={form.control}
                      name="parcelas"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                          <FormLabel>Quantidade de Parcelas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="prazo_inicio_cobranca_dias"
                    render={({ field }) => {
                      const parcelas = ['boleto', 'cartao'].includes(
                        form.watch('forma_pagamento') || '',
                      )
                        ? form.watch('parcelas') || 1
                        : 1
                      const prazo = Number(field.value) || 0
                      const vencimentos = Array.from(
                        { length: parcelas },
                        (_, i) => prazo * (i + 1),
                      )
                      return (
                        <FormItem>
                          <FormLabel>
                            Prazo para Início da Cobrança (dias)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Dias após a aprovação até o vencimento da primeira
                            cobrança. Confirme com o e-mail/negociação do
                            cliente, como no fluxo do Connect.
                            {prazo > 0 && (
                              <>
                                {' '}
                                Vencimentos calculados: {vencimentos.join(
                                  '/',
                                )}{' '}
                                dias.
                              </>
                            )}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="frete_tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frete</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val)
                            if (val === 'sem_frete') {
                              form.setValue('frete_valor', 0)
                            }
                          }}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o frete" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sem_frete">Sem Frete</SelectItem>
                            <SelectItem value="com_frete">Com Frete</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Confirme se a condição negociada é "Com Frete" ou "Sem
                          Frete", como no fluxo do Connect, para evitar
                          divergência na nota fiscal.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('frete_tipo') === 'com_frete' && (
                    <FormField
                      control={form.control}
                      name="frete_valor"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                          <FormLabel>Valor do Frete</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="desconto_global"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto Global (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="0"
                              className="pr-8"
                              {...field}
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 0)
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Este desconto será aplicado ao valor total após o
                          desconto dos itens.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Notas ou observações adicionais..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-end h-full border">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Subtotal dos itens</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Desconto global ({descontoGlobalPerc}%)</span>
                      <span className="font-medium text-red-600">
                        -
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorSubtotal * (descontoGlobalPerc / 100))}
                      </span>
                    </div>
                    {freteTipo === 'com_frete' && freteValor > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Frete</span>
                        <span className="font-medium text-blue-600">
                          +
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(freteValor)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-900 font-semibold">
                        Valor Total
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProjectCreateModal
            open={isProjectModalOpen}
            onOpenChange={setIsProjectModalOpen}
            onSuccess={async (newProj: any) => {
              if (fetchProjetos) await fetchProjetos()
              form.setValue('projeto_codigo', newProj.codigo, {
                shouldValidate: true,
              })
              handleProjectSelect(newProj.codigo)
            }}
            clientes={clientes}
            arquitetos={arquitetos}
          />

          <ClientCreateModal
            open={isClientModalOpen}
            onOpenChange={setIsClientModalOpen}
            onSuccess={async (newClient: any) => {
              if (fetchClientes) await fetchClientes()
              form.setValue('cliente_id', newClient.id, {
                shouldValidate: true,
              })
            }}
          />

          <ProductSearchModal
            open={isProductSearchOpen}
            onOpenChange={(v) => {
              setIsProductSearchOpen(v)
              if (!v) setProductSearchRowIndex(null)
            }}
            onConfirm={handleProductSearchConfirm}
          />

          <BatchPdfImport
            open={isBatchImportOpen}
            onOpenChange={setIsBatchImportOpen}
            onBatchComplete={handleBatchComplete}
          />

          <div className="flex justify-end mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBatchImportOpen(true)}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar PDFs
            </Button>
          </div>
        </form>
      </Form>

      {budgetToEdit && (
        <FinancialApprovalDialog
          budget={budgetToEdit}
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          onConfirm={handleFinancialApproval}
        />
      )}

      {budgetToEdit && (
        <FinanceResultModal
          budget={budgetToEdit}
          result={approvalResult}
          open={!!approvalResult}
          onOpenChange={(open) => {
            if (!open) setApprovalResult(null)
          }}
        />
      )}
    </div>
  )
}

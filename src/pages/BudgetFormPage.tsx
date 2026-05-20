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
} from 'lucide-react'

import { cn } from '@/lib/utils'
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
import { supabase } from '@/lib/supabase/client'

const formSchema = z.object({
  empresa_id: z
    .string({ required_error: 'Selecione uma empresa' })
    .min(1, 'Selecione uma empresa'),
  cliente_id: z
    .string({ required_error: 'Selecione um cliente' })
    .min(1, 'Selecione um cliente'),
  arquiteto_id: z.string().optional().nullable(),
  vendedor_id: z.string().optional().nullable(),
  status: z.string().default('Rascunho'),
  data_emissao: z.date({ required_error: 'Data de emissão é obrigatória' }),
  desconto_global: z.coerce
    .number()
    .min(0, 'O desconto não pode ser negativo')
    .max(100, 'O desconto não pode ser maior que 100%')
    .default(0),
  forma_pagamento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  validade: z.date().optional().nullable(),
  itens: z
    .array(
      z.object({
        custom_id: z.string().optional(),
        produto_id: z.string().min(1, 'Selecione um produto'),
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
      }),
    )
    .min(1, 'Adicione pelo menos um item'),
})

const STATUS_OPTIONS = [
  'Rascunho',
  'Aguardando Aprovação',
  'Aprovado',
  'Recusado',
  'Expirado',
]

export default function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const { addBudget, updateBudget, budgets, fetchBudgets } = useBudgetStore()
  const {
    empresas,
    clientes,
    arquitetos,
    vendedores,
    produtos,
    loading: optionsLoading,
  } = useOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingBudget, setIsLoadingBudget] = useState(isEditing)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: '',
      cliente_id: '',
      arquiteto_id: 'none',
      vendedor_id: 'none',
      status: 'Rascunho',
      data_emissao: new Date(),
      desconto_global: 0,
      forma_pagamento: '',
      observacoes: '',
      validade: null,
      itens: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  })

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
                id, produto_id, quantidade, preco_unitario, desconto, custom_id
              )
            `,
            )
            .eq('id', id)
            .single()

          if (error) throw error
          budget = data as any
        }

        if (budget) {
          setBudgetToEdit(budget)
          form.reset({
            empresa_id: budget.empresa_id,
            cliente_id: budget.cliente_id || '',
            arquiteto_id: budget.arquiteto_id || 'none',
            vendedor_id: budget.vendedor_id || 'none',
            status: budget.status || 'Rascunho',
            desconto_global: budget.desconto_global || 0,
            forma_pagamento: budget.forma_pagamento || '',
            observacoes: budget.observacoes || '',
            data_emissao: budget.data_emissao
              ? new Date(budget.data_emissao)
              : new Date(),
            validade: budget.validade ? new Date(budget.validade) : null,
            itens:
              budget.itens?.map((i) => ({
                custom_id: i.custom_id || '',
                produto_id: i.produto_id,
                quantidade: Math.max(1, Math.floor(Number(i.quantidade) || 1)),
                preco_unitario: i.preco_unitario,
                desconto: i.desconto || 0,
              })) || [],
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

  const valorSubtotal = watchItens.reduce((acc, item) => {
    const q = Number(item.quantidade) || 0
    const p = Number(item.preco_unitario) || 0
    const d = Math.round(Number(item.desconto) || 0) // %
    return acc + q * p * (1 - d / 100)
  }, 0)

  const valorTotal = valorSubtotal * (1 - descontoGlobalPerc / 100)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const payload = {
        empresa_id: values.empresa_id,
        cliente_id: values.cliente_id,
        arquiteto_id:
          values.arquiteto_id === 'none' ? null : values.arquiteto_id,
        vendedor_id: values.vendedor_id === 'none' ? null : values.vendedor_id,
        status: values.status,
        desconto_global: values.desconto_global,
        forma_pagamento: values.forma_pagamento || null,
        condicoes_pagamento: null,
        observacoes: values.observacoes,
        data_emissao: values.data_emissao.toISOString(),
        validade: values.validade
          ? format(values.validade, 'yyyy-MM-dd')
          : null,
        valor_total: valorTotal,
      }

      if (isEditing && budgetToEdit) {
        await updateBudget(budgetToEdit.id, payload, values.itens)
        toast.success('Orçamento atualizado com sucesso')
      } else {
        await addBudget(payload, values.itens)
        toast.success('Orçamento criado com sucesso')
      }

      // Update store budgets list so table is updated without hard refresh
      await fetchBudgets()
      navigate('/budgets')
    } catch (error) {
      toast.error('Falha ao salvar orçamento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductChange = async (index: number, val: string) => {
    form.setValue(`itens.${index}.produto_id`, val, { shouldValidate: true })

    if (!val) {
      form.setValue(`itens.${index}.preco_unitario`, 0, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      return
    }

    const { data: prod } = await supabase
      .from('produtos')
      .select('preco_venda')
      .eq('id', val)
      .single()

    if (
      prod &&
      prod.preco_venda !== null &&
      prod.preco_venda !== undefined &&
      Number(prod.preco_venda) > 0
    ) {
      form.setValue(`itens.${index}.preco_unitario`, Number(prod.preco_venda), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      form.setValue(`itens.${index}.preco_unitario`, 0, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
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
    <div className="flex flex-col gap-6 animate-fade-in pb-20 max-w-5xl mx-auto">
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
                      <FormLabel>Empresa</FormLabel>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={clientes.map((c) => ({
                            value: c.id,
                            label: c.nome,
                            searchTerms: [c.nome_empresa].filter(Boolean),
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione um cliente..."
                          searchPlaceholder="Buscar cliente..."
                          emptyText="Nenhum cliente encontrado."
                        />
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
                            ...vendedores.map((v) => ({
                              value: v.id,
                              label: v.nome,
                            })),
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    custom_id: '',
                    produto_id: '',
                    quantidade: 1,
                    preco_unitario: 0,
                    desconto: 0,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Item
              </Button>
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      append({
                        custom_id: '',
                        produto_id: '',
                        quantidade: 1,
                        preco_unitario: 0,
                        desconto: 0,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Primeiro Item
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const itemValues = watchItens[index] || {}
                  const q = Number(itemValues.quantidade) || 0
                  const p = Number(itemValues.preco_unitario) || 0
                  const d = Math.round(Number(itemValues.desconto) || 0)
                  const itemSubtotal = q * p * (1 - d / 100)

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-white p-4 rounded-xl border shadow-sm relative group"
                    >
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`itens.${index}.custom_id`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500 font-medium">
                                Cód. Customizado
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Opcional" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`itens.${index}.produto_id`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500 font-medium">
                                Produto
                              </FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={produtos.map((p) => ({
                                    value: p.id,
                                    label: p.nome,
                                    searchTerms: [
                                      p.sku,
                                      p.referencia,
                                      p.codigo_legado
                                        ? String(p.codigo_legado)
                                        : '',
                                    ].filter(Boolean),
                                  }))}
                                  value={f.value}
                                  onChange={(val) =>
                                    handleProductChange(index, val)
                                  }
                                  placeholder="Buscar produto..."
                                  searchPlaceholder="Buscar por nome, sku..."
                                  emptyText="Produto não encontrado."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`itens.${index}.quantidade`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500 font-medium">
                                Qtd (Unid)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  min="1"
                                  {...f}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    f.onChange(
                                      val ? Math.floor(Number(val)) : '',
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`itens.${index}.preco_unitario`}
                          render={({ field: f }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                              <FormLabel className="text-xs text-gray-500 font-medium">
                                Preço Unit. (R$)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`itens.${index}.desconto`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-500 font-medium">
                                Desc (%)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="100"
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(
                                      Math.round(Number(e.target.value) || 0),
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-1 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end h-full pt-6 md:pt-0">
                        <div className="flex flex-col md:text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                            Subtotal
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(itemSubtotal)}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="md:absolute md:-right-2 md:-top-2 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white rounded-full shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-all border"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
        </form>
      </Form>
    </div>
  )
}

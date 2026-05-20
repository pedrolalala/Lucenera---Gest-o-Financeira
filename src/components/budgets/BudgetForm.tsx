import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react'

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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

interface BudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetToEdit?: Budget | null
}

const STATUS_OPTIONS = [
  'Rascunho',
  'Aguardando Aprovação',
  'Aprovado',
  'Recusado',
  'Expirado',
]

export function BudgetForm({
  open,
  onOpenChange,
  budgetToEdit,
}: BudgetFormProps) {
  const { addBudget, updateBudget } = useBudgetStore()
  const { empresas, clientes, arquitetos, vendedores, produtos, loading } =
    useOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    if (budgetToEdit) {
      form.reset({
        empresa_id: budgetToEdit.empresa_id,
        cliente_id: budgetToEdit.cliente_id || '',
        arquiteto_id: budgetToEdit.arquiteto_id || 'none',
        vendedor_id: budgetToEdit.vendedor_id || 'none',
        status: budgetToEdit.status || 'Rascunho',
        desconto_global: budgetToEdit.desconto_global || 0,
        forma_pagamento: budgetToEdit.forma_pagamento || '',
        observacoes: budgetToEdit.observacoes || '',
        data_emissao: budgetToEdit.data_emissao
          ? new Date(budgetToEdit.data_emissao)
          : new Date(),
        validade: budgetToEdit.validade
          ? new Date(budgetToEdit.validade)
          : null,
        itens:
          budgetToEdit.itens?.map((i) => ({
            custom_id: i.custom_id || '',
            produto_id: i.produto_id,
            quantidade: Math.max(1, Math.floor(Number(i.quantidade) || 1)),
            preco_unitario: i.preco_unitario,
            desconto: i.desconto || 0,
          })) || [],
      })
    } else {
      form.reset({
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
      })
    }
  }, [budgetToEdit, form, open])

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

      if (budgetToEdit) {
        await updateBudget(budgetToEdit.id, payload, values.itens)
        toast.success('Orçamento atualizado com sucesso')
      } else {
        await addBudget(payload, values.itens)
        toast.success('Orçamento criado com sucesso')
      }
      onOpenChange(false)
      form.reset()
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

    // Fetch product from DB to ensure real-time pricing
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
          </SheetTitle>
          <SheetDescription>
            {budgetToEdit
              ? 'Faça alterações no orçamento existente.'
              : 'Crie um novo orçamento comercial para um cliente.'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-20"
            >
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Itens do Orçamento
                  </h3>
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
                </div>

                {fields.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum item adicionado.
                  </p>
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
                        className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg border"
                      >
                        <div className="col-span-6 sm:col-span-1">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.custom_id`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">ID</FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9"
                                    placeholder="L01"
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.produto_id`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Produto
                                </FormLabel>
                                <FormControl>
                                  <SearchableSelect
                                    className="h-9"
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
                                    placeholder="Selecione..."
                                    searchPlaceholder="Buscar produto, sku, ref..."
                                    emptyText="Nenhum produto encontrado."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.quantidade`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Qtd</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="1"
                                    className="h-9"
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
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.preco_unitario`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Preço (R$)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-9"
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.desconto`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Desc. (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="1"
                                    className="h-9"
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
                        <div className="col-span-8 sm:col-span-2 pb-2">
                          <div className="flex flex-col justify-end h-full">
                            <span className="text-xs font-medium text-gray-500 mb-1">
                              Subtotal
                            </span>
                            <span className="text-sm font-semibold truncate">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(itemSubtotal)}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-1 sm:col-span-1 flex justify-center pb-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
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
                            placeholder="Ex: 10"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <SelectValue placeholder="Selecione..." />
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
              </div>

              <div className="mt-4 flex justify-end">
                <div className="bg-gray-100 text-gray-900 pl-4 pr-4 py-2 rounded-lg border border-gray-200 flex flex-col max-w-full overflow-hidden">
                  <div className="flex justify-between items-center text-sm mb-1 text-gray-500">
                    <span className="font-medium mr-8">Subtotal:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg text-primary">
                    <span className="font-medium mr-8">Total:</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-6 pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : budgetToEdit ? (
                    'Salvar Alterações'
                  ) : (
                    'Criar Orçamento'
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

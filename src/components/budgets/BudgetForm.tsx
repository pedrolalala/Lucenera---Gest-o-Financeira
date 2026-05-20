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
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useOptions } from '@/hooks/use-options'

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
  condicoes_pagamento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  validade: z.date().optional().nullable(),
  itens: z
    .array(
      z.object({
        custom_id: z.string().optional(),
        produto_id: z.string().min(1, 'Selecione um produto'),
        quantidade: z.coerce.number().min(0.01, 'Quantidade inválida'),
        preco_unitario: z.coerce.number().min(0, 'Preço inválido'),
        desconto: z.coerce.number().min(0).default(0),
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
      condicoes_pagamento: '',
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
        condicoes_pagamento: budgetToEdit.condicoes_pagamento || '',
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
            quantidade: i.quantidade,
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
        condicoes_pagamento: '',
        observacoes: '',
        validade: null,
        itens: [],
      })
    }
  }, [budgetToEdit, form, open])

  const watchItens = form.watch('itens')
  const valorTotal = watchItens.reduce((acc, item) => {
    const q = Number(item.quantidade) || 0
    const p = Number(item.preco_unitario) || 0
    const d = Number(item.desconto) || 0 // %
    return acc + q * p * (1 - d / 100)
  }, 0)

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
        condicoes_pagamento: values.condicoes_pagamento,
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

  const handleProductChange = (index: number, val: string) => {
    form.setValue(`itens.${index}.produto_id`, val)
    const prod = produtos.find((p) => p.id === val)
    if (prod && prod.preco_venda) {
      form.setValue(`itens.${index}.preco_unitario`, Number(prod.preco_venda))
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
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {arquitetos.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nome}
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
                  name="vendedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {vendedores.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg border"
                    >
                      <div className="col-span-12 sm:col-span-2">
                        <FormField
                          control={form.control}
                          name={`itens.${index}.custom_id`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                ID (L01)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9"
                                  placeholder="Ex: L01"
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-3">
                        <FormField
                          control={form.control}
                          name={`itens.${index}.produto_id`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Produto</FormLabel>
                              <Select
                                onValueChange={(val) =>
                                  handleProductChange(index, val)
                                }
                                value={f.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {produtos.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                      <div className="col-span-3 sm:col-span-2">
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
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="bg-primary/5 text-primary px-4 py-2 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium mr-2">
                      Valor Total:
                    </span>
                    <span className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="condicoes_pagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições de Pagamento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Dinheiro, PIX, 3x no Cartão"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

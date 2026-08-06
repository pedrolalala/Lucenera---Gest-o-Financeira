import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, PackagePlus, Plus, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createFornecedorQuick,
  createMarcaQuick,
  createProductFromBudget,
  getNextProductSku,
  getProductCatalogOptions,
  type ProductCatalogItem,
  type ProductOption,
  type SupplierOption,
} from '@/services/productCatalogService'

const schema = z.object({
  sku: z.string().optional(),
  nome: z.string().trim().min(2, 'Obrigatório'),
  marca_id: z.string().min(1, 'Obrigatório'),
  categoria_id: z.string().min(1, 'Obrigatório'),
  fornecedor_principal_id: z.string().optional().default('none'),
  unidade: z.string().trim().min(1, 'Obrigatório').default('UN'),
  referencia: z.string().optional(),
  descricao_tecnica: z.string().optional(),
  preco_custo: z.coerce.number().min(0, 'Inválido').default(0),
  preco_venda: z.coerce.number().min(0, 'Inválido').default(0),
  valor_venda: z.coerce.number().min(0, 'Inválido').default(0),
  porc_frete: z.coerce.number().min(0).default(0),
  porc_despesas: z.coerce.number().min(0).default(0),
  porc_bdi: z.coerce.number().min(0).default(0),
  porc_st: z.coerce.number().min(0).default(0),
  margem_lucro: z.coerce.number().min(0).default(150),
  custo_total: z.coerce.number().min(0).default(0),
  ncm: z.string().optional(),
  tipo_fiscal: z.string().optional(),
  cst: z.string().optional(),
  cest: z.string().optional(),
  icms_entrada: z.coerce.number().min(0).default(0),
  ipi_entrada: z.coerce.number().min(0).default(0),
  mascara_produto: z.string().optional(),
  status_comercial: z.string().optional().default('Normal'),
})

type FormData = z.infer<typeof schema>

interface ProductCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (product: ProductCatalogItem) => void
  initialName?: string
}

function NumberField({
  control,
  name,
  label,
  readOnly = false,
}: {
  control: any
  name: keyof FormData
  label: string
  readOnly?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              min="0"
              readOnly={readOnly}
              className="h-8 text-sm"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  )
}

function TextField({
  control,
  name,
  label,
}: {
  control: any
  name: keyof FormData
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input
              className="h-8 text-sm"
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  )
}

// SPEC-053: modal simples de criação rápida de marca, aberto pelo botão "+"
// ao lado do Select de Marca. Não sai do modal de criação de produto.
function MarcaQuickCreateDialog({
  open,
  onOpenChange,
  fornecedores,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedores: SupplierOption[]
  onCreated: (marca: ProductOption) => void
}) {
  const [nome, setNome] = useState('')
  const [fornecedorId, setFornecedorId] = useState('none')
  const [prazoEntregaDias, setPrazoEntregaDias] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome('')
      setFornecedorId('none')
      setPrazoEntregaDias('')
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const marca = await createMarcaQuick({
        nome,
        fornecedor_id: fornecedorId === 'none' ? null : fornecedorId,
        prazo_entrega_dias: prazoEntregaDias ? Number(prazoEntregaDias) : null,
      })
      toast.success('Marca criada', { description: marca.nome })
      onCreated(marca)
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Falha ao criar marca', { description: error?.message })
    } finally {
      setSaving(false)
    }
  }, [nome, fornecedorId, prazoEntregaDias, onCreated, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Marca</DialogTitle>
          <DialogDescription>
            Cadastro rápido, sem sair da criação de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nome *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Fornecedor</label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.razao_social || f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Prazo de entrega (dias)
            </label>
            <Input
              type="number"
              min="0"
              value={prazoEntregaDias}
              onChange={(e) => setPrazoEntregaDias(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Marca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// SPEC-053: modal simples de criação rápida de fornecedor (contatos.tipo =
// 'fornecedor'), aberto pelo botão "+" ao lado do Select de Fornecedor.
function FornecedorQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (fornecedor: SupplierOption) => void
}) {
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome('')
      setCnpj('')
      setRazaoSocial('')
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const fornecedor = await createFornecedorQuick({
        nome,
        cnpj: cnpj || null,
        razao_social: razaoSocial || null,
      })
      toast.success('Fornecedor criado', { description: fornecedor.nome })
      onCreated(fornecedor)
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Falha ao criar fornecedor', { description: error?.message })
    } finally {
      setSaving(false)
    }
  }, [nome, cnpj, razaoSocial, onCreated, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Cadastro rápido, sem sair da criação de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nome *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Razão Social</label>
            <Input
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">CNPJ</label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Fornecedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProductCreateModal({
  open,
  onOpenChange,
  onSuccess,
  initialName,
}: ProductCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [marcas, setMarcas] = useState<ProductOption[]>([])
  const [categorias, setCategorias] = useState<ProductOption[]>([])
  const [fornecedores, setFornecedores] = useState<SupplierOption[]>([])
  const [marcaModalOpen, setMarcaModalOpen] = useState(false)
  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: '',
      nome: initialName || '',
      marca_id: '',
      categoria_id: '',
      fornecedor_principal_id: 'none',
      unidade: 'UN',
      referencia: '',
      descricao_tecnica: '',
      preco_custo: 0,
      preco_venda: 0,
      valor_venda: 0,
      porc_frete: 0,
      porc_despesas: 0,
      porc_bdi: 0,
      porc_st: 0,
      margem_lucro: 150,
      custo_total: 0,
      ncm: '',
      tipo_fiscal: '',
      cst: '',
      cest: '',
      icms_entrada: 0,
      ipi_entrada: 0,
      mascara_produto: '',
      status_comercial: 'Normal',
    },
  })

  const { watch, setValue, getValues, reset } = form
  const precoCusto = Number(watch('preco_custo')) || 0
  const porcST = Number(watch('porc_st')) || 0
  const ipiEntrada = Number(watch('ipi_entrada')) || 0
  const porcFrete = Number(watch('porc_frete')) || 0
  const margemLucro = Number(watch('margem_lucro')) || 0

  const fornecedorOptions = useMemo(
    () => [{ id: 'none', nome: 'Nenhum', razao_social: null }, ...fornecedores],
    [fornecedores],
  )

  const handleMarcaCreated = useCallback(
    (marca: ProductOption) => {
      setMarcas((prev) =>
        [...prev, marca].sort((a, b) => a.nome.localeCompare(b.nome)),
      )
      setValue('marca_id', marca.id, {
        shouldValidate: true,
        shouldDirty: true,
      })
    },
    [setValue],
  )

  const handleFornecedorCreated = useCallback(
    (fornecedor: SupplierOption) => {
      setFornecedores((prev) =>
        [...prev, fornecedor].sort((a, b) => a.nome.localeCompare(b.nome)),
      )
      setValue('fornecedor_principal_id', fornecedor.id, {
        shouldValidate: true,
        shouldDirty: true,
      })
    },
    [setValue],
  )

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setOptionsLoading(true)
    Promise.all([getProductCatalogOptions(), getNextProductSku()])
      .then(([options, nextSku]) => {
        if (cancelled) return
        setMarcas(options.marcas)
        setCategorias(options.categorias)
        setFornecedores(options.fornecedores)
        reset({
          ...getValues(),
          nome: initialName || '',
          sku: getValues('sku') || nextSku,
          fornecedor_principal_id: 'none',
          unidade: 'UN',
          status_comercial: 'Normal',
        })
      })
      .catch((error: any) => {
        toast.error('Erro ao carregar dados do produto', {
          description: error?.message,
        })
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, initialName, getValues, reset])

  useEffect(() => {
    const bdi = precoCusto * (porcST / 100) + precoCusto * (ipiEntrada / 100)
    const custoTotal = precoCusto + bdi + precoCusto * (porcFrete / 100)
    const precoVenda = custoTotal * (1 + margemLucro / 100)

    const formattedBdi = Number(bdi.toFixed(2))
    const formattedCusto = Number(custoTotal.toFixed(2))
    const formattedVenda = Number(precoVenda.toFixed(2))

    if (getValues('porc_bdi') !== formattedBdi) {
      setValue('porc_bdi', formattedBdi, { shouldValidate: true })
    }
    if (getValues('custo_total') !== formattedCusto) {
      setValue('custo_total', formattedCusto, { shouldValidate: true })
    }
    if (getValues('preco_venda') !== formattedVenda) {
      setValue('preco_venda', formattedVenda, { shouldValidate: true })
    }
    if (getValues('valor_venda') !== formattedVenda) {
      setValue('valor_venda', formattedVenda, { shouldValidate: true })
    }
  }, [
    precoCusto,
    porcST,
    ipiEntrada,
    porcFrete,
    margemLucro,
    getValues,
    setValue,
  ])

  const handleSubmit = useCallback(
    async (values: FormData) => {
      setLoading(true)
      try {
        const product = await createProductFromBudget({
          ...values,
          sku: values.sku?.trim() ? values.sku.trim() : null,
          referencia: values.referencia?.trim() || null,
          descricao_tecnica: values.descricao_tecnica?.trim() || null,
          fornecedor_principal_id:
            values.fornecedor_principal_id === 'none'
              ? null
              : values.fornecedor_principal_id || null,
          ncm: values.ncm?.trim() || null,
          tipo_fiscal: values.tipo_fiscal?.trim() || null,
          cst: values.cst?.trim() || null,
          cest: values.cest?.trim() || null,
          mascara_produto: values.mascara_produto?.trim() || null,
          status_comercial: values.status_comercial || 'Normal',
        })
        toast.success('Produto criado no catálogo', {
          description: product.codigo_produto
            ? `Código gerado: ${product.codigo_produto}`
            : undefined,
        })
        onSuccess(product)
        onOpenChange(false)
      } catch (error: any) {
        toast.error('Falha ao criar produto', { description: error?.message })
      } finally {
        setLoading(false)
      }
    },
    [onOpenChange, onSuccess],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-full max-h-[94vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Criar novo produto
          </DialogTitle>
          <DialogDescription>
            O produto será gravado no cadastro central e poderá ser usado no
            orçamento imediatamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-3">
              <section className="space-y-3">
                <h3 className="border-b pb-1 text-sm font-semibold">
                  Dados básicos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Código *
                    </label>
                    <Input
                      readOnly
                      disabled
                      className="h-8 text-sm bg-slate-100 text-slate-500"
                      value="gerado automaticamente ao salvar"
                    />
                  </div>
                  <TextField
                    control={form.control}
                    name="sku"
                    label="Código de referência"
                  />
                </div>
                <TextField control={form.control} name="nome" label="Nome *" />
                <FormField
                  control={form.control}
                  name="marca_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Marca *</FormLabel>
                      <div className="flex items-center gap-1">
                        <div className="min-w-0 flex-1">
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {marcas.map((marca) => (
                                <SelectItem key={marca.id} value={marca.id}>
                                  {marca.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setMarcaModalOpen(true)}
                          title="Cadastrar nova marca"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Categoria *</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fornecedor_principal_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Fornecedor</FormLabel>
                      <div className="flex items-center gap-1">
                        <div className="min-w-0 flex-1">
                          <Select
                            value={field.value || 'none'}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fornecedorOptions.map((fornecedor) => (
                                <SelectItem
                                  key={fornecedor.id}
                                  value={fornecedor.id}
                                >
                                  {fornecedor.razao_social || fornecedor.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setFornecedorModalOpen(true)}
                          title="Cadastrar novo fornecedor"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    control={form.control}
                    name="unidade"
                    label="Unidade *"
                  />
                  <TextField
                    control={form.control}
                    name="referencia"
                    label="Referência"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="descricao_tecnica"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">
                        Descrição técnica
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-20 text-sm"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-3">
                <h3 className="border-b pb-1 text-sm font-semibold">
                  Custos e preço
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    control={form.control}
                    name="preco_custo"
                    label="Preço custo"
                  />
                  <NumberField
                    control={form.control}
                    name="porc_frete"
                    label="% Frete"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    control={form.control}
                    name="porc_st"
                    label="% ST"
                  />
                  <NumberField
                    control={form.control}
                    name="ipi_entrada"
                    label="% IPI"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    control={form.control}
                    name="margem_lucro"
                    label="% Lucro"
                  />
                  <NumberField
                    control={form.control}
                    name="porc_despesas"
                    label="% Despesas"
                  />
                </div>
                <div className="space-y-2 rounded-md border bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      control={form.control}
                      name="porc_bdi"
                      label="BDI calculado"
                      readOnly
                    />
                    <NumberField
                      control={form.control}
                      name="custo_total"
                      label="Custo total"
                      readOnly
                    />
                  </div>
                  <NumberField
                    control={form.control}
                    name="preco_venda"
                    label="Preço venda"
                    readOnly
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="border-b pb-1 text-sm font-semibold">
                  Fiscal e comercial
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <TextField control={form.control} name="ncm" label="NCM" />
                  <TextField
                    control={form.control}
                    name="tipo_fiscal"
                    label="Tipo fiscal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField control={form.control} name="cst" label="CST" />
                  <TextField control={form.control} name="cest" label="CEST" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    control={form.control}
                    name="icms_entrada"
                    label="% ICMS"
                  />
                  <TextField
                    control={form.control}
                    name="mascara_produto"
                    label="Máscara/família"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status_comercial"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">
                        Status comercial
                      </FormLabel>
                      <Select
                        value={field.value || 'Normal'}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Lançamento">Lançamento</SelectItem>
                          <SelectItem value="Fora de Linha">
                            Fora de Linha
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Produtos criados aqui entram ativos no cadastro central. Dados
                  operacionais de estoque e compra continuam fora deste fluxo.
                </div>
              </section>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || optionsLoading}>
                {loading || optionsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar produto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <MarcaQuickCreateDialog
        open={marcaModalOpen}
        onOpenChange={setMarcaModalOpen}
        fornecedores={fornecedores}
        onCreated={handleMarcaCreated}
      />
      <FornecedorQuickCreateDialog
        open={fornecedorModalOpen}
        onOpenChange={setFornecedorModalOpen}
        onCreated={handleFornecedorCreated}
      />
    </Dialog>
  )
}

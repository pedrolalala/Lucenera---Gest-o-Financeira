import { useCallback, useEffect, useState } from 'react'
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
import {
  createMarcaQuick,
  createProductFromBudget,
  getProductCatalogOptions,
  type ProductCatalogItem,
  type ProductOption,
  type SupplierOption,
} from '@/services/productCatalogService'

// SPEC-158 (P2.2, 2026-09-22): modal simplificado para "Adicionar item sem
// cadastro" dentro do Orçamento. Decisão do usuário: as vendedoras não
// preenchem cadastro completo (quem cadastra de verdade é a Débora, no
// Cadastro -- ver P3.1, "copiar produto", fora deste modal). Campos
// removidos do formulário (categoria, fornecedor, unidade, descrição
// técnica, custo/BDI/frete/ST/IPI/margem, fiscal, status comercial, SKU)
// continuam existindo em `produtos` e a RPC `criar_produto_orcamento`
// aceita todos -- eles só não são mais coletados AQUI. `categoria_id`
// passou a ser opcional na RPC (migration
// 20260923_158b_item_sem_cadastro_simplificado) especificamente para este
// modal parar de exigi-la.
const schema = z.object({
  nome: z.string().trim().min(2, 'Obrigatório'),
  marca_id: z.string().min(1, 'Obrigatório'),
  referencia: z.string().optional(),
  // SPEC-158 (P2.2): antes o campo obrigatório era preço de CUSTO (a venda
  // era calculada e ficava readOnly) -- "as meninas nunca vão saber esse
  // preço de custo... eu prefiro que elas coloquem o preço de venda que
  // elas extraíram do simulador" (Vinícius, 22/09/2026). Agora é o
  // contrário: só preço de venda, digitado direto, sem cálculo nenhum.
  preco_venda: z.coerce.number().min(0.01, 'Informe o preço de venda'),
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

export function ProductCreateModal({
  open,
  onOpenChange,
  onSuccess,
  initialName,
}: ProductCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [marcas, setMarcas] = useState<ProductOption[]>([])
  // SPEC-158 (P2.2): `fornecedores` continua sendo buscado só porque
  // MarcaQuickCreateDialog (criação rápida de marca) tem um seletor próprio
  // de fornecedor da marca -- não tem mais relação com o produto em si
  // (o campo "Fornecedor" do produto foi removido deste modal).
  const [fornecedores, setFornecedores] = useState<SupplierOption[]>([])
  const [marcaModalOpen, setMarcaModalOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initialName || '',
      marca_id: '',
      referencia: '',
      preco_venda: 0,
    },
  })

  const { setValue, getValues, reset } = form

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

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setOptionsLoading(true)
    getProductCatalogOptions()
      .then((options) => {
        if (cancelled) return
        setMarcas(options.marcas)
        setFornecedores(options.fornecedores)
        reset({
          ...getValues(),
          nome: initialName || '',
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

  const handleSubmit = useCallback(
    async (values: FormData) => {
      setLoading(true)
      try {
        // SPEC-158 (P2.2): payload mínimo -- nome/marca/referência/preço de
        // venda vêm do form; o resto (categoria, fornecedor, unidade, custo,
        // fiscal) fica com os defaults da própria RPC
        // (criar_produto_orcamento, migration
        // 20260923_158b_item_sem_cadastro_simplificado).
        const product = await createProductFromBudget({
          nome: values.nome,
          marca_id: values.marca_id,
          referencia: values.referencia?.trim() || null,
          preco_venda: values.preco_venda,
          valor_venda: values.preco_venda,
        })
        toast.success('Item criado', {
          description: product.codigo_produto
            ? `Código gerado: ${product.codigo_produto}`
            : undefined,
        })
        onSuccess(product)
        onOpenChange(false)
      } catch (error: any) {
        toast.error('Falha ao criar item', { description: error?.message })
      } finally {
        setLoading(false)
      }
    },
    [onOpenChange, onSuccess],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* SPEC-158 (P2.2): modal drasticamente simplificado -- era um form de
          3 colunas (dados básicos / custo e preço / fiscal e comercial).
          Decisão do usuário (22/09/2026): as vendedoras não preenchem
          cadastro completo, então o modal fica com só os 4 campos que elas
          de fato usam. Quem cadastra o produto "de verdade" é a Débora, no
          Cadastro (fora deste sistema) -- ver SPEC-158 P3.1 ("copiar
          produto"). */}
      <DialogContent className="max-w-md p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Adicionar item sem cadastro
          </DialogTitle>
          <DialogDescription>
            Cadastro rápido, só o essencial para entrar no orçamento. O
            cadastro completo (fiscal, custo, estoque) é feito depois no
            Cadastro de Produtos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-3 p-5">
              <TextField control={form.control} name="nome" label="Nome *" />
              <TextField
                control={form.control}
                name="referencia"
                label="Referência"
              />
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
              <NumberField
                control={form.control}
                name="preco_venda"
                label="Preço de venda *"
              />
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
                Salvar
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
    </Dialog>
  )
}

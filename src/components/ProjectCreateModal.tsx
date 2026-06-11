import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const STATUS_OPTS = [
  'Estudo Inicial',
  'Proposta Sinal',
  'Elaboração Orçamento',
  'Informações necessárias',
  'Projeto executivo',
  'Entrega materiais',
  'Ajustes finais',
  'Finalizado',
  'Arquivado',
  'Não Fechou',
  'Venda Docusign',
  'Obra Finalizada',
  'Contrato de Projeto',
  'Emissão Projeto Executivo',
]

const schema = z.object({
  codigo: z.string().min(1, 'Obrigatório').max(50, 'Max 50 chars'),
  nome: z.string().min(1, 'Obrigatório'),
  nivel_estrategico: z
    .enum(['1', '2', '3', '4'])
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.string().default('Estudo Inicial'),
  cidade: z.string().max(100).optional().nullable().or(z.literal('')),
  estado: z.string().max(2).optional().nullable().or(z.literal('')),
  cliente_id: z.string().optional().nullable().or(z.literal('')),
  arquiteto_id: z.string().optional().nullable().or(z.literal('')),
  responsavel_id: z.string().optional().nullable().or(z.literal('')),
  responsavel_obra_id: z.string().optional().nullable().or(z.literal('')),
  tipo_projeto: z
    .enum(['Residential', 'Corporativo', 'Exposição Comercial', 'Paisagismo'])
    .optional()
    .nullable()
    .or(z.literal('')),
})

export function ProjectCreateModal({
  open,
  onOpenChange,
  onSuccess,
  clientes,
  arquitetos,
}: any) {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Estudo Inicial' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        status: 'Estudo Inicial',
        codigo: '',
        nome: '',
        nivel_estrategico: '',
        cidade: '',
        estado: '',
        cliente_id: '',
        arquiteto_id: '',
        responsavel_id: '',
        responsavel_obra_id: '',
        tipo_projeto: '',
      })
      supabase
        .from('usuarios')
        .select('id, nome')
        .then(({ data }) => data && setUsuarios(data))
      supabase
        .from('contatos')
        .select('id, nome')
        .then(({ data }) => data && setContatos(data))
    }
  }, [open, form])

  async function onSubmit(val: z.infer<typeof schema>) {
    try {
      setLoading(true)
      const { data: exists } = await supabase
        .from('projetos')
        .select('id')
        .eq('codigo', val.codigo)
        .maybeSingle()
      if (exists)
        return form.setError('codigo', {
          message: 'Este código de projeto já está em uso',
        })

      const { error } = await supabase.from('projetos').insert({
        codigo: val.codigo,
        nome: val.nome,
        nivel_estrategico: val.nivel_estrategico || null,
        status: val.status,
        cidade: val.cidade || null,
        estado: val.estado || null,
        cliente_id: val.cliente_id || null,
        arquiteto_id: val.arquiteto_id || null,
        responsavel_id: val.responsavel_id || null,
        responsavel_obra_id: val.responsavel_obra_id || null,
        area_do_projeto: val.tipo_projeto ? { tipo: val.tipo_projeto } : null,
        historico: [],
      })

      if (error) throw error
      toast.success('Projeto criado com sucesso!')
      onSuccess({ codigo: val.codigo })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_projeto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Projeto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          'Residential',
                          'Corporativo',
                          'Exposição Comercial',
                          'Paisagismo',
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                name="nivel_estrategico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível Estratégico</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['1', '2', '3', '4'].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={usuarios.map((u) => ({
                          value: u.id,
                          label: u.nome,
                        }))}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Buscar..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={clientes.map((c: any) => ({
                          value: c.id,
                          label: c.nome,
                        }))}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Buscar..."
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
                    <FormLabel>Arquiteto</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={arquitetos.map((a: any) => ({
                          value: a.id,
                          label: a.nome,
                        }))}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Buscar..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado (UF)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        maxLength={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsavel_obra_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Obra</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={contatos.map((c) => ({
                          value: c.id,
                          label: c.nome,
                        }))}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Buscar..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Criar Projeto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import AccessDenied from '@/pages/AccessDenied'
import { userService } from '@/services/userService'
import type { Role } from '@/lib/types'

interface ApproverUser {
  id: string
  full_name: string | null
  email: string
  role: Role
  can_approve_quotes: boolean
}

export default function ApprovalSettings() {
  const { role } = useAuth()
  const [users, setUsers] = useState<ApproverUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userService.getAllUsersWithApproval()
      setUsers(data as ApproverUser[])
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggle = async (userId: string, current: boolean) => {
    setUpdatingId(userId)
    try {
      await userService.updateApproveQuotes(userId, !current)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, can_approve_quotes: !current } : u,
        ),
      )
      toast.success(
        !current
          ? 'Permissão de aprovação concedida'
          : 'Permissão de aprovação revogada',
      )
    } catch (error: any) {
      toast.error('Erro ao atualizar permissão', {
        description: error.message,
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (role !== 'admin') {
    return <AccessDenied />
  }

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações de Aprovação
          </h1>
          <p className="text-gray-500">
            Gerencie quais usuários estão autorizados a aprovar orçamentos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Pode Aprovar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-gray-900">
                    {user.full_name || '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell className="text-gray-600 capitalize">
                    {user.role}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={user.can_approve_quotes}
                      onCheckedChange={() =>
                        handleToggle(user.id, user.can_approve_quotes)
                      }
                      disabled={updatingId === user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-400 py-8"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

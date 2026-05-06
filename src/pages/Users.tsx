import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'
import { userService } from '@/services/userService'
import { UserProfile, Role } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function Users() {
  const { role, user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (role === 'admin') {
          const data = await userService.getAllUsers()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Erro ao carregar usuários')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [role])

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await userService.updateUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      )
      toast.success('Função do usuário atualizada com sucesso')
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Erro ao atualizar função')
    }
  }

  if (role !== 'admin') {
    return <AccessDenied />
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gerenciamento de Usuários
        </h1>
        <p className="text-gray-500">
          Gerencie o acesso e permissões dos usuários do sistema.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead>Usuário</TableHead>
                <TableHead>Função Atual</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage
                          src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user.id}`}
                          alt={user.full_name || 'User'}
                        />
                        <AvatarFallback>
                          {(user.full_name || 'U')
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {user.full_name || 'Sem nome'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {user.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : user.role === 'colaborador'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-[180px]">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) =>
                          handleRoleChange(user.id, val as Role)
                        }
                        disabled={user.id === currentUser?.id} // Prevent changing own role to avoid lockout
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="colaborador">
                            Colaborador
                          </SelectItem>
                          <SelectItem value="visitante">Visitante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

import { useAuth } from '@/hooks/use-auth'
import { Navigate, Outlet } from 'react-router-dom'
import AccessDenied from '@/pages/AccessDenied'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute = () => {
  const { session, loading, role, hasAccess } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // SPEC-069: hasAccess === false cobre a matriz de papéis nova (ex.:
  // compras_e_entregas fica SEM ACESSO em orçamentos); role legado
  // visitante/viewer continua bloqueado como já era.
  if (role === 'visitante' || role === 'viewer' || hasAccess === false) {
    return <AccessDenied />
  }

  return <Outlet />
}

import { useAuth } from '@/hooks/use-auth'
import { Navigate, Outlet } from 'react-router-dom'
import AccessDenied from '@/pages/AccessDenied'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute = () => {
  const { session, loading, role } = useAuth()

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

  if (role === 'visitante' || role === 'viewer') {
    return <AccessDenied />
  }

  return <Outlet />
}

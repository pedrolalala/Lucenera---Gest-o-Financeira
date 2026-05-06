import { useAuth } from '@/hooks/use-auth'
import { Navigate, Outlet } from 'react-router-dom'
import AccessDenied from '@/pages/AccessDenied'

export const ProtectedRoute = () => {
  const { session, loading, role } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'visitante') {
    return <AccessDenied />
  }

  return <Outlet />
}

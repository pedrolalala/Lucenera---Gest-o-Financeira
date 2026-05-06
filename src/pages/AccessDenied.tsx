import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function AccessDenied() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Você saiu com sucesso')
      navigate('/login')
    } catch (error) {
      toast.error('Erro ao sair')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FB] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6 animate-fade-in-up">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Acesso Restrito</h1>
          <p className="text-gray-500">
            Você não tem acesso. Solicite para um administrador.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </Button>
      </div>
    </div>
  )
}

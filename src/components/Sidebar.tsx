import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  LifeBuoy,
  Settings,
  LogOut,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  isActive,
  badge,
}: {
  icon: any
  label: string
  to: string
  isActive: boolean
  badge?: string
}) => (
  <Link
    to={to}
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white hover:shadow-sm',
      isActive
        ? 'text-primary font-semibold bg-white shadow-sm'
        : 'text-gray-500',
    )}
  >
    <Icon
      className={cn(
        'w-5 h-5',
        isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
      )}
    />
    <span className="flex-1">{label}</span>
    {badge && (
      <Badge
        variant="secondary"
        className="bg-red-100 text-red-500 hover:bg-red-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
      >
        {badge}
      </Badge>
    )}
  </Link>
)

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { signOut, role } = useAuth()
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

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'colaborador':
        return 'Colaborador'
      case 'visitante':
        return 'Visitante'
      default:
        return ''
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#F8F9FB] border-r border-gray-100 p-6 flex flex-col z-40 hidden md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xl font-display">
          S
        </div>
        <span className="text-2xl font-bold text-gray-900 tracking-tight">
          Finova
        </span>
      </div>

      {/* Menu */}
      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <div>
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          <div className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Início"
              to="/"
              isActive={pathname === '/'}
            />
            <SidebarItem
              icon={Wallet}
              label="Transações"
              to="/payments"
              isActive={pathname === '/payments'}
            />
            {role === 'admin' && (
              <SidebarItem
                icon={Users}
                label="Gerenciar Usuários"
                to="/users"
                isActive={pathname === '/users'}
              />
            )}
          </div>
        </div>

        <div>
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Suporte
          </div>
          <div className="space-y-1">
            <SidebarItem
              icon={LifeBuoy}
              label="Ajuda"
              to="/help"
              isActive={pathname === '/help'}
            />
            <SidebarItem
              icon={Settings}
              label="Configurações"
              to="/settings"
              isActive={pathname === '/settings'}
            />
          </div>
        </div>
      </div>

      {/* Role Indicator & Logout */}
      <div className="mt-auto space-y-2">
        {role && role !== 'visitante' && (
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
              Acesso Atual
            </span>
            <span className="text-sm font-bold text-gray-900">
              {getRoleLabel()}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}

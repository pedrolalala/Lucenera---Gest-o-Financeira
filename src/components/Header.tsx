import { Search, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import logoImg from '@/assets/lucenera-vertical-527dd.png'

export function Header() {
  const { role } = useAuth()
  return (
    <header className="sticky top-0 z-30 w-full bg-[#F8F9FB]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center gap-4 flex-1">
        <Link to="/" className="flex items-center gap-2 mr-4">
          <img
            src={logoImg}
            alt="Lucenera"
            className="h-8 w-auto object-contain"
          />
        </Link>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar..."
              className="pl-10 bg-white border-transparent shadow-sm rounded-full h-11 focus-visible:ring-1 focus-visible:ring-gray-200"
            />
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/approval-settings" title="Configurações de Aprovação">
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>
        </Button>
      )}
    </header>
  )
}

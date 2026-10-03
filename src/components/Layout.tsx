import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { SystemSwitcher } from './SystemSwitcher'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col w-full">
        {/* SPEC-177 (teste 03/10): overflow-x-clip em vez de hidden — hidden
            transforma este div em área de rolagem e a barra de totais
            (sticky bottom) do orçamento nunca grudava no rodapé. */}
        <div className="flex-1 p-4 md:p-6 overflow-x-clip w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <SystemSwitcher currentSlug="orcamentos" />
    </div>
  )
}

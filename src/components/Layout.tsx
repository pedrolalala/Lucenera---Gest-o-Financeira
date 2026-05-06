import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExpandableChat } from '@/components/ui/expandable-chat'

export default function Layout() {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Trigger */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-black text-white p-3 rounded-full shadow-lg">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[300px] border-r-0 bg-transparent"
            >
              <div className="h-full bg-[#F8F9FB]">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Admin Chat Interface */}
      <ExpandableChat />
    </div>
  )
}

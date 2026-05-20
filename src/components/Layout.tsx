import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col w-full">
        <div className="flex-1 p-4 md:p-6 overflow-x-hidden w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

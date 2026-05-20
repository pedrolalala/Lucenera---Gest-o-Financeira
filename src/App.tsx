import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Settings from './pages/Settings'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Users from './pages/Users'
import Budgets from './pages/Budgets'
import BudgetFormPage from './pages/BudgetFormPage'
import { TransactionProvider } from '@/stores/useTransactionStore'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TransactionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/budgets" replace />} />
                <Route
                  path="/home"
                  element={<Navigate to="/budgets" replace />}
                />
                <Route
                  path="/transactions"
                  element={<Navigate to="/budgets" replace />}
                />
                <Route
                  path="/transacoes"
                  element={<Navigate to="/budgets" replace />}
                />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/budgets/new" element={<BudgetFormPage />} />
                <Route path="/budgets/:id" element={<BudgetFormPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </TransactionProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

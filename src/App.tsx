import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { TransactionProvider } from '@/stores/useTransactionStore'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// SPEC-123: code-splitting por rota (mesmo padrão já em produção no RH,
// dashboard-rh-lucenera-5fe9c/src/App.tsx).
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Budgets = lazy(() => import('./pages/Budgets'))
const BudgetFormPage = lazy(() => import('./pages/BudgetFormPage'))
const ApprovalSettings = lazy(() => import('./pages/ApprovalSettings'))
const ClientApproval = lazy(() => import('./pages/ClientApproval'))

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
)

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TransactionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/aprovacao" element={<ClientApproval />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route
                    path="/"
                    element={<Navigate to="/budgets" replace />}
                  />
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
                  <Route
                    path="/approval-settings"
                    element={<ApprovalSettings />}
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </TransactionProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

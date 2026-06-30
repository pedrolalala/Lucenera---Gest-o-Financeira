import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, AlertCircle, Lock, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && session) {
    return <Navigate to="/budgets" replace />
  }

  const getErrorMessage = (error: any): string => {
    if (!error) return 'Ocorreu um erro inesperado.'
    const message = error.message || error.toString()
    if (
      message.includes('Invalid login credentials') ||
      message.includes('invalid_credentials')
    ) {
      return 'Credenciais inválidas. Verifique seu e-mail e senha.'
    }
    if (message.includes('Email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada.'
    }
    if (message.includes('User not found')) {
      return 'Usuário não encontrado. Verifique o e-mail informado.'
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
    return message || 'Erro ao entrar. Verifique suas credenciais.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const { error } = await signIn(email, password)
      if (error) {
        const msg = getErrorMessage(error)
        setErrorMessage(msg)
        toast.error(msg)
      } else {
        toast.success('Login realizado com sucesso!')
        navigate('/budgets')
      }
    } catch (error) {
      const msg = getErrorMessage(error)
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in-up">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Entrar na Lucenera
          </CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMessage('')
                  }}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrorMessage('')
                  }}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
            <div className="text-sm text-center text-gray-500">
              Não tem uma conta?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Cadastrar
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

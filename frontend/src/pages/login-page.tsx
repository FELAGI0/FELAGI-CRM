import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'

import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas'
import { useAuthStore } from '@/features/auth/auth.store'
import { authButtonClassName, authInputClassName } from '@/features/auth/auth-styles'

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, t.auth.unableToSignIn))
    }
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-white">{t.auth.signInTitle}</h1>
        <p className="text-sm text-white/50">{t.auth.signInSubtitle}</p>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email" className="text-white/80">
              {t.auth.email}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className={authInputClassName}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} className="text-red-400" />
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password" className="text-white/80">
              {t.auth.password}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              className={authInputClassName}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} className="text-red-400" />
          </Field>

          <Button type="submit" size="lg" disabled={isSubmitting} className={authButtonClassName}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? t.auth.signingIn : t.auth.signIn}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-white/50">
        {t.auth.noAccount}{' '}
        <Link to="/register" className="font-medium text-white underline-offset-4 hover:underline">
          {t.auth.signUp}
        </Link>
      </p>
    </div>
  )
}
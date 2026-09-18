import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-errors'
import { getErrorMessage, resolveBackendMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'

import { registerSchema, type RegisterFormValues } from '@/features/auth/auth.schemas'
import { useAuthStore } from '@/features/auth/auth.store'
import { authButtonClassName, authInputClassName } from '@/features/auth/auth-styles'

const visibleFields = ['email', 'password'] as const

export const RegisterPage = () => {
  const navigate = useNavigate()
  const registerUser = useAuthStore((state) => state.register)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const message = resolveBackendMessage(error.detail)
        setError('email', { type: 'server', message })
        toast.error(message)
        return
      }

      if (error instanceof ApiError && error.status === 422 && error.fieldErrors) {
        let applied = false
        for (const field of visibleFields) {
          const message = error.fieldErrors[field]
          if (!message) continue
          setError(field, { type: 'server', message: resolveBackendMessage(message) })
          applied = true
        }
        if (applied) {
          toast.error(t.auth.fixHighlightedFields)
          return
        }
      }

      toast.error(getErrorMessage(error, t.auth.unableToRegister))
    }
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-white">{t.auth.signUpTitle}</h1>
        <p className="text-sm text-white/50">{t.auth.signUpSubtitle}</p>
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
              autoComplete="new-password"
              placeholder="••••••••••••"
              aria-invalid={Boolean(errors.password)}
              className={authInputClassName}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} className="text-red-400" />
            <p className="text-xs text-white/40">{t.auth.passwordHint}</p>
          </Field>

          <Button type="submit" size="lg" disabled={isSubmitting} className={authButtonClassName}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? t.auth.signingUp : t.auth.signUp}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-white/50">
        {t.auth.haveAccount}{' '}
        <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  )
}
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-errors'
import { getErrorMessage } from '@/lib/error-message'

import { registerSchema, type RegisterFormValues } from '@/features/auth/auth.schemas'
import { useAuthStore } from '@/features/auth/auth.store'
import { authButtonClassName, authInputClassName } from '@/features/auth/auth-styles'

const PASSWORD_HINT = '12–128 characters, with lowercase, uppercase and a digit'

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
        setError('email', { type: 'server', message: error.detail })
        toast.error('Email already registered')
        return
      }

      if (error instanceof ApiError && error.status === 422 && error.fieldErrors) {
        let applied = false
        for (const field of visibleFields) {
          const message = error.fieldErrors[field]
          if (!message) continue
          setError(field, { type: 'server', message })
          applied = true
        }
        if (applied) {
          toast.error('Please fix the highlighted fields')
          return
        }
      }

      toast.error(getErrorMessage(error, 'Unable to create an account'))
    }
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-white/50">Start managing your pipeline in FELAGI CRM</p>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email" className="text-white/80">
              Email
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
              Password
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
            <p className="text-xs text-white/40">{PASSWORD_HINT}</p>
          </Field>

          <Button type="submit" size="lg" disabled={isSubmitting} className={authButtonClassName}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-white/50">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
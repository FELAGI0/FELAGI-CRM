import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/features/auth/auth.store'
import { useChangePassword, useUpdateMe } from '@/features/profile/profile.queries'
import {
  passwordSchema,
  profileSchema,
  toUserUpdateMe,
  userToProfileForm,
  type PasswordFormValues,
  type ProfileFormValues,
} from '@/features/profile/profile.schemas'
import { useSettingsStore } from '@/features/settings/settings.store'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'

const currencyLabels: Record<Currency, string> = {
  RUB: t.settings.currencyRUB,
  USD: t.settings.currencyUSD,
  EUR: t.settings.currencyEUR,
}

const roleLabels = {
  admin: t.users.roles.admin,
  manager: t.users.roles.manager,
  user: t.users.roles.user,
} as const

const ProfileForm = () => {
  const user = useAuthStore((state) => state.user)
  const updateMe = useUpdateMe()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    // `values` rather than `defaultValues` so the form re-seeds if the cached
    // user changes underneath it, for instance after a session restore.
    values: userToProfileForm(user),
  })

  const onSubmit = async (formValues: ProfileFormValues) => {
    const payload = toUserUpdateMe(formValues, user)
    if (Object.keys(payload).length === 0) {
      toast.success(t.profile.updated)
      return
    }
    try {
      await updateMe.mutateAsync(payload)
      toast.success(t.profile.updated)
    } catch (error) {
      const message = getErrorMessage(error, t.profile.updateFailed)
      // A 409 means the address belongs to someone else, which deserves a
      // clearer message than the raw API detail.
      toast.error(message.includes('already registered') ? t.profile.emailTaken : message)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
      noValidate
      className="mt-3 space-y-4"
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="profile-name">{t.profile.name}</FieldLabel>
          <Input
            id="profile-name"
            placeholder={t.profile.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="profile-email">{t.profile.email}</FieldLabel>
          <Input
            id="profile-email"
            type="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={updateMe.isPending}>
        {updateMe.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {updateMe.isPending ? t.profile.saving : t.profile.save}
      </Button>
    </form>
  )
}

const PasswordForm = () => {
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword.mutateAsync({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      toast.success(t.profile.passwordChanged)
      reset()
    } catch (error) {
      const message = getErrorMessage(error, t.profile.passwordChangeFailed)
      // The API answers 401 for a wrong current password, which is a distinct
      // case from a validation failure.
      toast.error(message.includes('current password') ? t.profile.wrongCurrent : message)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
      noValidate
      className="mt-3 space-y-4"
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.current_password)}>
          <FieldLabel htmlFor="current-password">{t.profile.currentPassword}</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.current_password)}
            {...register('current_password')}
          />
          <FieldError errors={[errors.current_password]} />
        </Field>

        <Field data-invalid={Boolean(errors.new_password)}>
          <FieldLabel htmlFor="new-password">{t.profile.newPassword}</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.new_password)}
            {...register('new_password')}
          />
          {errors.new_password ? (
            <FieldError errors={[errors.new_password]} />
          ) : (
            <p className="text-xs text-text-secondary">{t.profile.passwordHint}</p>
          )}
        </Field>

        <Field data-invalid={Boolean(errors.confirm_password)}>
          <FieldLabel htmlFor="confirm-password">{t.profile.confirmPassword}</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm_password)}
            {...register('confirm_password')}
          />
          <FieldError errors={[errors.confirm_password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {changePassword.isPending ? t.profile.changingPassword : t.profile.changePasswordBtn}
      </Button>
    </form>
  )
}

export const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const currency = useSettingsStore((state) => state.currency)
  const setCurrency = useSettingsStore((state) => state.setCurrency)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.settings.title}</h1>

      <section className="rounded-card border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{t.settings.profile}</h2>
          {user && (
            <span className="text-sm text-text-secondary">
              {t.profile.role}: {roleLabels[user.role]}
            </span>
          )}
        </div>
        {user ? (
          <ProfileForm />
        ) : (
          <p className="mt-2 text-text-secondary">{t.settings.notSignedIn}</p>
        )}
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t.profile.changePasswordSection}</h2>
        <PasswordForm />
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t.settings.currency}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:max-w-xs">
          <Select
            value={currency}
            onValueChange={(value) => {
              if (typeof value === 'string') setCurrency(value as Currency)
            }}
          >
            <SelectTrigger id="settings-currency" className="w-full" aria-label={t.settings.selectCurrency}>
              <SelectValue>
                {(value: unknown) => (typeof value === 'string' ? currencyLabels[value as Currency] : null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {currencyLabels[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-secondary">{t.settings.currencyHint}</p>
        </div>
      </section>

      <Button
        variant="outline"
        onClick={handleLogout}
        className="border-status-lost/30 text-status-lost hover:bg-status-lost/10"
      >
        {t.settings.logout}
      </Button>
    </div>
  )
}
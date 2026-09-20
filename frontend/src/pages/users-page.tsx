import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/common/pagination'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import { useCanManageUsers, useCurrentUserId } from '@/lib/permissions'
import { usePaginationParams } from '@/lib/use-pagination-params'
import type { User } from '@/types/api'

import { UserDialog } from '@/features/users/user-dialog'
import { useUsers } from '@/features/users/users.queries'
import { UsersTable } from '@/features/users/users-table'

export const UsersPage = () => {
  const { limit, offset, setParams } = usePaginationParams()
  const { data, isLoading, isError, error, isFetching } = useUsers({ limit, offset })
  const canManage = useCanManageUsers('manage')
  const currentUserId = useCurrentUserId() ?? ''
  const [createOpen, setCreateOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, t.users.loadFailed))
  }, [isError, error])

  const users = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t.users.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total === 0 ? t.users.empty : t.users.totalLabel(total)}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            {t.users.addUser}
          </Button>
        )}
      </header>

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-status-lost/30 bg-status-lost/8 px-4 py-3 text-sm text-text-primary"
        >
          {t.users.loadFailedHint}
        </div>
      )}

      {!isError && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <UsersTable
            users={users}
            isLoading={isLoading}
            currentUserId={currentUserId}
            onEdit={setUserToEdit}
            onCreateClick={() => setCreateOpen(true)}
          />
          {total > 0 && (
            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              isFetching={isFetching}
              onPageChange={(nextOffset) => setParams({ offset: nextOffset })}
              onLimitChange={(nextLimit) => setParams({ limit: nextLimit, offset: 0 })}
            />
          )}
        </div>
      )}

      <UserDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />

      {userToEdit && (
        <UserDialog
          mode="edit"
          user={userToEdit}
          open
          onOpenChange={(open) => {
            if (!open) setUserToEdit(null)
          }}
        />
      )}
    </div>
  )
}
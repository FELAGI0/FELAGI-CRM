import { MoreHorizontal, Pencil, Trash2, UserCog } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getErrorMessage } from '@/lib/error-message'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Role, User } from '@/types/api'

import { useDeleteUser } from './users.queries'

const COLUMNS = [
  t.users.columns.email,
  t.users.columns.role,
  t.users.columns.status,
  t.users.columns.created,
  t.common.actions,
] as const

const roleLabels: Record<Role, string> = {
  admin: t.users.roles.admin,
  manager: t.users.roles.manager,
  user: t.users.roles.user,
}

/** Admin stands out, manager is neutral, and a plain user is muted. */
const roleClasses: Record<Role, string> = {
  admin: 'border-accent/30 bg-accent-subtle text-accent',
  manager: 'border-status-in-progress/30 bg-status-in-progress/10 text-status-in-progress',
  user: 'border-border bg-surface-hover text-text-secondary',
}

export type UsersTableProps = {
  users: User[]
  isLoading: boolean
  /** The signed-in administrator, who may not edit or delete themselves. */
  currentUserId: string
  onEdit: (user: User) => void
  onCreateClick?: () => void
}

const TableSkeleton = () => (
  <div className="space-y-3 p-5" role="status" aria-label={t.common.loading}>
    {[0, 1, 2, 3, 4].map((row) => (
      <div key={row} className="flex items-center gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ onCreateClick }: { onCreateClick?: () => void }) => (
  <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
    <UserCog className="size-8 text-text-secondary" aria-hidden />
    <div>
      <p className="font-medium text-text-primary">{t.users.empty}</p>
      <p className="mt-1 text-sm text-text-secondary">{t.users.emptyDescription}</p>
    </div>
    {onCreateClick && (
      <Button onClick={onCreateClick} className="mt-1">
        {t.users.addUser}
      </Button>
    )}
  </div>
)

export const UsersTable = ({
  users,
  isLoading,
  currentUserId,
  onEdit,
  onCreateClick,
}: UsersTableProps) => {
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const deleteMutation = useDeleteUser()

  if (isLoading) return <TableSkeleton />
  if (users.length === 0) return <EmptyState onCreateClick={onCreateClick} />

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      await deleteMutation.mutateAsync(userToDelete.id)
      toast.success(t.users.deleted)
    } catch (error) {
      // The API answers 409 when the account still owns records, which deserves
      // its own wording rather than the generic failure message.
      const message = getErrorMessage(error, t.users.deleteFailed)
      toast.error(
        message.toLowerCase().includes('related') ? t.users.relatedRecordsBlocked : message,
      )
    } finally {
      setUserToDelete(null)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            // Self-modification is refused by the API, so the actions are hidden
            // rather than offered and then rejected.
            const canManage = !isSelf

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {user.email}
                    {isSelf && (
                      <span className="rounded-badge bg-accent-subtle px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        {t.users.status.you}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('font-medium', roleClasses[user.role])}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm',
                      user.is_active ? 'text-status-won' : 'text-status-lost',
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        user.is_active ? 'bg-status-won' : 'bg-status-lost',
                      )}
                      aria-hidden
                    />
                    {user.is_active ? t.users.status.active : t.users.status.inactive}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary">{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t.common.actions}: ${user.email}`}
                          />
                        }
                      >
                        <MoreHorizontal aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil />
                          {t.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setUserToDelete(user)}>
                          <Trash2 />
                          {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-text-secondary" title={t.users.selfEditBlocked}>
                      {t.users.selfEditBlocked}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.users.deleteConfirm.title}</DialogTitle>
            <DialogDescription>
              {t.users.deleteConfirm.description(userToDelete?.email ?? '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t.users.deleteConfirm.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.users.deleting : t.users.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
import type { Client } from '@/types/api'

import { ClientDialog } from './client-dialog'
import { useDeleteClient } from './clients.queries'

const COLUMNS = [
  t.clients.columns.name,
  t.clients.columns.email,
  t.clients.columns.company,
  t.clients.columns.phone,
  t.clients.columns.created,
  t.common.actions,
] as const

const ACTIONS_COLUMN = t.common.actions
const EMPTY_CELL = '—'

export type ClientsTableProps = {
  clients: Client[]
  isLoading: boolean
  canManage: boolean
  /** Rendered in the empty state to create the first client. */
  onCreateClick?: () => void
}

const TableSkeleton = () => (
  <div className="space-y-3 p-5" role="status" aria-label={t.common.loading}>
    {[0, 1, 2, 3, 4].map((row) => (
      <div key={row} className="flex items-center gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ onCreateClick }: { onCreateClick?: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <span className="grid size-11 place-items-center rounded-control bg-accent/10 text-accent">
      <UserPlus className="size-5" aria-hidden />
    </span>
    <div>
      <p className="font-medium text-text-primary">{t.clients.empty.title}</p>
      <p className="mt-1 text-sm text-text-secondary">{t.clients.empty.description}</p>
    </div>
    {onCreateClick && (
      <Button onClick={onCreateClick} className="mt-1">
        {t.clients.addClient}
      </Button>
    )}
  </div>
)

export const ClientsTable = ({ clients, isLoading, canManage, onCreateClick }: ClientsTableProps) => {
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const deleteMutation = useDeleteClient()

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      await deleteMutation.mutateAsync(clientToDelete.id)
      toast.success(t.clients.deleted)
    } catch (error) {
      toast.error(getErrorMessage(error, t.clients.deleteFailed))
    } finally {
      setClientToDelete(null)
    }
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (clients.length === 0) {
    return <EmptyState onCreateClick={canManage ? onCreateClick : undefined} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column}
                className={column === ACTIONS_COLUMN ? 'w-16 text-right' : undefined}
              >
                {column === ACTIONS_COLUMN ? <span className="sr-only">{t.common.actions}</span> : column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium text-text-primary">{client.name}</TableCell>
              <TableCell className="text-text-secondary">{client.email ?? EMPTY_CELL}</TableCell>
              <TableCell className="text-text-secondary">{client.company ?? EMPTY_CELL}</TableCell>
              <TableCell className="text-text-secondary">{client.phone ?? EMPTY_CELL}</TableCell>
              <TableCell className="text-text-secondary">{formatDate(client.created_at)}</TableCell>
              <TableCell className="text-right">
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t.common.actions}: ${client.name}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => {
                          // Deferred one tick so the menu can finish closing before
                          // the dialog takes over focus.
                          setTimeout(() => setClientToEdit(client), 0)
                        }}
                      >
                        <Pencil />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setTimeout(() => setClientToDelete(client), 0)
                        }}
                      >
                        <Trash2 />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={clientToDelete !== null} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.clients.deleteConfirm.title}</DialogTitle>
            <DialogDescription>
              {t.clients.deleteConfirm.description(clientToDelete?.name ?? '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClientToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t.clients.deleteConfirm.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.clients.deleting : t.clients.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {clientToEdit && (
        <ClientDialog
          mode="edit"
          client={clientToEdit}
          open
          onOpenChange={(open) => {
            if (!open) setClientToEdit(null)
          }}
        />
      )}
    </>
  )
}
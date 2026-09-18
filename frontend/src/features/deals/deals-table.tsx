import { MoreHorizontal, Pencil, Trash2, BriefcaseBusiness } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/common/status-badge'
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
import { formatAmount, formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Client, Deal } from '@/types/api'

import { DealDialog } from './deal-dialog'
import { useDeleteDeal } from './deals.queries'

const COLUMNS = [
  t.deals.columns.title,
  t.deals.columns.client,
  t.deals.columns.amount,
  t.deals.columns.status,
  t.deals.columns.created,
  t.common.actions,
] as const

const ACTIONS_COLUMN = t.common.actions

export type DealsTableProps = {
  deals: Deal[]
  /** Lookup for rendering each deal's client name. */
  clients: Client[]
  isLoading: boolean
  canManage: boolean
  /** True when filters are active, so the empty state can offer a reset. */
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  onCreateClick?: () => void
}

const TableSkeleton = () => (
  <div className="space-y-3 p-5" role="status" aria-label={t.common.loading}>
    {[0, 1, 2, 3, 4].map((row) => (
      <div key={row} className="flex items-center gap-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
)

const EmptyState = ({
  hasActiveFilters,
  onResetFilters,
  onCreateClick,
}: {
  hasActiveFilters: boolean
  onResetFilters?: () => void
  onCreateClick?: () => void
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <span className="grid size-11 place-items-center rounded-control bg-accent/10 text-accent">
      <BriefcaseBusiness className="size-5" aria-hidden />
    </span>
    <div>
      <p className="font-medium text-text-primary">
        {hasActiveFilters ? t.deals.noMatches.title : t.deals.empty.title}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {hasActiveFilters ? t.deals.noMatches.description : t.deals.empty.description}
      </p>
    </div>
    {hasActiveFilters
      ? onResetFilters && (
          <Button variant="outline" onClick={onResetFilters} className="mt-1">
            {t.filters.resetFilters}
          </Button>
        )
      : onCreateClick && (
          <Button onClick={onCreateClick} className="mt-1">
            {t.deals.addDeal}
          </Button>
        )}
  </div>
)

export const DealsTable = ({
  deals,
  clients,
  isLoading,
  canManage,
  hasActiveFilters = false,
  onResetFilters,
  onCreateClick,
}: DealsTableProps) => {
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null)
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null)
  const deleteMutation = useDeleteDeal()

  const clientNames = new Map(clients.map((client) => [client.id, client.name]))

  const handleDelete = async () => {
    if (!dealToDelete) return
    try {
      await deleteMutation.mutateAsync(dealToDelete.id)
      toast.success(t.deals.deleted)
    } catch (error) {
      toast.error(getErrorMessage(error, t.deals.deleteFailed))
    } finally {
      setDealToDelete(null)
    }
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onCreateClick={canManage ? onCreateClick : undefined}
      />
    )
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
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="font-medium text-text-primary">{deal.title}</TableCell>
              <TableCell className="text-text-secondary">
                {clientNames.get(deal.client_id) ?? t.deals.unknownClient}
              </TableCell>
              <TableCell className="tabular-nums text-text-secondary">
                {formatAmount(deal.amount)}
              </TableCell>
              <TableCell>
                <StatusBadge status={deal.status} kind="deal" />
              </TableCell>
              <TableCell className="text-text-secondary">{formatDate(deal.created_at)}</TableCell>
              <TableCell className="text-right">
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t.common.actions}: ${deal.title}`}
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
                          setTimeout(() => setDealToEdit(deal), 0)
                        }}
                      >
                        <Pencil />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setTimeout(() => setDealToDelete(deal), 0)
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

      <Dialog open={dealToDelete !== null} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.deals.deleteConfirm.title}</DialogTitle>
            <DialogDescription>
              {t.deals.deleteConfirm.description(dealToDelete?.title ?? '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDealToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t.deals.deleteConfirm.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.deals.deleting : t.deals.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dealToEdit && (
        <DealDialog
          mode="edit"
          deal={dealToEdit}
          clients={clients}
          open
          onOpenChange={(open) => {
            if (!open) setDealToEdit(null)
          }}
        />
      )}
    </>
  )
}
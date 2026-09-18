import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/common/pagination'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import { useCan } from '@/lib/permissions'
import { useDealsParams } from '@/lib/use-deals-params'

import { useClients } from '@/features/clients/clients.queries'
import { DealDialog } from '@/features/deals/deal-dialog'
import { DealsFilters } from '@/features/deals/deals-filters'
import { useDeals } from '@/features/deals/deals.queries'
import { DealsTable } from '@/features/deals/deals-table'

export const DealsPage = () => {
  const { limit, offset, status, clientId, setParams } = useDealsParams()
  const { data, isLoading, isError, error, isFetching } = useDeals({
    limit,
    offset,
    ...(status === null ? {} : { status }),
    ...(clientId === null ? {} : { client_id: clientId }),
  })
  // The client selector needs the full list to resolve names and options.
  const clientsQuery = useClients({ limit: 100, offset: 0 })
  const clients = clientsQuery.data?.items ?? []
  const canCreate = useCan('create')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, t.deals.loadFailed))
  }, [isError, error])

  const deals = data?.items ?? []
  const total = data?.total ?? 0
  const hasActiveFilters = status !== null || clientId !== null

  const resetFilters = () => {
    setParams({ status: null, clientId: null, offset: 0 })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t.deals.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total === 0 ? t.deals.empty.title : t.deals.totalLabel(total)}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            {t.deals.addDeal}
          </Button>
        )}
      </header>

      <DealsFilters
        status={status}
        clientId={clientId}
        clients={clients}
        onStatusChange={(next) => setParams({ status: next, offset: 0 })}
        onClientChange={(next) => setParams({ clientId: next, offset: 0 })}
        onReset={resetFilters}
      />

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-status-lost/30 bg-status-lost/8 px-4 py-3 text-sm text-text-primary"
        >
          {t.deals.loadFailedHint}
        </div>
      )}

      {!isError && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <DealsTable
            deals={deals}
            clients={clients}
            isLoading={isLoading || (Boolean(clientId) && clientsQuery.isLoading)}
            canManage={canCreate}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
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

      {canCreate && (
        <DealDialog mode="create" clients={clients} open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  )
}
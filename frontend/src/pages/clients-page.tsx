import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/common/pagination'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import { useCan } from '@/lib/permissions'
import { usePaginationParams } from '@/lib/use-pagination-params'

import { ClientDialog } from '@/features/clients/client-dialog'
import { useClients } from '@/features/clients/clients.queries'
import { ClientsTable } from '@/features/clients/clients-table'

export const ClientsPage = () => {
  const { limit, offset, setParams } = usePaginationParams()
  const { data, isLoading, isError, error, isFetching } = useClients({ limit, offset })
  const canCreate = useCan('create')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, t.clients.loadFailed))
  }, [isError, error])

  const clients = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t.clients.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total === 0 ? t.clients.empty.title : t.clients.totalLabel(total)}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            {t.clients.addClient}
          </Button>
        )}
      </header>

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-status-lost/30 bg-status-lost/8 px-4 py-3 text-sm text-text-primary"
        >
          {t.clients.loadFailedHint}
        </div>
      )}

      {!isError && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <ClientsTable
            clients={clients}
            isLoading={isLoading}
            canManage={canCreate}
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

      {canCreate && <ClientDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  )
}
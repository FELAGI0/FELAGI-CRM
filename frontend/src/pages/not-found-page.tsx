import { Link } from 'react-router-dom'

import { t } from '@/lib/i18n'

export const NotFoundPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
    <Link className="text-accent" to="/dashboard">
      {t.notFound.backToDashboard}
    </Link>
  </div>
)
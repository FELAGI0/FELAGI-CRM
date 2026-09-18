import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="space-y-4"><h1 className="text-2xl font-semibold">Page not found</h1><Link className="text-accent" to="/dashboard">Back to dashboard</Link></div>
)

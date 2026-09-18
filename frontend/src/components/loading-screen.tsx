import { LoaderCircle } from 'lucide-react'

export const LoadingScreen = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-text-secondary">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  </div>
)
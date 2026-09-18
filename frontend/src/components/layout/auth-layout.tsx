import { Outlet } from 'react-router-dom'

export const AuthLayout = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0d0d] p-6 text-white before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(74,123,247,0.35),transparent_45%)]">
    <div className="relative w-full max-w-md rounded-auth-card border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl"><Outlet /></div>
  </div>
)

import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { KeyRound, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import { NAV_BY_ROLE } from '../../lib/nav.js'
import { ROLE_LABEL } from '../../lib/roles.js'
import klsLogo from '../../assets/kls-logo.jpg'

function SidebarContent({ navItems }) {
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-brand-soft px-5 py-4 dark:border-slate-800">
        <div className="rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <img src={klsLogo} alt="Karnataka Law Society" className="h-8 w-8 shrink-0 rounded-md object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">KLS Hostel Portal</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Karnataka Law Society</p>
        </div>
      </div>
      <nav className="space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300'
                }`
              }
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />}
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navItems = NAV_BY_ROLE[user.role] ?? []
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer on every navigation (link click, back/forward,
  // etc.). Adjusted during render rather than via an effect, per React's
  // guidance for resetting state when a prop/route changes.
  const [lastPathname, setLastPathname] = useState(location.pathname)
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMobileNavOpen(false)
  }

  const initials = (user.displayName || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
        <SidebarContent navItems={navItems} />
      </aside>

      {/* Mobile drawer + backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm animate-fade-in md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent navItems={navItems} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="-ml-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </button>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              {initials}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/change-password"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Change password</span>
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

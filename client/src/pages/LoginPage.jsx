import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, ShieldCheck, KeyRound, Send, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/authContext.js'
import * as authApi from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { Input, FormField, PasswordInput } from '../components/ui/FormField.jsx'
import { ErrorBanner } from '../components/ui/Spinner.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { homeFor } from '../lib/roles.js'
import klsLogo from '../assets/kls-logo.jpg'
import klsCampus from '../assets/kls-campus.jpg'

function ForgotPasswordModal({ onClose }) {
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await authApi.forgotPassword(loginId.trim())
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Forgot your password?" onClose={onClose} footer={sent && <Button onClick={onClose}>Done</Button>}>
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span>
            If an account exists for that login ID, it's now flagged for a password reset. Students should
            contact their hostel Rector or Faculty Incharge; staff should contact the Admin office — they can
            issue you a new temporary password.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This portal doesn't send reset emails. Submitting this flags your account so your hostel Rector /
            Faculty Incharge (students) or the Admin office (staff) can issue you a new temporary password.
          </p>
          <FormField label="Login ID" hint="Your email (staff) or USN (students)">
            <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required autoFocus />
          </FormField>
          <ErrorBanner message={error} />
          <Button type="submit" disabled={submitting || !loginId.trim()} className="w-full">
            <Send className="h-4 w-4" strokeWidth={2.25} />
            {submitting ? 'Submitting…' : 'Request password reset'}
          </Button>
        </form>
      )}
    </Modal>
  )
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  if (user) {
    const dest = location.state?.from?.pathname ?? homeFor(user.role)
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const loggedInUser = await login(loginId.trim(), password)
      navigate(location.state?.from?.pathname ?? homeFor(loggedInUser.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="relative flex min-h-svh items-center justify-center bg-slate-900 bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${klsCampus})` }}
    >
      <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <img src={klsLogo} alt="Karnataka Law Society" className="h-11 w-11 rounded-full object-contain" />
          </div>
          <h1 className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-white">
            KLS Hostel Portal
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
            Sign in with your email (staff) or USN (students).
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormField label="Login ID">
              <Input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
                required
              />
            </FormField>
            <FormField label="Password">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </FormField>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <KeyRound className="h-3.5 w-3.5" strokeWidth={2.25} />
                Forgot password?
              </button>
            </div>
            <ErrorBanner message={error} />
            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? (
                'Signing in…'
              ) : (
                <>
                  <LogIn className="h-4 w-4" strokeWidth={2.25} />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
          Secure access · Karnataka Law Society
        </p>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/authContext.js'
import * as authApi from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { FormField, PasswordInput } from '../components/ui/FormField.jsx'
import { ErrorBanner, Spinner } from '../components/ui/Spinner.jsx'
import { homeFor } from '../lib/roles.js'

export default function ChangePasswordPage() {
  const { user, loading, refreshMe } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Wait for the initial auth check before deciding to redirect — on a
  // hard reload `user` starts out null while /auth/me is still in flight,
  // and bailing to /login too early bounces straight back to the
  // dashboard once it resolves (LoginPage redirects logged-in users away).
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  // Forced (temporary password still active) vs. voluntary (opted in from
  // the app header): the forced flow has to be completed, so only the
  // voluntary one gets a way out.
  const forced = user.mustChangePassword

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match')
      return
    }
    setSubmitting(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      const updated = await refreshMe()
      navigate(homeFor(updated.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <KeyRound className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-white">
            {forced ? 'Set a new password' : 'Change your password'}
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
            {forced
              ? "You're using a temporary password — set your own before continuing."
              : 'Enter your current password and choose a new one.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormField label={forced ? 'Current (temporary) password' : 'Current password'}>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </FormField>
            <FormField label="New password" hint="At least 8 characters">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </FormField>
            <FormField label="Confirm new password">
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </FormField>
            <ErrorBanner message={error} />
            <div className="flex gap-2">
              {!forced && (
                <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={submitting} className="flex-1" size="lg">
                {submitting ? 'Saving…' : 'Save password'}
              </Button>
            </div>
          </form>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
          Choose a password only you know
        </p>
      </div>
    </div>
  )
}

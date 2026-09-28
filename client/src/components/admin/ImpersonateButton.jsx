import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import { homeFor } from '../../lib/roles.js'
import { Button } from '../ui/Button.jsx'

// Drop-in "Impersonate" action for any admin user/staff/student row. Signs
// the Admin into the target's own session (see POST /auth/impersonate on
// the server) and lands them on that role's home page.
export function ImpersonateButton({ userId, disabled, title }) {
  const navigate = useNavigate()
  const { impersonate } = useAuth()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setError('')
    setIsPending(true)
    try {
      const user = await impersonate(userId)
      navigate(homeFor(user.role))
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not impersonate this user')
      setIsPending(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="ghost" size="sm" disabled={disabled || isPending} title={title} onClick={handleClick}>
        <LogIn className="h-3.5 w-3.5" strokeWidth={2.25} />
        Impersonate
      </Button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  )
}

import { useEffect, useState } from 'react'

// Returns `value` after it has stopped changing for `delay` ms — so a search
// box fires one query when typing pauses, not one per keystroke.
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

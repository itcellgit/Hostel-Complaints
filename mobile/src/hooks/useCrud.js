import { Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '../api/client'

// Wraps a mutation with cache invalidation + an error alert, and returns a
// `submit(payload, { onDone })` helper for forms.
export function useCrud({ mutationFn, invalidate = [], successMessage }) {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn,
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] }))
    },
    onError: (e) => Alert.alert('Error', apiErrorMessage(e)),
  })
  return {
    ...m,
    submit: (payload, opts = {}) =>
      m.mutate(payload, {
        onSuccess: (data) => {
          if (successMessage) Alert.alert('Done', successMessage)
          opts.onDone?.(data)
        },
      }),
  }
}

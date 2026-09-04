import { useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/resources'

// One place for every complaint mutation, so screens just call e.g.
// actions.comment.mutate(text). All of them refresh the detail + list caches.
export function useComplaintActions(id) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['complaint', id] })
    qc.invalidateQueries({ queryKey: ['complaints'] })
    qc.invalidateQueries({ queryKey: ['student-dashboard'] })
    qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
  }

  return {
    comment: useMutation({ mutationFn: (text) => complaintsApi.comment(id, text), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (comment) => complaintsApi.close(id, comment), onSuccess: invalidate }),
    forward: useMutation({
      mutationFn: ({ role, comment }) => complaintsApi.forward(id, { role, comment }),
      onSuccess: invalidate,
    }),
    setEta: useMutation({
      mutationFn: ({ estimatedCompletionAt, comment }) =>
        complaintsApi.setEta(id, { estimatedCompletionAt, comment }),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ status, resolutionRemarks, file }) =>
        complaintsApi.setStatus(id, { status, resolutionRemarks }, file),
      onSuccess: invalidate,
    }),
  }
}

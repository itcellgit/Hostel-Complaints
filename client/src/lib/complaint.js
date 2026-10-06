// Who is actually working the complaint right now. The facility cell stays the
// owner (assignedTo) while a maintainer does the work, so the maintainer is
// the handler only for that one status.
export function currentHandler(complaint) {
  if (['CLOSED', 'REJECTED'].includes(complaint.status)) return null
  if (complaint.status === 'ASSIGNED_TO_MAINTAINER' && complaint.maintainer) return complaint.maintainer
  return complaint.assignedTo ?? null
}

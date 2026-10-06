// Every role views a complaint under its own route prefix.
export function complaintPathFor(role, id) {
  switch (role) {
    case 'ADMIN':
      return `/admin/complaints/${id}`
    case 'PRINCIPAL':
      return `/principal/complaints/${id}`
    case 'REGISTRAR':
      return `/registrar/complaints/${id}`
    case 'DEAN_INFRA':
      return `/dean/${id}`
    case 'MAINTAINER':
      return `/maintainer/${id}`
    case 'RECTOR':
    case 'FACULTY':
      return `/staff/complaints/${id}`
    case 'STUDENT':
      return `/student/complaints/${id}`
    default:
      return `/cell/${id}`
  }
}

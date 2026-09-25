import { api } from './client'

// Ported from client/src/api/resources.js — identical endpoints. The only
// difference: multipart uploads take a React Native file descriptor
// { uri, name, type } instead of a browser File.
function toRnFile(file) {
  // Accepts an expo-image-picker asset or a plain { uri, name, type }.
  if (!file) return null
  const uri = file.uri
  const name = file.name || file.fileName || uri.split('/').pop() || 'upload.jpg'
  const type = file.type && file.type.includes('/') ? file.type : file.mimeType || 'image/jpeg'
  return { uri, name, type }
}

function buildForm(data, fileField, file) {
  const form = new FormData()
  Object.entries(data || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v))
  })
  const rn = toRnFile(file)
  if (rn) form.append(fileField, rn)
  return form
}

export const collegesApi = {
  list: () => api.get('/colleges').then((r) => r.data.colleges),
  get: (id) => api.get(`/colleges/${id}`).then((r) => r.data.college),
  create: (data) => api.post('/colleges', data).then((r) => r.data.college),
  update: (id, data) => api.patch(`/colleges/${id}`, data).then((r) => r.data.college),
  remove: (id) => api.delete(`/colleges/${id}`),
  listPrograms: (collegeId) => api.get(`/colleges/${collegeId}/programs`).then((r) => r.data.programs),
  createProgram: (collegeId, data) => api.post(`/colleges/${collegeId}/programs`, data).then((r) => r.data.program),
  updateProgram: (id, data) => api.patch(`/programs/${id}`, data).then((r) => r.data.program),
  removeProgram: (id) => api.delete(`/programs/${id}`),
}

export const hostelsApi = {
  list: (params) => api.get('/hostels', { params }).then((r) => r.data.hostels),
  get: (id) => api.get(`/hostels/${id}`).then((r) => r.data.hostel),
  create: (data) => api.post('/hostels', data).then((r) => r.data.hostel),
  update: (id, data) => api.patch(`/hostels/${id}`, data).then((r) => r.data.hostel),
  remove: (id) => api.delete(`/hostels/${id}`),
  linkCollege: (id, collegeId) => api.post(`/hostels/${id}/colleges`, { collegeId }),
  unlinkCollege: (id, collegeId) => api.delete(`/hostels/${id}/colleges/${collegeId}`),
  staff: (id) => api.get(`/hostels/${id}/staff`).then((r) => r.data.assignments),
}

export const staffApi = {
  list: () => api.get('/staff').then((r) => r.data.staff),
  get: (id) => api.get(`/staff/${id}`).then((r) => r.data.staff),
  create: (data) => api.post('/staff', data).then((r) => r.data),
  update: (id, data) => api.patch(`/staff/${id}`, data).then((r) => r.data.staff),
  remove: (id) => api.delete(`/staff/${id}`),
  setStatus: (id, isActive) => api.patch(`/staff/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/staff/${id}/reset-password`).then((r) => r.data.tempPassword),
  addAssignment: (id, data) => api.post(`/staff/${id}/assignments`, data).then((r) => r.data.assignment),
  endAssignment: (assignmentId, endDate) =>
    api.patch(`/staff-assignments/${assignmentId}/end`, { endDate }).then((r) => r.data.assignment),
}

export const studentsApi = {
  list: (params) => api.get('/students', { params }).then((r) => r.data.students),
  // Server paginates only when `page` is present; returns { students, pagination }.
  listPaged: (params) => api.get('/students', { params }).then((r) => r.data),
  me: () => api.get('/students/me').then((r) => r.data),
  dashboard: () => api.get('/students/me/dashboard').then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data),
  create: (data) => api.post('/students', data).then((r) => r.data),
  update: (id, data) => api.patch(`/students/${id}`, data).then((r) => r.data.student),
  remove: (id) => api.delete(`/students/${id}`),
  setStatus: (id, isActive) => api.patch(`/students/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/students/${id}/reset-password`).then((r) => r.data.tempPassword),
  bulkUpload: (file, hostelId) =>
    api.post('/students/bulk-upload', buildForm({ hostelId }, 'file', file)).then((r) => r.data),
  importTemplate: () => api.get('/students/bulk-upload/template').then((r) => r.data.columns),
  feePayments: (id) => api.get(`/students/${id}/fee-payments`).then((r) => r.data.feePayments),
  addFeePayment: (id, data) => api.post(`/students/${id}/fee-payments`, data).then((r) => r.data.feePayment),
}

export const complaintsApi = {
  list: (params) => api.get('/complaints', { params }).then((r) => r.data),
  get: (id) => api.get(`/complaints/${id}`).then((r) => r.data),
  create: (data, file) =>
    file
      ? api.post('/complaints', buildForm(data, 'file', file)).then((r) => r.data.complaint)
      : api.post('/complaints', data).then((r) => r.data.complaint),
  setStatus: (id, data, file) =>
    file
      ? api
          .patch(`/complaints/${id}/status`, buildForm(data, 'resolutionImage', file))
          .then((r) => r.data.complaint)
      : api.patch(`/complaints/${id}/status`, data).then((r) => r.data.complaint),
  forward: (id, data) => api.post(`/complaints/${id}/forward`, data).then((r) => r.data.complaint),
  setEta: (id, data) => api.patch(`/complaints/${id}/eta`, data).then((r) => r.data.complaint),
  close: (id, comment) => api.post(`/complaints/${id}/close`, { comment }).then((r) => r.data.complaint),
  comment: (id, comment) => api.post(`/complaints/${id}/comments`, { comment }).then((r) => r.data.activity),
}

export const usersApi = {
  list: (role) => api.get('/users', { params: role ? { role } : undefined }).then((r) => r.data.users),
  create: (data) => api.post('/users', data).then((r) => r.data),
  update: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data.user),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`).then((r) => r.data.tempPassword),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  hostel: (id) => api.get(`/dashboard/hostel/${id}`).then((r) => r.data),
}

export const hostelResidentRulesApi = {
  list: (hostelId) => api.get('/hostel-resident-rules', { params: { hostelId } }).then((r) => r.data.rules),
  create: (data) => api.post('/hostel-resident-rules', data).then((r) => r.data.rule),
  update: (id, data) => api.patch(`/hostel-resident-rules/${id}`, data).then((r) => r.data.rule),
  remove: (id) => api.delete(`/hostel-resident-rules/${id}`),
}

export const auditLogApi = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
  actions: () => api.get('/audit-logs/actions').then((r) => r.data.actions),
}

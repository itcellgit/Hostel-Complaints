import { api } from './client.js'

// Thin, uniform wrappers around the REST API. Kept in one file since each
// resource follows the same shape — list/get/create/update.

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
  setStatus: (id, isActive) => api.patch(`/staff/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/staff/${id}/reset-password`).then((r) => r.data.tempPassword),
  addAssignment: (id, data) => api.post(`/staff/${id}/assignments`, data).then((r) => r.data.assignment),
  endAssignment: (assignmentId, endDate) =>
    api.patch(`/staff-assignments/${assignmentId}/end`, { endDate }).then((r) => r.data.assignment),
}

export const studentsApi = {
  list: (params) => api.get('/students', { params }).then((r) => r.data.students),
  me: () => api.get('/students/me').then((r) => r.data),
  dashboard: () => api.get('/students/me/dashboard').then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data),
  create: (data) => api.post('/students', data).then((r) => r.data),
  update: (id, data) => api.patch(`/students/${id}`, data).then((r) => r.data.student),
  setStatus: (id, isActive) => api.patch(`/students/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/students/${id}/reset-password`).then((r) => r.data.tempPassword),
  bulkUpload: (file, hostelId) => {
    const form = new FormData()
    form.append('file', file)
    if (hostelId) form.append('hostelId', hostelId)
    return api.post('/students/bulk-upload', form).then((r) => r.data)
  },
  importTemplate: () => api.get('/students/bulk-upload/template').then((r) => r.data.columns),
  feePayments: (id) => api.get(`/students/${id}/fee-payments`).then((r) => r.data.feePayments),
  addFeePayment: (id, data) => api.post(`/students/${id}/fee-payments`, data).then((r) => r.data.feePayment),
}

export const complaintsApi = {
  list: (params) => api.get('/complaints', { params }).then((r) => r.data),
  get: (id) => api.get(`/complaints/${id}`).then((r) => r.data),
  create: (data, file) => {
    if (file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      formData.append('file', file)
      return api.post('/complaints', formData).then((r) => r.data.complaint)
    }
    return api.post('/complaints', data).then((r) => r.data.complaint)
  },
  setStatus: (id, data, file) => {
    if (file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value)
      })
      formData.append('resolutionImage', file)
      return api.patch(`/complaints/${id}/status`, formData).then((r) => r.data.complaint)
    }
    return api.patch(`/complaints/${id}/status`, data).then((r) => r.data.complaint)
  },
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

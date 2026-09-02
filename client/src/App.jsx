import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/authContext.js'
import { homeFor, CELL_ROLES } from './lib/roles.js'
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { Spinner } from './components/ui/Spinner.jsx'
import { DashboardSummary } from './components/dashboard/DashboardSummary.jsx'

import LoginPage from './pages/LoginPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'

import ComplaintListPage from './pages/complaints/ComplaintListPage.jsx'
import ComplaintDetailPage from './pages/complaints/ComplaintDetailPage.jsx'

import AdminCollegesPage from './pages/admin/AdminCollegesPage.jsx'
import AdminCollegeDetailPage from './pages/admin/AdminCollegeDetailPage.jsx'
import AdminHostelsPage from './pages/admin/AdminHostelsPage.jsx'
import AdminHostelDetailPage from './pages/admin/AdminHostelDetailPage.jsx'
import AdminStaffPage from './pages/admin/AdminStaffPage.jsx'
import AdminStaffDetailPage from './pages/admin/AdminStaffDetailPage.jsx'
import AdminStudentsPage from './pages/admin/AdminStudentsPage.jsx'
import AdminStudentDetailPage from './pages/admin/AdminStudentDetailPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'

import PrincipalStudentsPage from './pages/principal/PrincipalStudentsPage.jsx'
import PrincipalStudentDetailPage from './pages/principal/PrincipalStudentDetailPage.jsx'

import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx'
import StaffStudentsPage from './pages/staff/StaffStudentsPage.jsx'
import StaffStudentDetailPage from './pages/staff/StaffStudentDetailPage.jsx'
import StaffNewComplaintPage from './pages/staff/StaffNewComplaintPage.jsx'

import StudentDashboardPage from './pages/student/StudentDashboardPage.jsx'
import StudentProfilePage from './pages/student/StudentProfilePage.jsx'
import StudentGuidePage from './pages/student/StudentGuidePage.jsx'
import StudentFeesPage from './pages/student/StudentFeesPage.jsx'
import NewComplaintPage from './pages/student/NewComplaintPage.jsx'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<DashboardSummary title="Society overview" complaintsBasePath="/admin/complaints" />} />
          <Route path="colleges" element={<AdminCollegesPage />} />
          <Route path="colleges/:id" element={<AdminCollegeDetailPage />} />
          <Route path="hostels" element={<AdminHostelsPage />} />
          <Route path="hostels/:id" element={<AdminHostelDetailPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="staff/:id" element={<AdminStaffDetailPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="students/:id" element={<AdminStudentDetailPage />} />
          <Route path="complaints" element={<ComplaintListPage basePath="/admin/complaints" />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage basePath="/admin/complaints" />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['PRINCIPAL']} />}>
        <Route path="/principal" element={<AppLayout />}>
          <Route index element={<DashboardSummary title="Your college's hostels" complaintsBasePath="/principal/complaints" />} />
          <Route path="students" element={<PrincipalStudentsPage />} />
          <Route path="students/:id" element={<PrincipalStudentDetailPage />} />
          <Route path="complaints" element={<ComplaintListPage basePath="/principal/complaints" />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage basePath="/principal/complaints" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['REGISTRAR']} />}>
        <Route path="/registrar" element={<AppLayout />}>
          <Route index element={<DashboardSummary title="Society-wide hostel analytics" complaintsBasePath="/registrar/complaints" />} />
          <Route path="complaints" element={<ComplaintListPage basePath="/registrar/complaints" />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage basePath="/registrar/complaints" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['DEAN_INFRA']} />}>
        <Route path="/dean" element={<AppLayout />}>
          <Route index element={<ComplaintListPage basePath="/dean" title="Complaint Queue" />} />
          <Route path=":id" element={<ComplaintDetailPage basePath="/dean" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={CELL_ROLES} />}>
        <Route path="/cell" element={<AppLayout />}>
          <Route index element={<ComplaintListPage basePath="/cell" title="Complaint Queue" />} />
          <Route path=":id" element={<ComplaintDetailPage basePath="/cell" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['RECTOR', 'FACULTY']} />}>
        <Route path="/staff" element={<AppLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="students" element={<StaffStudentsPage />} />
          <Route path="students/:id" element={<StaffStudentDetailPage />} />
          <Route path="complaints" element={<ComplaintListPage basePath="/staff/complaints" />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage basePath="/staff/complaints" />} />
          <Route element={<ProtectedRoute roles={['RECTOR']} />}>
            <Route path="complaints/new" element={<StaffNewComplaintPage />} />
          </Route>
        </Route>
      </Route>

<Route element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="guide" element={<StudentGuidePage />} />
          <Route path="fees" element={<StudentFeesPage />} />
          <Route path="complaints" element={<ComplaintListPage basePath="/student/complaints" title="My Complaints" />} />
          <Route path="complaints/new" element={<NewComplaintPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage basePath="/student/complaints" />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

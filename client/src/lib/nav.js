import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  UserCog,
  Users,
  MessageSquareWarning,
  ShieldCheck,
  ClipboardList,
  UserCircle,
  Wallet,
  BookOpen,
  FilePlus2,
  History,
} from 'lucide-react'

export const NAV_BY_ROLE = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/admin/colleges', label: 'Colleges & Programs', icon: GraduationCap },
    { to: '/admin/hostels', label: 'Hostels', icon: Building2 },
    { to: '/admin/staff', label: 'Rectors & Faculty', icon: UserCog },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/admin/users', label: 'Users', icon: ShieldCheck },
    { to: '/admin/audit-log', label: 'Activity Log', icon: History },
  ],
  PRINCIPAL: [
    { to: '/principal', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/principal/students', label: 'Students', icon: Users },
    { to: '/principal/complaints', label: 'Complaints', icon: MessageSquareWarning },
  ],
  REGISTRAR: [
    { to: '/registrar', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/registrar/complaints', label: 'Complaints', icon: MessageSquareWarning },
  ],
  DEAN_INFRA: [
    { to: '/dean', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  EPMC: [
    { to: '/cell', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  ENERGY_CELL: [
    { to: '/cell', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  COMPUTER_CENTER: [
    { to: '/cell', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  PRODUCTION_CELL: [
    { to: '/cell', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  CIVIL_MAINTENANCE: [
    { to: '/cell', label: 'Complaint Queue', end: true, icon: ClipboardList },
  ],
  RECTOR: [
    { to: '/staff', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/staff/students', label: 'Students', icon: Users },
    { to: '/staff/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/staff/complaints/new', label: 'Raise complaint', icon: FilePlus2 },
  ],
  FACULTY: [
    { to: '/staff', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/staff/students', label: 'Students', icon: Users },
    { to: '/staff/complaints', label: 'Complaints', icon: MessageSquareWarning },
  ],
  STUDENT: [
    { to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/student/profile', label: 'My Profile', icon: UserCircle },
    { to: '/student/fees', label: 'Fee History', icon: Wallet },
    { to: '/student/complaints', label: 'My Complaints', icon: MessageSquareWarning },
    { to: '/student/guide', label: 'Student Guide', icon: BookOpen },
  ],
}

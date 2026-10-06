// Which bottom-tabs each role sees. Route names match files under app/(app)/.
// Anything not listed for a role is hidden (href:null) in that role's tab bar
// but still reachable by direct navigation if the API allows it.
import { CELL_ROLES } from './roles'

const ALL = ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'DEAN_INFRA', 'RECTOR', 'FACULTY', 'STUDENT', ...CELL_ROLES, 'MAINTAINER']

export const TABS = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'grid-outline',
    roles: ['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'RECTOR', 'FACULTY', 'STUDENT'],
  },
  {
    name: 'complaints',
    title: 'Complaints',
    icon: 'alert-circle-outline',
    roles: ALL.filter((r) => r !== 'MAINTAINER'),
  },
  {
    name: 'tasks',
    title: 'Tasks',
    icon: 'checkbox-outline',
    roles: ['MAINTAINER'],
  },
  {
    name: 'activity',
    title: 'Activity',
    icon: 'time-outline',
    roles: ['DEAN_INFRA'],
  },
  {
    name: 'students',
    title: 'Students',
    icon: 'people-outline',
    roles: ['ADMIN', 'PRINCIPAL', 'RECTOR', 'FACULTY'],
  },
  {
    name: 'more',
    title: 'More',
    icon: 'ellipsis-horizontal',
    roles: ALL,
  },
]

export function tabsForRole(role) {
  return TABS.filter((t) => t.roles.includes(role)).map((t) => t.name)
}

// "More" screen link list per role — the lower-frequency admin/CRUD areas
// that don't warrant a permanent tab.
export const MORE_LINKS = {
  ADMIN: [
    { href: '/colleges', label: 'Colleges & Programs', icon: 'school-outline' },
    { href: '/hostels', label: 'Hostels', icon: 'business-outline' },
    { href: '/staff', label: 'Rectors & Faculty', icon: 'briefcase-outline' },
    { href: '/users', label: 'Users', icon: 'shield-checkmark-outline' },
    { href: '/audit-log', label: 'Activity Log', icon: 'time-outline' },
  ],
  RECTOR: [{ href: '/rules', label: 'Hostel Rules', icon: 'list-outline' }],
  STUDENT: [
    { href: '/profile', label: 'My Profile', icon: 'person-outline' },
    { href: '/fees', label: 'Fee History', icon: 'wallet-outline' },
    { href: '/guide', label: 'Student Guide', icon: 'book-outline' },
  ],
}

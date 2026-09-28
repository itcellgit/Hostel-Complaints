import { Stack } from 'expo-router'
import { HeaderRight } from '../../src/components/Header'

// Authed stack: the tab bar lives in (tabs), everything else (detail views,
// forms, admin CRUD) is a pushed screen with a header + back button.
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="complaint/[id]" options={{ title: 'Complaint' }} />
      <Stack.Screen name="new-complaint" options={{ title: 'Raise complaint', presentation: 'modal' }} />
      <Stack.Screen name="student/[id]" options={{ title: 'Student' }} />
      <Stack.Screen name="student-form" options={{ title: 'Student' }} />
      <Stack.Screen name="student-bulk-upload" options={{ title: 'Bulk upload' }} />
      <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
      <Stack.Screen name="fees" options={{ title: 'Fee History' }} />
      <Stack.Screen name="guide" options={{ title: 'Student Guide' }} />
      <Stack.Screen name="colleges" options={{ title: 'Colleges & Programs' }} />
      <Stack.Screen name="college/[id]" options={{ title: 'College' }} />
      <Stack.Screen name="hostels" options={{ title: 'Hostels' }} />
      <Stack.Screen name="staff" options={{ title: 'Rectors & Faculty' }} />
      <Stack.Screen name="staff/[id]" options={{ title: 'Staff member' }} />
      <Stack.Screen name="users" options={{ title: 'Users' }} />
      <Stack.Screen name="audit-log" options={{ title: 'Activity Log' }} />
      <Stack.Screen name="rules" options={{ title: 'Hostel Rules' }} />
    </Stack>
  )
}

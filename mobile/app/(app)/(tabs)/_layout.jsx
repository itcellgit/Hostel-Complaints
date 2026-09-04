import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../../src/auth/AuthContext'
import { TABS } from '../../../src/lib/nav'
import { HeaderTitle, HeaderRight } from '../../../src/components/Header'

export default function TabsLayout() {
  const { user } = useAuth()
  const role = user?.role
  const allowed = new Set(TABS.filter((t) => t.roles.includes(role)).map((t) => t.name))

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            href: allowed.has(t.name) ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  )
}

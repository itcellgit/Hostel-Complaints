import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/resources'
import { useAuth } from '../auth/AuthContext'
import { useNotificationLog, markAllRead as markLocalRead } from '../push/notificationLog'

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000

// One list for the header bell: the server inbox (shared with the web bell,
// read state synced) merged with pushes this device received. A push about the
// same complaint within a couple of minutes of an inbox entry is the same event,
// so only the inbox copy is kept.
export function useNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const local = useNotificationLog()
  const key = ['notifications', user?.id]

  const q = useQuery({
    queryKey: key,
    queryFn: notificationsApi.list,
    enabled: !!user && !user.mustChangePassword,
    refetchInterval: 30000,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: key })
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh })
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh })

  const items = useMemo(() => {
    const server = (q.data?.notifications ?? []).map((n) => ({
      key: `s-${n.id}`,
      serverId: n.id,
      title: n.title,
      body: n.body,
      complaintId: n.complaintId,
      at: new Date(n.createdAt).getTime(),
      unread: !n.readAt,
    }))
    const device = local
      .map((n) => ({
        key: `d-${n.id}`,
        title: n.title,
        body: n.body,
        complaintId: n.data?.complaintId ? String(n.data.complaintId) : null,
        at: n.at,
        unread: !n.read,
      }))
      .filter(
        (d) =>
          !d.complaintId ||
          !server.some((s) => s.complaintId === d.complaintId && Math.abs(s.at - d.at) < DUPLICATE_WINDOW_MS),
      )
    return [...server, ...device].sort((a, b) => b.at - a.at)
  }, [q.data, local])

  return {
    items,
    unreadCount: items.filter((n) => n.unread).length,
    query: q,
    markRead: (n) => {
      if (n.serverId && n.unread) markRead.mutate(n.serverId)
    },
    markAllRead: () => {
      markLocalRead()
      if ((q.data?.unreadCount ?? 0) > 0) markAll.mutate()
    },
  }
}

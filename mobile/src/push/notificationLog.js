import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// A local, per-device history of notifications this install has received.
// Push delivery itself is OS-level; this just keeps a list the user can open
// from the header bell. Capped at 50 entries.
const KEY = 'hcp_notification_log'
const MAX = 50

let cache = null
const subs = new Set()

async function load() {
  if (cache) return cache
  try {
    cache = JSON.parse(await AsyncStorage.getItem(KEY)) || []
  } catch {
    cache = []
  }
  return cache
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // non-fatal
  }
}

function emit() {
  subs.forEach((fn) => fn(cache))
}

export function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export async function getAll() {
  return load()
}

export async function addEntry({ id, title, body, data }) {
  await load()
  if (id && cache.some((n) => n.id === id)) return
  cache = [
    { id: id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: title || 'Notification', body: body || '', data: data || {}, at: Date.now(), read: false },
    ...cache,
  ].slice(0, MAX)
  await persist()
  emit()
}

export async function markAllRead() {
  await load()
  if (!cache.some((n) => !n.read)) return
  cache = cache.map((n) => ({ ...n, read: true }))
  await persist()
  emit()
}

export async function clearAll() {
  cache = []
  await persist()
  emit()
}

export function unreadCount(list) {
  return (list ?? cache ?? []).filter((n) => !n.read).length
}

// React binding: current list, kept in sync with the store.
export function useNotificationLog() {
  const [list, setList] = useState(cache ?? [])
  useEffect(() => {
    let alive = true
    getAll().then((l) => alive && setList([...l]))
    return subscribe((l) => setList([...l]))
  }, [])
  return list
}

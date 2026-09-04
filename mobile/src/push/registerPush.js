import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from '../api/client'
import { addEntry } from './notificationLog'

// Remote push needs a development/production build. In Expo Go on Android
// (SDK 53+) merely *importing* expo-notifications throws, so we must not
// import it at module scope — everything below lazy-requires it and bails
// out cleanly when it isn't usable.

const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient'

let registeredToken = null
let handlerSet = false

function loadNotifications() {
  if (isExpoGo) return null
  try {
    // eslint-disable-next-line global-require
    const Notifications = require('expo-notifications')
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      })
      handlerSet = true
    }
    return Notifications
  } catch {
    return null
  }
}

export async function registerForPush() {
  const Notifications = loadNotifications()
  if (!Notifications) return null
  try {
    // eslint-disable-next-line global-require
    const Device = require('expo-device')
    if (!Device.isDevice) return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      })
    }

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status
    if (status !== 'granted') return null

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    const token = tokenResponse.data
    if (!token || token === registeredToken) return token

    await api.post('/devices', { token, platform: Platform.OS })
    registeredToken = token
    return token
  } catch (err) {
    console.warn('push: registration skipped —', err?.message || err)
    return null
  }
}

export async function unregisterPush() {
  try {
    if (registeredToken) await api.delete(`/devices/${encodeURIComponent(registeredToken)}`)
  } catch {
    // server also prunes dead tokens on send
  } finally {
    registeredToken = null
  }
}

function logNotification(notification) {
  const c = notification.request?.content ?? {}
  addEntry({
    id: notification.request?.identifier,
    title: c.title,
    body: c.body,
    data: c.data,
  })
}

// Records incoming notifications to the local log and routes taps to a
// navigation callback. Returns an unsubscribe fn (no-op where notifications
// aren't available, e.g. Expo Go on Android).
export function attachNotifications(onOpenComplaint) {
  const Notifications = loadNotifications()
  if (!Notifications) return () => {}
  try {
    const received = Notifications.addNotificationReceivedListener(logNotification)
    const response = Notifications.addNotificationResponseReceivedListener((r) => {
      logNotification(r.notification)
      const data = r.notification.request?.content?.data
      if (data?.type === 'complaint' && data?.complaintId) {
        onOpenComplaint(String(data.complaintId))
      }
    })
    return () => {
      received.remove()
      response.remove()
    }
  } catch {
    return () => {}
  }
}

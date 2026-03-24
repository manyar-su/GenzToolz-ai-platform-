import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning'
  read: boolean
  createdAt: number
}

interface NotificationState {
  notifications: Notification[]
  add: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      add: (n) =>
        set(s => ({
          notifications: [
            { ...n, id: Math.random().toString(36).slice(2), read: false, createdAt: Date.now() },
            ...s.notifications.slice(0, 49), // max 50
          ],
        })),
      markRead: (id) =>
        set(s => ({
          notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        })),
      markAllRead: () =>
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      remove: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
      unreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    { name: 'genztools-notifications' }
  )
)

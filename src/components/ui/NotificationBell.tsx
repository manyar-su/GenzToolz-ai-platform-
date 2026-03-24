import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useNotificationStore } from '../../store/useNotificationStore'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, markRead, markAllRead, remove, unreadCount } = useNotificationStore()
  const count = unreadCount()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeColor = (type: string) => {
    if (type === 'success') return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    if (type === 'warning') return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile: full-width centered overlay */}
          <div className="fixed inset-x-0 top-16 z-50 px-3 sm:hidden">
            <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
                <span className="font-semibold text-gray-900 dark:text-white">Notifikasi</span>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      <CheckCheck className="h-3.5 w-3.5" /> Tandai semua
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">Belum ada notifikasi</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => markRead(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${typeColor(n.type)}`}>
                        {n.type === 'success' ? '✓' : n.type === 'warning' ? '!' : 'i'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); remove(n.id) }} className="flex-shrink-0 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Desktop: dropdown anchored right */}
          <div className="absolute right-0 top-12 z-50 hidden w-80 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:block">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <span className="font-semibold text-gray-900 dark:text-white">Notifikasi</span>
              {count > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Tandai semua
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Belum ada notifikasi</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${typeColor(n.type)}`}>
                      {n.type === 'success' ? '✓' : n.type === 'warning' ? '!' : 'i'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); remove(n.id) }} className="flex-shrink-0 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

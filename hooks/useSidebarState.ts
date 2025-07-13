import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'sidebarOpen'

export function useSidebarState(defaultOpen: boolean = true) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(defaultOpen)

  // initialize from localStorage or screen width
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setSidebarOpen(stored === 'true')
    } else {
      setSidebarOpen(window.innerWidth > 768)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, sidebarOpen.toString())
  }, [sidebarOpen])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  return { sidebarOpen, toggleSidebar }
}

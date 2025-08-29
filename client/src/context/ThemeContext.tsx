import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getSettings } from '../services/settings.service'
import { useAuth } from './AuthContext'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  loading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadTheme()
  }, [user])

  useEffect(() => {
    // Apply theme to document and body
    document.documentElement.setAttribute('data-bs-theme', theme)
    
    // Apply theme to body for comprehensive styling
    if (theme === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    }
    
    // Set body background and text colors
    document.body.style.backgroundColor = theme === 'dark' ? '#111827' : '#F9FAFB'
    document.body.style.color = theme === 'dark' ? '#F9FAFB' : '#374151'
  }, [theme])

  const loadTheme = async () => {
    try {
      // Only try to load settings if user is admin (purok leaders don't have access)
      if (user?.role === 'admin') {
        const response = await getSettings()
        if (response.success && response.data.system_preferences?.theme) {
          setThemeState(response.data.system_preferences.theme)
        }
      } else {
        // For purok leaders, use default light theme
        setThemeState('light')
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error)
      // Fallback to light theme on error
      setThemeState('light')
    } finally {
      setLoading(false)
    }
  }

  const setTheme = (newTheme: Theme) => {
    // Only allow theme changes for admin users
    if (user?.role === 'admin') {
      setThemeState(newTheme)
    } else {
      console.warn('Theme changes are only available for admin users')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

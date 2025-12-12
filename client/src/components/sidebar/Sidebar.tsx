import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from 'react-bootstrap'
import { sidebarMenu, type MenuItem } from '../../config/sidebarMenu'

/**
 * Sidebar Component - Single Source of Truth for Navigation UI
 * 
 * This is the ONLY sidebar component in the entire application.
 * It imports menu configuration from config/sidebarMenu.ts
 * 
 * Features:
 * - Auto-expands menus when child is active
 * - Role-based menu filtering
 * - Consistent styling and behavior
 * - Single source of truth for all navigation
 */
export default function Sidebar() {
  const { user, logout } = useAuth()
  
  // Auto-expand menus if any child is active
  const getInitialExpandedMenus = (): Set<string> => {
    const expanded = new Set<string>()
    const currentPath = window.location.pathname
    
    sidebarMenu.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.to === currentPath)
        if (hasActiveChild) {
          expanded.add(item.label)
        }
      }
    })
    return expanded
  }
  
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(getInitialExpandedMenus())

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel)
      } else {
        newSet.add(menuLabel)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Logout failed
    }
  }


  // Filter menu items based on user role
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // If item has roles restriction, check user role
        if (item.roles && user?.role) {
          return item.roles.includes(user.role)
        }
        return true
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: filterMenuItems(item.children),
          }
        }
        return item
      })
      .filter((item) => {
        // Remove parent items if they have no visible children
        if (item.children && item.children.length === 0) {
          return false
        }
        return true
      })
  }

  const visibleMenuItems = filterMenuItems(sidebarMenu)

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedMenus.has(item.label)
    const hasChildren = item.children && item.children.length > 0
    const Icon = item.icon

    // Check if any child is active
    const isChildActive = hasChildren
      ? item.children?.some((child) => {
          if (child.to) {
            return window.location.pathname === child.to
          }
          return false
        })
      : false

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={`w-100 d-flex align-items-center justify-content-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 border-0 bg-transparent text-decoration-none ${
              isChildActive
                ? 'bg-blue-50'
                : 'text-neutral-700'
            }`}
            style={{
              paddingLeft: `${0.75 + level * 0.75}rem`,
              color: isChildActive ? '#2563EB' : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isChildActive) {
                e.currentTarget.style.backgroundColor = '#F3F4F6'
                e.currentTarget.style.color = '#2563EB'
              }
            }}
            onMouseLeave={(e) => {
              if (!isChildActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#374151'
              }
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown size={16} className="flex-shrink-0" />
            ) : (
              <ChevronRight size={16} className="flex-shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    // Regular menu item (no children)
    return (
      <NavLink
        key={item.label}
        to={item.to || '#'}
        className={({ isActive }) =>
          `d-flex align-items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-decoration-none ${
            isActive
              ? 'bg-blue-50'
              : 'text-neutral-700'
          }`
        }
        style={({ isActive }) => ({
          paddingLeft: `${0.75 + level * 0.75}rem`,
          borderRight: isActive ? '2px solid #2563EB' : undefined,
          color: isActive ? '#2563EB' : undefined,
        })}
        end
      >
        <Icon size={18} className="flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  return (
    <nav className="sidebar-fixed flex flex-col bg-white border-r border-neutral-200 shadow-sm p-4 d-none d-lg-flex">
      {/* Logo/Brand */}
      <div className="mb-8">
        <Link to="/dashboard" className="text-decoration-none">
          <h1 className="h4 mb-0" style={{ color: '#2563EB', fontWeight: 'bold' }}>
            🏘️ HMMS
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Barangay Management</p>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {visibleMenuItems.map((item) => renderMenuItem(item))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        {user?.role === 'admin' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `d-flex align-items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 mb-2 text-decoration-none ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-blue-600'
              }`
            }
          >
            <Settings size={18} className="flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        )}
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleLogout}
          className="w-100 d-flex align-items-center justify-content-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </nav>
  )
}


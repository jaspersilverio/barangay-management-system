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
  
  // Auto-expand menus if any child is active (recursive check for nested children)
  const getInitialExpandedMenus = (): Set<string> => {
    const expanded = new Set<string>()
    const currentPath = window.location.pathname
    
    const checkItem = (item: MenuItem, parentLabels: string[] = []): boolean => {
      // Check if this item's route matches
      if (item.to === currentPath) {
        parentLabels.forEach(label => expanded.add(label))
        return true
      }
      
      // Check children recursively
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) => 
          checkItem(child, item.isGroup ? parentLabels : [...parentLabels, item.label])
        )
        
        if (hasActiveChild) {
          // Add all parent labels to expanded set
          parentLabels.forEach(label => expanded.add(label))
          if (!item.isGroup) {
            expanded.add(item.label)
          }
          return true
        }
      }
      
      return false
    }
    
    sidebarMenu.forEach((item) => {
      if (item.children) {
        checkItem(item, [item.label])
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

  // Recursively check if any nested child is active
  const isAnyChildActive = (item: MenuItem): boolean => {
    if (item.to && window.location.pathname === item.to) {
      return true
    }
    if (item.children && item.children.length > 0) {
      return item.children.some(child => isAnyChildActive(child))
    }
    return false
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedMenus.has(item.label)
    const hasChildren = item.children && item.children.length > 0
    const Icon = item.icon
    const isGroup = item.isGroup === true
    const hasActiveChild = hasChildren ? isAnyChildActive(item) : false

    // Render group label (non-clickable, muted style)
    if (isGroup && hasChildren) {
      const groupHasActiveChild = hasActiveChild
      return (
        <div key={item.label} className="mb-1">
          <div
            className={`px-4 py-2 text-xs uppercase tracking-wider ${
              groupHasActiveChild 
                ? 'font-bold text-blue-600' 
                : 'font-semibold text-neutral-500'
            }`}
            style={{
              paddingLeft: `${0.75 + level * 0.75}rem`,
              marginTop: level > 0 ? '0.5rem' : '0',
              marginBottom: '0.25rem',
            }}
          >
            {item.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        </div>
      )
    }

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={`w-100 d-flex align-items-center justify-content-between px-4 py-3 text-sm rounded-lg transition-colors duration-200 border-0 text-decoration-none ${
              hasActiveChild
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'bg-transparent text-neutral-700 font-medium'
            }`}
            style={{
              paddingLeft: `${0.75 + level * 0.75}rem`,
              borderLeft: hasActiveChild ? '3px solid #2563EB' : undefined,
            }}
            onMouseEnter={(e) => {
              if (!hasActiveChild) {
                e.currentTarget.style.backgroundColor = '#F3F4F6'
                e.currentTarget.style.color = '#2563EB'
              }
            }}
            onMouseLeave={(e) => {
              if (!hasActiveChild) {
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
          `d-flex align-items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors duration-200 text-decoration-none ${
            isActive
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'bg-transparent text-neutral-700 font-medium hover:bg-neutral-100 hover:text-blue-600'
          }`
        }
        style={({ isActive }) => ({
          paddingLeft: `${0.75 + level * 0.75}rem`,
          borderLeft: isActive ? '4px solid #2563EB' : undefined,
        })}
        end
      >
        <Icon size={18} className="flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  return (
    <nav className="sidebar-fixed flex flex-col bg-white border-r border-neutral-200 shadow-sm d-none d-lg-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Logo/Brand - Fixed at top */}
      <div className="p-4 pb-0 flex-shrink-0">
        <Link to="/dashboard" className="text-decoration-none">
          <h1 className="h4 mb-0" style={{ color: '#2563EB', fontWeight: 'bold' }}>
            🏘️ HMMS
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Barangay Management</p>
        </Link>
      </div>

      {/* Menu Items - Scrollable */}
      <div 
        className="flex-1 px-4 py-4 sidebar-menu-scrollable" 
        style={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.25rem',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {visibleMenuItems.map((item) => renderMenuItem(item))}
      </div>

      {/* Bottom Actions - Fixed at bottom */}
      <div className="p-4 pt-0 flex-shrink-0 border-t border-neutral-200">
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


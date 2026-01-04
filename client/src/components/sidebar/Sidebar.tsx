import { NavLink, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  LogOut,
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
      // For Settings, match if path starts with /settings (handles query params)
      const matches = item.to === '/settings'
        ? currentPath.startsWith('/settings')
        : item.to === currentPath
      if (matches) {
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

  // Get all top-level menu labels that have children (memoized for performance)
  const topLevelMenuLabels = useMemo(() => {
    const topLevelLabels = new Set<string>()
    sidebarMenu.forEach((item) => {
      if (item.children && item.children.length > 0) {
        topLevelLabels.add(item.label)
      }
    })
    return topLevelLabels
  }, [])

  // Close all open top-level submenus
  const closeAllSubmenus = () => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      // Remove all top-level menu labels from expanded set
      topLevelMenuLabels.forEach((label) => {
        newSet.delete(label)
      })
      return newSet
    })
  }

  const toggleMenu = (menuLabel: string, level: number) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      const isTopLevel = level === 0 && topLevelMenuLabels.has(menuLabel)
      const isCurrentlyExpanded = newSet.has(menuLabel)
      
      if (isTopLevel) {
        // For top-level menus: close all other top-level menus first
        if (isCurrentlyExpanded) {
          // If already open, just close it
          newSet.delete(menuLabel)
        } else {
          // Close all other top-level menus
          topLevelMenuLabels.forEach((label) => {
            if (label !== menuLabel) {
              newSet.delete(label)
            }
          })
          // Open the clicked menu
          newSet.add(menuLabel)
        }
      } else {
        // For nested menus: simple toggle (they can coexist with their parent)
        if (isCurrentlyExpanded) {
          newSet.delete(menuLabel)
        } else {
          newSet.add(menuLabel)
        }
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
  // Get current path without query parameters for route matching
  const currentPath = window.location.pathname

  // Recursively check if any nested child is active
  const isAnyChildActive = (item: MenuItem): boolean => {
    if (item.to) {
      // For Settings, match if path starts with /settings (handles query params)
      if (item.to === '/settings') {
        return currentPath.startsWith('/settings')
      }
      if (currentPath === item.to) {
        return true
      }
    }
    if (item.children && item.children.length > 0) {
      return item.children.some(child => isAnyChildActive(child))
    }
    return false
  }

  // Find the active parent section (top-level menu that contains the active page)
  const findActiveParent = (items: MenuItem[], level: number = 0): string | null => {
    for (const item of items) {
      if (isAnyChildActive(item) && item.children && item.children.length > 0) {
        // If this is top-level (level 0), return it
        if (level === 0) {
          return item.label
        }
      }
      if (item.children) {
        const found = findActiveParent(item.children, level + 1)
        if (found && level === 0) {
          // If found in children and we're at top level, this is the active parent
          return item.label
        } else if (found) {
          return found
        }
      }
    }
    return null
  }

  const activeParentLabel = findActiveParent(visibleMenuItems, 0)

  const renderMenuItem = (item: MenuItem, level: number = 0, parentItem?: MenuItem, isUnderActiveParentTree: boolean = false, isParentExpanded: boolean = false) => {
    const isExpanded = expandedMenus.has(item.label)
    const hasChildren = item.children && item.children.length > 0
    const Icon = item.icon
    const isGroup = item.isGroup === true
    const hasActiveChild = hasChildren ? isAnyChildActive(item) : false
    // Check if item is directly active
    // For Settings, match if path starts with /settings (handles query params)
    const isDirectlyActive = item.to === '/settings' 
      ? currentPath.startsWith('/settings')
      : item.to === currentPath
    const isTopLevelParent = level === 0 && hasChildren
    const isActiveTopLevelParent = isTopLevelParent && activeParentLabel === item.label
    
    // Determine if this item should be highlighted
    // 1. If it's the active top-level parent (has active child page)
    // 2. If it's a top-level parent that is expanded (clicked/opened)
    const isTopLevelExpanded = isTopLevelParent && isExpanded
    const shouldHighlightParent = isActiveTopLevelParent || isTopLevelExpanded
    
    // Determine if this item is under the active/expanded parent tree
    // This flag is passed down from parent to child, and set to true when:
    // 1. We're rendering the active top-level parent itself
    // 2. We're rendering a child of an expanded top-level parent
    // 3. We're rendering a child of the active top-level parent (or any descendant)
    let isUnderActiveTree = isUnderActiveParentTree || isParentExpanded
    if (level === 0 && shouldHighlightParent) {
      // This is the active/expanded top-level parent itself
      isUnderActiveTree = true
    } else if (level > 0) {
      // For submenu items, check if parent is expanded or active
      if (isParentExpanded) {
        // Parent is expanded - highlight all children
        isUnderActiveTree = true
      } else if (isUnderActiveParentTree) {
        // Already marked as under active tree (passed from parent)
        isUnderActiveTree = true
      } else if (activeParentLabel && parentItem && parentItem.label === activeParentLabel) {
        // Direct child of active parent
        isUnderActiveTree = true
      }
    }

    // Render group label (non-clickable, muted style)
    if (isGroup && hasChildren) {
      const groupHasActiveChild = hasActiveChild
      return (
        <div key={item.label} className="mb-1">
          <div
            className={`px-4 py-2 uppercase tracking-wider ${
              groupHasActiveChild 
                ? 'font-bold text-blue-600 text-xs' 
                : isUnderActiveTree
                ? 'font-semibold text-blue-500 text-xs'
                : 'font-semibold text-neutral-500 text-xs'
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
            {item.children?.map((child) => renderMenuItem(child, level + 1, item, isUnderActiveTree, isExpanded))}
          </div>
        </div>
      )
    }

    if (hasChildren) {
      // Determine styling based on hierarchy
      let parentStyles = ''
      let parentInlineStyles: React.CSSProperties = {
        paddingLeft: `${0.75 + level * 0.75}rem`,
      }
      let iconSize = 18
      let fontSize = 'text-sm'

      if (isActiveTopLevelParent) {
        // Top-level parent with active child - STRONGEST highlight
        parentStyles = 'bg-blue-100 text-blue-700 font-bold'
        parentInlineStyles.borderLeft = '4px solid #2563EB'
        iconSize = 20
        fontSize = 'text-base'
      } else if (isTopLevelExpanded) {
        // Top-level parent that is expanded (clicked) - Strong highlight
        parentStyles = 'bg-blue-50 text-blue-600 font-semibold'
        parentInlineStyles.borderLeft = '3px solid #2563EB'
        iconSize = 19
        fontSize = 'text-sm'
      } else if (hasActiveChild && level > 0) {
        // Nested parent with active child - Medium highlight
        parentStyles = 'bg-blue-50 text-blue-600 font-semibold'
        parentInlineStyles.borderLeft = '3px solid #2563EB'
        fontSize = 'text-sm'
      } else if (hasActiveChild) {
        // Top-level parent with active child (but not the main active parent) - Medium highlight
        parentStyles = 'bg-blue-50 text-blue-600 font-semibold'
        parentInlineStyles.borderLeft = '3px solid #2563EB'
        fontSize = 'text-sm'
      } else {
        parentStyles = 'bg-transparent text-neutral-700 font-medium'
        fontSize = level === 0 ? 'text-sm' : 'text-sm'
      }

      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleMenu(item.label, level)}
            className={`w-100 d-flex align-items-center justify-content-between px-4 py-3 ${fontSize} rounded-lg transition-colors duration-200 border-0 text-decoration-none ${parentStyles}`}
            style={parentInlineStyles}
            onMouseEnter={(e) => {
              if (!hasActiveChild && !isActiveTopLevelParent && !isTopLevelExpanded) {
                e.currentTarget.style.backgroundColor = '#F3F4F6'
                e.currentTarget.style.color = '#2563EB'
              }
            }}
            onMouseLeave={(e) => {
              if (!hasActiveChild && !isActiveTopLevelParent && !isTopLevelExpanded) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#374151'
              }
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <Icon size={iconSize} className="flex-shrink-0" />
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
              {item.children?.map((child) => renderMenuItem(child, level + 1, item, isActiveTopLevelParent || isUnderActiveTree, isExpanded))}
            </div>
          )}
        </div>
      )
    }

    // Regular menu item (no children)
    const isSubmenuItem = level > 0
    
    let itemStyles = ''
    let itemInlineStyles: React.CSSProperties = {
      paddingLeft: `${0.75 + level * 0.75}rem`,
    }
    let iconSize = 18
    let fontSize = 'text-sm'

    if (isDirectlyActive) {
      // Currently active page - STRONGEST emphasis
      itemStyles = 'bg-blue-100 text-blue-700 font-bold'
      itemInlineStyles.borderLeft = '4px solid #2563EB'
      iconSize = 18
      fontSize = 'text-sm'
    } else if (isUnderActiveTree && isSubmenuItem) {
      // Submenu item under active/expanded parent - Subtle highlight
      itemStyles = 'bg-blue-50/50 text-blue-600 font-medium'
      itemInlineStyles.borderLeft = '2px solid #93C5FD'
      fontSize = 'text-sm'
    } else {
      itemStyles = 'bg-transparent text-neutral-700 font-medium hover:bg-neutral-100 hover:text-blue-600'
      fontSize = 'text-sm'
    }

    return (
      <NavLink
        key={item.label}
        to={item.to || '#'}
        onClick={closeAllSubmenus}
        className={({ isActive }) =>
          `d-flex align-items-center gap-3 px-4 py-3 ${fontSize} rounded-lg transition-colors duration-200 text-decoration-none ${
            isActive
              ? itemStyles
              : isUnderActiveTree && isSubmenuItem && !isActive
              ? itemStyles
              : 'bg-transparent text-neutral-700 font-medium hover:bg-neutral-100 hover:text-blue-600'
          }`
        }
        style={({ isActive }) => ({
          ...itemInlineStyles,
          borderLeft: isActive ? itemInlineStyles.borderLeft : (isUnderActiveTree && isSubmenuItem ? itemInlineStyles.borderLeft : undefined),
        })}
        end
      >
        <Icon size={iconSize} className="flex-shrink-0" />
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
        {visibleMenuItems.map((item) => renderMenuItem(item, 0, undefined, false, false))}
      </div>

      {/* Bottom Actions - Fixed at bottom */}
      <div className="p-4 pt-0 flex-shrink-0 border-t border-neutral-200">
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


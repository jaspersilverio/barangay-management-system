import {
  LayoutDashboard,
  Home,
  MapPin,
  Users,
  UserCheck,
  Syringe,
  Award,
  AlertTriangle,
  ClipboardList,
  FileBarChart,
  UserCog,
  Calendar,
  Megaphone,
  BarChart3,
  Settings,
  ShieldCheck,
  Gift,
  CheckSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  label: string
  to?: string
  icon: LucideIcon
  children?: MenuItem[]
  roles?: string[] // If specified, only show for these roles
  isGroup?: boolean // If true, this is a group label (not clickable, muted style)
  /** When true, NavLink matches child paths (e.g. /officials matches /officials/barangay) */
  matchChildPaths?: boolean
}

/**
 * Single Source of Truth for Sidebar Navigation Menu
 * 
 * This file contains ALL menu items for the entire application.
 * The Sidebar component imports and renders this configuration.
 * 
 * To add/modify menu items, edit this file ONLY.
 */
export const sidebarMenu: MenuItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Household & Site Mapping',
    icon: Home,
    children: [
      {
        label: 'Household',
        to: '/households',
        icon: Home,
      },
      {
        label: 'Sketch Map',
        to: '/map',
        icon: MapPin,
      },
      {
        label: 'Purok',
        to: '/puroks',
        icon: MapPin,
        roles: ['admin', 'captain', 'purok_leader'],
      },
    ],
  },
  {
    label: 'Residents',
    icon: UserCheck,
    children: [
      {
        label: 'Residents List',
        to: '/residents',
        icon: Users,
      },
      {
        label: 'Vaccination',
        to: '/vaccinations',
        icon: Syringe,
      },
    ],
  },
  
  {
    label: 'Incidents & Complaints',
    icon: AlertTriangle,
    children: [
      {
        label: 'Blotter Entries',
        to: '/blotter',
        icon: ClipboardList,
      },
      {
        label: 'Incident Reports',
        to: '/incident-reports',
        icon: FileBarChart,
      },
    ],
  },
  {
    label: 'Approval Center',
    to: '/approval-center',
    icon: CheckSquare,
    roles: ['captain', 'admin'],
  },
  {
    label: 'Officials & Beneficiaries',
    icon: UserCog,
    children: [
      {
        label: 'Officials',
        to: '/officials',
        icon: ShieldCheck,
        matchChildPaths: true,
      },
      {
        label: 'Beneficiaries',
        to: '/beneficiaries',
        icon: Gift,
        matchChildPaths: true,
      },
    ],
  },
  {
    label: 'Events & Announcements',
    icon: Calendar,
    children: [
      {
        label: 'Events',
        to: '/events',
        icon: Calendar,
      },
      {
        label: 'Announcements',
        to: '/notifications',
        icon: Megaphone,
      },
    ],
  },
  {
    label: 'Certificates',
    to: '/certificates',
    icon: Award,
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
]


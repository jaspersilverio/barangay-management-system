import {
  LayoutDashboard,
  Home,
  MapPin,
  UserPlus,
  Users,
  UserCheck,
  Syringe,
  Shield,
  Award,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  label: string
  to?: string
  icon: LucideIcon
  children?: MenuItem[]
  roles?: string[] // If specified, only show for these roles
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
    label: 'Household & Mapping',
    icon: Home,
    children: [
      {
        label: 'Register Household',
        to: '/households/register',
        icon: UserPlus,
      },
      {
        label: 'Register Resident',
        to: '/residents/register',
        icon: Users,
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
      },
      {
        label: 'Landmark',
        to: '/landmarks',
        icon: MapPin,
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
      {
        label: 'Immunization',
        to: '/immunization',
        icon: Shield,
      },
      {
        label: 'Certificates',
        icon: Award,
        children: [
          {
            label: 'Barangay Clearance',
            to: '/certificates/barangay-clearance',
            icon: FileText,
          },
          {
            label: 'Certificate of Indigency',
            to: '/certificates/indigency',
            icon: FileText,
          },
          {
            label: 'Residency',
            to: '/certificates/residency',
            icon: FileText,
          },
          {
            label: 'Solo Parent',
            to: '/certificates/solo-parent',
            icon: FileText,
          },
        ],
      },
    ],
  },
  // Additional menu sections will be added here as we progress
  // Incidents & Complaints, Officials & Beneficiaries, etc.
]


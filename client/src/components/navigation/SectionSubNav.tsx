import { NavLink } from 'react-router-dom'

export interface SubNavTab {
  label: string
  to: string
}

interface SectionSubNavProps {
  tabs: SubNavTab[]
}

/**
 * Contextual top sub-navigation bar.
 * Appears inside /officials/* or /beneficiaries/* to switch between feature sections.
 */
export default function SectionSubNav({ tabs }: SectionSubNavProps) {
  return (
    <nav
      className="d-flex flex-wrap gap-1 mb-3 pb-2 border-bottom"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="Section sub-navigation"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`
          }
          end={false}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

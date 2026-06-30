import { useState, useEffect, useCallback } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { Settings2 } from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import DashboardSummary from '../components/dashboard/DashboardSummary'
import VaccinationSummaryCard from '../components/dashboard/VaccinationSummaryCard'
import BlotterSummaryCard from '../components/dashboard/BlotterSummaryCard'
import BeneficiariesSummaryCard from '../components/dashboard/BeneficiariesSummaryCard'
import DashboardCharts from '../components/dashboard/DashboardCharts'
import ResidentsByPurokChart from '../components/dashboard/ResidentsByPurokChart'
import VaccinationStatusChart from '../components/dashboard/VaccinationStatusChart'
import BlotterTrendChart from '../components/dashboard/BlotterTrendChart'
import AgeDistributionChart from '../components/dashboard/AgeDistributionChart'
import BeneficiariesChart from '../components/dashboard/BeneficiariesChart'
import MonthlyRegistrationsChart from '../components/dashboard/MonthlyRegistrationsChart'
import VulnerabilityTrendsChart from '../components/dashboard/VulnerabilityTrendsChart'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivities from '../components/dashboard/RecentActivities'
import UpcomingEvents from '../components/dashboard/UpcomingEvents'
import { getRecentAnnouncements, getRecentNotifications, type DashboardAnnouncement, type DashboardNotification } from '../services/dashboard.service'

const STORAGE_KEY = 'dashboardVisibility'

const defaultVisibility = {
  charts: true,
  recentActivity: true,
  upcomingEvents: true,
}

function loadVisibility(): typeof defaultVisibility {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<typeof defaultVisibility>
      return { ...defaultVisibility, ...parsed }
    }
  } catch {
    // ignore invalid JSON
  }
  return defaultVisibility
}

export default function Dashboard() {
  useDashboard()
  const [visibleSections, setVisibleSections] = useState(loadVisibility)
  const [recentAnnouncements, setRecentAnnouncements] = useState<DashboardAnnouncement[]>([])
  const [recentNotifications, setRecentNotifications] = useState<DashboardNotification[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSections))
  }, [visibleSections])

  useEffect(() => {
    const loadRecentItems = async () => {
      try {
        const [announcementsRes, notificationsRes] = await Promise.all([
          getRecentAnnouncements(),
          getRecentNotifications(),
        ])
        if (announcementsRes.success) setRecentAnnouncements(announcementsRes.data)
        if (notificationsRes.success) setRecentNotifications(notificationsRes.data)
      } catch {
        // Keep dashboard resilient if one widget fails
      }
    }

    loadRecentItems()
  }, [])

  const setSection = useCallback((key: keyof typeof defaultVisibility, value: boolean) => {
    setVisibleSections((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="page-container">
      {/* Header: title left, Customize Dashboard right */}
      <div className="d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center justify-content-between gap-3 mb-6">
        <div>
          <h1 className="h2 text-brand-primary font-bold mb-2">Dashboard</h1>
          <p className="text-brand-muted mb-0">Welcome to your barangay management dashboard</p>
        </div>
        <Dropdown align="end" className="dashboard-customize-dropdown">
          <Dropdown.Toggle
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Customize Dashboard
          </Dropdown.Toggle>
          <Dropdown.Menu className="p-3" style={{ minWidth: '220px' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-muted small text-uppercase fw-semibold mb-2">Show sections</div>
            <Form.Check
              type="switch"
              id="toggle-charts"
              label="Charts"
              checked={visibleSections.charts}
              onChange={(e) => setSection('charts', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="toggle-recent"
              label="Recent Activity"
              checked={visibleSections.recentActivity}
              onChange={(e) => setSection('recentActivity', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="toggle-events"
              label="Upcoming Events"
              checked={visibleSections.upcomingEvents}
              onChange={(e) => setSection('upcomingEvents', e.target.checked)}
            />
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Always visible: Summary Cards */}
      <div className="mb-6">
        <div className="row g-4">
          <DashboardSummary />
          <VaccinationSummaryCard />
          <BlotterSummaryCard />
          <BeneficiariesSummaryCard />
        </div>
      </div>

      {/* Toggleable: Charts / Analytics */}
      {visibleSections.charts && (
        <>
          <div className="row g-6 mb-6 dashboard-section-toggleable">
            <div className="col-12 col-lg-6">
              <div className="card-modern p-4">
                <h5 className="h5 font-bold text-brand-primary mb-4">Households by Purok</h5>
                <div className="w-full h-80">
                  <DashboardCharts />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card-modern p-4">
                <h5 className="h5 font-bold text-brand-primary mb-4">Residents by Purok</h5>
                <div className="w-full h-80">
                  <ResidentsByPurokChart />
                </div>
              </div>
            </div>
          </div>
          <div className="row g-6 mb-6">
            <div className="col-12 col-lg-6">
              <MonthlyRegistrationsChart />
            </div>
            <div className="col-12 col-lg-6">
              <VulnerabilityTrendsChart />
            </div>
          </div>
          <div className="row g-6 mb-6">
            <div className="col-12 col-lg-6">
              <VaccinationStatusChart />
            </div>
            <div className="col-12 col-lg-6">
              <BlotterTrendChart />
            </div>
          </div>
          <div className="row g-6 mb-6">
            <div className="col-12 col-lg-6">
              <AgeDistributionChart />
            </div>
            <div className="col-12 col-lg-6">
              <BeneficiariesChart />
            </div>
          </div>
        </>
      )}

      {/* Quick Actions | optional Recent Activity & Upcoming Events (below charts) */}
      <div className="row g-6 mb-6">
        <div className="col-12 col-lg-4">
          <QuickActions />
        </div>
        {visibleSections.recentActivity && (
          <div className="col-12 col-lg-4 dashboard-section-toggleable">
            <RecentActivities />
          </div>
        )}
        {visibleSections.upcomingEvents && (
          <div className="col-12 col-lg-4 dashboard-section-toggleable">
            <UpcomingEvents />
          </div>
        )}
      </div>

      <div className="row g-6 mb-6">
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100">
            <h5 className="h5 font-bold text-brand-primary mb-3">Recent Announcements</h5>
            {recentAnnouncements.length === 0 ? (
              <p className="text-brand-muted mb-0">No announcements yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-bottom pb-2">
                    <div className="fw-semibold">{announcement.title}</div>
                    <div className="small text-brand-muted text-truncate">{announcement.content}</div>
                    <div className="small text-brand-muted">
                      {new Date(announcement.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100">
            <h5 className="h5 font-bold text-brand-primary mb-3">Recent Notifications</h5>
            {recentNotifications.length === 0 ? (
              <p className="text-brand-muted mb-0">No notifications yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="border-bottom pb-2">
                    <div className="fw-semibold">{notification.title}</div>
                    <div className="small text-brand-muted text-truncate">{notification.message}</div>
                    <div className="small text-brand-muted">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



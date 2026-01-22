import { useState, useEffect, useCallback } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { CheckSquare, X, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPendingCount } from '../../services/approval-queue.service'
import { useAuth } from '../../context/AuthContext'

export default function PendingApprovalBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const isCaptain = user?.role === 'captain' || user?.role === 'admin'

  const fetchPendingCount = useCallback(async () => {
    if (!isCaptain) return
    
    try {
      setLoading(true)
      const response = await getPendingCount()
      if (response.success) {
        setPendingCount(response.data.total_pending)
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    } finally {
      setLoading(false)
    }
  }, [isCaptain])

  useEffect(() => {
    if (!isCaptain) return

    fetchPendingCount()

    // Refresh every 30 seconds to get real-time updates
    const interval = setInterval(fetchPendingCount, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [isCaptain, fetchPendingCount])

  // Reset dismissed state when pending count changes (new request came in)
  useEffect(() => {
    if (pendingCount > 0) {
      setDismissed(false)
    }
  }, [pendingCount])

  if (!isCaptain || dismissed || loading || pendingCount === 0) {
    return null
  }

  return (
    <Alert 
      variant="warning" 
      className="mb-0 border-0 rounded-0 d-flex align-items-center justify-content-between"
      style={{
        backgroundColor: '#fff3cd',
        borderLeft: '4px solid #ffc107',
        padding: '16px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div className="d-flex align-items-center gap-3 flex-grow-1">
        <AlertCircle className="text-warning" size={24} style={{ flexShrink: 0 }} />
        <div className="flex-grow-1">
          <Alert.Heading className="mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
            {pendingCount} Request{pendingCount !== 1 ? 's' : ''} Awaiting Your Approval
          </Alert.Heading>
          <div className="small">
            New requests from staff members require your review and approval before they can be processed.
          </div>
        </div>
        <Button
          variant="warning"
          size="sm"
          onClick={() => navigate('/approval-center')}
          className="d-flex align-items-center gap-2"
          style={{ fontWeight: 600 }}
        >
          <CheckSquare size={18} />
          Review Requests
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-muted p-0"
          style={{ minWidth: 'auto', padding: '0 !important' }}
        >
          <X size={20} />
        </Button>
      </div>
    </Alert>
  )
}

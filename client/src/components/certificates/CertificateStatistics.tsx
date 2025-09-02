import { useState, useEffect } from 'react'
import { Row, Col } from 'react-bootstrap'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp 
} from 'lucide-react'
import { 
  getCertificateRequestStatistics, 
  getIssuedCertificateStatistics,
  type CertificateStatistics,
  type IssuedCertificateStatistics 
} from '../../services/certificate.service'
import LoadingSkeleton from '../ui/LoadingSkeleton'

export default function CertificateStatistics() {
  const [requestStats, setRequestStats] = useState<CertificateStatistics | null>(null)
  const [issuedStats, setIssuedStats] = useState<IssuedCertificateStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const [requestResponse, issuedResponse] = await Promise.all([
        getCertificateRequestStatistics(),
        getIssuedCertificateStatistics()
      ])
      
      setRequestStats(requestResponse.data)
      setIssuedStats(issuedResponse.data)
    } catch (error) {
      console.error('Failed to fetch certificate statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Row className="g-3 mb-4">
        {[...Array(6)].map((_, i) => (
          <Col key={i} xs={12} sm={6} md={4} lg={2}>
            <LoadingSkeleton type="card" height={120} />
          </Col>
        ))}
      </Row>
    )
  }

  const stats = [
    {
      title: 'Total Requests',
      value: requestStats?.total_requests || 0,
      icon: FileText,
      color: 'primary',
      description: 'All certificate requests'
    },
    {
      title: 'Pending',
      value: requestStats?.pending_requests || 0,
      icon: Clock,
      color: 'warning',
      description: 'Awaiting approval'
    },
    {
      title: 'Approved',
      value: requestStats?.approved_requests || 0,
      icon: CheckCircle,
      color: 'success',
      description: 'Ready for issuance'
    },
    {
      title: 'Rejected',
      value: requestStats?.rejected_requests || 0,
      icon: XCircle,
      color: 'danger',
      description: 'Declined requests'
    },
    {
      title: 'Issued Certificates',
      value: issuedStats?.total_certificates || 0,
      icon: TrendingUp,
      color: 'info',
      description: 'Total issued documents'
    },
    {
      title: 'Expiring Soon',
      value: issuedStats?.expiring_soon || 0,
      icon: AlertTriangle,
      color: 'warning',
      description: 'Within 30 days'
    }
  ]

  return (
    <Row className="g-3 mb-4">
      {stats.map((stat, index) => (
        <Col key={index} xs={12} sm={6} md={4} lg={2}>
          <div className={`card-modern border-${stat.color} border-start border-4`}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">{stat.title}</h6>
                <h3 className="mb-1">{stat.value}</h3>
                <small className="text-muted">{stat.description}</small>
              </div>
              <div className={`text-${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  )
}

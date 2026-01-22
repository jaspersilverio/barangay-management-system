import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Card, Button, Table, Row, Col, Badge } from 'react-bootstrap'
import { getHousehold } from '../../services/households.service'
import ViewResidentsModal from '../../components/households/ViewResidentsModal'
import { ArrowLeft } from 'lucide-react'

export default function HouseholdDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResidentsModal, setShowResidentsModal] = useState(false)

  // Format birthdate for display
  const formatBirthdate = (birthdate: string | null) => {
    if (!birthdate) return '-'
    try {
      const date = new Date(birthdate)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return birthdate
    }
  }

  // Format sex for display
  const formatSex = (sex: string | null) => {
    if (!sex) return '-'
    return sex.charAt(0).toUpperCase() + sex.slice(1)
  }

  // Filter out head of household from members list (already filtered in backend, but double-check)
  const members = data?.residents?.filter((r: any) => r.id !== data?.head_resident_id) || []

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getHousehold(id)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => null) }, [id])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>Not found</div>

  const hh = data

  return (
    <div className="page-container">
      {/* Back Button and Header */}
      <div className="mb-3">
        <Button
          variant="outline-secondary"
          onClick={() => navigate('/households')}
          className="mb-3"
          title="Back to Households"
        >
          <ArrowLeft size={16} />
        </Button>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/households' }}>Households</Breadcrumb.Item>
          <Breadcrumb.Item active>
            <strong style={{ color: '#fff', fontWeight: '700' }}>{hh.head_name}'s Household</strong>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Row className="g-3">
        <Col md={7}>
          <Card className="shadow rounded-3 p-4">
            <h5 className="mb-3">Household Info</h5>
            <div className="mb-2"><strong>Household Code:</strong> {hh.household_code}</div>
            <div className="mb-2"><strong>Head Name:</strong> {hh.head_name}</div>
            <div className="mb-2"><strong>Address:</strong> {hh.address}</div>
            <div className="mb-2"><strong>Purok:</strong> {hh.purok?.name || hh.purok_id}</div>
            <div className="mb-2"><strong>Location:</strong> {hh.latitude && hh.longitude ? `${hh.latitude}, ${hh.longitude}` : '-'}</div>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow rounded-3 p-4">
            <h5 className="mb-3">Map</h5>
            <div className="bg-light border rounded" style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card className="shadow rounded-3 p-4 mt-3">
        <div className="mb-2">
          <h5 className="mb-0">Household Members</h5>
          <small className="text-muted">
            {hh.head_resident_id && (
              <>Head: <strong>{hh.head_name}</strong> (not shown in members list)</>
            )}
          </small>
        </div>
        <div className="table-responsive">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Sex</th>
                <th>Birthdate</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {members.map((r: any) => (
                <tr key={r.id}>
                  <td className="fw-medium">
                    {r.full_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ')}
                  </td>
                  <td>
                    <Badge bg={r.sex === 'male' ? 'primary' : r.sex === 'female' ? 'pink' : 'secondary'} className="rounded-pill">
                      {formatSex(r.sex)}
                    </Badge>
                  </td>
                  <td>{formatBirthdate(r.birthdate)}</td>
                  <td>
                    <span className="text-capitalize">{r.relationship_to_head || '-'}</span>
                  </td>
                </tr>
              ))}
              {(!members || members.length === 0) && (
                <tr><td colSpan={4} className="text-center py-3 text-muted">No members yet. Add residents to this household.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* View/Manage Residents Modal */}
      {data && (
        <ViewResidentsModal
          show={showResidentsModal}
          onHide={() => {
            setShowResidentsModal(false)
            // Reload household data after closing modal to refresh resident list
            load()
          }}
          household={{
            id: data.id,
            head_name: data.head_name || 'N/A',
            address: data.address || '',
            head_resident_id: data.head_resident_id,
            purok: data.purok ? { name: data.purok.name } : undefined
          }}
        />
      )}
    </div>
  )
}



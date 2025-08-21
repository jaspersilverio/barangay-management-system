import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumb, Card, Button, Table, Row, Col } from 'react-bootstrap'
import { getHousehold } from '../../services/households.service'

export default function HouseholdDetailsPage() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

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
    <div>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/households' }}>Households</Breadcrumb.Item>
        <Breadcrumb.Item active>{hh.household_code}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-3">
        <Col md={7}>
          <Card className="shadow rounded-3 p-4">
            <h5 className="mb-3">Household Info</h5>
            <div className="mb-2"><strong>Household Code:</strong> {hh.household_code}</div>
            <div className="mb-2"><strong>Head Name:</strong> {hh.head_name}</div>
            <div className="mb-2"><strong>Address:</strong> {hh.address}</div>
            <div className="mb-2"><strong>Landmark:</strong> {hh.landmark || '-'}</div>
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Members</h5>
          <Button size="sm">Add Resident</Button>
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
              {(hh.residents ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td>{[r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ')}</td>
                  <td>{r.sex}</td>
                  <td>{r.birthdate}</td>
                  <td>{r.relationship_to_head}</td>
                </tr>
              ))}
              {(!hh.residents || hh.residents.length === 0) && (
                <tr><td colSpan={4} className="text-center py-3">No members yet.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}



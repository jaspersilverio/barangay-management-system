import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumb, Card, Row, Col, ProgressBar } from 'react-bootstrap'
import { getPurok } from '../../services/puroks.service'

export default function PurokDetailsPage() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    getPurok(id).then((res) => setData(res.data)).catch(() => setData(null))
  }, [id])

  if (!data) return <div>Loading...</div>
  const p = data

  return (
    <div>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/puroks' }}>Puroks</Breadcrumb.Item>
        <Breadcrumb.Item active>{p.code}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-3">
        <Col md={7}>
          <Card className="shadow rounded-3 p-4">
            <h5 className="mb-3">Purok Info</h5>
            <div className="mb-2"><strong>Code:</strong> {p.code}</div>
            <div className="mb-2"><strong>Name:</strong> {p.name}</div>
            <div className="mb-2"><strong>Description:</strong> {p.description || '-'}</div>
            <div className="mb-2"><strong>Centroid:</strong> {p.centroid_lat && p.centroid_lng ? `${p.centroid_lat}, ${p.centroid_lng}` : '-'}</div>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow rounded-3 p-4">
            <h5 className="mb-3">Map</h5>
            <div className="bg-brand-surface border rounded" style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Card className="shadow rounded-3 p-4 mt-3">
        <h5 className="mb-3">Statistics</h5>
        <Row className="g-3">
          <Col md={4}>
            <div className="mb-2">Total Households</div>
            <h4>{p.households_count ?? '-'}</h4>
          </Col>
          <Col md={4}>
            <div className="mb-2">Total Residents</div>
            <h4>{p.residents_count ?? '-'}</h4>
          </Col>
          <Col md={4}>
            <div className="mb-2">Seniors / Children / PWD</div>
            <ProgressBar>
              <ProgressBar now={30} key={1} variant="info" />
              <ProgressBar now={50} key={2} variant="warning" />
              <ProgressBar now={20} key={3} variant="danger" />
            </ProgressBar>
          </Col>
        </Row>
      </Card>
    </div>
  )
}



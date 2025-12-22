import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import HouseholdFormModal from '../../components/households/HouseholdFormModal'
import { createHousehold } from '../../services/households.service'
import type { HouseholdFormValues } from '../../components/households/HouseholdFormModal'

export default function RegisterHouseholdPage() {
  const navigate = useNavigate()
  const [showForm] = useState(true)

  const handleSubmit = async (values: HouseholdFormValues) => {
    try {
      const payload = {
        address: values.address,
        property_type: values.property_type,
        head_name: values.head_name,
        contact: values.contact,
        purok_id: values.purok_id || '',
      }
      await createHousehold(payload)
      // Navigate back or show success
      navigate('/households')
    } catch (error: any) {
      throw error // Let the modal handle the error
    }
  }

  return (
    <Container fluid>
      <div className="page-container page-sub">
        <div className="card-modern">
          <h2 className="h4 mb-4 text-brand-primary">Register Household</h2>
          <p className="text-muted mb-4">Fill out the form below to register a new household.</p>
        
        <HouseholdFormModal
          show={showForm}
          initial={undefined}
          onSubmit={handleSubmit}
          onHide={() => navigate('/households')}
        />
        </div>
      </div>
    </Container>
  )
}

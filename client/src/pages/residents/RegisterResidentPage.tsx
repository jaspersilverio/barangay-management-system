import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import { createResident } from '../../services/residents.service'
import type { ResidentFormValues } from '../../components/residents/ResidentFormModal'

export default function RegisterResidentPage() {
  const navigate = useNavigate()
  const [showForm] = useState(true)

  const handleSubmit = async (values: ResidentFormValues) => {
    try {
      const payload = {
        household_id: Number(values.household_id),
        first_name: values.first_name,
        middle_name: values.middle_name || undefined,
        last_name: values.last_name,
        sex: values.sex,
        birthdate: values.birthdate,
        civil_status: values.civil_status,
        relationship_to_head: values.relationship_to_head,
        occupation_status: values.occupation_status,
        is_pwd: !!values.is_pwd,
        is_pregnant: !!values.is_pregnant,
      }
      await createResident(payload)
      // Navigate back or show success
      navigate('/residents')
    } catch (error: any) {
      throw error // Let the modal handle the error
    }
  }

  return (
    <Container fluid>
      <div className="card-modern">
        <h2 className="h4 mb-4 text-brand-primary">Register Resident</h2>
        <p className="text-muted mb-4">Fill out the form below to register a new resident.</p>
        
        <ResidentFormModal
          show={showForm}
          initial={undefined}
          onSubmit={handleSubmit}
          onHide={() => navigate('/residents')}
        />
      </div>
    </Container>
  )
}


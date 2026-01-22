import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import { createResident } from '../../services/residents.service'
import { createHousehold } from '../../services/households.service'
import type { ResidentFormValues } from '../../components/residents/ResidentFormModal'

export default function RegisterResidentPage() {
  const navigate = useNavigate()
  const [showForm] = useState(true)

  const handleSubmit = async (values: ResidentFormValues & { photo?: File }) => {
    try {
      // Step 1: Create the resident first (resident-first architecture)
      let residentPayload: any = {
        household_id: null, // Create resident first without household
        first_name: values.first_name,
        middle_name: values.middle_name || null,
        last_name: values.last_name,
        suffix: values.suffix || null, // Optional field - use null instead of undefined
        sex: values.sex,
        birthdate: values.birthdate,
        place_of_birth: values.place_of_birth || null,
        nationality: values.nationality || null,
        religion: values.religion || null,
        contact_number: values.contact_number || null,
        email: values.email || null,
        valid_id_type: values.valid_id_type || null,
        valid_id_number: values.valid_id_number || null,
        civil_status: values.civil_status,
        relationship_to_head: null,
        occupation_status: values.occupation_status,
        employer_workplace: values.employer_workplace || null,
        educational_attainment: values.educational_attainment || null,
        is_pwd: !!values.is_pwd,
        is_pregnant: !!values.is_pregnant,
        resident_status: values.resident_status || 'active',
        remarks: values.remarks || null,
        photo: values.photo || undefined,
      }

      // If assigning to existing household, include it in the payload
      if (values.assignment_mode === 'existing' && values.household_id) {
        residentPayload.household_id = Number(values.household_id)
        residentPayload.relationship_to_head = values.relationship_to_head || null
      }

      const residentResponse = await createResident(residentPayload)
      
      if (!residentResponse.success || !residentResponse.data) {
        throw new Error(residentResponse.message || 'Failed to create resident')
      }

      const createdResident = residentResponse.data

      // Step 2: If creating new household, create it with this resident as head
      if (values.assignment_mode === 'new_household') {
        const householdPayload = {
          address: values.new_household_address!,
          property_type: values.new_household_property_type!,
          head_resident_id: createdResident.id, // Use the newly created resident as head
          contact: values.new_household_contact!,
          purok_id: typeof values.new_household_purok_id === 'string' 
            ? parseInt(values.new_household_purok_id) 
            : values.new_household_purok_id!,
        }
        const householdResponse = await createHousehold(householdPayload)
        
        // Verify the household was created and resident was linked
        if (householdResponse.success && householdResponse.data) {
          // Household created successfully, resident is already linked
        }
      }
      // If unassigned or existing household, we're done!

      // Navigate back to residents list
      navigate('/residents')
    } catch (error: any) {
      throw error // Let the modal handle the error
    }
  }

  return (
    <Container fluid>
      <div className="page-container page-sub">
        <div className="card-modern">
          <h2 className="h4 mb-4 text-brand-primary">Register Resident</h2>
          <p className="text-muted mb-4">
            Register a new resident. You can assign them to an existing household, create a new household with them as head, or leave them unassigned for now.
          </p>
        
        <ResidentFormModal
          show={showForm}
          initial={undefined}
          onSubmit={handleSubmit}
          onHide={() => navigate('/residents')}
        />
        </div>
      </div>
    </Container>
  )
}

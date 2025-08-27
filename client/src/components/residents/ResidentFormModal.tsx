import { Modal, Button, Form, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

// Dynamic schema based on user role
const createSchema = (isPurokLeader: boolean) => z.object({
  household_id: z.union([z.string(), z.number()]),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  sex: z.enum(['male', 'female', 'other']),
  birthdate: z.string().min(1, 'Birthdate is required'),
  relationship_to_head: z.string().min(1, 'Relationship is required'),
  occupation_status: z.enum(['employed', 'unemployed', 'student', 'retired', 'other']),
  is_pwd: z.boolean().default(false),
  purok_id: isPurokLeader 
    ? z.string().optional() // Optional for purok leaders (auto-assigned)
    : z.string().min(1, 'Purok is required'), // Required for others
})

export type ResidentFormValues = z.infer<ReturnType<typeof createSchema>>

type Props = {
  show: boolean
  initial?: Partial<ResidentFormValues>
  onSubmit: (values: ResidentFormValues) => Promise<void>
  onHide: () => void
}

export default function ResidentFormModal({ show, initial, onSubmit, onHide }: Props) {
  const { puroks } = usePuroks()
  const { user } = useAuth()

  // Determine if user is a purok leader
  const isPurokLeader = user?.role === 'purok_leader'
  const assignedPurokId = user?.assigned_purok_id

  const schema = createSchema(isPurokLeader)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ResidentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      household_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      sex: 'male',
      birthdate: '',
      relationship_to_head: '',
      occupation_status: 'other',
      is_pwd: false,
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : '',
      ...initial,
    },
  })

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          household_id: Number(values.household_id),
        }
        await onSubmit(payload as any)
        reset()
      })}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? 'Edit Resident' : 'Add Resident'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Household ID</Form.Label>
                <Form.Control {...register('household_id')} isInvalid={!!errors.household_id} />
                <Form.Control.Feedback type="invalid">Household is required</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purok</Form.Label>
                {isPurokLeader ? (
                  <>
                    <Form.Control
                      type="text"
                      value={puroks.find(p => p.id === assignedPurokId)?.name || 'Your Assigned Purok'}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      You can only manage residents in your assigned purok.
                    </Form.Text>
                    {/* Hidden input to include purok_id in form submission */}
                    <input type="hidden" {...register('purok_id')} defaultValue={assignedPurokId ? String(assignedPurokId) : ''} />
                  </>
                ) : (
                  <>
                    <Form.Select {...register('purok_id')} isInvalid={!!errors.purok_id}>
                      <option value="">Select Purok</option>
                      {puroks.map((purok) => (
                        <option key={purok.id} value={purok.id}>
                          {purok.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.purok_id?.message}</Form.Control.Feedback>
                  </>
                )}
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Birthdate</Form.Label>
                <Form.Control type="date" {...register('birthdate')} isInvalid={!!errors.birthdate} />
                <Form.Control.Feedback type="invalid">{errors.birthdate?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control {...register('first_name')} isInvalid={!!errors.first_name} />
                <Form.Control.Feedback type="invalid">{errors.first_name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Middle Name</Form.Label>
                <Form.Control {...register('middle_name')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control {...register('last_name')} isInvalid={!!errors.last_name} />
                <Form.Control.Feedback type="invalid">{errors.last_name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sex</Form.Label>
                <Form.Select {...register('sex')} isInvalid={!!errors.sex}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.sex?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Relationship to Head</Form.Label>
                <Form.Control {...register('relationship_to_head')} isInvalid={!!errors.relationship_to_head} />
                <Form.Control.Feedback type="invalid">{errors.relationship_to_head?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Occupation Status</Form.Label>
                <Form.Select {...register('occupation_status')} isInvalid={!!errors.occupation_status}>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.occupation_status?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Person with Disability (PWD)"
              {...register('is_pwd')}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initial ? 'Update' : 'Create')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

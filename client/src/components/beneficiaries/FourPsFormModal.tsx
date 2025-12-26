import { useEffect, useState } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from 'react-select'
import { getHouseholdsForResidentForm } from '../../services/households.service'
import type { HouseholdOption } from '../../services/households.service'

const schema = z.object({
  household_id: z.string().min(1, 'Household is required'),
  four_ps_number: z.string().min(1, '4Ps number is required').max(50, '4Ps number must not exceed 50 characters'),
  status: z.enum(['active', 'suspended', 'inactive'], {
    required_error: 'Status is required',
  }),
  date_registered: z.string().min(1, 'Date registered is required'),
})

export type FourPsFormValues = z.infer<typeof schema>

type Props = {
  show: boolean
  initial?: Partial<FourPsFormValues>
  onSubmit: (values: FourPsFormValues) => Promise<void>
  onHide: () => void
}

export default function FourPsFormModal({ show, initial, onSubmit, onHide }: Props) {
  const [households, setHouseholds] = useState<HouseholdOption[]>([])
  const [loadingHouseholds, setLoadingHouseholds] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<FourPsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      household_id: '',
      four_ps_number: '',
      status: 'active',
      date_registered: new Date().toISOString().split('T')[0],
      ...initial,
    },
  })

  // Load households for dropdown
  const loadHouseholds = async (search?: string) => {
    setLoadingHouseholds(true)
    try {
      const response = await getHouseholdsForResidentForm({ search })
      if (response.success) {
        setHouseholds(response.data)
      }
    } catch (error) {
      console.error('Error loading households:', error)
    } finally {
      setLoadingHouseholds(false)
    }
  }

  // Load households when modal opens
  useEffect(() => {
    if (show) {
      loadHouseholds()
      setError(null)
    }
  }, [show])

  // Handle household selection
  const handleHouseholdChange = (option: HouseholdOption | null) => {
    setSelectedHousehold(option)
    if (option) {
      setValue('household_id', option.id.toString())
    } else {
      setValue('household_id', '')
    }
  }

  // Reset form when initial values change
  useEffect(() => {
    if (show) {
      const defaultValues: FourPsFormValues = {
        household_id: initial?.household_id || '',
        four_ps_number: initial?.four_ps_number || '',
        status: initial?.status || 'active',
        date_registered: initial?.date_registered || new Date().toISOString().split('T')[0],
      }
      reset(defaultValues)

      // Set selected household if initial household_id exists
      if (initial?.household_id) {
        const household = households.find(h => h.id.toString() === initial.household_id)
        if (household) {
          setSelectedHousehold(household)
        } else {
          // Load households to find the initial one
          loadHouseholds()
        }
      } else {
        setSelectedHousehold(null)
      }
    }
  }, [initial, show, reset, households])

  const handleFormSubmit = async (values: FourPsFormValues) => {
    try {
      setError(null)
      await onSubmit(values)
      reset()
      setSelectedHousehold(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred'
      setError(errorMessage)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            {initial ? 'Edit 4Ps Beneficiary' : 'Register 4Ps Household'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Household *</Form.Label>
            <Select
              value={selectedHousehold}
              onChange={handleHouseholdChange}
              options={households}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.id.toString()}
              placeholder="Search for a household..."
              isLoading={loadingHouseholds}
              isClearable
              isSearchable
              noOptionsMessage={() => "No households found"}
              isDisabled={!!initial} // Disable if editing
              onInputChange={(newValue) => {
                if (newValue.length >= 2) {
                  loadHouseholds(newValue)
                }
              }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: errors.household_id ? '#dc3545' : provided.borderColor,
                }),
              }}
            />
            {errors.household_id && (
              <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                {errors.household_id.message}
              </div>
            )}
            {initial && (
              <Form.Text className="text-muted">
                Household cannot be changed when editing.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">4Ps Number *</Form.Label>
            <Form.Control
              placeholder="Enter 4Ps identification number"
              {...register('four_ps_number')}
              isInvalid={!!errors.four_ps_number}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">
              {errors.four_ps_number?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Status *</Form.Label>
            <Form.Select
              {...register('status')}
              isInvalid={!!errors.status}
              className="modal-form-control"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.status?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Date Registered *</Form.Label>
            <Form.Control
              type="date"
              {...register('date_registered')}
              isInvalid={!!errors.date_registered}
              className="modal-form-control"
              max={new Date().toISOString().split('T')[0]}
            />
            <Form.Control.Feedback type="invalid">
              {errors.date_registered?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} className="btn-brand-secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="btn-brand-primary">
            {isSubmitting ? (initial ? 'Updating...' : 'Registering...') : (initial ? 'Update' : 'Register')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


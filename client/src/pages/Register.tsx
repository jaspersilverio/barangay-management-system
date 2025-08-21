import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, Button, Form, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { usePuroks } from '../context/PurokContext'

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Minimum 6 characters'),
    confirm_password: z.string().min(6, 'Confirm your password'),
    role: z.enum(['admin', 'purok_leader', 'staff', 'viewer'], {
      required_error: 'Role is required',
    }),
    assigned_purok_id: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const { puroks, refresh } = usePuroks()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const role = watch('role')

  useEffect(() => {
    refresh().catch(() => null)
  }, [refresh])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      assigned_purok_id:
        values.role !== 'admin' && values.assigned_purok_id
          ? Number(values.assigned_purok_id)
          : null,
    }
    await registerUser(payload as any)
    navigate('/login')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
      <Card className="shadow rounded-3 p-4" style={{ maxWidth: 680, width: '100%' }}>
        <h5 className="mb-3">Register User</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control {...register('name')} isInvalid={!!errors.name} />
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" {...register('email')} isInvalid={!!errors.email} />
            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
          </Form.Group>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" {...register('password')} isInvalid={!!errors.password} />
                <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control type="password" {...register('confirm_password')} isInvalid={!!errors.confirm_password} />
                <Form.Control.Feedback type="invalid">{errors.confirm_password?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select {...register('role')} isInvalid={!!errors.role}>
                  <option value="admin">Admin</option>
                  <option value="purok_leader">Purok Leader</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.role?.message as any}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            {role !== 'admin' && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned Purok</Form.Label>
                  <Form.Select {...register('assigned_purok_id')} isInvalid={!!errors.assigned_purok_id}>
                    <option value="">Select a purok</option>
                    {puroks.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.assigned_purok_id?.message as any}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
          </Row>
          <Button type="submit" disabled={isSubmitting} className="w-100" variant="primary">
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </Form>
      </Card>
    </div>
  )
}



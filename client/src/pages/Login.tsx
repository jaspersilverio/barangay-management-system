import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { Card } from 'react-bootstrap'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (token) navigate('/dashboard')
  }, [token, navigate])

  const onSubmit = async (values: FormValues) => {
    await login(values.email, values.password)
    navigate('/dashboard')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
      <Card className="shadow rounded-3 p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h5 className="mb-3">Sign in</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="you@example.com" {...register('email')} isInvalid={!!errors.email} />
            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="••••••••" {...register('password')} isInvalid={!!errors.password} />
            <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
          </Form.Group>
          <Button type="submit" disabled={isSubmitting} className="w-100" variant="primary">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="text-center mt-3">
            Don’t have an account? <Link to="/register">Register</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}



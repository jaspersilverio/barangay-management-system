import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/consistency.css'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (values: FormValues) => {
    try {
      setLoginError(null)
      await login(values.email, values.password)
    } catch (error: any) {
      console.error('Login failed:', error)
      setLoginError(error?.response?.data?.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden login-page"
      style={{
        backgroundImage: 'url(/ivisan.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      />

      {/* Login Card */}
      <div
        className="login-page-card w-full max-w-lg bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }}
        />

        <div className="p-12 md:p-14">
          {/* Header with icon */}
          <div className="text-center mb-10">
            <div
              className="login-page-icon-wrap inline-flex items-center justify-center w-28 h-28 rounded-full mb-5 overflow-hidden bg-white border-2 border-[rgba(37,99,235,0.4)]"
            >
              <img src="/logo.png" alt="Barangay logo" className="w-full h-full object-cover" />
            </div>
            <h1
              className="font-bold tracking-tight mb-1 leading-snug max-w-md mx-auto"
              style={{ color: 'var(--color-primary)', fontSize: '2.625rem' }}
            >
              Barangay Management and Household Mapping
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {loginError && (
              <div
                className="rounded-xl p-4 flex items-start gap-3 transition-opacity"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">{loginError}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Email
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-opacity duration-200 ${emailFocused ? 'opacity-0' : 'opacity-100'}`}
                >
                  <svg className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`login-page-input w-full px-4 py-3.5 ${emailFocused ? 'pl-4' : 'pl-12'} border rounded-xl bg-white ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  style={{ color: 'var(--color-text-primary)' }}
                  placeholder="Enter your email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={(e) => setEmailFocused(e.target.value.length > 0)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Password
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-opacity duration-200 ${passwordFocused ? 'opacity-0' : 'opacity-100'}`}
                >
                  <svg className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`login-page-input w-full px-4 py-3.5 ${passwordFocused ? 'pl-4' : 'pl-12'} pr-12 border rounded-xl bg-white ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
                  style={{ color: 'var(--color-text-primary)' }}
                  placeholder="Enter your password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={(e) => setPasswordFocused(e.target.value.length > 0)}
                />
                <button
                  type="button"
                  className="login-page-pw-toggle absolute inset-y-0 right-0 pr-4 flex items-center"
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="login-page-submit btn-brand-primary w-full py-3.5 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Contact the administrator to create an account
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

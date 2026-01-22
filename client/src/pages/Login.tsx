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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #E9F2FF 0%, #D7E8FF 50%, #F8FAFC 100%)',
        backgroundColor: 'var(--color-background)'
      }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {/* Large decorative circles */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--color-primary)', opacity: 0.08 }}
        ></div>
        
        {/* Medium accent circles */}
        <div 
          className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-2xl"
          style={{ backgroundColor: 'var(--color-primary)', opacity: 0.12 }}
        ></div>
        <div 
          className="absolute bottom-1/3 right-1/3 w-32 h-32 rounded-full blur-2xl"
          style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}
        ></div>
      </div>

      {/* Login Card */}
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl relative z-10 transition-all duration-300"
        style={{
          boxShadow: '0 10px 40px rgba(37, 99, 235, 0.15)',
          borderTop: '4px solid var(--color-primary)'
        }}
      >
        <div className="p-8 md:p-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                <img 
                  src="/houselogo1.png" 
                  alt="HMMS Logo" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('span');
                      fallback.className = 'logo-fallback';
                      fallback.textContent = '🏘️';
                      fallback.style.fontSize = '48px';
                      parent.insertBefore(fallback, target);
                    }
                  }}
                />
                <h1 
                  className="text-3xl font-bold mb-0"
                  style={{ color: 'var(--color-primary)' }}
                >
                  HMMS
                </h1>
              </div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Barangay Management System
              </p>
            </div>
            <div className="mt-6">
              <h2 
                className="text-xl font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Welcome Back
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Sign in to access your account
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Message */}
            {loginError && (
              <div 
                className="rounded-lg p-4 flex items-start gap-3"
                style={{ 
                  backgroundColor: '#FEF2F2', 
                  border: '1px solid #FECACA',
                  color: '#991B1B'
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{loginError}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <div 
                  className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-opacity duration-200 ${emailFocused ? 'opacity-0' : 'opacity-100'}`}
                >
                  <svg className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`w-full px-4 py-3 ${emailFocused ? 'pl-4' : 'pl-10'} border rounded-lg transition-all duration-200 bg-white hover:border-blue-300 hover:shadow-sm ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={(e) => setEmailFocused(e.target.value.length > 0)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Password
              </label>
              <div className="relative">
                <div 
                  className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-opacity duration-200 ${passwordFocused ? 'opacity-0' : 'opacity-100'}`}
                >
                  <svg className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full px-4 py-3 ${passwordFocused ? 'pl-4' : 'pl-10'} pr-12 border rounded-lg transition-all duration-200 bg-white hover:border-blue-300 hover:shadow-sm ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={(e) => setPasswordFocused(e.target.value.length > 0)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 transition-colors" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 transition-colors" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-brand-primary w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
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
                  <span>Sign In</span>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4">
              <p 
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Contact the administrator to create an account
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoginForm } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password)
      navigate(from, { replace: true })
    } catch (error: any) {
      // Set form-level error
      setError('root', {
        type: 'manual',
        message: error.message || 'Failed to sign in',
      })
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
        <p className="mt-2 text-muted-foreground">
          Sign in to your Quarter Master account
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="label">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`input pl-10 ${errors.email ? 'border-error' : ''}`}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSubmitting || loading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`input pl-10 pr-10 ${errors.password ? 'border-error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
              disabled={isSubmitting || loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('remember')}
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={isSubmitting || loading}
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
              Remember me
            </label>
          </div>

          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Form Error */}
        {errors.root && (
          <div className="bg-error/10 border border-error/20 rounded-md p-3">
            <p className="text-sm text-error">{errors.root.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full btn btn-primary flex items-center justify-center gap-2 h-11"
        >
          {isSubmitting || loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>


      {/* Footer */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button className="text-primary hover:text-primary/80 font-medium">
            Contact your administrator
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

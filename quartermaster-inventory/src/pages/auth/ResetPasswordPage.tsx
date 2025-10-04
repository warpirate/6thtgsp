import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, Save } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { updatePassword, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await updatePassword(data.password)
      navigate('/dashboard')
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Failed to update password',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Reset Password</h2>
        <p className="mt-2 text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="label">
            New Password
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
              placeholder="Enter new password"
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-error' : ''}`}
              placeholder="Confirm new password"
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {errors.root && (
          <div className="bg-error/10 border border-error/20 rounded-md p-3">
            <p className="text-sm text-error">{errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full btn btn-primary flex items-center justify-center gap-2 h-11"
        >
          {isSubmitting || loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          to="/auth/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default ResetPasswordPage

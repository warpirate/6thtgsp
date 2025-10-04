import React from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, loading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email)
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Failed to send reset email',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Forgot Password</h2>
        <p className="mt-2 text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <Send className="w-4 h-4" />
              Send Reset Link
            </>
          )}
        </button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

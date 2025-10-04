import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

// Form validation schema
const receiptSchema = z.object({
  item_name: z.string().min(3, 'Item name must be at least 3 characters'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  description: z.string().optional(),
  unit_price: z.number().positive('Unit price must be positive').optional(),
  supplier: z.string().optional(),
  purchase_date: z.string().optional(),
})

type ReceiptFormData = z.infer<typeof receiptSchema>

const CreateReceiptPage: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      item_name: '',
      unit: '',
      description: '',
      supplier: '',
      purchase_date: '',
    },
  })

  const formValues = watch()

  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof ReceiptFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['item_name', 'quantity', 'unit']
    } else if (currentStep === 2) {
      fieldsToValidate = ['description', 'unit_price', 'supplier', 'purchase_date']
    }

    return await trigger(fieldsToValidate)
  }

  const handleNext = async () => {
    const isValid = await validateStep(step)
    if (isValid && step < 3) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSaveDraft = async (data: ReceiptFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Save as draft to database
      console.log('Saving draft:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Receipt saved as draft successfully!')
      navigate('/receipts')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: ReceiptFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Submit receipt to database
      console.log('Submitting receipt:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Receipt submitted successfully!')
      navigate('/receipts')
    } catch (error) {
      console.error('Error submitting receipt:', error)
      alert('Failed to submit receipt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Item details' },
    { number: 2, title: 'Additional Details', description: 'Pricing & supplier' },
    { number: 3, title: 'Review', description: 'Confirm details' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/receipts')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Receipts
        </button>
        <h1 className="text-3xl font-bold text-foreground">Create New Receipt</h1>
        <p className="mt-1 text-muted-foreground">
          Fill in the details to create a new stock receipt
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s.number === step
                      ? 'bg-primary text-primary-foreground'
                      : s.number < step
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.number < step ? <CheckCircle className="w-5 h-5" /> : s.number}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-4 ${s.number < step ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>

            <div>
              <label htmlFor="item_name" className="label">
                Item Name <span className="text-error">*</span>
              </label>
              <input
                {...register('item_name')}
                type="text"
                id="item_name"
                className={`input ${errors.item_name ? 'border-error' : ''}`}
                placeholder="Enter item name"
              />
              {errors.item_name && (
                <p className="text-sm text-error mt-1">{errors.item_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="label">
                  Quantity <span className="text-error">*</span>
                </label>
                <input
                  {...register('quantity', { valueAsNumber: true })}
                  type="number"
                  id="quantity"
                  className={`input ${errors.quantity ? 'border-error' : ''}`}
                  placeholder="0"
                  min="1"
                />
                {errors.quantity && (
                  <p className="text-sm text-error mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="unit" className="label">
                  Unit <span className="text-error">*</span>
                </label>
                <select
                  {...register('unit')}
                  id="unit"
                  className={`input ${errors.unit ? 'border-error' : ''}`}
                >
                  <option value="">Select unit</option>
                  <option value="units">Units</option>
                  <option value="boxes">Boxes</option>
                  <option value="meters">Meters</option>
                  <option value="kilograms">Kilograms</option>
                  <option value="liters">Liters</option>
                </select>
                {errors.unit && (
                  <p className="text-sm text-error mt-1">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="input"
                placeholder="Enter any additional details about the item"
              />
            </div>
          </div>
        )}

        {/* Step 2: Additional Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Additional Details</h2>

            <div>
              <label htmlFor="unit_price" className="label">
                Unit Price (Optional)
              </label>
              <input
                {...register('unit_price', { valueAsNumber: true })}
                type="number"
                id="unit_price"
                className={`input ${errors.unit_price ? 'border-error' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.unit_price && (
                <p className="text-sm text-error mt-1">{errors.unit_price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="supplier" className="label">
                Supplier Name (Optional)
              </label>
              <input
                {...register('supplier')}
                type="text"
                id="supplier"
                className="input"
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <label htmlFor="purchase_date" className="label">
                Purchase Date (Optional)
              </label>
              <input
                {...register('purchase_date')}
                type="date"
                id="purchase_date"
                className="input"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Review & Submit</h2>
            <p className="text-muted-foreground">Please review the details before submitting</p>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Item Name</div>
                  <div className="text-foreground">{formValues.item_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Quantity</div>
                  <div className="text-foreground">
                    {formValues.quantity || '-'} {formValues.unit || ''}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Unit Price</div>
                  <div className="text-foreground">
                    {formValues.unit_price ? `$${formValues.unit_price.toFixed(2)}` : '-'}
                  </div>
                </div>
              </div>

              {formValues.description && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Description</div>
                  <div className="text-foreground">{formValues.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {formValues.supplier && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Supplier</div>
                    <div className="text-foreground">{formValues.supplier}</div>
                  </div>
                )}
                {formValues.purchase_date && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Purchase Date</div>
                    <div className="text-foreground">
                      {new Date(formValues.purchase_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Created By</div>
                <div className="text-foreground">{userProfile?.full_name || 'Current User'}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After submission, this receipt will be sent for verification.
                You can save it as a draft if you need to add more details later.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn btn-secondary flex items-center gap-2"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {step === 3 && (
              <button
                type="button"
                onClick={handleSubmit(onSaveDraft)}
                className="btn btn-secondary flex items-center gap-2"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateReceiptPage

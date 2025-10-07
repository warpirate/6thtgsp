import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useCreateReceipt, useSubmitReceipt } from '@/hooks'

// Form validation schema
const receiptSchema = z.object({
  grn_number: z.string().min(3, 'GRN number must be at least 3 characters'),
  supplier_name: z.string().min(3, 'Supplier name is required'),
  challan_number: z.string().min(1, 'Challan number is required'),
  challan_date: z.string().min(1, 'Challan date is required'),
  receipt_date: z.string().optional(),
  vehicle_number: z.string().optional(),
  remarks: z.string().optional(),
})

type ReceiptFormData = z.infer<typeof receiptSchema>

const CreateReceiptPage: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [step, setStep] = useState(1)
  
  const { mutate: createReceipt, isPending: isCreating } = useCreateReceipt()
  const { mutate: submitReceipt, isPending: isSubmitting } = useSubmitReceipt()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      grn_number: '',
      supplier_name: '',
      challan_number: '',
      challan_date: new Date().toISOString().split('T')[0],
      receipt_date: new Date().toISOString().split('T')[0],
      vehicle_number: '',
      remarks: '',
    },
  })

  const formValues = watch()

  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof ReceiptFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['grn_number', 'supplier_name', 'challan_number']
    } else if (currentStep === 2) {
      fieldsToValidate = ['challan_date', 'receipt_date']
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
    createReceipt(data as any, {
      onSuccess: () => {
        navigate('/receipts')
      }
    })
  }

  const onSubmit = async (data: ReceiptFormData) => {
    createReceipt(data as any, {
      onSuccess: (receipt) => {
        // After creating, submit it
        submitReceipt({ id: receipt.id }, {
          onSuccess: () => {
            navigate('/receipts')
          }
        })
      }
    })
  }

  const steps = [
    { number: 1, title: 'Basic Information', description: 'GRN and Supplier details' },
    { number: 2, title: 'Additional Details', description: 'Dates and vehicle info' },
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
              <label htmlFor="grn_number" className="label">
                GRN Number <span className="text-error">*</span>
              </label>
              <input
                {...register('grn_number')}
                type="text"
                id="grn_number"
                className={`input ${errors.grn_number ? 'border-error' : ''}`}
                placeholder="Enter GRN number"
              />
              {errors.grn_number && (
                <p className="text-sm text-error mt-1">{errors.grn_number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="supplier_name" className="label">
                Supplier Name <span className="text-error">*</span>
              </label>
              <input
                {...register('supplier_name')}
                type="text"
                id="supplier_name"
                className={`input ${errors.supplier_name ? 'border-error' : ''}`}
                placeholder="Enter supplier name"
              />
              {errors.supplier_name && (
                <p className="text-sm text-error mt-1">{errors.supplier_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="challan_number" className="label">
                Challan Number <span className="text-error">*</span>
              </label>
              <input
                {...register('challan_number')}
                type="text"
                id="challan_number"
                className={`input ${errors.challan_number ? 'border-error' : ''}`}
                placeholder="Enter challan number"
              />
              {errors.challan_number && (
                <p className="text-sm text-error mt-1">{errors.challan_number.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Additional Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Additional Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="challan_date" className="label">
                  Challan Date <span className="text-error">*</span>
                </label>
                <input
                  {...register('challan_date')}
                  type="date"
                  id="challan_date"
                  className={`input ${errors.challan_date ? 'border-error' : ''}`}
                />
                {errors.challan_date && (
                  <p className="text-sm text-error mt-1">{errors.challan_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="receipt_date" className="label">
                  Receipt Date (Optional)
                </label>
                <input
                  {...register('receipt_date')}
                  type="date"
                  id="receipt_date"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="vehicle_number" className="label">
                Vehicle Number (Optional)
              </label>
              <input
                {...register('vehicle_number')}
                type="text"
                id="vehicle_number"
                className="input"
                placeholder="Enter vehicle number"
              />
            </div>

            <div>
              <label htmlFor="remarks" className="label">
                Remarks (Optional)
              </label>
              <textarea
                {...register('remarks')}
                id="remarks"
                rows={4}
                className="input"
                placeholder="Enter any additional remarks"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Review & Submit</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">GRN Number</span>
                <div className="font-medium">{formValues.grn_number}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Supplier</span>
                <div className="font-medium">{formValues.supplier_name}</div>
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

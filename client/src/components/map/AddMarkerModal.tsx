import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import MapService, { type CreateMapMarkerData } from '../../services/map.service'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AddMarkerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMapMarkerData) => void
  position: { x: number; y: number }
  isLoading?: boolean
}

export default function AddMarkerModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position, 
  isLoading = false 
}: AddMarkerModalProps) {
  const [markerTypes, setMarkerTypes] = useState<Record<string, string>>({})
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadMarkerTypes()
      reset()
    }
  }, [isOpen, reset])

  const loadMarkerTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const types = await MapService.getTypeOptions()
      // Convert array to object for easier use in select
      const typesObject: Record<string, string> = {}
      types.forEach(type => {
        typesObject[type.value] = type.label
      })
      setMarkerTypes(typesObject)
    } catch (error) {
      console.error('Failed to load marker types:', error)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleFormSubmit = (values: FormValues) => {
    const markerData: CreateMapMarkerData = {
      ...values,
      x_position: position.x,
      y_position: position.y,
      description: values.description || '', // Ensure description is always a string
    }
    onSubmit(markerData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Map Marker</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Position Display */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p className="text-sm font-medium">
                X: {position.x.toFixed(2)}, Y: {position.y.toFixed(2)}
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter marker name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Type Field */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                {...register('type')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading || isLoadingTypes}
              >
                <option value="">Select marker type</option>
                {Object.entries(markerTypes).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
              {isLoadingTypes && (
                <p className="mt-1 text-sm text-gray-500">Loading types...</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </div>
                ) : (
                  'Add Marker'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

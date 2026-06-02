import { useState, useRef, useEffect } from 'react'
import { XMarkIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'
import logger from '../utils/logger'

export default function CreateEventModal({ isOpen, onClose, onSubmit, defaultCategory, eventToEdit = null }) {
  const { admin } = useAuthStore()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_description: '',
    rulebook_drive_link: '',
    event_catagory: defaultCategory || 'Aurum',
    team_type: 'Individual',
    team_size: 1,
    max_participants: '',
    max_teams: '',
    event_type: 'Flagship',
    event_fee: '',
    event_coordinators: [{ name: '', contact: '', email: '' }]
  })
  
  const [poster, setPoster] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Effect to populate form data when editing
  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        event_name: eventToEdit.event_name || '',
        event_date: eventToEdit.event_date ? eventToEdit.event_date.split('T')[0] : '',
        event_description: eventToEdit.event_description || '',
        rulebook_drive_link: eventToEdit.rulebook_drive_link || '',
        event_catagory: eventToEdit.event_catagory || defaultCategory || 'Aurum',
        team_type: eventToEdit.team_type || 'Individual',
        team_size: eventToEdit.team_size || 1,
        max_participants: eventToEdit.max_participants || '',
        max_teams: eventToEdit.max_teams || '',
        event_type: eventToEdit.event_type || 'Flagship',
        event_fee: eventToEdit.event_fee || '',
        event_coordinators: eventToEdit.event_coordinators || [{ name: '', contact: '', email: '' }]
      })
      
      // Set existing poster preview
      if (eventToEdit.event_poster) {
        setPosterPreview(eventToEdit.event_poster)
      }
    } else {
      // Reset form for create mode
      setFormData({
        event_name: '',
        event_date: '',
        event_description: '',
        rulebook_drive_link: '',
        event_catagory: defaultCategory || 'Aurum',
        team_type: 'Individual',
        team_size: 1,
        max_participants: '',
        max_teams: '',
        event_type: 'Flagship',
        event_fee: '',
        event_coordinators: [{ name: '', contact: '', email: '' }]
      })
      setPosterPreview(null)
      setPoster(null)
    }
    setErrors({})
  }, [eventToEdit, defaultCategory])

  // Role-based category restrictions
  const getAvailableCategories = () => {
    if (admin?.role === 'SuperAdmin') return ['Aurum', 'Olympus', 'Yuva', 'Verve']
    if (admin?.role === 'Admin') return ['Aurum', 'Olympus', 'Yuva', 'Verve']
    if (admin?.role === 'Yuva') return ['Yuva']
    if (admin?.role === 'Olympus') return ['Olympus'] 
    if (admin?.role === 'Aurum') return ['Aurum']
    return ['Aurum', 'Olympus', 'Yuva', 'Verve']
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Auto-adjust team size when switching to Individual
    if (name === 'team_type' && value === 'Individual') {
      setFormData(prev => ({ ...prev, team_size: 1 }))
    }
  }

  const handleCoordinatorChange = (index, field, value) => {
    const updatedCoordinators = [...formData.event_coordinators]
    updatedCoordinators[index][field] = value
    setFormData(prev => ({ ...prev, event_coordinators: updatedCoordinators }))
  }

  const addCoordinator = () => {
    setFormData(prev => ({
      ...prev,
      event_coordinators: [...prev.event_coordinators, { name: '', contact: '', email: '' }]
    }))
  }

  const removeCoordinator = (index) => {
    if (formData.event_coordinators.length > 1) {
      const updatedCoordinators = formData.event_coordinators.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, event_coordinators: updatedCoordinators }))
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, poster: 'Please select a valid image file' }))
        return
      }
      
      // Validate file size (5MB for original)
      if (file.size > 5 * 1024 * 1024) {
        // Compress image if too large
        try {
          const compressedFile = await compressImage(file, 1024, 1024, 0.8)
          setPoster(compressedFile)
          setErrors(prev => ({ ...prev, poster: '' }))
          
          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => setPosterPreview(e.target.result)
          reader.readAsDataURL(compressedFile)
        } catch (error) {
          setErrors(prev => ({ ...prev, poster: 'Failed to compress image. Please try a smaller file.' }))
        }
        return
      }

      setPoster(file)
      setErrors(prev => ({ ...prev, poster: '' }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPosterPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Image compression utility
  const compressImage = (file, maxWidth, maxHeight, quality) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }))
              } else {
                reject(new Error('Canvas to Blob conversion failed'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.event_name?.trim()) {
      newErrors.event_name = 'Event name is required'
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required'
    } else {
      // Check if date is not in the past
      const selectedDate = new Date(formData.event_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.event_date = 'Event date cannot be in the past'
      }
    }

    if (!formData.rulebook_drive_link?.trim()) {
      newErrors.rulebook_drive_link = 'Rulebook drive link is required'
    } else {
      // Validate Google Drive URL format
      const driveUrlPattern = /(https?:\/\/)?(www\.)?(drive\.google\.com|docs\.google\.com)/i
      if (!driveUrlPattern.test(formData.rulebook_drive_link)) {
        newErrors.rulebook_drive_link = 'Please enter a valid Google Drive link'
      }
    }

    if (!formData.event_catagory) {
      newErrors.event_catagory = 'Event category is required'
    }

    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required'
    }

    if (formData.team_type === 'Team' && (!formData.team_size || formData.team_size < 2)) {
      newErrors.team_size = 'Team size must be at least 2 for team events'
    }

    // Only require max_participants for Individual events (not Casual)
    if (formData.team_type === 'Individual' && formData.event_type !== 'Casual') {
      if (!formData.max_participants) {
        newErrors.max_participants = 'Max participants is required'
      } else if (formData.max_participants < 1) {
        newErrors.max_participants = 'Max participants must be at least 1'
      }
    }

    // Only require max_teams for Team events
    if (formData.team_type === 'Team') {
      if (!formData.max_teams) {
        newErrors.max_teams = 'Max teams is required for team events'
      } else if (formData.max_teams < 1) {
        newErrors.max_teams = 'Max teams must be at least 1'
      }
    }

    if (!poster && !eventToEdit) {
      newErrors.poster = 'Event poster is required'
    }

    // Validate coordinators
    const invalidCoordinators = formData.event_coordinators.some(coord => 
      !coord.name?.trim() || !coord.contact?.trim() || !coord.email?.trim()
    )
    if (invalidCoordinators) {
      newErrors.coordinators = 'All coordinator fields (name, contact, email) must be filled'
    } else {
      // Validate email formats
      const invalidEmails = formData.event_coordinators.filter(
        coord => coord.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coord.email)
      )
      if (invalidEmails.length > 0) {
        newErrors.coordinators = 'Please enter valid email addresses for all coordinators'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'event_coordinators') {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === 'event_fee') {
          // Convert event_fee to number and append as string (FormData converts to string anyway)
          const feeValue = formData[key] === '' || formData[key] === null ? '0' : String(Number(formData[key]))
          formDataToSend.append(key, feeValue)
        } else {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Add poster file only if a new one was selected
      if (poster) {
        formDataToSend.append('event_poster', poster)
      }
      
      await onSubmit(formDataToSend)
      
      // Reset form on success
      setFormData({
        event_name: '',
        event_date: '',
        event_description: '',
        rulebook_drive_link: '',
        event_catagory: defaultCategory || 'Aurum',
        team_type: 'Individual',
        team_size: 1,
        max_participants: '',
        max_teams: '',
        event_type: 'Flagship',
        event_fee: '',
        event_coordinators: [{ name: '', contact: '', email: '' }]
      })
      setPoster(null)
      setPosterPreview(null)
      setErrors({})
      
    } catch (error) {
      logger.error('Create event error:', error);
      
      // Handle coordinator validation error specifically
      if (error.response?.data?.code === 'COORDINATOR_NOT_FOUND') {
        setErrors({ 
          coordinators: error.response.data.details,
          submit: `${error.response.data.message}. ${error.response.data.suggestion}` 
        })
      } else {
        setErrors({ submit: error.response?.data?.message || error.message || 'Failed to create event. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-black hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-black">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p>{errors.submit}</p>
                  {errors.coordinators && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800 font-medium">💡 Quick Solution:</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Go to <strong>Admin Management → Create Event Coordinator</strong> to add the missing coordinators first.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              name="event_name"
              value={formData.event_name}
              onChange={handleInputChange}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.event_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter event name"
            />
            {errors.event_name && (
              <p className="mt-1 text-sm text-red-600">{errors.event_name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.event_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.event_date && (
                <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>
              )}
            </div>

            {/* Event Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="event_catagory"
                value={formData.event_catagory}
                onChange={handleInputChange}
                disabled={defaultCategory && !['SuperAdmin', 'Admin'].includes(admin?.role)}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.event_catagory ? 'border-red-300' : 'border-gray-300'
                } ${defaultCategory && !['SuperAdmin', 'Admin'].includes(admin?.role) ? 'bg-gray-100' : ''}`}
              >
                {getAvailableCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.event_catagory && (
                <p className="mt-1 text-sm text-red-600">{errors.event_catagory}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.event_type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="Flagship">Flagship</option>
                <option value="Inter-college">Inter-college</option>
                <option value="Intra-college">Intra-college</option>
                <option value="Casual">Casual</option>
              </select>
              {errors.event_type && (
                <p className="mt-1 text-sm text-red-600">{errors.event_type}</p>
              )}
            </div>

            {/* Team Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participation Type *
              </label>
              <select
                name="team_type"
                value={formData.team_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Individual">Individual</option>
                <option value="Team">Team</option>
              </select>
            </div>

            {/* Team Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size *
              </label>
              <input
                type="number"
                name="team_size"
                value={formData.team_size}
                onChange={handleInputChange}
                min={formData.team_type === 'Team' ? 2 : 1}
                max="20"
                disabled={formData.team_type === 'Individual'}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.team_type === 'Individual' ? 'bg-gray-100' : ''
                } ${errors.team_size ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.team_size && (
                <p className="mt-1 text-sm text-red-600">{errors.team_size}</p>
              )}
            </div>
          </div>

          {formData.event_type !== 'Casual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Participants (for Individual events) */}
              {formData.team_type === 'Individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.max_participants ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter maximum number of participants"
                  />
                  {errors.max_participants && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
                  )}
                </div>
              )}

              {/* Max Teams (for team events) */}
              {formData.team_type === 'Team' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Teams *
                  </label>
                  <input
                    type="number"
                    name="max_teams"
                    value={formData.max_teams}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.max_teams ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter maximum number of teams"
                  />
                  {errors.max_teams && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_teams}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Event Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Fee (₹)
            </label>
            <input
              type="number"
              name="event_fee"
              value={formData.event_fee}
              onChange={handleInputChange}
              min="0"
              step="1"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.event_fee ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter event fee (0 for free events)"
            />
            {errors.event_fee && (
              <p className="mt-1 text-sm text-red-600">{errors.event_fee}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty or enter 0 for free events
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Description
            </label>
            <textarea
              name="event_description"
              value={formData.event_description}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the event"
            />
          </div>

          {/* Rulebook Drive Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rulebook Drive Link *
            </label>
            <input
              type="url"
              name="rulebook_drive_link"
              value={formData.rulebook_drive_link}
              onChange={handleInputChange}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rulebook_drive_link ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://drive.google.com/file/d/..."
            />
            {errors.rulebook_drive_link && (
              <p className="mt-1 text-sm text-red-600">{errors.rulebook_drive_link}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter a Google Drive link to the PDF rulebook for this event
            </p>
          </div>

          {/* Event Coordinators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Coordinators *
            </label>
            {formData.event_coordinators.map((coordinator, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 p-3 border border-gray-200 rounded-lg">
                <input
                  type="text"
                  value={coordinator.name}
                  onChange={(e) => handleCoordinatorChange(index, 'name', e.target.value)}
                  placeholder="Coordinator Name"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={coordinator.contact}
                  onChange={(e) => handleCoordinatorChange(index, 'contact', e.target.value)}
                  placeholder="Contact (Phone)"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={coordinator.email}
                    onChange={(e) => handleCoordinatorChange(index, 'email', e.target.value)}
                    placeholder="Email Address"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.event_coordinators.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCoordinator(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                      title="Remove Coordinator"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addCoordinator}
              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Coordinator
            </button>
            {errors.coordinators && (
              <p className="mt-1 text-sm text-red-600">{errors.coordinators}</p>
            )}
          </div>

          {/* Event Poster */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Poster *
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center px-4 py-2 border-2 border-dashed rounded-md text-sm font-medium hover:bg-gray-50 ${
                  errors.poster ? 'border-red-300 text-red-600' : 'border-gray-300 text-gray-700'
                }`}
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Choose Poster Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {poster && (
                <span className="text-sm text-green-600">
                  {poster.name}
                </span>
              )}
            </div>
            {posterPreview && (
              <div className="mt-2">
                <img
                  src={posterPreview}
                  alt="Poster Preview"
                  className="max-w-xs h-32 object-cover rounded-md border"
                />
              </div>
            )}
            {errors.poster && (
              <p className="mt-1 text-sm text-red-600">{errors.poster}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {eventToEdit ? 'Updating Event...' : 'Creating Event...'}
                </>
              ) : (
                eventToEdit ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
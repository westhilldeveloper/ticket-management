'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import { useAuth } from '@/app/context/AuthContext'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import ErrorBoundary from '@/app/components/common/ErrorBoundary'
import { 
  FiUpload, 
  FiX, 
  FiFile, 
  FiImage, 
  FiAlertCircle,
  FiCheckCircle,
  FiHelpCircle,
  FiPaperclip,
  FiCopy,
  FiArrowLeft,
  FiSend,
  FiFileText,
  FiUser,
  FiTag,
  FiBarChart2
} from 'react-icons/fi'

// Constants
const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md']
}

// Priority options with European styling
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-50 text-gray-600 border-gray-200', badge: '●', description: 'Non-urgent issues' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200', badge: '●●', description: 'Standard response time' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-50 text-amber-600 border-amber-200', badge: '●●●', description: 'Urgent attention needed' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-50 text-red-600 border-red-200', badge: '●●●●', description: 'System down or major issue' }
]

// Category options
const CATEGORY_OPTIONS = [
  { value: 'HR', label: 'Human Resources', description: 'HR-related inquiries', icon: '👥' },
  { value: 'IT', label: 'Information Technology', description: 'IT support and infrastructure', icon: '💻' },
  { value: 'TECHNICAL', label: 'Technical Support', description: 'Product technical issues', icon: '🔧' },
]

function NewTicketContent() {
  const { user, isLoading: authLoading } = useAuth()
  const { socket, connected } = useSocket()
  const toast = useToast()
  const router = useRouter()
  
  const [isClient, setIsClient] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [ticketLink, setTicketLink] = useState('')
  const [ticketNumber, setTicketNumber] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Form setup with validation
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty, isValid }, 
    watch, 
    reset,
    trigger
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      review: ''
    }
  })

  const selectedCategory = watch('category')
  const selectedPriority = watch('priority')
  const formValues = watch()

  // Memoized priority info
  const priorityInfo = useMemo(() => 
    PRIORITY_OPTIONS.find(p => p.value === selectedPriority) || PRIORITY_OPTIONS[1]
  , [selectedPriority])

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  // Validate form before submission
  const validateForm = useCallback(() => {
    const errors = []
    if (!formValues.title?.trim()) errors.push('Title is required')
    if (!formValues.description?.trim()) errors.push('Description is required')
    if (!formValues.category) errors.push('Category is required')
    if (!formValues.priority) errors.push('Priority is required')
    if (formValues.title?.length < 5) errors.push('Title must be at least 5 characters')
    if (formValues.description?.length < 20) errors.push('Description must be at least 20 characters')
    return errors
  }, [formValues])

  // Dropzone configuration with error handling
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`${file.file.name} is too large. Max size is 5MB`, { duration: 5000 })
              break
            case 'file-invalid-type':
              toast.error(`${file.file.name} has invalid file type. Allowed: Images, PDF, DOC, XLS, TXT`, { duration: 5000 })
              break
            case 'too-many-files':
              toast.error(`Maximum ${MAX_FILES} files allowed`, { duration: 5000 })
              break
            default:
              toast.error(`${file.file.name}: ${error.message}`, { duration: 5000 })
          }
        })
      })
    }

    if (files.length + acceptedFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`, { duration: 5000 })
      return
    }

    const newFiles = acceptedFiles.map(file => {
      let preview = null
      if (file.type.startsWith('image/')) {
        try {
          preview = URL.createObjectURL(file)
        } catch (error) {
          console.error('Error creating preview:', error)
        }
      }

      return {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploadProgress: 0,
        error: null
      }
    })

    setFiles(prev => [...prev, ...newFiles])
    
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) added`, { duration: 3000 })
    }
  }, [files.length, toast])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES,
    noClick: true,
    noKeyboard: true
  })

  const removeFile = useCallback((fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
    toast.info('File removed', { duration: 2000 })
  }, [toast])

  const clearAllFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    toast.info('All files cleared', { duration: 2000 })
  }, [files, toast])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return FiImage
    if (fileType?.includes('pdf')) return FiFile
    if (fileType?.includes('word') || fileType?.includes('document')) return FiFileText
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return FiFileText
    return FiPaperclip
  }

  const onSubmit = async (data) => {
    if (isSubmitting) return

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error))
      return
    }

    if (!user) {
      toast.error('You must be logged in to create a ticket')
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('title', data.title.trim())
      formData.append('description', data.description.trim())
      formData.append('category', data.category)
      formData.append('priority', data.priority)
      if (data.review?.trim()) {
        formData.append('review', data.review.trim())
      }
      
      files.forEach((fileObj) => {
        formData.append('attachments', fileObj.file)
        
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: Math.min(progress, 90)
          }))
          if (progress >= 90) clearInterval(interval)
        }, 100)
      })

      const loadingToast = toast.loading('Creating your ticket...', { duration: 30000 })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      toast.dismiss(loadingToast)

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create ticket')
      }

      files.forEach(file => {
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: 100
        }))
      })

      toast.success('Ticket created successfully!', { duration: 5000 })
      console.log("=====create socket in started",socket,connected)
      if (socket && connected) {
        try {
          socket.emit('ticket-created', {
    ...result.ticket,
    createdById: user.id, 
  })
  console.log("=====create socket in new")
        } catch (socketError) {
          console.warn('Socket emission failed:', socketError)
        }
      }

      setSubmitSuccess(true)
      setTicketLink(result.ticket.link || `${window.location.origin}/tickets/${result.ticket.id}`)
      setTicketNumber(result.ticket.ticketNumber || `#${result.ticket.id.slice(0, 8)}`)
      
      reset()
      clearAllFiles()

      setTimeout(() => {
        router.push(`/tickets/${result.ticket.id}`)
      }, 5000)

    } catch (error) {
      console.error('Error creating ticket:', error)
      
      let errorMessage = 'Failed to create ticket. Please try again.'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
      toast.error(errorMessage, { duration: 7000 })
      setUploadProgress({})
      
    } finally {
      setUploading(false)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && files.length > 0) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        clearAllFiles()
        router.back()
      }
    } else {
      router.back()
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!', { duration: 3000 })
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy link')
    }
  }

  // Handle hydration mismatch by not rendering dynamic content until client-side
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  // Loading states
  if (!isClient || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FiAlertCircle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">Authentication Required</h3>
          <p className="text-sm text-gray-500 mb-3">Please log in to create a ticket</p>
          <button
            onClick={() => router.push('/login')}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // Success view
  if (submitSuccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
                <FiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Ticket Created Successfully
            </h2>
            
            <p className="text-sm text-gray-500 mb-1">
              Ticket Number: <span className="font-mono font-medium">{ticketNumber}</span>
            </p>
            
            <p className="text-sm text-gray-600 mb-4">
              Your ticket has been submitted. You'll receive updates via email.
            </p>

            <div className="bg-gray-50 rounded border border-gray-200 p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Share this link to track the ticket:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={ticketLink}
                  readOnly
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white font-mono"
                  aria-label="Ticket link"
                />
                <button
                  onClick={() => copyToClipboard(ticketLink)}
                  className="p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
                  aria-label="Copy link"
                >
                  <FiCopy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => router.push(ticketLink.replace(window.location.origin, ''))}
                className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
              >
                View Ticket
              </button>
              <button
                onClick={() => {
                  setSubmitSuccess(false)
                  setTicketLink('')
                  setTicketNumber('')
                  reset()
                }}
                className="px-4 py-1.5 bg-white text-gray-600 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
              >
                Create Another
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-3">
              Redirecting in 5 seconds...
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Go back"
            >
              <FiArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">New Ticket</h1>
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
          </div>
          
          {/* Connection status */}
          {isClient && (
            <div className="flex items-center space-x-2">
              <div className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">
                {connected ? 'Live' : 'Connecting...'}
              </span>
            </div>
          )}
        </div>

        {/* Error alert */}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3" role="alert">
            <div className="flex items-start">
              <FiAlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <p className="text-xs text-red-700 mt-0.5">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form - Multi-column layout */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Main Content (spans 2 columns) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Basic Information Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FiHelpCircle className="mr-1.5 h-4 w-4 text-primary-500" />
                  Basic Information
                </h2>
                
                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="block text-xs font-medium text-gray-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title', { 
                      required: 'Title is required',
                      minLength: { value: 5, message: 'Min 5 characters' },
                      maxLength: { value: 100, message: 'Max 100 characters' }
                    })}
                    className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Unable to access email"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <FiAlertCircle className="h-3 w-3 mr-1" />
                      {errors.title.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formValues.title?.length || 0}/100
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-xs font-medium text-gray-600 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 20, message: 'Min 20 characters' }
                    })}
                    rows={4}
                    className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe your issue in detail..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <FiAlertCircle className="h-3 w-3 mr-1" />
                      {errors.description.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formValues.description?.length || 0}/5000
                  </p>
                </div>
              </div>

              {/* Attachments Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FiPaperclip className="mr-1.5 h-4 w-4 text-primary-500" />
                  Attachments
                </h2>
                
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border border-dashed rounded p-4 text-center transition-colors cursor-pointer
                    ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
                  onClick={open}
                >
                  <input {...getInputProps()} />
                  <FiUpload className={`mx-auto h-6 w-6 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                  <p className="mt-1 text-xs text-gray-600">
                    {isDragActive ? 'Drop files here' : 'Drag & drop or click to select'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max {MAX_FILES} files, 5MB each
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600">
                        Files ({files.length}/{MAX_FILES})
                      </p>
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear all
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {files.map((file) => {
                        const FileIcon = getFileIcon(file.type)
                        const progress = uploadProgress[file.id] || 0
                        
                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {file.preview ? (
                                <img 
                                  src={file.preview} 
                                  alt={file.name}
                                  className="h-8 w-8 object-cover rounded"
                                />
                              ) : (
                                <FileIcon className="h-5 w-5 text-gray-400" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                                {progress > 0 && progress < 100 && (
                                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                              aria-label={`Remove ${file.name}`}
                            >
                              <FiX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-4">
              {/* Category Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FiTag className="mr-1.5 h-4 w-4 text-primary-500" />
                  Category
                </h2>
                
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label
                      key={cat.value}
                      className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                        selectedCategory === cat.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={cat.value}
                        {...register('category', { required: 'Category is required' })}
                        className="sr-only"
                      />
                      <span className="mr-2 text-sm">{cat.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{cat.label}</p>
                        <p className="text-xs text-gray-500">{cat.description}</p>
                      </div>
                      {selectedCategory === cat.value && (
                        <div className="h-2 w-2 bg-primary-500 rounded-full" />
                      )}
                    </label>
                  ))}
                  {errors.category && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <FiAlertCircle className="h-3 w-3 mr-1" />
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Priority Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FiBarChart2 className="mr-1.5 h-4 w-4 text-primary-500" />
                  Priority
                </h2>
                
                <div className="space-y-2">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <label
                      key={priority.value}
                      className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                        selectedPriority === priority.value
                          ? priority.color
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={priority.value}
                        {...register('priority', { required: 'Priority is required' })}
                        className="sr-only"
                      />
                      <span className="mr-2 text-xs font-mono">{priority.badge}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{priority.label}</p>
                        <p className="text-xs text-gray-500">{priority.description}</p>
                      </div>
                    </label>
                  ))}
                  {errors.priority && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <FiAlertCircle className="h-3 w-3 mr-1" />
                      {errors.priority.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Info Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FiUser className="mr-1.5 h-4 w-4 text-primary-500" />
                  Additional Info
                </h2>
                
                <div>
                  <label htmlFor="review" className="block text-xs font-medium text-gray-600 mb-1">
                    Comments <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    id="review"
                    {...register('review')}
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any additional context..."
                  />
                </div>

                {/* Requester Info - Read-only */}
                {user && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Requested by</p>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions - Sticky bottom bar */}
          <div className="sticky bottom-0 mt-4 bg-white border-t border-gray-200 p-3 -mx-4 px-4">
            <div className="max-w-6xl mx-auto flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || isSubmitting || !isValid}
                className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500 min-w-[100px] flex items-center justify-center"
              >
                {uploading || isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="mr-1.5 h-3.5 w-3.5" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

// Main export with ErrorBoundary wrapper
export default function NewTicketPage() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
            <FiAlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500 mb-3 max-w-md">
              {error?.message || 'Unable to load the ticket creation form.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={resetError}
                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      )}
    >
      <NewTicketContent />
    </ErrorBoundary>
  )
}
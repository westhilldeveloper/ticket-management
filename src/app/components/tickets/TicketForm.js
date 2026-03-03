'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import {
  FiUpload,
  FiX,
  FiFile,
  FiAlertCircle,
  FiHelpCircle,
  FiPaperclip
} from 'react-icons/fi'

export default function TicketForm({ onSubmit, initialData = {}, isLoading = false }) {
  const [files, setFiles] = useState([])
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      category: initialData.category || '',
      priority: initialData.priority || 'MEDIUM',
      review: initialData.review || ''
    }
  })

  const selectedCategory = watch('category')
  const selectedPriority = watch('priority')

  // Dropzone configuration
  const onDrop = (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          if (error.code === 'file-too-large') {
            alert(`${file.file.name} is too large. Max size is 5MB`)
          } else if (error.code === 'file-invalid-type') {
            alert(`${file.file.name} has invalid file type`)
          }
        })
      })
    }

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  })

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFormSubmit = (data) => {
    // Create FormData
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category', data.category)
    formData.append('priority', data.priority)
    if (data.review) {
      formData.append('review', data.review)
    }
    
    // Append files
    files.forEach((fileObj) => {
      formData.append('attachments', fileObj.file)
    })

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiHelpCircle className="mr-2 text-primary-600" />
          Basic Information
        </h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title', { 
              required: 'Title is required',
              minLength: { value: 5, message: 'Title must be at least 5 characters' },
              maxLength: { value: 100, message: 'Title must be less than 100 characters' }
            })}
            className={`input-field ${errors.title ? 'border-red-500' : ''}`}
            placeholder="Brief description of your issue"
            disabled={isLoading}
          />
          {errors.title && (
            <p className="error-text mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className={`input-field ${errors.category ? 'border-red-500' : ''}`}
              disabled={isLoading}
            >
              <option value="">Select Category</option>
              <option value="HR">Human Resources (HR)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="TECHNICAL">Technical Support</option>
            </select>
            {errors.category && (
              <p className="error-text mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className={`input-field ${errors.priority ? 'border-red-500' : ''}`}
              disabled={isLoading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            {errors.priority && (
              <p className="error-text mt-1">{errors.priority.message}</p>
            )}
          </div>
        </div>

        {/* Priority Indicator */}
        {selectedPriority && (
          <div className={`p-3 rounded-lg ${
            selectedPriority === 'LOW' ? 'bg-blue-50 text-blue-700' :
            selectedPriority === 'MEDIUM' ? 'bg-green-50 text-green-700' :
            selectedPriority === 'HIGH' ? 'bg-orange-50 text-orange-700' :
            'bg-red-50 text-red-700'
          }`}>
            <p className="text-sm font-medium">
              {selectedPriority === 'LOW' && '🐢 Low Priority - Non-urgent issues'}
              {selectedPriority === 'MEDIUM' && '⚡ Medium Priority - Standard response time'}
              {selectedPriority === 'HIGH' && '🔴 High Priority - Urgent attention needed'}
              {selectedPriority === 'CRITICAL' && '🔥 Critical - System down or major issue'}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', { 
              required: 'Description is required',
              minLength: { value: 20, message: 'Please provide more details (at least 20 characters)' }
            })}
            rows="6"
            className={`input-field ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Please provide detailed information about your issue including:
• What happened?
• When did it happen?
• Steps to reproduce (if applicable)
• Any error messages received"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="error-text mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiPaperclip className="mr-2" />
          Attachments
        </h2>
        
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={isLoading} />
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max 5 files, up to 5MB each (Images, PDF, DOC, TXT)
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Selected Files ({files.length}/5)
            </p>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {file.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <FiFile className="h-6 w-6 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  disabled={isLoading}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Initial Review (Optional) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Initial Review</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            {...register('review')}
            rows="3"
            className="input-field"
            placeholder="Any additional context or comments you'd like to add..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <FiAlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need help?</h3>
            <p className="text-sm text-blue-700 mt-1">
              After submitting, a unique ticket link will be created and sent to the relevant department.
              You can track the status of your ticket in real-time.
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}
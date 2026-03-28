'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useSocket } from '@/app/context/SocketContext';
import { useToast } from '@/app/context/ToastContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { FiAlertCircle, FiArrowLeft, FiSend } from 'react-icons/fi';
  import axios from 'axios';

import BasicInfo from './components/BasicInfo';
import Attachments from './components/Attachments';
import CategorySelector from './components/CategorySelector';
import PrioritySelector from './components/PrioritySelector';
import RequesterInfo from './components/RequesterInfo';
import SuccessView from './components/SuccessView';
import { useFileUpload } from './hooks/useFileUpload';
import { PRIORITY_OPTIONS, CATEGORY_OPTIONS } from './constants';

function NewTicketContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false); // combined mounted & isClient
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketLink, setTicketLink] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for cleanup
  const intervalsRef = useRef([]);
  const redirectTimeoutRef = useRef(null);
  
  const { 
    files, 
    uploadProgress, 
    setUploadProgress,
    getRootProps, 
    getInputProps, 
    isDragActive, 
    open, 
    removeFile, 
    clearAllFiles
  } = useFileUpload();

  // Form setup
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      category: CATEGORY_OPTIONS[1]?.value,
      priority: 'MEDIUM',
      review: ''
    }
  });

  const { formState: { errors, isDirty, isValid }, watch, reset, handleSubmit } = methods;
  const selectedPriority = watch('priority');

  // Memoized priority info – keep if needed later, otherwise can remove
  // const priorityInfo = useMemo(() => 
  //   PRIORITY_OPTIONS.find(p => p.value === selectedPriority) || PRIORITY_OPTIONS[1]
  // , [selectedPriority]);

  // Cleanup intervals and timeout on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  // Client-side hydration flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate form before submission
  const validateFormData = useCallback(() => {
    const formValues = watch();
    const errors = [];
    if (!formValues.title?.trim()) errors.push('Title is required');
    if (!formValues.description?.trim()) errors.push('Description is required');
    if (!formValues.category) errors.push('Category is required');
    if (!formValues.priority) errors.push('Priority is required');
    if (formValues.title?.length < 5) errors.push('Title must be at least 5 characters');
    if (formValues.description?.length < 20) errors.push('Description must be at least 20 characters');
    return errors;
  }, [watch]); // fixed dependency



// Inside NewTicketContent
const onSubmit = async (data) => {
  if (isSubmitting) return;

  const validationErrors = validateFormData();
  if (validationErrors.length > 0) {
    validationErrors.forEach(error => toast.error(error));
    return;
  }

  if (!user) {
    toast.error('You must be logged in to create a ticket');
    router.push('/login');
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim());
    formData.append('category', data.category);
    formData.append('priority', data.priority);
    if (data.review?.trim()) {
      formData.append('review', data.review.trim());
    }
    
    files.forEach((fileObj) => {
      formData.append('attachments', fileObj.file);
    });

    const loadingToast = toast.loading('Creating your ticket...', { duration: 30000 });

    // Use Axios with progress tracking
    const response = await axios.post('/api/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // progressEvent.loaded: bytes uploaded so far
        // progressEvent.total: total bytes (may be undefined if server doesn't send Content-Length)
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Update progress for all files (or you can track per file if needed)
        // Since the total progress is for all files combined, you can set a global progress value.
        // For per-file progress, you'd need more complex logic (e.g., each file has its own progress based on its size).
        // Here we'll set a global progress value for simplicity.
        setUploadProgress({ global: percentCompleted });
      },
      timeout: 60000, // 60 seconds timeout
    });

    toast.dismiss(loadingToast);

    // response.data contains your ticket data
    const result = response.data;

    // Mark all files as complete
    setUploadProgress({ global: 100 });

    toast.success('Ticket created successfully!', { duration: 5000 });
    
    if (socket && connected) {
      try {
        socket.emit('ticket-created', {
          ...result.ticket,
          createdById: user.id,
        });
      } catch (socketError) {
        console.warn('Socket emission failed:', socketError);
      }
    }

    setSubmitSuccess(true);
    const ticketLinkValue = result?.ticket?.link || `${window.location.origin}/tickets/${result?.ticket?.id}`;
    const ticketNumberValue = result?.ticket?.ticketNumber || `#${result?.ticket?.id?.slice(0, 8) || 'temp'}`;
    setTicketLink(ticketLinkValue);
    setTicketNumber(ticketNumberValue);
    
    reset();
    clearAllFiles();

    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    redirectTimeoutRef.current = setTimeout(() => {
      if (result?.ticket?.id) {
        router.push(`/tickets/${result.ticket.id}`);
      } else {
        router.push('/tickets');
      }
    }, 5000);

  } catch (error) {
    console.error('Error creating ticket:', error);
    
    let errorMessage = 'Failed to create ticket. Please try again.';
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setSubmitError(errorMessage);
    toast.error(errorMessage, { duration: 7000 });
    setUploadProgress({});
    
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCancel = () => {
    if (isDirty && files.length > 0) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        clearAllFiles();
        router.back();
      }
    } else {
      router.back();
    }
  };

  const resetSuccess = () => {
    setSubmitSuccess(false);
    setTicketLink('');
    setTicketNumber('');
    reset();
  };

  // Loading states
  if (!mounted || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
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
    );
  }

  if (submitSuccess) {
    return (
      <DashboardLayout>
        <SuccessView ticketNumber={ticketNumber} ticketLink={ticketLink} onReset={resetSuccess} />
      </DashboardLayout>
    );
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
          {mounted && (
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

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-4">
                <BasicInfo />
                <Attachments 
                  files={files}
                  uploadProgress={uploadProgress}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                  open={open}
                  removeFile={removeFile}
                  clearAllFiles={clearAllFiles}
                />
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-4">
                <CategorySelector />
                <PrioritySelector />
                <RequesterInfo user={user} />
              </div>
            </div>

            {/* Form Actions */}
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
                  disabled={isSubmitting || !isValid}
                  className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500 min-w-[100px] flex items-center justify-center"
                >
                  {isSubmitting ? (
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
        </FormProvider>
      </div>
    </DashboardLayout>
  );
}

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
  );
}
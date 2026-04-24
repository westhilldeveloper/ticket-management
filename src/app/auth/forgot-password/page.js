// app/auth/forgot-password/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import OTPVerification from '@/app/components/auth/OTPVerification';
import { FiMail, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { forgotPassword } = useAuth();

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    // Basic email format validation (not just company domain)
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    // Optional: company domain check (adjust as needed)
    // if (!email.endsWith('@westhillinternational.com')) {
    //   setError('Please use your company email (@westhillinternational.com)');
    //   return false;
    // }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccessMessage('An OTP has been sent to your email address.');
        setShowOTP(true);
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) {
    return <OTPVerification email={email} isReset={true} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-16">
              <Image
                src="/images/finLogo.png"
                alt="Company Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Forgot password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No worries. Enter your email and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccessMessage('');
                }}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg 
                         placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                         transition duration-150 ease-in-out"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition"
            >
              <FiArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent 
                     text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                     disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200
                     shadow-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="small" />
                <span>Sending OTP...</span>
              </div>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 transition">
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-gray-400">
          We'll send a one-time password to verify your identity.
        </div>
      </div>
    </div>
  );
}
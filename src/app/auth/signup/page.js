// app/auth/signup/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import OTPVerification from '@/app/components/auth/OTPVerification';
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiBriefcase,
  FiMapPin,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    branch: '',
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();

  const departments = [
    'HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing', 'Chits', 'Travels',
  ];
  const branches = [
    'ENATHU', 'POOVATTOOR', 'KODUMON', 'HARIPAD', 'THRIPPUNITHURA', 'CHETTIKULANGARA',
    'MUTHUKULAM', 'KARUNAGAPALLY', 'CHETTIKULANGARA MAIN', 'KULATHUPUZHA', 'MULAKKUZHA',
    'KATTANAM', 'KUMBANAD', 'RANNI', 'VAIKOM', 'ALAPPUZHA', 'PALLIKATHODU', 'PUTHOOR',
    'PATHANAMTHITTA', 'MANNAR', 'PRAVINKODU', 'KOTTARAKKARA', 'ANCHAL', 'THRIPPUNITHURA TOWN',
    'MUVATTUPUZHA', 'KOTHAMANGALAM', 'THOPPUMPODY', 'PATHANAPURAM', 'MATTANCHERRY', 'ATHANI',
    'KECHERY', 'VADANAPALLI', 'KALMANDAPAM',
  ];

  // Email domain validation – exact match only
  const isValidEmail = (email) => {
    const allowedDomains = ['westhillinternational.com', 'finovestgroup.com'];
    const domain = email.split('@')[1];
    return domain && allowedDomains.includes(domain);
  };

  // Password strength: at least 8 chars, one uppercase, one lowercase, one number, one special char
  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      newErrors.email =
        'Must use a valid company email (@westhillinternational.com or @finovestgroup.com)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    if (!formData.consent) newErrors.consent = 'You must agree to the terms and privacy policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signup(formData);
      if (result.success) {
        setShowOTP(true);
      } else {
        setServerError(result.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setServerError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) {
    return <OTPVerification email={formData.email} />;
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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our platform to get started
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-start">
              <FiAlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                  sm:text-sm transition duration-150 ease-in-out
                  ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Company Email
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
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                  sm:text-sm transition duration-150 ease-in-out
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="name@westhillinternational.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Department & Branch - side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBriefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg appearance-none
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                    sm:text-sm transition duration-150 ease-in-out bg-white
                    ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>

            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="branch"
                  name="branch"
                  required
                  value={formData.branch}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg appearance-none
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                    sm:text-sm transition duration-150 ease-in-out bg-white
                    ${errors.branch ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              {errors.branch && <p className="mt-1 text-sm text-red-600">{errors.branch}</p>}
            </div>
          </div>

          {/* Password with visibility toggle */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                  sm:text-sm transition duration-150 ease-in-out
                  ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password with visibility toggle */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCheckCircle className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                  sm:text-sm transition duration-150 ease-in-out
                  ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex="-1"
              >
                {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* GDPR Consent */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={handleChange}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
              {errors.consent && <p className="mt-1 text-sm text-red-600">{errors.consent}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent 
                     text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                     disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="small" />
                <span>Creating account...</span>
              </div>
            ) : (
              'Sign up'
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 transition">
              Sign in
            </Link>
          </p>
        </form>

        <div className="text-center text-xs text-gray-400">
          Protected by industry-standard security
        </div>
      </div>
    </div>
  );
}
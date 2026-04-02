'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OTPVerification from '../../components/auth/OTPVerification';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
     branch: '',
    consent: false, // GDPR consent
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const { signup } = useAuth();

  const departments = ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing','Chits','Travels',];
  const branches =['ENATHU', 'POOVATTOOR', 'KODUMON', 'HARIPAD', 'THRIPPUNITHURA', 'CHETTIKULANGARA', 'MUTHUKULAM', 'KARUNAGAPALLY', 'CHETTIKULANGARA MAIN', 'KULATHUPUZHA', 'MULAKKUZHA', 'KATTANAM', 'KUMBANAD', 'RANNI', 'VAIKOM', 'ALAPPUZHA', 'PALLIKATHODU', 'PUTHOOR', 'PATHANAMTHITTA', 'MANNAR', 'PRAVINKODU', 'KOTTARAKKARA', 'ANCHAL', 'THRIPPUNITHURA TOWN', 'MUVATTUPUZHA', 'KOTHAMANGALAM', 'THOPPUMPODY', 'PATHANAPURAM', 'MATTANCHERRY', 'ATHANI', 'KECHERY', 'VADANAPALLI', 'KALMANDAPAM']
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Must use a valid company email (@westhillinternational.com or @finovestgroup.com)';
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

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.branch) {   // ✅ Validate branch
      newErrors.branch = 'Branch is required';
    }

    // GDPR consent (optional but recommended)
    if (!formData.consent) {
      newErrors.consent = 'You must agree to the terms and privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear server error on any input change
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signup(formData);
      if (result.success) {
        setShowOTP(true);
      } else {
        // Assume the API returns an error message
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        {/* Server error message */}
        {serverError && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">{serverError}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className="mt-1 input-field"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p id="name-error" className="error-text">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Company Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="mt-1 input-field"
                placeholder="name@westhillinternational.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p id="email-error" className="error-text">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                aria-invalid={!!errors.department}
                aria-describedby={errors.department ? 'department-error' : undefined}
                className="mt-1 input-field"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p id="department-error" className="error-text">
                  {errors.department}
                </p>
              )}
            </div>

             <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <select
                id="branch"
                name="branch"
                required
                aria-invalid={!!errors.branch}
                aria-describedby={errors.branch ? 'branch-error' : undefined}
                className="mt-1 input-field"
                value={formData.branch}
                onChange={handleChange}
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              {errors.branch && (
                <p id="branch-error" className="error-text">
                  {errors.branch}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="mt-1 input-field"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p id="password-error" className="error-text">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                className="mt-1 input-field"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="error-text">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* GDPR Consent Checkbox (optional but recommended) */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? 'consent-error' : undefined}
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
                {errors.consent && (
                  <p id="consent-error" className="error-text">
                    {errors.consent}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
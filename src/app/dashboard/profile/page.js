'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiSave, FiEye, FiEyeOff, 
  FiTrash2, FiCalendar, FiShield 
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        branch: data.user.branch || '',
        department: data.user.department || '',
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (passwordData.newPassword) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to set a new password';
      }
      if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'New password must be at least 8 characters';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    if (passwordData.newPassword && !validatePassword()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        branch: formData.branch,
        department: formData.department,
      };
      if (passwordData.newPassword) {
        payload.currentPassword = passwordData.currentPassword;
        payload.newPassword = passwordData.newPassword;
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Profile updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      fetchProfile(); // refresh profile data
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = async () => {
    const confirmed = confirm(
      '⚠️ GDPR Data Erasure Request\n\n' +
      'You are about to request permanent deletion of all your personal data.\n\n' +
      'This action cannot be undone. Your account and all associated data will be removed.\n\n' +
      'Do you want to proceed?'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/users/delete-request', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Deletion request submitted. You will receive a confirmation email.');
      // Optionally redirect to logout after a delay
      setTimeout(() => {
        window.location.href = '/api/auth/logout';
      }, 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Unable to load profile.</div>
      </DashboardLayout>
    );
  }

  // Format creation date (European style: DD/MM/YYYY)
  const formattedCreatedAt = profile.createdAt
    ? format(new Date(profile.createdAt), 'dd/MM/yyyy')
    : '—';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <FiUser className="text-gray-500" /> Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    className={`input-field w-full ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleProfileChange}
                    className="input-field w-full"
                    placeholder="e.g., Kochi, Bangalore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleProfileChange}
                    className="input-field w-full"
                    placeholder="e.g., IT, HR, Finance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={profile.role?.replace('_', ' ')}
                    disabled
                    className="input-field w-full bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <FiCalendar className="text-gray-400" />
                    <span className="text-sm text-gray-600">{formattedCreatedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-md font-medium text-gray-900 flex items-center gap-2 mb-4">
                <FiLock className="text-gray-500" /> Change Password
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="input-field w-full"
                  />
                  {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="input-field w-full"
                  />
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input-field w-full"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {showPasswords ? <FiEyeOff /> : <FiEye />}
                  {showPasswords ? 'Hide' : 'Show'} Passwords
                </button>
              </div>
            </div>

            {/* GDPR / Data Protection Notice */}
            <div className="pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FiShield className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your Data Protection Rights (GDPR)</h3>
                  <p className="text-xs text-gray-700 mt-1">
                    Under the General Data Protection Regulation (GDPR), you have the right to:
                  </p>
                  <ul className="text-xs text-gray-700 mt-2 list-disc list-inside space-y-0.5">
                    <li><strong>Access</strong> – request a copy of your personal data.</li>
                    <li><strong>Rectification</strong> – correct inaccurate or incomplete data.</li>
                    <li><strong>Erasure</strong> – request deletion of your data (Right to be forgotten).</li>
                    <li><strong>Restriction</strong> – limit how we process your data.</li>
                    <li><strong>Portability</strong> – receive your data in a structured format.</li>
                    <li><strong>Object</strong> – object to certain processing (e.g., direct marketing).</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    For any request, please contact our Data Protection Officer at <a href="mailto:privacy@example.com" className="text-blue-600 underline">privacy@example.com</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <LoadingSpinner size="small" /> : <><FiSave className="mr-2" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
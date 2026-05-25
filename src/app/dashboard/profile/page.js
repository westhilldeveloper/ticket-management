'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { 
  FiUser, FiMail, FiBriefcase, FiLock, FiSave, FiEye, FiEyeOff, 
  FiTrash2, FiCalendar, FiShield, FiAlertCircle
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

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
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePassword = () => {
    const newErrors = {};
    if (passwordData.newPassword) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to set a new password';
      }
      if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'New passwords do not match';
      }
    } else if (passwordData.currentPassword) {
      newErrors.newPassword = 'New password is required when current password is provided';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    // If no password change attempted, do nothing
    if (!passwordData.newPassword && !passwordData.currentPassword) {
      toast.info('No password change requested');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
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
        <div className="flex justify-center items-center h-64 text-gray-500">
          <FiAlertCircle className="mr-2" /> Unable to load profile.
        </div>
      </DashboardLayout>
    );
  }

  const formattedCreatedAt = profile.createdAt
    ? format(new Date(profile.createdAt), 'dd/MM/yyyy')
    : '—';

  // Bottom border style for password inputs only
  const inputClassName = (hasError = false) => `
    w-full px-0 py-2 text-gray-800 bg-transparent border-0 border-b-2 
    ${hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pink-400'}
    focus:outline-none focus:ring-0 transition-colors duration-150
  `;

  const labelClassName = "block text-sm font-medium text-gray-600 mb-1";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <FiUser className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500 mt-0.5">View your account information –  password can be changed</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information – Read only */}
            <section className="space-y-5">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-l-3 border-pink-500 pl-3">
                Personal Information (read only)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClassName}>Full Name</label>
                  <div className="pt-2 text-gray-700 text-sm border-b border-gray-100 pb-2">
                    {profile.name || '—'}
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Email Address</label>
                  <div className="pt-2 text-gray-700 text-sm border-b border-gray-100 pb-2">
                    {profile.email || '—'}
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Branch / Location</label>
                  <div className="pt-2 text-gray-700 text-sm border-b border-gray-100 pb-2">
                    {profile.branch || '—'}
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Department</label>
                  <div className="pt-2 text-gray-700 text-sm border-b border-gray-100 pb-2">
                    {profile.department || '—'}
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Role</label>
                  <div className="pt-2 text-gray-700 text-sm flex items-center gap-2">
                    <FiBriefcase className="w-4 h-4 text-gray-400" />
                    <span>{profile.role?.replace('_', ' ') || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Member Since</label>
                  <div className="pt-2 text-gray-700 text-sm flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    <span>{formattedCreatedAt}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Change Password – Editable */}
            <section className="pt-2 border-t border-gray-100">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-l-3 border-pink-500 pl-3 mb-5">
                Change Password
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <label className={labelClassName}>Current Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={inputClassName(!!passwordErrors.currentPassword)}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" /> {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClassName}>New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={inputClassName(!!passwordErrors.newPassword)}
                      placeholder="Minimum 8 characters"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label className={labelClassName}>Confirm New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={inputClassName(!!passwordErrors.confirmPassword)}
                      placeholder="Retype new password"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-1 rounded-md px-2 py-1"
                  >
                    {showPasswords ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                  </button>
                </div>
              </div>
            </section>

            {/* GDPR Notice */}
            <section className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiShield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your Data Protection Rights (GDPR)</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Under the General Data Protection Regulation (GDPR), you have the right to:
                  </p>
                  <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Access</strong> – request a copy of your personal data.</li>
                    <li><strong>Rectification</strong> – correct inaccurate or incomplete data.</li>
                    <li><strong>Erasure</strong> – request deletion of your data (Right to be forgotten).</li>
                    <li><strong>Restriction</strong> – limit how we process your data.</li>
                    <li><strong>Portability</strong> – receive your data in a structured format.</li>
                    <li><strong>Object</strong> – object to certain processing (e.g., direct marketing).</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3 pt-1 border-t border-gray-200">
                    For any request, please contact our Data Protection Officer.
                  </p>
                </div>
              </div>
            </section>

            {/* Action Buttons – only delete and save password */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 shadow-sm"
              >
                {saving ? <LoadingSpinner size="small" /> : <><FiSave className="mr-2" /> Update Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
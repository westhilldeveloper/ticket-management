'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import {
  FiSettings,
  FiMail,
  FiShield,
  FiDatabase,
  FiClock,
  FiBell,
  FiLock,
  FiGlobe,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiUpload
} from 'react-icons/fi'

export default function SettingsPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState({})

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      companyName: 'Westhill International',
      supportEmail: 'support@westhillinternational.com',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en'
    },
    ticket: {
      defaultPriority: 'MEDIUM',
      autoAssignEnabled: true,
      requireMDApproval: true,
      ticketPrefix: 'TKT',
      maxAttachments: 5,
      maxFileSize: 5,
      allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx']
    },
    email: {
      smtpHost: process.env.EMAIL_HOST || '',
      smtpPort: process.env.EMAIL_PORT || '587',
      smtpUser: process.env.EMAIL_USER || '',
      smtpPassword: '',
      fromEmail: process.env.EMAIL_FROM || '',
      enableNotifications: true,
      sendDailyDigest: true
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorAuth: false
    },
    notification: {
      emailNotifications: true,
      ticketCreated: true,
      statusChanged: true,
      mdApproval: true,
      dailySummary: false,
      weeklyReport: true
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      backupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings')
      }

      if (data.settings) {
        setSettings(prev => ({
          ...prev,
          ...data.settings
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError(error.message)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleArrayChange = (category, key, value, checked) => {
    setSettings(prev => {
      const currentArray = [...prev[category][key]]
      if (checked) {
        if (!currentArray.includes(value)) {
          currentArray.push(value)
        }
      } else {
        const index = currentArray.indexOf(value)
        if (index > -1) {
          currentArray.splice(index, 1)
        }
      }
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: currentArray
        }
      }
    })
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings')
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset settings')
      }

      setSettings(data.settings)
      toast.success('Settings reset to default')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const testEmailConnection = async () => {
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings.email),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Email test failed')
      }

      toast.success('Test email sent successfully')
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error(error.message)
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: FiGlobe },
    { id: 'ticket', name: 'Ticket Settings', icon: FiSettings },
    { id: 'email', name: 'Email Configuration', icon: FiMail },
    { id: 'security', name: 'Security', icon: FiLock },
    { id: 'notification', name: 'Notifications', icon: FiBell },
    { id: 'system', name: 'System', icon: FiDatabase }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <FiAlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Settings</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchSettings}
              className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure system parameters and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetSettings}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" />
              Reset to Default
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="small" /> : (
                <>
                  <FiSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.companyName}
                      onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                      className="input-field"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Singapore">Singapore</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                      className="input-field"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Format
                    </label>
                    <select
                      value={settings.general.timeFormat}
                      onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                      className="input-field"
                    >
                      <option value="12h">12-hour (12:00 PM)</option>
                      <option value="24h">24-hour (14:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                      className="input-field"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Settings */}
            {activeTab === 'ticket' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Ticket Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Priority
                    </label>
                    <select
                      value={settings.ticket.defaultPriority}
                      onChange={(e) => handleSettingChange('ticket', 'defaultPriority', e.target.value)}
                      className="input-field"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Number Prefix
                    </label>
                    <input
                      type="text"
                      value={settings.ticket.ticketPrefix}
                      onChange={(e) => handleSettingChange('ticket', 'ticketPrefix', e.target.value)}
                      className="input-field"
                      maxLength="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attachments
                    </label>
                    <input
                      type="number"
                      value={settings.ticket.maxAttachments}
                      onChange={(e) => handleSettingChange('ticket', 'maxAttachments', parseInt(e.target.value))}
                      className="input-field"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={settings.ticket.maxFileSize}
                      onChange={(e) => handleSettingChange('ticket', 'maxFileSize', parseInt(e.target.value))}
                      className="input-field"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoAssign"
                      checked={settings.ticket.autoAssignEnabled}
                      onChange={(e) => handleSettingChange('ticket', 'autoAssignEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoAssign" className="ml-2 block text-sm text-gray-900">
                      Enable auto-assignment
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireMD"
                      checked={settings.ticket.requireMDApproval}
                      onChange={(e) => handleSettingChange('ticket', 'requireMDApproval', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireMD" className="ml-2 block text-sm text-gray-900">
                      Require MD approval for high priority tickets
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed File Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.ticket.allowedFileTypes.includes(type)}
                          onChange={(e) => handleArrayChange('ticket', 'allowedFileTypes', type, e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">.{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpHost}
                      onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                      className="input-field"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpPort}
                      onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
                      className="input-field"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpUser}
                      onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                      className="input-field"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.smtp ? 'text' : 'password'}
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                        className="input-field pr-10"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, smtp: !prev.smtp }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword.smtp ? <FiEyeOff className="h-5 w-5 text-gray-400" /> : <FiEye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                      className="input-field"
                      placeholder="noreply@company.com"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={testEmailConnection}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Test Connection
                  </button>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.email.enableNotifications}
                      onChange={(e) => handleSettingChange('email', 'enableNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                      Enable email notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dailyDigest"
                      checked={settings.email.sendDailyDigest}
                      onChange={(e) => handleSettingChange('email', 'sendDailyDigest', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="dailyDigest" className="ml-2 block text-sm text-gray-900">
                      Send daily digest
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Minimum Length
                    </label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="input-field"
                      min="6"
                      max="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="input-field"
                      min="5"
                      max="480"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="input-field"
                      min="3"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireSpecial"
                      checked={settings.security.requireSpecialChar}
                      onChange={(e) => handleSettingChange('security', 'requireSpecialChar', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireSpecial" className="ml-2 block text-sm text-gray-900">
                      Require special character in password
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireNumber"
                      checked={settings.security.requireNumber}
                      onChange={(e) => handleSettingChange('security', 'requireNumber', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireNumber" className="ml-2 block text-sm text-gray-900">
                      Require number in password
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireUppercase"
                      checked={settings.security.requireUppercase}
                      onChange={(e) => handleSettingChange('security', 'requireUppercase', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
                      Require uppercase letter in password
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="twoFactor"
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="twoFactor" className="ml-2 block text-sm text-gray-900">
                      Enable two-factor authentication
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notification' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotify"
                      checked={settings.notification.emailNotifications}
                      onChange={(e) => handleSettingChange('notification', 'emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotify" className="ml-2 block text-sm text-gray-900">
                      Enable all email notifications
                    </label>
                  </div>

                  <div className="ml-6 space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifyCreated"
                        checked={settings.notification.ticketCreated}
                        onChange={(e) => handleSettingChange('notification', 'ticketCreated', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifyCreated" className="ml-2 block text-sm text-gray-900">
                        Ticket created
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifyStatus"
                        checked={settings.notification.statusChanged}
                        onChange={(e) => handleSettingChange('notification', 'statusChanged', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifyStatus" className="ml-2 block text-sm text-gray-900">
                        Status changed
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifyMD"
                        checked={settings.notification.mdApproval}
                        onChange={(e) => handleSettingChange('notification', 'mdApproval', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifyMD" className="ml-2 block text-sm text-gray-900">
                        MD approval required
                      </label>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-gray-700 mt-4">Digest Reports</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dailySummary"
                      checked={settings.notification.dailySummary}
                      onChange={(e) => handleSettingChange('notification', 'dailySummary', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="dailySummary" className="ml-2 block text-sm text-gray-900">
                      Send daily summary
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="weeklyReport"
                      checked={settings.notification.weeklyReport}
                      onChange={(e) => handleSettingChange('notification', 'weeklyReport', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="weeklyReport" className="ml-2 block text-sm text-gray-900">
                      Send weekly report
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <p className="font-medium text-yellow-800">Maintenance Mode</p>
                        <p className="text-sm text-yellow-700">
                          When enabled, only administrators can access the system
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.maintenanceMode}
                        onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FiDatabase className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Debug Mode</p>
                        <p className="text-sm text-gray-600">
                          Enable detailed error logging for development
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.debugMode}
                        onChange={(e) => handleSettingChange('system', 'debugMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Log Level
                      </label>
                      <select
                        value={settings.system.logLevel}
                        onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                        className="input-field"
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Backup Frequency
                      </label>
                      <select
                        value={settings.system.backupFrequency}
                        onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                        className="input-field"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retention Days
                      </label>
                      <input
                        type="number"
                        value={settings.system.retentionDays}
                        onChange={(e) => handleSettingChange('system', 'retentionDays', parseInt(e.target.value))}
                        className="input-field"
                        min="7"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="backupEnabled"
                      checked={settings.system.backupEnabled}
                      onChange={(e) => handleSettingChange('system', 'backupEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="backupEnabled" className="ml-2 block text-sm text-gray-900">
                      Enable automatic backups
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
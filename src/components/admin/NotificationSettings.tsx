import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Save, 
  TestTube, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Clock,
  Users,
  MessageSquare,
  Settings as SettingsIcon,
  Calendar,
  Target,
  Send
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationSystemService } from '../../services/notificationSystem';
import { telegramService } from '../../services/telegram';
import { 
  NotificationTemplate,
  ScheduledNotification,
  NotificationSettings as NotificationSettingsType
} from '../../types/notifications';
import { format, addDays, addHours } from 'date-fns';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'scheduled' | 'send'>('settings');
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [settingsData, templatesData, scheduledData] = await Promise.all([
        notificationSystemService.getNotificationSettings(user.id),
        notificationSystemService.getNotificationTemplates(user.id),
        notificationSystemService.getScheduledNotifications(user.id)
      ]);
      
      setSettings(settingsData);
      setTemplates(templatesData);
      setScheduledNotifications(scheduledData);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<NotificationSettingsType>) => {
    if (!user) return;
    
    try {
      await notificationSystemService.updateNotificationSettings(user.id, updates);
      await loadData();
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const handleSendTestNotification = async () => {
    if (!user) return;
    
    setTestingNotification(true);
    try {
      const success = await telegramService.sendTestMessage(user.telegramChatId || '-1002701066037');
      if (success) {
        alert('Test notification sent successfully! Check your Telegram.');
      } else {
        alert('Failed to send test notification. Please check your Telegram settings.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleSendImmediateNotification = async (notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
    targetTables: number[] | 'all';
    imageUrl?: string;
  }) => {
    if (!user) return;
    
    try {
      await notificationSystemService.sendImmediateNotification(
        user.id,
        notificationData.targetTables,
        {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          imageUrl: notificationData.imageUrl,
        }
      );
      
      alert('Notification sent successfully!');
      setShowSendModal(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Manage customer notifications and messaging</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSendTestNotification}
            disabled={testingNotification}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <TestTube className="w-4 h-4" />
            <span>{testingNotification ? 'Testing...' : 'Test Telegram'}</span>
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Now</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
            { id: 'scheduled', label: 'Scheduled', icon: Calendar },
            { id: 'send', label: 'Send Now', icon: Send },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Require Customer Consent</h3>
                  <p className="text-sm text-gray-600">Ask customers for permission before sending notifications</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ requireConsent: !settings?.requireConsent })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings?.requireConsent ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.requireConsent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consent Message
                </label>
                <textarea
                  value={settings?.consentMessage || ''}
                  onChange={(e) => handleUpdateSettings({ consentMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Message shown to customers when requesting notification permission"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Policy
                </label>
                <textarea
                  value={settings?.privacyPolicy || ''}
                  onChange={(e) => handleUpdateSettings({ privacyPolicy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="Privacy policy text for notification data handling"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings?.retentionDays || 30}
                    onChange={(e) => handleUpdateSettings({ retentionDays: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Notifications per Hour
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings?.maxNotificationsPerHour || 10}
                    onChange={(e) => handleUpdateSettings({ maxNotificationsPerHour: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Default Preferences */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Customer Preferences</h2>
            <p className="text-sm text-gray-600 mb-4">
              These preferences will be applied to new customers by default
            </p>
            
            <div className="space-y-4">
              {[
                { key: 'orderUpdates', label: 'Order Updates', description: 'Order status and preparation updates' },
                { key: 'promotions', label: 'Promotions & Offers', description: 'Special deals and promotional offers' },
                { key: 'generalInfo', label: 'General Information', description: 'Restaurant announcements and updates' },
                { key: 'emergencyAlerts', label: 'Emergency Alerts', description: 'Important safety and service alerts' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{pref.label}</h4>
                    <p className="text-xs text-gray-500">{pref.description}</p>
                  </div>
                  <button
                    onClick={() => handleUpdateSettings({
                      defaultPreferences: {
                        ...settings?.defaultPreferences,
                        [pref.key]: !settings?.defaultPreferences?.[pref.key as keyof typeof settings.defaultPreferences]
                      }
                    })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings?.defaultPreferences?.[pref.key as keyof typeof settings.defaultPreferences] ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings?.defaultPreferences?.[pref.key as keyof typeof settings.defaultPreferences] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Notification Templates</h2>
            <button
              onClick={() => setShowAddTemplate(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    template.type === 'success' ? 'bg-green-500' :
                    template.type === 'warning' ? 'bg-yellow-500' :
                    template.type === 'error' ? 'bg-red-500' :
                    template.type === 'promotion' ? 'bg-purple-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.message}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.type === 'success' ? 'bg-green-100 text-green-800' :
                    template.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    template.type === 'error' ? 'bg-red-100 text-red-800' :
                    template.type === 'promotion' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {template.type}
                  </span>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                <p className="text-gray-600 mb-4">Create notification templates to reuse common messages</p>
                <button
                  onClick={() => setShowAddTemplate(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create First Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h2>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled For
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message.substring(0, 50)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.targetTables === 'all' ? 'All Tables' : `${notification.targetTables.length} Tables`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(notification.scheduledFor), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                          notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                          notification.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {notification.status === 'pending' && (
                          <button
                            onClick={() => handleCancelScheduledNotification(notification.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Send Now Tab */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Immediate Notification</h2>
            <SendNotificationForm onSend={handleSendImmediateNotification} />
          </div>
        </div>
      )}

      {/* Add/Edit Template Modal */}
      {(showAddTemplate || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          userId={user?.id || ''}
          onClose={() => {
            setShowAddTemplate(false);
            setEditingTemplate(null);
          }}
          onSave={async (template) => {
            await loadData();
            setShowAddTemplate(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// Helper function to delete template
const handleDeleteTemplate = async (templateId: string) => {
  if (!confirm('Are you sure you want to delete this template?')) return;
  
  try {
    await notificationSystemService.deleteNotificationTemplate(templateId);
    // Reload data would be called from parent component
  } catch (error) {
    console.error('Error deleting template:', error);
    alert('Failed to delete template');
  }
};

// Helper function to cancel scheduled notification
const handleCancelScheduledNotification = async (notificationId: string) => {
  if (!confirm('Are you sure you want to cancel this scheduled notification?')) return;
  
  try {
    await notificationSystemService.cancelScheduledNotification(notificationId);
    // Reload data would be called from parent component
  } catch (error) {
    console.error('Error cancelling notification:', error);
    alert('Failed to cancel notification');
  }
};

// Send Notification Form Component
interface SendNotificationFormProps {
  onSend: (data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
    targetTables: number[] | 'all';
    imageUrl?: string;
  }) => void;
}

const SendNotificationForm: React.FC<SendNotificationFormProps> = ({ onSend }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetTables: 'all' as 'all' | number[],
    imageUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in title and message');
      return;
    }
    onSend(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Notification title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows={4}
          placeholder="Notification message"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="info">Information</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="promotion">Promotion</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Tables
          </label>
          <select
            value={formData.targetTables === 'all' ? 'all' : 'specific'}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              targetTables: e.target.value === 'all' ? 'all' : []
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Tables</option>
            <option value="specific">Specific Tables</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL (Optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Send Notification</span>
        </button>
      </div>
    </form>
  );
};

// Template Modal Component
interface TemplateModalProps {
  template: NotificationTemplate | null;
  userId: string;
  onClose: () => void;
  onSave: (template: NotificationTemplate) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, userId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    message: template?.message || '',
    type: template?.type || 'info' as const,
    imageUrl: template?.imageUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const templateData = {
        ...formData,
        userId,
      };

      if (template) {
        await notificationSystemService.updateNotificationTemplate(template.id, templateData);
        onSave({ ...template, ...templateData });
      } else {
        const id = await notificationSystemService.addNotificationTemplate(templateData);
        onSave({ id, ...templateData } as NotificationTemplate);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {template ? 'Edit Template' : 'Add New Template'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="info">Information</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
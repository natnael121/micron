import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Calendar, 
  Users, 
  Eye, 
  BarChart3,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image,
  X,
  Save,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationSystemService } from '../../services/notificationSystem';
import { 
  NotificationTemplate, 
  ScheduledNotification, 
  NotificationSettings as NotificationSettingsType 
} from '../../types/notifications';
import { format, addDays } from 'date-fns';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'scheduled' | 'privacy' | 'analytics'>('dashboard');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledNotification | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [templatesData, scheduledData, settingsData, analyticsData] = await Promise.all([
        notificationSystemService.getNotificationTemplates(user.id),
        notificationSystemService.getScheduledNotifications(user.id),
        notificationSystemService.getNotificationSettings(user.id),
        notificationSystemService.getNotificationAnalytics(user.id)
      ]);
      
      setTemplates(templatesData);
      setScheduledNotifications(scheduledData);
      setNotificationSettings(settingsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendImmediateNotification = async (
    targetTables: number[] | 'all',
    notification: {
      title: string;
      message: string;
      imageUrl?: string;
      type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
    }
  ) => {
    try {
      await notificationSystemService.sendImmediateNotification(user!.id, targetTables, notification);
      alert('Notification sent successfully!');
      await loadData();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await notificationSystemService.deleteNotificationTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleCancelScheduled = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled notification?')) return;
    
    try {
      await notificationSystemService.cancelScheduledNotification(id);
      await loadData();
    } catch (error) {
      console.error('Error cancelling notification:', error);
      alert('Failed to cancel notification');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingScheduled = scheduledNotifications.filter(n => n.status === 'pending');
  const recentNotifications = scheduledNotifications.filter(n => n.status === 'sent').slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Manage customer notifications and privacy settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Notification</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Send Now</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'templates', label: 'Templates', icon: Bell },
            { id: 'scheduled', label: 'Scheduled', icon: Calendar },
            { id: 'privacy', label: 'Privacy & Consent', icon: Shield },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalSent || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.deliveryRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingScheduled.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Scheduled Notifications */}
          {pendingScheduled.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Scheduled Notifications ({pendingScheduled.length})
              </h2>
              <div className="space-y-4">
                {pendingScheduled.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">
                          {format(new Date(notification.scheduledFor), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Target: {notification.targetTables === 'all' ? 'All Tables' : `${notification.targetTables.length} tables`}
                      </span>
                      <button
                        onClick={() => handleCancelScheduled(notification.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'success' ? 'bg-green-100' :
                      notification.type === 'warning' ? 'bg-yellow-100' :
                      notification.type === 'error' ? 'bg-red-100' :
                      notification.type === 'promotion' ? 'bg-purple-100' :
                      'bg-blue-100'
                    }`}>
                      <Bell className={`w-4 h-4 ${
                        notification.type === 'success' ? 'text-green-600' :
                        notification.type === 'warning' ? 'text-yellow-600' :
                        notification.type === 'error' ? 'text-red-600' :
                        notification.type === 'promotion' ? 'text-purple-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500">
                        {notification.sentAt && format(new Date(notification.sentAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                      notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
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
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{template.title}</h3>
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
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.message}</p>
                
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
                    onClick={() => {
                      // Quick send with this template
                      setShowCreateModal(true);
                      // Pre-fill with template data
                    }}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule New</span>
            </button>
          </div>

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
                          <div className="text-sm text-gray-500 line-clamp-1">{notification.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.targetTables === 'all' 
                            ? 'All Tables' 
                            : `${notification.targetTables.length} tables`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(notification.scheduledFor), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(notification.scheduledFor), 'HH:mm')}
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingScheduled(notification)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {notification.status === 'pending' && (
                            <button
                              onClick={() => handleCancelScheduled(notification.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <PrivacySettingsTab
          settings={notificationSettings}
          userId={user?.id || ''}
          onUpdate={async (updates) => {
            if (user) {
              await notificationSystemService.updateNotificationSettings(user.id, updates);
              await loadData();
            }
          }}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalDelivered}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.clickRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dismissed</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalDismissed}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <XCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.failedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateNotificationModal
          templates={templates}
          numberOfTables={user?.numberOfTables || 10}
          onClose={() => setShowCreateModal(false)}
          onSend={handleSendImmediateNotification}
          onSaveTemplate={async (template) => {
            const id = await notificationSystemService.addNotificationTemplate({
              ...template,
              userId: user!.id
            });
            setTemplates(prev => [...prev, { id, ...template, userId: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
          }}
        />
      )}

      {showScheduleModal && (
        <ScheduleNotificationModal
          templates={templates}
          numberOfTables={user?.numberOfTables || 10}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={async (scheduledData) => {
            await notificationSystemService.scheduleNotification({
              ...scheduledData,
              userId: user!.id
            });
            await loadData();
          }}
        />
      )}

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={async (updates) => {
            await notificationSystemService.updateNotificationTemplate(editingTemplate.id, updates);
            setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...updates } : t));
            setEditingTemplate(null);
          }}
        />
      )}

      {editingScheduled && (
        <ScheduledNotificationDetailModal
          notification={editingScheduled}
          onClose={() => setEditingScheduled(null)}
          onCancel={() => handleCancelScheduled(editingScheduled.id)}
        />
      )}
    </div>
  );
};

// Create Notification Modal
interface CreateNotificationModalProps {
  templates: NotificationTemplate[];
  numberOfTables: number;
  onClose: () => void;
  onSend: (targetTables: number[] | 'all', notification: any) => void;
  onSaveTemplate: (template: Omit<NotificationTemplate, 'id' | 'userId' | 'created_at' | 'updated_at'>) => void;
}

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  templates,
  numberOfTables,
  onClose,
  onSend,
  onSaveTemplate
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'promotion'>('info');
  const [targetTables, setTargetTables] = useState<number[]>([]);
  const [targetAll, setTargetAll] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [sending, setSending] = useState(false);

  const handleTableToggle = (tableNumber: number) => {
    setTargetTables(prev => 
      prev.includes(tableNumber)
        ? prev.filter(t => t !== tableNumber)
        : [...prev, tableNumber]
    );
  };

  const handleSelectAll = () => {
    if (targetAll) {
      setTargetTables([]);
      setTargetAll(false);
    } else {
      setTargetTables(Array.from({ length: numberOfTables }, (_, i) => i + 1));
      setTargetAll(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and message');
      return;
    }

    if (!targetAll && targetTables.length === 0) {
      alert('Please select at least one table or choose "All Tables"');
      return;
    }

    setSending(true);
    try {
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        type,
      };

      // Save as template if requested
      if (saveAsTemplate) {
        await onSaveTemplate(notificationData);
      }

      // Send notification
      await onSend(targetAll ? 'all' : targetTables, notificationData);
      onClose();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setMessage(template.message);
    setImageUrl(template.imageUrl || '');
    setType(template.type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Send Notification</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Templates */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Templates</h3>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => useTemplate(template)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Special Offer!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your notification message..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Tables *
            </label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={targetAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">All Tables</span>
                </label>
                <span className="text-sm text-gray-500">
                  {targetAll ? numberOfTables : targetTables.length} selected
                </span>
              </div>

              {!targetAll && (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Array.from({ length: numberOfTables }, (_, i) => i + 1).map(tableNumber => (
                    <button
                      key={tableNumber}
                      type="button"
                      onClick={() => handleTableToggle(tableNumber)}
                      className={`p-2 text-sm rounded border transition-colors ${
                        targetTables.includes(tableNumber)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {tableNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveAsTemplate"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="saveAsTemplate" className="ml-2 block text-sm text-gray-900">
              Save as template for future use
            </label>
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
              disabled={sending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Send Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Schedule Notification Modal
interface ScheduleNotificationModalProps {
  templates: NotificationTemplate[];
  numberOfTables: number;
  onClose: () => void;
  onSchedule: (data: Omit<ScheduledNotification, 'id' | 'userId' | 'created_at' | 'updated_at'>) => void;
}

const ScheduleNotificationModal: React.FC<ScheduleNotificationModalProps> = ({
  templates,
  numberOfTables,
  onClose,
  onSchedule
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'promotion'>('info');
  const [targetTables, setTargetTables] = useState<number[]>([]);
  const [targetAll, setTargetAll] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || !scheduledDate || !scheduledTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!targetAll && targetTables.length === 0) {
      alert('Please select at least one table or choose "All Tables"');
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledFor <= new Date()) {
      alert('Scheduled time must be in the future');
      return;
    }

    setScheduling(true);
    try {
      await onSchedule({
        templateId: '',
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        type,
        targetTables: targetAll ? 'all' : targetTables,
        scheduledFor: scheduledFor.toISOString(),
        status: 'pending',
      });
      onClose();
      alert('Notification scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      alert('Failed to schedule notification');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Schedule Notification</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Tables *
            </label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={targetAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">All Tables</span>
                </label>
                <span className="text-sm text-gray-500">
                  {targetAll ? numberOfTables : targetTables.length} selected
                </span>
              </div>

              {!targetAll && (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Array.from({ length: numberOfTables }, (_, i) => i + 1).map(tableNumber => (
                    <button
                      key={tableNumber}
                      type="button"
                      onClick={() => handleTableToggle(tableNumber)}
                      className={`p-2 text-sm rounded border transition-colors ${
                        targetTables.includes(tableNumber)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {tableNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              disabled={scheduling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{scheduling ? 'Scheduling...' : 'Schedule Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Privacy Settings Tab Component
interface PrivacySettingsTabProps {
  settings: NotificationSettingsType | null;
  userId: string;
  onUpdate: (updates: Partial<NotificationSettingsType>) => void;
}

const PrivacySettingsTab: React.FC<PrivacySettingsTabProps> = ({ settings, userId, onUpdate }) => {
  const [formData, setFormData] = useState({
    requireConsent: settings?.requireConsent ?? true,
    consentMessage: settings?.consentMessage || 'Would you like to receive notifications about your order status and restaurant updates?',
    privacyPolicy: settings?.privacyPolicy || 'We use notifications to keep you updated about your orders and restaurant services.',
    retentionDays: settings?.retentionDays || 30,
    maxNotificationsPerHour: settings?.maxNotificationsPerHour || 10,
    defaultPreferences: settings?.defaultPreferences || {
      orderUpdates: true,
      promotions: false,
      generalInfo: true,
      emergencyAlerts: true,
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(formData);
      alert('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      alert('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Consent Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireConsent"
              checked={formData.requireConsent}
              onChange={(e) => setFormData(prev => ({ ...prev, requireConsent: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="requireConsent" className="ml-2 block text-sm text-gray-900">
              Require customer consent before sending notifications
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consent Message
            </label>
            <textarea
              value={formData.consentMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, consentMessage: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Policy Text
            </label>
            <textarea
              value={formData.privacyPolicy}
              onChange={(e) => setFormData(prev => ({ ...prev, privacyPolicy: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (Days)
              </label>
              <input
                type="number"
                value={formData.retentionDays}
                onChange={(e) => setFormData(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Notifications Per Hour
              </label>
              <input
                type="number"
                value={formData.maxNotificationsPerHour}
                onChange={(e) => setFormData(prev => ({ ...prev, maxNotificationsPerHour: parseInt(e.target.value) || 10 }))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Customer Preferences
            </label>
            <div className="space-y-3">
              {Object.entries(formData.defaultPreferences).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      defaultPreferences: {
                        ...prev.defaultPreferences,
                        [key]: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Template Modal
interface EditTemplateModalProps {
  template: NotificationTemplate;
  onClose: () => void;
  onSave: (updates: Partial<NotificationTemplate>) => void;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ template, onClose, onSave }) => {
  const [title, setTitle] = useState(template.title);
  const [message, setMessage] = useState(template.message);
  const [imageUrl, setImageUrl] = useState(template.imageUrl || '');
  const [type, setType] = useState(template.type);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        type,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Template</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="info">Information</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="promotion">Promotion</option>
            </select>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Scheduled Notification Detail Modal
interface ScheduledNotificationDetailModalProps {
  notification: ScheduledNotification;
  onClose: () => void;
  onCancel: () => void;
}

const ScheduledNotificationDetailModal: React.FC<ScheduledNotificationDetailModalProps> = ({
  notification,
  onClose,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Scheduled Notification</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">{notification.title}</h3>
            <p className="text-gray-600 text-sm">{notification.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium capitalize">{notification.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium capitalize">{notification.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Scheduled:</span>
              <span className="ml-2 font-medium">
                {format(new Date(notification.scheduledFor), 'MMM dd, HH:mm')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Target:</span>
              <span className="ml-2 font-medium">
                {notification.targetTables === 'all' 
                  ? 'All Tables' 
                  : `${notification.targetTables.length} tables`}
              </span>
            </div>
          </div>

          {notification.status === 'pending' && (
            <div className="pt-4 border-t">
              <button
                onClick={onCancel}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Scheduled Notification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
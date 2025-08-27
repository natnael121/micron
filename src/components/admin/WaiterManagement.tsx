import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, User, MessageSquare, TestTube, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { telegramService } from '../../services/telegram';
import { WaiterAssignment } from '../../types';

export const WaiterManagement: React.FC = () => {
  const { user } = useAuth();
  const [waiters, setWaiters] = useState<WaiterAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWaiter, setShowAddWaiter] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<WaiterAssignment | null>(null);

  useEffect(() => {
    if (user) {
      loadWaiters();
    }
  }, [user]);

  const loadWaiters = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const assignments = await firebaseService.getWaiterAssignments(user.id);
      setWaiters(assignments);
    } catch (error) {
      console.error('Error loading waiter assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWaiter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this waiter assignment?')) return;
    
    try {
      await firebaseService.deleteWaiterAssignment(id);
      setWaiters(prev => prev.filter(waiter => waiter.id !== id));
    } catch (error) {
      console.error('Error deleting waiter assignment:', error);
      alert('Failed to delete waiter assignment');
    }
  };

  const testTelegramConnection = async (chatId: string, waiterName: string) => {
    if (!chatId) {
      alert('Please enter a Telegram Chat ID first');
      return;
    }

    try {
      const success = await telegramService.sendTestMessage(chatId);
      if (success) {
        alert(`Test message sent to ${waiterName}! Check your Telegram.`);
      } else {
        alert('Failed to send test message. Please check your Chat ID.');
      }
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      alert('Failed to send test message. Please check your Chat ID.');
    }
  };

  const toggleWaiterStatus = async (waiter: WaiterAssignment) => {
    try {
      await firebaseService.updateWaiterAssignment(waiter.id, { isActive: !waiter.isActive });
      setWaiters(prev => prev.map(w => 
        w.id === waiter.id ? { ...w, isActive: !waiter.isActive } : w
      ));
    } catch (error) {
      console.error('Error updating waiter status:', error);
      alert('Failed to update waiter status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Waiter Management</h1>
          <p className="text-gray-600">Assign tables to waiters and manage their notifications</p>
        </div>
        <button
          onClick={() => setShowAddWaiter(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Waiter</span>
        </button>
      </div>

      {/* Waiters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waiters.map((waiter) => (
          <div key={waiter.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{waiter.waiterName}</h3>
                  <p className="text-sm text-gray-500">
                    Tables {waiter.startTable}-{waiter.endTable}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleWaiterStatus(waiter)}
                  className={`p-2 rounded-lg transition-colors ${
                    waiter.isActive 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={waiter.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingWaiter(waiter)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="Edit Waiter"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteWaiter(waiter.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Delete Waiter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  waiter.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {waiter.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Table Range:</span>
                <span className="text-sm font-medium text-gray-900">
                  {waiter.startTable === waiter.endTable 
                    ? `Table ${waiter.startTable}` 
                    : `Tables ${waiter.startTable}-${waiter.endTable}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shift Hours:</span>
                <span className="text-sm font-medium text-gray-900">
                  {waiter.shiftStartTime || '09:00'} - {waiter.shiftEndTime || '17:00'}
                </span>
              </div>

              {waiter.workingDays && waiter.workingDays.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Working Days:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {waiter.workingDays.map(day => 
                      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                    ).join(', ')}
                  </span>
                </div>
              )}
              {waiter.telegramChatId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Telegram Chat ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={waiter.telegramChatId}
                      readOnly
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={() => testTelegramConnection(waiter.telegramChatId!, waiter.waiterName)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      title="Test Connection"
                    >
                      <TestTube className="w-3 h-3" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Created: {new Date(waiter.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {waiters.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No waiters assigned yet</h3>
            <p className="text-gray-600 mb-4">Create waiter assignments to organize table service</p>
            <button
              onClick={() => setShowAddWaiter(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Waiter
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Waiter Modal */}
      {(showAddWaiter || editingWaiter) && (
        <WaiterModal
          waiter={editingWaiter}
          userId={user?.id || ''}
          numberOfTables={user?.numberOfTables || 10}
          existingAssignments={waiters}
          onClose={() => {
            setShowAddWaiter(false);
            setEditingWaiter(null);
          }}
          onSave={(waiter) => {
            if (editingWaiter) {
              setWaiters(prev => prev.map(w => w.id === waiter.id ? waiter : w));
            } else {
              setWaiters(prev => [...prev, waiter]);
            }
            setShowAddWaiter(false);
            setEditingWaiter(null);
          }}
        />
      )}
    </div>
  );
};

// Waiter Modal Component
interface WaiterModalProps {
  waiter: WaiterAssignment | null;
  userId: string;
  numberOfTables: number;
  existingAssignments: WaiterAssignment[];
  onClose: () => void;
  onSave: (waiter: WaiterAssignment) => void;
}

const WaiterModal: React.FC<WaiterModalProps> = ({ 
  waiter, 
  userId, 
  numberOfTables, 
  existingAssignments,
  onClose, 
  onSave 
}) => {
  const [waiterName, setWaiterName] = useState(waiter?.waiterName || '');
  const [startTable, setStartTable] = useState(waiter?.startTable || 1);
  const [endTable, setEndTable] = useState(waiter?.endTable || 1);
  const [telegramChatId, setTelegramChatId] = useState(waiter?.telegramChatId || '');
  const [isActive, setIsActive] = useState(waiter?.isActive ?? true);
  const [shiftStartTime, setShiftStartTime] = useState(waiter?.shiftStartTime || '09:00');
  const [shiftEndTime, setShiftEndTime] = useState(waiter?.shiftEndTime || '17:00');
  const [workingDays, setWorkingDays] = useState<number[]>(waiter?.workingDays || [1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  const handleDayToggle = (day: number) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };
  const validateTableRange = () => {
    if (startTable > endTable) {
      return 'Start table must be less than or equal to end table';
    }
    
    if (startTable < 1 || endTable > numberOfTables) {
      return `Table numbers must be between 1 and ${numberOfTables}`;
    }

    // Check for overlapping assignments (excluding current waiter if editing)
    const otherAssignments = existingAssignments.filter(a => a.id !== waiter?.id);
    const hasOverlap = otherAssignments.some(assignment => {
      return !(endTable < assignment.startTable || startTable > assignment.endTable);
    });

    if (hasOverlap) {
      return 'Table range overlaps with existing waiter assignment';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waiterName.trim()) {
      alert('Please enter a waiter name');
      return;
    }

    const validationError = validateTableRange();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      const waiterData = {
        waiterName: waiterName.trim(),
        startTable,
        endTable,
        telegramChatId: telegramChatId.trim() || undefined,
        isActive,
        shiftStartTime,
        shiftEndTime,
        workingDays,
        userId,
        created_at: waiter?.created_at || new Date().toISOString(),
      };

      if (waiter) {
        await firebaseService.updateWaiterAssignment(waiter.id, waiterData);
        onSave({ ...waiter, ...waiterData });
      } else {
        const id = await firebaseService.addWaiterAssignment(waiterData);
        onSave({ id, ...waiterData } as WaiterAssignment);
      }
    } catch (error) {
      console.error('Error saving waiter assignment:', error);
      alert('Failed to save waiter assignment');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!telegramChatId.trim()) {
      alert('Please enter a Telegram Chat ID first');
      return;
    }

    try {
      const success = await telegramService.sendTestMessage(telegramChatId.trim());
      if (success) {
        alert('Test message sent successfully! Check your Telegram.');
      } else {
        alert('Failed to send test message. Please check your Chat ID.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Failed to send test message. Please check your Chat ID.');
    }
  };

  const validationError = validateTableRange();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {waiter ? 'Edit Waiter Assignment' : 'Add New Waiter'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waiter Name *
            </label>
            <input
              type="text"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., John Smith"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Table *
              </label>
              <input
                type="number"
                value={startTable}
                onChange={(e) => setStartTable(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                max={numberOfTables}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Table *
              </label>
              <input
                type="number"
                value={endTable}
                onChange={(e) => setEndTable(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                max={numberOfTables}
                required
              />
            </div>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telegram Chat ID (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 123456789 or -1002701066037"
                />
                {telegramChatId && (
                  <>
                    <button
                      type="button"
                      onClick={testConnection}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Test
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                This waiter will receive notifications for their assigned tables
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Start Time
              </label>
              <input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift End Time
              </label>
              <input
                type="time"
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Days
            </label>
            <div className="grid grid-cols-4 gap-2">
              {daysOfWeek.map(day => (
                <label key={day.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{day.short}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Waiter is currently active
            </label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-1">Table Assignment Preview:</h4>
            <p className="text-sm text-blue-700">
              {waiterName || 'This waiter'} will be responsible for{' '}
              {startTable === endTable 
                ? `Table ${startTable}` 
                : `Tables ${startTable} to ${endTable} (${endTable - startTable + 1} tables)`}
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-1">How to get Telegram Chat ID:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Send a message to @userinfobot on Telegram</li>
              <li>• Send /start command</li>
              <li>• Copy the Chat ID from the response</li>
              <li>• For group chats, add the bot to the group first</li>
            </ul>
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
              disabled={saving || !!validationError}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Waiter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
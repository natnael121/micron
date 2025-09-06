import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Save, Eye, EyeOff, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { imgbbService } from '../../services/imgbb';
import { MenuItem, Category, Department, MenuSchedule } from '../../types';

// Allergen options with icons
const ALLERGEN_OPTIONS = [
  { id: 'gluten', name: 'Gluten', icon: '🌾' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'nuts', name: 'Nuts', icon: '🥜' },
  { id: 'eggs', name: 'Eggs', icon: '🥚' },
  { id: 'soy', name: 'Soy', icon: '🫘' },
  { id: 'fish', name: 'Fish', icon: '🐟' },
  { id: 'shellfish', name: 'Shellfish', icon: '🦐' },
  { id: 'sesame', name: 'Sesame', icon: '🌰' },
  { id: 'vegan', name: 'Vegan', icon: '🌱' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬' },
  { id: 'spicy', name: 'Spicy', icon: '🌶️' },
  { id: 'halal', name: 'Halal', icon: '☪️' },
  { id: 'kosher', name: 'Kosher', icon: '✡️' },
];

  const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schedules, setSchedules] = useState<MenuSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<MenuSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'schedules'>('items');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [items, cats, depts, scheds] = await Promise.all([
        firebaseService.getMenuItems(user.id),
        firebaseService.getCategories(user.id),
        firebaseService.getDepartments(user.id),
        firebaseService.getMenuSchedules(user.id)
      ]);
      setMenuItems(items);
      setCategories(cats);
      setDepartments(depts);
      setSchedules(scheds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await firebaseService.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await firebaseService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await firebaseService.deleteMenuSchedule(id);
      setSchedules(prev => prev.filter(sched => sched.id !== id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await firebaseService.updateMenuItem(item.id, { available: !item.available });
      setMenuItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, available: !i.available } : i
      ));
    } catch (error) {
      console.error('Error updating item availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getCurrentSchedule = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    return schedules.find(schedule => {
      if (!schedule.isActive || !schedule.daysOfWeek.includes(currentDay)) return false;
      const start = schedule.startTime;
      const end = schedule.endTime;
      return currentTime >= start && currentTime <= end;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your menu items and categories</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddSchedule(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'items', label: 'Menu Items', icon: Edit },
            { id: 'categories', label: 'Categories', icon: Plus },
            { id: 'schedules', label: 'Schedules', icon: Clock },
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

      {/* Current Schedule Banner */}
      {getCurrentSchedule() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Now Showing: {getCurrentSchedule()?.name} ({getCurrentSchedule()?.startTime}–{getCurrentSchedule()?.endTime})
            </span>
          </div>
        </div>
      )}

      {/* Categories Section */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Menu Items Section */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleItemAvailability(item)}
                    className={`p-2 rounded-full ${
                      item.available 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-green-600">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    {item.department && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {departments.find(d => d.id === item.department)?.name || item.department}
                      </span>
                    )}
                    {item.scheduleIds && item.scheduleIds.length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {schedules.find(s => item.scheduleIds?.includes(s.id))?.name || 'Scheduled'}
                      </span>
                    )}
                    {item.allergens && (
                      <div className="flex space-x-1">
                        {item.allergens.split(',').slice(0, 3).map((allergen, index) => {
                          const allergenData = ALLERGEN_OPTIONS.find(a => 
                            a.name.toLowerCase() === allergen.trim().toLowerCase()
                          );
                          return allergenData ? (
                            <span key={index} className="text-sm" title={allergenData.name}>
                              {allergenData.icon}
                            </span>
                          ) : null;
                        })}
                        {item.allergens.split(',').length > 3 && (
                          <span className="text-xs text-gray-500">+{item.allergens.split(',').length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Schedules Section */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Schedules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      {schedule.daysOfWeek.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      schedule.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(showAddItem || editingItem) && (
        <ItemModal
          item={editingItem}
          categories={categories}
          departments={departments}
          schedules={schedules}
          userId={user?.id || ''}
          onClose={() => {
            setShowAddItem(false);
            setEditingItem(null);
          }}
          onSave={(item) => {
            if (editingItem) {
              setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
            } else {
              setMenuItems(prev => [...prev, item]);
            }
            setShowAddItem(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          userId={user?.id || ''}
          onClose={() => {
            setShowAddCategory(false);
            setEditingCategory(null);
          }}
          onSave={(category) => {
            if (editingCategory) {
              setCategories(prev => prev.map(c => c.id === category.id ? category : c));
            } else {
              setCategories(prev => [...prev, category]);
            }
            setShowAddCategory(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Add/Edit Schedule Modal */}
      {(showAddSchedule || editingSchedule) && (
        <ScheduleModal
          schedule={editingSchedule}
          userId={user?.id || ''}
          onClose={() => {
            setShowAddSchedule(false);
            setEditingSchedule(null);
          }}
          onSave={(schedule) => {
            if (editingSchedule) {
              setSchedules(prev => prev.map(s => s.id === schedule.id ? schedule : s));
            } else {
              setSchedules(prev => [...prev, schedule]);
            }
            setShowAddSchedule(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};

// Item Modal Component
interface ItemModalProps {
  item: MenuItem | null;
  categories: Category[];
  departments: Department[];
  schedules: MenuSchedule[];
  userId: string;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, categories, departments, schedules, userId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || '',
    preparation_time: item?.preparation_time || 0,
    ingredients: item?.ingredients || '',
    allergens: item?.allergens || '',
    available: item?.available ?? true,
    department: item?.department || '',
    scheduleIds: item?.scheduleIds || [],
  });
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(
    item?.allergens ? item.allergens.split(',').map(a => a.trim()) : []
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState(item?.photo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAllergenToggle = (allergenId: string) => {
    setSelectedAllergens(prev => {
      const newAllergens = prev.includes(allergenId)
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId];
      
      // Update form data
      setFormData(prevForm => ({
        ...prevForm,
        allergens: newAllergens.join(', ')
      }));
      
      return newAllergens;
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhoto(file);
    setUploading(true);

    try {
      const url = await imgbbService.uploadImage(file, `${userId}_${Date.now()}`);
      setPhotoUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleScheduleChange = (scheduleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      scheduleIds: checked 
        ? [...prev.scheduleIds, scheduleId]
        : prev.scheduleIds.filter(id => id !== scheduleId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const itemData = {
        ...formData,
        photo: photoUrl,
        userId,
        popularity_score: item?.popularity_score || 0,
        views: item?.views || 0,
        orders: item?.orders || 0,
        last_updated: new Date().toISOString(),
      };

      if (item) {
        await firebaseService.updateMenuItem(item.id, itemData);
        onSave({ ...item, ...itemData });
      } else {
        const id = await firebaseService.addMenuItem(itemData);
        onSave({ id, ...itemData } as MenuItem);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                  Available for ordering
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedules (Optional)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {schedules.length === 0 ? (
                <p className="text-sm text-gray-500">No schedules available. Create schedules first.</p>
              ) : (
                schedules.map(schedule => (
                  <label key={schedule.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.scheduleIds.includes(schedule.id)}
                      onChange={(e) => handleScheduleChange(schedule.id, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {schedule.name} ({schedule.startTime} - {schedule.endTime})
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave unchecked to show item at all times</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="space-y-4">
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            <input
              type="text"
              value={formData.ingredients}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Tomatoes, Cheese, Basil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergens & Dietary Information
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => handleAllergenToggle(allergen.id)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      selectedAllergens.includes(allergen.id)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{allergen.icon}</span>
                    <span className="text-xs font-medium text-center">{allergen.name}</span>
                  </button>
                ))}
              </div>
              
              {selectedAllergens.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Selected allergens & dietary info:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAllergens.map(allergenId => {
                      const allergen = ALLERGEN_OPTIONS.find(a => a.id === allergenId);
                      return allergen ? (
                        <span
                          key={allergenId}
                          className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                        >
                          <span>{allergen.icon}</span>
                          <span>{allergen.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
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
              disabled={saving || uploading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal Component
interface CategoryModalProps {
  category: Category | null;
  userId: string;
  onClose: () => void;
  onSave: (category: Category) => void;
}

const FOOD_EMOJIS = [
  '🍕', '🍔', '🥗', '🍽️', '🍰', '🥤', '🥨', '🍝', '🦐', '🥩',
  '🥬', '🍲', '🥪', '🍳', '☕', '🍸', '🍷', '🍺', '🍗', '🐟',
  '🍚', '🍜', '🍞', '🧀', '🍎', '🍦', '🎂', '🍪', '🍵', '🧃',
  '💧', '🥐', '🌮', '🌯', '🥙', '🍖', '🍤', '🦀', '🦞', '🥓',
  '🥚', '🧈', '🥛', '🍯', '🥜', '🌰', '🥥', '🥝', '🍓', '🫐',
  '🍇', '🍊', '🍋', '🍌', '🍍', '🥭', '🍑', '🍒', '🍐', '🥑'
];

const CategoryModal: React.FC<CategoryModalProps> = ({ category, userId, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(category?.order || 0);
  const [icon, setIcon] = useState(category?.icon || '');
  const [saving, setSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        name,
        order,
        icon,
        userId,
        created_at: category?.created_at || new Date().toISOString(),
      };

      if (category) {
        await firebaseService.updateCategory(category.id, categoryData);
        onSave({ ...category, ...categoryData });
      } else {
        const id = await firebaseService.addCategory(categoryData);
        onSave({ id, ...categoryData } as Category);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setIcon(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {category ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Icon (Emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="🍕"
              maxLength={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter an emoji to represent this category
            </p>
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
              <span>{saving ? 'Saving...' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Schedule Modal Component
interface ScheduleModalProps {
  schedule: MenuSchedule | null;
  userId: string;
  onClose: () => void;
  onSave: (schedule: MenuSchedule) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ schedule, userId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    startTime: schedule?.startTime || '09:00',
    endTime: schedule?.endTime || '17:00',
    daysOfWeek: schedule?.daysOfWeek || [1, 2, 3, 4, 5], // Mon-Fri default
    isActive: schedule?.isActive ?? true,
    order: schedule?.order || 0,
  });
  const [saving, setSaving] = useState(false);

  const daysOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }
    
    if (formData.daysOfWeek.length === 0) {
      alert('Please select at least one day');
      return;
    }

    setSaving(true);

    try {
      const scheduleData = {
        ...formData,
        name: formData.name.trim(),
        userId,
        created_at: schedule?.created_at || new Date().toISOString(),
      };

      if (schedule) {
        await firebaseService.updateMenuSchedule(schedule.id, scheduleData);
        onSave({ ...schedule, ...scheduleData });
      } else {
        const id = await firebaseService.addMenuSchedule(scheduleData);
        onSave({ id, ...scheduleData } as MenuSchedule);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
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
              {schedule ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Breakfast, Lunch, Dinner"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days of Week *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeekOptions.map(day => (
                <label key={day.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.daysOfWeek.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Schedule is active
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
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuManagement;
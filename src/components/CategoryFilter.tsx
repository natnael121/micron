import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryIcons: Record<string, string> = {
  'pizza': '🍕',
  'burgers': '🍔',
  'salads': '🥗',
  'main course': '🍽️',
  'desserts': '🍰',
  'beverages': '🥤',
  'appetizers': '🥨',
  'pasta': '🍝',
  'seafood': '🦐',
  'meat': '🥩',
  'vegetarian': '🥬',
  'soups': '🍲',
  'sandwiches': '🥪',
  'breakfast': '🍳',
  'coffee': '☕',
  'cocktails': '🍸',
  'wine': '🍷',
  'beer': '🍺',
  'chicken': '🍗',
  'fish': '🐟',
  'rice': '🍚',
  'noodles': '🍜',
  'bread': '🍞',
  'cheese': '🧀',
  'fruits': '🍎',
  'ice cream': '🍦',
  'cake': '🎂',
  'cookies': '🍪',
  'tea': '🍵',
  'juice': '🧃',
  'soda': '🥤',
  'water': '💧'
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const getIcon = (category: Category) => {
    // First try to use the stored icon
    if (category.icon) {
      return category.icon;
    }
    
    // Then try to match by category name (case insensitive)
    const matchedIcon = categoryIcons[category.name.toLowerCase()];
    if (matchedIcon) {
      return matchedIcon;
    }
    
    // Default fallback
    return '🍽️';
  };

  return (
    <div className="bg-gray-900 px-4 py-4">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
            activeCategory === 'all'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span className="text-lg">🍽️</span>
          <span>All Items</span>
        </button>
        
        {categories.map((category) => {
          const icon = getIcon(category);
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
                activeCategory === category.name
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
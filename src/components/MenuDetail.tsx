import React, { useState } from 'react';
import { X, Plus, Minus, Clock, AlertTriangle, Star, ChefHat } from 'lucide-react';
import { ScheduledMenuItem } from '../types';

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

interface MenuDetailProps {
  item: ScheduledMenuItem;
  onClose: () => void;
  onAddToCart: (item: ScheduledMenuItem, quantity: number) => void;
}

export const MenuDetail: React.FC<MenuDetailProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    onClose();
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
      <div className="bg-gray-900 w-full max-w-md max-h-[90vh] rounded-xl overflow-hidden animate-slide-up flex flex-col shadow-xl">
        
        {/* Image smaller */}
        <div className="relative h-32">
          <img
            src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content compact */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
          {/* Title only (price removed here) */}
          <h2 className="text-base font-bold text-white">{item.name}</h2>

          {/* Description shorter */}
          <p className="text-gray-300 text-xs leading-snug line-clamp-2">
            {item.description}
          </p>

          {/* Info Row */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400" /> 
              <span>{(item.popularity_score / 20).toFixed(1) || "4.5"}</span>
            </span>
            <span>100 Kcal</span>
            {item.preparation_time > 0 && (
              <span>{item.preparation_time} Min</span>
            )}
          </div>

          {/* Recipe (compact) */}
          <div>
            <h3 className="text-white font-semibold mb-1 flex items-center space-x-1 text-xs">
              <ChefHat className="w-4 h-4" />
              <span>Recipe</span>
            </h3>
            <div className="space-y-1">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 text-[10px] font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-gray-300 text-[11px] leading-snug">
                  According to the recipe, the potatoes are...
                </p>
              </div>
            </div>
          </div>

          {/* Ingredients (tiny grid) */}
          {item.ingredients && (
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs">Ingredients</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {item.ingredients.split(',').slice(0, 4).map((ingredient, i) => {
                  const icons = ['🥔', '🧅', '🍅', '🥩'];
                  return (
                    <div key={i} className="text-center">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mb-0.5">
                        <span className="text-base">{icons[i] || '🥄'}</span>
                      </div>
                      <span className="text-gray-300 text-[10px] truncate">
                        {ingredient.trim()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allergens (tiny grid) */}
          {item.allergens && (
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Allergens</span>
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {item.allergens.split(',').map((allergen, i) => {
                  const found = ALLERGEN_OPTIONS.find(a => 
                    a.name.toLowerCase() === allergen.trim().toLowerCase()
                  );
                  return (
                    <div key={i} className="text-center">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mb-0.5">
                        <span className="text-base">{found?.icon || '⚠️'}</span>
                      </div>
                      <span className="text-gray-300 text-[10px] truncate">
                        {found?.name || allergen}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer compact */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center bg-gray-800 rounded-lg">
              <button
                onClick={decrementQuantity}
                className="p-1.5 hover:bg-gray-700 rounded-l-lg"
                disabled={!item.available || !item.isCurrentlyAvailable}
              >
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="px-3 py-1 font-bold text-white text-sm">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-1.5 hover:bg-gray-700 rounded-r-lg"
                disabled={!item.available || !item.isCurrentlyAvailable}
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="text-right">
              {quantity > 1 && (
                <div className="text-gray-400 text-[11px] mb-0.5">
                  ${item.price.toFixed(2)} × {quantity}
                </div>
              )}
              <div className="text-lg font-bold text-yellow-400">
                ${(item.price * quantity).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.available || !item.isCurrentlyAvailable}
            className="w-full bg-yellow-400 text-gray-900 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:text-gray-400"
          >
            {!item.available ? 'Unavailable' : 
             !item.isCurrentlyAvailable ? 
               (item.nextAvailableSchedule ? 
                 `Available at ${item.nextAvailableSchedule.name}` : 
                 'Not Available Now') : 
               'Add to Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

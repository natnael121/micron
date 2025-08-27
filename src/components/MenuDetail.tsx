import React, { useState } from 'react';
import { X, Plus, Minus, Clock, AlertTriangle, Star, ChefHat } from 'lucide-react';
import { ScheduledMenuItem } from '../types';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden animate-slide-up flex flex-col shadow-2xl">
        {/* Header with image */}
        <div className="relative h-64">
          <img
            src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Rating badge */}
          {item.popularity_score > 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm font-medium">
                {(item.popularity_score / 20).toFixed(1)}
              </span>
              <span className="text-gray-300 text-sm">
                ({item.orders})
              </span>
            </div>
          )}

          {/* Availability overlay */}
          {!item.available || !item.isCurrentlyAvailable ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                {!item.available ? (
                  <span className="font-semibold text-lg">Currently Unavailable</span>
                ) : item.nextAvailableSchedule ? (
                  <div>
                    <span className="font-semibold text-lg">Available at {item.nextAvailableSchedule.name}</span>
                    <div className="text-sm mt-1">
                      {item.nextAvailableSchedule.startTime}–{item.nextAvailableSchedule.endTime}
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold text-lg">Not Currently Available</span>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title and price */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-yellow-400">
                ${item.price.toFixed(2)}
              </span>
              {item.preparation_time > 0 && (
                <div className="flex items-center space-x-1 bg-yellow-400 rounded-full px-3 py-1">
                  <Clock className="w-4 h-4 text-gray-900" />
                  <span className="text-gray-900 text-sm font-medium">
                    {item.preparation_time} MIN
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 leading-relaxed">{item.description}</p>

          {/* Recipe section */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <ChefHat className="w-5 h-5" />
              <span>Recipe</span>
            </h3>
            
            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-900 text-sm font-bold">1</span>
                </div>
                <p className="text-gray-300 text-sm">
                  According to the recipe, the potatoes are...
                </p>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          {item.ingredients && (
            <div>
              <h3 className="text-white font-semibold mb-3">Ingredients</h3>
              <div className="grid grid-cols-4 gap-3">
                {item.ingredients.split(',').slice(0, 4).map((ingredient, index) => {
                  const ingredientIcons = ['🥔', '🧅', '🍅', '🥩'];
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-2">
                        <span className="text-2xl">{ingredientIcons[index] || '🥄'}</span>
                      </div>
                      <span className="text-gray-300 text-xs">
                        {ingredient.trim()}
                      </span>
                    </div>
                  );
                })}
              </div>
              {item.ingredients.split(',').length > 4 && (
                <button className="text-yellow-400 text-sm mt-3 flex items-center space-x-1">
                  <span>Show more</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Allergens */}
          {item.allergens && (
            <div className="flex items-start text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-sm">Allergens: </span>
                <span className="text-sm">{item.allergens}</span>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          {!item.isCurrentlyAvailable && item.nextAvailableSchedule && (
            <div className="flex items-start text-yellow-400 bg-yellow-900/20 px-4 py-3 rounded-xl">
              <Clock className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-sm">Available during: </span>
                <span className="text-sm">
                  {item.nextAvailableSchedule.name} ({item.nextAvailableSchedule.startTime}–{item.nextAvailableSchedule.endTime})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center bg-gray-800 rounded-xl">
              <button
                onClick={decrementQuantity}
                className="p-3 hover:bg-gray-700 rounded-l-xl transition-colors"
                disabled={!item.available || !item.isCurrentlyAvailable}
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="px-6 py-3 font-bold text-white text-lg">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-3 hover:bg-gray-700 rounded-r-xl transition-colors"
                disabled={!item.available || !item.isCurrentlyAvailable}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="text-right">
              {quantity > 1 && (
                <div className="text-gray-400 text-sm mb-1">
                  ${item.price.toFixed(2)} × {quantity}
                </div>
              )}
              <div className="text-2xl font-bold text-yellow-400">
                ${(item.price * quantity).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.available || !item.isCurrentlyAvailable}
            className="w-full bg-yellow-400 text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {!item.available ? 'Currently Unavailable' : 
             !item.isCurrentlyAvailable ? 
               (item.nextAvailableSchedule ? 
                 `Available at ${item.nextAvailableSchedule.name}` : 
                 'Not Currently Available') : 
               'Add to Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
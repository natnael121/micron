import React from 'react';
import { Plus, Clock, Star } from 'lucide-react';
import { ScheduledMenuItem } from '../types';

interface MenuCardProps {
  item: ScheduledMenuItem;
  onClick: () => void;
  onAddToCart: (item: ScheduledMenuItem) => void;
  theme?: 'classic' | 'modern' | 'elegant' | 'minimal';
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, onAddToCart, theme = 'modern' }) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.available && item.isCurrentlyAvailable) {
      onAddToCart(item);
    }
  };

  const isAvailable = item.available && item.isCurrentlyAvailable;

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-3xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 relative overflow-hidden ${
        !isAvailable ? 'opacity-75' : ''
      }`}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-gray-900/40 rounded-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Image */}
        <div className="relative mb-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-700">
            <img
              src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          {/* Plus button */}
          {isAvailable && (
            <button
              onClick={handleAddToCart}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-300 transition-colors z-20"
            >
              <Plus className="w-4 h-4 text-gray-900" />
            </button>
          )}

          {/* Rating */}

          {/* Preparation time */}
          {item.preparation_time > 0 && (
            <div className="absolute top-3 right-3 bg-yellow-400 rounded-full px-2 py-1 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-900" />
              <span className="text-gray-900 text-xs font-medium">
                {item.preparation_time} MIN
              </span>
            </div>
          )}

          {/* Availability overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white px-2">
                {!item.available ? (
                  <span className="font-semibold text-sm">Unavailable</span>
                ) : item.nextAvailableSchedule ? (
                  <div>
                    <span className="font-semibold text-xs">Available at</span>
                    <div className="text-xs mt-1">
                      {item.nextAvailableSchedule.name}
                    </div>
                    <div className="text-xs">
                      {item.nextAvailableSchedule.startTime}–{item.nextAvailableSchedule.endTime}
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold text-sm">Not Available</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
            {item.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">
              ${item.price.toFixed(2)}
            </span>
            {!item.isCurrentlyAvailable && item.nextAvailableSchedule && (
              <span className="text-yellow-400 text-xs font-medium">
                {item.nextAvailableSchedule.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
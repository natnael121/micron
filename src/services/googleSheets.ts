import { MenuItem } from '../types';

// Mock service for client-side use
// In production, this should be replaced with API calls to a backend service
class GoogleSheetsService {
  async getMenuItems(): Promise<MenuItem[]> {
    // Return demo data since googleapis can't run in browser
    // In production, this should make HTTP requests to your backend API
    return this.getDemoMenuItems();
  }

  async updateItemStats(itemId: string, field: 'views' | 'orders', increment: number = 1) {
    // In production, this should make HTTP requests to your backend API
    console.log(`Would update ${field} for item ${itemId} by ${increment}`);
    
    // Store stats locally for now
    const stats = JSON.parse(localStorage.getItem('itemStats') || '{}');
    if (!stats[itemId]) {
      stats[itemId] = { views: 0, orders: 0 };
    }
    stats[itemId][field] = (stats[itemId][field] || 0) + increment;
    localStorage.setItem('itemStats', JSON.stringify(stats));
  }

  private getDemoMenuItems(): MenuItem[] {
    return [
      {
        id: '1',
        name: 'Margherita Pizza',
        description: 'Fresh tomatoes, mozzarella, basil, and olive oil',
        price: 12.99,
        photo: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
        category: 'Pizza',
        available: true,
        preparation_time: 15,
        ingredients: 'Tomatoes, Mozzarella, Basil, Olive Oil',
        allergens: 'Gluten, Dairy',
        popularity_score: 95,
        views: 150,
        orders: 45,
        last_updated: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan and croutons',
        price: 8.99,
        photo: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
        category: 'Salads',
        available: true,
        preparation_time: 5,
        ingredients: 'Romaine Lettuce, Parmesan, Croutons, Caesar Dressing',
        allergens: 'Dairy, Gluten',
        popularity_score: 88,
        views: 120,
        orders: 32,
        last_updated: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with herbs and lemon',
        price: 18.99,
        photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        category: 'Main Course',
        available: true,
        preparation_time: 20,
        ingredients: 'Atlantic Salmon, Herbs, Lemon, Olive Oil',
        allergens: 'Fish',
        popularity_score: 92,
        views: 98,
        orders: 28,
        last_updated: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Chicken Burger',
        description: 'Grilled chicken breast with lettuce and tomato',
        price: 14.99,
        photo: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
        category: 'Burgers',
        available: true,
        preparation_time: 12,
        ingredients: 'Chicken Breast, Lettuce, Tomato, Bun',
        allergens: 'Gluten',
        popularity_score: 85,
        views: 89,
        orders: 25,
        last_updated: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with vanilla frosting',
        price: 6.99,
        photo: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
        category: 'Desserts',
        available: true,
        preparation_time: 3,
        ingredients: 'Chocolate, Flour, Sugar, Vanilla Frosting',
        allergens: 'Gluten, Dairy, Eggs',
        popularity_score: 90,
        views: 75,
        orders: 18,
        last_updated: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 4.99,
        photo: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
        category: 'Beverages',
        available: true,
        preparation_time: 2,
        ingredients: 'Fresh Oranges',
        allergens: 'None',
        popularity_score: 80,
        views: 65,
        orders: 22,
        last_updated: new Date().toISOString(),
      },
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();
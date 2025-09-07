import { firebaseService } from './firebase';
import { 
  DeliveryCompany, 
  RestaurantProfile, 
  DeliveryMenuItem, 
  DeliveryOrder, 
  DeliveryIntegration,
  DeliveryWebhookEvent,
  DeliveryAnalytics
} from '../types/delivery';
import { MenuItem, Category, User, Order } from '../types';

class DeliveryIntegrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${window.location.origin}/api/delivery`;
  }

  // =======================
  // Restaurant Profile Management
  // =======================
  
  async createRestaurantProfile(userId: string): Promise<RestaurantProfile> {
    try {
      const user = await firebaseService.getUserProfile(userId);
      if (!user) throw new Error('User not found');

      // Get additional business details
      const profile: RestaurantProfile = {
        restaurantName: user.businessName || user.name || 'Restaurant',
        restaurantId: userId,
        legalBusinessName: user.businessName || user.name || 'Restaurant',
        businessRegistrationNumber: user.businessRegistrationNumber,
        taxId: user.taxId,
        
        ownerName: user.name || 'Owner',
        managerName: user.managerName,
        contactEmail: user.email,
        contactPhone: user.phone || '',
        
        address: {
          line1: user.address || '',
          line2: user.addressLine2,
          city: user.city || '',
          state: user.state || '',
          postalCode: user.postalCode || '',
          country: user.country || 'US',
          latitude: user.latitude || 0,
          longitude: user.longitude || 0,
        },
        
        operatingHours: this.formatOperatingHours(user.aboutUs?.operatingHours),
        timeZone: user.timeZone || 'America/New_York',
        cuisineTypes: user.cuisineTypes || ['American'],
        averagePrepTime: user.averagePrepTime || 20,
        deliveryRadius: user.deliveryRadius || 5,
        
        financialDetails: user.financialDetails ? {
          bankAccount: user.financialDetails.bankAccount || '',
          iban: user.financialDetails.iban,
          swift: user.financialDetails.swift,
          currency: user.settings?.currency || 'USD',
          payoutMethod: user.financialDetails.payoutMethod || 'platform',
        } : undefined,
        
        description: user.aboutUs?.description,
        logo: user.logo,
        coverImage: user.coverImage,
        minimumOrderAmount: user.minimumOrderAmount || 15,
        deliveryFee: user.deliveryFee || 2.99,
        isActive: true,
      };

      return profile;
    } catch (error) {
      console.error('Error creating restaurant profile:', error);
      throw error;
    }
  }

  private formatOperatingHours(hours?: Record<string, string>) {
    const defaultHours = {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '23:00', isOpen: true },
      saturday: { open: '10:00', close: '23:00', isOpen: true },
      sunday: { open: '10:00', close: '21:00', isOpen: true },
    };

    if (!hours) return defaultHours;

    const formatted: Record<string, { open: string; close: string; isOpen: boolean }> = {};
    
    Object.entries(hours).forEach(([day, timeRange]) => {
      if (timeRange && timeRange !== 'Closed') {
        const [open, close] = timeRange.split(' - ');
        formatted[day] = {
          open: this.convertTo24Hour(open) || '09:00',
          close: this.convertTo24Hour(close) || '22:00',
          isOpen: true,
        };
      } else {
        formatted[day] = { open: '00:00', close: '00:00', isOpen: false };
      }
    });

    return { ...defaultHours, ...formatted };
  }

  private convertTo24Hour(time: string): string {
    if (!time) return '09:00';
    
    // If already in 24-hour format
    if (time.match(/^\d{2}:\d{2}$/)) return time;
    
    // Convert from 12-hour format
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '09:00';
    
    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }

  // =======================
  // Menu Synchronization
  // =======================
  
  async syncMenuToDeliveryCompany(userId: string, companyId: string): Promise<boolean> {
    try {
      const [menuItems, categories] = await Promise.all([
        firebaseService.getMenuItems(userId),
        firebaseService.getCategories(userId)
      ]);

      const deliveryMenu = this.convertMenuForDelivery(menuItems, categories);
      const profile = await this.createRestaurantProfile(userId);

      const response = await fetch(`${this.baseUrl}/sync-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantProfile: profile,
          menu: deliveryMenu,
          companyId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to sync menu: ${response.statusText}`);
      }

      // Update integration status
      await this.updateIntegrationStatus(userId, companyId, 'success');
      return true;
    } catch (error) {
      console.error('Error syncing menu:', error);
      await this.updateIntegrationStatus(userId, companyId, 'failed', error.message);
      throw error;
    }
  }

  private convertMenuForDelivery(menuItems: MenuItem[], categories: Category[]): DeliveryMenuItem[] {
    return menuItems
      .filter(item => item.available)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.photo,
        isAvailable: item.available,
        preparationTime: item.preparation_time || 15,
        ingredients: item.ingredients ? item.ingredients.split(',').map(i => i.trim()) : [],
        allergens: item.allergens ? item.allergens.split(',').map(a => a.trim()) : [],
        tags: this.generateTags(item),
      }));
  }

  private generateTags(item: MenuItem): string[] {
    const tags: string[] = [];
    
    if (item.allergens?.toLowerCase().includes('vegetarian')) tags.push('vegetarian');
    if (item.allergens?.toLowerCase().includes('vegan')) tags.push('vegan');
    if (item.description?.toLowerCase().includes('spicy')) tags.push('spicy');
    if (item.preparation_time <= 10) tags.push('quick');
    if (item.popularity_score > 90) tags.push('popular');
    
    return tags;
  }

  // =======================
  // Order Management
  // =======================
  
  async receiveDeliveryOrder(orderData: any): Promise<string> {
    try {
      // Convert delivery order format to our internal format
      const internalOrder = this.convertDeliveryOrderToInternal(orderData);
      
      // Add to our orders collection
      const orderId = await firebaseService.addOrder(internalOrder);
      
      // Send notification to restaurant
      await this.notifyRestaurantOfDeliveryOrder(internalOrder, orderData.deliveryCompany);
      
      // Auto-accept if enabled
      const integration = await this.getIntegration(internalOrder.userId, orderData.deliveryCompanyId);
      if (integration?.settings.autoAcceptOrders) {
        await this.updateOrderStatus(orderId, 'accepted', orderData.deliveryCompanyId);
      }
      
      return orderId;
    } catch (error) {
      console.error('Error receiving delivery order:', error);
      throw error;
    }
  }

  private convertDeliveryOrderToInternal(deliveryOrder: any): Omit<Order, 'id'> {
    return {
      tableNumber: 'DELIVERY',
      userId: deliveryOrder.restaurantId,
      items: deliveryOrder.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      totalAmount: deliveryOrder.subtotal, // Restaurant gets subtotal, not total with delivery fees
      status: 'pending',
      paymentStatus: deliveryOrder.paymentStatus === 'paid' ? 'paid' : 'pending',
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: deliveryOrder.customer.name,
        phone: deliveryOrder.customer.phone,
        email: deliveryOrder.customer.email,
      },
      notes: deliveryOrder.specialInstructions,
      deliveryInfo: {
        company: deliveryOrder.deliveryCompany,
        orderId: deliveryOrder.deliveryCompanyOrderId,
        address: deliveryOrder.customer.deliveryAddress,
        estimatedDeliveryTime: deliveryOrder.estimatedDeliveryTime,
      }
    };
  }

  async updateOrderStatus(
    orderId: string, 
    status: 'accepted' | 'preparing' | 'ready' | 'cancelled',
    deliveryCompanyId: string,
    estimatedTime?: number
  ): Promise<boolean> {
    try {
      // Update internal order status
      await firebaseService.updateOrder(orderId, { 
        status: status === 'accepted' ? 'confirmed' : status,
        estimatedPrepTime: estimatedTime 
      });

      // Send status update to delivery company
      const response = await fetch(`${this.baseUrl}/update-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          estimatedTime,
          deliveryCompanyId,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // =======================
  // Integration Management
  // =======================
  
  async getDeliveryCompanies(): Promise<DeliveryCompany[]> {
    try {
      const response = await fetch(`${this.baseUrl}/companies`);
      if (!response.ok) throw new Error('Failed to fetch delivery companies');
      
      const data = await response.json();
      return data.companies || [];
    } catch (error) {
      console.error('Error fetching delivery companies:', error);
      return [];
    }
  }

  async connectToDeliveryCompany(
    userId: string, 
    companyId: string, 
    credentials: any,
    settings?: Partial<DeliveryIntegration['settings']>
  ): Promise<string> {
    try {
      // Create integration record
      const integration: Omit<DeliveryIntegration, 'id'> = {
        userId,
        deliveryCompanyId: companyId,
        isActive: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'pending',
        settings: {
          autoAcceptOrders: false,
          defaultPrepTime: 20,
          markupPercentage: 0,
          syncFrequency: 60,
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const integrationId = await firebaseService.addDeliveryIntegration(integration);

      // Send restaurant profile to delivery company
      const profile = await this.createRestaurantProfile(userId);
      
      const response = await fetch(`${this.baseUrl}/connect-restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantProfile: profile,
          credentials,
          companyId,
          integrationId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to delivery company: ${response.statusText}`);
      }

      // Sync menu after successful connection
      await this.syncMenuToDeliveryCompany(userId, companyId);

      return integrationId;
    } catch (error) {
      console.error('Error connecting to delivery company:', error);
      throw error;
    }
  }

  async disconnectFromDeliveryCompany(userId: string, companyId: string): Promise<boolean> {
    try {
      // Deactivate integration
      const integrations = await this.getUserIntegrations(userId);
      const integration = integrations.find(i => i.deliveryCompanyId === companyId);
      
      if (integration) {
        await firebaseService.updateDeliveryIntegration(integration.id, { 
          isActive: false,
          updated_at: new Date().toISOString()
        });
      }

      // Notify delivery company
      const response = await fetch(`${this.baseUrl}/disconnect-restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: userId,
          companyId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error disconnecting from delivery company:', error);
      throw error;
    }
  }

  async getUserIntegrations(userId: string): Promise<DeliveryIntegration[]> {
    try {
      return await firebaseService.getDeliveryIntegrations(userId);
    } catch (error) {
      console.error('Error fetching user integrations:', error);
      return [];
    }
  }

  async getIntegration(userId: string, companyId: string): Promise<DeliveryIntegration | null> {
    try {
      const integrations = await this.getUserIntegrations(userId);
      return integrations.find(i => i.deliveryCompanyId === companyId) || null;
    } catch (error) {
      console.error('Error fetching integration:', error);
      return null;
    }
  }

  private async updateIntegrationStatus(
    userId: string, 
    companyId: string, 
    status: 'success' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(userId, companyId);
      if (integration) {
        await firebaseService.updateDeliveryIntegration(integration.id, {
          syncStatus: status,
          lastSync: new Date().toISOString(),
          errorMessage,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
    }
  }

  // =======================
  // Order Processing
  // =======================
  
  async getDeliveryOrders(userId: string, limit?: number): Promise<DeliveryOrder[]> {
    try {
      return await firebaseService.getDeliveryOrders(userId, limit);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      return [];
    }
  }

  async acceptDeliveryOrder(orderId: string, estimatedPrepTime?: number): Promise<boolean> {
    try {
      const order = await firebaseService.getOrder(orderId);
      if (!order || !order.deliveryInfo) return false;

      const success = await this.updateOrderStatus(
        orderId, 
        'accepted', 
        order.deliveryInfo.company,
        estimatedPrepTime
      );

      if (success) {
        // Send to kitchen departments
        await firebaseService.sendOrderToDepartments(orderId, order, order.userId);
      }

      return success;
    } catch (error) {
      console.error('Error accepting delivery order:', error);
      return false;
    }
  }

  async rejectDeliveryOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      const order = await firebaseService.getOrder(orderId);
      if (!order || !order.deliveryInfo) return false;

      return await this.updateOrderStatus(orderId, 'cancelled', order.deliveryInfo.company);
    } catch (error) {
      console.error('Error rejecting delivery order:', error);
      return false;
    }
  }

  private async notifyRestaurantOfDeliveryOrder(order: Omit<Order, 'id'>, deliveryCompany: string): Promise<void> {
    try {
      const { telegramService } = await import('./telegram');
      
      const message = `
🚚 <b>New Delivery Order - ${deliveryCompany}</b>

👤 <b>Customer:</b> ${order.customerInfo?.name}
📞 <b>Phone:</b> ${order.customerInfo?.phone}
📍 <b>Address:</b> ${order.deliveryInfo?.address?.line1}

🍽️ <b>Items:</b>
${order.items.map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`).join('\n')}

💰 <b>Restaurant Total:</b> $${order.totalAmount.toFixed(2)}
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}

${order.notes ? `📝 <b>Special Instructions:</b> ${order.notes}\n` : ''}
⚠️ <b>Please accept or reject this order promptly</b>
      `.trim();

      const telegramSettings = await telegramService.getUserTelegramSettings(order.userId);
      await telegramService.sendMessage(message, telegramSettings.cashierChatId);
    } catch (error) {
      console.error('Error notifying restaurant of delivery order:', error);
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getDeliveryAnalytics(userId: string, dateRange?: { start: string; end: string }): Promise<DeliveryAnalytics> {
    try {
      const orders = await this.getDeliveryOrders(userId);
      
      // Filter by date range if provided
      const filteredOrders = dateRange ? 
        orders.filter(order => {
          const orderDate = new Date(order.orderTime);
          return orderDate >= new Date(dateRange.start) && orderDate <= new Date(dateRange.end);
        }) : orders;

      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.subtotal, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group by delivery company
      const ordersByCompany: Record<string, number> = {};
      const revenueByCompany: Record<string, number> = {};
      
      filteredOrders.forEach(order => {
        const company = order.source;
        ordersByCompany[company] = (ordersByCompany[company] || 0) + 1;
        revenueByCompany[company] = (revenueByCompany[company] || 0) + order.subtotal;
      });

      // Calculate popular items
      const itemStats: Record<string, { name: string; orders: number; revenue: number }> = {};
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          if (!itemStats[item.id]) {
            itemStats[item.id] = { name: item.name, orders: 0, revenue: 0 };
          }
          itemStats[item.id].orders += item.quantity;
          itemStats[item.id].revenue += item.total;
        });
      });

      const popularItems = Object.entries(itemStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10);

      // Calculate peak hours
      const hourlyStats: Record<number, number> = {};
      filteredOrders.forEach(order => {
        const hour = new Date(order.orderTime).getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourlyStats)
        .map(([hour, orders]) => ({ hour: parseInt(hour), orders }))
        .sort((a, b) => b.orders - a.orders);

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByCompany,
        revenueByCompany,
        popularItems,
        peakHours,
        customerSatisfaction: {
          averageRating: 4.5, // This would come from delivery company feedback
          totalReviews: Math.floor(totalOrders * 0.3) // Estimate
        }
      };
    } catch (error) {
      console.error('Error calculating delivery analytics:', error);
      throw error;
    }
  }

  // =======================
  // Webhook Processing
  // =======================
  
  async processWebhookEvent(event: DeliveryWebhookEvent): Promise<boolean> {
    try {
      switch (event.type) {
        case 'order_placed':
          await this.receiveDeliveryOrder(event.data);
          break;
        case 'order_cancelled':
          await this.handleOrderCancellation(event.data);
          break;
        case 'payment_confirmed':
          await this.handlePaymentConfirmation(event.data);
          break;
        case 'delivery_assigned':
          await this.handleDeliveryAssignment(event.data);
          break;
        default:
          console.warn('Unknown webhook event type:', event.type);
          return false;
      }

      // Mark event as processed
      await firebaseService.updateWebhookEvent(event.id, {
        processed: true,
        processedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      // Mark event as failed
      await firebaseService.updateWebhookEvent(event.id, {
        processed: false,
        errorMessage: error.message
      });
      
      return false;
    }
  }

  private async handleOrderCancellation(data: any): Promise<void> {
    try {
      const order = await firebaseService.getOrderByDeliveryId(data.orderId);
      if (order) {
        await firebaseService.updateOrder(order.id, { status: 'cancelled' });
        
        // Notify restaurant
        const { telegramService } = await import('./telegram');
        const message = `❌ <b>Delivery Order Cancelled</b>\n\n📋 Order: ${order.id.slice(0, 8)}\n🚚 Company: ${data.deliveryCompany}\n🕐 ${new Date().toLocaleString()}`;
        
        const telegramSettings = await telegramService.getUserTelegramSettings(order.userId);
        await telegramService.sendMessage(message, telegramSettings.cashierChatId);
      }
    } catch (error) {
      console.error('Error handling order cancellation:', error);
    }
  }

  private async handlePaymentConfirmation(data: any): Promise<void> {
    try {
      const order = await firebaseService.getOrderByDeliveryId(data.orderId);
      if (order) {
        await firebaseService.updateOrder(order.id, { paymentStatus: 'paid' });
      }
    } catch (error) {
      console.error('Error handling payment confirmation:', error);
    }
  }

  private async handleDeliveryAssignment(data: any): Promise<void> {
    try {
      const order = await firebaseService.getOrderByDeliveryId(data.orderId);
      if (order) {
        // Notify restaurant that driver is assigned
        const { telegramService } = await import('./telegram');
        const message = `🚗 <b>Driver Assigned</b>\n\n📋 Order: ${order.id.slice(0, 8)}\n👤 Driver: ${data.driverName}\n📞 Driver Phone: ${data.driverPhone}\n🕐 ETA: ${data.estimatedPickupTime}`;
        
        const telegramSettings = await telegramService.getUserTelegramSettings(order.userId);
        await telegramService.sendMessage(message, telegramSettings.cashierChatId);
      }
    } catch (error) {
      console.error('Error handling delivery assignment:', error);
    }
  }

  // =======================
  // Menu Item Availability
  // =======================
  
  async updateItemAvailability(userId: string, itemId: string, isAvailable: boolean): Promise<void> {
    try {
      // Update in our system
      await firebaseService.updateMenuItem(itemId, { available: isAvailable });

      // Sync to all connected delivery companies
      const integrations = await this.getUserIntegrations(userId);
      const activeIntegrations = integrations.filter(i => i.isActive);

      for (const integration of activeIntegrations) {
        try {
          await fetch(`${this.baseUrl}/update-item-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: userId,
              itemId,
              isAvailable,
              companyId: integration.deliveryCompanyId
            })
          });
        } catch (error) {
          console.error(`Failed to update availability for company ${integration.deliveryCompanyId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating item availability:', error);
      throw error;
    }
  }

  // =======================
  // Bulk Operations
  // =======================
  
  async bulkSyncAllIntegrations(userId: string): Promise<{ success: number; failed: number }> {
    const integrations = await this.getUserIntegrations(userId);
    const activeIntegrations = integrations.filter(i => i.isActive);
    
    let success = 0;
    let failed = 0;

    for (const integration of activeIntegrations) {
      try {
        await this.syncMenuToDeliveryCompany(userId, integration.deliveryCompanyId);
        success++;
      } catch (error) {
        console.error(`Failed to sync with ${integration.deliveryCompanyId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async updateAllItemPrices(userId: string, markupPercentage: number): Promise<void> {
    try {
      const menuItems = await firebaseService.getMenuItems(userId);
      const integrations = await this.getUserIntegrations(userId);
      
      for (const integration of integrations.filter(i => i.isActive)) {
        const updatedItems = menuItems.map(item => ({
          ...item,
          price: item.price * (1 + markupPercentage / 100)
        }));

        await fetch(`${this.baseUrl}/bulk-update-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: userId,
            items: updatedItems,
            companyId: integration.deliveryCompanyId
          })
        });
      }
    } catch (error) {
      console.error('Error updating all item prices:', error);
      throw error;
    }
  }
}

export const deliveryIntegrationService = new DeliveryIntegrationService();
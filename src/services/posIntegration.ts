// POS Integration Service
// Handles communication between the restaurant app and POS machines

export interface POSOrder {
  id: string;
  table: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    category?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  source: 'restaurant_app' | 'pos_machine';
}

export interface POSPayment {
  orderId: string;
  method: 'cash' | 'card' | 'mobile' | 'contactless';
  amount: number;
  transactionId: string;
  cardLast4?: string;
  receiptData?: any;
  timestamp: string;
  status: 'completed' | 'failed' | 'refunded';
}

export interface POSInventoryItem {
  id: string;
  name: string;
  quantity: number;
  lowStockThreshold?: number;
}

class POSIntegrationService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = `${window.location.origin}/api/pos-integration`;
    this.apiKey = import.meta.env.VITE_POS_API_KEY; // Optional API key for security
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Sync order to POS machine
  async syncOrderToPOS(order: {
    id: string;
    tableNumber: string;
    items: any[];
    totalAmount: number;
    userId: string;
  }): Promise<{ success: boolean; posOrderId?: string }> {
    try {
      const result = await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync_order',
          data: {
            orderId: order.id,
            tableNumber: order.tableNumber,
            items: order.items,
            totalAmount: order.totalAmount,
            userId: order.userId
          }
        })
      });

      return {
        success: result.success,
        posOrderId: result.posOrderId
      };
    } catch (error) {
      console.error('Error syncing order to POS:', error);
      throw error;
    }
  }

  // Process payment from POS machine
  async processPaymentFromPOS(paymentData: {
    orderId: string;
    paymentMethod: string;
    amount: number;
    transactionId: string;
    cardLast4?: string;
    receiptData?: any;
  }): Promise<{ success: boolean; paymentId?: string }> {
    try {
      const result = await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'process_payment',
          data: paymentData
        })
      });

      return {
        success: result.success,
        paymentId: result.paymentId
      };
    } catch (error) {
      console.error('Error processing payment from POS:', error);
      throw error;
    }
  }

  // Update inventory from POS machine
  async updateInventoryFromPOS(items: POSInventoryItem[]): Promise<{ success: boolean; updatedItems?: number }> {
    try {
      const result = await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_inventory',
          data: { items }
        })
      });

      return {
        success: result.success,
        updatedItems: result.updatedItems
      };
    } catch (error) {
      console.error('Error updating inventory from POS:', error);
      throw error;
    }
  }

  // Get menu data for POS machine
  async getMenuForPOS(userId: string): Promise<{
    categories: any[];
    items: any[];
    lastUpdated: string;
  }> {
    try {
      const result = await this.makeRequest(`?type=menu&userId=${userId}`, {
        method: 'GET'
      });

      return result.data;
    } catch (error) {
      console.error('Error getting menu for POS:', error);
      throw error;
    }
  }

  // Get orders for POS machine
  async getOrdersForPOS(userId: string, filters?: {
    status?: string;
    date?: string;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        type: 'orders',
        userId
      });

      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) params.append('date', filters.date);

      const result = await this.makeRequest(`?${params.toString()}`, {
        method: 'GET'
      });

      return result.data;
    } catch (error) {
      console.error('Error getting orders for POS:', error);
      throw error;
    }
  }

  // Get sales report for POS machine
  async getSalesReportForPOS(userId: string, startDate?: string, endDate?: string): Promise<{
    summary: any;
    paymentMethods: any;
    topItems: any[];
    orders: any[];
  }> {
    try {
      const params = new URLSearchParams({
        type: 'sales_report',
        userId
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const result = await this.makeRequest(`?${params.toString()}`, {
        method: 'GET'
      });

      return result.data;
    } catch (error) {
      console.error('Error getting sales report for POS:', error);
      throw error;
    }
  }

  // Update order status from POS machine
  async updateOrderFromPOS(orderId: string, updates: {
    status?: string;
    paymentStatus?: string;
    notes?: string;
    [key: string]: any;
  }): Promise<{ success: boolean }> {
    try {
      const result = await this.makeRequest('', {
        method: 'PUT',
        body: JSON.stringify({
          orderId,
          updates
        })
      });

      return { success: result.success };
    } catch (error) {
      console.error('Error updating order from POS:', error);
      throw error;
    }
  }

  // Get POS system status
  async getPOSStatus(): Promise<{
    status: string;
    version: string;
    lastSync: string;
    endpoints: any;
  }> {
    try {
      const result = await this.makeRequest('?type=status', {
        method: 'GET'
      });

      return result.data;
    } catch (error) {
      console.error('Error getting POS status:', error);
      throw error;
    }
  }

  // Test POS connection
  async testPOSConnection(): Promise<boolean> {
    try {
      const status = await this.getPOSStatus();
      return status.status === 'online';
    } catch (error) {
      console.error('POS connection test failed:', error);
      return false;
    }
  }
}

export const posIntegrationService = new POSIntegrationService();
import { Analytics, TableStats, MenuItem, Order } from '../types';

class AnalyticsService {
  private analytics: Analytics;
  private storageKey: string;
  private customerInfo: any = null;

  constructor(tableNumber: string) {
    this.storageKey = `analytics_${tableNumber}`;
    this.analytics = this.loadAnalytics(tableNumber);
  }

  setCustomerInfo(info: any) {
    this.customerInfo = info;
  }

  getCustomerInfo() {
    return this.customerInfo;
  }
  private loadAnalytics(tableNumber: string): Analytics {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      tableNumber,
      itemViews: {},
      itemOrders: {},
      waiterCalls: 0,
      billRequests: 0,
      totalSpent: 0,
      orderCount: 0,
      sessionStart: new Date().toISOString(),
    };
  }

  private saveAnalytics() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.analytics));
  }

  trackItemView(itemId: string) {
    this.analytics.itemViews[itemId] = (this.analytics.itemViews[itemId] || 0) + 1;
    this.saveAnalytics();
  }

  trackItemOrder(itemId: string, quantity: number) {
    this.analytics.itemOrders[itemId] = (this.analytics.itemOrders[itemId] || 0) + quantity;
    this.saveAnalytics();
  }

  trackWaiterCall() {
    this.analytics.waiterCalls += 1;
    this.saveAnalytics();
  }

  trackBillRequest() {
    this.analytics.billRequests += 1;
    this.saveAnalytics();
  }

  trackOrder(order: Order) {
    this.analytics.orderCount += 1;
    this.analytics.totalSpent += order.totalAmount;
    
    order.items.forEach(item => {
      this.trackItemOrder(item.id, item.quantity);
    });
    
    this.saveAnalytics();
  }

  getAnalytics(): Analytics {
    return { ...this.analytics };
  }

  static getAllTableStats(): TableStats[] {
    const stats: TableStats[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('analytics_')) {
        const tableNumber = key.replace('analytics_', '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        stats.push({
          tableNumber,
          orders: data.orderCount || 0,
          totalSpent: data.totalSpent || 0,
          waiterCalls: data.waiterCalls || 0,
          billRequests: data.billRequests || 0,
          lastActivity: data.sessionStart || new Date().toISOString(),
        });
      }
    }
    
    return stats.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  static getGlobalStats() {
    const allStats = this.getAllTableStats();
    
    return {
      totalTables: allStats.length,
      totalOrders: allStats.reduce((sum, stat) => sum + stat.orders, 0),
      totalRevenue: allStats.reduce((sum, stat) => sum + stat.totalSpent, 0),
      totalWaiterCalls: allStats.reduce((sum, stat) => sum + stat.waiterCalls, 0),
      totalBillRequests: allStats.reduce((sum, stat) => sum + stat.billRequests, 0),
      mostActiveTable: allStats[0]?.tableNumber || 'None',
    };
  }
}

export { AnalyticsService };
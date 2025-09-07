import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  User, 
  MenuItem, 
  Category, 
  Order, 
  PendingOrder, 
  TableBill, 
  PaymentConfirmation, 
  Bill, 
  MenuStats, 
  Department,
  WaiterAssignment,
  WaiterCall,
  DayReport,
  MenuSchedule,
  ScheduledMenuItem
} from '../types';
import { 
  DeliveryIntegration,
  DeliveryOrder,
  DeliveryWebhookEvent
} from '../types/delivery';

class FirebaseService {
  // =======================
  // User Management
  // =======================
  
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  // =======================
  // Menu Items Management
  // =======================
  
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'menuItems'),
        where('userId', '==', userId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async getScheduledMenuItems(userId: string): Promise<ScheduledMenuItem[]> {
    try {
      const [menuItems, schedules] = await Promise.all([
        this.getMenuItems(userId),
        this.getMenuSchedules(userId)
      ]);

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      return menuItems.map(item => {
        let currentSchedule: MenuSchedule | undefined;
        let nextAvailableSchedule: MenuSchedule | undefined;
        let isCurrentlyAvailable = true;

        // If item has schedules, check availability
        if (item.scheduleIds && item.scheduleIds.length > 0) {
          const itemSchedules = schedules.filter(s => 
            item.scheduleIds!.includes(s.id) && s.isActive
          );

          // Find current active schedule
          currentSchedule = itemSchedules.find(schedule => {
            if (!schedule.daysOfWeek.includes(currentDay)) return false;
            return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
          });

          // If no current schedule, find next available
          if (!currentSchedule) {
            isCurrentlyAvailable = false;
            nextAvailableSchedule = itemSchedules.find(schedule => 
              schedule.daysOfWeek.includes(currentDay) && currentTime < schedule.startTime
            ) || itemSchedules[0]; // Fallback to first schedule
          }
        }

        return {
          ...item,
          currentSchedule,
          nextAvailableSchedule,
          isCurrentlyAvailable: isCurrentlyAvailable && item.available,
        };
      });
    } catch (error) {
      console.error('Error fetching scheduled menu items:', error);
      throw error;
    }
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), {
        ...item,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    try {
      const docRef = doc(db, 'menuItems', id);
      await updateDoc(docRef, {
        ...updates,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // =======================
  // Categories Management
  // =======================
  
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', userId),
        orderBy('order'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'categories'), category);
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // =======================
  // Menu Schedules Management
  // =======================
  
  async getMenuSchedules(userId: string): Promise<MenuSchedule[]> {
    try {
      const q = query(
        collection(db, 'menuSchedules'),
        where('userId', '==', userId),
        orderBy('order'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuSchedule));
    } catch (error) {
      console.error('Error fetching menu schedules:', error);
      throw error;
    }
  }

  async addMenuSchedule(schedule: Omit<MenuSchedule, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuSchedules'), schedule);
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu schedule:', error);
      throw error;
    }
  }

  async updateMenuSchedule(id: string, updates: Partial<MenuSchedule>): Promise<void> {
    try {
      const docRef = doc(db, 'menuSchedules', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating menu schedule:', error);
      throw error;
    }
  }

  async deleteMenuSchedule(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'menuSchedules', id));
    } catch (error) {
      console.error('Error deleting menu schedule:', error);
      throw error;
    }
  }

  // =======================
  // Departments Management
  // =======================
  
  async getDepartments(userId: string): Promise<Department[]> {
    try {
      const q = query(
        collection(db, 'departments'),
        where('userId', '==', userId),
        orderBy('order'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async addDepartment(department: Omit<Department, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'departments'), department);
      return docRef.id;
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    try {
      const docRef = doc(db, 'departments', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // =======================
  // Waiter Management
  // =======================
  
  async getWaiterAssignments(userId: string): Promise<WaiterAssignment[]> {
    try {
      const q = query(
        collection(db, 'waiterAssignments'),
        where('userId', '==', userId),
        orderBy('startTable')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterAssignment));
    } catch (error) {
      console.error('Error fetching waiter assignments:', error);
      throw error;
    }
  }

  async getWaiterForTable(userId: string, tableNumber: number): Promise<WaiterAssignment | null> {
    try {
      const assignments = await this.getWaiterAssignments(userId);
      return assignments.find(assignment => 
        assignment.isActive && 
        tableNumber >= assignment.startTable && 
        tableNumber <= assignment.endTable
      ) || null;
    } catch (error) {
      console.error('Error finding waiter for table:', error);
      return null;
    }
  }

  async addWaiterAssignment(assignment: Omit<WaiterAssignment, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'waiterAssignments'), assignment);
      return docRef.id;
    } catch (error) {
      console.error('Error adding waiter assignment:', error);
      throw error;
    }
  }

  async updateWaiterAssignment(id: string, updates: Partial<WaiterAssignment>): Promise<void> {
    try {
      const docRef = doc(db, 'waiterAssignments', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating waiter assignment:', error);
      throw error;
    }
  }

  async deleteWaiterAssignment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'waiterAssignments', id));
    } catch (error) {
      console.error('Error deleting waiter assignment:', error);
      throw error;
    }
  }

  // =======================
  // Orders Management
  // =======================
  
  async getOrders(userId: string, limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        timestamp: order.timestamp || new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      const docRef = doc(db, 'orders', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // =======================
  // Pending Orders Management
  // =======================
  
  async getPendingOrders(userId: string): Promise<PendingOrder[]> {
    try {
      const q = query(
        collection(db, 'pendingOrders'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrder));
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
  }

  async addPendingOrder(order: Omit<PendingOrder, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'pendingOrders'), {
        ...order,
        timestamp: order.timestamp || new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding pending order:', error);
      throw error;
    }
  }

  async approvePendingOrder(pendingOrderId: string, pendingOrder: PendingOrder): Promise<string> {
    try {
      // Create approved order
      const approvedOrder: Omit<Order, 'id'> = {
        ...pendingOrder,
        status: 'confirmed',
        paymentStatus: 'pending',
        timestamp: new Date().toISOString(),
      };
      
      const orderRef = await addDoc(collection(db, 'orders'), approvedOrder);
      
      // Add to table bill
      await this.addToTableBill(pendingOrder.userId, pendingOrder.tableNumber, pendingOrder.items, pendingOrder.cafeId);
      
      // Send order to departments
      await this.sendOrderToDepartments(orderRef.id, { ...approvedOrder, id: orderRef.id }, pendingOrder.userId);
      
      // Delete pending order
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
      
      return orderRef.id;
    } catch (error) {
      console.error('Error approving pending order:', error);
      throw error;
    }
  }

  async rejectPendingOrder(pendingOrderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
    } catch (error) {
      console.error('Error rejecting pending order:', error);
      throw error;
    }
  }

  // =======================
  // Table Bills Management
  // =======================
  
  async getTableBills(userId: string): Promise<TableBill[]> {
    try {
      const q = query(
        collection(db, 'tableBills'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableBill));
    } catch (error) {
      console.error('Error fetching table bills:', error);
      throw error;
    }
  }

  async getTableBill(userId: string, tableNumber: string, cafeId?: string): Promise<TableBill | null> {
    try {
      let q = query(
        collection(db, 'tableBills'),
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        where('status', '==', 'active')
      );

      if (cafeId) {
        q = query(q, where('cafeId', '==', cafeId));
      }

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as TableBill;
      }
      return null;
    } catch (error) {
      console.error('Error fetching table bill:', error);
      throw error;
    }
  }

  async addToTableBill(userId: string, tableNumber: string, items: any[], cafeId?: string): Promise<void> {
    try {
      const existingBill = await this.getTableBill(userId, tableNumber, cafeId);
      
      if (existingBill) {
        // Update existing bill
        const updatedItems = [...existingBill.items];
        
        items.forEach(newItem => {
          const existingIndex = updatedItems.findIndex(item => item.id === newItem.id);
          if (existingIndex >= 0) {
            updatedItems[existingIndex].quantity += newItem.quantity;
            updatedItems[existingIndex].total += newItem.total;
          } else {
            updatedItems.push(newItem);
          }
        });
        
        const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        
        await updateDoc(doc(db, 'tableBills', existingBill.id), {
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new table bill
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        
        const billData: Omit<TableBill, 'id'> = {
          tableNumber,
          userId,
          items,
          subtotal,
          tax,
          total,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (cafeId) {
          billData.cafeId = cafeId;
        }
        
        await addDoc(collection(db, 'tableBills'), billData);
      }
    } catch (error) {
      console.error('Error adding to table bill:', error);
      throw error;
    }
  }

  async markTableBillAsPaid(userId: string, tableNumber: string, paymentConfirmationId?: string | null, cafeId?: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber, cafeId);
      if (bill) {
        const updates: any = {
          status: 'paid',
          updatedAt: new Date().toISOString(),
        };

        if (paymentConfirmationId) {
          updates.paymentConfirmationId = paymentConfirmationId;
        }

        await updateDoc(doc(db, 'tableBills', bill.id), updates);
      }
    } catch (error) {
      console.error('Error marking table bill as paid:', error);
      throw error;
    }
  }

  // =======================
  // Payment Confirmations Management
  // =======================
  
  async getPaymentConfirmations(userId: string): Promise<PaymentConfirmation[]> {
    try {
      const q = query(
        collection(db, 'paymentConfirmations'),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConfirmation));
    } catch (error) {
      console.error('Error fetching payment confirmations:', error);
      throw error;
    }
  }

  async addPaymentConfirmation(confirmation: Omit<PaymentConfirmation, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'paymentConfirmations'), confirmation);
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment confirmation:', error);
      throw error;
    }
  }

  async updatePaymentConfirmation(id: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      const docRef = doc(db, 'paymentConfirmations', id);
      await updateDoc(docRef, {
        status,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating payment confirmation:', error);
      throw error;
    }
  }

  // =======================
  // Bills Management
  // =======================
  
  async getBills(userId: string): Promise<Bill[]> {
    try {
      const q = query(
        collection(db, 'bills'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  async createBillFromTableBill(tableBill: TableBill): Promise<string> {
    try {
      const billData: Omit<Bill, 'id'> = {
        orderId: `table_${tableBill.tableNumber}_${Date.now()}`,
        userId: tableBill.userId,
        tableNumber: tableBill.tableNumber,
        items: tableBill.items,
        subtotal: tableBill.subtotal,
        tax: tableBill.tax,
        total: tableBill.total,
        timestamp: new Date().toISOString(),
        status: 'paid',
      };

      if (tableBill.cafeId) {
        billData.cafeId = tableBill.cafeId;
      }

      const docRef = await addDoc(collection(db, 'bills'), billData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill from table bill:', error);
      throw error;
    }
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<void> {
    try {
      const docRef = doc(db, 'bills', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  // =======================
  // Waiter Calls Management
  // =======================
  
  async addWaiterCall(userId: string, tableNumber: string): Promise<string> {
    try {
      const waiterCall: Omit<WaiterCall, 'id'> = {
        userId,
        tableNumber,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      const docRef = await addDoc(collection(db, 'waiterCalls'), waiterCall);
      return docRef.id;
    } catch (error) {
      console.error('Error adding waiter call:', error);
      throw error;
    }
  }

  // =======================
  // Day Reports Management
  // =======================
  
  async getDayReports(userId: string): Promise<DayReport[]> {
    try {
      const q = query(
        collection(db, 'dayReports'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayReport));
    } catch (error) {
      console.error('Error fetching day reports:', error);
      throw error;
    }
  }

  async createDayReport(userId: string, cashierInfo: { name: string; shift: string; notes: string }): Promise<string> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [orders, waiterCalls] = await Promise.all([
        this.getOrders(userId),
        this.getWaiterCalls(userId)
      ]);

      // Filter today's data
      const todayOrders = orders.filter(order => order.timestamp.startsWith(today));
      const todayWaiterCalls = waiterCalls.filter(call => call.timestamp.startsWith(today));

      // Calculate stats
      const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalPayments = todayOrders.filter(order => order.paymentStatus === 'paid').length;

      // Most ordered items
      const itemCounts: Record<string, number> = {};
      todayOrders.forEach(order => {
        order.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });

      const mostOrderedItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Most active table
      const tableCounts: Record<string, number> = {};
      todayOrders.forEach(order => {
        tableCounts[order.tableNumber] = (tableCounts[order.tableNumber] || 0) + 1;
      });

      const mostActiveTable = Object.entries(tableCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      const report: Omit<DayReport, 'id'> = {
        userId,
        date: today,
        cashierInfo,
        totalOrders: todayOrders.length,
        totalRevenue,
        totalPayments,
        waiterCalls: todayWaiterCalls.length,
        mostOrderedItems,
        mostActiveTable,
        departmentStats: {
          kitchen: {
            orders: todayOrders.length,
            avgPrepTime: 15 // This would be calculated from actual prep times
          }
        },
        timestamp: new Date().toISOString(),
        status: 'closed',
      };

      const docRef = await addDoc(collection(db, 'dayReports'), report);
      return docRef.id;
    } catch (error) {
      console.error('Error creating day report:', error);
      throw error;
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getMenuStats(userId: string): Promise<MenuStats> {
    try {
      const [orders, menuItems] = await Promise.all([
        this.getOrders(userId),
        this.getMenuItems(userId)
      ]);

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalViews = menuItems.reduce((sum, item) => sum + item.views, 0);

      // Calculate popular items
      const itemStats: Record<string, { name: string; orders: number }> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemStats[item.id]) {
            itemStats[item.id] = { name: item.name, orders: 0 };
          }
          itemStats[item.id].orders += item.quantity;
        });
      });

      const popularItems = Object.entries(itemStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10);

      // Monthly revenue (last 12 months)
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        
        const monthOrders = orders.filter(order => order.timestamp.startsWith(monthStr));
        const revenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        monthlyRevenue.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue
        });
      }

      return {
        totalOrders,
        totalRevenue,
        totalViews,
        popularItems,
        recentOrders: orders.slice(0, 10),
        monthlyRevenue,
      };
    } catch (error) {
      console.error('Error calculating menu stats:', error);
      throw error;
    }
  }

  // =======================
  // Department Order Routing
  // =======================
  
  async sendOrderToDepartments(orderId: string, order: Order, userId: string): Promise<void> {
    try {
      const [menuItems, departments] = await Promise.all([
        this.getMenuItems(userId),
        this.getDepartments(userId)
      ]);

      // Group items by department
      const departmentItems: Record<string, any[]> = {};
      
      for (const orderItem of order.items) {
        const menuItem = menuItems.find(mi => mi.id === orderItem.id);
        const departmentId = menuItem?.department || 'kitchen';
        
        if (!departmentItems[departmentId]) {
          departmentItems[departmentId] = [];
        }
        departmentItems[departmentId].push(orderItem);
      }
      
      // Send to each department via Telegram
      const { telegramService } = await import('./telegram');
      
      for (const [departmentId, items] of Object.entries(departmentItems)) {
        const department = departments.find(d => d.id === departmentId || d.role === departmentId);
        if (department && items.length > 0) {
          await telegramService.sendOrderToDepartment(order, department, items);
        }
      }
    } catch (error) {
      console.error('Error sending order to departments:', error);
      throw error;
    }
  }

  // Real-time Listeners
  // =======================
  
  listenToPendingOrders(userId: string, callback: (orders: PendingOrder[]) => void): () => void {
    const q = query(
      collection(db, 'pendingOrders'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrder));
      callback(orders);
    });
  }

  listenToPaymentConfirmations(userId: string, callback: (confirmations: PaymentConfirmation[]) => void): () => void {
    const q = query(
      collection(db, 'paymentConfirmations'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const confirmations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConfirmation));
      callback(confirmations);
    });
  }

  listenToWaiterCalls(userId: string, callback: (calls: WaiterCall[]) => void): () => void {
    const q = query(
      collection(db, 'waiterCalls'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterCall));
      callback(calls);
    });
  }

  // =======================
  // Customer-specific Real-time Listeners
  // =======================

  listenToTableOrders(userId: string, tableNumber: string, callback: (orders: Order[]) => void): () => void {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
  }

  listenToTablePayments(userId: string, tableNumber: string, callback: (confirmations: PaymentConfirmation[]) => void): () => void {
    const q = query(
      collection(db, 'paymentConfirmations'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    return onSnapshot(q, (snapshot) => {
      const confirmations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConfirmation));
      callback(confirmations);
    });
  }

  listenToTableWaiterCalls(userId: string, tableNumber: string, callback: (calls: WaiterCall[]) => void): () => void {
    const q = query(
      collection(db, 'waiterCalls'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterCall));
      callback(calls);
    });
  }

  listenToTableBill(userId: string, tableNumber: string, callback: (bill: TableBill | null) => void): () => void {
    const q = query(
      collection(db, 'tableBills'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      where('status', '==', 'active'),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() } as TableBill);
      } else {
        callback(null);
      }
    });
  }

  // =======================
  // Customer-specific Real-time Listeners
  // =======================

  listenToTableOrders(userId: string, tableNumber: string, callback: (orders: Order[]) => void): () => void {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
  }

  listenToTablePayments(userId: string, tableNumber: string, callback: (confirmations: PaymentConfirmation[]) => void): () => void {
    const q = query(
      collection(db, 'paymentConfirmations'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    return onSnapshot(q, (snapshot) => {
      const confirmations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConfirmation));
      callback(confirmations);
    });
  }

  listenToTableWaiterCalls(userId: string, tableNumber: string, callback: (calls: WaiterCall[]) => void): () => void {
    const q = query(
      collection(db, 'waiterCalls'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterCall));
      callback(calls);
    });
  }

  listenToTableBill(userId: string, tableNumber: string, callback: (bill: TableBill | null) => void): () => void {
    const q = query(
      collection(db, 'tableBills'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      where('status', '==', 'active'),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() } as TableBill);
      } else {
        callback(null);
      }
    });
  }

  async getWaiterCalls(userId: string): Promise<WaiterCall[]> {
    try {
      const q = query(
        collection(db, 'waiterCalls'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterCall));
    } catch (error) {
      console.error('Error fetching waiter calls:', error);
      throw error;
    }
  }

  // =======================
  // Delivery Integration
  // =======================
  
  async getDeliveryIntegrations(userId: string): Promise<DeliveryIntegration[]> {
    try {
      const q = query(
        collection(db, 'deliveryIntegrations'),
        where('userId', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryIntegration));
    } catch (error) {
      console.error('Error fetching delivery integrations:', error);
      throw error;
    }
  }

  async addDeliveryIntegration(integration: Omit<DeliveryIntegration, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'deliveryIntegrations'), integration);
      return docRef.id;
    } catch (error) {
      console.error('Error adding delivery integration:', error);
      throw error;
    }
  }

  async updateDeliveryIntegration(id: string, updates: Partial<DeliveryIntegration>): Promise<void> {
    try {
      const docRef = doc(db, 'deliveryIntegrations', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating delivery integration:', error);
      throw error;
    }
  }

  async getDeliveryOrders(userId: string, limitCount?: number): Promise<DeliveryOrder[]> {
    try {
      let q = query(
        collection(db, 'deliveryOrders'),
        where('restaurantId', '==', userId),
        orderBy('orderTime', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryOrder));
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      return [];
    }
  }

  async getOrderByDeliveryId(deliveryOrderId: string): Promise<Order | null> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('deliveryInfo.orderId', '==', deliveryOrderId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order by delivery ID:', error);
      return null;
    }
  }

  async updateWebhookEvent(id: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'deliveryWebhookEvents', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating webhook event:', error);
      throw error;
    }
  }

  // =======================
  // Super Admin Functions
  // =======================
  
  async getAllRestaurants(): Promise<any[]> {
    try {
      const users = await this.getAllUsers();
      return users.map(user => ({
        id: user.id,
        businessName: user.businessName || user.name || 'Unknown',
        ownerEmail: user.email,
        ownerName: user.name || 'Unknown',
        phone: user.phone,
        status: user.status || 'active',
        created_at: user.created_at,
        totalOrders: 0, // Would need to calculate from orders
        totalRevenue: 0, // Would need to calculate from orders
      }));
    } catch (error) {
      console.error('Error fetching all restaurants:', error);
      throw error;
    }
  }

  async getPlatformStats(): Promise<any> {
    try {
      const users = await this.getAllUsers();
      
      // Mock platform stats - in production, you'd calculate these from actual data
      return {
        totalRestaurants: users.length,
        totalUsers: users.length,
        totalOrders: users.length * 50, // Mock data
        totalRevenue: users.length * 2500, // Mock data
        monthlyGrowth: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          restaurants: Math.floor(users.length * (0.5 + i * 0.05)),
          revenue: Math.floor(users.length * 1000 * (0.5 + i * 0.1))
        }))
      };
    } catch (error) {
      console.error('Error calculating platform stats:', error);
      throw error;
    }
  }

  async createRestaurant(data: any): Promise<string> {
    try {
      // This would create a new restaurant account
      // Implementation depends on your user creation flow
      const docRef = await addDoc(collection(db, 'users'), {
        ...data,
        created_at: new Date().toISOString(),
        status: 'active'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(id: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  async deleteRestaurant(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        status: isActive ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async resetUserPassword(email: string): Promise<void> {
    try {
      // This would typically use Firebase Auth's password reset
      // For now, we'll just log it
      console.log('Password reset requested for:', email);
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
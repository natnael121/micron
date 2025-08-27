import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  MenuItem, Category, Order, Bill, User, MenuStats, 
  PendingOrder, TableBill, RestaurantSettings, PaymentConfirmation, OrderItem,
  MenuSchedule, ScheduledMenuItem
} from '../types';

class FirebaseService {
  // =======================
  // Real-time Listeners for Notifications
  // =======================
  listenToPendingOrders(userId: string, callback: (orders: PendingOrder[]) => void): () => void {
    const q = query(
      collection(db, 'pendingOrders'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as PendingOrder));
      callback(orders);
    });
  }

  listenToPaymentConfirmations(userId: string, callback: (confirmations: PaymentConfirmation[]) => void): () => void {
    const q = query(
      collection(db, 'paymentConfirmations'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    
    return onSnapshot(q, (snapshot) => {
      const confirmations = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as PaymentConfirmation));
      callback(confirmations);
    });
  }

  listenToWaiterCalls(userId: string, callback: (calls: any[]) => void): () => void {
    const q = query(
      collection(db, 'waiterCalls'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(calls);
    });
  }

  async addWaiterCall(userId: string, tableNumber: string, waiterName?: string): Promise<string> {
    try {
      // Get waiter assignment for this table
      const waiterAssignment = await this.getWaiterForTable(userId, parseInt(tableNumber));
      const assignedWaiterName = waiterAssignment?.waiterName || waiterName;
      
      const docRef = await addDoc(collection(db, 'waiterCalls'), {
        userId,
        tableNumber,
        waiterName: assignedWaiterName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding waiter call:', error);
      throw error;
    }
  }

  async updateWaiterCall(id: string, status: 'acknowledged' | 'completed'): Promise<void> {
    try {
      await updateDoc(doc(db, 'waiterCalls', id), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating waiter call:', error);
      throw error;
    }
  }

  // =======================
  // Menu Items
  // =======================
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'menuItems'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      return items.sort((a, b) => a.category.localeCompare(b.category));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
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
      await updateDoc(doc(db, 'menuItems', id), {
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
  // Categories
  // =======================
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
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
  // Menu Schedules
  // =======================
  async getMenuSchedules(userId: string): Promise<MenuSchedule[]> {
    try {
      const q = query(
        collection(db, 'menuSchedules'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuSchedule));
      return schedules.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching menu schedules:', error);
      return [];
    }
  }

  async addMenuSchedule(schedule: Omit<MenuSchedule, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuSchedules'), {
        ...schedule,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu schedule:', error);
      throw error;
    }
  }

  async updateMenuSchedule(id: string, updates: Partial<MenuSchedule>): Promise<void> {
    try {
      await updateDoc(doc(db, 'menuSchedules', id), updates);
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

  async getScheduledMenuItems(userId: string): Promise<ScheduledMenuItem[]> {
    try {
      const [menuItems, schedules] = await Promise.all([
        this.getMenuItems(userId),
        this.getMenuSchedules(userId)
      ]);

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      // Find current active schedule
      const activeSchedule = schedules.find(schedule => {
        if (!schedule.isActive || !schedule.daysOfWeek.includes(currentDay)) {
          return false;
        }
        return this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime);
      });

      return menuItems.map(item => {
        const itemSchedules = schedules.filter(s => 
          item.scheduleIds?.includes(s.id) && s.isActive
        );

        const currentSchedule = itemSchedules.find(s => s.id === activeSchedule?.id);
        const nextAvailableSchedule = this.getNextAvailableSchedule(itemSchedules, now);

        return {
          ...item,
          currentSchedule,
          nextAvailableSchedule,
          isCurrentlyAvailable: !!currentSchedule || !item.scheduleIds?.length
        };
      });
    } catch (error) {
      console.error('Error fetching scheduled menu items:', error);
      return [];
    }
  }

  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Handle overnight schedules (e.g., 22:00 - 06:00)
      return current >= start || current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getNextAvailableSchedule(schedules: MenuSchedule[], now: Date): MenuSchedule | undefined {
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    // Find next schedule today
    const todaySchedules = schedules.filter(s => 
      s.daysOfWeek.includes(currentDay) && 
      this.timeToMinutes(s.startTime) > this.timeToMinutes(currentTime)
    );

    if (todaySchedules.length > 0) {
      return todaySchedules.sort((a, b) => 
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
      )[0];
    }

    // Find next schedule in upcoming days
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDaySchedules = schedules.filter(s => s.daysOfWeek.includes(nextDay));
      
      if (nextDaySchedules.length > 0) {
        return nextDaySchedules.sort((a, b) => 
          this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
        )[0];
      }
    }

    return undefined;
  }

  // =======================
  // Departments
  // =======================
  async getDepartments(userId: string): Promise<Department[]> {
    try {
      const q = query(
        collection(db, 'departments'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const departments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      return departments.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async getCashierDepartment(userId: string): Promise<Department | null> {
    try {
      const departments = await this.getDepartments(userId);
      return departments.find(dept => dept.role === 'cashier') || null;
    } catch (error) {
      console.error('Error fetching cashier department:', error);
      return null;
    }
  }

  async getAdminDepartment(userId: string): Promise<Department | null> {
    try {
      const departments = await this.getDepartments(userId);
      return departments.find(dept => dept.role === 'admin') || null;
    } catch (error) {
      console.error('Error fetching admin department:', error);
      return null;
    }
  }

  async addDepartment(department: Omit<Department, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'departments'), {
        ...department,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    try {
      await updateDoc(doc(db, 'departments', id), updates);
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }
n
  async deleteDepartment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // =======================
  // Pending Orders
  // =======================
 // Add these methods to your FirebaseService class

async getPendingOrdersAll(): Promise<PendingOrder[]> {
  try {
    const snapshot = await getDocs(collection(db, 'pendingOrders'));
    const orders = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as PendingOrder));
    
    return orders.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching all pending orders:', error);
    return [];
  }
}

async getPendingOrderById(orderId: string): Promise<PendingOrder | null> {
  try {
    const docRef = doc(db, 'pendingOrders', orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as PendingOrder : null;
  } catch (error) {
    console.error('Error fetching pending order:', error);
    return null;
  }
}
  
  
  async getPendingOrders(userId: string): Promise<PendingOrder[]> {
    try {
      const q = query(
        collection(db, 'pendingOrders'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrder));
      return orders.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  }

  async addPendingOrder(order: Omit<PendingOrder, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'pendingOrders'), {
        ...order,
        timestamp: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding pending order:', error);
      throw error;
    }
  }

  async approvePendingOrder(pendingOrderId: string, pendingOrder: PendingOrder): Promise<string> {
    try {
      const approvedOrder: Omit<Order, 'id'> = {
        ...pendingOrder,
        status: 'approved',
        paymentStatus: 'pending',
      };
      
      // Add the order to orders collection
      const orderId = await this.addOrder(approvedOrder);
      
      // Add items to table bill
      await this.addToTableBill(pendingOrder.userId, pendingOrder.tableNumber, pendingOrder.items);
      
      // Send order to appropriate departments after approval
      await this.sendOrderToDepartments(orderId, { ...approvedOrder, id: orderId }, pendingOrder.userId);
      
      // Remove the pending order
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
      return orderId;
    } catch (error) {
      console.error('Error approving pending order:', error);
      throw error;
    }
  }

  async sendOrderToDepartments(orderId: string, order: Order, userId: string): Promise<void> {
    try {
      // Get menu items to determine departments
      const [menuItems, departments] = await Promise.all([
        this.getMenuItems(userId),
        this.getDepartments(userId)
      ]);
      const { telegramService } = await import('./telegram');
      
      // Group items by department ID
      const departmentItems: Record<string, OrderItem[]> = {};
      
      for (const orderItem of order.items) {
        const menuItem = menuItems.find(mi => mi.id === orderItem.id);
        if (menuItem && menuItem.department) {
          if (!departmentItems[menuItem.department]) {
            departmentItems[menuItem.department] = [];
          }
          departmentItems[menuItem.department].push(orderItem);
        } else {
          // If no department assigned, send to kitchen department by default
          const kitchenDept = departments.find(d => d.role === 'kitchen');
          if (kitchenDept) {
            if (!departmentItems[kitchenDept.id]) {
              departmentItems[kitchenDept.id] = [];
            }
            departmentItems[kitchenDept.id].push(orderItem);
          }
        }
      }
      
      // Send to each department
      for (const [departmentId, items] of Object.entries(departmentItems)) {
        const department = departments.find(d => d.id === departmentId);
        if (department && items.length > 0) {
          await telegramService.sendOrderToDepartment(order, department, items);
        }
      }
    } catch (error) {
      console.error('Error sending order to departments:', error);
      // Don't throw error to prevent order approval from failing
      console.warn('Order approved but Telegram notification failed');
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
  // Table Bills
  // =======================
  async getTableBills(userId: string): Promise<TableBill[]> {
    try {
      const q = query(
        collection(db, 'tableBills'), 
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableBill));
      return bills.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
    } catch (error) {
      console.error('Error fetching table bills:', error);
      return [];
    }
  }

  
  async getTableBill(userId: string, tableNumber: string, cafeId?: string): Promise<TableBill | null> {
    try {
      const q = query(
        collection(db, 'tableBills'), 
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as TableBill;
    } catch (error) {
      console.error('Error fetching table bill:', error);
      return null;
    }
  }

 
  async addToTableBill(userId: string, tableNumber: string, items: OrderItem[], cafeId?: string): Promise<void> {
    try {
      const existingBill = await this.getTableBill(userId, tableNumber);
      if (existingBill) {
        const updatedItems = [...existingBill.items];
        items.forEach(newItem => {
          const idx = updatedItems.findIndex(item => item.id === newItem.id);
          if (idx >= 0) {
            updatedItems[idx].quantity += newItem.quantity;
            updatedItems[idx].total += newItem.total;
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
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        const newBill: Omit<TableBill, 'id'> = {
          tableNumber,
          userId,
          cafeId: cafeId || userId,
          items,
          subtotal,
          tax,
          total,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'tableBills'), newBill);
      }
    } catch (error) {
      console.error('Error adding to table bill:', error);
      throw error;
    }
  }


  async removeItemFromTableBill(userId: string, tableNumber: string, itemId: string, cafeId?: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber);
      if (!bill) return;
      const updatedItems = bill.items.filter(item => item.id !== itemId);
      if (updatedItems.length === 0) {
        await updateDoc(doc(db, 'tableBills', bill.id), {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      } else {
        const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        await updateDoc(doc(db, 'tableBills', bill.id), {
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error removing item from table bill:', error);
      throw error;
    }
  }

  
  async markTableBillAsPaid(userId: string, tableNumber: string, confirmationId?: string, cafeId?: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber);
      if (!bill) return;
      const updates: Partial<TableBill> = {
        status: 'paid',
        updatedAt: new Date().toISOString()
      };
      if (confirmationId) {
        updates.paymentConfirmationId = confirmationId;
      }
      await updateDoc(doc(db, 'tableBills', bill.id), updates);
    } catch (error) {
      console.error('Error marking table bill as paid:', error);
      throw error;
    }
  }

  // =======================
  // Payment Confirmations
  // =======================
  async addPaymentConfirmation(confirmation: Omit<PaymentConfirmation, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'paymentConfirmations'), {
        ...confirmation,
        timestamp: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment confirmation:', error);
      throw error;
    }
  }

  async getPaymentConfirmations(userId: string): Promise<PaymentConfirmation[]> {
    try {
      const q = query(
        collection(db, 'paymentConfirmations'), 
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const confirmations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentConfirmation));
      
      // Sort in memory instead of using orderBy to avoid index requirement
      return confirmations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error fetching payment confirmations:', error);
      return [];
    }
  }

  async updatePaymentConfirmation(id: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      await updateDoc(doc(db, 'paymentConfirmations', id), {
        status,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment confirmation:', error);
      throw error;
    }
  }

  // =======================
  // Orders
  // =======================
  async getOrders(userId: string, limit_count?: number): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      const sortedOrders = orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit_count ? sortedOrders.slice(0, limit_count) : sortedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        timestamp: new Date().toISOString(),
      });
      await this.createBill(docRef.id, order);
      return docRef.id;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', id), updates);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // =======================
  // Bills
  // =======================
  async createBill(orderId: string, order: Omit<Order, 'id'>): Promise<string> {
    try {
      const subtotal = order.totalAmount;
      const tax = subtotal * 0.15;
      const total = subtotal + tax;
      const bill: Omit<Bill, 'id'> = {
        orderId,
        userId: order.userId,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal,
        tax,
        total,
        timestamp: new Date().toISOString(),
        status: 'draft',
      };
      const docRef = await addDoc(collection(db, 'bills'), bill);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async createBillFromTableBill(tableBill: TableBill): Promise<string> {
    try {
      const bill: Omit<Bill, 'id'> = {
        orderId: `table_${tableBill.tableNumber}_${Date.now()}`, // Generate a unique order ID for table bills
        userId: tableBill.userId,
        cafeId: tableBill.cafeId,
        tableNumber: tableBill.tableNumber,
        items: tableBill.items,
        subtotal: tableBill.subtotal,
        tax: tableBill.tax,
        total: tableBill.total,
        timestamp: new Date().toISOString(),
        status: 'paid', // Mark as paid since admin is paying it
      };
      const docRef = await addDoc(collection(db, 'bills'), bill);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill from table bill:', error);
      throw error;
    }
  }
  async getBills(userId: string): Promise<Bill[]> {
    try {
      const q = query(
        collection(db, 'bills'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      return bills.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<void> {
    try {
      await updateDoc(doc(db, 'bills', id), updates);
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  // =======================
  // Day Reports
  // =======================
  async createDayReport(userId: string, cashierInfo: { name: string; shift: string; notes: string }): Promise<string> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's data
      const [orders, bills, menuItems] = await Promise.all([
        this.getOrders(userId),
        this.getBills(userId),
        this.getMenuItems(userId)
      ]);
      
      // Filter today's orders
      const todayOrders = orders.filter(order => 
        order.timestamp.startsWith(today)
      );
      
      // Calculate stats
      const totalOrders = todayOrders.length;
      const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalPayments = bills.filter(bill => 
        bill.timestamp.startsWith(today) && bill.status === 'paid'
      ).length;
      
      // Get waiter calls from analytics (this would need to be tracked)
      const waiterCalls = 0; // Placeholder
      
      // Calculate most ordered items
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
      
      // Calculate most active table
      const tableCounts: Record<string, number> = {};
      todayOrders.forEach(order => {
        tableCounts[order.tableNumber] = (tableCounts[order.tableNumber] || 0) + 1;
      });
      
      const mostActiveTable = Object.entries(tableCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
      
      // Calculate department stats
      const kitchenOrders = todayOrders.filter(order => 
        order.items.some(item => {
          const menuItem = menuItems.find(mi => mi.id === item.id);
          return menuItem?.department === 'kitchen' || menuItem?.department === 'bar';
        })
      );
      
      const report: Omit<DayReport, 'id'> = {
        userId,
        date: today,
        cashierInfo,
        totalOrders,
        totalRevenue,
        totalPayments,
        waiterCalls,
        mostOrderedItems,
        mostActiveTable,
        departmentStats: {
          kitchen: { 
            orders: kitchenOrders.length,
            avgPrepTime: 15 // Placeholder
          }
        },
        timestamp: new Date().toISOString(),
        status: 'closed'
      };
      
      const docRef = await addDoc(collection(db, 'dayReports'), report);
      return docRef.id;
    } catch (error) {
      console.error('Error creating day report:', error);
      throw error;
    }
  }

  // =======================
  // Waiter Assignments
  // =======================
  async getWaiterAssignments(userId: string): Promise<WaiterAssignment[]> {
    try {
      const q = query(
        collection(db, 'waiterAssignments'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterAssignment));
      return assignments.sort((a, b) => a.startTable - b.startTable);
    } catch (error) {
      console.error('Error fetching waiter assignments:', error);
      return [];
    }
  }

  async addWaiterAssignment(assignment: Omit<WaiterAssignment, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'waiterAssignments'), {
        ...assignment,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding waiter assignment:', error);
      throw error;
    }
  }

  async updateWaiterAssignment(id: string, updates: Partial<WaiterAssignment>): Promise<void> {
    try {
      await updateDoc(doc(db, 'waiterAssignments', id), {
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

  async getWaiterForTable(userId: string, tableNumber: number): Promise<WaiterAssignment | null> {
    try {
      const assignments = await this.getWaiterAssignments(userId);
      
      // Check if waiter is currently on duty
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();
      
      return assignments.find(assignment => {
        // Check table range
        const inTableRange = tableNumber >= assignment.startTable && tableNumber <= assignment.endTable;
        if (!inTableRange || !assignment.isActive) return false;
        
        // Check working days
        const isWorkingDay = !assignment.workingDays || assignment.workingDays.includes(currentDay);
        if (!isWorkingDay) return false;
        
        // Check working hours
        const isWorkingHour = !assignment.shiftStartTime || !assignment.shiftEndTime ||
          (currentTime >= assignment.shiftStartTime && currentTime <= assignment.shiftEndTime);
        
        return isWorkingHour;
      }) || null;
    } catch (error) {
      console.error('Error getting waiter for table:', error);
      return null;
    }
  }

  async getDayReports(userId: string): Promise<DayReport[]> {
    try {
      const q = query(
        collection(db, 'dayReports'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayReport));
      return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching day reports:', error);
      return [];
    }
  }

  // =======================
  // Analytics
  // =======================
  async getMenuStats(userId: string): Promise<MenuStats> {
    try {
      const orders = await this.getOrders(userId);
      const menuItems = await this.getMenuItems(userId);
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalViews = menuItems.reduce((sum, item) => sum + item.views, 0);
      const itemOrderCounts: Record<string, { name: string; orders: number }> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemOrderCounts[item.id]) {
            const menuItem = menuItems.find(mi => mi.id === item.id);
            itemOrderCounts[item.id] = { name: menuItem?.name || item.name, orders: 0 };
          }
          itemOrderCounts[item.id].orders += item.quantity;
        });
      });
      const popularItems = Object.entries(itemOrderCounts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);
      const monthlyRevenue = this.calculateMonthlyRevenue(orders);
      return {
        totalOrders,
        totalRevenue,
        totalViews,
        popularItems,
        recentOrders: orders.slice(0, 10),
        monthlyRevenue,
      };
    } catch (error) {
      console.error('Error fetching menu stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalViews: 0,
        popularItems: [],
        recentOrders: [],
        monthlyRevenue: [],
      };
    }
  }

  private calculateMonthlyRevenue(orders: Order[]): Array<{ month: string; revenue: number }> {
    const monthlyData: Record<string, number> = {};
    orders.forEach(order => {
      const date = new Date(order.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + order.totalAmount;
    });
    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  // =======================
  // File Upload
  // =======================
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // =======================
  // Super Admin Methods
  // =======================
  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const restaurants: Restaurant[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as User;
        if (userData.businessName) {
          // Get stats for this restaurant
          const [orders, bills] = await Promise.all([
            this.getOrders(userDoc.id),
            this.getBills(userDoc.id)
          ]);
          
          restaurants.push({
            id: userDoc.id,
            businessName: userData.businessName,
            ownerEmail: userData.email,
            ownerName: userData.name || '',
            phone: userData.phone,
            status: userData.status || 'active',
            created_at: userData.created_at,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          });
        }
      }
      
      return restaurants.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching all restaurants:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const [users, allOrders] = await Promise.all([
        this.getAllUsers(),
        this.getAllOrders()
      ]);
      
      const restaurants = users.filter(user => user.businessName);
      const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Calculate monthly growth
      const monthlyData: Record<string, { restaurants: number; revenue: number }> = {};
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7); // YYYY-MM format
      }).reverse();
      
      last6Months.forEach(month => {
        monthlyData[month] = { restaurants: 0, revenue: 0 };
      });
      
      restaurants.forEach(restaurant => {
        const month = restaurant.created_at.slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].restaurants += 1;
        }
      });
      
      allOrders.forEach(order => {
        const month = order.timestamp.slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].revenue += order.totalAmount;
        }
      });
      
      const monthlyGrowth = Object.entries(monthlyData).map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        restaurants: data.restaurants,
        revenue: data.revenue,
      }));
      
      return {
        totalRestaurants: restaurants.length,
        totalUsers: users.length,
        totalOrders: allOrders.length,
        totalRevenue,
        monthlyGrowth,
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalRestaurants: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        monthlyGrowth: [],
      };
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }

  async createRestaurant(data: {
    businessName: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<string> {
    try {
      // Create Firebase Auth user
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../config/firebase');
      
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.ownerEmail, data.password);
      
      // Create user document
      const newUser: User = {
        id: firebaseUser.uid,
        email: data.ownerEmail,
        name: data.ownerName,
        businessName: data.businessName,
        phone: data.phone,
        address: data.address,
        created_at: new Date().toISOString(),
        subscription: 'free',
        status: 'active',
        settings: {
          currency: 'USD',
          language: 'en',
          theme: 'light',
          notifications: true,
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      return firebaseUser.uid;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async createSuperAdmin(): Promise<void> {
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../config/firebase');
      
      // Check if super admin already exists
      const existingUser = await this.getUserByEmail('natnaeltsegaye70@gmail.com');
      if (existingUser) {
        console.log('Super admin already exists');
        return;
      }
      
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth, 
        'natnaeltsegaye70@gmail.com', 
        'nati1989'
      );
      
      // Create super admin user document
      const superAdminUser: User = {
        id: firebaseUser.uid,
        email: 'natnaeltsegaye70@gmail.com',
        name: 'Super Admin',
        businessName: 'Platform Administration',
        created_at: new Date().toISOString(),
        subscription: 'premium',
        status: 'active',
        settings: {
          currency: 'USD',
          language: 'en',
          theme: 'light',
          notifications: true,
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), superAdminUser);
      console.log('Super admin created successfully');
    } catch (error) {
      console.error('Error creating super admin:', error);
      // Don't throw error if user already exists
      if (error.code !== 'auth/email-already-in-use') {
        throw error;
      }
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const userDoc = snapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateRestaurant(id: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', id), {
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
      // Delete user document
      await deleteDoc(doc(db, 'users', id));
      
      // Delete related data (menu items, orders, etc.)
      const collections = ['menuItems', 'categories', 'orders', 'bills', 'tableBills', 'pendingOrders', 'paymentConfirmations'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', id));
        const snapshot = await getDocs(q);
        
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(docSnapshot.ref);
        }
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
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
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../config/firebase');
      
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // =======================
  // User Profile
  // =======================
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userId, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
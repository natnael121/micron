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
  increment,
  Timestamp,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
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
import { 
  Supplier, 
  SupplierProduct, 
  PurchaseOrder, 
  SupplierInvoice,
  SupplierAnalytics,
  SupplierUser,
  RestaurantCustomer
} from '../types/supplier';

class FirebaseService {
  // =======================
  // User Management
  // =======================
  
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
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

  async getAllRestaurants(): Promise<any[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), orderBy('created_at', 'desc'))
      );
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          businessName: data.businessName || 'Unknown',
          ownerEmail: data.email,
          ownerName: data.name || 'Unknown',
          phone: data.phone,
          status: data.status || 'active',
          created_at: data.created_at,
          totalOrders: 0, // Would be calculated from orders
          totalRevenue: 0, // Would be calculated from orders
        };
      });
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  async getPlatformStats(): Promise<any> {
    try {
      const [usersSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'orders'), limit(1000)))
      ]);

      const totalUsers = usersSnapshot.size;
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      // Generate monthly growth data (mock for now)
      const monthlyGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthlyGrowth.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          restaurants: Math.floor(totalUsers * (0.8 + Math.random() * 0.4)),
          revenue: Math.floor(totalRevenue * (0.8 + Math.random() * 0.4) / 12)
        });
      }

      return {
        totalRestaurants: totalUsers,
        totalUsers,
        totalOrders,
        totalRevenue,
        monthlyGrowth
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  async createRestaurant(data: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...data,
        created_at: new Date().toISOString(),
        status: 'active',
        subscription: 'free',
        settings: {
          currency: 'USD',
          language: 'en',
          theme: 'light',
          notifications: true,
        }
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(id: string, updates: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', id), {
        ...updates,
        updated_at: new Date().toISOString()
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
      await updateDoc(doc(db, 'users', userId), {
        status: isActive ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async resetUserPassword(email: string): Promise<void> {
    // This would typically use Firebase Auth admin SDK
    // For now, we'll just log it
    console.log('Password reset requested for:', email);
  }

  // =======================
  // Menu Management
  // =======================
  
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'menuItems'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      
      // Sort in memory to avoid composite index requirement
      return items.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
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

      // Find current active schedule
      const currentSchedule = schedules.find(schedule => {
        if (!schedule.isActive || !schedule.daysOfWeek.includes(currentDay)) return false;
        return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
      });

      return menuItems.map(item => {
        let isCurrentlyAvailable = item.available;
        let nextAvailableSchedule: MenuSchedule | undefined;

        // If item has schedules, check availability
        if (item.scheduleIds && item.scheduleIds.length > 0) {
          const itemSchedules = schedules.filter(s => item.scheduleIds!.includes(s.id) && s.isActive);
          
          if (itemSchedules.length > 0) {
            // Check if any of the item's schedules are currently active
            const activeSchedule = itemSchedules.find(schedule => {
              if (!schedule.daysOfWeek.includes(currentDay)) return false;
              return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
            });

            isCurrentlyAvailable = item.available && !!activeSchedule;

            // Find next available schedule if not currently available
            if (!activeSchedule) {
              nextAvailableSchedule = itemSchedules
                .filter(s => s.daysOfWeek.includes(currentDay) && s.startTime > currentTime)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
            }
          }
        }

        return {
          ...item,
          currentSchedule,
          nextAvailableSchedule,
          isCurrentlyAvailable,
        } as ScheduledMenuItem;
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
      const itemRef = doc(db, 'menuItems', id);
      await updateDoc(itemRef, {
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
  // Category Management
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
  // Schedule Management
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

  // =======================
  // Department Management
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
      await updateDoc(doc(db, 'departments', id), updates);
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
      await updateDoc(doc(db, 'waiterAssignments', id), {
        ...updates,
        updated_at: new Date().toISOString()
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
  // Order Management
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
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        return { id: orderDoc.id, ...orderDoc.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async getOrderByDeliveryId(deliveryOrderId: string): Promise<Order | null> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('deliveryInfo.orderId', '==', deliveryOrderId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order by delivery ID:', error);
      throw error;
    }
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), order);
      return docRef.id;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', id), {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // =======================
  // Pending Orders
  // =======================
  
  async getPendingOrders(userId: string): Promise<PendingOrder[]> {
    try {
      const q = query(
        collection(db, 'pendingOrders'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrder));
      
      // Sort in memory to avoid composite index requirement
      return orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
  }

  async addPendingOrder(order: Omit<PendingOrder, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'pendingOrders'), order);
      return docRef.id;
    } catch (error) {
      console.error('Error adding pending order:', error);
      throw error;
    }
  }

  async approvePendingOrder(pendingOrderId: string, pendingOrder: PendingOrder): Promise<void> {
    try {
      // Create approved order
      const approvedOrder: Omit<Order, 'id'> = {
        ...pendingOrder,
        status: 'confirmed',
        paymentStatus: 'pending',
      };
      
      const orderRef = await addDoc(collection(db, 'orders'), approvedOrder);
      
      // Add to table bill
      await this.addToTableBill(pendingOrder.userId, pendingOrder.tableNumber, pendingOrder.items, pendingOrder.cafeId);
      
      // Send to departments
      await this.sendOrderToDepartments(orderRef.id, { ...approvedOrder, id: orderRef.id }, pendingOrder.userId);
      
      // Delete pending order
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
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
  // Table Bills
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
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new bill
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        
        const billData: any = {
          tableNumber,
          userId,
          items,
          subtotal,
          tax,
          total,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

  async markTableBillAsPaid(userId: string, tableNumber: string, paymentConfirmationId?: string, cafeId?: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber, cafeId);
      if (bill) {
        await updateDoc(doc(db, 'tableBills', bill.id), {
          status: 'paid',
          paymentConfirmationId,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking table bill as paid:', error);
      throw error;
    }
  }

  // =======================
  // Payment Confirmations
  // =======================
  
  async getPaymentConfirmations(userId: string): Promise<PaymentConfirmation[]> {
    try {
      const q = query(
        collection(db, 'paymentConfirmations'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const confirmations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConfirmation));
      
      // Sort in memory to avoid composite index requirement
      return confirmations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
  // Bills
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
        cafeId: tableBill.cafeId,
        tableNumber: tableBill.tableNumber,
        items: tableBill.items,
        subtotal: tableBill.subtotal,
        tax: tableBill.tax,
        total: tableBill.total,
        timestamp: new Date().toISOString(),
        status: 'paid'
      };
      
      const docRef = await addDoc(collection(db, 'bills'), billData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill from table bill:', error);
      throw error;
    }
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<void> {
    try {
      await updateDoc(doc(db, 'bills', id), {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  // =======================
  // Waiter Calls
  // =======================
  
  async addWaiterCall(userId: string, tableNumber: string): Promise<string> {
    try {
      const waiterCallData: Omit<WaiterCall, 'id'> = {
        userId,
        tableNumber,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const docRef = await addDoc(collection(db, 'waiterCalls'), waiterCallData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding waiter call:', error);
      throw error;
    }
  }

  // =======================
  // Day Reports
  // =======================
  
  async getDayReports(userId: string): Promise<DayReport[]> {
    try {
      const q = query(
        collection(db, 'dayReports'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayReport));
    } catch (error) {
      console.error('Error fetching day reports:', error);
      throw error;
    }
  }

  async createDayReport(userId: string, cashierInfo: any): Promise<string> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's data
      const [orders, waiterCalls] = await Promise.all([
        this.getTodayOrders(userId),
        this.getTodayWaiterCalls(userId)
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalPayments = orders.filter(order => order.paymentStatus === 'paid').length;

      // Calculate most ordered items
      const itemCounts: Record<string, number> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });

      const mostOrderedItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Find most active table
      const tableCounts: Record<string, number> = {};
      orders.forEach(order => {
        tableCounts[order.tableNumber] = (tableCounts[order.tableNumber] || 0) + 1;
      });
      const mostActiveTable = Object.entries(tableCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      const reportData: Omit<DayReport, 'id'> = {
        userId,
        date: today,
        cashierInfo,
        totalOrders: orders.length,
        totalRevenue,
        totalPayments,
        waiterCalls: waiterCalls.length,
        mostOrderedItems,
        mostActiveTable,
        departmentStats: {
          kitchen: {
            orders: orders.length,
            avgPrepTime: 15 // Would calculate from actual data
          }
        },
        timestamp: new Date().toISOString(),
        status: 'closed'
      };

      const docRef = await addDoc(collection(db, 'dayReports'), reportData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating day report:', error);
      throw error;
    }
  }

  private async getTodayOrders(userId: string): Promise<Order[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const orders = await this.getOrders(userId);
      return orders.filter(order => order.timestamp.startsWith(today));
    } catch (error) {
      console.error('Error fetching today orders:', error);
      return [];
    }
  }

  private async getTodayWaiterCalls(userId: string): Promise<WaiterCall[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'waiterCalls'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterCall));
      return calls.filter(call => call.timestamp.startsWith(today));
    } catch (error) {
      console.error('Error fetching today waiter calls:', error);
      return [];
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getMenuStats(userId: string): Promise<MenuStats> {
    try {
      const [orders, menuItems] = await Promise.all([
        this.getOrders(userId, 100),
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

      // Generate monthly revenue (mock data for now)
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        });
        
        monthlyRevenue.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        });
      }

      return {
        totalOrders,
        totalRevenue,
        totalViews,
        popularItems,
        recentOrders: orders.slice(0, 10),
        monthlyRevenue
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

  // =======================
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
      await updateDoc(doc(db, 'deliveryIntegrations', id), updates);
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
      throw error;
    }
  }

  async updateWebhookEvent(id: string, updates: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'deliveryWebhookEvents', id), updates);
    } catch (error) {
      console.error('Error updating webhook event:', error);
      throw error;
    }
  }

  // =======================
  // Supplier Management
  // =======================
  
  async getSuppliers(restaurantId: string): Promise<Supplier[]> {
    try {
      const suppliers: Supplier[] = [];
      
      // Get global suppliers
      const globalQuery = query(
        collection(db, 'suppliers'),
        where('type', '==', 'global'),
        where('isActive', '==', true)
      );
      const globalSnapshot = await getDocs(globalQuery);
      globalSnapshot.docs.forEach(doc => {
        suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      
      // Get restaurant-specific suppliers
      const restaurantQuery = query(
        collection(db, 'suppliers'),
        where('type', '==', 'restaurant_specific'),
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true)
      );
      const restaurantSnapshot = await getDocs(restaurantQuery);
      restaurantSnapshot.docs.forEach(doc => {
        suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      
      // Sort in memory to avoid composite index requirement
      return suppliers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const snapshot = await getDocs(collection(db, 'suppliers'));
      const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      
      // Sort in memory to avoid composite index requirement
      return suppliers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching all suppliers:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    try {
      await updateDoc(doc(db, 'suppliers', id), {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // =======================
  // Supplier Products
  // =======================
  
  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    try {
      const q = query(
        collection(db, 'supplierProducts'),
        where('supplierId', '==', supplierId),
        where('isAvailable', '==', true)
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierProduct));
      
      // Sort in memory to avoid composite index requirement
      return products.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      throw error;
    }
  }

  async addSupplierProduct(product: Omit<SupplierProduct, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'supplierProducts'), {
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding supplier product:', error);
      throw error;
    }
  }

  async updateSupplierProduct(id: string, updates: Partial<SupplierProduct>): Promise<void> {
    try {
      await updateDoc(doc(db, 'supplierProducts', id), {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating supplier product:', error);
      throw error;
    }
  }

  async deleteSupplierProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'supplierProducts', id));
    } catch (error) {
      console.error('Error deleting supplier product:', error);
      throw error;
    }
  }

  // =======================
  // Purchase Orders
  // =======================
  
  async getPurchaseOrders(restaurantId: string): Promise<PurchaseOrder[]> {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('restaurantId', '==', restaurantId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
      
      // Sort in memory to avoid composite index requirement
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const q = query(collection(db, 'purchaseOrders'), limit(1000));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
      
      // Sort in memory to avoid composite index requirement
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching all purchase orders:', error);
      throw error;
    }
  }

  async addPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'orderNumber'>): Promise<string> {
    try {
      // Generate order number
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const orderNumber = `PO-${dateStr}-${Date.now().toString().slice(-6)}`;
      
      const docRef = await addDoc(collection(db, 'purchaseOrders'), {
        ...order,
        orderNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding purchase order:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<void> {
    try {
      await updateDoc(doc(db, 'purchaseOrders', id), {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  // =======================
  // Supplier Authentication
  // =======================
  
  async createSupplierUser(userData: {
    email: string;
    name: string;
    supplierId: string;
    role: 'supplier_admin' | 'supplier_staff';
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'supplierUsers'), {
        ...userData,
        isActive: true,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating supplier user:', error);
      throw error;
    }
  }
  // =======================
  // Supplier Users (for supplier portal)
  // =======================
  
  async getSupplierUser(userId: string): Promise<SupplierUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'supplierUsers', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as SupplierUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching supplier user:', error);
      throw error;
    }
  }

  async getSupplierOrders(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('supplierId', '==', supplierId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
  }

  async getSupplierCustomers(supplierId: string): Promise<RestaurantCustomer[]> {
    try {
      // Get all purchase orders for this supplier
      const orders = await this.getSupplierOrders(supplierId);
      
      // Group by restaurant
      const customerStats: Record<string, {
        orders: PurchaseOrder[];
        totalSpent: number;
        lastOrderDate?: string;
      }> = {};

      orders.forEach(order => {
        if (!customerStats[order.restaurantId]) {
          customerStats[order.restaurantId] = {
            orders: [],
            totalSpent: 0
          };
        }
        customerStats[order.restaurantId].orders.push(order);
        customerStats[order.restaurantId].totalSpent += order.total;
        
        if (!customerStats[order.restaurantId].lastOrderDate || 
            order.created_at > customerStats[order.restaurantId].lastOrderDate!) {
          customerStats[order.restaurantId].lastOrderDate = order.created_at;
        }
      });

      // Get restaurant details and create customer objects
      const customers: RestaurantCustomer[] = [];
      
      for (const [restaurantId, stats] of Object.entries(customerStats)) {
        try {
          const restaurant = await this.getUserProfile(restaurantId);
          if (restaurant) {
            customers.push({
              id: restaurantId,
              name: restaurant.businessName || restaurant.name || 'Unknown Restaurant',
              contactEmail: restaurant.email,
              contactPhone: restaurant.phone || '',
              address: {
                line1: restaurant.address || '',
                line2: '',
                city: restaurant.city || '',
                state: restaurant.state || '',
                postalCode: restaurant.postalCode || '',
                country: restaurant.country || 'US',
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              },
              totalOrders: stats.orders.length,
              totalSpent: stats.totalSpent,
              lastOrderDate: stats.lastOrderDate,
              averageOrderValue: stats.totalSpent / stats.orders.length,
              status: 'active'
            });
          }
        } catch (error) {
          console.error(`Error fetching restaurant ${restaurantId}:`, error);
        }
      }

      return customers.sort((a, b) => b.totalSpent - a.totalSpent);
    } catch (error) {
      console.error('Error fetching supplier customers:', error);
      throw error;
    }
  }

  // =======================
  // File Upload
  // =======================
  
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
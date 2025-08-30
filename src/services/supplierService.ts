import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { firebaseService } from './firebase';
import { 
  Supplier, 
  SupplierProduct, 
  PurchaseOrder, 
  SupplierInvoice, 
  SupplierAnalytics,
  ProductCategory 
} from '../types/supplier';

class SupplierService {
  // =======================
  // Supplier Management
  // =======================
  
  async getSuppliers(restaurantId?: string): Promise<Supplier[]> {
    try {
      const suppliers: Supplier[] = [];
      
      // Get global suppliers (visible to all restaurants)
      const globalQuery = query(
        collection(db, 'suppliers'),
        where('type', '==', 'global'),
        where('isActive', '==', true),
        orderBy('name')
      );
      const globalSnapshot = await getDocs(globalQuery);
      globalSnapshot.docs.forEach(doc => {
        suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      
      // Get restaurant-specific suppliers if restaurantId provided
      if (restaurantId) {
        const restaurantQuery = query(
          collection(db, 'suppliers'),
          where('type', '==', 'restaurant_specific'),
          where('restaurantId', '==', restaurantId),
          where('isActive', '==', true),
          orderBy('name')
        );
        const restaurantSnapshot = await getDocs(restaurantQuery);
        restaurantSnapshot.docs.forEach(doc => {
          suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
        });
      }
      
      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'suppliers'), orderBy('created_at', 'desc'))
      );
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
    } catch (error) {
      console.error('Error fetching all suppliers:', error);
      throw error;
    }
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    try {
      const docRef = doc(db, 'suppliers', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Supplier;
      }
      return null;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  }

  async addSupplier(supplier: Omit<Supplier, 'id'>): Promise<string> {
    try {
      return await firebaseService.addSupplier(supplier);
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
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
  // Supplier Authentication
  // =======================
  
  async createSupplierAccount(supplierData: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    contactPerson: {
      name: string;
      email: string;
      phone: string;
      position?: string;
    };
  }): Promise<{ supplierId: string; userId: string }> {
    try {
      // Create supplier record first
      const supplier: Omit<Supplier, 'id'> = {
        name: supplierData.businessName,
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        contactPerson: supplierData.contactPerson,
        businessInfo: {
          description: `${supplierData.businessName} - Professional supplier services`
        },
        type: 'restaurant_specific',
        isActive: true,
        paymentTerms: {
          method: 'bank_transfer',
          daysNet: 30,
          discountPercent: 0,
          discountDays: 0,
        },
        deliveryInfo: {
          minimumOrder: 0,
          deliveryFee: 0,
          freeDeliveryThreshold: 100,
          estimatedDeliveryDays: 3,
          deliveryAreas: [supplierData.address.city],
        }
      };

      const supplierId = await this.addSupplier(supplier);

      return { supplierId, userId: supplierId };
    } catch (error) {
      console.error('Error creating supplier account:', error);
      throw error;
    }
  }

  async createSupplierUserWithId(userId: string, userData: any): Promise<void> {
    try {
      const docRef = doc(db, 'supplierUsers', userId);
      await setDoc(docRef, userData);
    } catch (error) {
      console.error('Error creating supplier user with ID:', error);
      throw error;
    }
  }

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
  // Product Management
  // =======================
  
  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    try {
      const q = query(
        collection(db, 'supplierProducts'),
        where('supplierId', '==', supplierId),
        where('isAvailable', '==', true),
        orderBy('category'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierProduct));
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
      const docRef = doc(db, 'supplierProducts', id);
      await updateDoc(docRef, {
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
  // Purchase Order Management
  // =======================
  
  async getPurchaseOrders(restaurantId: string): Promise<PurchaseOrder[]> {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('restaurantId', '==', restaurantId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async getSupplierOrders(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      return await firebaseService.getSupplierOrders(supplierId);
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
  }

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        orderBy('created_at', 'desc'),
        limit(1000)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
    } catch (error) {
      console.error('Error fetching all purchase orders:', error);
      throw error;
    }
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    try {
      const docRef = doc(db, 'purchaseOrders', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PurchaseOrder;
      }
      return null;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
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
      const docRef = doc(db, 'purchaseOrders', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'purchaseOrders', id));
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // =======================
  // Invoice Management
  // =======================
  
  async getSupplierInvoices(restaurantId: string): Promise<SupplierInvoice[]> {
    try {
      const q = query(
        collection(db, 'supplierInvoices'),
        where('restaurantId', '==', restaurantId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierInvoice));
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
      throw error;
    }
  }

  async addSupplierInvoice(invoice: Omit<SupplierInvoice, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'supplierInvoices'), {
        ...invoice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding supplier invoice:', error);
      throw error;
    }
  }

  async updateSupplierInvoice(id: string, updates: Partial<SupplierInvoice>): Promise<void> {
    try {
      const docRef = doc(db, 'supplierInvoices', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating supplier invoice:', error);
      throw error;
    }
  }

  // =======================
  // Product Categories
  // =======================
  
  async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const q = query(
        collection(db, 'productCategories'),
        where('isActive', '==', true),
        orderBy('order'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
    } catch (error) {
      console.error('Error fetching product categories:', error);
      throw error;
    }
  }

  async addProductCategory(category: Omit<ProductCategory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'productCategories'), {
        ...category,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product category:', error);
      throw error;
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getSupplierAnalytics(restaurantId?: string): Promise<SupplierAnalytics> {
    try {
      const [suppliers, purchaseOrders] = await Promise.all([
        restaurantId ? this.getSuppliers(restaurantId) : this.getAllSuppliers(),
        restaurantId ? this.getPurchaseOrders(restaurantId) : this.getAllPurchaseOrders()
      ]);

      const globalSuppliers = suppliers.filter(s => s.type === 'global').length;
      const restaurantSuppliers = suppliers.filter(s => s.type === 'restaurant_specific').length;

      const totalPurchaseValue = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = purchaseOrders.length > 0 ? totalPurchaseValue / purchaseOrders.length : 0;

      // Calculate top suppliers
      const supplierStats: Record<string, { orders: number; revenue: number; restaurants: Set<string> }> = {};
      purchaseOrders.forEach(order => {
        if (!supplierStats[order.supplierId]) {
          supplierStats[order.supplierId] = { orders: 0, revenue: 0, restaurants: new Set() };
        }
        supplierStats[order.supplierId].orders++;
        supplierStats[order.supplierId].revenue += order.total;
        supplierStats[order.supplierId].restaurants.add(order.restaurantId);
      });

      const topSuppliers = Object.entries(supplierStats)
        .map(([id, stats]) => {
          const supplier = suppliers.find(s => s.id === id);
          return {
            id,
            name: supplier?.name || 'Unknown',
            orders: stats.orders,
            revenue: stats.revenue,
            restaurants: stats.restaurants.size
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate orders by status
      const ordersByStatus = purchaseOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<PurchaseOrder['status'], number>);

      // Calculate monthly trends (last 12 months)
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
        
        const monthOrders = purchaseOrders.filter(order => 
          order.created_at.startsWith(monthStr)
        );
        
        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          orders: monthOrders.length,
          value: monthOrders.reduce((sum, order) => sum + order.total, 0)
        });
      }

      return {
        totalSuppliers: suppliers.length,
        globalSuppliers,
        restaurantSuppliers,
        totalPurchaseOrders: purchaseOrders.length,
        totalPurchaseValue,
        averageOrderValue,
        topSuppliers,
        topProducts: [], // Would need product-level analytics
        ordersByStatus,
        monthlyTrends,
        supplierPerformance: [] // Would need delivery tracking data
      };
    } catch (error) {
      console.error('Error calculating supplier analytics:', error);
      throw error;
    }
  }

  // =======================
  // Utility Methods
  // =======================
  
  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${dateStr}-${timestamp}`;
  }

  async searchProducts(query: string, supplierId?: string): Promise<SupplierProduct[]> {
    try {
      let q = collection(db, 'supplierProducts');
      
      if (supplierId) {
        q = query(q, where('supplierId', '==', supplierId));
      }
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierProduct));
      
      // Client-side filtering for search
      const searchTerm = query.toLowerCase();
      return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.sku?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
}

export const supplierService = new SupplierService();
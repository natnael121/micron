// POS Machine Integration API
// This endpoint handles communication between your restaurant app and POS machines

export default async function handler(req, res) {
  // Enable CORS for POS machine requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, body, query } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOSRequest(req, res);
      case 'GET':
        return await handlePOSQuery(req, res);
      case 'PUT':
        return await handlePOSUpdate(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('POS API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Handle POS machine requests (orders, payments, etc.)
async function handlePOSRequest(req, res) {
  const { action, data } = req.body;

  switch (action) {
    case 'sync_order':
      return await syncOrderToPOS(req, res);
    case 'process_payment':
      return await processPaymentFromPOS(req, res);
    case 'update_inventory':
      return await updateInventoryFromPOS(req, res);
    case 'get_menu':
      return await getMenuForPOS(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

// Sync order from restaurant app to POS machine
async function syncOrderToPOS(req, res) {
  const { orderId, tableNumber, items, totalAmount, userId } = req.body.data;

  try {
    // Validate required fields
    if (!orderId || !tableNumber || !items || !totalAmount || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['orderId', 'tableNumber', 'items', 'totalAmount', 'userId']
      });
    }

    // Format order for POS machine
    const posOrder = {
      id: orderId,
      table: tableNumber,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        category: item.category || 'General'
      })),
      subtotal: totalAmount,
      tax: totalAmount * 0.15,
      total: totalAmount * 1.15,
      timestamp: new Date().toISOString(),
      status: 'pending',
      source: 'restaurant_app'
    };

    // Here you would integrate with your specific POS system
    // Examples for common POS systems:
    
    // For Square POS:
    // await syncToSquarePOS(posOrder);
    
    // For Toast POS:
    // await syncToToastPOS(posOrder);
    
    // For custom POS:
    // await syncToCustomPOS(posOrder);

    // Log the order sync for debugging
    console.log('Order synced to POS:', posOrder);

    return res.status(200).json({
      success: true,
      message: 'Order synced to POS successfully',
      posOrderId: orderId,
      data: posOrder
    });

  } catch (error) {
    console.error('Error syncing order to POS:', error);
    return res.status(500).json({ 
      error: 'Failed to sync order to POS',
      details: error.message 
    });
  }
}

// Process payment from POS machine
async function processPaymentFromPOS(req, res) {
  const { 
    orderId, 
    paymentMethod, 
    amount, 
    transactionId, 
    cardLast4,
    receiptData 
  } = req.body.data;

  try {
    // Validate payment data
    if (!orderId || !paymentMethod || !amount || !transactionId) {
      return res.status(400).json({ 
        error: 'Missing required payment fields',
        required: ['orderId', 'paymentMethod', 'amount', 'transactionId']
      });
    }

    // Process payment record
    const paymentRecord = {
      orderId,
      method: paymentMethod, // 'cash', 'card', 'mobile'
      amount: parseFloat(amount),
      transactionId,
      cardLast4: cardLast4 || null,
      receiptData: receiptData || null,
      timestamp: new Date().toISOString(),
      status: 'completed',
      source: 'pos_machine'
    };

    // Update order status in Firebase
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = admin.firestore();
    
    // Update order payment status
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'paid',
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      paidAt: new Date().toISOString()
    });

    // Create payment record
    await db.collection('payments').add(paymentRecord);

    console.log('Payment processed from POS:', paymentRecord);

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      paymentId: transactionId,
      data: paymentRecord
    });

  } catch (error) {
    console.error('Error processing payment from POS:', error);
    return res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
}

// Update inventory from POS machine
async function updateInventoryFromPOS(req, res) {
  const { items } = req.body.data;

  try {
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Invalid inventory data',
        expected: 'Array of items with id and quantity'
      });
    }

    const admin = await import('firebase-admin');
    const db = admin.firestore();
    
    // Update menu item availability based on inventory
    const batch = db.batch();
    
    for (const item of items) {
      if (item.id && typeof item.quantity === 'number') {
        const menuItemRef = db.collection('menuItems').doc(item.id);
        batch.update(menuItemRef, {
          available: item.quantity > 0,
          stock_quantity: item.quantity,
          last_inventory_update: new Date().toISOString()
        });
      }
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      updatedItems: items.length
    });

  } catch (error) {
    console.error('Error updating inventory from POS:', error);
    return res.status(500).json({ 
      error: 'Failed to update inventory',
      details: error.message 
    });
  }
}

// Get menu data for POS machine
async function getMenuForPOS(req, res) {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const admin = await import('firebase-admin');
    const db = admin.firestore();
    
    // Get menu items and categories
    const [menuSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection('menuItems').where('userId', '==', userId).get(),
      db.collection('categories').where('userId', '==', userId).get()
    ]);

    const menuItems = menuSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Format for POS machine
    const posMenu = {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        order: cat.order || 0
      })),
      items: menuItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available,
        description: item.description,
        preparation_time: item.preparation_time || 0,
        department: item.department || 'kitchen'
      }))
    };

    return res.status(200).json({
      success: true,
      data: posMenu,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting menu for POS:', error);
    return res.status(500).json({ 
      error: 'Failed to get menu data',
      details: error.message 
    });
  }
}

// Handle POS queries (status, reports, etc.)
async function handlePOSQuery(req, res) {
  const { type, userId, date } = req.query;

  switch (type) {
    case 'orders':
      return await getPOSOrders(req, res);
    case 'sales_report':
      return await getPOSSalesReport(req, res);
    case 'status':
      return await getPOSStatus(req, res);
    default:
      return res.status(400).json({ error: 'Invalid query type' });
  }
}

// Get orders for POS machine
async function getPOSOrders(req, res) {
  const { userId, status, date } = req.query;

  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    
    let query = db.collection('orders').where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where('timestamp', '>=', startOfDay.toISOString())
                  .where('timestamp', '<=', endOfDay.toISOString());
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error getting POS orders:', error);
    return res.status(500).json({ 
      error: 'Failed to get orders',
      details: error.message 
    });
  }
}

// Get sales report for POS machine
async function getPOSSalesReport(req, res) {
  const { userId, startDate, endDate } = req.query;

  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    
    let query = db.collection('orders').where('userId', '==', userId);
    
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => doc.data());

    // Calculate sales metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by payment method
    const paymentMethods = orders.reduce((acc, order) => {
      const method = order.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + order.totalAmount;
      return acc;
    }, {});

    // Top selling items
    const itemSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.id]) {
          itemSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.id].quantity += item.quantity;
        itemSales[item.id].revenue += item.total;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          period: { startDate, endDate }
        },
        paymentMethods,
        topItems,
        orders: orders.slice(0, 100) // Limit for performance
      }
    });

  } catch (error) {
    console.error('Error generating POS sales report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate sales report',
      details: error.message 
    });
  }
}

// Get POS system status
async function getPOSStatus(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      version: '1.0.0',
      lastSync: new Date().toISOString(),
      endpoints: {
        syncOrder: '/api/pos-integration?action=sync_order',
        processPayment: '/api/pos-integration?action=process_payment',
        updateInventory: '/api/pos-integration?action=update_inventory',
        getMenu: '/api/pos-integration?type=menu',
        getOrders: '/api/pos-integration?type=orders',
        getSalesReport: '/api/pos-integration?type=sales_report'
      }
    }
  });
}

// Handle POS updates (order status changes, etc.)
async function handlePOSUpdate(req, res) {
  const { orderId, status, updates } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const admin = await import('firebase-admin');
    const db = admin.firestore();
    
    const updateData = {
      ...updates,
      last_pos_update: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    await db.collection('orders').doc(orderId).update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      orderId,
      updates: updateData
    });

  } catch (error) {
    console.error('Error updating order from POS:', error);
    return res.status(500).json({ 
      error: 'Failed to update order',
      details: error.message 
    });
  }
}
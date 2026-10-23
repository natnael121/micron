// Order Status Update API
// Updates order status in delivery companies when restaurant changes status

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, status, estimatedTime, deliveryCompanyId, timestamp } = req.body;

    if (!orderId || !status || !deliveryCompanyId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'status', 'deliveryCompanyId']
      });
    }

    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDoc.data();
    if (!order.deliveryInfo) {
      return res.status(400).json({ error: 'Not a delivery order' });
    }

    // Update status in delivery company
    const updateResult = await updateStatusInDeliveryCompany(
      order.deliveryInfo.orderId,
      status,
      deliveryCompanyId,
      estimatedTime
    );

    if (updateResult.success) {
      // Update our internal order status
      const statusMapping = {
        'accepted': 'confirmed',
        'preparing': 'preparing',
        'ready': 'ready',
        'cancelled': 'cancelled'
      };

      await orderDoc.ref.update({
        status: statusMapping[status] || status,
        [`${status}At`]: new Date().toISOString(),
        estimatedPrepTime: estimatedTime,
        updated_at: new Date().toISOString()
      });

      // Log status update
      await db.collection('orderStatusUpdates').add({
        orderId,
        deliveryCompanyOrderId: order.deliveryInfo.orderId,
        deliveryCompany: deliveryCompanyId,
        status,
        estimatedTime,
        timestamp: timestamp || new Date().toISOString(),
        success: true
      });

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        orderId,
        status,
        estimatedTime
      });
    } else {
      res.status(400).json({
        success: false,
        error: updateResult.error,
        orderId
      });
    }
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function updateStatusInDeliveryCompany(deliveryOrderId, status, companyId, estimatedTime) {
  try {
    // Get delivery company configuration
    const company = await getDeliveryCompanyConfig(companyId);
    if (!company) {
      return { success: false, error: 'Delivery company not found' };
    }

    // Make API call to delivery company
    switch (companyId) {
      case 'uber_eats':
        return await updateUberEatsOrderStatus(deliveryOrderId, status, estimatedTime);
      case 'doordash':
        return await updateDoorDashOrderStatus(deliveryOrderId, status, estimatedTime);
      case 'grubhub':
        return await updateGrubHubOrderStatus(deliveryOrderId, status, estimatedTime);
      default:
        return { success: false, error: 'Unsupported delivery company' };
    }
  } catch (error) {
    console.error('Error updating status in delivery company:', error);
    return { success: false, error: error.message };
  }
}

async function updateUberEatsOrderStatus(orderId, status, estimatedTime) {
  try {
    console.log(`Updating Uber Eats order ${orderId} to ${status}`);
    
    // In a real implementation, this would make an authenticated API call:
    /*
    const response = await fetch(`https://api.uber.com/v1/eats/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: mapStatusToUberEats(status),
        estimated_ready_time: estimatedTime ? Date.now() + (estimatedTime * 60000) : null
      })
    });
    */
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Order status updated to ${status} in Uber Eats`,
      externalOrderId: orderId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateDoorDashOrderStatus(orderId, status, estimatedTime) {
  try {
    console.log(`Updating DoorDash order ${orderId} to ${status}`);
    
    // Simulate DoorDash API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      message: `Order status updated to ${status} in DoorDash`,
      externalOrderId: orderId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateGrubHubOrderStatus(orderId, status, estimatedTime) {
  try {
    console.log(`Updating Grubhub order ${orderId} to ${status}`);
    
    // Simulate Grubhub API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      message: `Order status updated to ${status} in Grubhub`,
      externalOrderId: orderId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getDeliveryCompanyConfig(companyId) {
  // In a real implementation, this would fetch from database
  const companies = {
    'uber_eats': {
      id: 'uber_eats',
      name: 'Uber Eats',
      apiEndpoint: 'https://api.uber.com/v1/eats',
      authType: 'oauth'
    },
    'doordash': {
      id: 'doordash',
      name: 'DoorDash',
      apiEndpoint: 'https://api.doordash.com/v1',
      authType: 'api_key'
    },
    'grubhub': {
      id: 'grubhub',
      name: 'Grubhub',
      apiEndpoint: 'https://api.grubhub.com/v1',
      authType: 'basic'
    }
  };

  return companies[companyId] || null;
}

function mapStatusToUberEats(status) {
  const statusMap = {
    'accepted': 'accepted',
    'preparing': 'preparing',
    'ready': 'ready_for_pickup',
    'cancelled': 'cancelled'
  };
  return statusMap[status] || status;
}

function mapStatusToDoorDash(status) {
  const statusMap = {
    'accepted': 'confirmed',
    'preparing': 'in_preparation',
    'ready': 'ready_for_pickup',
    'cancelled': 'cancelled'
  };
  return statusMap[status] || status;
}

function mapStatusToGrubHub(status) {
  const statusMap = {
    'accepted': 'CONFIRMED',
    'preparing': 'PREPARING',
    'ready': 'READY',
    'cancelled': 'CANCELLED'
  };
  return statusMap[status] || status.toUpperCase();
}
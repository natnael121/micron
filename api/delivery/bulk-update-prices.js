// Bulk Price Update API
// Updates menu item prices across delivery platforms

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
    const { restaurantId, items, companyId } = req.body;

    if (!restaurantId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['restaurantId', 'items (array)', 'companyId']
      });
    }

    // Update prices in delivery company
    const updateResult = await bulkUpdatePricesInDeliveryCompany(
      restaurantId,
      items,
      companyId
    );

    if (updateResult.success) {
      // Log the bulk update
      await db.collection('bulkPriceUpdates').add({
        restaurantId,
        companyId,
        itemsCount: items.length,
        timestamp: new Date().toISOString(),
        success: true
      });

      res.status(200).json({
        success: true,
        message: 'Prices updated successfully',
        updatedItems: updateResult.updatedItems,
        companyId
      });
    } else {
      res.status(400).json({
        success: false,
        error: updateResult.error
      });
    }
  } catch (error) {
    console.error('Bulk price update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function bulkUpdatePricesInDeliveryCompany(restaurantId, items, companyId) {
  try {
    // Make API call to delivery company to update all item prices
    switch (companyId) {
      case 'uber_eats':
        return await bulkUpdateUberEatsPrices(restaurantId, items);
      case 'doordash':
        return await bulkUpdateDoorDashPrices(restaurantId, items);
      case 'grubhub':
        return await bulkUpdateGrubHubPrices(restaurantId, items);
      default:
        return { success: false, error: 'Unsupported delivery company' };
    }
  } catch (error) {
    console.error('Error bulk updating prices in delivery company:', error);
    return { success: false, error: error.message };
  }
}

async function bulkUpdateUberEatsPrices(restaurantId, items) {
  try {
    console.log(`Bulk updating ${items.length} item prices in Uber Eats`);
    
    // In a real implementation:
    /*
    const response = await fetch(`https://api.uber.com/v1/eats/stores/${restaurantId}/menus/items/bulk-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          price: Math.round(item.price * 100) // Convert to cents
        }))
      })
    });
    */
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      updatedItems: items.length,
      message: `Updated ${items.length} item prices in Uber Eats`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function bulkUpdateDoorDashPrices(restaurantId, items) {
  try {
    console.log(`Bulk updating ${items.length} item prices in DoorDash`);
    
    // Simulate DoorDash API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      updatedItems: items.length,
      message: `Updated ${items.length} item prices in DoorDash`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function bulkUpdateGrubHubPrices(restaurantId, items) {
  try {
    console.log(`Bulk updating ${items.length} item prices in Grubhub`);
    
    // Simulate Grubhub API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      updatedItems: items.length,
      message: `Updated ${items.length} item prices in Grubhub`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
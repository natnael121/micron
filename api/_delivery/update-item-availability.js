// Item Availability Update API
// Updates menu item availability across all delivery platforms

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
    const { restaurantId, itemId, isAvailable, companyId } = req.body;

    if (!restaurantId || !itemId || typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['restaurantId', 'itemId', 'isAvailable']
      });
    }

    // Update availability in delivery company
    const updateResult = await updateItemAvailabilityInDeliveryCompany(
      restaurantId,
      itemId,
      isAvailable,
      companyId
    );

    if (updateResult.success) {
      // Log the availability update
      await db.collection('itemAvailabilityUpdates').add({
        restaurantId,
        itemId,
        isAvailable,
        companyId,
        timestamp: new Date().toISOString(),
        success: true
      });

      res.status(200).json({
        success: true,
        message: 'Item availability updated successfully',
        itemId,
        isAvailable,
        companyId
      });
    } else {
      res.status(400).json({
        success: false,
        error: updateResult.error
      });
    }
  } catch (error) {
    console.error('Item availability update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function updateItemAvailabilityInDeliveryCompany(restaurantId, itemId, isAvailable, companyId) {
  try {
    // Make API call to delivery company to update item availability
    switch (companyId) {
      case 'uber_eats':
        return await updateUberEatsItemAvailability(restaurantId, itemId, isAvailable);
      case 'doordash':
        return await updateDoorDashItemAvailability(restaurantId, itemId, isAvailable);
      case 'grubhub':
        return await updateGrubHubItemAvailability(restaurantId, itemId, isAvailable);
      default:
        return { success: false, error: 'Unsupported delivery company' };
    }
  } catch (error) {
    console.error('Error updating item availability in delivery company:', error);
    return { success: false, error: error.message };
  }
}

async function updateUberEatsItemAvailability(restaurantId, itemId, isAvailable) {
  try {
    console.log(`Updating Uber Eats item ${itemId} availability to ${isAvailable}`);
    
    // In a real implementation:
    /*
    const response = await fetch(`https://api.uber.com/v1/eats/stores/${restaurantId}/menus/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_available: isAvailable
      })
    });
    */
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      message: `Item availability updated in Uber Eats`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateDoorDashItemAvailability(restaurantId, itemId, isAvailable) {
  try {
    console.log(`Updating DoorDash item ${itemId} availability to ${isAvailable}`);
    
    // Simulate DoorDash API call
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      success: true,
      message: `Item availability updated in DoorDash`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateGrubHubItemAvailability(restaurantId, itemId, isAvailable) {
  try {
    console.log(`Updating Grubhub item ${itemId} availability to ${isAvailable}`);
    
    // Simulate Grubhub API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      message: `Item availability updated in Grubhub`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
// Menu Synchronization API
// Syncs restaurant menu to delivery companies

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
    const { restaurantProfile, menu, companyId, userId } = req.body;

    if (!restaurantProfile || !menu || !companyId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['restaurantProfile', 'menu', 'companyId', 'userId']
      });
    }

    // Get delivery company configuration
    const deliveryCompany = await getDeliveryCompany(companyId);
    if (!deliveryCompany) {
      return res.status(404).json({ error: 'Delivery company not found' });
    }

    // Sync restaurant profile and menu
    const syncResult = await syncToDeliveryCompany(restaurantProfile, menu, deliveryCompany);

    if (syncResult.success) {
      // Update integration status
      await updateIntegrationStatus(userId, companyId, 'success');
      
      res.status(200).json({
        success: true,
        message: 'Menu synced successfully',
        syncId: syncResult.syncId,
        itemsCount: menu.length
      });
    } else {
      await updateIntegrationStatus(userId, companyId, 'failed', syncResult.error);
      
      res.status(400).json({
        success: false,
        error: syncResult.error
      });
    }
  } catch (error) {
    console.error('Menu sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function getDeliveryCompany(companyId) {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return mock delivery companies
    const companies = {
      'uber_eats': {
        id: 'uber_eats',
        name: 'Uber Eats',
        apiEndpoint: 'https://api.uber.com/v1/eats',
        authType: 'oauth',
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: true
        }
      },
      'doordash': {
        id: 'doordash',
        name: 'DoorDash',
        apiEndpoint: 'https://api.doordash.com/v1',
        authType: 'api_key',
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: false
        }
      },
      'grubhub': {
        id: 'grubhub',
        name: 'Grubhub',
        apiEndpoint: 'https://api.grubhub.com/v1',
        authType: 'basic',
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: true
        }
      }
    };

    return companies[companyId] || null;
  } catch (error) {
    console.error('Error getting delivery company:', error);
    return null;
  }
}

async function syncToDeliveryCompany(restaurantProfile, menu, deliveryCompany) {
  try {
    // This is where you would make actual API calls to delivery companies
    // For demonstration, we'll simulate the sync process
    
    console.log(`Syncing to ${deliveryCompany.name}:`, {
      restaurant: restaurantProfile.restaurantName,
      menuItems: menu.length,
      endpoint: deliveryCompany.apiEndpoint
    });

    // Simulate API call based on delivery company
    switch (deliveryCompany.id) {
      case 'uber_eats':
        return await syncToUberEats(restaurantProfile, menu);
      case 'doordash':
        return await syncToDoorDash(restaurantProfile, menu);
      case 'grubhub':
        return await syncToGrubHub(restaurantProfile, menu);
      default:
        return { success: false, error: 'Unsupported delivery company' };
    }
  } catch (error) {
    console.error('Error syncing to delivery company:', error);
    return { success: false, error: error.message };
  }
}

async function syncToUberEats(restaurantProfile, menu) {
  try {
    // Simulate Uber Eats API call
    console.log('Syncing to Uber Eats...');
    
    // In a real implementation:
    // 1. Authenticate with Uber Eats API
    // 2. Create/update restaurant profile
    // 3. Sync menu categories and items
    // 4. Handle any errors or validation issues
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    return {
      success: true,
      syncId: `uber_${Date.now()}`,
      message: 'Successfully synced to Uber Eats'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function syncToDoorDash(restaurantProfile, menu) {
  try {
    console.log('Syncing to DoorDash...');
    
    // Simulate DoorDash API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      syncId: `doordash_${Date.now()}`,
      message: 'Successfully synced to DoorDash'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function syncToGrubHub(restaurantProfile, menu) {
  try {
    console.log('Syncing to Grubhub...');
    
    // Simulate Grubhub API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      syncId: `grubhub_${Date.now()}`,
      message: 'Successfully synced to Grubhub'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateIntegrationStatus(userId, companyId, status, errorMessage = null) {
  try {
    const integrationQuery = await db.collection('deliveryIntegrations')
      .where('userId', '==', userId)
      .where('deliveryCompanyId', '==', companyId)
      .get();

    if (!integrationQuery.empty) {
      await integrationQuery.docs[0].ref.update({
        syncStatus: status,
        lastSync: new Date().toISOString(),
        errorMessage,
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating integration status:', error);
  }
}
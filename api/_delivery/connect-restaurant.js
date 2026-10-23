// Restaurant Connection API
// Handles initial restaurant registration with delivery companies

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
    const { restaurantProfile, credentials, companyId, integrationId } = req.body;

    if (!restaurantProfile || !companyId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['restaurantProfile', 'companyId']
      });
    }

    // Validate restaurant profile
    const validation = validateRestaurantProfile(restaurantProfile);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid restaurant profile',
        details: validation.errors
      });
    }

    // Connect to delivery company
    const connectionResult = await connectToDeliveryCompany(
      restaurantProfile, 
      credentials, 
      companyId
    );

    if (connectionResult.success) {
      // Store connection details
      await storeConnectionDetails(integrationId, connectionResult);
      
      res.status(200).json({
        success: true,
        message: 'Restaurant connected successfully',
        connectionId: connectionResult.connectionId,
        restaurantId: connectionResult.restaurantId
      });
    } else {
      res.status(400).json({
        success: false,
        error: connectionResult.error,
        details: connectionResult.details
      });
    }
  } catch (error) {
    console.error('Restaurant connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

function validateRestaurantProfile(profile) {
  const errors = [];
  
  // Required fields validation
  const requiredFields = [
    'restaurantName',
    'restaurantId',
    'legalBusinessName',
    'ownerName',
    'contactEmail',
    'contactPhone'
  ];
  
  requiredFields.forEach(field => {
    if (!profile[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Address validation
  if (!profile.address) {
    errors.push('Address information is required');
  } else {
    const requiredAddressFields = ['line1', 'city', 'state', 'postalCode', 'country'];
    requiredAddressFields.forEach(field => {
      if (!profile.address[field]) {
        errors.push(`Missing address field: ${field}`);
      }
    });

    // Validate coordinates
    if (typeof profile.address.latitude !== 'number' || typeof profile.address.longitude !== 'number') {
      errors.push('Valid latitude and longitude coordinates are required');
    }
  }

  // Operating hours validation
  if (!profile.operatingHours) {
    errors.push('Operating hours are required');
  }

  // Email validation
  if (profile.contactEmail && !isValidEmail(profile.contactEmail)) {
    errors.push('Invalid email address');
  }

  // Phone validation
  if (profile.contactPhone && !isValidPhone(profile.contactPhone)) {
    errors.push('Invalid phone number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

async function connectToDeliveryCompany(restaurantProfile, credentials, companyId) {
  try {
    // Simulate connection to different delivery companies
    switch (companyId) {
      case 'uber_eats':
        return await connectToUberEats(restaurantProfile, credentials);
      case 'doordash':
        return await connectToDoorDash(restaurantProfile, credentials);
      case 'grubhub':
        return await connectToGrubHub(restaurantProfile, credentials);
      default:
        return { success: false, error: 'Unsupported delivery company' };
    }
  } catch (error) {
    console.error('Error connecting to delivery company:', error);
    return { success: false, error: error.message };
  }
}

async function connectToUberEats(restaurantProfile, credentials) {
  try {
    console.log('Connecting to Uber Eats...');
    
    // Simulate Uber Eats restaurant registration
    const registrationData = {
      restaurant: {
        name: restaurantProfile.restaurantName,
        legal_name: restaurantProfile.legalBusinessName,
        contact: {
          name: restaurantProfile.ownerName,
          email: restaurantProfile.contactEmail,
          phone: restaurantProfile.contactPhone
        },
        address: {
          street_address: restaurantProfile.address.line1,
          street_address_2: restaurantProfile.address.line2,
          city: restaurantProfile.address.city,
          state: restaurantProfile.address.state,
          postal_code: restaurantProfile.address.postalCode,
          country: restaurantProfile.address.country,
          latitude: restaurantProfile.address.latitude,
          longitude: restaurantProfile.address.longitude
        },
        business_info: {
          registration_number: restaurantProfile.businessRegistrationNumber,
          tax_id: restaurantProfile.taxId,
          cuisine_types: restaurantProfile.cuisineTypes,
          average_prep_time: restaurantProfile.averagePrepTime
        },
        operating_hours: restaurantProfile.operatingHours,
        financial_info: restaurantProfile.financialDetails
      }
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful response
    return {
      success: true,
      connectionId: `uber_conn_${Date.now()}`,
      restaurantId: `uber_rest_${restaurantProfile.restaurantId}`,
      message: 'Successfully registered with Uber Eats',
      nextSteps: [
        'Complete menu upload',
        'Set delivery radius',
        'Configure pricing',
        'Go live'
      ]
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to connect to Uber Eats',
      details: error.message 
    };
  }
}

async function connectToDoorDash(restaurantProfile, credentials) {
  try {
    console.log('Connecting to DoorDash...');
    
    // Simulate DoorDash restaurant registration
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      connectionId: `doordash_conn_${Date.now()}`,
      restaurantId: `dd_rest_${restaurantProfile.restaurantId}`,
      message: 'Successfully registered with DoorDash'
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to connect to DoorDash',
      details: error.message 
    };
  }
}

async function connectToGrubHub(restaurantProfile, credentials) {
  try {
    console.log('Connecting to Grubhub...');
    
    // Simulate Grubhub restaurant registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      connectionId: `grubhub_conn_${Date.now()}`,
      restaurantId: `gh_rest_${restaurantProfile.restaurantId}`,
      message: 'Successfully registered with Grubhub'
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to connect to Grubhub',
      details: error.message 
    };
  }
}

async function storeConnectionDetails(integrationId, connectionResult) {
  try {
    if (!integrationId) return;
    
    // Store connection details in Firebase
    await db.collection('deliveryIntegrations').doc(integrationId).update({
      connectionId: connectionResult.connectionId,
      externalRestaurantId: connectionResult.restaurantId,
      syncStatus: 'success',
      lastSync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error storing connection details:', error);
  }
}
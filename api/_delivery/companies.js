// Delivery Companies API
// Returns available delivery companies and their configurations

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return available delivery companies
    const companies = [
      {
        id: 'uber_eats',
        name: 'Uber Eats',
        logo: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100',
        description: 'Connect with millions of customers through Uber Eats',
        commission: 15,
        features: [
          'Real-time order notifications',
          'Menu synchronization',
          'Customer reviews and ratings',
          'Marketing tools and promotions'
        ],
        requirements: [
          'Valid business license',
          'Food safety certification',
          'Bank account for payouts'
        ],
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: true
        },
        authType: 'oauth',
        setupSteps: [
          'Create Uber Eats partner account',
          'Complete restaurant verification',
          'Configure menu and pricing',
          'Set up payout information'
        ]
      },
      {
        id: 'doordash',
        name: 'DoorDash',
        logo: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100',
        description: 'Reach customers in your area with DoorDash delivery',
        commission: 18,
        features: [
          'DashPass customer base',
          'Advanced analytics dashboard',
          'Promotional campaigns',
          'Customer support integration'
        ],
        requirements: [
          'Business registration',
          'Health department permits',
          'Liability insurance'
        ],
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: false
        },
        authType: 'api_key',
        setupSteps: [
          'Register on DoorDash for Business',
          'Upload required documents',
          'Menu setup and photo upload',
          'Banking information setup'
        ]
      },
      {
        id: 'grubhub',
        name: 'Grubhub',
        logo: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100',
        description: 'Join the Grubhub network for food delivery',
        commission: 20,
        features: [
          'Grubhub+ loyalty program',
          'Order management tools',
          'Performance insights',
          'Marketing support'
        ],
        requirements: [
          'Restaurant license',
          'Food handler certification',
          'Commercial insurance'
        ],
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: true
        },
        authType: 'basic',
        setupSteps: [
          'Apply for Grubhub partnership',
          'Complete onboarding process',
          'Menu and pricing configuration',
          'Payment setup'
        ]
      },
      {
        id: 'postmates',
        name: 'Postmates (Uber)',
        logo: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100',
        description: 'Deliver through the Postmates network',
        commission: 16,
        features: [
          'Fleet delivery network',
          'Real-time tracking',
          'Customer communication',
          'Order analytics'
        ],
        requirements: [
          'Business verification',
          'Menu digitization',
          'Quality standards compliance'
        ],
        supportedFeatures: {
          menuSync: true,
          orderReceiving: true,
          statusUpdates: true,
          realTimeUpdates: true
        },
        authType: 'oauth',
        setupSteps: [
          'Partner application',
          'Restaurant verification',
          'Menu setup',
          'Go live'
        ]
      }
    ];

    res.status(200).json({
      success: true,
      companies,
      totalCompanies: companies.length
    });
  } catch (error) {
    console.error('Error fetching delivery companies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
# Multi-User Restaurant Menu Platform

A comprehensive, production-ready platform where restaurant owners can create and manage their own digital menus with advanced ordering capabilities and multi-department management.

## 🚀 Features Overview

### For Restaurant Owners (Admin Panel)
- **Complete User Management**: Secure authentication with role-based access
- **Advanced Menu Management**: Full CRUD operations with scheduling and availability control
- **Multi-Department System**: Kitchen, Bar, Cashier, and Admin departments with dedicated workflows
- **Real-time Order Management**: Live order tracking with status updates and notifications
- **Comprehensive Analytics**: Revenue tracking, popular items analysis, and customer insights
- **Automated Bill Generation**: Professional invoice creation with payment tracking
- **Telegram Integration**: Real-time notifications with interactive approve/reject buttons
- **Multi-table Support**: Handle unlimited tables with unique QR codes and URLs
- **Waiter Management**: Assign waiters to specific tables with notification routing
- **Professional Print Menus**: Generate high-quality PDF menus for physical display
- **QR Code Generation**: Bulk generate and download QR codes for all tables
- **Super Admin Dashboard**: Platform-wide management for multi-restaurant operations

### For Customers (Mobile-First Experience)
- **Responsive Design**: Optimized for smartphones, tablets, and desktop
- **Multi-language Support**: English and Amharic with easy language switching
- **Telegram Integration**: Login with Telegram for personalized experience
- **Smart Menu Scheduling**: Time-based menu availability (breakfast, lunch, dinner)
- **Order Management**: Dine-in or takeaway options with real-time cart management
- **Payment Integration**: Upload payment screenshots with approval workflow
- **Real-time Updates**: Live menu availability and pricing updates
- **Waiter Call System**: One-tap waiter assistance with notification routing
- **Bill Viewing**: Real-time table bill tracking and payment options
- **Feedback System**: Rate and review orders with analytics integration
- **About Us Integration**: View restaurant information, hours, and contact details

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive, modern styling
- **React Router DOM** for client-side routing
- **Lucide React** for consistent iconography
- **React Hook Form** for form management
- **Recharts** for analytics visualization
- **HTML2Canvas & jsPDF** for bill generation and printing

### Backend & Database
- **Firebase** (Firestore, Auth, Storage) for real-time data management
- **Vercel Serverless Functions** for API endpoints
- **Firebase Admin SDK** for server-side operations

### Integrations
- **Telegram Bot API** with inline keyboards and webhooks
- **ImgBB API** for image hosting and management
- **QR Code Generation** for table identification

### Development & Deployment
- **Vite** for fast development and building
- **TypeScript** for enhanced developer experience
- **ESLint** for code quality
- **Vercel** for deployment and hosting

## 📋 Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Firebase account
- Telegram Bot (optional but recommended)
- Vercel account for deployment

### 2. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Create Firestore database in production mode
4. Enable Storage for image uploads
5. Get your Firebase configuration from Project Settings

### 3. Telegram Bot Setup (Optional)
1. Create a bot with @BotFather on Telegram
2. Get your bot token and username
3. Set up webhook URL: `https://your-domain.vercel.app/api/telegram-webhook`
4. Configure department chat IDs in the admin panel

### 4. Environment Variables
Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-side Firebase (for API functions)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
```

### 5. Install Dependencies
```bash
npm install
```

### 6. Development
```bash
npm run dev
```

### 7. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Configure Telegram webhook: `https://your-domain.vercel.app/api/telegram-webhook`

## 🔧 Integration Guides

The platform focuses on Telegram-based notifications and manual order management for simplicity and reliability.

## 📊 Database Structure

### Core Collections
- **`users`** - Restaurant owner profiles and settings
- **`menuItems`** - Menu items with scheduling and availability
- **`categories`** - Menu categories with ordering and icons
- **`menuSchedules`** - Time-based menu availability (breakfast, lunch, dinner)
- **`departments`** - Kitchen, Bar, Cashier, Admin departments with Telegram integration
- **`waiterAssignments`** - Table assignments and waiter management
- **`orders`** - Customer orders with full lifecycle tracking
- **`pendingOrders`** - Orders awaiting approval
- **`tableBills`** - Active table bills and payment tracking
- **`paymentConfirmations`** - Payment screenshot approvals
- **`bills`** - Generated invoices and billing records
- **`waiterCalls`** - Waiter assistance requests
- **`dayReports`** - Daily closing reports with analytics


## 🔐 Security Features

### Authentication & Authorization
- **Firebase Authentication** with email/password
- **Role-based Access Control** (Restaurant Owner, Super Admin)
- **User-specific Data Isolation** - Each restaurant's data is completely separate
- **Secure API Endpoints** with authentication middleware

### Data Protection
- **Input Validation** and sanitization on all forms
- **Secure File Uploads** with type and size restrictions
- **Environment Variable Protection** for sensitive credentials
- **HTTPS Enforcement** for all communications

### Telegram Security
- **Webhook Verification** for authentic Telegram requests
- **Chat ID Validation** to prevent unauthorized access
- **Secure Deep Links** with session management

## 🌐 API Documentation

### Customer Menu API
- **GET** `/menu/{userId}/table/{tableNumber}` - Access restaurant menu
- **GET** `/{businessSlug}/table/{tableNumber}` - Business-friendly URLs

### Admin API Endpoints
- **POST** `/api/telegram-webhook` - Telegram bot webhook handler
- **GET** `/api/webhook-info` - Telegram webhook status
- **POST** `/api/setup-webhook` - Configure Telegram webhook

## 📱 Usage Guide

### For Restaurant Owners

#### Initial Setup
1. **Register** at `/register` with business details
2. **Login** at `/login` to access admin panel
3. **Configure Departments** in Department Management
4. **Set up Telegram** integration for notifications
5. **Add Menu Categories** and organize your menu structure
6. **Create Menu Items** with photos, descriptions, and pricing
7. **Generate QR Codes** for your tables

#### Daily Operations
1. **Monitor Dashboard** for real-time metrics and pending actions
2. **Manage Orders** through the centralized order management system
3. **Handle Payments** via the payment confirmation workflow
4. **Track Analytics** to understand customer preferences and revenue
5. **Close Day** with automated reporting to admin

#### Advanced Features
- **Menu Scheduling**: Set different menus for breakfast, lunch, dinner
- **Waiter Management**: Assign specific waiters to table ranges
- **Print Materials**: Generate professional menus and table tents

### For Customers

#### Accessing the Menu
1. **Scan QR Code** at your table or use the provided URL
2. **Choose Language** (English/Amharic) and order type
3. **Browse Menu** with real-time availability and scheduling
4. **Add Items** to cart with quantity selection

#### Placing Orders
1. **Review Cart** and modify quantities as needed
2. **Place Order** for kitchen preparation (pay later)
3. **Or Pay Immediately** with screenshot upload for instant processing
4. **Track Status** through real-time updates

#### Additional Services
- **Call Waiter** for assistance with one-tap button
- **View Bill** to see current table charges
- **Provide Feedback** after order completion
- **Learn About Restaurant** through integrated business information

## 🔧 Customization Options

### Menu Themes
- **Classic**: Traditional restaurant menu styling
- **Modern**: Contemporary design with bold colors
- **Elegant**: Sophisticated layout for upscale dining
- **Minimal**: Clean, simple design for fast-casual

### Business Branding
- **Custom Logo**: Upload and display your restaurant logo
- **Color Schemes**: Customize primary and accent colors
- **Business Information**: Comprehensive about us section
- **Social Media Integration**: Link all your social platforms

### Operational Settings
- **Multi-language Support**: English and Amharic built-in
- **Currency Options**: USD, EUR, GBP, ETB support
- **Tax Configuration**: Customizable tax rates and service charges
- **Table Management**: Configure any number of tables
- **Operating Hours**: Set detailed hours for each day

## 🚀 Advanced Features

### Telegram Deep Links
Generate special Telegram links that open directly in your bot:
```
https://t.me/YourBot?start={userId}_{tableNumber}
```

### Business-Friendly URLs
Clean URLs using your business name:
```
https://yourdomain.com/restaurant-name/table/1
```

### Menu Scheduling
Create time-based menus:
- **Breakfast Menu**: 6:00 AM - 11:00 AM
- **Lunch Menu**: 11:00 AM - 4:00 PM  
- **Dinner Menu**: 4:00 PM - 10:00 PM
- **Late Night Menu**: 10:00 PM - 2:00 AM

### Multi-Department Workflow
1. **Customer Orders** → **Cashier Approval** → **Kitchen/Bar Preparation** → **Service**
2. **Payment Confirmations** → **Cashier Verification** → **Bill Settlement**
3. **Waiter Calls** → **Assigned Waiter Notification** → **Service Response**

### Analytics & Reporting
- **Real-time Dashboard**: Live metrics and KPIs
- **Revenue Tracking**: Daily, weekly, monthly reports
- **Popular Items Analysis**: Data-driven menu optimization
- **Table Performance**: Identify high-performing tables
- **Customer Insights**: Order patterns and preferences
- **Department Analytics**: Kitchen efficiency and service metrics

## 🔌 Integration Capabilities

The platform integrates seamlessly with your existing restaurant operations through Telegram notifications and QR code-based ordering.

## 📱 Mobile App Features

### Progressive Web App (PWA)
- **Offline Capability**: Basic functionality works without internet
- **App-like Experience**: Install on mobile home screen
- **Push Notifications**: Real-time alerts for restaurant staff
- **Background Sync**: Queue actions when offline

### Telegram Integration
- **Bot Authentication**: Secure login through Telegram
- **Deep Link Support**: Direct table access through bot
- **Real-time Notifications**: Instant order and payment alerts
- **Interactive Buttons**: Approve/reject actions directly in Telegram
- **Multi-chat Support**: Different chats for different departments

## 🏗 Architecture Overview

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   └── ...             # Customer-facing components
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

### Backend Architecture
```
api/
├── delivery/           # Delivery platform integration endpoints
│   ├── companies.js    # Available delivery companies
│   ├── connect-restaurant.js  # Restaurant registration
│   ├── sync-menu.js    # Menu synchronization
│   ├── webhook.js      # Incoming order webhooks
│   └── ...             # Additional delivery endpoints
├── pos-integration.js  # POS system integration
├── telegram-webhook.js # Telegram bot webhook handler
└── ...                 # Additional API endpoints
```

### Database Schema
```
Firestore Collections:
├── users               # Restaurant owners
├── menuItems          # Menu items with scheduling
├── categories         # Menu categories
├── menuSchedules      # Time-based availability
├── departments        # Kitchen, Bar, Cashier, Admin
├── waiterAssignments  # Table-waiter mapping
├── orders             # All customer orders
├── pendingOrders      # Orders awaiting approval
├── tableBills         # Active table bills
├── paymentConfirmations # Payment screenshot approvals
├── bills              # Generated invoices
├── waiterCalls        # Waiter assistance requests
├── dayReports         # Daily closing reports
```

## 🚀 Deployment Guide

### Vercel Deployment
1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Environment Variables**: Add all required env vars in Vercel dashboard
3. **Deploy**: Automatic deployment on push to main branch
4. **Configure Webhooks**: Set up Telegram and delivery platform webhooks

### Post-Deployment Setup
1. **Telegram Webhook**: Configure webhook URL in bot settings
2. **DNS Configuration**: Set up custom domain if desired

## 🔧 Configuration Examples

### Telegram Bot Configuration
```javascript
// Set webhook URL
https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url=https://your-domain.vercel.app/api/telegram-webhook

// Test webhook
curl -X POST https://your-domain.vercel.app/api/test-message \
  -H "Content-Type: application/json" \
  -d '{"chatId": "YOUR_CHAT_ID", "message": "Test message"}'
```

## 📈 Analytics & Reporting

### Real-time Metrics
- **Revenue Tracking**: Live revenue updates and trends
- **Order Analytics**: Order volume, average order value, peak times
- **Menu Performance**: Most popular items, category analysis
- **Table Analytics**: Table turnover, occupancy rates
- **Customer Insights**: Repeat customers, order patterns

### Automated Reports
- **Daily Reports**: Automatically generated and sent via Telegram
- **Weekly Summaries**: Performance trends and insights
- **Monthly Analytics**: Comprehensive business intelligence
- **Custom Reports**: Export data for external analysis

### Department Analytics
- **Kitchen Performance**: Preparation times, order volume
- **Service Metrics**: Waiter response times, customer satisfaction
- **Payment Analytics**: Payment method preferences, approval rates
- **Operational Efficiency**: Peak hours, staff utilization

## 🛡 Security & Compliance

### Data Security
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions and data isolation
- **Audit Logging**: Complete audit trail for all actions
- **Backup Strategy**: Automated backups with point-in-time recovery

### Compliance Features
- **GDPR Compliance**: Data privacy and user rights management
- **PCI DSS**: Secure payment data handling
- **Food Safety**: Allergen tracking and ingredient management
- **Business Compliance**: Tax reporting and financial record keeping

## 🚨 Troubleshooting

### Common Issues

#### Telegram Integration
- **Webhook Not Working**: Check bot token and webhook URL configuration
- **Messages Not Sending**: Verify chat IDs and bot permissions
- **Deep Links Failing**: Ensure bot username is correctly configured

#### Firebase Issues
- **Authentication Errors**: Check Firebase config and API keys
- **Database Permissions**: Verify Firestore security rules
- **Storage Upload Fails**: Check storage bucket configuration

#### Integration Problems
- **Delivery Orders Not Received**: Check webhook configuration and endpoints
- **Menu Not Syncing**: Validate menu data format and API responses

### Debug Tools
- **Webhook Info**: `/api/webhook-info` - Check Telegram webhook status
- **Test Messages**: Use admin panel to test Telegram connectivity
- **Error Logs**: Check Vercel function logs for detailed error information

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Code Standards
- **TypeScript**: Use strict typing for all new code
- **ESLint**: Follow the established linting rules
- **Component Structure**: Keep components focused and reusable
- **API Design**: Follow RESTful principles for new endpoints
- **Testing**: Add tests for critical functionality

### Feature Requests
- **GitHub Issues**: Use issue templates for bug reports and features
- **Documentation**: Update README for any new features
- **Backward Compatibility**: Ensure changes don't break existing functionality

## 📞 Support & Resources

### Documentation
- **API Reference**: Detailed API documentation in `/docs/api`
- **Component Library**: UI component documentation
- **Integration Guides**: Step-by-step integration tutorials
- **Best Practices**: Recommended patterns and practices

### Community
- **GitHub Discussions**: Community support and feature discussions
- **Issue Tracker**: Bug reports and feature requests
- **Wiki**: Additional documentation and tutorials

### Professional Support
- **Custom Development**: Available for custom features and integrations
- **Deployment Assistance**: Help with complex deployment scenarios
- **Training**: Staff training for restaurant operations
- **Maintenance**: Ongoing support and updates

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Firebase**: For providing excellent backend-as-a-service
- **Vercel**: For seamless deployment and hosting
- **Telegram**: For powerful bot API and messaging platform
- **React Community**: For amazing tools and libraries
- **Contributors**: All developers who have contributed to this project

---

**Built with ❤️ for the restaurant industry**

*Empowering restaurants with modern technology for better customer experiences and operational efficiency.*
# Call Karigar Backend Server

A comprehensive backend API for the Call Karigar platform - a service booking marketplace that connects customers with professional service providers. Built with Node.js, Express, and MongoDB.

## Features

### Core Functionality
- **Multi-role Authentication**: Support for customers, workers, and admins
- **Service Booking System**: Complete booking lifecycle management
- **Payment Integration**: Razorpay integration for secure payments
- **Real-time Notifications**: Socket.io for real-time updates
- **File Upload**: Cloudinary integration for image/document uploads
- **OTP Verification**: Email and SMS OTP for account verification
- **Review & Rating System**: Customer feedback and ratings
- **Coupon System**: Discount codes and promotional offers
- **Support Tickets**: Customer support system

### User Management
- **Customer Profiles**: Complete customer management
- **Worker Profiles**: Worker registration, verification, and service offerings
- **Admin Dashboard**: Administrative controls and oversight
- **Address Management**: Multiple address support for customers

### Services & Categories
- **Service Categories**: Organized service categories (Plumbing, Electrical, AC Repair, etc.)
- **Worker Services**: Individual service offerings by workers
- **Availability Management**: Time slot booking system

## Tech Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

### External Services
- **Razorpay** - Payment gateway
- **Cloudinary** - Media storage and optimization
- **Nodemailer** - Email service
- **Socket.io** - Real-time communication

### Development Tools
- **Nodemon** - Development server auto-restart
- **Express Validator** - Input validation
- **UUID** - Unique identifier generation
- **Multer** - File upload handling

## Project Structure

```
call-kaarigar-server/
├── api/
│   └── index.js                 # Vercel API entry point
├── config/
│   └── db.js                    # Database connection
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   ├── errorHandler.js          # Error handling
│   ├── fileUpload.js            # File upload middleware
│   ├── rateLimiter.js           # Rate limiting
│   └── validation.js            # Input validation
├── modules/                     # Feature modules
│   ├── address/                 # Address management
│   │   ├── address.controller.js
│   │   ├── address.model.js
│   │   └── address.routes.js
│   ├── auth/                    # Authentication
│   │   ├── auth.controller.js
│   │   ├── auth.model.js
│   │   └── auth.routes.js
│   ├── booking/                 # Service bookings
│   │   ├── booking.controller.js
│   │   ├── booking.model.js
│   │   ├── booking.routes.js
│   │   ├── booking.service.js
│   │   └── booking.service.updateStatus.js
│   ├── content/                 # Content management
│   ├── coupon/                  # Coupon system
│   ├── notifications/           # Push notifications
│   ├── otp/                     # OTP verification
│   ├── payment/                 # Payment processing
│   ├── review/                  # Reviews & ratings
│   ├── reward/                  # Reward system
│   ├── serviceCategories/       # Service categories
│   ├── supportTicket/           # Support tickets
│   ├── systemSettings/          # System configuration
│   └── user/                    # User management
│       ├── user.controller.js
│       ├── user.model.js
│       ├── user.routes.js
│       ├── admin/               # Admin specific features
│       ├── customer/            # Customer profiles
│       └── worker/              # Worker profiles & services
├── public/                      # Static files
│   ├── admin/                   # Admin dashboard
│   ├── customer/                # Customer dashboard
│   ├── worker/                  # Worker dashboard
│   ├── js/                      # Client-side scripts
│   ├── templates/               # HTML templates
│   └── uploads/                 # File uploads
├── services/                    # Business logic services
│   ├── emailService.js          # Email notifications
│   ├── notificationService.js   # Push notifications
│   ├── socketService.js         # Real-time communication
│   ├── booking/
│   │   └── availabilityService.js
│   └── payment/
│       └── paymentService.js
├── utils/                       # Utility functions
│   ├── cloudinary.js            # Cloudinary configuration
│   └── helpers/
│       ├── dateHelper.js
│       └── priceHelper.js
├── app.js                       # Express app configuration
├── server.js                    # Server entry point
├── package.json                 # Dependencies & scripts
├── vercel.json                  # Vercel deployment config
├── render.yaml                  # Render deployment config
└── README.md                    # Project documentation
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/dheer152004/Call-Karigar-Backend.git
cd call-kaarigar-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/callkaarigar

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Service (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Payment)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# OTP Configuration
OTP_EXPIRE_MINUTES=5
```

### 4. Database Setup
The application will automatically connect to MongoDB using the provided MONGO_URI. Make sure your MongoDB instance is running and accessible.

### 5. Run the Application

#### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:5000` with auto-restart on file changes.

#### Production Mode
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### OTP Verification
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

### User Management
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Service Categories
- `GET /api/service-categories` - Get all categories
- `POST /api/service-categories` - Create category (Admin)
- `PUT /api/service-categories/:id` - Update category
- `DELETE /api/service-categories/:id` - Delete category

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking status
- `GET /api/bookings/:id` - Get booking details

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:bookingId` - Get payment details

### Reviews
- `GET /api/reviews/:workerId` - Get worker reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Coupons
- `GET /api/coupons` - Get available coupons
- `POST /api/coupons` - Create coupon (Admin)
- `PUT /api/coupons/:id` - Update coupon

### Support Tickets
- `GET /api/support-tickets` - Get user tickets
- `POST /api/support-tickets` - Create support ticket
- `PUT /api/support-tickets/:id` - Update ticket status

### Worker Documents
- `POST /api/worker-documents` - Upload worker documents (Worker)
- `GET /api/worker-documents` - Get current user's documents (Worker/Admin)
- `GET /api/worker-documents/worker/:workerId` - Get worker documents by worker ID (Admin)
- `GET /api/worker-documents/:id` - Get document by document ID (Worker/Admin)
- `PUT /api/worker-documents/:id` - Update document status or documents (Worker/Admin)
- `PATCH /api/worker-documents/:id/verify` - Verify/reject worker documents (Admin)
- `DELETE /api/worker-documents/:id` - Delete document (Worker/Admin)

## User Roles & Permissions

### Customer
- Register and manage profile
- Browse services and workers
- Book services
- Make payments
- Leave reviews
- View booking history
- Create support tickets

### Worker
- Register and complete profile
- Add/update services offered
- Manage availability
- Accept/reject bookings
- Update booking status
- View earnings
- Respond to reviews

### Admin
- Full system access
- User management
- Service category management
- Coupon management
- System settings
- Worker verification
- Support ticket management
- Analytics and reporting

## Deployment

### Vercel Deployment
The application is configured for Vercel deployment:
- API routes are handled through `/api/index.js`
- Static files served from `/public`
- Environment variables configured in Vercel dashboard

### Render Deployment
Alternative deployment configuration available in `render.yaml`:
- Web service configuration
- Build and start commands
- Health check endpoint

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (if implemented)

### Code Style
- Modular architecture with separation of concerns
- MVC pattern implementation
- Consistent error handling
- Input validation using express-validator
- Security best practices with helmet and rate limiting

### Database Models
- User (Customer, Worker, Admin)
- ServiceCategory
- WorkerService
- Booking
- Payment
- Review
- Address
- Notification
- Coupon
- SupportTicket
- OTP

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@callkarigar.com or create an issue in the GitHub repository.

## Acknowledgments

- Built with Express.js framework
- Payment processing by Razorpay
- Media storage by Cloudinary
- Real-time features powered by Socket.io
      └── payment.service.js
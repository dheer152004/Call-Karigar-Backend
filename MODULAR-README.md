# Call Kaarigar Server

## Project Structure

The project is organized using a modular architecture pattern. Each module is a self-contained unit that includes its own:

- Models (data schemas)
- Controllers (request handlers)
- Routes (API endpoints)
- Services (business logic)

### Module Structure

```
modules/
  ├── auth/
  │   ├── auth.controller.js
  │   ├── auth.model.js
  │   ├── auth.routes.js
  │   └── auth.service.js
  ├── booking/
  │   ├── booking.controller.js
  │   ├── booking.model.js
  │   ├── booking.routes.js
  │   └── booking.service.js
  └── payment/
      ├── payment.controller.js
      ├── payment.model.js
      ├── payment.routes.js
      └── payment.service.js
```

### Module Description

1. **Auth Module**
   - Handles user authentication and verification
   - Manages OTP generation and validation
   - Handles email and phone verification

2. **Booking Module**
   - Manages service bookings
   - Handles booking status updates
   - Processes booking notifications

3. **Payment Module**
   - Processes payments using Razorpay
   - Handles refunds
   - Manages payment status updates

### API Routes

#### Auth Module
- `POST /api/auth/send` - Send OTP
- `POST /api/auth/verify` - Verify OTP
- `POST /api/auth/resend` - Resend OTP

#### Booking Module
- `POST /api/bookings` - Create booking
- `GET /api/bookings/all` - Get all bookings (Admin)
- `GET /api/bookings/customer` - Get customer bookings
- `GET /api/bookings/worker` - Get worker bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

#### Payment Module
- `POST /api/payments` - Create payment
- `GET /api/payments/all` - Get all payments (Admin)
- `GET /api/payments/customer` - Get customer payments
- `GET /api/payments/worker` - Get worker payments
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments/:id/status` - Get payment status
- `PUT /api/payments/:id` - Update payment
- `POST /api/payments/:id/refund` - Initiate refund

### Legacy Code
The remaining features are currently in the legacy structure and will be gradually migrated to the modular pattern:

- User Management
- Service Management
- Worker Services
- Customer/Worker Profiles
- Reviews
- Notifications



routes
// Import routes from modules
// const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const otpRoutes = require('./modules/otp/otp.routes');

const notificationRoutes = require('./modules/notifications/notification.routes');

const serviceCategoryRoutes = require('./modules/serviceCategories/serviceCategory.routes');
const serviceRoutes = require('./modules/serviceCategories/servicess/service.routes');

const addressRoutes = require('./modules/address/address.routes');

const customerProfileRoutes = require('./modules/user/customer/customerProfile.routes');
const workerProfileRoutes = require('./modules/user/worker/workerProfile/workerProfile.routes');
const workerServiceRoutes = require('./modules/user/worker/workerService/workerService.routes');

const bookingRoutes = require('./modules/booking/booking.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const reviewRoutes = require('./modules/review/review.routes');

// Register API routes
// app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);

app.use('/api/addresses', addressRoutes);

app.use('/api/customer-profiles', customerProfileRoutes);
app.use('/api/worker-profiles', workerProfileRoutes);
app.use('/api/worker-documents', workerDocumentRoutes);
app.use('/api/worker-services', workerServiceRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);


const routes = {
  '/api/users': '../routes/userRoutes',
  'api/otp': '../routes/otpRoutes',

  '/api/notifications': '../routes/notificationRoutes',

  '/api/service-categories': '../routes/categoryRoutes',
  '/api/services': '../routes/serviceRoutes',

  '/api/addresses': '../routes/addressRoutes',

  '/api/customer-profile': '../routes/customerProfileRoutes',

  '/api/worker-profile': '../routes/workerProfileRoutes',
  '/api/worker-documents': '../routes/workerDocumentRoutes',
  '/api/worker-services': '../routes/workerServiceRoutes',

  '/api/bookings': '../routes/bookingRoutes',
  '/api/payments': '../routes/paymentRoutes',
  '/api/reviews': '../routes/reviewRoutes',
};
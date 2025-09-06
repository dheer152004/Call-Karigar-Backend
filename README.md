# call-kaarigar-server
Backend services for the Call Karigar platform — managing user authentication, service provider listings, bookings, and admin controls. Built with Nodejs, Express, MongoDB, this API supports both user and admin interfaces.

## Getting Started

### 1. Clone the Repository
`git clone https://github.com/dheer152004/Call-Karigar-Backend.git
cd call-kaarigar-server`

### 2. Install Dependencies
`npm install`

### 3. Environment Setup
#### Create a .env file in the root directory:
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/callkaarigar

### 4. Run the Server
`npm run dev`




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
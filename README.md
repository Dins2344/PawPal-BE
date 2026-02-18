# PawPal Backend

PawPal is a pet adoption management system backend built with Node.js, Express, and MongoDB. It provides RESTful APIs for user authentication, pet browsing, adoption request management, and administrative operations including pet CRUD and adoption workflow processing with email notifications.


## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Public Pet Endpoints](#public-pet-endpoints)
  - [User Endpoints (Protected)](#user-endpoints-protected)
  - [Admin Endpoints (Protected, Admin Only)](#admin-endpoints-protected-admin-only)
- [Authentication and Authorization](#authentication-and-authorization)
- [Image Upload (Cloudinary)](#image-upload-cloudinary)
- [Email Notifications (EmailJS)](#email-notifications-emailjs)
- [Logging](#logging)
- [Data Models](#data-models)
  - [User](#user)
  - [Pet](#pet)
  - [Adoption](#adoption)
- [Adoption Workflow](#adoption-workflow)
- [Error Handling](#error-handling)


## Features

- User registration and login with JWT-based authentication
- Role-based access control (user and admin roles)
- Public pet browsing with search, species, breed, and age filters
- Unique breed listing for frontend filter dropdowns
- Adoption request submission by authenticated users
- Admin dashboard APIs for managing pets and adoption requests
- Pet CRUD operations with image upload to Cloudinary
- Adoption approval and rejection with automatic pet status updates
- Email notifications to users on adoption approval or rejection via EmailJS
- Structured logging with Winston and HTTP request logging with Morgan
- Automatic server restart during development with Nodemon


## Tech Stack

| Category            | Technology                          |
|---------------------|-------------------------------------|
| Runtime             | Node.js                             |
| Framework           | Express 5                           |
| Database            | MongoDB (via Mongoose 9)            |
| Authentication      | JSON Web Tokens (jsonwebtoken)      |
| Password Hashing    | bcryptjs                            |
| Image Storage       | Cloudinary                          |
| File Upload Parsing | Multer (memory storage)             |
| Email Notifications | EmailJS (@emailjs/nodejs)           |
| Logging             | Winston + Morgan                    |
| Dev Server          | Nodemon                             |
| Environment Config  | dotenv                              |
| CORS                | cors                                |


## Project Structure

```
PawPal-BE/
  index.js                          # Application entry point
  package.json
  nodemon.json                      # Nodemon configuration
  .env                              # Environment variables (not committed)
  .gitignore
  src/
    controllers/
      authController.js             # Register, login, get current user
      petController.js              # Public pet listing and detail
      userController.js             # Adoption submission and withdrawal
      adminController.js            # Pet CRUD, adoption approve/reject
    db/
      connection.js                 # MongoDB connection setup
    middlewares/
      auth.js                       # JWT authentication middleware
      adminOnly.js                  # Admin role authorization middleware
      upload.js                     # Multer config (memory storage)
    models/
      User.js                       # User schema and model
      Pet.js                        # Pet schema and model
      Adoption.js                   # Adoption schema and model
    routes/
      auth.js                       # Authentication routes
      pet.js                        # Public pet routes
      user.js                       # User action routes
      admin.js                      # Admin management routes
    utils/
      logger.js                     # Winston logger configuration
      cloudinary.js                 # Cloudinary upload/delete helpers
      emailService.js               # EmailJS notification service
  logs/                             # Log files (auto-generated, gitignored)
```


## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB Atlas account or a local MongoDB instance
- Cloudinary account (for image uploads)
- EmailJS account (for email notifications)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd PawPal-BE
```

2. Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/paw-pal?appName=Cluster0
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
LOG_LEVEL=debug
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

| Variable                  | Description                                              |
|---------------------------|----------------------------------------------------------|
| PORT                      | Server port (default: 3000)                              |
| MONGO_URI                 | MongoDB connection string with database name             |
| JWT_SECRET                | Secret key used to sign and verify JWT tokens            |
| JWT_EXPIRES_IN            | Token expiration duration (e.g., 7d, 24h)                |
| LOG_LEVEL                 | Winston log level (debug, info, warn, error)             |
| CLOUDINARY_CLOUD_NAME     | Cloudinary account cloud name                            |
| CLOUDINARY_API_KEY        | Cloudinary API key                                       |
| CLOUDINARY_API_SECRET     | Cloudinary API secret                                    |
| EMAILJS_SERVICE_ID        | EmailJS email service identifier                         |
| EMAILJS_TEMPLATE_ID       | EmailJS email template identifier                        |
| EMAILJS_PUBLIC_KEY        | EmailJS account public key                               |
| EMAILJS_PRIVATE_KEY       | EmailJS account private key (for server-side usage)      |

### Running the Server

Development mode (with auto-restart on file changes):

```bash
npm run dev
```

Production mode:

```bash
npm start
```


## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint            | Auth       | Description                          |
|--------|---------------------|------------|--------------------------------------|
| POST   | /api/auth/register  | Public     | Register a new user                  |
| POST   | /api/auth/login     | Public     | Login and receive a JWT token        |
| GET    | /api/auth/me        | Protected  | Get the current authenticated user   |

**POST /api/auth/register**

Request body:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "yourpassword"
}
```

Response:

```json
{
  "token": "jwt_token_string",
  "user": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "user"
  }
}
```

**POST /api/auth/login**

Request body:

```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

Response: Same structure as register.

---

### Public Pet Endpoints

| Method | Endpoint            | Auth    | Description                                   |
|--------|---------------------|---------|-----------------------------------------------|
| GET    | /api/pets           | Public  | Get all available pets (with optional filters) |
| GET    | /api/pets/breeds    | Public  | Get unique list of all pet breeds              |
| GET    | /api/pets/:id       | Public  | Get a single pet by ID                         |

**GET /api/pets**

Query parameters (all optional):

| Parameter | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| search    | string | Search by pet name, breed, or description            |
| species   | string | Filter by species (Dog, Cat, Bird, Rabbit, Fish, Other) |
| breed     | string | Filter by breed (case-insensitive partial match)     |
| age       | number | Filter by exact age                                  |

Pets with status "adopted" are excluded from results.

Example: `GET /api/pets?species=Dog&age=3`

**GET /api/pets/breeds**

Returns a JSON array of unique breed strings:

```json
["Labrador", "Persian", "Golden Retriever", "Siamese"]
```

---

### User Endpoints (Protected)

All user endpoints require a valid JWT token.

| Method | Endpoint                        | Auth      | Description                         |
|--------|---------------------------------|-----------|-------------------------------------|
| POST   | /api/users/adopt                | Protected | Submit an adoption request          |
| GET    | /api/users/adoptions            | Protected | Get all adoption requests by user   |
| DELETE | /api/users/adoptions/:adoptionId | Protected | Withdraw a pending adoption request |

**POST /api/users/adopt**

Request body:

```json
{
  "petId": "pet_object_id"
}
```

Behavior:
- Validates the pet exists and is not already adopted
- Prevents duplicate pending/approved requests for the same pet by the same user
- Creates the adoption record with status "pending"
- Sets the pet status to "pending"

**DELETE /api/users/adoptions/:adoptionId**

Behavior:
- Only the user who created the adoption can withdraw it
- Cannot withdraw an approved adoption
- If the adoption is pending, the pet status is reverted to "available"
- The adoption record is deleted

---

### Admin Endpoints (Protected, Admin Only)

All admin endpoints require a valid JWT token from a user with the "admin" role.

#### Pet Management

| Method | Endpoint               | Auth        | Description              |
|--------|------------------------|-------------|--------------------------|
| POST   | /api/admin/pets        | Admin Only  | Add a new pet            |
| GET    | /api/admin/pets        | Admin Only  | Get all pets             |
| PUT    | /api/admin/pets/:petId | Admin Only  | Update an existing pet   |
| DELETE | /api/admin/pets/:petId | Admin Only  | Delete a pet             |

**POST /api/admin/pets**

Content-Type: multipart/form-data

| Field       | Type   | Required | Description                                       |
|-------------|--------|----------|---------------------------------------------------|
| name        | string | Yes      | Pet name                                           |
| breed       | string | Yes      | Pet breed                                          |
| age         | number | Yes      | Pet age in years                                   |
| species     | string | Yes      | Dog, Cat, Bird, Rabbit, Fish, or Other             |
| gender      | string | Yes      | Male or Female                                     |
| description | string | No       | Description of the pet                             |
| image       | file   | No       | Pet image (JPEG, PNG, or WebP, max 5MB)            |

The image is uploaded to Cloudinary. The response includes the full pet object with the Cloudinary image URL.

**PUT /api/admin/pets/:petId**

Content-Type: multipart/form-data

Accepts the same fields as POST. All fields are optional. If a new image is uploaded, the previous image is deleted from Cloudinary before the new one is stored.

**DELETE /api/admin/pets/:petId**

Deletes the pet record, its image from Cloudinary, and all associated adoption records.

#### Adoption Management

| Method | Endpoint                                      | Auth        | Description               |
|--------|-----------------------------------------------|-------------|---------------------------|
| GET    | /api/admin/adoptions                          | Admin Only  | Get all adoption requests |
| PUT    | /api/admin/adoptions/:adoptionId/approve      | Admin Only  | Approve an adoption       |
| PUT    | /api/admin/adoptions/:adoptionId/reject       | Admin Only  | Reject an adoption        |

**GET /api/admin/adoptions**

Returns all adoption requests with populated user (fullName, email, phone) and pet (name, breed, image) details, sorted by most recent first.

**PUT /api/admin/adoptions/:adoptionId/approve**

- Sets adoption status to "approved" and records the approval timestamp
- Updates the pet status to "adopted"
- Sends an approval notification email to the user via EmailJS

**PUT /api/admin/adoptions/:adoptionId/reject**

- Sets adoption status to "rejected"
- Reverts the pet status to "available"
- Sends a rejection notification email to the user via EmailJS


## Authentication and Authorization

The application uses a two-layer middleware approach:

1. **protect** (src/middlewares/auth.js) -- Extracts and verifies the JWT token from the Authorization header. Attaches the authenticated user object to `req.user`. Returns 401 if the token is missing or invalid.

2. **adminOnly** (src/middlewares/adminOnly.js) -- Checks that the authenticated user has the "admin" role. Applied after the protect middleware. Returns 403 if the user is not an admin.

Admin routes apply both middlewares globally using `router.use(protect, adminOnly)`, so every route in the admin router is automatically protected.


## Image Upload (Cloudinary)

Pet images are handled through the following pipeline:

1. Multer middleware (memory storage) receives the file upload and stores the buffer in memory
2. The controller passes the buffer to the Cloudinary upload utility
3. Cloudinary processes the image with automatic optimizations (max 800x800px, auto quality, auto format)
4. The Cloudinary secure URL and public ID are stored in the Pet document
5. On pet deletion or image replacement, the old image is removed from Cloudinary using its public ID

Configuration is handled in `src/utils/cloudinary.js` and `src/middlewares/upload.js`.

Accepted file types: JPEG, PNG, WebP. Maximum file size: 5MB.


## Email Notifications (EmailJS)

When an admin approves or rejects an adoption request, an email notification is sent to the applicant using EmailJS.

Setup requirements:

1. Create an EmailJS account at https://www.emailjs.com
2. Add an email service (e.g., Gmail, Outlook)
3. Create an email template with the following variables:
   - `{{tittle}}` -- Email subject/title
   - `{{email}}` -- Recipient email address
   - `{{name}}` -- Recipient full name
   - `{{message}}` -- Notification message body
4. Copy the Service ID, Template ID, Public Key, and Private Key into the .env file

Email sending is non-blocking. If an email fails to send, the error is logged but the API response is not affected. This ensures that email delivery issues do not disrupt the adoption workflow.


## Logging

The application uses Winston for structured logging with the following transports:

| Transport         | File              | Level  | Description                            |
|-------------------|-------------------|--------|----------------------------------------|
| Console           | --                | All    | Colorized output for development       |
| File (combined)   | logs/app.log      | All    | All log entries with timestamps        |
| File (errors)     | logs/error.log    | Error  | Error-level entries only               |

Both file transports are configured with a maximum size of 5MB and up to 5 rotated backup files.

HTTP request logging is handled by Morgan, which pipes its output through the Winston logger.

The log level can be controlled via the `LOG_LEVEL` environment variable (default: debug). The `logs/` directory is gitignored.


## Data Models

### User

| Field     | Type   | Details                                           |
|-----------|--------|---------------------------------------------------|
| fullName  | String | Required, trimmed                                 |
| email     | String | Required, unique, lowercase, validated format     |
| phone     | String | Optional                                          |
| password  | String | Required, min 6 characters, hashed with bcrypt    |
| role      | String | "user" or "admin", default: "user"                |

Passwords are automatically hashed before saving using a pre-save hook. The password field is excluded from query results by default (select: false). The model includes a `comparePassword` instance method for login verification.

### Pet

| Field          | Type   | Details                                         |
|----------------|--------|-------------------------------------------------|
| name           | String | Required                                        |
| breed          | String | Required                                        |
| age            | Number | Required                                        |
| species        | String | Required, enum: Dog, Cat, Bird, Rabbit, Fish, Other |
| gender         | String | Required, enum: Male, Female                    |
| description    | String | Optional                                        |
| image          | String | Cloudinary secure URL                           |
| imagePublicId  | String | Cloudinary public ID (for deletion)             |
| status         | String | "available", "adopted", or "pending", default: "available" |

Timestamps (createdAt, updatedAt) are automatically managed by Mongoose.

### Adoption

| Field     | Type       | Details                                            |
|-----------|------------|----------------------------------------------------|
| user      | ObjectId   | Reference to User model, required                  |
| pet       | ObjectId   | Reference to Pet model, required                   |
| status    | String     | "pending", "approved", or "rejected", default: "pending" |
| adoptedAt | Date       | Set only when the adoption is approved             |

Timestamps (createdAt, updatedAt) are automatically managed by Mongoose.


## Adoption Workflow

The adoption process follows this lifecycle:

1. **User submits request** -- POST /api/users/adopt with a pet ID. The adoption is created with status "pending" and the pet status changes to "pending".

2. **Admin reviews** -- GET /api/admin/adoptions returns all requests with user and pet details populated.

3. **Admin approves** -- PUT /api/admin/adoptions/:id/approve sets the adoption to "approved", records the timestamp, marks the pet as "adopted", and sends an approval email to the user.

4. **Admin rejects** -- PUT /api/admin/adoptions/:id/reject sets the adoption to "rejected", reverts the pet status to "available", and sends a rejection email to the user.

5. **User withdraws (optional)** -- DELETE /api/users/adoptions/:id allows the user to withdraw a pending request. The pet status is reverted to "available" and the adoption record is deleted. Approved adoptions cannot be withdrawn.


## Error Handling

All controller functions are wrapped in try-catch blocks. Errors are logged with stack traces using Winston and return appropriate HTTP status codes:

| Status Code | Usage                                              |
|-------------|-----------------------------------------------------|
| 400         | Validation errors, duplicate requests, invalid state |
| 401         | Missing or invalid authentication token              |
| 403         | Insufficient permissions (non-admin access)          |
| 404         | Resource not found (pet, adoption, user)             |
| 500         | Unexpected server errors                             |

All error responses follow a consistent format:

```json
{
  "message": "Description of the error"
}
```

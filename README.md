# Dental Care Appointment System ----------------

## System Overview ----------------
The Dental Care Appointment System is a full-stack application designed to manage dental appointments, patient records, and dental services. The system consists of a React frontend hosted on AWS S3 and a Node.js/Express backend.

## System Architecture ----------------


### Backend Tech Stack -----------
- Node.js with Express framework
- RESTful API architecture
- MySql database
- JWT authentication
- CORS enabled for cross-origin requests



## Database Schema 

### Users
{
  _id: ObjectId,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  roleId: integer
  phone: String,
  dateCreated: Date,
  dateUpdated: Date
}


### users_role
{
  _id: ObjectId,
  userId: Integer,
  roleId: Integer,
  dateCreated: Date,
  dateUpdated: Date
}

### roles
{
  _id: ObjectId,
  description: String,
  dateCreated: Date,
  dateUpdated: Date
}


### appointments

{
  _id: ObjectId,
  patientId: ObjectId,
  dentistId: ObjectId,
  serviceId: ObjectId,
  appointmentDate: Date,
  status: String, // 'scheduled', 'pending', 'cancelled'
  notes: String,
  dateCreated: Date,
  dateUpdated: Date
}

### Services
{
  _id: ObjectId,
  name: String,
  description: String,
  dateCreated: Date,
  dateUpdated: Date
}


## API Endpoints

### Authentication
- POST /api/users/register - Register new user
- POST /api/users/login - User login
- POST /api/users/logout - User logout

### Appointments
- GET /api/appointments - Get all appointments
- POST /api/appointments - Create new appointment
- PUT /api/appointments/:id - Update appointment
- DELETE /api/appointments/:id - Cancel appointment

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Services
- GET /api/services - Get all services
- POST /api/services - Create new service
- PUT /api/services/:id - Update service
- DELETE /api/services/:id - Delete service

### Dentists
- GET /api/dentists - Get all dentists
- POST /api/dentists - Create new dentist
- PUT /api/dentists/:id - Update dentist
- DELETE /api/dentists/:id - Delete dentist

## Deployment Steps



### Back End Kubernetes Deployment

The backend are deployed on Kubernetes for better scalability and management. Here's an overview of the deployment process:

#### Prerequisites
- Kubernetes cluster (EKS, GKE, or self-hosted)
- kubectl configured
- Docker installed
- Docker registry access 

#### Deployment Components
1. **Containerization**
   Node.js application containerized using docker


2. **Configuration**
   - Environment variables managed through Kubernetes secrets

3. **Deployment Steps**
   - Create Kubernetes namespace
   - Set up secrets for sensitive data
   - Deploy backend and frontend applications
   - Configure ingress for external access
   - Set up monitoring and logging


## Environment Setup

### Required Environment Variables (dental-secret.yaml)
```
  DB_USER: database username
  DB_PASS: database password
  DB_NAME: database name
  DB_HOST: database host 
  JWT_SECRET_KEY: jwt secret key
  JWT_TOKEN_EXPIRATION: expiration of token
  JWT_REFRESH_SECRET_KEY: jwt refresh secret key


```

## Assumptions and Dependencies

### Assumptions
1. Users have valid email addresses
2. Appointments are scheduled in 30-minute intervals
3. Dentists have fixed working hours
4. Services have fixed durations
5. System operates in a single timezone
6. Patient can receive email after dentist confirmation

### Dependencies
- Node.js
- Express.js
- MySql
- JWT for authentication
- CORS for cross-origin requests
- Helmet for security
- Morgan for logging

## Security Considerations
1. All API endpoints are protected with JWT authentication
2. Password hashing using bcrypt
3. CORS configuration for secure cross-origin requests
4. Helmet middleware for HTTP security headers
5. Input validation and sanitization

## Error Handling
The system implements a centralized error handling mechanism:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Logging
- Morgan middleware for HTTP request logging
- Error logging for debugging
- Activity logging for audit trails

## For Future Enhancements
1. Real-time notifications
2. Online payment integration
3. Patient portal
5. Analytics dashboard
6. Multi-language support
# MyDowry Backend API

Swagger-free JSON Schema API with custom validation middleware.

## Features

- ✅ **JSON Schema Validation** - Custom validation without Swagger dependencies
- ✅ **Mongoose to JSON Schema** - Automatic schema generation from Mongoose models
- ✅ **Request/Response Validation** - Built-in validation middleware
- ✅ **API Documentation** - Custom documentation endpoints
- ✅ **Authentication System** - Complete auth flow with email verification

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/check-auth` - Check authentication status

### Schema Documentation
- `GET /api/schemas` - Get all available schemas
- `GET /api/schemas/:modelName` - Get specific model schema
- `GET /api/schemas/requests/:requestType` - Get request schema
- `GET /api/api-docs` - Complete API documentation

## JSON Schema Usage

### Get User Model Schema
```bash
GET /api/schemas/user
```

### Get Signup Request Schema
```bash
GET /api/schemas/requests/signupRequest
```

### Get All Schemas
```bash
GET /api/schemas
```

## Validation

All endpoints use JSON schema validation. Invalid requests return:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "email must be a valid email address",
    "password must be at least 6 characters"
  ]
}
```

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controller/      # Route controllers
├── db/             # Database connection
├── middleware/     # Custom middleware (validation, auth)
├── models/         # Mongoose models
├── routes/         # API routes
├── utils/          # Utilities (schema generation)
└── server.ts       # Main server file
```

## Schema Generation

The API automatically generates JSON schemas from:
- Mongoose models (`mongooseToJSONSchema`)
- Custom request/response schemas
- Validation rules

## Benefits of Swagger-Free Approach

1. **Lighter Dependencies** - No heavy Swagger packages
2. **Custom Validation** - Full control over validation logic
3. **Better Performance** - Faster startup and runtime
4. **Flexible Documentation** - Custom API docs format
5. **Type Safety** - TypeScript integration
6. **Easy Maintenance** - Simpler codebase

## Example Usage

### Signup Request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login Request
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Verify Email Request
```json
{
  "code": "123456"
}
```

# MyDowry Backend API

Modern backend API built with Express.js, TypeScript, PostgreSQL, and MinIO.

## 🚀 Features

- ✅ **PostgreSQL Database** - Relational database with TypeORM
- ✅ **MinIO Object Storage** - S3-compatible file storage for images
- ✅ **TypeScript** - Full type safety
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Email Verification** - Complete email verification flow
- ✅ **Swagger Documentation** - Auto-generated API docs
- ✅ **Image Upload** - Direct upload to MinIO
- ✅ **Relational Data** - Full foreign key relationships

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- MinIO Server

## 🔧 Installation

```bash
npm install
```

## ⚙️ Environment Variables

Create `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret

# PostgreSQL Database
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_SSL=false

# MinIO Object Storage
MINIO_ENDPOINT=http://your_minio_host:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=mydowry-images

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# MongoDB (only for migration - can be removed after migration)
MONGO_URI=your_mongodb_uri
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE "your_db_name";
```

### 2. Run Migration (MongoDB → PostgreSQL)

If you have existing MongoDB data:

```bash
npm run migrate
```

This will:
- Migrate all users from MongoDB to PostgreSQL
- Migrate categories, dowries, and books
- Upload all images from MongoDB to MinIO
- Preserve all relationships

## 🏃 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/check-auth` - Check authentication status
- `POST /api/auth/refresh-token` - Refresh access token

### Categories
- `POST /api/category` - Create category
- `GET /api/category` - Get user's categories
- `DELETE /api/category/:id` - Delete category

### Dowries
- `POST /api/dowry/create` - Create dowry (with optional image upload)
- `GET /api/dowry/get` - Get user's dowries (with pagination, search, filters)
- `GET /api/dowry/get/:id` - Get dowry by ID
- `PUT /api/dowry/update/:id` - Update dowry (with optional image upload)
- `PATCH /api/dowry/status/:id` - Update dowry status
- `DELETE /api/dowry/image/:id` - Delete dowry image
- `DELETE /api/dowry/delete/:id` - Delete dowry

### Books
- `POST /api/book` - Create book(s) from text
- `GET /api/book` - Get user's books (with pagination, search, filters)
- `PUT /api/book/:id` - Update book
- `PATCH /api/book/:id/status` - Update book status
- `DELETE /api/book/:id` - Delete book

### Documentation
- `GET /api-docs` - Swagger UI
- `GET /api-docs.json` - OpenAPI JSON schema

## 🗂️ Project Structure

```
src/
├── config/          # Configuration (MinIO)
├── controller/      # Route controllers
├── db/             # Database connection (PostgreSQL)
├── entities/       # TypeORM entities
├── middleware/     # Custom middleware (auth, upload)
├── models/         # MongoDB models (legacy - for migration only)
├── routes/         # API routes
├── scripts/        # Migration scripts
├── services/       # Business logic (MinIO service)
├── utils/          # Utilities
└── server.ts       # Main server file
```

## 🖼️ Image Storage

Images are stored in **MinIO** (S3-compatible object storage):

- **Upload**: Images uploaded directly to MinIO
- **Storage**: Files stored in `users/{userId}/images/{filename}` structure
- **Access**: Public URLs for direct access (bucket must be public)
- **Database**: Only metadata (path, size, type) stored in PostgreSQL

### Image URL Format

```
http://your_minio_host:9000/mydowry-images/users/{userId}/images/{filename}
```

### Making Bucket Public

1. Open MinIO Console: `http://your_minio_host:9000`
2. Go to `mydowry-images` bucket
3. Access Policy → Public
4. Save

## 🔗 Database Relationships

```
User (1) ──→ (N) Category
User (1) ──→ (N) Dowry
User (1) ──→ (N) Image
User (1) ──→ (N) Book

Category (1) ──→ (N) Dowry
Category (1) ──→ (N) Book

Dowry (N) ──→ (1) Category
Dowry (N) ──→ (1) User
Dowry (1) ──→ (1) Image (dowryImage - optional)

Image (N) ──→ (1) User
Image (N) ──→ (1) Dowry (optional)
```

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## 📝 Example Requests

### Signup
```bash
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Dowry (with Image)
```bash
POST /api/dowry/create
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- name: "Wedding Dress"
- description: "Beautiful white dress"
- categoryId: "category-uuid"
- dowryPrice: 5000
- status: "not_purchased"
- image: <file> (optional)
```

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run MongoDB to PostgreSQL migration

### TypeScript Configuration

- `experimentalDecorators: true` - For TypeORM decorators
- `emitDecoratorMetadata: true` - For TypeORM metadata
- `strictPropertyInitialization: false` - For TypeORM entities

## 🐳 Docker

Docker configuration available:
- `Dockerfile` - Production build
- `docker-compose.yml` - Local development

## 📦 Dependencies

### Core
- `express` - Web framework
- `typeorm` - PostgreSQL ORM
- `pg` - PostgreSQL driver
- `minio` - MinIO client
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Hot reload

## 🔄 Migration from MongoDB

If you're migrating from MongoDB:

1. Set up PostgreSQL database
2. Configure MinIO
3. Run `npm run migrate`
4. Verify data in PostgreSQL
5. Start using PostgreSQL endpoints

Migration script automatically:
- Migrates all users
- Migrates categories, dowries, books
- Uploads images to MinIO
- Preserves all relationships

## ⚠️ Important Notes

1. **MinIO Bucket**: Must be public for direct image access
2. **Database**: PostgreSQL uses UUID for IDs (not ObjectId)
3. **Images**: Stored in MinIO, not in database
4. **Relationships**: All foreign keys are properly set up
5. **Migration**: One-time process, can remove MongoDB after migration

## 🐛 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### MinIO Connection Error
- Check MinIO is running
- Verify endpoint and credentials
- Check firewall/network settings

### Image Upload Fails
- Check MinIO bucket exists
- Verify bucket is accessible
- Check file size limits (10MB)

## 📄 License

ISC

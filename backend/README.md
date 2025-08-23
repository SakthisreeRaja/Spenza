# Spenza Backend API

A comprehensive backend API for the Spenza Finance Management App built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: Register, login, JWT-based authentication
- **Expense Management**: Create, read, update, delete expenses with filtering and pagination
- **Category Management**: Default and custom categories with hierarchical support
- **Budget Management**: Create budgets with category allocations and spending tracking
- **Dashboard Analytics**: Statistics, trends, and insights
- **Security**: Rate limiting, input validation, error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs, rate limiting
- **Logging**: Morgan

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/spenza
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CORS_ORIGINS=http://localhost:8081,http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/me` | Get current user profile |
| PUT | `/profile` | Update user profile |
| PUT | `/change-password` | Change password |
| POST | `/logout` | Logout user |
| DELETE | `/account` | Delete user account |

### Expenses (`/api/expenses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get expenses with filtering |
| GET | `/:id` | Get single expense |
| POST | `/` | Create new expense |
| PUT | `/:id` | Update expense |
| DELETE | `/:id` | Delete expense |
| GET | `/stats/summary` | Get expense statistics |
| GET | `/stats/recent` | Get recent expenses |

### Categories (`/api/categories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user categories |
| GET | `/with-totals` | Get categories with spending totals |
| GET | `/:id` | Get single category |
| POST | `/` | Create new category |
| PUT | `/:id` | Update category |
| DELETE | `/:id` | Delete category |
| GET | `/:id/subcategories` | Get subcategories |
| POST | `/setup-defaults` | Setup default categories |

### Budgets (`/api/budgets`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user budgets |
| GET | `/current` | Get current active budgets |
| GET | `/:id` | Get single budget with spending data |
| POST | `/` | Create new budget |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |
| GET | `/stats/overview` | Get budget overview and alerts |

### Users (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |
| GET | `/dashboard` | Get dashboard data |
| GET | `/settings` | Get user settings |
| PUT | `/settings` | Update user settings |
| GET | `/stats` | Get user statistics |

## Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Create Expense
```bash
POST /api/expenses
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Lunch at Restaurant",
  "amount": 25.99,
  "category": "60f7b1b4e6b8f12a3c4d5e6f",
  "description": "Business lunch",
  "paymentMethod": "credit_card",
  "location": "Downtown Restaurant",
  "tags": ["business", "lunch"]
}
```

### Create Budget
```bash
POST /api/budgets
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Monthly Budget - January 2025",
  "amount": 2000,
  "period": "monthly",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "categories": [
    {
      "category": "60f7b1b4e6b8f12a3c4d5e6f",
      "allocatedAmount": 500
    },
    {
      "category": "60f7b1b4e6b8f12a3c4d5e70",
      "allocatedAmount": 300
    }
  ]
}
```

## Data Models

### User Model
- `username` (unique, 3-30 chars)
- `email` (unique, valid email)
- `password` (min 8 chars, hashed)
- `firstName`, `lastName`
- `phoneNumber`, `dateOfBirth`
- `currency` (USD, EUR, GBP, etc.)
- `isActive`, `isEmailVerified`
- `lastLogin`, timestamps

### Expense Model
- `user` (reference to User)
- `title`, `description`
- `amount`, `currency`
- `category` (reference to Category)
- `date`, `paymentMethod`
- `location`, `tags`
- `notes`, timestamps

### Category Model
- `name`, `description`
- `icon`, `color`
- `user` (reference to User)
- `isDefault`, `isActive`
- `parentCategory` (hierarchical)
- timestamps

### Budget Model
- `user` (reference to User)
- `name`, `description`
- `amount`, `currency`, `period`
- `startDate`, `endDate`
- `categories` (array with allocations)
- `alertThresholds` (warning/critical)
- `isActive`, `autoRenew`
- timestamps

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: express-validator for all inputs
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Error Handling**: Centralized error management

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

### Database Seeding

Default categories are automatically created when a user registers.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/spenza |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CORS_ORIGINS` | Allowed CORS origins | localhost:8081 |

## Deployment

1. Set environment variables for production
2. Ensure MongoDB is accessible
3. Set `NODE_ENV=production`
4. Use PM2 or similar for process management
5. Set up reverse proxy (nginx) if needed
6. Enable HTTPS in production

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

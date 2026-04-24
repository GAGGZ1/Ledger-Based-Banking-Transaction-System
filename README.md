# Ledger-Based Banking Transaction System

A production-ready REST API for a secure, distributed banking transaction system using a double-entry accounting ledger model. This system ensures financial integrity through immutable ledger entries, idempotent transactions, and role-based access control.

---

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Swagger Documentation](#swagger-api-documentation)
- [Postman Collection](#postman-collection)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)

---

## 🚀 Quick Start

Get started in 5 minutes! See [QUICKSTART.md](./QUICKSTART.md) for:
- Step-by-step setup instructions
- Common workflows
- Testing the API with Swagger, Postman, or cURL
- Troubleshooting guide

---

## ✨ Features

- **User Authentication & Authorization**
  - JWT-based authentication with secure token storage
  - Email-based registration and login
  - Token blacklisting on logout
  - Role-based access control (Regular User & System User)

- **Account Management**
  - Create multiple accounts per user
  - Account status tracking (ACTIVE, INACTIVE, SUSPENDED)
  - Real-time balance calculation from ledger

- **Secure Transaction Processing**
  - 10-step transaction flow ensuring data consistency
  - Idempotency keys to prevent duplicate transactions
  - Transaction status tracking (PENDING, COMPLETED, FAILED, REVERSED)
  - Atomic operations using MongoDB sessions

- **Double-Entry Ledger System**
  - Immutable ledger entries (CREDIT/DEBIT)
  - Prevents accidental modification or deletion
  - Complete audit trail of all transactions
  - Financial data integrity guaranteed

- **Email Notifications**
  - Transaction confirmation emails
  - Account creation notifications
  - SMTP integration ready

- **Error Handling & Validation**
  - Comprehensive input validation
  - Custom error responses
  - Graceful error handling

- **Interactive API Documentation**
  - Swagger/OpenAPI documentation
  - Try-it-out functionality for all endpoints
  - Complete request/response schemas
  - Authentication testing built-in

---

## 🛠 Tech Stack

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing
- Nodemailer for email services
- Swagger/OpenAPI for API documentation
- dotenv for environment configuration

**Database:**
- MongoDB (Local or Cloud - Atlas)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js v14+ and npm
- MongoDB (local installation or MongoDB Atlas account)
- Git
- A code editor (VS Code recommended)

---

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/GAGGZ1/Ledger-Based-Banking-Transaction-System.git
cd Ledger-Based-Banking-Transaction-System
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment configuration**
```bash
cp .env.example .env
```

---

## 🔧 Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ledger-banking

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@ledgerbanking.com

# Server Configuration
NODE_ENV=development
PORT=3000
```

**For Production:**
- Use strong, random values for `JWT_SECRET`
- Use MongoDB Atlas for cloud database
- Configure proper SMTP credentials
- Set `NODE_ENV=production`

---

## ▶️ Running the Application

```bash
npm start
```

The server will start on `http://localhost:3000`

You should see:
```
Server is running on port 3000
```

---

## � Swagger API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Features:
- ✅ **Try-it-Out**: Test all API endpoints directly from the browser
- ✅ **Authentication**: Securely test protected endpoints with JWT tokens
- ✅ **Schema Validation**: View complete request and response schemas
- ✅ **Error Examples**: See all possible error responses
- ✅ **Parameter Documentation**: Understand all query and path parameters

### How to Use:
1. Navigate to `http://localhost:3000/api-docs`
2. Click **Authorize** button to add your JWT token
3. Click **Try it out** on any endpoint
4. Fill in required parameters
5. Click **Execute** to test the endpoint
6. View the response and response code

---
## 📮 Postman Collection

Import the included Postman collection to test all API endpoints quickly:

### Import Steps:
1. Open **Postman**
2. Click **Import** → **Upload Files**
3. Select `postman_collection.json` from the project root
4. Click **Import**

### Pre-configured Features:
- ✅ **Environment Variables**: BASE_URL, token, accountId
- ✅ **Auto Token Extraction**: Login endpoint automatically saves JWT token
- ✅ **Organized Endpoints**: Grouped by resource (Auth, Accounts, Transactions)
- ✅ **Example Payloads**: All requests have sample data
- ✅ **Tests**: Auto-capture response values for chaining requests

### Typical Testing Flow:
1. **Register** a new user
2. **Login** (token auto-saved)
3. **Create Account** (account ID auto-saved)
4. **Get Account Balance**
5. **Create Transaction** between accounts

---
## �📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### Account Endpoints

#### Create Account
```http
POST /api/accounts/
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountName": "Savings Account"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "account": {
    "_id": "account_id",
    "user": "user_id",
    "accountName": "Savings Account",
    "status": "ACTIVE"
  }
}
```

#### Get User Accounts
```http
GET /api/accounts/
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Accounts retrieved successfully",
  "accounts": [...]
}
```

#### Get Account Balance
```http
GET /api/accounts/balance/:accountId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "accountId": "account_id",
  "balance": 5000
}
```

---

### Transaction Endpoints

#### Create Transaction
```http
POST /api/transactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromAccount": "source_account_id",
  "toAccount": "destination_account_id",
  "amount": 100,
  "idempotencyKey": "unique_transaction_id"
}
```

**Response (200):**
```json
{
  "message": "Transaction completed successfully",
  "transaction": {
    "_id": "transaction_id",
    "fromAccount": "source_account_id",
    "toAccount": "destination_account_id",
    "amount": 100,
    "status": "COMPLETED"
  }
}
```

#### System: Initial Funds
```http
POST /api/transactions/system/initial-funds
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "toAccount": "account_id",
  "amount": 10000,
  "idempotencyKey": "unique_id"
}
```

---

## 🏗 Architecture

### System Design Principles

1. **Double-Entry Ledger**: Every transaction creates two ledger entries
   - DEBIT: Funds leaving an account
   - CREDIT: Funds entering an account

2. **Transaction Flow** (10-Step Process):
   ```
   Request Validation
        ↓
   Idempotency Check
        ↓
   Account Status Check
        ↓
   Balance Verification
        ↓
   Create Transaction (PENDING)
        ↓
   Create DEBIT Entry
        ↓
   Create CREDIT Entry
        ↓
   Mark Transaction COMPLETED
        ↓
   Database Commit
        ↓
   Send Notification
   ```

3. **Data Integrity**: Immutable ledger entries prevent unauthorized modifications

### Entity Relationships

```
User (1) → (Many) Account
Account (1) → (Many) Transaction
Account (1) → (Many) Ledger
Transaction (1) → (Many) Ledger
```

---

## 📁 Project Structure

```
Ledger-Based-Banking-Transaction-System/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js # JWT & role-based auth
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── transaction.model.js
│   │   ├── ledger.model.js
│   │   └── blackList.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js
├── server.js                  # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## 🔑 Key Concepts

### Idempotency Keys
Prevents duplicate transactions if a request is retried:
- Client provides a unique `idempotencyKey`
- Server checks if transaction with this key already exists
- If exists and completed, returns cached response
- Ensures exactly-once execution semantics

### Immutable Ledger
Once a ledger entry is created:
- Cannot be modified
- Cannot be deleted
- Provides audit trail
- Ensures financial data integrity

### Account Balance Calculation
Balance is calculated dynamically from ledger entries:
```
Balance = Sum(CREDIT entries) - Sum(DEBIT entries)
```

This ensures real-time accuracy and prevents balance miscalculations.

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Token blacklisting on logout
- ✅ Input validation & sanitization
- ✅ Role-based access control
- ✅ Immutable financial records
- ✅ HTTP-only cookies (when configured)
- ✅ CORS protection ready

---

## 📞 Support & Contributing

For issues or questions, please open an issue on the [GitHub repository](https://github.com/GAGGZ1/Ledger-Based-Banking-Transaction-System/issues).

---

## 📄 License

ISC License - See LICENSE file for details

---

**Last Updated:** April 2026

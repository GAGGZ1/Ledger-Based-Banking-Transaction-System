# Project Architecture

This document describes the architecture and runtime flow of the **Ledger-Based Banking Transaction System**.

## 1. Overview

This project is a Node.js + Express REST API built on MongoDB and Mongoose.
The system uses a ledger-based transaction model with JWT authentication, role-based access control, and optional email notifications.

Core principles:
- Double-entry ledger for every transfer
- Immutable ledger records
- Idempotent transaction processing
- Token-based authentication and blacklist logout
- System-only funding endpoint
- API documentation with Swagger

## 2. Project Structure

```
Ledger-Based-Banking-Transaction-System/
├── docs/
│   └── ARCHITECTURE.md
├── server.js
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── db.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
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
├── package.json
└── README.md
```

## 3. Startup Flow

### `server.js`
- Loads environment variables with `dotenv`
- Imports the Express app from `src/app.js`
- Connects to MongoDB using `src/config/db.js`
- Starts the Express server on `process.env.PORT || 3000`

### `src/app.js`
- Configures Express middleware:
  - `cors()`
  - `express.json()`
  - `cookie-parser()`
- Serves Swagger UI at `/api-docs`
- Defines a health route at `/`
- Mounts route modules:
  - `/api/auth`
  - `/api/accounts`
  - `/api/transactions`

### `src/config/db.js`
- Connects to MongoDB using `process.env.MONGO_URI`
- Logs whether the connection succeeds or exits on failure

## 4. Route Layer

### Authentication Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Account Routes
- `POST /api/accounts`
- `GET /api/accounts`
- `GET /api/accounts/balance/:accountId`

### Transaction Routes
- `POST /api/transactions`
- `POST /api/transactions/system/initial-funds`

## 5. Controller Layer

### `src/controllers/auth.controller.js`
- `userRegisterController`
  - Creates a new user document
  - Hashes password in model pre-save middleware
  - Signs JWT token with `JWT_SECRET`
  - Sends registration email if enabled
- `userLoginController`
  - Fetches user by email and password
  - Validates password using bcrypt
  - Returns token and user details
- `userLogoutController`
  - Reads token from cookie or Authorization header
  - Adds token to blacklist
  - Clears the auth cookie

### `src/controllers/account.controller.js`
- `createAccountController`
  - Creates a new account linked to the authenticated user
- `getUserAccountsController`
  - Returns all accounts for the current user
- `getAccountBalanceController`
  - Fetches account by ID and user
  - Computes balance using ledger entries

### `src/controllers/transaction.controller.js`
- `createTransaction`
  - Validates request payload
  - Checks idempotency key for duplicate requests
  - Verifies both accounts exist and are ACTIVE
  - Validates sender balance against transfer amount
  - Creates a pending transaction and ledger entries in a session
  - Marks transaction as COMPLETED
  - Sends transaction email if enabled
- `createInitialFundsTransaction`
  - Restricted to system users
  - Creates system-originated initial funds transfer
  - Uses the same DEBIT/CREDIT ledger model

## 6. Middleware Layer

### `src/middleware/auth.middleware.js`
- `authMiddleware`
  - Reads JWT from cookie or Authorization header
  - Verifies token using `process.env.JWT_SECRET`
  - Rejects blacklisted tokens
  - Attaches authenticated user to `req.user`
- `authSystemUserMiddleware`
  - Verifies JWT and blacklist status
  - Ensures `user.systemUser === true`
  - Restricts access to system-only endpoints

## 7. Data Model Layer

### `src/models/user.model.js`
- Fields:
  - `email`
  - `name`
  - `password`
  - `systemUser`
- Password is hashed before save
- `comparePassword` method validates login
- `systemUser` is immutable and not selected by default

### `src/models/account.model.js`
- Fields:
  - `user`
  - `status`
  - `currency`
- `getBalance()` aggregates ledger entries
- Balance = total credits - total debits

### `src/models/transaction.model.js`
- Fields:
  - `fromAccount`
  - `toAccount`
  - `status`
  - `amount`
  - `idempotencyKey`
- Enforces unique `idempotencyKey`
- Tracks transaction lifecycle states

### `src/models/ledger.model.js`
- Fields:
  - `account`
  - `amount`
  - `transaction`
  - `type` (`DEBIT` / `CREDIT`)
- Uses schema hooks to prevent updates and deletes
- Ensures ledger entries are immutable

### `src/models/blackList.model.js`
- Stores invalidated JWT tokens
- TTL index expires tokens after 3 days

## 8. Service Layer

### `src/services/email.service.js`
- Sends email using Gmail OAuth2 and Nodemailer
- Supports registration and transaction notifications
- Can be disabled with `EMAIL_ENABLED=false`

## 9. Transaction Processing Architecture

### Double-Entry Ledger Model
- Every transfer creates two ledger entries:
  - `DEBIT` for the sender account
  - `CREDIT` for the receiver account
- This preserves accounting integrity and audit traceability

### Idempotency
- `idempotencyKey` prevents duplicate transaction processing
- Completed duplicate requests return the original transaction
- Pending or failed duplicate requests are handled explicitly

### MongoDB Transactions
- `createTransaction` and `createInitialFundsTransaction` use `mongoose.startSession()`
- All writes are committed only after ledger entries are created

## 10. Security Model

- JWT authentication with `process.env.JWT_SECRET`
- Token blacklist invalidates logout tokens
- Protected routes enforced via middleware
- System-only endpoints require `systemUser: true`
- Model validation protects against invalid input

## 11. Entity Relationships

- `User` → many `Account`
- `Account` → many `Ledger` entries
- `Transaction` → many `Ledger` entries
- Account balances derive from ledger activity

## 12. System User and Initial Funding

A system user must have `systemUser: true` in the user record.
This is required by `authSystemUserMiddleware`.

To initialize funds:
- Create or update a user document in the database with `systemUser: true`
- Authenticate as that user
- Call `POST /api/transactions/system/initial-funds`
- Example body:
  ```json
  {
    "toAccount": "<account_id>",
    "amount": 10000,
    "idempotencyKey": "init-fund-<unique>"
  }
  ```

## 13. Notes

- The app expects `MONGO_URI` for the database connection
- Swagger spec is served from `src/config/swagger.js`
- The root route `/` is a health check endpoint

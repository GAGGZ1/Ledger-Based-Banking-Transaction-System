# Database Architecture

This document describes the database architecture for the Ledger-Based Banking Transaction System.
It explains collections, schema design, relationships, indexes, and key database behaviors.

## 1. Database Overview

The application uses MongoDB as the primary data store.
Mongoose is used as the ODM layer to define schemas, models, and database operations.

The database is structured around these main entities:
- `users`
- `accounts`
- `transactions`
- `ledgers`
- `tokenBlackLists`

## 2. Connection Configuration

### `src/config/db.js`
- Reads `process.env.MONGO_URI`
- Connects to MongoDB using `mongoose.connect()`
- Logs success or exits the process on failure

This means the running environment must provide a valid `MONGO_URI` value.

## 3. Data Models and Collections

### 3.1 `users`

Defined in `src/models/user.model.js`

Fields:
- `email` (String, required, unique, lowercase, email format)
- `name` (String, required)
- `password` (String, required, hashed, select: false)
- `systemUser` (Boolean, default false, immutable, select: false)

Behaviors:
- Password hashing in `pre('save')`
- `comparePassword(password)` uses bcrypt to verify credentials
- Unique email constraint prevents duplicate accounts
- `systemUser` flag enables privileged endpoints for system users

Indexes:
- Unique index on `email`

### 3.2 `accounts`

Defined in `src/models/account.model.js`

Fields:
- `user` (ObjectId ref `user`, required, indexed)
- `status` (String, enum: `ACTIVE`, `FROZEN`, `CLOSED`, default `ACTIVE`)
- `currency` (String, required, default `INR`)

Behaviors:
- `getBalance()` aggregates ledger entries for that account
- Uses `ledger` collection to compute:
  - total credit
  - total debit
  - balance = credits - debits

Indexes:
- Compound index on `{ user: 1, status: 1 }`
- Index on `user` for fast account lookup by owner

### 3.3 `transactions`

Defined in `src/models/transaction.model.js`

Fields:
- `fromAccount` (ObjectId ref `account`, required, indexed)
- `toAccount` (ObjectId ref `account`, required, indexed)
- `status` (String, enum: `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`, default `PENDING`)
- `amount` (Number, required, min 0)
- `idempotencyKey` (String, required, unique, indexed)

Behaviors:
- Ensures each transaction is uniquely identified by `idempotencyKey`
- Supports idempotent processing in transaction controller
- Tracks lifecycle changes and failure states

Indexes:
- Unique index on `idempotencyKey`
- Indexes on `fromAccount` and `toAccount`

### 3.4 `ledgers`

Defined in `src/models/ledger.model.js`

Fields:
- `account` (ObjectId ref `account`, required, indexed, immutable)
- `amount` (Number, required, immutable)
- `transaction` (ObjectId ref `transaction`, required, indexed, immutable)
- `type` (String, enum: `CREDIT`, `DEBIT`, required, immutable)

Behaviors:
- Immutable ledger entries. Update/delete hooks throw errors on:
  - `findOneAndUpdate`
  - `updateOne`
  - `deleteOne`
  - `remove`
  - `deleteMany`
  - `updateMany`
  - `findOneAndDelete`
  - `findOneAndReplace`
- Enforces auditability and prevents tampering with financial records

Indexes:
- Index on `account`
- Index on `transaction`

### 3.5 `tokenBlackLists`

Defined in `src/models/blackList.model.js`

Fields:
- `token` (String, required, unique)

Behaviors:
- Stores JWT tokens invalidated on logout
- Has an expiry index of 3 days to automatically remove old entries

Indexes:
- Unique index on `token`
- TTL index on `createdAt` with `expireAfterSeconds: 259200` (3 days)

## 4. Entity Relationships

- `User` -> `Account`
  - One user can own multiple accounts
- `Account` -> `Ledger`
  - One account can have many ledger entries
- `Transaction` -> `Ledger`
  - One transaction creates two ledger entries (DEBIT/CREDIT)
- `Account` and `Transaction`
  - A transaction references both origin and destination accounts

## 5. Transaction Data Flow

### Create Transaction
1. Validate `fromAccount`, `toAccount`, `amount`, `idempotencyKey`
2. Ensure both accounts exist
3. Check if transaction with `idempotencyKey` already exists
4. Validate both account statuses are `ACTIVE`
5. Calculate sender balance using `getBalance()`
6. Start MongoDB session and transaction
7. Create transaction record with `PENDING`
8. Create `DEBIT` ledger entry for sender
9. Create `CREDIT` ledger entry for receiver
10. Mark transaction `COMPLETED`
11. Commit MongoDB session
12. Send notification email if enabled

### Initial Funds Transaction
- Performed by a system user only
- Uses the same ledger model with `DEBIT` from system account and `CREDIT` to target account
- Ensures auditability for initial fund allocation

## 6. Design Notes

### Balance Calculation
- Account balance is not stored directly on the account document
- It is computed dynamically from ledger entries
- This keeps balance consistent with the underlying transaction history

### Immutability and Auditability
- Ledger entries are intentionally immutable
- This supports a full audit trail and prevents retroactive adjustment

### Idempotency and Transaction Safety
- `idempotencyKey` prevents duplicate payment processing
- Transaction state is tracked to handle retries safely

### Token Blacklist Rotation
- Blacklisted tokens auto-expire after 3 days
- Prevents permanent storage of revoked JWTs while still allowing logout enforcement

## 7. Environment Requirements

- `MONGO_URI` must point to the MongoDB instance
- `JWT_SECRET` is used for authentication but not stored in the database
- Optional email settings are managed separately in `src/services/email.service.js`

## 8. Testing and Validation

To validate database architecture manually:
- Create users and accounts
- Create a transfer transaction and confirm both ledger entries exist
- Query account balance through ledger aggregation
- Create a system initial funds transaction and verify system user restriction
- Log out and confirm JWT token is stored in `tokenBlackLists`

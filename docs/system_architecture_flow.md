# 🏗 Ledger-Based Banking System — Detailed Architecture & Flow

This document explains the **end-to-end architecture, data flow, and internal workings** of the Ledger-Based Banking Transaction System.

---

# 🧠 1. High-Level Architecture

```
Client (Postman / Frontend)
        ↓
Express API Layer (Routes)
        ↓
Controllers (Business Logic)
        ↓
Services (Email, Utils)
        ↓
Models (Mongoose ODM)
        ↓
MongoDB Database
```

---

# 🔐 2. Authentication Flow (JWT Based)

## Steps:
1. User registers → password hashed using bcrypt
2. User logs in → JWT token generated
3. Token sent in:
   ```
   Authorization: Bearer <token>
   ```
4. Middleware verifies token
5. `req.user` populated

---

# 👤 3. Core Entities

## User
- email
- password (hashed)
- role / systemUser

## Account
- linked to user
- status (ACTIVE, SUSPENDED)

## Transaction
- fromAccount
- toAccount
- amount
- status
- idempotencyKey

## Ledger (MOST IMPORTANT)
- account
- transaction
- type (DEBIT / CREDIT)
- immutable

---

# 💰 4. Double-Entry Ledger Concept

Every transaction creates **2 entries**:

```
Sender Account   → DEBIT
Receiver Account → CREDIT
```

### Formula:
```
Balance = Sum(CREDITS) - Sum(DEBITS)
```

👉 No direct balance storage → always derived

---

# 🔄 5. Transaction Flow (Detailed)

## Step-by-step:

### 1. Request Validation
- Ensure all fields exist

### 2. Idempotency Check
- Prevent duplicate transactions

### 3. Account Validation
- Both accounts must exist and be ACTIVE

### 4. Balance Check
- Derived from ledger entries

### 5. Start DB Transaction (Mongo Session)

### 6. Create Transaction (PENDING)

### 7. Create Ledger Entries
```
DEBIT  → fromAccount
CREDIT → toAccount
```

### 8. Mark Transaction COMPLETED

### 9. Commit DB Transaction
- Ensures atomicity

### 10. Send Email (Async side-effect)

---

# 🏦 6. Initial Funds Flow (System User)

```
SYSTEM_ACCOUNT → USER_ACCOUNT
```

## Flow:
1. SYSTEM user authenticated
2. Fetch SYSTEM account
3. Create transaction
4. Create ledger entries
5. Commit transaction

---

# ⚠️ 7. Idempotency Design

## Why needed?
- Prevent duplicate payments

## Flow:
```
Check idempotencyKey
   ↓
If exists → return old result
Else → process transaction
```

---

# 🔒 8. Data Integrity Guarantees

## 1. Immutable Ledger
- Cannot update/delete entries

## 2. Atomic Transactions
- MongoDB session ensures all-or-nothing

## 3. No Direct Balance Updates
- Prevents inconsistency

---

# 📦 9. Project Structure (Logical)

```
src/
 ├── controllers/   → business logic
 ├── models/        → DB schema
 ├── routes/        → API endpoints
 ├── middleware/    → auth
 ├── services/      → email, utils
 └── config/        → DB config
```

---

# 🚨 10. Failure Handling

## If error occurs:
- Transaction stays PENDING or FAILED
- No partial ledger writes
- Safe retry using idempotency key

---

# 📈 11. Scalability Considerations

## Current
- Monolith API
- MongoDB

## Future Improvements
- Redis for caching & idempotency
- Queue (RabbitMQ/Kafka) for async tasks
- Microservices split:
  - Auth Service
  - Transaction Service
  - Ledger Service

---

# 🔁 12. Complete Flow Example

```
User → Login → Get Token
      ↓
Create Account
      ↓
SYSTEM → Add Initial Funds
      ↓
User → Transfer Money
      ↓
Ledger Entries Created
      ↓
Balance Derived
```

---

# 🧠 13. Key Design Principles

- Event-driven thinking (ledger entries)
- Idempotent APIs
- Immutable data
- Separation of concerns
- Atomic DB operations

---

# ✔ Summary

This system ensures:

- Financial correctness
- Auditability
- Consistency
- Fault tolerance

It mimics real-world banking systems using:

- Double-entry accounting
- Transactional guarantees
- Secure authentication

---

# 🚀 Next Improvements

- Add reversal transactions (refunds)
- Add audit logs
- Add rate limiting
- Add monitoring (logs + alerts)
- Convert to microservices

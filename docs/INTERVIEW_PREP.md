# Interview Preparation: Ledger-Based Banking Transaction System

## 1. Project Summary

This project is a secure REST API for a banking transaction system built with Node.js, Express, and MongoDB. It uses a double-entry ledger model to guarantee financial integrity, supports JWT authentication, idempotent transactions, and provides immutable audit trails.

Key capabilities:
- User registration, login, and logout with JWT
- Account creation and balance retrieval
- Money transfer transactions with debit/credit ledger entries
- System-only initial funding endpoint
- Token blacklisting to revoke logout sessions
- Swagger API documentation
- Optional email notifications for registration and transaction events

---

## 2. High-Level Architecture

### Layers
- **Entry point**: `server.js`
- **Application config**: `src/app.js`
- **Database connection**: `src/config/db.js`
- **Routing**: `src/routes/*.js`
- **Controllers**: `src/controllers/*.js`
- **Models/Domain**: `src/models/*.js`
- **Middleware**: `src/middleware/auth.middleware.js`
- **Services**: `src/services/email.service.js`

### Patterns
- **MVC-inspired** separation: routes → controllers → models
- **Layered services**: email service is isolated from business logic
- **Domain logic in model methods**: account balance calculation lives in `account.model.js`
- **Transaction safety**: MongoDB sessions ensure atomic ledger operations
- **Idempotency**: transactions use `idempotencyKey` to avoid duplicates
- **Immutability**: ledger entries are protected by Mongoose middleware

---

## 3. File-by-File Walkthrough

### `server.js`
- Loads environment variables with `dotenv`.
- Imports the Express app from `src/app.js`.
- Imports DB connection logic from `src/config/db.js`.
- Calls `connectToDB()` before starting the server.
- Starts listening on `process.env.PORT || 3000`.

Why this matters:
- Ensures the app only runs after DB connection is attempted.
- Keeps startup logic small and focused.

### `src/app.js`
- Creates the Express application.
- Enables CORS for cross-origin client requests.
- Adds `express.json()` to parse JSON bodies.
- Adds `cookie-parser` to access tokens stored as cookies.
- Mounts Swagger UI at `/api-docs` using `src/config/swagger.js`.
- Imports and mounts route modules:
  - Auth routes at `/api/auth`
  - Account routes at `/api/accounts`
  - Transaction routes at `/api/transactions`
- Provides a root health route at `/`.

Key interview points:
- Middleware order matters: body parsing before route handling.
- Swagger is integrated with JSDoc annotations in route files.

### `src/config/db.js`
- Uses Mongoose to connect to MongoDB using `process.env.MONGO_URI`.
- Logs success or exits the process on failure.

Why this matters:
- Simple fail-fast behavior prevents the app from running in a broken state.
- Good interview note: production should add retry/backoff and better logging.

### `src/config/swagger.js`
- Declares OpenAPI metadata, servers, security schemes, and schemas.
- Points Swagger JSDoc at the route files for inline endpoint documentation.
- Exports the generated `swaggerSpec` for `src/app.js`.

Interview note:
- Swagger docs are useful for API discovery and stakeholder validation.
- The project documents bearer auth and cookie auth schemes.

---

## 4. Authentication & Authorization

### `src/middleware/auth.middleware.js`
- Extracts JWT token from either cookie or `Authorization` header.
- Checks the token blacklist in MongoDB before verifying it.
- Verifies JWT using `process.env.JWT_SECRET`.
- Looks up the user and attaches `req.user`.
- `authSystemUserMiddleware` additionally checks `user.systemUser`.

Why token blacklist exists:
- JWTs are stateless and normally cannot be revoked.
- Blacklisting on logout provides a simple revocation mechanism.
- Stored tokens expire after 3 days using MongoDB TTL indices.

### `src/controllers/auth.controller.js`
- `userRegisterController`: creates a user, signs a JWT, sets `token` cookie, returns user payload, and sends welcome email.
- `userLoginController`: validates credentials, signs JWT, and returns token + user info.
- `userLogoutController`: blacklists the token and clears the cookie.

Authentication flow:
- The password is hashed in `src/models/user.model.js` before saving.
- Login uses `comparePassword()` with bcrypt.
- Both register and login issue a 3-day JWT.

Security discussion:
- Storing tokens in cookies plus authorization header supports browser and API client flows.
- Because cookies are used, the app can support secure HTTP-only sessions in production when extended.

---

## 5. Account Management

### `src/models/account.model.js`
- Account schema includes `user`, `status`, and `currency`.
- `getBalance()` aggregates ledger entries:
  - sums `DEBIT` amounts as `totalDebit`
  - sums `CREDIT` amounts as `totalCredit`
  - returns `totalCredit - totalDebit`

Why ledger aggregation matters:
- No balance field is stored directly, so the balance is always derived from transaction history.
- This is a core principle of double-entry accounting and improves auditability.

### `src/controllers/account.controller.js`
- `createAccountController`: creates a new account for the authenticated user.
- `getUserAccountsController`: lists all accounts owned by the current user.
- `getAccountBalanceController`: verifies account ownership and returns computed balance.

Why this is important:
- Ownership validation prevents users from fetching other users' balances.
- Account status enforcement is handled in transactions, not here.

---

## 6. Transaction Processing

### `src/models/transaction.model.js`
- Transaction schema stores `fromAccount`, `toAccount`, `amount`, `status`, and `idempotencyKey`.
- `idempotencyKey` is unique and prevents duplicate processing.
- Status options include `PENDING`, `COMPLETED`, `FAILED`, and `REVERSED`.

### `src/models/ledger.model.js`
- Ledger schema stores immutable entries for `account`, `amount`, `transaction`, and `type`.
- Immutable fields are declared with `{ immutable: true }`.
- Mongoose middleware rejects updates or deletes on ledger entries.

Why this is critical:
- Ledger immutability is necessary for a trustworthy financial trail.
- It prevents tampering after audit data is recorded.

### `src/controllers/transaction.controller.js`
#### `createTransaction`
This is the main money-transfer flow:
1. Validate required fields.
2. Fetch both source and destination accounts.
3. Prevent duplicate processing via `idempotencyKey`.
4. Confirm both accounts are `ACTIVE`.
5. Compute sender balance using ledger aggregation.
6. Start a MongoDB transaction session.
7. Create a `PENDING` transaction record.
8. Create the `DEBIT` ledger entry for `fromAccount`.
9. Wait 15 seconds intentionally (mocking delay or demonstrating pending state).
10. Create the `CREDIT` ledger entry for `toAccount`.
11. Update transaction status to `COMPLETED`.
12. Commit the session.
13. Send transaction email notification.

#### `createInitialFundsTransaction`
- Restricted to system users via `authSystemUserMiddleware`.
- Creates a funding transaction from the system user's account to a regular user account.
- Uses the same debit/credit ledger pattern.
- Marks the transaction `COMPLETED` before commit.

Important interview points:
- The 15-second delay is unusual in production; explain it as a simulated processing delay or testing artifact.
- MongoDB sessions ensure the transaction record and ledger entries are committed atomically.
- A failed transaction should ideally roll back and set status to `FAILED`, but current code catches errors and returns a generic pending response.

---

## 7. Email Service

### `src/services/email.service.js`
- Exposes `sendRegistrationEmail` and `sendTransactionEmail`.
- Uses Nodemailer with Gmail OAuth2 by default.
- Supports disabling email via `EMAIL_ENABLED=false`.
- If disabled, the module exports no-op methods so the app continues without email failure.

What to mention in interview:
- Email notifications are decoupled from business logic.
- Optional email support is a pragmatic way to avoid blocking app startup in development.
- The current Gmail OAuth2 setup may require valid `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, and `EMAIL_USER`.

---

## 8. API Routes Summary

### Auth Routes (`src/routes/auth.routes.js`)
- `POST /api/auth/register` → register a new user.
- `POST /api/auth/login` → login and receive JWT.
- `POST /api/auth/logout` → blacklist JWT and clear cookie.

### Account Routes (`src/routes/account.routes.js`)
- `POST /api/accounts` → create account for authenticated user.
- `GET /api/accounts` → list authenticated user accounts.
- `GET /api/accounts/:accountId/balance` → get account balance.

### Transaction Routes (`src/routes/transaction.routes.js`)
- `POST /api/transactions` → transfer funds between accounts.
- `POST /api/transactions/system/initial-funds` → system-only funding.

---

## 9. Interview Talking Points

### Why this architecture?
- **Security**: JWT + blacklisting protects sessions.
- **Auditability**: Ledger entries are immutable and derived balances prevent stale data.
- **Reliability**: Idempotency keys protect against retries and duplicate requests.
- **Maintainability**: Clear separation of concerns with controllers, routes, models, and middleware.
- **Developer Experience**: Swagger docs make the API immediately testable.

### What are the most important design decisions?
- Using a **double-entry ledger** rather than storing a single balance.
- Implementing **atomic transaction commits** with MongoDB sessions.
- Adding **role-based access control** for system-only funding.
- Keeping email notification logic **optional** so the API can run without external services.

### What would you improve?
- Add proper **error handling** for failed transaction sessions.
- Move sensitive config to **secure environment management** and avoid `process.env` everywhere.
- Add **unit/integration tests** for controller and model behavior.
- Implement **rate limiting** and **input sanitization** for production readiness.
- Replace the 15-second delay with a real asynchronous queue or remove it.
- Add **account ownership validation** for system funding and more robust account status handling.

---

## 10. Common Interview Questions and Suggested Answers

### Q: How does the system prevent duplicate transactions?
A: It uses a unique `idempotencyKey` in the `transaction` schema. Before processing, the controller checks for an existing record and returns an appropriate response if the transaction is already completed, pending, failed, or reversed.

### Q: Why use a ledger instead of storing balance directly?
A: Storing a ledger provides a full audit trail, prevents hidden balance drift, and supports financial accounting best practices. The balance is derived from ledger entries, so every debit and credit is recorded permanently.

### Q: What is the role of MongoDB sessions here?
A: Sessions group related writes into an atomic transaction. The transaction record and both ledger entries are committed together, so either all changes persist or none do.

### Q: Why blacklist JWTs on logout?
A: JWTs are otherwise valid until expiration. Blacklisting lets the app revoke tokens immediately on logout, giving better session control without storing session state in every request.

### Q: How is immutability enforced for ledger entries?
A: The ledger schema uses `immutable: true` on critical fields and Mongoose hooks to reject update/delete operations. This prevents ledger tampering after creation.

### Q: What edge cases would you handle next?
- Ensure a failed MongoDB transaction sets the transaction status to `FAILED` and rolls back cleanly.
- Prevent transfers to the same account.
- Enforce minimum deposit/withdrawal amounts.
- Support multiple currencies and exchange rates.
- Add pagination and filtering to account and transaction queries.

---

## 11. How to Present this Project

1. Start with the problem: building a ledger-backed banking API with strong integrity guarantees.
2. Explain the core domain model: users, accounts, transactions, ledger entries.
3. Highlight safeguards:
   - JWT auth + logout blacklist
   - Immutable ledger
   - Idempotency keys
   - MongoDB session transactions
4. Point to real code examples:
   - `createTransaction` in `src/controllers/transaction.controller.js`
   - `getBalance()` in `src/models/account.model.js`
   - `authSystemUserMiddleware` in `src/middleware/auth.middleware.js`
5. Mention the project is ready for API testing via Swagger and Postman.

---

## 12. Quick Notes for Interview

- `src/controllers/transaction.controller.js` contains the most critical business logic.
- `src/models/account.model.js` and `src/models/ledger.model.js` implement the core financial domain rules.
- The email service is intentionally optional and safe to disable.
- The system route `POST /api/transactions/system/initial-funds` is for restricted system user operations.

Good luck presenting this project — the implementation is strong on accounting integrity and the documentation is set up for easy explanation.

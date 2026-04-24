# Quick Start Guide

Get the Ledger Banking API up and running in minutes!

## Prerequisites
- Node.js v14+
- npm or yarn
- MongoDB (local or Atlas)
- Postman or curl (optional, for testing)

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Copy and configure your environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/ledger-banking
JWT_SECRET=your_secret_key_here
```

## 3. Start the Server

```bash
npm start
```

You should see:
```
Server is running on port 3000
```

## 4. Test the API

### Option A: Using Swagger UI (Easiest)
1. Open your browser: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
2. Click **Authorize** and enter a test token
3. Try out any endpoint

### Option B: Using Postman
1. Import `postman_collection.json` into Postman
2. Set `BASE_URL` variable to `http://localhost:3000`
3. Use the pre-configured requests

### Option C: Using cURL
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 5. Common Workflow

```bash
# 1. Register a user
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secure123"
}

# 2. Login and get token
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "secure123"
}
# Response: { "token": "eyJhbGc..." }

# 3. Create an account (use token from step 2)
POST /api/accounts
Authorization: Bearer eyJhbGc...
{
  "accountName": "Savings"
}

# 4. Check balance
GET /api/accounts/balance/{accountId}
Authorization: Bearer eyJhbGc...

# 5. Transfer funds (need two accounts)
POST /api/transactions
Authorization: Bearer eyJhbGc...
{
  "fromAccount": "account1_id",
  "toAccount": "account2_id",
  "amount": 100,
  "idempotencyKey": "unique-key-123"
}
```

## 6. Stop the Server

Press `Ctrl+C` in the terminal

## Troubleshooting

### Database Connection Error
- Ensure MongoDB is running: `mongod`
- Verify `MONGODB_URI` in `.env` is correct

### Port 3000 Already in Use
- Change port in `.env`: `PORT=3001`
- Or kill the process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill`

### Authentication Errors
- Make sure token is included in Authorization header: `Bearer {token}`
- Tokens expire after 7 days (configurable in `.env`)

### Missing Environment Variables
- Copy `.env.example` to `.env`
- Fill in all required values
- Restart the server

## Next Steps

- Read [README.md](./README.md) for complete API documentation
- Explore Swagger UI for interactive testing
- Check [postman_collection.json](./postman_collection.json) for pre-built requests
- Review source code in `src/` directory

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Documentation](https://jwt.io/)
- [Swagger/OpenAPI](https://swagger.io/)

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: |
 *       Transfer funds between two accounts. Uses idempotency keys to prevent duplicate transactions.
 *       
 *       Transaction Flow:
 *       1. Validates request and accounts
 *       2. Checks idempotency key for existing transaction
 *       3. Verifies both accounts are ACTIVE
 *       4. Derives sender balance from ledger
 *       5. Creates transaction record (PENDING)
 *       6. Creates DEBIT ledger entry (funds leaving)
 *       7. Creates CREDIT ledger entry (funds entering)
 *       8. Marks transaction COMPLETED
 *       9. Commits to database
 *       10. Sends email notification
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccount
 *               - toAccount
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               fromAccount:
 *                 type: string
 *                 description: Source account ID
 *                 example: 507f1f77bcf86cd799439012
 *               toAccount:
 *                 type: string
 *                 description: Destination account ID
 *                 example: 507f1f77bcf86cd799439014
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *                 example: 100
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key to prevent duplicate transactions
 *                 example: txn-2024-04-24-001
 *     responses:
 *       200:
 *         description: Transaction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Transaction processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * @swagger
 * /api/transactions/system/initial-funds:
 *   post:
 *     summary: Initialize account with funds (System Only)
 *     description: |
 *       Create initial funds transaction from system user to a regular user account.
 *       This endpoint is restricted to system users only.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toAccount
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               toAccount:
 *                 type: string
 *                 description: Destination account ID
 *                 example: 507f1f77bcf86cd799439014
 *               amount:
 *                 type: number
 *                 description: Initial funding amount
 *                 example: 10000
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key to prevent duplicate transactions
 *                 example: init-fund-2024-04-24-001
 *     responses:
 *       200:
 *         description: Initial funds transaction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - token missing, invalid, or not a system user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Transaction processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;
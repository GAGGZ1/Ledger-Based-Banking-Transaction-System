const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ledger-Based Banking Transaction System API",
      version: "1.0.0",
      description:
        "A secure REST API for banking transactions with double-entry ledger system, featuring JWT authentication, immutable transaction records, and comprehensive transaction management.",
      contact: {
        name: "Support",
        url: "https://github.com/GAGGZ1/Ledger-Based-Banking-Transaction-System",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server (update with actual URL)",
      },
      {
    url: "https://ledger-based-banking-transaction-system.onrender.com"
  }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Account: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            user: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            accountName: {
              type: "string",
              example: "Savings Account",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
              example: "ACTIVE",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            fromAccount: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            toAccount: {
              type: "string",
              example: "507f1f77bcf86cd799439014",
            },
            amount: {
              type: "number",
              example: 100,
            },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
              example: "COMPLETED",
            },
            idempotencyKey: {
              type: "string",
              example: "txn-2024-04-24-001",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Ledger: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439015",
            },
            account: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            transaction: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            type: {
              type: "string",
              enum: ["CREDIT", "DEBIT"],
              example: "CREDIT",
            },
            amount: {
              type: "number",
              example: 100,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/auth.routes.js",
    "./src/routes/account.routes.js",
    "./src/routes/transaction.routes.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

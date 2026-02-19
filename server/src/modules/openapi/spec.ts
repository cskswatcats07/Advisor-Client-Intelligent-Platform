export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Advisor Platform Open Banking API",
    version: "1.1.0",
    description:
      "Open Banking interface with OAuth 2.0 authorization code flow, FAPI-style signed responses, and FDX v5 data endpoints.",
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [
    { name: "FDX Consents" },
    { name: "FDX Data" },
    { name: "FDX OAuth" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorObject: {
        type: "object",
        properties: {
          code: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
        },
      },
      OAuthAuthorizeRequest: {
        type: "object",
        required: ["response_type", "client_id", "redirect_uri", "scope", "consent_id"],
        properties: {
          response_type: { type: "string", enum: ["code"] },
          client_id: { type: "string" },
          redirect_uri: { type: "string", format: "uri" },
          scope: { type: "string" },
          state: { type: "string" },
          consent_id: { type: "string" },
        },
      },
      FdxConsentCreate: {
        type: "object",
        required: ["customerId", "scope"],
        properties: {
          customerId: { type: "string" },
          scope: { type: "array", items: { type: "string" } },
          durationDays: { type: "integer", minimum: 1, maximum: 365, default: 90 },
        },
      },
      FdxConsent: {
        type: "object",
        properties: {
          id: { type: "string" },
          organizationId: { type: "string" },
          customerId: { type: "string" },
          grantedScopes: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["ACTIVE", "REVOKED", "EXPIRED"] },
          createdAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      FdxTokenExchange: {
        type: "object",
        required: ["grant_type", "code", "redirect_uri", "client_id", "client_secret"],
        properties: {
          grant_type: { type: "string", enum: ["authorization_code"] },
          code: { type: "string" },
          redirect_uri: { type: "string", format: "uri" },
          client_id: { type: "string" },
          client_secret: { type: "string" },
        },
      },
      FdxTokenResponse: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "Bearer" },
          expires_in: { type: "integer", example: 3600 },
          consent_id: { type: "string" },
          scope: { type: "string" },
        },
      },
      FdxAccount: {
        type: "object",
        properties: {
          accountId: { type: "string" },
          accountType: { type: "string", enum: ["INVESTMENT", "DEPOSIT"] },
          accountCategory: { type: "string", enum: ["RETIREMENT", "TAXABLE"] },
          accountNumberDisplay: { type: "string" },
          status: { type: "string", enum: ["OPEN"] },
          currency: { type: "string", example: "CAD" },
          nickname: { type: "string" },
          balances: {
            type: "object",
            properties: {
              current: { type: "number" },
              available: { type: "number" },
            },
          },
        },
      },
      FdxTransaction: {
        type: "object",
        properties: {
          transactionId: { type: "string" },
          accountId: { type: "string" },
          postedTimestamp: { type: "string", format: "date-time" },
          description: { type: "string" },
          amount: { type: "number" },
          debitCreditMemo: { type: "string", enum: ["DEBIT", "CREDIT"] },
          status: { type: "string", enum: ["POSTED"] },
          transactionType: { type: "string", enum: ["DEPOSIT", "FEE"] },
        },
      },
    },
  },
  paths: {
    "/api/fdx/v5/jwks": {
      get: {
        tags: ["FDX OAuth"],
        summary: "Get JWKS for response signature verification",
        responses: {
          "200": {
            description: "JWKS document",
          },
        },
      },
    },
    "/api/fdx/v5/consents": {
      post: {
        tags: ["FDX Consents"],
        summary: "Create customer consent",
        parameters: [
          { name: "x-org-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FdxConsentCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Consent created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/FdxConsent" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/fdx/v5/oauth/authorize": {
      get: {
        tags: ["FDX OAuth"],
        summary: "OAuth 2.0 authorization endpoint (authorization code flow)",
        parameters: [
          { name: "x-org-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
          { name: "response_type", in: "query", required: true, schema: { type: "string", enum: ["code"] } },
          { name: "client_id", in: "query", required: true, schema: { type: "string" } },
          { name: "redirect_uri", in: "query", required: true, schema: { type: "string", format: "uri" } },
          { name: "scope", in: "query", required: true, schema: { type: "string" } },
          { name: "state", in: "query", required: false, schema: { type: "string" } },
          { name: "consent_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "302": {
            description: "Redirects to redirect_uri with code and optional state",
          },
        },
      },
    },
    "/api/fdx/v5/oauth/token": {
      post: {
        tags: ["FDX OAuth"],
        summary: "OAuth token endpoint for authorization code exchange",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FdxTokenExchange" },
            },
          },
        },
        responses: {
          "201": {
            description: "Token issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FdxTokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/fdx/v5/customers/{customerId}/accounts": {
      get: {
        tags: ["FDX Data"],
        summary: "List customer accounts (FDX object parity)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Accounts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        customerId: { type: "string" },
                        accounts: {
                          type: "array",
                          items: { $ref: "#/components/schemas/FdxAccount" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/fdx/v5/accounts/{accountId}": {
      get: {
        tags: ["FDX Data"],
        summary: "Get account detail",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Account detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/FdxAccount" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/fdx/v5/accounts/{accountId}/transactions": {
      get: {
        tags: ["FDX Data"],
        summary: "List account transactions",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Transactions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        accountId: { type: "string" },
                        transactions: {
                          type: "array",
                          items: { $ref: "#/components/schemas/FdxTransaction" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const openApiYaml = `openapi: 3.1.0
info:
  title: Advisor Platform Open Banking API
  version: 1.1.0
  description: Open Banking interface with OAuth 2.0 authorization code flow, FAPI-style signed responses, and FDX v5 data endpoints.
servers:
  - url: http://localhost:4000
paths:
  /api/fdx/v5/consents:
    post:
      summary: Create customer consent
  /api/fdx/v5/oauth/authorize:
    get:
      summary: OAuth 2.0 authorize endpoint (code flow)
  /api/fdx/v5/oauth/token:
    post:
      summary: OAuth 2.0 token endpoint (code exchange)
  /api/fdx/v5/jwks:
    get:
      summary: JWK Set for FAPI response signature verification
  /api/fdx/v5/customers/{customerId}/accounts:
    get:
      summary: List customer accounts
  /api/fdx/v5/accounts/{accountId}:
    get:
      summary: Get account detail
  /api/fdx/v5/accounts/{accountId}/transactions:
    get:
      summary: List account transactions
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;

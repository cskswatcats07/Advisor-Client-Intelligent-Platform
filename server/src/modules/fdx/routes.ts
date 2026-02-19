import { Router } from "express";
import { z } from "zod";
import { db, persist } from "../../db/store";
import {
  fdxAuthorizeQuerySchema,
  fdxConsentCreateSchema,
  fdxTokenExchangeSchema,
} from "../../domain/schema";
import type {
  ClientFinancialProfile,
  NonRegisteredAccount,
  RegisteredAccount,
} from "../../domain/types";
import { parseBody } from "../../lib/http";
import { requireAuth, requirePermission, type AuthedRequest } from "../../middleware/auth";
import { requireFdxToken, type FdxRequest } from "../../middleware/fdxAuth";
import { jwksResponse, signResponsePayload } from "./fapi";

interface FdxAccount {
  accountId: string;
  accountType: "INVESTMENT" | "DEPOSIT";
  accountCategory: "RETIREMENT" | "TAXABLE";
  accountNumberDisplay: string;
  currency: "CAD";
  nickname: string;
  status: "OPEN";
  balances: {
    current: number;
    available: number;
  };
}

interface FdxTransaction {
  transactionId: string;
  accountId: string;
  postedTimestamp: string;
  description: string;
  amount: number;
  debitCreditMemo: "DEBIT" | "CREDIT";
  status: "POSTED";
  transactionType: "DEPOSIT" | "FEE";
}

function interactionId(req: { header: (name: string) => string | undefined }): string {
  return req.header("x-fapi-interaction-id") ?? crypto.randomUUID();
}

async function sendSignedJson(
  req: { header: (name: string) => string | undefined },
  res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } },
  status: number,
  body: unknown,
): Promise<void> {
  const signature = await signResponsePayload(body);
  res.setHeader("x-fapi-interaction-id", interactionId(req));
  res.setHeader("x-jws-signature", signature);
  res.setHeader("cache-control", "no-store");
  res.setHeader("pragma", "no-cache");
  res.status(status).json(body);
}

async function sendFdxError(
  req: { header: (name: string) => string | undefined },
  res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } },
  status: number,
  code: string,
  title: string,
  detail: string,
): Promise<void> {
  await sendSignedJson(req, res, status, {
    errors: [{ code, title, detail }],
  });
}

function latestProfileForCustomer(customerId: string): ClientFinancialProfile | null {
  const profile = db.data.financialProfiles
    .filter((p) => p.clientId === customerId)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1))[0];
  return profile ?? null;
}

function mapRegisteredAccount(customerId: string, account: RegisteredAccount): FdxAccount {
  return {
    accountId: `${customerId}-${account.type}`,
    accountType: "INVESTMENT",
    accountCategory: "RETIREMENT",
    accountNumberDisplay: `****${account.type.slice(0, 2)}01`,
    currency: "CAD",
    nickname: `${account.type} Account`,
    status: "OPEN",
    balances: {
      current: account.currentBalance,
      available: account.currentBalance,
    },
  };
}

function mapNonRegisteredAccount(customerId: string, account: NonRegisteredAccount): FdxAccount {
  return {
    accountId: `${customerId}-${account.id}`,
    accountType: "INVESTMENT",
    accountCategory: "TAXABLE",
    accountNumberDisplay: `****NR${account.id.slice(0, 2)}`,
    currency: "CAD",
    nickname: account.name,
    status: "OPEN",
    balances: {
      current: account.currentBalance,
      available: account.currentBalance,
    },
  };
}

function syntheticTransactions(customerId: string, accountId: string, contribution: number): FdxTransaction[] {
  const now = new Date();
  return [
    {
      transactionId: `${customerId}-${accountId}-tx-1`,
      accountId,
      postedTimestamp: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
      description: "Periodic contribution",
      amount: Math.abs(contribution || 500),
      debitCreditMemo: "CREDIT",
      status: "POSTED",
      transactionType: "DEPOSIT",
    },
    {
      transactionId: `${customerId}-${accountId}-tx-2`,
      accountId,
      postedTimestamp: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
      description: "Management fee",
      amount: 25,
      debitCreditMemo: "DEBIT",
      status: "POSTED",
      transactionType: "FEE",
    },
  ];
}

export function fdxRouter(): Router {
  const router = Router();

  router.get("/jwks", async (req, res) => {
    const jwks = await jwksResponse();
    await sendSignedJson(req, res, 200, jwks);
  });

  router.post(
    "/consents",
    requireAuth,
    requirePermission("consent.manage"),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(fdxConsentCreateSchema, req, res);
      if (!payload) return;

      const customer = db.data.clients.find(
        (c) => c.id === payload.customerId && c.organizationId === req.auth?.organizationId,
      );
      if (!customer) {
        await sendFdxError(req, res, 404, "404", "Not Found", "Customer not found.");
        return;
      }

      const createdAt = new Date();
      const durationDays = payload.durationDays ?? 90;
      const expiresAt = new Date(createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const consent = {
        id: crypto.randomUUID(),
        organizationId: req.auth.organizationId,
        clientId: payload.clientId,
        advisorId: req.auth.userId,
        customerId: payload.customerId,
        institutionId: payload.institutionId,
        grantedScopes: payload.scope,
        status: "ACTIVE" as const,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      db.data.fdxConsents.push(consent);
      await persist();
      await sendSignedJson(req, res, 201, { data: consent });
    },
  );

  router.get("/consents/:consentId", requireAuth, async (req: AuthedRequest, res) => {
    await db.read();
    const consent = db.data.fdxConsents.find((c) => c.id === req.params.consentId);
    if (!consent) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Consent not found.");
      return;
    }
    await sendSignedJson(req, res, 200, { data: consent });
  });

  router.delete("/consents/:consentId", requireAuth, async (req: AuthedRequest, res) => {
    await db.read();
    const consent = db.data.fdxConsents.find((c) => c.id === req.params.consentId);
    if (!consent) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Consent not found.");
      return;
    }
    consent.status = "REVOKED";
    consent.revokedAt = new Date().toISOString();
    await persist();
    res.setHeader("x-fapi-interaction-id", interactionId(req));
    res.setHeader("cache-control", "no-store");
    res.setHeader("pragma", "no-cache");
    res.status(204).send();
  });

  /* ─── Client Consent Portal endpoints (PRD §4.3) ─── */

  router.get("/consents/client/:clientId", requireAuth, async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const clientId = req.params.clientId;
    const consents = db.data.fdxConsents.filter(
      (c) => c.organizationId === req.auth?.organizationId &&
        (c.clientId === clientId || c.customerId === clientId),
    );
    const active = consents.filter((c) => c.status === "ACTIVE");
    const expired = consents.filter((c) => c.status === "EXPIRED" || (c.status === "ACTIVE" && new Date(c.expiresAt) <= new Date()));
    const revoked = consents.filter((c) => c.status === "REVOKED");

    await sendSignedJson(req, res, 200, {
      clientId,
      activeConnections: active.map((c) => ({
        consentId: c.id,
        institutionId: c.institutionId ?? "unknown",
        scopes: c.grantedScopes,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
      })),
      expiredConnections: expired.length,
      revokedConnections: revoked.length,
      consentHistory: consents.map((c) => ({
        consentId: c.id,
        status: c.status,
        scopes: c.grantedScopes,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
        revokedAt: c.revokedAt,
      })),
    });
  });

  router.get("/oauth/authorize", requireAuth, async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const parsed = fdxAuthorizeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      await sendFdxError(req, res, 400, "400", "Invalid Request", "Invalid authorization request.");
      return;
    }
    const query = parsed.data;
    const consent = db.data.fdxConsents.find(
      (c) =>
        c.id === query.consent_id &&
        c.organizationId === req.auth?.organizationId &&
        c.status === "ACTIVE",
    );
    if (!consent) {
      await sendFdxError(req, res, 400, "400", "Invalid Request", "Consent is not active.");
      return;
    }
    const client = db.data.fdxOauthClients.find(
      (c) =>
        c.clientId === query.client_id &&
        c.organizationId === req.auth?.organizationId &&
        c.active,
    );
    if (!client || !client.redirectUris.includes(query.redirect_uri)) {
      await sendFdxError(req, res, 400, "400", "Invalid Request", "Invalid OAuth client or redirect URI.");
      return;
    }
    const consentScopes = new Set(consent.grantedScopes);
    const requestedScopes = query.scope.split(/\s+/).filter(Boolean);
    const unauthorizedScope = requestedScopes.find((s) => !consentScopes.has(s));
    if (unauthorizedScope) {
      await sendFdxError(req, res, 400, "400", "Invalid Scope", `Scope not granted by consent: ${unauthorizedScope}`);
      return;
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
    const code = crypto.randomUUID().replaceAll("-", "");
    db.data.fdxAuthorizationCodes.push({
      code,
      organizationId: req.auth.organizationId,
      customerId: consent.customerId,
      consentId: consent.id,
      clientId: client.clientId,
      redirectUri: query.redirect_uri,
      scope: requestedScopes,
      state: query.state,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    await persist();

    const redirect = new URL(query.redirect_uri);
    redirect.searchParams.set("code", code);
    if (query.state) redirect.searchParams.set("state", query.state);
    res.setHeader("x-fapi-interaction-id", interactionId(req));
    res.redirect(302, redirect.toString());
  });

  router.post("/oauth/token", async (req, res) => {
    await db.read();
    const payload = parseBody(fdxTokenExchangeSchema, req, res);
    if (!payload) return;
    const client = db.data.fdxOauthClients.find(
      (c) =>
        c.clientId === payload.client_id &&
        c.clientSecret === payload.client_secret &&
        c.active,
    );
    if (!client) {
      await sendFdxError(req, res, 401, "401", "Unauthorized", "Invalid client credentials.");
      return;
    }

    const authCode = db.data.fdxAuthorizationCodes.find((c) => c.code === payload.code);
    if (!authCode || authCode.clientId !== client.clientId || authCode.redirectUri !== payload.redirect_uri) {
      await sendFdxError(req, res, 400, "400", "Invalid Request", "Invalid authorization code.");
      return;
    }
    if (authCode.usedAt) {
      await sendFdxError(req, res, 400, "400", "Invalid Grant", "Authorization code already used.");
      return;
    }
    if (new Date(authCode.expiresAt) <= new Date()) {
      await sendFdxError(req, res, 400, "400", "Invalid Grant", "Authorization code expired.");
      return;
    }
    const consent = db.data.fdxConsents.find(
      (c) => c.id === authCode.consentId && c.status === "ACTIVE",
    );
    if (!consent) {
      await sendFdxError(req, res, 400, "400", "Invalid Grant", "Consent is not active.");
      return;
    }

    authCode.usedAt = new Date().toISOString();
    const tokenValue = crypto.randomUUID().replaceAll("-", "");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.data.fdxAccessTokens.push({
      token: tokenValue,
      organizationId: client.organizationId,
      customerId: authCode.customerId,
      consentId: authCode.consentId,
      scope: authCode.scope,
      clientId: client.clientId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    await persist();

    await sendSignedJson(req, res, 201, {
      access_token: tokenValue,
      token_type: "Bearer",
      expires_in: 3600,
      scope: authCode.scope.join(" "),
      consent_id: authCode.consentId,
    });
  });

  router.get("/customers/:customerId/accounts", requireFdxToken, async (req: FdxRequest, res) => {
    await db.read();
    const token = req.fdxToken;
    if (!token) return;
    if (token.customerId !== req.params.customerId) {
      await sendFdxError(req, res, 403, "403", "Forbidden", "Token not valid for customer.");
      return;
    }
    const profile = latestProfileForCustomer(req.params.customerId);
    if (!profile) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Customer profile not found.");
      return;
    }

    const accounts = [
      ...profile.inputs.registered.map((r) => mapRegisteredAccount(req.params.customerId, r)),
      ...profile.inputs.nonRegistered.map((n) => mapNonRegisteredAccount(req.params.customerId, n)),
    ];
    await sendSignedJson(req, res, 200, {
      links: {
        self: `/api/fdx/v5/customers/${req.params.customerId}/accounts`,
      },
      data: {
        customerId: req.params.customerId,
        accounts,
      },
    });
  });

  router.get("/accounts/:accountId", requireFdxToken, async (req: FdxRequest, res) => {
    await db.read();
    const token = req.fdxToken;
    if (!token) return;
    const profile = latestProfileForCustomer(token.customerId);
    if (!profile) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Customer profile not found.");
      return;
    }
    const accounts = [
      ...profile.inputs.registered.map((r) => mapRegisteredAccount(token.customerId, r)),
      ...profile.inputs.nonRegistered.map((n) => mapNonRegisteredAccount(token.customerId, n)),
    ];
    const account = accounts.find((a) => a.accountId === req.params.accountId);
    if (!account) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Account not found.");
      return;
    }
    await sendSignedJson(req, res, 200, {
      links: {
        self: `/api/fdx/v5/accounts/${req.params.accountId}`,
      },
      data: account,
    });
  });

  router.get("/accounts/:accountId/transactions", requireFdxToken, async (req: FdxRequest, res) => {
    await db.read();
    const token = req.fdxToken;
    if (!token) return;
    const profile = latestProfileForCustomer(token.customerId);
    if (!profile) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Customer profile not found.");
      return;
    }
    const accounts = [
      ...profile.inputs.registered.map((r) => mapRegisteredAccount(token.customerId, r)),
      ...profile.inputs.nonRegistered.map((n) => mapNonRegisteredAccount(token.customerId, n)),
    ];
    const account = accounts.find((a) => a.accountId === req.params.accountId);
    if (!account) {
      await sendFdxError(req, res, 404, "404", "Not Found", "Account not found.");
      return;
    }
    const matchedRegistered = profile.inputs.registered.find(
      (r) => `${token.customerId}-${r.type}` === account.accountId,
    );
    const txs = syntheticTransactions(
      token.customerId,
      account.accountId,
      matchedRegistered?.annualContribution ?? 500,
    );
    await sendSignedJson(req, res, 200, {
      links: {
        self: `/api/fdx/v5/accounts/${req.params.accountId}/transactions`,
      },
      data: {
        accountId: account.accountId,
        transactions: txs,
      },
    });
  });

  return router;
}

import { CompactSign, exportJWK, generateKeyPair } from "jose";

const encoder = new TextEncoder();
const KID = "fdx-fapi-rs256-key-1";

let keyPairPromise: Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> | null = null;
let publicJwkPromise: Promise<Record<string, unknown>> | null = null;

async function getKeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  if (!keyPairPromise) {
    keyPairPromise = generateKeyPair("RS256");
  }
  return keyPairPromise;
}

async function getPrivateKey(): Promise<CryptoKey> {
  return (await getKeyPair()).privateKey;
}

async function getPublicJwk(): Promise<Record<string, unknown>> {
  if (!publicJwkPromise) {
    publicJwkPromise = getKeyPair().then(async ({ publicKey }) => {
      const jwk = await exportJWK(publicKey);
      return {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: KID,
      };
    });
  }
  return publicJwkPromise;
}

export async function signResponsePayload(payload: unknown): Promise<string> {
  const privateKey = await getPrivateKey();
  const bytes = encoder.encode(JSON.stringify(payload));
  return new CompactSign(bytes)
    .setProtectedHeader({
      alg: "RS256",
      kid: KID,
      typ: "JOSE",
    })
    .sign(privateKey);
}

export async function jwksResponse(): Promise<{ keys: Record<string, unknown>[] }> {
  return {
    keys: [await getPublicJwk()],
  };
}

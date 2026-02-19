import type { AuthContext, DbState } from "../../domain/types";

export function scoped<T extends { organizationId: string }>(state: DbState, auth: AuthContext, key: keyof DbState): T[] {
  const collection = state[key] as unknown as T[];
  return collection.filter((row) => row.organizationId === auth.organizationId);
}

import fs from "node:fs/promises";
import path from "node:path";
import { db, initDb, persist } from "../db/store";

type Patch = {
  securityPolicies?: unknown[];
  analyticsConfigs?: unknown[];
  notificationTemplates?: unknown[];
  notificationRules?: unknown[];
};

async function run(): Promise<void> {
  await initDb();
  const patchPath = process.argv[2] ?? path.resolve(process.cwd(), "data", "db.patch.json");
  const raw = await fs.readFile(patchPath, "utf8");
  const patch = JSON.parse(raw) as Patch;

  await db.read();
  if (patch.securityPolicies) {
    db.data.securityPolicies = patch.securityPolicies as typeof db.data.securityPolicies;
  }
  if (patch.analyticsConfigs) {
    db.data.analyticsConfigs = patch.analyticsConfigs as typeof db.data.analyticsConfigs;
  }
  if (patch.notificationTemplates) {
    db.data.notificationTemplates =
      patch.notificationTemplates as typeof db.data.notificationTemplates;
  }
  if (patch.notificationRules) {
    db.data.notificationRules = patch.notificationRules as typeof db.data.notificationRules;
  }
  await persist();
  console.log(`Applied DB patch from ${patchPath}`);
}

run().catch((err: unknown) => {
  console.error("Failed applying DB patch", err);
  process.exit(1);
});

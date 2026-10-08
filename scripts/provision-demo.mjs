import {randomBytes} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import pg from "pg";
import {assertTarget} from "./migrate.mjs";
import {demoIds} from "./seed-demo.mjs";

const accounts = [
  {key: "owner", email: "proprietaire.demo@immopay.test", name: "Georgeo Démo", kind: "owner", org: demoIds.ownerOrg, role: "owner"},
  {key: "agency", email: "agence.demo@immopay.test", name: "Gestionnaire Démo", kind: "agency_manager", org: demoIds.agencyOrg, role: "agency_manager"},
  {key: "tenant", email: "locataire.demo@immopay.test", name: "Paul Adjovi", kind: "tenant", org: null, role: null},
];

async function readCredentials(file) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function ensureAuthUser(client, authUrl, account, password) {
  const existing = await client.query('SELECT id FROM neon_auth."user" WHERE email=$1', [account.email]);
  if (existing.rows[0]) {
    const response = await fetch(`${authUrl.replace(/\/$/, "")}/sign-in/email`, {
      method: "POST",
      headers: {"content-type": "application/json", "origin": "http://localhost:3002"},
      body: JSON.stringify({email: account.email, password}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.user?.id !== existing.rows[0].id) {
      throw new Error(`Existing ${account.key} Auth user is not controlled by these demo credentials`);
    }
    return existing.rows[0].id;
  }
  const response = await fetch(`${authUrl.replace(/\/$/, "")}/sign-up/email`, {
    method: "POST",
    headers: {"content-type": "application/json", "origin": "http://localhost:3002"},
    body: JSON.stringify({name: account.name, email: account.email, password}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Neon Auth rejected ${account.key} signup: HTTP ${response.status} ${body.code ?? ""}`);
  const authUserId = body?.user?.id;
  if (!authUserId) throw new Error(`Neon Auth did not return a user ID for ${account.key}`);
  return authUserId;
}

export async function provisionDemo({connectionString, authUrl, credentialsFile}) {
  if (!authUrl) throw new Error("NEON_AUTH_BASE_URL is required");
  const credentials = await readCredentials(credentialsFile);
  for (const account of accounts) {
    credentials[account.key] ??= {email: account.email, password: randomBytes(24).toString("base64url")};
  }
  await writeFile(credentialsFile, `${JSON.stringify(credentials, null, 2)}\n`, {mode: 0o600});
  const client = new pg.Client({connectionString});
  await client.connect();
  try {
    for (const account of accounts) {
      const authUserId = await ensureAuthUser(client, authUrl, account, credentials[account.key].password);
      await client.query("BEGIN");
      try {
        const existing = await client.query("SELECT kind, email FROM profiles WHERE auth_user_id=$1", [authUserId]);
        if (existing.rows[0] && existing.rows[0].email !== account.email) throw new Error("Auth identity is already linked to another profile");
        await client.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email,immopay_id)
          VALUES($1,$2,$3,$4,$5)
          ON CONFLICT(auth_user_id) DO UPDATE SET full_name=EXCLUDED.full_name,kind=EXCLUDED.kind,email=EXCLUDED.email,immopay_id=EXCLUDED.immopay_id`,
          [authUserId, account.name, account.kind, account.email, account.kind === "tenant" ? "IMP-7K3F9Q" : null]);
        if (account.org) {
          await client.query(`INSERT INTO organization_members(organization_id,auth_user_id,role)
            VALUES($1,$2,$3) ON CONFLICT(organization_id,auth_user_id) DO UPDATE SET role=EXCLUDED.role`,
            [account.org, authUserId, account.role]);
          if (account.role === "owner") await client.query("UPDATE organizations SET created_by_auth_user_id=$1 WHERE id=$2 AND is_demo", [authUserId, account.org]);
        } else {
          await client.query("UPDATE tenants SET auth_user_id=$1 WHERE id=ANY($2::uuid[]) AND organization_id IN ($3,$4)",
            [authUserId, [demoIds.paulOwner, demoIds.paulAgency], demoIds.ownerOrg, demoIds.agencyOrg]);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
  return {accounts: accounts.map(({key, email}) => ({key, email})), credentialsFile};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertTarget();
    const credentialsFile = path.resolve(process.env.DEMO_CREDENTIALS_FILE ?? ".env.demo-credentials.local");
    const result = await provisionDemo({
      connectionString: process.env.DATABASE_URL_UNPOOLED,
      authUrl: process.env.NEON_AUTH_BASE_URL,
      credentialsFile,
    });
    process.stdout.write(`Provisioned ${result.accounts.length} demo identities; credentials stored in ${result.credentialsFile}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

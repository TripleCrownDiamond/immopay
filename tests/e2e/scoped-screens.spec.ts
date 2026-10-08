import {readFileSync} from "node:fs";
import {test, expect, type Page} from "@playwright/test";
const credentials=JSON.parse(readFileSync(".env.demo-credentials.local","utf8"));
async function signIn(page:Page, role:"owner"|"agency"|"tenant") {
  await page.goto(role==="tenant"?"/espace-locataire/connexion":"/login");
  await page.getByLabel("Email").fill(credentials[role].email);
  await page.getByLabel("Mot de passe").fill(credentials[role].password);
  await page.getByRole("button",{name:"Se connecter"}).click();
  await expect(page).toHaveURL(role==="tenant"?/\/espace-locataire$/:/\/dashboard$/,{timeout:20_000});
}
test("owner sees only owner organization",async({page})=>{
  await signIn(page,"owner");
  await expect(page.getByText("Résidence Démo")).toBeVisible();
  await page.goto("/properties");
  await expect(page.getByText("Résidence Les Cocotiers")).toBeVisible();
  await expect(page.getByText("Boutiques Cadjèhoun")).toHaveCount(0);
  await page.goto("/payments");
  await expect(page.getByText("Paul Adjovi")).toBeVisible();
});
test("agency manager sees only agency organization",async({page})=>{
  await signIn(page,"agency");
  await page.goto("/properties");
  await expect(page.getByText("Boutiques Cadjèhoun")).toBeVisible();
  await expect(page.getByText("Résidence Les Cocotiers")).toHaveCount(0);
});
test("tenant sees own receipts across organizations and cannot open owner dashboard",async({page})=>{
  await signIn(page,"tenant");
  await expect(page.getByRole("heading",{name:"Bonjour Paul"})).toBeVisible();
  await page.goto("/espace-locataire/quittances");
  await expect(page.getByText("IMP-25-09A3")).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Vérifier"})).toHaveCount(1);
  await page.goto("/espace-locataire/historique");
  await expect(page.getByText("Résidence Démo")).toBeVisible();
  await expect(page.getByText("Agence Démo")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("Bonjour Georgeo")).toHaveCount(0);
});
test("wrong password is rejected",async({page})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.owner.email);
  await page.getByLabel("Mot de passe").fill("wrong-password-123");
  await page.getByRole("button",{name:"Se connecter"}).click();
  await expect(page.locator("main p[role=alert]")).toBeVisible({timeout:20_000});
  await expect(page).toHaveURL(/\/login$/);
});
test("signup creates one owner organization without role selection",async({page})=>{
  const email=`owner-${Date.now()}@immopay.test`;
  await page.goto("/signup");
  await page.getByLabel("Nom complet").fill("Nouvelle Démo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(`S-${crypto.randomUUID()}-9`);
  await page.getByRole("button",{name:"Créer mon compte"}).click();
  await expect(page).toHaveURL(/\/dashboard$/,{timeout:25_000});
  await expect(page.getByText("Locations de Nouvelle Démo")).toBeVisible();
  await page.goto("/properties");
  await expect(page.getByText("Aucun bien dans cet espace")).toBeVisible();
  const first=await page.request.post("/api/account/bootstrap",{data:{}});
  const second=await page.request.post("/api/account/bootstrap",{data:{}});
  expect(first.ok()).toBeTruthy();
  expect(second.ok()).toBeTruthy();
  expect((await first.json()).organizationId).toBe((await second.json()).organizationId);
});

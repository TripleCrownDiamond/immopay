import {readFileSync} from "node:fs";
import {test, expect} from "@playwright/test";

const credentials=JSON.parse(readFileSync(".env.demo-credentials.local","utf8"));
test.setTimeout(180_000);

test("a new agency invites a manager into its own dashboard",async({page,browser})=>{
  const suffix=Date.now();
  const ownerEmail=`agency-owner-${suffix}@immopay.test`;
  const managerEmail=`agency-manager-${suffix}@immopay.test`;
  await page.goto("/signup/agence");
  await expect(page.getByRole("heading",{name:"Créer l’espace de mon agence"})).toBeVisible();
  await page.getByLabel("Votre nom").fill("Nadia Test");
  await page.getByLabel("Nom de l’agence").fill(`Agence Test ${suffix}`);
  await page.getByLabel("Email professionnel").fill(ownerEmail);
  await page.getByLabel("Mot de passe").fill(`A-${crypto.randomUUID()}-9`);
  await page.getByRole("button",{name:"Créer mon agence"}).click();
  await expect(page).toHaveURL(/\/dashboard$/,{timeout:60_000});
  await expect(page.getByText(`Agence Test ${suffix}`)).toBeVisible();
  await page.goto("/settings");
  await page.getByLabel("Email du destinataire").first().fill(managerEmail);
  await page.getByRole("button",{name:"Créer un lien"}).first().click();
  const link=await page.getByLabel("Lien d’invitation").inputValue();
  expect(link).toContain("/invitation/");
  const managerContext=await browser.newContext();
  const managerPage=await managerContext.newPage();
  try {
    await managerPage.goto(link);
    await expect(managerPage.getByRole("heading",{name:`Rejoindre Agence Test ${suffix}`})).toBeVisible();
    await managerPage.getByLabel("Nom complet").fill("Collègue Test");
    await managerPage.getByLabel("Email invité").fill(managerEmail);
    await managerPage.getByLabel("Mot de passe").fill(`M-${crypto.randomUUID()}-9`);
    await managerPage.getByRole("button",{name:"Créer et accepter"}).click();
    await expect(managerPage).toHaveURL(/\/dashboard$/,{timeout:35_000});
    await expect(managerPage.getByText(`Agence Test ${suffix}`)).toBeVisible();
  } finally {await managerContext.close();}
});

test("a new tenant activates an invited account and sees an empty private space",async({page,browser})=>{
  const email=`tenant-invite-${Date.now()}@immopay.test`;
  const tenantName=`Locataire Test ${Date.now()}`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.owner.email);
  await page.getByLabel("Mot de passe").fill(credentials.owner.password);
  await page.getByRole("button",{name:"Se connecter"}).click();
  await expect(page).toHaveURL(/\/dashboard$/,{timeout:35_000});
  await page.goto("/tenants/new");
  await page.getByLabel("Nom complet").fill(tenantName);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button",{name:"Ajouter le locataire"}).click();
  await expect(page).toHaveURL(/\/tenants$/,{timeout:35_000});
  const row=page.locator("article").filter({hasText:tenantName});
  await row.getByRole("button",{name:"Créer un lien"}).click();
  const link=await row.getByLabel("Lien d’invitation").inputValue();
  const tenantContext=await browser.newContext();
  const tenantPage=await tenantContext.newPage();
  try {
    await tenantPage.goto(link);
    await tenantPage.getByLabel("Nom complet").fill(tenantName);
    await tenantPage.getByLabel("Email invité").fill(email);
    await tenantPage.getByLabel("Mot de passe").fill(`T-${crypto.randomUUID()}-9`);
    await tenantPage.getByRole("button",{name:"Créer et accepter"}).click();
    await expect(tenantPage).toHaveURL(/\/espace-locataire$/,{timeout:35_000});
    await tenantPage.goto("/espace-locataire/historique");
    await expect(tenantPage.getByText("Aucune location enregistrée.")).toBeVisible();
  } finally {await tenantContext.close();}
});

test("password recovery does not reveal an unknown account",async({page})=>{
  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Email du compte").fill(`unknown-${Date.now()}@immopay.test`);
  await page.getByRole("button",{name:"Recevoir un lien"}).click();
  await expect(page.getByRole("status")).toHaveText("Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.",{timeout:20_000});
  await page.goto("/reinitialiser-mot-de-passe");
  await expect(page.locator("main p[role=alert]")).toHaveText("Ce lien est invalide ou expiré.");
});

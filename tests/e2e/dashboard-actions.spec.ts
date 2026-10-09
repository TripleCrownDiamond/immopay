import {expect,test} from "@playwright/test";

test("dashboard metrics and quick actions fit desktop and mobile",async({page})=>{
  await page.goto("/signup");
  await page.getByLabel("Nom complet").fill("Propriétaire Test");
  await page.getByLabel("Email").fill(`dashboard-${crypto.randomUUID()}@immopay.test`);
  await page.getByLabel("Mot de passe").fill(`D-${crypto.randomUUID()}-9`);
  await page.getByRole("button",{name:"Créer mon compte"}).click();
  await expect(page).toHaveURL(/\/dashboard$/,{timeout:35_000});
  for (const label of ["Attendu","Encaissé","Restant","En retard"]) await expect(page.getByText(label,{exact:true})).toBeVisible();
  await expect(page.getByRole("progressbar",{name:"Taux de recouvrement"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Ajouter un locataire/})).toHaveAttribute("href","/tenants/new");
  await expect(page.getByRole("link",{name:/Voir mes biens/})).toHaveAttribute("href","/properties");
  await expect(page.getByRole("link",{name:/Voir les paiements/})).toHaveAttribute("href","/payments");
  await page.setViewportSize({width:375,height:812});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

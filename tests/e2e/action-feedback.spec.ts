import {expect, test} from "@playwright/test";

test("signup confirmation survives a redirect to login only once", async ({page}) => {
  await page.goto("/login");
  await page.evaluate(() => sessionStorage.setItem("immopay.signup-flash.v1", JSON.stringify({
    kind: "owner", email: "test@example.com", step: "created",
  })));
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Compte créé",{timeout:15_000});
  await expect(page.getByRole("status")).toContainText("test@example.com");
  await page.reload();
  await expect(page.getByRole("status")).toHaveCount(0);
});

for (const status of [401,500] as const) test(`owner signup explains a ${status} space setup result`,async({page})=>{
  const email=`owner-feedback-${crypto.randomUUID()}@immopay.test`;
  await page.route("**/api/account/bootstrap",route=>route.fulfill({status,contentType:"application/json",body:'{"error":"TEST"}'}));
  await page.goto("/signup");
  await page.getByLabel("Nom complet").fill("Propriétaire Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(`P-${crypto.randomUUID()}-9`);
  await page.getByRole("button",{name:"Créer mon compte"}).click();
  await expect(page.getByRole("status")).toContainText(email,{timeout:20_000});
  await expect(page.locator("form").getByRole("link",{name:"Se connecter"})).toHaveAttribute("href","/login");
  await expect(page.getByRole("status")).toContainText(status===401?"Vérifiez votre email":"n’a pas pu être configuré");
});

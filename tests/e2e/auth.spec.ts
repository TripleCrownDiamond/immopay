import {readFileSync} from "node:fs";
import {test, expect} from "@playwright/test";

const credentials = JSON.parse(readFileSync(".env.demo-credentials.local", "utf8"));

test("owner signs in, keeps session, and signs out", async ({page}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.owner.email);
  await page.getByLabel("Mot de passe").fill(credentials.owner.password);
  await page.getByRole("button", {name: "Se connecter"}).click();
  await expect(page).toHaveURL(/\/dashboard$/, {timeout: 20_000});
  await page.reload();
  await expect(page.getByRole("button", {name: "Se déconnecter"})).toBeVisible();
  await page.getByRole("button", {name: "Se déconnecter"}).click();
  await expect(page).toHaveURL("http://localhost:3002/", {timeout: 20_000});
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

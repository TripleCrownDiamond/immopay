import {test,expect} from "@playwright/test";
test("known receipt verifies",async({page})=>{
  await page.goto("/verify/IMP-25-09A3");
  await expect(page.getByRole("heading",{name:"Quittance authentique"})).toBeVisible();
});
test("unknown receipt stays unavailable",async({page})=>{
  await page.goto("/verify/NO-SUCH-RECEIPT");
  await expect(page.getByRole("heading",{name:"Quittance introuvable"})).toBeVisible();
  await expect(page.getByText("Quittance authentique")).toHaveCount(0);
});

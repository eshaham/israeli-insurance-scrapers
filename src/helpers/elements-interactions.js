export async function waitUntilElementFound(page, elementName, hasToBeVisible = false) {
  await page.waitForSelector(`#${elementName}`, { visible: hasToBeVisible });
}

export async function fillInput(page, inputName, inputValue) {
  await page.type(`#${inputName}`, inputValue);
}

export async function clickButton(page, buttonName) {
  const button = await page.$(`#${buttonName}`);
  await button.click();
}

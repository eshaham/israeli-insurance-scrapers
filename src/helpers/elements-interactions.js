async function waitUntilElementFoundBySelector(page, selector, hasToBeVisible) {
  await page.waitForSelector(selector, { visible: hasToBeVisible });
}

export async function waitUntilElementFound(page, elementName, hasToBeVisible = false) {
  return waitUntilElementFoundBySelector(page, `#${elementName}`, { visible: hasToBeVisible });
}

export async function waitUntilElementFoundByClass(page, className, hasToBeVisible = false) {
  return waitUntilElementFoundBySelector(page, `.${className}`, { visible: hasToBeVisible });
}

export async function fillInput(page, inputName, inputValue) {
  await page.type(`#${inputName}`, inputValue);
}

export async function clickButton(page, buttonName) {
  const button = await page.$(`#${buttonName}`);
  await button.click();
}

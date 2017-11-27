import { LOGIN_RESULT } from '../constants';
import BaseScraper from './base-scraper';


const BASE_URL = 'https://www.clalbit.co.il';

async function findSiblingInputId(page, labelName) {
  return page.evaluate((labelName) => {
    const label = document.querySelector(`#${labelName}`);
    if (!label) {
      return null;
    }
    const container = label.parentElement;
    const input = container.querySelector('input');
    if (!input) {
      return null;
    }
    return input.id;
  }, labelName);
}

async function createLoginFields(page, credentials) {
  const idInput = await findSiblingInputId(page, 'lblId');
  if (!idInput) {
    throw new Error('Could not find ID input');
  }
  const passwordInput = await findSiblingInputId(page, 'lblPswd');
  if (!passwordInput) {
    throw new Error('Could not find password input');
  }
  return [
    { id: idInput, value: credentials.id },
    { id: passwordInput, value: credentials.password },
  ];
}

async function findSubmitButtonId(page) {
  await page.waitForSelector('.LoginButton');
  return page.evaluate(() => {
    const submitButton = document.querySelector('.LoginButton');
    if (!submitButton) {
      return null;
    }
    return submitButton.id;
  });
}

function getPossibleLoginResults() {
  const urls = {};
  urls[LOGIN_RESULT.SUCCESS] = `${BASE_URL}/portfolio/Pages/default.aspx`;
  urls[LOGIN_RESULT.INVALID_PASSWORD] = `${BASE_URL}/login/private/Pages/default.aspx?txtl=f`;
  return urls;
}

class ClalbitScraper extends BaseScraper {
  constructor(options) {
    super(options);

    this.loginUrl = `${BASE_URL}/login/private/Pages/default.aspx`;
  }

  async getLoginOptions(credentials) {
    const submitButtonId = await findSubmitButtonId(this.page);
    const fields = await createLoginFields(this.page, credentials);
    return {
      fields,
      submitButtonId,
      possibleResults: getPossibleLoginResults(),
    };
  }
}

export default ClalbitScraper;

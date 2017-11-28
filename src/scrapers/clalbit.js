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

async function getInsuranceData(page, lifeInsuranceRow) {
  const lifeInsuranceColumns = await lifeInsuranceRow.$$('td');

  const insuranceType = await page.evaluate((td) => {
    return td.innerText;
  }, lifeInsuranceColumns[0]);

  const productName = await page.evaluate((td) => {
    return td.innerText;
  }, lifeInsuranceColumns[1]);

  const insuranceNumberAnchor = await lifeInsuranceColumns[3].$('a');
  const insuranceNumber = await page.evaluate((anchor) => {
    return Number(anchor.innerText);
  }, insuranceNumberAnchor);
  const link = await page.evaluate((anchor) => {
    return anchor.getAttribute('href');
  }, insuranceNumberAnchor);

  const startDateStr = await page.evaluate((td) => {
    return td.innerText;
  }, lifeInsuranceColumns[4]);

  const endDateStr = await page.evaluate((td) => {
    return td.innerText;
  }, lifeInsuranceColumns[5]);

  const proceedsValue = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, lifeInsuranceColumns[6]);

  const liquidationValue = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, lifeInsuranceColumns[7]);

  const statusStr = await page.evaluate((td) => {
    return td.innerText;
  }, lifeInsuranceColumns[9]);

  return {
    insuranceType,
    productName,
    insuranceNumber,
    link,
    startDateStr,
    endDateStr,
    proceedsValue,
    liquidationValue,
    statusStr,
  };
}

async function getAccountData(page) {
  const tableSelector = '#LifeDiv table.MagorViewGrids';
  const rowsSelector = `${tableSelector} tr.BkNormalRow, ${tableSelector} tr.BkalternatRow`;
  const lifeInsuranceRows = await page.$$(rowsSelector);

  const lifeInsuranceResults = [];
  for (let i = 0; i < lifeInsuranceRows.length; i += 1) {
    lifeInsuranceResults.push(getInsuranceData(page, lifeInsuranceRows[i]));
  }
  const lifeInsurances = await Promise.all(lifeInsuranceResults);

  return {
    success: true,
    lifeInsurances,
  };
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

  async fetchData() {
    return getAccountData(this.page);
  }
}

export default ClalbitScraper;

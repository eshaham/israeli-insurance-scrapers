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

function getRowsSelector(parentId) {
  const tableSelector = `#${parentId} table.MagorViewGrids`;
  return `${tableSelector} tr.BkNormalRow, ${tableSelector} tr.BkalternatRow`;
}

async function getLifeInsuranceData(page, lifeInsuranceRow) {
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

async function getLifeInsurances(page) {
  const rowsSelector = getRowsSelector('LifeDiv');
  const lifeInsuranceRows = await page.$$(rowsSelector);

  const lifeInsuranceResults = [];
  for (let i = 0; i < lifeInsuranceRows.length; i += 1) {
    lifeInsuranceResults.push(getLifeInsuranceData(page, lifeInsuranceRows[i]));
  }
  return Promise.all(lifeInsuranceResults);
}

async function getPensionFundData(page, pensionFundRow) {
  const pensionFundColumns = await pensionFundRow.$$('td');

  const fundNameAnchor = await pensionFundColumns[0].$('a');
  const fundName = await page.evaluate((anchor) => {
    return anchor.innerText;
  }, fundNameAnchor);
  const link = await page.evaluate((anchor) => {
    return anchor.getAttribute('href');
  }, fundNameAnchor);

  const trackName = await page.evaluate((td) => {
    return td.innerText;
  }, pensionFundColumns[1]);

  const startDateStr = await page.evaluate((td) => {
    return td.innerText;
  }, pensionFundColumns[2]);

  const proceedsValue = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, pensionFundColumns[3]);

  const accumulatedValue = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, pensionFundColumns[4]);

  return {
    fundName,
    link,
    trackName,
    startDateStr,
    proceedsValue,
    accumulatedValue,
  };
}

async function getPensionFunds(page) {
  const rowsSelector = getRowsSelector('PensionDiv');
  const pensionFundRows = await page.$$(rowsSelector);

  const pensionFundResults = [];
  for (let i = 0; i < pensionFundRows.length; i += 1) {
    pensionFundResults.push(getPensionFundData(page, pensionFundRows[i]));
  }
  return Promise.all(pensionFundResults);
}

async function getAccountData(page) {
  const lifeInsurances = await getLifeInsurances(page);
  const pensionFunds = await getPensionFunds(page);

  return {
    success: true,
    lifeInsurances,
    pensionFunds,
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

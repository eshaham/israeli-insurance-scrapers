import { LOGIN_RESULT } from '../constants';
import runSequencially from '../helpers/promise';
import { waitUntilElementFoundByClass } from '../helpers/elements-interactions';
import { waitForNavigation } from '../helpers/navigation';
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

async function getDepositData(page, depositRow) {
  const depositColumns = await depositRow.$$('td');

  const nameNumberAnchor = await depositColumns[0].$('a');
  const nameNumber = await page.evaluate((anchor) => {
    return anchor.innerText;
  }, nameNumberAnchor);
  const link = await page.evaluate((anchor) => {
    return anchor.getAttribute('href');
  }, nameNumberAnchor);

  const dateStr = await page.evaluate((td) => {
    return td.innerText;
  }, depositColumns[2]);

  const employeePensionPayment = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[3]);

  const employeeOtherPayment = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[4]);

  const employeeIncomeProtectionInsurance = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[5]);

  const employerSeverencesPayment = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[6]);

  const employerPensionPayment = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[7]);

  const employerOtherPayment = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[8]);

  const employerIncomeProtectionInsurance = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[9]);

  const totalPayments = await page.evaluate((td) => {
    return Number(td.innerText.replace(',', ''));
  }, depositColumns[10]);

  return {
    nameNumber,
    link,
    dateStr,
    employeePensionPayment,
    employeeOtherPayment,
    employeeIncomeProtectionInsurance,
    employerSeverencesPayment,
    employerPensionPayment,
    employerOtherPayment,
    employerIncomeProtectionInsurance,
    totalPayments,
  };
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getDepositsData(page, pageIndex) {
  console.log('here1');
  if (pageIndex > 0) {
    await waitUntilElementFoundByClass(page, 'PagerButton', true);
    console.log('here2');
    const buttons = await page.$$('.Pager .PagerButton');
    await buttons[pageIndex].click();
    console.log('here3');
    // await waitForNavigation(page);
    console.log('here4');
  }
  await waitUntilElementFoundByClass(page, 'AllPolicies table.BasePortfolioGrid tr.DRow');
  console.log('here5');

  const depositsRows = await page.$$('.AllPolicies table.BasePortfolioGrid tr.DRow');
  const depositResults = [];
  for (let i = 0; i < depositsRows.length; i += 1) {
    depositResults.push(getDepositData(page, depositsRows[i]));
  }
  return Promise.all(depositResults);
}

async function getDepositReports(page) {
  const url = `${BASE_URL}/portfolio/personalreports/insdepositing/Pages/default.aspx`;
  await page.goto(url);
  await waitUntilElementFoundByClass(page, 'PortfolioDepositsByDatesWP');

  const searchArea = await page.$('.PortfolioDepositsByDatesWP');
  const yearRadioButton = await searchArea.$('input[type=radio][value=ctlRdbYearRange]');
  await yearRadioButton.click();
  const submitButton = await searchArea.$('input.NormalTxt');
  await submitButton.click();

  await waitForNavigation(page);
  await waitUntilElementFoundByClass(page, 'PagerButton');
  const buttons = await page.$$('.Pager .PagerButton');
  const numPages = buttons.length - 1;

  const results = [];
  for (let i = 0; i < numPages; i += 1) {
    const result = await getDepositsData(page, i);
    results.push(result);
  }
  return results;
}

function getDashboardRowsSelector(parentId) {
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
  const rowsSelector = getDashboardRowsSelector('LifeDiv');
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
  const rowsSelector = getDashboardRowsSelector('PensionDiv');
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
  const depositReports = await getDepositReports(page);
  console.log(depositReports);

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

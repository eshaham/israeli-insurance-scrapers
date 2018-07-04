import { EventEmitter } from 'events';
import puppeteer from 'puppeteer';

import { SCRAPE_PROGRESS_TYPES, LOGIN_RESULT, NAVIGATION_ERRORS, GENERAL_ERROR } from '../constants';
import { waitUntilElementFound, fillInput, clickButton } from '../helpers/elements-interactions';
import { waitForNavigation } from '../helpers/navigation';

const SCRAPE_PROGRESS = 'SCRAPE_PROGRESS';

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function handleLoginResult(scraper, loginResult) {
  switch (loginResult) {
    case LOGIN_RESULT.SUCCESS:
      scraper.emitProgress(SCRAPE_PROGRESS_TYPES.LOGIN_SUCCESS);
      return { success: true };
    case LOGIN_RESULT.INVALID_PASSWORD:
    case LOGIN_RESULT.CHANGE_PASSWORD:
      scraper.emitProgress(SCRAPE_PROGRESS_TYPES.LOGIN_FAILED);
      return {
        success: false,
        errorType: loginResult,
      };
    default:
      throw new Error(`unexpected login result "${loginResult}"`);
  }
}

function createErrorResult(errorType, errorMessage) {
  return {
    success: false,
    errorType,
    errorMessage,
  };
}

function createTimeoutError(errorMessage) {
  return createErrorResult(NAVIGATION_ERRORS.TIMEOUT, errorMessage);
}

function createGenericNavigationError(errorMessage) {
  return createErrorResult(NAVIGATION_ERRORS.GENERIC, errorMessage);
}

function createGeneralError() {
  return createErrorResult(GENERAL_ERROR);
}

class BaseScraper {
  constructor(options) {
    this.options = options;
    this.eventEmitter = new EventEmitter();
  }

  async scrape(credentials) {
    this.emitProgress(SCRAPE_PROGRESS_TYPES.START_SCRAPING);
    await this.initialize();

    let loginResult;
    try {
      loginResult = await this.login(credentials);
    } catch (e) {
      loginResult = e.timeout ?
        createTimeoutError(e.message) :
        createGenericNavigationError(e.message);
    }

    let scrapeResult;
    if (loginResult.success) {
      try {
        scrapeResult = await this.fetchData();
      } catch (e) {
        scrapeResult =
          e.timeout ?
            createTimeoutError(e.message) :
            createGenericNavigationError(e.message);
      }
    } else {
      scrapeResult = loginResult;
    }

    await this.terminate();
    this.emitProgress(SCRAPE_PROGRESS_TYPES.END_SCRAPING);

    return scrapeResult;
  }

  async initialize() {
    let env = null;
    if (this.options.verbose) {
      env = Object.assign({ DEBUG: '*' }, process.env);
    }
    this.browser = await puppeteer.launch({ env, headless: false });
    this.page = await this.browser.newPage();
  }

  getLoginOptions() {
    throw new Error(`getLoginOptions() is not created in ${this.options.companyId}`);
  }

  async login(credentials) {
    if (!credentials) {
      return createGeneralError();
    }

    if (!this.loginUrl) {
      throw new Error(`loginUrl is not set in ${this.options.companyId}`);
    }
    await this.page.goto(this.loginUrl);

    const options = await this.getLoginOptions(credentials);
    await waitUntilElementFound(this.page, options.submitButtonId);

    await this.fillInputs(options.fields);
    await clickButton(this.page, options.submitButtonId);
    this.emitProgress(SCRAPE_PROGRESS_TYPES.LOGGING_IN);

    if (options.postAction) {
      await options.postAction();
    } else {
      await waitForNavigation(this.page);
    }

    const current = await this.page.url();
    const loginResult = getKeyByValue(options.possibleResults, current);
    return handleLoginResult(this, loginResult);
  }

  fetchData() {
    throw new Error(`fetchData() is not created in ${this.options.companyId}`);
  }

  async terminate() {
    await this.browser.close();
  }

  async fillInputs(fields) {
    const modified = [...fields];
    const input = modified.shift();
    await fillInput(this.page, input.id, input.value);
    if (modified.length) {
      return this.fillInputs(modified);
    }
    return null;
  }

  emitProgress(type) {
    this.emit(SCRAPE_PROGRESS, { type });
  }

  emit(eventName, payload) {
    this.eventEmitter.emit(eventName, this.options.companyId, payload);
  }

  onProgress(func) {
    this.eventEmitter.on(SCRAPE_PROGRESS, func);
  }
}

export default BaseScraper;

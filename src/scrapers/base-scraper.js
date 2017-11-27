import { EventEmitter } from 'events';
import puppeteer from 'puppeteer';
import SCRAPE_PROGRESS_TYPES from '../constants';

const SCRAPE_PROGRESS = 'SCRAPE_PROGRESS';

class BaseScraper {
  constructor(options) {
    this.options = options;
    this.eventEmitter = new EventEmitter();
  }

  async scrape() {
    this.emitProgress(SCRAPE_PROGRESS_TYPES.START_SCRAPING);
    await this.initialize();

    await this.terminate();
    this.emitProgress(SCRAPE_PROGRESS_TYPES.END_SCRAPING);
  }

  async initialize() {
    let env = null;
    if (this.options.verbose) {
      env = Object.assign({ DEBUG: '*' }, process.env);
    }
    this.browser = await puppeteer.launch({ env });
    this.page = await this.browser.newPage();
  }

  async terminate() {
    await this.browser.close();
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

import { EventEmitter } from 'events';
import SCRAPE_PROGRESS_TYPES from '../constants';

const SCRAPE_PROGRESS = 'SCRAPE_PROGRESS';

class BaseScraper {
  constructor(options) {
    this.options = options;
    this.eventEmitter = new EventEmitter();
  }

  scrape() {
    this.emitProgress(SCRAPE_PROGRESS_TYPES.START_SCRAPING);
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

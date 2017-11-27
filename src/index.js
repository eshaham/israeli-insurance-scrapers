import 'babel-polyfill';

import ClalbitScraper from './scrapers/clalbit';

const scrapers = {
  clalbit: ClalbitScraper,
};

export function createScraper(options) {
  if (!scrapers[options.companyId]) {
    return null;
  }

  return new scrapers[options.companyId](options);
}

export { default as SCRAPE_PROGRESS_TYPES } from './constants';

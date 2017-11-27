export default class TimeoutError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }

    this.timeout = true;
  }
}

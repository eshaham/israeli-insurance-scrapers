import TimeoutError from '../errors';

function timeoutPromise(ms, promise, description) {
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new TimeoutError(description));
    }, ms);
  });

  return Promise.race([
    promise,
    timeout,
  ]);
}

export default function waitUntil(asyncTest, description = null, timeout = 10000, interval = 100) {
  const promise = new Promise((resolve, reject) => {
    function wait() {
      asyncTest().then((value) => {
        if (value === true) {
          resolve();
        } else {
          setTimeout(wait, interval);
        }
      }).catch(() => {
        reject();
      });
    }
    wait();
  });
  return timeoutPromise(timeout, promise, description);
}

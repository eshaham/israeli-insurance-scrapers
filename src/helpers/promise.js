export default async function runSequencially(tasks) {
  return tasks.reduce((promiseChain, currentTask) => {
    return promiseChain.then(chainResults =>
      currentTask.then((currentResult) => {
        return [...chainResults, currentResult];
      }));
  }, Promise.resolve([]));
}

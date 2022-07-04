import { curryN, has } from 'ramda';

export const globalCaches = {};

/**
 * Takes a string-returning function `keyGen` and a function `fn` and returns
 * a new function that returns cached results for subsequent
 * calls with the same arguments.
 *
 * When the function is invoked, `keyGen` is applied to the same arguments
 * and its result becomes the cache key. If the cache contains something
 * under that key, the function simply returns it and does not invoke `fn` at all.
 *
 * Otherwise `fn` is applied to the same arguments and its return value
 * is cached under that key and returned by the function.
 *
 * Care must be taken when implementing `keyGen` to avoid key collision,
 * or if tracking references, memory leaks and mutating arguments.
 *
 * The cache is saved in global variable which named `globalCaches`.
 *
 * @function
 * @param {string} name The name of cache set in global.
 * @param {Function} keyGen The function to generate the cache key.
 * @param {Function} fn The function to memoize.
 * @param {Function} cacheFn Handle argument for condition enable cached when return is true. Default return is always true.
 * @returns {Function} Memoized version of `fn`.
 */
const createMemoizeWith = (name, keyGen, fn, cacheFn = () => true) => {
  globalCaches[name] ||= {};
  const cache = globalCaches[name];
  const isAsync = fn.constructor.name === 'AsyncFunction';

  const handleCache = (key, data) => {
    cache[key] = data;
    return cache[key];
  };

  return curryN(fn.length, (...args) => {
    if (!cacheFn(...args)) { return fn(...args); }

    const key = keyGen(...args);

    // if cached
    if (has(key, cache)) { return cache[key]; }

    // if not
    const executor = fn(...args);

    return isAsync
      ? executor.then(res => handleCache(key, res))
      : handleCache(key, executor);
  });
};

export default createMemoizeWith;

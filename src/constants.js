export const CACHE_MEM_KEY = 'driver.mem';
export const CACHE_MONGO_KEY = 'driver.mongo';
export const CACHE_FS_KEY = 'driver.fs';
export const DIRECTORY_MIME = 'inode/directory';

/**
 * Driver structure.
 *
 * @global
 * @typedef {object} Driver
 * @property {Function} getCollection Default get collection.
 * @property {Function} close Default close.
 */
export const DRIVER = {
  getCollection () {},
  close () {}
};

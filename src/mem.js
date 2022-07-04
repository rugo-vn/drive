import { join } from 'path';
import fs from 'fs';

import { Low, JSONFile } from 'lowdb';
import { curry, prop, curryN } from 'ramda';
import { BaseCollection } from '@rugo-vn/common';

import createMemoizeWith from './memoize.js';
import { CACHE_MEM_KEY, DRIVER } from './constants.js';

/**
 * Create a new document
 *
 * @async
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {Document} doc A document to be created. Required.
 * @returns {Document} A created document.
 */
const doCreate = async (db, doc) => {
  const newDoc = await BaseCollection.create(db.data, doc);
  await db.write();
  return newDoc;
};

/**
 * Get a document by id.
 *
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {*} id Id of document need to find.
 * @returns {Document} Document needed.
 */
const doGet = (db, id) => BaseCollection.get(db.data, id);

/**
 * Count document by query.
 *
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {object} query Match exact query object.
 * @returns {number} Count.
 */
const doCount = (db, query) => BaseCollection.count(db.data, query);

/**
 * List documents.
 *
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {object} query Match exact query object.
 * @param {object} controls Control list result, maybe contains: $limit, $sort, $skip
 * @returns {object} List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).
 */
const doList = (db, query, controls = {}) => BaseCollection.list(db.data, query, controls);

/**
 * Patch documents.
 *
 * @async
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {object} query Match exact query object.
 * @param {object} controls Control list result, maybe contains: $set, $inc.
 * @returns {number} No of changed documents.
 */
const doPatch = async (db, query, controls = {}) => {
  const result = await BaseCollection.patch(db.data, query, controls);
  await db.write();

  return result;
};

/**
 * Remove documents
 *
 * @param {LowDB} db LowDB object, for read and write. Required.
 * @param {object} query Match exact query object.
 * @returns {number} No removed document.
 */
const doRemove = async (db, query) => {
  const result = await BaseCollection.remove(db.data, query);
  await db.write();

  return result;
};

const doImport = async (db, filePath) => {
  db.data = JSON.parse(fs.readFileSync(filePath).toString());
  await db.write();
  return true;
};

/**
 * Get collection for data processing. Each collection is stored with one file.
 *
 * @async
 * @param {string} root Root directory to store collection. Required.
 * @param {string} name Collection name. Required.
 * @returns {Collection} Collection handlers.
 */
const getCollection = async (root, name) => {
  const file = join(root, name);
  const adapter = new JSONFile(file);
  const db = new Low(adapter);

  await db.read();

  db.data ||= [];

  await db.write();

  return {
    ...BaseCollection,

    create: curry(doCreate)(db),
    get: curry(doGet)(db),
    count: curry(doCount)(db),
    list: curryN(2, doList)(db),
    patch: curryN(2, doPatch)(db),
    remove: curry(doRemove)(db),

    export: () => file,
    import: curry(doImport)(db)
  };
};

const memoizedGetCollection = createMemoizeWith(CACHE_MEM_KEY, join, getCollection);

/**
 * Mem Driver is a driver store data in memory and file system. It's fast, lightweight and ready for quick saving.
 *
 * It use LowDB as a core for read and save. Ramda is used for data query.
 *
 * This function create Mem Driver for use.
 *
 * @async
 * @param {object} config Driver configuration.
 * @param {string} config.root Root directory to store collection. Required.
 * @param {boolean} config.cache Enable cache. Default: `false`.
 * @returns {Driver} Driver handler.
 */
const createMemDriver = async ({ root, cache }) => {
  return {
    ...DRIVER,

    getCollection: (cache ? memoizedGetCollection : curry(getCollection))(root)
  };
};
const memoizedCreateMemDriver = createMemoizeWith(CACHE_MEM_KEY, prop('root'), createMemDriver, prop('cache'));

export default memoizedCreateMemDriver;

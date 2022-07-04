import { join } from 'path';

import { clone, curry, curryN, identity, prop } from 'ramda';
import { ObjectId, MongoClient } from 'mongodb';
import { DEFAULT_LIMIT, EmptyCollection, generateId, exec } from '@rugo-vn/common';

import { CACHE_MONGO_KEY, DRIVER } from './constants.js';
import createMemoizeWith from './memoize.js';
// import log from './log.js';

/**
 * Get MongoDB instance.
 *
 * @async
 * @param {string} uri MongoDB connection string.
 * @returns {MongoInstance} Custom MongoDB Instance
 */
const getDatabase = async (uri) => {
  const client = await new Promise((resolve, reject) => {
    MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, _client) {
      if (err) {
        reject(err);
        return;
      }

      const client = _client;
      // log('connected to mongodb server');

      resolve(client);
    });
  });

  /**
   * @typedef {object} MongoInstance
   * @property {string} uri Mongodb connection string.
   * @property {object} client Mongodb client.
   * @property {object} db Db instance.
   */
  return {
    uri,
    client,
    db: client.db()
  };
};
const memoizedGetDatabase = createMemoizeWith(CACHE_MONGO_KEY, identity, getDatabase);

/**
 * Create a new document
 *
 * @param {MongoCollection} collection MongoDB collection.
 * @param {object} doc A document to be created. Required.
 * @returns {Document} A created document.
 */
const doCreate = async (collection, doc) => {
  const newDoc = clone(doc);
  await collection.insertOne(newDoc);
  return newDoc; // await doGet(collection, res.insertedId);
};

/**
 * Get a document by id.
 *
 * @async
 * @param {MongoCollection} collection MongoDB collection.
 * @param {ObjectId} id Id of document need to find.
 * @returns {Document} Document needed.
 */
const doGet = async (collection, id) => {
  return await collection.findOne({ _id: ObjectId(id) });
};

/**
 * Count document by query.
 *
 * @async
 * @param {MongoCollection} collection MongoDB collection.
 * @param {object} query Match exact query object.
 * @returns {number} Count.
 */
const doCount = async (collection, query) => {
  return await collection.countDocuments(query);
};

/**
 * List documents.
 *
 * @async
 * @param {MongoCollection} collection MongoDB collection.
 * @param {object} query Match exact query object.
 * @param {object} controls Control list result, maybe contains: $limit, $sort, $skip
 * @returns {object} List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).
 */
const doList = async (collection, query, controls = {}) => {
  let queryBuilder = collection.find(query);

  if (controls.$sort) {
    queryBuilder = queryBuilder.sort(controls.$sort);
  }

  if (controls.$skip) {
    queryBuilder = queryBuilder.skip(controls.$skip);
  }

  const limit = typeof controls.$limit === 'number' ? controls.$limit : DEFAULT_LIMIT;
  if (limit !== -1) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return {
    total: await doCount(collection, query),
    skip: controls.$skip || 0,
    limit,
    data: await queryBuilder.toArray()
  };
};

/**
 * Patch documents.
 *
 * @async
 * @param {MongoCollection} collection MongoDB collection.
 * @param {object} query Match exact query object.
 * @param {object} controls Control list result, maybe contains: $set, $inc.
 * @returns {number} No of changed documents.
 */
const doPatch = async (collection, query, controls) => {
  if (query._id) { query._id = ObjectId(query._id); }

  const res = await collection.updateMany(query, controls);
  return res.matchedCount;
};

/**
 * Remove documents
 *
 * @param {MongoCollection} collection MongoDB collection.
 * @param {object} query Match exact query object.
 * @returns {number} No removed document.
 */
const doRemove = async (collection, query) => {
  if (query._id) { query._id = ObjectId(query._id); }

  const res = await collection.deleteMany(query);
  return res.deletedCount;
};

const doExport = async (uri, name) => {
  const outputPath = `/tmp/rugo.${CACHE_MONGO_KEY}.${generateId()}.json`;
  /* const {stdout, stderr} = */
  await exec(`mongoexport --uri="${uri}" --collection="${name}" --out="${outputPath}"`);

  // stdout.split('\n').map(i => i.trim()).filter(i => i).forEach(log);
  // stderr.split('\n').map(i => i.trim()).filter(i => i).forEach(log);

  return outputPath;
};

const doImport = async (uri, name, filePath) => {
  /* const {stdout, stderr} = */
  await exec(`mongoimport --uri="${uri}" --collection="${name}" --file="${filePath}" --drop`);

  // stdout.split('\n').map(i => i.trim()).filter(i => i).forEach(log);
  // stderr.split('\n').map(i => i.trim()).filter(i => i).forEach(log);

  return true;
};

/**
 * Get collection for data processing.
 *
 * @param {MongoInstance} ins MongoDB Instance to store collection. Required.
 * @param {string} name Collection name. Required.
 * @returns {Collection} Collection handlers.
 */
const getCollection = ({ db, uri }, name) => {
  const collection = db.collection(name);

  return {
    ...EmptyCollection,

    id: ObjectId,
    create: curry(doCreate)(collection),
    get: curry(doGet)(collection),
    count: curry(doCount)(collection),
    list: curryN(2, doList)(collection),
    patch: curryN(2, doPatch)(collection),
    remove: curry(doRemove)(collection),

    export: async () => await doExport(uri, name),
    import: curry(doImport)(uri, name)
  };
};
const memoizedGetCollection = createMemoizeWith(CACHE_MONGO_KEY, ({ uri }, ...args) => join(uri, ...args), getCollection);

/**
 * Mongo Driver is a driver store data in mongodb. It suitable for saving complex data with large amount.
 *
 * This function create Mongo Driver for use.
 *
 * @async
 * @param {object} config Driver configuration.
 * @param {string} config.uri Connection URI.
 * @param {boolean} config.cache Enable cache. Default: `false`.
 * @returns {Driver} Driver handler.
 */
const createMongoDriver = async ({ uri, cache }) => {
  const ins = await (cache ? memoizedGetDatabase : getDatabase)(uri);

  return {
    ...DRIVER,

    getCollection: (cache ? memoizedGetCollection : curry(getCollection))(ins),
    async close () {
      await ins.client.close();
    }
  };
};
const memoizedCreateMongoDriver = createMemoizeWith(CACHE_MONGO_KEY, prop('uri'), createMongoDriver, prop('cache'));
export default memoizedCreateMongoDriver;

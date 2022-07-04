import fs from 'fs';
import { join, parse } from 'path';

import { compose, curry, curryN, map, prop } from 'ramda';
import base64url from 'base64url';
import Mime from 'mime';
import { EmptyCollection, generateId, FileData, exec } from '@rugo-vn/common';

import { CACHE_FS_KEY, DIRECTORY_MIME, DRIVER } from './constants.js';
import createMemoizeWith from './memoize.js';
// import log from './log.js';
import rimraf from 'rimraf';

/**
 * Encode path to id (base64url)
 *
 * @param {string} p Path to encode.
 * @returns {string} Encode result.
 */
const encodeId = p => base64url.encode(join('/', p));

/**
 * Decode id to path.
 *
 * @param {string} id id to decode.
 * @returns {string} decode result.
 */
const decodeId = id => join('/', base64url.decode(id));

/**
 * Generate id or check.
 *
 * @param {*} id Id to check. Optional.
 * @returns {*} Checked Id or a new ID.
 */
const doId = id => id || encodeId(generateId());

/**
 * Get a document.
 *
 * @async
 * @param {string} root Root directory to find.
 * @param {string} id Doc id.
 * @returns {Document} Result, doc information.
 */
const doGet = async (root, id) => {
  const relativePath = decodeId(id);
  const absolutePath = join(root, relativePath);

  const info = parse(relativePath);

  const parent = join('/', info.dir);
  const name = info.base;
  const ext = info.ext;

  if (!fs.existsSync(absolutePath)) { return null; }

  const stats = fs.statSync(absolutePath);
  const isDir = stats.isDirectory();
  const mime = isDir ? DIRECTORY_MIME : Mime.getType(ext);

  return {
    _id: id,
    name,
    mime,
    parent: encodeId(parent),
    data: isDir ? null : new FileData(absolutePath),
    size: isDir ? 0 : stats.size,
    updatedAt: Math.max(stats.ctime, stats.mtime)
  };
};

/**
 * Create a file or directory
 *
 * @async
 * @param {string} root Root directory for handle. Required.
 * @param {Document} doc A document to be created. Required.
 * @returns {Document} A created document.
 */
const doCreate = async (root, doc) => {
  const { name = generateId(), parent = encodeId('/'), data, mime } = doc;

  // init
  const parentPath = decodeId(parent);

  const newRelativePath = join(parentPath, name);
  const newAbsolutePath = join(root, newRelativePath);

  if (fs.existsSync(newAbsolutePath)) { return null; }

  // create parent directory
  const absoluteParentPath = join(root, parentPath);
  if (!fs.existsSync(absoluteParentPath)) {
    fs.mkdirSync(absoluteParentPath, { recursive: true });
  }

  // create file or directory
  if (mime === DIRECTORY_MIME) {
    fs.mkdirSync(newAbsolutePath, { recursive: true });
  } else if (!data) {
    fs.closeSync(fs.openSync(newAbsolutePath, 'w'));
  } else {
    await data.copyTo(newAbsolutePath);
  }

  return doGet(root, encodeId(newRelativePath));
};

/**
 * List all item in parent directory.
 *
 * @param {string} root Root of the project.
 * @param {object} query Query to find, valid properties: parent.
 * @returns {Array} Array of paths.
 */
const listByQuery = (root, query) => {
  const relativeParentPath = query.parent ? decodeId(query.parent) : '/';
  const absoluteParentPath = join(root, relativeParentPath);

  const ls = fs.existsSync(absoluteParentPath)
    ? fs.readdirSync(absoluteParentPath)
    : [];

  return ls.map(name => join(relativeParentPath, name));
};

/**
 * Count all item result.
 *
 * @param {string} root Root directory for handle. Required.
 * @param {object} query Query to find, valid properties: parent.
 * @returns {number}  Count.
 */
const doCount = compose(prop('length'), listByQuery);

/**
 * List documents.
 *
 * @async
 * @param {string} root Root directory for handle. Required.
 * @param {object} query Query to find, valid properties: parent.
 * @returns {object} List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).
 */
const doList = async (root, query) => {
  const data = await Promise.all(compose(map(curry(doGet)(root)), map(encodeId), listByQuery)(root, query));
  return {
    total: data.length,
    skip: 0,
    limit: -1,
    data
  };
};

/**
 * Patch documents.
 *
 * @async
 * @param {string} root Root directory for handle. Required.
 * @param {object} query Match exact query object. Valid properties: parent.
 * @param {object} controls Control list result, maybe contains: $set.
 * @returns {number} No.changed documents. Values: 0, 1.
 */
const doPatch = async (root, query, controls) => {
  const { _id: id } = query;
  const { $set: doc } = controls;

  const oldDoc = await doGet(root, id);

  if (!oldDoc) { return 0; }

  const { name, parent, data } = doc;

  const oldRelativePath = decodeId(oldDoc._id);
  const oldAbsolutePath = join(root, oldRelativePath);

  // rename
  const newParent = decodeId(parent || oldDoc.parent);
  const absoluteParentPath = join(root, newParent);

  if (!fs.existsSync(absoluteParentPath)) {
    fs.mkdirSync(absoluteParentPath, { recursive: true });
  }

  const newRelativePath = join(newParent, name || oldDoc.name);
  const newAbsolutePath = join(root, newRelativePath);

  if (newRelativePath !== oldRelativePath) {
    fs.renameSync(oldAbsolutePath, newAbsolutePath);
  }

  // update content
  if (data) {
    await data.copyTo(newAbsolutePath);
  }

  return 1;
};

/**
 * Remove documents
 *
 * @param {string} root Root directory for handle. Required.
 * @param {object} query Match exact query object. Valid properties: _id.
 * @returns {number} No.removed document. Values: 0, 1.
 */
const doRemove = async (root, query) => {
  const { _id: id } = query;
  const doc = await doGet(root, id);

  if (!doc) { return 0; }

  const absolutePath = join(root, decodeId(doc._id));
  fs.rmSync(absolutePath, { recursive: true });

  return 1;
};

const doImport = async (root, dirPath) => {
  if (fs.existsSync(root)) { rimraf.sync(root); }

  // const { stdout, stderr } =
  await exec(`cp -rL "${dirPath}" "${root}"`);

  // stdout.split('\n').map(i => i.trim()).filter(i => i).forEach(log);
  // stderr.split('\n').map(i => i.trim()).filter(i => i).forEach(log);

  return true;
};

/**
 * Get collection for data processing.
 *
 * @async
 * @param {string} root Root directory. Required.
 * @param {string} name Collection name. Required.
 * @returns {Collection} Collection handlers.
 */
const getCollection = async (root, name) => {
  const collectionRoot = join(root, name);

  return {
    ...EmptyCollection,

    id: doId,
    create: curry(doCreate)(collectionRoot),
    get: curry(doGet)(collectionRoot),
    count: curry(doCount)(collectionRoot),
    list: curryN(2, doList)(collectionRoot),
    patch: curryN(2, doPatch)(collectionRoot),
    remove: curry(doRemove)(collectionRoot),

    export: () => collectionRoot,
    import: curry(doImport)(collectionRoot)
  };
};

const memoizedGetCollection = createMemoizeWith(CACHE_FS_KEY, join, getCollection);

/**
 * Fs Driver is a driver store and manage file system.
 *
 * This function create Fs Driver for use.
 *
 * @async
 * @param {object} config Driver configuration.
 * @param {string} config.root Root directory to store. Required.
 * @param {boolean} config.cache Enable cache. Default: `false`.
 * @returns {Driver} Driver handler.
 */
const createFsDriver = async ({ root, cache }) => {
  return {
    ...DRIVER,
    getCollection: (cache ? memoizedGetCollection : curry(getCollection))(root)
  };
};
const memoizedCreateFsDriver = createMemoizeWith(CACHE_FS_KEY, prop('root'), createFsDriver, prop('cache'));

export default memoizedCreateFsDriver;

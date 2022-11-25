import { basename, resolve } from 'path';
import { exec } from '@rugo-vn/service';
import { RugoException } from '@rugo-vn/exception';
import { ObjectId } from 'mongodb';
import { union } from 'ramda';
import rimraf from 'rimraf';

const buildQuery = ({ query = {}, search, searches, uniques }) => {
  if (query._id) { query._id = ObjectId(query._id); }
  if (search) {
    query = {
      $and: [
        query,
        {
          $or: union(searches, uniques)
            .map(v => ({ [v]: { $regex: new RegExp(search, 'i') } }))
        }
      ]
    };
  }

  return query;
};

export const create = async function ({ register: { value: collection }, data }) {
  const res = await collection.insertOne(data);

  if (!res.insertedId) { throw new RugoException('Can not create a doc'); }

  return await collection.findOne({ _id: res.insertedId });
};

export const find = async function (args) {
  const { register: { value: collection }, sort } = args;
  const query = buildQuery(args);
  let { skip, limit } = args;

  // find many
  let queryBuilder = collection.find(query);

  if (sort) {
    queryBuilder = queryBuilder.sort(sort);
  }

  skip = parseInt(skip);
  if (skip) {
    queryBuilder = queryBuilder.skip(parseInt(skip));
  }

  limit = parseInt(limit);
  if (!isNaN(limit)) {
    queryBuilder = queryBuilder.limit(parseInt(limit));
  }

  return await queryBuilder.toArray();
};

export const count = async function (args) {
  const { register: { value: collection } } = args;
  const query = buildQuery(args);

  return await collection.countDocuments(query);
};

export const update = async function ({ register: { value: collection }, query = {}, set, unset, inc }) {
  if (query._id) { query._id = ObjectId(query._id); }

  const res = await collection.updateMany(query, {
    $set: set || {},
    $unset: unset || {},
    $inc: inc || {}
  });

  return res.matchedCount;
};

export const remove = async function ({ register: { value: collection }, query = {} }) {
  if (query._id) { query._id = ObjectId(query._id); }

  const res = await collection.deleteMany(query);

  return res.deletedCount;
};

export const backup = async function ({ register, file }) {
  const tmpPath = resolve('.tmp', `mongo.${register.name}`);

  const res = await exec(`mongodump --uri="${this.mongoUri}" -c "${register.name}" -o "${tmpPath}"`);
  await exec(`cd "${tmpPath}/${basename(this.mongoUri)}" && mv "${register.name}.bson" "${file.toString()}"`);

  rimraf.sync(tmpPath);

  return res.stderr ? 'Cannot backup' : 'Backup successfully';
};

export const restore = async function ({ register, file }) {
  const tmpPath = resolve('.tmp', `mongo.${register.name}.bson`);

  const res = await exec(`cp "${file.toString()}" "${tmpPath}" && mongorestore --uri="${this.mongoUri}" --collection="${register.name}" "${tmpPath}" --drop`);
  rimraf.sync(tmpPath);

  return res.stderr ? 'Cannot restore' : 'Restore successfully';
};

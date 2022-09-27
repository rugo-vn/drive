import { keys, ascend, compose, descend, drop, filter, map, mergeDeepLeft, pipe, prop, sortWith, take, whereEq, count as _count, path, forEach, length } from 'ramda';

import { ValidationError } from '../exception.js';
import { generateId } from '../utils.js';

export const find = async function ({ collection, query = {}, sort, skip, limit }) {
  const pipeline = [];

  if (sort) {
    pipeline.push(
      sortWith(
        compose(
          map(k => sort[k] === -1 ? descend(prop(k)) : ascend(prop(k))),
          keys
        )(sort)
      )
    );
  }

  pipeline.push(filter(whereEq(query)));

  skip = parseInt(skip);
  if (!isNaN(skip)) { pipeline.push(drop(skip)); }

  limit = parseInt(limit);
  if (!isNaN(limit)) { pipeline.push(take(limit)); }

  return pipe(...pipeline)(collection.data);
};

export const count = async function ({ collection, query = {} }) {
  return _count(whereEq(query))(collection.data);
};

export const create = async function ({ collection, schema, data = {}, uniques = [] }) {
  const newDoc = mergeDeepLeft({ _id: generateId() }, data);

  // check uniques
  for (const field of ['_id', ...uniques]) {
    const no = await count({ collection, query: { [field]: newDoc[field] } });
    if (no !== 0) {
      throw new ValidationError(`Duplicate unique value "${newDoc[field]}"`);
    }
  }

  // validate schema
  const validate = this.ajv.compile(schema);

  if (!validate(newDoc)) {
    throw validate.errors.map(raw => {
      raw.value = path(raw.instancePath.split('/').filter(i => i), newDoc);
      return raw;
    });
  }

  // create new doc
  collection.data.push(newDoc);
  await collection.write();

  return newDoc;
};

export const update = async function ({ collection, schema, query = {}, set, unset, inc }) {
  const pipeline = [filter(whereEq(query))];

  if (set) {
    pipeline.push(
      forEach(doc => {
        for (const key in set) {
          const errs = this.validateProperty(schema, key, set[key]);
          if (errs.length) { throw errs; }
          doc[key] = set[key];
        }
      })
    );
  }

  if (inc) {
    pipeline.push(
      forEach(doc => {
        for (const key in inc) {
          if (typeof doc[key] === 'number') {
            const errs = this.validateProperty(schema, key, doc[key] + inc[key]);
            if (errs.length) { throw errs; }

            doc[key] += inc[key];
          }
        }
      })
    );
  }

  if (unset) {
    pipeline.push(
      forEach(doc => {
        for (const key in unset) {
          if (schema.required && schema.required.indexOf(key) !== -1) {
            const errs = [{ keyword: 'required', params: { missingProperty: key } }];
            throw errs;
          }

          delete doc[key];
        }
      })
    );
  }

  pipeline.push(length);

  const result = pipe(...pipeline)(collection.data);

  if (result) { await collection.write(); }

  return result;
};

export const remove = async function ({ collection, query = {} }) {
  const pred = whereEq(query);

  let index = 0;
  let result = 0;
  while (index < collection.data.length) {
    if (pred(collection.data[index])) {
      collection.data.splice(index, 1);
      result++;
      continue;
    }

    index++;
  }

  return result;
};

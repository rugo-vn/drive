import { exec } from '@rugo-vn/service';
import {
  keys,
  ascend,
  compose,
  descend,
  drop,
  filter,
  map,
  mergeDeepLeft,
  pipe,
  prop,
  sortWith,
  take,
  whereEq,
  forEach,
  length,
  whereAny,
  union,
  join
} from 'ramda';
import rimraf from 'rimraf';

import { ValidationError } from '@rugo-vn/exception';
import { generateId, matchRegex } from '../utils.js';

const buildQuery = ({ query = {}, search, indexes, uniques, searches }) => {
  const pipeline = [];

  pipeline.push(filter(whereEq(query)));

  if (search) {
    pipeline.push(filter(whereAny(
      union(indexes, uniques, searches)
        .reduce((o, v) => ({ ...o, [v]: matchRegex(search) }), {})
    )));
  }

  return pipeline;
};

export const find = async function (args) {
  const { register: { value: collection }, sort } = args;
  let { skip, limit } = args;
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

  pipeline.push(...buildQuery(args));

  skip = parseInt(skip);
  if (!isNaN(skip)) { pipeline.push(drop(skip)); }

  limit = parseInt(limit);
  if (!isNaN(limit)) { pipeline.push(take(limit)); }

  return pipe(...pipeline)(collection.data);
};

export const count = async function (args) {
  const { register: { value: collection } } = args;

  const pipeline = buildQuery(args);
  pipeline.push(length);

  return pipe(...pipeline)(collection.data);
};

export const create = async function ({ register, data = {}, uniques = [] }) {
  const { value: collection } = register;
  const newDoc = mergeDeepLeft({ _id: generateId() }, data);

  // check uniques
  for (const field of ['_id', ...uniques]) {
    const no = await count({ register, query: { [field]: newDoc[field] } });
    if (no !== 0) {
      throw new ValidationError(`Duplicate unique value "${newDoc[field]}"`);
    }
  }

  // create new doc
  collection.data.push(newDoc);
  await collection.write();

  return newDoc;
};

export const update = async function ({ register: { value: collection }, query = {}, set, unset, inc }) {
  const pipeline = [filter(whereEq(query))];

  if (set) {
    pipeline.push(
      forEach(doc => {
        /* @todo: merge set */
        for (const key in set) {
          doc[key] = set[key];
        }
      })
    );
  }

  if (inc) {
    pipeline.push(
      forEach(doc => {
        /* @todo: validate inc */
        for (const key in inc) {
          if (typeof doc[key] === 'number') {
            doc[key] += inc[key];
          }
        }
      })
    );
  }

  if (unset) {
    pipeline.push(
      /* @todo: delete unset */
      forEach(doc => {
        for (const key in unset) {
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

export const remove = async function ({ register: { value: collection }, query = {} }) {
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

export const backup = async function ({ register, file }) {
  const imp = join(this.settings.root, register.name);

  const res = await exec(`cp -r "${imp}" "${file.toString()}"`);

  return res.stderr ? 'Cannot restore' : 'Restore successfully';
};

export const restore = async function ({ register, file }) {
  const out = join(this.settings.root, register.name);
  rimraf.sync(out);

  const res = await exec(`cp -r "${file.toString()}" "${out}"`);
  await register.value.read();

  return res.stderr ? 'Cannot restore' : 'Restore successfully';
};

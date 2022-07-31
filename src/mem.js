import { join } from 'path';

import { Low, JSONFile } from 'lowdb';
import { prop, find, propEq, count, whereEq, filter, pipe, sortWith, compose, map, descend, ascend, take, drop, keys, forEach, length } from 'ramda';
import { generateId } from '@rugo-vn/common';

export const name = 'mem';

export const actions = {
  count ({ params, locals }) {
    const { filters } = params;
    const { collection } = locals;

    return count(whereEq(filters))(collection.data);
  },

  find ({ params, locals }) {
    const { filters, sort, skip, limit } = params || {};
    const { collection } = locals;

    if (filters && filters._id && typeof filters._id !== 'object') {
      return [find(propEq('_id', filters._id))(collection.data) || null].filter(i => i);
    }

    const pipeline = [filter(whereEq(filters || {}))];

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

    if (skip) { pipeline.push(drop(skip)); }
    if (typeof limit === 'number') { pipeline.push(take(limit)); }

    return pipe(...pipeline)(collection.data);
  },

  async create ({ params, locals }) {
    const { doc } = params;
    const { collection } = locals;

    const currentDate = (new Date()).toISOString();

    const newDoc = {
      _id: generateId(),
      createdAt: currentDate,
      updatedAt: currentDate,
      version: 1,
      ...doc
    };

    collection.data.push(newDoc);
    await collection.write();

    return newDoc;
  },

  async patch ({ params, locals }) {
    const { filters, set, inc, unset } = params || {};
    const { collection } = locals;

    const pipeline = [filter(whereEq(filters || {}))];

    if (set) {
      pipeline.push(
        forEach(doc => {
          for (const key in set) {
            doc[key] = set[key];
          }
        })
      );
    }

    if (inc) {
      pipeline.push(
        forEach(doc => {
          for (const key in inc) {
            if (typeof doc[key] === 'number') { doc[key] += inc[key]; }
          }
        })
      );
    }

    if (unset) {
      pipeline.push(
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
  },

  async remove ({ params, locals }) {
    const { filters } = params || {};
    const { collection } = locals;

    const pred = whereEq(filters || {});

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
  }
};

export const hooks = {
  before: {
    async '*' (ctx) {
      const { collection: name } = ctx.meta;

      if (!name) { throw new Error('Collection was not defined.'); }

      if (!this.collections[name]) {
        const file = join(this.settings.storage, name);
        const adapter = new JSONFile(file);
        const db = new Low(adapter);

        await db.read();
        db.data ||= [];
        await db.write();

        this.collections[name] = db;
      }

      ctx.locals.collection = this.collections[name];
    }
  }
};

/**
 *
 */
export async function started () {
  if (!this.settings.storage) {
    throw new Error('Storage settings was not defined.');
  }

  this.collections = {};
}

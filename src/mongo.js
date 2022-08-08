import { ObjectId, MongoClient } from 'mongodb';
import { clone } from 'ramda';

export const name = 'driver.mongo';

export const actions = {
  async count ({ params, locals }) {
    const { filters } = params;
    const { collection } = locals;

    return await collection.countDocuments(filters);
  },

  async find ({ params, locals }) {
    const { filters, sort, skip, limit } = params || {};
    const { collection } = locals;

    if (filters && filters._id && typeof filters._id !== 'object') {
      let id;

      try {
        id = ObjectId(filters._id);
      } catch(err){
        return [];
      }

      return [await collection.findOne({ _id: id })];
    }

    let queryBuilder = collection.find(filters);

    if (sort) {
      queryBuilder = queryBuilder.sort(sort);
    }

    if (skip) {
      queryBuilder = queryBuilder.skip(parseInt(skip));
    }

    if (limit !== undefined) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    return await queryBuilder.toArray();
  },

  async create ({ params, locals }) {
    const { doc } = params;
    const { collection } = locals;

    const newDoc = clone(doc);

    await collection.insertOne(newDoc);
    return newDoc;
  },

  async patch ({ params, locals }) {
    const { filters, set, inc, unset } = params || {};
    const { collection } = locals;

    if (filters._id) { filters._id = ObjectId(filters._id); }

    const res = await collection.updateMany(filters, {
      $set: set || {},
      $inc: inc || {},
      $unset: unset || {}
    });

    return res.matchedCount;
  },

  async remove ({ params, locals }) {
    // const { filters } = params || {};
    // const { collection } = locals;

    // const pred = whereEq(filters || {});

    // let index = 0;
    // let result = 0;
    // while (index < collection.data.length) {
    //   if (pred(collection.data[index])) {
    //     collection.data.splice(index, 1);
    //     result++;
    //     continue;
    //   }

    //   index++;
    // }

    // return result;
  }
};

export const hooks = {
  before: {
    async all(ctx) {
      const { collection: name } = ctx.meta;

      if (!name) { throw new Error('Collection was not defined.'); }

      ctx.locals.collection = this.db.collection(name);
    }
  }
};

/**
 *
 */
export async function started () {
  if (!this.settings.mongo) {
    throw new Error('Mongo settings was not defined.');
  }

  this.client = await new Promise((resolve, reject) => {
    MongoClient.connect(this.settings.mongo, { useUnifiedTopology: true }, (err, _client) => {
      if (err) {
        reject(err);
        return;
      }

      const client = _client;
      this.logger.info('connected to mongodb server');

      resolve(client);
    });
  });

  this.db = this.client.db();
}

export async function stopped(){
  await this.client.close();
}

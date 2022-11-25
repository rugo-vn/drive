import { curry } from 'ramda';
import { mongoError } from '@rugo-vn/exception';
import { commonAllHook, commonCreateHook, commonUpdateHook } from '../common/hooks.js';
import { Schema } from '@rugo-vn/schema';

const removeDefault = (keyword, value) => {
  if (keyword === 'default') { return undefined; }

  return { [keyword]: value };
};

export const before = {
  all: curry(commonAllHook)(async function (args) {
    const { name } = args;

    // create collection
    const collection = (await this.db.listCollections().toArray()).map(i => i.name).indexOf(name) === -1
      ? await this.db.createCollection(name)
      : this.db.collection(name);

    // validator
    await this.db.command({
      collMod: name,
      validator: {
        $jsonSchema: Schema.walk(new Schema(args.schema).toFinal(), removeDefault)
      }
    });

    // indexes
    const newIndexes = {};
    for (const property of args.uniques) {
      newIndexes[property] = {
        ...(newIndexes[property] || { dir: 1 }),
        unique: true
      };
    }

    // drop old indexes
    await collection.dropIndexes();

    // create new indexes
    for (const indexName in newIndexes) {
      const index = newIndexes[indexName];

      await collection.createIndex({ [indexName]: index.dir }, { name: indexName, unique: index.unique });
    }

    return collection;
  }),
  create: commonCreateHook,
  update: commonUpdateHook
};

export const error = {
  all (originErr) {
    if (originErr.constructor.name === 'MongoServerError') { throw mongoError(originErr); }
  }
};

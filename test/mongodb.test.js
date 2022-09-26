/* eslint-disable */

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId, MongoClient } from 'mongodb';

describe('mongodb test', () => {
  let mongod, client, db;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    client = await new Promise((resolve, reject) => {
      MongoClient.connect(mongod.getUri(), { useUnifiedTopology: true }, (err, client) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(client);
      });
    });
    db = client.db();
  });

  after(async () => {
    await client.close();
    await mongod.stop();
  });

  it('should test jsonSchema', async () => {
    const schema = {
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name'],
    }

    const collectionName = 'demo';

    await db.createCollection(collectionName);
    const collection = (await db.listCollections().toArray()).map(i => i.name).indexOf(collectionName) === -1
      ? await db.createCollection(collectionName) : db.collection(collectionName);

    await db.command({ collMod: collectionName,
      validator: {
        $jsonSchema: schema,
      },
    });

    try {
      let res = await collection.insertOne({
        name: 'foo',
        age: 1,
      });

      res = await collection.update({ _id: res.insertedId }, { $inc: { age: -1 }});

      console.log(res);
    } catch (err) {
      console.log(JSON.stringify(err.errInfo.details.schemaRulesNotSatisfied, 0, 2));
    }
  });
});
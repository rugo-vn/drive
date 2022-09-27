/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBroker } from '@rugo-vn/service';
import { assert, expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import rimraf from 'rimraf';

import { ValidationError } from '../src/exception.js';

const drivers = ['mongo', 'mem'];
const schema = {
  _name: 'demo',
  _uniques: ['name'],
  _indexes: ['name'],
  _searches: ['name'],
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0 },
  },
  required: ['name'],
};

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('driver test', () => {
  const root = join(__dirname, '.cache');
  let mongod, broker;

  before(async () => {
    // fs
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    // mongo
    mongod = await MongoMemoryServer.create();

    // create broker
    broker = createBroker({
      _services: [
        './src/mongo/index.js',
        './src/mem/index.js'
      ],
      driver: {
        mongo: mongod.getUri(),
        mem: root,
      }
    });

    await broker.loadServices();
    await broker.start();
  });

  after(async () => {
    await broker.close();
    await mongod.stop();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  // common test
  for (let driverName of drivers){
    describe(`Common test ${driverName} driver`, () => {
      let docId;

      it('should create a doc', async () => {
        const doc = await broker.call(`driver.${driverName}.create`, {data: {
          name: 'foo',
          age: 3
        }}, { schema });

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 3);
      });

      it('should not create a doc when not meet validation', async () => {
        try {
          await broker.call(`driver.${driverName}.create`, {data: {
            name: 'bar',
            age: -1
          }}, { schema });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Value -1 is out of minimum range 0');
        }

        try {
          await broker.call(`driver.${driverName}.create`, {data: {
            name: 'foo'
          }}, { schema });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Duplicate unique value "foo"');
        }

        try {
          await broker.call(`driver.${driverName}.create`, {data: {}}, { schema });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Required value for properties "name"');
        }
      });

      it('should find a doc', async () => {
        const doc = (await broker.call(`driver.${driverName}.find`, { query: { name: 'foo' }}, { schema }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 3);

        docId = doc._id;
      });

      it('should count doc', async () => {
        const no = await broker.call(`driver.${driverName}.count`, { query: { name: 'foo' }}, { schema });

        expect(no).to.be.eq(1);
      });

      it('should update doc', async () => {
        const no = await broker.call(`driver.${driverName}.update`, { query: { _id: docId }, set: { age: 4 } }, { schema });
        expect(no).to.be.eq(1);

        const doc = (await broker.call(`driver.${driverName}.find`, { query: { _id: docId }}, { schema }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 4);
      });

      it('should not update doc', async () => {
        try {
          await broker.call(`driver.${driverName}.update`, { query: { _id: docId }, inc: { age: -10 } }, { schema });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Value -6 is out of minimum range 0');
        }

        const doc = (await broker.call(`driver.${driverName}.find`, { query: { _id: docId }}, { schema }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 4);
      });

      it('should remove doc', async () => {
        const no = await broker.call(`driver.${driverName}.remove`, { query: { _id: docId } }, { schema });
        expect(no).to.be.eq(1);
      });
    });
  }

  // driver.mongo only
  describe('Test driver.mongo only', () => {
    it('should update schema and create', async () => {
      schema._uniques = [];
      schema.properties.age.minimum = 3;

      const doc = await broker.call(`driver.mongo.create`, {data: {
        name: 'foo bar zero two',
        age: 4
      }}, { schema });

      expect(doc).to.has.property('name', 'foo bar zero two');
      expect(doc).to.has.property('age', 4);


      const doc2 = (await broker.call(`driver.mongo.find`, { query: { $text: { $search: 'bar' }}}, { schema }))[0];

      expect(doc2).to.has.property('name', 'foo bar zero two');
      expect(doc2).to.has.property('age', 4);
    });
  });
});
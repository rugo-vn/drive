/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBroker } from '@rugo-vn/service';
import { assert, expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import rimraf from 'rimraf';

import { ValidationError } from '@rugo-vn/exception';
import { clone, indexBy } from 'ramda';

const DB_NAME = 'test';
const drivers = ['mongo', 'mem'];
const DEFAULT_SCHEMA = {
  name: 'demo',
  uniques: ['name'],
  type: 'object',
  properties: {
    name: { type: 'string' },
    title: 'string',
    slug: {
      type: 'string',
      default: {
        fn: 'slugify',
        from: 'title',
      },
    },
    age: { type: 'number', minimum: 0 },
    parent: {
      properties: {
        foo: { type: 'string', default: { fn: 'nofn' } },
        bar: 'string',
        count: {
          type: 'number',
          default: 0,
          maximum: 100,
        },
        complex: {
          items: {
            properties: {
              more: 'string'
            },
            required: ['more']
          }
        }
      },
      required: ['foo']
    },
    schemas: {
      type: 'array',
      items: 'json'
    }
  },
  required: ['name'],
};

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('driver test', () => {
  const root = join(__dirname, '.cache');
  let mongod, broker, schema;

  before(async () => {
    // fs
    if (fs.existsSync(root))
      rimraf.sync(root);

    // mongo
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: DB_NAME,
      },
    });

    // create broker
    broker = createBroker({
      _services: [
        './src/mongo/index.js',
        './src/mem/index.js'
      ],
      _globals: {
        ...indexBy(i => `schema.${i.name}`)([clone(DEFAULT_SCHEMA)]),
      },
      driver: {
        mongo: `${mongod.getUri()}${DB_NAME}`,
        mem: root,
      },
    });

    broker.createService({
      name: 'test',
      actions: {
        updateSchema(){
          const schema = this.globals[`schema.${DEFAULT_SCHEMA.name}`];
          schema.uniques = [];
          schema.properties.age.minimum = 3;
        },
        restoreSchema() {
          this.globals[`schema.${DEFAULT_SCHEMA.name}`] = clone(DEFAULT_SCHEMA);
        }
      }
    })

    await broker.loadServices();
    await broker.start();
  });

  after(async () => {
    await broker.close();
    await mongod.stop();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  it('should require fs root', async () => {
    const tmpBroker = createBroker({
      _services: [
        './src/fs/index.js'
      ]
    });

    await tmpBroker.loadServices();

    try {
      await tmpBroker.start();
      assert.fail('should error');
    } catch(err) {
      expect(err).to.has.property('message', 'Fs storage settings was not defined.');
    }
  });

  it('should require mem root', async () => {
    const tmpBroker = createBroker({
      _services: [
        './src/mem/index.js'
      ]
    });

    await tmpBroker.loadServices();

    try {
      await tmpBroker.start();
      assert.fail('should error');
    } catch(err) {
      expect(err).to.has.property('message', 'Mem storage settings was not defined.');
    }
  });

  it('should require mongo uri', async () => {
    const tmpBroker = createBroker({
      _services: [
        './src/mongo/index.js'
      ]
    });

    await tmpBroker.loadServices();

    try {
      await tmpBroker.start();
      assert.fail('should error');
    } catch(err) {
      expect(err).to.has.property('message', 'Mongo settings was not defined.');
    }
  });

  it('should valid mongo uri', async () => {
    const tmpBroker = createBroker({
      _services: [
        './src/mongo/index.js'
      ],
      driver: {
        mongo: 'wronguri'
      }
    });

    await tmpBroker.loadServices();

    try {
      await tmpBroker.start();
      assert.fail('should error');
    } catch(err) {
      expect(err).to.has.property('message', 'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"');
    }
  });

  // common test
  for (let driverName of drivers){
    describe(`Common test ${driverName} driver`, () => {
      let docId;

      it('should required name', async () => {
        try {
          await broker.call(`driver.${driverName}.create`, {});
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0]).to.has.property('message', 'Driver action must have name as required argument.');
        }
      });

      it('should required schema', async () => {
        try {
          await broker.call(`driver.${driverName}.create`, {
            name: 'noschema'
          });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0]).to.has.property('message', 'Driver action can not find the schema');
        }
      });

      it('should create a doc', async () => {
        // single
        const doc = await broker.call(`driver.${driverName}.create`, {
          name: DEFAULT_SCHEMA.name,
          data: {
            name: 'foo',
            title: 'Some Foo Đờ 123 # Go go',
            age: 3,
            parent: { foo: 'a', bar: 'b' }
          }
        });

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('title', 'Some Foo Đờ 123 # Go go');
        expect(doc).to.has.property('slug', 'some-foo-do-123-go-go');
        expect(doc).to.has.property('age', 3);
        expect(doc).to.has.property('createdAt');
        expect(doc).to.has.property('updatedAt');
        expect(doc).to.has.property('version', 1);

        // many
        for (let i = 0; i < 3; i++) {
          await broker.call(`driver.${driverName}.create`, {
            name: DEFAULT_SCHEMA.name,
            data: {
              name: 'many_' + i,
              age: 999,
            }
          });
        }
      });

      it('should not create a doc when not meet validation', async () => {
        try {
          await broker.call(`driver.${driverName}.create`, {
            name: DEFAULT_SCHEMA.name,
            data: {
              name: 'bar',
              age: -1
            }
          });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Value -1 is out of minimum range 0');
        }

        try {
          await broker.call(`driver.${driverName}.create`, {
            name: DEFAULT_SCHEMA.name, 
            data: {
              name: 'foo'
            }
          });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Duplicate unique value "foo"');
        }

        try {
          await broker.call(`driver.${driverName}.create`, {
            name: DEFAULT_SCHEMA.name,
            data: {}
          });
          assert.fail('should error')
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Required value for properties "name"');
        }
      });

      it('should find a doc', async () => {
        const doc = (await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          query: { name: 'foo' },
          sort: { createdAt: -1 },
        }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 3);

        docId = doc._id;

        const data = await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          query: { age: 999 },
          skip: 1,
          limit: 1,
        });

        expect(data).to.has.property('length', 1);
      });

      it('should search docs', async () => {
        const doc = (await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          search: 'foo',
        }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 3);
      });

      it('should count doc', async () => {
        const no = await broker.call(`driver.${driverName}.count`, {
          name: DEFAULT_SCHEMA.name,
          query: { name: 'foo' },
        });

        expect(no).to.be.eq(1);
      });

      it('should update doc', async () => {
        const no = await broker.call(`driver.${driverName}.update`, {
          name: DEFAULT_SCHEMA.name,
          query: { _id: docId },
          set: {
            age: 4,
            'parent.foo': 'abc',
            schemas: [
              { some: 'property', has: 'value' }
            ]
          },
          inc: { 'parent.count': 1 },
          unset: { title: true },
        });
        expect(no).to.be.eq(1);

        const doc = (await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          query: { _id: docId }
        }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 4);
        expect(doc).to.not.has.property('title');
        expect(doc.parent).to.has.property('foo', 'abc');
        expect(doc.parent).to.has.property('bar', 'b');
        expect(doc.parent).to.has.property('count', 1);
        expect(doc.createdAt).to.not.be.eq(doc.updatedAt);
        expect(doc).to.has.property('version', 2);
      });

      it('should not update doc', async () => {
        try {
          await broker.call(`driver.${driverName}.update`, {
            name: DEFAULT_SCHEMA.name,
            query: { _id: docId },
            inc: { age: -10 }
          });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Value -6 is out of minimum range 0');
        }

        try {
          await broker.call(`driver.${driverName}.update`, {
            name: DEFAULT_SCHEMA.name,
            query: { _id: docId },
            inc: { 'parent.count': 1000 }
          });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Value 1001 is out of maximum range 100');
        }

        try {
          await broker.call(`driver.${driverName}.update`, {
            name: DEFAULT_SCHEMA.name,
            query: { _id: docId },
            unset: { name: 1 }
          });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Required value for properties "name"');
        }

        try {
          await broker.call(`driver.${driverName}.update`, {
            name: DEFAULT_SCHEMA.name,
            query: { _id: docId },
            unset: { 'parent.complex.1.more': 1 }
          });
          assert.fail('should error');
        } catch(errs) {
          expect(errs[0] instanceof ValidationError).to.be.eq(true);
          expect(errs[0]).to.has.property('detail', 'Required value for properties "parent.complex.$.more"');
        }

        const doc = (await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          query: { _id: docId }
        }))[0];

        expect(doc).to.has.property('name', 'foo');
        expect(doc).to.has.property('age', 4);
      });

      it('should backup', async () => {
        const res = await broker.call(`driver.${driverName}.backup`, {
          name: DEFAULT_SCHEMA.name,
          file: join(root, '.backup'),
        });
  
        expect(res).to.be.eq('Backup successfully');
      });

      it('should remove doc', async () => {
        const no = await broker.call(`driver.${driverName}.remove`, {
          name: DEFAULT_SCHEMA.name,
          query: { _id: docId }
        });
        expect(no).to.be.eq(1);

        const no2 = await broker.call(`driver.${driverName}.remove`, {
          name: DEFAULT_SCHEMA.name,
          query: { age: 999 }
        });
        expect(no2).to.be.eq(3);
      });

      it('should update schema and create', async () => {
        await broker.call(`test.updateSchema`);
  
        const doc = await broker.call(`driver.${driverName}.create`, {
          name: DEFAULT_SCHEMA.name,
          data: {
            name: 'foo bar zero two',
            age: 4
          }
        });
  
        expect(doc).to.has.property('name', 'foo bar zero two');
        expect(doc).to.has.property('age', 4);

        await broker.call(`test.restoreSchema`);
  
        const doc2 = (await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          search: 'BAR',
        }))[0];
  
        expect(doc2).to.has.property('name', 'foo bar zero two');
        expect(doc2).to.has.property('age', 4);
      });

      it('should restore', async () => {
        const res = await broker.call(`driver.${driverName}.restore`, {
          name: DEFAULT_SCHEMA.name,
          file: join(root, '.backup'),
        });
  
        expect(res).to.be.eq('Restore successfully');

        const data = await broker.call(`driver.${driverName}.find`, {
          name: DEFAULT_SCHEMA.name,
          sort: { createdAt: 1 }
        });

        expect(data).to.has.property('length', 4);
      });
    });
  }
});
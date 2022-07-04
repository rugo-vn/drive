/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import rimraf from 'rimraf';
import { DEFAULT_LIMIT, FileData } from '@rugo-vn/common';

import createMemDriver from '../src/mem.js';
import { globalCaches } from '../src/memoize.js';

import { CACHE_MEM_KEY, DRIVER } from '../src/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_COLLECTION_NAME = 'demo';
const SAMPLE_DOCUMENT = { foo: 'bar' };
const SAMPLE_ID = 123;
const SAMPLE_MAX = 15;

describe('Mem Driver test', () => {
  const root = join(__dirname, '.cache');
  let driver;

  beforeEach(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    driver = await createMemDriver({ root });
  });

  afterEach(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    await driver.close();
  });

  it('should create driver with cache', async () => {
    const cachedDriver = await createMemDriver({ root, cache: true });
    const hitCachedDriver = await createMemDriver({ root, cache: true });
    
    expect(cachedDriver).to.be.not.eq(driver);
    expect(globalCaches).to.has.property(CACHE_MEM_KEY);
    expect(cachedDriver).to.be.eq(hitCachedDriver);

    for (let key in DRIVER)
      expect(cachedDriver).to.has.property(key);

    const cachedDemoCollection = await cachedDriver.getCollection(DEMO_COLLECTION_NAME);
    const semiDemoCollection = cachedDriver.getCollection(DEMO_COLLECTION_NAME);

    expect(globalCaches[CACHE_MEM_KEY]).to.has.property(join(root, DEMO_COLLECTION_NAME));
    expect(cachedDemoCollection).to.be.eq(semiDemoCollection);

    await cachedDriver.close();
  });

  it('should create a collection', async () => {
    const mainCollection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const semiCollection = await driver.getCollection(DEMO_COLLECTION_NAME);

    expect(mainCollection).to.be.not.eq(semiCollection);
  });

  it('should create a document', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    const doc = await collection.create(SAMPLE_DOCUMENT);
    
    expect(doc).to.has.property('_id');

    for (let key in SAMPLE_DOCUMENT)
      expect(doc).to.has.property(key, SAMPLE_DOCUMENT[key]);
  });

  it('should create a document with existed id', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    const doc = await collection.create({
      _id: SAMPLE_ID,
      ...SAMPLE_DOCUMENT
    });
    
    expect(doc).to.has.property('_id', SAMPLE_ID);

    for (let key in SAMPLE_DOCUMENT)
      expect(doc).to.has.property(key, SAMPLE_DOCUMENT[key]);
  });

  it('should get a created document', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    const doc = await collection.create(SAMPLE_DOCUMENT);
    const doc2 = collection.get(doc._id);
    
    expect(doc2).to.has.property('_id');

    for (let key in SAMPLE_DOCUMENT)
      expect(doc2).to.has.property(key, SAMPLE_DOCUMENT[key]);

    // no existed get
    const doc3 = collection.get('noexisted');
    expect(doc3).to.be.eq(null);
  });

  it('should create many document and count query', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    for (let i = 0; i < SAMPLE_MAX; i++){
      await collection.create({
        ...SAMPLE_DOCUMENT,
        gender: i % 2 === 0 ? 'male' : 'female'
      });
    }

    const no = collection.count({ gender: 'male' });
    expect(no).to.be.eq(Math.round(SAMPLE_MAX/2));
  });

  it('should list document by query and controls', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    for (let i = 0; i < SAMPLE_MAX; i++){
      await collection.create({
        ...SAMPLE_DOCUMENT,
        gender: i % 2 === 0 ? 'male' : 'female'
      });
    }

    // default list
    const result = collection.list({});
    
    expect(result).to.has.property('total', SAMPLE_MAX);
    expect(result).to.has.property('skip', 0);
    expect(result).to.has.property('limit', DEFAULT_LIMIT);
    expect(result).to.has.property('data');
    expect(result.data.length).to.be.eq(DEFAULT_LIMIT);

    // list with query
    const result2 = collection.list({ gender: 'female' });

    expect(result2).to.has.property('total', Math.floor(SAMPLE_MAX/2));
    expect(result2).to.has.property('skip', 0);
    expect(result2).to.has.property('limit', DEFAULT_LIMIT);
    expect(result2).to.has.property('data');
    expect(result2.data.length).to.be.eq(Math.floor(SAMPLE_MAX/2));

    for (let doc of result2.data)
      expect(doc).to.has.property('gender', 'female');

    // list with controls
    const result3 = collection.list({}, { $sort: { gender: 1, _id: -1 }, $limit: 5, $skip: SAMPLE_MAX - 6 });

    expect(result3).to.has.property('total', 15);
    expect(result3).to.has.property('skip', SAMPLE_MAX - 6);
    expect(result3).to.has.property('limit', 5);
    expect(result3).to.has.property('data');
    expect(result3.data.length).to.be.eq(5);

    for (let doc of result3.data)
      expect(doc).to.has.property('gender', 'male');
  });

  it('should patch document', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    const doc = await collection.create(SAMPLE_DOCUMENT);
    await collection.create(SAMPLE_DOCUMENT);
    
    // simple change
    const no = await collection.patch({ _id: doc._id }, { $set: { foo: '123', age: 10, count: 1 }});
    const doc3 = collection.get(doc._id);

    expect(no).to.be.eq(1);
    expect(doc3).to.has.property('foo', '123');
    expect(doc3).to.has.property('age', 10);
    expect(doc3).to.has.property('count', 1);

    // inc dec
    const no2 = await collection.patch({ foo: '123' }, { $set: { foo: 'xyz' }, $inc: { count: 1, age: -2 }});
    const doc4 = collection.get(doc._id);

    expect(no2).to.be.eq(1);
    expect(doc4).to.has.property('foo', 'xyz');
    expect(doc4).to.has.property('age', 8);
    expect(doc4).to.has.property('count', 2);
  });

  it('should remove documents', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    for (let i = 0; i < SAMPLE_MAX; i++){
      await collection.create({
        ...SAMPLE_DOCUMENT,
        gender: i % 2 === 0 ? 'male' : 'female'
      });
    }

    const no = await collection.remove({ gender: 'male' });
    const result = collection.list({});

    expect(no).to.be.eq(Math.round(SAMPLE_MAX/2));
    for (let doc of result.data)
      expect(doc).to.has.property('gender', 'female');
  });

  it('should export and import', async () => {
    // init
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    await collection.create(SAMPLE_DOCUMENT);

    // export
    const filePath = await collection.export();
    const exportedFilePath = join(root, 'exported.json');
    await FileData(filePath).copyTo(exportedFilePath);
    await collection.create(SAMPLE_DOCUMENT);
    
    // import
    await collection.import(exportedFilePath);
    const result = await collection.list({});
    expect(result).to.has.property('total', 1);
  });
});
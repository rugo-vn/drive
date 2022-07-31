/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import rimraf from 'rimraf';

import { mem as memService } from '../src/index.js';
import { ServiceBroker } from 'moleculer';

const DEMO_COLLECTION_NAME = 'demo';
const SAMPLE_DOCUMENT = { foo: 'bar' };
const SAMPLE_ID = 123;
const SAMPLE_MAX = 15;
const DEMO_SETTINGS = { meta: { collection: DEMO_COLLECTION_NAME }};

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Mem service test', () => {
  const root = join(__dirname, '.cache');
  let broker;

  beforeEach(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    broker = new ServiceBroker();
    broker.createService({
      ...memService,
      settings: { storage: root }
    });

    await broker.start();
  });

  afterEach(async () => {
    await broker.stop();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  it('should create a document', async () => {
    const doc = await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);
    
    expect(doc).to.has.property('_id');

    for (let key in SAMPLE_DOCUMENT)
      expect(doc).to.has.property(key, SAMPLE_DOCUMENT[key]);
  });

  it('should create a document with existed id', async () => {
    const doc = await broker.call('mem.create', { doc: {
      _id: SAMPLE_ID,
      ...SAMPLE_DOCUMENT
    }}, DEMO_SETTINGS);
    
    expect(doc).to.has.property('_id', SAMPLE_ID);

    for (let key in SAMPLE_DOCUMENT)
      expect(doc).to.has.property(key, SAMPLE_DOCUMENT[key]);
  });

  it('should get a created document', async () => {
    const doc = await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);
    const [doc2] = await broker.call('mem.find', { filters: { _id: doc._id } }, DEMO_SETTINGS);
    
    expect(doc2).to.has.property('_id');

    for (let key in SAMPLE_DOCUMENT)
      expect(doc2).to.has.property(key, SAMPLE_DOCUMENT[key]);

    // no existed get
    const [doc3] = await broker.call('mem.find', { filters: { _id: 'noexisted' } }, DEMO_SETTINGS);
    expect(doc3).to.be.eq(undefined);
  });

  it('should create many document and count query', async () => {
    for (let i = 0; i < SAMPLE_MAX; i++){
      await broker.call('mem.create', { doc: {
        ...SAMPLE_DOCUMENT,
        gender: i % 2 === 0 ? 'male' : 'female'
      }}, DEMO_SETTINGS);
    }

    const no = await broker.call('mem.count', { filters: { gender: 'male' } }, DEMO_SETTINGS);
    expect(no).to.be.eq(Math.round(SAMPLE_MAX/2));
  });

  it('should list document by query and controls', async () => {
    for (let i = 0; i < SAMPLE_MAX; i++){
      await broker.call('mem.create', { doc: {
        ...SAMPLE_DOCUMENT,
        gender: i % 2 === 0 ? 'male' : 'female'
      }}, DEMO_SETTINGS);
    }

    // default list
    const result = await broker.call('mem.find', null, DEMO_SETTINGS);
    expect(result.length).to.be.eq(SAMPLE_MAX);

    // list with query
    const result2 = await broker.call('mem.find', { filters: { gender: 'female' } }, DEMO_SETTINGS);
    expect(result2.length).to.be.eq(Math.floor(SAMPLE_MAX/2));

    for (let doc of result2)
      expect(doc).to.has.property('gender', 'female');

    // list with controls
    const result3 = await broker.call('mem.find', { sort: { gender: 1, _id: -1 }, limit: 5, skip: SAMPLE_MAX - 6 }, DEMO_SETTINGS);
    expect(result3.length).to.be.eq(5);

    for (let doc of result3)
      expect(doc).to.has.property('gender', 'male');
  });

  it('should patch document', async () => {
    const doc = await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);
    await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);
    
    // simple change
    const no = await broker.call('mem.patch', { filters: { _id: doc._id }, set: { foo: '123', age: 10, count: 1 } }, DEMO_SETTINGS);
    const [doc4] = await broker.call('mem.find', { filters: { _id: doc._id } }, DEMO_SETTINGS);

    expect(no).to.be.eq(1);

    expect(doc4).to.has.property('foo', '123');
    expect(doc4).to.has.property('age', 10);
    expect(doc4).to.has.property('count', 1);

    // inc dec
    const no2 = await broker.call('mem.patch', { filters: { _id: doc._id }, set: { foo: 'xyz'}, inc: { count: 1, age: -2 } }, DEMO_SETTINGS);

    expect(no2).to.be.eq(1);
  });

  it('should remove documents', async () => {
    const doc = await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);
    await broker.call('mem.create', { doc: SAMPLE_DOCUMENT }, DEMO_SETTINGS);

    const no = await broker.call('mem.remove', { filters: { _id: doc._id } }, DEMO_SETTINGS);
    expect(no).to.be.eq(1);

    const [doc3] = await broker.call('mem.find', { filters: { _id: doc._id } }, DEMO_SETTINGS);
    expect(doc3).to.be.eq(undefined);
  });
});
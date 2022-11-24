/* eslint-disable */

import fs, { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBroker, FileCursor } from '@rugo-vn/service';
import { expect } from 'chai';
import rimraf from 'rimraf';

import { DIRECTORY_MIME } from '../src/utils.js';
import { clone, indexBy } from 'ramda';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = {
  name: 'demo'
};


describe('fs driver test', () => {
  const root = join(__dirname, '.cache');
  let broker;

  before(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    // create broker
    broker = createBroker({
      _services: [
        './src/fs/index.js'
      ],
      _globals: {
        ...indexBy(i => `schema.${i.name}`)([clone(schema)]),
      },
      driver: {
        fs: root,
      }
    });

    await broker.loadServices();
    await broker.start();
  });

  after(async () => {
    await broker.close();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  let docId;
  it('should create a doc', async () => {
    // no name file
    const doc = await broker.call(`driver.fs.create`, { data: { data: 'Hello world' }, name: schema.name });

    expect(doc).to.has.property('_id');
    expect(doc).to.has.property('name');
    expect(doc).to.has.property('mime');
    expect(doc).to.has.property('parent', '');
    expect(doc).to.has.property('size', 11);
    expect(doc).to.has.property('data');
    expect(doc.data.toText()).to.be.eq('Hello world');
    expect(doc).to.has.property('updatedAt');

    // no name file
    const doc2 = await broker.call(`driver.fs.create`, { data: { mime: DIRECTORY_MIME }, name: schema.name });
    expect(doc2).to.has.property('_id');
    expect(doc2).to.has.property('name');
    expect(doc2).to.has.property('mime', DIRECTORY_MIME);
    expect(doc2).to.has.property('parent', '');
    expect(doc2).to.has.property('size', 0);
    expect(doc2).to.has.property('updatedAt');

    // file with name
    const doc3 = await broker.call(`driver.fs.create`, { data: {
      name: 'sample.png', 
      parent: doc2._id,
      data: new FileCursor(join(__dirname, 'index.test.js')),
    }, name: schema.name });

    expect(doc3).to.has.property('_id');
    expect(doc3).to.has.property('name', 'sample.png');
    expect(doc3).to.has.property('mime', 'image/png');
    expect(doc3).to.has.property('parent', doc2._id);
    expect(doc3).to.has.property('size');
    expect(doc3.size).to.be.gt(0);
    expect(doc3).to.has.property('updatedAt');

    docId = doc3._id;
  });

  it('should find doc', async () => {
    // create list
    for (let x = 0; x < 3; x++){
      let docX = await broker.call(`driver.fs.create`, { data: { mime: DIRECTORY_MIME }, name: schema.name });
      for (let y = 0; y < 3; y++) {
        let docY = await broker.call(`driver.fs.create`, { data: { parent: docX._id, mime: DIRECTORY_MIME }, name: schema.name });
        for (let z = 0; z < 3; z++) {
          await broker.call(`driver.fs.create`, { data: { name: 'foo' + z, parent: docY._id }, name: schema.name });
        }
      }
    }

    // list all
    const docs = await broker.call(`driver.fs.find`, { limit: 10, skip: 6, name: schema.name });

    expect(docs).to.has.property('length', 10);
  });

  it('should count docs', async () => {
    const no = await broker.call(`driver.fs.count`, { name: schema.name });
    expect(no).to.be.eq(42);
  });

  it('should update docs', async () => {
    // single
    const no = await broker.call(`driver.fs.update`, { query: { _id: docId }, set: { name: 'foo.jpg', parent: '', data: 'Okla' }, name: schema.name });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent: '', mime: 'image/jpeg' }, name: schema.name });

    expect(docs[0]).to.has.property('name', 'foo.jpg');
    expect(docs[0]).to.has.property('mime', 'image/jpeg');
    expect(docs[0]).to.has.property('data');
    expect(docs[0].data.toText()).to.be.eq('Okla');

    docId = docs[0]._id;
  });

  it('should remove doc', async () => {
    const no = await broker.call(`driver.fs.remove`, { query: { _id: docId }, name: schema.name });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent: '', mime: 'image/jpeg' }, name: schema.name });
    expect(docs).to.has.property('length', 0);
  });
});
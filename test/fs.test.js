/* eslint-disable */

import fs, { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBroker } from '@rugo-vn/service';
import { expect } from 'chai';
import rimraf from 'rimraf';

import { DIRECTORY_MIME } from '../src/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = {
  _name: 'demo'
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
      driver: {
        fs: root,
      }
    });

    await broker.loadServices();
    await broker.start();
  });

  after(async () => {
    await broker.close();

    // if (fs.existsSync(root))
    //   rimraf.sync(root);
  });

  let docId;
  it('should create a doc', async () => {
    // no name file
    const doc = await broker.call(`driver.fs.create`, {}, { schema });

    expect(doc).to.has.property('_id');
    expect(doc).to.has.property('name');
    expect(doc).to.has.property('mime');
    expect(doc).to.has.property('parent', '');
    expect(doc).to.has.property('size', 0);
    expect(doc).to.has.property('updatedAt');

    // put file
    const res5 = await broker.put('driver.fs.upload', {
      id: doc._id,
      data: 'Hello World',
      schema,
    });
    expect(res5).to.be.eq(true);

    // download file
    const res6 = await broker.get('driver.fs.download', { id: doc._id, schema });
    const content = readFileSync(res6);
    expect(content.toString()).to.be.eq('Hello World');


    // no name file
    const doc2 = await broker.call(`driver.fs.create`, { data: { mime: DIRECTORY_MIME } }, { schema });
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
    }}, { schema });

    expect(doc3).to.has.property('_id');
    expect(doc3).to.has.property('name', 'sample.png');
    expect(doc3).to.has.property('mime', 'image/png');
    expect(doc3).to.has.property('parent', doc2._id);
    expect(doc3).to.has.property('size', 0);
    expect(doc3).to.has.property('updatedAt');

    docId = doc3._id;

    // put file
    const res4 = await broker.put('driver.fs.upload', {
      id: doc3._id,
      data: join(__dirname, './index.test.js'),
      schema,
    });
    expect(res4).to.be.eq(true);
  });

  return;

  it('should find doc', async () => {
    // create list
    for (let x = 0; x < 3; x++){
      let docX = await broker.call(`driver.fs.create`, { data: { mime: DIRECTORY_MIME } }, { schema });
      for (let y = 0; y < 3; y++) {
        let docY = await broker.call(`driver.fs.create`, { data: { parent: docX._id, mime: DIRECTORY_MIME } }, { schema });
        for (let z = 0; z < 3; z++) {
          await broker.call(`driver.fs.create`, { data: { name: 'foo' + z, parent: docY._id } }, { schema });
        }
      }
    }

    // list all
    const docs = await broker.call(`driver.fs.find`, { limit: 10, skip: 6 }, { schema });

    expect(docs).to.has.property('length', 10);
  });

  it('should count docs', async () => {
    const no = await broker.call(`driver.fs.count`, {}, { schema });
    expect(no).to.be.eq(42);
  });

  it('should update docs', async () => {
    // single
    const no = await broker.call(`driver.fs.update`, { query: { _id: docId }, set: { name: 'foo.jpg', parent: '' } }, { schema });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent: '', mime: 'image/jpeg' } }, { schema });

    expect(docs[0]).to.has.property('name', 'foo.jpg');
    expect(docs[0]).to.has.property('mime', 'image/jpeg');

    docId = docs[0]._id;

    // bulk (not available)
    // const no2 = await broker.call(`driver.fs.update`, { query: { name: 'foo1' }, set: { name: 'bar', parent: '' } }, { schema });
    // console.log(no2);
  });

  it('should remove doc', async () => {
    const no = await broker.call(`driver.fs.remove`, { query: { _id: docId } }, { schema });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent: '', mime: 'image/jpeg' } }, { schema });
    expect(docs).to.has.property('length', 0);
  });
});
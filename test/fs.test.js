/* eslint-disable */

import fs, { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBroker, FileCursor, FsId } from '@rugo-vn/service';
import { expect, assert } from 'chai';
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

  it('should not get doc', async () => {
    const data = await broker.call(`driver.fs.find`, { name: schema.name, query: { _id: 'notfound' } });
    expect(data).to.has.property('length', 0);
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

  it('should not create duplicate', async () => {
    const { 0: doc } = await broker.call(`driver.fs.find`, { name: schema.name, query: { _id: docId } });
    try {
      await broker.call(`driver.fs.create`, { data: {
        name: 'sample.png', 
        parent: doc.parent,
        data: new FileCursor(join(__dirname, 'index.test.js')),
      }, name: schema.name });
      assert.fail('should error');
    } catch (errs) {
      expect(errs[0]).to.has.property('message', `Duplicate unique value "${FsId(doc.parent).toPath()}/sample.png"`);
    }
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
    const docs = await broker.call(`driver.fs.find`, { limit: 10, skip: 6, sort: { updatedAt: -1 }, name: schema.name });

    expect(docs).to.has.property('length', 10);
  });

  it('should count docs', async () => {
    const no = await broker.call(`driver.fs.count`, { name: schema.name });
    expect(no).to.be.eq(42);
  });

  it('should update docs', async () => {
    const parent = FsId.fromPath('newparent');
    // single
    const no = await broker.call(`driver.fs.update`, { query: { _id: docId }, set: { name: 'foo.jpg', parent, data: 'Okla' }, name: schema.name });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent, mime: 'image/jpeg' }, name: schema.name });

    expect(docs[0]).to.has.property('name', 'foo.jpg');
    expect(docs[0]).to.has.property('mime', 'image/jpeg');
    expect(docs[0]).to.has.property('data');
    expect(docs[0].data.toText()).to.be.eq('Okla');

    docId = docs[0]._id;
  });

  it('should not update duplicated doc', async () => {
    const parent = FsId.fromPath('newparent');
    const doc = await broker.call(`driver.fs.create`, { data: { mime: 'text/plain' }, name: schema.name });

    try {
      await broker.call(`driver.fs.update`, { query: { _id: doc._id }, set: { name: 'foo.jpg', parent, data: 'Okla' }, name: schema.name });
      assert.fail('should error');
    } catch(errs) {
      expect(errs[0]).to.has.property('message', 'Duplicate unique value "newparent/foo.jpg"');
    }
  });

  it('should compress', async () => {
    const res = await broker.call(`driver.fs.compress`, {
      name: schema.name,
      id: docId,
    });

    expect(res).to.be.eq('Compress successfully');
  });

  it('should extract', async () => {
    const no = await broker.call(`driver.fs.remove`, { query: { _id: docId }, name: schema.name });
    expect(no).to.be.eq(1);

    const res = await broker.call(`driver.fs.extract`, {
      name: schema.name,
      id: FsId.fromPath(FsId(docId).toPath() + '.zip'),
    });

    expect(res).to.be.eq('Extract successfully');
  });

  it('should backup', async () => {
    const res = await broker.call(`driver.fs.backup`, {
      name: schema.name,
      file: join(root, '.backup'),
    });

    expect(res).to.be.eq('Backup successfully');
  });

  it('should remove doc', async () => {
    const parent = FsId.fromPath('newparent');
    const no = await broker.call(`driver.fs.remove`, { query: { _id: docId }, name: schema.name });
    expect(no).to.be.eq(1);

    const docs = await broker.call(`driver.fs.find`, { query: { parent, mime: 'image/jpeg' }, name: schema.name });
    expect(docs).to.has.property('length', 0);
  });

  it('should restore', async () => {
    const res = await broker.call(`driver.fs.restore`, {
      name: schema.name,
      file: join(root, '.backup'),
    });

    expect(res).to.be.eq('Restore successfully');

    const docs = await broker.call(`driver.fs.find`, { limit: 10, skip: 6, sort: { updatedAt: -1 }, name: schema.name });

    expect(docs).to.has.property('length', 10);
  });
});
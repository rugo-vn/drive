/* eslint-disable */

import fs from 'fs';
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

  it('should create a doc', async () => {
    // no name file
    const doc = await broker.call(`driver.fs.create`, {}, { schema });

    expect(doc).to.has.property('_id');
    expect(doc).to.has.property('name');
    expect(doc).to.has.property('mime');
    expect(doc).to.has.property('parent', '');
    expect(doc).to.has.property('size', 0);
    expect(doc).to.has.property('updatedAt');


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
  });

  it('should find doc', async () => {
    // create list
    for (let x = 0; x < 3; x++){
      let docX = await broker.call(`driver.fs.create`, { data: { mime: DIRECTORY_MIME } }, { schema });
      for (let y = 0; y < 3; y++) {
        let docY = await broker.call(`driver.fs.create`, { data: { parent: docX._id, mime: DIRECTORY_MIME } }, { schema });
        for (let z = 0; z < 3; z++) {
          await broker.call(`driver.fs.create`, { data: { parent: docY._id } }, { schema });
        }
      }
    }

    // list all
    const docs = await broker.call(`driver.fs.find`, { limit: 10, skip: 6 }, { schema });

    expect(docs).to.has.property('length', 10);
  });

  it('should update docs', async () => {

  });
});
/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import rimraf from 'rimraf';

import createFsDriver from '../src/fs.js';
import { globalCaches } from '../src/memoize.js';
import { expect } from 'chai';
import { CACHE_FS_KEY, DIRECTORY_MIME, DRIVER } from '../src/constants.js';
import { FileData, exec } from '@rugo-vn/common';
import base64url from 'base64url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_COLLECTION_NAME = 'demo';

describe('Mem Driver test', () => {
  const root = join(__dirname, '.cache');
  let driver;

  beforeEach(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    driver = await createFsDriver({ root });
  });

  afterEach(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    await driver.close();
  });

  it('should create driver with cache', async () => {
    const cachedDriver = await createFsDriver({ root, cache: true });
    const hitCachedDriver = await createFsDriver({ root, cache: true });
    
    expect(cachedDriver).to.be.not.eq(driver);
    expect(globalCaches).to.has.property(CACHE_FS_KEY);
    expect(cachedDriver).to.be.eq(hitCachedDriver);

    for (let key in DRIVER)
      expect(cachedDriver).to.has.property(key);

    await cachedDriver.close();
  });

  it('should create a collection', async () => {
    const mainCollection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const semiCollection = await driver.getCollection(DEMO_COLLECTION_NAME);

    expect(mainCollection).to.be.not.eq(semiCollection);
  });

  it('should be get id', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    const id = collection.id();
    expect(id).to.be.not.eq(null);
  });

  it('should create file and directory', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    // file
    const doc = await collection.create({
      name: 'xin-chao.txt'
    });

    expect(doc).to.has.property('_id');
    expect(doc).to.has.property('name', 'xin-chao.txt');
    expect(doc).to.has.property('mime');
    expect(doc).to.has.property('parent');
    expect(doc).to.has.property('data');
    expect(doc).to.has.property('updatedAt');

    // directory
    const doc2 = await collection.create({ name: 'foo', mime: DIRECTORY_MIME });

    expect(doc2).to.has.property('_id');
    expect(doc2).to.has.property('name', 'foo');
    expect(doc2).to.has.property('mime', DIRECTORY_MIME);
    expect(doc2).to.has.property('parent');
    expect(doc2).to.has.property('data', null);
    expect(doc2).to.has.property('updatedAt');

    // file in diretory
    const doc3 = await collection.create({
      name: 'xin-chao.txt',
      parent: doc2._id,
      data: FileData('./package.json')
    });

    expect(doc3).to.has.property('_id');
    expect(doc3).to.has.property('name', 'xin-chao.txt');
    expect(doc3).to.has.property('mime');
    expect(doc3).to.has.property('parent', doc2._id);
    expect(doc3).to.has.property('data');
    expect(doc3).to.has.property('updatedAt');

    expect(await doc3.data.compareWith(FileData('./package.json'))).to.be.eq(true);

    // no name
    const doc4 = await collection.create({});

    expect(doc4).to.has.property('_id');
    expect(doc4).to.has.property('name');
    expect(doc4).to.has.property('mime');
    expect(doc4).to.has.property('parent');
    expect(doc4).to.has.property('data');
    expect(doc4).to.has.property('updatedAt');
  });

  it('should not create duplicated file.', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const file = new FileData('./package.json');

    await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    const doc = await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    expect(doc).to.be.eq(null);
  });

  it('should count', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const file = new FileData('./package.json');

    await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    const result = await collection.count({});

    expect(result).to.be.eq(1);
  });

  it('should list', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const file = new FileData('./package.json');

    await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    // default parent
    const result = await collection.list({});

    expect(result).to.has.property('total', 1);
    expect(result).to.has.property('skip', 0);
    expect(result).to.has.property('limit', -1);
    expect(result).to.has.property('data');

    expect(result.data[0]).to.has.property('_id');
    expect(result.data[0]).to.has.property('name', 'xin-chao.txt');
    expect(result.data[0]).to.has.property('mime', 'text/plain');
    expect(result.data[0]).to.has.property('parent');
    expect(result.data[0]).to.has.property('data');
    expect(result.data[0]).to.has.property('updatedAt');

    expect(await result.data[0].data.compareWith(file)).to.be.eq(true);

    // specific parent
    const doc = await collection.create({ name: 'foo', mime: DIRECTORY_MIME });
    const result2 = await collection.list({ parent: doc._id });

    expect(result2).to.has.property('total', 0);
    expect(result2).to.has.property('skip', 0);
    expect(result2).to.has.property('limit', -1);
    expect(result2).to.has.property('data');

    // not existed parent
    const result3 = await collection.list({ parent: 'noexisted' });

    expect(result3).to.has.property('total', 0);
    expect(result3).to.has.property('skip', 0);
    expect(result3).to.has.property('limit', -1);
    expect(result3).to.has.property('data');
  });

  it('should patch file', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const file = new FileData('./package.json');

    // normal rename
    const doc = await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    const res = await collection.patch({ _id: doc._id } , { $set: {
      name: 'halo.jpg'
    }});
    expect(res).to.be.eq(1);

    // change parent
    const doc2 = await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    const res2 = await collection.patch({ _id: doc2._id} , { $set: {
      parent: base64url.encode('/foo')
    }});
    expect(res2).to.be.eq(1);

    // change with content
    const newFile = FileData('./README.md');

    const doc3 = await collection.create({
      name: 'foo.txt',
      data: file
    });

    const res3 = await collection.patch({ _id: doc3._id} , { $set: {
      data: newFile
    }});

    const doc4 = await collection.get(doc3._id);

    expect(res3).to.be.eq(1);
    expect(await doc4.data.compareWith(file)).to.be.eq(false);
    expect(await doc4.data.compareWith(newFile)).to.be.eq(true);

    // unexist file
    const res5 = await collection.patch({ _id: 'nofile' } , { $set: {
      name: 'halo.jpg'
    }});
    expect(res5).to.be.eq(0);
  });

  it('should remove a file', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);
    const file = new FileData('./package.json');

    // normal
    const doc = await collection.create({
      name: 'xin-chao.txt',
      data: file
    });

    const res = await collection.remove({ _id: doc._id });
    expect(res).to.be.eq(1);

    const nullDoc = await collection.get(doc._id);
    expect(nullDoc).to.be.eq(null);

    // non-existed
    const res2 = await collection.remove({ _id: 'nofile' });
    expect(res2).to.be.eq(0);
  });

  it('should export and import', async () => {
    const collection = await driver.getCollection(DEMO_COLLECTION_NAME);

    // create data
    await collection.create({
      name: 'xin-chao.txt'
    });
    const doc2 = await collection.create({ name: 'foo', mime: DIRECTORY_MIME });
    await collection.create({
      name: 'xin-chao.txt',
      parent: doc2._id,
      data: FileData('./package.json')
    });
    await collection.create({});

    // export
    const dirPath = await collection.export();
    const exportedDirPath = join(root, 'exported');
    await exec(`cp -rL "${dirPath}" "${exportedDirPath}"`);
    await collection.create({});

    // import
    await collection.import(exportedDirPath);
    const result = await collection.list({});
    expect(result).to.has.property('total', 3);
  });
});
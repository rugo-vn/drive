/* eslint-disable */

import { RugoException } from '@rugo-vn/service';
import { expect, assert } from 'chai';

import { FsId } from '../src/fs/fsid.js';

const ID_STRING = 'dGhpcy9pcy9hL3NhbXBsZS9wYXRo';
const TEST_PATH = 'this/is/a/sample/path';

describe('FsId test', () => {
  it('should create FsId from encoded Id', async () => {
    const id = FsId(ID_STRING);
    expect(id).to.has.property('id', ID_STRING);
    expect(`${id}`).to.be.eq(ID_STRING);
    expect(id.toPath()).to.be.eq(TEST_PATH);

    const id2 = new FsId(id);
    expect(id).to.not.eq(id2);
    expect(id2).to.has.property('id', ID_STRING);
  });

  it('should create FsId from path', async () => {
    const id = FsId.fromPath('/this/is/is/../a//sample/path');
    expect(id.toString()).to.be.eq(ID_STRING);
    expect(id.toPath()).to.be.eq(TEST_PATH);
  });

  it('should not create path from wrong id', async () => {
    try {
      new FsId(TEST_PATH);
      assert.fail('should error');
    } catch (err) {
      expect(err instanceof RugoException);
      expect(err).to.has.property('detail', 'Wrong input id');
    }
  });
});

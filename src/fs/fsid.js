import { join } from 'path';
import { path } from 'ramda';
import { RugoError } from '@rugo-vn/service';
import base64url from 'base64url';

const INVALID_PATH_REGEX = /[<>:"\\|?*\u0000-\u001F]/g;  // eslint-disable-line

/**
 *
 * @param {string} inputId encoded id
 * @returns {object} FsId object
 */
export function FsId (inputId) {
  if (!(this instanceof FsId)) { return new FsId(inputId); }

  let workingId;

  // clone id from object
  if (typeof path(['id'], inputId) === 'string') {
    workingId = inputId.id;
  }

  // create from string
  if (typeof inputId === 'string') {
    workingId = inputId;
  }

  if (typeof workingId !== 'string') { workingId = ''; }

  // try decode path
  const decodedId = base64url.decode(workingId);
  if (INVALID_PATH_REGEX.test(decodedId)) {
    throw new RugoError('Wrong input id');
  }

  // assign id
  this.id = workingId;
}

FsId.fromPath = function (originPath) {
  const formattedPath = join('/', originPath).substring(1);
  return new FsId(base64url.encode(formattedPath));
};

// output
FsId.prototype.toPath = function () {
  return base64url.decode(this.id);
};

FsId.prototype.toString = function (format) {
  return this.id.toString(format);
};

FsId.prototype.toJSON = function () {
  return this.id;
};

FsId.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
  return this.inspect();
};

FsId.prototype.inspect = function () {
  return 'new FsId("'.concat(this.id, '")');
};

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { RugoException } from '@rugo-vn/service';
import { path } from 'ramda';

export const name = 'driver.mem';

export * as methods from './methods.js';
export * as actions from './actions.js';
export * as hooks from './hooks.js';

export const started = function () {
  this.settings.root = path(['settings', 'driver', 'mem'], this);

  if (!this.settings.root) {
    throw new RugoException('Mem storage settings was not defined.');
  }

  this.ajv = new Ajv({ removeAdditional: true, useDefaults: true });
  addFormats(this.ajv);

  this.registers = {};
};

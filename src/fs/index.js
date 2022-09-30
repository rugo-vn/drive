import { RugoException } from '@rugo-vn/service';
import { path } from 'ramda';

export const name = 'driver.fs';

export * as actions from './actions.js';
export * as hooks from './hooks.js';

export const started = function () {
  this.settings.root = path(['settings', 'driver', 'fs'], this);

  if (!this.settings.root) {
    throw new RugoException('Fs storage settings was not defined.');
  }
};

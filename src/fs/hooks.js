import { curry } from 'ramda';
import { commonAllHook } from '../common/hooks.js';

export const before = {
  all: curry(commonAllHook)(async function () {})
};

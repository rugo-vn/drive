import { curry } from 'ramda';
import { commonAllHook, commonCreateHook, commonUpdateHook } from '../common/hooks.js';

export const before = {
  all: curry(commonAllHook)(async function (args) {
    const { name } = args;
    return await this.createCollection(name);
  }),
  create: commonCreateHook,
  update: commonUpdateHook
};

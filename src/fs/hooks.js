import { RugoError } from '@rugo-vn/service';
import { path } from 'ramda';

export const before = {
  all (args) {
    const name = path(['schema', '_name'], args);
    if (!name) { throw new RugoError(`Schema ${args.schema ? '_name ' : ''}is not defined.`); }

    const { schema } = args;

    // clean
    for (const key in schema) {
      if (key[0] === '_') { delete schema[key]; }
    }

    args.collection = name;
  }
};

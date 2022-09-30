import { join } from 'path';

import { path } from 'ramda';
import { Low, JSONFile } from 'lowdb';
import hash from 'object-hash';

import { ValidationError } from '../exception.js';
import { RugoException } from '@rugo-vn/service';

export const before = {
  async all (args) {
    const name = path(['schema', '_name'], args);
    if (!name) { throw new RugoException(`Schema ${args.schema ? '_name ' : ''}is not defined.`); }

    const { schema } = args;

    const hashed = hash(schema);

    // indexes
    args.uniques = schema._uniques || [];

    // clean
    for (const key in schema) {
      if (key[0] === '_') { delete schema[key]; }
    }

    const register = this.registers[name] || {};
    if (register.hashed !== hashed) {
      const file = join(this.settings.root, name);
      const adapter = new JSONFile(file);
      const collection = new Low(adapter);

      await collection.read();
      collection.data ||= [];
      await collection.write();

      register.name = name;
      register.hashed = hashed;
      register.collection = collection;

      this.registers[name] = register;
    }

    args.collection = register.collection;
  }
};

export const error = {
  all (originErr) {
    if (Array.isArray(originErr)) {
      const errors = [];

      for (const raw of originErr) {
        switch (raw.keyword) {
          // non-nested
          case 'required':
            errors.push(new ValidationError(`Required value for properties "${raw.params.missingProperty}"`));
            break;

          case 'minimum':
          case 'maximum':
            errors.push(new ValidationError(`Value ${raw.value} is out of ${raw.keyword} range ${raw.params.limit}`));
            break;

          default:
            errors.push(new ValidationError(`Document failed validation in operation "${raw.keyword}"`));
        }
      }

      throw errors;
    }
  }
};

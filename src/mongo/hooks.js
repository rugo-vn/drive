import { path } from 'ramda';
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
    const searches = schema._searches || [];
    const uniques = schema._uniques || [];
    const indexes = schema._indexes || [];

    args.searches = searches;
    args.uniques = uniques;
    args.indexes = indexes;

    // clean
    for (const key in schema) {
      if (key[0] === '_') { delete schema[key]; }
    }

    const register = this.registers[name] || {};
    if (register.hashed !== hashed) {
      // create collection
      const collection = (await this.db.listCollections().toArray()).map(i => i.name).indexOf(name) === -1
        ? await this.db.createCollection(name)
        : this.db.collection(name);

      // validator
      await this.db.command({
        collMod: name,
        validator: {
          $jsonSchema: schema
        }
      });

      // indexes
      const newIndexes = {};
      for (const property of indexes) { newIndexes[property] = { dir: 1, unique: false }; }

      for (const property of searches) { newIndexes[property] = { dir: 'text', unique: false }; }

      for (const property of uniques) {
        newIndexes[property] = {
          ...(newIndexes[property] || { dir: 1 }),
          unique: true
        };
      }

      // drop old indexes
      await collection.dropIndexes();

      // create new indexes
      for (const indexName in newIndexes) {
        const index = newIndexes[indexName];

        await collection.createIndex({ [indexName]: index.dir }, { name: indexName, unique: index.unique });
      }

      register.name = name;
      register.hashed = hashed;
      register.collection = collection;

      this.registers[name] = register;
    }

    args.register = register;
    args.collection = register.collection;
  }
};

const parseSchemaErrors = schemaErrors => {
  let errors = [];
  for (const raw of schemaErrors) {
    switch (raw.operatorName) {
      // nested
      case 'properties':
        for (const prop of raw.propertiesNotSatisfied) {
          const nextErrors = parseSchemaErrors(prop.details);
          errors = [...errors, ...nextErrors];
        }
        break;

      // non-nested
      case 'required':
        errors.push(new ValidationError(`Required value for properties ${raw.missingProperties.map(i => `"${i}"`).join(', ')}`));
        break;

      case 'minimum':
      case 'maximum':
        errors.push(new ValidationError(`Value ${raw.consideredValue} is out of ${raw.operatorName} range ${raw.specifiedAs[raw.operatorName]}`));
        break;

      default:
        errors.push(new ValidationError(`Document failed validation in operation "${raw.operatorName}"`));
    }
  }

  return errors;
};

export const error = {
  all (originErr) {
    const schemaErrors = path(['errInfo', 'details', 'schemaRulesNotSatisfied'], originErr);

    if (schemaErrors) {
      throw parseSchemaErrors(schemaErrors);
    }

    // unique error
    if (originErr.code === 11000) {
      throw new ValidationError(`Duplicate unique value "${originErr.keyValue[Object.keys(originErr.keyValue)[0]]}"`);
    }
  }
};

import { join } from 'path';
import { Low, JSONFile } from 'lowdb';

export const validateProperty = function (schema, key, value) {
  const validate = this.ajv.compile({
    type: 'object',
    properties: {
      [key]: schema.properties[key]
    }
  });

  if (!validate({ [key]: value })) {
    return validate.errors.map(raw => {
      raw.value = value;
      return raw;
    });
  }

  return [];
};

export const createCollection = async function (name) {
  const file = join(this.settings.root, name);
  const adapter = new JSONFile(file);
  const collection = new Low(adapter);

  await collection.read();
  collection.data ||= [];
  await collection.write();

  return collection;
};

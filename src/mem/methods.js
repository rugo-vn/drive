import { join } from 'path';
import { Low, JSONFile } from 'lowdb';

export const createCollection = async function (name) {
  const file = join(this.settings.root, name);
  const adapter = new JSONFile(file);
  const collection = new Low(adapter);

  await collection.read();
  collection.data ||= [];
  await collection.write();

  return collection;
};

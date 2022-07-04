# Rugo Model

Rugo Drivers for contact with databases, filesystems.

## Requirements

You must have [MongoDB Tools](https://www.mongodb.com/docs/database-tools/installation/installation/) installed to use `import/export` with mongo driver.

## Usage

### Create Drivers

**Independent**

```js
import { createMongoDriver, createMemDriver, createFsDriver } from 'rugo-driver';

const mongoDriver = await createMongoDriver({ uri: '/the/connection/uri', cache: true });
const memDriver = await createMemDriver({ root: '/the/root/directory', cache: true });
const fsDriver = await createFsDriver({ root: '/the/root/directory', cache: true });
```

**Plugin**

```js
import DriverPlugin from 'rugo-driver/plugin';

context = await DriverPlugin(context, { 
  uri: '/the/connection/uri', 
  root: '/the/root/directory',
  cache: true
});

console.log(context);
/*
{
  ...
  driver: { mongo, mem, fs }
  ...
}
*/

```

## Basic Operation

```js
const collection = await driver.getCollection('collection-name');

await collection.id(id);
await collection.get(id);
await collection.count(query);
await collection.list(query, controls);
await collection.create(doc);
await collection.patch(query, controls);
await collection.remove(query);

await collection.close();
```

## Concept

### Structure

Driver -> Collection -> Document

### Caching

In MongoDB, when cache enabled, the entry point of driver and collections of its will be save to the cache memory.

## API

[Visit API documentation.](./docs/API.md)

## License

MIT
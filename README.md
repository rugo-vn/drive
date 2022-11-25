# Rugo Driver

_Destination Service_

Rugo Drivers for contact with databases, filesystems.

## Overview

- An idea is using common action to handle assets (database, filesystem,...)
- An unit is using in all driver service called `doc`.

## Settings

```js
const settings = {
  driver: {
    mongo: /* mongo db connection string */,
    mem: /* root directory */,
    fs: /* root directory */,
  },

  /* you can pass schemas directly by */
  _globals: {
    'schema.<name>': /* sth */,
  }
}
```

## Commom

### Input Args

- These services shared same action structure and have `name` argument, which is a schema's name, as required. Then, it will take `schema` from `globals` (shared between services).
- The schema will be transform and validate by `@rugo-vn/schema`.

### Schema

We have some additions root attribute in schema.

- `name`: Name of schema, it will compare with `name` argument.
- `uniques`: Array of root properties need to be unique.
- `searches`: Array of root properties need to be search.

### Fs Doc

```js
{
  name: /* file/dir name */,
  mime: /* mine of file or 'inode/directory' */,
  parent: /* parent directory id */,
  size: /* file size or 0 if directory */,
  data: /* file cursor to file */,
  updatedAt: /* mtime */
}
```

## Actions

### `find`

Arguments:

- `query` (type: `object`) query to filter doc.
- `limit` (type: `number`) limit document returned.
- `sort` (type: `object`) sort by field. (Ex: `sort: { 'nameAsc': 1, 'nameDesc': -1 }`).
- `skip` (type: `number`) skip amount of doc.
- `search` (type: `string`) search with text.

Return: 

- `{[doc]}` array of doc.

_Notes:_

- `sort` in `fs` driver sorts in entire directory only (same parent).

### `count`

Arguments:

- `query` (type: `object`) query to filter doc.

Return: 

- `{number}` amount of doc filtered by query.

### `create`

Arguments:

- `data` (type: `object`) data to create new doc.

Return: 

- `{doc}` created doc.

_Notes:_

- In `fs` driver, you can create a doc with `name` and `parent` property only.


### `update`

Arguments:

- `query` (type: `object`) query to filter doc.
- `set` (type: `object`) set value to some field.
- `unset` (type: `object`) unset value from some field.
- `inc` (type: `object`) increase value from some field.

Return: 

- `{number}` amount of doc updated.

_Notes:_

- In `fs` driver, you can update a doc (only one doc specified by `_id` property) with `name` and `parent` property with `set` method only. 

### `remove`

Arguments:

- `query` (type: `object`) query to filter doc.

Return: 

- `{number}` amount of doc removed.

_Notes:_

- In `fs` driver, you can remove a doc (only one doc specified by `_id` property).

## License

MIT
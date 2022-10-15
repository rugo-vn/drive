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
  }
}
```

## Commom

### Input Args

These services shared same action structure and have `schema` argument as required, the returned below will be wrapped by response format in the next section.

### Schema

Service can use schema for validation. Following [JSON Schema](https://json-schema.org/) with additions in the root:

| Name | `driver.mongo` | `driver.mem` | `driver.fs` |
|-|-|-|-|
| `_name` | Collection name | File name | Directory name |
| `_indexes` | Yes | No | No |
| `_searches` | Yes | No | No |
| `_uniques` | Yes | Yes | No |

```js
{
  _name: 'collectionName',
  _searches: ['fieldNameA'],
  _indexes: ['fieldNameB'],
  _uniques: ['fieldNameC'],
}
```

_Note:_

- All system fields (with underscore prefix) will be removed when passed to deeper step.
- `fs` driver should have `_name` only.

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

### FsId

This is a special encoded identity for `fs` driver to determine a file or a directory.

```js
id = FsId('<your_encoded_id>'); /* returned FsId object */

/* from path */

id = FsId.fromPath('<your_origin_path>'); /* path that excluded root */

/* to path */
filePath = id.toPath();
```

## Actions

### `find`

Arguments:

- `query` (type: `object`) query to filter doc.
- `limit` (type: `number`) limit document returned.
- `sort` (type: `object`) sort by field. (Ex: `sort: { 'nameAsc': 1, 'nameDesc': -1 }`).
- `skip` (type: `number`) skip amount of doc.

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
## Constants

<dl>
<dt><a href="#doCount">doCount</a> ⇒ <code>number</code></dt>
<dd><p>Count all item result.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#encodeId">encodeId(p)</a> ⇒ <code>string</code></dt>
<dd><p>Encode path to id (base64url)</p>
</dd>
<dt><a href="#decodeId">decodeId(id)</a> ⇒ <code>string</code></dt>
<dd><p>Decode id to path.</p>
</dd>
<dt><a href="#doId">doId(id)</a> ⇒ <code>*</code></dt>
<dd><p>Generate id or check.</p>
</dd>
<dt><a href="#doGet">doGet(root, id)</a> ⇒ <code>Document</code></dt>
<dd><p>Get a document.</p>
</dd>
<dt><a href="#doCreate">doCreate(root, doc)</a> ⇒ <code>Document</code></dt>
<dd><p>Create a file or directory</p>
</dd>
<dt><a href="#listByQuery">listByQuery(root, query)</a> ⇒ <code>Array</code></dt>
<dd><p>List all item in parent directory.</p>
</dd>
<dt><a href="#doList">doList(root, query)</a> ⇒ <code>object</code></dt>
<dd><p>List documents.</p>
</dd>
<dt><a href="#doPatch">doPatch(root, query, controls)</a> ⇒ <code>number</code></dt>
<dd><p>Patch documents.</p>
</dd>
<dt><a href="#doRemove">doRemove(root, query)</a> ⇒ <code>number</code></dt>
<dd><p>Remove documents</p>
</dd>
<dt><a href="#getCollection">getCollection(root, name)</a> ⇒ <code>Collection</code></dt>
<dd><p>Get collection for data processing.</p>
</dd>
<dt><a href="#createFsDriver">createFsDriver(config)</a> ⇒ <code><a href="#Driver">Driver</a></code></dt>
<dd><p>Fs Driver is a driver store and manage file system.</p>
<p>This function create Fs Driver for use.</p>
</dd>
<dt><a href="#doCreate">doCreate(db, doc)</a> ⇒ <code>Document</code></dt>
<dd><p>Create a new document</p>
</dd>
<dt><a href="#doGet">doGet(db, id)</a> ⇒ <code>Document</code></dt>
<dd><p>Get a document by id.</p>
</dd>
<dt><a href="#doCount">doCount(db, query)</a> ⇒ <code>number</code></dt>
<dd><p>Count document by query.</p>
</dd>
<dt><a href="#doList">doList(db, query, controls)</a> ⇒ <code>object</code></dt>
<dd><p>List documents.</p>
</dd>
<dt><a href="#doPatch">doPatch(db, query, controls)</a> ⇒ <code>number</code></dt>
<dd><p>Patch documents.</p>
</dd>
<dt><a href="#doRemove">doRemove(db, query)</a> ⇒ <code>number</code></dt>
<dd><p>Remove documents</p>
</dd>
<dt><a href="#getCollection">getCollection(root, name)</a> ⇒ <code>Collection</code></dt>
<dd><p>Get collection for data processing. Each collection is stored with one file.</p>
</dd>
<dt><a href="#createMemDriver">createMemDriver(config)</a> ⇒ <code><a href="#Driver">Driver</a></code></dt>
<dd><p>Mem Driver is a driver store data in memory and file system. It&#39;s fast, lightweight and ready for quick saving.</p>
<p>It use LowDB as a core for read and save. Ramda is used for data query.</p>
<p>This function create Mem Driver for use.</p>
</dd>
<dt><a href="#createMemoizeWith">createMemoizeWith(name, keyGen, fn, cacheFn)</a> ⇒ <code>function</code></dt>
<dd><p>Takes a string-returning function <code>keyGen</code> and a function <code>fn</code> and returns
a new function that returns cached results for subsequent
calls with the same arguments.</p>
<p>When the function is invoked, <code>keyGen</code> is applied to the same arguments
and its result becomes the cache key. If the cache contains something
under that key, the function simply returns it and does not invoke <code>fn</code> at all.</p>
<p>Otherwise <code>fn</code> is applied to the same arguments and its return value
is cached under that key and returned by the function.</p>
<p>Care must be taken when implementing <code>keyGen</code> to avoid key collision,
or if tracking references, memory leaks and mutating arguments.</p>
<p>The cache is saved in global variable which named <code>globalCaches</code>.</p>
</dd>
<dt><a href="#getDatabase">getDatabase(uri)</a> ⇒ <code><a href="#MongoInstance">MongoInstance</a></code></dt>
<dd><p>Get MongoDB instance.</p>
</dd>
<dt><a href="#doCreate">doCreate(collection, doc)</a> ⇒ <code>Document</code></dt>
<dd><p>Create a new document</p>
</dd>
<dt><a href="#doGet">doGet(collection, id)</a> ⇒ <code>Document</code></dt>
<dd><p>Get a document by id.</p>
</dd>
<dt><a href="#doCount">doCount(collection, query)</a> ⇒ <code>number</code></dt>
<dd><p>Count document by query.</p>
</dd>
<dt><a href="#doList">doList(collection, query, controls)</a> ⇒ <code>object</code></dt>
<dd><p>List documents.</p>
</dd>
<dt><a href="#doPatch">doPatch(collection, query, controls)</a> ⇒ <code>number</code></dt>
<dd><p>Patch documents.</p>
</dd>
<dt><a href="#doRemove">doRemove(collection, query)</a> ⇒ <code>number</code></dt>
<dd><p>Remove documents</p>
</dd>
<dt><a href="#getCollection">getCollection(ins, name)</a> ⇒ <code>Collection</code></dt>
<dd><p>Get collection for data processing.</p>
</dd>
<dt><a href="#createMongoDriver">createMongoDriver(config)</a> ⇒ <code><a href="#Driver">Driver</a></code></dt>
<dd><p>Mongo Driver is a driver store data in mongodb. It suitable for saving complex data with large amount.</p>
<p>This function create Mongo Driver for use.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Driver">Driver</a> : <code>object</code></dt>
<dd><p>Driver structure.</p>
</dd>
<dt><a href="#MongoInstance">MongoInstance</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="doCount"></a>

## doCount ⇒ <code>number</code>
Count all item result.

**Kind**: global constant  
**Returns**: <code>number</code> - Count.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory for handle. Required. |
| query | <code>object</code> | Query to find, valid properties: parent. |

<a name="encodeId"></a>

## encodeId(p) ⇒ <code>string</code>
Encode path to id (base64url)

**Kind**: global function  
**Returns**: <code>string</code> - Encode result.  

| Param | Type | Description |
| --- | --- | --- |
| p | <code>string</code> | Path to encode. |

<a name="decodeId"></a>

## decodeId(id) ⇒ <code>string</code>
Decode id to path.

**Kind**: global function  
**Returns**: <code>string</code> - decode result.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | id to decode. |

<a name="doId"></a>

## doId(id) ⇒ <code>\*</code>
Generate id or check.

**Kind**: global function  
**Returns**: <code>\*</code> - Checked Id or a new ID.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>\*</code> | Id to check. Optional. |

<a name="doGet"></a>

## doGet(root, id) ⇒ <code>Document</code>
Get a document.

**Kind**: global function  
**Returns**: <code>Document</code> - Result, doc information.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory to find. |
| id | <code>string</code> | Doc id. |

<a name="doCreate"></a>

## doCreate(root, doc) ⇒ <code>Document</code>
Create a file or directory

**Kind**: global function  
**Returns**: <code>Document</code> - A created document.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory for handle. Required. |
| doc | <code>Document</code> | A document to be created. Required. |

<a name="listByQuery"></a>

## listByQuery(root, query) ⇒ <code>Array</code>
List all item in parent directory.

**Kind**: global function  
**Returns**: <code>Array</code> - Array of paths.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root of the project. |
| query | <code>object</code> | Query to find, valid properties: parent. |

<a name="doList"></a>

## doList(root, query) ⇒ <code>object</code>
List documents.

**Kind**: global function  
**Returns**: <code>object</code> - List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory for handle. Required. |
| query | <code>object</code> | Query to find, valid properties: parent. |

<a name="doPatch"></a>

## doPatch(root, query, controls) ⇒ <code>number</code>
Patch documents.

**Kind**: global function  
**Returns**: <code>number</code> - No.changed documents. Values: 0, 1.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory for handle. Required. |
| query | <code>object</code> | Match exact query object. Valid properties: parent. |
| controls | <code>object</code> | Control list result, maybe contains: $set. |

<a name="doRemove"></a>

## doRemove(root, query) ⇒ <code>number</code>
Remove documents

**Kind**: global function  
**Returns**: <code>number</code> - No.removed document. Values: 0, 1.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory for handle. Required. |
| query | <code>object</code> | Match exact query object. Valid properties: _id. |

<a name="getCollection"></a>

## getCollection(root, name) ⇒ <code>Collection</code>
Get collection for data processing.

**Kind**: global function  
**Returns**: <code>Collection</code> - Collection handlers.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory. Required. |
| name | <code>string</code> | Collection name. Required. |

<a name="createFsDriver"></a>

## createFsDriver(config) ⇒ [<code>Driver</code>](#Driver)
Fs Driver is a driver store and manage file system.

This function create Fs Driver for use.

**Kind**: global function  
**Returns**: [<code>Driver</code>](#Driver) - Driver handler.  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Driver configuration. |
| config.root | <code>string</code> | Root directory to store. Required. |
| config.cache | <code>boolean</code> | Enable cache. Default: `false`. |

<a name="doCreate"></a>

## doCreate(db, doc) ⇒ <code>Document</code>
Create a new document

**Kind**: global function  
**Returns**: <code>Document</code> - A created document.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| doc | <code>Document</code> | A document to be created. Required. |

<a name="doGet"></a>

## doGet(db, id) ⇒ <code>Document</code>
Get a document by id.

**Kind**: global function  
**Returns**: <code>Document</code> - Document needed.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| id | <code>\*</code> | Id of document need to find. |

<a name="doCount"></a>

## doCount(db, query) ⇒ <code>number</code>
Count document by query.

**Kind**: global function  
**Returns**: <code>number</code> - Count.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| query | <code>object</code> | Match exact query object. |

<a name="doList"></a>

## doList(db, query, controls) ⇒ <code>object</code>
List documents.

**Kind**: global function  
**Returns**: <code>object</code> - List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| query | <code>object</code> | Match exact query object. |
| controls | <code>object</code> | Control list result, maybe contains: $limit, $sort, $skip |

<a name="doPatch"></a>

## doPatch(db, query, controls) ⇒ <code>number</code>
Patch documents.

**Kind**: global function  
**Returns**: <code>number</code> - No of changed documents.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| query | <code>object</code> | Match exact query object. |
| controls | <code>object</code> | Control list result, maybe contains: $set, $inc. |

<a name="doRemove"></a>

## doRemove(db, query) ⇒ <code>number</code>
Remove documents

**Kind**: global function  
**Returns**: <code>number</code> - No removed document.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>LowDB</code> | LowDB object, for read and write. Required. |
| query | <code>object</code> | Match exact query object. |

<a name="getCollection"></a>

## getCollection(root, name) ⇒ <code>Collection</code>
Get collection for data processing. Each collection is stored with one file.

**Kind**: global function  
**Returns**: <code>Collection</code> - Collection handlers.  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | Root directory to store collection. Required. |
| name | <code>string</code> | Collection name. Required. |

<a name="createMemDriver"></a>

## createMemDriver(config) ⇒ [<code>Driver</code>](#Driver)
Mem Driver is a driver store data in memory and file system. It's fast, lightweight and ready for quick saving.

It use LowDB as a core for read and save. Ramda is used for data query.

This function create Mem Driver for use.

**Kind**: global function  
**Returns**: [<code>Driver</code>](#Driver) - Driver handler.  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Driver configuration. |
| config.root | <code>string</code> | Root directory to store collection. Required. |
| config.cache | <code>boolean</code> | Enable cache. Default: `false`. |

<a name="createMemoizeWith"></a>

## createMemoizeWith(name, keyGen, fn, cacheFn) ⇒ <code>function</code>
Takes a string-returning function `keyGen` and a function `fn` and returns
a new function that returns cached results for subsequent
calls with the same arguments.

When the function is invoked, `keyGen` is applied to the same arguments
and its result becomes the cache key. If the cache contains something
under that key, the function simply returns it and does not invoke `fn` at all.

Otherwise `fn` is applied to the same arguments and its return value
is cached under that key and returned by the function.

Care must be taken when implementing `keyGen` to avoid key collision,
or if tracking references, memory leaks and mutating arguments.

The cache is saved in global variable which named `globalCaches`.

**Kind**: global function  
**Returns**: <code>function</code> - Memoized version of `fn`.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of cache set in global. |
| keyGen | <code>function</code> | The function to generate the cache key. |
| fn | <code>function</code> | The function to memoize. |
| cacheFn | <code>function</code> | Handle argument for condition enable cached when return is true. Default return is always true. |

<a name="getDatabase"></a>

## getDatabase(uri) ⇒ [<code>MongoInstance</code>](#MongoInstance)
Get MongoDB instance.

**Kind**: global function  
**Returns**: [<code>MongoInstance</code>](#MongoInstance) - Custom MongoDB Instance  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | MongoDB connection string. |

<a name="doCreate"></a>

## doCreate(collection, doc) ⇒ <code>Document</code>
Create a new document

**Kind**: global function  
**Returns**: <code>Document</code> - A created document.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| doc | <code>object</code> | A document to be created. Required. |

<a name="doGet"></a>

## doGet(collection, id) ⇒ <code>Document</code>
Get a document by id.

**Kind**: global function  
**Returns**: <code>Document</code> - Document needed.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| id | <code>ObjectId</code> | Id of document need to find. |

<a name="doCount"></a>

## doCount(collection, query) ⇒ <code>number</code>
Count document by query.

**Kind**: global function  
**Returns**: <code>number</code> - Count.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| query | <code>object</code> | Match exact query object. |

<a name="doList"></a>

## doList(collection, query, controls) ⇒ <code>object</code>
List documents.

**Kind**: global function  
**Returns**: <code>object</code> - List result, contains: total (total of query result), skip (no skip documents), limit (no limit documents), data (list document).  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| query | <code>object</code> | Match exact query object. |
| controls | <code>object</code> | Control list result, maybe contains: $limit, $sort, $skip |

<a name="doPatch"></a>

## doPatch(collection, query, controls) ⇒ <code>number</code>
Patch documents.

**Kind**: global function  
**Returns**: <code>number</code> - No of changed documents.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| query | <code>object</code> | Match exact query object. |
| controls | <code>object</code> | Control list result, maybe contains: $set, $inc. |

<a name="doRemove"></a>

## doRemove(collection, query) ⇒ <code>number</code>
Remove documents

**Kind**: global function  
**Returns**: <code>number</code> - No removed document.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>MongoCollection</code> | MongoDB collection. |
| query | <code>object</code> | Match exact query object. |

<a name="getCollection"></a>

## getCollection(ins, name) ⇒ <code>Collection</code>
Get collection for data processing.

**Kind**: global function  
**Returns**: <code>Collection</code> - Collection handlers.  

| Param | Type | Description |
| --- | --- | --- |
| ins | [<code>MongoInstance</code>](#MongoInstance) | MongoDB Instance to store collection. Required. |
| name | <code>string</code> | Collection name. Required. |

<a name="createMongoDriver"></a>

## createMongoDriver(config) ⇒ [<code>Driver</code>](#Driver)
Mongo Driver is a driver store data in mongodb. It suitable for saving complex data with large amount.

This function create Mongo Driver for use.

**Kind**: global function  
**Returns**: [<code>Driver</code>](#Driver) - Driver handler.  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Driver configuration. |
| config.uri | <code>string</code> | Connection URI. |
| config.cache | <code>boolean</code> | Enable cache. Default: `false`. |

<a name="Driver"></a>

## Driver : <code>object</code>
Driver structure.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| getCollection | <code>function</code> | Default get collection. |
| close | <code>function</code> | Default close. |

<a name="MongoInstance"></a>

## MongoInstance : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | Mongodb connection string. |
| client | <code>object</code> | Mongodb client. |
| db | <code>object</code> | Db instance. |


## v0.10.0: minor usability enhancements (2020-01-01)

### Highlights

- message-store: ease creation of entity stream names from a category.
- messaging: add convenience method `assertStreamWritesInitial` for asserting a set of writes occurred at the start of a stream.
- messaging: bug fix: raise correct error when asserting a set of writes occurred but no writes were made

### Commits

- ([`909c93a`](https://github.com/mpareja/gearshaft/commit/909c93a91d22a581f4f1aec59b33d8d5d37113c1)) messaging: write: add assertStreamWritesInitial
- ([`ee7218c`](https://github.com/mpareja/gearshaft/commit/ee7218cdb8ea79d77202e3dd532309da3289c6b9)) messaging: write: substitute: fix asserting expected version when no writes
- ([`7c2228d`](https://github.com/mpareja/gearshaft/commit/7c2228d6115c84499b9c82a7418c57e7393384d6)) message-store: category: support creating entity stream names

## v0.9.0: consumer group support (2019-12-22)

### Highlights

- consumer: support parallel processing via consumer groups.
- message-store: support filtering messages in a category by consumer group.

### Commits

- ([`ef90298`](https://github.com/mpareja/gearshaft/commit/ef9029828fed113fddce49b3f742c4ec5267efec)) package: upgrade pg to 7.15.1
- ([`95f6969`](https://github.com/mpareja/gearshaft/commit/95f6969146d440ac99821377b097082c4fc1c86f)) message-store: support configuring group size/member via env variable
- ([`1f37027`](https://github.com/mpareja/gearshaft/commit/1f370276c5dd290d05e59aeba3c03a9628860873)) consumer: support consumer group
- ([`535b99c`](https://github.com/mpareja/gearshaft/commit/535b99c4ea600120641e55e966e6f3a912abc04c)) message-store: getCategory: support consumer groups
- ([`8ff542b`](https://github.com/mpareja/gearshaft/commit/8ff542bea8970d35625cfd9620ac0110038f7035)) message-store: StreamName: support parsing cardinal id
- ([`10db52a`](https://github.com/mpareja/gearshaft/commit/10db52ac553553211aea478315b4adbc39c21b56)) tools: add release note generator
- ([`b94a969`](https://github.com/mpareja/gearshaft/commit/b94a9696cf040bcb39fe59ac876938064c9d1f90)) CHANGELOG: reformat commit sections

## v0.8.0: support correlated messaging

### Highlights

- message-store: messages read from a category can now be filtered by supplying a `correlation` category name.
- consumer: a consumer can now ignore messages unrelated to its workflows by specifying the `correlation` option. Only messages with a `correlation_stream_name` matching the supplied `correlation` category will be consumed.
- **BREAKING**: get/read now accept position as a named option rather than positional parameter.

### Commits

- ([`fc713f0`](https://github.com/mpareja/gearshaft/commit/fc713f0)) message-store: add basic getStream benchmark
- ([`43ee2e7`](https://github.com/mpareja/gearshaft/commit/43ee2e7)) benchmark: include node version in results
- ([`dfa4370`](https://github.com/mpareja/gearshaft/commit/dfa4370)) consumer: use benchmark library and adjust result schema accordingly
- ([`77aebc9`](https://github.com/mpareja/gearshaft/commit/77aebc9)) benchmark: add writeStatsFile
- ([`9def2f8`](https://github.com/mpareja/gearshaft/commit/9def2f8)) benchmark: add computeStats and getSystemInfo functions and tests
- ([`f47e19f`](https://github.com/mpareja/gearshaft/commit/f47e19f)) consumer: move bulkWrite and cycle out of consumer
- ([`c74695b`](https://github.com/mpareja/gearshaft/commit/c74695b)) consumer: update noop-consumer benchmark results
- ([`cbff5ca`](https://github.com/mpareja/gearshaft/commit/cbff5ca)) message-store: get supports filtering by correlation stream name
- ([`df85ec0`](https://github.com/mpareja/gearshaft/commit/df85ec0)) message-store: get/read now accept position as named option
- ([`d2b909e`](https://github.com/mpareja/gearshaft/commit/d2b909e)) message-store: read: position is supplied as named option

## v0.7.1: use @eventide/message-db package for database

### Highlights

- **BREAKING**: Gearshaft now depends on [@eventide/message-db](https://www.npmjs.com/package/@eventide/message-db) for the Postgres message store. Existing databases must be migrated.
- Message stores now export `getCategory` and `getStream` functions for working explicitly with category streams and entity streams.
- CONTRIBUTORS: Ruby is no longer required for working on Gearshaft!

### Commits

- ([`161f624`](https://github.com/mpareja/gearshaft/commit/161f624)) package: bump version to 0.7.0
- ([`f743a1a`](https://github.com/mpareja/gearshaft/commit/f743a1a)) tools: github workflow no longer needs ruby
- ([`fa6f86e`](https://github.com/mpareja/gearshaft/commit/fa6f86e)) consumer: use getCategory explicitly
- ([`0461df0`](https://github.com/mpareja/gearshaft/commit/0461df0)) message-store: memory: export getCategory and getStream
- ([`1948f2e`](https://github.com/mpareja/gearshaft/commit/1948f2e)) message-store: exports getCategory & getStream, separate tests
- ([`aaedd43`](https://github.com/mpareja/gearshaft/commit/aaedd43)) message-store: add examplePutCategory
- ([`e4c1ae5`](https://github.com/mpareja/gearshaft/commit/e4c1ae5)) errors: add assertTruthy
- ([`e63d4ba`](https://github.com/mpareja/gearshaft/commit/e63d4ba)) messaging: use assertStrictEqual
- ([`16d2bb6`](https://github.com/mpareja/gearshaft/commit/16d2bb6)) errors: add assertStrictEqual
- ([`ada490a`](https://github.com/mpareja/gearshaft/commit/ada490a)) message-store: separate category and stream get implementations
- ([`30ef27f`](https://github.com/mpareja/gearshaft/commit/30ef27f)) package: leverage @eventide/message-db

## v0.7.0: --- skipped ---

The publish for 0.7.0 mysteriously disappeared. The publish completed successfully, and npm sent out publish completed email, but the new version never appeared in the registry.

EDIT: It turns out `npm` was having issues and release was delayed by a long time. v0.7.0 is equivalent to v0.7.1.

### Highlights

- Adds `EntityStoreSubstitute` which can be used by handler test suites wanting to exercise different states of an entity. Entities can be added to an instance of `EntityStoreSubstitute` via the `add` function.
- `assertNoWrites` has been added to `WriterSubstitute`. Test suites can now assert no writes have occurred to a specific stream or any streams all together.

### Commits

- ([`2fae100`](https://github.com/mpareja/gearshaft/commit/2fae100)) entity-store: don't nest entity under record metadata
- ([`1531ccd`](https://github.com/mpareja/gearshaft/commit/1531ccd)) package: upgrade dev dependencies
- ([`0326775`](https://github.com/mpareja/gearshaft/commit/0326775)) entity-store: introduce EntityStoreSubstitute
- ([`f267a59`](https://github.com/mpareja/gearshaft/commit/f267a59)) messaging: write substitute: add assertNoWrites assertion

## v0.6.0: improved experience for implementing handler test cases

### Highlights

- Adds `EntityStoreSubstitute` which can be used by handler test suites wanting to exercise different states of an entity. Entities can be added to an instance of `EntityStoreSubstitute` via the `add` function.
- `assertNoWrites` has been added to `WriterSubstitute`. Test suites can now assert no writes have occurred to a specific stream or any streams all together.

### Commits

- ([`2fae100`](https://github.com/mpareja/gearshaft/commit/2fae100)) entity-store: don't nest entity under record metadata
- ([`1531ccd`](https://github.com/mpareja/gearshaft/commit/1531ccd)) package: upgrade dev dependencies
- ([`0326775`](https://github.com/mpareja/gearshaft/commit/0326775)) entity-store: introduce EntityStoreSubstitute
- ([`f267a59`](https://github.com/mpareja/gearshaft/commit/f267a59)) messaging: write substitute: add assertNoWrites assertion

## v0.5.0: entity-store: add fetchRecord support

### Highlights

* EntityStore now supports obtaining the version of the entity being fetched via the `fetchRecord` function. Additional metadata will be made available once entity caching support is added.
  ```
  const [ entity, { version } ] = store.fetchRecord(id)
  ```

## v0.4.0: follow enhancements

### Highlights

- `follow` now supports providing an object with additional fields. Additional fields are `Object.assign`ed together with fields from the message being followed before the subsequent message is created.
- `follow` now looks for a static method named `create` on the constructor of the subsequent message. If a `create` method is found, `follow` will call it to build the subsequent message rather than using the class constructor and assigning fields. The `create` implementation is responsible for assigning fields to the returned message instance. This is an ideal place to introduce message schema validation.

### Commits

- ([`bc827d7`](https://github.com/mpareja/gearshaft/commit/bc827d7)) messaging: follow: support providing additional fields
- ([`1509ccf`](https://github.com/mpareja/gearshaft/commit/1509ccf)) package: upgrade dependencies
- ([`3e3e1c3`](https://github.com/mpareja/gearshaft/commit/3e3e1c3)) messaging: follow supports custom message creation

## v0.3.1: messaging: write substitute: accept message store

### Highlights

- `createWriterSubstitute` now supports specifying a message store. A message store instance can be used when exercising a handler that writes (via the substitute to benefit from assertions) and reads from the message store.

### Commits

- ([`0e5fd2e`](https://github.com/mpareja/gearshaft/commit/0e5fd2e)) messaging: write-substitute: accept message store
- ([`ec629b8`](https://github.com/mpareja/gearshaft/commit/ec629b8)) package: add way to browse dependency graph
- ([`ed7a682`](https://github.com/mpareja/gearshaft/commit/ed7a682)) package: consumer: normalize importing of examples

## v0.3.0: EntityProjection

### Highlights

- Adds `createEntityProjection` function
- EntityProjection allows projecting messages easily onto entity

### Commits

- ([`7369a9f`](https://github.com/mpareja/gearshaft/commit/7369a9f)) package: bump version to 0.3.0
- ([`7360bee`](https://github.com/mpareja/gearshaft/commit/7360bee)) entity-store: normalize createEntityStore exports
- ([`ac4ed78`](https://github.com/mpareja/gearshaft/commit/ac4ed78)) entity-store: accept projection instead of registerHandlers function
- ([`dc16dd5`](https://github.com/mpareja/gearshaft/commit/dc16dd5)) entity-projection: add createEntityProjection
- ([`bc9b0c1`](https://github.com/mpareja/gearshaft/commit/bc9b0c1)) entity-store: move examples to entity-projection
- ([`5423c67`](https://github.com/mpareja/gearshaft/commit/5423c67)) messaging: event-registry: decouple from MessageData
- ([`ee4e26a`](https://github.com/mpareja/gearshaft/commit/ee4e26a)) messaging: normalize event-registry export
- ([`1e1262c`](https://github.com/mpareja/gearshaft/commit/1e1262c)) consumer: log duration of handler

## v0.2.0: Consumer Host Support

### Highlights

- Adds host for running / stopping / pausing / un-pausing consumers based on OS process signals.
- Bug fix: don't copy message `id` when following a message.
- Simplify creation of command category names.

### Commits

- ([`9eede95`](https://github.com/mpareja/gearshaft/commit/9eede95)) package: update dependencies
- ([`05b225e`](https://github.com/mpareja/gearshaft/commit/05b225e)) messaging: follow: clear id when copying fields
- ([`913eefd`](https://github.com/mpareja/gearshaft/commit/913eefd)) message-store: category: support creating command category name
- ([`b279661`](https://github.com/mpareja/gearshaft/commit/b279661)) message-store: memory: mimic async behaviour
- ([`b5eb85a`](https://github.com/mpareja/gearshaft/commit/b5eb85a)) consumer: retry and log errors fetching initial position
- ([`3e873ac`](https://github.com/mpareja/gearshaft/commit/3e873ac)) logging: extract throttleErrorLogging from consumer
- ([`218e1f7`](https://github.com/mpareja/gearshaft/commit/218e1f7)) host: support stop, pause, unpause of host
- ([`e74d4c6`](https://github.com/mpareja/gearshaft/commit/e74d4c6)) host: refactor tests
- ([`81f6be8`](https://github.com/mpareja/gearshaft/commit/81f6be8)) host: initial implementation (missing logging)
- ([`91d149a`](https://github.com/mpareja/gearshaft/commit/91d149a)) runner: extract exampleRunner

## v0.1.1: default to null object logger

## v0.1.0: improve message-store creation experience

## v0.0.3-beta: adds Category

## 0.0.2-beta

## 0.0.1-beta: exclude test and tools from package

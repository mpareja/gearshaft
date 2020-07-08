## v0.15.0: entity-store enhancement (2020-07-08)

### Highlights

- **BREAKING** entity-store: fetchRecord now returns a version of `-1` instead of `undefined` when the entity stream in question has no messages. Returning `-1` (stream not initialized) is beneficial for handlers that support both initializing a new entity stream _and_ appending to an existing entity stream. Such handlers can simply forward `version` as the `expectedVersion` for subsequent writes and rest assured that concurrency controls will be enforced for both initial stream writes and existing stream writes.

### Commits

- ([`e46f3df`](https://github.com/mpareja/gearshaft/commit/e46f3dff01b589cf18eb976a729faef8647a023f)) entity-store: fetchRecord returns version -1 when stream is empty
- ([`964b6e9`](https://github.com/mpareja/gearshaft/commit/964b6e96c06f242afca1b2f599ff1f518fa525d3)) package: upgrade dependencies

## v0.14.0: upgrade pg dependency to v8 (2020-05-18)

### Highlights

- **BREAKING** upgrade `pg` package to v8. Review the [minimal breaking changes](https://github.com/brianc/node-postgres/blob/master/CHANGELOG.md#pg800) for details. Minor performance improvements have been observed.
- host: `pause`/`unpause`/`stop` now forward arguments to corresponding runner methods. Custom runners can use the contextual information during their `pause`/`unpause`/`stop` processing. Runners are not guaranteed to receive arguments since process kill signals do not provide contextual information.

### Commits

- ([`32a37c5`](https://github.com/mpareja/gearshaft/commit/32a37c5cf8d5d8d64f43d7dcf9eb27fdd91e88b0)) package: refresh benchmarks after upgrades
- ([`06b0362`](https://github.com/mpareja/gearshaft/commit/06b036298c64468b79251d3709a67f6a33bd956a)) README: use newer pg in example
- ([`1a2205c`](https://github.com/mpareja/gearshaft/commit/1a2205c8bff96c2cec2679b01a0a4a3c2c5ef3c3)) package: upgrade dependencies
- ([`76deffc`](https://github.com/mpareja/gearshaft/commit/76deffc3d643e7a68dcc6e33a3439b71824af569)) host: pause/unpause/stop support forwarding arguments to runners
- ([`81f538d`](https://github.com/mpareja/gearshaft/commit/81f538d56b8f2f699fdc0f32a8bf65630bae26b9)) README: add link to example project.
- ([`cf91a28`](https://github.com/mpareja/gearshaft/commit/cf91a28a6c74023d96916d84b7a7f5c09b5c8ec6)) consumer: update noop-consumer benchmarks
- ([`a9399a2`](https://github.com/mpareja/gearshaft/commit/a9399a2bd73033504d82fce8ee6c4e2366e307d1)) package: upgrade pg from 7 to version 8
- ([`f67ee27`](https://github.com/mpareja/gearshaft/commit/f67ee27ff4ef618c719da908f79820e7222aceae)) package: upgrade dev dependencies
- ([`7e0ff7a`](https://github.com/mpareja/gearshaft/commit/7e0ff7aa2f8a06fdec6950f57d49d1c7a8f8da2d)) package: add missing GitHub links
- ([`28afdff`](https://github.com/mpareja/gearshaft/commit/28afdff83ee36ecaa93c188a679d0a0ba93573a7)) message-store: add benchmarks for batched writes

## v0.13.4: memory message store performance (2020-04-12)

### Highlights

- memory message-store: category stream lookup is now `O(1)` instead of `O(countOfAllMessages * charactersInStreamName)` search. Given a store with 100,000 messages, reads / writes are about 1000x faster.
- message-store: extract generic benchmarks for use across MessageStore implementations

### Commits

- ([`f411133`](https://github.com/mpareja/gearshaft/commit/f4111334f2c20e87583936fe82c0a3c4f96f0c2a)) message-store: memory: significant performance improvements
- ([`e349c89`](https://github.com/mpareja/gearshaft/commit/e349c892e7961386f64955282e8856c4efe66246)) message-store: memory: add initial benchmarks
- ([`73ab408`](https://github.com/mpareja/gearshaft/commit/73ab408720dcd0f20093712a20a37452c7df4988)) message-store: benchmark: disconnect from database once done
- ([`d54af2f`](https://github.com/mpareja/gearshaft/commit/d54af2f92f7a02c162195436948f0542c7a554c8)) message-store: extract abstract get-stream benchmark
- ([`eeb0919`](https://github.com/mpareja/gearshaft/commit/eeb0919f5b1be97e06aab234b32bd3dcf89b6444)) message-store: extract abstract write-single-message benchmark

## v0.13.3: consumer identifier support (2020-04-09)

### Highlights

- consumer: `identifier` is required when running a consumer in a group. The identifier is used to isolate position storage amongst consumer group members.
- StreamName: support Number and BigInt stream identifiers

### Commits

- ([`94797ca`](https://github.com/mpareja/gearshaft/commit/94797ca88c48d0ac98c23907c56464997a541b0c)) package: upgrade non-pg dependencies
- ([`8862c55`](https://github.com/mpareja/gearshaft/commit/8862c556b74299dec7cd80bede17a20624301e3f)) consumer: add identifier required for consumer groups
- ([`9758fff`](https://github.com/mpareja/gearshaft/commit/9758fff7407ff468b75c2f344f9ff252a0773d37)) consumer: example-consumer: reduce verbosity by using Object.assign
- ([`04a248a`](https://github.com/mpareja/gearshaft/commit/04a248af0cc0cc019c8150c6c7cb01d4529bf88a)) consumer: position-stream-name: append consumer identifier with dash
- ([`96454bb`](https://github.com/mpareja/gearshaft/commit/96454bb886aa6eb5afdb4ae80fc7a10e66468a9c)) consumer: position-store: rename event to Recorded from PositionRecorded
- ([`e24a8e4`](https://github.com/mpareja/gearshaft/commit/e24a8e4027ee534d9f301420e162c82913a5e4c6)) message-store: StreamName: support Number and BigInt stream ids
- ([`b448feb`](https://github.com/mpareja/gearshaft/commit/b448feb9c58d79afe94a123a8b6d8fac6fea8fb4)) document-projection: include message type in log
- ([`d1d186e`](https://github.com/mpareja/gearshaft/commit/d1d186eaa1f6a9434727dad5e90337e2251429e9)) document-store: memory: give expert users access to documents

## v0.13.2: configurable batch sizes (2020-04-07)

### Commits

- ([`53273af`](https://github.com/mpareja/gearshaft/commit/53273af7cf29975527c1fbed3b16feba261b0bb4)) message-store: support specifying a batch size for get operations
- ([`ebedd04`](https://github.com/mpareja/gearshaft/commit/ebedd04f39f2f4abe05e9bcabdfbce5b5d644bce)) consumer: add option assertions

## v0.13.1: host events & compound stream ids (2020-04-01)

### Highlights

- host: emit paused/unpaused/stopped events. Applications can leverage the events to cleanly shut down after consumers have stopped.
- message-store: StreamName: add compound id and cardinal id support
  - support creating compound identifiers by supplying array of IDs
  - support creating compound identifiers by supplying id and `ids` array
  - support providing explicit `cardinalId`
- message-store: postgres: prevent leaking sensitive data when logging connection errors

### Commits

- ([`6e73cad`](https://github.com/mpareja/gearshaft/commit/6e73cad6495edbf3623b787af32c7d83cde1bc02)) package: upgrade uuid and dev dependencies
- ([`7538833`](https://github.com/mpareja/gearshaft/commit/7538833983d5a970102ae590c1f56e722761313e)) document-store: test: cleanup postgres gateway after tests
- ([`caab2b6`](https://github.com/mpareja/gearshaft/commit/caab2b67412f1c447475ff102661a8f6f4a32a34)) logging: throttle: use "warn" log level when recovering from errors
- ([`bf8b1e9`](https://github.com/mpareja/gearshaft/commit/bf8b1e988b77753b4661fc6f72771cc05785d444)) host: emit paused/unpaused/stopped events
- ([`fa9ff31`](https://github.com/mpareja/gearshaft/commit/fa9ff31e57c5d783edf0e056bf582a4c85f9f354)) message-store: StreamName: add compound id and cardinal id support
- ([`7437d85`](https://github.com/mpareja/gearshaft/commit/7437d85fe1d23e4ec0aaa70a3bb081dd526095a0)) message-store: postgres: prevent leaking sensitive data in logs
- ([`a9d4b26`](https://github.com/mpareja/gearshaft/commit/a9d4b26d573887cc8a586ef01d945013ec04512d)) CHANGELOG: correct typo

## v0.13.0: consumer: configurable error handling (2020-03-30)

### Highlights

- **BREAKING** consumer: handler exceptions crash the process by default
- consumer: supports configurable `errorStrategy` for dealing with handler errors. If the function does not throw, the message is considered processed. The `errorStrategy` function receives the following 3 parameters and can be used to retry handlers and/or log errors before throwing:
  - `error`: the error thrown by the handler
  - `messageData`: the message data the handler was consuming
  - `dispatch`: a function accepting `messageData` and triggering the associated message handler

### Commits

- ([`df8e8cb`](https://github.com/mpareja/gearshaft/commit/df8e8cbde8ea861b92df79ec605e2023d5ef0bcf)) message-store: postgres: handle errors for _managed_ postgres connections
- ([`58dcaf4`](https://github.com/mpareja/gearshaft/commit/58dcaf40aacf517ef024893c4b64af26d206497f)) logging: throttle: better handle intermittent errors
- ([`200b6d6`](https://github.com/mpareja/gearshaft/commit/200b6d603e2562c9eeff7b9176dd6e5aa6f73ba5)) consumer: throw uncaught exception on error instead of promise rejection
- ([`6e99f05`](https://github.com/mpareja/gearshaft/commit/6e99f05aed89cdeb763ae013bed6251b0dc98363)) consumer: crash-stop on error, support configurable errorStrategy
- ([`12481d3`](https://github.com/mpareja/gearshaft/commit/12481d3d59a50ceb879505d085048f5a43410b02)) runner: pause/stop wait for tasks triggered on same tick of the event loop
- ([`e694281`](https://github.com/mpareja/gearshaft/commit/e694281ea527ca19e540dacc4299cc5adf153a72)) runner: stop/pause no longer swallow unhandled rejections
- ([`08c4de3`](https://github.com/mpareja/gearshaft/commit/08c4de3aaa208bf074e9284fe23a0d2ac1acc2e7)) consumer: extract pauseErrorStrategy, preparing for pluggable strategies

## v0.12.3: minor operational enhancements (2020-03-10)

### Highlights

- host: support waiting for consumers to finish pausing / stopping
- document-projection: log entries now include the id of the document being updated
- message-store: category: allow retrieval of category name

### Commits

- ([`56ac7eb`](https://github.com/mpareja/gearshaft/commit/56ac7eb97f52b4d08ad1b3f70daae95e9556c293)) host: pause/stop support waiting for consumers to pause/stop
- ([`fc595d6`](https://github.com/mpareja/gearshaft/commit/fc595d6d6bdc62b4f95b8de5de9dcc3d3fde0a24)) document-projection: include projection id in log message
- ([`c7e7c3b`](https://github.com/mpareja/gearshaft/commit/c7e7c3b2b8a8d9091a09c48b140b4bed7b926787)) message-store: category: allow retrieval of category name
- ([`6a4dd59`](https://github.com/mpareja/gearshaft/commit/6a4dd592bc8518bbac90ab9feb33cbcaa914a797)) package: upgrade development dependencies
- ([`93a8d57`](https://github.com/mpareja/gearshaft/commit/93a8d5799350c32e35c4ec5334c7163e150c69cb)) package: upgrade uuid and include in operational dependencies

## v0.12.2: postgres library upgrade (2020-02-25)

### Highlights

- postgres-gateway: upgrade `pg` dependency to verion 7.18.2. Performance benchmarks were not significantly impacted.

### Commits

- ([`28b0640`](https://github.com/mpareja/gearshaft/commit/28b06409e8269b727aab99966ea2bb83b5f42e59)) benchmark: update references to test postgres gateway
- ([`c373f63`](https://github.com/mpareja/gearshaft/commit/c373f63bed484f6e624b58349f30068e26f0a4c2)) package: upgrade pg and dev dependencies

## v0.12.1: support dashes in stream ids (2020-01-23)

### Highlights

- message-store: `StreamName.getId` is now correctly handling ids with dashes

### Commits

- ([`e416c9f`](https://github.com/mpareja/gearshaft/commit/e416c9fb1432456d6a61479b412bdad31e44b758)) message-store: StreamName.getId: handle IDs with dashes

## v0.12.0: document-projection position field (2020-01-18)

### Highlights

- **BREAKING** document-projection: disambiguate between the stream position used by document-projection to determine whether or not to process a message and the version used by a document-store for optimistic concurrency control. Either customize the `versionField` property to your needs, or recreate View models so they include `globalPosition`.

### Commits

- ([`0f275bb`](https://github.com/mpareja/gearshaft/commit/0f275bb82abd62431d085dc9454304d9e7b6a240)) document-projection: rename version field to globalPosition

## v0.11.0: document projection support (2020-01-17)

### Highlights

- document-projection: creating view models has never been easier! Define how events are projected onto a document, specify a document-store to use, and simply create a consumer from the document-projection.
- postgres-message-store: single-message write [performance is up 30%](message-store/postgres/test/benchmark/results/write-single-message-2020-01-05T14-39-26.results.json) by no longer creating a database transaction
- postgres-document-store: postgres-backed storage and retrieval of documents including optimistic concurrency control
- memory-document-store: in-memory storage and retrieval of documents including optimistic concurrency control
- **BREAKING**: postgres-message-store: `db` option has been renamed to `postgresGateway` for anyone directly supplying a connection

### Commits

- ([`23bd6cf`](https://github.com/mpareja/gearshaft/commit/23bd6cfdd9bb1373101ac07054f86a8b05e12ce9)) document-store: postgres: support customizing column names
- ([`fd8b21a`](https://github.com/mpareja/gearshaft/commit/fd8b21aa6e858097e665c22fa803c52cee2bcb61)) document-store: support multiple updates on same doc instance
- ([`2587330`](https://github.com/mpareja/gearshaft/commit/2587330a41a06582768cb5b141cbeb04670aff0c)) package: update build to create the test schema
- ([`20d0559`](https://github.com/mpareja/gearshaft/commit/20d0559a01fc67c9937f5d7bf8be030249f5cb1a)) package: update dependencies (pg to 7.17.1)
- ([`a97cc5a`](https://github.com/mpareja/gearshaft/commit/a97cc5aba79da09e8da68e8360c116bbb0bbf386)) document-store: add postgres-document-store
- ([`452aacd`](https://github.com/mpareja/gearshaft/commit/452aacd6e03afd3d57702a643981065d12c91b41)) document-store: ensure documents are returned with entity type
- ([`25ddfdb`](https://github.com/mpareja/gearshaft/commit/25ddfdb34576c1cafe6a537c1ad946345a990919)) document-projection: add idempotence handling and logging
- ([`0e47c25`](https://github.com/mpareja/gearshaft/commit/0e47c25baf463fe3b549c47c3c90c0ccfbe2b84e)) document-projection: support projecting a category stream to documents
- ([`45e6e0c`](https://github.com/mpareja/gearshaft/commit/45e6e0c7e92be75775094db9cda1c1250dba6fb7)) package: remove "examples" directory containing exampleLog
- ([`32e0372`](https://github.com/mpareja/gearshaft/commit/32e0372b1b4cdcc8160079e0b8c6cf90a0554754)) errors: normalize how operationError is exported
- ([`8ff3b04`](https://github.com/mpareja/gearshaft/commit/8ff3b041fb429e818254428fe3c3db8657f8b311)) document-store: memory: add in-memory document store
- ([`0b25888`](https://github.com/mpareja/gearshaft/commit/0b25888cd09ac539895f9b21f0c3abf1dea7ae0f)) messaging: test: correct fromReadMessageData test name
- ([`f69663a`](https://github.com/mpareja/gearshaft/commit/f69663a30d50e2518e21f8222a3e702277a121a7)) retry: add retry module w/o needing to take on new dependency
- ([`300d5f9`](https://github.com/mpareja/gearshaft/commit/300d5f9b26f062f206509dee1a691c4bfeca7319)) message-store: rename all `db` references to `postgresGateway`
- ([`cb59747`](https://github.com/mpareja/gearshaft/commit/cb5974725c441bf76a93ee1183eda523e7e3943d)) postgres-gateway: extract from message-store
- ([`6581c30`](https://github.com/mpareja/gearshaft/commit/6581c308b4a6257a7c5e8ba026a14a69582d4127)) package: generate test table for PostgresGateway
- ([`b2f7d04`](https://github.com/mpareja/gearshaft/commit/b2f7d04ca40069886482f08b1d2a2f517548071f)) message-store: improve write perf by 30%
- ([`024249d`](https://github.com/mpareja/gearshaft/commit/024249d5f27b2537edff5d44ca82ebe5a9bfcd0a)) message-store: benchmark writing single message
- ([`e93997c`](https://github.com/mpareja/gearshaft/commit/e93997c8e26b753df9782e65f761e2f4332aa909)) CHANGELOG: remove duplicate section

## v0.10.1: inert write substitute (2020-01-02)

### Highlights

- messaging: write substitute is not bound to in-memory message store by default. Writes are no-ops that always succeed - stream expected version checking is not performed. Use the rich set of assertion methods provided by the substitute to validate a message was written with the corrrect expected version.

### Commits

- ([`601a7d1`](https://github.com/mpareja/gearshaft/commit/601a7d14abc3576f7fa699dc17d064406ba20e3c)) tools: use version sort when finding last version
- ([`1b9c8d4`](https://github.com/mpareja/gearshaft/commit/1b9c8d4dcf00a5b2fb094b40ac277403118a4215)) messaging: write substitute: default to inert message-store write

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

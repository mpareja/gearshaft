# Gearshaft

An Event Sourcing toolkit for Node.js based on the [Eventide project](https://eventide-project.org) for Ruby.

**Status: Pre-Release** (due to lack of documentation, see [Roadmap](https://github.com/mpareja/gearshaft/issues/3))

## Development

1. Run a Postgres instance for use by the automated tests
2. Provision a message store database for the automated tests
3. Configure the test suite to use the appropriate Postgres credentials
4. Run the tests

### Running Postgres

Use Docker to run Postgres or install Postgres from scratch. The automated tests expect the following defaults which can be overriden:

  - HOST: `localhost`
  - PORT: `5432` (Postgres default)
  - USER: `postgres`
  - PASS: `NInAN5t3kJo8d7I3`


You can run Postgres with docker as follows:

```
docker run --name pg -d -p 5432:5432 -e POSTGRES_PASSWORD=NInAN5t3kJo8d7I3 postgres:10.5
```

Terminate Postgres and delete all data as follow:

```
docker rm -fv pg
```

### Provisioning Message Store Database

1. Install the Postgres client (psql)

   Ubuntu: `sudo apt install postgresql-client`

2. (Re)create the message store database and user credentials

   If you are using the default (compromised) credentials, simply run: `npm run recreate`; otherwise, customize the following commands as necessary:

   1. Create the message_store database:

      ```
      PGHOST=localhost \
        PGUSER=postgres \
        PGPASSWORD=NInAN5t3kJo8d7I3 \
        ./gems/bin/evt-pg-recreate-db
      ```

   2. Assign the message_store user a password:

      ```
      PGHOST=localhost \
        PGUSER=postgres \
        PGPASSWORD=NInAN5t3kJo8d7I3 \
        psql -c "alter role message_store with password 'NInAN5t3kJo8d7I3';"
      ```

### Configuring Test Suite Postgres Credentials

The Test Suite configuration is managed using the [rc module](https://www.npmjs.com/package/rc). Create a `.gearshaft_testsrc` file in the project root directory with the following fields to customize the Postgres connection settings:

```
{
  "db": {
    "host": "some-host-name",
    "user": "some-pg-user",
    "password": "some-pg-pass",
    "database": "some-pg-database"
  }
}
```

## What's with the name?

The project is named after the concept of a physical gearshaft: a machine engineered to precisely actuate components.

## Acknowledgements

Gearshaft builds on the hard-fought design learnings of the Eventide's Ruby implemention. The module boundaries and many test-cases have Eventide equivalents making the [Eventide Documentation](https://docs.eventide-project.org) a great resource for getting started. Gearshaft relies on the [Message DB](https://github.com/message-db/message-db) for Postgres schema and functions.

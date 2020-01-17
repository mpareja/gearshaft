CREATE TABLE IF NOT EXISTS message_store.automated_tests (
  id UUID NOT NULL,
  time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

ALTER TABLE message_store.automated_tests ADD PRIMARY KEY (id) NOT DEFERRABLE INITIALLY IMMEDIATE;

GRANT SELECT, INSERT, UPDATE, DELETE ON message_store.automated_tests TO message_store;

CREATE TABLE IF NOT EXISTS message_store.document_projection (
  id varchar(255) NOT NULL,
  data jsonb,
  version bigint not null,
  time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

ALTER TABLE message_store.document_projection ADD PRIMARY KEY (id) NOT DEFERRABLE INITIALLY IMMEDIATE;

GRANT SELECT, INSERT, UPDATE, DELETE ON message_store.document_projection TO message_store;

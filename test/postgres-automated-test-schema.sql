CREATE TABLE IF NOT EXISTS message_store.automated_tests (
  id UUID NOT NULL,
  time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

ALTER TABLE message_store.automated_tests ADD PRIMARY KEY (id) NOT DEFERRABLE INITIALLY IMMEDIATE;

GRANT SELECT, INSERT, UPDATE, DELETE ON message_store.automated_tests TO message_store;

-- document_projection

CREATE TABLE IF NOT EXISTS message_store.document_projection (
  id varchar(255) NOT NULL,
  data jsonb,
  version bigint not null,
  time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

ALTER TABLE message_store.document_projection ADD PRIMARY KEY (id) NOT DEFERRABLE INITIALLY IMMEDIATE;

GRANT SELECT, INSERT, UPDATE, DELETE ON message_store.document_projection TO message_store;

-- document_custom_columns

CREATE TABLE IF NOT EXISTS message_store.document_custom_columns (
  custom_id varchar(255) NOT NULL,
  custom_data jsonb,
  custom_version bigint not null,
  time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
);

ALTER TABLE message_store.document_custom_columns ADD PRIMARY KEY (custom_id) NOT DEFERRABLE INITIALLY IMMEDIATE;

GRANT SELECT, INSERT, UPDATE, DELETE ON message_store.document_custom_columns TO message_store;

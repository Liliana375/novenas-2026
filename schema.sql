CREATE TABLE IF NOT EXISTS novena_reservations (
  day_number smallint PRIMARY KEY CHECK (day_number BETWEEN 16 AND 24),
  host_name varchar(160) NOT NULL,
  arrival_time varchar(5) NOT NULL,
  address varchar(250) NOT NULL,
  notes varchar(500) NOT NULL DEFAULT '',
  pin_salt varchar(64) NOT NULL,
  pin_hash varchar(128) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS countries (
  id           VARCHAR(10) PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  default_lat  DECIMAL(9,6),
  default_lng  DECIMAL(9,6),
  default_zoom INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS eras (
  id          VARCHAR(50) PRIMARY KEY,
  country_id  VARCHAR(10) REFERENCES countries(id),
  label       VARCHAR(100) NOT NULL,
  year_from   INT,
  year_to     INT
);

CREATE TABLE IF NOT EXISTS persons (
  id          VARCHAR(20) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  born        INT,
  died        INT,
  initials    VARCHAR(10),
  description TEXT,
  wikipedia   VARCHAR(500),
  country_id  VARCHAR(10) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS conflicts (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  start_year  INT,
  end_year    INT,
  description TEXT,
  type        VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS conflict_parties (
  conflict_id  VARCHAR(50) REFERENCES conflicts(id),
  country_id   VARCHAR(10) REFERENCES countries(id),
  role         VARCHAR(50),
  PRIMARY KEY (conflict_id, country_id)
);

CREATE TABLE IF NOT EXISTS events (
  id                  VARCHAR(20) PRIMARY KEY,
  country_id          VARCHAR(10) REFERENCES countries(id),
  conflict_id         VARCHAR(50) REFERENCES conflicts(id),
  type                VARCHAR(20) NOT NULL,
  era_id              VARCHAR(50) REFERENCES eras(id),
  name                VARCHAR(200) NOT NULL,
  date                VARCHAR(100),
  year                INT NOT NULL,
  lat                 DECIMAL(9,6) NOT NULL,
  lng                 DECIMAL(9,6) NOT NULL,
  modern_location     VARCHAR(200),
  historical_context  VARCHAR(200),
  description         TEXT,
  notes               TEXT,
  wikipedia           VARCHAR(500),
  route_description   TEXT
);

CREATE TABLE IF NOT EXISTS event_persons (
  event_id   VARCHAR(20) REFERENCES events(id),
  person_id  VARCHAR(20) REFERENCES persons(id),
  role       VARCHAR(200),
  PRIMARY KEY (event_id, person_id)
);

CREATE TABLE IF NOT EXISTS event_waypoints (
  id          SERIAL PRIMARY KEY,
  event_id    VARCHAR(20) REFERENCES events(id),
  sort_order  INT NOT NULL,
  lat         DECIMAL(9,6) NOT NULL,
  lng         DECIMAL(9,6) NOT NULL,
  label       VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS regions (
  id                       VARCHAR(50) PRIMARY KEY,
  name                     VARCHAR(200),
  approx_modern_country_id VARCHAR(10) REFERENCES countries(id),
  active_from              INT,
  active_to                INT
);

-- =============================================================
-- speciesmap.org — database schema
-- PostgreSQL 14+ with PostGIS
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()

-- =============================================================
-- 1. data_sources
--    Lookup table for GBIF, Movebank, eBird, IUCN etc.
-- =============================================================
CREATE TABLE data_sources (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,       -- e.g. 'GBIF', 'Movebank'
    api_url         TEXT,
    last_synced_at  TIMESTAMPTZ
);

INSERT INTO data_sources (name, api_url) VALUES
    ('GBIF',     'https://api.gbif.org/v1'),
    ('Movebank', 'https://www.movebank.org/movebank/service/direct-read'),
    ('eBird',    'https://api.ebird.org/v2'),
    ('IUCN',     'https://apiv3.iucnredlist.org/api/v3');

-- =============================================================
-- 2. species
--    Master taxonomy table — everything joins back here
-- =============================================================
CREATE TABLE species (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scientific_name  VARCHAR(255) NOT NULL UNIQUE,
    common_name      VARCHAR(255),
    class            VARCHAR(100),    -- Mammalia, Aves, Reptilia, Amphibia
    order_name       VARCHAR(100),
    family           VARCHAR(100),
    genus            VARCHAR(100),
    iucn_status      VARCHAR(10),     -- CR, EN, VU, NT, LC, DD, EX
    description      TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_species_class        ON species (class);
CREATE INDEX idx_species_iucn_status  ON species (iucn_status);
CREATE INDEX idx_species_scientific   ON species (scientific_name);

-- =============================================================
-- 3. regions
--    Continent + sub-region boundaries (MultiPolygon)
--    Used at ETL time to pre-compute sightings.continent
--    Also used for map bounds per subdomain
-- =============================================================
CREATE TABLE regions (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,   -- 'North America', 'Europe' etc.
    slug       VARCHAR(50)  NOT NULL UNIQUE,   -- 'northamerica', 'europe' etc.
    continent  VARCHAR(100) NOT NULL,           -- same as name for top-level
    boundary   GEOMETRY(MultiPolygon, 4326) NOT NULL
);

CREATE INDEX idx_regions_boundary  ON regions USING GIST (boundary);
CREATE INDEX idx_regions_slug      ON regions (slug);

-- =============================================================
-- 4. sightings
--    Core observations table — one row per sighting event
-- =============================================================
CREATE TABLE sightings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id       UUID        NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    source_id        INT         NOT NULL REFERENCES data_sources(id),
    location         GEOMETRY(Point, 4326) NOT NULL,
    observed_at      TIMESTAMPTZ,
    continent        VARCHAR(100),              -- pre-computed via ST_Within at ETL time
    country          VARCHAR(100),
    region_name      VARCHAR(100),
    individual_count INT         DEFAULT 1,
    external_id      VARCHAR(255) UNIQUE,       -- source's own key — prevents duplicate imports
    raw_data         JSONB,                     -- store original payload for debugging
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sightings_location    ON sightings USING GIST (location);
CREATE INDEX idx_sightings_species     ON sightings (species_id);
CREATE INDEX idx_sightings_continent   ON sightings (continent);
CREATE INDEX idx_sightings_observed_at ON sightings (observed_at DESC);
CREATE INDEX idx_sightings_source      ON sightings (source_id);
CREATE INDEX idx_sightings_external_id ON sightings (external_id);

-- =============================================================
-- 5. sightings_rejected
--    Bad records from ETL validation — never silently dropped
-- =============================================================
CREATE TABLE sightings_rejected (
    id             SERIAL PRIMARY KEY,
    source_id      INT REFERENCES data_sources(id),
    external_id    VARCHAR(255),
    reason         VARCHAR(255) NOT NULL,   -- 'invalid_coords', 'inland_water', 'future_date' etc.
    raw_data       JSONB,
    rejected_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rejected_source    ON sightings_rejected (source_id);
CREATE INDEX idx_rejected_reason    ON sightings_rejected (reason);

-- =============================================================
-- 6. conservation_status_history
--    IUCN status changes over time per species
-- =============================================================
CREATE TABLE conservation_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id  UUID        NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    status      VARCHAR(10) NOT NULL,   -- CR, EN, VU, NT, LC, DD, EX
    year        SMALLINT    NOT NULL,
    source      VARCHAR(100) DEFAULT 'IUCN',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (species_id, year)
);

CREATE INDEX idx_status_history_species ON conservation_status_history (species_id);
CREATE INDEX idx_status_history_year    ON conservation_status_history (year);

-- =============================================================
-- 7. migration_routes
--    LineString paths per species/season — animated on map
-- =============================================================
CREATE TABLE migration_routes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id  UUID        NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    source_id   INT         NOT NULL REFERENCES data_sources(id),
    name        VARCHAR(255),
    season      VARCHAR(50),   -- 'spring', 'autumn', 'year-round'
    continent   VARCHAR(100),
    route       GEOMETRY(LineString, 4326) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routes_species   ON migration_routes (species_id);
CREATE INDEX idx_routes_continent ON migration_routes (continent);
CREATE INDEX idx_routes_geometry  ON migration_routes USING GIST (route);

-- =============================================================
-- 8. gps_tracks
--    Timestamped telemetry from Movebank tagged individuals
-- =============================================================
CREATE TABLE gps_tracks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id     UUID        NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    source_id      INT         NOT NULL REFERENCES data_sources(id),
    individual_id  VARCHAR(255) NOT NULL,   -- Movebank animal tag ID
    recorded_at    TIMESTAMPTZ NOT NULL,
    location       GEOMETRY(Point, 4326) NOT NULL,
    continent      VARCHAR(100),
    external_id    VARCHAR(255) UNIQUE,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracks_species      ON gps_tracks (species_id);
CREATE INDEX idx_tracks_individual   ON gps_tracks (individual_id);
CREATE INDEX idx_tracks_recorded_at  ON gps_tracks (recorded_at DESC);
CREATE INDEX idx_tracks_location     ON gps_tracks USING GIST (location);
CREATE INDEX idx_tracks_continent    ON gps_tracks (continent);

-- =============================================================
-- 9. etl_runs
--    Log table for every ETL pipeline execution
-- =============================================================
CREATE TABLE etl_runs (
    id              SERIAL PRIMARY KEY,
    source_id       INT REFERENCES data_sources(id),
    started_at      TIMESTAMPTZ DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    rows_fetched    INT DEFAULT 0,
    rows_inserted   INT DEFAULT 0,
    rows_skipped    INT DEFAULT 0,
    rows_rejected   INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'running',   -- 'running', 'success', 'failed'
    error_message   TEXT
);

CREATE INDEX idx_etl_runs_source  ON etl_runs (source_id);
CREATE INDEX idx_etl_runs_status  ON etl_runs (status);

-- =============================================================
-- Helper function: auto-update updated_at on species
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_species_updated_at
    BEFORE UPDATE ON species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- Sanity check queries (run after loading regions data)
-- =============================================================
-- Test: resolve a known North American coordinate
-- SELECT r.name FROM regions r
-- WHERE ST_Within(
--     ST_SetSRID(ST_MakePoint(-113.0, 48.5), 4326),  -- Montana, USA
--     r.boundary
-- );
-- Expected result: 'North America'

-- Test: count tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

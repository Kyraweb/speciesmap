# speciesmap.org

A living atlas of land wildlife — mapping sightings, migration routes, and conservation status across every continent.

Built with FastAPI, PostGIS, Vue.js, and MapLibre. Deployed via Coolify.

## What it does

- Aggregates wildlife sighting data from GBIF, Movebank, eBird, and the IUCN Red List
- Maps species by class (mammals, birds, reptiles, amphibians) across continent subdomains
- Animates migration routes and shows species range polygons
- Displays IUCN conservation status with full historical tracking
- Mobile-first design with a field guide aesthetic

## Subdomains

| Subdomain | Status |
|---|---|
| northamerica.speciesmap.org | In development |
| southamerica.speciesmap.org | Planned |
| europe.speciesmap.org | Planned |
| africa.speciesmap.org | Planned |
| asia.speciesmap.org | Planned |
| australia.speciesmap.org | Planned |

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Database | PostgreSQL + PostGIS |
| Frontend | Vue.js + MapLibre GL JS |
| Map tiles | MapTiler |
| ETL scheduler | APScheduler |
| Deployment | Coolify + Docker |
| DNS + CDN | Cloudflare |

## Project structure

```
speciesmap/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # DB connection
│   │   ├── routers/         # API route handlers
│   │   └── models/          # SQLAlchemy models
│   └── etl/
│       ├── run.py           # ETL entrypoint
│       ├── fetch_gbif.py    # GBIF bulk + incremental fetch
│       ├── normalise.py     # Field mapping + dedup
│       ├── enrich_iucn.py   # IUCN status enrichment
│       ├── validate.py      # Coordinate + date validation
│       ├── commit.py        # Batch upsert to DB
│       └── log.py           # ETL run logging
├── frontend/
│   └── src/
│       ├── composables/     # useContinent, useSpecies etc.
│       ├── components/      # Sidebar, DetailPanel, Map etc.
│       └── views/           # Landing, MapView
├── database/
│   └── schema.sql           # Full DB schema with PostGIS
└── README.md
```

## Data sources

- **GBIF** — Global Biodiversity Information Facility (primary source)
- **Movebank** — GPS collar and tag telemetry
- **eBird** — Cornell Lab bird sighting records
- **IUCN Red List** — Conservation status and history

## Sibling project

This platform is a companion to [whaledata.org](https://whaledata.org) — a marine wildlife tracking platform built on the same stack.

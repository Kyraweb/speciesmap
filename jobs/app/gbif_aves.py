"""
speciesmap.org — GBIF sync worker — Aves
Runs as a Coolify scheduled task — Sunday 4am UTC
Fetches Aves sightings from GBIF for North America.
"""

import os
import sys
import requests
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL  = os.getenv("DATABASE_URL")
GBIF_API      = "https://api.gbif.org/v1/occurrence/search"
SOURCE_ID     = 1
CONTINENT     = "NORTH_AMERICA"
BATCH_SIZE    = 300
CLASS_NAME    = "Aves"


def get_connection():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


def get_last_sync(conn):
    cur = conn.cursor()
    cur.execute(
        "SELECT last_synced_at FROM data_sources WHERE id = %s",
        [SOURCE_ID]
    )
    row = cur.fetchone()
    cur.close()
    if row and row["last_synced_at"]:
        return row["last_synced_at"].strftime("%Y-%m-%d")
    return (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")


def fetch_page(last_sync, offset):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    params = {
        "continent":          CONTINENT,
        "basisOfRecord":      "HUMAN_OBSERVATION",
        "hasCoordinate":      "true",
        "hasGeospatialIssue": "false",
        "kingdom":            "Animalia",
        "class":              CLASS_NAME,
        "lastInterpreted":    f"{last_sync},{today}",
        "limit":              BATCH_SIZE,
        "offset":             offset,
    }
    for attempt in range(3):
        try:
            resp = requests.get(GBIF_API, params=params, timeout=120)
            if resp.status_code == 400:
                print(f"      GBIF pagination limit reached at offset {offset} — end of records")
                return {"results": [], "endOfRecords": True}
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            if attempt == 2:
                raise
            print(f"      Retry {attempt + 1}/3 after error: {e}")
            import time
            time.sleep(10)


def upsert_species(conn, record):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO species (scientific_name, common_name, class, order_name, family, genus)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (scientific_name) DO NOTHING
        RETURNING id
    """, [
        record.get("species", record.get("scientificName", "Unknown")),
        record.get("vernacularName"),
        record.get("class"),
        record.get("order"),
        record.get("family"),
        record.get("genus"),
    ])
    row = cur.fetchone()
    if not row:
        cur.execute(
            "SELECT id FROM species WHERE scientific_name = %s",
            [record.get("species", record.get("scientificName", "Unknown"))]
        )
        row = cur.fetchone()
    cur.close()
    return row["id"] if row else None


def validate_record(record):
    lat = record.get("decimalLatitude")
    lng = record.get("decimalLongitude")
    if lat is None or lng is None:
        return False, "missing_coords"
    if lat == 0.0 and lng == 0.0:
        return False, "invalid_coords_zero"
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return False, "invalid_coords_bounds"
    event_date = record.get("eventDate", "")
    if event_date:
        try:
            parsed = datetime.fromisoformat(event_date[:10])
            if parsed > datetime.utcnow():
                return False, "future_date"
            if parsed.year < 1900:
                return False, "date_too_old"
        except ValueError:
            pass
    return True, None


def insert_sighting(conn, record, species_id):
    cur = conn.cursor()
    external_id = str(record.get("key", ""))
    cur.execute("""
        INSERT INTO sightings (
            species_id, source_id, location, observed_at,
            continent, country, individual_count, external_id
        )
        SELECT %s, %s,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326),
            %s, %s, %s, %s, %s
        WHERE NOT EXISTS (
            SELECT 1 FROM sightings WHERE external_id = %s
        )
    """, [
        species_id, SOURCE_ID,
        record.get("decimalLongitude"),
        record.get("decimalLatitude"),
        record.get("eventDate"),
        "North America",
        record.get("country"),
        record.get("individualCount", 1),
        external_id, external_id,
    ])
    inserted = cur.rowcount
    cur.close()
    return inserted


def reject_record(conn, record, reason):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO sightings_rejected (source_id, external_id, reason, raw_data)
        VALUES (%s, %s, %s, %s)
    """, [
        SOURCE_ID,
        str(record.get("key", "")),
        reason,
        psycopg2.extras.Json(record),
    ])
    cur.close()


def log_run(conn, run_id, fetched, inserted, skipped, rejected, status, error=None):
    cur = conn.cursor()
    cur.execute("""
        UPDATE etl_runs SET
            finished_at   = now(),
            rows_fetched  = %s,
            rows_inserted = %s,
            rows_skipped  = %s,
            rows_rejected = %s,
            status        = %s,
            error_message = %s
        WHERE id = %s
    """, [fetched, inserted, skipped, rejected, status, error, run_id])
    conn.commit()
    cur.close()


def update_last_synced(conn):
    cur = conn.cursor()
    cur.execute(
        "UPDATE data_sources SET last_synced_at = now() WHERE id = %s",
        [SOURCE_ID]
    )
    conn.commit()
    cur.close()


def main():
    print("=" * 50)
    print(f"  speciesmap.org — GBIF sync: Aves")
    print(f"  Started: {datetime.utcnow().isoformat()}")
    print("=" * 50)

    conn = get_connection()

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO etl_runs (source_id, status) VALUES (%s, 'running') RETURNING id",
        [SOURCE_ID]
    )
    run_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()

    last_sync = get_last_sync(conn)
    print(f"\n  Last sync: {last_sync}")
    print(f"  Class: Aves")

    total_fetched  = 0
    total_inserted = 0
    total_skipped  = 0
    total_rejected = 0
    offset = 0

    try:
        while True:
            print(f"\n  Fetching Aves offset {offset}...")
            data = fetch_page(last_sync, offset)
            records = data.get("results", [])

            if not records:
                print("  No more records.")
                break

            print(f"  Got {len(records)} records from GBIF")

            for record in records:
                # Skip silently if class doesn't match
                if record.get("class") != CLASS_NAME:
                    continue

                total_fetched += 1

                valid, reason = validate_record(record)
                if not valid:
                    reject_record(conn, record, reason)
                    total_rejected += 1
                    continue

                species_id = upsert_species(conn, record)
                if not species_id:
                    reject_record(conn, record, "species_insert_failed")
                    total_rejected += 1
                    continue

                inserted = insert_sighting(conn, record, species_id)
                if inserted:
                    total_inserted += 1
                else:
                    total_skipped += 1

            conn.commit()

            if data.get("endOfRecords", True):
                break

            offset += BATCH_SIZE

        update_last_synced(conn)
        log_run(conn, run_id, total_fetched, total_inserted, total_skipped, total_rejected, "success")
        status = "success"

    except Exception as e:
        print(f"\n  ERROR: {e}")
        log_run(conn, run_id, total_fetched, total_inserted, total_skipped, total_rejected, "failed", str(e))
        status = "failed"

    finally:
        conn.close()

    print(f"\n  {'='*48}")
    print(f"  Class:    Aves")
    print(f"  Status:   {status}")
    print(f"  Fetched:  {total_fetched}")
    print(f"  Inserted: {total_inserted}")
    print(f"  Skipped:  {total_skipped} (duplicates)")
    print(f"  Rejected: {total_rejected} (invalid)")
    print(f"  Finished: {datetime.utcnow().isoformat()}")
    print(f"  {'='*48}")


if __name__ == "__main__":
    main()

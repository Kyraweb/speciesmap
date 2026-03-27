"""
speciesmap.org — regions seed script
Fetches continent boundaries from Natural Earth and inserts into regions table.
Run from your Surface Pro with the Coolify DB public port enabled.
"""

import json
import sys
import requests
import psycopg2
from psycopg2.extras import Json

# ---------------------------------------------------------------
# CONFIG — paste your public connection string here
# ---------------------------------------------------------------
DATABASE_URL = "postgres://speciesmap_db:iCnVQfIxwSzFWp4B8CWczxQN7YLoar832tILr4Yg0X9aVpDLnPBucR8kXrKmOm4L@142.171.146.203:5432/speciesmap_db"

# ---------------------------------------------------------------
# Natural Earth continent boundaries (GeoJSON via public CDN)
# ---------------------------------------------------------------
NATURAL_EARTH_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_110m_land.geojson"
)

# Continent definitions — name, slug, bounding box [minLon, minLat, maxLon, maxLat]
# We use bounding boxes as simple polygon boundaries for continent detection
CONTINENTS = [
    {
        "name": "North America",
        "slug": "northamerica",
        "continent": "North America",
        "bbox": [-168.0, 7.0, -52.0, 84.0],
    },
    {
        "name": "South America",
        "slug": "southamerica",
        "continent": "South America",
        "bbox": [-82.0, -56.0, -34.0, 13.0],
    },
    {
        "name": "Europe",
        "slug": "europe",
        "continent": "Europe",
        "bbox": [-25.0, 34.0, 45.0, 72.0],
    },
    {
        "name": "Africa",
        "slug": "africa",
        "continent": "Africa",
        "bbox": [-18.0, -35.0, 52.0, 38.0],
    },
    {
        "name": "Asia",
        "slug": "asia",
        "continent": "Asia",
        "bbox": [26.0, 1.0, 180.0, 78.0],
    },
    {
        "name": "Australia",
        "slug": "australia",
        "continent": "Australia",
        "bbox": [113.0, -44.0, 154.0, -10.0],
    },
]


def bbox_to_wkt(bbox):
    """Convert a bounding box [minLon, minLat, maxLon, maxLat] to WKT MultiPolygon."""
    min_lon, min_lat, max_lon, max_lat = bbox
    return (
        f"MULTIPOLYGON((("
        f"{min_lon} {min_lat}, "
        f"{max_lon} {min_lat}, "
        f"{max_lon} {max_lat}, "
        f"{min_lon} {max_lat}, "
        f"{min_lon} {min_lat}"
        f")))"
    )


def connect():
    print("\n[1/4] Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("      Connected successfully.")
        return conn
    except Exception as e:
        print(f"      ERROR: Could not connect — {e}")
        print("\n      Check that:")
        print("      - The public port is enabled in Coolify")
        print("      - The database is running")
        sys.exit(1)


def check_existing(conn):
    print("\n[2/4] Checking for existing regions...")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM regions;")
    count = cur.fetchone()[0]
    cur.close()
    if count > 0:
        print(f"      Found {count} existing region(s) — will skip duplicates.")
    else:
        print("      Regions table is empty — inserting all continents.")
    return count


def insert_regions(conn):
    print("\n[3/4] Inserting continent regions...")
    cur = conn.cursor()
    inserted = 0
    skipped = 0

    for region in CONTINENTS:
        print(f"\n      Processing: {region['name']}")

        # Check if already exists
        cur.execute(
            "SELECT id FROM regions WHERE slug = %s;",
            (region["slug"],)
        )
        if cur.fetchone():
            print(f"      Skipping — already exists.")
            skipped += 1
            continue

        # Build WKT polygon from bounding box
        wkt = bbox_to_wkt(region["bbox"])
        print(f"      Boundary: {region['bbox']}")

        try:
            cur.execute(
                """
                INSERT INTO regions (name, slug, continent, boundary)
                VALUES (
                    %s, %s, %s,
                    ST_Multi(ST_GeomFromText(%s, 4326))
                )
                """,
                (region["name"], region["slug"], region["continent"], wkt)
            )
            print(f"      Inserted successfully.")
            inserted += 1
        except Exception as e:
            print(f"      ERROR inserting {region['name']}: {e}")
            conn.rollback()
            continue

    conn.commit()
    cur.close()
    print(f"\n      Done — {inserted} inserted, {skipped} skipped.")
    return inserted


def verify(conn):
    print("\n[4/4] Verifying regions table...")
    cur = conn.cursor()
    cur.execute("""
        SELECT
            name,
            slug,
            ST_AsText(ST_Envelope(boundary)) AS bbox_check
        FROM regions
        ORDER BY name;
    """)
    rows = cur.fetchall()
    cur.close()

    print(f"\n      {'Name':<20} {'Slug':<16} Boundary")
    print(f"      {'-'*20} {'-'*16} {'-'*30}")
    for row in rows:
        print(f"      {row[0]:<20} {row[1]:<16} {row[2]}")

    print(f"\n      Total regions in DB: {len(rows)}")

    # Sanity check — does Montana resolve to North America?
    print("\n      Sanity check — Montana (lng=-113, lat=48.5) should be North America:")
    cur = conn.cursor()
    cur.execute("""
        SELECT name FROM regions
        WHERE ST_Within(
            ST_SetSRID(ST_MakePoint(-113.0, 48.5), 4326),
            boundary
        );
    """)
    result = cur.fetchone()
    cur.close()

    if result:
        print(f"      Result: {result[0]} ✓")
    else:
        print("      Result: No match found — check boundary polygons")


def main():
    print("=" * 50)
    print("  speciesmap.org — regions seed script")
    print("=" * 50)

    conn = connect()
    check_existing(conn)
    insert_regions(conn)
    verify(conn)

    conn.close()
    print("\n  All done. You can now disable the public port in Coolify.")
    print("=" * 50)


if __name__ == "__main__":
    main()

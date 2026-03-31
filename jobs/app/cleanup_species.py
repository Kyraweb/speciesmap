"""
speciesmap.org — Species cleanup worker
Removes any sightings and species that don't match our target classes.
Runs as a Coolify scheduled task — daily at 4am UTC, after GBIF sync.

Target classes: Mammalia, Aves, Reptilia, Amphibia
"""

import os
import psycopg2
import psycopg2.extras
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL   = os.getenv("DATABASE_URL")
TARGET_CLASSES = ('Mammalia', 'Reptilia', 'Amphibia', 'Squamata', 'Testudines', 'Crocodylia')


def get_connection():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


def main():
    print("=" * 50)
    print("  speciesmap.org — species cleanup")
    print(f"  Started: {datetime.utcnow().isoformat()}")
    print(f"  Target classes: {', '.join(TARGET_CLASSES)}")
    print("=" * 50)

    conn = get_connection()
    cur  = conn.cursor()

    # Check before
    print("\n[1/4] Checking current state...")
    cur.execute("""
        SELECT class, COUNT(*) as count
        FROM species
        GROUP BY class
        ORDER BY count DESC
    """)
    rows = cur.fetchall()
    for row in rows:
        flag = "✓" if row["class"] in TARGET_CLASSES else "✗ WILL DELETE"
        print(f"      {row['class'] or 'NULL':<20} {row['count']:>6}  {flag}")

    # Delete sightings for non-target classes
    print("\n[2/4] Deleting non-target sightings...")
    cur.execute("""
        DELETE FROM sightings
        WHERE species_id IN (
            SELECT id FROM species
            WHERE class NOT IN %s
            OR class IS NULL
        )
    """, (TARGET_CLASSES,))
    deleted_sightings = cur.rowcount
    print(f"      Deleted {deleted_sightings} sightings")

    # Delete orphaned sightings (species already deleted)
    print("\n[3/4] Deleting orphaned sightings...")
    cur.execute("""
        DELETE FROM sightings
        WHERE species_id NOT IN (SELECT id FROM species)
    """)
    deleted_orphans = cur.rowcount
    print(f"      Deleted {deleted_orphans} orphaned sightings")

    # Delete non-target species
    print("\n[4/4] Deleting non-target species...")
    cur.execute("""
        DELETE FROM species
        WHERE class NOT IN %s
        OR class IS NULL
    """, (TARGET_CLASSES,))
    deleted_species = cur.rowcount
    print(f"      Deleted {deleted_species} species")

    conn.commit()

    # Verify after
    print("\n  Final state:")
    cur.execute("""
        SELECT s.class, COUNT(*) as count
        FROM sightings si
        JOIN species s ON s.id = si.species_id
        GROUP BY s.class
        ORDER BY count DESC
    """)
    rows = cur.fetchall()
    for row in rows:
        print(f"      {row['class']:<20} {row['count']:>6} sightings")

    cur.close()
    conn.close()

    print(f"\n  Finished: {datetime.utcnow().isoformat()}")
    print("=" * 50)


if __name__ == "__main__":
    main()

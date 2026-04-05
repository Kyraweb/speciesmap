from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


@router.get("/sightings")
def get_sightings(
    continent:  str = Query("North America"),
    class_:     str = Query(None, alias="class"),
    species_id: str = Query(None),
    limit:      int = Query(5000),
):
    """
    Fast sightings using DISTINCT ON h3_index.
    Returns one representative sighting per hex cell.
    No ORDER BY RANDOM — uses index scan instead of full table scan.
    """
    conn = get_connection()
    cur  = conn.cursor()

    if species_id:
        # Specific species — one sighting per hex, capped at 5000
        cur.execute("""
            SELECT DISTINCT ON (si.h3_index)
                si.id,
                si.species_id,
                COALESCE(
                    NULLIF(TRIM(s.common_name), ''),
                    SPLIT_PART(s.scientific_name, ' ', 1) || ' ' ||
                    SPLIT_PART(s.scientific_name, ' ', 2)
                ) AS display_name,
                s.common_name,
                s.scientific_name,
                s.class,
                s.iucn_status,
                ST_X(si.location::geometry) AS lng,
                ST_Y(si.location::geometry) AS lat,
                si.observed_at,
                si.country,
                si.individual_count,
                si.h3_index
            FROM sightings si
            JOIN species s ON s.id = si.species_id
            WHERE si.continent = %s
            AND si.species_id = %s
            AND si.h3_index IS NOT NULL
            LIMIT %s
        """, [continent, species_id, limit])

    elif class_:
        cur.execute("""
            SELECT DISTINCT ON (si.h3_index)
                si.id,
                si.species_id,
                COALESCE(
                    NULLIF(TRIM(s.common_name), ''),
                    SPLIT_PART(s.scientific_name, ' ', 1) || ' ' ||
                    SPLIT_PART(s.scientific_name, ' ', 2)
                ) AS display_name,
                s.common_name,
                s.scientific_name,
                s.class,
                s.iucn_status,
                ST_X(si.location::geometry) AS lng,
                ST_Y(si.location::geometry) AS lat,
                si.observed_at,
                si.country,
                si.individual_count,
                si.h3_index
            FROM sightings si
            JOIN species s ON s.id = si.species_id
            WHERE si.continent = %s
            AND s.class = %s
            AND si.h3_index IS NOT NULL
            LIMIT %s
        """, [continent, class_, limit])

    else:
        # All classes — one per hex gives a clean continent overview
        cur.execute("""
            SELECT DISTINCT ON (si.h3_index)
                si.id,
                si.species_id,
                COALESCE(
                    NULLIF(TRIM(s.common_name), ''),
                    SPLIT_PART(s.scientific_name, ' ', 1) || ' ' ||
                    SPLIT_PART(s.scientific_name, ' ', 2)
                ) AS display_name,
                s.common_name,
                s.scientific_name,
                s.class,
                s.iucn_status,
                ST_X(si.location::geometry) AS lng,
                ST_Y(si.location::geometry) AS lat,
                si.observed_at,
                si.country,
                si.individual_count,
                si.h3_index
            FROM sightings si
            JOIN species s ON s.id = si.species_id
            WHERE si.continent = %s
            AND si.h3_index IS NOT NULL
            LIMIT %s
        """, [continent, limit])

    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/sightings/continent-summary")
def get_continent_summary():
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT continent, COUNT(*) as total
        FROM sightings
        WHERE continent IS NOT NULL
        GROUP BY continent
        ORDER BY total DESC
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results
